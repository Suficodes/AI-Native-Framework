// The "how it was built" half of /vibe-code: token spend, the models behind it,
// MCP servers, memory, and the skills that shaped the work.
//
// Every figure here comes from public/vibe-build.json, which is measured from
// the Claude Code session transcripts — same rule as the rest of this page,
// nothing hardcoded in the component.
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { Heading } from '@astryxdesign/core/Heading'
import { VStack } from '@astryxdesign/core/VStack'
import { Badge } from '@astryxdesign/core/Badge'
import { categorical, axisText } from '../../lib/chartColors.js'
import { useChartMode } from '../../lib/useChartMode.js'

const compact = (n) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K`
  : String(n)

const full = (n) => n.toLocaleString('en-US')

function TokenBar({ breakdown, total }) {
  const mode = useChartMode()
  const c = categorical(mode)
  const colors = [axisText(mode), c[0], c[2], c[3]]

  return (
    <>
      <div className="vc-bar" role="img" aria-label={`Token split: ${breakdown.map((b) => `${b.label} ${compact(b.value)}`).join(', ')}`}>
        {breakdown.map((slice, i) => (
          <span
            key={slice.label}
            className="vc-bar-slice"
            style={{ width: `${(slice.value / total) * 100}%`, background: colors[i % colors.length] }}
          />
        ))}
      </div>
      <ul className="vc-legend">
        {breakdown.map((slice, i) => (
          <li key={slice.label}>
            <span className="vc-dot" style={{ background: colors[i % colors.length] }} />
            <Text size="sm" weight="medium">{slice.label}</Text>
            <span className="vc-legend-value">{full(slice.value)}</span>
            <Text size="xs" color="secondary">{slice.note}</Text>
          </li>
        ))}
      </ul>
    </>
  )
}

export function BuildContext({ build }) {
  if (!build) return null
  const { model, tokens, mcp, memory, skills } = build

  return (
    <>
      <Heading level={2} size="lg" style={{ marginTop: 'var(--spacing-6)' }}>Tokens</Heading>
      <Text color="secondary">
        {full(tokens.total)} tokens across {tokens.sessions} sessions, {tokens.prompts} prompts and{' '}
        {full(tokens.model_calls)} model calls.
      </Text>
      <Card padding={4} style={{ marginTop: 'var(--spacing-3)' }}>
        <TokenBar breakdown={tokens.breakdown} total={tokens.total} />
        <Text size="sm" color="secondary" style={{ display: 'block', marginTop: 'var(--spacing-3)' }}>
          {tokens.note}
        </Text>
      </Card>

      <Heading level={2} size="lg" style={{ marginTop: 'var(--spacing-6)' }}>Build context</Heading>
      <div className="auto-grid" style={{ marginTop: 'var(--spacing-3)' }}>
        <Card padding={4}>
          <VStack gap={2}>
            <Text size="sm" color="secondary" weight="medium">Model</Text>
            <div className="kpi-value">{model.primary}</div>
            <Text size="sm" color="secondary">
              {full(model.primary_calls)} calls · {model.secondary} for {full(model.secondary_calls)} subagent calls
            </Text>
            <Text size="xs" color="secondary">{model.note}</Text>
          </VStack>
        </Card>

        <Card padding={4}>
          <VStack gap={2}>
            <Text size="sm" color="secondary" weight="medium">MCP servers</Text>
            <div className="kpi-value">{mcp.used.length === 0 ? 'None used' : mcp.used.join(', ')}</div>
            <div className="vc-chips">
              {mcp.available.map((server) => (
                <Badge key={server} label={`${server} · unused`} variant="neutral" />
              ))}
            </div>
            <Text size="xs" color="secondary">{mcp.note}</Text>
          </VStack>
        </Card>

        <Card padding={4}>
          <VStack gap={2}>
            <Text size="sm" color="secondary" weight="medium">Memory</Text>
            <div className="kpi-value">{memory.entries} entries</div>
            <Text size="xs" color="secondary">{memory.note}</Text>
          </VStack>
        </Card>
      </div>

      <Heading level={2} size="lg" style={{ marginTop: 'var(--spacing-6)' }}>
        Skills used ({skills.length})
      </Heading>
      <Text color="secondary">Claude Code skills that shaped how this was built, and what each one did here.</Text>
      <ul className="vc-skills">
        {skills.map((skill) => (
          <li key={skill.name}>
            <code className="vc-skill-name">/{skill.name}</code>
            <Text size="sm" color="secondary">{skill.used_for}</Text>
          </li>
        ))}
      </ul>
    </>
  )
}
