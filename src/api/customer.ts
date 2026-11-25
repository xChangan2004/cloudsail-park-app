import http, {uploadFile} from '@/utils/request'

export interface AppCustomerUpdateDTO {
  nickname?: string
  avatar?: string
}

export interface FileVO {
  id: string
  url: string
  name: string
  size: number
  contentType: string
}

/** 修改用户信息 */
export const updateMyInfo = (data: AppCustomerUpdateDTO) => {
  return http.put('/customer/me', data)
}

/** 上传头像到 OSS，返回URL地址 */
export const uploadAvatar = async (filePath: string) => {
  const vo = await uploadFile<FileVO>('/file/upload', filePath)
  return vo.url
}

export interface AppDeletionVO {
  /** 是否处于注销冷静期 */
  pending: boolean
  /** 申请时间 */
  applyTime?: string
  /** 注销理由：1-不再使用 2-隐私顾虑 3-换用其他产品 4-体验不佳 5-其他 */
  reason?: number
  /** 理由补充 */
  remark?: string
  /** 生效时间（冷静期结束） */
  effectiveTime?: string
  /** 距生效剩余天数 */
  remainDays?: number
}

export interface AppDeletionApplyDTO {
  /** 注销理由，必选 */
  reason: number
  /** 选「其他」时填 */
  remark?: string
}

/** 查询注销状态 */
export const getDeletionStatus = () => {
  return http.get<AppDeletionVO>('/customer/deletion')
}

/** 申请注销（进入 30 天冷静期） */
export const applyDeletion = (data: AppDeletionApplyDTO) => {
  return http.post<AppDeletionVO>('/customer/deletion', data)
}

/** 撤销注销申请 */
export const cancelDeletion = () => {
  return http.post<AppDeletionVO>('/customer/deletion/cancel')
}