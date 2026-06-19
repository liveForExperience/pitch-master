#!/usr/bin/env bash
# PitchMaster v2 一键服务器初始化（Phase 3）。
#
# 用法（ECS root）：
#   bash install.sh '<github_actions_deploy_pubkey_one_liner>'
#
# 步骤：Node 20+ → 目录骨架 → systemd → deploy key → Nginx 反代 → 每日备份 cron

set -euo pipefail

DEPLOY_PUBKEY="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

ts() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(ts)] $*"; }
die() { log "ERROR: $*"; exit 1; }

[[ $EUID -eq 0 ]] || die "请以 root 运行"

log "===== [1/4] ecs-bootstrap ====="
bash "${SCRIPT_DIR}/ecs-bootstrap.sh" "$DEPLOY_PUBKEY"

log "===== [2/4] Nginx site ====="
if command -v nginx >/dev/null 2>&1; then
  install -m 644 "${DEPLOY_ROOT}/nginx/pitchmaster-v2.conf" /etc/nginx/conf.d/pitchmaster-v2.conf
  nginx -t
  systemctl reload nginx
  log "Nginx 已加载 pitchmaster-v2.conf"
else
  log "WARN: 未检测到 nginx，跳过反代配置"
fi

log "===== [3/4] 每日备份 cron ====="
install -m 755 "${SCRIPT_DIR}/backup.sh" /opt/pitchmaster-v2/bin/backup.sh
cat > /etc/cron.daily/pitchmaster-backup <<'CRON'
#!/bin/bash
/opt/pitchmaster-v2/bin/backup.sh >> /var/log/pitchmaster-backup.log 2>&1
CRON
chmod 755 /etc/cron.daily/pitchmaster-backup
touch /var/log/pitchmaster-backup.log
log "已安装 /etc/cron.daily/pitchmaster-backup"

log "===== [4/4] 可选 HTTPS（Caddy）====="
if [[ -f "${DEPLOY_ROOT}/caddy/Caddyfile" ]]; then
  log "Caddyfile 位于 ${DEPLOY_ROOT}/caddy/Caddyfile"
  log "购买域名后：安装 Caddy → 设置 DOMAIN 环境变量 → 见 docs/DEPLOYMENT.md §9"
else
  log "跳过 Caddy（当前使用 Nginx HTTP）"
fi

log "===== install 完成 ====="
log "下一步：配置 GitHub Secrets 并 push main，或手动："
log "  bash /opt/pitchmaster-v2/bin/deploy-receive.sh <git-sha>"
log "探活：curl http://127.0.0.1:3000/api/health"
log "公网：curl http://<host>/api/health  或  /api/healthz"
