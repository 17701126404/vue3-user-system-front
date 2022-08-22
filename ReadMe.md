# 一，开始阶段

## 全局安装 yarn

 ```js
1. npm install -g yarn
2. npm install create-vite-app -g 本地创建项目
3. yarn install 安装依赖
4. yarn add vue-router@next vuex@next element-plus axios -S 安装项目所需插件 -S 是生产依赖(dependencies) -S 开发依赖
5. yarn add sass -D 安装 sass -D 开发依赖(devDependencies)
6. 启动项目 yarn dev   启动服务  yar dev
 ```

   ## vite.config.js 项目配置

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    // 服务代理
  server: {
    host: 'localhost',
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000"
      }
    }
  },
  plugins: [vue()]
})

```



## 环境变量和模式   env.dev

开发模式    package.json

```
 //    --mode dev
 "scripts": {
    "dev": "vite --mode dev",
    "build": "vite build"
  },
```

环境变量    .env.dev

```
NODE_ENV=development   开发模式
VITE_Name=jack     环境名字
```



## 路由的封装     router

  router-index

1. ```js
   import { createRouter, createWebHashHistory } from "vue-router";
   import Home from './../components/Home.vue'
   
   
   const routes = [
     {
       name: 'home',
       path: '/',
       meta: {
         title: '首页'
       },
       component: Home,
       redirect: '/welcome',
       children: [
         {
           name: 'welcome',
           path: '/welcome',
           meta: {
          title: '欢迎体验Vue3全栈课程'
           },
           component: () => import('../views/Welcome.vue')
         }
       ]
     },
     {
       name: 'login',
       path: '/login',
       meta: {
         title: '登录'
       },
       component: () => import('../views/Login.vue')
     },
   ]
   
   // 导出路由
   const router = createRouter({
     history: createWebHashHistory(),
     routes
   })
   export default router
   ```
   
   
   
2. 路由跳转 3 个方式
   ```js
   1. this.$router.push('/login')
   2. <router-link to="/login">
   3. const router = useRouter() router.push('/login')
   ```
   
   

## 环境配置封装     env

1. config-index 

   ```js
   // 环境配置
   
   
   const env = import.meta.env.MODE || 'prod';
   const EnvConfig = {
     dev: {
       baseApi: '/api',
       mockApi: 'https://www.fastmock.site/mock/86d52c75ad7f131c61d02db8bbfc710f/api'
     },
     test: {
       baseApi: '//test.futurefe.com/api',
       mockApi: 'https://www.fastmock.site/mock/86d52c75ad7f131c61d02db8bbfc710f/api'
     },
     prod: {
       baseApi: '//futurefe.com/api',
       mockApi: 'https://www.fastmock.site/mock/86d52c75ad7f131c61d02db8bbfc710f/api'
     }
   }
   export default {
     env,
     mock: true,
     namespace: 'manager',
     ...EnvConfig[env]
   }
   ```

   

2. 使用 mock 模拟接口

## request 封装

utils -request
封装 axios

```js
/**
 * axios二次封装
 */
import axios from 'axios'
import config from './../config'
import { ElMessage } from 'element-plus'
import router from './../router'
import storage from './storage'

const TOKEN_INVALID = 'Token认证失败，请重新登录'
const NETWORK_ERROR = '网络请求异常，请稍后重试'

// 创建axios实例对象，添加全局配置
const service = axios.create({
  baseURL: config.baseApi,
  timeout: 8000
})

// 请求拦截
service.interceptors.request.use((req) => {
  const headers = req.headers;
  const { token = "" } = storage.getItem('userInfo') || {};
  if (!headers.Authorization) headers.Authorization = 'Bearer ' + token;
  return req;
})

// 响应拦截
service.interceptors.response.use((res) => {
  const { code, data, msg } = res.data;
  if (code === 200) {
    return data;
  } else if (code === 500001) {
    ElMessage.error(TOKEN_INVALID)
    setTimeout(() => {
      router.push('/login')
    }, 1500)
    return Promise.reject(TOKEN_INVALID)
  } else {
    ElMessage.error(msg || NETWORK_ERROR)
    return Promise.reject(msg || NETWORK_ERROR)
  }
})
/**
 * 请求核心函数
 * @param {*} options 请求配置
 */
function request(options) {
  options.method = options.method || 'get'
  if (options.method.toLowerCase() === 'get') {
    options.params = options.data;
  }
  let isMock = config.mock;
  if (typeof options.mock != 'undefined') {
    isMock = options.mock;
  }
  if (config.env === 'prod') {
    service.defaults.baseURL = config.baseApi
  } else {
    service.defaults.baseURL = isMock ? config.mockApi : config.baseApi
  }

  return service(options)
}

['get', 'post', 'put', 'delete', 'patch'].forEach((item) => {
  request[item] = (url, data, options) => {
    return request({
      url,
      data,
      method: item,
      ...options
    })
  }
})

export default request;

```



## localStorage 封装

utils-storage

```js
/**
 * Storage二次封装
 * @author JackBean
 */


// localStorage 的四个api
import config from './../config'
export default {
  setItem(key, val) {
    let storage = this.getStroage();
    storage[key] = val;
    window.localStorage.setItem(config.namespace, JSON.stringify(storage));
  },
  getItem(key) {
    return this.getStroage()[key]
  },
  getStroage() {
    return JSON.parse(window.localStorage.getItem(config.namespace) || "{}");
  },
  clearItem(key) {
    let storage = this.getStroage()
    delete storage[key]
    window.localStorage.setItem(config.namespace, JSON.stringify(storage));
  },
  clearAll() {
    window.localStorage.clear()
  }
}
```

## vuex状态管理

store-index

```js
/**
 * Vuex状态管理
 */
import { createStore } from 'vuex'
import mutations from './mutations'
import storage from './../utils/storage'

const state = {
  userInfo: storage.getItem("userInfo") || {}, // 获取用户信息
  menuList: storage.getItem("menuList"),
  actionList: storage.getItem("actionList"),
  noticeCount: 0
}
export default createStore({
  state,
  mutations
})
```

store-mutations

```js
/**
 * Mutations业务层数据提交
 */
import storage from './../utils/storage'

export default {
  saveUserInfo(state, userInfo) {
    state.userInfo = userInfo;
    storage.setItem('userInfo', userInfo)
  },
  saveMenuList(state, menuList) {
    state.menuList = menuList;
    storage.setItem('menuList', menuList)
  },
  saveActionList(state, actionList) {
    state.actionList = actionList;
    storage.setItem('actionList', actionList)
  },
  saveNoticeCount(state, noticeCount) {
    state.noticeCount = noticeCount;
    storage.setItem('noticeCount', noticeCount)
  }
}
```

## gitignore 提交忽略文件

```
node_modules
.DS_Store
dist
dist-ssr
*.local
```

## 用户登录逻辑 login

``` js
methods: {
    login() {
      // console.log(0);
      this.$refs.userForm.validate((valid) => {
        if (valid) {
          this.$api.login(this.user).then(async (res) => {
            console.log(res);
            this.$store.commit("saveUserInfo", res);
            // await this.loadAsyncRoutes();
            this.$router.push("/welcome");
          });
        } else {
          return false;
        }
      });
    },
  },
```

## Main 入口文件

```js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import request from './utils/request'
import storage from './utils/storage'
import api from './api'
import store from './store'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
console.log("环境变量=>", import.meta.env)

// axios.get(config.mockApi + '/login').then((res) => {
//   console.log(res);
// })



//  创建 app 实例对象
const app = createApp(App)

//  icon
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}



app.config.globalProperties.$api = api     // 全局挂载api
app.config.globalProperties.$request = request // 全局挂载 request
app.config.globalProperties.$storage = storage// 全局挂载storage
app
  .use(router)
  .use(ElementPlus)
  .use(store)
  .mount('#app')

```



## 接口   api

```js

api

import request from './../utils/request'

export default {
  login(params) {
    return request({
      url: '/users/login',
      method: 'post',
      data: params,
    })
  },
    
}

```



### 总结：

```
1.如何创建 vite 项目
2. yarn 的基本使用
3. 项目的开发环境变量配置
4. 路由的封装，进行页面跳转
5. 本地存储的高效封装
6. vuex 管理用户数据
7. 学会使用 gitignore  忽略文件提交
8. 用户登录的基本逻辑
9. 用户登录接口 api
10. mock：true 开启调用模拟接口
```



# 二，前台首页实现

## 菜单栏接口

``` js
api 

import request from './../utils/request'

export default {
    // 登录
  login(params) {
    return request({
      url: '/users/login',
      method: 'post',
      data: params,
    })
  },

    //小点
  noticeCount(params) {
    return request({
      url: '/leave/count',
      method: 'get',
      data: {},
    })
  }, 

// 菜单栏
  getMenuList() {
    return request({
      url: '/menu/list',
      method: 'get',
      data: {},
    })
  },
}

```



## 封装组件  components

#### 菜单树

```vue
<template>
  <!-- 菜单 -->

  <!-- 一个模板包裹 -->
  <template v-for="menu in userMenu" :key="menu._id">
    <el-sub-menu
      v-if="
        menu.children &&
        menu.children.length > 0 &&
        menu.children[0].menuType == 1
      "
      :index="menu.path"
    >
      <template #title>
        <el-icon><location /></el-icon>
        <span>{{ menu.menuName }}</span>
      </template>
      <!-- 二级菜单 -->
      <tree-menu :userMenu="menu.children"></tree-menu>
    </el-sub-menu>
    <el-menu-item
      v-else-if="menu.menuType == 1"
      :index="menu.path"
      :key="menu._id"
      >{{ menu.menuName }}</el-menu-item
    >
  </template>
</template>

<script>
export default {
  name: "TreeMenu",
  // 接收父组件  props
  props: {
    userMenu: {
      type: Array,
      default() {
        return [];
      },
    },
  },
};
</script>

// 使用递归调用接口数据渲染 菜单树

<style>
</style>
```

#### 面包屑

```vue
<template>
  <el-breadcrumb :separator-icon="ArrowRight">
    <el-breadcrumb-item v-for="item in breadList" :key="item.path">
      <router-link to="/welcome" v-if="index == 0">{{
        item.meta.title
      }}</router-link>
      <span v-else>{{ item.meta.title }}</span></el-breadcrumb-item
    >
  </el-breadcrumb>
</template>
<script>
export default {
  name: "BreadCrumb",
  // 计算属性
  computed: {
    breadList() {
      return this.$route.matched;
    },
  },

  // mounted() {
  //   // 打印查看路由对象信息
  //   console.log("router=>", this.$route);
  // },
};
</script>
```

#### 首页

```vue
// 菜单栏 和 面包屑 注册到 首页

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
          <el-badge :is-dot="noticeCount > 0 ? true : false" class="notice"
            ><el-icon><Bell /></el-icon
          ></el-badge>

          <!-- 用户 -->
          <el-dropdown @command="handleLogout">
            <span class="user-link">
              {{ userInfo.username
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
        <div class="main-home">
          <router-view></router-view>
        </div>
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
      this.userInfo = null;
      this.$router.push("/login");
    },

    // 异步调用小红点
    async getNoticeCount() {
      try {
        const count = await this.$api.noticeCount();
        this.noticeCount = count;
      } catch (error) {
        console.error(error);
      }
    },

    // 递归生成菜单
    async getMenuList() {
      try {
        const list = await this.$api.getMenuList();
        this.userMenu = list;
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
      height: calc(100vh - 50px);
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
      // height: 100%;
      .main-home {
        background: #fff;
        height: 74%;
      }
    }
  }
}
</style>
```

## Views 视图

```vue
// welcome 页面     
views  用户可见页面文件夹

<template>
  <div class="welcome">
    <div class="content">
      <div class="sub-title">欢迎体验</div>
      <div class="title">慕课通用后台管理系统</div>
      <div class="desc">
        - Vue3.0+ElementPlus+Node+Mongo打造通用后台管理系统
      </div>
    </div>
    <div class="img"></div>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
};
</script>
 
 <style lang="scss">
.welcome {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #fff;
  .content {
    position: relative;
    height: 100%;
    top: 30%;
    .sub-title {
      font-size: 30px;
      line-height: 42px;
      color: #333;
    }
    .title {
      font-size: 40px;
      line-height: 62px;
      color: #409eff;
    }
    .desc {
      text-align: right;
      font-size: 14px;
      color: #999;
    }
  }
  .img {
    margin-left: 105px;
    background-image: url("./../assets/images/welcome.png");
    width: 371px;
    height: 438px;
  }
}
</style>
```

## Element-plus   icon使用

```js
main.js
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import * as ElementPlusIconsVue from '@element-plus/icons-vue'

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

const app = createApp(App)
app.use(ElementPlus)
```

## config 配置

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
const path = require('path')

// https://vitejs.dev/config/
export default defineConfig({
  // 配置路径别名
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // css: {
  //   preprocessorOptions: {
  //     scss: {
  //       additionalData: `@import '@/assets/style/base.scss';`
  //     }
  //   }
  // },
    //  代理本地服务
  server: {
    host: 'localhost',
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000"
      }
    }
  },
  plugins: [vue()]
})

```



### 总结

```
1. 数据接口
2. 封装所需组件
3. 图标的使用
4. config 配置
```

# 三，用户管理

### User页面搭建  

