import { useState, useEffect } from "react";
import { getProfiles, getActiveProfile, type Profile } from "../storage";
import { SettingsPanel } from "./SettingsPanel";
import { ChatPanel } from "./ChatPanel";

export function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfiles()
      .then(setProfiles)
      .catch(() => setError("Could not access storage."));
    getActiveProfile()
      .then(setActiveProfile)
      .catch(() => setError("Could not access storage."));
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (profiles === null) {
    return <div>Loading...</div>;
  }

  const hasProfile = profiles.length > 0;

  if (showSettings) {
    return (
      <SettingsPanel
        onBack={async () => {
          setShowSettings(false);
          setProfiles(await getProfiles());
          setActiveProfile(await getActiveProfile());
        }}
      />
    );
  }

  if (!hasProfile) {
    return (
      <div>
        <p>Welcome! Please configure your API settings to get started.</p>
        <button onClick={() => setShowSettings(true)}>Open Settings</button>
      </div>
    );
  }

  return (
    <div>
      <div>
        Chat {activeProfile ? `— ${activeProfile.name}` : ""}
        <button onClick={() => setShowSettings(true)}>Open Settings</button>
      </div>
      {activeProfile && <ChatPanel profile={activeProfile} />}
    </div>
  );
}
