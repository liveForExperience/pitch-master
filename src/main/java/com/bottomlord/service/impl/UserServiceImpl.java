package com.bottomlord.service.impl;

import cn.hutool.core.util.IdUtil;
import cn.hutool.crypto.SecureUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.entity.User;
import com.bottomlord.mapper.UserMapper;
import com.bottomlord.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 用户服务实现类
 *
 * @author Gemini
 */
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    @Override
    public User getByUsername(String username) {
        return baseMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public User register(User user) {
        // 生成随机盐值
        String salt = IdUtil.simpleUUID();
        user.setSalt(salt);
        
        // SHA-256 加密: 密码 + 盐
        String hashedPassword = SecureUtil.sha256(user.getPassword() + salt);
        user.setPassword(hashedPassword);
        
        user.setStatus(1);
        this.save(user);
        return user;
    }
}
