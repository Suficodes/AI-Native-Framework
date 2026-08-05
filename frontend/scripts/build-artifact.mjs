// Build the single-file Claude Artifact page: `npm run build:artifact`.
//
// Runs the artifact Vite build (vite.config.artifact.js), then folds its one JS
// chunk and one CSS file into the page itself, with every font and image turned
// into a data: URI. The result is dist-artifact/artifact.html — a page that
// makes zero network requests, which is what the Artifact CSP requires.
//
// The output is a *fragment*: the Artifact host supplies <!doctype>, <html>,
// <head> and <body> around it, so this file emits head/body content only.
import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath, URL } from "node:url"
import { build } from "vite"

const here = (p) => fileURLToPath(new URL(p, import.meta.url))
const root = (p) => here(`../${p}`)

const MIME = {
  woff2: "font/woff2",
  woff: "font/woff",
  ttf: "font/ttf",
  png: "image/png",
  svg: "image/svg+xml",
}

async function dataUri(absPath) {
  const ext = absPath.split(".").pop().toLowerCase()
  const bytes = await readFile(absPath)
  return `data:${MIME[ext] ?? "application/octet-stream"};base64,${bytes.toString("base64")}`
}

// Figtree is the DEWA UI face. The dev app pulls it from Google Fonts, which the
// Artifact CSP blocks — so the artifact carries the two latin subsets inline
// rather than silently falling back to the system sans.
async function figtreeFaces() {
  const subsets = [
    ["figtree-latin.woff2", "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"],
    ["figtree-latin-ext.woff2", "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF"],
  ]
  const faces = []
  for (const [file, range] of subsets) {
    const uri = await dataUri(here(`artifact/fonts/${file}`))
    faces.push(
      `@font-face{font-family:'Figtree';font-style:normal;font-weight:300 900;` +
        `font-display:swap;src:url(${uri}) format('woff2');unicode-range:${range};}`,
    )
  }
  return faces.join("\n")
}

// Rewrite every /fonts/* and /assets/* url() in the bundled CSS to a data: URI.
async function inlineCssAssets(css) {
  const refs = [...css.matchAll(/url\((['"]?)(\/(?:fonts|assets)\/[^'")]+)\1\)/g)]
  const seen = new Map()
  for (const [, , path] of refs) {
    if (!seen.has(path)) seen.set(path, await dataUri(root(`public${path}`)))
  }
  return css.replace(/url\((['"]?)(\/(?:fonts|assets)\/[^'")]+)\1\)/g, (_m, _q, path) => `url(${seen.get(path)})`)
}

// The DEWA wordmark is referenced as a bare string default in DewaLogo.jsx, so
// it never passes through Vite's asset pipeline — swap it here.
async function inlineJsAssets(js) {
  const logo = "/assets/dewa-logo.png"
  return js.includes(logo) ? js.replaceAll(logo, await dataUri(root(`public${logo}`))) : js
}

// A script element ends at the first literal "</script" in its text, regardless
// of JS syntax — so neutralise it (and HTML comment openers) in the payload.
const escapeForScript = (js) => js.replaceAll("</script", "<\\/script").replaceAll("<!--", "<\\!--")

const EXTRA_CSS = `
/* Mermaid fences in /pm-log — see scripts/artifact/mermaid.js for why they
   render as source rather than as drawn diagrams in the artifact build. */
pre.mermaid-source {
  font-family: var(--font-family-code);
  font-size: 0.78rem;
  line-height: 1.5;
  white-space: pre;
  overflow-x: auto;
  padding: var(--spacing-4, 1rem);
  border: 1px solid var(--color-border, #d4dcd9);
  border-radius: 8px;
  background: var(--color-background-muted, #f2f5f4);
  color: var(--color-text-muted, #4a5754);
}
`

// Keeps the app's light/dark mode in step with the Artifact viewer's theme
// toggle, which stamps data-theme on <html>. Written as a classic script so it
// lands the stored mode before initTheme() reads it.
const THEME_BRIDGE = `(function () {
  var root = document.documentElement
  function hostMode() {
    var t = root.getAttribute("data-theme")
    if (t === "dark" || t === "light") return t
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  function store(mode) { try { localStorage.setItem("dewa-mode", mode) } catch (e) {} }
  store(hostMode())
  new MutationObserver(function () {
    var mode = hostMode()
    root.setAttribute("data-astryx-mode", mode)
    store(mode)
  }).observe(root, { attributes: true, attributeFilter: ["data-theme"] })
})()`

async function main() {
  await build({ configFile: root("vite.config.artifact.js") })

  const html = await readFile(root("dist-artifact/index.html"), "utf8")
  const jsRef = html.match(/<script[^>]+src="([^"]+\.js)"/)?.[1]
  const cssRef = html.match(/<link[^>]+href="([^"]+\.css)"/)?.[1]
  if (!jsRef || !cssRef) throw new Error("artifact build produced no single js/css pair")

  const asset = (ref) => root(`dist-artifact/${ref.replace(/^\.?\//, "")}`)
  const css = await inlineCssAssets(await readFile(asset(cssRef), "utf8"))
  const js = await inlineJsAssets(await readFile(asset(jsRef), "utf8"))

  const page = [
    "<title>AI-Native Enterprise Control Tower</title>",
    `<style>\n${await figtreeFaces()}\n${css}\n${EXTRA_CSS}</style>`,
    '<div id="root"></div>',
    `<script>${THEME_BRIDGE}</script>`,
    `<script type="module">${escapeForScript(js)}</script>`,
    "",
  ].join("\n")

  const out = root("dist-artifact/artifact.html")
  await writeFile(out, page)
  const mb = (Buffer.byteLength(page) / 1024 / 1024).toFixed(2)
  console.log(`\nartifact → ${out}  (${mb} MB, single file, no external requests)`)
}

await main()
