# v1 运行时下线 SOP

> **目的**：在 v1 ECS 上完成数据备份与彻底下线，为 v2 释放系统资源。
> **决策依据**：[`DECISIONS.md` ADR-0006](./DECISIONS.md)
> **配套脚本**：[`../deploy/scripts/legacy-shutdown.sh`](../deploy/scripts/legacy-shutdown.sh)

本文件提供 **半自动脚本** 与 **手动逐步 SOP** 两条路径。优先用脚本，脚本失败时回退到手动 SOP。

---

## 一、前置准备（本地操作）

1. 确认你能 ssh root 登录 v1 ECS
2. 准备一个本地空目录用于接收备份：`mkdir -p ~/pitchmaster-v1-backup`
3. 把脚本上传到 ECS：

   ```bash
   scp deploy/scripts/legacy-shutdown.sh root@<ECS_IP>:/root/
   ```

---

## 二、路径 A：脚本化执行（推荐）

### A.1 在 ECS 上仅备份（dry run）

```bash
ssh root@<ECS_IP>
sudo bash /root/legacy-shutdown.sh --dump-only
```

脚本会：
- 盘点 v1 资产
- 备份 systemd / nginx / env 配置到 `/var/backups/pitchmaster-v1/`
- mysqldump 全库到同目录
- 不执行任何破坏性动作

### A.2 把备份拷回本地

```bash
# 在本地执行
scp -r root@<ECS_IP>:/var/backups/pitchmaster-v1/ ~/pitchmaster-v1-backup/
ls -lh ~/pitchmaster-v1-backup/
```

### A.3 检查 dump 大小，决定归档策略

```bash
du -h ~/pitchmaster-v1-backup/pitch_master-*.sql.gz
```

