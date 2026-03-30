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
     * 查询球员在指定赛事的评分档案（含三维评分和计算后总分）
     * @param tournamentId 赛事ID（必填，评分档案按赛事隔离）
     */
    @GetMapping("/{id}/rating")
    public Result<PlayerRatingDTO> getPlayerRating(@PathVariable Long id,
                                                    @RequestParam Long tournamentId) {
        Player player = playerService.getById(id);
        if (player == null) {
            return Result.error(404, "球员不存在");
        }

        PlayerRatingProfile profile = playerRatingProfileMapper.selectOne(
                new LambdaQueryWrapper<PlayerRatingProfile>()
                        .eq(PlayerRatingProfile::getPlayerId, id)
                        .eq(PlayerRatingProfile::getTournamentId, tournamentId));

        PlayerRatingDTO dto = new PlayerRatingDTO();
        dto.setPlayerId(id);
        dto.setPlayerName(player.getNickname());

        if (profile != null) {
            BigDecimal skill = profile.getSkillRating() != null ? profile.getSkillRating() : new BigDecimal("5.00");
            BigDecimal performance = profile.getPerformanceRating() != null ? profile.getPerformanceRating() : new BigDecimal("5.00");
            BigDecimal engagement = profile.getEngagementRating() != null ? profile.getEngagementRating() : new BigDecimal("5.00");
            BigDecimal total = skill.multiply(new BigDecimal("0.40"))
                    .add(performance.multiply(new BigDecimal("0.40")))
                    .add(engagement.multiply(new BigDecimal("0.20")))
                    .setScale(2, java.math.RoundingMode.HALF_UP);
            dto.setTotalRating(total);
            dto.setSkillRating(skill);
            dto.setPerformanceRating(performance);
            dto.setEngagementRating(engagement);
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
