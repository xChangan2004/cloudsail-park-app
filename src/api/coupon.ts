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