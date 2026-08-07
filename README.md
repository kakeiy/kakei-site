# kakei.dev

Personal academic portfolio site for Kakei Yamamoto.

## Editing

This is a plain static HTML/CSS/JS site. Edit files in `dist/` directly:

- `dist/index.html`
- `dist/index-ja.html`
- `dist/styles.css`
- `dist/script.js`

There is no JSON source and no build step.

## Cloudflare Pages

- Repository: `kakeiy/kakei-site`
- Production branch: `main`
- Build command: leave blank
- Build output directory: `dist`
- Canonical domain: `https://kakei.dev`

Configure `www.kakei.dev` as a Cloudflare Bulk Redirect to `https://kakei.dev`
with query strings and path suffixes preserved.

See `docs/cloudflare-launch.md` for the launch and legacy redirect checklist.

## Longitude° product site

The Longitude° product, privacy, support, and terms pages live in
`dist/longitude/`. Deploy that directory as a second Cloudflare Pages project:

- Project name: `longitude-site`
- Production branch: `main`
- Build command: leave blank
- Build output directory: `dist/longitude`
- Custom domain: `https://longitude.kakei.dev`

The product site defaults to English and includes an in-page Japanese language
switch. Its public URLs are intended for App Store Connect and OAuth provider
branding:

- `https://longitude.kakei.dev/`
- `https://longitude.kakei.dev/privacy/`
- `https://longitude.kakei.dev/support/`
- `https://longitude.kakei.dev/terms/`

## CV

The public CV/resume is `dist/assets/resume_KakeiYamamoto.pdf`. Source document
files such as `.docx` are ignored.
