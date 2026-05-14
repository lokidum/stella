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
import { Billboard, ContactShadows, Html, Trail } from "@react-three/drei";
import { FilesetResolver, PoseLandmarker, FaceLandmarker } from "@mediapipe/tasks-vision";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
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
        // Confidence raised from 0.5 → 0.85 so MediaPipe stops hallucinating
        // "people" out of fabric folds on bus seats, shadows on posters, etc.
        // She'll now only acknowledge a real, clearly-visible person.
        minPoseDetectionConfidence: 0.85,
        minPosePresenceConfidence: 0.85,
        minTrackingConfidence: 0.85,
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
        // Same confidence treatment as PoseLandmarker — only trigger blendshapes
        // when the face is unambiguous.
        minFaceDetectionConfidence: 0.85,
        minFacePresenceConfidence: 0.85,
        minTrackingConfidence: 0.85,
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

/* ---------------- GLTF loader cache ---------------- */

const _gltfPromiseCache = {};
function loadGLTFOnce(url) {
  if (_gltfPromiseCache[url]) return _gltfPromiseCache[url];
  _gltfPromiseCache[url] = new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      // Normalize: center to origin & scale so the model fits in ~1 world unit tall.
      const scene = gltf.scene;
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const tallest = Math.max(size.x, size.y, size.z) || 1;
      // Companion sizing: ~0.45 world units ≈ 22% of screen height with our camera.
      // Small enough to feel like a friend tagging along, not a wall.
      const target = 0.45;
      const k = target / tallest;
      scene.scale.setScalar(k);
      // Re-measure after scale to recentre on the floor (y=0 = feet)
      box.setFromObject(scene);
      const centre = box.getCenter(new THREE.Vector3());
      scene.position.x -= centre.x;
      scene.position.z -= centre.z;
      scene.position.y -= box.min.y; // sit on y=0
      scene.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          if (o.material) {
            o.material.envMapIntensity = 0.6;
          }
        }
      });
      resolve(scene);
    }, undefined, (err) => {
      console.warn("GLTF load failed:", url, err);
      reject(err);
    });
  });
  return _gltfPromiseCache[url];
}

