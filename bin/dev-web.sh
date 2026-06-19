#!/usr/bin/env bash
# 仅启动前端（会先清理端口 + 检查依赖）
# 用法：npm run dev:web

set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

# shellcheck source=dev-lib.sh
source "${ROOT}/bin/dev-lib.sh"

ensure_deps "$ROOT"
free_dev_ports

echo "[dev] web → http://localhost:5173"
exec npm run dev -w pitchmaster-web
