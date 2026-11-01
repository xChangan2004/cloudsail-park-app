<script setup lang="ts">
import {computed, ref} from 'vue'
import {useUserStore} from '@/stores'
import {maskPhone} from "@/utils/format";
import {bindWx, unbindWx} from "@/api/auth";

const userStore = useUserStore()

/** 微信绑定 / 解绑进行中，防重复点 */
const wxBusy = ref(false)

const hasPhone = computed(() => !!userStore.phone)

const onPhone = () => {
  if (hasPhone.value) {
    uni.showToast({title: '如需更换手机号请联系客服', icon: 'none'})
    return
  }
  uni.navigateTo({url: '/pages/login/bind-phone'})
}

/** 绑定微信 */
const onBindWx = () => {
  if (wxBusy.value) return
  wxBusy.value = true
  uni.login({
    provider: 'weixin',
    success: async ({code}) => {
      if (!code) {
        wxBusy.value = false
        return
      }
      try {
        await bindWx({code})
        userStore.bindWx = true
        uni.showToast({
          title: '绑定成功',
          icon: 'success'
        })
      } catch {
        // 不做处理
      } finally {
        wxBusy.value = false
      }
    },
    fail: () => {
      wxBusy.value = false
      uni.showToast({title: '微信授权失败', icon: 'none'})
    }
  })
}

/** 解绑微信 */
const onUnbindWx = () => {
  if (wxBusy.value) return
  uni.showModal({
    title: '解绑微信',
    content: '解绑后无法使用微信一键登录，可用手机验证码登录',
    confirmText: '解绑',
    confirmColor: '#f56c6c',
    success: async (res) => {
      if (!res.confirm) return
      wxBusy.value = true
      try {
        await unbindWx()
        userStore.bindWx = false
        uni.showToast({title: '已解绑', icon: 'none'})
      } catch {
        // 不做处理
      } finally {
        wxBusy.value = false
      }
    }
  })
}

/** 注销账号 */
const onDeleteAccount = () => {
  uni.showToast({title: '注销功能开发中，如需注销请联系客服', icon: 'none'})
}
</script>

<template>
  <view class="sc">
    <t-navbar title="账号与安全" left-arrow placeholder/>

    <view class="sc__list">
      <view class="sc__item" @click="onPhone">
        <view class="sc__main">
          <text class="sc__label">手机号</text>
          <text class="sc__desc">用于登录、接收停车凭证与开票通知</text>
        </view>
        <view class="sc__value">
          <text class="sc__vt" :class="{'sc__vt--off': !hasPhone}">
            {{ hasPhone ? maskPhone(userStore.phone) : '未绑定' }}
          </text>
          <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
        </view>
      </view>
      <view class="sc__item" @click="userStore.bindWx ? onUnbindWx() : onBindWx()">
        <view class="sc__main">
          <text class="sc__label">微信</text>
          <text class="sc__desc">绑定后可用微信一键登录</text>
        </view>
        <view class="sc__value">
          <text v-if="userStore.bindWx" class="sc__act sc__act--danger">解绑</text>
          <text v-else class="sc__act">去绑定</text>
        </view>
      </view>
    </view>

    <view class="sc__list">
      <view class="sc__item" @click="onDeleteAccount">
        <view class="sc__main">
          <text class="sc__label sc__label--danger">注销账号</text>
          <text class="sc__desc">注销后所有数据不可恢复</text>
        </view>
        <view class="sc__value">
          <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.sc {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f6f8;

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

  &__main {
    flex: 1 1 auto;
    min-width: 0;
    margin-right: 16rpx;
  }

  &__label {
    display: block;
    font-size: 26rpx;
    line-height: 1.35;
    color: #1f2d3d;

    &--danger {
      color: #f56c6c;
    }
  }

  &__desc {
    display: block;
    margin-top: 4rpx;
    font-size: 21rpx;
    line-height: 1.5;
    color: #a8abb2;
  }

  &__value {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  &__vt {
    margin-right: 8rpx;
    font-size: 25rpx;
    color: #909399;

    &--off {
      color: #c0c4cc;
    }
  }

  &__act {
    padding: 6rpx 18rpx;
    border-radius: 20rpx;
    font-size: 22rpx;
    color: #2b7cd3;
    background: #ecf5ff;

    &--danger {
      color: #f56c6c;
      background: #fef0f0;
    }
  }
}
</style>