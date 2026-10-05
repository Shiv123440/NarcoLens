import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
  const { session, ready } = useSession();
  const userId = session?.user.id;
  const profile = useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, officer_id, station").eq("id", userId!).maybeSingle();
      if (error) throw new Error(error.message);
      return data as OfficerProfile | null;
    },
  });
  const name = profile.data?.full_name || session?.user.email || "";
  return { session, ready, signedIn: Boolean(session), profile: profile.data ?? null, displayName: name };
}

export function initials(name: string) {
  return name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "OF";
}
