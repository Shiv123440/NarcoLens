import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ProfileContent } from "@/components/profile-window";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Officer Profile · NarcoLens" },
      {
        name: "description",
        content: "NCB field officer profile, credentials, speech settings, and terminal details.",
      },
      { property: "og:title", content: "Officer Profile · NarcoLens" },
      {
        property: "og:description",
        content: "NCB field officer profile, credentials, speech settings, and terminal details.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <AppShell>
      <div className="py-2 sm:py-6 flex justify-center">
        <div className="w-full max-w-md bg-[#F8FAFC] rounded-3xl p-5 sm:p-6 border border-zinc-200/90 shadow-lg">
          <ProfileContent />
        </div>
      </div>
    </AppShell>
  );
}
