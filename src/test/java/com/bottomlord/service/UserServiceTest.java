package com.bottomlord.service;

import cn.hutool.crypto.SecureUtil;
import com.bottomlord.entity.User;
import com.bottomlord.mapper.UserMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * UserService 单元测试
 */
@SpringBootTest
class UserServiceTest {

    @Autowired
    private UserService userService;

    @MockitoBean
    private UserMapper userMapper;

    @Test
    @DisplayName("测试用户注册及密码加密逻辑")
    void testRegister() {
        // Arrange
        User rawUser = new User();
        rawUser.setUsername("test_user");
        rawUser.setPassword("123456");
        
        when(userMapper.insert(any(User.class))).thenReturn(1);

        // Act
        User registeredUser = userService.register(rawUser);

        // Assert
        assertNotNull(registeredUser.getSalt(), "盐值不能为空");
        assertNotEquals("123456", registeredUser.getPassword(), "密码应被加密");
        
        // 验证加密结果是否符合预期 (SHA-256: password + salt)
        String expectedPassword = SecureUtil.sha256("123456" + registeredUser.getSalt());
        assertEquals(expectedPassword, registeredUser.getPassword(), "加密算法不正确");
        
        verify(userMapper, times(1)).insert(any(User.class));
    }
}
