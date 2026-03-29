package com.bottomlord.common.base;

import lombok.Data;
import java.math.BigDecimal;

/**
 * 球员注册请求 DTO
 */
@Data
public class RegistrationRequest {
    // 用户账号信息
    private String username;
    private String password;
    private String realName;

    // 球员档案信息（全局属性）
    private String nickname;
    private String position; // GK, DF, MF, FW
    private Integer age;
    private String preferredFoot; // LEFT, RIGHT, BOTH
    private String gender; // MALE, FEMALE
    private Integer height; // cm

    // 组织关联 (L1 & L2) — 已废弃，注册不再绑定 Tournament
    @Deprecated
    private Long tournamentId;
    @Deprecated
    private Long clubId;
}
