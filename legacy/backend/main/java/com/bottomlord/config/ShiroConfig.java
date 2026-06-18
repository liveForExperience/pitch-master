package com.bottomlord.config;

import com.bottomlord.shiro.UserRealm;
import org.apache.shiro.authc.credential.HashedCredentialsMatcher;
import org.apache.shiro.mgt.SecurityManager;
import org.apache.shiro.spring.web.ShiroFilterFactoryBean;
import org.apache.shiro.web.mgt.DefaultWebSecurityManager;
import org.apache.shiro.spring.security.interceptor.AuthorizationAttributeSourceAdvisor;
import org.springframework.aop.framework.autoproxy.DefaultAdvisorAutoProxyCreator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.apache.shiro.session.mgt.SessionManager;
import org.apache.shiro.web.session.mgt.DefaultWebSessionManager;

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
    public ShiroFilterFactoryBean shiroFilterFactoryBean(SecurityManager securityManager) {
        ShiroFilterFactoryBean factoryBean = new ShiroFilterFactoryBean();
        factoryBean.setSecurityManager(securityManager);

        // 拦截规则配置
        Map<String, String> filterChainDefinitionMap = new LinkedHashMap<>();
        
        // 开放登录、注册接口
        filterChainDefinitionMap.put("/auth/login", "anon");
        filterChainDefinitionMap.put("/auth/register", "anon");
        filterChainDefinitionMap.put("/auth/unauthenticated", "anon");
        filterChainDefinitionMap.put("/static/**", "anon");
        
        // SSE 订阅地址也需要开放，或根据业务需求进行认证
        filterChainDefinitionMap.put("/api/realtime/subscribe/**", "anon");
        
        // 其他所有请求均需认证
        filterChainDefinitionMap.put("/**", "authc");

        factoryBean.setFilterChainDefinitionMap(filterChainDefinitionMap);
        factoryBean.setLoginUrl("/auth/unauthenticated");
        
        return factoryBean;
    }

    @Bean
    public HashedCredentialsMatcher hashedCredentialsMatcher() {
        HashedCredentialsMatcher matcher = new HashedCredentialsMatcher();
        matcher.setHashAlgorithmName("SHA-256");
        matcher.setHashIterations(1);
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
    public SessionManager sessionManager() {
        DefaultWebSessionManager sessionManager = new DefaultWebSessionManager();
        sessionManager.setSessionIdUrlRewritingEnabled(false);
        return sessionManager;
    }

    @Bean
    public DefaultWebSecurityManager securityManager(UserRealm userRealm, SessionManager sessionManager) {
        DefaultWebSecurityManager securityManager = new DefaultWebSecurityManager();
        securityManager.setRealm(userRealm);
        securityManager.setSessionManager(sessionManager);
        return securityManager;
    }

    @Bean
    public DefaultAdvisorAutoProxyCreator defaultAdvisorAutoProxyCreator() {
        DefaultAdvisorAutoProxyCreator creator = new DefaultAdvisorAutoProxyCreator();
        creator.setProxyTargetClass(true);
        return creator;
    }

    @Bean
    public AuthorizationAttributeSourceAdvisor authorizationAttributeSourceAdvisor(SecurityManager securityManager) {
        AuthorizationAttributeSourceAdvisor advisor = new AuthorizationAttributeSourceAdvisor();
        advisor.setSecurityManager(securityManager);
        return advisor;
    }
}
