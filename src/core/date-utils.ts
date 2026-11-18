// Date strings coming back from Dairy.Transaction.Api vary by endpoint — ISO
// ("2023-08-28T00:00:00") from the list endpoints, "MM/DD/YYYY HH:mm:ss" from
// DesAck/GetByDesAckId — this normalizes either into the "YYYY-MM-DD" shape

export function toDateInputValue(
  value?: string | Date | null
): string {
  if (!value) return ''

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return ''
    return formatLocalDate(value)
  }

  const isoMatch = value.match(/^(\d{4}-\d{2}-\d{2})/)
  if (isoMatch) return isoMatch[1]

  const usMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (usMatch) {
    const [, month, day, year] = usMatch

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return ''
}

export function toDdMmYyyy(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return isoDate

  const [, year, month, day] = match
  return `${day}-${month}-${year}`
}


// "YYYY-MM-DD" in the user's local time zone. Date.toISOString() is UTC, which
// shifts a local-midnight date (e.g. from a date picker) back a day east of UTC.
export function formatLocalDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
