import {defineStore} from "pinia"

/** 最多保留多少条 */
const MAX = 10

export const useSearchHistoryStore = defineStore('searchHistory', {
  state: () => ({
    keywords: [] as string[],
  }),
  actions: {
    /** 记录 */
    push(keyword: string) {
      const kw = keyword.trim()
      if(!kw) return
      this.keywords = [kw, ...this.keywords.filter(h => h !== kw)].slice(0, MAX)
    },
    clear() {
      this.keywords = []
    },
  },
  persist: true
})