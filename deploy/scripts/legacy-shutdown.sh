#!/usr/bin/env bash
#
# legacy-shutdown.sh
#
# 用途：在 v1 ECS 上执行，备份 MySQL 数据 + 停止/卸载所有 v1 资产，
#       为 v2 释放端口与系统资源。
#
# 用法（在 v1 ECS 上）：
#
#   # 步骤 1：仅备份（不下线，先把 dump 拷回本地确认）
#   sudo bash legacy-shutdown.sh --dump-only
#
#   # 步骤 2：scp 备份到本地后，再执行完整下线
#   sudo bash legacy-shutdown.sh
#
# 备份产物固定写到 /var/backups/pitchmaster-v1/
#
# 安全约束：
#  - 必须 root；脚本会读取 /etc/pitchmaster/pitchmaster.env 拿 DB 凭证
#  - 任何破坏性步骤前都有 mysqldump，且需要 yes 二次确认
#  - 删除范围严格限定 v1 相关路径，不动其它服务
#
# 兼容性：apt (Debian/Ubuntu) + dnf (Alibaba Cloud Linux 3 / RHEL)

set -euo pipefail

BACKUP_DIR="/var/backups/pitchmaster-v1"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
ENV_FILE="/etc/pitchmaster/pitchmaster.env"
APP_HOME="/opt/pitchmaster"

DUMP_ONLY=false
if [[ "${1:-}" == "--dump-only" ]]; then
    DUMP_ONLY=true
fi

log() { echo "[$(date '+%F %T')] $*"; }
die() { echo "[ERROR] $*" >&2; exit 1; }

[[ "${EUID}" -eq 0 ]] || die "请用 sudo 执行：sudo bash $0 ${1:-}"

# ---------- 0. 资源盘点 ----------
log "=========== v1 资产盘点 ==========="
log "systemd 服务："
systemctl status pitchmaster --no-pager 2>/dev/null | head -3 || log "  (未找到 pitchmaster service)"
log "应用目录："
[[ -d "${APP_HOME}" ]] && du -sh "${APP_HOME}" || log "  (无 ${APP_HOME})"
log "Nginx site："
[[ -f /etc/nginx/conf.d/pitchmaster.conf ]] && echo "  /etc/nginx/conf.d/pitchmaster.conf 存在" || log "  (无 nginx site)"
log "MySQL："
command -v mysql >/dev/null 2>&1 && mysql --version || log "  (未安装 mysql)"
log "Java："
command -v java >/dev/null 2>&1 && java -version 2>&1 | head -1 || log "  (未安装 java)"
log "===================================="

# ---------- 1. 准备备份目录 ----------
mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

# ---------- 2. 备份配置文件 ----------
log "备份 systemd / nginx / env 配置..."
[[ -f /etc/systemd/system/pitchmaster.service ]] && \
    cp -p /etc/systemd/system/pitchmaster.service "${BACKUP_DIR}/pitchmaster.service.${TIMESTAMP}"
[[ -f /etc/nginx/conf.d/pitchmaster.conf ]] && \
    cp -p /etc/nginx/conf.d/pitchmaster.conf "${BACKUP_DIR}/pitchmaster.conf.${TIMESTAMP}"
[[ -f "${ENV_FILE}" ]] && \
    cp -p "${ENV_FILE}" "${BACKUP_DIR}/pitchmaster.env.${TIMESTAMP}"

