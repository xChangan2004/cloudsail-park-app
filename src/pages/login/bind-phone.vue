<script setup lang="ts">
import {useNavbarSafe} from "@/hooks/useNavbarSafe";
import {useUserStore} from "@/stores";
import {ref, reactive, onUnmounted, computed, watch} from "vue";
import {bindPhone, bindPhoneByWxCode, sendCode} from "@/api/auth";

const {heroPaddingTop} = useNavbarSafe()
const userStore = useUserStore()

/** 11 位，1 开头，第二位 3-9 */
const PHONE_RE = /^1[3-9]\d{9}$/

const form = reactive({
  phone: '',
  code: ''
})

/** 短信绑定提交中 */
const submitting = ref(false)
/** 微信授权绑定中 */
const wxBinding = ref(false)
/** 错误信息 */
const errMsg = ref('')

const canSubmit = computed(
  () => PHONE_RE.test(form.phone)
    && /^\d{6}$/.test(form.code)
    && !submitting.value
    && !wxBinding.value
)

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

// 一改手机号就把「已被占用」的提示收掉
watch(() => form.phone, () => {
  errMsg.value = ''
})

/** 绑定成功统一收尾 */
const onBound = (phone: string) => {
  if (phone) userStore.phone = phone
  uni.showToast({title: '绑定成功', icon: 'success'})
  setTimeout(() => {
    if (getCurrentPages().length > 1) uni.navigateBack()
    else uni.reLaunch({url: '/pages/index/index'})
  }, 600)
}

const onBindError = (e: unknown) => {
  const msg = (e as Error)?.message || ''
  if (msg.includes('已被其他账号绑定') || msg.includes('已被其他账号')) {
    errMsg.value = msg
    uni.hideToast()
  }
}

/** 错误提示切分处理，「标题。正文」 */
const errParts = computed(() => {
  const i = errMsg.value.indexOf('。')
  if (i < 0) return {title: errMsg.value, desc: ''}
  return {title: errMsg.value.slice(0, i), desc: errMsg.value.slice(i + 1)}
})

const onSendCode = async () => {
  if (countdown.value > 0) return
  if (!PHONE_RE.test(form.phone)) {
    uni.showToast({title: '请输入正确的手机号', icon: 'none'})
    return
  }
  try {
    await sendCode(form.phone)
    uni.showToast({title: '验证码已发送', icon: 'none'})
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) stopCountdown()
    }, 1000)
  } catch {
    // 拦截器已提示
  }
}

const onSubmit = async () => {
  if (!canSubmit.value) return
  submitting.value = true
  errMsg.value = ''
  try {
    await bindPhone({phone: form.phone, code: form.code})
    onBound(form.phone)
  } catch (e) {
    onBindError(e)
    // 验证码一次性，失败后清掉让用户重填
    form.code = ''
  } finally {
    submitting.value = false
  }
}

/** 微信手机号快速验证回调 */
const onGetPhoneNumber = async (e: any) => {
  const detail = e?.detail ?? {}
  const wxCode: string | undefined = detail.code
  // 用户点了拒绝，或基础库只回了加密数据没给 code
  if (!wxCode) {
    if (String(detail.errMsg || '').includes('deny')) {
      uni.showToast({title: '已取消微信授权', icon: 'none'})
    }
    return
  }
  if (wxBinding.value) return
  wxBinding.value = true
  errMsg.value = ''
  try {
    const {data} = await bindPhoneByWxCode({wxCode})
    onBound(data)
  } catch (e) {
    onBindError(e)
  } finally {
    wxBinding.value = false
  }
}

const onSkip = () => {
  if (submitting.value || wxBinding.value) return
  uni.reLaunch({url: '/pages/index/index'})
}
</script>