// React hook: loads the GLB and returns a *cloned* scene per consumer instance,
// so each component has its own transform. Returns null while loading.
function useGLTFOnce(url) {
  const [scene, setScene] = useState(null);
  useEffect(() => {
    let cancelled = false;
    loadGLTFOnce(url).then((master) => {
      if (cancelled) return;
      setScene(master.clone(true));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [url]);
  return scene;
}

/* ---------------- Pose helpers ---------------- */

// Convert a MediaPipe pose (normalized landmarks 0..1) into a friendly summary.
function summarizePose(landmarks, vw, vh, aspect) {
  if (!landmarks || landmarks.length === 0) return null;
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
  const wx = (headX * 2 - 1) * aspect;
  const wy = 1 - headY * 2;
  const wSize = shoulderW * 2 * aspect;
  return {
    head: { x: wx, y: wy },
    shoulders: { x: ((lSh.x + rSh.x) - 1) * aspect, y: 1 - shY * 2 },
    hips: { x: lHip && rHip ? ((lHip.x + rHip.x) - 1) * aspect : wx, y: 1 - hipY * 2 },
    width: wSize,
    torso: torsoH * 2,
  };
}

/* ---------------- Safe-zone layout ---------------- */

// Layout constants for the mobile UI. The bottom sheet ('.ar-sheet') pops up
// over the lower ~half of the screen when 'spotted'. All character motion is
// constrained above its top edge in world Y so characters are never hidden
// behind the sheet.
//
// Calibrated for our perspective camera (position [0,0,2.2], fov 50) whose
// visible Y range at z=0 is roughly [-1.025, +1.025].
const SAFE_ZONE = {
  groundY: 0.0,   // feet plane for Pip / Mochi (screen vertical centre)
  airY: 0.45,     // Wisp's float baseline — well above the sheet
  boundX: 0.7,    // ±this * aspect for horizontal free-roam / curiosity walks
};

/* ---------------- Character anchor + curiosity hooks ---------------- */

// Returns a ref that's live-updated each frame with a {x, y, ground, hasPose}
// target for the given role. role = 'air' (Wisp) or 'ground' (Pip, Mochi).
//
// Behaviour:
//   - hasPose === true   → SPOTTED EVENT: stop roaming and centre to
//     (0, groundY) for ground / (0, airY) for air. Pose landmark coords are
//     intentionally discarded — pose is only a trigger.
//   - hasPose === false  → FREE ROAM:
//       * air   — slow figure-8 around airY within ±boundX·aspect
//       * ground — caller drives x; we only surface the floor y
function useCharacterAnchor(anchorRef, role, aspect, options = {}) {
  const initialY = role === "air" ? SAFE_ZONE.airY : SAFE_ZONE.groundY;
  const targetRef = useRef({ x: 0, y: initialY, ground: SAFE_ZONE.groundY, hasPose: false });
  const t0 = useRef(performance.now() / 1000 + Math.random() * 10);
  useFrame(() => {
    const a = anchorRef.current;
    const t = performance.now() / 1000 - t0.current;
    if (a && a.hasPose) {
      // SPOTTED — centre horizontally and sit at the role's plane.
      targetRef.current.x = 0;
      targetRef.current.y = role === "air" ? SAFE_ZONE.airY : SAFE_ZONE.groundY;
      targetRef.current.ground = SAFE_ZONE.groundY;
      targetRef.current.hasPose = true;
    } else {
      // FREE ROAM
      if (role === "air") {
        const ax = aspect.current || 1;
        targetRef.current.x = SAFE_ZONE.boundX * 0.65 * Math.sin(t * 0.45) * ax;
        targetRef.current.y = SAFE_ZONE.airY + 0.08 * Math.cos(t * 0.72);
      } else {
        // Ground character drives its own x via wandering / pacing logic.
        // We only publish the floor y so they sit at the safe ground plane.
        targetRef.current.y = SAFE_ZONE.groundY;
      }
      targetRef.current.ground = SAFE_ZONE.groundY;
      targetRef.current.hasPose = false;
    }
  });
  return targetRef;
}

// Returns a ref to the current curiosity point (x in world units).
// Repicks every random(intervalRange[0], intervalRange[1]) seconds.
function useCuriosityPoint(active, getBounds, intervalRange = [4, 8]) {
  const pointRef = useRef({ x: 0, lastChange: performance.now(), nextIn: 4 + Math.random() * 4 });
  useFrame(() => {
    if (!active) return;
    const now = performance.now();
    if ((now - pointRef.current.lastChange) / 1000 >= pointRef.current.nextIn) {
      const b = getBounds();
      pointRef.current.x = (Math.random() * 2 - 1) * b;
      pointRef.current.lastChange = now;
      pointRef.current.nextIn = intervalRange[0] + Math.random() * (intervalRange[1] - intervalRange[0]);
    }
  });
  return pointRef;
}

/* ---------------- VFX: BounceMark + Footprint ---------------- */

function BounceMark({ x, y, birth }) {
  const matRef = useRef();
  useFrame(() => {
    const age = (performance.now() - birth) / 1000;
    if (matRef.current) {
      matRef.current.opacity = Math.max(0, 0.45 * (1 - age / 1.5));
    }
  });
  return html`
    <mesh position=${[x, y + 0.001, 0]} rotation=${[-Math.PI / 2, 0, 0]}>
      <circleGeometry args=${[0.18, 32]} />
      <meshBasicMaterial
        ref=${matRef}
        color=${"#0e2730"}
        transparent
        opacity=${0.45}
        depthWrite=${false}
        toneMapped=${false}
      />
    </mesh>
  `;
}

function Footprint({ x, z, side, y, birth, onExpire }) {
  const matRef = useRef();
  const meshRef = useRef();
  useFrame(() => {
    const age = (performance.now() - birth) / 1000;
    if (matRef.current) {
      matRef.current.opacity = Math.max(0, 0.5 * (1 - age / 4));
    }
    if (age > 4 && onExpire) onExpire();
  });
  return html`
    <mesh
      ref=${meshRef}
      position=${[x, y + 0.002, z]}
      rotation=${[-Math.PI / 2, 0, side === "L" ? 0.18 : -0.18]}
    >
      <circleGeometry args=${[0.06, 24]} />
      <meshBasicMaterial
        ref=${matRef}
        color=${"#1a2e35"}
        transparent
        opacity=${0.5}
        depthWrite=${false}
        toneMapped=${false}
      />
    </mesh>
  `;
}

/* ---------------- Wisp (ghost) ---------------- */

// Round, symmetric spirit — full billboard (always face camera) is the right read.
function Wisp({ anchor, aspect }) {
  const scene = useGLTFOnce("assets/ghost.glb");
  const groupRef = useRef();
  const wispRef = useRef();
  const target = useCharacterAnchor(anchor, "air", aspect);
  const { camera } = useThree();
  const lastXRef = useRef(0);
  const facingVxRef = useRef(0);

  // Seed initial position at the safe-zone air plane so we don't visibly
  // drift up from the world origin on first mount.
  useEffect(() => {
    if (groupRef.current) groupRef.current.position.set(0, SAFE_ZONE.airY, 0);
  }, []);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const tgt = target.current;

    // Shock absorber: only move toward target if it has drifted more than
    // a few cm. Stops the model vibrating against noisy MediaPipe coords.
    const dxToTarget = tgt.x - g.position.x;
    const dyToTarget = tgt.y - g.position.y;
    const distance = Math.sqrt(dxToTarget * dxToTarget + dyToTarget * dyToTarget);
    if (distance > 0.05) {
      // Framerate-compensated lerp — identical feel on 30fps and 120fps screens.
      const k = 1 - Math.exp(-delta * 4.5);
      g.position.x += dxToTarget * k;
      g.position.y += dyToTarget * k;
    }

    // Idle bob + breathe — applied to the inner mesh so the outer billboard
    // rotation never inherits the vertical sway.
    const t = performance.now() / 1000;
    const bob = Math.sin(t * 1.4) * 0.04;
    const breathe = Math.sin(t * 1.2);
    if (wispRef.current) {
      wispRef.current.position.y = bob;
      wispRef.current.scale.x = 1 + breathe * 0.04;
      wispRef.current.scale.y = 1 - breathe * 0.03;
      wispRef.current.scale.z = 1 + breathe * 0.04;
    }

    // Track per-frame X velocity for the Z-tilt lean. Position-facing is
    // handled by lookAt below, so we don't touch rotation.y manually anymore.
    const dx = g.position.x - lastXRef.current;
    lastXRef.current = g.position.x;
    facingVxRef.current = facingVxRef.current * 0.8 + dx * 0.2;

    // Full billboard: pivot Y so the model's native +Z (where these specific
    // Tripo3D GLBs export their face) points at the camera in the XZ plane.
    // We avoid lookAt because lookAt assumes -Z forward and adds X-tilt for
    // vertical offset that we'd just have to zero out.
    const dxToCam = camera.position.x - g.position.x;
    const dzToCam = camera.position.z - g.position.z;
    g.rotation.y = Math.atan2(dxToCam, dzToCam);
    // Lean into motion (Z tilt) — applied AFTER the Y rotation.
    g.rotation.z = THREE.MathUtils.clamp(-facingVxRef.current * 12, -0.35, 0.35);
    // Lock X so she stays upright on tilted phones.
    g.rotation.x = 0;
  });

  if (!scene) return null;
  // The primitive's +π/2 Y offset compensates for AI-generated GLBs that face
  // down the +X axis. After lookAt orients the wrapper toward the camera, this
  // offset puts the model's actual face in line with that orientation.
  return html`
    <group ref=${groupRef}>
      <${Trail}
        width=${0.4}
        length=${5}
        decay=${1.1}
        color=${new THREE.Color("#a8e8ff")}
        attenuation=${(t) => t * t}
      >
        <group ref=${wispRef}>
          <primitive object=${scene} />
        </group>
      </${Trail}>
    </group>
  `;
}

/* ---------------- Pip (blob) ---------------- */

// Round, symmetric blob — full billboard so his face is always toward the user.
function Pip({ anchor, aspect }) {
  const scene = useGLTFOnce("assets/blob.glb");
  const groupRef = useRef();
  const meshRef = useRef();
  const target = useCharacterAnchor(anchor, "ground", aspect);
  const { camera } = useThree();

  // Seed initial position on the safe-zone ground plane.
  useEffect(() => {
    if (groupRef.current) groupRef.current.position.set(0, SAFE_ZONE.groundY, 0);
  }, []);

  // Bounce state — period 0.9s; height 0.18
  const phaseRef = useRef(Math.random() * Math.PI * 2);
  const lastImpactRef = useRef(performance.now() / 1000);
  const [marks, setMarks] = useState([]);

  // Curiosity walk (free-roam target X) — bounded by the safe-zone width so
  // Pip never wanders into the area that the bottom sheet covers.
  const curiosity = useCuriosityPoint(true, () => SAFE_ZONE.boundX * (aspect.current || 1), [4, 8]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const tgt = target.current;
    const t = performance.now() / 1000;

    // X target: pose hip when present, else curiosity point.
    const desiredX = tgt.hasPose ? tgt.x : curiosity.current.x;
    const ground = tgt.ground;

    // Shock absorber on horizontal movement — only chase the target if it's
    // moved a meaningful distance, then lerp framerate-compensated.
    const dxToTarget = desiredX - g.position.x;
    if (Math.abs(dxToTarget) > 0.05) {
      const kx = 1 - Math.exp(-delta * 1.6);
      g.position.x += dxToTarget * kx;
    }

    // Bounce: pulse phase forward. Period scales slightly with travel speed.
    phaseRef.current += delta * (2 * Math.PI / 0.9);
    if (phaseRef.current > Math.PI * 2) phaseRef.current -= Math.PI * 2;

    // Height: 0 at phase 0/2π (impact), max at π (apex).
    const heightPct = Math.max(0, Math.sin(phaseRef.current));
    const bounceY = heightPct * 0.18;
    g.position.y = ground + bounceY;

    // Detect impact (phase crossed 2π back to 0)
    const impacted = phaseRef.current < 0.1 && (t - lastImpactRef.current) > 0.6;
    if (impacted) {
      lastImpactRef.current = t;
      const id = `${t}-${Math.random().toString(36).slice(2, 6)}`;
      // Replace any existing mark with the new one — only one visible at a time.
      setMarks([{ id, x: g.position.x, y: ground, birth: performance.now() }]);
    }

    // Squash & stretch — inner mesh so the outer billboard rotation isn't
    // distorted by per-frame scale changes.
    if (meshRef.current) {
      if (heightPct < 0.05) {
        // Impact frame — squash
        const u = 1 - heightPct / 0.05;
        meshRef.current.scale.x = 1 + 0.25 * u;
        meshRef.current.scale.y = 1 - 0.30 * u;
        meshRef.current.scale.z = 1 + 0.25 * u;
      } else {
        // Airborne — stretch
        const u = heightPct;
        meshRef.current.scale.x = 0.92 - 0.05 * u;
        meshRef.current.scale.y = 1.10 + 0.10 * u;
        meshRef.current.scale.z = 0.92 - 0.05 * u;
      }
    }

    // Full billboard — same pure-Y math as Wisp/Mochi for consistency. Locks
    // X and Z so Pip stays upright on tilted phones.
    const dxToCamP = camera.position.x - g.position.x;
    const dzToCamP = camera.position.z - g.position.z;
    g.rotation.y = Math.atan2(dxToCamP, dzToCamP);
    g.rotation.x = 0;
    g.rotation.z = 0;
  });

  if (!scene) return null;
  return html`
    <group>
      <group ref=${groupRef}>
        <group ref=${meshRef}>
          <primitive object=${scene} />
        </group>
      </group>
      ${marks.map((m) => html`<${BounceMark} key=${m.id} x=${m.x} y=${m.y} birth=${m.birth} />`)}
    </group>
  `;
}