```vue
<template>
  <div class="user-manage">
    <!--  -->
    <div class="query-form">
      <el-form ref="form" :inline="true" :model="user">
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="user.userId" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item label="用户名称" prop="username">
          <el-input v-model="user.username" placeholder="请输入用户名称" />
        </el-form-item>
        <el-form-item label="状态" prop="state">
          <el-select v-model="user.state">
            <el-option :value="0" label="所有"></el-option>
            <el-option :value="1" label="在职"></el-option>
            <el-option :value="2" label="离职"></el-option>
            <el-option :value="3" label="试用期"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset('form')">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <!--  -->
    <div class="base-table">
      <div class="action">
        <el-button type="primary" @click="handleCreate">新增</el-button>
        <el-button type="danger" @click="handlePatchDel">批量删除</el-button>
      </div>
      <el-table :data="userList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column
          v-for="item in columns"
          :key="item.prop"
          :prop="item.prop"
          :label="item.label"
          :width="item.width"
          :formatter="item.formatter"
        >
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="scope">
            <el-button @click="handleEdit(scope.row)" size="small"
              >编辑</el-button
            >
            <el-button type="danger" size="small" @click="handleDel(scope.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        background
        layout="prev, pager, next"
        :total="pager.total"
        :page-size="pager.pageSize"
        @current-change="handleCurrentChange"
      />
    </div>
    <!-- 新增/编辑弹框 -->
    <el-dialog width="35%" title="用户新增" v-model="showModal">
      <el-form
        ref="dialogForm"
        :model="userForm"
        label-width="100px"
        :rules="rules"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="userForm.username"
            :disabled="action == 'edit'"
            placeholder="请输入用户名称"
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="userEmail">
          <el-input
            v-model="userForm.userEmail"
            :disabled="action == 'edit'"
            placeholder="请输入用户邮箱"
          >
            <template #append>@qq.com</template>
          </el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="userForm.mobile" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="岗位" prop="job">
          <el-input v-model="userForm.job" placeholder="请输入岗位" />
        </el-form-item>
        <el-form-item label="状态" prop="state">
          <el-select v-model="userForm.state">
            <el-option :value="1" label="在职"></el-option>
            <el-option :value="2" label="离职"></el-option>
            <el-option :value="3" label="试用期"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="系统角色" prop="roleList">
          <el-select
            v-model="userForm.roleList"
            placeholder="请选择用户系统角色"
            multiple
            style="width: 100%"
          >
            <el-option
              v-for="role in roleList"
              :key="role._id"
              :label="role.roleName"
              :value="role._id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="部门" prop="deptId">
          <el-cascader
            v-model="userForm.deptId"
            placeholder="请选择所属部门"
            :options="deptList"
            :props="{ checkStrictly: true, value: '_id', label: 'deptName' }"
            clearable
            style="width: 100%"
          ></el-cascader>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" @click="handleSubmit">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script>
import { getCurrentInstance, onMounted, reactive, ref, toRaw } from "vue";
import utils from "./../utils/utils";

export default {
  name: "user",
  setup() {
    // 获取Composition API 上下文对象
    const { ctx, proxy } = getCurrentInstance();
    // 初始化用户表单对象
    const user = reactive({
      state: 1,
    });
    // 初始化用户列表数据
    const userList = ref([]);
    // 初始化分页对象
    const pager = reactive({
      pageNum: 1,
      pageSize: 10,
    });
    // 选中用户列表对象
    const checkedUserIds = ref([]);
    // 弹框显示对象
    const showModal = ref(false);
    // 新增用户Form对象
    const userForm = reactive({
      state: 3,
    });
    // 角色列表
    const roleList = ref([]);
    // 部门列表
    const deptList = ref([]);
    // 定义用户操作行为
    const action = ref("add");
    // 定义表单校验规则
    const rules = reactive({
      username: [
        {
          required: true,
          message: "请输入用户名称",
          trigger: "blur",
        },
      ],
      userEmail: [
        { required: true, message: "请输入用户邮箱", trigger: "blur" },
      ],
      mobile: [
        {
          pattern: /1[3-9]\d{9}/,
          message: "请输入正确的手机号格式",
          trigger: "blur",
        },
      ],
      deptId: [
        {
          required: true,
          message: "请选择部门",
          trigger: "blur",
        },
      ],
    });
    // 定义动态表格-格式
    const columns = reactive([
      {
        label: "用户ID",
        prop: "userId",
      },
      {
        label: "用户名",
        prop: "username",
      },
      {
        label: "用户邮箱",
        prop: "userEmail",
      },
      {
        label: "用户角色",
        prop: "role",
        formatter(row, column, value) {
          return {
            0: "管理员",
            1: "普通用户",
          }[value];
        },
      },
      {
        label: "用户状态",
        prop: "state",
        formatter(row, column, value) {
          return {
            1: "在职",
            2: "离职",
            3: "试用期",
          }[value];
        },
      },
      {
        label: "注册时间",
        prop: "createTime",
        width: 180,
        formatter: (row, column, value) => {
          return utils.formateDate(new Date(value));
        },
      },
      {
        label: "最后登录时间",
        prop: "lastLoginTime",
        width: 180,
        formatter: (row, column, value) => {
          return utils.formateDate(new Date(value));
        },
      },
    ]);

    // 初始化接口调用
    onMounted(() => {
      getUserList();
      getRoleAllList();
      getDeptList();
    });
    // 获取用户列表
    const getUserList = async () => {
      let params = { ...user, ...pager };
      const { list, page } = await proxy.$api.getUserList(params);
      userList.value = list;
      // console.log(userList.value);
      pager.total = page.total;
    };

    // 查询
    const handleQuery = () => {
      getUserList();
    };
    // 重置
    const handleReset = (form) => {
      proxy.$refs[form].resetFields();
    };
    // 分页
    const handleCurrentChange = (current) => {
      pager.pageNum = current;
      getUserList();
    };
    // 删除
    const handleDel = async (row) => {
      const id = await proxy.$api.userDel({
        userIds: [row.userId], // 可单个删除,也可批量删除
      });
      // console.log([row.userId]);
      proxy.$message.success("删除成功");
      getUserList();
    };
    // 批量删除
    const handlePatchDel = async () => {
      if (checkedUserIds.value.length == 0) {
        proxy.$message.error("请选择要删除的用户");
        return;
      }
      const userId = checkedUserIds.value.map(function (i, index, arr) {
        // console.log(i.userId);
        return i.userId;
      });
      console.log(userId);

      const res = await proxy.$api.userDel({
        // userIds: checkedUserIds.value, // 可单个删除,也可以批量删除
        userIds: userId,
      });

      if (res) {
        proxy.$message.success("删除成功");
        getUserList();
      } else {
        proxy.$message.success("删除失败");
      }
    };
    // 表格多选
    const handleSelectionChange = (list) => {
      let arr = [];
      list.map((item) => {
        arr.push(item.userId);
      });
      checkedUserIds.value = list;
    };
    // 用户新增
    const handleCreate = () => {
      action.value = "add";
      showModal.value = true;
    };
    // 获取角色
    const getRoleAllList = async () => {
      let res = await proxy.$api.getRoleAllList();
      roleList.value = res;
    };
    // 获取部门
    const getDeptList = async () => {
      let res = await proxy.$api.getDeptList();
      deptList.value = res;
    };
    // 用户弹窗关闭
    const handleClose = () => {
      showModal.value = false;
      handleReset("dialogForm");
    };
    // 用户提交
    const handleSubmit = () => {
      proxy.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          let params = toRaw(userForm);
          params.userEmail += "@qq.com";
          params.action = action.value;
          let res = await proxy.$api.userSubmit(params);
          if (res) {
            showModal.value = false;
            proxy.$message.success("用户创建成功");
            handleReset("dialogForm");
            getUserList();
          }
        }
      })
    };
    // 用户编辑
    const handleEdit = (row) => {
      action.value = "edit";
      showModal.value = true;
      proxy.$nextTick(() => {
        Object.assign(userForm, row);
      });
    };
    return {
      user,
      userList,
      columns,
      pager,
      checkedUserIds,
      showModal,
      userForm,
      rules,
      roleList,
      deptList,
      action,
      getUserList,
      handleQuery,
      handleReset,
      handleCurrentChange,
      handleDel,
      handlePatchDel,
      handleSelectionChange,
      handleCreate,
      getRoleAllList,
      getDeptList,
      handleClose,
      handleSubmit,
      handleEdit,
    };
  },
};
</script>

<style lang="scss"></style>

```

### Utils 工具函数封装

```js
/**
 * 工具函数封装
 */
export default {
  formateDate(date, rule) {
    let fmt = rule || 'yyyy-MM-dd hh:mm:ss'
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, date.getFullYear())
    }
    const o = {
      // 'y+': date.getFullYear(),
      'M+': date.getMonth() + 1,
      'd+': date.getDate(),
      'h+': date.getHours(),
      'm+': date.getMinutes(),
      's+': date.getSeconds()
    }
    for (let k in o) {
      if (new RegExp(`(${k})`).test(fmt)) {
        const val = o[k] + '';
        fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? val : ('00' + val).substr(val.length));
      }
    }
    return fmt;
  },
  generateRoute(menuList) {
    let routes = []
    const deepList = (list) => {
      while (list.length) {
        let item = list.pop()
        if (item.action) {
          routes.push({
            name: item.component,
            path: item.path,
            meta: {
              title: item.menuName
            },
            component: item.component
          })
        }
        if (item.children && !item.action) {
          deepList(item.children)
        }
      }
    }
    deepList(menuList)
    return routes;
  }
}
```



### Router 更新

```js
import { createRouter, createWebHashHistory } from "vue-router";
import Home from './../components/Home.vue'


const routes = [
  {
   ......
    children: [
      {
       ......
      },
      {
        name: 'user',
        path: '/user',
        meta: {
          titke: '用户管理',
        },
        component: () => import('../views/User.vue')
      }
    ]
  },
  {
   ......
  },
]

// 导出路由
const router = createRouter({
  ......
})
export default router
```

### api 接口封装请求

```js
/**
 * api管理
 */
import request from './../utils/request'
export default {
  // 登录
  login(params) {
   ...
  },
  // 小点
  noticeCount(params) {
    ...
  },
  // 菜单栏
  getMenuList(params) {
   ...
  },
  // 
  getPermissionList() {
    ...
  },
  // 用户列表
  getUserList(params) {
    return request({
      url: '/users/list',
      method: 'get',
      data: params,
      mock: false
    })
  },
  // 所有用户列表
  getAllUserList() {
    ...
  },
  // 用户删除
  userDel(params) {
    return request({
      url: '/users/delete',
      method: 'post',
      data: params,
      mock: false
    })
  },
  // 所有角色列表
  getRoleAllList() {
    ...
  },
  // 角色列表
  getRoleList(params) {
    return request({
      url: '/roles/list',
      method: 'get',
      data: params,
      mock: true
    })
  },
  // 部门列表
  getDeptList(params) {
    return request({
      url: '/dept/list',
      method: 'get',
      data: params,
      mock: true
    })
  },
  // 操作
  deptOperate(params) {
    return request({
      url: '/dept/operate',
      method: 'post',
      data: params,
      mock: false
    })
  },
  // 用户提交表单
  userSubmit(params) {
    return request({
      url: '/users/operate',
      method: 'post',
      data: params,
      mock: false
    })
  },
  // 菜单提交
  menuSubmit(params) {
   ...
  },
  // 
  roleOperate(params) {
   ...
  },
  updatePermission(params) {
    ...
  },
  getApplyList(params) {
    ...
  },
  leaveOperate(params) {
   ...
  },
  leaveApprove(params) {
   ...
  }
}
```

#### 总结

```
1. view文件夹搭建用户管理页面 User.vue
（重点：对组件库的使用，vue3新特性的使用，接口操作，代码逻辑）
2. 工具函数封装
3. 路由更新 User 路径
4. 封装请求接口
5. mock的开关，接口联调
```

# 四，菜单管理

### 接口

```js
/**
 * api管理
 */
import request from './../utils/request'
export default {
	......
    
  // 菜单栏列表
  getMenuList(params) {
    return request({
      url: '/menu/list',
      method: 'get',
      data: params,
      // mock: true
    })
  },
 
  // 操作-添加，删除
  deptOperate(params) {
    return request({
      url: '/dept/operate',
      method: 'post',
      data: params,
      mock: false
    })
  },
 
  // 菜单编辑、创建的提交
  menuSubmit(params) {
    return request({
      url: '/menu/operate',
      method: 'post',
      data: params,
      mock: false
    })
  },
      
	.......
}
```

### Menu页面搭建

