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
  let lastError = null; // surfaced to the UI for visibility
  const listeners = new Set();
  const CROSSFADE_MS = 600;

  // Mobile Chrome / iOS Safari sometimes leave Howler.ctx in 'suspended' state
  // even after a user gesture. Resuming it explicitly on every play() is cheap
  // and fixes the silent-playback case where everything looks correct in state
  // but no sound reaches the speakers.
  function resumeContext() {
    try {
      const Howler = window.Howler;
      if (Howler && Howler.ctx && Howler.ctx.state === "suspended") {
        Howler.ctx.resume().catch(() => {});
      }
    } catch {}
  }

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
    return { trackId: currentId, isPlaying, volume, loading, error: lastError };
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
      format: ["mp3"],   // explicit so Howler doesn't try to probe other codecs
      loop: true,
      // html5:true uses an HTMLAudioElement under the hood — streams instead
      // of pre-decoding the whole file. Mandatory for reliable mobile-Chrome /
      // iOS playback of longer music tracks (Howler docs recommend it for any
      // track that streams or is more than a few seconds).
      html5: true,
      preload: true,
      volume: 0,
      onloaderror: (id, err) => {
        const msg = `couldn't load ${meta.name}`;
        console.warn("Howl load failed:", meta.src, err);
        lastError = msg;
        loading = false;
        notify();
      },
      onplayerror: (id, err) => {
        console.warn("Howl play failed:", meta.src, err);
        // Howler emits 'unlock' once a real user gesture has unlocked the
        // audio plane. We retry the play once that happens.
        howl.once("unlock", () => {
          lastError = null;
          notify();
          try { howl.play(); } catch {}
        });
        lastError = "tap play again to start sound";
        notify();
      },
      onload: () => {
        // File is ready — clear any stale error from a previous attempt.
        if (lastError) { lastError = null; notify(); }
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
    // Resume audio context up front in case the browser left it suspended.
    resumeContext();

    const next = ensureHowl(trackId);
    if (!next) return;

    const prevId = currentId;
    const prev = prevId && prevId !== trackId ? howls[prevId] : null;

    currentId = trackId;
    isPlaying = true;
    loading = true;
    lastError = null;
    notify();

    // Start the new track muted, then crossfade up to target volume. In html5
    // mode we must call play() synchronously inside the user gesture handler,
    // which is exactly how we get here (button onClick → StellaAudio.play).
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
    resumeContext();
    const howl = howls[currentId];
    if (!howl) return;
    if (!howl.playing()) {
      howl.volume(volume);
      howl.play();
    }
    isPlaying = true;
    lastError = null;
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
