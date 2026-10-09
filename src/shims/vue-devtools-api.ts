// pinia 3.x 只从这里取 setupDevtoolsPlugin，且仅服务 Vue Devtools 面板。
// uni 强制 preserveSymlinks:true + pnpm 严格隔离 ⇒ H5/APP dev 解析不到该包，这里给个空实现让模块图建得起来。
export function setupDevtoolsPlugin(): void {}

export default { setupDevtoolsPlugin };
