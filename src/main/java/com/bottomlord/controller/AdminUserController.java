package com.bottomlord.controller;

import com.bottomlord.common.base.Result;
import com.bottomlord.entity.User;
import com.bottomlord.service.TournamentService;
import com.bottomlord.service.UserService;
import org.apache.shiro.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 平台管理员专用：用户管理接口
 */
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    @Autowired
    private UserService userService;

    @Autowired
    private TournamentService tournamentService;

    /**
     * 按用户名或真实姓名模糊搜索用户（仅平台管理员，最多20条）
     */
    @GetMapping("/search")
    public Result<List<User>> searchUsers(@RequestParam String q) {
        User currentUser = (User) SecurityUtils.getSubject().getPrincipal();
        if (currentUser == null) {
            return Result.error(401, "请先登录");
        }
        if (!tournamentService.isPlatformAdmin(currentUser.getId())) {
            return Result.error(403, "仅平台管理员可搜索用户");
        }
        if (q == null || q.trim().isEmpty()) {
            return Result.error(400, "搜索关键词不能为空");
        }
        return Result.success(userService.searchUsers(q.trim()));
    }
}
