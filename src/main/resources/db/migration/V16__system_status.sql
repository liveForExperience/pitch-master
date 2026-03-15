-- V16: 增加系统状态表，用于存储定时任务执行进度等全局状态
CREATE TABLE `system_status` (
    `config_key` VARCHAR(50) PRIMARY KEY,
    `config_value` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255),
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 初始化上次衰减运行时间为当前时间
INSERT INTO `system_status` (`config_key`, `config_value`, `description`) 
VALUES ('LAST_DECAY_RUN_TIME', CURRENT_TIMESTAMP, '评分衰减任务上次成功执行的时间戳');
