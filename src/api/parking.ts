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

export interface FacilityVO {
  code: string
  name: string
  icon: string
}

export interface AppParkingLotVO {
  id: string
  name: string
  address: string
  cover?: string
  facilities?: FacilityVO[]
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

export type FeeRuleType = 1 | 2 | 3

/** 分时段费率：start/end 为 HH:mm，允许 start > end 表示跨天 */
export interface TimeSegmentVO {
  start: string
  end: string
  /** 该时段每小时费率（元） */
  rate: number
}

/** 阶梯费率：endMinutes 为该档结束的累计分钟数，最后一档必须为 null（之后不限） */
export interface TierVO {
  endMinutes: number | null
  /** 该档每小时费率（元） */
  rate: number
}

export interface FeeRuleVO {
  ruleName?: string
  ruleType: FeeRuleType
  /** 免费时长（分钟） */
  freeMinutes?: number | null
  firstHourRate?: number | null
  additionalRate?: number | null
  /** 单日（每 24 小时）封顶 */
  dailyCap?: number | null
  timeSegments?: TimeSegmentVO[] | null
  tiers?: TierVO[] | null
}

export interface AppParkingLotDetailVO extends AppParkingLotVO {
  /** 轮播图 */
  images?: string[] | null
  /** 联系方式 */
  contact?: string | null
  /** 当前生效的计费规则，一家车场只会有一条 */
  feeRule?: FeeRuleVO | null
}

/** 车场详情（传 lng/lat 才会算距离） */
export const getParkingLotDetail = (id: string, params?: { lng?: number; lat?: number }) => {
  return http.get<AppParkingLotDetailVO, { lng?: number; lat?: number }>(`/parking/lots/${id}`, {
    params
  })
}

