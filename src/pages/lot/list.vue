<script setup lang="ts">
import {computed, reactive, ref} from "vue"
import {useNavbarSafe} from "@/hooks/useNavbarSafe";

const {heroPaddingTop} = useNavbarSafe()

/** 停车场结果数据 */
const resultLots = ref(['a', 'b'])

/** 输入框内容 */
const keyword = ref('')

/** 已提交的词 */
const submittedKeyword = ref('')

/** 搜索范围 */
const radiusOptions = [
  {value: 1, label: '1km'},
  {value: 3, label: '3km'},
  {value: 5, label: '5km'},
  {value: 10, label: '10km'},
]
/** 当前选择的搜索范围 */
const radius = ref(1)

const onRadiusChange = (e: { value: number }) => {
  const next = e.value
  if (next === radius.value) return
  radius.value = next
}

/** 排序范围 */
const sortOptions = [
  {label: '智能排序', value: 'smart'},
  {label: '距离', value: 'distance'},
  {label: '价格', value: 'price'},
]
/** 当前选择的排序范围 */
const sort = ref('smart')

/** 只看有空位 */
const onlyFree = ref(false)

/** 查询参数 */
const query = reactive({
  pageNo: 1,
  pageSize: 10,
  name: submittedKeyword.value || undefined,
  hasFree: onlyFree.value || undefined,
  sortType: sort.value
})

/** 搜索 */
const onSearch = () => {
  const kw = keyword.value.trim()
  if (!kw) return
  submittedKeyword.value = kw
  history.value = [kw, ...history.value.filter(h => h !== kw)].slice(0, HISTORY_MAX)
  /** 收起键盘 */
  uni.hideKeyboard()
}

/** 清除输入框 */
const onClear = () => {
  keyword.value = ''
  submittedKeyword.value = ''
}

/** 退回上一页；被直接打开时回首页 tab */
const onCancel = () => {
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.switchTab({url: "/pages/index/index"})
}

/** 搜索历史 */
const history = ref(["云帆科技园", "深南汇", "海岸城", "万象天地", "深圳湾公园"])
const HISTORY_MAX = 10

/** 清除历史记录 */
const clearHistory = () => {
  history.value = []
}

/** 选择记录内容 */
const onPickHistory = (h: string) => {
  keyword.value = h
  onSearch()
}

/** 页面状态 */
type PageState = 'input' | 'result' | 'empty'
/** 当前状态 */
const state = computed<PageState>(() => {
  if (!submittedKeyword.value) return 'input'
  return resultLots.value.length ? 'result' : 'empty'
})
</script>

<template>
  <view class="lot" :class="`is-${state}`">
    <view class="lot__nav" :style="{paddingTop: heroPaddingTop}">
      <view class="lot__bar">
        <view class="lot__box">
          <t-icon name="search" size="16" color="#909399"/>
          <input
            v-model="keyword"
            class="lot__input"
            type="text"
            confirm-type="search"
            placeholder="搜索停车场 / 目的地"
            :placeholder-style="`font-size:30rpx;color:#a8abb2`"
            @confirm="onSearch"
          />
          <view v-if="keyword" class="lot__clear" @tap.stop="onClear">
            <t-icon name="close" size="12" color="#fff"/>
          </view>
        </view>
        <text class="lot__cancel" @tap="onCancel">取消</text>
      </view>
    </view>

    <view class="lot__body">
      <template v-if="state === 'input'">
        <template v-if="history.length">
          <view class="lot__head">
            <text class="lot__head-t">搜索历史</text>
            <text class="lot__head-s" @tap="clearHistory">清空</text>
          </view>
          <view class="lot__chips">
            <text
              v-for="h in history"
              :key="h"
              class="lot__chip"
              @tap="onPickHistory(h)"
            >{{ h }}
            </text>
          </view>
        </template>
      </template>
      <template v-else-if="state === 'result'">
        <view class="lot__range">
          <view class="lot__range-label">搜索范围</view>
          <t-segmented
            t-class="range__seg"
            block
            :options="radiusOptions"
            :value="radius"
            @change="onRadiusChange"
          />
        </view>
        <view class="lot__sort">
          <view
            v-for="s in sortOptions"
            :key="s.value"
            class="lot__sort-item"
            :class="{'is-on': s.value === sort}"
            @tap="sort = s.value"
          >
            {{ s.label }}
            <t-icon name="chevron-down" size="14" :color="s.value === sort ? '#2b7cd3' : '#909399'"/>
          </view>
          <view class="lot__filter" :class="{'is-on': onlyFree}" @tap="onlyFree = !onlyFree">
            <t-icon name="check" size="12" :color="onlyFree ? '#2b7cd3' : '#c0c4cc'"/>
            <text>只看有空位</text>
          </view>
        </view>
        <text class="lot__count">
          「{{ submittedKeyword }}」附近 {{ radiusOptions[radius].label }} 内找到 {{ resultLots.length }} 个车场
        </text>
        <view class="lot__list">
          <view v-for="lot in resultLots" class="lot__card">
            <view class="lot__card-main">
              <view class="lot__card-name-row">
                <text class="lot__card-name">深南汇购物中心地下车库</text>
                <text class="lot__chip-tag">标准</text>
              </view>
              <text class="lot__card-fee">¥2–5/时 · 每 24 小时封顶 ¥30</text>
              <view class="lot__card-fac">
                <text>充电桩</text>
                <text>电梯直达</text>
                <text>卫生间</text>
              </view>
            </view>
            <view class="lot__card-space">
              <text class="lot__space-num">6</text>
              <text class="lot__space-tip">空闲/180</text>
              <view class="lot__space-dist">300m</view>
            </view>
          </view>
        </view>
      </template>
      <template v-else>
        <view class="lot__empty">
          <view class="lot__empty-icon">
            <t-icon name="search" size="34" color="#a8c7ee"/>
          </view>
          <text class="lot__empty-title">没找到「{{ submittedKeyword }}」相关的车场</text>
          <text class="lot__empty-tip">换个关键词试试，例如「科技园」「购物中心」</text>
          <text class="lot__empty-tip">也可以直接看看附近的车场</text>
        </view>
      </template>
    </view>
  </view>
