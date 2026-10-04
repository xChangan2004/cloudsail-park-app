<script setup lang="ts">
import {computed} from 'vue'
import {useNavbarSafe} from "@/hooks/useNavbarSafe";
import {onShow} from "@dcloudio/uni-app";
import {useUserStore} from '@/stores'

const userStore = useUserStore()

/** 头部安全区：hero 背景铺满顶部，内容从胶囊底部 + 20px 开始 */
const {heroPaddingTop} = useNavbarSafe()

/** 未登录直接踢去登录页 */
let redirecting = false
onShow(() => {
  if (userStore.isLogin || redirecting) return
  redirecting = true
  uni.navigateTo({
    url: '/pages/login/index',
    complete: () => {
      setTimeout(() => {
        redirecting = false
      }, 600)
    }
  })
})

/** 手机号脱敏 */
const maskPhone = (phone: string) => phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
</script>

<template>
  <view class="mine">
    <view class="mine__hero" :style="{ paddingTop: heroPaddingTop }">
      <view class="mine__profile">
        <t-avatar
          t-class="mine__avatar"
          :image="userStore.avatar"
          shape="circle"
          size="109rpx"
          :icon="{ name: 'user', size: '56rpx' }"
        />
        <view class="mine__info">
          <text class="mine__name">{{ userStore.nickname || '未设置昵称' }}</text>
          <text class="mine__phone">{{ maskPhone(userStore.phone || '') }}</text>
        </view>
      </view>
    </view>

    <view class="mine__body">
      <view class="mine__card mine__menu">
        <view class="mine__item">
          <view class="mine__item-left">
            <t-icon name="vehicle" size="40rpx" color="#409eff"/>
            <text class="mine__item-label">我的车辆</text>
          </view>
          <view class="mine__item-right">
            <text class="mine__item-value">2 辆</text>
            <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
          </view>
        </view>
        <view class="mine__hr"/>
        <view class="mine__item">
          <view class="mine__item-left">
            <t-icon name="creditcard" size="40rpx" color="#409eff"/>
            <text class="mine__item-label">我的月卡</text>
          </view>
          <view class="mine__item-right">
            <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
          </view>
        </view>
        <view class="mine__hr"/>
        <view class="mine__item">
          <view class="mine__item-left">
            <t-icon name="coupon" size="40rpx" color="#409eff"/>
            <text class="mine__item-label">优惠券</text>
          </view>
          <view class="mine__item-right">
            <text class="mine__item-value">4张可用</text>
            <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
          </view>
        </view>
      </view>

      <view class="mine__card mine__menu">
        <view class="mine__item">
          <view class="mine__item-left">
            <t-icon name="star-1" size="40rpx" color="#409eff"/>
            <text class="mine__item-label">常用停车场</text>
          </view>
          <view class="mine__item-right">
            <text class="mine__item-value">3个</text>
            <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
          </view>
        </view>
        <view class="mine__hr"/>
        <view class="mine__item">
          <view class="mine__item-left">
            <t-icon name="bill" size="40rpx" color="#409eff"/>
            <text class="mine__item-label">发票管理</text>
          </view>
          <view class="mine__item-right">
            <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
          </view>
        </view>
        <view class="mine__hr"/>
        <view class="mine__item">
          <view class="mine__item-left">
            <t-icon name="system-messages" size="40rpx" color="#409eff"/>
            <text class="mine__item-label">消息通知</text>
          </view>
          <view class="mine__item-right">
            <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
          </view>
        </view>
      </view>

      <view class="mine__card mine__menu">
        <view class="mine__item">
          <view class="mine__item-left">
            <t-icon name="service" size="40rpx" color="#409eff"/>
            <text class="mine__item-label">客服与帮助</text>
          </view>
          <view class="mine__item-right">
            <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
          </view>
        </view>
        <view class="mine__hr"/>
        <view class="mine__item">
          <view class="mine__item-left">
            <t-icon name="secured" size="40rpx" color="#409eff"/>
            <text class="mine__item-label">隐私与设置</text>
          </view>
          <view class="mine__item-right">
            <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.mine {
  min-height: 100vh;
  background: #f5f6f8;
}

.mine__hero {
  padding-left: 36rpx;
  padding-bottom: 44rpx;
  background: linear-gradient(180deg, #409eff, #5ba8ff);
}

.mine__profile {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

:deep(.mine__avatar) {
  --td-avatar-bg-color: rgba(255, 255, 255, 0.25);
  --td-avatar-content-color: #ffffff;
}

.mine__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5rpx;
}

.mine__name {
  font-size: 34rpx;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mine__phone {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
}

.mine__body {
  padding: 0 30rpx 30rpx;
}

.mine__card {
  background: #fff;
  border-radius: 25rpx;
  padding: 25rpx 30rpx;
  box-shadow: 0 1px 3px rgba(48, 49, 51, 0.04);
}

.mine__menu {
  margin-top: 22rpx;
}

.mine__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 12rpx 0;
}

.mine__item-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
  min-width: 0;
}

.mine__item-label {
  font-size: 30rpx;
  color: #303133;
}

.mine__item-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex: 0 0 auto;
}

.mine__item-value {
  font-size: 27rpx;
  color: #909399;
}

.mine__hr {
  height: 1px;
  background: #ebeef5;
  margin: 20rpx -30rpx;
}
</style>