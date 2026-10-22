import { dateForDay, formatShort, formatLong } from '../utils/dates'

/**
 * The 31-dot board: days 1-30 are saving days, day 31 is the platform fee day.
 * Dots are arranged in rows that taper in and out — a barrel/pot silhouette —
 * so the board itself reads as the "pot" the app is named for, with the fee
 * day sitting apart at the top like a lid.
 *
 * Day 31 (the fee day) is tracked with the SAME paid/unpaid status as any
 * other day — is_fee_day is only a style flag (clay-colored ring), not a
 * reason to disable interaction. It accepts a buffer drop/tap exactly like
 * any other unpaid day once days 1-30 are done.
 *
 * ALLOCATION RULE (matches the backend's own /payments/record behavior):
 * any payment fills the *current* day first; anything left over becomes a
 * buffer day. Buffer days show as loose gold dots — drag one onto any blank
 * (unpaid) day, or just tap the day you want to fill.
 *
 * REAL API SHAPE (confirmed from GET /pots/{pot_id}/board):
 *   {
 *     pot_id, name, daily_amount, currency, days_paid, buffer_days,
 *     total_collected, progress_percent,
 *     days: [
 *       { day_number, status: "confirmed" | "unpaid", is_fee_day, allocated_at }
 *       ...
 *     ]
 *   }
 * "confirmed" = paid.
 */

const ROW_COUNTS = [4, 5, 6, 6, 5, 4] // sums to 30 saving days
const BUFFER_DRAG_TYPE = 'application/x-dailypot-buffer-day'

const STATUS_ALIASES = {
  confirmed: 'paid',
  paid: 'paid',
  collected: 'paid',
  complete: 'paid',
  completed: 'paid',
  settled: 'paid',
  unpaid: 'unpaid',
  pending: 'unpaid',
  open: 'unpaid',
  missed: 'unpaid',
}

function normalizeStatus(raw) {
  if (!raw) return 'unpaid'
  const key = String(raw).toLowerCase().trim()
  return STATUS_ALIASES[key] || 'unpaid'
}

function fallbackFromDaysPaid(pot) {
  const daysPaid = pot?.days_paid ?? 0
  return Array.from({ length: 31 }, (_, i) => {
    const dayNumber = i + 1
    const isFeeDay = dayNumber === 31
    if (dayNumber <= daysPaid && !isFeeDay) return { day_number: dayNumber, status: 'paid', is_fee_day: false }
    return { day_number: dayNumber, status: 'unpaid', is_fee_day: isFeeDay }
  })
}

function isSameCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// "Due today" means exactly that: the unpaid, non-fee day whose real
// calendar date (start_date + day_number - 1) actually IS today — not just
// "the earliest gap." If no unpaid day's date matches today, nothing gets
// the "today" highlight rather than guessing at the wrong day.
function markToday(days, pot) {
  if (!pot?.start_date) return days
  const today = new Date()
  return days.map((d) => {
    if (d.status !== 'unpaid' || d.is_fee_day) return d
    const target = dateForDay(pot.start_date, d.day_number)
    return target && isSameCalendarDay(target, today) ? { ...d, status: 'today' } : d
  })
}

export function normalizeBoard(board, pot) {
  const rawDays = Array.isArray(board?.days) ? board.days : null

  if (rawDays && rawDays.length) {
    const parsed = rawDays.map((d, i) => {
      const dayNumber = d.day_number ?? d.day ?? d.number ?? i + 1
      const isFeeDay = d.is_fee_day === true || dayNumber === 31
      return {
        day_number: dayNumber,
        status: normalizeStatus(d.status ?? d.state),
        is_fee_day: isFeeDay,
        allocated_at: d.allocated_at ?? null,
      }
    })

    const anyPaidParsed = parsed.some((d) => d.status === 'paid')
    const potHasPaidDays = (pot?.days_paid ?? 0) > 0
    if (!anyPaidParsed && potHasPaidDays) {
      return markToday(fallbackFromDaysPaid(pot), pot)
    }

    return markToday(parsed, pot)
  }

  return markToday(fallbackFromDaysPaid(pot), pot)
}

const BASE_STYLES = {
  paid: 'bg-teal border-teal text-white',
  today: 'bg-gold border-gold text-ink ring-4 ring-gold/25',
  unpaid: 'bg-white border-ink/15 text-ink/40 hover:border-teal/50',
}
// Fee day gets the same paid/unpaid coloring as any day, plus a clay ring
// so it still visually reads as "the special one" without losing its real
// interactive state.
const FEE_RING = 'ring-2 ring-clay ring-offset-1 ring-offset-paper'

function dotStyle(status, isFeeDay) {
  const base = BASE_STYLES[status] || BASE_STYLES.unpaid
  return isFeeDay ? `${base} ${FEE_RING}` : base
}

