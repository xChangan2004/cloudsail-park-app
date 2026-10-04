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
