import { useState, useEffect } from "react";
import {
  getProfiles,
  saveProfile,
  deleteProfile,
  setActiveProfileId,
  getActiveProfileId,
  type Profile,
} from "../storage";
import { testConnection } from "../connection";

interface SettingsPanelProps {
  onBack: () => void;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function SettingsPanel({ onBack }: SettingsPanelProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(
    null,
  );
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [model, setModel] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    getProfiles().then(setProfiles);
    getActiveProfileId().then(setActiveProfileIdState);
  }, []);

  const refreshProfiles = async () => {
    setProfiles(await getProfiles());
    setActiveProfileIdState(await getActiveProfileId());
  };

  const handleSave = async () => {
    const profile: Profile = {
      id: generateId(),
      name,
      baseUrl,
      model,
      apiKey,
    };
    await saveProfile(profile);
    if ((await getActiveProfileId()) === null) {
      await setActiveProfileId(profile.id);
    }
    await refreshProfiles();
    setName("");
    setBaseUrl("https://api.openai.com/v1");
    setModel("gpt-4o-mini");
    setApiKey("");
    setTestResult(null);
  };

  const handleSelect = async (id: string) => {
    await setActiveProfileId(id);
    await refreshProfiles();
  };

  const handleDelete = async (id: string) => {
    await deleteProfile(id);
    if (activeProfileId === id) {
      await setActiveProfileId(null);
    }
    await refreshProfiles();
  };

  return (
    <div>
      <h2>Settings</h2>
      <button onClick={onBack}>Back</button>

      <div>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Base URL
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
        </label>
        <label>
          Model
          <input value={model} onChange={(e) => setModel(e.target.value)} />
        </label>
        <label>
          API Key
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </label>
        <button onClick={handleSave}>Save profile</button>
        <button
          onClick={async () => {
            setTestResult(null);
            const result = await testConnection({
              id: "",
              name,
              baseUrl,
              model,
              apiKey,
            });
            setTestResult(result);
          }}
        >
          Test connection
        </button>
        {testResult && (
          <div
            style={{
              color: testResult.success ? "green" : "red",
            }}
          >
            {testResult.message}
          </div>
        )}
      </div>

      <ul>
        {profiles.map((p) => (
          <li key={p.id}>
            {p.name} {p.id === activeProfileId ? "(active)" : ""}
            {p.id !== activeProfileId && (
              <button onClick={() => handleSelect(p.id)}>
                Select {p.name}
              </button>
            )}
            <button onClick={() => handleDelete(p.id)}>
              Delete {p.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
