// Screens for the Stella prototype
const { useEffect, useRef, useState, useCallback, useMemo } = React;

/* ----------------------- Icons ----------------------- */
const IconBack = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconClose = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconMap = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="#3a7d6a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);
const IconChat = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="#1a5d7a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);
const IconHeart = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="#ffc4cc" stroke="#c25a6b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const IconMotion = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="2" width="12" height="20" rx="3" />
    <path d="M9 7l3-2 3 2" />
    <path d="M9 17l3 2 3-2" />
  </svg>
);
const IconBell = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);
const IconPin = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconCam = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

/* ----------------------- Welcome ----------------------- */
function WelcomeScreen({ onContinue, apiKey, setApiKey }) {
  const [showKey, setShowKey] = useState(false);
  return (
    <div className="screen welcome" data-screen-label="01 Welcome">
      <div className="welcome-trio" aria-hidden="true" />
      <h1 className="welcome-title">Welcome to Stella</h1>
      <p className="welcome-sub">
        A soft companion for your first day. She walks with you, quietly. No pressure, no noise.
      </p>

      <div className="welcome-actions">
        <button className="pill pill-primary" onClick={onContinue}>
          Yes, shall we begin?
        </button>
        <button className="pill-ghost pill" onClick={() => alert("Stella will be here whenever you'd like to come back.")}>
          Not yet
        </button>

        <button className="api-toggle" onClick={() => setShowKey((s) => !s)}>
          {showKey ? "Hide advanced" : "Use my own API key (optional)"}
        </button>

        {showKey && (
          <div className="api-card">
            <label htmlFor="api-key-input">Anthropic API key</label>
            <input
              id="api-key-input"
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <div className="hint">
              Optional. Without a key, Stella uses the built-in Claude runtime. Your key stays in this browser only.
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

/* ----------------------- Pick Comrade ----------------------- */
function PickerScreen({ onBack, onSubmit, variant, setVariant, name, setName }) {
  const idx = STELLA_VARIANTS.findIndex((v) => v.id === variant);
  const cycle = (d) => {
    const next = (idx + d + STELLA_VARIANTS.length) % STELLA_VARIANTS.length;
    setVariant(STELLA_VARIANTS[next].id);
  };
  const v = STELLA_VARIANTS[idx];

  return (
    <div className="screen picker" data-screen-label="02 Pick Comrade">
      <div className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <IconBack />
        </button>
      </div>

      <h1 className="picker-title">Create your comrade</h1>
      <h2 className="picker-sub">Pick your character</h2>

      <div className="picker-halo-wrap">
        <button className="picker-arrow left" onClick={() => cycle(-1)} aria-label="Previous">‹</button>
        <div className="picker-halo">
          <Stella variant={v.id} size={200} mode="idle" />
        </div>
        <button className="picker-arrow right" onClick={() => cycle(1)} aria-label="Next">›</button>
      </div>

      <div className="picker-dots">
        {STELLA_VARIANTS.map((s, i) => (
          <div key={s.id} className={`dot ${i === idx ? "active" : ""}`} />
        ))}
      </div>

      <div className="picker-name">{v.name}</div>
      <div className="picker-blurb">{v.blurb}</div>

      <div style={{
        margin: "0 8px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}>
        <label style={{ fontFamily: "Indie Flower, cursive", fontSize: 18, color: "var(--navy)" }}>What can we call you?</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 24))}
          placeholder="Your name"
          style={{
            padding: "10px 16px",
            borderRadius: 999,
            border: "1px solid rgba(0, 70, 233, 0.3)",
            background: "rgba(208, 248, 255, 0.7)",
            fontFamily: "Imprima, sans-serif",
            fontSize: 16,
            color: "var(--navy)",
            outline: "none",
          }}
        />
      </div>

      <button
        className="pill pill-primary picker-submit"
        onClick={onSubmit}
        disabled={!name.trim()}
      >
        Begin
      </button>
    </div>
  );
}

/* ----------------------- Setup / Onboarding ----------------------- */
const PERM_CARDS = [
  {
    key: "camera",
    Icon: IconCam,
    title: "May she look through your camera?",
    body: "She uses the back camera as a soft window onto the world. Nothing is recorded.",
  },
  {
    key: "location",
    Icon: IconPin,
    title: "May she sense where you are?",
    body: "So she can pick out a quiet corner nearby, and read the weather of your day.",
  },
  {
    key: "motion",
    Icon: IconMotion,
    title: "May she feel how you move?",
    body: "Tilting your phone lets her gently sway in time with you. She uses this to feel present.",
  },
  {
    key: "notifications",
    Icon: IconBell,
    title: "May she whisper now and then?",
    body: "A soft tap when a friend waves, or when a quiet corner opens up. Nothing loud.",
  },
];

function SetupScreen({ variant, name, perms, setPerm, geo, setGeo, onContinue }) {
  const [weather, setWeather] = useState(null);
  const [pending, setPending] = useState({});

  // If location was previously granted, fetch the weather once on mount.
  useEffect(() => {
    if (perms.location === "granted" && geo && !weather && window.fetchWeather) {
      window.fetchWeather(geo.lat, geo.lon).then((w) => w && setWeather(w));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ask = async (key) => {
    if (pending[key]) return;
    setPending((p) => ({ ...p, [key]: true }));
    try {
      if (key === "camera") {
        const r = await Sense.requestCamera();
        setPerm("camera", r === "granted" ? "granted" : "denied");
      } else if (key === "location") {
        const r = await Sense.requestLocation();
        if (r.state === "granted") {
          setPerm("location", "granted");
          setGeo({ lat: r.lat, lon: r.lon });
          if (window.fetchWeather) {
            const w = await window.fetchWeather(r.lat, r.lon);
            if (w) setWeather(w);
          }
        } else {
          setPerm("location", "denied");
        }
      } else if (key === "motion") {
        const r = await Sense.requestMotion();
        setPerm("motion", r === "granted" ? "granted" : "denied");
      } else if (key === "notifications") {
        const r = await Sense.requestNotifications();
        setPerm("notifications", r === "granted" ? "granted" : "denied");
      }
    } finally {
      setPending((p) => ({ ...p, [key]: false }));
    }
  };

  const skip = (key) => setPerm(key, "skipped");

  const statusLabel = (s) => {
    if (s === "granted") return "✓ on";
    if (s === "denied") return "✕ not now";
    if (s === "skipped") return "skipped";
    return "Ask";
  };

  return (
    <div className="screen setup" data-screen-label="02.5 Setup">
      <div className="setup-hero">
        <div className="setup-halo">
          <Stella variant={variant} size={120} mode="idle" />
        </div>
        <h1 className="setup-title">A few soft asks before we set off.</h1>
        <p className="setup-sub">Nothing you grant is shared. You can change any of this later.</p>
      </div>

      <div className="setup-cards">
        {PERM_CARDS.map(({ key, Icon, title, body }) => {
          const state = perms[key] || "unknown";
          const isAsk = state === "unknown";
          return (
            <div key={key} className={`setup-card state-${state}`}>
              <div className="setup-icon"><Icon style={{ width: 22, height: 22 }} /></div>
              <div className="setup-text">
                <div className="setup-card-title">{title}</div>
                <div className="setup-card-body">{body}</div>
              </div>
              <div className="setup-actions">
                <button
                  className={`setup-status pill ${state === "granted" ? "ok" : state === "denied" ? "no" : state === "skipped" ? "skip" : "ask"}`}
                  onClick={() => ask(key)}
                  disabled={pending[key]}
                >
                  {pending[key] ? "…" : statusLabel(state)}
                </button>
                {isAsk && (
                  <button className="setup-skip" onClick={() => skip(key)}>skip</button>
                )}
                {!isAsk && (
                  <button className="setup-skip" onClick={() => ask(key)}>change</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="setup-weather">
        {weather ? (
          <>
            <span className="w-icon" aria-hidden="true">{weather.icon}</span>
            <span className="w-text">Stella sees the day: <b>{weather.tempC}°C · {weather.vibe}</b></span>
          </>
        ) : perms.location === "granted" ? (
          <span className="w-text">Reading the sky for you…</span>
        ) : (
          <span className="w-text">She'll learn the day once you let her see where you are.</span>
        )}
      </div>

      <button className="pill pill-primary setup-cta" onClick={onContinue}>
        We're ready
      </button>
    </div>
  );
}

/* ----------------------- AR view ----------------------- */
function ARScreen({ variant, onExit, apiKey, perms, setPerm }) {
  const videoRef = useRef(null);
  const ar3dRef = useRef(null);
  const [camState, setCamState] = useState("loading"); // loading | granted | denied | unsupported
  const [showPermAsk, setShowPermAsk] = useState(false);
  const [spotted, setSpotted] = useState(false);
  const [spotConsumed, setSpotConsumed] = useState(false);
  const [lane, setLane] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [stellaCount] = useState(() => 3 + Math.floor(Math.random() * 5));
  const [xrActive, setXrActive] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const xrSupported = Sense.useWebXR();
  const tilt = Sense.useOrientation(camState === "granted");

  // Mount the cinematic AR layer (R3F + Pose Landmarker) over the video.
  // When the URL contains ?ar3d=preview, mount even without camera so the scene
  // can be reviewed in headless previews.
  const ar3dPreview = typeof window !== "undefined" && /[?&]ar3d=preview/.test(window.location.search);
  Sense.useAR3D({
    containerRef: ar3dRef,
    videoRef,
    active: camState === "granted" || ar3dPreview,
    bypassVideo: ar3dPreview,
    mode: "companion",
    variant,
    spotted,
    onPoseStable: () => {
      setFaceCount((c) => Math.max(c, 1));
      if (!spotConsumed) {
        setSpotted(true);
        setSpotConsumed(true);
      }
    },
  });

  // Live stream — kept in state so the video element (rendered unconditionally)
  // can pick it up via a follow-up effect even if the ref wasn't ready at grant time.
  const [stream, setStream] = useState(null);

  // Start camera
  const startCamera = useCallback(async () => {
    setCamState("loading");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamState("unsupported");
      setPerm && setPerm("camera", "denied");
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(s);
      // The video element is always mounted; attach now and play. Effect below also
      // re-attaches if React hasn't flushed yet.
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play().catch(() => {});
      }
      setCamState("granted");
      setPerm && setPerm("camera", "granted");
      // iOS gyro permission must be triggered from a user gesture; the
      // permission flow that led here is a gesture, so chain it.
      Sense.requestMotion().then((r) => {
        setPerm && setPerm("motion", r === "granted" ? "granted" : "denied");
      });
    } catch (e) {
      console.warn("camera failed", e);
      setCamState("denied");
      setPerm && setPerm("camera", "denied");
    }
  }, [setPerm]);

  // Safety: attach the stream once the video element is mounted, in case the ref
  // wasn't ready inside startCamera (e.g. when toggling display:none → block).
  useEffect(() => {
    if (!stream) return;
    const v = videoRef.current;
    if (!v) return;
    if (v.srcObject !== stream) {
      v.srcObject = stream;
      v.play().catch(() => {});
    }
  }, [stream, camState]);

  useEffect(() => {
    // If user already granted camera in setup, ask again here so the prompt is
    // sticky to the actual page that needs it (Safari requires user gesture).
    setShowPermAsk(true);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const stream = videoRef.current?.srcObject;
      if (stream && stream.getTracks) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleSpot = () => {
    setSpotted(true);
    setSpotConsumed(true);
  };

  const handleCloseSheet = () => {
    setSpotted(false);
    setLane(null);
    setSuggestion(null);
  };

  const openLane = async (which) => {
    setLane(which);
    setSuggestion({ text: "", loading: true });
    try {
      const { text } = await askStella(which, apiKey);
      const cleaned = (text || "")
        .replace(/[—–]/g, ",")
        .replace(/\*/g, "")
        .replace(/^["'`]|["'`]$/g, "")
        .trim();
      setSuggestion({ text: cleaned, loading: false });
    } catch (e) {
      setSuggestion({ text: "Take a moment if you need to. The day will wait.", loading: false });
    }
  };

  const tryAnother = () => openLane(lane);

  const tryXR = async () => {
    const session = await Sense.startImmersiveAR();
    if (!session) return;
    setXrActive(true);
    session.addEventListener("end", () => setXrActive(false));
  };

  return (
    <div className="screen ar-view" data-screen-label="03 AR Scanning">
      {/* Camera (always mounted so the ref is populated before startCamera runs).
          Hidden via CSS until camState === "granted" so the fallback / preview path looks right. */}
      <video
        ref={videoRef}
        className="ar-camera"
        playsInline
        muted
        autoPlay
        style={{ display: camState === "granted" ? "block" : "none" }}
      />
      {/* Fallback campus-map background when no camera and not in preview mode */}
      {camState !== "granted" && !ar3dPreview && (
        <div className="ar-fallback-bg">
          <img
            src="assets/campus-map.png"
            alt=""
            style={{
              position: "absolute",
              top: "20%",
              left: "10%",
              width: "80%",
              opacity: 0.25,
              filter: "blur(0.5px)",
              transform: `translate(${tilt.x * 0.4}px, ${tilt.y * 0.4}px) scale(1.1)`,
              transition: "transform 0.3s ease-out",
            }}
          />
        </div>
      )}
      {/* Cinematic AR canvas (R3F + Pose Landmarker) */}
      {(camState === "granted" || ar3dPreview) && (
        <div ref={ar3dRef} className="ar3d-stage" />
      )}

      <div className="ar-grain" />
      <div className="ar-vignette" />

      {/* Static Stella fallback only when neither camera nor cinematic-preview path is active */}
      {camState !== "granted" && !ar3dPreview && !showPermAsk && (
        <div className="ar-stella-anchor" style={{ left: "50%", top: "44%" }}>
          <Stella variant={variant} size={200} mode={lane === "alone" ? "reassuring" : "idle"} tilt={tilt} />
        </div>
      )}

      {/* Status pill */}
      {!showPermAsk && (
        <div className="ar-status">
          <span className="dot" />
          {spotted ? "Stella sees them" : "Stella is gently watching"}
        </div>
      )}

      {/* Live status badge */}
      {!showPermAsk && camState === "granted" && (
        <div className="scan-badge" aria-live="polite">
          {spotted ? "she sees them" : "she is looking, gently"}
        </div>
      )}

      {/* Top right close */}
      {!showPermAsk && (
        <div className="ar-top-actions">
          <button className="icon-btn" onClick={onExit} aria-label="Exit AR">
            <IconClose />
          </button>
        </div>
      )}

      {/* WebXR pill — only when supported */}
      {!showPermAsk && xrSupported && !xrActive && (
        <button className="xr-pill" onClick={tryXR}>
          ✦ Try depth AR
        </button>
      )}

      {/* Ambient counter */}
      {!showPermAsk && !spotted && (
        <div className="ar-ambient">
          <StellaMini variant={variant} size={30} />
          <div>
            <b>{stellaCount} Stellas</b> have been right here today.
          </div>
        </div>
      )}

      {/* Spot button */}
      {!showPermAsk && !spotted && (
        <button className="ar-spot" onClick={handleSpot}>
          <span className="reticle" />
          Stella spotted them
        </button>
      )}

      {/* Permission ask */}
      {showPermAsk && (
        <div className="permission-card">
          <h3>May Stella look through your camera?</h3>
          <p>
            She uses the back camera as a soft window onto the world around you. Nothing is recorded. You can say no, and she will draw a calm sky instead.
          </p>
          <div className="actions">
            <button
              className="pill-ghost pill"
              onClick={() => {
                setShowPermAsk(false);
                setCamState("denied");
                setPerm && setPerm("camera", "denied");
              }}
            >
              Not now
            </button>
            <button
              className="pill pill-primary"
              onClick={async () => {
                setShowPermAsk(false);
                await startCamera();
              }}
            >
              Yes please
            </button>
          </div>
        </div>
      )}

      {/* Bottom sheet of lanes */}
      <div
        className={`ar-sheet ${spotted ? "open" : ""}`}
        style={{ transform: spotted ? "translate3d(0, 0, 0)" : "translate3d(0, 100%, 0)" }}
      >
        <div className="sheet-grabber" onClick={handleCloseSheet} />
        <div className="sheet-heading">She sees a small group</div>
        <div className="sheet-sub">Three quiet ways she could help, if you'd like.</div>

        <div className="lanes">
          <button className="lane find" onClick={() => openLane("find")}>
            <div className="lane-icon" style={{ background: "rgba(255,231,234,0.9)" }}>
              <IconMap />
            </div>
            <div className="lane-text">
              <div className="lane-title">Find a place</div>
              <div className="lane-hint">a spot to land near them</div>
            </div>
            <div className="lane-chevron">›</div>
          </button>

          <button className="lane talk" onClick={() => openLane("talk")}>
            <div className="lane-icon" style={{ background: "rgba(208,248,255,0.9)" }}>
              <IconChat />
            </div>
            <div className="lane-text">
              <div className="lane-title">Start a conversation</div>
              <div className="lane-hint">a soft thing you could say</div>
            </div>
            <div className="lane-chevron">›</div>
          </button>

          <button className="lane alone" onClick={() => openLane("alone")}>
            <div className="lane-icon" style={{ background: "rgba(222,252,211,0.9)" }}>
              <IconHeart />
            </div>
            <div className="lane-text">
              <div className="lane-title">You're not alone</div>
              <div className="lane-hint">a moment to breathe</div>
            </div>
            <div className="lane-chevron">›</div>
          </button>
        </div>
      </div>

      {/* Suggestion card */}
      {lane && (
        <div className={`suggestion open`}>
          <div className="tail" />
          <div className="suggestion-header">
            <span className={`suggestion-badge ${lane === "talk" ? "talk" : lane === "alone" ? "alone" : ""}`}>
              {lane === "find" ? "Find a place" : lane === "talk" ? "Conversation" : "You are not alone"}
            </span>
          </div>
          <div className="suggestion-body">
            {suggestion?.loading ? (
              <>
                <span className="shimmer" style={{ width: "85%" }} />
                <span className="shimmer" style={{ width: "60%" }} />
              </>
            ) : (
              suggestion?.text
            )}
          </div>
          <div className="suggestion-actions">
            <button className="ghost" onClick={handleCloseSheet}>
              No thanks
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ghost" onClick={tryAnother} disabled={suggestion?.loading}>
                Another?
              </button>
              <button
                className="pill pill-primary"
                style={{ fontSize: 14, padding: "8px 18px" }}
                onClick={() => {
                  setLane(null);
                  setSuggestion(null);
                  setSpotted(false);
                }}
                disabled={suggestion?.loading}
              >
                Thank you
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.WelcomeScreen = WelcomeScreen;
window.PickerScreen = PickerScreen;
window.SetupScreen = SetupScreen;
window.ARScreen = ARScreen;
