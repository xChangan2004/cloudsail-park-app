import {createLuchRequest} from 'luch-request'
import {useUserStore} from "@/stores"
import type {Result} from "@/types/api"

const baseURL = import.meta.env.VITE_BASE_URL
const apiPath = import.meta.env.VITE_API_PATH

const http = createLuchRequest({
  baseURL: baseURL + apiPath,
  timeout: 10_000,
  method: 'GET',
  header: {'Content-Type': 'application/json;charset=UTF-8'},
})

/** 请求拦截器 */
http.interceptors.request.use((config) => {
  const {token} = useUserStore()
  if (token) {
    config.header = {...config.header, Authorization: token}
  }
  return config
})

/** 并发 401 时避免重复 toast、重复跳转 */
let redirecting = false
const handleUnauthorized = () => {
  if (redirecting) return
  redirecting = true
  useUserStore().resetLoginState()
  uni.showToast({title: '登录已过期，请重新登录', icon: 'none'})
  setTimeout(() => {
    uni.navigateTo({url: '/pages/login/index'})
    redirecting = false
  }, 800)
}

/** 响应拦截器 */
http.interceptors.response.use((response) => {
  const res = response.data as Result
  if (res.code !== 200) {
    if (res.code === 401) {
      handleUnauthorized()
    } else {
      // 错误提示
      uni.showToast({
        title: res.msg || '服务器开小差啦,请稍后再试~',
        icon: 'none',
        mask: true,
      })
    }
    throw Error(res.msg || '请求失败')
  }
  response.data = res.data
  return response
}, (error) => {
  uni.showToast({title: '网络异常，请检查网络连接', icon: 'none'})
  throw error
})

export default http