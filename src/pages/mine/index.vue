<script setup lang="ts">
import {computed} from "vue";
import {useNavbarSafe} from '@/hooks/useNavbarSafe'
import {useBadgeStore, useUserStore} from "@/stores";
import {logout} from "@/api/auth";
import {maskPhone} from "@/utils/format";

const {heroPaddingTop} = useNavbarSafe()
const userStore = useUserStore()

const LEVEL = {lv: 3, name: '老司机', exp: 1240, nextExp: 2000}

/** 还差多少经验升级 */
const remainExp = computed(() => Math.max(0, LEVEL.nextExp - LEVEL.exp))

/** 经验环进度 */
const percent = computed(() => {
  if (!LEVEL.nextExp) return 0
  return Math.min(100, Math.round((LEVEL.exp / LEVEL.nextExp) * 100))
})

const ringStyle = computed(() => {
  // 未登录不给进度环，纯灰底
  if (!userStore.isLogin) return {background: '#f0f2f5'}
  const p = percent.value
  return {background: `conic-gradient(#409eff 0 ${p}%, #eef1f5 ${p}% 100%)`}
})

const subText = computed(() => {
  if (!userStore.isLogin) return '登录后查看停车记录与券包'
  return userStore.phone ? maskPhone(userStore.phone) : '未绑定手机号'
})

const statText = (n: number) => (userStore.isLogin ? String(n) : '—')

const statClass = (n: number) => ({
  'mine__stat-n--gray': !userStore.isLogin,
  'mine__stat-n--zero': userStore.isLogin && n === 0
})

const goLogin = () => uni.navigateTo({url: '/pages/login/index'})

const goStat = (key: 'plate' | 'coupon') => {
  if (!userStore.isLogin) return goLogin()
  uni.navigateTo({
    url: key === 'plate' ? `/pages/plate/index` : '/pages/coupon/mine'
  })
}

const goMenu = (key: 'profile' | 'security' | 'invoice' | 'about' | 'support') => {
  // 除关于以外都要登录
  if (key !== 'about' && !userStore.isLogin) return goLogin()
  if (key === 'support') {
    uni.showToast({title: '正在开发中...'})
    return
  }
  const route = {
    profile: '/pages/mine/profile',
    security: '/pages/mine/security',
    invoice: '/pages/order/invoice',
    about: '/pages/mine/about',
  }[key]
  uni.navigateTo({url: route})
}

const onLogout = () => {
  uni.showModal({
    title: '退出登录',
    content: '退出后需要重新登录才能查看停车记录与券包',
    confirmText: '退出',
    confirmColor: '#f56c6c',
    success: async ({confirm}) => {
      if (!confirm) return
      try {
        await logout()
      } catch {
        // 注销失败也要清本地，否则用户会卡在退不出去的状态
      }
      userStore.resetLoginState()
      useBadgeStore().clear()
    }
  })
}
</script>

<template>
  <view class="mine">
    <view class="mine__id" :style="{ paddingTop: heroPaddingTop }">
      <view class="mine__id-top">
        <view class="mine__ring" :style="ringStyle">
          <view class="mine__ring-hole">
            <image
              v-if="userStore.isLogin && userStore.avatar"
              class="mine__avatar"
              :src="userStore.avatar"
              mode="aspectFill"
            />
            <view v-else class="mine__ring-core" :class="{ 'mine__ring-core--guest': !userStore.isLogin }">
              <t-icon name="user" size="44rpx" :color="userStore.isLogin ? '#2b7cd3' : '#c0c4cc'"/>
            </view>
          </view>
        </view>

        <view class="mine__id-main">
          <text class="mine__name" :class="{ 'mine__name--guest': !userStore.isLogin }">
            {{ userStore.isLogin ? (userStore.nickname || '未设置昵称') : '未登录' }}
          </text>
          <text class="mine__sub">{{ subText }}</text>
        </view>

        <view v-if="userStore.isLogin" class="mine__gear" @click="goMenu('profile')">
          <t-icon name="setting" size="36rpx" color="#a8abb2"/>
        </view>
        <view v-else class="mine__login" @click="goLogin">登录</view>
      </view>

      <!-- 等级 -->
      <view v-if="userStore.isLogin" class="mine__lv">
        <view class="mine__lv-l">
          <text class="mine__lv-tag">LV.{{ LEVEL.lv }}</text>
          <text class="mine__lv-name">{{ LEVEL.name }}</text>
        </view>
        <view class="mine__lv-tip">还差 {{ remainExp }} 升级</view>
      </view>
    </view>

    <view class="mine__stat">
      <view class="mine__stat-c" @click="goStat('plate')">
        <view class="mine__stat-n" :class="statClass(1)">{{ statText(1) }}</view>
        <view class="mine__stat-l">我的车牌</view>
      </view>
      <view class="mine__stat-c" @click="goStat('coupon')">
        <view class="mine__stat-n" :class="statClass(2)">{{ statText(2) }}</view>
        <view class="mine__stat-l">可用券</view>
      </view>
      <view class="mine__stat-c">
        <view class="mine__stat-n" :class="statClass(3)">{{ statText(3) }}</view>
        <view class="mine__stat-l">本月停车</view>
      </view>
    </view>

    <view class="mine__list">
      <view class="mine__item" @click="goMenu('security')">
        <view class="mine__item-l">
          <view class="mine__ib">
            <t-icon name="secured" size="32rpx" color="#2b7cd3"/>
          </view>
          <text class="mine__item-tx">账号与安全</text>
        </view>
        <view class="mine__item-v">
          <text v-if="!userStore.isLogin" class="mine__item-vt">未登录</text>
          <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
        </view>
      </view>
      <view class="mine__item" @click="goMenu('invoice')">
        <view class="mine__item-l">
          <view class="mine__ib">
            <t-icon name="bill" size="32rpx" color="#909399"/>
          </view>
          <text class="mine__item-tx">发票管理</text>
        </view>
        <view class="mine__item-v">
          <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
        </view>
      </view>
    </view>

    <view class="mine__list">
      <view class="mine__item" @click="goMenu('support')">
        <view class="mine__item-l">
          <view class="mine__ib">
            <t-icon name="system-sum" size="32rpx" color="#57962f"/>
          </view>
          <text class="mine__item-tx">客服与帮助</text>
        </view>
        <view class="mine__item-v">
          <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
        </view>
      </view>
      <view class="mine__item" @click="goMenu('about')">
        <view class="mine__item-l">
          <view class="mine__ib">
            <t-icon name="info-circle" size="32rpx" color="#909399"/>
          </view>
          <text class="mine__item-tx">关于云帆智泊</text>
        </view>
        <view class="mine__item-v">
          <text class="mine__item-vt">v1.0.0</text>
          <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
        </view>
      </view>
    </view>

    <view v-if="userStore.isLogin" class="mine__out" @click="onLogout">退出登录</view>
  </view>
