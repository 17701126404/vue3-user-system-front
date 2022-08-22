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

router.beforeEach((to, from, next) => {
  if (router.hasRoute(to.name)) {
    document.title = to.meta.title;
    next()
  } else {
    next('/404')
  }
})
export default router