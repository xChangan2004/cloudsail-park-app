import dayjs from "dayjs";

/**
 * 格式化距离
 */
export const formatDistance = (distance?: string | number | null): string => {
  if (distance === null || distance === undefined || distance === '') return ''
  const n = Number(distance)
  if (Number.isNaN(n)) return ''
  if (n < 50) return '附近'
  return n < 1000 ? `${n}m` : `${(n / 1000).toFixed(1)}km`
}

/** 格式化车牌号码 */
export const formatPlate = (v?: string) => {
  const s = (v ?? '').trim()
  if (s.length < 3) return s
  if (/[·\-\s]/.test(s.charAt(2))) return s
  return `${s.substring(0, 2)}·${s.substring(2)}`
}

/** 格式化停车时长 */
export const formatDuration = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h} 小时 ${m} 分`
  return m > 0 ? `${m} 分` : '不足 1 分'
}

/** 解析时间 */
export const parseTime = (v?: string | null) => (v ? dayjs(String(v).replace(/-/g, '/')) : null)

/** 格式化日期时间 */
export const formatDateTime = (v?: string | null) => parseTime(v)?.format('YYYY-MM-DD HH:mm:ss') ?? ''

/** 格式化日期 */
export const formatDate = (v?: string | null) => parseTime(v)?.format('YYYY-MM-DD') ?? ''

/** 格式化时间：14:20:33 */
export const formatClock = (v?: string | null) => parseTime(v)?.format('HH:mm:ss') ?? ''