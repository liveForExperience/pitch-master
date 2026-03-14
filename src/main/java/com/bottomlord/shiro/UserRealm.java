package com.bottomlord.shiro;

import cn.hutool.crypto.SecureUtil;
import com.bottomlord.entity.User;
import com.bottomlord.service.UserService;
import org.apache.shiro.authc.*;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.lang.util.ByteSource;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

/**
 * 自定义 Shiro Realm，处理认证与鉴权
 *
 * @author Gemini
 */
@Component
public class UserRealm extends AuthorizingRealm {

    @Autowired
    @Lazy // 解决循环依赖问题
    private UserService userService;

    /**
     * 鉴权（权限验证）
     */
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        User user = (User) principals.getPrimaryPrincipal();
        SimpleAuthorizationInfo info = new SimpleAuthorizationInfo();
        // 加载角色标识
        if (cn.hutool.core.util.StrUtil.isNotBlank(user.getRole())) {
            info.addRole(user.getRole());
        }
        return info;
    }

    /**
     * 认证（登录验证）
     */
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) throws AuthenticationException {
        UsernamePasswordToken upToken = (UsernamePasswordToken) token;
        String username = upToken.getUsername();
        
        User user = userService.getByUsername(username);
        if (user == null) {
            throw new UnknownAccountException("用户不存在");
        }
        
        if (user.getStatus() == 0) {
            throw new LockedAccountException("账号已被锁定");
        }

        // 注意：此处 Shiro 会自动进行密码校验，但由于我们使用了自定义盐值逻辑，
        // 这里返回 SimpleAuthenticationInfo 时需告知 Shiro 密码和盐。
        return new SimpleAuthenticationInfo(
                user, 
                user.getPassword(), 
                new ShiroSalt(user.getSalt()), 
                getName()
        );
    }

    /**
     * 自定义盐值包装类，适配 Shiro
     */
    public static class ShiroSalt implements ByteSource {
        private final String salt;
        public ShiroSalt(String salt) { this.salt = salt; }
        @Override public byte[] getBytes() { return salt.getBytes(); }
        @Override public String toHex() { return cn.hutool.core.util.HexUtil.encodeHexStr(salt); }
        @Override public String toBase64() { return cn.hutool.core.codec.Base64.encode(salt); }
        @Override public boolean isEmpty() { return salt == null || salt.isEmpty(); }
    }
}
