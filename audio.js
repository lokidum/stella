// Stella — global ambient audio manager.
//
// Lives on window.StellaAudio. Wraps Howler. One singleton, instantiated at
// page load but plays NOTHING until the user explicitly calls play(trackId)
// from a real gesture (e.g. tapping Play or an ambient chip on ZoneScreen).
//
// Why a global singleton instead of a React component?
//   The audio must keep playing across navigation between screens. React
//   unmounts components when the route changes; a Howl owned by a component
//   would be destroyed mid-track. By keeping the Howl instances in module
//   scope (i.e. on window.StellaAudio), they survive every React unmount.
//   React UI subscribes to the singleton via subscribe(callback) and re-reads
//   getState() — so the UI stays in sync without ever owning the audio.
//
// API:
//   StellaAudio.play(trackId)      — start (or crossfade to) a track. Loads
//                                    the file on first call per trackId.
//   StellaAudio.pause()            — pause without losing position
//   StellaAudio.resume()           — resume the paused track
//   StellaAudio.stop()             — stop and free the current track
//   StellaAudio.setVolume(v)       — global volume 0..1, persisted
//   StellaAudio.getVolume()
//   StellaAudio.getState()         — { trackId, isPlaying, volume, loading }
//   StellaAudio.subscribe(fn)      — fn(state) on every change; returns
//                                    an unsubscribe function
//   StellaAudio.setTracks(list)    — register the catalog: [{ id, name, src }]
//   StellaAudio.getTracks()

(function () {
  if (typeof window === "undefined") return;
  if (window.StellaAudio) return; // already initialised — never replace

  // ---------- internal state ----------
  let tracks = []; // [{ id, name, src, artist? }]
  const howls = Object.create(null); // trackId -> Howl
  let currentId = null;
  let isPlaying = false;
  let volume = 0.7;
  let loading = false;
  const listeners = new Set();
  const CROSSFADE_MS = 600;

  // Restore last volume across sessions.
  try {
    const v = parseFloat(localStorage.getItem("stella.audio.volume"));
    if (!Number.isNaN(v) && v >= 0 && v <= 1) volume = v;
  } catch {}

  function notify() {
    const snapshot = getState();
    for (const fn of listeners) {
      try { fn(snapshot); } catch (e) { /* swallow */ }
    }
  }

  function getState() {
    return { trackId: currentId, isPlaying, volume, loading };
  }

  function ensureHowl(trackId) {
    if (howls[trackId]) return howls[trackId];
    const meta = tracks.find((t) => t.id === trackId);
    if (!meta) {
      console.warn("StellaAudio: unknown trackId", trackId);
      return null;
    }
    if (typeof Howl === "undefined") {
      console.warn("StellaAudio: Howler not loaded");
      return null;
    }
    const howl = new Howl({
      src: [meta.src],
      loop: true,
      html5: false,      // Use Web Audio so we get smooth volume/fade control
      preload: true,
      volume: 0,         // start silent; we fade up to `volume` in play()
      onloaderror: (id, err) => console.warn("Howl load failed:", meta.src, err),
      onplayerror: (id, err) => {
        // Often a mobile-autoplay-policy block — recover by unlocking on user
        // gesture. Since play() is always called from a tap, we just retry once.
        howl.once("unlock", () => howl.play());
      },
    });
    howls[trackId] = howl;
    return howl;
  }

  function fadeTo(howl, from, to, ms) {
    return new Promise((resolve) => {
      if (!howl) return resolve();
      howl.fade(from, to, ms);
      // Howler's fade event fires on completion; also set a hard fallback.
      const done = () => { resolve(); howl.off("fade", done); };
      howl.once("fade", done);
      setTimeout(done, ms + 80);
    });
  }

  // ---------- public API ----------

  function play(trackId) {
    const next = ensureHowl(trackId);
    if (!next) return;

    const prevId = currentId;
    const prev = prevId && prevId !== trackId ? howls[prevId] : null;

    currentId = trackId;
    isPlaying = true;
    loading = true;
    notify();

    // Start the new track muted, then crossfade up to target volume.
    if (!next.playing()) {
      next.volume(0);
      next.play();
    }
    const startFromVol = next.volume() || 0;
    fadeTo(next, startFromVol, volume, CROSSFADE_MS).then(() => {
      loading = false;
      notify();
    });

    // Fade the previous track out, then pause it.
    if (prev && prev.playing()) {
      const prevVol = prev.volume();
      fadeTo(prev, prevVol, 0, CROSSFADE_MS).then(() => {
        // Pause (don't stop) so a quick switch-back can resume instantly.
        prev.pause();
      });
    }
  }

  function pause() {
    if (!currentId) return;
    const howl = howls[currentId];
    if (howl) howl.pause();
    isPlaying = false;
    notify();
  }

  function resume() {
    if (!currentId) return;
    const howl = howls[currentId];
    if (!howl) return;
    if (!howl.playing()) {
      // If volume was 0 (e.g. faded out), bring it back.
      howl.volume(volume);
      howl.play();
    }
    isPlaying = true;
    notify();
  }

  function stop() {
    if (!currentId) return;
    const howl = howls[currentId];
    if (howl) howl.stop();
    isPlaying = false;
    currentId = null;
    notify();
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    try { localStorage.setItem("stella.audio.volume", String(volume)); } catch {}
    // Apply to whatever is currently audible (only the current track).
    if (currentId && howls[currentId] && isPlaying) {
      howls[currentId].volume(volume);
    }
    notify();
  }

  function getVolume() { return volume; }

  function subscribe(fn) {
    listeners.add(fn);
    // Fire once immediately so the subscriber gets the current state.
    try { fn(getState()); } catch {}
    return () => listeners.delete(fn);
  }

  function setTracks(list) {
    tracks = Array.isArray(list) ? list.slice() : [];
  }
  function getTracks() { return tracks.slice(); }

  window.StellaAudio = {
    play,
    pause,
    resume,
    stop,
    setVolume,
    getVolume,
    getState,
    subscribe,
    setTracks,
    getTracks,
  };
})();
