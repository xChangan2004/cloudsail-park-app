import http from '@/utils/request'

export interface AppLoginVO {
  token: string
  customerId: string
  nickname: string
  avatar: string
  phone: string
  isNewUser: boolean
}

export interface AppLoginDTO {
  phone: string
  code: string
}

/** 发送验证码 */
export const sendCode = (phone: string) => {
  return http.post(`/auth/code?phone=${phone}`)
}

/** 登录 */
export const login = (data: AppLoginDTO) => {
  return http.post<AppLoginVO>('/auth/login', data)
}

/** 退出登录 */
export const logout = () => {
  return http.post('/auth/logout')
}