<template>
  <view class="bind" :style="{paddingTop: heroPaddingTop}">
    <text class="bind__title">绑定手机号</text>
    <text class="bind__sub">用于接收停车凭证、电子发票与挪车信息</text>

    <!-- 当前微信用户 -->
    <view v-if="!errMsg" class="bind__acc">
      <view class="bind__acc-av">
        <t-icon name="user" size="15" color="#a8abb2"/>
      </view>
      <view class="bind__acc-main">
        <view class="bind__acc-name">{{ userStore.nickname || '微信用户' }}</view>
        <view class="bind__acc-tip">当前微信账号</view>
      </view>
      <view class="bind__acc-tag">已登录</view>
    </view>

    <view class="bind__form">
      <!-- 错误提示 -->
      <view v-if="errMsg" class="bind__err">
        <view class="bind__err-ic">
          <t-icon name="error-circle" size="14" color="#f56c6c"/>
        </view>
        <view class="bind__err-main">
          <view class="bind__err-title">{{ errParts.title }}</view>
          <view v-if="errParts.desc" class="bind__err-desc">{{ errParts.desc }}</view>
        </view>
      </view>
      <view class="bind__field">
        <view class="bind__prefix">+86</view>
        <view class="bind__divider"></view>
        <t-input
          v-model:value="form.phone"
          type="number"
          t-class="bind__input"
          t-class-input="bind__input-text"
          placeholder-class="bind__placeholder"
          borderless
          placeholder="请输入手机号码"
          :maxlength="11"
        />
      </view>
      <view class="bind__field">
        <t-input
          v-model:value="form.code"
          type="number"
          t-class="bind__input"
          t-class-input="bind__input-text"
          placeholder-class="bind__placeholder"
          borderless
          placeholder="请输入 6 位验证码"
          :maxlength="6"
        />
        <view class="bind__divider"></view>
        <text
          class="bind__send"
          :class="{ 'bind__send--counting': countdown > 0 }"
          @click="onSendCode"
        >{{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
        </text>
      </view>
      <view
        class="bind__submit"
        :class="{ 'bind__submit--disabled': !canSubmit }"
        @click="onSubmit"
      >{{ submitting ? '绑定中...' : '绑定' }}
      </view>
    </view>

    <view class="bind__other">
      <view class="bind__other-line"></view>
      <view class="bind__other-text">或</view>
      <view class="bind__other-line"></view>
    </view>

    <button
      class="bind__wx"
      open-type="getPhoneNumber"
      @getphonenumber="onGetPhoneNumber"
    >
      <view class="bind__wx-ib">
        <t-icon name="logo-wechat-stroke-filled" size="16" color="#07c160"/>
      </view>
      <view class="bind__wx-main">
        <view class="bind__wx-title">{{ wxBinding ? '正在绑定手机号…' : '微信一键授权手机号' }}</view>
        <view class="bind__wx-desc">无需验证码，直接用微信手机号</view>
      </view>
      <view v-if="wxBinding" class="bind__spin"></view>
      <t-icon v-else class="bind__wx-arrow" name="chevron-right" size="16" color="#c0c4cc"/>
    </button>

    <view class="bind__skip" @click="onSkip">暂不绑定，先逛逛 ›</view>

    <view v-if="wxBinding" class="bind__mask">
      <view class="bind__toast">
        <view class="bind__spinner"></view>
        <text>正在绑定手机号…</text>
      </view>
    </view>
  </view>

</template>

<style scoped lang="scss">
.bind {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0 64rpx;
  box-sizing: border-box;
  background: #fff;

  &__title {
    flex: 0 0 auto;
    font-size: 44rpx;
    font-weight: 600;
    letter-spacing: 0.8rpx;
    color: #1f2d3d;
  }

  &__sub {
    flex: 0 0 auto;
    margin-top: 14rpx;
    font-size: 23rpx;
    line-height: 1.6;
    color: #909399;
  }

  &__acc {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    margin-top: 56rpx;
    padding: 18rpx 24rpx;
    border-radius: 24rpx;
    background: #f7f8fa;
  }

  &__acc-av {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56rpx;
    height: 56rpx;
    margin-right: 20rpx;
    border-radius: 50%;
    background: #e8ebf0;
  }

  &__acc-main {
    flex: 1 1 auto;
    min-width: 0;
  }

  &__acc-name {
    font-size: 25rpx;
    font-weight: 500;
    line-height: 1.3;
    color: #1f2d3d;
  }

  &__acc-tip {
    font-size: 19rpx;
    line-height: 1.4;
    color: #909399;
  }

  &__acc-tag {
    flex: 0 0 auto;
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
    font-size: 19rpx;
    line-height: 1.4;
    color: #07c160;
    background-color: #e8f8ef;
  }

  &__form {
    flex: 0 0 auto;
    margin-top: 56rpx;
  }

  &__field {
    display: flex;
    align-items: center;
    min-height: 92rpx;
    padding: 0 28rpx;
    box-sizing: border-box;
    border: 2rpx solid transparent;
    border-radius: 24rpx;
    background-color: #f5f7fa;

    & + & {
      margin-top: 24rpx;
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

  :deep(.bind__input) {
    height: 92rpx;
    --td-input-bg-color: transparent;
    --td-input-vertical-padding: 0rpx;
  }

  :deep(.bind__input-text) {
    font-size: 26rpx !important;
  }

  :deep(.bind__placeholder) {
    font-size: 26rpx !important;
    color: #c0c4cc !important;
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
    margin-top: 36rpx;
    border-radius: 46rpx;
    font-size: 27rpx;
    font-weight: 500;
    letter-spacing: 1rpx;
    color: #ffffff;
    background: linear-gradient(135deg, #409eff 0%, #5ba8ff 100%);
    box-shadow: 0 12rpx 28rpx rgba(64, 158, 255, 0.25);

    &--disabled {
      opacity: 0.45;
      box-shadow: none;
    }
  }

  &__err {
    display: flex;
    margin-bottom: 24rpx;
    padding: 20rpx 24rpx;
    box-sizing: border-box;
    border: 2rpx solid #fde2e2;
    border-radius: 24rpx;
    background-color: #fef0f0;
  }

  &__err-ic {
    flex: 0 0 auto;
    margin: 4rpx 14rpx 0 0;
  }

  &__err-main {
    flex: 1 1 auto;
    min-width: 0;
  }

  &__err-title {
    font-size: 25rpx;
    font-weight: 600;
    line-height: 1.45;
    color: #c45656;
  }

  &__err-desc {
    margin-top: 6rpx;
    font-size: 21rpx;
    line-height: 1.65;
    color: #d08a8a;
  }

  &__other {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
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
    flex: 0 0 auto;
    margin: 32rpx 0 0;
    padding: 22rpx 26rpx;
    box-sizing: border-box;
    background-color: #fff;
    border: 2rpx solid #e0e7f0;
    border-radius: 26rpx;
    box-shadow: 0 4rpx 12rpx rgba(48, 49, 51, 0.05);
    line-height: normal;
    font-size: inherit;
    font-weight: normal;
    text-align: left;
    overflow: visible;
    outline: none;

    &::after {
      border: none;
    }
  }

  &__wx-ib {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 60rpx;
    height: 60rpx;
    margin-right: 22rpx;
    border-radius: 20rpx;
    background-color: #e8f8ef;
  }

  &__wx-main {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-width: 0;
  }

  &__wx-title {
    font-size: 25rpx;
    font-weight: 500;
    line-height: 1.35;
    color: #1f2d3d;
  }

  &__wx-desc {
    margin-top: 2rpx;
    font-size: 20rpx;
    line-height: 1.45;
    color: #909399;
  }

  &__wx-arrow {
    flex: 0 0 auto;
  }

  &__spin {
    flex: 0 0 auto;
    width: 30rpx;
    height: 30rpx;
    border-radius: 50%;
    border: 3rpx solid rgba(7, 193, 96, 0.2);
    border-top-color: #07c160;
    animation: bind-spin 0.8s linear infinite;
  }

  &__skip {
    flex: 0 0 auto;
    margin-top: auto;
    padding: 40rpx 0 60rpx;
    text-align: center;
    font-size: 24rpx;
    color: #409eff;
  }

  &__mask {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.66);
  }

  &__toast {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30rpx 40rpx;
    border-radius: 22rpx;
    background-color: rgba(23, 26, 31, 0.8);
  }

  &__spinner {
    width: 38rpx;
    height: 38rpx;
    margin-bottom: 18rpx;
    border-radius: 50%;
    border: 4rpx solid rgba(255, 255, 255, 0.26);
    border-top-color: #ffffff;
    animation: bind-spin 0.8s linear infinite;
  }

  &__toast text {
    font-size: 23rpx;
    color: #ffffff;
  }
}

@keyframes bind-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>