import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppHeader } from "@/components/app-shell";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { setActiveOfficer } from "@/lib/auth-service";

async function renderNavbarWithRouter(initialPath = "/") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <AppHeader />
        <Outlet />
      </QueryClientProvider>
    ),
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <div data-testid="index-view" />,
  });
  const scanRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/scan",
    component: () => <div data-testid="scan-view" />,
  });
  const auditRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/audit",
    component: () => <div data-testid="audit-view" />,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, scanRoute, auditRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  await router.load();
  return render(<RouterProvider router={router} />);
}

describe("NarcoLens Navigation Bar (Reference Image Redesign)", () => {
  beforeEach(() => {
    localStorage.clear();
    setActiveOfficer({
      id: "off_test_99",
      email: "down@yahoo.com",
      full_name: "Daniel Young",
      officer_id: "NCB-DEL-4082",
      badge_id: "NCB-DEL-4082",
      station: "Delhi Zonal Unit",
      created_at: new Date().toISOString(),
    });
  });

  it("renders the NarcoLens brand and subtitle", async () => {
    await renderNavbarWithRouter("/");
    expect(screen.getByText("NarcoLens")).toBeDefined();
    expect(screen.getByText("NARCOTICS CONTROL BUREAU")).toBeDefined();
  });

  it("renders all three navigation items and marks Dashboard active on /", async () => {
    await renderNavbarWithRouter("/");
    const nav = screen.getByRole("navigation", { name: "Primary navigation" });
    const dashboardLink = nav.querySelector("a[href='/']");
    const scanLink = nav.querySelector("a[href='/scan']");
    const auditLink = nav.querySelector("a[href='/audit']");

    expect(dashboardLink).not.toBeNull();
    expect(scanLink).not.toBeNull();
    expect(auditLink).not.toBeNull();

    expect(dashboardLink?.getAttribute("data-status")).toBe("active");
    expect(scanLink?.getAttribute("data-status")).toBeNull();
  });

  it("renders the user profile pill with initials, email, and organization unit", async () => {
    await renderNavbarWithRouter("/");
    // Email
    expect(screen.getByText("down@yahoo.com")).toBeDefined();
    // Org unit
    expect(screen.getByText(/Delhi Zonal Unit/i)).toBeDefined();
    // Initials: DY
    expect(screen.getByText("DY")).toBeDefined();
  });

  it("renders the pill-shaped Logout button", async () => {
    await renderNavbarWithRouter("/");
    const logoutBtn = screen.getByRole("button", { name: /Logout/i });
    expect(logoutBtn).toBeDefined();
    expect(logoutBtn.textContent).toContain("Logout");
  });

  it("opens the officer profile modal when clicking the profile pill", async () => {
    await renderNavbarWithRouter("/");
    const profileBtn = screen.getByLabelText("Open Officer Profile Window");
    fireEvent.click(profileBtn);

    // Profile modal title
    expect(await screen.findByRole("heading", { name: "Profile" })).toBeDefined();
  });
});