</template>

<style scoped lang="scss">
.mine {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f6f8;

  &__id {
    flex: 0 0 auto;
    padding: 0 32rpx 28rpx;
    background: #fff;
  }

  &__id-top {
    display: flex;
    align-items: center;
  }

  &__ring {
    flex: 0 0 auto;
    position: relative;
    width: 106rpx;
    height: 106rpx;
    border-radius: 50%;
  }

  &__ring-hole {
    position: absolute;
    inset: 6rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #fff;
    overflow: hidden;
  }

  &__avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }

  &__ring-core {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #ecf5ff;

    &--guest {
      background: #f4f4f5;
    }
  }

  &__id-main {
    flex: 1 1 auto;
    min-width: 0;
    margin-left: 22rpx;
  }

  &__name {
    display: block;
    font-size: 31rpx;
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: 0.4rpx;
    color: #1f2d3d;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &--guest {
      font-weight: 500;
      color: #606266;
    }
  }

  &__sub {
    display: block;
    margin-top: 6rpx;
    font-size: 22rpx;
    color: #909399;
  }

  &__gear {
    flex: 0 0 auto;
    padding: 8rpx;
  }

  &__login {
    flex: 0 0 auto;
    height: 52rpx;
    padding: 0 26rpx;
    border-radius: 26rpx;
    font-size: 22rpx;
    line-height: 52rpx;
    color: #fff;
    background: #409eff;
  }

  &__lv {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-top: 22rpx;
  }

  &__lv-l {
    display: flex;
    align-items: baseline;
  }

  &__lv-tag {
    font-size: 24rpx;
    font-weight: 700;
    letter-spacing: 0.8rpx;
    color: #2b7cd3;
  }

  &__lv-name {
    margin-left: 12rpx;
    font-size: 23rpx;
    font-weight: 500;
    color: #606266;
  }

  &__lv-tip {
    font-size: 21rpx;
    color: #a8abb2;
  }

  &__stat {
    flex: 0 0 auto;
    display: flex;
    margin: 20rpx 32rpx 0;
    padding: 30rpx 0;
    border-radius: 28rpx;
    background: #fff;
    box-shadow: 0 1rpx 6rpx rgba(48, 49, 51, 0.05);
  }

  &__stat-c {
    position: relative;
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    align-items: center;

    & + &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      width: 1rpx;
      height: 52rpx;
      transform: translateY(-50%);
      background: #eef1f5;
    }
  }

  &__stat-n {
    font-size: 46rpx;
    font-weight: 600;
    line-height: 1.1;
    color: #409eff;

    &--gray {
      color: #d8dce3;
    }

    &--zero {
      color: #c8ccd4;
    }
  }

  &__stat-l {
    margin-top: 10rpx;
    font-size: 21rpx;
    color: #909399;
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
    padding: 22rpx 0;

    & + & {
      border-top: 1rpx solid #ebeef5;
    }
  }

  &__item-l {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  &__ib {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56rpx;
    height: 56rpx;
    margin-right: 22rpx;
    border-radius: 18rpx;
  }

  &__item-tx {
    font-size: 25rpx;
    color: #1f2d3d;
  }

  &__item-v {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  &__item-vt {
    margin-right: 8rpx;
    font-size: 21rpx;
    color: #909399;
  }

  &__out {
    flex: 0 0 auto;
    margin-top: auto;
    padding: 48rpx 0 40rpx;
    text-align: center;
    font-size: 23rpx;
    color: #909399;
  }
}
</style>