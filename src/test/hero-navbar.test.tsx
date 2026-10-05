import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero34 } from "@/components/blocks/hero34";
import { AppHeader } from "@/components/app-shell";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";

async function renderWithRouter(ui: React.ReactElement) {
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {ui}
        <Outlet />
      </QueryClientProvider>
    ),
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <div data-testid="index-page" />,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  await router.load();
  return render(<RouterProvider router={router} />);
}

describe("Hero 34 Component & Navbar Integration", () => {
  it("renders Hero34 block with badge, headline, and action buttons", () => {
    render(<Hero34 />);
    expect(screen.getByText("NEW TEST · FIELD READY")).toBeDefined();
    expect(screen.getByText("Forensic Analysis Built for the Field")).toBeDefined();
    expect(screen.getByText("Start Field Test")).toBeDefined();
    expect(screen.getByText("View Audit Ledger")).toBeDefined();
  });

  it("renders AppHeader with brand, hero announcement badge, and navigation links", async () => {
    await renderWithRouter(<AppHeader />);
    expect(screen.getByText("NarcoLens")).toBeDefined();
    expect(screen.getByText("NARCOTICS CONTROL BUREAU")).toBeDefined();
    expect(screen.getByText("NEW TEST · FIELD READY")).toBeDefined();
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Scan" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Audit logs" })).toBeDefined();
  });
});
