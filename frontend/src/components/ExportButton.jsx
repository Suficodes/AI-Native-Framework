// The "Export buttons" the requirements doc's UX section (24) asks for, as one
// shared control. Takes the rows already on screen so an export always matches
// what the user is looking at, filters included.
import { DewaButton } from '../dewa/DewaButton.jsx'
import { downloadCsv } from '../utils/exportCsv.js'

/**
 * @param filename  Without extension, e.g. "agents".
 * @param columns   [{ key, header }] — usually a subset of the table's columns.
 * @param rows      The rows currently displayed.
 */
export function ExportButton({ filename, columns, rows, label = 'Export CSV' }) {
  return (
    <DewaButton
      label={label}
      variant="secondary"
      isDisabled={rows.length === 0}
      onClick={() => downloadCsv(`${filename}.csv`, columns, rows)}
    />
  )
}
