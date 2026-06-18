package com.bottomlord.shiro;

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
    @Lazy
    private UserService userService;

    /**
     * 鉴权（权限验证）
     */
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        User user = (User) principals.getPrimaryPrincipal();
        SimpleAuthorizationInfo info = new SimpleAuthorizationInfo();
        
        // 重新从数据库获取最新角色（或者在 User 对象里已经带了）
        java.util.List<com.bottomlord.entity.Role> roles = userService.getUserRoles(user.getId());
        if (roles != null) {
            for (com.bottomlord.entity.Role role : roles) {
                info.addRole(role.getName());
            }
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

        // 返回认证信息，Shiro 会使用 HashedCredentialsMatcher 进行自动校验
        return new SimpleAuthenticationInfo(
                user, 
                user.getPassword(), 
                ByteSource.Util.bytes(user.getSalt()), 
                getName()
        );
    }
}
