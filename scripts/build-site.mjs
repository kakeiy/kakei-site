import { copyFile, cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");
const contentPath = join(rootDir, "content", "site.json");

const site = JSON.parse(await readFile(contentPath, "utf8"));

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const isExternal = (href = "") => /^(https?:|mailto:)/.test(href);

const absoluteUrl = (href = "") => {
  if (!href) return site.baseUrl;
  if (isExternal(href)) return href;
  return new URL(href, site.baseUrl).href;
};

const rootPath = (href = "") => {
  if (!href || isExternal(href) || href.startsWith("#")) return href;
  return href.replace(/^\/+/, "");
};

const fileExists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
};

const linkAttrs = (href) =>
  isExternal(href) ? ' target="_blank" rel="noopener noreferrer"' : "";

const renderLink = ({ href, label, className = "" }) =>
  `<a${className ? ` class="${escapeHtml(className)}"` : ""} href="${escapeHtml(rootPath(href))}"${linkAttrs(
    href
  )}>${escapeHtml(label)}</a>`;

const cvAssetPath = join(rootDir, site.cv?.href || "");
const hasCv = Boolean(site.cv?.enabled && site.cv?.href && (await fileExists(cvAssetPath)));
const actionLinks = [
  ...site.links,
  ...(hasCv ? [{ label: site.cv.label || "CV", href: site.cv.href }] : [])
];

const renderHeader = () => `<header class="site-header">
      <a class="wordmark" href="#top" aria-label="${escapeHtml(site.personName)} home">
        <span>${escapeHtml(site.personName)}</span>
      </a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="#bio">Bio</a>
        <a href="#research">Research</a>
        <a href="#publications">Publications</a>
        <a href="#works">Works</a>
        <a href="#links">Links</a>
      </nav>
    </header>`;

const renderHero = () => `<section class="hero" id="top" aria-labelledby="hero-title">
        <figure class="hero-photo">
          <img src="${escapeHtml(site.hero.image)}" alt="${escapeHtml(site.hero.imageAlt)}">
        </figure>
        <div class="hero-copy">
          <p class="kicker">${escapeHtml(site.hero.kicker)}</p>
          <h1 id="hero-title">${escapeHtml(site.hero.heading)}</h1>
          <p class="hero-lead">${escapeHtml(site.hero.lead)}</p>
          <p class="hero-affiliation">${escapeHtml(site.hero.affiliation)}</p>
          <div class="hero-actions" aria-label="Profile links">
${actionLinks
  .slice(0, 5)
  .map((link, index) =>
    renderLink({
      ...link,
      className: index === 0 ? "action action-primary" : "action"
    })
  )
  .join("\n")}
          </div>
        </div>
      </section>`;

const renderBio = () => `<section class="split-section" id="bio" aria-labelledby="bio-title">
        <div class="section-heading">
          <p class="kicker">Profile</p>
          <h2 id="bio-title">${escapeHtml(site.bio.heading)}</h2>
        </div>
        <div class="bio-body">
${site.bio.paragraphs.map((paragraph) => `          <p>${escapeHtml(paragraph)}</p>`).join("\n")}
          <div class="bio-lists">
            <div>
              <h3>Interests</h3>
              <ul>
${site.bio.interests.map((interest) => `                <li>${escapeHtml(interest)}</li>`).join("\n")}
              </ul>
            </div>
            <div>
              <h3>Education</h3>
              <ol>
${site.bio.education
  .map(
    (item) => `                <li>
                  <strong>${escapeHtml(item.degree)}</strong>
                  <span>${escapeHtml(item.institution)} · ${escapeHtml(item.year)}</span>
                </li>`
  )
  .join("\n")}
              </ol>
            </div>
          </div>
        </div>
      </section>`;

const renderResearch = () => `<section class="band-section research-band" id="research" aria-labelledby="research-title">
        <div class="section-title-row">
          <h2 id="research-title">Research</h2>
          <p>Questions I am currently drawn to.</p>
        </div>
        <div class="theme-grid">
${site.researchThemes
  .map(
    (theme) => `          <article class="theme-card">
            <h3>${escapeHtml(theme.title)}</h3>
            <p>${escapeHtml(theme.body)}</p>
          </article>`
  )
  .join("\n")}
        </div>
      </section>`;

const renderPublications = () => `<section class="rail-section" id="publications" aria-labelledby="publications-title">
        <div class="section-title-row">
          <h2 id="publications-title">Publications</h2>
          <div class="rail-controls" aria-label="Publication carousel controls">
            <button type="button" data-rail-prev aria-label="Previous publications">←</button>
            <button type="button" data-rail-next aria-label="Next publications">→</button>
          </div>
        </div>
        <div class="publication-rail" data-rail>
${site.publications
  .map(
    (paper) => `          <article class="publication-card${paper.featured ? " is-featured" : ""}">
            <p class="paper-year">${escapeHtml(paper.year)}</p>
            <h3>${escapeHtml(paper.title)}</h3>
            <p class="paper-authors">${escapeHtml(paper.authors)}</p>
            <p class="paper-venue">${escapeHtml(paper.venue)}</p>
            <p>${escapeHtml(paper.summary)}</p>
            <div class="card-links">
