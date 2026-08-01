# Verification scripts

Browser-driven checks used at every build step. They need the dev server
running; `puppeteer-core` is already a devDependency.

```sh
npm run dev &            # http://localhost:3400
npm run verify:all       # everything below, in order
```

| Script | What it checks |
|---|---|
| `npm run verify` | 45 checks across all 12 build steps — every module, register, tab, graph and worked example |
| `npm run verify:ux` | The requirements doc's Section 24 UX checklist (18 items) plus both worked examples |
| `npm run verify:a11y` | Headings, labels, landmarks, skip link, breadcrumbs, accessible names |
| `npm run verify:responsive` | Horizontal overflow at 1680 / 1280 / 1024 / 768 / 390 px |
| `npm run verify:keyboard` | Drill-down focusability, Enter activation, focus rings, Esc |

`puppeteer-core` ships no browser, so `scripts/browser.mjs` resolves the first
Chrome or Chromium it can find. Override either default with env vars:

```sh
CHROME_PATH=/path/to/chrome BASE_URL=http://localhost:5173 npm run verify
```

## Why these exist

`tsc --noEmit`, `npm run build` and `vitest` between them still miss a whole
class of defect. Each of these scripts was written because it caught something
the others could not — see the step lessons in `PROJECT.md`. The most expensive
example: `<Aed usd={…}>` inflated money by 3.67× across twelve files for eight
build steps, and only the end-to-end pass found it.
