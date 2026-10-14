import {defineStore} from "pinia"
import {useUserStore} from "@/stores";
import {getMyUnpaidCount} from "@/api/order";

const TAB_INDEX = 1

export const useBadgeStore = defineStore('badge', {
  state: () => ({
    unpaidCount: 0,
    /** 请求中 */
    fetching: false,
    /** 请求中又来了新触发，飞完补一次，别丢 */
    dirty: false
  }),
  actions: {
    async refreshUnpaid() {
      const userStore = useUserStore()
      if (!userStore.isLogin) {
        this.clear()
        return
      }
      if (this.fetching) {
        this.dirty = true
        return
      }
      this.fetching = true
      try {
        const res = await getMyUnpaidCount()
        this.unpaidCount = Number(res.data?.count ?? 0)
        this.applyBadge()
      } catch {
      } finally {
        this.fetching = false
        if (this.dirty) {
          this.dirty = false
          await this.refreshUnpaid()   // 补一次
        }
      }
    },
    /** 应用角标 */
    applyBadge() {
      if (this.unpaidCount > 0) {
        uni.setTabBarBadge({
          index: TAB_INDEX,
          text: this.unpaidCount > 99 ? '99+' : String(this.unpaidCount),
          fail: () => {
          }
        })
      } else {
        uni.removeTabBarBadge({
          index: TAB_INDEX, fail: () => {
          }
        })
      }
    },
    /** 清角标 */
    clear() {
      this.unpaidCount = 0
      this.applyBadge()
    }
  }
})