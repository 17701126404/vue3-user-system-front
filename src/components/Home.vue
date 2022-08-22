<template>
  <div class="basic-layout">
    <div :class="['nav-side', isCollapse ? 'fold' : 'unfold']">
      <!-- logo -->
      <div class="logo">
        <img src="./../assets/logo.png" alt="" />
        <span>Manager</span>
      </div>

      <!-- 加载menu组件 -->
      <el-menu
        :default-active="activeMenu"
        background-color="#001529"
        class="nav-menu"
        text-color="#fff"
        router
        :collapse="isCollapse"
      >
        <!-- 动态传递一个    :userMenu 对象  数据是后台获取的-->
        <tree-menu :userMenu="userMenu"></tree-menu>
      </el-menu>

      <!-- ------------------ -->
      <!-- 侧边菜单 -->
      <!-- <el-menu
        background-color="#001529"
        class="nav-menu"
        default-active="2"
        text-color="#fff"
        router
        :collapse="isCollapse"
      > -->
      <!-- 一级菜单 -->
      <!-- <el-sub-menu index="1">
          <template #title>
            <el-icon><location /></el-icon>
            <span>系统管理</span>
          </template> -->
      <!-- 二级菜单 -->
      <!-- <el-menu-item index="1-1">用户管理</el-menu-item>
          <el-menu-item index="1-2">菜单管理</el-menu-item> -->
      <!-- </el-sub-menu> -->
      <!-- 一级菜单 -->
      <!-- <el-sub-menu index="2">
          <template #title>
            <el-icon><location /></el-icon>
            <span>审批管理</span>
          </template> -->
      <!-- 二级菜单 -->
      <!-- <el-menu-item index="2-1">休假申请</el-menu-item>
          <el-menu-item index="2-2">带我审批</el-menu-item>
        </el-sub-menu>
      </el-menu> -->
    </div>

    <div :class="['content-right', isCollapse ? 'fold' : 'unfold']">
      <div class="nav-top">
        <div class="nav-left">
          <!-- 伸缩栏按钮 -->
          <div class="menu-fold" @click="toggle">
            <el-icon><Fold /></el-icon>
          </div>

          <div class="bread">
            <!-- 加载面包屑组件 -->
            <bread-crumb></bread-crumb>
          </div>
        </div>

        <div class="user-info">
          <el-badge
            :is-dot="noticeCount > 0 ? true : false"
            class="notice"
            @click="$router.push('/audit/approve')"
            ><el-icon><Bell /></el-icon
          ></el-badge>

          <!-- 用户 -->
          <el-dropdown @command="handleLogout">
            <span class="user-link">
              {{ userInfo.userName
              }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="email"
                  >邮箱:{{ userInfo.userEmail }}</el-dropdown-item
                >
                <el-dropdown-item command="logout">退出 </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div class="wrapper">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script>
// 注册组件
import TreeMenu from "./TreeMenu.vue";
import BreadCrumb from "./BreadCrumb.vue";

export default {
  name: "Home",
  // 注册
  components: { TreeMenu, BreadCrumb },

  data() {
    return {
      isCollapse: false,
      userInfo: this.$store.state.userInfo,
      noticeCount: 0,
      userMenu: [],
      activeMenu: location.hash.slice(1),
    };
  },
  computed: {
    noticeCount() {
      return this.$store.state.noticeCount;
    },
  },
  // 挂载
  mounted() {
    this.getNoticeCount();
    this.getMenuList();
  },

  // 定义方法
  methods: {
    // 菜单栏切换
    toggle() {
      this.isCollapse = !this.isCollapse;
    },

    // 退出登录
    handleLogout(key) {
      if (key == "email") return;
      console.log(key);
      this.$store.commit("saveUserInfo", "");
      this.userInfo = {};
      this.$router.push("/login");
    },

    // 异步调用小红点
    async getNoticeCount() {
      try {
        const count = await this.$api.noticeCount();
        this.$store.commit("saveNoticeCount", count);
        this.noticeCount = count;
      } catch (error) {
        console.error(error);
      }
    },

    // 递归生成菜单
    async getMenuList() {
      try {
        const { menuList, actionList } = await this.$api.getPermissionList();
        this.$store.commit("saveMenuList", menuList);
        this.$store.commit("saveActionList", actionList);
        this.userMenu = menuList;
      } catch (error) {
        console.error(error);
      }
    },
  },
};
</script>


<style lang="scss">
.basic-layout {
  position: relative;
  .nav-side {
    position: fixed;
    width: 200px;
    height: 100vh;
    background-color: #001529;
    color: #fff;
    overflow-y: auto;
    transition: width 0.5s;
    .logo {
      display: flex;
      align-items: center;
      font-size: 18px;
      height: 50px;
      img {
        margin: 0 16px;
        width: 32px;
        height: 32px;
      }
    }
    .nav-menu {
      border-right: none;
      background-color: #001529;
    }
    // 合并
    &.fold {
      width: 64px;
    }
    // 展开
    &.unfold {
      width: 200px;
    }
  }
  .content-right {
    margin-left: 200px;
    // 合并
    &.fold {
      margin-left: 64px;
    }
    // 展开
    &.unfold {
      margin-left: 200px;
    }
    .nav-top {
      height: 50px;
      line-height: 50px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #ddd;
      padding: 0 20px;
      .nav-left {
        display: flex;
        align-items: center;
        .menu-fold {
          margin-right: 15px;
          font-size: 18px;
        }
      }
      .user-info {
        .notice {
          line-height: 30px;
          margin-right: 15px;
          cursor: pointer;
        }
        .user-link {
          line-height: 40px;
          cursor: pointer;
          color: #409eff;
        }
      }
    }
    .wrapper {
      background: #eaebeb;
      padding: 20px;
      height: calc(100vh - 50px);
    }
  }
}
</style>