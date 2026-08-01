// Tracks the app's light/dark mode (set on <html data-astryx-mode="...">, see
// lib/theme.js) so chart components can pick literal per-mode hex colors.
// Recharts needs real hex — its Pie/Sector internals do color math (hover
// lighten/darken) that silently fails on CSS var() strings, unlike Bar/Cell
// which just pass fill straight through. See dewa/chart-colors.css for why
// these live as literal JS values instead of CSS custom properties.
import { useEffect, useState } from 'react'

function readMode() {
  return document.documentElement.getAttribute('data-astryx-mode') === 'dark' ? 'dark' : 'light'
}

export function useChartMode() {
  const [mode, setMode] = useState(readMode)
  useEffect(() => {
    const observer = new MutationObserver(() => setMode(readMode()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-astryx-mode'] })
    return () => observer.disconnect()
  }, [])
  return mode
}