/* ---------------- Mochi (bear) ---------------- */

let _footprintIdCounter = 0;

// Hybrid facing: full billboard at rest (acknowledges the user) and a
// deliberate side-pivot when actually walking (so the back / profile shows).
// Mochi is the only character with a clear "front" worth turning around.
function Mochi({ anchor, aspect }) {
  const scene = useGLTFOnce("assets/bear.glb");
  const groupRef = useRef();
  const meshRef = useRef();
  const target = useCharacterAnchor(anchor, "ground", aspect);
  const { camera } = useThree();
  const [footprints, setFootprints] = useState([]);
  const walkPhaseRef = useRef(0);
  const lastSideRef = useRef("R");
  const idleDirRef = useRef(1);
  // Blend between "rest" (1, lookAt camera) and "walking" (0, profile).
  const restingBlend = useRef(1);

  // Seed initial position on the safe-zone ground plane.
  useEffect(() => {
    if (groupRef.current) groupRef.current.position.set(0, SAFE_ZONE.groundY, 0);
  }, []);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const tgt = target.current;
    const t = performance.now() / 1000;
    const ground = tgt.ground;
    g.position.y = ground;

    // X target: when spotted Mochi heads to centre (anchor publishes x=0);
    // otherwise he paces gently across the safe zone.
    let desiredX;
    if (tgt.hasPose) {
      desiredX = tgt.x; // = 0 (anchor centres on spotted)
    } else {
      const span = SAFE_ZONE.boundX * (aspect.current || 1);
      desiredX = idleDirRef.current * span * (0.4 + 0.5 * Math.sin(t * 0.3));
      if (Math.random() < 0.001) idleDirRef.current *= -1;
    }
    const dx = desiredX - g.position.x;

    // Shock absorber: only move toward target when the gap is bigger than the
    // expected jitter band. Eliminates the MediaPipe micro-vibration without
    // losing responsiveness to real walking motion.
    if (Math.abs(dx) > 0.05) {
      const kx = 1 - Math.exp(-delta * 1.4);
      g.position.x += dx * kx;
    }
    const kxRead = 1 - Math.exp(-delta * 1.4);
    const speed = Math.abs(dx) * kxRead / Math.max(delta, 0.001);

    // Walk phase advances faster when actually moving
    const phaseRate = 4 + Math.min(speed, 1.5) * 6;
    const prevPhase = walkPhaseRef.current;
    walkPhaseRef.current += delta * phaseRate;

    // Waddle / forward tilt — applied to inner mesh in local frame so it
    // composes correctly with whatever Y rotation the group ends up with.
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(walkPhaseRef.current) * 0.18;
      meshRef.current.position.y = Math.abs(Math.sin(walkPhaseRef.current)) * 0.04;
      meshRef.current.rotation.x = -THREE.MathUtils.clamp(speed * 0.4, 0, 0.25);
    }

    // ---- Hybrid Y facing ----
    // These specific Tripo3D GLBs export face along +Z (verified empirically
    // — rotation.y = π shows the back). camYaw rotates so +Z points at the
    // camera in the XZ plane.
    const dxToCam = camera.position.x - g.position.x;
    const dzToCam = camera.position.z - g.position.z;
    const camYaw = Math.atan2(dxToCam, dzToCam);
    // Walking yaw: profile toward +X (right) means +Z should point +X → +π/2.
    // Toward -X (left) → -π/2.
    const walkYaw = dx > 0 ? Math.PI / 2 : -Math.PI / 2;

    // Smoothly blend rest ↔ walking based on actual speed.
    const targetBlend = Math.abs(dx) < 0.01 ? 1 : 0;
    restingBlend.current += (targetBlend - restingBlend.current) * (1 - Math.exp(-delta * 2.5));
    const blend = restingBlend.current;

    // Lerp current Y toward the blended target (angle-aware via shortest arc).
    const targetYaw = blend * camYaw + (1 - blend) * walkYaw;
    let diff = targetYaw - g.rotation.y;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    g.rotation.y += diff * (1 - Math.exp(-delta * 3.5));
    // Lock X / Z so Mochi never tips over on tilted phones.
    g.rotation.x = 0;
    g.rotation.z = 0;

    // Footprints: step on each phase crossing of 0 or π
    const stepBefore = Math.floor(prevPhase / Math.PI);
    const stepAfter = Math.floor(walkPhaseRef.current / Math.PI);
    if (stepAfter > stepBefore) {
      const side = lastSideRef.current === "L" ? "R" : "L";
      lastSideRef.current = side;
      const offsetZ = side === "L" ? -0.08 : 0.08;
      const fp = {
        id: ++_footprintIdCounter,
        x: g.position.x - 0.02,
        z: offsetZ,
        side,
        y: ground,
        birth: performance.now(),
      };
      setFootprints((prev) => {
        const next = [...prev, fp];
        // Cap at 6 — drop oldest beyond.
        return next.length > 6 ? next.slice(next.length - 6) : next;
      });
    }
  });

  const expire = useCallback((id) => {
    setFootprints((prev) => prev.filter((p) => p.id !== id));
  }, []);

  if (!scene) return null;
  // Primitive +π/2 offset compensates for AI-generated GLBs that face +X by
  // default. Combined with lookAt/walkYaw on the wrapper, this puts Mochi's
  // actual face along the intended direction.
  return html`
    <group>
      <group ref=${groupRef}>
        <group ref=${meshRef}>
          <primitive object=${scene} />
        </group>
      </group>
      ${footprints.map((f) => html`
        <${Footprint}
          key=${f.id}
          x=${f.x}
          z=${f.z}
          side=${f.side}
          y=${f.y}
          birth=${f.birth}
          onExpire=${() => expire(f.id)}
        />
      `)}
    </group>
  `;
}

