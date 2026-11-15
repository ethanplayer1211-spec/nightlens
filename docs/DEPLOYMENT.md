# Deployment handoff

NightLens is a static Vite application. **Version 1 was publicly deployed through Sites on 15 November 2026 at 22:18 MYT:** https://nightlens-sky-atlas.leveling-magician.chatgpt.site. The owner explicitly approved public hosting. Final judging submission was not performed.

## Vercel (preferred in the supplied brief)

With owner authorization, connect this repository or deploy from this folder using Vercel. Set:

- Framework: Vite
- Install: `npm ci`
- Build: `npm run build`
- Output: `dist`
- Runtime API keys/environment variables: none

Navigation uses hash fragments; a server-side route rewrite is not required. Data and favicon are copied from `public/`. Python, raw source archives and `node_modules` are not needed in the published bundle.

## Static-host alternative

Publish the complete `dist/` directory to a static host. Serve the site at its origin root; this version uses root-relative asset and cached-data URLs. A subpath deployment needs a configured base URL and matching data-path adjustments.

The Sites project is `appgprj_6af9bd2df6248191a5dd1aeccf732bb9`, with public audience revision 2. Native deployment `appgdep_6af9bf1724808191bb033da97da7b688` succeeded for saved version 1, built from source commit `3401e3f73241068962d6f3922037b4eec51c4258`. `.openai/hosting.json` retains the project identity for future updates. Do not create another Site for updates. The source upload used an earlier history branch to satisfy the host's 64 MB per-push limit; the published main source is the final tested revision.

Anonymous HTTP requests without browser cookies returned 200 for the homepage, MODIS JSON and original CSV. The published CSV checksum matches `121f595c5668c0fe56c51537c959e1bac660195b5527da2a049538adf23dc299`. Browser checks confirmed mapped-3D sky rendering, the 00:05 responsible-lighting comparison and NASA trend explorer. Console inspection returned no errors/warnings. The local preview server remains running at the owner's request.

No account files, credentials or owner agreement screenshot were included in source publication. The downloadable sky HTML remains a separate compact edition; the full public site includes Time Machine.

## Release checks

1. Run TypeScript unit tests, Python data reproduction checks, lint/typecheck and production build.
2. Serve `dist/`; verify Sky Lab, Observatory, Time Machine and Methodology.
3. Test scheduled activation, backward scrub, divider, reset, all presets and evidence downloads at desktop/mobile sizes.
4. Verify the published URL in a logged-out/private browser; official judges must not need access permissions.
5. Host the ≤30-second video or ≤7-slide demo publicly. The storyboard is not itself a demo.
6. Fill the official submission draft from `SUBMISSION.md`, review the owner declarations and submit before the event deadline.
