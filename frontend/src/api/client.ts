import axios from 'axios';
import { Toast } from 'antd-mobile';

const apiClient = axios.create({
  baseURL: '/', // 使用相对路径，由 Vite Proxy 处理
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
      // 这里的错误提示可以根据 code 细化
      if (res.code === 409) {
        Toast.show({ icon: 'info', content: res.message });
      } else {
        Toast.show({ icon: 'fail', content: res.message || 'Error' });
      }
      return Promise.reject(new Error(res.message || 'Error'));
    }
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      window.location.hash = '/login';
    } else {
      Toast.show({ icon: 'fail', content: '网络连接失败' });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
