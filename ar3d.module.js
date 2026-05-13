// Stella — cinematic AR layer.
// Self-contained ESM module that runs its own R3F/Three.js tree.
// The babel-standalone shell talks to it via window.AR3D.mountARScene(...).
//
// API:
//   const handle = await window.AR3D.mountARScene(rootEl, {
//     videoEl,                 // playing <video> (camera feed)
//     mode: 'companion'|'halos',
//     variant: 'blob'|'bear'|'ghost',
//     onPoseStable?: (pose) => void,   // companion mode, fires once pose is stable
//     onHaloClick?: (id) => void,      // halos mode
//   });
//   handle.update({ variant, spotted, lane });
//   handle.unmount();

import { createElement, useRef, useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, ContactShadows, Html } from "@react-three/drei";
import { FilesetResolver, PoseLandmarker, FaceLandmarker } from "@mediapipe/tasks-vision";
import htm from "htm";

const html = htm.bind(createElement);

/* ---------------- Capability probes ---------------- */

function detectIOSMajor() {
  const m = navigator.userAgent.match(/OS (\d+)_/);
  return m ? parseInt(m[1], 10) : 0;
}
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}
function effectivePixels() {
  const dpr = window.devicePixelRatio || 1;
  return window.innerWidth * window.innerHeight * dpr;
}
function shouldUsePostFX() {
  // Drop post-fx on iOS < 17 (VideoTexture quirks) and on low-effective-pixel devices.
  if (isIOS() && detectIOSMajor() < 17) return false;
  if (effectivePixels() < 1.5e6) return false;
  return true;
}

/* ---------------- MediaPipe loaders (module singletons) ---------------- */

let _visionPromise = null;
function loadVision() {
  if (_visionPromise) return _visionPromise;
  _visionPromise = FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
  );
  return _visionPromise;
}

let _posePromise = null;
function loadPose() {
  if (_posePromise) return _posePromise;
  _posePromise = (async () => {
    try {
      const vision = await loadVision();
      return await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 4,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } catch (e) {
      console.warn("Pose landmarker init failed", e);
      return null;
    }
  })();
  return _posePromise;
}

let _facePromise = null;
function loadFace() {
  if (_facePromise) return _facePromise;
  _facePromise = (async () => {
    try {
      const vision = await loadVision();
      return await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 2,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
      });
    } catch (e) {
      console.warn("Face landmarker init failed", e);
      return null;
    }
  })();
  return _facePromise;
}

/* ---------------- Pose helpers ---------------- */

// Convert a MediaPipe pose (normalized landmarks 0..1) into a friendly summary.
function summarizePose(landmarks, vw, vh, aspect) {
  if (!landmarks || landmarks.length === 0) return null;
  // 0=nose, 11=L shoulder, 12=R shoulder, 23=L hip, 24=R hip
  const nose = landmarks[0];
  const lSh = landmarks[11], rSh = landmarks[12];
  const lHip = landmarks[23], rHip = landmarks[24];
  if (!nose || !lSh || !rSh) return null;
  const headX = nose.x;
  const headY = nose.y;
  const shY = (lSh.y + rSh.y) / 2;
  const hipY = lHip && rHip ? (lHip.y + rHip.y) / 2 : shY + 0.25;
  const shoulderW = Math.abs(lSh.x - rSh.x);
  const torsoH = Math.max(0.05, hipY - shY);
  // Map normalized 0..1 video coords → NDC-ish world units.
  // Camera is orthographic with frustum (-aspect..+aspect, -1..+1).
  const wx = (headX * 2 - 1) * aspect;
  const wy = 1 - headY * 2; // flip Y
  // size proxy: shoulder width in NDC units
  const wSize = shoulderW * 2 * aspect;
  return {
    head: { x: wx, y: wy },
    shoulders: { x: ((lSh.x + rSh.x) - 1) * aspect, y: 1 - shY * 2 },
    hips: { x: lHip && rHip ? ((lHip.x + rHip.x) - 1) * aspect : wx, y: 1 - hipY * 2 },
    width: wSize,
    torso: torsoH * 2,
  };
}

/* ---------------- Scene pieces ---------------- */

