# neverknowsbestapps.github.io

アプリの一覧と紹介ページ、各アプリのプライバシーポリシー・利用規約を置くサイト。GitHub Pages で公開している。

## 一覧と紹介ページの作り方

一覧（`index.html`）・紹介ページ（`<slug>/index.html`）・`sitemap.xml`・`robots.txt` は、
`apps/*.json` から `tools/build.mjs` が書き出す。**書き出したファイルは直接直さない**（次に書き出すと消える）。

```
node tools/build.mjs
```

見た目は `assets/site.css` の1つだけ。アプリごとの色は JSON の `colors` で差し替える。

## アプリを足す

1. `assets/apps/<slug>/` に画像を置く
   - `icon.png`（256×256）
   - スクショ（幅600の JPEG。上のステータスバーは切る。横長の画面は幅1200）
2. `apps/<slug>.json` を書く（英語ページも作るなら `apps/<slug>.en.json`）。今ある JSON を写して直すのが早い
3. `node tools/build.mjs` を走らせ、ブラウザで見てから push する

公開前のアプリは `"hidden": true` にしておくと、ページも一覧も sitemap も作らない。

### JSON の項目

| 項目 | 中身 |
|---|---|
| `slug` | URL とフォルダの名前（`/<slug>/`） |
| `lang` | 省けば `ja`。`en` なら `/<slug>/en/` に書き出し、一覧には出さない |
| `order` | 一覧の並び順（小さいほど上） |
| `hidden` | `true` で公開しない |
| `name` / `title` / `description` | 名前・ページの題・検索結果に出る説明 |
| `category` | 検索エンジン向けの分類（`UtilitiesApplication` `GameApplication` など） |
| `lead` / `summary` / `tags` | 一覧に出す一言・短い説明・印（`iPhone` `無料` など） |
| `listBanner` | 一覧で説明の代わりに出す横長の画像（ゲーム向け） |
| `colors` | `bg`（一番上と最後の地）`bg2`（帯の地）`name` `tag`（字）`em`（`[ ]` の字の色）`mark`（できることの下線）`accent`（見出し） |
| `icon` / `ogImage` | アイコンと、SNS で共有されたときの画像（省けばアイコン） |
| `catch` | 一番上のキャッチコピー。`\n` で改行、`[語]` で強調 |
| `stores` | `apple` と `google` のストアの URL |
| `hero` | 一番上の画面 `{ "src", "alt" }` |
| `band` | 省略可。色の帯に画像を並べる（パチマネージャーの16体など）`{ "title", "text", "images" }` |
| `features` | できること。`{ "src", "title", "text" }` を並べる。`title` は `[語]` で下線 |
| `info` | アプリの情報 `[["価格", "無料"], ...]` |
| `log` | 更新履歴 `{ "ver", "text", "date" }`。新しい版を出したら足す |
| `privacy` | プライバシーポリシーの URL（`/<slug>-privacy/`） |

## 触らないもの

- `*-privacy/` `*-terms/` と `app-ads.txt` は、ストアと AdMob に URL を登録してある。場所も中身も勝手に変えない
- `_mock/` は公開されない（GitHub Pages は `_` で始まるフォルダを出さない）
