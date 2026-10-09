import { supabase } from "@/integrations/supabase/client";

export interface OfficerUser {
  id: string;
  email: string;
  full_name: string;
  officer_id: string;
  station: string;
  created_at: string;
  phone?: string;
  department?: string;
  rank?: string;
  avatar_url?: string;
  verified?: boolean;
  verified_at?: string;
  verified_by?: string;
  two_factor_enabled?: boolean;
  badge_id?: string;
  device_id?: string;
  district?: string;
  speak_aloud?: boolean;
  language?: "en" | "hi";
}

export interface StoredOfficer extends OfficerUser {
  passwordHash: string;
}

const ACTIVE_OFFICER_KEY = "drugshield_active_officer";
const REGISTERED_OFFICERS_KEY = "drugshield_registered_officers";

function hashPassword(pw: string): string {
  // Simple deterministic encoding for client credential comparison
  return btoa(unescape(encodeURIComponent(pw)));
}

export function unhashPassword(encoded: string): string {
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    return "";
  }
}

export interface SavedCredential {
  email: string;
  username: string;
  password?: string | undefined;
  lastUsed: string;
}

const SAVED_CREDENTIALS_KEY = "narcolens_saved_credentials";

export function getSavedCredentials(): SavedCredential[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_CREDENTIALS_KEY);
    return raw ? (JSON.parse(raw) as SavedCredential[]) : [];
  } catch {
    return [];
  }
}

export function saveCredentialForSuggestion(email: string, username?: string, rawPassword?: string): void {
  if (typeof window === "undefined" || !email) return;
  const list = getSavedCredentials();
  const cleanEmail = email.trim();
  const existingIdx = list.findIndex((c) => c.email.toLowerCase() === cleanEmail.toLowerCase());
  const existing = existingIdx >= 0 ? list[existingIdx] : undefined;

  const entry: SavedCredential = {
    email: cleanEmail,
    username: username || cleanEmail.split("@")[0] || "Officer",
    password: rawPassword ? hashPassword(rawPassword) : existing?.password,
    lastUsed: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    list[existingIdx] = entry;
  } else {
    list.unshift(entry);
  }
  localStorage.setItem(SAVED_CREDENTIALS_KEY, JSON.stringify(list.slice(0, 5)));
}

export function getActiveOfficer(): OfficerUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_OFFICER_KEY);
    return raw ? (JSON.parse(raw) as OfficerUser) : null;
  } catch {
    return null;
  }
}

export function setActiveOfficer(officer: OfficerUser | null): void {
  if (typeof window === "undefined") return;
  if (officer) {
    localStorage.setItem(ACTIVE_OFFICER_KEY, JSON.stringify(officer));
  } else {
    localStorage.removeItem(ACTIVE_OFFICER_KEY);
  }
  window.dispatchEvent(new Event("drugshield-auth-changed"));
}

export function getRegisteredOfficers(): StoredOfficer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REGISTERED_OFFICERS_KEY);
    return raw ? (JSON.parse(raw) as StoredOfficer[]) : [];
  } catch {
    return [];
  }
}

export function saveRegisteredOfficer(officer: StoredOfficer): void {
  if (typeof window === "undefined") return;
  const list = getRegisteredOfficers();
  const index = list.findIndex((o) => o.email.toLowerCase() === officer.email.toLowerCase());
  if (index >= 0) {
    list[index] = officer;
  } else {
    list.push(officer);
  }
  localStorage.setItem(REGISTERED_OFFICERS_KEY, JSON.stringify(list));
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one uppercase letter (A-Z)." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one lowercase letter (a-z)." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number (0-9)." };
  }
  return { valid: true };
}

