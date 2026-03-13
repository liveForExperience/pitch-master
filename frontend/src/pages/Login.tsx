import React, { useState } from 'react';
import { Form, Input, Button, Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', values.username);
      formData.append('password', values.password);
      
      await apiClient.post('/auth/login', formData);
      Toast.show({ icon: 'success', content: '登录成功' });
      navigate('/matches');
    } catch (err) {
      // 拦截器已处理错误提示
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 pt-20">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">Oldboy Club</h1>
        <p className="text-neutral-400">老男孩俱乐部赛事管理平台</p>
      </div>

      <div className="bg-neutral-800 rounded-2xl p-6 shadow-xl">
        <Form
          layout="vertical"
          onFinish={onFinish}
          footer={
            <Button
              block
              type="submit"
              color="primary"
              size="large"
              loading={loading}
              className="mt-4"
            >
              登录
            </Button>
          }
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" clearable className="text-white" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input type="password" placeholder="请输入密码" clearable />
          </Form.Item>
        </Form>
      </div>
      
      <div className="mt-8 text-center text-neutral-500 text-sm">
        初始管理员: admin / admin123
      </div>
    </div>
  );
};

export default Login;
