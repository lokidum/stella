// Screens for the Stella prototype
const { useEffect, useRef, useState, useCallback } = React;

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

/* ----------------------- AR view ----------------------- */
function ARScreen({ variant, onExit, apiKey }) {
  const videoRef = useRef(null);
  const [camState, setCamState] = useState("loading"); // loading | granted | denied | unsupported
  const [showPermAsk, setShowPermAsk] = useState(false);
  const [spotted, setSpotted] = useState(false);
  const [lane, setLane] = useState(null); // null | find | talk | alone
  const [suggestion, setSuggestion] = useState(null); // { text, loading }
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [stellaCount] = useState(() => 3 + Math.floor(Math.random() * 5));

  // Start camera
  const startCamera = useCallback(async () => {
    setCamState("loading");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamState("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamState("granted");
    } catch (e) {
      console.warn("camera failed", e);
      setCamState("denied");
    }
  }, []);

  // Show permission ask card on mount; user taps to grant
  useEffect(() => {
    setShowPermAsk(true);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const stream = videoRef.current?.srcObject;
      if (stream && stream.getTracks) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Gyroscope tilt
  useEffect(() => {
    const onOri = (e) => {
      // gamma = left/right [-90,90], beta = front/back [-180,180]
      const g = (e.gamma || 0) / 90;
      const b = ((e.beta || 0) - 60) / 90; // bias toward holding phone up
      setTilt({
        x: Math.max(-22, Math.min(22, g * 22)),
        y: Math.max(-14, Math.min(14, b * 14)),
      });
    };
    window.addEventListener("deviceorientation", onOri);
    return () => window.removeEventListener("deviceorientation", onOri);
  }, []);

  // When user taps "Stella spotted them"
  const handleSpot = () => {
    setSpotted(true);
  };

  const handleCloseSheet = () => {
    setSpotted(false);
    setLane(null);
    setSuggestion(null);
  };

  // Open a lane → fetch suggestion
  const openLane = async (which) => {
    setLane(which);
    setSuggestion({ text: "", loading: true });
    try {
      const { text } = await askStella(which, apiKey);
      // Strip any em dashes or formatting in case the model slipped
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

  const stellaMode = spotted && !suggestion ? "spotted" : lane === "alone" ? "reassuring" : lane ? "listening" : "idle";

  return (
    <div className="screen ar-view" data-screen-label="03 AR Scanning">
      {/* Camera or fallback */}
      {camState === "granted" ? (
        <video ref={videoRef} className="ar-camera" playsInline muted autoPlay />
      ) : (
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
      <div className="ar-grain" />
      <div className="ar-vignette" />

      {/* Stella overlay */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: spotted ? "32%" : "44%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
          transition: "top 0.5s ease",
        }}
      >
        <Stella variant={variant} size={spotted ? 150 : 200} mode={stellaMode} tilt={tilt} />
      </div>

      {/* Status pill */}
      {!showPermAsk && (
        <div className="ar-status">
          <span className="dot" />
          {spotted ? "Stella sees them" : "Stella is gently watching"}
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
window.ARScreen = ARScreen;
