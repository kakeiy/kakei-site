# Cloudflare Launch Checklist

## Pages project

Create the Pages project from the Cloudflare dashboard:

1. Workers & Pages -> Create application -> Pages -> Connect to Git.
2. Select `kakeiy/kakei-site`.
3. Use these build settings:
   - Project name: `kakei-site`
   - Production branch: `main`
   - Build command: leave blank
   - Build output directory: `dist`
   - Root directory: `/`
4. Deploy once and confirm the generated `*.pages.dev` URL works.

Do not create this project as a Wrangler Direct Upload project if the goal is
GitHub-triggered production deploys.

## Custom domains

1. In the Pages project, add `kakei.dev` under Custom domains.
2. Confirm Cloudflare creates/activates the DNS record for the apex domain.
3. `www.kakei.dev` is handled by the `kakei-www-redirect` Worker route
   (`www.kakei.dev/*`), which returns a `301` to the apex domain while
   preserving path and query string.

If replacing the Worker with a Bulk Redirect later, add a Bulk Redirect for
`www.kakei.dev` to `https://kakei.dev`:
   - Status: `301`
   - Preserve query string
   - Subpath matching
   - Preserve path suffix
   - Include subdomains
4. Add a proxied DNS record for `www` as Cloudflare recommends for the redirect rule.

## Verification

```sh
curl --head -i https://kakei.dev/
curl --head -i https://www.kakei.dev/
curl --head -i https://kakei.dev/publication/yamamoto-2024-mean/
```

Expected:

- `https://kakei.dev/` returns `200`.
- `https://www.kakei.dev/` returns `301` with `location: https://kakei.dev/`.
- Old publication paths on `kakei.dev` redirect to `/#publications`.

## Legacy GitHub Pages redirect

Only after `https://kakei.dev/` resolves and returns `200`, replace
`kakeiy.github.io` with a minimal redirect site:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="robots" content="noindex, follow">
    <link rel="canonical" href="https://kakei.dev/">
    <script>
      const target = new URL("https://kakei.dev/");
      target.hash = location.pathname.startsWith("/publication") ? "publications" : "";
      location.replace(target.href);
    </script>
    <meta http-equiv="refresh" content="0; url=https://kakei.dev/">
    <title>Moved to kakei.dev</title>
  </head>
  <body>
    <p>Moved to <a href="https://kakei.dev/">kakei.dev</a>.</p>
  </body>
</html>
```
