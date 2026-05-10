import { useState, useEffect } from "react";
import { getProfiles, type Profile } from "../storage";

export function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfiles()
      .then(setProfiles)
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
      <div>
        <h2>Settings</h2>
        <button onClick={() => setShowSettings(false)}>Back</button>
      </div>
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

  return <div>Chat</div>;
}
