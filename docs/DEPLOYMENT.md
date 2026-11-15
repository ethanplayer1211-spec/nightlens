# Deployment handoff

NightLens is a static Vite application. A successful local production build does not mean it has been deployed.

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

No hosting project has been registered, no remote repository has been pushed and no site has been published. The supplied brief explicitly requires authorization before remote push/deployment. Once approved, use the selected hosting service and preserve source provenance.

## Release checks

1. Run TypeScript unit tests, Python data reproduction checks, lint/typecheck and production build.
2. Serve `dist/`; verify Sky Lab, Observatory, Time Machine and Methodology.
3. Test scheduled activation, backward scrub, divider, reset, all presets and evidence downloads at desktop/mobile sizes.
4. Verify the published URL in a logged-out/private browser; official judges must not need access permissions.
5. Host the ≤30-second video or ≤7-slide demo publicly. The storyboard is not itself a demo.
6. Fill the official submission draft from `SUBMISSION.md`, review the owner declarations and submit before the event deadline.
