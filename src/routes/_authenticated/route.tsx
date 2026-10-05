import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getActiveOfficer } from "@/lib/auth-service";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // 1. Check Supabase
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) return { user: data.user };
    } catch {}

    // 2. Check local officer session (allows normal login/signup without email verification)
    const localOfficer = getActiveOfficer();
    if (localOfficer) {
      return {
        user: {
          id: localOfficer.id,
          email: localOfficer.email,
          user_metadata: {
            full_name: localOfficer.full_name,
            officer_id: localOfficer.officer_id,
            station: localOfficer.station,
          },
        },
      };
    }

    throw redirect({ to: "/auth", search: { mode: "login", next: "/" } });
  },
  component: () => <Outlet />,
});
