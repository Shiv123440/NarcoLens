import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  signInWithGoogle,
  signInOfficer,
  getSavedCredentials,
  getRegisteredOfficers,
  DEFAULT_DEMO_OFFICER,
  DEFAULT_DEMO_CREDENTIAL,
} from "@/lib/auth-service";
import { supabase } from "@/integrations/supabase/client";

describe("NarcoLens Auth Service & Resilience Flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("defines default demo officer and demo credentials", () => {
    expect(DEFAULT_DEMO_CREDENTIAL.email).toBe("officer@ncb.gov.in");
    expect(DEFAULT_DEMO_OFFICER.email).toBe("officer@ncb.gov.in");
    expect(DEFAULT_DEMO_OFFICER.full_name).toBe("Insp. Rajesh Kumar");
  });

  it("authenticates default demo officer Insp. Rajesh Kumar successfully", async () => {
    const res = await signInOfficer({
      email: "officer@ncb.gov.in",
      password: "Officer@123",
    });

    expect(res.success).toBe(true);
    expect(res.officer).toBeDefined();
    expect(res.officer?.full_name).toBe("Insp. Rajesh Kumar");
  });

  it("catches Unsupported Provider 400 when Google OAuth is disabled without crashing", async () => {
    // Mock Supabase signInWithOAuth returning an authorization URL
    vi.spyOn(supabase.auth, "signInWithOAuth").mockResolvedValueOnce({
      data: {
        provider: "google",
        url: "https://mock.supabase.co/auth/v1/authorize?provider=google",
      },
      error: null,
    } as any);

    // Mock global fetch returning 400 unsupported provider
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      status: 400,
      json: async () => ({
        code: 400,
        error_code: "validation_failed",
        msg: "Unsupported provider: provider is not enabled",
      }),
    } as any);

    const result = await signInWithGoogle("/scan");
    expect(result.success).toBe(false);
    expect(result.providerDisabled).toBe(true);
    expect(result.error).toContain("Google Sign-In is not enabled on this Supabase project");
  });

  it("handles OAuth errors directly from Supabase client gracefully", async () => {
    vi.spyOn(supabase.auth, "signInWithOAuth").mockResolvedValueOnce({
      data: { provider: "google", url: null },
      error: {
        message: "Unsupported provider: provider is not enabled",
        name: "AuthApiError",
        status: 400,
      },
    } as any);

    const result = await signInWithGoogle("/");
    expect(result.success).toBe(false);
    expect(result.providerDisabled).toBe(true);
    expect(result.error).toContain("Google Sign-In is not enabled on this Supabase project");
  });
});
