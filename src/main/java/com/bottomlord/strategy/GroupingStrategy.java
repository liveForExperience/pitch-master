package com.bottomlord.strategy;

import java.util.List;
import java.util.Map;

/**
 * 球队分组策略接口
 * <p>
 * 为未来扩展不同维度的算法提供统一抽象。
 * </p>
 *
 * @author Gemini
 */
public interface GroupingStrategy {

    /**
     * 执行分组算法
     *
     * @param players     参与本次分配的球员列表
     * @param groupCount  需要划分的小组数量
     * @param constraints 附加约束（如特定配合意愿、位置平衡权重等）
     * @return 分组结果：Key 为组号 (0 to groupCount-1), Value 为该组球员 ID 列表
     */
    Map<Integer, List<Long>> allocate(List<Long> players, int groupCount, Map<String, Object> constraints);

    /**
     * 获取策略标识名
     *
     * @return 策略唯一标识
     */
    String getStrategyName();
}
