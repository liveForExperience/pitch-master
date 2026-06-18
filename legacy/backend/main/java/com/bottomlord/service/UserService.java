package com.bottomlord.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bottomlord.common.base.RegistrationRequest;
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
     * 注册基础用户
     *
     * @param user 用户实体（包含明文密码）
     * @return 注册成功的用户
     */
    User register(User user);

    /**
     * 注册为球员 (包含 User 和 Player 的同步创建)
     *
     * @param request 注册请求
     * @return 注册成功的用户
     */
    User registerPlayer(RegistrationRequest request);

    /**
     * 为用户分配角色
     *
     * @param userId 用户ID
     * @param roleName 角色名称
     */
    void addRoleToUser(Long userId, String roleName);

    /**
     * 获取用户所有角色
     *
     * @param userId 用户ID
     * @return 角色列表
     */
    java.util.List<com.bottomlord.entity.Role> getUserRoles(Long userId);

    /**
     * 按用户名、真实姓名或球场昵称模糊搜索用户（分页）
     * keyword 为空时返回全部用户（按 ID 倒序）
     *
     * @param keyword  搜索关键词（可为空）
     * @param page     页码（从1开始）
     * @param pageSize 每页条数
     * @return 分页结果
     */
    com.bottomlord.dto.PageResult<com.bottomlord.dto.UserSearchVO> searchUsers(String keyword, int page, int pageSize);
}
