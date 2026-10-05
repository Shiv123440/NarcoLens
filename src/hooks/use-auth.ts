import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getActiveOfficer, type OfficerUser } from "@/lib/auth-service";

export type OfficerProfile = {
  id: string;
  email?: string;
  full_name: string;
  officer_id: string;
  station: string;
  phone?: string;
  department?: string;
  rank?: string;
  avatar_url?: string;
  verified?: boolean;
  verified_at?: string;
  verified_by?: string;
  created_at?: string;
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
        };
      }
      return null;
    },
  });

  const activeProfile: OfficerProfile | null = localOfficer
    ? {
        id: localOfficer.id,
        email: localOfficer.email,
        full_name: localOfficer.full_name,
        officer_id: localOfficer.officer_id,
        station: localOfficer.station,
        phone: localOfficer.phone,
        department: localOfficer.department || "Narcotics Control Bureau (NCB)",
        rank: localOfficer.rank || "Field Forensic Investigator",
        avatar_url: localOfficer.avatar_url,
        verified: localOfficer.verified ?? true,
        verified_at: localOfficer.verified_at || "2026-01-15T09:30:00Z",
        verified_by: localOfficer.verified_by || "NCB Directorate HQ, New Delhi",
        created_at: localOfficer.created_at,
      }
    : profile.data ??
      (session?.user
        ? {
            id: session.user.id,
            email: session.user.email || "",
            full_name: (session.user.user_metadata?.full_name as string) || session.user.email || "Officer",
            officer_id: (session.user.user_metadata?.officer_id as string) || "7864555",
            station: (session.user.user_metadata?.station as string) || "Delhi Zonal Unit",
            phone: session.user.user_metadata?.phone as string | undefined,
            department: (session.user.user_metadata?.department as string) || "Narcotics Control Bureau (NCB)",
            rank: (session.user.user_metadata?.rank as string) || "Field Forensic Investigator",
            avatar_url: session.user.user_metadata?.avatar_url as string | undefined,
            verified: true,
            verified_at: "2026-01-15T09:30:00Z",
            verified_by: "NCB Directorate HQ, New Delhi",
            created_at: session.user.created_at,
          }
        : null);

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
  return name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "OF";
}
