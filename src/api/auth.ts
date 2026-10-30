import http from '@/utils/request'

export interface AppLoginVO {
  token: string
  customerId: string
  nickname?: string
  avatar?: string
  phone?: string
  isNewUser?: boolean
  needBindPhone?: boolean
  bindWx?: boolean
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

export interface WxLoginDTO {
  code: string
}

/** 微信登录 */
export const wxLogin = (data: WxLoginDTO) => {
  return http.post<AppLoginVO>('/auth/wx/login', data)
}

export interface BindPhoneDTO {
  phone: string
  code: string
}

/** 绑定手机号（短信验证码） */
export const bindPhone = (data: BindPhoneDTO) => {
  return http.post('/auth/bind-phone', data)
}

export interface BindPhoneWxDTO {
  wxCode: string
}

/** 绑定手机号（微信一键获取手机号） */
export const bindPhoneByWxCode = (data: BindPhoneWxDTO) => {
  return http.post<string>('/auth/bind-phone/wx', data)
}

/** 绑定微信 */
export const bindWx = (data: WxLoginDTO) => {
  return http.post('/auth/bind-wx', data)
}

/** 解绑微信 */
export const unbindWx = () => {
  return http.post('/auth/unbind-wx')
}

/** 退出登录 */
export const logout = () => {
  return http.post('/auth/logout')
}