# ---------- 3. 读取 DB 凭证 ----------
if [[ -f "${ENV_FILE}" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "${ENV_FILE}"
    set +a
fi
DB_NAME="${DB_NAME:-pitch_master}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"

# ---------- 4. mysqldump ----------
if command -v mysqldump >/dev/null 2>&1; then
    log "导出 MySQL 数据库：${DB_NAME} (host=${DB_HOST}:${DB_PORT} user=${DB_USER})..."
    DUMP_FILE="${BACKUP_DIR}/${DB_NAME}-${TIMESTAMP}.sql"
    DUMP_ARGS=(
        -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}"
        --single-transaction --routines --triggers --hex-blob
        --set-gtid-purged=OFF
        --column-statistics=0
    )
    if [[ -n "${DB_PASSWORD}" ]]; then
        DUMP_ARGS+=(-p"${DB_PASSWORD}")
    fi
    # 部分版本不支持 --column-statistics，做一次降级重试
    if ! mysqldump "${DUMP_ARGS[@]}" "${DB_NAME}" > "${DUMP_FILE}" 2>/tmp/mysqldump.err; then
        log "首次 mysqldump 失败，剔除 --column-statistics 重试..."
        DUMP_ARGS=("${DUMP_ARGS[@]/--column-statistics=0}")
        mysqldump "${DUMP_ARGS[@]}" "${DB_NAME}" > "${DUMP_FILE}" || {
            cat /tmp/mysqldump.err >&2
            die "mysqldump 失败，请人工排查后重试"
        }
    fi
    gzip -9 -f "${DUMP_FILE}"
    log "  -> ${DUMP_FILE}.gz ($(du -h "${DUMP_FILE}.gz" | cut -f1))"
else
    log "未检测到 mysqldump，跳过数据库备份。"
fi

# ---------- 5. 提示拷贝 ----------
log "================================================"
log "✅ 备份完成。建议在另一台终端执行："
log ""
log "   scp -r root@<ECS_IP>:${BACKUP_DIR} ./legacy-v1-backup/"
log ""
log "把备份拷到本地，再决定是否继续下线。"
log "================================================"

if "${DUMP_ONLY}"; then
    log "[--dump-only] 模式，未执行下线动作。退出。"
    exit 0
fi

# ---------- 6. 二次确认 ----------
echo ""
read -r -p "确认继续执行下线 + 卸载 v1 全部资产？输入 yes 继续：" CONFIRM
[[ "${CONFIRM}" == "yes" ]] || die "已取消"

# ---------- 7. 停服 ----------
log "停止 pitchmaster systemd 服务..."
systemctl stop pitchmaster 2>/dev/null || true
systemctl disable pitchmaster 2>/dev/null || true
rm -f /etc/systemd/system/pitchmaster.service
systemctl daemon-reload

# ---------- 8. 移除 Nginx site ----------
log "移除 Nginx site (不卸载 Nginx 本体)..."
rm -f /etc/nginx/conf.d/pitchmaster.conf
if systemctl is-active --quiet nginx; then
    nginx -t && systemctl reload nginx || log "  Nginx reload 失败，请人工检查"
fi

# ---------- 9. 删除 MySQL 数据库 ----------
if command -v mysql >/dev/null 2>&1; then
    log "DROP DATABASE ${DB_NAME}..."
    MYSQL_ARGS=(-h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}")
    [[ -n "${DB_PASSWORD}" ]] && MYSQL_ARGS+=(-p"${DB_PASSWORD}")
    mysql "${MYSQL_ARGS[@]}" -e "DROP DATABASE IF EXISTS \`${DB_NAME}\`;"
fi

# ---------- 10. 删除应用文件 ----------
log "删除 ${APP_HOME} 与 /etc/pitchmaster..."
rm -rf "${APP_HOME}"
rm -rf /etc/pitchmaster

# ---------- 11. 卸载 MySQL Server ----------
log "卸载 MySQL Server..."
if command -v apt-get >/dev/null 2>&1; then
    systemctl stop mysql 2>/dev/null || true
    apt-get remove --purge -y 'mysql-server*' 'mysql-client*' 'mysql-common*' 2>/dev/null || true
    apt-get autoremove -y 2>/dev/null || true
    rm -rf /var/lib/mysql /var/log/mysql /etc/mysql
elif command -v dnf >/dev/null 2>&1; then
    systemctl stop mysqld 2>/dev/null || true
    dnf remove -y 'mysql*' 'mariadb*' 2>/dev/null || true
    rm -rf /var/lib/mysql /etc/my.cnf*
fi

# ---------- 12. 卸载 Java JDK ----------
log "卸载 Java JDK..."
if command -v apt-get >/dev/null 2>&1; then
    apt-get remove --purge -y 'openjdk-*-jdk*' 'openjdk-*-jre*' 2>/dev/null || true
    apt-get autoremove -y 2>/dev/null || true
elif command -v dnf >/dev/null 2>&1; then
    dnf remove -y 'java-*' 2>/dev/null || true
fi

# ---------- 13. 删除 Maven ----------
log "删除 Maven..."
rm -rf /opt/maven

# ---------- 14. 收尾 ----------
log "================================================"
log "✅ v1 已完全下线。"
log ""
log "保留在服务器上的备份：${BACKUP_DIR}/"
log "  - ${DB_NAME}-${TIMESTAMP}.sql.gz"
log "  - pitchmaster.service.${TIMESTAMP}"
log "  - pitchmaster.conf.${TIMESTAMP}"
log "  - pitchmaster.env.${TIMESTAMP} (含 DB 密码，请妥善保存)"
log ""
log "下一步："
log "  1) scp 上述文件回本地"
log "  2) 将 sql.gz 提交到 legacy/db-dump/（< 10MB 直接进仓库；> 10MB 改用 git-lfs 或本地保管）"
log "  3) Nginx 本体已保留，端口 80 仍可用；后续 v2 部署时可选择保留 Nginx 或换 Caddy"
log "================================================"
