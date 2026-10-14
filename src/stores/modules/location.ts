import {defineStore} from 'pinia'
import {wgs84ToGcj02} from "@/utils/coord";
import {regeo} from "@/api/amap";

/** 坐标保质期(ms)。跨区移动后旧坐标会让「距离 / 附近」全错，所以要有期限 */
const TTL = 5 * 60 * 1000

/** 进行中的定位请求：并发调用复用它，避免重复弹授权、重复烧逆地理配额 */
let pending: Promise<boolean> | null = null

export const useLocationStore = defineStore('location', {
  state: () => ({
    /** 经度 */
    lng: undefined as number | undefined,
    /** 纬度 */
    lat: undefined as number | undefined,
    /** 逆地址展示文本 */
    addressText: '点击定位',
    /** 最后一次定位成功的时间戳(ms)，0 = 从未成功 */
    locatedAt: 0,
    /** 定位中 */
    locating: false,
  }),
  getters: {
    /** 有可用坐标 */
    hasCoords(state): boolean {
      return state.lng != null && state.lat != null
    },
    /** 坐标缺失或已过期 ⇒ 需要重新定位 */
    isStale(state): boolean {
      if (state.lng == null || state.lat == null) return true
      return Date.now() - state.locatedAt > TTL
    },
  },
  actions: {
    /**
     * 定位。force=true 忽略保质期强制重定位。
     * 返回是否拿到可用坐标 —— 失败不抛，调用方不用写 catch。
     */
    async locate(force = false): Promise<boolean> {
      if (pending) return pending
      if (!force && !this.isStale) return true

      this.locating = true
      // 已有坐标 + 文案时保留旧值，别让下拉刷新闪一下「定位中...」
      if (!this.hasCoords) this.addressText = '定位中...'

      pending = this.doLocate()
      try {
        return await pending
      } finally {
        pending = null
        this.locating = false
      }
    },
    async doLocate(): Promise<boolean> {
      try {
        const res = await new Promise<{ longitude: number; latitude: number }>((resolve, reject) => {
          uni.getLocation({
            type: 'wgs84',
            success: resolve,
            fail: reject,
          })
        })

        const g = wgs84ToGcj02(res.longitude, res.latitude)
        this.lng = g.longitude
        this.lat = g.latitude
        this.locatedAt = Date.now()
        // 逆地理不阻塞定位结果，失败退回「当前位置」
        regeo(g.longitude, g.latitude)
          .then((text) => {
            this.addressText = text
          })
          .catch((err) => {
            console.warn('[regeo]', err)
            this.addressText = '当前位置'
          })
        return true
      } catch (err) {
        // 常见原因：拒绝授权 / 小程序未申请「用户地理位置」接口权限
        console.warn('[location]', err)
        if (!this.hasCoords) this.addressText = '定位失败，点击重试'
        return false
      }
    }
  }
})