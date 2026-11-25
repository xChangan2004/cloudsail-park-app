<script setup lang="ts">
import {computed, ref} from 'vue'
import {onShow} from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import {useUserStore} from '@/stores'
import {type AppDeletionVO, applyDeletion, cancelDeletion, getDeletionStatus} from '@/api/customer'
import {logout} from '@/api/auth'

const userStore = useUserStore()

/** 当前注销状态 */
const state = ref<AppDeletionVO | null>(null)
const loading = ref(true)
const submitting = ref(false)

/** 表单 */
const reason = ref<number | null>(null)
const remark = ref('')

const REASONS = [
  {value: 1, label: '不再使用'},
  {value: 2, label: '隐私顾虑'},
  {value: 3, label: '换用其他产品'},
  {value: 4, label: '体验不佳'},
  {value: 5, label: '其他'},
]

const REMARK_PH = 'color:#c0c7d3;font-size:26rpx;font-weight:400'

/** 注销会一并清除的东西 */
const LOSSES = [
  '停车记录与订单，含未开票的缴费记录',
  '优惠券与领券资格，锁定中的券一并作废',
  '已绑定车牌，注销后需重新绑定',
  '个人资料（昵称、头像、手机号脱敏）',
]

const pending = computed(() => !!state.value?.pending)

const effectiveText = computed(() => {
  const t = state.value?.effectiveTime
  if (!t) return ''
  return dayjs(String(t).replace(/-/g, '/')).format('YYYY年M月D日')
})

const applyText = computed(() => {
  const t = state.value?.applyTime
  if (!t) return ''
  return dayjs(String(t).replace(/-/g, '/')).format('YYYY-MM-DD HH:mm')
})

const remainDays = computed(() => state.value?.remainDays ?? 0)

/** 冷静期已过的比例，用于进度条 */
const progress = computed(() => {
  const total = 30
  const passed = Math.min(total, Math.max(0, total - remainDays.value))
  return Math.round((passed / total) * 100)
})

const reasonText = computed(() => {
  const r = state.value?.reason
  const hit = REASONS.find(i => i.value === r)
  return hit?.label ?? '—'
})

