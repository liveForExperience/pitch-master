package com.bottomlord.dto;

import lombok.Data;

/**
 * 用户搜索结果 VO（含球员球场昵称）
 */
@Data
public class UserSearchVO {
    private Long id;
    private String username;
    private String realName;
    private Integer status;
    private String playerNickname;
}
