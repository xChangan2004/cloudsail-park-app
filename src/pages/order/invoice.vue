<script setup lang="ts">
import {reactive, ref} from 'vue'
import dayjs from "dayjs";

/** 发票类型：电子普通发票 / 增值税专用发票 */
const type = ref<'normal' | 'special'>('normal')
/** 抬头类型：单位 / 个人 */
const titleType = ref<'company' | 'personal'>('company')

/** 开票来源订单 */
const order = {
  lotName: '腾讯滨海大厦地下车库',
  amount: 33,
  createTime: '2026-09-25 19:30:00',
}

/** 开票信息（示例数据） */
const form = reactive({
  /** 发票抬头 / 专票的「单位名称」 */
  title: '',
  /** 纳税人识别号 */
  taxNumber: '',
  /** 注册地址（仅专票） */
  registerAddress: '',
  /** 注册电话（仅专票） */
  registerPhone: '',
  /** 开户银行（仅专票） */
  bankName: '',
  /** 银行账号（仅专票） */
  bankAccount: '',
  /** 个人抬头的姓名 */
  personalName: '',
  /** 接收邮箱 */
  email: '',
})

/** 输入框 placeholder 样式（scoped 下 placeholder-class 匹配不上，只能内联） */
const PH = 'color:#c0c7d3;font-size:26rpx;font-weight:400'
</script>

<template>
  <view class="invoice">
    <t-navbar title="开具电子发票" left-arrow placeholder />

    <view class="invoice__body">
      <!-- 可开票金额 -->
      <view class="amt">
        <text class="amt__label">可开票金额</text>
        <text class="amt__num">¥ {{ order?.amount?.toFixed(2) }}</text>
        <text class="amt__sub">{{ order?.lotName }} · {{ dayjs(order.createTime)?.format('MM-DD') }}</text>
      </view>

      <!-- 发票类型 -->
      <view class="sec">
        <view class="sec__t">发票类型</view>
        <view class="chipset">
          <view class="chip" :class="{'on': type === 'normal'}" @tap="type = 'normal'">
            <text class="chip__t">电子普通发票</text>
          </view>
          <view class="chip" :class="{'on': type === 'special'}" @tap="type = 'special'">
            <text class="chip__t">增值税专用发票</text>
            <text class="chip__s">需人工审核</text>
          </view>
        </view>
        <!-- 专票只支持单位抬头 -->
        <view v-if="type === 'special'" class="sec__hint">专票仅支持单位抬头，个人抬头不可选</view>
      </view>

      <!-- 抬头类型 -->
      <view v-if="type === 'normal'" class="sec">
        <view class="sec__t">抬头类型</view>
        <view class="chipset">
          <view class="chip" :class="{on: titleType === 'company'}" @tap="titleType = 'company'">
            <text class="chip__t">单位</text>
          </view>
          <view class="chip" :class="{on: titleType === 'personal'}" @tap="titleType = 'personal'">
            <text class="chip__t">个人</text>
          </view>
        </view>
      </view>

      <!-- 开票信息 · 增值税专用发票 -->
      <view v-if="type === 'special'" class="fbox">
        <view class="row">
          <text class="row__k"><text class="row__star">*</text>单位名称</text>
          <input v-model="form.title" class="row__ip" placeholder="需与税务登记一致" :placeholder-style="PH"/>
        </view>
        <view class="row">
          <text class="row__k"><text class="row__star">*</text>纳税人识别号</text>
          <input v-model="form.taxNumber" class="row__ip" placeholder="请输入" :placeholder-style="PH"/>
        </view>
        <view class="row">
          <text class="row__k"><text class="row__star">*</text>注册地址</text>
          <input v-model="form.registerAddress" class="row__ip" placeholder="需与税务登记一致" :placeholder-style="PH"/>
        </view>
        <view class="row">
          <text class="row__k"><text class="row__star">*</text>注册电话</text>
          <input v-model="form.registerPhone" class="row__ip" type="number" placeholder="请输入" :placeholder-style="PH"/>
        </view>
        <view class="row">
          <text class="row__k"><text class="row__star">*</text>开户银行</text>
          <input v-model="form.bankName" class="row__ip" placeholder="请输入" :placeholder-style="PH"/>
        </view>
        <view class="row">
          <text class="row__k"><text class="row__star">*</text>银行账号</text>
          <input v-model="form.bankAccount" class="row__ip" type="number" placeholder="请输入" :placeholder-style="PH"/>
        </view>
        <view class="row">
          <text class="row__k"><text class="row__star">*</text>接收邮箱</text>
          <input v-model="form.email" class="row__ip" placeholder="请输入邮箱" :placeholder-style="PH"/>
        </view>
      </view>

      <!-- 开票信息 · 电子普通发票 + 单位 -->
      <view v-else-if="titleType === 'company'" class="fbox">
        <view class="row">
          <text class="row__k"><text class="row__star">*</text>发票抬头</text>
          <input v-model="form.title" class="row__ip" placeholder="请输入发票抬头" :placeholder-style="PH"/>
        </view>
        <view class="row">
          <text class="row__k"><text class="row__star">*</text>税号</text>
          <input v-model="form.taxNumber" class="row__ip" placeholder="请输入税号" :placeholder-style="PH"/>
        </view>
        <view class="row">
          <text class="row__k"><text class="row__star">*</text>接收邮箱</text>
          <input v-model="form.email" class="row__ip" placeholder="请输入邮箱" :placeholder-style="PH"/>
        </view>
      </view>

      <!-- 开票信息 · 电子普通发票 + 个人-->
      <view v-else class="fbox">
        <view class="row">
          <text class="row__k"><text class="row__star">*</text>发票抬头</text>
          <input v-model="form.personalName" class="row__ip" placeholder="请输入姓名" :placeholder-style="PH"/>
        </view>
        <view class="row">
          <text class="row__k"><text class="row__star">*</text>接收邮箱</text>
          <input v-model="form.email" class="row__ip" placeholder="请输入邮箱" :placeholder-style="PH"/>
        </view>
      </view>

      <!-- 说明 / 风险提示 -->
      <view v-if="type === 'special'" class="notice notice--warn">
        <text>专票信息须与税务登记</text><text class="notice__strong">完全一致</text><text>，提交后 1–3 个工作日人工审核；开具后不可撤销，冲红需联系客服。</text>
      </view>
      <view v-else-if="titleType === 'personal'" class="notice">
        <text>个人抬头只需姓名，开票后 10 分钟内送达邮箱；模板存在本机，换设备需重新保存。</text>
      </view>
      <view v-else class="notice">
        <text>发票将于提交后 </text><text class="notice__strong">10 分钟内</text><text>发送至所填邮箱；如抬头信息有误，可在「我的 - 发票管理」中重开。</text>
      </view>
    </view>

    <view class="invoice__bar">
      <t-button t-class="invoice__submit" theme="primary" size="large" block>提交开票</t-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.invoice {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f6f8;
}