/* ---------------- Character dispatcher ---------------- */

function Character({ variant, anchor, aspect }) {
  if (variant === "ghost") return html`<${Wisp} anchor=${anchor} aspect=${aspect} />`;
  if (variant === "blob") return html`<${Pip} anchor=${anchor} aspect=${aspect} />`;
  // default to bear
  return html`<${Mochi} anchor=${anchor} aspect=${aspect} />`;
}

/* ---------------- Lights ---------------- */

function RembrandtLights({ lit }) {
  return html`
    <ambientLight intensity=${0.5} color=${"#cfe9ee"} />
    <hemisphereLight intensity=${0.55} color=${"#ffe7ea"} groundColor=${"#0a1b22"} />
    <spotLight
      position=${[-1.4, 1.6, 1.6]}
      intensity=${lit ? 1.8 : 1.3}
      angle=${0.7}
      penumbra=${0.7}
      distance=${6}
      decay=${1.5}
      color=${"#ffd9c2"}
      castShadow
    />
    <spotLight
      position=${[1.0, -0.4, 1.2]}
      intensity=${0.55}
      angle=${0.9}
      penumbra=${0.95}
      distance=${5}
      decay=${1.6}
      color=${"#a0d8ff"}
    />
    <pointLight position=${[0.0, 0.4, -1.2]} intensity=${0.7} color=${"#96deeb"} distance=${4} />
  `;
}

