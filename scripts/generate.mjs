import { mkdir, readdir, readFile, rm, writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";

const SITE = {
  name: "Chinese Knot Guide",
  url: "https://www.chineseknotguide.com",
  description: "Learn Chinese knot tutorials, knot meanings, common knot types, cord choices, bracelet ideas, and symbolic uses.",
  assetVersion: "20260628-images-01"
};

const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || "";
const keywordRows = parseCsv(await readFile("docs/keyword-library/chinese-knot-keyword-library.csv", "utf8"));
const tutorialKeywords = keywordRows.filter((row) => row.category === "tutorial-diy").slice(0, 18);
const meaningKeywords = keywordRows.filter((row) => row.category === "meaning-symbolism").slice(0, 16);
const productKeywords = keywordRows.filter((row) => row.category === "product-craft").slice(0, 16);
const typeKeywords = keywordRows.filter((row) => row.category === "knot-types").slice(0, 16);

const knots = [
  { slug: "good-luck-knot", name: "Good Luck Knot", use: "Lucky decor, small hanging ornaments, beginner practice", meaning: "Often used as a visual symbol of blessing, good wishes, and festive decoration.", difficulty: "Beginner", keywords: ["chinese lucky knot", "chinese good luck knot", "good luck knot"] },
  { slug: "button-knot", name: "Chinese Button Knot", use: "Closures, bracelets, keychains, decorative ends", meaning: "A compact knot used for structure as well as decoration.", difficulty: "Medium", keywords: ["button knot", "chinese button knot", "chinese button knot tutorial"] },
  { slug: "pan-chang-knot", name: "Pan Chang Knot", use: "Symbolic decor, pendants, larger knotwork", meaning: "Often linked with the endless knot idea and continuous connection.", difficulty: "Medium", keywords: ["pan chang knot", "pan chang knot meaning", "pan chang knot tutorial"] },
  { slug: "double-coin-knot", name: "Double Coin Knot", use: "Bracelets, charms, decorative cords", meaning: "Commonly associated with wealth symbolism because of the coin-like shape.", difficulty: "Beginner", keywords: ["double coin knot"] },
  { slug: "endless-knot", name: "Endless Knot", use: "Symbolic gifts, wall decor, jewelry motifs", meaning: "Represents continuity, connection, and an unbroken pattern.", difficulty: "Medium", keywords: ["endless knot meaning"] },
  { slug: "bracelet-knot", name: "Chinese Knot Bracelet", use: "DIY bracelets, gifts, small craft products", meaning: "Usually combines decorative knotwork with color and gift symbolism.", difficulty: "Beginner", keywords: ["chinese knot bracelet", "chinese knot bracelet tutorial"] }
];

const guides = [
  { title: "Chinese Knot Tutorial", path: "/chinese-knot-tutorial/", category: "Tutorials", description: "A beginner path for learning Chinese knotting step by step." },
  { title: "How to Tie a Chinese Knot", path: "/how-to-tie-chinese-knot/", category: "Tutorials", description: "Simple practice order, cord setup, and common mistakes." },
  { title: "Chinese Knot Meaning", path: "/chinese-knot-meaning/", category: "Meanings", description: "Understand symbolic meanings, colors, and common gift contexts." },
  { title: "Types of Chinese Knots", path: "/types-of-chinese-knots/", category: "Knot Types", description: "Compare good luck, button, Pan Chang, double coin, and bracelet knots." },
  { title: "Endless Knot Meaning", path: "/endless-knot-meaning/", category: "Meanings", description: "A focused explanation of endless knot symbolism and use." },
  { title: "Chinese Button Knot", path: "/chinese-button-knot/", category: "Knot Types", description: "A practical guide to button knots for closures and small crafts." },
  { title: "Pan Chang Knot", path: "/pan-chang-knot/", category: "Knot Types", description: "Meaning, use cases, and tutorial notes for the Pan Chang knot." },
  { title: "Chinese Knot Cord", path: "/chinese-knot-cord/", category: "Supplies", description: "Choose cord thickness, color, texture, and beginner-friendly materials." },
  { title: "Chinese Knot Bracelet", path: "/chinese-knot-bracelet/", category: "Craft Ideas", description: "Bracelet ideas, gift positioning, and tutorial paths." },
  { title: "Chinese Knot Keychain", path: "/chinese-knot-keychain/", category: "Craft Ideas", description: "Small product and DIY ideas for keychain-style knots." }
];

const pages = [];

await rm("dist", { recursive: true, force: true });
await mkdir("dist/assets", { recursive: true });
for (const asset of await readdir("public/assets")) {
  await copyFile(join("public/assets", asset), join("dist/assets", asset));
}
await copyFile("public/_headers", "dist/_headers");
for (const file of await readdir("public")) {
  if (file.endsWith(".html")) await copyFile(join("public", file), join("dist", file));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function absolute(path) {
  return `${SITE.url}${path === "/" ? "" : path}`;
}

function slugify(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  const headers = rows.shift()?.map((value) => value.replace(/^\uFEFF/, "").trim()) || [];
  return rows
    .filter((current) => current.some((value) => String(value || "").trim()))
    .map((current) => Object.fromEntries(headers.map((header, idx) => [header, current[idx] ?? ""])));
}

function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function breadcrumbSchema(items) {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(item.url)
    }))
  });
}

function faqSchema(faqs) {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a }
    }))
  });
}

