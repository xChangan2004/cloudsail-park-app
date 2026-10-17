import http from '@/utils/request'

export type EntryExitStatus = 1 | 2

export interface AppRecordDetailVO {
  id: string
  lotId: string
  lotName: string
  lotLng: number
  lotLat: number
  lotAddress: string
  plateNumber: string
  entryTime: string
  /** 出场时间，进行中为 null */
  exitTime: string | null
  /** 抓拍图 URL */
  entryImage: string | null
  exitImage: string | null
  status: EntryExitStatus
  /** 已停时长（秒） */
  seconds: string
  /** 费用预估（元 */
  estimatedFee: number | null
}

/** 我的停车记录详情 */
export const getMyRecordDetail = (id: string) => {
  return http.get<AppRecordDetailVO>(`/record/${id}`)
}