```vue
<template>
  <div class="user-manage">
    <!--  表单-->
    <div class="query-form">
      <el-form ref="form" :inline="true" :model="queryForm">
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="queryForm.menuName" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="菜单状态" prop="menuState">
          <el-select v-model="queryForm.menuState">
            <el-option :value="1" label="正常"></el-option>
            <el-option :value="2" label="停用"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getMenuList">查询</el-button>
          <el-button @click="handleReset('form')">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <!-- 表格 -->
    <div class="base-table">
      <div class="action">
        <el-button type="primary" @click="handleAdd(1)">新增</el-button>
      </div>
      <el-table
        :data="menuList"
        row-key="_id"
        :tree-props="{ children: 'children' }"
      >
        <el-table-column
          v-for="item in columns"
          :key="item.prop"
          :prop="item.prop"
          :label="item.label"
          :width="item.width"
          :formatter="item.formatter"
        >
        </el-table-column>
        <el-table-column label="操作" width="230">
          <template #default="scope">
            <el-button
              @click="handleAdd(2, scope.row)"
              type="primary"
              size="small"
              >新增</el-button
            >
            <el-button @click="handleEdit(scope.row)" size="small"
              >编辑</el-button
            >
            <el-button
              type="danger"
              size="small"
              @click="handleDel(scope.row._id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>
    <!-- 弹框 -->
    <el-dialog title="用户新增" v-model="showModal">
      <el-form
        ref="dialogForm"
        :model="menuForm"
        label-width="100px"
        :rules="rules"
      >
        <el-form-item label="父级菜单" prop="parentId">
          <el-cascader
            v-model="menuForm.parentId"
            :options="menuList"
            :props="{ checkStrictly: true, value: '_id', label: 'menuName' }"
            clearable
          />
          <span>不选，则直接创建一级菜单</span>
        </el-form-item>
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="menuForm.menuType">
            <el-radio :label="1">菜单</el-radio>
            <el-radio :label="2">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="menuForm.menuName" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item
          label="菜单图标"
          prop="icon"
          v-show="menuForm.menuType == 1"
        >
          <el-input v-model="menuForm.icon" placeholder="请输入岗位" />
        </el-form-item>
        <el-form-item
          label="路由地址"
          prop="path"
          v-show="menuForm.menuType == 1"
        >
          <el-input v-model="menuForm.path" placeholder="请输入路由地址" />
        </el-form-item>
        <el-form-item
          label="权限标识"
          prop="menuCode"
          v-show="menuForm.menuType == 2"
        >
          <el-input v-model="menuForm.menuCode" placeholder="请输入权限标识" />
        </el-form-item>
        <el-form-item
          label="组件路径"
          prop="component"
          v-show="menuForm.menuType == 1"
        >
          <el-input v-model="menuForm.component" placeholder="请输入组件路径" />
        </el-form-item>
        <el-form-item
          label="菜单状态"
          prop="menuState"
          v-show="menuForm.menuType == 1"
        >
          <el-radio-group v-model="menuForm.menuState">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="2">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" @click="handleSubmit">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import utils from "../utils/utils";
export default {
  name: "menu",
  // options api 开发 data(){ return {}}    composition api 开发 setup()
  data() {
    return {
      // 查询表单
      queryForm: {
        menuState: 1,
      },
      // 菜单列表
      menuList: [],
      // 列
      columns: [
        {
          label: "菜单名称",
          prop: "menuName",
          width: 150,
        },
        {
          label: "图标",
          prop: "icon",
        },
        {
          label: "菜单类型",
          prop: "menuType",
          formatter(row, column, value) {
            return {
              1: "菜单",
              2: "按钮",
            }[value];
          },
        },
        {
          label: "权限标识",
          prop: "menuCode",
        },
        {
          label: "路由地址",
          prop: "path",
        },
        {
          label: "组件路径",
          prop: "component",
        },
        {
          label: "菜单状态",
          prop: "menuState",
          width: 90,
          formatter(row, column, value) {
            return {
              1: "正常",
              2: "停用",
            }[value];
          },
        },
        {
          label: "创建时间",
          prop: "createTime",
          formatter(row, column, value) {
            return utils.formateDate(new Date(value));
          },
        },
      ],
      // 展示
      showModal: false,
      // 新增表单字段
      menuForm: {
        parentId: [null],
        menuType: 1,
        menuState: 1,
      },
      //
      action: "",
      //
      rules: {
        menuName: [
          {
            required: true,
            message: "请输入菜单名称",
            trigger: "blur",
          },
          {
            min: 2,
            max: 10,
            message: "长度在2-8个字符",
            trigger: "blur",
          },
        ],
      },
    };
  },
  // 挂载
  mounted() {
    // 调用方法
    this.getMenuList();
  },
  //
  methods: {
    // 菜单目录初始化
    async getMenuList() {
      try {
        let list = await this.$api.getMenuList(this.queryForm);
        this.menuList = list;
      } catch (error) {}
    },
    // 查询
    // handleQuery() {},
    // 重置
    handleReset(form) {
      this.$refs[form].resetFields();
    },
    //新增
    handleAdd(type, row) {
      this.showModal = true;
      this.action = "add";
      if (type == 2) {
        this.menuForm.parentId = [...row.parentId, row._id].filter(
          (item) => item
        );
      }
    },
    //编辑表单
    handleEdit(row) {
      this.showModal = true;
      this.action = "edit";
      // 表单下次更新才获取表单的值 $nextTick(()=>{})
      this.$nextTick(() => {
        // this.menuForm = row;
        // 浅拷贝  Object.assign()
        Object.assign(this.menuForm, row);
      });
    },
    //删除菜单栏
    async handleDel(_id) {
      await this.$api.menuSubmit({ _id, action: "delete" });
      this.$message.success("删除成功");
      this.getMenuList();
    },
    // 接口提交
    handleSubmit() {
      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          let { action, menuForm } = this;
          let params = { ...menuForm, action };
          let res = await this.$api.menuSubmit(params);
          this.showModal = false;
          this.$message.success("操作成功");
          this.handleReset("dialogForm");
          this.getMenuList();
        }
      });
    },
    // 弹框关闭
    handleClose() {
      this.showModal = false;
      this.handleReset("dialogForm");
    },
  },
};
</script>

<style>
</style>
```

### 路由更新

``` js
import { createRouter, createWebHashHistory } from "vue-router";
import Home from './../components/Home.vue'


const routes = [
  {
   ......
    children: [
      {
       ......
      },
      {
      ......
      },
      {
        name: 'menu',
        path: '/system/menu',
        meta: {
          titke: '菜单管理',
        },
        component: () => import('../views/Menu.vue')
      }
    ]
  },
  {
  ......
  },
]

// 导出路由
const router = createRouter({
  history: createWebHashHistory(),
  routes
})
export default router
```

### JS难点

```js

import utils from "../utils/utils";
export default {
  name: "menu",
  // options api 开发 data(){ return {}}    composition api 开发 setup()
  data() {
    return {
      // 查询表单
      queryForm: {
        menuState: 1,
      },
      // 菜单列表
      menuList: [],
      // 列
      columns: [
        {
          label: "菜单名称",
          prop: "menuName",
          width: 150,
        },
        {
          label: "图标",
          prop: "icon",
        },
        {
          label: "菜单类型",
          prop: "menuType",
          formatter(row, column, value) {
            return {
              1: "菜单",
              2: "按钮",
            }[value];
          },
        },
        {
          label: "权限标识",
          prop: "menuCode",
        },
        {
          label: "路由地址",
          prop: "path",
        },
        {
          label: "组件路径",
          prop: "component",
        },
        {
          label: "菜单状态",
          prop: "menuState",
          width: 90,
          formatter(row, column, value) {
            return {
              1: "正常",
              2: "停用",
            }[value];
          },
        },
        {
          label: "创建时间",
          prop: "createTime",
          formatter(row, column, value) {
            return utils.formateDate(new Date(value));
          },
        },
      ],
      // 展示弹框
      showModal: false,
      // 新增表单字段
      menuForm: {
        parentId: [null],
        menuType: 1,    表单类型  1：一级 ，2：二级
        menuState: 1,	表单状态
      },
      // 行为判断  add  edit  del
      action: "",
      //弹框表单验证规则
      rules: {
        menuName: [
          {
            required: true,
            message: "请输入菜单名称",
            trigger: "blur",
          },
          {
            min: 2,
            max: 10,
            message: "长度在2-8个字符",
            trigger: "blur",
          },
        ],
      },
    };
  },
  // 挂载
  mounted() {
    // 调用方法
    this.getMenuList();
  },
  //
  methods: {
    // 菜单目录初始化
    async getMenuList() {
      try {
        let list = await this.$api.getMenuList(this.queryForm);
        this.menuList = list;
      } catch (error) {}
    },
    // 查询
    // handleQuery() {},
    // 重置
    handleReset(form) {
      this.$refs[form].resetFields();
    },
    //新增
    handleAdd(type, row) {
      this.showModal = true;
      this.action = "add";   行为改变
      if (type == 2) {    	判断类型  默认 1
        this.menuForm.parentId = [...row.parentId, row._id].filter(
          (item) => item
        );
      }
    },
    //编辑表单
    handleEdit(row) {
      this.showModal = true;
      this.action = "edit";    行为改变
      // 表单下次更新才获取表单的值 $nextTick(()=>{})
      this.$nextTick(() => {
        // this.menuForm = row;
        // 浅拷贝  Object.assign()
        Object.assign(this.menuForm, row);
      });
    },
    //删除菜单栏
    async handleDel(_id) {
        接口通过 id 和 行为 删除数据库
      await this.$api.menuSubmit({ _id, action: "delete" });
      this.$message.success("删除成功");
      this.getMenuList();    重新获取数据
    },
    // 接口提交
    handleSubmit() {
        弹框表单验证
      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          let { action, menuForm } = this;
          let params = { ...menuForm, action };
            表单参数给后端渲染表单
          let res = await this.$api.menuSubmit(params);
          this.showModal = false;
          this.$message.success("操作成功");
          this.handleReset("dialogForm");
          this.getMenuList();
        }
      });
    },
    // 弹框关闭
    handleClose() {
      this.showModal = false;
      this.handleReset("dialogForm");
    },
  },
};

```

### 组件注意点

```vue
 <div class="user-manage">
    <!--  表单-->
    <div class="query-form">
      <el-form ref="form" :inline="true" :model="queryForm">
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="queryForm.menuName" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="菜单状态" prop="menuState">
          <el-select v-model="queryForm.menuState">
            <el-option :value="1" label="正常"></el-option>
            <el-option :value="2" label="停用"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getMenuList">查询</el-button>
          <el-button @click="handleReset('form')">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
ref="form" :
     ref 属性涉及Dom 元素的获取(el-form表单对象)。
javaSrcipt 获取Dom 元素是通过：document.querySelector（".input"）获取dom元素节点 。
Vue 为简化DOM获取方法提出了ref 属性和$refs 对象。一般的操作流程是:ref 绑定控件，$refs 获取控件。

:inline="true"  : 		行内表单模式 
:model="queryForm"  :  model是表单数据对象，
:rules="rules"  : 		rules是表单验证规则。
label="菜单状态" : 		标签文本
prop="menuState" : model 的键名。 它可以是一个路径数组(例如 ['a', 'b', 0])。 在定义了 validate、resetFields 的方法时，该属性是必填的    
    <!-- 表格 -->
    <div class="base-table">
      <div class="action">
        <el-button type="primary" @click="handleAdd(1)">新增</el-button>
      </div>
      <el-table
        :data="menuList"
        row-key="_id"
        :tree-props="{ children: 'children' }"
      >
        <el-table-column
          v-for="item in columns"
          :key="item.prop"
          :prop="item.prop"
          :label="item.label"
          :width="item.width"
          :formatter="item.formatter"
        >
        </el-table-column>
        <el-table-column label="操作" width="230">
          <template #default="scope">
            <el-button
              @click="handleAdd(2, scope.row)"
              type="primary"
              size="small"
              >新增</el-button
            >
            <el-button @click="handleEdit(scope.row)" size="small"
              >编辑</el-button
            >
            <el-button
              type="danger"
              size="small"
              @click="handleDel(scope.row._id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>
    <!-- 弹框 -->
    <el-dialog title="用户新增" v-model="showModal">
      <el-form
        ref="dialogForm"
        :model="menuForm"
        label-width="100px"
        :rules="rules"
      >
        <el-form-item label="父级菜单" prop="parentId">
          <el-cascader
            v-model="menuForm.parentId"
            :options="menuList"
            :props="{ checkStrictly: true, value: '_id', label: 'menuName' }"
            clearable
          />
          <span>不选，则直接创建一级菜单</span>
        </el-form-item>
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="menuForm.menuType">
            <el-radio :label="1">菜单</el-radio>
            <el-radio :label="2">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="menuForm.menuName" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item
          label="菜单图标"
          prop="icon"
          v-show="menuForm.menuType == 1"
        >
          <el-input v-model="menuForm.icon" placeholder="请输入岗位" />
        </el-form-item>
        <el-form-item
          label="路由地址"
          prop="path"
          v-show="menuForm.menuType == 1"
        >
          <el-input v-model="menuForm.path" placeholder="请输入路由地址" />
        </el-form-item>
        <el-form-item
          label="权限标识"
          prop="menuCode"
          v-show="menuForm.menuType == 2"
        >
          <el-input v-model="menuForm.menuCode" placeholder="请输入权限标识" />
        </el-form-item>
        <el-form-item
          label="组件路径"
          prop="component"
          v-show="menuForm.menuType == 1"
        >
          <el-input v-model="menuForm.component" placeholder="请输入组件路径" />
        </el-form-item>
        <el-form-item
          label="菜单状态"
          prop="menuState"
          v-show="menuForm.menuType == 1"
        >
          <el-radio-group v-model="menuForm.menuState">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="2">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" @click="handleSubmit">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
```



### 总结

```
1. 定义接口
2. 页面搭建
3. 路由定义
4. 菜单栏通过后台递归实现
```

# 五，角色管理

### 接口

```js
/**
 * api管理
 */
import request from './../utils/request'
export default {
......
  // 菜单栏
  getMenuList(params) {
    return request({
      url: '/menu/list',
      method: 'get',
      data: params,
      mock: false
    })
  },
 ......
  // 用户删除
  userDel(params) {
    return request({
      url: '/users/delete',
      method: 'post',
      data: params,
      mock: false
    })
  },
  // 所有角色列表
  getRoleAllList() {
    return request({
      url: '/roles/allList',
      method: 'get',
      data: {},
      mock: false
    })
  },
  // 角色列表
  getRoleList(params) {
    return request({
      url: '/roles/list',
      method: 'get',
      data: params,
      mock: false
    })
  },
 ......
  // 菜单提交
  menuSubmit(params) {
    return request({
      url: '/menu/operate',
      method: 'post',
      data: params,
      mock: false
    })
  },
  // 角色 操作 ：添加，修改，删除
  roleOperate(params) {
    return request({
      url: '/roles/operate',
      method: 'post',
      data: params,
      mock: false
    })
  },
  // 角色权限控制
  updatePermission(params) {
    return request({
      url: '/roles/update/permission',
      method: 'post',
      data: params,
      mock: false
    })
  },
  ......
}
```

### Role 页面搭建

