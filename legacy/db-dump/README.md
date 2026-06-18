# Legacy DB Dump

> v1 MySQL 数据库 `pitch_master` 的历史快照。仅作"考古"用途，**v2 不读取本目录任何内容**。

## 产生方式

由 `deploy/scripts/legacy-shutdown.sh` 在 v1 ECS 上执行 `mysqldump` 后产生：

```
pitch_master-YYYYMMDD-HHMMSS.sql.gz
```

详见 [`../../docs/LEGACY_SHUTDOWN.md`](../../docs/LEGACY_SHUTDOWN.md) 与 [`../../docs/DECISIONS.md` ADR-0006](../../docs/DECISIONS.md)。

## 恢复（仅在需要考古时）

```bash
gunzip -k pitch_master-YYYYMMDD-HHMMSS.sql.gz
mysql -u root -p -e "CREATE DATABASE pitch_master_restore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p pitch_master_restore < pitch_master-YYYYMMDD-HHMMSS.sql
```

## 大小约束

- `.sql.gz` 文件 < 10MB：直接进仓库
- 10MB ~ 50MB：用 [git-lfs](https://git-lfs.com/) 跟踪
- \> 50MB：放本地或对象存储，仓库内只保留位置说明
