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

function emptyForm() {
  return {
    name: "",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    apiKey: "",
  };
}

export function SettingsPanel({ onBack }: SettingsPanelProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const resetForm = () => {
    setEditingId(null);
    const f = emptyForm();
    setName(f.name);
    setBaseUrl(f.baseUrl);
    setModel(f.model);
    setApiKey(f.apiKey);
    setTestResult(null);
  };

  const handleEdit = (profile: Profile) => {
    setEditingId(profile.id);
    setName(profile.name);
    setBaseUrl(profile.baseUrl);
    setModel(profile.model);
    setApiKey(profile.apiKey);
    setTestResult(null);
  };

  const handleSave = async () => {
    const profile: Profile = {
      id: editingId ?? generateId(),
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
    resetForm();
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
    // If the deleted profile was being edited, reset the form
    if (editingId === id) {
      resetForm();
    }
    await refreshProfiles();
  };

  const isEditing = editingId !== null;

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <button className="btn btn-small" onClick={onBack}>
          ← Back
        </button>
        <h2>Settings</h2>
      </div>

      <div className="settings-body">
        <div className="settings-section">
          <span className="settings-section-title">
            {isEditing ? `Edit Profile — ${name}` : "Add Profile"}
          </span>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-name">Name</label>
            <input
              id="profile-name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Profile"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-url">Base URL</label>
            <input
              id="profile-url"
              className="form-input"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-model">Model</label>
            <input
              id="profile-model"
              className="form-input"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o-mini"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-key">API Key</label>
            <input
              id="profile-key"
              className="form-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </div>
          <div className="form-row">
            <button className="btn btn-primary" onClick={handleSave}>
              {isEditing ? "Update Profile" : "Save Profile"}
            </button>
            {isEditing && (
              <button className="btn" onClick={resetForm}>
                Cancel
              </button>
            )}
            <button
              className="btn"
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
              Test Connection
            </button>
          </div>
          {testResult && (
            <div
              className={`test-result ${
                testResult.success ? "test-result-success" : "test-result-error"
              }`}
            >
              {testResult.message}
            </div>
          )}
        </div>

        {profiles.length > 0 && (
          <div className="settings-section">
            <span className="settings-section-title">
              Saved Profiles ({profiles.length})
            </span>
            <ul className="profile-list">
              {profiles.map((p) => (
                <li key={p.id} className="profile-item">
                  <span className="profile-item-name">{p.name}</span>
                  {p.id === activeProfileId && (
                    <span className="profile-item-badge profile-item-badge--active">
                      Active
                    </span>
                  )}
                  <div className="profile-item-actions">
                    {p.id !== activeProfileId && (
                      <button
                        className="btn btn-small"
                        onClick={() => handleSelect(p.id)}
                      >
                        Select
                      </button>
                    )}
                    <button
                      className="btn btn-small"
                      onClick={() => handleEdit(p)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(p.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
