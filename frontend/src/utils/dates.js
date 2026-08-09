/**
 * Maps a pot's saving-day number (1-30) to a real calendar date, based on
 * the pot's start_date ("YYYY-MM-DD"). Day 1 = start_date, day 2 = start_date + 1, etc.
 * Day 31 (the fee day) is treated as start_date + 30.
 */
export function dateForDay(startDate, dayNumber) {
  if (!startDate || !dayNumber) return null
  const [y, m, d] = startDate.split('-').map(Number)
  const base = new Date(y, m - 1, d)
  base.setDate(base.getDate() + (dayNumber - 1))
  return base
}

/** "Aug 8" */
export function formatShort(date) {
  if (!date) return ''
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** "Saturday, August 8" */
export function formatLong(date) {
  if (!date) return ''
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}
