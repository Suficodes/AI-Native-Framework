// Artifact build shim for src/lib/useFetch.js.
//
// The single-file artifact build has no origin to fetch from, so the three DAK
// meta pages (Journey / Architecture / VibeCode) read their JSON straight from
// the bundle instead. Same hook shape as the real useFetch — the pages don't
// know the difference. Wired in via vite.config.artifact.js.
import publicJourney from "../../public/journey-data.json"
import publicTechStack from "../../public/tech-stack.json"
import publicVibeStats from "../../public/vibe-stats.json"
import publicVibeBuild from "../../public/vibe-build.json"

const PAYLOADS = {
  "/journey-data.json": publicJourney,
  "/tech-stack.json": publicTechStack,
  "/vibe-stats.json": publicVibeStats,
  "/vibe-build.json": publicVibeBuild,
}

export function useFetch(url) {
  const data = PAYLOADS[url] ?? null
  return { data, loading: false, error: data ? null : `No bundled payload for ${url}` }
}
