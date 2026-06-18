#!/usr/bin/env bash
# 一次性 ECS 初始化：装 Node 20、建目录骨架、装 systemd unit、配 Nginx 反代。
#
# 用法（在 ECS 上以 root 跑）：
#   bash ecs-bootstrap.sh <github_actions_pubkey_one_liner>
#
# 第一个参数：要加入 /root/.ssh/authorized_keys 的 deploy 公钥（单行）。
#   - 加 no-port-forwarding 等限制
#   - 与现有 keys 共存，幂等：相同 key 不重复添加
#
# 幂等：可重复执行；已经做过的步骤会跳过。

set -euo pipefail

DEPLOY_PUBKEY="${1:-}"
APP_ROOT="/opt/pitchmaster-v2"
DATA_DIR="/var/lib/pitchmaster"
SERVICE="pitchmaster-v2"
NODE_MAJOR=20

ts() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(ts)] $*"; }
die() { log "ERROR: $*"; exit 1; }

[[ $EUID -eq 0 ]] || die "请以 root 运行"

log "===== Step 1/5: 安装 Node ${NODE_MAJOR} ====="
NODE_OK=false
if command -v node >/dev/null 2>&1; then
  CURRENT_NODE=$(node --version | sed 's/^v//' | cut -d. -f1)
  if [[ "$CURRENT_NODE" -ge "$NODE_MAJOR" ]]; then
    log "Node $(node --version) 已安装且 >= ${NODE_MAJOR}，跳过"
    NODE_OK=true
  fi
fi
if [[ "$NODE_OK" == "false" ]]; then
  if command -v dnf >/dev/null 2>&1; then
    curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
    dnf install -y nodejs
  elif command -v apt-get >/dev/null 2>&1; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
    apt-get install -y nodejs
  else
    die "未识别的包管理器（既无 dnf 也无 apt-get）"
  fi
  log "Node 已安装: $(node --version), npm: $(npm --version)"
fi
log "当前 Node: $(node --version), npm: $(npm --version)"

log "===== Step 2/5: 建立 ${APP_ROOT} 目录骨架 ====="
mkdir -p "${APP_ROOT}/releases"
mkdir -p "${APP_ROOT}/shared"
mkdir -p "${APP_ROOT}/bin"
touch    "${APP_ROOT}/shared/.env"
chmod 600 "${APP_ROOT}/shared/.env"
mkdir -p "${DATA_DIR}"
log "目录就绪：${APP_ROOT}, ${DATA_DIR}"

log "===== Step 3/5: 安装 deploy-receive.sh ====="
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ -f "${SCRIPT_DIR}/deploy-receive.sh" ]]; then
  install -m 755 "${SCRIPT_DIR}/deploy-receive.sh" "${APP_ROOT}/bin/deploy-receive.sh"
  log "已安装 ${APP_ROOT}/bin/deploy-receive.sh"
else
  log "WARN: 同目录下未找到 deploy-receive.sh，跳过（你可以稍后手动 scp 上来）"
fi

log "===== Step 4/5: 安装 systemd unit ====="
UNIT_SRC="${SCRIPT_DIR}/../systemd/${SERVICE}.service"
if [[ -f "$UNIT_SRC" ]]; then
  install -m 644 "$UNIT_SRC" "/etc/systemd/system/${SERVICE}.service"
  systemctl daemon-reload
  systemctl enable "${SERVICE}"
  log "已 enable ${SERVICE}.service（首次部署后由 deploy-receive 启动）"
else
  log "WARN: 找不到 ${UNIT_SRC}，跳过 systemd 安装"
fi

log "===== Step 5/5: 注册 GitHub Actions deploy 公钥 ====="
if [[ -z "$DEPLOY_PUBKEY" ]]; then
  log "未提供 deploy 公钥（第一个参数），跳过"
else
  mkdir -p /root/.ssh
  chmod 700 /root/.ssh
  touch /root/.ssh/authorized_keys
  chmod 600 /root/.ssh/authorized_keys
  KEY_FINGERPRINT=$(echo "$DEPLOY_PUBKEY" | awk '{print $2}')
  if grep -qF "$KEY_FINGERPRINT" /root/.ssh/authorized_keys; then
    log "deploy 公钥已在 authorized_keys 中，跳过"
  else
    # 限制：禁端口转发、X11、代理转发、tty
    RESTRICTED='no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty,no-user-rc'
    echo "${RESTRICTED} ${DEPLOY_PUBKEY}" >> /root/.ssh/authorized_keys
    log "已追加 deploy 公钥（带限制）"
  fi
fi

log "===== bootstrap 完成 ====="
log "下一步：让 GitHub Actions 推第一个 release，或本地试跑："
log "  bash ${APP_ROOT}/bin/deploy-receive.sh <git-sha>"
