// 环境配置


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