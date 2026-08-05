// Artifact build shim for the `mermaid` package.
//
// Mermaid pulls ~3.4 MB of lazy diagram chunks, which a single-file artifact
// would have to inline in full. /pm-log is the only consumer, so the artifact
// build swaps it for this stub: diagram fences render as readable source
// blocks instead of drawn diagrams. Everything else on the page is unaffected.
// Wired in via vite.config.artifact.js.
const mermaid = {
  initialize() {},
  run({ nodes } = {}) {
    for (const node of nodes ? Array.from(nodes) : []) {
      if (node.dataset.artifactStub) continue
      node.dataset.artifactStub = "1"
      const pre = document.createElement("pre")
      pre.className = "mermaid-source"
      pre.textContent = node.textContent.trim()
      node.replaceChildren(pre)
    }
    return Promise.resolve()
  },
}

export default mermaid
