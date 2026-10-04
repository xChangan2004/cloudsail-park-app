<script setup lang="ts">
defineProps<{
  /** province=省份简称面板；letter=字母数字面板 */
  mode: 'province' | 'letter'
}>()

const emit = defineEmits<{
  'input': [value: string]
  'delete': []
}>()

/** 省份简称 31 个 */
const PROVINCE_ROWS = [
  ['京', '津', '冀', '晋', '蒙', '辽', '吉', '黑'],
  ['沪', '苏', '浙', '皖', '闽', '赣', '鲁', '豫'],
  ['鄂', '湘', '粤', '桂', '琼', '渝', '川', '贵'],
  ['云', '藏', '陕', '甘', '青', '宁', '新'],
]

/** 字母数字：保留标准键盘位置，每行 flex 铺满 */
const LETTER_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
]

/** 中国车牌不使用 I / O（易与 1 / 0 混淆），保留位置但置灰 */
const DISABLED_KEYS = ['I', 'O']

const onKey = (key: string) => {
  if (DISABLED_KEYS.includes(key)) return
  emit('input', key)
}
</script>

<template>
  <view class="kb">
    <!-- 省份简称面板 -->
    <template v-if="mode === 'province'">
      <view
        v-for="(row, ri) in PROVINCE_ROWS"
        :key="ri"
        class="kb__row"
      >
        <view
          v-for="p in row"
          :key="p"
          class="kb__key"
          hover-class="kb__key--hover"
          @tap="onKey(p)"
        >{{ p }}
        </view>
      </view>
    </template>
    <!-- 字母数字键盘 -->
    <template v-else>
      <view
        v-for="(row, ri) in LETTER_ROWS"
        :key="ri"
        class="kb__row"
      >
        <view
          v-for="k in row"
          :key="k"
          class="kb__key"
          :class="{'is-disabled': DISABLED_KEYS.includes(k)}"
          hover-class="kb__key--hover"
          @tap="onKey(k)"
        >
          {{ k }}
        </view>
        <!-- 末行补删除键 -->
        <view
          v-if="ri === LETTER_ROWS.length - 1"
          class="kb__key kb__key--fn"
          hover-class="kb__key--hover"
          @tap="emit('delete')"
        >
          删除
        </view>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.kb {
  background: #fff;
  border-top: 1px solid #ebeef5;
  padding: 12rpx 12rpx 28rpx;
}

.kb__row {
  display: flex;
  gap: 12rpx;
  margin-top: 12rpx;
}

.kb__key {
  flex: 1;
  min-width: 0;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  color: #303133;
  background: #f5f7fa;
  border-radius: 12rpx;
}

.kb__key--hover {
  background: #d9e8fb;
}

.kb__key.is-disabled {
  color: #c9ccd1;
  background: #fafbfc;
}

.kb__key--fn {
  flex: 0 0 128rpx;
  color: #606266;
  background: #fff;
  border: 1px solid #e3e8ee;
}
</style>