/** 拉取注销状态 */
const fetchState = async () => {
  try {
    const {data} = await getDeletionStatus()
    state.value = data ?? null
    userStore.setDeletion(!!data?.pending, data?.effectiveTime ?? '')
  } catch {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

/** 选理由 */
const onPickReason = (v: number) => {
  reason.value = v
}

/** 提交注销申请 */
const onSubmit = async () => {
  if (submitting.value) return
  if (!reason.value) {
    uni.showToast({title: '请先选择注销理由', icon: 'none'})
    return
  }
  if (reason.value === 5 && !remark.value.trim()) {
    uni.showToast({title: '选「其他」请补充说明', icon: 'none'})
    return
  }
  submitting.value = true
  try {
    const {data} = await applyDeletion({
      reason: reason.value,
      remark: remark.value.trim() || undefined,
    })
    state.value = data ?? null
    userStore.setDeletion(!!data?.pending, data?.effectiveTime ?? '')
    uni.showToast({title: '注销申请已提交', icon: 'success'})
    // 冷静期内账号仍可用，主动退出避免用户误以为已经删干净了
    setTimeout(async () => {
      try {
        await logout()
      } catch {
        // 注销接口失败也要清本地
      }
      userStore.resetLoginState()
      uni.reLaunch({url: '/pages/index/index'})
    }, 700)
  } catch {
    // 拦截器已 toast（如「还有 1 笔待支付订单」）
  } finally {
    submitting.value = false
  }
}

/** 撤销注销申请 */
const onCancel = () => {
  if (submitting.value) return
  uni.showModal({
    title: '撤销注销申请',
    content: '撤销后账号恢复如常，所有数据保留。',
    confirmText: '撤销申请',
    success: async ({confirm}) => {
      if (!confirm) return
      submitting.value = true
      try {
        const {data} = await cancelDeletion()
        state.value = data ?? null
        userStore.setDeletion(false)
        uni.showToast({title: '已撤销', icon: 'success'})
        setTimeout(() => uni.navigateBack(), 600)
      } catch {
        // 拦截器已 toast
      } finally {
        submitting.value = false
      }
    }
  })
}

onShow(() => {
  fetchState()
})
</script>

<template>
  <view class="del">
    <t-navbar :title="pending ? '注销申请' : '注销账号'" left-arrow placeholder/>

    <!-- 冷静期态 -->
    <view v-if="pending" class="del__body">
      <view class="cd">
        <view class="cd__ico">
          <t-icon name="error-circle" size="48rpx" color="#e34d59"/>
        </view>
        <text class="cd__t">注销申请已提交</text>
        <text class="cd__d">账号将于 {{ effectiveText }} 自动删除</text>

        <view class="cd__num">
          {{ remainDays }}<text class="cd__unit">天</text>
        </view>
        <view class="cd__bar">
          <view class="cd__bar-in" :style="{width: progress + '%'}"/>
        </view>
        <view class="cd__meta">
          <text>已过 {{ 30 - remainDays }} 天</text>
          <text>共 30 天</text>
        </view>
      </view>

      <view class="card">
        <text class="card__t">冷静期内</text>
        <view class="tip">
          <text class="tip__dot"/>
          <text class="tip__tx">账号仍可正常使用，查订单、缴费都不受影响</text>
        </view>
        <view class="tip">
          <text class="tip__dot"/>
          <text class="tip__tx">随时可以撤销，撤销后数据全部保留</text>
        </view>
        <view class="tip">
          <text class="tip__dot"/>
          <text class="tip__tx">到期后自动删除，届时不可恢复</text>
        </view>
      </view>

      <view class="card">
        <text class="card__t">申请信息</text>
        <view class="kv">
          <text class="kv__k">申请时间</text>
          <text class="kv__v">{{ applyText }}</text>
        </view>
        <view class="kv">
          <text class="kv__k">注销理由</text>
          <text class="kv__v">{{ reasonText }}</text>
        </view>
        <view v-if="state?.remark" class="kv">
          <text class="kv__k">补充说明</text>
          <text class="kv__v">{{ state.remark }}</text>
        </view>
      </view>

      <view class="del__notice">
        删除后如需再次使用，可用同一手机号 / 微信重新注册，历史数据不会继承。
      </view>
    </view>

    <!-- 申请态 -->
    <view v-else-if="!loading" class="del__body">
      <view class="warn">
        <t-icon name="error-circle" size="36rpx" color="#e34d59"/>
        <view class="warn__main">
          <text class="warn__t">注销是不可恢复的操作</text>
          <text class="warn__d">提交后有 30 天冷静期，期间可撤销；到期后系统自动删除。</text>
        </view>
      </view>

      <view class="card">
        <text class="card__t">注销将同时删除</text>
        <view v-for="(t, i) in LOSSES" :key="i" class="tip">
          <text class="tip__dot"/>
          <text class="tip__tx">{{ t }}</text>
        </view>
      </view>

      <view class="card">
        <view class="card__hd">
          <text class="card__t">注销理由</text>
          <text class="card__req">必选</text>
        </view>
        <view class="chips">
          <view
            v-for="r in REASONS"
            :key="r.value"
            class="chip"
            :class="{'is-on': reason === r.value}"
            @tap="onPickReason(r.value)"
          >{{ r.label }}</view>
        </view>

        <view v-if="reason === 5" class="txt">
          <textarea
            v-model="remark"
            class="txt__ip"
            :maxlength="200"
            placeholder="说说原因，帮助我们改进（必填）"
            :placeholder-style="REMARK_PH"
          />
          <text class="txt__count">{{ remark.length }}/200</text>
        </view>
      </view>

      <view class="del__notice del__notice--quiet">
        注销后，你的手机号与微信可重新注册新账号；已产生的停车订单仍会按规定保留，用于对账与售后。
      </view>
    </view>

    <view v-if="loading" class="del__loading">加载中…</view>

    <!-- 底部操作 -->
    <view v-if="!loading" class="bar">
      <t-button
        v-if="pending"
        t-class="bar__btn"
        theme="danger"
        size="large"
        variant="outline"
        block
        :loading="submitting"
        @click="onCancel"
      >撤销注销申请</t-button>
      <t-button
        v-else
        t-class="bar__btn"
        theme="danger"
        size="large"
        block
        :loading="submitting"
        @click="onSubmit"
      >提交注销申请</t-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.del {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f6f8;

  &__body {
    flex: 1;
    min-height: 0;
    padding: 24rpx 30rpx 0;
    /* 给固定底栏让位 */
    padding-bottom: calc(180rpx + env(safe-area-inset-bottom));
  }

  &__notice {
    margin: 28rpx 8rpx 20rpx;
    font-size: 22rpx;
    line-height: 1.7;
    color: #a8abb2;

    &--quiet {
      margin-top: 24rpx;
    }
  }

  &__loading {
    flex: 1;
    padding: 160rpx 0;
    text-align: center;
    font-size: 26rpx;
    color: #a8abb2;
  }
}

/* 警示条 */
.warn {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 24rpx 26rpx;
  border: 1rpx solid #fde2e2;
  border-radius: 24rpx;
  background: #fef0f0;

  &__main {
    flex: 1 1 auto;
    min-width: 0;
  }

  &__t {
    display: block;
    font-size: 27rpx;
    font-weight: 600;
    color: #e34d59;
  }

  &__d {
    display: block;
    margin-top: 6rpx;
    font-size: 22rpx;
    line-height: 1.6;
    color: #c45656;
  }
}

.card {
  margin-top: 24rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  background: #fff;
  box-shadow: 0 1rpx 6rpx rgba(48, 49, 51, 0.05);

  &__hd {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }

  &__t {
    display: block;
    font-size: 27rpx;
    font-weight: 600;
    color: #1f2d3d;
  }

  &__req {
    font-size: 21rpx;
    color: #e34d59;
  }
}

.tip {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  margin-top: 16rpx;

  &__dot {
    flex: 0 0 auto;
    width: 9rpx;
    height: 9rpx;
    margin-top: 15rpx;
    border-radius: 50%;
    background: #f56c6c;
  }

  &__tx {
    flex: 1 1 auto;
    font-size: 24rpx;
    line-height: 1.65;
    color: #606266;
  }
}

.kv {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  margin-top: 18rpx;

  &__k {
    flex: 0 0 auto;
    font-size: 24rpx;
    color: #909399;
  }

  &__v {
    flex: 1 1 auto;
    text-align: right;
    font-size: 24rpx;
    line-height: 1.6;
    color: #303133;
    word-break: break-all;
  }
}

/* 理由 chips */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 22rpx;
}

.chip {
  height: 60rpx;
  padding: 0 26rpx;
  border: 2rpx solid transparent;
  border-radius: 30rpx;
  font-size: 24rpx;
  line-height: 56rpx;
  color: #606266;
  background: #f5f7fa;

  &.is-on {
    color: #2b7cd3;
    font-weight: 500;
    border-color: #a0cfff;
    background: #ecf5ff;
  }
}

.txt {
  position: relative;
  margin-top: 22rpx;
  padding: 20rpx 22rpx 40rpx;
  border-radius: 20rpx;
  background: #f7f8fa;

  &__ip {
    width: 100%;
    height: 140rpx;
    font-size: 26rpx;
    line-height: 1.6;
    color: #303133;
  }

  &__count {
    position: absolute;
    right: 22rpx;
    bottom: 14rpx;
    font-size: 20rpx;
    color: #c0c4cc;
  }
}

/* 冷静期头卡 */
.cd {
  padding: 40rpx 32rpx 32rpx;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 1rpx 6rpx rgba(48, 49, 51, 0.05);
  text-align: center;

  &__ico {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 88rpx;
    height: 88rpx;
    margin: 0 auto;
    border-radius: 50%;
    background: #fef0f0;
  }

  &__t {
    display: block;
    margin-top: 20rpx;
    font-size: 32rpx;
    font-weight: 600;
    color: #1f2d3d;
  }

  &__d {
    display: block;
    margin-top: 8rpx;
    font-size: 23rpx;
    color: #909399;
  }

  &__num {
    margin-top: 26rpx;
    font-family: 'DIN Alternate', Consolas, sans-serif;
    font-size: 76rpx;
    font-weight: 700;
    line-height: 1.05;
    color: #e34d59;
  }

  &__unit {
    margin-left: 8rpx;
    font-family: inherit;
    font-size: 26rpx;
    font-weight: 500;
    color: #909399;
  }

  &__bar {
    height: 10rpx;
    margin: 26rpx 8rpx 0;
    border-radius: 6rpx;
    background: #f0f2f5;
    overflow: hidden;
  }

  &__bar-in {
    height: 100%;
    border-radius: 6rpx;
    background: #e34d59;
    transition: width 0.3s;
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    margin: 12rpx 8rpx 0;
    font-size: 20rpx;
    color: #c0c4cc;
  }
}

/* 固定底栏 */
.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  padding: 20rpx 30rpx calc(20rpx + env(safe-area-inset-bottom));


  &__link {
    display: block;
    margin-top: 16rpx;
    text-align: center;
    font-size: 23rpx;
    color: #909399;
  }
}

:deep(.bar__btn) {
  /* TDesign 的边框画在 ::after 上、圆角是 var(--td-button-border-radius) * 2。
     只改根节点 border-radius 会让 ::after 的圆角小于根节点，边框在两端被裁成竖线，
     所以统一走变量（large 高 96rpx，48rpx 即胶囊）。 */
  --td-button-border-radius: 48rpx;
  /* 实心按钮：贴合设计稿的红，默认 #d54941 偏暗 */
  --td-button-danger-bg-color: #e34d59;
  --td-button-danger-border-color: #e34d59;
  --td-button-danger-active-bg-color: #c45656;
  --td-button-danger-active-border-color: #c45656;
  /* 描边按钮（撤销注销申请） */
  --td-button-danger-outline-color: #e34d59;
  --td-button-danger-outline-border-color: #e34d59;
  --td-button-danger-outline-active-bg-color: #fef0f0;
  --td-button-danger-outline-active-border-color: #c45656;
}
</style>
