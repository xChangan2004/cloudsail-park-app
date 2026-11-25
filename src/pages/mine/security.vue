<script setup lang="ts">
import {computed, ref} from 'vue'
import {onShow} from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import {useUserStore} from '@/stores'
import {maskPhone} from "@/utils/format";
import {bindWx, unbindWx} from "@/api/auth";
import {type AppDeletionVO, getDeletionStatus} from '@/api/customer'

const userStore = useUserStore()

/** 微信绑定 / 解绑进行中，防重复点 */
const wxBusy = ref(false)

/** 最近一次接口返回的注销状态（冷静期剩余天数在后端算） */
const deletion = ref<AppDeletionVO | null>(null)

/** 生效日期文案 */
const effectiveText = computed(() => {
  const t = userStore.deletionEffectiveTime
  if (!t) return ''
  return dayjs(String(t).replace(/-/g, '/')).format('YYYY年M月D日')
})

/** 剩余天数：优先用后端返回值，兜底本地按生效时间算 */
const remainDays = computed(() => {
  if (deletion.value?.pending) return deletion.value.remainDays ?? 0
  const t = userStore.deletionEffectiveTime
  if (!t) return 0
  const ms = dayjs(String(t).replace(/-/g, '/')).valueOf() - Date.now()
  return Math.max(0, Math.ceil(ms / 86400000))
})

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

/** 同步注销状态（多端操作后回到本页也能对上） */
const syncDeletion = async () => {
  if (!userStore.isLogin) return
  try {
    const {data} = await getDeletionStatus()
    deletion.value = data ?? null
    userStore.setDeletion(!!data?.pending, data?.effectiveTime ?? '')
  } catch {
    // 查询失败不阻塞页面，登录态里已经带了最近一次状态
  }
}

/** 注销与撤销都进注销页，这里只负责入口和状态展示 */
const goDeletion = () => {
  uni.navigateTo({url: '/pages/mine/deletion'})
}

onShow(() => {
  syncDeletion()
})
</script>

<template>
  <view class="sc">
    <t-navbar title="账号与安全" left-arrow placeholder/>

    <!-- 冷静期提示条 -->
    <view v-if="userStore.deletionPending" class="pend">
      <view class="pend__main">
        <text class="pend__t">账号注销中</text>
        <text class="pend__d">将于 {{ effectiveText }} 自动删除，还剩 {{ remainDays }} 天</text>
      </view>
      <text class="pend__btn" @tap="goDeletion">查看</text>
    </view>

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
      <view class="sc__item" @click="goDeletion">
        <view class="sc__main">
          <text class="sc__label sc__label--danger">注销账号</text>
          <text class="sc__desc">提交后 30 天内可随时撤销，到期后数据不可恢复</text>
        </view>
        <view class="sc__value">
          <t-icon name="chevron-right" size="32rpx" color="#c0c4cc"/>
        </view>
      </view>
    </view>

    <view class="sc__foot">注销后用同一手机号 / 微信可重新注册，历史数据不会继承</view>
  </view>
</template>

<style scoped lang="scss">
.sc {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f6f8;

  &__foot {
    margin: 24rpx 40rpx 60rpx;
    font-size: 21rpx;
    line-height: 1.6;
    text-align: center;
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

/* 冷静期提示条 */
.pend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20rpx 32rpx 0;
  padding: 24rpx 28rpx;
  border: 1rpx solid #fde2e2;
  border-radius: 28rpx;
  background: #fef0f0;

  &__main {
    flex: 1 1 auto;
    min-width: 0;
    margin-right: 20rpx;
  }

  &__t {
    display: block;
    font-size: 26rpx;
    font-weight: 600;
    color: #e34d59;
  }

  &__d {
    display: block;
    margin-top: 6rpx;
    font-size: 21rpx;
    line-height: 1.5;
    color: #c45656;
  }

  &__btn {
    flex: 0 0 auto;
    height: 56rpx;
    padding: 0 28rpx;
    border-radius: 28rpx;
    font-size: 23rpx;
    line-height: 56rpx;
    color: #fff;
    background: #e34d59;
  }
}
</style>