/* ---------------- Companion Scene ---------------- */

function CompanionScene({ getState, onPoseStable }) {
  const { size } = useThree();
  // Shared anchor that all characters read from. Updated each frame by the pose loop.
  const anchorRef = useRef({ hasPose: false, head: { x: 0, y: 0 }, hips: { x: 0, y: -0.5 }, shoulders: { x: 0, y: -0.1 }, scale: 1 });
  const aspectRef = useRef(size.width / Math.max(size.height, 1));
  useEffect(() => { aspectRef.current = size.width / Math.max(size.height, 1); }, [size.width, size.height]);

  const stableCountRef = useRef(0);
  const stableFiredRef = useRef(false);
  const [variant, setVariant] = useState(() => getState().variant || "blob");
  const [spotted, setSpotted] = useState(false);

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
    if (!det || !video || video.readyState < 2 || video.videoWidth === 0) {
      anchorRef.current.hasPose = false;
      return;
    }
    const ts = performance.now();
    const useTs = ts > lastTsRef.current ? ts : lastTsRef.current + 1;
    lastTsRef.current = useTs;
    try {
      const res = det.detectForVideo(video, useTs);
      const aspect = size.width / Math.max(size.height, 1);
      const landmarks = res?.landmarks?.[0];
      if (landmarks && landmarks.length) {
        const p = summarizePose(landmarks, video.videoWidth, video.videoHeight, aspect);
        if (p) {
          anchorRef.current = {
            hasPose: true,
            head: p.head,
            hips: p.hips,
            shoulders: p.shoulders,
            scale: Math.max(0.55, Math.min(1.45, p.width * 1.6 + 0.7)),
          };
          stableCountRef.current = Math.min(60, stableCountRef.current + 1);
          if (stableCountRef.current >= 14 && !stableFiredRef.current && onPoseStable) {
            stableFiredRef.current = true;
            try { onPoseStable(p); } catch {}
          }
        }
      } else {
        anchorRef.current.hasPose = false;
        stableCountRef.current = Math.max(0, stableCountRef.current - 1);
        if (stableCountRef.current === 0) stableFiredRef.current = false;
      }
    } catch (e) {
      // swallow per-frame errors
    }
  });

  return html`
    <${RembrandtLights} lit=${spotted} />
    <${Character} variant=${variant} anchor=${anchorRef} aspect=${aspectRef} />
    <${ContactShadows}
      position=${[0, -0.56, 0]}
      opacity=${0.55}
      blur=${2.6}
      scale=${1.8}
      far=${0.7}
      resolution=${256}
      color=${"#0e2730"}
    />
  `;
}

