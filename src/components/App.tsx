import { useState, useEffect } from "react";
import { getProfiles, getActiveProfile, type Profile } from "../storage";
import { useTheme } from "../useTheme";
import { SettingsPanel } from "./SettingsPanel";
import { ChatPanel } from "./ChatPanel";

export function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    getProfiles()
      .then(setProfiles)
      .catch(() => setError("Could not access storage."));
    getActiveProfile()
      .then(setActiveProfile)
      .catch(() => setError("Could not access storage."));
  }, []);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-red-600 dark:text-red-400">
        Error: {error}
      </div>
    );
  }

  if (profiles === null) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        Loading...
      </div>
    );
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
      <div className="flex h-full flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="select-none text-2xl font-semibold text-gray-900 dark:text-gray-100">
          AI Chat
        </div>
        <p className="max-w-72 text-sm text-gray-500 dark:text-gray-400">
          Welcome! Please configure your API settings to get started.
        </p>
        <button
          className="inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          onClick={() => setShowSettings(true)}
        >
          Open Settings
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white dark:bg-gray-900">
      {/* Top-right action buttons */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 flex items-center gap-1 p-4">
        <button
          className="pointer-events-auto inline-flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-sm text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
        <button
          className="pointer-events-auto inline-flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-sm text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          onClick={() => setShowSettings(true)}
          aria-label="Settings"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>

      {activeProfile && <ChatPanel profile={activeProfile} />}
    </div>
  );
}
