import http from '@/utils/request'

export type energyType = 1 | 2

export interface CustomerPlate {
  id: string
  customerId: string
  plateNumber: string
  energyType: energyType
  isDefault: boolean
}

/** 我的车牌列表 */
export const listMyPlate = () => {
  return http.get<CustomerPlate[]>('/plate/list')
}

/** 解绑车牌 */
export const unbindPlate = (id: string) => {
  return http.delete(`/plate/${id}`)
}

/** 设为默认车牌 */
export const defaultPlate = (id: string) => {
  return http.put(`/plate/${id}/default`)
}