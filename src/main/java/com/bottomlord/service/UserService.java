package com.bottomlord.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bottomlord.entity.User;

/**
 * 用户服务接口
 *
 * @author Gemini
 */
public interface UserService extends IService<User> {

    /**
     * 根据用户名查询用户
     *
     * @param username 用户名
     * @return 用户信息，不存在返回 null
     */
    User getByUsername(String username);

    /**
     * 注册新用户
     *
     * @param user 用户实体（包含明文密码）
     * @return 注册成功的用户
     */
    User register(User user);
}
