import http from '@/utils/request'
import type {PageDTO, PageParams} from "@/types/api";

export type OrderStatus = 0 | 1 | 2 | 3

export interface AppOrderQuery extends PageParams {
  status?: OrderStatus
}

export interface AppOrderVO {
  id: string
  lotName: string
  plateNumber: string
  amount: number
  discount: number
  paid: number
  status: OrderStatus
  duration: string
  createTime: string
  updateTime: string
}

/** 我的订单分页列表 */
export const getMyOrders = (params: AppOrderQuery) => {
  return http.get<PageDTO<AppOrderVO>, AppOrderQuery>('/orders', {
    params
  })
}

export interface AppOrderDetailVO {
  id: string
  orderNo: string
  recordId: string
  lotId: string
  lotName: string
  plateNumber: string
  amount: number
  discount: number
  paid: number
  status: OrderStatus
  paidTime?: string
  createTime: string
  couponName?: string
  refundTime?: string
  duration?: string
}

/** 我的订单详情 */
export const getMyOrderDetail = (id: string) => {
  return http.get<AppOrderDetailVO>(`/orders/${id}`)
}