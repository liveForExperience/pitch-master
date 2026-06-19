#!/usr/bin/env bash
# 仅启动后端（会先释放 3000 端口）
# 用法：npm run dev:backend

set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

# shellcheck source=dev-lib.sh
source "${ROOT}/bin/dev-lib.sh"

ensure_deps "$ROOT"
free_port 3000

echo "[dev] backend → http://localhost:3000/api/health"
exec npm run dev -w pitchmaster-backend
