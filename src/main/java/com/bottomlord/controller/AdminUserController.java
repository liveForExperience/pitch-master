package com.bottomlord.controller;

import com.bottomlord.common.base.Result;
import com.bottomlord.dto.PageResult;
import com.bottomlord.dto.UserSearchVO;
import com.bottomlord.entity.User;
import com.bottomlord.service.TournamentService;
import com.bottomlord.service.UserService;
import org.apache.shiro.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

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
     * 按用户名、真实姓名或球场昵称搜索用户（分页，仅平台管理员）
     * q 为空时返回全部用户列表
     */
    @GetMapping("/search")
    public Result<PageResult<UserSearchVO>> searchUsers(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        User currentUser = (User) SecurityUtils.getSubject().getPrincipal();
        if (currentUser == null) {
            return Result.error(401, "请先登录");
        }
        if (!tournamentService.isPlatformAdmin(currentUser.getId())) {
            return Result.error(403, "仅平台管理员可搜索用户");
        }
        if (pageSize > 50) {
            pageSize = 50;
        }
        return Result.success(userService.searchUsers(q, page, pageSize));
    }
}
