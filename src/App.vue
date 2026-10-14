<script setup lang="ts">
import {onLaunch, onShow, onHide} from "@dcloudio/uni-app";
import {useBadgeStore} from "@/stores";

onLaunch(() => {
  console.log("App Launch");
});
onShow(() => {
  console.log("App Show");
  useBadgeStore().refreshUnpaid()
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style>
page {
  -webkit-tap-highlight-color: transparent;
}
</style>
