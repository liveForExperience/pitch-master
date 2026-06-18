package com.bottomlord.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 分组详情 VO
 * <p>
 * 用于返回带球员详情的分组数据，供前端展示。
 * </p>
 */
@Data
public class GroupsVO {

    /**
     * 分组是否已对所有人发布（false=草稿，true=已发布）
     */
    private Boolean groupsPublished;

    /**
     * 分组数据：组号 -> 该组球员列表
     */
    private Map<Integer, List<PlayerItem>> groups;

    /**
     * 未分配球员列表（group_index 为 null）
     */
    private List<PlayerItem> unassigned;

    /**
     * 各队自定义名称，key 为组号（0-N），value 为队伍名称
     */
    private Map<Integer, String> teamNames;

    @Data
    public static class PlayerItem {
        private Long id;
        private String name;
        private BigDecimal rating;
    }
}
