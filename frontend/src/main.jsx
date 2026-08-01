import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"

// ── DEWA-Astryx design system — CSS cascade (order matters) ──────────────
//  1. reset.css              — normalize
//  2. astryx.css             — Astryx design system (tokens + component CSS)
//  3. theme-dewa.css         — the DEWA theme (Astryx neutral + DEWA green
//                              #007560), scoped to [data-astryx-theme="dewa"]
//  4. theme-control-tower.css — this project's DESIGN.md radius/spacing
//                              overrides (see dewa/DESIGN.md) — kept as its
//                              own file, layered after theme-dewa.css, so it
//                              stays a diffable override rather than edits
//                              scattered into the shared theme file
//  5. currency.css           — the AED dirham glyph (.dirham / <Aed>)
//  6. themes.css             — light/dark via color-scheme (data-astryx-mode)
//  7. motion.css             — native motion layer (View Transitions +
//                              scroll reveals), reduced-motion by default
//  8. app.css                — thin app-level layout glue (never re-styles
//                              Astryx components)
// Chart mark colors are NOT in this cascade — recharts (Pie/Sector
// especially) needs literal hex, not var(), so they live as JS constants in
// lib/chartColors.js (mode-aware via lib/useChartMode.js) instead.
import "@astryxdesign/core/reset.css"
import "@astryxdesign/core/astryx.css"
import "./dewa/theme-dewa.css"
import "./dewa/theme-control-tower.css"
import "./dewa/currency.css"
import "./dewa/motion.css"
import "./dewa/rail.css"
import "./styles/themes.css"
import "./styles/app.css"

import { router } from "./app/router.jsx"
import { initTheme } from "./lib/theme.js"

initTheme()

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
