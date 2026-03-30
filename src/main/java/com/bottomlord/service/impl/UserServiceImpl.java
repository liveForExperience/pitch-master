package com.bottomlord.service.impl;

import cn.hutool.core.util.IdUtil;
import cn.hutool.crypto.SecureUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.common.base.RegistrationRequest;
import com.bottomlord.entity.Player;
import com.bottomlord.entity.User;
import com.bottomlord.mapper.UserMapper;
import com.bottomlord.service.PlayerService;
import com.bottomlord.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 用户服务实现类 (重构：支持球员同步注册)
 *
 * @author Gemini
 */
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    @Autowired
    private PlayerService playerService;

    @Autowired
    private com.bottomlord.mapper.RoleMapper roleMapper;

    @Autowired
    private com.bottomlord.mapper.UserRoleMapper userRoleMapper;

    @Override
    public User getByUsername(String username) {
        User user = baseMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username));
        if (user != null) {
            user.setRoles(getUserRoles(user.getId()));
        }
        return user;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public User register(User user) {
        // 生成随机盐值
        String salt = IdUtil.simpleUUID();
        user.setSalt(salt);
        
        // SHA-256 加密: 盐 + 密码 (对齐 Shiro 默认校验顺序)
        String hashedPassword = SecureUtil.sha256(salt + user.getPassword());
        user.setPassword(hashedPassword);
        
        user.setStatus(1);
        this.save(user);
        return user;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public User registerPlayer(RegistrationRequest request) {
        // 1. 检查用户名是否存在
        if (getByUsername(request.getUsername()) != null) {
            throw new IllegalArgumentException("用户名已存在");
        }

        // 2. 创建并保存用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(request.getPassword());
        user.setRealName(request.getRealName());
        // 之前：user.setRole("player"); 
        // 现在统一在后面通过关联表分配
        register(user);

        // 3. 为用户分配球员角色
        addRoleToUser(user.getId(), "player");

        // 4. 创建并保存球员档案（全局属性，不再绑定 Tournament）
        Player player = new Player();
        player.setUserId(user.getId());
        player.setNickname(request.getNickname());
        player.setPosition(request.getPosition());
        player.setAge(request.getAge());
        player.setPreferredFoot(request.getPreferredFoot() != null ? request.getPreferredFoot() : "RIGHT");
        player.setGender(request.getGender());
        player.setHeight(request.getHeight());
        player.setStatus(1);
        
        playerService.save(player);

        return user;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void addRoleToUser(Long userId, String roleName) {
        com.bottomlord.entity.Role role = roleMapper.selectOne(new LambdaQueryWrapper<com.bottomlord.entity.Role>()
                .eq(com.bottomlord.entity.Role::getName, roleName));
        if (role == null) {
            throw new IllegalArgumentException("角色不存在: " + roleName);
        }
        
        com.bottomlord.entity.UserRole ur = new com.bottomlord.entity.UserRole();
        ur.setUserId(userId);
        ur.setRoleId(role.getId());
        userRoleMapper.insert(ur);
    }

    @Override
    public java.util.List<com.bottomlord.entity.Role> getUserRoles(Long userId) {
        return roleMapper.selectRolesByUserId(userId);
    }

    @Override
    public java.util.List<User> searchUsers(String keyword) {
        java.util.List<User> users = this.list(new LambdaQueryWrapper<User>()
                .and(w -> w.like(User::getUsername, keyword)
                           .or()
                           .like(User::getRealName, keyword))
                .eq(User::getStatus, 1)
                .last("LIMIT 20"));
        users.forEach(u -> {
            u.setPassword(null);
            u.setSalt(null);
        });
        return users;
    }
}
