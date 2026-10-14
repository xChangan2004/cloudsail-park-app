<script setup lang="ts">
import {computed, reactive, ref} from "vue"
import {useNavbarSafe} from "@/hooks/useNavbarSafe";
import {useLocationStore, useSearchHistoryStore} from '@/stores'
import {onLoad, onReachBottom} from '@dcloudio/uni-app'
import {type AppParkingLotQuery, type AppParkingLotVO, getParkingLot, type sortType} from "@/api/parking";

const loc = useLocationStore()
const historyStore = useSearchHistoryStore()

const {heroPaddingTop} = useNavbarSafe()

/** 搜索范围 */
const radiusOptions: { label: string; value: number }[] = [
  {value: 1, label: '1km'},
  {value: 3, label: '3km'},
  {value: 5, label: '5km'},
  {value: 10, label: '10km'},
]
/** 当前选择的搜索范围 */
const radius = ref(5)

const onRadiusChange = (e: { value: number }) => {
  const next = e.value
  if (next === radius.value) return
  radius.value = next
  fetchLots(true)
}

/** 排序范围 */
const sortOptions: { label: string; value: sortType }[] = [
  {label: '智能排序', value: 'smart'},
  {label: '距离', value: 'distance'},
  {label: '价格', value: 'price'},
]

/** 当前选择的排序范围 */
const sort = ref<sortType>('smart')

const onSortChange = (v: sortType) => {
  if (v === sort.value) return
  if (v === 'price') {
    uni.showToast({title: '价格排序暂未开放', icon: 'none'})
    return
  }
  sort.value = v
  fetchLots(true)
}

/** 只看有空位 */
const onlyFree = ref(false)

const onOnlyFreeChange = () => {
  onlyFree.value = !onlyFree.value
  fetchLots(true)
}

/** 输入框内容 */
const keyword = ref('')
/** 已提交的词 */
const submittedKeyword = ref('')

const lots = ref<AppParkingLotVO[]>([])
const total = ref(0)
const loading = ref(false)
const finished = ref(false)

/** 请求参数 */
const query = reactive<AppParkingLotQuery>({
  pageNo: 1,
  pageSize: 10,
})

/** 获取停车场 */
const fetchLots = async (reset = false) => {
  if (loading.value) return
  if (!reset && finished.value) return

  if (reset) {
    query.pageNo = 1
    finished.value = false
  }

  query.name = submittedKeyword.value || undefined
  query.lng = loc.lng
  query.lat = loc.lat
  query.radiusKm = radius.value
  query.onlyFree = onlyFree.value || undefined
  query.sortType = sort.value === 'smart' ? undefined : sort.value

  loading.value = true
  try {
    const res = await getParkingLot(query)
    const list = res.data?.list ?? []
    total.value = Number(res.data?.total ?? 0)
    lots.value = reset ? list : lots.value.concat(list)
    query.pageNo++;
    finished.value = list.length < query.pageSize
  } catch {
    uni.showToast({title: '加载失败，请稍后重试', icon: 'none'})
    if (reset) {
      lots.value = []
      total.value = 0
    }
    finished.value = true
  } finally {
    loading.value = false
  }
}

/** 搜索 */
const onSearch = () => {
  const kw = keyword.value.trim()
  if (!kw) return
  submittedKeyword.value = kw
  historyStore.push(kw)
  /** 收起键盘 */
  uni.hideKeyboard()
  fetchLots(true)
}

/** 清除输入框 */
const onClear = () => {
  keyword.value = ''
  submittedKeyword.value = ''
  lots.value = []
  total.value = 0
  query.pageNo = 1
  finished.value = false
}

/** 退回上一页；被直接打开时回首页 tab */
const onCancel = () => {
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.switchTab({url: "/pages/index/index"})
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
  // 首次加载中还没数据时留在结果页面，别闪一下「没找到」
  if (loading.value && !lots.value.length) return 'result'
  return lots.value.length ? 'result' : 'empty'
})

onLoad(async () => {
  await loc.locate()
})

onReachBottom(() => {
  if (state.value !== 'result') return
  fetchLots()
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
        <template v-if="historyStore.keywords.length">
          <view class="lot__head">
            <text class="lot__head-t">搜索历史</text>
            <text class="lot__head-s" @tap="historyStore.clear()">清空</text>
          </view>
          <view class="lot__chips">
            <text
              v-for="h in historyStore.keywords"
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
            @tap="onSortChange(s.value)"
          >
            {{ s.label }}
            <t-icon name="chevron-down" size="14" :color="s.value === sort ? '#2b7cd3' : '#909399'"/>
          </view>
          <view class="lot__filter" :class="{'is-on': onlyFree}" @tap="onOnlyFreeChange">
            <t-icon name="check" size="12" :color="onlyFree ? '#2b7cd3' : '#c0c4cc'"/>
            <text>只看有空位</text>
          </view>
        </view>
        <view class="lot__list">
          <lot-card
            v-for="lot in lots"
            :key="lot.id"
            :lot="lot"
          />
        </view>
        <view v-if="loading" class="lot__tip">加载中…</view>
        <view v-else-if="!finished && lots.length" class="lot__tip">
          上拉加载更多 · 已显示 {{ lots.length }} / {{ total }}
        </view>
        <view v-else-if="finished" class="lot__tip">没有更多数据</view>
      </template>
      <template v-else>
        <view class="lot__empty">
          <view class="lot__empty-icon">
            <t-icon name="search" size="34" color="#a8c7ee"/>
          </view>
          <text class="lot__empty-title">没找到「{{ submittedKeyword }}」相关的车场</text>
          <text class="lot__empty-tip">换个关键词试试</text>
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

.lot__list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.lot__tip {
  padding: 10rpx 0 40rpx;
  text-align: center;
  font-size: 26rpx;
  color: #a8abb2;
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
