import {defineStore} from 'pinia'
import type {AppLoginVO} from "@/api/auth";

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    customerId: '',
    nickname: '',
    avatar: '',
    phone: '',
    bindWx: false,
    isNewUser: false,
    /** 注销冷静期中 */
    deletionPending: false,
    /** 注销生效时间 */
    deletionEffectiveTime: ''
  }),
  getters: {
    isLogin(): boolean {
      return !!this.token
    }
  },
  actions: {
    setLoginInfo(info: AppLoginVO) {
      this.token = info.token ?? ''
      this.customerId = info.customerId ?? ''
      this.nickname = info.nickname ?? ''
      this.avatar = info.avatar ?? ''
      this.phone = info.phone ?? ''
      this.bindWx = info.bindWx ?? false
      this.isNewUser = info.isNewUser ?? false
      this.deletionPending = info.deletionPending ?? false
      this.deletionEffectiveTime = info.deletionEffectiveTime ?? ''
    },
    /** 同步注销状态（申请 / 撤销 / 查询后调用） */
    setDeletion(pending: boolean, effectiveTime = '') {
      this.deletionPending = pending
      this.deletionEffectiveTime = pending ? effectiveTime : ''
    },
    resetLoginState() {
      this.$reset()
    }
  },
  persist: true
})