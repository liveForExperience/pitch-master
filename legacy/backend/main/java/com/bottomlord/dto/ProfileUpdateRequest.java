package com.bottomlord.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    /**
     * Display Name (Maps to Player.nickname)
     */
    private String nickname;

    /**
     * Real Name (Maps to User.realName)
     */
    private String realName;

    /**
     * Preferred Foot: LEFT, RIGHT, BOTH
     */
    private String preferredFoot;

    /**
     * Preferred Position: GK, DF, MF, FW
     */
    private String position;

    /**
     * Age
     */
    private Integer age;

    /**
     * Height in cm
     */
    private Integer height;
}
