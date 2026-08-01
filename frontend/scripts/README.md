# Verification scripts

Browser-driven checks used at every build step. They need the dev server
running (`npm run dev`) and a local Chrome, plus `puppeteer-core`:

```sh
npm run dev &                       # http://localhost:3400
npm i --no-save puppeteer-core
node scripts/verify.mjs             # 45 checks across all 12 build steps
node scripts/uxcheck.mjs            # Section 24 UX checklist + both worked examples
node scripts/a11y.mjs               # headings, labels, landmarks, skip link
node scripts/responsive.mjs         # horizontal overflow at 5 viewports
node scripts/keyboard.mjs           # drill-down focus, Enter activation, Esc
```

These exist because typecheck, `npm run build` and vitest between them still
miss a whole class of defect — see PROJECT.md's step lessons for the specific
bugs each of these caught.
