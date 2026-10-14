import http from '@/utils/request'
import type {PageDTO, PageParams} from "@/types/api";

export interface MyParkingStatusVO {
  recordId: string
  lotId: string
  lotName: string
  plateNumber: string
  entryTime: string
  seconds: string
  estimatedFee: number | null
}

/** 我的停车状态 */
export const getMyParkingStatus = () => {
  return http.get<MyParkingStatusVO[]>('/parking/status')
}

export type sortType = 'smart' | 'distance' | 'price'

export interface AppParkingLotQuery extends PageParams {
  name?: string
  lng?: number
  lat?: number
  radiusKm?: number
  onlyFree?: boolean
  sortType?: sortType
}

export interface AppParkingLotVO {
  id: string
  name: string
  address: string
  cover?: string
  facilities?: string[]
  longitude: number
  latitude: number
  totalSpaces: number
  freeSpaces: string
  hasFree: boolean
  distance: string
}

/** 停车场分页列表 */
export const getParkingLot = (params: AppParkingLotQuery) => {
  return http.get<PageDTO<AppParkingLotVO>, AppParkingLotQuery>('/parking/lots', {
    params
  })
}