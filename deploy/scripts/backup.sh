#!/usr/bin/env bash
# SQLite 每日备份：WAL 安全 .backup + 保留 30 天。
#
# 用法：
#   sudo bash backup.sh              # 默认库路径
#   sudo bash backup.sh /path/to.db  # 自定义库
#
# cron 示例（/etc/cron.daily/pitchmaster-backup）：
#   #!/bin/bash
#   /opt/pitchmaster-v2/current/deploy/scripts/backup.sh

set -euo pipefail

DB_FILE="${1:-/var/lib/pitchmaster/data.db}"
BACKUP_DIR="/var/lib/pitchmaster/backups"
DATE="$(date +%Y%m%d)"
DEST="${BACKUP_DIR}/data-${DATE}.db"

ts() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(ts)] $*"; }
die() { log "ERROR: $*"; exit 1; }

[[ -f "$DB_FILE" ]] || die "数据库不存在: ${DB_FILE}"

mkdir -p "$BACKUP_DIR"

if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_FILE" ".backup '${DEST}'"
else
  log "WARN: sqlite3 未安装，退化为 cp（WAL 模式下不如 .backup 安全）"
  cp "$DB_FILE" "$DEST"
fi

log "已备份 → ${DEST} ($(du -h "$DEST" | awk '{print $1}'))"

find "$BACKUP_DIR" -name 'data-*.db' -mtime +30 -delete
log "已清理 30 天前的旧备份"
