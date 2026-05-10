export interface Profile {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
}

const PROFILES_KEY = "profiles";

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
