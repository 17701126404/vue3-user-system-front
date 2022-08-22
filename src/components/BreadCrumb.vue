<template>
  <el-breadcrumb separator-icon="ArrowRight">
    <el-breadcrumb-item v-for="(item, index) in breadList" :key="item.path">
      <router-link to="/welcome" v-if="index == 0">{{
        item.meta.title
      }}</router-link>
      <span v-else>{{ item.meta.title }}</span>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>
<script>
export default {
  name: "BreadCrumb",
  // 计算属性
  computed: {
    breadList() {
      // console.log(this.$route.matched);
      return this.$route.matched;
    },
  },

  // mounted() {
  //   // 打印查看路由对象信息
  //   console.log("router=>", this.$route);
  // },
};
</script>