```vue
<template>
  <div class="role-manage">
    <div class="query-form">
      <el-form ref="form" :inline="true" :model="queryForm">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="queryForm.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getRoleList">查询</el-button>
          <el-button @click="handleReset('form')">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="base-table">
      <div class="action">
        <el-button type="primary" @click="handleAdd">创建</el-button>
      </div>
      <el-table :data="roleList">
        <el-table-column
          v-for="item in columns"
          :key="item.prop"
          :prop="item.prop"
          :label="item.label"
          :width="item.width"
          :formatter="item.formatter"
        >
        </el-table-column>
        <el-table-column label="操作" width="260">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)"
              >编辑</el-button
            >
            <el-button
              size="small"
              type="primary"
              @click="handleOpenPermission(scope.row)"
              >设置权限</el-button
            >
            <el-button
              type="danger"
              size="small"
              @click="handleDel(scope.row._id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        background
        layout="prev, pager, next"
        :total="pager.total"
        :page-size="pager.pageSize"
        @current-change="handleCurrentChange"
      />
    </div>
    <el-dialog title="用户新增" v-model="showModal">
      <el-form
        ref="dialogForm"
        :model="roleForm"
        label-width="100px"
        :rules="rules"
      >
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="roleForm.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            type="textarea"
            :rows="2"
            v-model="roleForm.remark"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" @click="handleSubmit">确 定</el-button>
        </span>
      </template>
    </el-dialog>
    <!-- 权限弹框-->
    <el-dialog title="权限设置" v-model="showPermission">
      <el-form label-width="100px">
        <el-form-item label="角色名称">
          {{ curRoleName }}
        </el-form-item>
        <el-form-item label="选择权限">
          <el-tree
            ref="tree"
            :data="menuList"
            show-checkbox
            node-key="_id"
            default-expand-all
            :props="{ label: 'menuName' }"
          >
          </el-tree>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPermission = false">取 消</el-button>
          <el-button type="primary" @click="handlePermissionSubmit"
            >确 定</el-button
          >
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import utils from "../utils/utils";
export default {
  name: "role",
  data() {
    return {
      // 查询
      queryForm: {
        roleName: "",
      },
      // 表格
      columns: [
        {
          label: "角色名称",
          prop: "roleName",
        },
        {
          label: "备注",
          prop: "remark",
        },
        {
          label: "权限列表",
          prop: "permissionList",
          width: 220,
          formatter: (row, column, value) => {
            let names = [];
            let list = value.halfCheckedKeys || [];
            list.map((key) => {
              let name = this.actionMap[key];
              if (key && name) names.push(name);
            });
            return names.join(",");
          },
        },
        {
          label: "更新时间",
          prop: "updateTime",
          formatter(row, column, value) {
            return utils.formateDate(new Date(value));
          },
        },
        {
          label: "创建时间",
          prop: "createTime",
          formatter(row, column, value) {
            return utils.formateDate(new Date(value));
          },
        },
      ],
      // 角色列表
      roleList: [],
      // 分页
      pager: {
        total: 0,
        pageNum: 1,
        pageSize: 5,
      },
      // 显示
      showModal: false,
      // 行为
      action: "create",
      // 角色表单
      roleForm: {},
      // 表单规则
      rules: {
        roleName: [
          {
            required: true,
            message: "请输入角色角色名称",
          },
        ],
      },
      // 权限展示
      showPermission: false,
      curRoleId: "",
      curRoleName: "",
      menuList: [],
      // 菜单映射表
      actionMap: {},
    };
  },
  mounted() {
    this.getRoleList();
    this.getMenuList();
  },
  methods: {
    // 角色列表初始化
    async getRoleList() {
      try {
        let { list, page } = await this.$api.getRoleList({
          ...this.queryForm,
          ...this.pager,
        });
        this.roleList = list;
        this.pager.total = page.total;
      } catch (e) {
        throw new Error(e);
      }
    },
    // 菜单列表初始化
    async getMenuList() {
      try {
        let list = await this.$api.getMenuList();
        this.menuList = list;
        this.getActionMap(list);
      } catch (e) {
        throw new Error(e);
      }
    },
    // 表单重置
    handleReset(form) {
      this.$refs[form].resetFields();
    },
    // 角色添加
    handleAdd() {
      this.action = "create";
      this.showModal = true;
    },
    // 角色编辑
    handleEdit(row) {
      this.action = "edit";
      this.showModal = true;
      this.$nextTick(() => {
        this.roleForm = {
          _id: row._id,
          roleName: row.roleName,
          remark: row.remark,
        };
      });
    },
    // 角色删除
    async handleDel(_id) {
      await this.$api.roleOperate({ _id, action: "delete" });
      this.$message.success("删除成功");
      this.getRoleList();
    },
    // 弹框关闭
    handleClose() {
      this.handleReset("dialogForm");
      this.showModal = false;
    },
    // 角色提交
    handleSubmit() {
      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          let { roleForm, action } = this;
          let params = { ...roleForm, action };
          let res = await this.$api.roleOperate(params);
          if (res) {
            this.showModal = false;
            this.$message.success("创建成功");
            this.handleReset("dialogForm");
            this.getRoleList();
          }
        }
      });
    },
    // 分页
    handleCurrentChange(current) {
      this.pager.pageNum = current;
      this.getRoleList();
    },
    // 权限
    handleOpenPermission(row) {
      this.curRoleId = row._id;
      this.curRoleName = row.roleName;
      this.showPermission = true;
      let { checkedKeys } = row.permissionList;
      setTimeout(() => {
        this.$refs.tree.setCheckedKeys(checkedKeys);
      });
    },
    async handlePermissionSubmit() {
      let nodes = this.$refs.tree.getCheckedNodes(); //获取选中节点
      let halfKeys = this.$refs.tree.getHalfCheckedKeys();
      let checkedKeys = [];
      let parentKeys = [];
      nodes.map((node) => {
        if (!node.children) {
          checkedKeys.push(node._id);
        } else {
          parentKeys.push(node._id);
        }
      });
      let params = {
        _id: this.curRoleId,
        permissionList: {
          checkedKeys,
          halfCheckedKeys: parentKeys.concat(halfKeys),
        },
      };
      await this.$api.updatePermission(params);
      this.showPermission = false;
      this.$message.success("设置成功");
      this.getRoleList();
    },
    // 递归
    getActionMap(list) {
      let actionMap = {};
      const deep = (arr) => {
        while (arr.length) {
          let item = arr.pop();
          console.log(item);
          if (item.children && item.action) {
            actionMap[item._id] = item.menuName;
            // console.log(actionMap[item._id]);
          }
          if (item.children && !item.action) {
            deep(item.children);
          }
        }
      };
      deep(JSON.parse(JSON.stringify(list)));
      this.actionMap = actionMap;
    },
  },
};
</script>

<style>
</style>
```

### 路由更新

```js
import { createRouter, createWebHashHistory } from "vue-router";
import Home from './../components/Home.vue'


const routes = [
  {
   ......
    children: [
      {
       ......
      },
      {
       ......
      },
      {
       ......
      },
      {
        name: 'role',
        path: '/system/role',
        meta: {
          titke: '角色管理',
        },
        component: () => import('../views/Role.vue')
      }
    ]
  },
  {
   ......
  },
]

// 导出路由
const router = createRouter({
  history: createWebHashHistory(),
  routes
})
export default router
```

### JS 难点

```js
 // 递归
    getActionMap(list) {
      let actionMap = {};
      const deep = (arr) => {
        while (arr.length) {
          let item = arr.pop();
          console.log(item);
          if (item.children && item.action) {
            actionMap[item._id] = item.menuName;
            // console.log(actionMap[item._id]);
          }
          if (item.children && !item.action) {
            deep(item.children);
          }
        }
      };
      deep(JSON.parse(JSON.stringify(list)));
      this.actionMap = actionMap;
    },
        /////////////
         handleOpenPermission(row) {
      this.curRoleId = row._id;
      this.curRoleName = row.roleName;
      this.showPermission = true;
      let { checkedKeys } = row.permissionList;
      setTimeout(() => {
        this.$refs.tree.setCheckedKeys(checkedKeys);
      });
    },
    async handlePermissionSubmit() {
      let nodes = this.$refs.tree.getCheckedNodes(); //获取选中节点
      let halfKeys = this.$refs.tree.getHalfCheckedKeys();
      let checkedKeys = [];
      let parentKeys = [];
      nodes.map((node) => {
        if (!node.children) {
          checkedKeys.push(node._id);
        } else {
          parentKeys.push(node._id);
        }
      });
      let params = {
        _id: this.curRoleId,
        permissionList: {
          checkedKeys,
          halfCheckedKeys: parentKeys.concat(halfKeys),
        },
      };
      await this.$api.updatePermission(params);
      this.showPermission = false;
      this.$message.success("设置成功");
      this.getRoleList();
    },
```

### 总结

```
1. 组件使用
2. 接口
3. 如何请求接口，传递参数
4. 递归生成权限控制
```

# 六，部门管理

### 接口

```js
/**
 * api管理
 */
import request from './../utils/request'
export default {
  // 登录
  login(params) {
    return request({
      url: '/users/login',
      method: 'post',
      data: params,
      mock: false
    })
  },
  // 小点
  noticeCount(params) {
    return request({
      url: '/leave/count',
      method: 'get',
      data: {},
      mock: true
    })
  },
  // 菜单栏
  getMenuList(params) {
    return request({
      url: '/menu/list',
      method: 'get',
      data: params,
      mock: false
    })
  },
  // 
  getPermissionList() {
    return request({
      url: '/users/getPermissionList',
      method: 'get',
      data: {},
      mock: true
    })
  },
  // 用户列表
  getUserList(params) {
    return request({
      url: '/users/list',
      method: 'get',
      data: params,
      mock: false
    })
  },
  // 所有用户列表
  getAllUserList() {
    return request({
      url: '/users/all/list',
      method: 'get',
      data: {},
      mock: false
    })
  },
  // 用户删除
  userDel(params) {
    return request({
      url: '/users/delete',
      method: 'post',
      data: params,
      mock: false
    })
  },
  // 所有角色列表
  getRoleAllList() {
    return request({
      url: '/roles/allList',
      method: 'get',
      data: {},
      mock: false
    })
  },
  // 角色列表
  getRoleList(params) {
    return request({
      url: '/roles/list',
      method: 'get',
      data: params,
      mock: false
    })
  },
  // 部门列表
  getDeptList(params) {
    return request({
      url: '/dept/list',
      method: 'get',
      data: params,
      mock: false
    })
  },
  // 操作
  deptOperate(params) {
    return request({
      url: '/dept/operate',
      method: 'post',
      data: params,
      mock: false
    })
  },
  // 用户提交表单
  userSubmit(params) {
    return request({
      url: '/users/operate',
      method: 'post',
      data: params,
      mock: false
    })
  },
  // 菜单提交
  menuSubmit(params) {
    return request({
      url: '/menu/operate',
      method: 'post',
      data: params,
      mock: false
    })
  },
  // 角色 操作 ：添加，修改，删除
  roleOperate(params) {
    return request({
      url: '/roles/operate',
      method: 'post',
      data: params,
      mock: false
    })
  },
  // 角色权限控制
  updatePermission(params) {
    return request({
      url: '/roles/update/permission',
      method: 'post',
      data: params,
      mock: false
    })
  },
  getApplyList(params) {
    return request({
      url: '/leave/list',
      method: 'get',
      data: params,
      mock: false
    })
  },
  leaveOperate(params) {
    return request({
      url: '/leave/operate',
      method: 'post',
      data: params,
      mock: false
    })
  },
  leaveApprove(params) {
    return request({
      url: '/leave/approve',
      method: 'post',
      data: params,
      mock: false
    })
  }
}
```

### 路由更新

```js
import { createRouter, createWebHashHistory } from "vue-router";
import Home from './../components/Home.vue'


const routes = [
  {
    ...
    children: [
     ...
     
      {
        name: 'dept',
        path: '/system/dept',
        meta: {
          title: '部门管理',
        },
        component: () => import('../views/Dept.vue')
      }
    ]
  },
  {
    name: 'login',
    path: '/login',
    meta: {
      title: '登录'
    },
    component: () => import('../views/Login.vue')
  },
]

// 导出路由
const router = createRouter({
  history: createWebHashHistory(),
  routes
})
export default router
```

### Dept 页面搭建

```vue
<template>
  <div class="dept-manage">
    <div class="query-form">
      <el-form :inline="true" ref="queryForm" :model="queryForm">
        <el-form-item label="部门名称">
          <el-input
            placeholder="请输入部门名称"
            v-model="queryForm.deptName"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button @click="getDeptList" type="primary">查询</el-button>
          <el-button @click="handleReset('queryForm')">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="base-table">
      <div class="action">
        <el-button type="primary" @click="handleOpen">创建</el-button>
      </div>
      <el-table
        :data="deptList"
        row-key="_id"
        :tree-props="{ children: 'children' }"
        stripe
      >
        <el-table-column
          v-for="item in columns"
          :key="item.prop"
          v-bind="item"
        ></el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              @click="handleEdit(scope.row)"
              >编辑</el-button
            >
            <el-button
              size="small"
              type="danger"
              @click="handleDel(scope.row._id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-dialog
      :title="action == 'create' ? '创建部门' : '编辑部门'"
      v-model="showModal"
    >
      <el-form
        ref="dialogForm"
        :model="deptForm"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="上级部门" prop="parentId">
          <el-cascader
            placeholder="请选择上级部门"
            v-model="deptForm.parentId"
            :props="{ checkStrictly: true, value: '_id', label: 'deptName' }"
            clearable
            :options="deptList"
            :show-all-levels="true"
          ></el-cascader>
        </el-form-item>
        <el-form-item label="部门名称" prop="deptName">
          <el-input
            placeholder="请输入部门名称"
            v-model="deptForm.deptName"
          ></el-input>
        </el-form-item>
        <el-form-item label="负责人" prop="user">
          <el-select
            placeholder="请选择部门负责人"
            v-model="deptForm.user"
            @change="handleUser"
          >
            <el-option
              v-for="item in userList"
              :key="item.userId"
              :label="item.userName"
              :value="`${item.userId}/${item.userName}/${item.userEmail}`"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="负责人邮箱" prop="userEmail">
          <el-input
            placeholder="请输入负责人邮箱"
            v-model="deptForm.userEmail"
            disabled
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">取消</el-button>
          <el-button @click="handleSubmit" type="primary">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script>
import utils from "./../utils/utils";
export default {
  name: "dept",
  data() {
    return {
      // 查询
      queryForm: {
        deptName: "",
      },
      // 表格
      columns: [
        {
          label: "部门名称",
          prop: "deptName",
        },
        {
          label: "负责人",
          prop: "userName",
        },
        {
          label: "更新时间",
          prop: "updateTime",
          formatter: (row, column, value) => {
            return utils.formateDate(new Date(value));
          },
        },
        {
          label: "创建时间",
          prop: "createTime",
          formatter: (row, column, value) => {
            return utils.formateDate(new Date(value));
          },
        },
      ],
      // 部门集合
      deptList: [],
      // 分页
      pager: {
        pageNum: 1,
        pageSize: 10,
      },
      // 行为
      action: "create",
      // 展示
      showModal: false,
      // id
      deptForm: {
        parentId: [null],
      },
      // 用户集合
      userList: [],
      // 表单验证
      rules: {
        parentId: [
          {
            required: true,
            message: "请选择上级部门",
            trigger: "blur",
          },
        ],
        deptName: [
          {
            required: true,
            message: "请输入部门名称",
            trigger: "blur",
          },
        ],
        user: [
          {
            required: true,
            message: "请选择负责人",
            trigger: "blur",
          },
        ],
      },
    };
  },
  mounted() {
    this.getDeptList();
    this.getAllUserList();
  },
  methods: {
    // 获取部门数据
    async getDeptList() {
      let list = await this.$api.getDeptList(this.queryForm);
      // console.log(list);
      this.deptList = list;
    },
    // 获取用户数据
    async getAllUserList() {
      this.userList = await this.$api.getAllUserList();
    },
    // 用户邮箱
    handleUser(val) {
      console.log(val);
      console.log("=>", val);
      const [userId, userName, userEmail] = val.split("/");
      // 浅拷贝到 this.deptForm
      Object.assign(this.deptForm, { userId, userName, userEmail });
    },
    // 重置表单
    handleReset(form) {
      this.$refs[form].resetFields();
    },
    // 创造
    handleOpen() {
      this.action = "create";
      this.showModal = true;
    },
    // 编辑
    handleEdit(row) {
      console.log(row);
      this.action = "edit";
      this.showModal = true;
      this.$nextTick(() => {
        Object.assign(this.deptForm, row, {
          // user: `${row.userId}/${row.userName}/${row.userEmail}`,
          user: `${row.userName}`,
        });
      });
    },
    // 删除
    async handleDel(_id) {
      this.action = "delete";
      await this.$api.deptOperate({ _id, action: this.action });
      this.$message.success("删除成功");
      this.getDeptList();
    },
    // 关闭
    handleClose() {
      this.showModal = false;
      this.handleReset("dialogForm");
    },
    // 提交
    handleSubmit() {
      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          let params = { ...this.deptForm, action: this.action };
          console.log(params);
          // delete params.user;
          await this.$api.deptOperate(params);
          this.$message.success("操作成功");
          this.handleClose();
          this.getDeptList();
        }
      });
    },
  },
};
</script>
```

