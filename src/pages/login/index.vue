<script setup lang="ts">
import {ref, reactive, onUnmounted} from "vue"
import {login, sendCode} from "@/api/auth";
import {useUserStore} from "@/stores/modules/user";

// 获取屏幕边界到安全区域的距离
const {safeAreaInsets} = uni.getSystemInfoSync()

const userStore = useUserStore()

const logging = ref(false)
const agreeing = ref(false)

const form = reactive({
  phone: '',
  code: ''
})

// 验证码倒计时
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const stopCountdown = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onUnmounted(stopCountdown)

const onSendCode = async () => {
  if (countdown.value > 0) return
  try {
    await sendCode(form.phone)
    uni.showToast({title: '验证码已发送', icon: 'none'})

    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) stopCountdown()
    }, 1000)
  } catch {
    return
  }
}

const onLogin = async () => {
  if (!agreeing.value) {
    uni.showToast({title: '请先阅读并同意用户协议', icon: 'none'})
    return
  }
  if (logging.value) return
  logging.value = true
  try {
    const res = await login({phone: form.phone, code: form.code})
    userStore.setLoginInfo(res.data)
    uni.reLaunch({url: '/pages/index/index'})
  } finally {
    logging.value = false
  }
}
</script>

<template>
  <view class="login" :style="{ paddingTop: safeAreaInsets?.top + 'px' }">
    <view class="login__brand">
      <view class="login__logo">
        <t-icon name="archway" size="26" color="#ffffff"/>
      </view>
      <text class="login__title">云帆智泊</text>
      <view class="login__slogan">找车位 · 停车 · 缴费</view>
    </view>

    <view class="login__form">
      <view class="login__field">
        <view class="login__prefix">+86</view>
        <view class="login__divider"></view>
        <t-input
          v-model:value="form.phone"
          type="number"
          t-class="login__input"
          t-class-input="login__input-text"
          placeholder-class="login__placeholder"
          borderless
          placeholder="请输入手机号码"
          :maxlength="11"
        />
      </view>
      <view class="login__field">
        <t-input
          v-model:value="form.code"
          type="number"
          t-class="login__input"
          t-class-input="login__input-text"
          placeholder-class="login__placeholder"
          borderless
          placeholder="请输入 6 位验证码"
          :maxlength="6"
        />
        <view class="login__divider"></view>
        <text
          class="login__send"
          :class="{ 'login__send--counting': countdown > 0 }"
          @click="onSendCode"
        >{{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
        </text>
      </view>

      <view class="login__submit"
            :class="{ 'login__submit--disabled': logging }"
            @click="onLogin">{{ logging ? '登录中...' : '登录' }}
      </view>
      <view class="login__agree" @click="agreeing = !agreeing">
        <view class="login__agree-box" :class="{ 'login__agree-box--checked': agreeing }"></view>
        <text class="login__agree-text">已阅读并同意《用户服务协议》《隐私政策》</text>
      </view>
    </view>

    <view class="login__other">
      <view class="login__other-line"></view>
      <view class="login__other-text">其他登录方式</view>
      <view class="login__other-line"></view>
    </view>

    <view class="login__wx">
      <view class="login__wx-dot">
        <t-icon name="logo-wechat-stroke-filled" size="14" color="#ffffff"/>
      </view>
      <text class="login__wx-text">微信一键登录</text>
    </view>

    <view class="login__bottom">
      <text class="login__browse">先随便逛逛 ›</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.login {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0 64rpx;
  box-sizing: border-box;
  background-color: #fff;

  :deep(.login__input) {
    height: 92rpx;
    --td-input-bg-color: transparent;
    --td-input-vertical-padding: 0rpx;
  }
  :deep(.login__input-text) {
    font-size: 26rpx !important;
  }
  :deep(.login__placeholder) {
    font-size: 26rpx !important;
    color: #c0c4cc !important;
  }

  &__brand {
    margin-top: 204rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 0 0 auto;
  }

  &__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 116rpx;
    height: 116rpx;
    border-radius: 34rpx;
    background: linear-gradient(135deg, #409eff 0%, #79bbff 100%);
    box-shadow: 0 12rpx 32rpx rgba(64, 158, 255, 0.28);
  }

  &__title {
    margin-top: 28rpx;
    font-size: 34rpx;
    font-weight: 600;
    letter-spacing: 1rpx;
    color: #303133;
  }

  &__slogan {
    margin-top: 10rpx;
    font-size: 21rpx;
    letter-spacing: 0.6rpx;
    color: #a8abb2;
  }

  &__form {
    flex: 0 0 auto;
    margin-top: 60rpx;
  }

  &__field {
    display: flex;
    align-items: center;
    min-height: 92rpx;
    padding: 0 28rpx;
    box-sizing: border-box;
    border-radius: 24rpx;
    background-color: #f5f7fa;

    & + & {
      margin-top: 26rpx;
    }
  }

  &__prefix {
    flex: 0 0 auto;
    font-size: 25rpx;
    font-weight: 500;
    color: #303133;
  }

  &__divider {
    flex: 0 0 auto;
    width: 2rpx;
    height: 32rpx;
    margin: 0 18rpx;
    background-color: #dcdfe6;
  }

  &__send {
    flex: 0 0 auto;
    font-size: 24rpx;
    font-weight: 500;
    color: #409eff;

    &--counting {
      color: #c0c4cc;
    }
  }

  &__submit {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 92rpx;
    margin-top: 40rpx;
    border-radius: 46rpx;
    font-size: 27rpx;
    font-weight: 500;
    color: #ffffff;
    background: linear-gradient(135deg, #409eff 0%, #5ba8ff 100%);
    box-shadow: 0 12rpx 28rpx rgba(64, 158, 255, 0.25);

    &--disabled {
      opacity: 0.5;
      box-shadow: none;
    }
  }

  &__agree {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 28rpx;
  }

  &__agree-box {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32rpx;
    height: 32rpx;
    margin-right: 10rpx;
    box-sizing: border-box;
    border: 2rpx solid #c0c4cc;
    border-radius: 6rpx;

    &--checked {
      border-color: #409eff;
      background-color: #409eff;

      &::after {
        content: '';
        width: 8rpx;
        height: 11rpx;
        margin-top: -3rpx;
        border: 2rpx solid #ffffff;
        border-top: 0;
        border-left: 0;
        transform: rotate(45deg);
      }
    }
  }

  &__agree-text {
    font-size: 22rpx;
    color: #a8abb2;
  }

  &__agree-link {
    color: #409eff;
  }

  &__other {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    margin-top: 52rpx;
  }

  &__other-line {
    flex: 1 1 auto;
    height: 2rpx;
    background-color: #ebeef5;
  }

  &__other-text {
    flex: 0 0 auto;
    margin: 0 18rpx;
    font-size: 19rpx;
    color: #c0c4cc;
  }

  &__wx {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    height: 88rpx;
    margin-top: 28rpx;
    border: 2rpx dashed #b3d8ff;
    border-radius: 44rpx;
    background-color: #f2f8ff;
  }

  &__wx-dot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42rpx;
    height: 42rpx;
    margin-right: 14rpx;
    border-radius: 50%;
    background-color: #07c160;
  }

  &__wx-text {
    font-size: 25rpx;
    font-weight: 500;
    color: #07c160;
  }

  &__bottom {
    display: flex;
    justify-content: center;
    flex: 0 0 auto;
    margin-top: auto;
    padding: 40rpx 0 60rpx;
  }

  &__browse {
    font-size: 24rpx;
    color: #409eff;
  }
}
</style>