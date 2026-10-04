<script setup lang="ts">
import {computed} from "vue";

const props = defineProps<{
  /** 已输入车牌字符（不含分隔符） */
  value: string
  /** 最多位数：新能源 8 位 */
  maxLength?: number
}>()

/** 第 1 格是省份简称，其余等宽 */
const restCount = computed(() => (props.maxLength ?? 8) - 1)

/** 当前输入位 */
const activeIndex = computed(() => Math.min(props.value.length, props.maxLength ?? 8))

const cellAt = (i: number) => props.value[i] ?? ''
</script>

<template>
  <view class="pn">
    <!-- 第 1 位：省份简称 -->
    <view class="pn__cell" :class="{'is-active': activeIndex === 0}">
      <text v-if="cellAt(0)">{{ cellAt(0) }}</text>
    </view>

    <!-- 真实车牌号上的「·」分隔点 -->
    <view class="pn__dot"/>

    <!-- 第 2 位起 -->
    <view
      v-for="i in restCount"
      :key="i"
      class="pn__cell"
      :class="{'is-active': activeIndex === i}"
    >
      <text v-if="cellAt(i)">{{ cellAt(i) }}</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.pn {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 0 10rpx;
}

.pn__cell {
  flex: 1;
  min-width: 0;
  height: 124rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DIN Alternate', Consolas, sans-serif;
  font-size: 48rpx;
  font-weight: 600;
  color: #1a1a1a;
  background: #fff;
  border: 1px solid #e3e8ee;
  border-radius: 12rpx;
}

.pn__cell:first-child {
  flex: 1.2;
}

/** 当前输入位 */
.pn__cell.is-active {
  border-color: #409eff;
}

.pn__cell.is-active::after {
  content: '';
  width: 3rpx;
  height: 48rpx;
  background: #409eff;
  animation: pn-blink 1s steps(1, end) infinite;
}

@keyframes pn-blink {
  0%,
  50% {
    opacity: 1;
  }
  50.01%,
  100% {
    opacity: 0;
  }
}

/* 省份与后面号码之间的分隔点 */
.pn__dot {
  flex: 0 0 auto;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #c9d5e2;
}
</style>