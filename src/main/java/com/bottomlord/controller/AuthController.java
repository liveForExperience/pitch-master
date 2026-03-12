package com.bottomlord.controller;

import com.bottomlord.common.base.Result;
import com.bottomlord.entity.User;
import com.bottomlord.service.UserService;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.subject.Subject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

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
    public Result<User> register(@RequestBody User user) {
        // 设置默认角色为普通用户
        user.setRole("USER");
        User registeredUser = userService.register(user);
        // 清除敏感信息后返回
        registeredUser.setPassword(null);
        registeredUser.setSalt(null);
        return Result.success(registeredUser);
    }

    @GetMapping("/unauthenticated")
    public Result<String> unauthenticated() {
        return Result.error(401, "请先登录");
    }
}