// Module-level texture cache — avoids reloading the same PNG on variant flips
// and bypasses drei's useTexture / Suspense path that esm.sh seems to drop.
const _texCache = {};
function loadStellaTexture(variant) {
  const url = `assets/stella-${variant || "blob"}.png`;
  if (_texCache[url]) return _texCache[url];
  const loader = new THREE.TextureLoader();
  const tex = loader.load(url);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  _texCache[url] = tex;
  return tex;
}

function StellaBillboard({ variant, anchorRef, lit }) {
  const groupRef = useRef();
  const texture = useMemo(() => loadStellaTexture(variant), [variant]);

  // Lerp toward the live anchor every frame.
  useFrame((_, delta) => {
    const g = groupRef.current;
    const a = anchorRef.current;
    if (!g || !a) return;
    const k = 1 - Math.exp(-delta * 8); // ~120ms time constant
    g.position.x += (a.x - g.position.x) * k;
    g.position.y += (a.y - g.position.y) * k;
    const targetScale = a.scale || 1;
    g.scale.x += (targetScale - g.scale.x) * k;
    g.scale.y += (targetScale - g.scale.y) * k;
    g.scale.z = g.scale.x;
    // Idle bob
    const t = performance.now() / 1000;
    g.position.y += Math.sin(t * 1.3) * 0.012;
  });

  return html`
    <group ref=${groupRef}>
      <${Billboard} follow=${true}>
        <mesh position=${[0, 0, -0.01]}>
          <planeGeometry args=${[1.1, 1.1]} />
          <meshBasicMaterial
            map=${texture}
            transparent=${true}
            opacity=${lit ? 0.3 : 0.18}
            blending=${THREE.AdditiveBlending}
            depthWrite=${false}
            toneMapped=${false}
          />
        </mesh>
        <mesh>
          <planeGeometry args=${[0.85, 0.85]} />
          <meshStandardMaterial
            map=${texture}
            transparent=${true}
            alphaTest=${0.04}
            roughness=${0.85}
            metalness=${0.0}
            emissive=${new THREE.Color("#ffd1d6")}
            emissiveIntensity=${lit ? 0.25 : 0.08}
            emissiveMap=${texture}
          />
        </mesh>
      </${Billboard}>
      <${ContactShadows}
        position=${[0, -0.5, 0]}
        opacity=${0.5}
        blur=${2.6}
        scale=${1.3}
        far=${0.7}
        resolution=${256}
        color=${"#0e2730"}
      />
    </group>
  `;
}

function RembrandtLights({ lit }) {
  return html`
    <ambientLight intensity=${0.35} color=${"#cfe9ee"} />
    <hemisphereLight intensity=${0.4} color=${"#ffe7ea"} groundColor=${"#0a1b22"} />
    <!-- Key light, warm, upper-left -->
    <spotLight
      position=${[-1.4, 1.6, 1.6]}
      intensity=${lit ? 1.8 : 1.2}
      angle=${0.7}
      penumbra=${0.7}
      distance=${6}
      decay=${1.5}
      color=${"#ffd9c2"}
      castShadow
    />
    <!-- Fill, cool, lower-right -->
    <spotLight
      position=${[1.0, -0.4, 1.2]}
      intensity=${0.5}
      angle=${0.9}
      penumbra=${0.95}
      distance=${5}
      decay=${1.6}
      color=${"#a0d8ff"}
    />
    <!-- Rim, behind -->
    <pointLight position=${[0.0, 0.4, -1.2]} intensity=${0.7} color=${"#96deeb"} distance=${4} />
  `;
}

