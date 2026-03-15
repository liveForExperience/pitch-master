package com.bottomlord.controller;

import com.bottomlord.common.base.RegistrationRequest;
import com.bottomlord.common.base.Result;
import com.bottomlord.entity.User;
import com.bottomlord.entity.Player;
import com.bottomlord.service.UserService;
import com.bottomlord.service.PlayerService;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.subject.Subject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private PlayerService playerService;

    @PostMapping("/login")
    public Result<String> login(@RequestParam String username, @RequestParam String password) {
        Subject subject = SecurityUtils.getSubject();
        UsernamePasswordToken token = new UsernamePasswordToken(username, password);
        try {
            subject.login(token);
            return Result.success("登录成功");
        } catch (AuthenticationException e) {
            return Result.error(401, "用户名或密码错误");
        }
    }

    @PostMapping("/register")
    public Result<User> register(@RequestBody RegistrationRequest request) {
        User registeredUser = userService.registerPlayer(request);
        // 清除敏感信息后返回
        registeredUser.setPassword(null);
        registeredUser.setSalt(null);
        return Result.success(registeredUser);
    }

    @GetMapping("/me")
    public Result<Map<String, Object>> getCurrentUserInfo() {
        User user = (User) SecurityUtils.getSubject().getPrincipal();
        if (user == null) return Result.error(401, "未登录");

        Player player = playerService.getByUserId(user.getId());

        Map<String, Object> info = new HashMap<>();
        info.put("user", user);
        info.put("player", player);
        return Result.success(info);
    }

    @PostMapping("/logout")
    public Result<Void> logout() {
        Subject subject = SecurityUtils.getSubject();
        if (subject != null) {
            subject.logout();
        }
        return Result.success();
    }

    @GetMapping("/unauthenticated")
    public Result<String> unauthenticated() {
        return Result.error(401, "请先登录");
    }
}
