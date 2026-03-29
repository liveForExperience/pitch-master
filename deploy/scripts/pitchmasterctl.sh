#!/usr/bin/env bash
set -euo pipefail

APP_NAME="pitchmaster"
SERVICE_NAME="pitchmaster"
APP_HOME="/opt/pitchmaster"
REPO_DIR="${APP_HOME}/repo"
APP_DIR="${APP_HOME}/app"
FRONTEND_DIR="${APP_HOME}/frontend"
ENV_FILE="/etc/pitchmaster/pitchmaster.env"
NGINX_TARGET="/etc/nginx/conf.d/pitchmaster.conf"
SYSTEMD_TARGET="/etc/systemd/system/pitchmaster.service"
REPO_URL_DEFAULT="https://github.com/liveForExperience/pitch-master.git"
BRANCH_DEFAULT="main"

REPO_URL="${REPO_URL:-$REPO_URL_DEFAULT}"
BRANCH="${BRANCH:-$BRANCH_DEFAULT}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ROOT="$(cd "${DEPLOY_DIR}/.." && pwd)"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

die() {
  echo "[ERROR] $*" >&2
  exit 1
}

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    die "Please run as root (e.g. sudo bash deploy/scripts/pitchmasterctl.sh <command>)."
  fi
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"
}

ensure_dirs() {
  mkdir -p "${APP_HOME}" "${APP_DIR}" "${FRONTEND_DIR}" /etc/pitchmaster
}

ensure_repo() {
  if [[ ! -d "${REPO_DIR}/.git" ]]; then
    log "Cloning repository: ${REPO_URL}"
    git clone "${REPO_URL}" "${REPO_DIR}"
  fi

  log "Syncing source code from ${BRANCH}"
  git -C "${REPO_DIR}" fetch origin
  git -C "${REPO_DIR}" checkout "${BRANCH}"
  git -C "${REPO_DIR}" pull --ff-only origin "${BRANCH}"
}

ensure_env_file() {
  if [[ ! -f "${ENV_FILE}" ]]; then
    log "Creating environment file from template"
    cp "${REPO_DIR}/deploy/env/pitchmaster.prod.example" "${ENV_FILE}"
    chmod 600 "${ENV_FILE}"
    log "Edit ${ENV_FILE} before running in production."
  fi
}

load_env() {
  [[ -f "${ENV_FILE}" ]] || die "Environment file not found: ${ENV_FILE}"
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
}

build_backend() {
  require_cmd mvn
  log "Building backend jar"
  mvn -q -DskipTests clean package -f "${REPO_DIR}/pom.xml"
}

build_frontend() {
  require_cmd npm
  log "Building frontend dist"
  npm --prefix "${REPO_DIR}/frontend" ci
  npm --prefix "${REPO_DIR}/frontend" run build
}

deploy_backend_artifact() {
  local jar
  jar="$(find "${REPO_DIR}/target" -maxdepth 1 -type f -name '*.jar' ! -name '*.original' | head -n 1)"
  [[ -n "${jar}" ]] || die "No backend jar found in ${REPO_DIR}/target"

  cp "${jar}" "${APP_DIR}/current.jar"
  chmod 640 "${APP_DIR}/current.jar"
}

deploy_frontend_artifact() {
  local dist_src="${REPO_DIR}/frontend/dist"
  [[ -d "${dist_src}" ]] || die "Frontend dist not found: ${dist_src}"

  rm -rf "${FRONTEND_DIR}/dist"
  mkdir -p "${FRONTEND_DIR}"
  cp -R "${dist_src}" "${FRONTEND_DIR}/dist"
}

ensure_database() {
  load_env
  require_cmd mysql

  local db_host="${DB_HOST:-127.0.0.1}"
  local db_port="${DB_PORT:-3306}"
  local db_name="${DB_NAME:-pitch_master}"
  local db_user="${DB_USER:-root}"
  local db_password="${DB_PASSWORD:-}"

  if [[ -z "${db_password}" ]]; then
    die "DB_PASSWORD is empty in ${ENV_FILE}"
  fi

  log "Ensuring database exists: ${db_name}"
  MYSQL_PWD="${db_password}" mysql -h "${db_host}" -P "${db_port}" -u "${db_user}" \
    -e "CREATE DATABASE IF NOT EXISTS ${db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
}

install_systemd_and_nginx() {
  cp "${REPO_DIR}/deploy/systemd/pitchmaster.service" "${SYSTEMD_TARGET}"
  cp "${REPO_DIR}/deploy/nginx/pitchmaster.conf" "${NGINX_TARGET}"

  systemctl daemon-reload
  systemctl enable "${SERVICE_NAME}"

  nginx -t
  systemctl reload nginx
}

start_service() {
  systemctl start "${SERVICE_NAME}"
}

stop_service() {
  systemctl stop "${SERVICE_NAME}"
}

restart_service() {
  systemctl restart "${SERVICE_NAME}"
}

status_service() {
  systemctl status "${SERVICE_NAME}" --no-pager
}

logs_service() {
  journalctl -u "${SERVICE_NAME}" -n 200 --no-pager
}

cmd_install() {
  require_root
  require_cmd git
  require_cmd systemctl
  require_cmd nginx

  ensure_dirs
  ensure_repo
  ensure_env_file
  ensure_database
  build_backend
  build_frontend
  deploy_backend_artifact
  deploy_frontend_artifact
  install_systemd_and_nginx
  start_service
  status_service

  log "Install completed."
}

cmd_upgrade() {
  require_root
  require_cmd git

  ensure_dirs
  ensure_repo
  load_env
  build_backend
  build_frontend
  deploy_backend_artifact
  deploy_frontend_artifact
  restart_service

  nginx -t
  systemctl reload nginx
  status_service

  log "Upgrade completed."
}

cmd_start() {
  require_root
  start_service
  status_service
}

cmd_stop() {
  require_root
  stop_service
  status_service || true
}

cmd_restart() {
  require_root
  restart_service
  status_service
}

cmd_status() {
  require_root
  status_service
}

cmd_logs() {
  require_root
  logs_service
}

usage() {
  cat <<EOF
Usage: $(basename "$0") <command>

Commands:
  install   First-time install: pull source, build, deploy, configure systemd/nginx, start service
  upgrade   Pull latest source, rebuild, redeploy jar/dist, restart service
  start     Start service
  stop      Stop service
  restart   Restart service
  status    Show service status
  logs      Show recent service logs

Environment overrides:
  REPO_URL  Git repository URL (default: ${REPO_URL_DEFAULT})
  BRANCH    Git branch to deploy (default: ${BRANCH_DEFAULT})
EOF
}

main() {
  local command="${1:-}"

  case "${command}" in
    install) cmd_install ;;
    upgrade) cmd_upgrade ;;
    start) cmd_start ;;
    stop) cmd_stop ;;
    restart) cmd_restart ;;
    status) cmd_status ;;
    logs) cmd_logs ;;
    *) usage; exit 1 ;;
  esac
}

main "$@"