function CompanionScene({ getState, onPoseStable }) {
  const { camera, size } = useThree();
  const anchorRef = useRef({ x: 0, y: 0, scale: 1 });
  const stableCountRef = useRef(0);
  const stableFiredRef = useRef(false);
  const [variant, setVariant] = useState(() => getState().variant || "blob");
  const [spotted, setSpotted] = useState(false);

  // Pull state updates from the shell.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const s = getState();
      if (s.variant !== variant) setVariant(s.variant);
      if (s.spotted !== spotted) setSpotted(s.spotted);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [variant, spotted]);

  // Pose detection loop, tied to the R3F render loop.
  const lastTsRef = useRef(0);
  const detectorRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    loadPose().then((det) => { if (!cancelled) detectorRef.current = det; });
    return () => { cancelled = true; };
  }, []);

  useFrame(() => {
    const det = detectorRef.current;
    const video = getState().videoEl;
    if (!det || !video || video.readyState < 2 || video.videoWidth === 0) return;
    const ts = performance.now();
    const useTs = ts > lastTsRef.current ? ts : lastTsRef.current + 1;
    lastTsRef.current = useTs;
    try {
      const res = det.detectForVideo(video, useTs);
      const aspect = size.width / size.height;
      const landmarks = res?.landmarks?.[0];
      if (landmarks && landmarks.length) {
        const p = summarizePose(landmarks, video.videoWidth, video.videoHeight, aspect);
        if (p) {
          anchorRef.current = {
            x: p.head.x,
            y: p.head.y + 0.05,
            scale: Math.max(0.55, Math.min(1.45, p.width * 1.6 + 0.7)),
          };
          stableCountRef.current = Math.min(60, stableCountRef.current + 1);
          if (stableCountRef.current >= 14 && !stableFiredRef.current && onPoseStable) {
            stableFiredRef.current = true;
            try { onPoseStable(p); } catch {}
          }
        }
      } else {
        // Smoothly drift back to center
        anchorRef.current = { x: 0, y: 0.05, scale: 1 };
        stableCountRef.current = Math.max(0, stableCountRef.current - 1);
        if (stableCountRef.current === 0) stableFiredRef.current = false;
      }
    } catch (e) {
      // swallow per-frame errors
    }
  });

  return html`
    <${RembrandtLights} lit=${spotted} />
    <${StellaBillboard} variant=${variant} anchorRef=${anchorRef} lit=${spotted} />
  `;
}

function HaloRing({ pose, label, onClick }) {
  const groupRef = useRef();
  const ringRef = useRef();
  const anchorRef = useRef({ x: pose.head.x, y: pose.head.y, w: pose.width });

  // Update target on prop change
  useEffect(() => {
    anchorRef.current = { x: pose.head.x, y: pose.head.y, w: pose.width };
  }, [pose.head.x, pose.head.y, pose.width]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const k = 1 - Math.exp(-delta * 9);
    g.position.x += (anchorRef.current.x - g.position.x) * k;
    g.position.y += (anchorRef.current.y - g.position.y) * k;
    const targetScale = Math.max(0.4, Math.min(1.6, anchorRef.current.w * 2.0 + 0.4));
    g.scale.x += (targetScale - g.scale.x) * k;
    g.scale.y = g.scale.x;
    g.scale.z = g.scale.x;
    if (ringRef.current) {
      const t = performance.now() / 1000;
      ringRef.current.material.opacity = 0.55 + Math.sin(t * 2.2) * 0.2;
    }
  });

  return html`
    <group ref=${groupRef} onClick=${(e) => { e.stopPropagation(); onClick && onClick(); }}>
      <!-- Outer halo -->
      <mesh ref=${ringRef}>
        <ringGeometry args=${[0.35, 0.45, 64]} />
        <meshBasicMaterial color=${"#96deeb"} transparent opacity=${0.75} side=${THREE.DoubleSide} toneMapped=${false} />
      </mesh>
      <!-- Inner glow -->
      <mesh position=${[0, 0, -0.02]}>
        <circleGeometry args=${[0.42, 48]} />
        <meshBasicMaterial color=${"#d0f8ff"} transparent opacity=${0.18} blending=${THREE.AdditiveBlending} depthWrite=${false} toneMapped=${false} />
      </mesh>
      <!-- Name label, screen-aligned -->
      <${Html} center distanceFactor=${1.5} position=${[0, -0.55, 0]} zIndexRange=${[10, 0]} pointerEvents="none">
        <div class="ar-name-tag">${label}</div>
      </${Html}>
    </group>
  `;
}

