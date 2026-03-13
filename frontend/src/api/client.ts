import axios from 'axios';
import { Toast } from 'antd-mobile';

const apiClient = axios.create({
  // 基础路径通过 Vite Proxy 转发
  timeout: 10000,
  withCredentials: true, // 允许携带 Cookie (Shiro Session)
});

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code === 200) {
      return res.data;
    } else {
      Toast.show({
        icon: 'fail',
        content: res.message || 'Error',
      });
      return Promise.reject(new Error(res.message || 'Error'));
    }
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // 未认证，跳转登录
      window.location.href = '#/login';
    } else {
      Toast.show({
        icon: 'fail',
        content: '网络连接失败',
      });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
