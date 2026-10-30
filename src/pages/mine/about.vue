<script setup lang="ts">
import {ref} from 'vue'
import {formatSize} from "@/utils/format";
import {onLoad} from "@dcloudio/uni-app";
import {useSearchHistoryStore} from "@/stores";


/** 本地缓存占用大小 */
const cacheSize = ref('0 KB')

const readCacheSize = () => {
  try {
    const {currentSize} = uni.getStorageInfoSync()
    cacheSize.value = formatSize(currentSize)
  } catch {
    cacheSize.value = '0 KB'
  }
}

onLoad(() => {
  readCacheSize()
})

const onCheckUpdate = () => {
  uni.showToast({title: '当前已是最新版本', icon: 'none'})
}

const onClearCache = () => {
  uni.showModal({
    title: '清除缓存',
    content: '将清理搜索历史等本地记录，不影响登录状态',
    confirmColor: '#2b7cd3',
    success: (res) => {
      if (!res.confirm) return
      try {
        useSearchHistoryStore().clear()
      } catch {
        // store 尚未初始化，忽略
      }
      readCacheSize()
      uni.showToast({title: '已清除', icon: 'none'})
    }
  })
}

const openDoc = (type: 'user' | 'privacy') => {
  const name = type === 'user' ? '用户协议' : '隐私政策'
  uni.showToast({title: `${name}内容整理中`, icon: 'none'})
}
</script>

<template>
  <view class="about">
    <t-navbar title="关于云帆智泊" left-arrow placeholder/>

    <view class="about__brand">
      <view class="about__logo">
        <!-- TODO: 后续补全Logo -->
      </view>
      <text class="about__name">云帆智泊</text>
      <text class="about__ver">Version 1.0.0</text>
    </view>

    <view class="about__list">
      <view class="about__item" @click="onCheckUpdate">
        <view class="about__item-tx">检查更新</view>
        <view class="about__item-v">
          <text class="about__item-vt">已是最新</text>
          <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
        </view>
      </view>
      <view class="about__item" @click="openDoc('user')">
        <view class="about__item-tx">用户协议</view>
        <view class="about__item-v">
          <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
        </view>
      </view>
      <view class="about__item" @click="openDoc('privacy')">
        <view class="about__item-tx">隐私政策</view>
        <view class="about__item-v">
          <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
        </view>
      </view>
    </view>

    <view class="about__list">
      <view class="about__item" @click="onClearCache">
        <text class="about__item-tx">清除缓存</text>
        <view class="about__item-v">
          <text class="about__item-vt">{{ cacheSize }}</text>
          <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
        </view>
      </view>
    </view>

    <view class="about__foot">
      <text class="about__foot-l">让每一次停车都更省心</text>
      <text class="about__foot-l">© 2026 云帆科技</text>
      <text class="about__foot-l">粤ICP备 2026000000 号</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.about {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f6f8;

  &__brand {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60rpx 0 48rpx;
  }

  &__logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 128rpx;
    height: 128rpx;
    border-radius: 34rpx;
    background: linear-gradient(135deg, #2b7cd3, #5aa9f0);
  }

  &__name {
    margin-top: 22rpx;
    font-size: 30rpx;
    font-weight: 600;
    letter-spacing: 1rpx;
    color: #1f2d3d;
  }

  &__ver {
    margin-top: 8rpx;
    font-size: 21rpx;
    color: #a8abb2;
  }

  &__list {
    flex: 0 0 auto;
    margin: 20rpx 32rpx 0;
    padding: 0 28rpx;
    border-radius: 28rpx;
    background: #fff;
    box-shadow: 0 1rpx 6rpx rgba(48, 49, 51, 0.05);
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 26rpx 0;

    & + & {
      border-top: 1rpx solid #ebeef5;
    }
  }

  &__item-tx {
    font-size: 25rpx;
    color: #1f2d3d;
  }

  &__item-v {
    display: flex;
    align-items: center;
  }

  &__item-vt {
    margin-right: 8rpx;
    font-size: 21rpx;
    color: #909399;
  }

  &__foot {
    flex: 0 0 auto;
    margin-top: auto;
    padding: 60rpx 48rpx calc(44rpx + env(safe-area-inset-bottom));
    text-align: center;
  }

  &__foot-l {
    display: block;
    font-size: 20rpx;
    line-height: 1.9;
    color: #c0c4cc;
  }
}
</style>