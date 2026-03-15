package com.bottomlord.controller;

import com.bottomlord.common.base.Result;
import com.bottomlord.entity.PlayerMutualRating;
import com.bottomlord.service.PlayerMutualRatingService;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * 球员评分与互评控制器
 * 处理：互评提交、MVP 票数查询、MVP 最终确定
 */
@RestController
@RequestMapping("/api/rating")
public class PlayerRatingController {

    @Autowired
    private PlayerMutualRatingService mutualRatingService;

    /**
     * 提交/修改互评
     * 支持多维度评分，也支持传入 quickTotalScore 进行一键评分
     */
    @PostMapping("/submit")
    public Result<Void> submitRating(@RequestBody PlayerMutualRating rating, 
                                     @RequestParam(required = false) BigDecimal quickTotalScore) {
        // 基础校验：不能自己评自己 (前端应过滤，后端做兜底)
        if (rating.getFromPlayerId().equals(rating.getToPlayerId())) {
            return Result.error(500, "不能给自己评分");
        }
        
        mutualRatingService.submitRating(rating, quickTotalScore);
        return Result.success(null);
    }

    /**
     * 获取某场比赛的 MVP 实时票数统计 (仅管理员或赛后公示可见)
     */
    @GetMapping("/mvp-votes/{matchId}")
    public Result<Map<Long, Integer>> getMvpVotes(@PathVariable Long matchId) {
        return Result.success(mutualRatingService.countMvpVotes(matchId));
    }

    /**
     * 最终确定本场比赛的 MVP (管理员权限)
     * @param matchId 比赛ID
     * @param manualPlayerId 可选：管理员手动指定的球员ID
     */
    @PostMapping("/finalize-mvp/{matchId}")
    @RequiresRoles("admin")
    public Result<Void> finalizeMvp(@PathVariable Long matchId, 
                                    @RequestParam(required = false) Long manualPlayerId) {
        mutualRatingService.finalizeMvp(matchId, manualPlayerId);
        return Result.success(null);
    }
}
