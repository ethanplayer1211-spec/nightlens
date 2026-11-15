# Deployment handoff

NightLens is a static Vite application. **Sites version 3 was publicly deployed on 15 November 2026 at 23:41 MYT:** https://nightlens-sky-atlas.leveling-magician.chatgpt.site . Public access was explicitly authorized. No runtime credentials are needed. Deployed application source: `4fc5888a183975a73de62e0657fe660df4c3b6b3`.

- Public seven-slide demo: https://nightlens-sky-atlas.leveling-magician.chatgpt.site/demo/
- Public project/source: https://github.com/ethanplayer1211-spec/nightlens
- Final judging submission remains separate and requires owner approval.
- Anonymous asset and NASA-export checks passed; see `VALIDATION.md`.

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


## Version 2 and public code repository

Public code: https://github.com/ethanplayer1211-spec/nightlens . The repository README starts with `docs/JUDGES_GUIDE.md`, the live application and NASA investigation. This is the owner's chosen project-submission entry point. The earlier version-1 identifiers above remain historical release evidence.

Version 2: saved version `appgprj_6af9bd2df6248191a5dd1aeccf732bb9~appgver_fd700fc7ba7881919a7ebba4afe0153f`; deployment `appgdep_6af9c7d3284c8191b191e8b316abd5e3`; source `e949915581f9c23ddc6a9db7e125ec33a682102a`. Public audience is unchanged. Subsequent GitHub documentation commits update release status only; application source is unchanged.

The live app now exposes separate Place & time, Lighting and Environment tools, explicit before/after labels and an entry guide. Live browser checks confirmed mapped 3D, Busy city versus No artificial light, and Foggy strength 90. No console errors/warnings were observed. Anonymous HTTP checks again returned 200 for the homepage and NASA files; the original CSV checksum is unchanged. Official judging submission and public demo completion remain owner actions.
