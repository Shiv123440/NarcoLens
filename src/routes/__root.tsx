import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, useCallback, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { supabase } from "@/integrations/supabase/client";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { NarcoLensSplash } from "@/components/NarcoLensSplash";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="app-kicker">NarcoLens</p>
        <h1 className="mt-3 text-6xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-sm text-muted-foreground">This field unit page does not exist.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Return to dashboard</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="app-kicker">FIELD UNIT NOTICE</p>
        <h1 className="mt-3 text-xl font-semibold text-foreground">This page could not load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or return to the officer dashboard.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Try again</button>
          <Link to="/" className="rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold text-foreground">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "NarcoLens · Narcotics Control Bureau" },
      { name: "application-name", content: "NarcoLens" },
      { name: "apple-mobile-web-app-title", content: "NarcoLens" },
      { name: "description", content: "Offline-first presumptive field testing and chain-of-custody records for NCB officers." },
      { property: "og:title", content: "NarcoLens · Narcotics Control Bureau" },
      { property: "og:description", content: "Offline-first presumptive field testing and chain-of-custody records for NCB officers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "NarcoLens · Narcotics Control Bureau" },
      { name: "twitter:description", content: "Offline-first presumptive field testing and chain-of-custody records for NCB officers." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/narcolens-logo.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/narcolens-logo.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Work+Sans:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return <html lang="en"><head><HeadContent /></head><body>{children}<Scripts /></body></html>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      void router.invalidate();
      if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-right" />
      {showSplash && (
        <NarcoLensSplash onComplete={handleSplashComplete} />
      )}
    </QueryClientProvider>
  );
}

