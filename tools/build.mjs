// サイトの一覧ページ・アプリの紹介ページ・sitemap.xml・robots.txt を、apps/*.json から書き出す。
// 追加の依存なし。サイトの根で:
//   node tools/build.mjs
//
// 1 アプリ 1 言語 = apps/<slug>.json（英語は apps/<slug>.en.json）。書き方は README.md。
// 画像は assets/apps/<slug>/ に置き、JSON にはそのフォルダからの名前だけを書く。
// プライバシーポリシー・利用規約（*-privacy/ *-terms/）と app-ads.txt はここでは触らない。

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SITE = 'https://neverknowsbestapps.github.io';
const MAIL = 'neverknowsbestapps@gmail.com';
const OWNER = 'neverknowsbestapps';
const STAMP = '<!-- tools/build.mjs が apps/*.json から作るファイル。直接直さない -->';

// 画面に出る決まり文句
const WORDS = {
  ja: {
    info: 'アプリの情報', log: '更新履歴', more: '詳しく見る', list: 'アプリ一覧',
    privacy: 'プライバシーポリシー', contact: 'お問い合わせ',
    apple: 'App Store からダウンロード', google: 'Google Play で手に入れよう',
    lead: '個人でスマホアプリを作っています。', other: 'English',
  },
  en: {
    info: 'App info', log: "What's new", more: 'Learn more', list: 'All apps',
    privacy: 'Privacy Policy', contact: 'Contact',
    apple: 'Download on the App Store', google: 'Get it on Google Play',
    lead: 'Mobile apps made by one developer.', other: '日本語',
  },
};

// ---- 読み込み ----
const apps = readdirSync(join(ROOT, 'apps'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => {
    const a = JSON.parse(readFileSync(join(ROOT, 'apps', f), 'utf8'));
    a.lang ??= 'ja';
    a.path = a.lang === 'ja' ? `${a.slug}/` : `${a.slug}/${a.lang}/`;
    return a;
  });

// ---- 小物 ----
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// "[語]" を強調、"\n" を改行にする。cls は強調に付ける class
const rich = (s, cls) => esc(s)
  .replace(/\[([^\]]*)\]/g, `<span class="${cls}">$1</span>`)
  .replace(/\n/g, '<br>');
