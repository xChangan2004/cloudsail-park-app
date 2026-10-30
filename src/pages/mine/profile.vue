<script setup lang="ts">
import {computed, ref} from 'vue'
import {useUserStore} from '@/stores'
import {updateMyInfo, uploadAvatar} from '@/api/customer'

const userStore = useUserStore()

const nickname = ref(userStore.nickname)
const avatarDraft = ref(userStore.avatar)

/** 上次保存成功的值 */
const savedNickname = ref(userStore.nickname)
const savedAvatar = ref(userStore.avatar)

const uploading = ref(false)
const saving = ref(false)

const PH = 'color:#c0c7d3;font-size:25rpx;font-weight:400'

/** 有改动才让保存按钮亮起来 */
const dirty = computed(() =>
  nickname.value.trim() !== savedNickname.value || avatarDraft.value !== savedAvatar.value
)

const doUpload = async (tempPath: string) => {
  if (uploading.value) return
  uploading.value = true
  uni.showLoading({title: '上传中', mask: true})
  try {
    const url = await uploadAvatar(tempPath)
    // 只进草稿，等用户点保存才落库
    avatarDraft.value = url
    uploading.value = false
    // 必须先关 loading 再 toast，否则 toast 会被 hideLoading 一起吞掉
    uni.hideLoading()
  } catch {
    uploading.value = false
    uni.hideLoading()
  }
}

/** 微信小程序的「头像选择」能力 */
const onChooseAvatar = async (e: any) => {
  const tempPath: string | undefined = e?.detail?.avatarUrl
  if (tempPath) await doUpload(tempPath)
}

/** button 的 click 兜底：App 端没有 chooseAvatar，退回相册 */
const onAvatarClick = () => {
  // #ifdef MP-WEIXIN
  // 小程序端由 chooseavatar 接管，这里什么都不用做
  // #endif

  // #ifndef MP-WEIXIN
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const path = res.tempFilePaths?.[0]
      if (path) await doUpload(path)
    }
  })
  // #endif
}

const onSave = async () => {
  if (!dirty.value || saving.value) return

  const name = nickname.value.trim()
  if (!name) {
    uni.showToast({title: '昵称不能为空', icon: 'none'})
    return
  }

  saving.value = true
  try {
    await updateMyInfo({
      nickname: name,
      avatar: avatarDraft.value || undefined
    })
    savedNickname.value = name
    savedAvatar.value = avatarDraft.value
    nickname.value = name
    userStore.nickname = name
    userStore.avatar = avatarDraft.value
    uni.showToast({title: '已保存', icon: 'success'})
  } catch {
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <view class="pf">
    <t-navbar title="个人信息" left-arrow placeholder/>

    <view class="pf__hero">
      <button
        class="pf__av-btn"
        open-type="chooseAvatar"
        @chooseavatar="onChooseAvatar"
        @click="onAvatarClick"
      >
        <view class="pf__av">
          <image v-if="avatarDraft" class="pf__av-img" :src="avatarDraft" mode="aspectFill"/>
          <view v-else class="pf__av-ph">
            <t-icon name="user" size="56rpx" color="#2b7cd3"/>
          </view>
          <view class="pf__cam">
            <t-icon name="camera" size="22rpx" color="#909399"/>
          </view>
        </view>
      </button>
      <text class="pf__hero-tip">点击更换头像</text>
    </view>
    <view class="pf__list">
      <view class="pf__item">
        <text class="pf__label">昵称</text>
        <input
          v-model="nickname"
          class="pf__input"
          type="nickname"
          :maxlength="20"
          placeholder="请输入昵称"
          :placeholder-style="PH"
        />
      </view>
    </view>

    <view class="pf__save" :class="{'pf__save--off': !dirty || saving}" @click="onSave">
      {{ saving ? '保存中…' : '保存' }}
    </view>
  </view>
</template>

<style scoped lang="scss">
.pf {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f6f8;

  &__hero {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 20rpx 32rpx 0;
    padding: 48rpx 0 40rpx;
    border-radius: 28rpx;
    background: #fff;
    box-shadow: 0 1rpx 6rpx rgba(48, 49, 51, 0.05);
  }

  /* 小程序 button 自带灰底、行高、::after 描边，整组重置掉 */
  &__av-btn {
    width: 168rpx;
    height: 168rpx;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    line-height: normal;
    overflow: visible;

    &::after {
      border: none;
    }
  }

  &__av {
    position: relative;
    width: 168rpx;
    height: 168rpx;
  }

  &__av-img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }

  &__av-ph {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #ecf5ff;
  }

  &__cam {
    position: absolute;
    right: -4rpx;
    bottom: -4rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52rpx;
    height: 52rpx;
    border-radius: 50%;
    border: 1rpx solid #ebeef5;
    background: #fff;
    box-shadow: 0 1rpx 6rpx rgba(48, 49, 51, 0.08);
  }

  &__hero-tip {
    margin-top: 20rpx;
    font-size: 21rpx;
    color: #a8abb2;
  }

  &__list {
    flex: 0 0 auto;
    margin: 20rpx 32rpx 0;
    padding: 0 28rpx;
    border-radius: 28rpx;
    background: #fff;
    box-shadow: 0 1rpx 6rpx rgba(48, 49, 51, 0.05);
  }

  &__item {
    display: flex;
    align-items: center;
    padding: 26rpx 0;
  }

  &__label {
    flex: 0 0 auto;
    margin-right: 24rpx;
    font-size: 26rpx;
    color: #1f2d3d;
  }

  &__input {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 25rpx;
    text-align: right;
    color: #1f2d3d;
  }

  &__save {
    flex: 0 0 auto;
    margin: auto 48rpx calc(48rpx + env(safe-area-inset-bottom));
    height: 92rpx;
    border-radius: 46rpx;
    font-size: 27rpx;
    font-weight: 500;
    line-height: 92rpx;
    text-align: center;
    letter-spacing: 1rpx;
    color: #fff;
    background: linear-gradient(135deg, #409eff, #5ba8ff);
    box-shadow: 0 12rpx 32rpx rgba(64, 158, 255, 0.26);

    &--off {
      color: #b9c2cd;
      background: #e8edf3;
      box-shadow: none;
    }
  }
}
</style>