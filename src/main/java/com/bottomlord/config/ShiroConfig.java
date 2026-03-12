package com.bottomlord.config;

import com.bottomlord.shiro.UserRealm;
import org.apache.shiro.authc.credential.HashedCredentialsMatcher;
import org.apache.shiro.mgt.SecurityManager;
import org.apache.shiro.spring.web.ShiroFilterFactoryBean;
import org.apache.shiro.web.mgt.DefaultWebSecurityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Shiro 配置类
 *
 * @author Gemini
 */
@Configuration
public class ShiroConfig {

    @Bean
    public HashedCredentialsMatcher hashedCredentialsMatcher() {
        HashedCredentialsMatcher matcher = new HashedCredentialsMatcher();
        // 设置加密算法为 SHA-256
        matcher.setHashAlgorithmName("SHA-256");
        // 设为 1 次 Hash（根据业务可增加迭代次数）
        matcher.setHashIterations(1);
        // 是否将存储的凭据（如密码）进行 16 进制编码
        matcher.setStoredCredentialsHexEncoded(true);
        return matcher;
    }

    @Bean
    public UserRealm userRealm(HashedCredentialsMatcher matcher) {
        UserRealm realm = new UserRealm();
        realm.setCredentialsMatcher(matcher);
        return realm;
    }

    @Bean
    public DefaultWebSecurityManager securityManager(UserRealm userRealm) {
        DefaultWebSecurityManager securityManager = new DefaultWebSecurityManager();
        securityManager.setRealm(userRealm);
        return securityManager;
    }

    @Bean
    public ShiroFilterFactoryBean shiroFilterFactoryBean(SecurityManager securityManager) {
        ShiroFilterFactoryBean factoryBean = new ShiroFilterFactoryBean();
        factoryBean.setSecurityManager(securityManager);

        // 拦截规则配置
        Map<String, String> filterChainDefinitionMap = new LinkedHashMap<>();
        
        // 开放登录、注册接口
        filterChainDefinitionMap.put("/auth/login", "anon");
        filterChainDefinitionMap.put("/auth/register", "anon");
        
        // 静态资源开放
        filterChainDefinitionMap.put("/static/**", "anon");
        
        // 其他所有请求均需认证
        filterChainDefinitionMap.put("/**", "authc");

        factoryBean.setFilterChainDefinitionMap(filterChainDefinitionMap);
        
        // 设置登录页面（如果未登录跳转的地址）
        factoryBean.setLoginUrl("/auth/unauthenticated");
        
        return factoryBean;
    }
}
