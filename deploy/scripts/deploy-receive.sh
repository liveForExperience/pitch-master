#!/usr/bin/env bash
# 在 ECS 上执行：解包 /tmp/release.tar.gz → 切 symlink → 重启 systemd → 健康检查 → 失败回滚
#
# 由 GitHub Actions 通过 ssh 触发。第一个参数为 git sha（用于 release 目录命名）。
#
# 设计要点：
#   - 全部状态文件在 /opt/pitchmaster-v2/{releases,shared,current}
#   - shared/ 跨版本持久（data.db、.env、生产 node_modules）
#   - current 是 symlink，原子切换 = ln -sfn
#   - 健康检查 ≥1 次失败 → 切回上一版（PREVIOUS_RELEASE）
#   - 仅保留最近 5 个 release

set -euo pipefail

GIT_SHA="${1:-${SSH_ORIGINAL_COMMAND:-unknown}}"
GIT_SHA="${GIT_SHA:0:7}"   # 截短

APP_ROOT="/opt/pitchmaster-v2"
RELEASES="${APP_ROOT}/releases"
SHARED="${APP_ROOT}/shared"
CURRENT="${APP_ROOT}/current"
TARBALL="/tmp/release.tar.gz"
SERVICE="pitchmaster-v2"
HEALTH_URL="http://127.0.0.1:3000/api/health"
HEALTH_RETRIES=15
HEALTH_INTERVAL=1
KEEP_RELEASES=5

ts() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(ts)] $*"; }
die() { log "ERROR: $*"; exit 1; }

[[ -f "$TARBALL" ]] || die "找不到 $TARBALL（GitHub Actions 应先 scp 上来）"

RELEASE_ID="$(date '+%Y%m%d-%H%M%S')-${GIT_SHA}"
RELEASE_DIR="${RELEASES}/${RELEASE_ID}"
PREVIOUS_RELEASE=""
if [[ -L "$CURRENT" ]]; then
  PREVIOUS_RELEASE="$(readlink -f "$CURRENT" || true)"
fi

log "=========================================="
log "Release ID:        ${RELEASE_ID}"
log "Previous release:  ${PREVIOUS_RELEASE:-<none>}"
log "=========================================="

log "[1/6] 解包到 ${RELEASE_DIR}"
mkdir -p "$RELEASE_DIR"
tar -xzf "$TARBALL" -C "$RELEASE_DIR"
rm -f "$TARBALL"

log "[2/6] 链接 shared/ 资产"
mkdir -p "${SHARED}"
touch "${SHARED}/.env"
# .env 与 data.db 链接到 release 根
ln -sfn "${SHARED}/.env" "${RELEASE_DIR}/.env"

# 生产依赖：第一次或 package-lock 变了就重装；否则复用 shared/node_modules
if [[ ! -f "${SHARED}/package-lock.json" ]] \
   || ! cmp -s "${RELEASE_DIR}/package-lock.json" "${SHARED}/package-lock.json"; then
  log "[2.1] package-lock 变化，重建生产 node_modules"
  cp "${RELEASE_DIR}/package-lock.json" "${SHARED}/package-lock.json"
  cp "${RELEASE_DIR}/package.json"      "${SHARED}/package.json"
  (
    cd "${SHARED}"
    npm ci --omit=dev --no-audit --no-fund
  )
fi
ln -sfn "${SHARED}/node_modules" "${RELEASE_DIR}/node_modules"

log "[3/6] 原子切换 current → ${RELEASE_ID}"
ln -sfn "${RELEASE_DIR}" "${CURRENT}"

log "[4/6] systemctl restart ${SERVICE}"
systemctl restart "${SERVICE}"
sleep 1

log "[5/6] 健康检查（最多 ${HEALTH_RETRIES} 次，每次间隔 ${HEALTH_INTERVAL}s）"
ok=0
for i in $(seq 1 "$HEALTH_RETRIES"); do
  if curl -fs --max-time 3 "$HEALTH_URL" > /dev/null; then
    ok=1
    log "  ✓ 第 $i 次探活通过"
    break
  fi
  sleep "$HEALTH_INTERVAL"
done

if [[ $ok -eq 0 ]]; then
  log "  ✘ 健康检查全部失败"
  if [[ -n "$PREVIOUS_RELEASE" && -d "$PREVIOUS_RELEASE" ]]; then
    log "  ↩ 回滚 current → $(basename "$PREVIOUS_RELEASE")"
    ln -sfn "$PREVIOUS_RELEASE" "${CURRENT}"
    systemctl restart "${SERVICE}"
    sleep 2
    if curl -fs --max-time 3 "$HEALTH_URL" > /dev/null; then
      log "  ✓ 回滚后健康检查通过"
    else
      log "  ✘✘ 回滚后仍不健康！请人工介入：journalctl -u ${SERVICE}"
    fi
  else
    log "  ✘ 无上一版本可回滚"
  fi
  log "================== 部署失败 =================="
  exit 1
fi

log "[6/6] 清理旧 release，保留最近 ${KEEP_RELEASES} 个"
cd "${RELEASES}"
# shellcheck disable=SC2012
ls -1t | tail -n +"$((KEEP_RELEASES + 1))" | while read -r old; do
  log "  rm ${old}"
  rm -rf -- "$old"
done

log "================== 部署成功 =================="
log "Active release: ${RELEASE_ID}"
log "URL:            ${HEALTH_URL}"
