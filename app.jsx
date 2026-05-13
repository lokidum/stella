// Stella — root app + state machine for the expanded prototype
const { useState, useEffect } = React;

function usePersisted(key, initial) {
  const [v, setV] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      return JSON.parse(raw);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key, v]);
  return [v, setV];
}

const DEFAULT_PERMS = { camera: "unknown", location: "unknown", motion: "unknown", notifications: "unknown" };

function App() {
  const [stage, setStage] = usePersisted("stella.stage", "welcome");
  const [variant, setVariant] = usePersisted("stella.variant", "blob");
  const [name, setName] = usePersisted("stella.name", "Maya");
  const [status, setStatus] = usePersisted("stella.status", "social");
  const [apiKey, setApiKey] = usePersisted("stella.apiKey", "");
  const [perms, setPerms] = usePersisted("stella.perms", DEFAULT_PERMS);
  const [setupDone, setSetupDone] = usePersisted("stella.setupDone", false);
  const [geo, setGeo] = usePersisted("stella.geo", null); // { lat, lon } or null

  const setPerm = (key, value) => setPerms((p) => ({ ...(p || DEFAULT_PERMS), [key]: value }));

  // First-run: if user finished picker but not setup, route to setup.
  // Returning users skip setup entirely.
  const goAfterPicker = () => setStage(setupDone ? "home" : "setup");
  const finishSetup = () => { setSetupDone(true); setStage("home"); };

  const goAR = () => setStage("ar");
  const goHome = () => setStage("home");
  const goChat = () => setStage("chat");
  const goSetup = () => setStage("setup");

  const showAmbient = ["map", "zone"].includes(stage);
  const showDock = ["home", "map", "chat", "zone"].includes(stage);

  return (
    <div className="phone-shell">
      {stage === "welcome" && (
        <WelcomeScreen
          onContinue={() => setStage("picker")}
          apiKey={apiKey}
          setApiKey={setApiKey}
        />
      )}
      {stage === "picker" && (
        <PickerScreen
          onBack={() => setStage("welcome")}
          onSubmit={goAfterPicker}
          variant={variant}
          setVariant={setVariant}
          name={name}
          setName={setName}
        />
      )}
      {stage === "setup" && (
        <SetupScreen
          variant={variant}
          name={name}
          perms={perms || DEFAULT_PERMS}
          setPerm={setPerm}
          geo={geo}
          setGeo={setGeo}
          onContinue={finishSetup}
        />
      )}
      {stage === "home" && (
        <HomeScreen
          variant={variant}
          name={name}
          status={status}
          setStatus={setStatus}
          perms={perms || DEFAULT_PERMS}
          geo={geo}
          onNav={setStage}
          onAR={goAR}
          onChat={goChat}
          onOpenSetup={goSetup}
        />
      )}
      {stage === "ar" && (
        <ARScreen
          variant={variant}
          apiKey={apiKey}
          perms={perms || DEFAULT_PERMS}
          setPerm={setPerm}
          onExit={goHome}
        />
      )}
      {stage === "zone" && (
        <ZoneScreen variant={variant} onBack={goHome} />
      )}
      {stage === "map" && (
        <MapScreen variant={variant} onBack={goHome} onAR={goAR} onFindUsers={() => setStage("findusers")} />
      )}
      {stage === "findusers" && (
        <FindUsersScreen variant={variant} perms={perms || DEFAULT_PERMS} setPerm={setPerm} onBack={goHome} onChat={goChat} />
      )}
      {stage === "chat" && (
        <ChatScreen variant={variant} name={name} apiKey={apiKey} onBack={goHome} />
      )}

      {showAmbient && <AmbientStella variant={variant} onClick={goChat} />}
      {showDock && (
        <Dock
          active={stage}
          onNav={setStage}
          onAR={goAR}
        />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
