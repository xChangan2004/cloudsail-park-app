import http from '@/utils/request'

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