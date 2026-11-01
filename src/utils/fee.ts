import type {FeeRuleType, FeeRuleVO, TierVO, TimeSegmentVO} from '@/api/parking'

/** 金额统一两位小数 */
export const money = (v?: number | string | null): string => {
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** 分钟 → 「1 小时 30 分」 */
export const durationText = (minutes: number): string => {
  const m = Math.max(0, Math.round(minutes))
  if (m < 60) return `${m} 分钟`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest > 0 ? `${h} 小时 ${rest} 分` : `${h} 小时`
}

/** 「HH:mm」→ 当天分钟数 */
export const clockMinutes = (v?: string | null): number => {
  const [h, m] = String(v ?? '').split(':').map(Number)
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : 0
}

/** 以入场时刻为 0 的绝对分钟 → 「HH:mm」，跨天带「次日」 */
const clockText = (abs: number): string => {
  const clock = ((abs % 1440) + 1440) % 1440
  const t = `${String(Math.floor(clock / 60)).padStart(2, '0')}:${String(clock % 60).padStart(2, '0')}`
  return abs >= 1440 ? `次日 ${t}` : t
}

/** 计费类型文案 */
export const ruleTypeText = (type?: FeeRuleType): string =>
  type === 2 ? '分时段计费' : type === 3 ? '阶梯计费' : '标准计费'

/** 时段文案：结束早于开始 = 跨天，补「次日」 */
export const segmentLabel = (s: TimeSegmentVO): string =>
  `${s.start} – ${clockMinutes(s.end) <= clockMinutes(s.start) ? '次日 ' : ''}${s.end}`

/** 免费时长文案 */
export const freeMinutesText = (rule?: FeeRuleVO | null, empty = '无免费时长'): string => {
  const m = Number(rule?.freeMinutes ?? 0)
  return m > 0 ? `前 ${durationText(m)}` : empty
}

/** 阶梯文案：「前 60 分钟」「60 – 180 分钟」「180 分钟以上」 */
export const tierLabels = (tiers: TierVO[]): string[] => {
  let prev = 0
  return tiers.map(t => {
    const end = t.endMinutes
    let label: string
    if (end == null) label = prev > 0 ? `${prev} 分钟以上` : '全部时长'
    else if (prev > 0) label = `${prev} – ${end} 分钟`
    else label = `前 ${end} 分钟`
    if (end != null) prev = Number(end)
    return label
  })
}

/* 示例费用 */
export interface FeePart {
  label: string
  amount: number
}

export interface FeeEstimate {
  title: string
  total: number
  detail: string
}

/** 示例时长 2 小时 30 分 */
export const SAMPLE_MINUTES = 150

/** 标准：首小时 + 后续整小时（不足 1 小时按 1 小时） */
const standardParts = (rule: FeeRuleVO, billable: number): FeePart[] => {
  const first = Number(rule.firstHourRate ?? 0)
  const add = Number(rule.additionalRate ?? 0)
  const hours = Math.ceil(billable / 60)
  const parts: FeePart[] = [{label: '首 1 小时', amount: round2(first)}]
  if (hours > 1) parts.push({label: `之后 ${hours - 1} 小时`, amount: round2(add * (hours - 1))})
  return parts
}

/** 阶梯：按累计分钟切档，每档各自折算到分再累加 */
const tieredParts = (tiers: TierVO[], billable: number): FeePart[] => {
  const parts: FeePart[] = []
  let cursor = 0
  for (const t of tiers) {
    const end = t.endMinutes == null ? billable : Math.min(Number(t.endMinutes), billable)
    if (end <= cursor) continue
    const mins = end - cursor
    const label = cursor === 0
      ? `前 ${mins} 分钟 × ¥${money(t.rate)}/时`
      : `${cursor} – ${end} 分钟 × ¥${money(t.rate)}/时`
    parts.push({label, amount: round2(Number(t.rate) * mins / 60)})
    cursor = end
    if (cursor >= billable) break
  }
  return parts
}

/** 找当前时刻落在哪个时段（支持跨天） */
const findSegment = (segs: TimeSegmentVO[], clock: number) =>
  segs.find(s => {
    const a = clockMinutes(s.start)
    const b = clockMinutes(s.end)
    return a > b ? (clock >= a || clock < b) : (clock >= a && clock < b)
  })

/** 距下一个时段开始还有多少分钟（空隙不计费） */
const nextStartOffset = (segs: TimeSegmentVO[], clock: number): number => {
  let min = 1440
  for (const s of segs) {
    const d = (clockMinutes(s.start) - clock + 1440) % 1440
    min = Math.min(min, d === 0 ? 1440 : d)
  }
  return min
}

/** 时段：免费时长结束后逐段切片，跨时段分段累加 */
const periodParts = (
  segs: TimeSegmentVO[],
  free: number,
  billable: number,
  entry: Date,
): FeePart[] => {
  const parts: FeePart[] = []
  if (!segs.length) return parts

  const entryClock = entry.getHours() * 60 + entry.getMinutes()
  const end = free + billable
  let cursor = free
  // 空隙 + 时段最多把 24 小时切成几十段，100 次兜底防死循环
  let guard = 0

  while (cursor < end && guard++ < 100) {
    const clock = (entryClock + cursor) % 1440
    const seg = findSegment(segs, clock)
    if (!seg) {
      cursor += nextStartOffset(segs, clock)
      continue
    }
    // 本时段在时间轴上还剩多少分钟（跨天补 1440）
    const left = ((clockMinutes(seg.end) - clock + 1440) % 1440) || 1440
    const chargeEnd = Math.min(cursor + left, end)
    const mins = chargeEnd - cursor
    parts.push({
      label: `${clockText(entryClock + cursor)} – ${clockText(entryClock + chargeEnd)} `
        + `${mins} 分钟 × ¥${money(seg.rate)}/时`,
      amount: round2(Number(seg.rate) * mins / 60),
    })
    cursor = chargeEnd
  }
  return parts
}

/**
 * 示例费用。entry 默认当前时刻（时段计费要拿它当起点），
 * minutes 固定 150
 */
export const buildEstimate = (
  rule?: FeeRuleVO | null,
  entry: Date = new Date(),
  minutes: number = SAMPLE_MINUTES,
): FeeEstimate | null => {
  if (!rule) return null

  const free = Number(rule.freeMinutes ?? 0)
  const hhmm = `${String(entry.getHours()).padStart(2, '0')}:${String(entry.getMinutes()).padStart(2, '0')}`
  const title = rule.ruleType === 2
    ? `示例 · ${hhmm} 入场，停 ${durationText(minutes)}`
    : `示例 · 停 ${durationText(minutes)}`

  const billable = minutes - free
  if (billable <= 0) {
    return {title, total: 0, detail: `全程都在 ${durationText(free)} 免费时长内，不产生费用`}
  }

  let parts: FeePart[]
  if (rule.ruleType === 2) parts = periodParts(rule.timeSegments ?? [], free, billable, entry)
  else if (rule.ruleType === 3) parts = tieredParts(rule.tiers ?? [], billable)
  else parts = standardParts(rule, billable)

  const raw = round2(parts.reduce((sum, p) => sum + p.amount, 0))
  const cap = Number(rule.dailyCap ?? 0)
  const total = cap > 0 ? Math.min(raw, cap) : raw

  const detail = [
    free > 0 ? `扣除 ${durationText(free)} 免费时长` : '',
    parts.map(p => `${p.label} = ¥${money(p.amount)}`).join(' ＋ '),
    total < raw ? `按 24 小时封顶收 ¥${money(total)}` : '',
  ].filter(Boolean).join('，')

  return {title, total: round2(total), detail}
}
