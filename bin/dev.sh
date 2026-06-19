#!/usr/bin/env bash
# 一键启动 v2 双端开发服务器（backend :3000 + web :5173）
# 用法：npm run dev
#
# 启动前自动：
#   1. 检查并安装 workspace 依赖（含 vite-plugin-pwa）
#   2. 释放 3000 与 5173–5180 上的旧进程（避免 Vite 静默换端口、PWA 虚拟模块失效）
# Ctrl+C 或任一子进程退出时，同时停止对端。

set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

# shellcheck source=dev-lib.sh
source "${ROOT}/bin/dev-lib.sh"

ensure_deps "$ROOT"
free_dev_ports

pids=()
cleanup() {
  echo
  echo "[dev] stopping ${#pids[@]} child processes..."
  local pid
  for pid in "${pids[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  free_dev_ports
  exit 0
}
trap cleanup INT TERM

echo "[dev] backend → http://localhost:3000/api/health"
(cd backend && npm run dev) &
pids+=("$!")

sleep 1

echo "[dev] web     → http://localhost:5173"
(cd web && npm run dev) &
pids+=("$!")

echo "[dev] open http://localhost:5173 in browser (do not use 5174+)"

wait_any_child "${pids[@]}"
cleanup
