package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 系统用户实体
 *
 * @author Gemini
 */
@Data
@TableName("`user`")
public class User implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    private String password;

    private String salt;

    private String realName;

    @TableField(exist = false)
    private java.util.List<Role> roles;

    /**
     * 获取角色名称列表
     */
    public java.util.List<String> getRoleNames() {
        if (roles == null) return new java.util.ArrayList<>();
        return roles.stream().map(Role::getName).collect(java.util.stream.Collectors.toList());
    }

    /**
     * 状态：1-正常，0-禁用
     */
    private Integer status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
