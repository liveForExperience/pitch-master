-- V8: 给 match 表增加 team_names 字段
-- 用于存储管理员自定义的各队伍名称，格式为 JSON: {"0": "雄鹰队", "1": "猎豹队"}
ALTER TABLE `match`
    ADD COLUMN `team_names` JSON NULL
        COMMENT '各队自定义名称，JSON 格式: {"0": "雄鹰队", "1": "猎豹队"}';
