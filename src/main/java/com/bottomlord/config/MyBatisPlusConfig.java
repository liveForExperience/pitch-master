package com.bottomlord.config;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.bottomlord.entity.User;
import org.apache.ibatis.reflection.MetaObject;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

/**
 * MyBatis-Plus 配置类，包含自动填充功能
 *
 * @author Gemini
 */
@Configuration
public class MyBatisPlusConfig {

    @Bean
    public MetaObjectHandler metaObjectHandler() {
        return new MetaObjectHandler() {
            @Override
            public void insertFill(MetaObject metaObject) {
                this.strictInsertFill(metaObject, "createdAt", LocalDateTime.class, LocalDateTime.now());
                this.strictInsertFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
                
                Long userId = getCurrentUserId();
                this.strictInsertFill(metaObject, "createdBy", Long.class, userId);
                this.strictInsertFill(metaObject, "updatedBy", Long.class, userId);
            }

            @Override
            public void updateFill(MetaObject metaObject) {
                this.strictUpdateFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
                this.strictUpdateFill(metaObject, "updatedBy", Long.class, getCurrentUserId());
            }

            private Long getCurrentUserId() {
                try {
                    Subject subject = SecurityUtils.getSubject();
                    if (subject != null && subject.getPrincipal() != null) {
                        User user = (User) subject.getPrincipal();
                        return user.getId();
                    }
                } catch (Exception e) {
                    // 忽略异常，可能是非 Web 环境或未登录
                }
                return 1L; // 默认管理员 ID
            }
        };
    }
}
