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


app.config.globalProperties.$api = api
app.config.globalProperties.$request = request
app.config.globalProperties.$storage = storage
app
  .use(router)
  .use(ElementPlus)
  .use(store)
  .mount('#app')
