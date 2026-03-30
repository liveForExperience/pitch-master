package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.bottomlord.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 系统用户实体
 *
 * @author Gemini
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("`user`")
public class User extends BaseEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    private String password;

    private String salt;

    private String realName;

    /**
     * 状态：1-正常，0-禁用
     */
    private Integer status;

    @TableField(exist = false)
    private java.util.List<Role> roles;

    @TableField(exist = false)
    private String playerNickname;

    /**
     * 获取角色名称列表
     */
    public java.util.List<String> getRoleNames() {
        if (roles == null) return new java.util.ArrayList<>();
        return roles.stream().map(Role::getName).collect(java.util.stream.Collectors.toList());
    }
}
