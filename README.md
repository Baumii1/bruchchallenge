# Bruch Challenge Hub

Next.js app for tracking and running Bruch challenges (live dashboard, challenge history, admin creation flow).

## Local development

```bash
npm ci
npm run dev
```

App runs on `http://localhost:9002`.

## Build / typecheck

```bash
npm run typecheck
npm run build
```

## GitHub Pages deployment

This repo is configured for static export with:

- `output: "export"` in `next.config.ts`
- `basePath`/`assetPrefix` set to `/bruchchallenge` in production
- workflow: `.github/workflows/deploy-pages.yml`

### Important

In repository settings, set **Pages → Source = GitHub Actions**. 

If Pages is set to **Deploy from branch (main)**, GitHub will show repository files/README instead of the built app.