const plain = (s) => String(s ?? '').replace(/[\[\]]/g, '').replace(/\n/g, ' ');
const img = (a, name) => `/assets/apps/${a.slug}/${name}`;
const sizeOf = (a, name) => {
  // PNG / JPEG の幅と高さを頭から読む（横長の画面かどうかの判断に使う）
  const b = readFileSync(join(ROOT, 'assets/apps', a.slug, name));
  if (b[0] === 0x89) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  for (let i = 2; i < b.length;) {
    const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  return [1, 2];
};
const wide = (a, name) => { const [w, h] = sizeOf(a, name); return w > h; };

function stores(a, w) {
  const s = a.stores || {};
  const badge = a.lang === 'ja' ? 'ja' : 'en';
  return `<div class="stores">${
    s.apple ? `<a href="${esc(s.apple)}"><img class="apple" src="/assets/badge/appstore-${badge}.svg" alt="${w.apple}"></a>` : ''}${
    s.google ? `<a href="${esc(s.google)}"><img class="google" src="/assets/badge/googleplay-${badge}.png" alt="${w.google}"></a>` : ''}</div>`;
}

function head({ lang, title, description, url, image, alternates = [], extra = '' }) {
  return `<!DOCTYPE html>
${STAMP}
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
${alternates.map((x) => `<link rel="alternate" hreflang="${x.lang}" href="${x.url}">`).join('\n')}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
${image ? `<meta property="og:image" content="${image}">\n<meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
${extra}</head>`;
}

function foot(a, w) {
  return `<footer class="foot">
  <div class="wrap">
    ${a ? `<p><a href="/">${w.list}</a>　<a href="${esc(a.privacy)}">${w.privacy}</a></p>` : ''}
    <p>${w.contact}　<a href="mailto:${MAIL}">${MAIL}</a></p>
    <p>© ${OWNER}</p>
  </div>
</footer>`;
}

// ---- アプリの紹介ページ ----
function appPage(a) {
  const w = WORDS[a.lang];
  const c = a.colors;
  const url = `${SITE}/${a.path}`;
  const siblings = apps.filter((x) => x.slug === a.slug);
  const alternates = siblings.length > 1 ? siblings.map((x) => ({ lang: x.lang, url: `${SITE}/${x.path}` })) : [];
  const other = siblings.find((x) => x.lang !== a.lang);
  const ld = {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication',
    name: a.name, description: a.description, url,
    operatingSystem: [a.stores?.apple && 'iOS', a.stores?.google && 'Android'].filter(Boolean).join(', '),
    applicationCategory: a.category || 'UtilitiesApplication',
    image: `${SITE}${img(a, a.icon)}`,
    offers: { '@type': 'Offer', price: '0', priceCurrency: a.lang === 'ja' ? 'JPY' : 'USD' },
    author: { '@type': 'Person', name: OWNER },
  };
  const heroWide = wide(a, a.hero.src);
  const vars = `--bg:${c.bg};--bg2:${c.bg2 || c.bg};--name:${c.name};--tag:${c.tag};--em:${c.em || c.tag};--mark:${c.mark || c.em || '#ffd23f'};--accent:${c.accent || c.bg}`;

  const feats = (a.features || []).map((f) => {
    const isWide = wide(a, f.src);
    return `    <div class="feat${isWide ? ' wide' : ''}">
      <div class="feat-img phone"><img src="${img(a, f.src)}" alt="${esc(f.alt || plain(f.title))}" loading="lazy"></div>
      <div class="feat-text">
        <h3>${rich(f.title, 'mark')}</h3>
        ${f.text ? `<p>${esc(f.text)}</p>` : ''}
      </div>
    </div>`;
  }).join('\n');

  const band = a.band ? `<section class="band">
  <div class="wrap">
    <h2>${rich(a.band.title, 'em')}</h2>
    ${a.band.text ? `<p>${esc(a.band.text)}</p>` : ''}
    <div class="band-grid">${a.band.images.map((n) => `<img src="${img(a, n)}" alt="" loading="lazy">`).join('')}</div>
  </div>
</section>` : '';

  const info = a.info?.length ? `<div>
      <h2>${w.info}</h2>
      <dl class="spec">
${a.info.map(([k, v]) => `        <div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n')}
      </dl>
    </div>` : '';
  const log = a.log?.length ? `<div>
      <h2>${w.log}</h2>
      <ul class="log">
${a.log.map((l) => `        <li><span class="ver">${esc(l.ver)}</span>${esc(l.text)}<span class="date">${esc(l.date)}</span></li>`).join('\n')}
      </ul>
    </div>` : '';

  const brand = `<div class="brand"><img src="${img(a, a.icon)}" alt=""><span class="name">${esc(a.name)}</span></div>`;

  return `${head({
    lang: a.lang, title: a.title, description: a.description, url,
    image: a.ogImage ? `${SITE}${img(a, a.ogImage)}` : `${SITE}${img(a, a.icon)}`, alternates,
    extra: `<script type="application/ld+json">${JSON.stringify(ld)}</script>\n`,
  })}
<body class="app-page" style="${vars}">

<header class="hero${heroWide ? ' wide' : ''}">
  <div class="wrap">
    <nav class="top-nav"><a href="/">${OWNER}</a>${other ? `<a class="lang" href="/${other.path}">${w.other}</a>` : ''}</nav>
    <div class="hero-grid">
      <div class="hero-text">
        ${brand}
        <div class="rule"></div>
        <h1 class="catch">${rich(a.catch, 'em')}</h1>
        ${stores(a, w)}
      </div>
      <div class="hero-phone phone"><img src="${img(a, a.hero.src)}" alt="${esc(a.hero.alt || '')}"></div>
    </div>
  </div>
</header>

${band}

<section class="feats">
  <div class="wrap">
${feats}
  </div>
</section>

<section class="info">
  <div class="wrap info-grid">
    ${info}
    ${log}
  </div>
</section>

<section class="cta">
  <div class="wrap">
    ${brand}
    <p class="catch">${rich(a.ctaCatch || a.catch, 'em')}</p>
    ${stores(a, w)}
  </div>
</section>

${foot(a, w)}

</body>
</html>
`;
}

// ---- 一覧ページ（日本語だけ） ----
function listPage() {
  const w = WORDS.ja;
  const shown = apps.filter((a) => a.lang === 'ja' && !a.hidden).sort((x, y) => (x.order ?? 99) - (y.order ?? 99));
  const items = shown.map((a) => `  <section class="app" style="--accent:${a.colors.accent || a.colors.bg}">
    <img class="icon" src="${img(a, a.icon)}" alt="">
    <div class="head">
      <h2><a href="/${a.path}">${esc(a.name)}</a></h2>
      <p class="lead">${esc(a.lead)}</p>
    </div>
    <div class="body">
      <ul class="tags">${(a.tags || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      ${a.listBanner ? `<a class="banner" href="/${a.path}"><img src="${img(a, a.listBanner)}" alt="" loading="lazy"></a>` : ''}
      ${a.summary ? `<p class="desc">${esc(a.summary)}</p>` : ''}
      <div class="actions">${stores(a, w)}<a class="more" href="/${a.path}">${w.more} ›</a></div>
    </div>
  </section>`).join('\n\n');
  const names = shown.map((a) => a.name).join('、');
  return `${head({
    lang: 'ja', title: OWNER, description: `個人で作っているスマホアプリの一覧。${names}。`, url: `${SITE}/`,
  })}
<body class="list-page">

<header class="wrap site-head">
  <h1>${OWNER}</h1>
  <p>${w.lead}</p>
</header>

<main class="wrap">

${items}

</main>

${foot(null, w)}

</body>
</html>
`;
}

// ---- 書き出し ----
const write = (rel, text) => {
  const file = join(ROOT, rel);
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, text);
  console.log(rel);
};

// hidden（公開前）のアプリは、ページも一覧も sitemap も作らない
for (const a of apps.filter((x) => !x.hidden)) {
  for (const n of [a.icon, a.hero.src, ...(a.features || []).map((f) => f.src), ...(a.band?.images || [])]) {
    if (!existsSync(join(ROOT, 'assets/apps', a.slug, n))) throw new Error(`画像が無い: assets/apps/${a.slug}/${n}`);
  }
  write(`${a.path}index.html`, appPage(a));
}
write('index.html', listPage());

const urls = ['', ...apps.filter((a) => !a.hidden).map((a) => a.path)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}/${u}</loc></url>`).join('\n')}
</urlset>
`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