### JS 难点

```js
export default {
  name: "dept",
  data() {
    return {
      // 查询
      queryForm: {
        deptName: "",
      },
      // 表格
      columns: [
        {
          label: "部门名称",
          prop: "deptName",
        },
        {
          label: "负责人",
          prop: "userName",
        },
        {
          label: "更新时间",
          prop: "updateTime",
          formatter: (row, column, value) => {
            return utils.formateDate(new Date(value));
          },
        },
        {
          label: "创建时间",
          prop: "createTime",
          formatter: (row, column, value) => {
            return utils.formateDate(new Date(value));
          },
        },
      ],
      // 部门集合
      deptList: [],
      // 分页
      pager: {
        pageNum: 1,
        pageSize: 10,
      },
      // 行为
      action: "create",
      // 展示
      showModal: false,
      // id
      deptForm: {
        parentId: [null],
      },
      // 用户集合
      userList: [],
      // 表单验证
      rules: {
        parentId: [
          {
            required: true,
            message: "请选择上级部门",
            trigger: "blur",
          },
        ],
        deptName: [
          {
            required: true,
            message: "请输入部门名称",
            trigger: "blur",
          },
        ],
        user: [
          {
            required: true,
            message: "请选择负责人",
            trigger: "blur",
          },
        ],
      },
    };
  },
  mounted() {
    this.getDeptList();
    this.getAllUserList();
  },
  methods: {
    // 获取部门数据
    async getDeptList() {
      let list = await this.$api.getDeptList(this.queryForm);
      // console.log(list);
      this.deptList = list;
    },
    // 获取用户数据
    async getAllUserList() {
      this.userList = await this.$api.getAllUserList();
    },
    // 用户邮箱
    handleUser(val) {
      console.log(val);
      console.log("=>", val);
      const [userId, userName, userEmail] = val.split("/");
      // 浅拷贝到 this.deptForm
      Object.assign(this.deptForm, { userId, userName, userEmail });
    },
    // 重置表单
    handleReset(form) {
      this.$refs[form].resetFields();
    },
    // 创造
    handleOpen() {
      this.action = "create";
      this.showModal = true;
    },
    // 编辑
    handleEdit(row) {
      console.log(row);
      this.action = "edit";
      this.showModal = true;
      this.$nextTick(() => {
        Object.assign(this.deptForm, row, {
          // user: `${row.userId}/${row.userName}/${row.userEmail}`,
          user: `${row.userName}`,
        });
      });
    },
    // 删除
    async handleDel(_id) {
      this.action = "delete";
      await this.$api.deptOperate({ _id, action: this.action });
      this.$message.success("删除成功");
      this.getDeptList();
    },
    // 关闭
    handleClose() {
      this.showModal = false;
      this.handleReset("dialogForm");
    },
    // 提交
    handleSubmit() {
      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          let params = { ...this.deptForm, action: this.action };
          console.log(params);
          // delete params.user;
          await this.$api.deptOperate(params);
          this.$message.success("操作成功");
          this.handleClose();
          this.getDeptList();
        }
      });
    },
  },
};
```

### 总结

```js
3. 角色编辑
4. 角色删除
5. 菜单权限设置
6. 角色权限列表递归展示
接口调用：
角色列表： /roles/list
菜单列表： /menu/list
角色操作： /roles/operate
权限设置： /roles/update/permission
所有角色列表： /roles/allList
注意事项：
1. 分页参数 { ...this.queryForm, ...this.pager, }
2. 角色列表展示菜单权限，递归调用actionMap
3. 角色编辑 nextTick
4. 理解权限设置中 checkedKeys 和 halfCheckedKeys
RBAC模型：
Role-Base-Access-Control
用户分配角色 -> 角色分配权限 -> 权限对应菜单、按钮
用户登录以后，根据对应角色，拉取用户的所有权限列表，对菜单、按钮进行动态渲染。
模块封装
加强自身对通用模块封装能力、提高开发效率，不断积累架构思维，提高自身核心竞争力。
```

# 七，权限控制与动态路由组件

### 接口

```js
 // 角色权限控制
  updatePermission(params) {
    return request({
      url: '/roles/update/permission',
      method: 'post',
      data: params,
      mock: false
    })
  },
```

### Home组件更新菜单权限

```vue
<template>
 ......
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
   .
  },
  // 挂载
  mounted() {
    this.getNoticeCount();
    this.getMenuList();
  },

  // 定义方法
  methods: {
    ......

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
......
</style>
```

### 动态路由实现

```js
import { createRouter, createWebHashHistory } from "vue-router";
import Home from './../components/Home.vue'
import storage from './../utils/storage'
import API from './../api'
import utils from './../utils/utils'

const routes = [
  {
    name: 'home',
    path: '/',
    meta: {
      title: '首页'
    },
    component: Home,
    redirect: '/user',
    children: [
      {
        name: 'welcome',
        path: '/welcome',
        meta: {
          title: '欢迎体验Vue3全栈课程'
        },
        component: () => import('../views/Welcome.vue')
      },
      // {
      //   name: 'user',
      //   path: '/system/user',
      //   meta: {
      //     title: '用户管理',
      //   },
      //   component: () => import('../views/User.vue')
      // },
      {
        name: 'menu',
        path: '/system/menu',
        meta: {
          title: '菜单管理',
        },
        component: () => import('../views/Menu.vue')
      },
      // {
      //   name: 'role',
      //   path: '/system/role',
      //   meta: {
      //     title: '角色管理',
      //   },
      //   component: () => import('../views/Role.vue')
      // },
      // {
      //   name: 'dept',
      //   path: '/system/dept',
      //   meta: {
      //     title: '部门管理',
      //   },
      //   component: () => import('../views/Dept.vue')
      // },
      // {
      //   name: 'leave',
      //   path: '/audit/leave',
      //   meta: {
      //     title: '部门管理',
      //   },
      //   component: () => import('../views/Leave.vue')
      // }
    ]
  },
  {
    name: 'login',
    path: '/login',
    meta: {
      title: '登录'
    },
    component: () => import('../views/Login.vue')
  },
  {
    name: '404',
    path: '/404',
    meta: {
      title: '不存在'
    },
    component: () => import('../views/404.vue')
  },
]

// 导出路由
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

根据用户是否存在 token 调用权限菜单
async function loadAsyncRoutes() {
  let userInfo = storage.getItem('userInfo') || []
  if (userInfo.token) {
    try {
      const { menuList } = await API.getPermissionList()
      let routes = utils.generateRoute(menuList)
      通过map遍历拼接 url，router.addRoute（“父路由”，子路由）添加到路由
      routes.map(route => {
        let url = `./../views/${route.component}.vue`
        route.component = () => import(url);
        // console.log(router);
        router.addRoute("home", route);
      })
    } catch (error) {

    }
  }
}
（页面刷新执行）
await loadAsyncRoutes()
递归生成动态路由
// function generateRoute(menuList) {
//   let routes = []
//   const deepList = (list) => {
//     while (list) {
//       let item = list.pop()
//       if (item.action) {
//         routes.push({
//           name: item.component,
//           path: item.path,
//           meta: {
//             title: item.menuName
//           },
//           component: item.component
//         })
//       }
//       if (item.children && !item.action) {
//         deepList(item.children)
//       }
//     }
//   }
//   deepList(menuList)
//   return routes;
// }

判断路由路径是否存在 filter过滤 返回 1 || 0
// function checkPermission(path) {
//   console.log(path);
//   let hasPermission = router.getRoutes().filter(route => route.path == path).length;
//   console.log(router.getRoutes());
//   console.log(hasPermission);
//   if (hasPermission) {

//     return true;
//   } else {
//     return false;
//   }
// }
// router.beforeEach((to, from, next) => {
//   if (checkPermission(to.path)) {
//     document.title = to.meta.title;
//     next()
//   } else {
//     next('/404')
//     // next()
//   }
// })
路由导航守卫 to：去哪  from ：从哪来  next ：下一步去 to
router.beforeEach((to, from, next) => {
  if (router.hasRoute(to.name)) {
    document.title = to.meta.title;
    next()
  } else {
    next('/404')
  }
})
export default router
```

### 登录页面更新

```vue
<template>
  ......
</template>

<script>
import utils from "./../utils/utils";
import storage from "./../utils/storage";
export default {
  name: "login",
  data() {
   ......
  },
  methods: {
    login() {
      this.$refs.userForm.validate((valid) => {
        if (valid) {
          this.$api.login(this.user).then(async (res) => {
            this.$store.commit("saveUserInfo", res);
            await this.loadAsyncRoutes();

            this.$router.push("/welcome");
          });
        } else {
          return false;
        }
      });
    },
    // 动态路由函数
        用户登录即可获取动态路由组件
    async loadAsyncRoutes() {
      let userInfo = storage.getItem("userInfo") || {};
      if (userInfo.token) {
        try {
          const { menuList } = await this.$api.getPermissionList();
          let routes = utils.generateRoute(menuList);
          routes.map((route) => {
            let url = `./../views/${route.component}.vue`;
            route.component = () => import(url);
            console.log(this.$router);
              this.router 失效
            // this.router.addRoute("home", route);
              全局调用路由 ：this.$router
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
......
</style>
```

### main 入口更新自定义权限指令

```js
......

// axios.get(config.mockApi + '/login').then((res) => {
//   console.log(res);
// })
const app = createApp(App)

// 定义全局指令
app.directive('has', {
  // 声明节点之前  el：元素  binding ：属性
  beforeMount: function (el, binding) {
    // 拿到vuex的 actionList
    let actionList = storage.getItem('actionList');
    // 拿到元素的值
    let value = binding.value;
    // 判断actionList 有没有value  返回一个 布尔值
    let hasPermission = actionList.includes(value)
    if (!hasPermission) {
      // 元素的元素设置为表空间
      el.style = 'display:none';
      // 删除节点
      setTimeout(() => {
        el.parentNode.removeChild(el);
      }, 0)
    }
  }
})


......

.....
```

### 总结

```
1. 定义接口
2. 权限控制原理
3. 动态路由组件的实现
4. 全局定义权限控制指令
```

# 八，审批管理

### 接口

```js
/**
 * api管理
 */
import request from './../utils/request'
export default {
 
  // 小点
  noticeCount(params) {
    return request({
      url: '/leave/count',
      method: 'get',
      data: {},
      mock: false
    })
  },
 
  // 审批管理
  getApplyList(params) {
    return request({
      url: '/leave/list',
      method: 'get',
      data: params,
      mock: false
    })
  },
  // 审批操作
  leaveOperate(params) {
    return request({
      url: '/leave/operate',
      method: 'post',
      data: params,
      mock: false
    })
  },
  // 审批成功
  leaveApprove(params) {
    return request({
      url: '/leave/approve',
      method: 'post',
      data: params,
      mock: false
    })
  }
}
```

### 休假申请页面

