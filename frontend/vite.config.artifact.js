// Build config for the single-file artifact build (`npm run build:artifact`).
//
// A Claude Artifact is one self-contained HTML page: no code splitting, no
// sibling asset files, no requests to any external host. This config takes the
// normal app and squeezes it into that shape —
//   · every dynamic import folded into one JS file
//   · one CSS file, every asset inlined as a data URI
//   · `mermaid` and `useFetch` swapped for bundle-local shims (scripts/artifact/)
// scripts/build-artifact.mjs then folds the JS + CSS into the page itself.
import { fileURLToPath, URL } from "node:url"
import { defineConfig, mergeConfig } from "vite"
import base from "./vite.config.js"

const shim = (name) => fileURLToPath(new URL(`./scripts/artifact/${name}.js`, import.meta.url))

// Redirect a module to its artifact shim. Done as a resolveId hook rather than
// a resolve.alias because useFetch is imported by relative path ("../lib/
// useFetch.js"), which a regex alias would rewrite into a broken path.
const artifactShims = {
  name: "artifact-shims",
  enforce: "pre",
  resolveId(source) {
    if (source === "mermaid") return shim("mermaid")
    if (/(^|\/)lib\/useFetch\.js$/.test(source)) return shim("useFetch")
    return null
  },
}

export default mergeConfig(base, defineConfig({
  plugins: [artifactShims],
  build: {
    outDir: "dist-artifact",
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    chunkSizeWarningLimit: 8000,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
}))
