# kakei.dev

Personal academic portfolio site for Kakei Yamamoto.

## Local development

```sh
npm run dev
```

The site is generated into `dist/` from `content/site.json`, `styles.css`, and
`script.js`.

## Build

```sh
npm run build
```

## Cloudflare Pages

- Repository: `kakeiy/kakei-site`
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Canonical domain: `https://kakei.dev`

Configure `www.kakei.dev` as a Cloudflare Bulk Redirect to `https://kakei.dev`
with query strings and path suffixes preserved.

See `docs/cloudflare-launch.md` for the launch and legacy redirect checklist.

## CV

The content file includes a disabled CV slot for `assets/kakei-yamamoto-cv.pdf`.
The build only emits the CV link when the slot is enabled and the PDF exists.
