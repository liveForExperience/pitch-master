#!/usr/bin/env bash
# 手工升级入口（常规升级走 GitHub Actions → deploy-receive.sh）。
#
# 用法：
#   scp release.tar.gz root@<host>:/tmp/
#   ssh root@<host> 'bash /opt/pitchmaster-v2/current/deploy/scripts/upgrade.sh <git-sha>'

set -euo pipefail

GIT_SHA="${1:-manual}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

exec bash "${SCRIPT_DIR}/deploy-receive.sh" "$GIT_SHA"
