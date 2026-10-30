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
    isNewUser: false
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
    },
    resetLoginState() {
      this.$reset()
    }
  },
  persist: true
})