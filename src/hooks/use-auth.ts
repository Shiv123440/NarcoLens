import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getActiveOfficer, type OfficerUser } from "@/lib/auth-service";

export type OfficerProfile = {
  id: string;
  email?: string | undefined;
  full_name: string;
  officer_id: string;
  station: string;
  phone?: string | undefined;
  department?: string | undefined;
  rank?: string | undefined;
  avatar_url?: string | undefined;
  verified?: boolean | undefined;
  verified_at?: string | undefined;
  verified_by?: string | undefined;
  created_at?: string | undefined;
  badge_id?: string | undefined;
  device_id?: string | undefined;
  district?: string | undefined;
  speak_aloud?: boolean | undefined;
  language?: ("en" | "hi") | undefined;
};

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); setReady(true); });
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { session, ready };
}

export function useOfficer() {
  const { session, ready: sessionReady } = useSession();
  const [localOfficer, setLocalOfficer] = useState<OfficerUser | null>(() => getActiveOfficer());

  useEffect(() => {
    const handleAuthChange = () => setLocalOfficer(getActiveOfficer());
    window.addEventListener("drugshield-auth-changed", handleAuthChange);
    return () => window.removeEventListener("drugshield-auth-changed", handleAuthChange);
  }, []);

  const userId = session?.user.id || localOfficer?.id;

  const profile = useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (session?.user.id) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, officer_id, station")
            .eq("id", session.user.id)
            .maybeSingle();
          if (data) return data as OfficerProfile;
        } catch {}
      }
      if (localOfficer) {
        return {
          id: localOfficer.id,
          email: localOfficer.email,
          full_name: localOfficer.full_name,
          officer_id: localOfficer.officer_id,
          station: localOfficer.station,
          phone: localOfficer.phone,
          department: localOfficer.department,
          rank: localOfficer.rank,
          avatar_url: localOfficer.avatar_url,
          verified: localOfficer.verified,
          verified_at: localOfficer.verified_at,
          verified_by: localOfficer.verified_by,
          created_at: localOfficer.created_at,
          badge_id: localOfficer.badge_id,
          device_id: localOfficer.device_id,
          district: localOfficer.district,
          speak_aloud: localOfficer.speak_aloud,
          language: localOfficer.language,
        };
      }
      return null;
    },
  });

  const activeProfile: OfficerProfile | null = localOfficer
    ? {
        id: localOfficer.id,
        email: localOfficer.email,
        full_name: localOfficer.full_name || "Insp. Rajesh Kumar",
        officer_id: localOfficer.officer_id || "NCB-DEL-4082",
        station: localOfficer.station || "Delhi Zonal Unit",
        phone: localOfficer.phone,
        department: localOfficer.department || "NCB · Delhi Zonal Unit",
        rank: localOfficer.rank || "Inspector",
        avatar_url: localOfficer.avatar_url,
        verified: localOfficer.verified ?? true,
        verified_at: localOfficer.verified_at || "2026-01-15T09:30:00Z",
        verified_by: localOfficer.verified_by || "NCB Directorate HQ, New Delhi",
        created_at: localOfficer.created_at,
        badge_id: localOfficer.badge_id || localOfficer.officer_id || "NCB-DEL-4082",
        device_id: localOfficer.device_id || "FIELD-UNIT-07",
        district: localOfficer.district || localOfficer.station || "New Delhi, Delhi",
        speak_aloud: localOfficer.speak_aloud ?? true,
        language: localOfficer.language || "en",
      }
    : profile.data ??
      (() => {
        if (!session?.user) return null;
        const meta = session.user.user_metadata as Record<string, any> | undefined;
        return {
          id: session.user.id,
          email: session.user.email || "",
          full_name: (meta?.["full_name"] as string) || session.user.email || "Insp. Rajesh Kumar",
          officer_id: (meta?.["officer_id"] as string) || "NCB-DEL-4082",
          station: (meta?.["station"] as string) || "Delhi Zonal Unit",
          phone: meta?.["phone"] as string | undefined,
          department: (meta?.["department"] as string) || "NCB · Delhi Zonal Unit",
          rank: (meta?.["rank"] as string) || "Inspector",
          avatar_url: meta?.["avatar_url"] as string | undefined,
          verified: true,
          verified_at: "2026-01-15T09:30:00Z",
          verified_by: "NCB Directorate HQ, New Delhi",
          created_at: session.user.created_at,
          badge_id: (meta?.["badge_id"] as string) || (meta?.["officer_id"] as string) || "NCB-DEL-4082",
          device_id: (meta?.["device_id"] as string) || "FIELD-UNIT-07",
          district: (meta?.["district"] as string) || "New Delhi, Delhi",
          speak_aloud: (meta?.["speak_aloud"] as boolean) ?? true,
          language: (meta?.["language"] as "en" | "hi") || "en",
        };
      })();

  const signedIn = Boolean(session || localOfficer);
  const displayName = activeProfile?.full_name || session?.user.email || localOfficer?.email || "";

  return {
    session,
    ready: sessionReady || Boolean(localOfficer),
    signedIn,
    profile: activeProfile,
    displayName,
  };
}

export function initials(name: string) {
  const clean = name.replace(/^(insp|si|asi|dsp|sp|officer)\.?\s+/i, "");
  return (
    clean
      .split(/[\s@.]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("") || "RK"
  );
}
