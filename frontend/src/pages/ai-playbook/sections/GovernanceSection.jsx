// Playbook section 10 — governance. Enterprise rules, the seven approval
// gates, and the accountable roles, fronted by a compliance snapshot measured
// from the agents and Quality Procedures in scope.
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { Banner } from '@astryxdesign/core/Banner'
import { KpiCard } from '../../../components/KpiCard.jsx'
import { GuidanceList } from '../PlaybookSection.jsx'

export function GovernanceSection({ playbook }) {
  const { rules, approvalGates, accountableRoles, complianceSnapshot, openRisks } = playbook.governance

  return (
    <VStack gap={4}>
      <div className="auto-grid" style={{ '--min': '210px' }}>
        {complianceSnapshot.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            suffix={kpi.suffix}
            tag={kpi.tag}
            definition={`Measured across the agents and Quality Procedures inside the ${playbook.scope.label} scope.`}
            source="Agent registry and Quality Procedure register"
          />
        ))}
      </div>

      <Card padding={4}>
        <VStack gap={3}>
          <Text weight="semibold">Governance rules</Text>
          {rules.map((rule) => (
            <HStack key={rule.area} gap={3} align="start" style={{ flexWrap: 'wrap' }}>
              <div style={{ minWidth: 120 }}><Badge label={rule.area} variant="neutral" /></div>
              <Text size="sm" color="secondary" style={{ flex: 1, minWidth: 260 }}>{rule.rule}</Text>
            </HStack>
          ))}
        </VStack>
      </Card>

      <div className="auto-grid" style={{ '--min': '300px' }}>
        <Card padding={4}>
          <VStack gap={3}>
            <Text weight="semibold">Approval gates</Text>
            <HStack gap={2} style={{ flexWrap: 'wrap' }}>
              {approvalGates.map((gate, i) => (
                <Badge key={gate} label={`${i + 1}. ${gate}`} variant="info" />
              ))}
            </HStack>
          </VStack>
        </Card>
        <Card padding={4}>
          <VStack gap={3}>
            <Text weight="semibold">Accountable roles</Text>
            {accountableRoles.map((role) => (
              <VStack key={role.role} gap={0}>
                <Text size="sm" weight="medium" style={{ display: 'block' }}>{role.role}</Text>
                <Text size="sm" color="secondary">{role.responsibility}</Text>
              </VStack>
            ))}
          </VStack>
        </Card>
      </div>

      {openRisks.length === 0 ? (
        <Banner
          status="success"
          title="No open governance risks in this scope"
          description="No unresolved incident, sub-threshold compliance score, overdue Quality Procedure review, or L5+ autonomy agent was found for the current period."
        />
      ) : (
        <>
          <Banner
            status="warning"
            title="Open governance risks in this scope"
            description={`${openRisks.length} item${openRisks.length === 1 ? ' requires' : 's require'} attention before autonomy increases.`}
          />
          <Card padding={4}><GuidanceList items={openRisks} /></Card>
        </>
      )}
    </VStack>
  )
}
