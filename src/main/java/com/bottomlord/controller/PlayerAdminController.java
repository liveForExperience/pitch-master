package com.bottomlord.controller;

import com.bottomlord.common.base.Result;
import com.bottomlord.service.PlayerService;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

/**
 * 球员管理控制器（管理员专用）
 * 处理：评分修正、档案管理等管理员权限操作
 */
@RestController
@RequestMapping("/api/admin/player")
@RequiresRoles("admin")
public class PlayerAdminController {

    @Autowired
    private PlayerService playerService;

    /**
     * 管理员修正球员总评分
     * @param playerId 球员ID
     * @param newRating 新评分（1.00-20.00）
     * @param reason 修正原因（用于审计）
     */
    @PostMapping("/{playerId}/rating/total")
    public Result<Void> updateTotalRating(@PathVariable Long playerId,
                                          @RequestParam BigDecimal newRating,
                                          @RequestParam String reason) {
        if (newRating.compareTo(new BigDecimal("1.00")) < 0 || newRating.compareTo(new BigDecimal("20.00")) > 0) {
            return Result.error(400, "评分必须在1.00-20.00之间");
        }
        playerService.updateRatingManually(playerId, newRating, reason);
        return Result.success(null);
    }

    /**
     * 管理员修正球员三维评分
     * @param playerId 球员ID
     * @param dimension 评分维度（SKILL/PERFORMANCE/ENGAGEMENT）
     * @param newValue 新评分值（1.00-20.00）
     * @param reason 修正原因（用于审计）
     */
    @PostMapping("/{playerId}/rating/dimension")
    public Result<Void> updateDimensionRating(@PathVariable Long playerId,
                                               @RequestParam String dimension,
                                               @RequestParam BigDecimal newValue,
                                               @RequestParam String reason) {
        if (newValue.compareTo(new BigDecimal("1.00")) < 0 || newValue.compareTo(new BigDecimal("20.00")) > 0) {
            return Result.error(400, "评分必须在1.00-20.00之间");
        }
        if (!dimension.matches("(?i)(SKILL|PERFORMANCE|ENGAGEMENT)")) {
            return Result.error(400, "无效的评分维度，必须是SKILL、PERFORMANCE或ENGAGEMENT");
        }
        playerService.updateRatingDimensionManually(playerId, dimension, newValue, reason);
        return Result.success(null);
    }
}
