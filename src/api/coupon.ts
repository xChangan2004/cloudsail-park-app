import http from '@/utils/request'

export type CouponStatus = 0 | 1 | 2 | 3

export interface AppCouponVO {
  id: string
  name: string
  threshold: number
  amount: number
  status: CouponStatus
  expireTime: string
  receiveTime: string
}

/** 我的券包 */
export const getMyCoupons = (status?: CouponStatus) => {
  return http.get<AppCouponVO[], { status?: CouponStatus }>('/coupon/mine', {
    params: {
      status
    }
  })
}

export interface AppCouponTemplateVO {
  id: string
  name: string
  threshold: number
  amount: number
  validDays: number
  remainCount: number
  received: number
  perLimit: number
  canReceive: boolean
}

/** 可领券列表 */
export const getCouponTemplates = () => {
  return http.get<AppCouponTemplateVO[]>('/coupon/templates')
}

/** 领取优惠券 */
export const receiveCoupon = (templateId: string) => {
  return http.post(`/coupon/receive/${templateId}`)
}