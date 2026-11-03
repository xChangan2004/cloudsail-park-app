<script setup lang="ts">
import {computed} from 'vue'
import type {FeeRuleVO, TierVO, TimeSegmentVO} from '@/api/parking'
import {
  buildEstimate,
  clockMinutes,
  freeMinutesText,
  money,
  ruleTypeText,
  segmentLabel,
  tierLabels,
} from '@/utils/fee'

const props = defineProps<{
  visible: boolean
  rule?: FeeRuleVO | null
  lotName?: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

/** t-popup 走 v-model:visible，用带 setter 的 computed 转一手 */
const show = computed({
  get: () => props.visible,
  set: (v: boolean) => emit('update:visible', v),
})

const typeText = computed(() => ruleTypeText(props.rule?.ruleType))

const chipClass = computed(() => {
  const t = props.rule?.ruleType
  return t === 2 ? 'is-period' : t === 3 ? 'is-tiered' : 'is-standard'
})

const freeText = computed(() => freeMinutesText(props.rule, '无（从第 1 分钟起计）'))

const segments = computed<TimeSegmentVO[]>(() =>
  [...(props.rule?.timeSegments ?? [])].sort((a, b) => clockMinutes(a.start) - clockMinutes(b.start)),
)

const tiers = computed<TierVO[]>(() => props.rule?.tiers ?? [])

const tierLabelList = computed(() => tierLabels(tiers.value))

const hasCap = computed(() => Number(props.rule?.dailyCap ?? 0) > 0)

const estimate = computed(() => buildEstimate(props.rule))
</script>

<template>
  <t-popup v-model:visible="show" placement="bottom">
    <view v-if="rule" class="sheet">
      <view class="sheet__head">
        <text class="sheet__title">收费标准</text>
        <text class="sheet__chip" :class="chipClass">{{ typeText }}</text>
      </view>
      <text class="sheet__sub">{{ lotName }} · 按实际停车时长计算</text>

      <scroll-view scroll-y class="sheet__body">
        <!-- 免费时长 -->
        <view class="blk blk--tint">
          <text class="blk__v blk__v--pri">免费时长</text>
          <text class="blk__v blk__v--pri">{{ freeText }}</text>
        </view>

        <!-- 主规则：按类型换结构 -->
        <view class="blk">
          <template v-if="rule.ruleType === 1">
            <view class="row">
              <text class="row__k">首小时</text>
              <text class="row__v">¥{{ money(rule.firstHourRate) }}</text>
            </view>
            <view class="hr"/>
            <view class="row">
              <text class="row__k">超出后 · 每小时</text>
              <text class="row__v">¥{{ money(rule.additionalRate) }}</text>
            </view>
            <view class="hr"/>
            <view class="row">
              <text class="row__k">计费单位</text>
              <text class="row__v">不足 1 小时按 1 小时计</text>
            </view>
          </template>

          <template v-else-if="rule.ruleType === 2">
            <view class="row">
              <text class="row__k">时段</text>
              <text class="row__k">元 / 小时</text>
            </view>
            <view class="hr"/>
            <view
              v-for="(s, i) in segments"
              :key="`${s.start}-${s.end}`"
              class="row"
              :class="{'row--gap': i > 0}"
            >
              <text class="row__v">{{ segmentLabel(s) }}</text>
              <text class="row__v">¥{{ money(s.rate) }}</text>
            </view>
          </template>

          <template v-else>
            <view class="row">
              <text class="row__k">累计时长</text>
              <text class="row__k">元 / 小时</text>
            </view>
            <view class="hr"/>
            <view
              v-for="(label, i) in tierLabelList"
              :key="label"
              class="row"
              :class="{'row--gap': i > 0}"
            >
              <text class="row__v">{{ label }}</text>
              <text class="row__v">¥{{ money(tiers[i]?.rate) }}</text>
            </view>
          </template>
        </view>

        <!-- 封顶 -->
        <view v-if="hasCap" class="blk">
          <view class="row">
            <text class="row__k">24 小时封顶</text>
            <text class="row__v row__v--warn">¥{{ money(rule.dailyCap) }}</text>
          </view>
          <text class="blk__tip">每 24 小时重新计算一次封顶，不是全程只封一次</text>
        </view>

        <!-- 示例 -->
        <view v-if="estimate" class="blk">
          <view class="row">
            <text class="row__k">{{ estimate.title }}</text>
            <text class="row__v row__v--strong">¥{{ money(estimate.total) }}</text>
          </view>
          <text class="blk__tip">{{ estimate.detail }}</text>
        </view>

        <text class="sheet__note">实际费用以出场账单为准，优惠券在支付时抵扣。</text>
      </scroll-view>

      <view class="sheet__btn" hover-class="sheet__btn--hover" @tap="show = false">我知道了</view>
    </view>
  </t-popup>
</template>

<style scoped lang="scss">
.sheet {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  background: #fff;
  border-radius: 40rpx 40rpx 0 0;
  padding: 36rpx 36rpx calc(28px + env(safe-area-inset-bottom));
}

.sheet__head {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.sheet__title {
  font-size: 34rpx;
  font-weight: 600;
  color: #303133;
}

.sheet__chip {
  font-size: 25rpx;
  line-height: 40rpx;
  padding: 0 15rpx;
  border-radius: 10rpx;
}

.sheet__chip.is-standard {
  background: #ecf5ff;
  color: #2b7cd3;
}

.sheet__chip.is-period {
  background: #fdf6ec;
  color: #a86a15;
}

.sheet__chip.is-tiered {
  background: #f0f9eb;
  color: #57962f;
}

.sheet__sub {
  font-size: 25rpx;
  line-height: 1.5;
  color: #909399;
}

.sheet__body {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 56vh;
  box-sizing: border-box;
}

.sheet__note {
  display: block;
  padding: 5rpx 0;
  font-size: 25rpx;
  line-height: 1.5;
  color: #909399;
}

.sheet__btn {
  flex: 0 0 auto;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: 46rpx;
  background: #409eff;
  color: #fff;
  font-size: 31rpx;
}

.sheet__btn--hover {
  background: #2b7cd3;
}

.blk {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 18rpx;
  padding: 20rpx 24rpx;
  box-sizing: border-box;
  border: 1rpx solid #ebeef5;
  border-radius: 20rpx;
}

.blk:last-of-type {
  margin-bottom: 0;
}

.blk--tint {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background: #ecf5ff;
  border-color: #d9ecff;
}

.blk__v {
  font-size: 29rpx;
  color: #303133;
}

.blk__v--pri {
  color: #2b7cd3;
  font-weight: 600;
}

.blk__tip {
  font-size: 24rpx;
  line-height: 1.5;
  color: #909399;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.row--gap {
  margin-top: 12rpx;
}

.row__k {
  flex: 0 0 auto;
  font-size: 26rpx;
  color: #909399;
}

.row__v {
  flex: 0 1 auto;
  font-size: 29rpx;
  color: #303133;
  text-align: right;
  word-break: break-all;
}

.row__v--strong {
  font-weight: 600;
}

.row__v--warn {
  color: #e6a23c;
}

.hr {
  height: 1rpx;
  margin: 16rpx -24rpx;
  background: #ebeef5;
}
</style>
