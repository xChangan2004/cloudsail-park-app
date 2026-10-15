/** 胶囊下方的呼吸位(px)，按视觉微调即可 */
const GAP = 20

/** 非小程序端状态栏下方的呼吸位(px)：没有胶囊要避，只留视觉间距 */
const GAP_APP = 12

/** 拿不到胶囊时的兜底导航栏高度(px)，微信标准是 44 */
const FALLBACK_NAV_BAR = 44

interface NavbarSafe {
  /** 状态栏高度(px) */
  statusBarHeight: number
  /** 从屏幕顶到导航区域底部的距离(px)，即胶囊底部 */
  navBarBottom: number
}

/**
 * 同一会话内状态栏 / 胶囊位置不会变，模块级缓存一次就够。
 * 否则每个页面 onLoad 都要走一次同步桥调用（小程序端是实打实的同步通信开销）。
 */
let cached: NavbarSafe | null = null

const measure = (): NavbarSafe => {
  if (cached) return cached

  let statusBarHeight = 0
  try {
    // getSystemInfoSync 已被官方标记废弃，优先 getWindowInfo，旧基础库回退
    const win: any = (uni as any).getWindowInfo?.() ?? uni.getSystemInfoSync()
    statusBarHeight = win?.statusBarHeight || 0
  } catch {
    // 取不到就按 0 处理，后面会走兜底
  }

  let navBarBottom = 0

  // #ifdef MP-WEIXIN
  try {
    const menuRect = (uni as any).getMenuButtonBoundingClientRect?.()
    // width 为 0 说明拿到的不是有效胶囊（尚未渲染完 / 被隐藏）
    if (menuRect?.width) navBarBottom = menuRect.bottom
  } catch {
    // 忽略，走兜底
  }
  // #endif

  cached = {
    statusBarHeight,
    navBarBottom: navBarBottom || statusBarHeight + FALLBACK_NAV_BAR,
  }
  return cached
}

export const useNavbarSafe = () => {
  const {statusBarHeight, navBarBottom} = measure()

  let heroPaddingTop = ''
  // #ifdef MP-WEIXIN
  heroPaddingTop = `${navBarBottom + GAP}px`
  // #endif
  // #ifndef MP-WEIXIN
  heroPaddingTop = `calc(var(--status-bar-height) + ${GAP_APP}px)`
  // #endif

  return {
    statusBarHeight,
    navBarBottom,
    heroPaddingTop,
  }
}