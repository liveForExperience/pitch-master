package com.bottomlord.config;

import com.bottomlord.entity.MatchEvent;
import com.bottomlord.entity.Player;
import com.bottomlord.entity.User;
import com.bottomlord.service.MatchEventService;
import com.bottomlord.service.PlayerService;
import com.bottomlord.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * H2 内存数据库专用数据初始化器
 * <p>
 * 仅在 spring.profiles.active=h2 时生效。
 * </p>
 *
 * @author Gemini
 */
@Component
@Profile("h2")
@Slf4j
public class H2DataInitializer implements ApplicationRunner {

    @Autowired
    private UserService userService;

    @Autowired
    private PlayerService playerService;

    @Autowired
    private MatchEventService matchEventService;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("检测到 H2 环境，开始初始化演示数据...");

        // 1. 创建几个测试球员用户
        createUserAndPlayer("jack", "杰克", "FW", 8.5);
        createUserAndPlayer("rose", "露丝", "MF", 7.0);
        createUserAndPlayer("tom", "汤姆", "DF", 6.5);
        createUserAndPlayer("jerry", "杰瑞", "GK", 9.0);

        // 2. 发布一场正在进行的赛事
        MatchEvent match = new MatchEvent();
        match.setTitle("老男孩周六虹口巅峰赛");
        match.setStartTime(LocalDateTime.now().plusDays(1));
        match.setLocation("虹口足球场");
        match.setNumGroups(2);
        match.setPlayersPerGroup(5);
        match.setTotalCost(new BigDecimal("1200.00"));
        match.setStatus("SCHEDULED");
        
        matchEventService.publishMatch(match);

        // 3. 发布一场已经开赛并生成了场次的赛事
        MatchEvent liveMatch = new MatchEvent();
        liveMatch.setTitle("老男孩周中练习赛 (实时演示)");
        liveMatch.setStartTime(LocalDateTime.now().minusHours(1));
        liveMatch.setLocation("世纪公园球场");
        liveMatch.setNumGroups(2);
        liveMatch.setPlayersPerGroup(2);
        liveMatch.setTotalCost(new BigDecimal("500.00"));
        
        matchEventService.publishMatch(liveMatch);
        
        // 模拟报名与自动分组（此处直接调用 Service 逻辑）
        // 注册
        matchEventService.registerForMatch(liveMatch.getId(), 1L); // admin
        matchEventService.registerForMatch(liveMatch.getId(), 2L); // jack
        matchEventService.registerForMatch(liveMatch.getId(), 3L); // rose
        matchEventService.registerForMatch(liveMatch.getId(), 4L); // tom
        
        // 启动并分组
        matchEventService.confirmAndGroup(liveMatch.getId());

        log.info("演示数据初始化完成！请使用 admin/admin123 登录浏览器验证。");
    }

    private void createUserAndPlayer(String username, String nickname, String pos, double rating) {
        User user = new User();
        user.setUsername(username);
        user.setPassword("123456");
        user.setRealName(nickname);
        user.setRole("USER");
        userService.register(user);

        Player player = new Player();
        player.setUserId(user.getId());
        player.setNickname(nickname);
        player.setPosition(pos);
        player.setRating(new BigDecimal(String.valueOf(rating)));
        player.setStatus(1);
        playerService.save(player);
    }
}
