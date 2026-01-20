# Redis 多设备配置仓库（MacBook Pro M4 / iMac M4 / 铁威马 NAS）

## 仓库用途

统一管理 192.168.3.0/24 网段内所有设备的 Redis 配置，支持：

- 本地开发（Mac 双设备，~/.zshrc已配置开机挂载NAS）
- Docker 部署（Mac/NAS 通用）
- 配置同步（GitHub 拉取，避免多设备重复修改）
- 环境隔离（开发/生产严格区分，防误迁移）

## 一、设备信息（SSH 连接&网络配置）

| 设备型号 | Host 别名 | HostName | IP 网段 | 用户名 | SSH 端口 | 用途 ||-------------------|-----------|----------------|---------------|---------|----------|---------------------|| MacBook Pro M4 | yanyu | yyc3.local | 192.168.3.0/24| yanyu | 22 | 主开发机 |
| iMac M4 | imac | my.local | 192.168.3.0/24| YYCC | 22 | 备用开发机 |
| 铁威马 F4-423 NAS | nas | YanYuCloud | 192.168.3.0/24| YYC | 57 | Redis 数据存储（共享）|

### SSH 快速连接（复制到本地 ~/.ssh/config）

```ssh-config
# === MacBook Pro M4 ===
Host yanyu
  HostName yyc3.local
  IP 192.168.3.0/24
  User yanyu
  Port 22
  StrictHostKeyChecking no  # 首次连接不弹窗验证

# === iMac M4 ===
Host imac
  HostName my.local
  IP 192.168.3.0/24
  User YYCC
  Port 22
  StrictHostKeyChecking no

# === NAS 铁威马 F4-423 ===
Host nas
  HostName YanYuCloud
  IP 192.168.3.0/24
  User YYC
  Port 57
  StrictHostKeyChecking no
  IdentityFile ~/.ssh/id_rsa_nas  # NAS 私钥（~/.ssh/config 已配置）

```
