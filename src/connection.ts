import type { Profile } from "./storage";

export async function testConnection(
  profile: Profile,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${profile.baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${profile.apiKey}`,
      },
    });
    if (response.ok) {
      return { success: true, message: "Connection successful" };
    } else if (response.status === 401) {
      return { success: false, message: "Invalid API key" };
    } else if (response.status === 429) {
      return { success: false, message: "Rate limited — retry later." };
    } else if (response.status >= 500) {
      return { success: false, message: "Server error — retry later." };
    } else {
      return {
        success: false,
        message: `Could not reach the API (HTTP ${response.status})`,
      };
    }
  } catch {
    return { success: false, message: "Could not reach the API" };
  }
}
