<script setup lang="ts">
import {ref} from 'vue'
import {type CustomerPlate, defaultPlate, listMyPlate, unbindPlate} from "@/api/plate";
import {onShow} from "@dcloudio/uni-app";

/** 单个客户最多可绑定的车牌数量 */
const MAX_BIND = 5

/** 车牌列表 */
const plateList = ref<CustomerPlate[]>([])

/** 获取车牌列表 */
const loading = ref(false)
const fetchPlateList = async () => {
  loading.value = true
  try {
    const res = await listMyPlate()
    plateList.value = res.data
  } catch {
    // 不做处理
  } finally {
    loading.value = false
  }
}

/** 解绑 */
const onUnbind = (p: CustomerPlate) => {
  uni.showModal({
    title: '解绑车牌',
    content: `解绑后 ${p.plateNumber} 将无法入场，确定解绑？`,
    confirmText: '解绑',
    confirmColor: '#e34d59',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await unbindPlate(p.id)
        /** 重新刷新车牌列表 */
        await fetchPlateList()
      } catch {
        // 不做处理
      }
    }
  })
}

/** 设为默认 */
const onSetDefault = async (p: CustomerPlate) => {
  if (p.isDefault) return
  try {
    await defaultPlate(p.id)
    await fetchPlateList()
  } catch {
    // 不做处理
  }
}

/** 添加车牌 */
const onAdd = () => {
  uni.navigateTo({url: '/pages/plate/add'})
}

onShow(() => {
  fetchPlateList()
})
</script>

<template>
  <view class="plate">
    <t-navbar title="我的车辆" left-arrow placeholder/>

    <view class="plate__body">
      <view class="plate__notice">车牌用于道闸识别入场，请绑定真实车牌；最多可绑定 {{ MAX_BIND }} 块车牌</view>
      <view
        v-for="p in plateList"
        :key="p?.id"
        class="plate__card"
        :class="p?.energyType === 1 ? 'is-blue' : 'is-green'"
      >
        <text class="plate__no">{{ p.plateNumber?.substring(0, 2) }}·{{ p.plateNumber?.substring(2) }}</text>
        <view class="plate__foot">
          <text class="plate__default" v-if="p?.isDefault">默认</text>
          <view class="plate__ops">
            <view class="plate__btn" @tap="onUnbind(p)">解绑</view>
            <view class="plate__btn" :class="{ 'is-disabled': p?.isDefault }" @tap="onSetDefault(p)">设为默认</view>
          </view>
        </view>
      </view>

      <view class="plate__add" v-if="plateList?.length < MAX_BIND" @tap="onAdd">
        <t-icon name="add" size="32rpx"/>
        <text>添加车牌</text>
      </view>

      <view class="plate__tip">
        已有 {{ plateList?.length }} 块，还可添加 {{ MAX_BIND - plateList?.length }} 块。车牌全局唯一，同一车牌不能绑定到多个账号。
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.plate {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f6f8;
}

.plate__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 25rpx 30rpx 30rpx;
}

.plate__notice {
  font-size: 25rpx;
  line-height: 1.5;
  color: #a86a15;
  background: #fdf6ec;
  border-radius: 15rpx;
  padding: 17rpx 25rpx;
}

.plate__card {
  border-radius: 30rpx;
  padding: 30rpx;
}

.plate__card.is-blue {
  background: linear-gradient(180deg, #3a8ae6 0%, #2b7cd3 56%, #1f63b5 100%);
  box-shadow: 0 7rpx 25rpx rgba(31, 99, 181, 0.22);
}

.plate__card.is-green {
  background: linear-gradient(180deg, #46b25f 0%, #2a9250 46%, #0a5a34 100%);
  box-shadow: 0 7rpx 25rpx rgba(31, 143, 77, 0.22);
}

.plate__no {
  display: block;
  font-family: 'DIN Alternate', Consolas, sans-serif;
  font-size: 65rpx;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: 2.5rpx;
  color: #fff;
  text-shadow: 0 2rpx 5rpx rgba(0, 0, 0, 0.16);
}

.plate__foot {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 30rpx;
}

.plate__default {
  flex: 0 0 auto;
  font-size: 24rpx;
  line-height: 42rpx;
  padding: 0 17rpx;
  border-radius: 10rpx;
  background: rgba(255, 255, 255, 0.92);
  color: #1f63b5;
  font-weight: 600;
}

.plate__ops {
  display: flex;
  gap: 20rpx;
  margin-left: auto;
}

.plate__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 65rpx;
  padding: 0 30rpx;
  border-radius: 32rpx;
  font-size: 27rpx;
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.plate__btn.is-disabled {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.26);
  color: rgba(255, 255, 255, 0.5);
}

.plate__add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15rpx;
  height: 129rpx;
  background: #fff;
  border: 1px dashed #ebeef5;
  border-radius: 25rpx;
  color: #409eff;
  font-size: 30rpx;
}

.plate__tip {
  margin-top: auto;
  font-size: 25rpx;
  line-height: 1.5;
  color: #a8abb2;
}
</style>