```vue
<template>
  <div class="user-manage">
    <div class="query-form">
      <el-form ref="form" :inline="true" :model="queryForm">
        <el-form-item label="审批状态" prop="applyState">
          <el-select v-model="queryForm.applyState">
            <el-option value="" label="全部"></el-option>
            <el-option :value="1" label="待审批"></el-option>
            <el-option :value="2" label="审批中"></el-option>
            <el-option :value="3" label="审批拒绝"></el-option>
            <el-option :value="4" label="审批通过"></el-option>
            <el-option :value="5" label="作废"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getApplyList">查询</el-button>
          <el-button @click="handleReset('form')">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="base-table">
      <div class="action">
        <el-button type="primary" @click="handleApply">申请休假</el-button>
      </div>
      <el-table :data="applyList">
        <el-table-column
          v-for="item in columns"
          :key="item.prop"
          :prop="item.prop"
          :label="item.label"
          :width="item.width"
          :formatter="item.formatter"
        >
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="handleDetail(scope.row)"
              >查看</el-button
            >
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(scope.row._id)"
              v-if="[1, 2].includes(scope.row.applyState)"
              >作废</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        background
        layout="prev, pager, next"
        :total="pager.total"
        :page-size="pager.pageSize"
        @current-change="handleCurrentChange"
      />
    </div>
    <el-dialog title="申请休假" v-model="showModal" width="70%">
      <el-form
        ref="dialogForm"
        :model="leaveForm"
        label-width="120px"
        :rules="rules"
      >
        <el-form-item label="休假类型" prop="applyType" required>
          <el-select v-model="leaveForm.applyType">
            <el-option label="事假" :value="1"></el-option>
            <el-option label="调休" :value="2"></el-option>
            <el-option label="年假" :value="3"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="休假类型" required>
          <el-row>
            <el-col :span="8">
              <el-form-item prop="startTime" required>
                <el-date-picker
                  v-model="leaveForm.startTime"
                  type="date"
                  placeholder="选择开始日期"
                  @change="(val) => handleDateChange('startTime', val)"
                />
              </el-form-item>
            </el-col>
            <el-col :span="1">-</el-col>
            <el-col :span="8">
              <el-form-item prop="endTime" required>
                <el-date-picker
                  v-model="leaveForm.endTime"
                  type="date"
                  placeholder="选择结束日期"
                  @change="(val) => handleDateChange('endTime', val)"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="休假时长" required>
          {{ leaveForm.leaveTime }}
        </el-form-item>
        <el-form-item label="休假原因" prop="reasons" required>
          <el-input
            type="textarea"
            :row="3"
            placeholder="请输入休假原因"
            v-model="leaveForm.reasons"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" @click="handleSubmit">确 定</el-button>
        </span>
      </template>
    </el-dialog>
    <el-dialog
      title="申请休假详情"
      width="50%"
      v-model="showDetailModal"
      destroy-on-close
    >
      <el-steps
        :active="detail.applyState > 2 ? 3 : detail.applyState"
        align-center
      >
        <el-step title="待审批"></el-step>
        <el-step title="审批中"></el-step>
        <el-step title="审批通过/审批拒绝"></el-step>
      </el-steps>
      <el-form label-width="120px" label-suffix=":">
        <el-form-item label="休假类型">
          <div>{{ detail.applyTypeName }}</div>
        </el-form-item>
        <el-form-item label="休假时间">
          <div>{{ detail.time }}</div>
        </el-form-item>
        <el-form-item label="休假时长">
          <div>{{ detail.leaveTime }}</div>
        </el-form-item>
        <el-form-item label="休假原因">
          <div>{{ detail.reasons }}</div>
        </el-form-item>
        <el-form-item label="审批状态">
          <div>{{ detail.applyStateName }}</div>
        </el-form-item>
        <el-form-item label="审批人">
          <div>{{ detail.curAuditUserName }}</div>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script>
import { getCurrentInstance, onMounted, reactive, ref, toRaw } from "vue";
import utils from "../utils/utils";
export default {
  name: "user",
  setup() {
    //   获取Composition API 上下文对象
    const { ctx, proxy } = getCurrentInstance();
    // 查询表单申请状态 reactive 响应式 复杂类型
    const queryForm = reactive({
      applyState: 1,
    });
    // 分页
    const pager = reactive({
      pageNum: 1,
      pageSize: 10,
      total: 0,
    });
    // 定义动态表格-格式
    const columns = reactive([
      {
        label: "单号",
        prop: "orderNo",
      },
      {
        label: "休假时间",
        prop: "",
        formatter(row) {
          return (
            utils.formateDate(new Date(row.startTime), "yyyy-MM-dd") +
            "到" +
            utils.formateDate(new Date(row.endTime), "yyyy-MM-dd")
          );
        },
      },
      {
        label: "休假时长",
        prop: "leaveTime",
      },
      {
        label: "休假类型",
        prop: "applyType",
        formatter(row, column, value) {
          return {
            1: "事假",
            2: "调休",
            3: "年假",
          }[value];
        },
      },
      {
        label: "休假原因",
        prop: "reasons",
      },
      {
        label: "申请时间",
        prop: "createTime",
        width: 180,
        formatter: (row, column, value) => {
          return utils.formateDate(new Date(value));
        },
      },
      {
        label: "审批人",
        prop: "auditUsers",
      },
      {
        label: "当前审批人",
        prop: "curAuditUserName",
      },
      {
        label: "审批状态",
        prop: "applyState",
        formatter: (row, column, value) => {
          // 1:待审批 2:审批中 3:审批拒绝 4:审批通过 5:作废
          return {
            1: "待审批",
            2: "审批中",
            3: "审批拒绝",
            4: "审批通过",
            5: "作废",
          }[value];
        },
      },
    ]);
    // 申请列表
    const applyList = ref([]);
    // 创建休假弹框表单
    const leaveForm = reactive({
      applyType: 1,
      startTime: "",
      endTime: "",
      leaveTime: "0天",
      reasons: "",
    });
    //create:创建 delete:作废
    const action = ref("create");
    // 展示
    const showModal = ref(false);
    const showDetailModal = ref(false);
    let detail = ref({});
    // 表单规则
    const rules = {
      startTime: [
        {
          type: "date",
          required: true,
          message: "请输入开始日期",
          trigger: "change",
        },
      ],
      endTime: [
        {
          type: "date",
          required: true,
          message: "请输入结束日期",
          trigger: "change",
        },
      ],
      reasons: [
        {
          required: true,
          message: "请输入休假原因",
          trigger: ["change", "blur"],
        },
      ],
    };
    // 初始化接口调用
    onMounted(() => {
      // 申请列表
      getApplyList();
    });

    // 加载申请列表
    const getApplyList = async () => {
      let params = { ...queryForm, ...pager };
      let { list, page } = await proxy.$api.getApplyList(params);
      applyList.value = list;
      pager.total = page.total;
    };
    // 重置查询表单
    const handleReset = (form) => {
      proxy.$refs[form].resetFields();
    };

    // 分页事件处理
    const handleCurrentChange = (current) => {
      pager.pageNum = current;
      getUserList();
    };

    // 点击申请休假-展示弹框
    const handleApply = () => {
      showModal.value = true;
      action.value = "create";
    };
    // 弹框关闭
    const handleClose = () => {
      showModal.value = false;
      handleReset("dialogForm");
    };
    // 获取休假时长
    const handleDateChange = (key, val) => {
      let { startTime, endTime } = leaveForm;
      if (!startTime || !endTime) return;
      if (startTime > endTime) {
        proxy.$message.error("开始日期不能晚于结束日期");
        leaveForm.leaveTime = "0天";
        setTimeout(() => {
          leaveForm[key] = "";
        }, 0);
      } else {
        leaveForm.leaveTime =
          (endTime - startTime) / (24 * 60 * 60 * 1000) + 1 + "天";
      }
    };
    // 申请提交
    const handleSubmit = () => {
      proxy.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          try {
            let params = { ...leaveForm, action: action.value };
            let res = await proxy.$api.leaveOperate(params);
            proxy.$message.success("创建成功");
            handleClose();
            getApplyList();
          } catch (error) {}
        }
      });
    };

    const handleDetail = (row) => {
      let data = { ...row };
      data.applyTypeName = {
        1: "事假",
        2: "调休",
        3: "年假",
      }[data.applyType];
      data.time =
        utils.formateDate(new Date(data.startTime), "yyyy-MM-dd") +
        "到" +
        utils.formateDate(new Date(data.endTime), "yyyy-MM-dd");
      // 1:待审批 2:审批中 3:审批拒绝 4:审批通过 5:作废
      data.applyStateName = {
        1: "待审批",
        2: "审批中",
        3: "审批拒绝",
        4: "审批通过",
        5: "作废",
      }[data.applyState];
      detail.value = data;
      showDetailModal.value = true;
    };

    const handleDelete = async (_id) => {
      try {
        let params = { _id, action: "delete" };
        let res = await proxy.$api.leaveOperate(params);
        proxy.$message.success("删除成功");
        getApplyList();
      } catch (error) {}
    };

    return {
      queryForm,
      pager,
      columns,
      handleCurrentChange,
      handleReset,
      getApplyList,
      applyList,
      leaveForm,
      showModal,
      showDetailModal,
      handleApply,
      handleClose,
      handleSubmit,
      rules,
      handleDateChange,
      detail,
      handleDetail,
      handleDelete,
    };
  },
};
</script>
```

### 待审批页面

```vue
<template>
  <div class="user-manage">
    <div class="query-form">
      <el-form ref="form" :inline="true" :model="queryForm">
        <el-form-item label="审批状态" prop="applyState">
          <el-select v-model="queryForm.applyState">
            <el-option value="" label="全部"></el-option>
            <el-option :value="1" label="待审批"></el-option>
            <el-option :value="2" label="审批中"></el-option>
            <el-option :value="3" label="审批拒绝"></el-option>
            <el-option :value="4" label="审批通过"></el-option>
            <el-option :value="5" label="作废"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getApplyList">查询</el-button>
          <el-button @click="handleReset('form')">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="base-table">
      <div class="action"></div>
      <el-table :data="applyList">
        <el-table-column
          v-for="item in columns"
          :key="item.prop"
          :prop="item.prop"
          :label="item.label"
          :width="item.width"
          :formatter="item.formatter"
        >
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button
              size="mini"
              @click="handleDetail(scope.row)"
              v-if="
                scope.row.curAuditUserName == userInfo.userName &&
                [1, 2].includes(scope.row.applyState)
              "
              >审核</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        background
        layout="prev, pager, next"
        :total="pager.total"
        :page-size="pager.pageSize"
        @current-change="handleCurrentChange"
      />
    </div>
    <el-dialog
      title="审核"
      width="50%"
      v-model="showDetailModal"
      destroy-on-close
    >
      <el-form
        ref="dialogForm"
        :model="auditForm"
        label-width="120px"
        label-suffix=":"
        :rules="rules"
      >
        <el-form-item label="申请人">
          <div>{{ detail.applyUser.userName }}</div>
        </el-form-item>
        <el-form-item label="休假类型">
          <div>{{ detail.applyTypeName }}</div>
        </el-form-item>
        <el-form-item label="休假时间">
          <div>{{ detail.time }}</div>
        </el-form-item>
        <el-form-item label="休假时长">
          <div>{{ detail.leaveTime }}</div>
        </el-form-item>
        <el-form-item label="休假原因">
          <div>{{ detail.reasons }}</div>
        </el-form-item>
        <el-form-item label="审批状态">
          <div>{{ detail.applyStateName }}</div>
        </el-form-item>
        <el-form-item label="审批人">
          <div>{{ detail.curAuditUserName }}</div>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            type="textarea"
            :rows="3"
            placeholder="请输入审核备注"
            v-model="auditForm.remark"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleApprove('pass')">审核通过</el-button>
          <el-button @click="handleApprove('refuse')" type="primary"
            >驳回</el-button
          >
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script>
import { getCurrentInstance, onMounted, reactive, ref, toRaw } from "vue";
import utils from "../utils/utils";
export default {
  name: "approve",
  setup() {
    //   获取Composition API 上下文对象
    const { proxy } = getCurrentInstance();
    const queryForm = reactive({
      applyState: 1,
    });
    const pager = reactive({
      pageNum: 1,
      pageSize: 10,
      total: 0,
    });
    // 定义动态表格-格式
    const columns = reactive([
      {
        label: "单号",
        prop: "orderNo",
      },
      {
        label: "申请人",
        prop: "",
        formatter(row) {
          return row.applyUser.userName;
        },
      },
      {
        label: "休假时间",
        prop: "",
        formatter(row) {
          return (
            utils.formateDate(new Date(row.startTime), "yyyy-MM-dd") +
            "到" +
            utils.formateDate(new Date(row.endTime), "yyyy-MM-dd")
          );
        },
      },
      {
        label: "休假时长",
        prop: "leaveTime",
      },
      {
        label: "休假类型",
        prop: "applyType",
        formatter(row, column, value) {
          return {
            1: "事假",
            2: "调休",
            3: "年假",
          }[value];
        },
      },
      {
        label: "休假原因",
        prop: "reasons",
      },
      {
        label: "申请时间",
        prop: "createTime",
        width: 180,
        formatter: (row, column, value) => {
          return utils.formateDate(new Date(value));
        },
      },
      {
        label: "审批人",
        prop: "auditUsers",
      },
      {
        label: "当前审批人",
        prop: "curAuditUserName",
      },
      {
        label: "审批状态",
        prop: "applyState",
        formatter: (row, column, value) => {
          // 1:待审批 2:审批中 3:审批拒绝 4:审批通过 5:作废
          return {
            1: "待审批",
            2: "审批中",
            3: "审批拒绝",
            4: "审批通过",
            5: "作废",
          }[value];
        },
      },
    ]);
    // 申请列表
    const applyList = ref([]);
    // 创建休假弹框表单
    const leaveForm = reactive({
      applyType: 1,
      startTime: "",
      endTime: "",
      leaveTime: "0天",
      reasons: "",
    });

    const showDetailModal = ref(false);
    // 详情弹框对象
    let detail = ref({});
    const userInfo = proxy.$store.state.userInfo;
    // 表单规则
    const rules = {
      remark: [
        {
          required: true,
          message: "请输入审核备注",
          trigger: "change",
        },
      ],
    };
    const auditForm = reactive({
      remark: "",
    });
    // 初始化接口调用
    onMounted(() => {
      getApplyList();
    });

    // 加载申请列表
    const getApplyList = async () => {
      let params = { ...queryForm, ...pager, type: "approve" };
      let { list, page } = await proxy.$api.getApplyList(params);
      applyList.value = list;
      pager.total = page.total;
    };
    // 重置查询表单
    const handleReset = (form) => {
      proxy.$refs[form].resetFields();
    };

    // 分页事件处理
    const handleCurrentChange = (current) => {
      pager.pageNum = current;
      getUserList();
    };
    // 弹框关闭
    const handleClose = () => {
      showDetailModal.value = false;
      handleReset("dialogForm");
    };

    const handleDetail = (row) => {
      let data = { ...row };
      data.applyTypeName = {
        1: "事假",
        2: "调休",
        3: "年假",
      }[data.applyType];
      data.time =
        utils.formateDate(new Date(data.startTime), "yyyy-MM-dd") +
        "到" +
        utils.formateDate(new Date(data.endTime), "yyyy-MM-dd");
      // 1:待审批 2:审批中 3:审批拒绝 4:审批通过 5:作废
      data.applyStateName = {
        1: "待审批",
        2: "审批中",
        3: "审批拒绝",
        4: "审批通过",
        5: "作废",
      }[data.applyState];
      detail.value = data;
      showDetailModal.value = true;
    };

    const handleApprove = (action) => {
      proxy.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          let params = {
            action,
            remark: auditForm.remark,
            _id: detail.value._id,
          };
          try {
            await proxy.$api.leaveApprove(params);
            handleClose();
            proxy.$message.success("处理成功");
            getApplyList();
            proxy.$store.commit(
              "saveNoticeCount",
              proxy.$store.state.noticeCount - 1
            );
          } catch (error) {}
        }
      });
    };

    return {
      queryForm,
      pager,
      columns,
      handleCurrentChange,
      handleReset,
      getApplyList,
      applyList,
      auditForm,
      showDetailModal,
      handleClose,
      rules,
      detail,
      userInfo,
      handleDetail,
      handleApprove,
    };
  },
};
</script>
```

### 动态路由组件

