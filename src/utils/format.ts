/**
 * 距离展示。后端 distance 单位是米（Long → 字符串，无定位为 null）。
 * - <50m    ⇒ 「附近」（低于定位误差量级，具体米数不可信）
 * - <1000m  ⇒ 「N m」
 * - ≥1000m  ⇒ 「N.N km」
 * - null / undefined / '' / NaN ⇒ ''
 */
export const formatDistance = (distance?: string | number | null): string => {
  if (distance === null || distance === undefined || distance === '') return ''
  const n = Number(distance)
  if (Number.isNaN(n)) return ''
  if (n < 50) return '附近'
  return n < 1000 ? `${n}m` : `${(n / 1000).toFixed(1)}km`
}