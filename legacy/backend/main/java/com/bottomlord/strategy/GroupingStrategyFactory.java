package com.bottomlord.strategy;

import java.util.List;

/**
 * 分组策略工厂接口
 *
 * @author Gemini
 */
public interface GroupingStrategyFactory {

    /**
     * 根据策略名称获取具体的策略实现
     *
     * @param strategyName 策略名称
     * @return 策略实现，若不存在则返回默认策略
     */
    GroupingStrategy getStrategy(String strategyName);

    /**
     * 获取当前系统配置的默认策略
     *
     * @return 默认策略实现
     */
    GroupingStrategy getDefaultStrategy();

    /**
     * 获取系统中所有已注册的策略名称列表
     *
     * @return 策略名称列表
     */
    List<String> listStrategyNames();
}