export default function PotBoard({ board, pot, onAllocate, allocatable = false, busy = false }) {
  const days = normalizeBoard(board, pot)
  const byDay = new Map(days.map((d) => [d.day_number, d]))
  const bufferCount = pot?.buffer_days ?? 0

  let cursor = 0
  const rows = ROW_COUNTS.map((count) => {
    const row = []
    for (let i = 0; i < count; i += 1) {
      cursor += 1
      row.push(byDay.get(cursor) || { day_number: cursor, status: 'unpaid', is_fee_day: false })
    }
    return row
  })
  const feeDay = byDay.get(31) || { day_number: 31, status: 'unpaid', is_fee_day: true }

  function placeOnDay(dayNumber) {
    if (busy) return
    onAllocate?.(dayNumber)
  }

  const isDroppable = (day) => allocatable && (day.status === 'unpaid' || day.status === 'today') && !busy

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Day 31 — the fee day — sits apart like the pot's lid, but behaves
          like any other day: droppable/tappable whenever it's still unpaid. */}
      <Dot day={feeDay} pot={pot} interactive={isDroppable(feeDay)} onActivate={() => placeOnDay(31)} />

      {/* Phones get bigger dots with tighter gaps/padding, so the 6-dot rows
          still fit a 360px screen. */}
      <div className="flex flex-col items-center gap-1.5 rounded-pot bg-ink/[0.03] px-3 py-4 sm:gap-2.5 sm:px-6 sm:py-6">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-1.5 sm:gap-2.5">
            {row.map((day) => (
              <Dot
                key={day.day_number}
                day={day}
                pot={pot}
                interactive={isDroppable(day)}
                onActivate={() => placeOnDay(day.day_number)}
              />
            ))}
          </div>
        ))}
      </div>

      {allocatable && bufferCount > 0 && <BufferTray count={bufferCount} busy={busy} />}

      <Legend />
    </div>
  )
}

function Dot({ day, pot, interactive, onActivate }) {
  const status = day.status || 'unpaid'
  const targetDate = pot?.start_date ? dateForDay(pot.start_date, day.day_number) : null
  const paidDate = day.allocated_at ? new Date(day.allocated_at) : null
  const feeLabel = day.is_fee_day ? ' · platform fee day' : ''

  const title = paidDate
    ? `Day ${day.day_number} · paid ${formatLong(paidDate)}${feeLabel}`
    : interactive
      ? `${targetDate ? formatLong(targetDate) + ' · ' : ''}Day ${day.day_number} · ${status}${feeLabel} — tap, or drag a buffer day here`
      : targetDate
        ? `${formatLong(targetDate)} · Day ${day.day_number} · ${status}${feeLabel}`
        : `Day ${day.day_number} · ${status}${feeLabel}`

  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={interactive ? onActivate : undefined}
      onDragEnter={interactive ? (e) => e.preventDefault() : undefined}
      onDragOver={interactive ? (e) => e.preventDefault() : undefined}
      onDrop={
        interactive
          ? (e) => {
              e.preventDefault()
              e.stopPropagation()
              onActivate?.()
            }
          : undefined
      }
      title={title}
      className={`group flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-px rounded-full border text-xs font-mono font-semibold
        sm:h-9 sm:w-9 sm:gap-0 sm:text-[11px]
        transition-all ${dotStyle(status, day.is_fee_day)}
        ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
    >
      <span className="leading-none">{day.day_number}</span>
      {targetDate && (
        <span className="text-[9px] font-normal leading-none text-current/70 sm:text-[8px]">
          {formatShort(targetDate)}
        </span>
      )}
    </button>
  )
}

function BufferTray({ count, busy }) {
  return (
    <div className="w-full rounded-xl border border-dashed border-gold/50 bg-gold/5 px-4 py-3">
      <p className="mb-2 text-center text-xs font-medium text-gold-deep">
        {count} buffer day{count > 1 ? 's' : ''} — drag one onto a blank day, or just tap the day you want to fill
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            draggable={!busy}
            // Firefox (and some other browsers) won't start a drag at all
            // unless dataTransfer actually has data set in onDragStart.
            onDragStart={(e) => {
              e.dataTransfer.setData(BUFFER_DRAG_TYPE, 'buffer-day')
              e.dataTransfer.effectAllowed = 'move'
            }}
            title="Buffer day — drag onto a blank day"
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed sm:h-9 sm:w-9
              border-gold bg-gold-soft/60 text-ink transition-transform
              ${busy ? 'opacity-50' : 'cursor-grab hover:scale-110 active:cursor-grabbing'}`}
          >
            ●
          </div>
        ))}
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted">
      <span className="flex items-center gap-1.5">
        <span className={`h-2.5 w-2.5 rounded-full border ${BASE_STYLES.paid}`} />
        Paid
      </span>
      <span className="flex items-center gap-1.5">
        <span className={`h-2.5 w-2.5 rounded-full border ${BASE_STYLES.today}`} />
        Due today
      </span>
      <span className="flex items-center gap-1.5">
        <span className={`h-2.5 w-2.5 rounded-full border ${BASE_STYLES.unpaid}`} />
        Unpaid
      </span>
      <span className="flex items-center gap-1.5">
        <span className={`h-2.5 w-2.5 rounded-full border border-clay ring-2 ring-clay ring-offset-1 ring-offset-paper bg-white`} />
        Fee day (ring = fee, fill = paid/unpaid as usual)
      </span>
    </div>
  )
}
