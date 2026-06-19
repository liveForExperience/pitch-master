#!/usr/bin/env bash
# 开发环境公共函数（被 dev.sh / dev-stop.sh / dev-web.sh 引用）

free_port() {
  local port=$1
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [[ -z "$pids" ]]; then
    return 0
  fi

  echo "[dev] freeing port ${port} (pids: ${pids})"
  # shellcheck disable=SC2086
  kill $pids 2>/dev/null || true
  sleep 0.4

  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "[dev] force kill port ${port} (pids: ${pids})"
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
    sleep 0.2
  fi
}

# 释放 backend + Vite 常用端口（含 strictPort 失败前的 5174+ 孤儿进程）
free_dev_ports() {
  free_port 3000
  local p
  for p in $(seq 5173 5180); do
    free_port "$p"
  done
}

ensure_deps() {
  local root=$1
  local need=0

  if [[ ! -d "${root}/node_modules" ]] \
    || [[ ! -e "${root}/node_modules/vite-plugin-pwa" ]] \
    || [[ ! -e "${root}/node_modules/hono" ]]; then
    need=1
  elif [[ -f "${root}/package-lock.json" ]] && [[ "${root}/package-lock.json" -nt "${root}/node_modules" ]]; then
    need=1
  fi

  if [[ "$need" -eq 1 ]]; then
    echo "[dev] installing workspace deps (npm install at repo root)..."
    (cd "$root" && npm install)
  fi
}

wait_any_child() {
  local pid
  while true; do
    for pid in "$@"; do
      if ! kill -0 "$pid" 2>/dev/null; then
        return 0
      fi
    done
    sleep 1
  done
}