export async function signUpOfficer({
  fullName,
  officerId,
  station,
  email,
  password,
  autoSignIn = false,
}: {
  fullName: string;
  officerId: string;
  station: string;
  email: string;
  password: string;
  autoSignIn?: boolean;
}): Promise<{ success: boolean; error?: string; officer?: OfficerUser }> {
  // Validate password rules (at least 8 chars, 1 uppercase, 1 lowercase, 1 number)
  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) {
    return { success: false, error: pwCheck.error || "Password requirement not met." };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim();
  const cleanOfficerId = officerId.trim().toUpperCase();

  // 1. Create locally generated ID
  const localId = `off_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const officerUser: OfficerUser = {
    id: localId,
    email: cleanEmail,
    full_name: cleanName,
    officer_id: cleanOfficerId,
    station: station.trim() || "Delhi Zonal Unit",
    created_at: new Date().toISOString(),
  };

  // 2. Save to local store so login always works without email verification
  saveRegisteredOfficer({
    ...officerUser,
    passwordHash: hashPassword(password),
  });

  // 3. Attempt Supabase Auth in background (cloud sync)
  try {
    const { data } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        ...(typeof window !== "undefined" ? { emailRedirectTo: window.location.origin } : {}),
        data: {
          full_name: cleanName,
          officer_id: cleanOfficerId,
          station: station.trim(),
        },
      },
    });

    if (data?.user?.id) {
      officerUser.id = data.user.id;
      // Update with Supabase UUID if available
      saveRegisteredOfficer({
        ...officerUser,
        passwordHash: hashPassword(password),
      });
    }
  } catch {
    // If Supabase has network issues or errors, local registration still proceeds
  }

  // 4. Log in immediately only if explicitly requested
  if (autoSignIn) {
    setActiveOfficer(officerUser);
  }
  return { success: true, officer: officerUser };
}

export async function signInOfficer({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string; officer?: OfficerUser }> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Attempt Supabase Auth first
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (!error && data?.session && data?.user) {
      const meta = data.user.user_metadata as Record<string, any> | undefined;
      let profileData = {
        full_name: (meta?.["full_name"] as string) || cleanEmail,
        officer_id: (meta?.["officer_id"] as string) || "OFFICER",
        station: (meta?.["station"] as string) || "Delhi Zonal Unit",
      };

      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, officer_id, station")
          .eq("id", data.user.id)
          .maybeSingle();
        if (prof) {
          profileData = {
            full_name: prof.full_name || profileData.full_name,
            officer_id: prof.officer_id || profileData.officer_id,
            station: prof.station || profileData.station,
          };
        }
      } catch {}

      const officerUser: OfficerUser = {
        id: data.user.id,
        email: cleanEmail,
        full_name: profileData.full_name,
        officer_id: profileData.officer_id,
        station: profileData.station,
        created_at: data.user.created_at,
      };

      setActiveOfficer(officerUser);
      saveRegisteredOfficer({
        ...officerUser,
        passwordHash: hashPassword(password),
      });
      saveCredentialForSuggestion(cleanEmail, officerUser.full_name, password);

      return { success: true, officer: officerUser };
    }
  } catch {}

  // 2. Fallback to registered officer store (supports email, username, or officer ID)
  const officers = getRegisteredOfficers();
  const matched = officers.find(
    (o) =>
      o.email.toLowerCase() === cleanEmail ||
      o.full_name.toLowerCase() === cleanEmail ||
      o.officer_id.toLowerCase() === cleanEmail
  );

  if (matched && (matched.passwordHash === hashPassword(password) || matched.passwordHash === password)) {
    const officerUser: OfficerUser = {
      id: matched.id,
      email: matched.email,
      full_name: matched.full_name,
      officer_id: matched.officer_id,
      station: matched.station,
      created_at: matched.created_at,
    };
    setActiveOfficer(officerUser);
    saveCredentialForSuggestion(officerUser.email, officerUser.full_name, password);
    return { success: true, officer: officerUser };
  }

  return { success: false, error: "Username/Email or password is incorrect." };
}

export async function signInWithGoogle(redirectTo?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const redirectUrl = redirectTo ? `${origin}${redirectTo}` : `${origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || "Failed to initialize Google Sign In" };
  }
}

export async function signOutOfficer(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {}
  setActiveOfficer(null);
}

export function updateActiveOfficerProfile(updates: Partial<OfficerUser>): OfficerUser {
  const current = getActiveOfficer() || {
    id: `off_${Date.now()}`,
    email: "officer@ncb.gov.in",
    full_name: "Insp. Rajesh Kumar",
    officer_id: "NCB-DEL-4082",
    badge_id: "NCB-DEL-4082",
    device_id: "FIELD-UNIT-07",
    district: "New Delhi, Delhi",
    station: "Delhi Zonal Unit",
    department: "NCB · Delhi Zonal Unit",
    rank: "Inspector",
    created_at: new Date().toISOString(),
    verified: true,
    verified_at: "2026-01-15T09:30:00Z",
    verified_by: "NCB Directorate HQ, New Delhi",
    speak_aloud: true,
    language: "en" as const,
  };

  const updated: OfficerUser = {
    ...current,
    ...updates,
    id: current.id,
    officer_id: updates.officer_id !== undefined ? updates.officer_id : current.officer_id,
    badge_id: updates.badge_id !== undefined ? updates.badge_id : (current.badge_id || current.officer_id),
    device_id: updates.device_id !== undefined ? updates.device_id : (current.device_id || "FIELD-UNIT-07"),
    district: updates.district !== undefined ? updates.district : (current.district || current.station || "New Delhi, Delhi"),
    speak_aloud: updates.speak_aloud !== undefined ? updates.speak_aloud : (current.speak_aloud ?? true),
    language: updates.language !== undefined ? updates.language : (current.language || "en"),
  };

  setActiveOfficer(updated);

  // Update in registered officers list if present
  const registered = getRegisteredOfficers();
  const idx = registered.findIndex((o) => o.id === updated.id || o.email.toLowerCase() === updated.email.toLowerCase());
  if (idx >= 0) {
    const existing = registered[idx];
    if (existing) {
      registered[idx] = {
        ...existing,
        ...updated,
        passwordHash: existing.passwordHash,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(REGISTERED_OFFICERS_KEY, JSON.stringify(registered));
      }
    }
  }

  // Sync with Supabase Auth metadata in background if possible
  try {
    void supabase.auth.updateUser({
      data: {
        full_name: updated.full_name,
        officer_id: updated.officer_id,
        station: updated.station,
        phone: updated.phone,
        department: updated.department,
        avatar_url: updated.avatar_url,
        badge_id: updated.badge_id,
        device_id: updated.device_id,
        district: updated.district,
        speak_aloud: updated.speak_aloud,
        language: updated.language,
      },
    });
  } catch {}

  return updated;
}

export function changeOfficerPassword(newPassword: string): { success: boolean; error?: string } {
  const pwCheck = validatePassword(newPassword);
  if (!pwCheck.valid) return { success: false, error: pwCheck.error || "Invalid password." };

  const current = getActiveOfficer();
  if (!current) return { success: false, error: "No active officer found." };

  const registered = getRegisteredOfficers();
  const idx = registered.findIndex((o) => o.id === current.id || o.email.toLowerCase() === current.email.toLowerCase());
  if (idx >= 0 && registered[idx]) {
    registered[idx]!.passwordHash = hashPassword(newPassword);
    if (typeof window !== "undefined") {
      localStorage.setItem(REGISTERED_OFFICERS_KEY, JSON.stringify(registered));
    }
  }

  try {
    void supabase.auth.updateUser({ password: newPassword });
  } catch {}

  return { success: true };
}