function analyticsSnippet() {
  if (!GA_MEASUREMENT_ID) return "";
  const id = escapeHtml(GA_MEASUREMENT_ID);
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${id}');
  </script>`;
}

function pageClass(path) {
  if (path === "/") return "page-home";
  if (path === "/guides/") return "page-guides";
  return `page-${path.replace(/^\/|\/$/g, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
}

function pageLayout({ title, description, path, h1, intro, body, faqs = [], pageType = "WebPage", articleSidebar = false, heroLabel = "Chinese knot reference" }) {
  const canonical = absolute(path);
  const schema = [
    jsonLd({ "@context": "https://schema.org", "@type": pageType, name: title, description, url: canonical, inLanguage: "en" }),
    breadcrumbSchema([{ name: "Home", url: "/" }, { name: h1, url: path }]),
    faqs.length ? faqSchema(faqs) : ""
  ].join("\n");
  pages.push({ path, title, description, h1, faqs: faqs.length });

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE.url}/assets/knot-ornament-hero.webp">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="/styles.css?v=${SITE.assetVersion}">
  ${analyticsSnippet()}
  ${schema}
</head>
<body class="${pageClass(path)}">
  <header class="site-header">
    <a class="brand" href="/" aria-label="${SITE.name} home"><img class="brand-logo" src="/assets/logo.svg" alt="${SITE.name} logo">${SITE.name}</a>
    <nav class="nav" aria-label="Main navigation">
      <a href="/">Home</a>
      <a href="/chinese-knot-tutorial/">Tutorial</a>
      <a href="/chinese-knot-meaning/">Meaning</a>
      <a href="/types-of-chinese-knots/">Types</a>
      <a href="/chinese-knot-cord/">Cord</a>
      <a href="/chinese-knot-bracelet/">Bracelet</a>
      <a href="/guides/">Guides</a>
    </nav>
  </header>
  <main>
    <section class="page-hero">
      <div>
        <p class="eyebrow">${heroLabel}</p>
        <h1>${h1}</h1>
        <p class="intro">${intro}</p>
      </div>
    </section>
    ${articleSidebar ? articleLayout(body) : body}
  </main>
  <footer class="site-footer">
    <div class="footer-about">
      <strong>${SITE.name}</strong>
      <p>This site explains Chinese knot tutorials, meanings, craft supplies, and gift use cases for educational and DIY reference.</p>
    </div>
    <nav class="footer-nav" aria-label="Footer navigation">
      <div><span>Learn</span><a href="/chinese-knot-tutorial/">Tutorial</a><a href="/how-to-tie-chinese-knot/">How to tie</a><a href="/types-of-chinese-knots/">Types</a></div>
      <div><span>Meaning</span><a href="/chinese-knot-meaning/">Meaning</a><a href="/endless-knot-meaning/">Endless knot</a><a href="/pan-chang-knot/">Pan Chang knot</a></div>
      <div><span>Site</span><a href="/about/">About</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></div>
    </nav>
  </footer>
  <script src="/toolkit.js?v=${SITE.assetVersion}" defer></script>
</body>
</html>`;
}

function articleLayout(body) {
  return `<div class="article-shell"><div class="article-main">${body}</div>${articleSidebarBlock()}</div>`;
}

function articleSidebarBlock() {
  const items = [
    { title: "Chinese Knot Tutorial", path: "/chinese-knot-tutorial/", description: "Start with the tutorial path." },
    { title: "Chinese Knot Meaning", path: "/chinese-knot-meaning/", description: "Read symbolic meaning and color notes." },
    { title: "Types of Chinese Knots", path: "/types-of-chinese-knots/", description: "Compare common knot types." },
    { title: "Chinese Knot Cord", path: "/chinese-knot-cord/", description: "Choose cord and starter supplies." }
  ];
  return `<aside class="article-sidebar" aria-label="Related guides">
    <section class="sidebar-card"><p class="eyebrow">Popular Guides</p><h2>Continue reading</h2><div class="sidebar-link-list">${items.map((item) => `<a href="${item.path}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.description)}</span></a>`).join("")}</div></section>
    <section class="sidebar-card compact"><p class="eyebrow">Quick Tools</p><a class="button-link" href="/chinese-knot-tutorial/">Start tutorial</a><a class="button-link secondary" href="/types-of-chinese-knots/">Compare types</a></section>
  </aside>`;
}

function standardFaqs() {
  return [
    { q: "What is a Chinese knot?", a: "A Chinese knot is decorative knotwork made from cord and often used for ornaments, gifts, jewelry, and good-luck symbolism." },
    { q: "What is the easiest Chinese knot for beginners?", a: "A simple good luck knot, double coin knot, or bracelet knot is usually easier than large multi-loop decorative knots." },
    { q: "What does a Chinese knot mean?", a: "Chinese knots often represent blessing, continuity, good wishes, reunion, or festive decoration depending on type, color, and use." },
    { q: "What cord is best for Chinese knotting?", a: "Beginners usually do better with smooth but not slippery nylon cord in a medium thickness that holds shape." },
    { q: "Can Chinese knots be used for jewelry?", a: "Yes. Bracelets, keychains, pendants, and small charms are common craft and gift uses." },
    { q: "Are all Chinese knots lucky symbols?", a: "No. Many are used for auspicious decoration, but the exact meaning depends on knot type, color, placement, and context." }
  ];
}

function faqBlock(faqs) {
  const grouped = [
    { title: "Basics", hint: "Knot and meaning", items: faqs.slice(0, 2) },
    { title: "Craft", hint: "Cord and tutorial", items: faqs.slice(2, 4) },
    { title: "Use cases", hint: "Jewelry and gifts", items: faqs.slice(4) }
  ].filter((group) => group.items.length);
  return `<section class="content-section faq-list"><div class="section-heading"><p class="eyebrow">FAQ</p><h2>Common Chinese knot questions</h2></div><div class="faq-categories">${grouped.map((group) => `<details class="faq-category"${group.title === "Basics" ? " open" : ""}><summary><span>${escapeHtml(group.title)}</span><small>${escapeHtml(group.hint)}</small></summary><div class="faq-grid">${group.items.map((item) => `<div class="faq-item"><h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(item.a)}</p></div>`).join("")}</div></details>`).join("")}</div></section>`;
}

function articleSearchBlock() {
  return `<section class="content-section article-search"><div><p class="eyebrow">Site Search</p><h2>Search Chinese knot topics</h2></div><form class="site-search-form" data-site-search><label>Search the site<input type="text" name="q" placeholder="tutorial, endless knot, bracelet, cord" required></label><button type="submit">Search</button></form></section>`;
}

function guideCard(guide) {
  return `<a class="guide-card" href="${guide.path}" data-guide-card data-guide-category="${slugify(guide.category)}"><span>${escapeHtml(guide.category)}</span><strong>${escapeHtml(guide.title)}</strong><p>${escapeHtml(guide.description)}</p></a>`;
}

function guideFilterBlock() {
  const categories = [...new Set(guides.map((guide) => guide.category))];
  return `<nav class="guide-filter-nav" aria-label="Filter guides by category"><button type="button" class="is-active" data-guide-filter="all">All</button>${categories.map((category) => `<button type="button" data-guide-filter="${slugify(category)}">${escapeHtml(category)}</button>`).join("")}</nav>`;
}

function latestGuidesBlock(items = guides.slice(0, 6)) {
  return `<section class="content-section latest-guides"><div class="section-heading"><p class="eyebrow">Latest Guides</p><h2>Start with these Chinese knot topics</h2></div><div class="guide-grid">${items.map(guideCard).join("")}</div><div class="section-action"><a class="button-link secondary" href="/guides/">Browse all guides</a></div></section>`;
}

function relatedGuidesBlock(title, items) {
  return `<section class="content-section related-guides"><div class="section-heading"><p class="eyebrow">Related Guides</p><h2>${escapeHtml(title)}</h2></div><div class="guide-grid compact">${items.map(guideCard).join("")}</div></section>`;
}

function knotCards(items = knots) {
  return `<div class="animal-grid">${items.map((item) => `<a class="animal-card" href="/knots/${item.slug}/"><span class="animal-seal">${escapeHtml(item.name.slice(0, 1))}</span><span class="animal-order">${escapeHtml(item.difficulty)}</span><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.use)}</span><p>${escapeHtml(item.meaning)}</p></a>`).join("")}</div>`;
}

function knotTable(items = knots) {
  return `<div class="table-wrap"><table><thead><tr><th>Knot</th><th>Difficulty</th><th>Best use</th><th>Meaning note</th><th>Guide</th></tr></thead><tbody>${items.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.difficulty)}</td><td>${escapeHtml(item.use)}</td><td>${escapeHtml(item.meaning)}</td><td><a href="/knots/${item.slug}/">Open</a></td></tr>`).join("")}</tbody></table></div>`;
}

