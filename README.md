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

## Sicherheit (Firestore Rules)

Die App ist ein statischer Export – **jeder Schutz im Client-Code ist umgehbar**.
Die einzige echte Schreibschutz-Schicht sind die Firestore Security Rules in
[`firestore.rules`](firestore.rules):

- Lesen von `bruchchallenge/*` ist öffentlich (Zuschauer brauchen keinen Login).
- Schreiben ist nur für die dort gelistete Admin-E-Mail erlaubt
  (muss mit `NEXT_PUBLIC_ADMIN_EMAILS` übereinstimmen).

Deployment der Rules (einmalig bzw. nach jeder Änderung):

```bash
npm install -g firebase-tools   # falls noch nicht installiert
firebase login
firebase deploy --only firestore:rules --project <PROJECT_ID>
```

Zusätzlich in der Firebase-Konsole unter **Authentication → Sign-in method**:
E-Mail/Passwort aktivieren (Admin-Login) und optional Anonym (Viewer-Session).

## GitHub Pages deployment

This repo is configured for static export with:

- `output: "export"` in `next.config.ts`
- `basePath`/`assetPrefix` set to `/bruchchallenge` in production
- workflow: `.github/workflows/deploy-pages.yml`

### Important

In repository settings, set **Pages → Source = GitHub Actions**.

If Pages is set to **Deploy from branch (main)**, GitHub will show repository files/README instead of the built app.
