<script setup lang="ts">
import type {AppParkingLotVO} from '@/api/parking'
import {formatDistance} from "@/utils/format"

defineProps<{
  lot: AppParkingLotVO
}>()

const emit = defineEmits<{
  'select': [lot: AppParkingLotVO]
}>()
</script>

<template>
  <view class="lot-card" @tap="emit('select', lot)">
    <image v-if="lot.cover" class="lot-card__cover" :src="lot.cover" mode="aspectFill"/>
    <view v-else class="lot-card__cover lot-card__cover--ph">
      <t-icon name="vehicle" size="16" color="#9fb3c8"/>
    </view>
    <view class="lot-card__main">
      <text class="lot-card__name">{{ lot.name }}</text>
      <text class="lot-card__sub">{{ lot.address }}</text>
      <view v-if="lot.facilities?.length" class="lot-card__fac">
        <text
          v-for="(f, i) in lot.facilities"
          :key="i"
          class="lot-card__fac-item"
        >{{ f }}</text>
      </view>
    </view>
    <view class="lot-card__space">
      <text class="lot-card__num" :class="{'is-full': !lot.hasFree}">{{ lot.freeSpaces }}</text>
      <text class="lot-card__num-tip">{{ lot.hasFree ? '空闲' : '已满' }}/{{ lot.totalSpaces }}</text>
      <text v-if="formatDistance(lot.distance)" class="lot-card__dist">
        {{ formatDistance(lot.distance) }}
      </text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.lot-card {
  display: flex;
  align-items: center;
  gap: 25rpx;
  background: #fff;
  border-radius: 25rpx;
  padding: 25rpx 30rpx;
  box-shadow: 0 2rpx 6rpx rgba(48, 49, 51, 0.04);
}

.lot-card__cover {
  flex: 0 0 auto;
  width: 119rpx;
  height: 119rpx;
  border-radius: 20rpx;
}

.lot-card__cover--ph {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dde7f2, #eef2f7);
}

.lot-card__main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5rpx;
}

.lot-card__name {
  max-width: 100%;
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lot-card__sub {
  font-size: 26rpx;
  line-height: 1.45;
  color: #909399;
  word-break: break-all;
}

.lot-card__fac {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  margin-top: 7rpx;
}

.lot-card__fac-item {
  display: inline-block;
  font-size: 25rpx;
  line-height: 40rpx;
  padding: 0 15rpx;
  border-radius: 10rpx;
  background: #ecf5ff;
  color: #2b7cd3;
}

.lot-card__space {
  flex: 0 0 auto;
  align-self: center;
  text-align: center;
}

.lot-card__num {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  line-height: 1;
  color: #2b7cd3;
  font-family: Consolas, sans-serif;
}

.lot-card__num.is-full {
  color: #909399;
}

.lot-card__num-tip {
  display: block;
  font-size: 24rpx;
  color: #909399;
}

.lot-card__dist {
  display: block;
  margin-top: 5rpx;
  font-size: 25rpx;
  font-weight: 600;
  color: #5A6172;
}
</style>