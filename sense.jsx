// Sense — phone-sensor helpers for Stella.
// Exposes window.Sense with permission asks, gyro tilt, face tracking, and a WebXR probe.

const { useEffect, useRef, useState } = React;

async function requestCamera() {
  if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
    stream.getTracks().forEach((t) => t.stop());
    return "granted";
  } catch {
    return "denied";
  }
}

function requestLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ state: "unsupported" });
    let done = false;
    const t = setTimeout(() => {
      if (done) return; done = true;
      resolve({ state: "denied" });
    }, 12000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (done) return; done = true; clearTimeout(t);
        resolve({ state: "granted", lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        if (done) return; done = true; clearTimeout(t);
        resolve({ state: "denied" });
      },
      { timeout: 10000, maximumAge: 5 * 60 * 1000, enableHighAccuracy: false }
    );
  });
}

async function requestMotion() {
  const DOE = window.DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission === "function") {
    try {
      const r = await DOE.requestPermission();
      return r === "granted" ? "granted" : "denied";
    } catch {
      return "denied";
    }
  }
  // Android & desktop: orientation events fire without an explicit prompt.
  return "granted";
}

async function requestNotifications() {
  if (!("Notification" in window)) return "unsupported";
  try {
    const r = await Notification.requestPermission();
    return r === "granted" ? "granted" : r === "denied" ? "denied" : "denied";
  } catch {
    return "denied";
  }
}

async function checkWebXR() {
  try {
    if (!navigator.xr || !navigator.xr.isSessionSupported) return false;
    return await navigator.xr.isSessionSupported("immersive-ar");
  } catch {
    return false;
  }
}

function useWebXR() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    let mounted = true;
    checkWebXR().then((v) => { if (mounted) setOk(v); });
    return () => { mounted = false; };
  }, []);
  return ok;
}

function useOrientation(active) {
  const [tilt, setTilt] = useState({ x: 0, y: 0, rotateX: 0, rotateY: 0 });
  useEffect(() => {
    if (!active) return;
    const onOri = (e) => {
      const g = (e.gamma || 0) / 90;            // left/right [-1,1]
      const b = ((e.beta || 0) - 60) / 90;       // bias for upright phone
      const x = Math.max(-22, Math.min(22, g * 22));
      const y = Math.max(-14, Math.min(14, b * 14));
      setTilt({
        x,
        y,
        rotateX: Math.max(-8, Math.min(8, -y * 0.45)),
        rotateY: Math.max(-10, Math.min(10, x * 0.45)),
      });
    };
    window.addEventListener("deviceorientation", onOri);
    return () => window.removeEventListener("deviceorientation", onOri);
  }, [active]);
  return tilt;
}

// Bridge to the cinematic AR layer (ESM via import map). Imperatively mounts the
// R3F canvas into the provided container element and forwards live state updates.
// `bypassVideo` (debug): when true, mounts with a synthetic always-ready video so
// the scene renders even when the camera is denied. Useful in the preview iframe.
function useAR3D({ containerRef, videoRef, active, mode, variant, spotted, bypassVideo, onPoseStable, onHaloClick }) {
  const handleRef = useRef(null);
  const [ready, setReady] = useState(!!window.AR3D);

  // Wait for ar3d.module.js to finish booting.
  useEffect(() => {
    if (window.AR3D) { setReady(true); return; }
    const on = () => setReady(true);
    window.addEventListener("ar3d-ready", on, { once: true });
    return () => window.removeEventListener("ar3d-ready", on);
  }, []);

  // Mount/unmount with the lifecycle of the screen.
  useEffect(() => {
    if (!ready || !active) return;
    const root = containerRef.current;
    let video = videoRef.current;
    if (!root) return;
    // Allow a synthetic always-ready video for previewing without camera.
    if (!video && bypassVideo) {
      video = document.createElement("video");
      Object.defineProperty(video, "readyState", { get: () => 4 });
      Object.defineProperty(video, "videoWidth", { get: () => 640 });
      Object.defineProperty(video, "videoHeight", { get: () => 480 });
    }
    if (!video) return;
    let mounted = true;
    let cleanup = () => {};
    (async () => {
      try {
        const handle = await window.AR3D.mountARScene(root, {
          videoEl: video,
          mode,
          variant,
          onPoseStable: (p) => { if (mounted && onPoseStable) onPoseStable(p); },
          onHaloClick: (id) => { if (mounted && onHaloClick) onHaloClick(id); },
        });
        if (!mounted) { handle.unmount(); return; }
        handleRef.current = handle;
        cleanup = () => handle.unmount();
      } catch (e) {
        console.warn("AR3D mount failed", e);
      }
    })();
    return () => {
      mounted = false;
      handleRef.current = null;
      cleanup();
    };
  }, [ready, active, mode, bypassVideo]);

  // Push state updates without remounting.
  useEffect(() => {
    if (!handleRef.current) return;
    handleRef.current.update({ variant, spotted });
  }, [variant, spotted]);

  return { ready };
}

async function startImmersiveAR() {
  if (!navigator.xr) return null;
  try {
    const session = await navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["local"],
      optionalFeatures: ["hit-test", "depth-sensing", "dom-overlay", "anchors"],
      domOverlay: { root: document.body },
      depthSensing: {
        usagePreference: ["cpu-optimized"],
        dataFormatPreference: ["luminance-alpha"],
      },
    });
    return session;
  } catch (e) {
    console.warn("immersive-ar failed", e);
    return null;
  }
}

window.Sense = {
  requestCamera,
  requestLocation,
  requestMotion,
  requestNotifications,
  checkWebXR,
  useWebXR,
  useOrientation,
  useAR3D,
  startImmersiveAR,
};
