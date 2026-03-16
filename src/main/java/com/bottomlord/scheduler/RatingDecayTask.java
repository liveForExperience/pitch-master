package com.bottomlord.scheduler;

import com.bottomlord.entity.SystemStatus;
import com.bottomlord.mapper.SystemStatusMapper;
import com.bottomlord.service.RatingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;

/**
 * 评分衰减任务 (增强版：支持补偿逻辑与可插拔配置)
 */
@Component
@Slf4j
@ConditionalOnProperty(name = "app.rating.decay.enabled", havingValue = "true", matchIfMissing = true)
public class RatingDecayTask {

    @Autowired
    private RatingService ratingService;

    @Autowired
    private SystemStatusMapper systemStatusMapper;

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
        SystemStatus status = ensureSystemStatus();

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
        LocalDateTime firstScheduledRun = alignToNextScheduledRun(lastRun);
        for (int i = 0; i < missedWeeks; i++) {
            // 计算在该补偿点的逻辑时间
            LocalDateTime logicalTime = firstScheduledRun.plusWeeks(i);
            ratingService.processRatingDecay(logicalTime);
        }

        // 3. 更新全局执行状态为当前时间
        status.setConfigValue(now.format(FORMATTER));
        systemStatusMapper.updateById(status);
        log.info("衰减补偿与例行任务执行完毕，全局状态已更新。");
    }

    /**
     * 确保衰减任务状态存在
     */
    private SystemStatus ensureSystemStatus() {
        SystemStatus status = systemStatusMapper.selectById(CONFIG_KEY);
        if (status != null) {
            return status;
        }
        SystemStatus created = new SystemStatus();
        created.setConfigKey(CONFIG_KEY);
        created.setConfigValue(LocalDateTime.now().format(FORMATTER));
        created.setDescription("球员评分衰减任务最后执行时间");
        systemStatusMapper.insert(created);
        return created;
    }

    private LocalDateTime alignToNextScheduledRun(LocalDateTime start) {
        return start.with(TemporalAdjusters.next(DayOfWeek.MONDAY))
                .withHour(3)
                .withMinute(0)
                .withSecond(0)
                .withNano(0);
    }

    /**
     * 计算两个时间点之间跨越了多少个“周一”
     */
    private long calculateMissedMondays(LocalDateTime start, LocalDateTime end) {
        // 将开始时间对齐到下一个周一的凌晨
        LocalDateTime firstMonday = alignToNextScheduledRun(start);
        
        if (firstMonday.isAfter(end)) return 0;
        
        long weeks = ChronoUnit.WEEKS.between(firstMonday, end);
        return weeks + 1; // 包含起始跨越的那个周一
    }
}