.invoice__body {
  flex: 1;
  min-height: 0;
  padding: 32rpx;
  /* 给固定底栏让位：底栏高度 + 64rpx 呼吸位。和 .invoice__bar 的高度对着改 */
  padding-bottom: calc(144rpx + 64rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(144rpx + 64rpx + env(safe-area-inset-bottom));
}

.amt {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36rpx 32rpx;
  margin-bottom: 28rpx;
  background: #fff;
  border-radius: 30rpx;
  box-shadow: 0 2rpx 20rpx rgba(23, 32, 60, 0.05);
}

.amt__label {
  font-size: 24rpx;
  color: #909399;
}

.amt__num {
  margin-top: 12rpx;
  font-size: 60rpx;
  font-weight: 800;
  line-height: 1.6;
  letter-spacing: -0.8rpx;
  color: #303133;
}

.amt__sub {
  margin-top: 12rpx;
  font-size: 23rpx;
  color: #909399;
}

.sec {
  margin-bottom: 32rpx;
}

.sec__t {
  margin: 0 4rpx 20rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #303133;
}

.sec__hint {
  margin: 16rpx 4rpx 0;
  font-size: 23rpx;
  color: #b26a00;
}

.chipset {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
}

.chip {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 18rpx 30rpx;
  border: 1px solid #ebeef5;
  border-radius: 22rpx;
  background: #fff;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1.6;
  color: #5a6172;
}

.chip.on {
  border-color: #1668ff;
  background: #eaf1ff;
  color: #0b4fd1;
  box-shadow: 0 0 0 6rpx rgba(22, 104, 255, 0.08);
}

.chip__s {
  font-size: 21rpx;
  font-weight: 500;
  opacity: 0.7;
}

.fbox {
  margin-bottom: 28rpx;
  background: #fff;
  border-radius: 30rpx;
  overflow: hidden;
}

.row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx 32rpx;
  font-size: 27rpx;
  line-height: 1.6;
  border-bottom: 1px solid #ebeef5;
}

.row:last-child {
  border-bottom: 0;
}

.row__k {
  flex: none;
  width: 184rpx;
  color: #5a6172;
}

.row__star {
  margin-right: 4rpx;
  color: #F5483B;
}

/* uni 原生 input：撑满右侧、文字右对齐，清掉默认内边距与背景 */
/* （input 是原生元素，字号/字重/颜色不会从 .row 继承，得在这儿写全） */
.row__ip {
  flex: 1;
  min-width: 0;
  padding: 0;
  background: transparent;
  font-size: 27rpx;
  font-weight: 600;
  color: #303133;
  text-align: right;
}

.notice {
  padding: 26rpx 30rpx;
  border-radius: 30rpx;
  background: #f8fafd;
  font-size: 23rpx;
  line-height: 1.75;
  color: #949baa;
}

.notice--warn {
  background: #fff4e6;
  border: 1px solid #ffe3ce;
  color: #b26a00;
}

.notice__strong {
  font-weight: 700;
  color: #5a6172;
}

.notice--warn .notice__strong {
  color: #b26a00;
}

/* 固定底栏：脱离文档流贴在屏幕底部，正文靠 .invoice__body 的 padding-bottom 让位 */
/* 高度 = 上下 padding 24rpx×2 + 按钮 96rpx = 144rpx（再叠 Home Indicator） */
.invoice__bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  padding: 24rpx 32rpx;
  background: #fff;
  border-top: 1px solid #ebeef5;
  padding-bottom: calc(24rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

:deep(.invoice__submit) {
  --td-button-primary-bg-color: #1668ff;
  --td-button-primary-border-color: #1668ff;
  --td-button-primary-active-bg-color: #0b4fd1;
  --td-button-primary-active-border-color: #0b4fd1;
  --td-button-border-radius: 28rpx;
  --td-button-large-font: 700 31rpx / 48rpx;
}
</style>
