import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getActiveOfficer, type OfficerUser } from "@/lib/auth-service";

export type OfficerProfile = { id: string; full_name: string; officer_id: string; station: string };

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
          full_name: localOfficer.full_name,
          officer_id: localOfficer.officer_id,
          station: localOfficer.station,
        };
      }
      return null;
    },
  });

  const activeProfile: OfficerProfile | null =
    profile.data ??
    (localOfficer
      ? {
          id: localOfficer.id,
          full_name: localOfficer.full_name,
          officer_id: localOfficer.officer_id,
          station: localOfficer.station,
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
