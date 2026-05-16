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
    if (editingId === id) {
      resetForm();
    }
    await refreshProfiles();
  };

  const isEditing = editingId !== null;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
        <button
          className="inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          onClick={onBack}
        >
          ← Back
        </button>
        <h2 className="flex-1 text-base font-semibold text-gray-900 dark:text-gray-100">
          Settings
        </h2>
      </div>

      {/* Body */}
      <div className="scrollbar-custom flex-1 overflow-y-auto px-5 py-5">
        <div className="flex flex-col gap-6">
          {/* Profile form */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {isEditing ? `Edit Profile — ${name}` : "Add Profile"}
            </span>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium text-gray-500 dark:text-gray-400"
                htmlFor="profile-name"
              >
                Name
              </label>
              <input
                id="profile-name"
                className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-2.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder:text-gray-500 dark:focus:border-gray-600 dark:focus:bg-gray-800"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Profile"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium text-gray-500 dark:text-gray-400"
                htmlFor="profile-url"
              >
                Base URL
              </label>
              <input
                id="profile-url"
                className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-2.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder:text-gray-500 dark:focus:border-gray-600 dark:focus:bg-gray-800"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium text-gray-500 dark:text-gray-400"
                htmlFor="profile-model"
              >
                Model
              </label>
              <input
                id="profile-model"
                className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-2.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder:text-gray-500 dark:focus:border-gray-600 dark:focus:bg-gray-800"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o-mini"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium text-gray-500 dark:text-gray-400"
                htmlFor="profile-key"
              >
                API Key
              </label>
              <input
                id="profile-key"
                className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-2.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder:text-gray-500 dark:focus:border-gray-600 dark:focus:bg-gray-800"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
            </div>

            <div className="flex gap-2">
              <button
                className="inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                onClick={handleSave}
              >
                {isEditing ? "Update Profile" : "Save Profile"}
              </button>
              {isEditing && (
                <button
                  className="inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
              <button
                className="inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
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
                className={`rounded-xl border px-4 py-2.5 text-sm ${
                  testResult.success
                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                    : "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>

          {/* Saved profiles */}
          {profiles.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Saved Profiles ({profiles.length})
              </span>
              <div className="flex flex-col gap-2">
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50"
                  >
                    <span className="flex-1 font-medium text-gray-700 dark:text-gray-200">
                      {p.name}
                    </span>
                    {p.id === activeProfileId && (
                      <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-[11px] font-medium text-white dark:bg-gray-200 dark:text-gray-800">
                        Active
                      </span>
                    )}
                    <div className="flex gap-1.5">
                      {p.id !== activeProfileId && (
                        <button
                          className="inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                          onClick={() => handleSelect(p.id)}
                        >
                          Select
                        </button>
                      )}
                      <button
                        className="inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                        onClick={() => handleEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                        onClick={() => handleDelete(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