```
菜单管理添加
```

# **项目个人总结**

### 一，技术点

#### 1. api定义

```js
API 定义：

login(params) {  	携带参数
    return request({
      url: '/users/login',   请求路径
      method: 'post',      请求方式 post、get
      data: params,     返回数据
      mock: false	  mock模拟
    })
  },
```

#### 2. 环境配置

```js
.env.dev 文件
NODE_ENV=development
VITE_Name=jack
环境配置 ：
const env = import.meta.env.MODE || 'prod';
const EnvConfig = {
  dev: {
    baseApi: '/api',
    // mockApi: 'https://www.fastmock.site/mock/86d52c75ad7f131c61d02db8bbfc710f/api'

    mockApi: 'https://www.fastmock.site/mock/c1c302e8baed9894c48c17e4738c092e/api'  //素材接口

  },
  test: {
    baseApi: '//test.futurefe.com/api',
    mockApi: 'https://www.fastmock.site/mock/86d52c75ad7f131c61d02db8bbfc710f/api'
  },
  prod: {
    baseApi: '//futurefe.com/api',
    mockApi: 'https://www.fastmock.site/mock/86d52c75ad7f131c61d02db8bbfc710f/api'
  }
}
export default {
  env,
  mock: true,
  namespace: 'manager',
  ...EnvConfig[env]
}
```

#### 3. Router使用

```js
路由的使用 ：
import { createRouter, createWebHashHistory } from "vue-router";
import Home from './../components/Home.vue'
import storage from './../utils/storage'
import API from './../api'
import utils from './../utils/utils'
路由封装 routes
const routes =[
    {
    name: 'home',  名字
    path: '/',   路径
    meta: {      标题
      title: '首页'
    },
    component: Home,   组件路径
    // component: () => import('../views/User.vue') 路由懒加载
    redirect: '/user',    重定向路径
    children: [    子路由 （二级路由）
    	{
        name: 'welcome',   名字
        path: '/welcome',   路径
        meta: {				标题
          title: '欢迎体验Vue3全栈课程'
        },
        component: () => import('../views/Welcome.vue') 路由懒加载
      },
   ]
    },
         {
    name: 'login',
    path: '/login',
    meta: {
      title: '登录'
    },
    component: () => import('../views/Login.vue')
  },
  {
    name: '404',
    path: '/404',
    meta: {
      title: '不存在'
    },
    component: () => import('../views/404.vue')
  },
]
// 导出路由
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

async function loadAsyncRoutes() {
  let userInfo = storage.getItem('userInfo') || []
  if (userInfo.token) {
    try {
      const { menuList } = await API.getPermissionList()
      let routes = utils.generateRoute(menuList)
      routes.map(route => {
        let url = `./../views/${route.component}.vue`
        route.component = () => import(url);
        // console.log(router);
        router.addRoute("home", route);
      })
    } catch (error) {

    }
  }
}
await loadAsyncRoutes()


//  路由守卫 to：去哪 from ：哪来 next：下一步去 to
router.beforeEach((to, from, next) => {
    //  router.hasRoute(to.name)  判断有没有改路由
    // router 路由全局对象 or this.$router
    // router.addRoute("home", route);  添加到路由全局对象
  if (router.hasRoute(to.name)) {
    document.title = to.meta.title;
    next()
  } else {
    next('/404')
  }
})
```

#### 4. Vuex 管理

```js
Vuex 管理：
import { createStore } from 'vuex'
import mutations from './mutations'    状态更改
import storage from './../utils/storage'    本地存储
state:
提供唯一的公共数据源，所有共享的数据统一放到store的state进行储存，相似与data
const state = {
   // 获取用户信息
  userInfo: storage.getItem("userInfo") || {}, 
  // 菜单列表
  menuList: storage.getItem("menuList"),
  // 按钮列表
  actionList: storage.getItem("actionList"),
    // 小点
  noticeCount: 0
}
// 抛出实例
export default createStore({
  state,
  mutations
})

// mutations 
import storage from './../utils/storage'  本地存储
mutations :
更改 Vuex 的 store 中的状态的唯一方法是提交 mutation。Vuex 中的 mutation 非常类似于事件：每个 mutation 都有一个字符串的事件类型 (type)和一个回调函数 (handler)。这个回调函数就是我们实际进行状态更改的地方，并且它会接受 state 作为第一个参数：
使用 ： commit触发Mutation操作 this.$store.commit("addcount",10) 
// 抛出对象
export default {
    // 存储用户信息
  saveUserInfo(state, userInfo) {
    state.userInfo = userInfo;
    storage.setItem('userInfo', userInfo)
  },
    // 存储菜单列表
  saveMenuList(state, menuList) {
    state.menuList = menuList;
    storage.setItem('menuList', menuList)
  },
    //存储按钮
  saveActionList(state, actionList) {
    state.actionList = actionList;
    storage.setItem('actionList', actionList)
  },
    // 存储小点
  saveNoticeCount(state, noticeCount) {
    state.noticeCount = noticeCount;
    storage.setItem('noticeCount', noticeCount)
  }
}
Action ——进行异步操作 ：
Action和Mutation相似，Mutation 不能进行异步操作，若要进行异步操作，就得使用Action
直接使用  dispatch触发Action函数 ：this.$store.dispatch("reduce")

Getter ：
类似于vue中的computed，进行缓存，对于Store中的数据进行加工处理形成新的数据

Modules ：
遇见大型项目时，数据量大，store就会显得很臃肿
为了解决以上问题，Vuex 允许我们将 store 分割成模块（module）。每个模块拥有自己的 state、mutation、action、getter、甚至是嵌套子模块——从上至下进行同样方式的分割：
```

#### 5. LocalStorage存储

```js

浏览器存储封装：
/**
 * Storage二次封装
 * @author JackBean
 */

// localStorage 的四个api
import config from './../config'    环境配置
export default {
  setItem(key, val) {
    let storage = this.getStroage();
    storage[key] = val;
    window.localStorage.setItem(config.namespace, JSON.stringify(storage));
  },
  getItem(key) {
    return this.getStroage()[key]
  },
  getStroage() {
    return JSON.parse(window.localStorage.getItem(config.namespace) || "{}");
  },
    // 清除一项
  clearItem(key) {
    let storage = this.getStroage()
    delete storage[key]
    window.localStorage.setItem(config.namespace, JSON.stringify(storage));
  },
    // 清除本地
  clearAll() {
    window.localStorage.clear()
  }
}
```

#### 6. Utils 工具函数

```js
工具函数封装 日期格式：
/**
 * 工具函数封装
 */
export default {
  formateDate(date, rule) {
    let fmt = rule || 'yyyy-MM-dd hh:mm:ss'
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, date.getFullYear())
    }
    const o = {
      // 'y+': date.getFullYear(),
      'M+': date.getMonth() + 1,
      'd+': date.getDate(),
      'h+': date.getHours(),
      'm+': date.getMinutes(),
      's+': date.getSeconds()
    }
    for (let k in o) {
      if (new RegExp(`(${k})`).test(fmt)) {
        const val = o[k] + '';
        fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? val : ('00' + val).substr(val.length));
      }
    }
    return fmt;
  },
    // 动态路由递归函数
  generateRoute(menuList) {  参数：菜单列表
    let routes = []   定义路由数组
    const deepList = (list) => {
      while (list.length) {   菜单长度大于0
        let item = list.pop()   取最后一个
        if (item.action) {    判断行为
          routes.push({      路由数组中新增元素
            name: item.component,	组件名字 User
            path: item.path,	组件路径 /system/user
            meta: {		 
              title: item.menuName 浏览器标题
            },
            component: item.component  组件名字
          })
        }
        // 判断子菜单和行为
        if (item.children && !item.action) {
            // 继续调用，子菜单
          deepList(item.children)
        }
      }
    }
    // 集合函数
    deepList(menuList)
    return routes;
  }
}
```

#### 7. Request 网络请求

```js
axios 网络请求封装 ：
/**
 * axios二次封装
 */
import axios from 'axios'
import config from './../config'
import { ElMessage } from 'element-plus'
import router from './../router'
import storage from './storage'

const TOKEN_INVALID = 'Token认证失败，请重新登录'
const NETWORK_ERROR = '网络请求异常，请稍后重试'

// 创建axios实例对象，添加全局配置
const service = axios.create({
  baseURL: config.baseApi,   公共路径
  timeout: 8000		请求数据
})

// 请求拦截
service.interceptors.request.use((req) => {
    //  请求头
  const headers = req.headers; 
    // 定义token
  const { token = "" } = storage.getItem('userInfo') || {};
    // 拼接请求头携带token
  if (!headers.Authorization) headers.Authorization = 'Bearer ' + token;
  return req;
})

// 响应拦截
service.interceptors.response.use((res) => {
    // 解构数据 状态码，数据，提示
  const { code, data, msg } = res.data;
    // 成功返回data
  if (code === 200) {
    return data;
  } else if (code === 500001) {   // 失败返回
    ElMessage.error(TOKEN_INVALID)
    setTimeout(() => {
      router.push('/login')
    }, 1500)
      // 返回promise回调含函数 result成功的回调 reject失败的回调
    return Promise.reject(TOKEN_INVALID)
  } else {
    ElMessage.error(msg || NETWORK_ERROR)
    return Promise.reject(msg || NETWORK_ERROR)
  }
})
/**
 * 请求核心函数
 * @param {*} options 请求配置
 *	options对应 
     login(params) {
        return request({
          url: '/users/login',
          method: 'post',
          data: params,
          mock: false
        })
  	},
 */
function request(options) {
    // 请求方式
  options.method = options.method || 'get'
  if (options.method.toLowerCase() === 'get') {
      // 返回data
    options.params = options.data;
  }
    // 获取mock环境
  let isMock = config.mock;
    // 判断不等于  undefined
  if (typeof options.mock != 'undefined') {
    isMock = options.mock;
  }
  if (config.env === 'prod') {
    service.defaults.baseURL = config.baseApi
  } else {
    service.defaults.baseURL = isMock ? config.mockApi : config.baseApi
  }

  return service(options)
}

['get', 'post', 'put', 'delete', 'patch'].forEach((item) => {
  request[item] = (url, data, options) => {
    return request({
      url,
      data,
      method: item,
      ...options
    })
  }
})

export default request;
```

#### 8. Main 入口

```js
入口函数 ：
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import request from './utils/request'
import storage from './utils/storage'
import api from './api'
import store from './store'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
console.log("环境变量=>", import.meta.env)

// axios.get(config.mockApi + '/login').then((res) => {
//   console.log(res);
// })
const app = createApp(App)
// 定义全局指令
app.directive('has', {
  // 声明节点之前  el：元素  binding ：属性
  beforeMount: function (el, binding) {
    // 拿到vuex的 actionList
    let actionList = storage.getItem('actionList');
    // 拿到元素的值
    let value = binding.value;
    // 判断actionList 有没有value  返回一个 布尔值
    let hasPermission = actionList.includes(value)
    if (!hasPermission) {
      // 元素的元素设置为表空间
      el.style = 'display:none';
      // 删除父节点
      setTimeout(() => {
        el.parentNode.removeChild(el);
      }, 0)
    }
  }
})



for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

挂载到全局api
app.config.globalProperties.$api = api
app.config.globalProperties.$request = request
app.config.globalProperties.$storage = storage
app
  .use(router)
  .use(ElementPlus)
  .use(store)
  .mount('#app')


```

#### 9. Vite.config.js 配置

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
const path = require('path')

// https://vitejs.dev/config/
export default defineConfig({
  // 配置路径别名
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // css: {
  //   preprocessorOptions: {
  //     scss: {
  //       additionalData: `@import '@/assets/style/base.scss';`
  //     }
  //   }
  // },
  server: {
    host: 'localhost',
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000"
      }
    }
  },
  plugins: [vue()]
})

```

#### 10. .gitignore 提交忽略

```
node_modules
.DS_Store
dist
dist-ssr
*.local
```



### 二，要求

```
1. 会定义接口 api
2. 会配置项目环境 
3. 会封装路由
4. 会使用vuex管理数据
5. 会封装本地存储
6. 会封装axios网络请求
7. 会使用递归生成菜单数
```

### 三，功能点

#### 1. 权限控制

```js
 // 权限
    handleOpenPermission(row) {
      console.log(row); //表格数据
      // 角色id
      this.curRoleId = row._id;
      // 角色名字
      this.curRoleName = row.roleName;
      // 角色列表弹框
      this.showPermission = true;
      // 获取选择的权限id
      let { checkedKeys } = row.permissionList;
      // 延时加载生成数
      setTimeout(() => {
        this.$refs.tree.setCheckedKeys(checkedKeys);
      });
    },
    // 权限提交
    async handlePermissionSubmit() {
      let nodes = this.$refs.tree.getCheckedNodes(); //获取选中节点
      let halfKeys = this.$refs.tree.getHalfCheckedKeys(); // 未选中
      let checkedKeys = [];
      let parentKeys = [];
      nodes.map((node) => {
        // 没有孩子
        if (!node.children) {
          // 添加到
          checkedKeys.push(node._id);
        } else {
          // 父id
          parentKeys.push(node._id);
        }
      });
      // 参数
      let params = {
        // 角色id
        _id: this.curRoleId,
        // 权限列表
        permissionList: {
          // 已选
          checkedKeys,
          // 未选 concat 组合
          halfCheckedKeys: parentKeys.concat(halfKeys),
        },
      };
      // 调用接口
      await this.$api.updatePermission(params);
      this.showPermission = false;
      this.$message.success("设置成功");
      // 重新获取角色列表
      this.getRoleList();
    },
```

#### 2.递归菜单

```vue
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
        
        
        <!-- 一个模板包裹 -->
  <template v-for="menu in userMenu" :key="menu._id">
    <el-sub-menu
      v-if="
        menu.children &&
        menu.children.length > 0 &&
        menu.children[0].menuType == 1
      "
      :index="menu.path"
    >
      <template #title>
        <!-- <el-icon></el-icon> -->
        <span>{{ menu.menuName }}</span>
      </template>
      <!-- 二级菜单 -->
      <tree-menu :userMenu="menu.children"></tree-menu>
    </el-sub-menu>
    <el-menu-item
      v-else-if="menu.menuType == 1"
      :index="menu.path"
      :key="menu._id"
      >{{ menu.menuName }}</el-menu-item
    >
  </template>

