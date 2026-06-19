# deploy/

PitchMaster v2 部署资源。

| 文件 | 用途 |
|---|---|
| `systemd/pitchmaster-v2.service` | systemd unit，定义如何启动 backend |
| `scripts/install.sh` | Phase 3 一键初始化（bootstrap + Nginx + 备份 cron） |
| `scripts/ecs-bootstrap.sh` | 装 Node 20 / 建目录 / 注册 deploy key / 装 unit |
| `scripts/deploy-receive.sh` | GitHub Actions 触发：解包、切换、健康检查、回滚 |
| `scripts/backup.sh` | SQLite 每日备份（WAL 安全 `.backup`） |
| `scripts/upgrade.sh` | 手工升级入口（转调 deploy-receive） |
| `nginx/pitchmaster-v2.conf` | HTTP 反代 + `/api/healthz` |
| `caddy/Caddyfile` | 可选 HTTPS（待域名） |

> 完整设计与决策见 [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md)。

## 首次部署的标准流程

1. 本地生成 deploy keypair：`ssh-keygen -t ed25519 -f ~/.ssh/pitchmaster_deploy -N ""`
2. 把 `deploy/` 整个目录 scp 到 ECS（首次特例，之后由 Actions 处理）：

   ```bash
   scp -r deploy root@8.153.145.81:/tmp/pitchmaster-deploy
   ```

3. 在 ECS 上跑 bootstrap（把公钥单行作为参数）：

   ```bash
   ssh root@8.153.145.81 \
     "bash /tmp/pitchmaster-deploy/scripts/ecs-bootstrap.sh \
       '$(cat ~/.ssh/pitchmaster_deploy.pub)'"
   ```

4. 在 GitHub 仓库设置 4 个 Secrets（仓库 → Settings → Secrets and variables → Actions）：
   - `DEPLOY_SSH_KEY` = `~/.ssh/pitchmaster_deploy` 全文
   - `DEPLOY_HOST` = `8.153.145.81`
   - `DEPLOY_USER` = `root`
   - `DEPLOY_KNOWN_HOSTS` = `ssh-keyscan 8.153.145.81` 输出
5. 把代码 push 到 main，或在 Actions 页 workflow_dispatch 一次。
6. 第一次部署成功后，配 Nginx 反代 :80 → :3000（见下）。

## Nginx 反代配置（首次部署后做一次）

```nginx
# /etc/nginx/conf.d/pitchmaster-v2.conf
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # 前端 SPA
    root /opt/pitchmaster-v2/current/web/dist;
    index index.html;

    # /api/* 反代到 Hono
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # SSE 透传
        proxy_buffering off;
        proxy_read_timeout 1h;
    }

    # SPA 兜底（History API）
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo cp /opt/pitchmaster-v2/current/deploy/nginx/pitchmaster-v2.conf /etc/nginx/conf.d/
sudo nginx -t && sudo systemctl reload nginx
```

## 回滚

`deploy-receive.sh` 在健康检查失败时会自动切回上一版。也可手工：

```bash
ssh root@8.153.145.81
cd /opt/pitchmaster-v2/releases
ls -1t   # 看历史
ln -sfn /opt/pitchmaster-v2/releases/<旧release-id> /opt/pitchmaster-v2/current
sudo systemctl restart pitchmaster-v2
```

## 排错

```bash
journalctl -u pitchmaster-v2 -n 200 --no-pager   # 服务日志
systemctl status pitchmaster-v2                  # 进程状态
ls -la /opt/pitchmaster-v2/current               # 当前 release
curl http://127.0.0.1:3000/api/health            # 本地直连
curl http://127.0.0.1:3000/api/healthz         # Uptime 探活别名
curl http://8.153.145.81/api/health              # 经 Nginx
curl http://8.153.145.81/api/healthz
```

## 备份与恢复

```bash
sudo /opt/pitchmaster-v2/bin/backup.sh
ls -la /var/lib/pitchmaster/backups/

# 恢复演练
sudo systemctl stop pitchmaster-v2
sudo cp /var/lib/pitchmaster/backups/data-YYYYMMDD.db /var/lib/pitchmaster/data.db
sudo systemctl start pitchmaster-v2
```
