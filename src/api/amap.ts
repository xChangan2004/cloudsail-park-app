const KEY = import.meta.env.VITE_AMAP_KEY

/** 逆地理编码（入参 gcj02）→ 返回「广州市天河区」 */
export const regeo = (lng: number, lat: number) => {
  return new Promise<string>((resolve, reject) => {
    uni.request({
      url: 'https://restapi.amap.com/v3/geocode/regeo',
      data: {
        key: KEY,
        location: `${lng.toFixed(6)},${lat.toFixed(6)}`,
        extensions: 'base'
      },
      success: (res) => {
        const b = res.data as any
        if (b?.status !== '1') return reject(new Error(`[${b?.infocode}] ${b?.info}`))
        const a = b.regeocode.addressComponent
        const str = (v: unknown) => (typeof v === 'string' ? v : '')
        // 准确度从高到低：社区/小区 → 建筑 → 最近道路 → 商圈 → 社区街道 → 行政区
        const main =
          str(a.neighborhood?.name) ||
          str(a.building?.name) ||
          str(a.streetNumber?.street) ||
          str(a.businessAreas?.[0]?.name) ||
          str(a.township)

        const tail = str(a.district) || str(a.city) || str(a.province)
        resolve([tail, main].filter(Boolean).join(' · ') || '当前位置')
      },
      fail: reject
    })
  })
}