| 大小 | 处理 |
|---|---|
| < 10MB | 直接 `cp` 到 `legacy/db-dump/` 提交进仓库 |
| 10MB - 50MB | 用 [git-lfs](https://git-lfs.com/) 跟踪 |
| > 50MB | 放本地或对象存储，仓库内放 `legacy/db-dump/README.md` 说明位置 |

```bash
# 假设 <10MB：
mkdir -p legacy/db-dump
cp ~/pitchmaster-v1-backup/pitch_master-*.sql.gz legacy/db-dump/
echo "*.env*" >> legacy/db-dump/.gitignore    # 防止 env 文件含密码被误提交
git add legacy/db-dump
git commit -m "chore(legacy): archive v1 mysql dump as historical snapshot"
```

### A.4 执行完整下线

```bash
ssh root@<ECS_IP>
sudo bash /root/legacy-shutdown.sh
# 脚本会再次提示 yes 确认，输入 yes 继续
```

脚本会按顺序：
1. 再次备份（保险）
2. 停止 + 卸载 systemd `pitchmaster.service`
3. 移除 `/etc/nginx/conf.d/pitchmaster.conf`（保留 Nginx 本体）
4. `DROP DATABASE pitch_master`
5. 删除 `/opt/pitchmaster` 与 `/etc/pitchmaster`
6. 卸载 MySQL Server
7. 卸载 OpenJDK
8. 删除 `/opt/maven`

### A.5 验收

```bash
# 在 ECS 上
systemctl status pitchmaster        # → Unit not found
ls /opt/pitchmaster                 # → No such file
mysql --version                     # → command not found
java -version                       # → command not found
free -h                             # → 内存应当显著释放
df -h /                             # → 磁盘应当释放 ≥1GB
```

完成后，把 `/root/legacy-shutdown.sh` 也清理掉：

```bash
sudo rm /root/legacy-shutdown.sh
```

---

## 三、路径 B：手动逐步 SOP（脚本失败时使用）

### B.1 盘点

```bash
sudo systemctl status pitchmaster
ls -la /opt/pitchmaster /etc/pitchmaster
ls /etc/nginx/conf.d/pitchmaster.conf
mysql --version
java -version
```

### B.2 备份配置

```bash
sudo mkdir -p /var/backups/pitchmaster-v1
TS=$(date +%Y%m%d-%H%M%S)
sudo cp -p /etc/systemd/system/pitchmaster.service /var/backups/pitchmaster-v1/pitchmaster.service.$TS
sudo cp -p /etc/nginx/conf.d/pitchmaster.conf /var/backups/pitchmaster-v1/pitchmaster.conf.$TS
sudo cp -p /etc/pitchmaster/pitchmaster.env /var/backups/pitchmaster-v1/pitchmaster.env.$TS
```

### B.3 备份 MySQL

```bash
# 凭证从 env 拿
source /etc/pitchmaster/pitchmaster.env
sudo mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
    --single-transaction --routines --triggers --hex-blob \
    "$DB_NAME" | gzip -9 > /var/backups/pitchmaster-v1/${DB_NAME}-$TS.sql.gz

ls -lh /var/backups/pitchmaster-v1/
```

### B.4 拷回本地 + 提交仓库

同 A.2 / A.3。

### B.5 停服

```bash
sudo systemctl stop pitchmaster
sudo systemctl disable pitchmaster
sudo rm /etc/systemd/system/pitchmaster.service
sudo systemctl daemon-reload
```

### B.6 移除 Nginx site

```bash
sudo rm /etc/nginx/conf.d/pitchmaster.conf
sudo nginx -t && sudo systemctl reload nginx
```

### B.7 删库

```bash
mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "DROP DATABASE IF EXISTS \`$DB_NAME\`;"
```

### B.8 删除应用文件

```bash
sudo rm -rf /opt/pitchmaster /etc/pitchmaster
```

### B.9 卸载 MySQL / Java / Maven

```bash
# Ubuntu / Debian
sudo systemctl stop mysql
sudo apt-get remove --purge -y 'mysql-server*' 'mysql-client*' 'mysql-common*'
sudo apt-get autoremove -y
sudo rm -rf /var/lib/mysql /var/log/mysql /etc/mysql

sudo apt-get remove --purge -y 'openjdk-*-jdk*' 'openjdk-*-jre*'
sudo apt-get autoremove -y

sudo rm -rf /opt/maven

# Alibaba Cloud Linux 3 / RHEL
sudo systemctl stop mysqld
sudo dnf remove -y 'mysql*' 'mariadb*'
sudo rm -rf /var/lib/mysql /etc/my.cnf*
sudo dnf remove -y 'java-*'
sudo rm -rf /opt/maven
```

---

## 四、Nginx 取舍（Phase 3 部署 v2 时再决定）

v1 下线只删 site conf，**Nginx 本体保留**。Phase 3 部署 v2 时有两个选项：

| 选项 | 操作 |
|---|---|
| 继续用 Nginx | 直接写 `pitchmaster-v2.conf` 反代 `:3000`，不依赖 Caddy |
| 切换到 Caddy | `apt remove nginx -y` 后按 `ARCHITECTURE_V2.md §10.2` 装 Caddy |

ARCH 默认选 Caddy（自动 HTTPS），但 Nginx 也是可接受的兜底。

---

## 五、备份内容安全提示

⚠️ **`pitchmaster.env` 含 DB 明文密码**。
- 不要直接 commit 到公共仓库
- 提交 `legacy/db-dump/` 时配套 `.gitignore` 排除 `*.env*`
- 长期保管可放密码管理器（1Password / Bitwarden）

---

## 六、灾难恢复（如果误操作）

`legacy/db-dump/pitch_master-*.sql.gz` 可恢复：

```bash
gunzip -k pitch_master-YYYYMMDD-HHMMSS.sql.gz
mysql -u root -p -e "CREATE DATABASE pitch_master_restore CHARACTER SET utf8mb4;"
mysql -u root -p pitch_master_restore < pitch_master-YYYYMMDD-HHMMSS.sql
```

但 v2 不使用 MySQL，恢复仅作"考古"用途。
