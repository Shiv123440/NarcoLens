<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
<!-- LOVABLE:END -->

- Keep TanStack Router file-based routes and use route-local metadata for every user-facing page; this preserves typed navigation and shareable page titles.
- Keep forensic records in a browser-safe local-first adapter until a production service is connected; this keeps camera, hashing, and offline workflows usable without server credentials.
- Keep the supplied lamp interaction as the visual basis of authentication; only add accessibility, mode switching, and local demo handling around it.
