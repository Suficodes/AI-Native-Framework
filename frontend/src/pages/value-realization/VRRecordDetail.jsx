// One VR record in full — every field requirements doc Section 14 lists, plus
// the five named validators and the position of the record in the nine-stage
// approval workflow. Route: /value-realization/:vrId.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { getValueRealization } from '../../data/mockApi'
import { vrRow, BENEFIT_LABELS, COST_LABELS, VR_STAGE_LABELS, isValidated } from '../../data/valueAggregates.ts'
import { employeeName } from '../../data/lookups.ts'
import { VR_STAGE_ORDER } from '../../data/types'
import { Aed } from '../../dewa/Aed.jsx'
import { ValueTag } from '../../dewa/ValueTag.jsx'
import { DewaButton } from '../../dewa/DewaButton.jsx'

function LinkText({ label, to }) {
  const navigate = useNavigate()
  if (!label) return <Text>—</Text>
  return (
    <Text color="accent" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => navigate(to)}>
      {label}
    </Text>
  )
}

export default function VRRecordDetail() {
  const { vrId } = useParams()
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { setLoaded(false); getValueRealization().then(() => setLoaded(true)) }, [vrId])

  if (!loaded) return <div className="page-band page-band--wide"><Skeleton height={520} radius={2} /></div>

  const record = vrRow(vrId)
  if (!record) {
    return (
      <div className="page-band page-band--wide">
        <EmptyState title="VR record not found" description={`No Value Realization record with ID "${vrId}".`} />
      </div>
    )
  }

  const currentStep = VR_STAGE_ORDER.indexOf(record.validationStatus) + 1
  const costColumns = [
    { key: 'category', header: 'Cost category', width: proportional(2, { minWidth: 200 }), renderCell: (row) => <Text size="sm">{COST_LABELS[row.category]}</Text> },
    { key: 'amount', header: 'Amount', width: pixel(140), renderCell: (row) => <Text size="sm" weight="semibold"><Aed aed={row.amount} compact /></Text> },
  ]

  return (
    <div className="page-band page-band--wide">
      <DewaButton label="Back to Value Realization" variant="ghost" onClick={() => navigate('/value-realization')} style={{ marginBottom: 'var(--spacing-4)' }} />

      <div style={{ marginBottom: 'var(--spacing-5)' }}>
        <span className="eyebrow">Value Realization record · {record.id}</span>
        <Heading level={1} type="display-3">{record.initiativeTitle}</Heading>
        <Text color="secondary" size="lg">{record.divisionName} · review period {record.reviewPeriod}</Text>
      </div>

      <VStack gap={5}>
        <div className="auto-grid" style={{ '--min': '230px' }}>
          <Card padding={4}>
            <VStack gap={2}>
              <Text size="sm" color="secondary" weight="medium">Gross benefit</Text>
              <div className="kpi-value"><Aed aed={record.grossBenefit} compact /></div>
              <HStack justify="between" align="center">
                <Text size="sm" color="secondary">Against target <Aed aed={record.target} compact /></Text>
                <ValueTag tag={isValidated(record) ? 'Validated' : 'Estimated'} />
              </HStack>
            </VStack>
          </Card>
          <Card padding={4}>
            <VStack gap={2}>
              <Text size="sm" color="secondary" weight="medium">Total AI cost</Text>
              <div className="kpi-value"><Aed aed={record.totalCost} compact /></div>
              <HStack justify="between" align="center">
                <Text size="sm" color="secondary">{record.aiCost.length} cost line{record.aiCost.length === 1 ? '' : 's'}</Text>
                <ValueTag tag="Verified" />
              </HStack>
            </VStack>
          </Card>
          <Card padding={4}>
            <VStack gap={2}>
              <Text size="sm" color="secondary" weight="medium">Net benefit</Text>
              <div className="kpi-value"><Aed aed={record.netBenefit} compact signed /></div>
              <HStack justify="between" align="center">
                <Text size="sm" color="secondary">Gross benefit less AI cost</Text>
                <ValueTag tag={isValidated(record) ? 'Validated' : 'Estimated'} />
              </HStack>
            </VStack>
          </Card>
          <Card padding={4}>
            <VStack gap={3}>
              <Text size="sm" color="secondary" weight="medium">Benefit realization</Text>
              <div className="kpi-value">{record.benefitRealizationPct}%</div>
              <ProgressBar
                value={Math.min(100, record.benefitRealizationPct)}
                variant={record.benefitRealizationPct >= 100 ? 'success' : record.benefitRealizationPct >= 75 ? 'warning' : 'error'}
              />
            </VStack>
          </Card>
        </div>

        <Card padding={4}>
          <VStack gap={3}>
            <HStack justify="between" align="center" gap={2} style={{ flexWrap: 'wrap' }}>
              <Text weight="semibold">Validation workflow</Text>
              <Badge label={VR_STAGE_LABELS[record.validationStatus]} variant={isValidated(record) ? 'success' : 'warning'} />
            </HStack>
            <ProgressBar
              value={(currentStep / VR_STAGE_ORDER.length) * 100}
              label={`Step ${currentStep} of ${VR_STAGE_ORDER.length} — ${VR_STAGE_LABELS[record.validationStatus]}`}
              hasValueLabel
              variant={isValidated(record) ? 'success' : 'accent'}
            />
            <HStack gap={2} style={{ flexWrap: 'wrap' }}>
              {VR_STAGE_ORDER.map((stage, i) => (
                <Badge
                  key={stage}
                  label={`${i + 1}. ${VR_STAGE_LABELS[stage]}`}
                  variant={i < currentStep ? 'success' : i === currentStep ? 'warning' : 'neutral'}
                />
              ))}
            </HStack>
          </VStack>
        </Card>

        <Card padding={4}>
          <MetadataList columns={3}>
            <MetadataListItem label="VR ID">{record.id}</MetadataListItem>
            <MetadataListItem label="AI initiative">
              <LinkText label={record.initiativeTitle} to={`/ai-initiatives/${record.aiInitiativeId}`} />
            </MetadataListItem>
            <MetadataListItem label="D2D demand">
              {record.d2dDemandId
                ? <LinkText label={record.d2dDemandId} to={`/d2d-integration/demands/${record.d2dDemandId}`} />
                : 'Not raised through D2D'}
            </MetadataListItem>
            <MetadataListItem label="Agent">
              {record.agentName ? <LinkText label={record.agentName} to={`/agents/${record.agentId}`} /> : 'No agent assigned'}
            </MetadataListItem>
            <MetadataListItem label="Harness">
              {record.harnessName ? <LinkText label={record.harnessName} to={`/harness-engineering/${record.harnessId}`} /> : 'No harness assigned'}
            </MetadataListItem>
            <MetadataListItem label="Benefit type">{BENEFIT_LABELS[record.benefitType]}</MetadataListItem>
            <MetadataListItem label="Business owner">{employeeName(record.businessOwnerId) ?? '—'}</MetadataListItem>
            <MetadataListItem label="Benefit owner">{employeeName(record.benefitOwnerId) ?? '—'}</MetadataListItem>
            <MetadataListItem label="Finance validator">{employeeName(record.financeValidatorId) ?? '—'}</MetadataListItem>
            <MetadataListItem label="BPI validator">{employeeName(record.bpiValidatorId) ?? '—'}</MetadataListItem>
            <MetadataListItem label="PMO validator">{employeeName(record.pmoValidatorId) ?? '—'}</MetadataListItem>
            <MetadataListItem label="Baseline period">{record.baselinePeriod}</MetadataListItem>
            <MetadataListItem label="Baseline value"><Aed aed={record.baselineValue} compact /></MetadataListItem>
            <MetadataListItem label="Target"><Aed aed={record.target} compact /></MetadataListItem>
            <MetadataListItem label="Actual result"><Aed aed={record.actualResult} compact /></MetadataListItem>
            <MetadataListItem label="Measurement method">{record.measurementMethod}</MetadataListItem>
            <MetadataListItem label="Review period">{record.reviewPeriod}</MetadataListItem>
          </MetadataList>
        </Card>

        <div className="auto-grid" style={{ '--min': '340px' }}>
          <Card padding={4}>
            <VStack gap={3}>
              <Text weight="semibold">Evidence</Text>
              <VStack gap={1}>
                {record.evidence.map((item) => (
                  <Text key={item} size="sm" color="secondary" style={{ display: 'block' }}>• {item}</Text>
                ))}
              </VStack>
            </VStack>
          </Card>
          <Card padding={0}>
            <div style={{ padding: 'var(--spacing-4) var(--spacing-4) 0' }}>
              <Text weight="semibold">AI cost breakdown</Text>
            </div>
            <div style={{ overflowX: 'auto', marginTop: 'var(--spacing-3)' }}>
              <Table data={record.aiCost} columns={costColumns} idKey="category" density="compact" />
            </div>
          </Card>
        </div>
      </VStack>
    </div>
  )
}
