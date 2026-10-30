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