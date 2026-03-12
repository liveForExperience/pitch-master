package com.bottomlord.strategy.impl;

import com.bottomlord.strategy.GroupingStrategy;
import com.bottomlord.strategy.GroupingStrategyFactory;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 分组策略工厂实现类
 *
 * @author Gemini
 */
@Component
public class GroupingStrategyFactoryImpl implements GroupingStrategyFactory {

    @Value("${match.grouping.default-strategy:SIMPLE_SKILL_BALANCE}")
    private String defaultStrategyName;

    private final Map<String, GroupingStrategy> strategyMap = new HashMap<>();

    @Autowired
    private List<GroupingStrategy> strategies;

    @PostConstruct
    public void init() {
        for (GroupingStrategy strategy : strategies) {
            strategyMap.put(strategy.getStrategyName(), strategy);
        }
    }

    @Override
    public GroupingStrategy getStrategy(String strategyName) {
        GroupingStrategy strategy = strategyMap.get(strategyName);
        return strategy != null ? strategy : getDefaultStrategy();
    }

    @Override
    public GroupingStrategy getDefaultStrategy() {
        GroupingStrategy strategy = strategyMap.get(defaultStrategyName);
        if (strategy == null) {
            // 如果配置的默认策略不存在，回退到当前列表的第一个（兜底）
            return strategies.get(0);
        }
        return strategy;
    }
}
