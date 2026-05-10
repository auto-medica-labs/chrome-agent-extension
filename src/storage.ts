export interface Profile {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
}

const PROFILES_KEY = "profiles";
const ACTIVE_PROFILE_KEY = "activeProfileId";

export function getProfiles(): Promise<Profile[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([PROFILES_KEY], (result) => {
      resolve((result[PROFILES_KEY] as Profile[]) ?? []);
    });
  });
}

export function saveProfile(profile: Profile): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get([PROFILES_KEY], (result) => {
      const profiles = (result[PROFILES_KEY] as Profile[]) ?? [];
      const existingIndex = profiles.findIndex((p) => p.id === profile.id);
      if (existingIndex >= 0) {
        profiles[existingIndex] = profile;
      } else {
        profiles.push(profile);
      }
      chrome.storage.local.set({ [PROFILES_KEY]: profiles }, () => {
        resolve();
      });
    });
  });
}

export function deleteProfile(id: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get([PROFILES_KEY], (result) => {
      const profiles = (result[PROFILES_KEY] as Profile[]) ?? [];
      const filtered = profiles.filter((p) => p.id !== id);
      chrome.storage.local.set({ [PROFILES_KEY]: filtered }, () => {
        resolve();
      });
    });
  });
}

export function getActiveProfileId(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([ACTIVE_PROFILE_KEY], (result) => {
      resolve((result[ACTIVE_PROFILE_KEY] as string) ?? null);
    });
  });
}

export function setActiveProfileId(id: string | null): Promise<void> {
  return new Promise((resolve) => {
    if (id === null) {
      chrome.storage.local.remove(ACTIVE_PROFILE_KEY, () => {
        resolve();
      });
    } else {
      chrome.storage.local.set({ [ACTIVE_PROFILE_KEY]: id }, () => {
        resolve();
      });
    }
  });
}

export async function getActiveProfile(): Promise<Profile | null> {
  const id = await getActiveProfileId();
  if (!id) return null;
  const profiles = await getProfiles();
  return profiles.find((p) => p.id === id) ?? null;
}