</template>

<style scoped lang="scss">
.lot {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f6f8;
}

.lot.is-input {
  background: #fff;
}

.lot__nav {
  flex: 0 0 auto;
  background: #fff;
  padding: 5rpx 30rpx 25rpx;
  border-bottom: 1rpx solid #ebeef5;
}

.lot__bar {
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.lot__box {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12rpx;
  box-sizing: border-box;
  height: 84rpx;
  padding: 0 20rpx;
  border-radius: 42rpx;
  background: #f5f7fa;
}

.lot__input {
  flex: 1 1 auto;
  min-width: 0;
  height: 84rpx;
  line-height: 84rpx;
  font-size: 30rpx;
  font-weight: 400;
  color: #303133;
  text-align: left;
}

.lot__clear {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  background: #c8c9cc;
}

.lot__cancel {
  flex: 0 0 auto;
  font-size: 30rpx;
  color: #606266;
}

.lot__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 30rpx;
}

.lot.is-result .lot__body {
  padding: 22rpx 30rpx 25rpx;
  gap: 20rpx;
}

.lot.is-empty .lot__body {
  padding: 0 30rpx 25rpx;
  gap: 0;
}

.lot__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 20rpx 0 25rpx;
}

.lot__head-t {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
}

.lot__head-s {
  font-size: 26rpx;
  color: #909399;
}

.lot__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.lot__chip {
  display: inline-block;
  font-size: 28rpx;
  line-height: 1;
  padding: 20rpx 30rpx;
  border-radius: 37rpx;
  background: #f5f7fa;
  color: #606266;
}

.lot__range {
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.lot__range-label {
  flex: 0 0 auto;
  font-size: 26rpx;
  color: #909399;
}

:deep(.range__seg) {
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

.lot__sort {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 0 5rpx;
  font-size: 29rpx;
  color: #606266;
}

.lot__sort-item {
  display: flex;
  align-items: center;
  gap: 5rpx;
}

.lot__sort-item.is-on {
  color: #2b7cd3;
  font-weight: 600;
}

.lot__filter {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 7rpx;
  font-size: 27rpx;
  line-height: 1;
  padding: 12rpx 22rpx;
  border-radius: 30rpx;
  background: #fff;
  border: 1rpx solid #dcdfe6;
  color: #606266;
}

.lot__filter.is-on {
  border-color: #409eff;
  background: #ecf5ff;
  color: #2b7cd3;
}

.lot__count {
  font-size: 25rpx;
  color: #909399;
  line-height: 1.5;
}

.lot__list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.lot__card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  background: #fff;
  border-radius: 25rpx;
  padding: 25rpx 30rpx;
  box-shadow: 0 2rpx 6rpx rgba(48, 49, 51, 0.04);
}

.lot__card-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 7rpx;
}

.lot__card-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
}

.lot__card-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lot__chip-tag {
  flex: 0 0 auto;
  display: inline-block;
  font-size: 25rpx;
  line-height: 40rpx;
  padding: 0 15rpx;
  border-radius: 10rpx;
  background: #ecf5ff;
  color: #2b7cd3;
}

.lot__chip-tag.is-ok {
  background: #f0f9eb;
  color: #57962f;
}

.lot__card-fee {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #e6a23c;
}

.lot__card-fac {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 5rpx;
}

.lot__card-fac text {
  font-size: 25rpx;
  line-height: 50rpx;
  padding: 0 20rpx;
  border-radius: 12rpx;
  background: #f5f7fa;
  color: #606266;
  border: 1rpx solid #ebeef5;
}

.lot__card-space {
  flex: 0 0 auto;
  text-align: center;
}

.lot__space-num {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  line-height: 1;
  color: #2b7cd3;
  font-family: Consolas, sans-serif;
}

.lot__space-num.is-full {
  color: #909399;
}

.lot__space-tip {
  display: block;
  font-size: 24rpx;
  color: #909399;
}

.lot__space-dist {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #303133;
}

.lot__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 114rpx 0 80rpx;
}

.lot__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 159rpx;
  height: 159rpx;
  border-radius: 50%;
  background: #eef4fd;
}

.lot__empty-title {
  margin-top: 32rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
}

.lot__empty-tip {
  margin-top: 15rpx;
  font-size: 26rpx;
  color: #909399;
  line-height: 1.65;
  text-align: center;
}
</style>
