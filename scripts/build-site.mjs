import { copyFile, cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");
const contentPath = join(rootDir, "content", "site.json");
const japaneseContentPath = join(rootDir, "content", "site-ja.json");

let site = JSON.parse(await readFile(contentPath, "utf8"));
const englishSite = site;
const japaneseSite = JSON.parse(await readFile(japaneseContentPath, "utf8"));

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

const cvAssetPath = join(rootDir, englishSite.cv?.href || "");
const hasCv = Boolean(englishSite.cv?.enabled && englishSite.cv?.href && (await fileExists(cvAssetPath)));
const getActionLinks = () => {
  const cvLink = hasCv ? [{ label: site.cv.label || "CV", href: site.cv.href }] : [];
  return [...site.links.slice(0, 2), ...cvLink, ...site.links.slice(2)];
};

const renderHeader = () => {
  const nav = site.nav || {};
  const switcher = site.languageSwitch;

  return `<header class="site-header">
      <a class="wordmark" href="${escapeHtml(rootPath(site.homeHref || "#top"))}" aria-label="${escapeHtml(site.personName)} home">
        <span>${escapeHtml(site.personName)}</span>
      </a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="#bio">${escapeHtml(nav.bio || "Bio")}</a>
        <a href="#research">${escapeHtml(nav.research || "Research")}</a>
        <a href="#publications">${escapeHtml(nav.publications || "Publications")}</a>
        <a href="#works">${escapeHtml(nav.works || "Works")}</a>
        <a href="#leadership">${escapeHtml(nav.leadership || "Leadership")}</a>
        <a href="#links">${escapeHtml(nav.links || "Links")}</a>${switcher ? `
        <a class="language-switch" href="${escapeHtml(rootPath(switcher.href))}" aria-label="${escapeHtml(switcher.ariaLabel || "Switch language")}">EN/JP</a>` : ""}
      </nav>
    </header>`;
};

const renderHero = () => `<section class="hero" id="top" aria-labelledby="hero-title" data-animate>
        <figure class="hero-photo">
          <img src="${escapeHtml(site.hero.image)}" alt="${escapeHtml(site.hero.imageAlt)}">
        </figure>
        <div class="hero-copy">
          <p class="kicker">${escapeHtml(site.hero.kicker)}</p>
          <h1 id="hero-title">${escapeHtml(site.hero.heading)}</h1>
${site.hero.localName ? `          <p class="hero-local-name">${escapeHtml(site.hero.localName)}</p>` : ""}
          <p class="hero-lead">${escapeHtml(site.hero.lead)}</p>
          <p class="hero-affiliation">${escapeHtml(site.hero.affiliation)}</p>
          <div class="hero-actions" aria-label="Profile links">
${getActionLinks()
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

const renderBio = () => `<section class="split-section" id="bio" aria-labelledby="bio-title" data-animate>
        <div class="section-heading">
          <p class="kicker">${escapeHtml(site.labels?.profile || "Profile")}</p>
          <h2 id="bio-title">${escapeHtml(site.bio.heading)}</h2>
        </div>
        <div class="bio-body">
${site.bio.paragraphs.map((paragraph) => `          <p>${escapeHtml(paragraph)}</p>`).join("\n")}
          <div class="bio-lists">
            <div>
              <h3>${escapeHtml(site.labels?.interests || "Interests")}</h3>
              <ul>
${site.bio.interests.map((interest) => `                <li>${escapeHtml(interest)}</li>`).join("\n")}
              </ul>
            </div>
            <div>
              <h3>${escapeHtml(site.labels?.education || "Education")}</h3>
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
            <div>
              <h3>${escapeHtml(site.labels?.awards || "Awards")}</h3>
              <ol>
${(site.bio.awards || [])
  .map(
    (item) => `                <li>
                  <strong>${escapeHtml(item.name)}</strong>
                  <span>${escapeHtml(item.detail)}</span>
                </li>`
  )
  .join("\n")}
              </ol>
            </div>
          </div>
        </div>
      </section>`;

const renderResearch = () => `<section class="band-section research-band" id="research" aria-labelledby="research-title" data-animate>
        <div class="section-title-row">
          <h2 id="research-title">${escapeHtml(site.labels?.research || "Research")}</h2>
          <p>${escapeHtml(site.labels?.researchIntro || "Questions I am currently drawn to.")}</p>
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

const renderPublications = () => `<section class="rail-section" id="publications" aria-labelledby="publications-title" data-animate>
        <div class="section-title-row">
          <h2 id="publications-title">${escapeHtml(site.labels?.publications || "Publications")}</h2>
          <div class="rail-controls" aria-label="${escapeHtml(site.labels?.publicationControls || "Publication carousel controls")}">
            <button type="button" data-rail-prev aria-label="${escapeHtml(site.labels?.previousPublications || "Previous publications")}">←</button>
            <button type="button" data-rail-next aria-label="${escapeHtml(site.labels?.nextPublications || "Next publications")}">→</button>
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
${paper.links?.length ? `            <div class="card-links">
${paper.links.map((link) => `              ${renderLink(link)}`).join("\n")}
            </div>` : ""}
          </article>`
  )
  .join("\n")}
        </div>
      </section>`;

const renderWorks = () => `<section class="split-section works-section" id="works" aria-labelledby="works-title" data-animate>
        <div class="section-heading">
          <p class="kicker">${escapeHtml(site.labels?.portfolio || "Portfolio")}</p>
          <h2 id="works-title">${escapeHtml(site.labels?.works || "Selected Works")}</h2>
        </div>
        <div class="work-grid">
