<script setup lang="ts">
import {ref} from 'vue'

const segOptions = [
  {value: 'all', label: '全部'},
  {value: 'unpaid', label: '未支付'},
  {value: 'paid', label: '已支付'},
  {value: 'closed', label: '已关闭'},
  {value: 'refunded', label: '已退款'},
]

const activeTab = ref<string | number>('all')

const onTabChange = (e: { value: string | number }) => {
  activeTab.value = e.value
}
</script>

<template>
  <view class="order">
    <t-navbar title="我的订单" placeholder/>

    <view class="order__body">
      <t-segmented
        t-class="order__seg"
        block
        :options="segOptions"
        :value="activeTab"
        @change="onTabChange"
      />

      <view class="order__list">
        <view class="order__card is-unpaid">
          <view class="order__row">
            <text class="order__lot">深南汇购物中心地下车库</text>
            <text class="order__chip order__chip--unpaid">待支付</text>
          </view>

          <view class="order__row order__row--body">
            <view class="order__col">
              <text class="order__plate">粤B·12345</text>
              <text class="order__sub">2026-09-28 18:06 出场</text>
            </view>
            <view class="order__amount">
              <text
                class="order__money is-danger"
              >¥12.00
              </text>
              <text class="order__tip">未支付</text>
            </view>
          </view>

          <view class="order__actions">
            <text class="order__btn" @tap.stop="">去支付</text>
          </view>
        </view>

        <view class="order__card">
          <view class="order__row">
            <text class="order__lot">云帆科技园 A 区停车场</text>
            <text class="order__chip order__chip--paid">已支付</text>
          </view>

          <view class="order__row order__row--body">
            <view class="order__col">
              <text class="order__plate is-muted">粤B·88888</text>
              <text class="order__sub">2026-09-27 19:20 支付</text>
            </view>
            <view class="order__amount">
              <text
                class="order__money"
              >¥8.00
              </text>
              <text class="order__tip">已优惠 ¥5</text>
            </view>
          </view>
        </view>

        <view class="order__card">
          <view class="order__row">
            <text class="order__lot">云帆科技园 A 区停车场</text>
            <text class="order__chip order__chip--refunded">已退款</text>
          </view>

          <view class="order__row order__row--body">
            <view class="order__col">
              <text class="order__plate is-muted">粤B·88888</text>
              <text class="order__sub">2026-09-20 21:02 退款成功</text>
            </view>
            <view class="order__amount">
              <text
                class="order__money"
              >¥6.00
              </text>
              <text class="order__tip">优惠不随退款返还</text>
            </view>
          </view>
        </view>
      </view>

      <view class="order__empty">
        <t-icon name="list" size="64rpx" color="#c9d5e2"/>
        <text class="order__empty-text">暂无相关订单</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.order {
  min-height: 100vh;
  background: #f5f6f8;
}

.order__body {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 25rpx 30rpx 30rpx;
}

:deep(.order__seg) {
  width: auto !important;
  padding: 8rpx !important;
  /* 容器：灰 → 白 */
  --td-segmented-bg-color: #ffffff;
  /* 滑块：白 → 浅蓝（注意没有 -color 后缀） */
  --td-segmented-item-active-bg: #ecf5ff;
  /* 选中字：品牌蓝 → 设计稿蓝 */
  --td-segmented-item-active-color: #2b7cd3;
  /* 未选中字：近黑 → 次级灰 */
  --td-segmented-item-color: #606266;
}

.order__list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.order__card {
  background: #fff;
  border-radius: 25rpx;
  padding: 25rpx 30rpx;
  box-shadow: 0 1px 3px rgba(48, 49, 51, 0.04);
}

.order__card.is-unpaid {
  border: 1px solid #faecd8;
}

.order__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.order__lot {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  color: #909399;
  line-height: 1.45;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order__chip {
  flex: 0 0 auto;
  display: inline-block;
  font-size: 25rpx;
  line-height: 40rpx;
  padding: 0 15rpx;
  border-radius: 10rpx;
  background: #ecf5ff;
  color: #2b7cd3;
}

.order__chip--unpaid {
  background: #fdf6ec;
  color: #a86a15;
}

.order__chip--paid {
  background: #f0f9eb;
  color: #57962f;
}

.order__chip--closed {
  background: #f5f7fa;
  color: #909399;
}

.order__chip--refunded {
  background: #fef0f0;
  color: #c04343;
}

.order__row--body {
  margin-top: 17rpx;
}

.order__col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 7rpx;
}

.order__plate {
  display: inline-block;
  line-height: 55rpx;
  padding: 0 17rpx;
  border-radius: 10rpx;
  background: #2b7cd3;
  color: #fff;
  font-size: 27rpx;
  font-weight: 600;
  letter-spacing: 1rpx;
}

.order__plate.is-muted {
  background: #3a6ea5;
}

.order__sub {
  font-size: 26rpx;
  color: #909399;
  line-height: 1.45;
}

.order__amount {
  flex: 0 0 auto;
  text-align: right;
}

.order__money {
  display: block;
  font-size: 37rpx;
  font-weight: 600;
  line-height: 1.1;
  color: #303133;
  font-family: 'DIN Alternate', Consolas, sans-serif;
}

.order__money.is-danger {
  color: #f56c6c;
}

.order__tip {
  display: block;
  font-size: 25rpx;
  color: #909399;
  line-height: 1.5;
}

.order__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 22rpx;
}

.order__btn {
  display: inline-block;
  height: 65rpx;
  line-height: 65rpx;
  padding: 0 30rpx;
  border-radius: 32rpx;
  background: #409eff;
  color: #fff;
  font-size: 27rpx;
}

.order__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  padding: 140rpx 0;
}

.order__empty-text {
  font-size: 27rpx;
  color: #a8abb2;
}
</style>