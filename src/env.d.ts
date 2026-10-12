/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'true' 时 App 端支付宝切沙箱环境；只在 .env.development 配，云打包不配 ⇒ 走正式环境 */
  readonly VITE_ALIPAY_SANDBOX?: string
  /** 高德 Web 服务 key，用于逆地理编码 */
  readonly VITE_AMAP_KEY?: string
}

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}
