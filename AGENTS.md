<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
<!-- LOVABLE:END -->

- Keep TanStack Router file-based routes and use route-local metadata for every user-facing page; this preserves typed navigation and shareable page titles.
- Evidence records live only in the cloud `evidence_records` table, read/written via `src/lib/evidence.ts` with the browser client under RLS; one shared source of truth across devices.
- Access is role-based via `user_roles` + `can_access_evidence()`; new signups get the officer role by trigger, so permission changes are role rows, never client checks.
- Sealed evidence is immutable in the database (trigger); only the hash-linked custody log may be appended.
- Officer pages (scan, audit) live under `src/routes/_authenticated/`; the dashboard stays public and shows a sign-in prompt when signed out.
- Keep the supplied lamp interaction as the visual basis of authentication; only add accessibility, mode switching, and cloud auth wiring around it.
