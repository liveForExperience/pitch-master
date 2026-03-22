package com.bottomlord.dto;

import lombok.Data;

/**
 * 分组请求 DTO
 * <p>
 * 支持自动分组时指定策略名称及是否保留已有分配。
 * </p>
 */
@Data
public class GroupingRequest {

    /**
     * 分组策略名称，为 null 时使用系统默认策略
     */
    private String strategyName;

    /**
     * 是否保留已有分配：
     * <ul>
     *   <li>true  - 仅对 group_index 为 null 的球员执行自动分配，已分配球员不变</li>
     *   <li>false - 清空全部分配，对所有球员重新分组（默认）</li>
     * </ul>
     */
    private boolean keepExisting = false;
}
