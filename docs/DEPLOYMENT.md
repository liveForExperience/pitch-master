# 部署方案 · GitHub → ECS

> **状态**：草案 v0.1（Phase 3 实施前定稿）
> **目标**：把 `main` 分支的最新代码自动部署到 `8.153.145.81`，无需任何手动 ssh 操作。

---

## 1. 设计取舍

### 1.1 候选方案对比

| 方案 | 触发方式 | 凭证位置 | 服务器主动性 | 是否需开放入站端口 | 安全风险 | 实施成本 |
|---|---|---|---|---|---|---|
| **A. GitHub Actions SSH push（推荐）** | push 到 main 触发 Actions，Actions 通过 SSH key 登录 ECS 执行部署脚本 | GitHub Secrets 持有部署 SSH key | 被动 | 22 端口（已开） | 凭证泄露需轮换 deploy-key；deploy-key 可限定为只读子集 | 中 |
| B. ECS pull + cron | crontab 每分钟 `git pull && rebuild` | ECS 本地凭证 / public repo | 主动 | 不需 | 单点；轮询浪费；延迟最长 1 分钟 | 低 |
| C. webhook（v1 用过） | GitHub Webhook POST → ECS 上 webhook 进程触发 build | webhook secret + Git 拉取凭证 | 被动 | 需开 :9000 或经 Nginx /webhook 反代 | 多一个常驻进程；密钥管理散乱（v1 用过默认 token） | 中 |
| D. Watchtower / 容器编排 | 镜像 push 触发 pull | Registry token | 主动 | 不需 | 引入容器/镜像仓库，反复制装备 | 高（且违背 v2 minimalist 原则） |

**决策：方案 A**。理由：
- 与 GitHub Actions 一脉相承，构建产物落 release artifact 可追溯
- 一台 1.8 GiB ECS 不适合"边构建边跑应用"——构建放 Actions 上，部署只解压与重启
- 凭证集中在 GitHub Secrets，比 v1 时代 hardcoded 在 webhook 中的 `your-secret-token` 安全得多
- 触发即时（push 几秒后开始），无轮询延迟

> ADR-0007 将在 Phase 3 实施前正式签发并记入 `DECISIONS.md`。

### 1.2 关键约束

- **不在 ECS 上构建**（内存只有 1.8 GiB，跑 Vite + 应用同时容易 OOM）
- **构建产物原子替换**：每次部署用 `mv` 切换目录的方式，失败可秒级回滚
- **零停机不强求**：v2 是玩具项目，0.5 秒中断完全可接受；不上 blue-green
- **SSH key 只为部署服务**：不复用 root 的私人 key，专用 deploy key，限定 forced command

---

## 2. 拓扑

```
GitHub repo (main)
       │ push
       ▼
GitHub Actions (ubuntu-latest)
   1. checkout
   2. setup-node 20
   3. npm ci
   4. npm run build (backend + web)
   5. tar -czf release.tar.gz  backend/dist  web/dist  package.json  ...
       │ scp via SSH key
       ▼
ECS 8.153.145.81
   /opt/pitchmaster-v2/
     releases/
       2026-06-19-153012-abc1234/    # 每个 release 一个时间戳目录
       2026-06-18-090455-def5678/    # 上一版（保留供回滚）
       ...
     current → releases/2026-06-19-153012-abc1234   # symlink
     shared/
       data.db                       # SQLite，跨版本持久
       node_modules/                 # production deps（保持稳定）
       .env                          # 运行配置
   /etc/systemd/system/pitchmaster-v2.service
     WorkingDirectory=/opt/pitchmaster-v2/current
     ExecStart=node backend/dist/index.js
```

切换流程：

```bash
# 部署脚本伪代码（在 ECS 上执行）
RELEASE_ID=$(date +%Y-%m-%d-%H%M%S)-${GIT_SHA:0:7}
mkdir -p /opt/pitchmaster-v2/releases/$RELEASE_ID
tar -xzf /tmp/release.tar.gz -C /opt/pitchmaster-v2/releases/$RELEASE_ID
ln -sf /opt/pitchmaster-v2/shared/data.db    /opt/pitchmaster-v2/releases/$RELEASE_ID/data.db
ln -sf /opt/pitchmaster-v2/shared/.env        /opt/pitchmaster-v2/releases/$RELEASE_ID/.env
ln -sfn /opt/pitchmaster-v2/releases/$RELEASE_ID /opt/pitchmaster-v2/current   # 原子切换
sudo systemctl reload-or-restart pitchmaster-v2
# 健康检查
for i in {1..10}; do
  curl -fs http://127.0.0.1:3000/api/health && exit 0
  sleep 1
done
# 失败回滚
ln -sfn /opt/pitchmaster-v2/releases/$PREVIOUS_RELEASE_ID /opt/pitchmaster-v2/current
sudo systemctl reload-or-restart pitchmaster-v2
exit 1
```

---

## 3. GitHub 仓库准备工作

### 3.1 生成专用 deploy key（一次性，本地操作）

```bash
ssh-keygen -t ed25519 -C "pitchmaster-deploy@github-actions" -f ~/.ssh/pitchmaster_deploy -N ""
# 产物：~/.ssh/pitchmaster_deploy (私钥) + ~/.ssh/pitchmaster_deploy.pub (公钥)
```

### 3.2 公钥上 ECS（受限 forced command）

把公钥加进 `/root/.ssh/authorized_keys`，但前置 `command=` 限定它只能跑部署脚本：

```
command="/opt/pitchmaster-v2/bin/deploy-receive.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAA... pitchmaster-deploy@github-actions
```

> 这样即使 deploy key 泄露，攻击者也只能触发部署脚本，无法 shell 进系统。

### 3.3 私钥进 GitHub Secrets

