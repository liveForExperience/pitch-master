package com.bottomlord.scheduler;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bottomlord.entity.Player;
import com.bottomlord.entity.SystemStatus;
import com.bottomlord.mapper.SystemStatusMapper;
import com.bottomlord.service.PlayerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

/**
 * 评分衰减任务 (增强版：支持补偿逻辑与可插拔配置)
 */
@Component
@Slf4j
@ConditionalOnProperty(name = "app.rating.decay.enabled", havingValue = "true", matchIfMissing = true)
public class RatingDecayTask {

    @Autowired
    private PlayerService playerService;

    @Autowired
    private SystemStatusMapper systemStatusMapper;

    private static final BigDecimal DECAY_STEP = new BigDecimal("0.05");
    private static final BigDecimal RATING_FLOOR = new BigDecimal("5.00");
    private static final int INACTIVE_WEEKS_THRESHOLD = 4;
    private static final String CONFIG_KEY = "LAST_DECAY_RUN_TIME";
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 系统启动完成后自动运行一次，检查是否有缺失的周期
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        log.info("系统已启动，正在自检评分衰减任务执行状态...");
        executeDecayWithCompensation();
    }

    /**
     * 每周一凌晨 3:00 正常运行
     */
    @Scheduled(cron = "0 0 3 ? * MON")
    public void scheduledRun() {
        log.info("触发例行评分衰减任务...");
        executeDecayWithCompensation();
    }

    /**
     * 核心逻辑：带补偿的衰减执行
     */
    @Transactional(rollbackFor = Exception.class)
    public synchronized void executeDecayWithCompensation() {
        SystemStatus status = systemStatusMapper.selectById(CONFIG_KEY);
        if (status == null) return;

        // 处理数据库存储格式不一致的问题（部分版本带时区或毫秒）
        String rawValue = status.getConfigValue();
        LocalDateTime lastRun;
        try {
            if (rawValue.length() > 19) {
                // 仅截取 yyyy-MM-dd HH:mm:ss 部分进行解析
                rawValue = rawValue.substring(0, 19).replace("T", " ");
            }
            lastRun = LocalDateTime.parse(rawValue, FORMATTER);
        } catch (Exception e) {
            log.warn("无法解析上次运行时间：{}，将使用当前时间作为起点", rawValue);
            lastRun = LocalDateTime.now();
        }

        LocalDateTime now = LocalDateTime.now();

        // 1. 计算从上次执行到现在，错过了多少个“周一”
        long missedWeeks = calculateMissedMondays(lastRun, now);

        if (missedWeeks <= 0) {
            log.info("当前无需执行衰减（本周周期已完成）。上次执行：{}", lastRun);
            return;
        }

        log.warn("检测到遗漏执行周期！需要执行 {} 次衰减补偿。", missedWeeks);

        // 2. 循环执行补偿（模拟每个遗漏周一的衰减）
        for (int i = 0; i < missedWeeks; i++) {
            // 计算在该补偿点的逻辑时间
            LocalDateTime logicalTime = lastRun.plusWeeks(i + 1);
            applyDecay(logicalTime);
        }

        // 3. 更新全局执行状态为当前时间
        status.setConfigValue(now.format(FORMATTER));
        systemStatusMapper.updateById(status);
        log.info("衰减补偿与例行任务执行完毕，全局状态已更新。");
    }

    /**
     * 执行单次衰减逻辑
     * @param atTime 逻辑执行时间点
     */
    private void applyDecay(LocalDateTime atTime) {
        LocalDateTime threshold = atTime.minusWeeks(INACTIVE_WEEKS_THRESHOLD);
        
        // 查询在逻辑时间点满足衰减条件的球员
        List<Player> players = playerService.list(new LambdaQueryWrapper<Player>()
                .eq(Player::getStatus, 1)
                .lt(Player::getLastMatchTime, threshold)
                .gt(Player::getRating, RATING_FLOOR));

        if (players.isEmpty()) return;

        for (Player player : players) {
            BigDecimal newRating = player.getRating().subtract(DECAY_STEP).setScale(2, RoundingMode.HALF_UP);
            if (newRating.compareTo(RATING_FLOOR) < 0) newRating = RATING_FLOOR;
            
            player.setRating(newRating);
            playerService.updateById(player);
        }
        log.info("[逻辑时间: {}] 处理了 {} 名球员的评分衰减。", atTime.format(FORMATTER), players.size());
    }

    /**
     * 计算两个时间点之间跨越了多少个“周一”
     */
    private long calculateMissedMondays(LocalDateTime start, LocalDateTime end) {
        // 将开始时间对齐到下一个周一的凌晨
        LocalDateTime firstMonday = start.with(TemporalAdjusters.next(DayOfWeek.MONDAY)).withHour(3).withMinute(0).withSecond(0);
        
        if (firstMonday.isAfter(end)) return 0;
        
        long weeks = ChronoUnit.WEEKS.between(firstMonday, end);
        return weeks + 1; // 包含起始跨越的那个周一
    }
}
