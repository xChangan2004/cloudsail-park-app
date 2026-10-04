<script setup lang="ts">
import {computed, ref} from 'vue'
import {bindPlate, type energyType} from "@/api/plate";
import PlateNumberInput from "./components/PlateNumberInput.vue";
import PlateKeyboard from "./components/PlateKeyboard.vue";
import {onLoad} from "@dcloudio/uni-app";

const PLATE_PATTERN =
  /^(([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z](([0-9]{5}[ABCDEFGHJK])|([ABCDEFGHJKP]([A-HJ-NP-Z0-9])[0-9]{4})))|([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领]\d{3}\d{1,3}[领])|([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳使领]))$/

/** 车牌数上限 */
const MAX_BIND = 5

/** 上限位数：新能源 8 位（燃油最短 7 位） */
const MAX_LEN = 8

/** 已输入的车牌字符 */
const plateNumber = ref('')
/** 是否默认车牌 */
const isDefault = ref(false)
/** 是否首个车牌 */
const isFirst = ref(false)
/** 提交中 */
const submitting = ref(false)

/** 第 1 位是省份简称 ⇒ 给省份面板；删空后自动退回省份面板 */
const kbMode = computed<'province' | 'letter'>(() =>
  plateNumber.value.length === 0 ? 'province' : 'letter'
)

/** 位数决定能源类型：燃油 7 位 / 新能源 8 位（与后端正则的两个分支一致） */
const energy = computed<energyType>(() => (plateNumber.value.length === 8 ? 2 : 1))

/** 只有完整合法的车牌才允许提交 */
const canSubmit = computed(() => PLATE_PATTERN.test(plateNumber.value))

const tipText = computed(() => {
  const n = plateNumber.value.length
  if (n === 0) return '请先选择省份简称'
  if (n < 7) return `已输入 ${n} 位，还需 ${7 - n} 位`
  if (n === 7) return '已输入 7 位（燃油车牌）'
  return '已输入 8 位（新能源车牌）'
})

const onInput = (value: string) => {
  if (plateNumber.value.length >= MAX_LEN) return
  plateNumber.value += value
}

const onDelete = () => {
  plateNumber.value = plateNumber.value.slice(0, -1)
}

const onSubmit = async () => {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  try {
    await bindPlate({
      plateNumber: plateNumber.value,
      energyType: energy.value,
      isDefault: isDefault.value,
    })
    uni.showToast({title: '添加成功', icon: 'success'})
    // 返回后车牌列表页的 onShow 会自动重新拉取
    setTimeout(() => uni.navigateBack(), 700)
  } catch {
    // 不做处理
  } finally {
    submitting.value = false
  }
}

onLoad((query) => {
  isFirst.value = query?.isFirst === '1'
  isDefault.value = isFirst.value
})
</script>

<template>
  <view class="add">
    <t-navbar title="添加车牌" left-arrow placeholder/>

    <view class="add__body">
      <view class="add__card">
        <!-- 车牌号 -->
        <view class="add__field">
          <PlateNumberInput :value="plateNumber"/>
          <view class="add__hint">选择省份后自动跳到字母键盘</view>
          <view class="add__hint add__hint--sub">燃油车牌 7 位 · 新能源车牌 8 位</view>
        </view>

        <!-- 设为默认车牌 -->
        <view class="add__row">
          <view class="add__row-main">
            <text class="add__row-t">设为默认车牌</text>
            <text class="add__row-s">首块车牌将自动设为默认</text>
          </view>
          <t-switch v-model:value="isDefault" :disabled="isFirst"/>
        </view>
      </view>

      <view class="add__note">
        同一块车牌只能绑定一个账号；每个账号最多 {{ MAX_BIND }} 块。绑定后如需修改或解绑，请到「我的车牌」。
      </view>
    </view>

    <view class="add__bottom">
      <view class="add__bar">
        <text class="add__bar-tip">{{ tipText }}</text>
        <t-button
          t-class="add__submit"
          theme="primary"
          :disabled="!canSubmit"
          :loading="submitting"
          @click="onSubmit"
        >保存
        </t-button>
      </view>

      <plate-keyboard :mode="kbMode" @input="onInput" @delete="onDelete"/>
    </view>
  </view>
</template>

<style scoped lang="scss">
.add {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f6f8;
}

.add__body {
  flex: 1;
  min-height: 0;
  padding: 50rpx 30rpx 30rpx;
}

.add__card {
  padding: 44rpx 0;
}

.add__field {
  padding-bottom: 36rpx;
}

.add__hint {
  margin-top: 28rpx;
  text-align: center;
  font-size: 26rpx;
  color: #909399;
}

.add__hint--sub {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #c0c4cc;
}

.add__row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 32rpx 0 36rpx;
  border-top: 1px solid #f0f2f5;
}

.add__row-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.add__row-t {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.add__row-s {
  font-size: 24rpx;
  color: #9aa0a6;
  line-height: 1.4;
}

.add__note {
  margin-top: 24rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #a8abb2;
}

.add__bottom {
  flex: 0 0 auto;
  background: #fff;
}


.add__bar {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 20rpx 30rpx;
  border-top: 1px solid #ebeef5;
}

.add__bar-tip {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  color: #909399;
}

:deep(.add__submit) {
  flex: 0 0 auto;
  width: 220rpx;
  /* 主题色换成本项目主色（TDesign 默认 primary 是 #0052d9） */
  --td-button-primary-bg-color: #409eff;
  --td-button-primary-border-color: #409eff;
  --td-button-primary-active-bg-color: #2b7cd3;
  --td-button-primary-active-border-color: #2b7cd3;
  --td-button-primary-disabled-bg: #a0cfff;
  --td-button-primary-disabled-border-color: #a0cfff;
}
</style>