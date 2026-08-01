// VR tab 6 — the nine-stage approval workflow (Draft → Business → Finance →
// BPI → PMO → Approved → Post-go-live tracking → Realized → Closed), shown as
// a funnel with the named validator for each record at its current gate.
import { useNavigate } from 'react-router-dom'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { validationFunnel, VR_STAGE_LABELS, isValidated } from '../../../data/valueAggregates.ts'
import { employeeName } from '../../../data/lookups.ts'
import { VR_STAGE_ORDER } from '../../../data/types'

/** Whose signature the record is waiting on at its current gate. */
const VALIDATOR_FOR_STAGE = {
  Draft: 'businessOwnerId',
  BusinessValidation: 'benefitOwnerId',
  FinanceValidation: 'financeValidatorId',
  BPIValidation: 'bpiValidatorId',
  PMOValidation: 'pmoValidatorId',
}

export function ValidationTab({ rows }) {
  const navigate = useNavigate()
  const funnel = validationFunnel()
  const maxCount = Math.max(1, ...funnel.map((f) => f.count))

  const columns = [
    {
      key: 'id',
      header: 'VR record',
      width: proportional(2.2, { minWidth: 220 }),
      renderCell: (row) => (
        <Text
          size="sm" weight="medium" color="accent" role="button" tabIndex={0}
          style={{ cursor: 'pointer', display: 'block' }}
          onClick={() => navigate(`/value-realization/${row.id}`)}
        >
          {row.id} — {row.initiativeTitle}
        </Text>
      ),
    },
    { key: 'validationStatus', header: 'Current gate', width: pixel(170), renderCell: (row) => <Badge label={VR_STAGE_LABELS[row.validationStatus]} variant={isValidated(row) ? 'success' : 'warning'} /> },
    {
      key: 'awaiting',
      header: 'Awaiting sign-off from',
      width: proportional(1.6, { minWidth: 180 }),
      renderCell: (row) => {
        const field = VALIDATOR_FOR_STAGE[row.validationStatus]
        return <Text size="sm" color="secondary">{field ? employeeName(row[field]) ?? '—' : 'Cleared — no gate outstanding'}</Text>
      },
    },
    {
      key: 'progress',
      header: 'Workflow progress',
      width: pixel(170),
      renderCell: (row) => {
        const step = VR_STAGE_ORDER.indexOf(row.validationStatus) + 1
        return (
          <ProgressBar
            value={(step / VR_STAGE_ORDER.length) * 100}
            label={`Step ${step} of ${VR_STAGE_ORDER.length}`}
            variant={isValidated(row) ? 'success' : 'accent'}
          />
        )
      },
    },
  ]

  return (
    <VStack gap={5}>
      <Card padding={4}>
        <VStack gap={3}>
          <VStack gap={1}>
            <Text weight="semibold">Approval workflow</Text>
            <Text size="sm" color="secondary">Where the portfolio's records currently sit across the nine gates.</Text>
          </VStack>
          {funnel.map((stage) => (
            <HStack key={stage.stage} gap={3} align="center">
              <div style={{ minWidth: 180 }}><Text size="sm">{stage.label}</Text></div>
              <div style={{ flex: 1 }}>
                <ProgressBar
                  value={(stage.count / maxCount) * 100}
                  label={`${stage.count} record${stage.count === 1 ? '' : 's'}`}
                  variant={stage.count === 0 ? 'neutral' : 'accent'}
                />
              </div>
            </HStack>
          ))}
        </VStack>
      </Card>

      <Card padding={0}>
        <div style={{ overflowX: 'auto' }}>
          <Table data={rows} columns={columns} idKey="id" hasHover density="compact" />
        </div>
      </Card>
    </VStack>
  )
}
