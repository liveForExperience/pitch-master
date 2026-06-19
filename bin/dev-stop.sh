#!/usr/bin/env bash
# 停止所有本地开发进程（backend :3000 + web :5173–5180）
# 用法：npm run dev:stop

set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
# shellcheck source=dev-lib.sh
source "${ROOT}/bin/dev-lib.sh"

free_dev_ports
echo "[dev] all dev ports cleared"
