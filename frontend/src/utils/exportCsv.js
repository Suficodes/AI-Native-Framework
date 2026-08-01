// CSV export — the "Export buttons" the requirements doc's UX section (24)
// asks for. Deliberately dependency-free and client-side: this prototype has
// no backend to generate a file from.
//
// Grep target: "do we already have an export helper?" — yes, this one.

/** RFC 4180 escaping: quote a field, and double any quote inside it. */
function escapeField(value) {
  const text = value == null ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * Build a CSV string from rows and a column spec.
 * @param columns {{key: string, header: string}[]}
 */
export function toCsv(columns, rows) {
  const head = columns.map((c) => escapeField(c.header)).join(',')
  const body = rows.map((row) => columns.map((c) => escapeField(row[c.key])).join(','))
  return [head, ...body].join('\r\n')
}

/** Trigger a browser download of `rows` as CSV. */
export function downloadCsv(filename, columns, rows) {
  // A BOM so Excel opens UTF-8 (and the dirham glyph) correctly rather than
  // mojibake — the default on a Windows enterprise desktop.
  const blob = new Blob(['﻿', toCsv(columns, rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
