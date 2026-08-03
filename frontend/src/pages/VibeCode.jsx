import { Card } from "@astryxdesign/core/Card"
import { Text } from "@astryxdesign/core/Text"
import { Heading } from "@astryxdesign/core/Heading"
import { VStack } from "@astryxdesign/core/VStack"
import { useFetch } from "../lib/useFetch.js"
import { BuildContext } from "./vibe-code/BuildContext.jsx"
import "./vibe-code/vibe-code.css"

// /vibe-code — reads public/vibe-stats.json (written by the leaderboard hook
// after every Claude Code session) and public/vibe-build.json (measured from
// the session transcripts: tokens, model, MCP servers, memory, skills).
//
// The two files are separate on purpose: the hook owns vibe-stats.json and
// rewrites it wholesale, so anything hand-authored there would be lost.
// Never hardcode these numbers into the component.
const fmt = (v) => (typeof v === "number" ? v.toLocaleString("en-US") : v)
const LABELS = {
  sessions: "Sessions", lines_written: "Lines written",
  total_lines: "Lines written", total_lines_written: "Lines written", cost: "Cost",
  total_cost: "Cost", total_cost_usd: "Cost", files: "Files", source_lines: "Source lines",
  modules: "Modules", tests: "Tests", commits: "Commits", updated_at: "Updated",
}

// Prompt counts are dropped rather than displayed: the raw total counts every
// "continue" and every unrelated aside, so it reads as effort when it is mostly
// turn-taking. Anything the hook reports as untracked is dropped too — an empty
// stat is worse than no stat. Both are filtered on the value, not just removed
// from the JSON, because the leaderboard hook rewrites vibe-stats.json wholesale
// after every session and would otherwise reintroduce them.
const HIDDEN_KEYS = new Set(["total_prompts", "prompts"])
const UNTRACKED = /^(not tracked|untracked|n\/a|none|unknown|[-—])$/i

const isShown = ([key, value]) =>
  !HIDDEN_KEYS.has(key) && !(typeof value === "string" && UNTRACKED.test(value.trim()))

export default function VibeCode() {
  const { data, loading } = useFetch("/vibe-stats.json")
  const { data: build } = useFetch("/vibe-build.json")
  const stats = data && typeof data === "object"
    ? Object.entries(data)
        .filter(([, v]) => typeof v === "number" || typeof v === "string")
        .filter(isShown)
    : []

  return (
    <div className="page-band">
      <span className="eyebrow">Project</span>
      <Heading level={1} type="display-3">Vibe Code</Heading>
      <Text color="secondary" size="lg">How this app was built with Claude Code — updated every session.</Text>

      <div className="auto-grid" style={{ marginTop: "var(--spacing-6)" }}>
        {loading && <Text color="secondary">Loading…</Text>}
        {!loading && stats.length === 0 && <Text color="secondary">No stats yet — they appear after your first session.</Text>}
        {stats.map(([k, v]) => (
          <Card key={k} padding={4}>
            <VStack gap={1}>
              <Text size="sm" color="secondary" weight="medium">{LABELS[k] || k.replace(/_/g, " ")}</Text>
              <div className="kpi-value">{fmt(v)}</div>
            </VStack>
          </Card>
        ))}
      </div>

      <BuildContext build={build} />

      {build?.measured_from && (
        <Text size="xs" color="secondary" style={{ display: "block", marginTop: "var(--spacing-5)" }}>
          {build.measured_from}
        </Text>
      )}
    </div>
  )
}
