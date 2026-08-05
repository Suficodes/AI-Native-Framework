import { Card } from "@astryxdesign/core/Card"
import { Text } from "@astryxdesign/core/Text"
import { Heading } from "@astryxdesign/core/Heading"
import { Badge } from "@astryxdesign/core/Badge"
import { VStack } from "@astryxdesign/core/VStack"
import { HoverCard } from "@astryxdesign/core/HoverCard"
import { useFetch } from "../lib/useFetch.js"

// /architecture — reads public/tech-stack.json.
//
// The file has three shapes in the wild, and the page must survive all of them:
//   v2 (what the leaderboard hook writes): { categories: {key: {label}}, projects: [{stack: {key: [..]}}] }
//   v1:                                     { categories: [{name, items}] }
//   loose:                                  { stack: {name: [..]} }
// The previous version assumed `categories` was always an ARRAY and called
// .map() on it — under v2 it is an object keyed by category, so the page threw
// "cats.map is not a function" and took the whole route down.
function readStack(data) {
  if (!data || typeof data !== "object") return []

  // v1: categories is already a list of {name, items}.
  if (Array.isArray(data.categories)) {
    return data.categories.map((c) => ({ name: c.name ?? c.category, items: c.items ?? c.technologies ?? [] }))
  }

  // v2: the stack lives on the project; `categories` only supplies labels.
  const labels = data.categories && !Array.isArray(data.categories) ? data.categories : {}
  const stack = data.projects?.[0]?.stack ?? data.stack
  if (stack && typeof stack === "object") {
    return Object.entries(stack)
      .filter(([, items]) => Array.isArray(items) && items.length > 0)
      .map(([key, items]) => ({ name: labels[key]?.label ?? key, color: labels[key]?.color, items }))
  }

  return []
}

export default function Architecture() {
  const { data, loading } = useFetch("/tech-stack.json")
  const cats = readStack(data)
  const details = data?.tech_details ?? {}
  const project = data?.projects?.[0]

  return (
    <div className="page-band">
      <span className="eyebrow">Project</span>
      <Heading level={1} type="display-3">Architecture</Heading>
      <Text color="secondary" size="lg">
        {project?.purpose || "The tech stack powering this app."}
      </Text>

      <div className="auto-grid" style={{ marginTop: "var(--spacing-6)" }}>
        {loading && <Text color="secondary">Loading…</Text>}
        {!loading && cats.length === 0 && (
          <Text color="secondary">No stack yet — update public/tech-stack.json.</Text>
        )}
        {cats.map((c) => (
          <Card key={c.name} padding={4}>
            <VStack gap={2}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
                {c.color && (
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flex: "none" }} />
                )}
                <Text weight="semibold">{c.name}</Text>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-1)" }}>
                {c.items.map((t) => {
                  const label = typeof t === "string" ? t : t.name
                  const detail = details[label]
                  const badge = <Badge variant="neutral" label={label} />
                  // Where the file explains a choice, surface the why on hover.
                  return detail ? (
                    <HoverCard
                      key={label}
                      placement="above"
                      content={<div style={{ width: 260 }}><Text size="sm">{detail}</Text></div>}
                    >
                      <span style={{ cursor: "help" }}>{badge}</span>
                    </HoverCard>
                  ) : (
                    <span key={label}>{badge}</span>
                  )
                })}
              </div>
            </VStack>
          </Card>
        ))}
      </div>
    </div>
  )
}