${paper.links.map((link) => `              ${renderLink(link)}`).join("\n")}
            </div>
          </article>`
  )
  .join("\n")}
        </div>
      </section>`;

const renderWorks = () => `<section class="split-section works-section" id="works" aria-labelledby="works-title">
        <div class="section-heading">
          <p class="kicker">Portfolio</p>
          <h2 id="works-title">Selected Works</h2>
        </div>
        <div class="work-grid">
${site.works
  .map(
    (work) => `          <article class="work-card">
            <a href="${escapeHtml(work.href)}"${linkAttrs(work.href)}>
              <img src="${escapeHtml(work.image)}" alt="${escapeHtml(work.imageAlt)}" loading="lazy">
              <span>${escapeHtml(work.type)} · ${escapeHtml(work.year)}</span>
              <h3>${escapeHtml(work.title)}</h3>
              <p>${escapeHtml(work.body)}</p>
            </a>
          </article>`
  )
  .join("\n")}
        </div>
      </section>`;

const renderLinks = () => `<section class="link-band" id="links" aria-labelledby="links-title">
        <h2 id="links-title">Links</h2>
        <div class="link-list">
${actionLinks.map((link) => `          ${renderLink(link)}`).join("\n")}
        </div>
      </section>`;

const renderFooter = () => `<footer class="site-footer">
      <p>${escapeHtml(site.footer.note)}</p>
      <a href="#top">Back to top</a>
    </footer>`;

const renderMeta = (page = {}) => {
  const title = page.title || site.siteName;
  const description = page.description || site.metaDescription;
  const canonical = page.canonical || site.baseUrl;
  const image = absoluteUrl(site.ogImage);

  return `<meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="${page.noindex ? "noindex, follow" : "index, follow"}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <link rel="sitemap" type="application/xml" href="${escapeHtml(absoluteUrl("sitemap.xml"))}">
    <meta property="og:type" content="profile">
    <meta property="og:site_name" content="${escapeHtml(site.siteName)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta property="og:image:alt" content="${escapeHtml(site.hero.imageAlt)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(image)}">
    <title>${escapeHtml(title)}</title>`;
};

const jsonLd = () => `<script type="application/ld+json">
      ${JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": "Person",
          name: site.personName,
          url: site.baseUrl,
          jobTitle: site.tagline,
          image: absoluteUrl(site.hero.image),
          affiliation: [
            {
              "@type": "CollegeOrUniversity",
              name: "Massachusetts Institute of Technology",
              url: "https://www.mit.edu/"
            },
            {
              "@type": "Organization",
              name: "Laboratory for Information and Decision Systems",
              url: "https://lids.mit.edu/"
            },
            {
              "@type": "Organization",
              name: "Institute for Data, Systems, and Society",
              url: "https://idss.mit.edu/"
            }
          ],
          sameAs: site.links.map((link) => link.href),
          knowsAbout: site.bio.interests
        },
        null,
        8
      )}
    </script>`;

const pageShell = ({ body, page = {} }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${renderMeta(page)}
    ${jsonLd()}
    <link rel="preload" href="${escapeHtml(site.hero.image)}" as="image">
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
${body}
    <script src="script.js"></script>
  </body>
</html>
`;

const homeHtml = pageShell({
  body: `${renderHeader()}
    <main>
      ${renderHero()}
      ${renderBio()}
      ${renderResearch()}
      ${renderPublications()}
      ${renderWorks()}
      ${renderLinks()}
    </main>
    ${renderFooter()}`
});

const notFoundHtml = pageShell({
  page: {
    title: `Page not found | ${site.siteName}`,
    description: `The requested page was not found on ${site.siteName}.`,
    canonical: absoluteUrl("404.html"),
    noindex: true
  },
  body: `${renderHeader()}
    <main class="not-found">
      <section>
        <p class="kicker">404</p>
        <h1>Page not found</h1>
        <p>This page has moved or no longer exists.</p>
        <a class="action action-primary" href="/">Go home</a>
      </section>
    </main>
    ${renderFooter()}`
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeHtml(site.baseUrl)}</loc>
    <lastmod>2026-05-11</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${absoluteUrl("sitemap.xml")}
`;

const redirects = `# Legacy paths from the old GitHub Pages site.
/publication /#publications 301
/publication/ /#publications 301
/publication/* /#publications 301
/authors/admin /#bio 301
/authors/admin/ /#bio 301
/uploads/resume.pdf /#links 302
`;

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(join(rootDir, "assets"), join(distDir, "assets"), { recursive: true });
await copyFile(join(rootDir, "styles.css"), join(distDir, "styles.css"));
await copyFile(join(rootDir, "script.js"), join(distDir, "script.js"));
await writeFile(join(distDir, "index.html"), homeHtml);
await writeFile(join(distDir, "404.html"), notFoundHtml);
await writeFile(join(distDir, "sitemap.xml"), sitemap);
await writeFile(join(distDir, "robots.txt"), robots);
await writeFile(join(distDir, "_redirects"), redirects);

console.log(`Built ${site.baseUrl} into dist/`);
