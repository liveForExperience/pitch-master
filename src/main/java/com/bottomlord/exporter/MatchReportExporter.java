package com.bottomlord.exporter;

import com.bottomlord.entity.MatchEvent;

/**
 * 赛事结果报表导出接口
 *
 * @author Gemini
 */
public interface MatchReportExporter {

    /**
     * 执行导出操作
     *
     * @param matchEvent 赛事对象
     * @return 导出结果（字符串、字节流或文件路径，具体由子类决定）
     */
    Object export(MatchEvent matchEvent);

    /**
     * 获取导出方式名称（如 TEXT, PDF, HTML）
     *
     * @return 导出方式名
     */
    String getExportType();
}
