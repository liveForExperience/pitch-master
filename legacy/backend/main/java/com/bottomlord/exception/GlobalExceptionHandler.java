package com.bottomlord.exception;

import com.bottomlord.common.base.Result;
import org.apache.shiro.authz.AuthorizationException;
import org.apache.shiro.authz.UnauthenticatedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理器
 * 统一处理 Shiro 权限异常和其他常见异常，转换为标准 Result 格式响应
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 处理 Shiro 权限异常（角色/权限不足）
     */
    @ExceptionHandler(AuthorizationException.class)
    public Result<Void> handleAuthorizationException(AuthorizationException e) {
        logger.warn("权限校验失败: {}", e.getMessage());
        return Result.error(403, "权限不足，仅管理员可操作");
    }

    /**
     * 处理 Shiro 未认证异常（未登录）
     */
    @ExceptionHandler(UnauthenticatedException.class)
    public Result<Void> handleUnauthenticatedException(UnauthenticatedException e) {
        logger.warn("未认证访问: {}", e.getMessage());
        return Result.error(401, "未登录或登录已过期");
    }

    /**
     * 处理业务逻辑异常（IllegalArgumentException、IllegalStateException）
     */
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public Result<Void> handleBusinessException(RuntimeException e) {
        logger.warn("业务异常: {}", e.getMessage());
        return Result.error(400, e.getMessage());
    }

    /**
     * 处理其他未捕获异常
     */
    @ExceptionHandler(Exception.class)
    public Result<Void> handleGenericException(Exception e) {
        logger.error("系统异常", e);
        return Result.error(500, "系统内部错误，请联系管理员");
    }
}
