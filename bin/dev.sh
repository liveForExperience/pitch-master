#!/usr/bin/env bash
# 一键启动 v2 双端开发服务器（backend :3000 + web :5173）
# 用法：bash bin/dev.sh
#
# - 任意一端崩溃 / Ctrl+C 都会同时停掉对端，避免孤儿进程。
# - 日志走标准输出，未来要存盘可改成 tee。

set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

if [[ ! -d backend/node_modules ]]; then
  echo "[dev] backend/node_modules 不存在，先安装："
  (cd backend && npm install)
fi
if [[ ! -d web/node_modules ]]; then
  echo "[dev] web/node_modules 不存在，先安装："
  (cd web && npm install)
fi

pids=()
cleanup() {
  echo
  echo "[dev] stopping ${#pids[@]} child processes..."
  for pid in "${pids[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
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

wait -n
cleanup
