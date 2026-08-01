// <ValueTag> — required on every important value in the app (benefit, cost,
// coverage %, capacity released, etc.) per the requirements doc's UX section:
// "Every important value must indicate whether it is Estimated / Observed /
// Verified / Validated."
//
//   <ValueTag tag="Validated" />
import { Badge } from '@astryxdesign/core/Badge'

const VARIANT_BY_TAG = {
  Estimated: 'neutral',
  Observed: 'info',
  Verified: 'warning',
  Validated: 'success',
}

export function ValueTag({ tag }) {
  const variant = VARIANT_BY_TAG[tag] ?? 'neutral'
  return <Badge label={tag} variant={variant} />
}
