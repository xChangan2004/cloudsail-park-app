import http from '@/utils/request'

export const createPayForm = (orderId: string, couponId?: string) => {
  return http.get<string, { couponId?: string }>(`/pay/${orderId}`, {
    params: {
      couponId
    }
  })
}