function HalosScene({ getState, onHaloClick }) {
  const { size } = useThree();
  const [poses, setPoses] = useState([]);
  const lastTsRef = useRef(0);
  const detectorRef = useRef(null);
  const NAMES = ["Sam", "Priya", "Jay", "Stella"];

  useEffect(() => {
    let cancelled = false;
    loadPose().then((det) => { if (!cancelled) detectorRef.current = det; });
    return () => { cancelled = true; };
  }, []);

  useFrame(() => {
    const det = detectorRef.current;
    const video = getState().videoEl;
    if (!det || !video || video.readyState < 2 || video.videoWidth === 0) return;
    const ts = performance.now();
    const useTs = ts > lastTsRef.current ? ts : lastTsRef.current + 1;
    lastTsRef.current = useTs;
    try {
      const res = det.detectForVideo(video, useTs);
      const aspect = size.width / size.height;
      const all = (res?.landmarks || []).map((lm, i) =>
        summarizePose(lm, video.videoWidth, video.videoHeight, aspect)
      ).filter(Boolean).slice(0, 4);
      // Only set if it changed meaningfully (cheap stable hash)
      setPoses((prev) => {
        if (prev.length !== all.length) return all;
        for (let i = 0; i < all.length; i++) {
          const a = all[i], p = prev[i];
          if (Math.abs(a.head.x - p.head.x) > 0.01 || Math.abs(a.head.y - p.head.y) > 0.01) return all;
        }
        return prev;
      });
    } catch {}
  });

  return html`
    <ambientLight intensity=${0.6} />
    ${poses.map((p, i) => html`
      <${HaloRing}
        key=${i}
        pose=${p}
        label=${NAMES[i % NAMES.length] + " · available"}
        onClick=${() => onHaloClick && onHaloClick(NAMES[i % NAMES.length])}
      />
    `)}
  `;
}

/* ---------------- Root scene component ---------------- */

function ARScene({ getState, mode, onPoseStable, onHaloClick }) {
  // Perspective camera positioned so (-1..+1) in X/Y roughly equals NDC at z=0.
  // 2 * cameraZ * tan(fov/2) ≈ 2 → cameraZ ≈ 2.2 with fov 50.
  const camera = useMemo(() => ({
    position: [0, 0, 2.2],
    fov: 50,
    near: 0.1,
    far: 20,
  }), []);

  return html`
    <${Canvas}
      camera=${camera}
      frameloop="always"
      gl=${{ alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" }}
      style=${{ position: "absolute", inset: 0, background: "transparent", touchAction: "none" }}
      onCreated=${({ gl }) => { gl.setClearColor(0x000000, 0); gl.setClearAlpha(0); }}
    >
      ${mode === "companion"
        ? html`<${CompanionScene} getState=${getState} onPoseStable=${onPoseStable} />`
        : html`<${HalosScene} getState=${getState} onHaloClick=${onHaloClick} />`
      }
    </${Canvas}>
  `;
}

/* ---------------- Imperative mount API ---------------- */

async function mountARScene(rootEl, opts = {}) {
  if (!rootEl) throw new Error("mountARScene: rootEl is required");
  const state = {
    videoEl: opts.videoEl || null,
    variant: opts.variant || "blob",
    spotted: false,
    lane: null,
    mode: opts.mode || "companion",
  };
  const getState = () => state;

  const reactRoot = createRoot(rootEl);
  reactRoot.render(html`
    <${ARScene}
      getState=${getState}
      mode=${state.mode}
      onPoseStable=${opts.onPoseStable}
      onHaloClick=${opts.onHaloClick}
    />
  `);

  return {
    update(patch) {
      Object.assign(state, patch || {});
    },
    unmount() {
      try { reactRoot.unmount(); } catch {}
    },
  };
}

/* ---------------- Boot probe + global expose ---------------- */

async function runPerfProbe() {
  // 3-second sample after pose landmarker is ready. Reports avg fps of the rAF loop.
  await loadPose();
  return new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();
    const tick = () => {
      frames++;
      const elapsed = performance.now() - start;
      if (elapsed >= 3000) {
        const fps = (frames / elapsed) * 1000;
        resolve(fps);
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });
}

let _faceEligible = null; // unresolved until probe completes
async function isFaceEligible() {
  if (_faceEligible !== null) return _faceEligible;
  try {
    const fps = await runPerfProbe();
    _faceEligible = fps >= 25;
    if (_faceEligible) {
      // Kick off the face landmarker load in the background so it's ready when needed.
      loadFace();
    }
  } catch {
    _faceEligible = false;
  }
  return _faceEligible;
}

window.AR3D = {
  mountARScene,
  isFaceEligible,
  shouldUsePostFX,
  _internals: { loadPose, loadFace, loadVision },
};
window.dispatchEvent(new Event("ar3d-ready"));