/* ---------------- Halos Scene (one character per detected pose) ---------------- */

const HALO_VARIANTS = ["ghost", "blob", "bear"];
const HALO_NAMES = ["Sam", "Priya", "Jay", "Stella"];

function HaloCharacter({ pose, variant, label, onClick }) {
  // Per-character anchor that the dispatcher characters can read.
  const anchorRef = useRef({
    hasPose: true,
    head: pose.head,
    hips: pose.hips,
    shoulders: pose.shoulders,
    scale: 1,
  });
  const aspectRef = useRef(1);
  const { size } = useThree();
  useEffect(() => { aspectRef.current = size.width / Math.max(size.height, 1); }, [size.width, size.height]);
  useEffect(() => {
    anchorRef.current = { hasPose: true, head: pose.head, hips: pose.hips, shoulders: pose.shoulders, scale: 1 };
  }, [pose.head.x, pose.head.y, pose.hips.x, pose.hips.y]);

  return html`
    <group onClick=${(e) => { e.stopPropagation(); onClick && onClick(); }}>
      <${Character} variant=${variant} anchor=${anchorRef} aspect=${aspectRef} />
      <mesh position=${[pose.hips.x, pose.hips.y - 0.05, 0]} rotation=${[-Math.PI / 2, 0, 0]}>
        <ringGeometry args=${[0.28, 0.34, 48]} />
        <meshBasicMaterial
          color=${"#96deeb"}
          transparent
          opacity=${0.55}
          side=${THREE.DoubleSide}
          toneMapped=${false}
        />
      </mesh>
      <${Html} center distanceFactor=${1.6} position=${[pose.head.x, pose.head.y + 0.32, 0]} zIndexRange=${[10, 0]} pointerEvents="none">
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
      const aspect = size.width / Math.max(size.height, 1);
      const all = (res?.landmarks || []).map((lm) =>
        summarizePose(lm, video.videoWidth, video.videoHeight, aspect)
      ).filter(Boolean).slice(0, 4);
      setPoses((prev) => {
        if (prev.length !== all.length) return all;
        for (let i = 0; i < all.length; i++) {
          const a = all[i], p = prev[i];
          if (Math.abs(a.head.x - p.head.x) > 0.02 || Math.abs(a.head.y - p.head.y) > 0.02) return all;
        }
        return prev;
      });
    } catch {}
  });

  return html`
    <${RembrandtLights} lit=${false} />
    <${ContactShadows} position=${[0, -0.56, 0]} opacity=${0.45} blur=${2.6} scale=${1.8} far=${0.7} resolution=${256} color=${"#0e2730"} />
    ${poses.map((p, i) => html`
      <${HaloCharacter}
        key=${i}
        pose=${p}
        variant=${HALO_VARIANTS[i % HALO_VARIANTS.length]}
        label=${HALO_NAMES[i % HALO_NAMES.length] + " · available"}
        onClick=${() => onHaloClick && onHaloClick(HALO_NAMES[i % HALO_NAMES.length])}
      />
    `)}
  `;
}

/* ---------------- Root scene component ---------------- */

function ARScene({ getState, mode, onPoseStable, onHaloClick }) {
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
      shadows
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
  await loadPose();
  return new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();
    const tick = () => {
      frames++;
      const elapsed = performance.now() - start;
      if (elapsed >= 3000) {
        resolve((frames / elapsed) * 1000);
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });
}

let _faceEligible = null;
async function isFaceEligible() {
  if (_faceEligible !== null) return _faceEligible;
  try {
    const fps = await runPerfProbe();
    _faceEligible = fps >= 25;
    if (_faceEligible) loadFace();
  } catch {
    _faceEligible = false;
  }
  return _faceEligible;
}

// Pre-warm GLBs in the background so the first character mount feels instant.
function prewarmCharacters() {
  loadGLTFOnce("assets/ghost.glb").catch(() => {});
  loadGLTFOnce("assets/blob.glb").catch(() => {});
  loadGLTFOnce("assets/bear.glb").catch(() => {});
}

window.AR3D = {
  mountARScene,
  isFaceEligible,
  shouldUsePostFX,
  prewarmCharacters,
  _internals: { loadPose, loadFace, loadVision, loadGLTFOnce },
};
prewarmCharacters();
window.dispatchEvent(new Event("ar3d-ready"));
