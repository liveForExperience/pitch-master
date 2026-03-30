package com.bottomlord.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bottomlord.common.base.Result;
import com.bottomlord.dto.PlayerRatingDTO;
import com.bottomlord.entity.Player;
import com.bottomlord.entity.PlayerRatingProfile;
import com.bottomlord.mapper.PlayerRatingProfileMapper;
import com.bottomlord.service.PlayerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/player")
public class PlayerController {

    @Autowired
    private PlayerService playerService;

    @Autowired
    private PlayerRatingProfileMapper playerRatingProfileMapper;

    @GetMapping("/{id}")
    public Result<Player> getPlayer(@PathVariable Long id) {
        return Result.success(playerService.getById(id));
    }

    /**
     * 查询球员评分档案（含三维评分）
     */
    @GetMapping("/{id}/rating")
    public Result<PlayerRatingDTO> getPlayerRating(@PathVariable Long id) {
        Player player = playerService.getById(id);
        if (player == null) {
            return Result.error(404, "球员不存在");
        }

        PlayerRatingProfile profile = playerRatingProfileMapper.selectOne(
                new LambdaQueryWrapper<PlayerRatingProfile>().eq(PlayerRatingProfile::getPlayerId, id));

        PlayerRatingDTO dto = new PlayerRatingDTO();
        dto.setPlayerId(id);
        dto.setPlayerName(player.getNickname());
        dto.setTotalRating(player.getRating());
        
        if (profile != null) {
            dto.setSkillRating(profile.getSkillRating());
            dto.setPerformanceRating(profile.getPerformanceRating());
            dto.setEngagementRating(profile.getEngagementRating());
            dto.setProvisionalMatches(profile.getProvisionalMatches());
            dto.setAppearanceCount(profile.getAppearanceCount());
            dto.setActiveStreakWeeks(profile.getActiveStreakWeeks());
            dto.setLastAttendanceTime(profile.getLastAttendanceTime());
            dto.setLastDecayTime(profile.getLastDecayTime());
            dto.setRatingVersion(profile.getRatingVersion());
        }

        return Result.success(dto);
    }

    /**
     * 管理员手动修正球员评分
     */
    @PostMapping("/{id}/rating")
    public Result<Void> updateRating(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        BigDecimal newRating = new BigDecimal(body.get("newRating").toString());
        String reason = body.getOrDefault("reason", "管理员手动修正").toString();
        
        playerService.updateRatingManually(id, newRating, reason);
        return Result.success(null);
    }

    /**
     * 用户更新个人概览资料
     */
    @PostMapping("/profile")
    public Result<Void> updateProfile(@RequestBody com.bottomlord.dto.ProfileUpdateRequest request) {
        Object principal = org.apache.shiro.SecurityUtils.getSubject().getPrincipal();
        if (principal == null) {
            return Result.error(401, "请先登录");
        }
        com.bottomlord.entity.User user = (com.bottomlord.entity.User) principal;
        Player player = playerService.getByUserId(user.getId());
        if (player == null) {
            return Result.error(404, "球员档案不存在");
        }
        
        playerService.updateProfile(player.getId(), request);
        return Result.success(null);
    }
}
