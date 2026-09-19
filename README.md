# WebP Converter

A small React app that converts images to WebP entirely in the browser
(using `<canvas>.toBlob("image/webp")`). No backend, no uploads — it's a
fully static site, which is why it deploys for free.

## 1. Run it locally

You need [Node.js](https://nodejs.org) 18+ installed.

```bash
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`).

## 2. Push it to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create webp-converter --public --source=. --push
# or manually: create a repo on github.com, then
#   git remote add origin https://github.com/<you>/webp-converter.git
#   git branch -M main
#   git push -u origin main
```

## 3. Deploy — pick one (both are free)

### Option A: Vercel (easiest)

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.
2. Click **Add New Project**, select your `webp-converter` repo.
3. Vercel auto-detects Vite. Leave the defaults and click **Deploy**.
4. You'll get a live URL like `webp-converter.vercel.app` in about a minute.

Or from the command line:

```bash
npm i -g vercel
vercel        # first run: link/create the project
vercel --prod # deploy to production
```

Every future `git push` to `main` auto-deploys if you connected the GitHub repo.

### Option B: GitHub Pages

Two ways to do this — pick one.

**B1. Automatic, via the included GitHub Actions workflow**

This repo already has `.github/workflows/deploy.yml`. Just:

1. Push to GitHub (step 2 above).
2. In the repo, go to **Settings → Pages** and set **Source** to
   **GitHub Actions**.
3. Push to `main` (or re-run the workflow from the **Actions** tab).
4. Your site will be live at `https://<you>.github.io/webp-converter/`.

Since this is a *project* page (not `<you>.github.io` itself), open
`vite.config.js` and change:

```js
base: "/",
```

to:

```js
base: "/webp-converter/",
```

(replace with your actual repo name), then push again.

**B2. Manual, via the `gh-pages` package**

```bash
npm run deploy
```

This builds the app and pushes `dist/` to a `gh-pages` branch (the
`gh-pages` dependency and npm scripts are already set up in
`package.json`). Then in **Settings → Pages**, set the source branch to
`gh-pages`. Remember to set `base` in `vite.config.js` as described above.

## Notes

- WebP encoding uses the browser's native encoder, so quality/output matches
  what you'd get from an image editor — no external libraries needed.
- Everything happens client-side; images never leave the visitor's browser.
- If you need to batch-convert images on your own machine instead (no
  browser), use the companion `image_to_webp.py` script.