function keywordTable(rows, title, eyebrow = "Keyword Cluster") {
  return `<section class="content-section"><div class="section-heading"><p class="eyebrow">${eyebrow}</p><h2>${escapeHtml(title)}</h2></div><div class="table-wrap"><table><thead><tr><th>Keyword</th><th>Volume</th><th>Intent</th><th>Page type</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.keyword)}</td><td>${escapeHtml(row.search_volume)}</td><td>${escapeHtml(row.intent)}</td><td>${escapeHtml(row.recommended_asset)}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function adSlot(position) {
  return `<aside class="ad-slot" data-ad-position="${position}" aria-label="Advertisement area">Advertisement</aside>`;
}

function supportArticle({ title, description, path, h1, intro, answer, details, related }) {
  return pageLayout({
    title,
    description,
    path,
    h1,
    intro,
    heroLabel: "Chinese knot guide",
    faqs: standardFaqs(),
    articleSidebar: true,
    body: `${articleSearchBlock()}<section class="content-section article-body"><p class="lead-answer">${escapeHtml(answer)}</p>${details.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}</section>${relatedGuidesBlock("Related Chinese knot guides", related)}${faqBlock(standardFaqs())}`
  });
}

function knotPage(item) {
  return pageLayout({
    title: `${item.name}: Meaning, Tutorial Notes, Uses, and Beginner Tips`,
    description: `Learn the ${item.name}, including meaning, common uses, difficulty, tutorial notes, and when to use it in Chinese knot crafts.`,
    path: `/knots/${item.slug}/`,
    h1: item.name,
    intro: `A focused guide to the ${item.name}, including meaning, use cases, and beginner practice notes.`,
    heroLabel: "Knot profile",
    faqs: standardFaqs(),
    articleSidebar: true,
    body: `${articleSearchBlock()}<section class="content-section article-body"><p class="lead-answer">${escapeHtml(item.name)} is commonly used for ${escapeHtml(item.use.toLowerCase())}. Its symbolic reading is usually connected with ${escapeHtml(item.meaning.toLowerCase())}</p><p>The useful way to choose this knot is to match difficulty, cord thickness, and final use before starting the tutorial.</p></section><section class="content-section split"><div class="fact-card"><strong>Quick facts</strong><span>Difficulty: ${escapeHtml(item.difficulty)}</span><span>Best use: ${escapeHtml(item.use)}</span></div><div class="fact-card"><strong>Meaning note</strong><span>${escapeHtml(item.meaning)}</span></div></section>${keywordTable(keywordRows.filter((row) => item.keywords.includes(row.keyword)).slice(0, 8), `${item.name} keyword cluster`, "Knot Intent")}${relatedGuidesBlock("Continue learning", [guides[0], guides[2], guides[3], guides[7]])}${faqBlock(standardFaqs())}`
  });
}

function simpleInfoPage({ title, description, path, h1, intro, body }) {
  return pageLayout({ title, description, path, h1, intro, body, heroLabel: "Site information" });
}

function simpleLegalPage({ title, description, path, h1, intro, sections }) {
  return pageLayout({ title, description, path, h1, intro, heroLabel: "Legal information", body: sections.map((section) => `<section class="content-section article-body"><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.text)}</p></section>`).join("") });
}

await writePage("/", pageLayout({
  title: "Chinese Knot Guide: Tutorials, Meanings, Types, Cord, and Gift Ideas",
  description: SITE.description,
  path: "/",
  h1: "Chinese Knot Guide",
  intro: "Learn Chinese knot tutorials, symbolic meanings, common knot types, cord choices, bracelet ideas, and gift use cases.",
  heroLabel: "Chinese knot tutorial and meaning guide",
  body: `<section class="knot-hero">
    <div class="knot-pattern" aria-hidden="true"></div>
    <div class="knot-hero-copy">
      <p class="eyebrow">Traditional Craft & Gift Symbolism</p>
      <h2>Chinese knots for tutorials, meanings, bracelets, and festive decor.</h2>
      <p>Learn knot types, cord choices, symbolic meanings, and small gift projects with a product-ready structure for future affiliate items.</p>
      <div class="knot-actions"><a class="button-link" href="/chinese-knot-tutorial/">Start tutorial</a><a class="button-link secondary" href="/types-of-chinese-knots/">Compare knot types</a></div>
    </div>
    <div class="knot-hero-visual" aria-label="Chinese knot display">
      <img src="/assets/knot-ornament-hero.webp" alt="Premium red Chinese knot hanging ornament in a warm traditional interior">
      <div class="knot-float-card top"><strong>Good Luck Knot</strong><span>Beginner decor</span></div>
      <div class="knot-float-card bottom"><strong>Bracelet Projects</strong><span>Gift-ready craft</span></div>
    </div>
  </section>
  <section class="knot-stats" aria-label="Chinese knot guide strengths"><div><strong>Tutorials</strong><span>step-by-step learning</span></div><div><strong>Meanings</strong><span>symbol and color notes</span></div><div><strong>Products</strong><span>bracelet and gift paths</span></div><div><strong>Supplies</strong><span>cord and material choices</span></div></section>
  <section class="knot-section tutorial-showcase"><div class="section-heading"><p class="eyebrow">Learn First</p><h2>Choose a practical tutorial path</h2></div><div class="tutorial-grid"><a href="/chinese-knot-tutorial/"><img src="/assets/knot-beginner-tutorial.webp" alt="Simple red Chinese good luck knot on a wooden practice board for beginner tutorials"><span>01</span><strong>Beginner tutorial</strong><small>Start with cord control, simple shapes, and clean tightening.</small></a><a href="/how-to-tie-chinese-knot/"><img src="/assets/knot-tying-steps.webp" alt="Red cord Chinese knot in an early tying stage with pins on a wooden board"><span>02</span><strong>How to tie</strong><small>Follow the setup and tension rules before complex patterns.</small></a><a href="/chinese-knot-cord/"><img src="/assets/knot-cord-materials.webp" alt="Organized silk cords, beads, and tassels for choosing Chinese knot materials"><span>03</span><strong>Choose cord</strong><small>Pick the right thickness, color, and finish for the project.</small></a></div></section>
  <section class="knot-section knot-product-zone"><div class="section-heading"><p class="eyebrow">Gift & Product Paths</p><h2>Build future product pages from clear use cases</h2></div><div class="product-grid"><a href="/chinese-knot-bracelet/"><img src="/assets/knot-bracelet-gifts.webp" alt="Red Chinese knot bracelets and gift box arranged as premium handmade gifts"><span>Bracelet</span><strong>Adjustable red cord bracelets</strong><p>Small gift items, symbolic color, and beginner-friendly designs.</p></a><a href="/chinese-knot-keychain/"><img src="/assets/knot-keychain-charms.webp" alt="Chinese knot keychain charms with tassels and metal rings on warm wood"><span>Keychain</span><strong>Lightweight charms and souvenirs</strong><p>Good for affiliate products, craft kits, and cultural gift guides.</p></a><a href="/chinese-knot-meaning/"><img src="/assets/knot-decor-ornaments.webp" alt="Red Chinese knot hanging ornaments in an elegant warm traditional interior"><span>Decor</span><strong>Festival hanging ornaments</strong><p>Meaning-led pages for home decor, Lunar New Year, and gifting.</p></a></div></section>
  <section class="knot-section"><div class="section-heading"><p class="eyebrow">Knot Types</p><h2>Common Chinese knots to learn first</h2></div>${knotCards()}</section>
  ${latestGuidesBlock()}`
}));

await writePage("/guides/", pageLayout({
  title: "Chinese Knot Guides: Tutorials, Meanings, Types, Cord, and Crafts",
  description: "Browse Chinese knot guides covering tutorials, symbolic meanings, knot types, cord choices, bracelets, keychains, and DIY craft ideas.",
  path: "/guides/",
  h1: "Chinese Knot Guides",
  intro: "Browse tutorials, meaning guides, knot type references, and craft support pages.",
  body: `${articleSearchBlock()}<section class="content-section latest-guides"><div class="section-heading"><p class="eyebrow">Guide Library</p><h2>Browse all Chinese knot guides</h2></div>${guideFilterBlock()}<div class="guide-grid">${guides.map(guideCard).join("")}</div></section>${keywordTable(meaningKeywords.slice(0, 10), "Meaning and type keyword cluster", "Publishing Queue")}`
}));

await writePage("/chinese-knot-tutorial/", supportArticle({
  title: "Chinese Knot Tutorial: Beginner Practice Path and Step Order",
  description: "Start a Chinese knot tutorial path with beginner-friendly practice order, cord setup, simple knots, and common mistakes.",
  path: "/chinese-knot-tutorial/",
  h1: "Chinese Knot Tutorial",
  intro: "The easiest Chinese knot tutorial path starts with cord control before complex decorative patterns.",
  answer: "A beginner Chinese knot tutorial should start with a simple good luck knot, double coin knot, or bracelet knot before moving into larger decorative knots. The first goal is even tension and clean loop control.",
  details: ["Choose medium cord that is easy to see and not too slippery. Start with one knot type and repeat it several times before changing designs.", "Tutorial pages should show purpose, cord setup, step order, common mistakes, and what project the knot fits best."],
  related: [guides[1], guides[3], guides[7], guides[8]]
}));

await writePage("/how-to-tie-chinese-knot/", supportArticle({
  title: "How to Tie a Chinese Knot: Simple Beginner Method and Practice Tips",
  description: "Learn how to tie a Chinese knot with a simple beginner method, cord preparation, tension control, and common mistakes to avoid.",
  path: "/how-to-tie-chinese-knot/",
  h1: "How to Tie a Chinese Knot",
  intro: "Tying Chinese knots becomes easier when you prepare the cord, keep loops even, and tighten gradually.",
  answer: "To tie a Chinese knot, start with a simple pattern, lay the cord flat, keep the loops even, and tighten slowly from both sides. Do not pull hard before the shape is aligned.",
  details: ["Most beginner mistakes come from uneven tension. The knot may be technically correct but look messy if loops are pulled at different speeds.", "For photo tutorials and video tutorials, high contrast cord and a plain background make every step easier to follow."],
  related: [guides[0], guides[3], guides[7], guides[8]]
}));

await writePage("/chinese-knot-meaning/", supportArticle({
  title: "Chinese Knot Meaning: Symbolism, Colors, Gifts, and Common Uses",
  description: "Understand Chinese knot meaning, including good luck symbolism, endless knot ideas, red color use, gifts, and decorative contexts.",
  path: "/chinese-knot-meaning/",
  h1: "Chinese Knot Meaning",
  intro: "Chinese knot meaning depends on shape, color, placement, and use case.",
  answer: "Chinese knots often symbolize blessing, continuity, reunion, good luck, and festive wishes. Red knots are especially common because red is strongly associated with celebration and auspicious meaning in Chinese culture.",
  details: ["Meaning should be explained as cultural symbolism, not as a guaranteed outcome. A knot used as a gift carries wishes and visual meaning rather than a fixed promise.", "Different knot types can shift the reading. An endless knot emphasizes continuity, while a double coin knot often points toward wealth symbolism."],
  related: [guides[4], guides[3], guides[8], guides[9]]
}));

await writePage("/types-of-chinese-knots/", pageLayout({
  title: "Types of Chinese Knots: Good Luck, Button, Pan Chang, and More",
  description: "Compare common types of Chinese knots by difficulty, meaning, use case, tutorial path, and craft or gift potential.",
  path: "/types-of-chinese-knots/",
  h1: "Types of Chinese Knots",
  intro: "Different Chinese knots serve different purposes, from beginner practice to symbolic decor and bracelet projects.",
  faqs: standardFaqs(),
  articleSidebar: true,
  body: `${articleSearchBlock()}<section class="content-section article-body"><p class="lead-answer">Common Chinese knot types include good luck knots, button knots, Pan Chang knots, double coin knots, endless knots, and bracelet knots. Beginners should compare difficulty and use case before choosing a tutorial.</p></section><section class="content-section"><div class="section-heading"><p class="eyebrow">Comparison</p><h2>Chinese knot type table</h2></div>${knotTable()}</section>${keywordTable(typeKeywords.slice(0, 10), "Knot type keyword cluster", "Type Intent")}${faqBlock(standardFaqs())}`
}));

await writePage("/endless-knot-meaning/", supportArticle({ title: "Endless Knot Meaning in Chinese Knotwork and Symbolic Gifts", description: "Learn endless knot meaning, how it connects with continuity, relationship symbolism, and decorative Chinese knot use.", path: "/endless-knot-meaning/", h1: "Endless Knot Meaning", intro: "The endless knot is read through continuity, interconnection, and unbroken pattern symbolism.", answer: "The endless knot commonly represents continuity, connection, and an unbroken cycle. In gift or decorative contexts, it can suggest lasting wishes, ongoing harmony, or a continuous bond.", details: ["Its meaning is symbolic and visual. It should not be treated as a guarantee of luck or relationship outcome.", "For content planning, this topic works well as a meaning page with internal links to Pan Chang and knot type pages."], related: [guides[2], guides[3], guides[6], guides[8]] }));
await writePage("/chinese-button-knot/", supportArticle({ title: "Chinese Button Knot: Meaning, Uses, Tutorial Notes, and Craft Ideas", description: "Learn what a Chinese button knot is used for, how it works in closures, bracelets, keychains, and beginner knotting projects.", path: "/chinese-button-knot/", h1: "Chinese Button Knot", intro: "The Chinese button knot is both decorative and functional, which makes it useful for small craft projects.", answer: "A Chinese button knot is a compact decorative knot often used as a closure, bracelet feature, cord ending, or keychain detail. It is more structured than a simple starter knot but still practical for learners.", details: ["The main challenge is keeping the knot round and even while tightening.", "This page can later support product content around bracelets, keychains, and cord supplies."], related: [guides[0], guides[3], guides[7], guides[8]] }));
await writePage("/pan-chang-knot/", supportArticle({ title: "Pan Chang Knot: Meaning, Tutorial Notes, and Symbolic Use", description: "Learn Pan Chang knot meaning, endless knot connection, common use cases, and why it is a strong Chinese knot content cluster.", path: "/pan-chang-knot/", h1: "Pan Chang Knot", intro: "The Pan Chang knot is one of the strongest symbolic knot topics for Chinese knot content.", answer: "The Pan Chang knot is commonly linked with endless-knot symbolism, continuity, and connectedness. It is useful for decor, pendants, and meaning-focused Chinese knot guides.", details: ["It is not always the best first knot for a complete beginner because the structure needs more loop control.", "For SEO, Pan Chang works as both a knot type page and a meaning article cluster."], related: [guides[4], guides[2], guides[3], guides[0]] }));
await writePage("/chinese-knot-cord/", supportArticle({ title: "Chinese Knot Cord: Sizes, Materials, Colors, and Beginner Choices", description: "Choose Chinese knot cord by thickness, material, color, texture, and project type for tutorials, bracelets, ornaments, and keychains.", path: "/chinese-knot-cord/", h1: "Chinese Knot Cord", intro: "Cord choice changes how easy a Chinese knot is to learn and how polished the final project looks.", answer: "Beginners should choose medium-thickness cord that is visible, flexible, and not too slippery. Nylon cord is common for Chinese knotting, while color choice depends on project and symbolism.", details: ["Thin cord can be hard to control. Very thick cord can make small knots bulky. A medium cord is usually the best first purchase.", "This page is also a later monetization bridge for cord, bracelet, keychain, and DIY supply recommendations."], related: [guides[0], guides[1], guides[8], guides[9]] }));
await writePage("/chinese-knot-bracelet/", supportArticle({ title: "Chinese Knot Bracelet: Tutorial Ideas, Meaning, Cord, and Gift Use", description: "Explore Chinese knot bracelet ideas, beginner tutorial paths, cord choices, symbolic meaning, and gift or small product uses.", path: "/chinese-knot-bracelet/", h1: "Chinese Knot Bracelet", intro: "Chinese knot bracelets are useful because they combine tutorial demand with product and gift intent.", answer: "A Chinese knot bracelet usually combines a small decorative knot, adjustable cord, and color symbolism. It can work as a beginner DIY project, gift idea, or lightweight product category.", details: ["For beginners, a bracelet project is easier when the knot is repeated cleanly and the closure is simple.", "For monetization later, bracelet pages can support supplies, finished products, and printable or visual tutorial assets."], related: [guides[0], guides[7], guides[9], guides[5]] }));
await writePage("/chinese-knot-keychain/", supportArticle({ title: "Chinese Knot Keychain: DIY Ideas, Meaning, Cord, and Gift Projects", description: "Learn Chinese knot keychain ideas, beginner-friendly knot types, cord choices, symbolic use, and small gift product potential.", path: "/chinese-knot-keychain/", h1: "Chinese Knot Keychain", intro: "Keychains are a practical Chinese knot project because they are small, giftable, and easy to photograph.", answer: "A Chinese knot keychain usually uses a compact knot, durable cord, and a small ring or charm. It works well for good-luck gifts, craft practice, and lightweight product ideas.", details: ["Good keychain projects need stronger cord and cleaner finishing than purely decorative hanging knots.", "This topic has commercial intent, so it can later support affiliate or handmade product pages without changing the site structure."], related: [guides[8], guides[7], guides[0], guides[2]] }));

for (const knot of knots) {
  await writePage(`/knots/${knot.slug}/`, knotPage(knot));
}

await writePage("/chinese-knot-faq/", pageLayout({ title: "Chinese Knot FAQ: Tutorials, Meanings, Cord, Gifts, and Knot Types", description: "Browse common questions about Chinese knot tutorials, meanings, cord choice, bracelets, keychains, and symbolic uses.", path: "/chinese-knot-faq/", h1: "Chinese Knot FAQ", intro: "Use this FAQ for quick answers about Chinese knots, tutorials, meanings, and supplies.", faqs: standardFaqs(), body: `${articleSearchBlock()}${faqBlock(standardFaqs())}` }));
await writePage("/about/", simpleInfoPage({ title: "About Chinese Knot Guide and Its Tutorial Reference Scope", description: "Learn what Chinese Knot Guide covers, including tutorials, meanings, knot types, cord choices, bracelets, keychains, and symbolic use.", path: "/about/", h1: "About Chinese Knot Guide", intro: "This site explains Chinese knots for learners, craft buyers, and content researchers.", body: `<section class="content-section article-body"><h2>What this site covers</h2><p>Chinese Knot Guide covers beginner tutorials, symbolic meanings, common knot types, cord choices, bracelet projects, keychain ideas, and future supply or gift pages.</p><p>The site is built for practical learning first, then product and gift expansion after traffic data is available.</p></section><section class="content-section article-body"><h2>How to use the site</h2><p>Start with tutorials if you want to make knots. Start with meaning pages if you are researching symbols, gifts, or decorations.</p></section>` }));
await writePage("/contact/", simpleInfoPage({ title: "Contact Chinese Knot Guide for Corrections and Craft Feedback", description: "Contact Chinese Knot Guide for page corrections, tutorial feedback, cord notes, product suggestions, or relevant partnership discussion.", path: "/contact/", h1: "Contact", intro: "Use this page for corrections, feedback, or site-related discussion.", body: `<section class="content-section article-body"><h2>Email</h2><p>Email: <a href="mailto:guan@shanyuegroup.com">guan@shanyuegroup.com</a></p><p>Please include the page URL and the knot type if your message is about a tutorial correction.</p></section><section class="content-section article-body"><h2>Scope</h2><p>The site can review tutorial clarity, meaning notes, and product category ideas, but it does not guarantee craft outcomes for every cord or project.</p></section>` }));
await writePage("/privacy/", simpleLegalPage({ title: "Privacy Policy for Chinese Knot Guide Website Visitors", description: "Read the Chinese Knot Guide privacy policy covering analytics, email contact use, and standard website visitor data handling.", path: "/privacy/", h1: "Privacy Policy", intro: "This page explains what data may be handled through normal site usage.", sections: [{ title: "Analytics", text: "The site may use analytics tools to understand visits, pages viewed, and general content performance." }, { title: "Contact", text: "If you contact the site by email, the information you send is used only for that communication." }, { title: "No user accounts", text: "The current site does not provide public user accounts, subscriptions, or checkout forms." }] }));
await writePage("/terms/", simpleLegalPage({ title: "Terms of Use for Chinese Knot Guide Tutorial Content", description: "Review the terms of use for Chinese Knot Guide, including educational reference scope, craft limitations, and symbolic meaning boundaries.", path: "/terms/", h1: "Terms of Use", intro: "This site provides educational reference content about Chinese knots, tutorials, supplies, and meanings.", sections: [{ title: "Reference use", text: "Content is provided for general educational and informational use only." }, { title: "No craft guarantee", text: "Tutorial results depend on cord, hand practice, tools, and individual skill." }, { title: "Meaning boundaries", text: "Symbolic meanings are cultural reference notes, not promises of luck, outcome, or personal result." }] }));

await writeFile("dist/toolkit.js", clientScript(), "utf8");
await writeFile("dist/styles.css", css() + themeCss(), "utf8");
await writeFile("dist/sitemap.xml", sitemapXml(), "utf8");
await writeFile("dist/robots.txt", robotsTxt(), "utf8");
await writeFile("dist/llms.txt", llmsTxt(), "utf8");
await buildSeoReport();

async function writePage(path, html) {
  const file = path === "/" ? join("dist", "index.html") : join("dist", path, "index.html");
  await mkdir(join(file, ".."), { recursive: true });
  await writeFile(file, html, "utf8");
}

function sitemapXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((page) => `  <url><loc>${absolute(page.path)}</loc></url>`).join("\n")}\n</urlset>\n`;
}

function robotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`;
}

function llmsTxt() {
  return `# Chinese Knot Guide\n- Home: ${SITE.url}/\n- Tutorial: ${SITE.url}/chinese-knot-tutorial/\n- Meaning: ${SITE.url}/chinese-knot-meaning/\n- Types: ${SITE.url}/types-of-chinese-knots/\n- Cord: ${SITE.url}/chinese-knot-cord/\n- Sitemap: ${SITE.url}/sitemap.xml\n`;
}

async function buildSeoReport() {
  const sitemap = await readFile("dist/sitemap.xml", "utf8");
  const reports = [];
  for (const page of pages) {
    const file = page.path === "/" ? join("dist", "index.html") : join("dist", page.path, "index.html");
    reports.push(auditPage(page, await readFile(file, "utf8"), sitemap));
  }
  const totals = { average: Math.round(reports.reduce((sum, item) => sum + item.score, 0) / reports.length), pages: reports.length, pass: reports.filter((item) => item.score >= 85).length, review: reports.filter((item) => item.score >= 70 && item.score < 85).length, fix: reports.filter((item) => item.score < 70).length };
  const rows = reports.map((item) => `<tr><td><a href="${item.path}">${item.path}</a></td><td>${item.score}</td><td>${item.titleLength}</td><td>${item.descriptionLength}</td><td>${item.wordCount}</td><td>${item.h1}/${item.h2}</td><td>${item.faqs}</td><td>${escapeHtml(item.issues.join("; ") || "None")}</td></tr>`).join("");
  await mkdir("dist/admin", { recursive: true });
  await writeFile("dist/admin/seo-report.json", JSON.stringify({ generatedAt: new Date().toISOString(), totals, reports }, null, 2), "utf8");
  await writePage("/admin/seo-report/", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Pre-Publish SEO Check</title><meta name="robots" content="noindex,nofollow"><meta name="description" content="Internal publishing QA report for Chinese Knot Guide pages."><link rel="canonical" href="${absolute("/admin/seo-report/")}"><link rel="stylesheet" href="/styles.css?v=${SITE.assetVersion}"></head><body class="seo-report-page"><main><section class="content-section report-hero"><p class="eyebrow">Publishing QA</p><h1>Pre-Publish SEO Check</h1><p>Internal checks for title, description, headings, FAQ, canonical, schema, sitemap, internal links, images, and content depth.</p><div class="report-summary"><div><strong>${totals.average}</strong><span>Average score</span></div><div><strong>${totals.pages}</strong><span>Pages</span></div><div><strong>${totals.pass}</strong><span>Pass</span></div><div><strong>${totals.review}</strong><span>Review</span></div><div><strong>${totals.fix}</strong><span>Fix</span></div></div></section><section class="content-section"><div class="table-wrap"><table class="seo-table"><thead><tr><th>URL</th><th>Score</th><th>Title</th><th>Description</th><th>Words</th><th>H1/H2</th><th>FAQ</th><th>Issues</th></tr></thead><tbody>${rows}</tbody></table></div></section></main></body></html>`);
}

function auditPage(page, html, sitemap) {
  const title = (html.match(/<title>(.*?)<\/title>/i) || [])[1] || "";
  const description = (html.match(/<meta name="description" content="([^"]*)"/i) || [])[1] || "";
  const h1 = (html.match(/<h1/g) || []).length;
  const h2 = (html.match(/<h2/g) || []).length;
  const faqCount = (html.match(/"@type":"Question"/g) || []).length;
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const issues = [];
  if (title.length < 35 || title.length > 78) issues.push("title length");
  if (description.length < 90 || description.length > 170) issues.push("description length");
  if (h1 !== 1) issues.push("h1 count");
  if (h2 < 2) issues.push("low h2 count");
  if (!sitemap.includes(`<loc>${absolute(page.path)}</loc>`)) issues.push("missing from sitemap");
  const needsFaq = page.path.startsWith("/knots/") || page.path.includes("knot") || page.path.includes("bracelet") || page.path.includes("cord");
  if (needsFaq && page.path !== "/guides/" && faqCount < 2) issues.push("missing FAQ");
  if (wordCount < 180) issues.push("thin content");
  return { path: page.path, score: Math.max(54, Math.min(100, 100 - issues.length * 8 + (wordCount > 520 ? 4 : 0))), titleLength: title.length, descriptionLength: description.length, wordCount, h1, h2, faqs: faqCount, issues };
}

function clientScript() {
  const knotTargets = knots.map((item) => ({ ...item, path: `/knots/${item.slug}/` }));
  const guideTargets = guides.map((guide) => ({ title: guide.title, path: guide.path, category: guide.category }));
  return `const knots=${JSON.stringify(knotTargets)};const guideTargets=${JSON.stringify(guideTargets)};function resultLink(path,label){return '<div class="result-actions"><a class="button-link" href="'+path+'">'+label+'</a></div>'}document.querySelectorAll('[data-knot-form]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(form);const goal=data.get('goal');const skill=data.get('skill');const paths={learn:skill==='beginner'?'/chinese-knot-tutorial/':'/pan-chang-knot/',meaning:'/chinese-knot-meaning/',bracelet:'/chinese-knot-bracelet/',supplies:'/chinese-knot-cord/'};const titles={learn:'Start with a tutorial path',meaning:'Start with symbolic meanings',bracelet:'Start with bracelet and keychain projects',supplies:'Start with cord and supply choices'};const box=form.parentElement.querySelector('[data-knot-result]');box.hidden=false;box.innerHTML='<h3>'+titles[goal]+'</h3><p>Use this page first, then move into knot type pages after the basic decision is clear.</p>'+resultLink(paths[goal],'Open guide');}));document.querySelectorAll('[data-site-search]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();const q=String(new FormData(form).get('q')||'').toLowerCase().trim();if(!q){location.href='/guides/';return}const direct=[{pattern:/bracelet/,path:'/chinese-knot-bracelet/'},{pattern:/keychain/,path:'/chinese-knot-keychain/'},{pattern:/cord|string|supply|material/,path:'/chinese-knot-cord/'},{pattern:/tutorial|how to|tie|step/,path:'/chinese-knot-tutorial/'},{pattern:/endless/,path:'/endless-knot-meaning/'},{pattern:/pan chang/,path:'/pan-chang-knot/'},{pattern:/button/,path:'/chinese-button-knot/'},{pattern:/meaning|symbol|color|luck/,path:'/chinese-knot-meaning/'},{pattern:/type|double coin/,path:'/types-of-chinese-knots/'}].find(item=>item.pattern.test(q));if(direct){location.href=direct.path;return}const knot=knots.find(item=>q.includes(item.name.toLowerCase().replace('chinese ',''))||item.keywords.some(k=>q.includes(k)));if(knot){location.href=knot.path;return}const match=guideTargets.find(item=>item.title.toLowerCase().split(' ').some(word=>word.length>3&&q.includes(word)));location.href=match?match.path:'/guides/';}));document.querySelectorAll('[data-guide-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-guide-filter]').forEach(item=>item.classList.remove('is-active'));button.classList.add('is-active');const value=button.dataset.guideFilter;document.querySelectorAll('[data-guide-card]').forEach(card=>{card.hidden=value!=='all'&&card.dataset.guideCategory!==value;});}));`;
}

function css() {
  return `:root{--ink:#211d18;--muted:#62594e;--paper:#f7f2ea;--panel:#fffdfa;--line:#e3d6c7;--red:#a83228;--red-dark:#82251e;--gold:#b88c4a;--jade:#286b61;--shadow:0 10px 28px rgba(47,37,23,.08)}*{box-sizing:border-box}body{margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;color:var(--ink);background:var(--paper);font-size:16px;line-height:1.62}a{color:inherit}.site-header{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:13px clamp(18px,4vw,52px);background:rgba(247,242,234,.96);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-size:17px;font-weight:780;white-space:nowrap}.brand-logo{display:block;width:34px;height:34px;border-radius:8px;box-shadow:0 8px 18px rgba(168,50,40,.18)}.nav{display:flex;align-items:center;justify-content:flex-end;gap:18px;flex-wrap:wrap}.nav a{text-decoration:none;color:#554d45;font-size:15px;font-weight:720;line-height:1.2;padding:4px 0}.nav a:hover{color:var(--red)}main{min-height:70vh}.page-hero{padding:28px clamp(18px,4vw,52px) 16px;max-width:1160px;margin:auto}.page-hero h1{font-family:Georgia,serif;font-size:clamp(31px,3.6vw,46px);line-height:1.08;margin:9px 0 10px;color:#211b17}.intro{font-size:16px;max-width:760px;color:var(--muted)}.eyebrow{display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:rgba(40,107,97,.08);border:1px solid rgba(40,107,97,.18);text-transform:uppercase;letter-spacing:.05em;color:var(--jade);font-size:12px;line-height:1;font-weight:780;margin:0}.hero-grid,.content-section{max-width:1160px;margin:0 auto 22px;padding:0 clamp(18px,4vw,52px)}.hero-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(300px,.95fr);gap:22px;align-items:stretch}.tool-page{max-width:820px;margin:0 auto 22px;padding:0 clamp(18px,4vw,40px)}.tool-panel,.visual-panel,.content-section:not(.split),.fact-card{background:var(--panel);border:1px solid var(--line);box-shadow:var(--shadow);border-radius:8px}.tool-panel{padding:22px;border-top:4px solid var(--red)}.tool-copy h2,.section-heading h2,.content-section h2{font-family:Georgia,serif;font-size:clamp(22px,2.2vw,27px);line-height:1.18;margin:8px 0 10px;color:#241f1a}.content-section p{max-width:820px}.calculator-form{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:end;margin-top:16px;max-width:620px}.calculator-form button{grid-column:1/-1;width:100%}.calculator-form label{display:grid;gap:7px;font-size:14px;font-weight:720}.calculator-form input,.calculator-form select{height:43px;border:1px solid var(--line);border-radius:8px;padding:0 12px;font:inherit;background:#fff;width:100%;min-width:0}.calculator-form button,.button-link{min-height:43px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:8px;background:var(--red);color:#fff;font-size:14px;font-weight:780;text-decoration:none;padding:0 15px;cursor:pointer;white-space:nowrap}.button-link.secondary{background:#f2eadf;color:#3a3028;border:1px solid #dfd1bd}.result-card{margin-top:16px;padding:16px;border-left:4px solid var(--jade);background:#eff7f3;border-radius:8px}.result-card h3{margin:0 0 10px;font-size:20px}.result-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}.visual-panel{position:relative;margin:0;display:grid;place-items:center;overflow:hidden;background:linear-gradient(145deg,#fffaf0,#f1eadb);padding:18px}.visual-panel img{width:92%;height:92%;object-fit:contain;filter:drop-shadow(0 18px 28px rgba(80,50,25,.12))}.ad-slot{max-width:1056px;margin:0 auto 22px;border:1px dashed #d7c8b5;background:#fffaf1;color:#8a7257;border-radius:8px;min-height:70px;display:grid;place-items:center;font-size:13px;font-weight:720}.section-heading{margin-bottom:14px}.animal-grid,.guide-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.guide-grid.compact{grid-template-columns:repeat(2,minmax(0,1fr))}.animal-card,.guide-card{background:#fff;border:1px solid var(--line);border-radius:8px;padding:16px}.animal-card{text-decoration:none;min-height:180px;display:grid;gap:7px;position:relative;grid-template-columns:50px minmax(0,1fr);grid-template-rows:auto auto 1fr;column-gap:16px;row-gap:6px;padding:20px 22px;overflow:hidden}.animal-card strong{grid-column:2;grid-row:1;padding-right:34px;margin-top:1px;color:#12100e;font-size:18px;font-weight:740}.animal-card>span:not(.animal-order):not(.animal-seal){grid-column:2;grid-row:2;color:#4d463f;font-size:14px}.animal-card p{grid-column:2;grid-row:3;margin-top:8px;color:var(--muted)}.animal-seal{grid-column:1;grid-row:1/3;align-self:start;display:grid;place-items:center;width:50px;height:50px;border-radius:12px;background:#fff2e7;border:1px solid rgba(168,50,40,.24);color:var(--red);font-family:Georgia,serif;font-size:26px;font-weight:850;line-height:1;box-shadow:0 8px 16px rgba(60,40,20,.08)}.animal-order{position:absolute;right:18px;top:18px;color:#4f463d;font-size:13px;font-weight:760}.guide-card{text-decoration:none;display:grid;gap:8px;min-height:172px;background:linear-gradient(180deg,#fffefa,#fffaf2)}.guide-card span{font-size:12px;color:var(--jade);font-weight:780;text-transform:uppercase;letter-spacing:.05em}.guide-card strong{font-size:18px;font-weight:740}.guide-card p{margin:0;color:var(--muted)}.guide-filter-nav{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:18px}.guide-filter-nav button{border:1px solid var(--line);background:#fff;border-radius:999px;min-height:37px;padding:0 14px;font:inherit;font-weight:720;color:#4f463d;cursor:pointer}.guide-filter-nav button.is-active,.guide-filter-nav button:hover{background:#f3ebe0;border-color:#d6b57d;color:#352b22}.section-action{display:flex;justify-content:flex-start;margin-top:16px}.split{display:grid;grid-template-columns:1fr 1fr;gap:22px}.split>div{background:var(--panel);border:1px solid var(--line);box-shadow:var(--shadow);border-radius:8px;padding:22px}.fact-card{display:grid;gap:8px}.fact-card strong{font-size:20px}.fact-card span{display:block;color:var(--muted)}.table-wrap{overflow:auto}.content-section table{width:100%;border-collapse:collapse;background:#fff;font-size:15px}.content-section th,.content-section td{padding:10px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}.content-section th{background:#f1eadc;color:#352b22}.article-shell{max-width:1160px;margin:0 auto 22px;padding:0 clamp(18px,4vw,52px);display:grid;grid-template-columns:minmax(0,.96fr) minmax(270px,.44fr);gap:22px;align-items:start}.article-main{min-width:0}.article-sidebar{display:grid;gap:18px;position:sticky;top:92px}.sidebar-card{background:var(--panel);border:1px solid var(--line);box-shadow:var(--shadow);border-radius:8px;padding:18px}.sidebar-card.compact{display:grid;gap:12px}.sidebar-link-list{display:grid;gap:12px}.sidebar-link-list a{text-decoration:none;display:grid;gap:4px;padding-bottom:12px;border-bottom:1px solid #ece2d4}.sidebar-link-list a:last-child{padding-bottom:0;border-bottom:0}.sidebar-link-list strong{font-size:15px}.sidebar-link-list span{font-size:14px;color:var(--muted)}.article-search{display:grid;grid-template-columns:minmax(260px,.9fr) minmax(300px,1.1fr);gap:22px;align-items:end}.article-search h2{margin-bottom:0}.site-search-form{display:grid;grid-template-columns:minmax(220px,1fr) auto;gap:12px;align-items:end}.site-search-form label{display:grid;gap:7px;font-size:14px;font-weight:720}.site-search-form input{height:43px;border:1px solid var(--line);border-radius:8px;padding:0 12px;font:inherit;background:#fff;width:100%;min-width:0}.site-search-form button{min-height:43px;border:0;border-radius:8px;background:var(--jade);color:#fff;font-size:14px;font-weight:780;padding:0 16px;cursor:pointer;white-space:nowrap}.article-body{background:transparent!important;border:0!important;box-shadow:none!important;padding-top:0;padding-bottom:0}.lead-answer{font-size:18px;line-height:1.72;color:#302820}.faq-list h2{margin-bottom:18px}.faq-categories{display:grid;gap:12px}.faq-category{background:#fff;border:1px solid var(--line);border-radius:8px;overflow:hidden}.faq-category summary{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:15px 18px;cursor:pointer;font-weight:780;color:#2f2922;background:#fbf7ef}.faq-category summary small{color:var(--muted);font-size:13px;font-weight:720;white-space:nowrap}.faq-grid{display:grid;gap:12px;border-top:1px solid var(--line);padding:16px 18px 18px;background:#fffdf9}.faq-item{display:grid;grid-template-columns:minmax(260px,.36fr) minmax(0,.64fr);gap:0;overflow:hidden;border:1px solid #e6dac8;border-radius:8px;background:#fff;box-shadow:0 6px 16px rgba(47,37,23,.04)}.faq-item h3{display:flex;align-items:center;margin:0;padding:18px 20px;background:#f5efe5;border-right:1px solid #e2d4c0;font-size:16px;line-height:1.38;color:#211b17}.faq-item p{margin:0;padding:18px 20px;color:var(--muted);max-width:none;border-left:4px solid rgba(40,107,97,.2);background:#fff}.site-footer{display:grid;grid-template-columns:minmax(260px,1.15fr) minmax(420px,.85fr);align-items:start;margin-top:44px;padding:34px clamp(18px,4vw,52px);background:#24201b;color:#fffaf0;gap:28px}.footer-about strong{display:block;font-size:18px;margin-bottom:10px}.footer-about p{margin:0;color:#d7cbbd;line-height:1.72;font-size:14px}.footer-nav{display:grid!important;grid-template-columns:repeat(3,minmax(110px,1fr));gap:24px!important;align-items:start!important}.footer-nav div{display:grid;gap:8px}.footer-nav span{color:#bfae98;font-size:12px;font-weight:780;text-transform:uppercase;letter-spacing:.06em}.footer-nav a{text-decoration:none;font-size:14px;color:#fffaf0}.report-hero,.seo-table{background:#fff;border:1px solid var(--line);border-radius:8px;box-shadow:var(--shadow)}.report-hero{padding:22px}.report-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-top:16px}.report-summary div{background:#fbf7ef;border:1px solid var(--line);border-radius:8px;padding:12px}.report-summary strong{display:block;font-size:24px}.report-summary span{color:var(--muted)}body:not(.page-home):not(.page-guides):not(.seo-report-page) .tool-page,body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-body,body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-search,body:not(.page-home):not(.page-guides):not(.seo-report-page) .content-section{max-width:980px;margin-left:auto;margin-right:auto}@media(max-width:980px){.guide-grid,.animal-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.article-shell{grid-template-columns:1fr}.article-sidebar{position:static}}@media(max-width:820px){body{font-size:15px}.site-header{align-items:flex-start;flex-direction:column}.nav{justify-content:flex-start;gap:14px}.nav a{font-size:14px}.hero-grid,.split{grid-template-columns:1fr}.calculator-form,.site-search-form,.article-search{grid-template-columns:1fr}.animal-grid,.guide-grid,.guide-grid.compact,.report-summary{grid-template-columns:1fr}.page-hero h1{font-size:31px}.faq-category summary{align-items:flex-start;flex-direction:column;gap:4px}.faq-grid{padding:12px}.faq-item{grid-template-columns:1fr}.faq-item h3{border-right:0;border-bottom:1px solid #e2d4c0}.faq-item p{border-left:0;border-top:4px solid rgba(40,107,97,.16)}.site-footer{grid-template-columns:1fr}.footer-nav{grid-template-columns:1fr 1fr!important}}`;
}

