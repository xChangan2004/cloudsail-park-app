import {createPinia} from 'pinia'
import {createPersistedState} from 'pinia-plugin-persistedstate'

const pinia = createPinia()

pinia.use(createPersistedState({
  storage: {
    getItem: (key: string) => uni.getStorageSync(key),
    setItem: (key: string, value: string) => uni.setStorageSync(key, value),
  }
}))

export default pinia
export * from './modules/user'
export * from './modules/location'
export * from './modules/searchHistory'