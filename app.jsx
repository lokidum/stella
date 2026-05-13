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

function App() {
  const [stage, setStage] = usePersisted("stella.stage", "welcome");
  const [variant, setVariant] = usePersisted("stella.variant", "blob");
  const [name, setName] = usePersisted("stella.name", "Maya");
  const [status, setStatus] = usePersisted("stella.status", "social");
  const [apiKey, setApiKey] = usePersisted("stella.apiKey", "");

  const goAR = () => setStage("ar");
  const goHome = () => setStage("home");
  const goChat = () => setStage("chat");

  // Ambient floating Stella shows in non-home screens that don't already feature Stella prominently
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
          onSubmit={() => setStage("home")}
          variant={variant}
          setVariant={setVariant}
          name={name}
          setName={setName}
        />
      )}
      {stage === "home" && (
        <HomeScreen
          variant={variant}
          name={name}
          status={status}
          setStatus={setStatus}
          onNav={setStage}
          onAR={goAR}
          onChat={goChat}
        />
      )}
      {stage === "ar" && (
        <ARScreen
          variant={variant}
          apiKey={apiKey}
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
        <FindUsersScreen variant={variant} onBack={goHome} onChat={goChat} />
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