function themeCss() {
  return `
html,body{overflow-x:hidden}
body{background:#1a0a0a;color:#f5e6d3;background-image:radial-gradient(circle at 78% 18%,rgba(196,30,58,.24),transparent 28%),radial-gradient(circle at 12% 72%,rgba(212,175,55,.12),transparent 24%)}
.site-header{background:rgba(26,10,10,.94);border-bottom-color:rgba(196,30,58,.24);box-shadow:0 12px 36px rgba(0,0,0,.24)}
.brand{color:#f5e6d3}.nav a{color:rgba(245,230,211,.68)}.nav a:hover{color:#ffd580}
.page-home .page-hero{display:none}.page-home main{padding-top:0}.page-home .content-section:not(.split){background:rgba(255,255,255,.035);border-color:rgba(196,30,58,.18);box-shadow:0 18px 46px rgba(0,0,0,.18)}
.knot-hero{position:relative;display:grid;grid-template-columns:minmax(0,.92fr) minmax(360px,1.08fr);gap:58px;align-items:center;min-height:660px;padding:62px clamp(24px,7vw,96px) 72px;overflow:hidden;color:#f5e6d3;background:linear-gradient(135deg,#1a0a0a 0%,#310d0f 52%,#56141a 100%)}
.knot-pattern{position:absolute;inset:0;opacity:.12;background-image:radial-gradient(circle at 50% 50%,transparent 0 34px,rgba(196,30,58,.9) 35px 37px,transparent 38px 62px,rgba(212,175,55,.7) 63px 65px,transparent 66px);background-size:152px 152px;pointer-events:none}
.knot-hero::after{content:"CHINESE KNOT";position:absolute;right:clamp(18px,5vw,74px);top:28px;color:rgba(245,230,211,.055);font-family:Georgia,serif;font-size:clamp(54px,9vw,128px);font-weight:900;letter-spacing:.08em;line-height:1;pointer-events:none}
.knot-hero-copy{position:relative;z-index:1;max-width:660px}.knot-hero-copy h2{margin:16px 0 16px;color:#f5e6d3;font-family:Georgia,serif;font-size:clamp(40px,4.6vw,64px);line-height:1.04;letter-spacing:0}.knot-hero-copy>p{max-width:620px;margin:0;color:rgba(245,230,211,.72);font-size:17px;line-height:1.68}
.knot-hero .eyebrow{background:rgba(196,30,58,.18);border-color:rgba(212,175,55,.34);color:#ffd580}.knot-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}.button-link,.calculator-form button{background:#c41e3a}.button-link:hover,.calculator-form button:hover{background:#981627}.button-link.secondary{background:rgba(245,230,211,.1);border-color:rgba(245,230,211,.18);color:#f5e6d3}
.knot-hero-visual{position:relative;z-index:1;min-height:460px;border:1px solid rgba(212,175,55,.28);border-radius:10px;background:rgba(0,0,0,.22);box-shadow:0 38px 90px rgba(0,0,0,.32);display:grid;place-items:center;overflow:hidden}.knot-hero-visual::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.36));pointer-events:none}.knot-hero-visual img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:none}.knot-float-card{position:absolute;z-index:1;display:grid;gap:4px;max-width:220px;padding:14px 16px;border:1px solid rgba(245,230,211,.18);border-radius:8px;background:rgba(42,10,10,.58);backdrop-filter:blur(10px);box-shadow:0 18px 38px rgba(0,0,0,.24)}.knot-float-card strong{font-family:Georgia,serif;font-size:18px;color:#fff5df}.knot-float-card span{font-size:13px;color:rgba(245,230,211,.78)}.knot-float-card.top{left:28px;top:32px}.knot-float-card.bottom{right:32px;bottom:36px}
.knot-stats{position:relative;z-index:2;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;max-width:1160px;margin:-42px auto 34px;padding:0 clamp(18px,4vw,52px)}.knot-stats div{display:grid;gap:5px;min-height:92px;padding:18px;border:1px solid rgba(196,30,58,.24);border-radius:8px;background:rgba(35,12,12,.94);box-shadow:0 14px 32px rgba(0,0,0,.22)}.knot-stats strong{font-family:Georgia,serif;font-size:22px;color:#ffd580}.knot-stats span{color:rgba(245,230,211,.66);font-size:14px}
.knot-section{max-width:1160px;margin:0 auto 34px;padding:34px clamp(18px,4vw,52px);background:rgba(255,255,255,.035);border:1px solid rgba(196,30,58,.18);border-radius:8px;box-shadow:0 18px 46px rgba(0,0,0,.18)}.knot-section .section-heading h2,.knot-section h2{color:#f5e6d3}.knot-section .section-heading p,.knot-section p{color:rgba(245,230,211,.68)}.knot-section .eyebrow{background:rgba(196,30,58,.14);border-color:rgba(196,30,58,.28);color:#ffd580}
.tutorial-grid,.product-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.tutorial-grid a,.product-grid a{display:grid;grid-template-rows:auto auto auto 1fr;gap:10px;min-height:286px;padding:14px;border:1px solid rgba(196,30,58,.25);border-radius:8px;background:rgba(0,0,0,.22);color:#f5e6d3;text-decoration:none;overflow:hidden}.tutorial-grid img,.product-grid img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:6px;border:1px solid rgba(245,230,211,.12)}.tutorial-grid span,.product-grid span{display:inline-flex;justify-self:start;padding:5px 9px;border-radius:999px;background:#c41e3a;color:#fff8e8;font-size:12px;font-weight:850;letter-spacing:.06em;text-transform:uppercase}.tutorial-grid strong,.product-grid strong{font-family:Georgia,serif;font-size:23px;line-height:1.14}.tutorial-grid small,.product-grid p{margin:0;color:rgba(245,230,211,.62);line-height:1.55}
.animal-card,.guide-card{background:rgba(255,255,255,.04);border-color:rgba(196,30,58,.18);color:#f5e6d3;box-shadow:0 12px 30px rgba(0,0,0,.18)}.animal-card strong,.guide-card strong{color:#f5e6d3}.animal-card p,.guide-card p,.animal-card>span:not(.animal-order):not(.animal-seal){color:rgba(245,230,211,.62)}.animal-seal{background:#c41e3a;color:#fff7df;border-color:#d4af37;border-radius:50%;box-shadow:0 8px 18px rgba(196,30,58,.28)}.animal-order,.guide-card span{color:#ffd580}.content-section th{background:#3a1113;color:#f5e6d3}.content-section table{background:rgba(255,255,255,.04);color:#f5e6d3}.site-footer{background:#120606}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .page-hero{padding-top:40px;padding-bottom:26px}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .page-hero h1{color:#fff4df;text-shadow:0 14px 36px rgba(0,0,0,.32)}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .page-hero .intro{color:rgba(245,230,211,.78)}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .page-hero .eyebrow{background:rgba(196,30,58,.18);border-color:rgba(212,175,55,.34);color:#ffd580}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-shell{max-width:1180px;gap:34px;margin-bottom:38px}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-main{display:grid;gap:24px;min-width:0}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-main>.content-section{width:100%;max-width:none!important;margin:0!important;padding:26px 30px!important;border-radius:10px;background:rgba(255,255,255,.055)!important;border:1px solid rgba(196,30,58,.2)!important;box-shadow:0 16px 42px rgba(0,0,0,.18)!important}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-main>.article-body{background:rgba(255,255,255,.05)!important}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-body p{max-width:none;margin:0 0 15px;color:rgba(245,230,211,.76)}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-body p:last-child{margin-bottom:0}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .lead-answer{font-size:17px;line-height:1.78;color:#fff1d8}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-main>.split{padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;gap:18px}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .split>div,.sidebar-card{background:rgba(255,255,255,.055);border-color:rgba(196,30,58,.2);color:#f5e6d3;box-shadow:0 14px 34px rgba(0,0,0,.16)}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .split>div{padding:24px}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .fact-card span,.sidebar-link-list span{color:rgba(245,230,211,.68)}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-search{align-items:center}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-search h2{color:#f5e6d3}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .site-search-form input{border-color:rgba(245,230,211,.18);background:rgba(255,248,236,.96)}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-sidebar{gap:22px;top:104px}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .sidebar-card{padding:22px}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .sidebar-card h2{margin:8px 0 16px;color:#f5e6d3;font-size:23px}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .sidebar-link-list{gap:14px}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .sidebar-link-list a{padding:0 0 14px;border-bottom-color:rgba(245,230,211,.12)}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .sidebar-link-list strong{color:#fff1d8}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .faq-category{background:rgba(255,255,255,.04);border-color:rgba(196,30,58,.2)}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .faq-category summary{background:rgba(255,255,255,.055);color:#fff1d8}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .faq-grid{background:rgba(0,0,0,.1);padding:18px}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .faq-item{border-color:rgba(245,230,211,.12);background:rgba(255,255,255,.04)}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .faq-item h3{background:rgba(255,255,255,.055);border-color:rgba(245,230,211,.12);color:#fff1d8}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .faq-item p{background:rgba(0,0,0,.08);color:rgba(245,230,211,.7);border-left-color:rgba(212,175,55,.35)}
@media(max-width:980px){.knot-hero{grid-template-columns:1fr;min-height:auto;padding:52px 22px 74px}.knot-hero-visual{min-height:420px}.knot-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.tutorial-grid,.product-grid{grid-template-columns:1fr}.animal-grid,.guide-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:640px){.knot-hero-copy h2{font-size:38px}.knot-hero-visual{min-height:330px}.knot-float-card{position:relative;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;margin:10px;justify-self:start;align-self:end}.knot-stats,.animal-grid,.guide-grid{grid-template-columns:1fr}.knot-actions{display:grid}.knot-actions .button-link{width:100%}body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-main>.content-section{padding:20px!important}body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-shell{gap:22px}}
`;
}