${site.works
  .map(
    (work) => `          <article class="work-card">
            <a href="${escapeHtml(work.href)}"${linkAttrs(work.href)}>
              <img src="${escapeHtml(work.image)}" alt="${escapeHtml(work.imageAlt)}">
              <span>${escapeHtml(work.type)} · ${escapeHtml(work.year)}</span>
              <h3>${escapeHtml(work.title)}</h3>
              <p>${escapeHtml(work.body)}</p>
            </a>
          </article>`
  )
  .join("\n")}
        </div>
      </section>`;

const renderLeadership = () => `<section class="split-section leadership-section" id="leadership" aria-labelledby="leadership-title" data-animate>
        <div class="section-heading">
          <p class="kicker">${escapeHtml(site.labels?.service || "Service")}</p>
          <h2 id="leadership-title">${escapeHtml(site.labels?.leadership || "Leadership")}</h2>
        </div>
        <div class="leadership-list">
${site.leadership
  .map(
    (item) => `          <article class="leadership-item">
            <div>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.role)} · ${escapeHtml(item.year)}</p>
            </div>
            <p>${escapeHtml(item.body)}</p>
          </article>`
  )
  .join("\n")}
        </div>
      </section>`;

const renderLinks = () => `<section class="link-band" id="links" aria-labelledby="links-title" data-animate>
        <h2 id="links-title">${escapeHtml(site.labels?.links || "Links")}</h2>
        <div class="link-list">
${getActionLinks().map((link) => `          ${renderLink(link)}`).join("\n")}
        </div>
      </section>`;

const renderFooter = () => `<footer class="site-footer" data-animate>
      <div class="footer-brand">
        <strong>${escapeHtml(site.personName)}</strong>
        <span>${escapeHtml(site.footer.subline || site.tagline)}</span>
      </div>
      <nav class="footer-links" aria-label="Footer links">
${getActionLinks()
  .slice(0, 6)
  .map((link) => `        ${renderLink(link)}`)
  .join("\n")}
        <a href="#top">${escapeHtml(site.labels?.backToTop || "Back to top")}</a>
      </nav>
      <div class="mit-affiliation">
        <div class="mit-lockup">
          <span>${escapeHtml(site.footer.affiliation || site.hero.kicker)}</span>
        </div>
        <p>${escapeHtml(site.footer.note)}</p>
      </div>
    </footer>`;

const renderMeta = (page = {}) => {
  const title = page.title || site.siteName;
  const description = page.description || site.metaDescription;
  const canonical = page.canonical || site.baseUrl;
  const image = absoluteUrl(site.ogImage);

  return `<meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="${page.noindex ? "noindex, follow" : "index, follow"}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
${(site.alternates || [])
  .map((alternate) => `    <link rel="alternate" hreflang="${escapeHtml(alternate.lang)}" href="${escapeHtml(alternate.href)}">`)
  .join("\n")}
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
<html lang="${escapeHtml(site.lang || "en")}">
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

const renderHomePage = (activeSite) => {
  site = activeSite;
  return pageShell({
    body: `${renderHeader()}
    <main>
      ${renderHero()}
      ${renderBio()}
      ${renderResearch()}
      ${renderPublications()}
      ${renderWorks()}
      ${renderLeadership()}
      ${renderLinks()}
    </main>
    ${renderFooter()}`
  });
};

const renderNotFoundPage = (activeSite) => {
  site = activeSite;
  return pageShell({
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
};

const homeHtml = renderHomePage(englishSite);
const japaneseHomeHtml = renderHomePage(japaneseSite);
const notFoundHtml = renderNotFoundPage(englishSite);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeHtml(englishSite.baseUrl)}</loc>
    <lastmod>2026-05-11</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${escapeHtml(new URL("index-ja.html", englishSite.baseUrl).href)}</loc>
    <lastmod>2026-05-11</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${new URL("sitemap.xml", englishSite.baseUrl).href}
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
await cp(join(rootDir, "assets"), join(distDir, "assets"), {
  recursive: true,
  filter: (source) => !source.endsWith(".docx")
});
await copyFile(join(rootDir, "styles.css"), join(distDir, "styles.css"));
await copyFile(join(rootDir, "script.js"), join(distDir, "script.js"));
await writeFile(join(distDir, "index.html"), homeHtml);
await writeFile(join(distDir, "index-ja.html"), japaneseHomeHtml);
await writeFile(join(distDir, "404.html"), notFoundHtml);
await writeFile(join(distDir, "sitemap.xml"), sitemap);
await writeFile(join(distDir, "robots.txt"), robots);
await writeFile(join(distDir, "_redirects"), redirects);

console.log(`Built ${englishSite.baseUrl} into dist/`);
