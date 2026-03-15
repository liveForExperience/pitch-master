import axios from 'axios';
import { Toast } from 'antd-mobile';

const apiClient = axios.create({
  baseURL: '/',
  timeout: 10000,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code === 200) {
      return res.data;
    } else {
      if (res.code === 401) {
        // 关键修复：未登录时强制清除 Hash 路由，跳转到登录页
        window.location.hash = '#/login';
      }
      Toast.show({ icon: 'fail', content: res.message || 'Error' });
      return Promise.reject(new Error(res.message || 'Error'));
    }
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      window.location.hash = '#/login';
    } else {
      Toast.show({ icon: 'fail', content: '连接后端失败，请检查服务状态' });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
