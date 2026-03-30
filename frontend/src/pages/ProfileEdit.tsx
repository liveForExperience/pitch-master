import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast, Button, Input, Form, Selector, NavBar } from 'antd-mobile';
import { updatePlayerProfile, type ProfileUpdateData } from '../api/player';
import useAuthStore from '../store/useAuthStore';
import { UserCircle, Ruler, Activity } from 'lucide-react';

const gridStyle = {
  backgroundImage:
    'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
  backgroundSize: '32px 32px',
};

const ProfileEdit: React.FC = () => {
  const navigate = useNavigate();
  const { me, loading, fetched, fetchMe } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!fetched) {
      fetchMe();
    }
  }, [fetched, fetchMe]);

  useEffect(() => {
    if (me?.player || me?.user) {
      form.setFieldsValue({
        nickname: me.player?.nickname || '',
        realName: me.user?.realName || '',
        position: me.player?.position ? [me.player.position] : [],
        preferredFoot: me.player?.preferredFoot ? [me.player.preferredFoot] : [],
        age: me.player?.age || undefined,
        height: me.player?.height || undefined,
      });
    }
  }, [me, form]);

  const onFinish = async (values: any) => {
    const data: ProfileUpdateData = {
      nickname: values.nickname,
      realName: values.realName,
      position: values.position?.[0], // Selector returns array
      preferredFoot: values.preferredFoot?.[0], // Selector returns array
      age: values.age ? parseInt(values.age, 10) : undefined,
      height: values.height ? parseInt(values.height, 10) : undefined,
    };

    setSubmitting(true);
    try {
      await updatePlayerProfile(data);
      Toast.show({ icon: 'success', content: '更新成功' });
      await fetchMe(); // refresh user state
      navigate(-1);
    } catch (error) {
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center dark:bg-neutral-950">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans dark:bg-neutral-950">
      {/* ─── Hero Header ─── */}
      <div className="relative overflow-hidden pb-4 pt-safe flex-none">
        <div className="pointer-events-none absolute right-[-10%] top-0 h-64 w-64 rounded-full bg-gradient-to-br from-primary/60 to-primary/0 opacity-20 blur-3xl dark:opacity-10" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.015]" style={gridStyle} />
        
        <NavBar
          onBack={() => navigate(-1)}
          className="relative z-10 px-4 pt-2 [&_.adm-nav-bar-title]:font-black [&_.adm-nav-bar-title]:text-[17px] [&_.adm-nav-bar-title]:text-gray-900 dark:[&_.adm-nav-bar-title]:text-white [&_.adm-nav-bar-back-arrow]:text-gray-600 dark:[&_.adm-nav-bar-back-arrow]:text-neutral-400"
        >
          个人信息设置
        </NavBar>

        <div className="relative z-10 px-6 mt-4">
           {/* Section Header */}
           <div className="mb-2 text-[11px] font-black tracking-[0.2em] text-primary/80 uppercase">
             Profile Update
           </div>
           <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
             完善您的档案<br />
             <span className="text-gray-400 dark:text-neutral-500 font-bold italic text-lg opacity-80">Make it Yours.</span>
           </h1>
        </div>
      </div>

      {/* ─── Form Container ─── */}
      <div className="flex-1 w-full max-w-lg mx-auto px-4 pb-24 space-y-5">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="space-y-4"
          footer={
            <Button 
                block 
                type="submit" 
                color="primary" 
                size="large" 
                loading={submitting}
                className="rounded-2xl h-14 font-bold text-[16px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary"
            >
              保存更改
            </Button>
          }
        >
          {/* Group 1: Identity */}
          <div className="rounded-[1.75rem] bg-white border border-gray-100 p-5 shadow-sm dark:bg-[#111] dark:border-neutral-800">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                   <UserCircle size={16} />
                </div>
                <div className="font-bold text-gray-900 dark:text-white">身份信息</div>
             </div>
             <Form.Item
               name="nickname"
               label="球场展示名"
               rules={[{ required: true, message: '请填写展示名' }]}
               className="[&_.adm-form-item-label]:font-bold [&_.adm-form-item-label]:text-gray-500 dark:[&_.adm-form-item-label]:text-neutral-400"
             >
               <Input placeholder="输入昵称 (e.g., 梅老板)" className="pt-2 text-[15px] font-semibold dark:text-white" />
             </Form.Item>
             <Form.Item
               name="realName"
               label="真实姓名"
               className="[&_.adm-form-item-label]:font-bold [&_.adm-form-item-label]:text-gray-500 dark:[&_.adm-form-item-label]:text-neutral-400 border-none"
             >
               <Input placeholder="仅用于内部管理，可选" className="pt-2 text-[15px] font-semibold dark:text-white" />
             </Form.Item>
          </div>

          {/* Group 2: Body Stats */}
          <div className="rounded-[1.75rem] bg-white border border-gray-100 p-5 shadow-sm dark:bg-[#111] dark:border-neutral-800">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                   <Ruler size={16} />
                </div>
                <div className="font-bold text-gray-900 dark:text-white">身体与经验</div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="age"
                  label="年龄"
                  className="[&_.adm-form-item-label]:font-bold [&_.adm-form-item-label]:text-gray-500 dark:[&_.adm-form-item-label]:text-neutral-400"
                >
                  <Input type="number" placeholder="岁" className="pt-2 text-[15px] font-semibold dark:text-white" />
                </Form.Item>

                <Form.Item
                  name="height"
                  label="身高 (cm)"
                  className="[&_.adm-form-item-label]:font-bold [&_.adm-form-item-label]:text-gray-500 dark:[&_.adm-form-item-label]:text-neutral-400"
                >
                  <Input type="number" placeholder="cm" className="pt-2 text-[15px] font-semibold dark:text-white" />
                </Form.Item>
             </div>
          </div>

          {/* Group 3: Technical Specs */}
          <div className="rounded-[1.75rem] bg-white border border-gray-100 p-5 shadow-sm dark:bg-[#111] dark:border-neutral-800">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                   <Activity size={16} />
                </div>
                <div className="font-bold text-gray-900 dark:text-white">技术偏好</div>
             </div>

             <Form.Item name="preferredFoot" label="惯用脚" className="[&_.adm-form-item-label]:font-bold [&_.adm-form-item-label]:text-gray-500 dark:[&_.adm-form-item-label]:text-neutral-400">
                <Selector
                  columns={3}
                  options={[
                    { label: '左脚', value: 'LEFT' },
                    { label: '右脚', value: 'RIGHT' },
                    { label: '双足', value: 'BOTH' },
                  ]}
                  className="[&_.adm-selector-item]:rounded-xl [&_.adm-selector-item]:font-semibold [&_.adm-selector-item-active]:font-bold [&_.adm-selector-item-active]:bg-primary/10 [&_.adm-selector-item-active]:border-primary"
                />
             </Form.Item>

             <Form.Item name="position" label="擅长位置" className="[&_.adm-form-item-label]:font-bold [&_.adm-form-item-label]:text-gray-500 dark:[&_.adm-form-item-label]:text-neutral-400 border-none">
                <Selector
                  columns={4}
                  options={[
                    { label: 'FW 前锋', value: 'FW' },
                    { label: 'MF 中场', value: 'MF' },
                    { label: 'DF 后卫', value: 'DF' },
                    { label: 'GK 门将', value: 'GK' },
                  ]}
                  className="[&_.adm-selector-item]:rounded-xl [&_.adm-selector-item]:font-semibold [&_.adm-selector-item-active]:font-bold [&_.adm-selector-item-active]:bg-primary/10 [&_.adm-selector-item-active]:border-primary text-[13px]"
                />
             </Form.Item>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default ProfileEdit;
