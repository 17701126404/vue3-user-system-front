<template>
  <div class="login-wrapper">
    <div class="modal">
      <!-- 
        el-form 表单属性
        ref="userForm" : 用于表单验证
        :model="user" ： 用于双向数据传递
        :rules="rules" ： 用于表单验证规则
       -->
      <el-form ref="userForm" :model="user" status-icon :rules="rules">
        <div class="title">火星</div>
        <!-- 
          el-form-item 表单子项属性
           prop="userName" ：验证需要 prop
         -->
        <el-form-item prop="userName">
          <!-- 
            type="text" ：类型
             v-model="user.userName" ：输入框数据
           -->
          <el-input
            type="text"
            prefix-icon="el-icon-user"
            v-model="user.userName"
          />
        </el-form-item>
        <el-form-item prop="pwd">
          <el-input
            type="password"
            prefix-icon="el-icon-view"
            v-model="user.pwd"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="btn-login" @click="login"
            >登录</el-button
          >
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import utils from "./../utils/utils";
// 本地存储
import storage from "./../utils/storage";
// options api
export default {
  // 页面名字
  name: "login",
  // 数据定义data
  data() {
    // 返回一个对象
    return {
      // 用户账号密码
      user: {
        userName: "admin123",
        pwd: "123",
      },
      // 表单验证规则
      rules: {
        userName: [
          {
            required: true,
            message: "请输入用户名",
            trigger: "blur",
          },
        ],
        pwd: [
          {
            required: true,
            message: "请输入密码",
            trigger: "blur",
          },
        ],
      },
    };
  },
  // 定义方法
  methods: {
    // 登录函数
    login() {
      // 表单验证
      this.$refs.userForm.validate((valid) => {
        // 判断
        if (valid) {
          // 异步网络请求 参数 this.user  .then()接收
          this.$api.login(this.user).then(async (res) => {
            // 提交到本地存储
            this.$store.commit("saveUserInfo", res);
            // 异步加载动态路由
            await this.loadAsyncRoutes();
            // 路由跳转
            this.$router.push("/welcome");
          });
        } else {
          return false;
        }
      });
    },
    // 动态路由
    async loadAsyncRoutes() {
      // 获取本地用户信息
      let userInfo = storage.getItem("userInfo") || {};
      // 判断token存在
      if (userInfo.token) {
        try {
          // 请求用户菜单权限 解构获取数据
          const { menuList } = await this.$api.getPermissionList();
          // 工具函数封装的递归菜单  结果 routes 接收
          let routes = utils.generateRoute(menuList);
          // console.log(routes);
          // 遍历
          routes.map((route) => {
            // console.log(`./../views/${route.component}.vue`);
            // 拼接组件路径
            let url = `./../views/${route.component}.vue`;
            // console.log(url);
            // console.log(route.component);
            //
            route.component = () => import(url);

            // console.log(this.$router);
            // this.router.addRoute("home", route);
            // 动态添加到router
            this.$router.addRoute("home", route);
          });
        } catch (error) {}
      }
    },
    goHome() {
      this.$router.push("/welcome");
    },
  },
};
</script>

<style lang="scss">
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f9fcff;
  width: 100vw;
  height: 100vh;
  .modal {
    width: 500px;
    padding: 50px;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0px 0px 10px 3px #c7c9cb4d;
    .title {
      font-size: 50px;
      line-height: 1.5;
      text-align: center;
      margin-bottom: 30px;
    }
    .btn-login {
      width: 100%;
    }
  }
}
</style>