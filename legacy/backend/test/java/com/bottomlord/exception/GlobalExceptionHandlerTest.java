package com.bottomlord.exception;

import com.bottomlord.common.base.Result;
import org.apache.shiro.authz.AuthorizationException;
import org.apache.shiro.authz.UnauthenticatedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    void testHandleAuthorizationException() {
        AuthorizationException ex = new AuthorizationException("权限不足");
        Result<Void> result = handler.handleAuthorizationException(ex);

        assertNotNull(result);
        assertEquals(403, result.getCode());
        assertEquals("权限不足，仅管理员可操作", result.getMessage());
    }

    @Test
    void testHandleUnauthenticatedException() {
        UnauthenticatedException ex = new UnauthenticatedException("未登录");
        Result<Void> result = handler.handleUnauthenticatedException(ex);

        assertNotNull(result);
        assertEquals(401, result.getCode());
        assertEquals("未登录或登录已过期", result.getMessage());
    }

    @Test
    void testHandleBusinessException_IllegalArgumentException() {
        IllegalArgumentException ex = new IllegalArgumentException("参数错误");
        Result<Void> result = handler.handleBusinessException(ex);

        assertNotNull(result);
        assertEquals(400, result.getCode());
        assertEquals("参数错误", result.getMessage());
    }

    @Test
    void testHandleBusinessException_IllegalStateException() {
        IllegalStateException ex = new IllegalStateException("状态错误");
        Result<Void> result = handler.handleBusinessException(ex);

        assertNotNull(result);
        assertEquals(400, result.getCode());
        assertEquals("状态错误", result.getMessage());
    }

    @Test
    void testHandleGenericException() {
        Exception ex = new Exception("系统异常");
        Result<Void> result = handler.handleGenericException(ex);

        assertNotNull(result);
        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMessage());
    }
}