export default {
  name: "TreeMenu",
  // 接收父组件  props
  props: {
    userMenu: {
      type: Array,
      default() {
        return [];
      },
    },
  },
};
```

# 九，造轮子

## 脚手开发流程

### 一，初始化项目

```js
1. yarn init || npm init   初始化package.json
question name (v-cli):
question version (1.0.0):
question description: one cli for create project
question entry point (index.js):
question repository url:
question author: emo猪
question license (MIT):
question private:
2. 
```



### 二，插件介绍

#### 1. commander 命令行插件

```js
yarn add commander -S

// 命令行
// 通过commander解构一个program
const { program } = require('commander')
// 设定版本号
program.version('0.0.1')

// 指定一个参数
program.option("-n", "输出名称")
program.option("-t --type <type>", "项目类型")


// 输出
//  node .\bin\demo-commander.js -n
const options = program.opts()
// 打印
console.log("opts=>", options); //opts=> { n: true }

// 定义一个命令行
// node .\bin\demo-commander.js create demo-1
program
  .command("create <app-name>")  // 解析
  .description("创建一个标准的vue项目") //干什么的
  .action(name => {    // 动作
    console.log("正在创建项目，名字：" + name); //正在创建项目，名字：demo-1

  })

// 解析参数,放到最后面
program.parse(process.argv)
```



#### 2. filet 大型字符-终端打印大型文字

```js
yarn add figlet -S

// 终端打印大型文字

// 获取实例
let figlet = require('figlet')

// 工具库
// 任何一个对象包装成promise
let { promisify } = require('util')
let asyncFiglet = promisify(require('figlet'))

// 第一种方式，callback调用
figlet('Hellow World!', function (err, data) {
  if (err) {
    console.log("something went wrong...");
    console.dir(err);
    return
  }
  console.log(data);
})

// 异步调用
async function run() {
  try {
    let data = await asyncFiglet("vue 3")
    console.log(data);
  } catch (error) {
    console.log(error);
  }

}
run()
```



#### 3. chalk 彩色文字，美化终端字符显示

```
yarn add chalk -S |yarn add chalk@^4.0.0
```



#### 4. inquirer 命令行参数输入交互

```js
yarn add inquirer -S ||yarn add inquirer@^8.0.0 -S

// 命令行参数输入交互


// 通过commander解构一个program
const { program } = require('commander')

// 获取实例
let inquirer = require("inquirer")

// 设定版本号
program.version('0.0.1')

// 指定一个参数
program.option("-n", "输出名称")
program.option("-t --type <type>", "项目类型")

// 使用inquirer
inquirer.prompt([
  {
    name: "userName",
    type: "input",
    message: "你的名字叫什么"
  },
  {
    name: "age",
    type: "checkbox",
    message: "你多大了",
    choices: ["20-25", "25-30", "30-40", "40以上"],
  },
  {
    name: "salary",
    type: "list",
    message: "你的薪资是多少？",
    choices: ["10k-20k", "20k-30k", "30k-40k"]
  }

]).then(answer => {
  console.log("回答内容", answer);
  // 回答内容 { userName: 'emo', age: [ '20-25' ], salary: '10k-20k' }
})
// 你的名字叫什么 emo
// ? 你多大了 20-25
// ? 你的薪资是多少？ 10k-20k

// 解析参数,放到最后面
program.parse(process.argv)
```



#### 5. shelljs

```
yarn add shelljs -S
```



#### 6. ora  loading效果

```js
yarn add ora -S  || yarn add ora@^5.1.2

// import ora from 'ora';
// package.json 需要添加  "type": "module",才支持import  加了就不支持 require 了

const ora = require('ora')
const spinner = ora('Loading unicorns').start();

setTimeout(() => {
  spinner.color = 'yellow';
  spinner.text = 'Loading rainbows';
  spinner.stop()
}, 3000);

```



#### 7. download-git-repo  仓库下载

```js
yarn add download-git-repo -S

let download = require("download-git-repo");
download(
  "direct:https://gitee.com/ting-feng-zhu/vue3_manager_server.git",
  "Demo",
  { clone: true },
  function (err) {
    console.log(err ? "Error" : "Success");
  }
);


```



### 三，脚手架

#### 1.基本流程

```js
1.创建空项目文件夹
2. 通过npm | yarn 初始化package
npm init | yarn init
3. 安装插件
yarn add | npm install
4. 插件bin目录
5. 开发命令行
6. "bin": {
    "v": "./bin/index.js"
  },

```

#### 2. 实现脚手架开发

```js
/**
 * 开发后台脚手架，快速生成标准vue后台架构
 */

let program = require("commander")
// promise库
let { promisify } = require("util")
let asyncFiglet = promisify(require("figlet"))
let chalk = require("chalk")
let inquirer = require("inquirer")
// 
let init = require("./init")
// 日志打印
const log = content => console.log(chalk.yellow(content));


// 版本号
program.version("1.0.0")
// 命令行参数
program.option("-n --name <type>", "output name")

// 打印大型logo
async function printLogo() {
  let data = await asyncFiglet("v-cli")
  log(data)
}
// 指定命令行
program
  .command("create <app-name>")  // 解析
  .description("创建一个标准的vue项目") //干什么的
  .action(async name => {    // 动作
    // 打印logo
    await printLogo()
    log("正在创建项目..."); //正在创建项目
    let answer = await inquirer.prompt([
      {
        name: "language",
        type: "list",
        message: "请选择语言版本",
        choices: ["Javascript", "Typescript"]
      }
    ])
    if (answer.language == "Javascript") {
      // 下载框架
      log("js版本，即将下载")
      init(name)
    }
    else {
      log("敬请期待")
    }
  })

// 解析
program.parse(program.argv)

```

#### 3. init项目

```js
/**
 * 项目克隆
 */
let { promisify } = require('util')
const ora = require("ora")
const download = promisify(require("download-git-repo"))
let chalk = require("chalk")
const shell = require("shelljs")

// 日志函数
const log = content => console.log(chalk.yellow(content));

module.exports = async (appName) => {
  log(`创建项目 ${appName}`)
  // 删除
  shell.rm("-rf", appName)
  const spinner = ora("下载中...").start()
  try {
    await download('direct:https://gitee.com/ting-feng-zhu/vue3_manager_server.git', appName, { clone: true })
    // spinner.successd("下载完成")
    log(`
下载完成，请启动：
cd ${appName}
安装依赖：
yarn or npm i
运行项目：
npm run dev
或者
yarn dev
    `)
    spinner.stop()

  } catch (error) {
    log(`下载失败`, error)
    spinner.stop()
  }

  // await download('direct:https://gitee.com/ting-feng-zhu/vue3_manager_server.git', appName, { clone: true }).then((result) => {
  //   // spinner.successd("下载完成")
  //   log(`下载完成，请启动：
  //   cd ${appName}
  //   npm run dev
  //   或者
  //   yarn dev
  //   `)
  //   spinner.stop()
  // }).catch((err) => {
  //   log(`下载失败`, err)
  //   spinner.stop()
  // });


}

```

### 四，开发 Low Code

#### 1. VInput

```vue
<template>
  <div>
    <el-input v-model:modelValue="userName" @update:modeValue="handleInput"></el-input>
    <el-button @click="handleSubmit">提交测试</el-button>
  </div>
</template>

<script>
import { ref } from "@vue/reactivity";
export default {
  name: "VInput",
  props: ["modelValue", "title"],
  // 接收父元素传递的
  setup(props, context) {
    let userName = ref(props.modelValue);

    const handleInput = (val) => {
      userName.value = val;
      context.emit("update:modeValue", val);
    };

    const handleSubmit = (value) => {
      context.emit("handleSubmit", userName);
    };

    return {
      userName,
      handleSubmit,
      handleInput,
    };
  },
};
</script>

<style>
</style>

```

##### app.vue

```vue
<template>
  <!-- <router-view></router-view> -->
  <div>
    <v-input
      v-model:modelValue="userName"
      v-model:title="title"
      @handleSubmit="handleSubmit"
    ></v-input>
  </div>
</template>

<script>
import VInput from "./components/VInput.vue";
import { ref } from "@vue/reactivity";
export default {
  name: "App",
  components: { VInput },

  setup() {
    let userName = ref("jack");
    let title = ref("vue3");
    const handleSubmit = (values) => {
      console.log("接收数据", values);
      console.log("当前对象", userName);
    };
    return {
      userName,
      title,
      handleSubmit,
    };
  },
};
</script>
<style lang="scss">
@import "./assets/style/reset.css";
@import "./assets/style/index.scss";
</style>

```



#### 2. package 文件夹 VTable

```

```

##### index

```js
import BaseTable from "./BaseTable.vue";

// install 方法
BaseTable.install = (app) => {
  // 组件注册
  app.component(BaseTable.name, BaseTable)
}


export default BaseTable

```

##### BaseTable.vue

```vue
<template>
  <div class="base-table">
    <div class="action">
      <!-- 插槽 -->
      <slot name="action"></slot>
    </div>
    <!-- v-bind="$attrs" 绑定使用的事件和数据  -->
    <el-table v-bind="$attrs">
      <!-- 包裹表格 -->
      <template v-for="item in columns" :key="item.prop">
        <!-- 复选框 -->
        <el-table-column
          type="selection"
          width="55"
          v-if="item.type == 'selection'"
          key="selection"
        />

        <el-table-column v-bind="item" v-else-if="!item.type">
        </el-table-column>
        <!--  -->
        <el-table-column v-if="item.type == 'action'" v-bind="item">
          <!-- 自定义列 -->
          <template #default="scope">
            <template v-for="(btn, index) in item.list" :key="index">
              <el-button
                :type="btn.type || 'text'"
                size="small"
                @click="handleAction(index, scope.row)"
                >{{ btn.text }}</el-button
              >
            </template>
          </template>
        </el-table-column>
      </template>
    </el-table>

    <el-pagination
      class="pagination"
      background
      layout="prev, pager, next"
      :total="pager.total"
      :page-size="pager.pageSize"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script>
export default {
  name: "BaseTable",
  // 定义props
  props: ["columns", "pager"],
  setup(props, { emit }) {
    // 行为
    const handleAction = (index, row) => {
      // 抛回去
      emit("handleAction", { index, row: { ...row } });
    };
    // 分页
    const handleCurrentChange = (pageNum) => {
      emit("handleCurrentChange", pageNum);
    };
    return {
      handleAction,
      handleCurrentChange,
    };
  },
};
</script>

<style>
</style>

```



#### 3. package 文件夹 VForm

##### index.js

```js
import QueryForm from "./QueryForm.vue";

// install 方法
QueryForm.install = (app) => {
  // 组件注册
  app.component(QueryForm.name, QueryForm)
}


export default QueryForm

```

##### QueryForm.vue

```vue
<template>
  <el-form ref="queryForm" :inline="true" :model="queryModel">
    <!--  -->
    <template v-for="(item, index) in form" :key="index">
      <FormItem :item="item" v-bind="item" v-model="queryModel[item.model]" />
    </template>

    <el-form-item>
      <el-button type="primary" @click="handleQuery">查询</el-button>

      <el-button @click="handleReset">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { reactive } from "@vue/reactivity";
/**
 * form =[
 *  typ:"input"
 *  model:"userId"
 *  label:"用户ID"
 *  placeholder="请输入用户ID"
 * ]
 */

import FormItem from "./FormItem.vue";
import { getCurrentInstance } from "@vue/runtime-core";
export default {
  name: "QueryForm",
  props: ["modelValue", "form"],
  // 事件
  emits: ["update:modelValue", "handleQuery"],

  components: { FormItem },
  setup(props, context) {
    const ctx = getCurrentInstance();
    //
    const form = props.form;
    //
    const queryModel = reactive({
      ...props.modelValue,
    });
    //
    const handleReset = () => {
      ctx.refs.queryForm.resetFields();
    };
    //
    const handleQuery = () => {
      // todo
      context.emit("update:modelValue", { ...queryModel });
      // console.log(form);
      context.emit("handleQuery", { ...queryModel });
    };

    //
    return {
      queryModel,
      handleReset,
      handleQuery,
    };
  },
};
</script>

<style>
</style>

```

##### FormItem.vue

```vue
<template>
  <el-form-item :prop="item.model">
    <el-input v-if="item.type == 'input'" v-bind="$attrs" />
    <el-select v-else-if="item.type == 'select'" v-bind="$attrs">
      <el-option
        v-for="option in item.options"
        :key="option.value"
        v-bind="option"
      >
      </el-option>
    </el-select>
  </el-form-item>
</template>

<script>
export default {
  name: "QueryForm",
  props: ["item"],
  setup() {},
};
</script>
 
<style>
</style>

```

##### User.vue

```vue
<div class="query-form">
      <!-- low code -->
      <query-form
        :form="form"
        v-model="user"
        @handleQuery="handleQuery"
      ></query-form>
    </div>



  const form = [
      {
        type: "input",
        model: "userId",
        label: "用户ID",
        placeholder: "请输入用户ID",
      },
      {
        type: "input",
        model: "userName",
        label: "用户名称",
        placeholder: "请输入用户名称",
      },
      {
        type: "select",
        model: "state",
        label: "状态",
        placeholder: "请选择状态",
        options: [
          {
            label: "所有",
            value: 0,
          },
          {
            label: "在职",
            value: 1,
          },
          {
            label: "离职",
            value: 2,
          },
          {
            label: "试用期",
            value: 3,
          },
        ],
      },
    ];

    // 初始化用户表单对象
    const user = ref({
      state: 1,
    });



   // 获取用户列表
    const getUserList = async () => {
      // 获取用户状态和页码
      let params = { ...user.value, ...pager };
      // 调用接口获取数据 params 作为参数
      const { list, page } = await proxy.$api.getUserList(params);
      userList.value = list;
      // console.log(userList.value);
      pager.total = page.total;
    };



  // 查询
    const handleQuery = (values) => {
      console.log(values, user.value);
      // 重新调用用户列表
      getUserList();
    };


return {
form
}

```

#### main

#### data.js

```js
import QueryForm from "./index";
import BaseTable from "./BaseTable";


// 默认导出一个对象
export default {
  install(app) {
    app.use(QueryForm)
    app.use(BaseTable)
  }
}

```



```js
import Rocket from "./../package/data";
 .use(Rocket)

```