仓库 → Settings → Secrets and variables → Actions → New repository secret：

| Secret 名 | 内容 |
|---|---|
| `DEPLOY_SSH_KEY` | `~/.ssh/pitchmaster_deploy` 的全文内容（含 `-----BEGIN ... -----END`） |
| `DEPLOY_HOST` | `8.153.145.81` |
| `DEPLOY_USER` | `root` |
| `DEPLOY_KNOWN_HOSTS` | `ssh-keyscan 8.153.145.81` 的输出 |

> `DEPLOY_KNOWN_HOSTS` 用来防 MITM；不写会被迫 `StrictHostKeyChecking=no`，降级安全。

---

## 4. ECS 一次性准备

```bash
# 4.1 目录骨架
sudo mkdir -p /opt/pitchmaster-v2/{releases,shared,bin}
sudo touch /opt/pitchmaster-v2/shared/.env
sudo chmod 600 /opt/pitchmaster-v2/shared/.env

# 4.2 Node 20（系统级安装，参见 ARCHITECTURE_V2 §10.2）
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# 4.3 数据目录（SQLite 存放）
sudo mkdir -p /var/lib/pitchmaster
sudo chown root:root /var/lib/pitchmaster

# 4.4 部署接收脚本
sudo install -m 755 deploy/scripts/deploy-receive.sh /opt/pitchmaster-v2/bin/deploy-receive.sh

# 4.5 systemd 单元
sudo install -m 644 deploy/systemd/pitchmaster-v2.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable pitchmaster-v2   # 首次部署后再 start

# 4.6 Caddy（替换 nginx，自动 HTTPS）—— 暂缓，沿用 Nginx + 自签也可
# 见 ARCHITECTURE_V2 §10.3
```

---

## 5. GitHub Actions workflow 草案

> 实际文件在 Phase 3 开工时落到 `.github/workflows/deploy.yml`。下文仅记录设计意图。

```yaml
name: Deploy to ECS

on:
  push:
    branches: [main]
  workflow_dispatch: {}

concurrency:
  group: deploy-prod
  cancel-in-progress: false   # 部署不抢占

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
      - name: Package
        run: |
          tar -czf release.tar.gz \
            package.json package-lock.json \
            backend/package.json backend/dist \
            web/dist
      - name: SSH deploy
        env:
          SSH_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
          HOST: ${{ secrets.DEPLOY_HOST }}
          USER: ${{ secrets.DEPLOY_USER }}
          KNOWN_HOSTS: ${{ secrets.DEPLOY_KNOWN_HOSTS }}
          GIT_SHA: ${{ github.sha }}
        run: |
          mkdir -p ~/.ssh
          echo "$KNOWN_HOSTS" >> ~/.ssh/known_hosts
          echo "$SSH_KEY" > ~/.ssh/id_deploy
          chmod 600 ~/.ssh/id_deploy
          scp -i ~/.ssh/id_deploy release.tar.gz ${USER}@${HOST}:/tmp/
          # forced command on the server side does the install/swap/health-check
          ssh -i ~/.ssh/id_deploy ${USER}@${HOST} "$GIT_SHA"
```

---

## 6. 失败模式与对策

| 失败模式 | 检测 | 对策 |
|---|---|---|
| 构建产物超大 | Actions 上看 `du -h release.tar.gz`（>20MB 报警） | 拆分静态资源到 CDN（v2 玩具阶段不需要） |
| ECS scp 阶段失败 | Actions 步骤标红 | 重试一次；仍失败留 release 不切换 |
| systemd restart 后 health check 失败 | `deploy-receive.sh` 内 10 秒重试后回滚 | symlink 切回上一版 + restart |
| `current` 软链断了 | systemd 启动失败，`journalctl -u pitchmaster-v2` 看到 | 手动 `ln -sfn ... current` 修复 |
| SQLite schema 迁移失败 | Drizzle migrate 报错 | 应用启动器在 migrate 前先 `cp data.db data.db.bak.$(date)`；失败手动恢复 |
| 老 release 占满磁盘 | `df -h` | 部署脚本保留最近 5 个 release，更老的删除 |

---

## 7. 实施 checklist（Phase 3 开工时按序执行）

- [ ] 7.1 本地生成 `pitchmaster_deploy` ed25519 keypair
- [ ] 7.2 在 ECS 上准备 `/opt/pitchmaster-v2/` 目录骨架与 systemd unit
- [ ] 7.3 在 ECS 上安装 Node 20
- [ ] 7.4 把 deploy key 公钥加入 `~/.ssh/authorized_keys`，带 `command=` 前缀
- [ ] 7.5 在 GitHub 仓库设置 4 个 Secrets
- [ ] 7.6 实现 `deploy/scripts/deploy-receive.sh`
- [ ] 7.7 实现 `deploy/systemd/pitchmaster-v2.service`
- [ ] 7.8 实现 `.github/workflows/deploy.yml`
- [ ] 7.9 手动 `workflow_dispatch` 跑一次干跑验证
- [ ] 7.10 push 一次空 commit 到 main，验证全链路自动触发
- [ ] 7.11 故意改坏 health endpoint，验证回滚动作

---

## 8. 现状（Phase 0 末）

- ✅ ECS 上 v1 已彻底下线，端口 80 由 Nginx 占用但无 site
- ✅ GitHub 远端 `https://github.com/liveForExperience/pitch-master.git` 可写
- ⬜ 上述所有 ECS 一次性准备工作均未执行
- ⬜ 本文件描述的 GitHub Actions 与 systemd 单元均未创建

**预计实施时机**：Phase 1 MVP（首批 API 通） 完成后立即推进 Phase 3 准备，以便 Phase 1 验收阶段就能跑在 ECS 上做真机调试。
