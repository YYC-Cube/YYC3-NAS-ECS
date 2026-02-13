# YYC³（YanYuCloudCube）ECS-NAS

## YYC³-ALIYUN-ECS

### ECS yyc3-33

ECS_33_NAME=yyc3-33
ECS_33_OS=AC Linux3.2104-LTS-x64
ECS_33_CPU=4vCPU
ECS_33_RAM=8GiB
ECS_33_BANDWIDTH=5Mbps
ECS_33_IMAGE_ID=aliyun_3_x64_20G_container_optimized_20250117.vhd
ECS_33_ROOT=root
ECS_33_PRIVATE_IP=172.29.225.115
ECS_33_PUBLIC_IP=8.152.195.33
ECS_33_HOST_NAME=yyc3-33

### 部署服务

- Frp 服务：用于实现远程访问和端口映射。
- DDNS 服务：用于提供文件共享服务。
- API 服务：用于提供 API 接口。
- Mail 服务：用于提供邮件服务。
- LLM 服务：用于提供大模型服务。
- NAS 服务：用于提供文件共享服务。
- admin 服务：用于提供管理界面。
- monitor 服务：用于提供监控服务。
- nginx 服务：用于提供反向代理服务。

## 服务域名配置

### 域名注册

- 主域名：admin.0379.email
- 邮箱域名：0379.email
- NAS 域名：nas.0379.email
- API 域名：api.0379.email
- 邮件域名：mail.0379.email
- LLM 域名：llm.0379.email
- DDNS 域名：ddns.0379.email
- Frp 域名：frp.0379.email
- 其他域名：其他服务的自定义域名

---

## YYC³-NAS

### 架构信息

- 硬件：
  - 服务器：YanYuCloudCube
  - 存储设备：2个2TB硬盘
- 软件：
  - 操作系统：Ubuntu Server 22.04 LTS
  - 容器化平台：Docker Engine
  - 文件共享协议：NFSv4
  - 监控工具：Prometheus + Grafana
  - 日志工具：ELK Stack (Elasticsearch, Logstash, Kibana)
  - 其他工具：
    - 端口映射工具：Nginx
    - 反向代理工具：Traefik
    - 容器编排工具：Docker Compose

## YYC³ NAS 环境变量

### 🧩 .env.nas

NAS_NAME=YanYuCloud
NAS_CPU=Intel-Quad-Core
NAS_OS=Linux
NAS_RAM=32GB
Volume2=RAID1_SSD=2x2T-SN850X
Volume1=RAID6_HDD=4x8T-WD-HA340
NAS_ROOT=YYC
NAS_HOST_NAME=yyc3-45
NAS_IP=192.168.3.45
NAS_PORT=9557

### MySQL 环境变量

MySQL_ROOT_PASSWORD=My151001
DB_NAME=yyc3_my
DB_USER=yyc3
DB_PASSWORD=yyc3_my
DB_HOST=192.168.3.45
DB_PORT=3306
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci
DB_DATABASE=yyc3_my

### PostgreSQL 环境变量

PostgreSQL_ROOT_PASSWORD=My151001
DB_NAME=DB_PASSWORD_PLACEHOLDER
DB_USER=DB_PASSWORD_PLACEHOLDER
DB_PASSWORD=DB_PASSWORD_PLACEHOLDER
DB_HOST=192.168.3.45
DB_PORT=5432
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci
DB_DATABASE=DB_PASSWORD_PLACEHOLDER

## 存储卷信息

### Volume1

- 存储设备：4x8T-WD-HA340
- 挂载点：/Volume1
- 阵列类型：RAID6

### Volume2

- 存储设备：2x2T-SN850X
- 挂载点：/Volume2
- 阵列类型：RAID1

## 存储结构

### YYC@YanYuCloudCube

·
├── Volume1
│   ├── #recycle
│   ├── @apps
│   ├── @cache
│   ├── @desktop
│   ├── @system
│   ├── @thumbnail
│   ├── @videoframe
│   ├── BaiduApp
│   ├── Photos
│   ├── archive
│   ├── backup
│   ├── backups
│   ├── data
│   ├── docker
│   ├── env
│   ├── media
│   ├── projects
│   ├── sdkpath
│   ├── share
│   ├── web
│   ├── www
│   └── 守护沫语
├── Volume2
│   ├── @apps
│   ├── @backup
│   ├── @cache
│   ├── @collect
│   ├── @desktop
│   ├── @log
│   ├── @runtime
│   ├── @services
│   ├── @system
│   ├── @temp
│   ├── @thumbnail
│   ├── @videoframe
│   ├── @zlog
│   ├── ApacheTomcat
│   ├── BaiduApp
│   ├── MySQL
│   ├── Plex
│   ├── PostgreSQL_14
│   ├── Transmission
│   ├── ai
│   ├── backup
│   ├── config
│   ├── development
│   ├── homes
│   ├── logs
│   ├── ollama
│   ├── production
│   ├── public
│   ├── scripts
│   ├── virtualbox
│   └── 小语项目

YYC@YanYuCloudCube:/Volume1
.
├── #recycle
│   └── #recycle
├── @apps
│   ├── CloudSync
│   ├── MyWebSQL
│   ├── TerraSync
│   ├── TerraSyncClient2
│   ├── WebServer
│   └── phpMyAdmin
├── @cache
│   └── docker
├── @desktop
├── @system
│   └── GlobalSearch
├── @thumbnail
├── @videoframe
├── BaiduApp
│   └── #recycle
├── Photos
│   ├── #recycle
│   ├── 儿歌视频
│   └── 动画视频
├── archive
│   ├── #recycle
│   ├── data
│   ├── media
│   └── projects
├── backup
│   ├── #recycle
│   ├── automated
│   ├── logs
│   └── manual
├── backups
│   ├── #recycle
│   ├── critical_files
│   ├── ssd_backup
│   ├── system_config
│   └── user_data
├── data
│   ├── #recycle
│   ├── analytics
│   ├── datasets
│   ├── logs
│   └── models
├── docker
│   ├── #recycle
│   ├── backups
│   └── persistent
├── env
│   ├── #recycle
│   └── backup
├── media
│   ├── #recycle
│   ├── audio
│   ├── design
│   ├── image
│   └── video
├── projects
│   ├── #recycle
│   ├── active
│   ├── archive
│   └── completed
├── sdkpath
│   ├── #recycle
│   └── tmppath
├── share
│   ├── #recycle
│   ├── public
│   ├── team
│   └── temp
├── web
│   ├── test_6000
│   ├── test_6001
│   ├── test_6002
│   ├── test_6003
│   ├── test_6005
│   ├── test_6006
│   ├── test_6600
│   ├── test_6601
│   ├── test_6602
│   ├── test_6603
│   ├── test_6605
│   └── test_6606
├── www
│   ├── #recycle
│   ├── AI模型库
│   ├── YY-Nexus
│   ├── YYC-Cube
│   ├── YYC3-ECS
│   ├── YanYuCloud
│   ├── ZIP压缩包
│   ├── frpc
│   ├── 历史数据
│   ├── 域名管理
│   ├── 媒体资源
│   ├── 密钥文件
│   ├── 开发工具
│   ├── 数据备份
│   ├── 机器学习
│   ├── 沫语时光
│   ├── 系统运行
│   ├── 网站资源
│   └── 静态资源
└── 守护沫语
    └── #recycle

YYC@YanYuCloudCube:/Volume1#

.
├── @apps
│   ├── DockerEngine
│   ├── DupleBackup_V2
│   ├── LogCenter
│   ├── OnlyOffice
│   ├── PHP80
│   ├── Portainer
│   ├── PostgreSQL_14
│   ├── PostgreSQL_okm
│   ├── Snapshot
│   ├── TFM_Backup
│   ├── USBCopy
│   ├── docker
│   ├── java
│   ├── mysql
│   ├── plex
│   ├── transmission
│   └── tsearch
├── @backup
│   └── packages
├── @cache
│   └── upload
├── @collect
│   └── YYC
├── @desktop
├── @log
│   └── filemanager
├── @runtime
│   ├── #recycle
│   ├── apps
│   ├── cache
│   ├── services
│   └── temp
├── @services
│   ├── #recycle
│   ├── configs
│   ├── data
│   └── logs
├── @system
│   ├── GlobalSearch
│   ├── media
│   └── redis
├── @temp
│   ├── build
│   ├── download
│   └── processing
├── @thumbnail
├── @videoframe
├── @zlog
├── ApacheTomcat
│   └── #recycle
├── BaiduApp
│   ├── sdkpath
│   └── 来自：百度网盘
├── MySQL
│   ├── #recycle
│   └── database
├── Plex
│   ├── #recycle
│   ├── Library
│   └── tmp_transcoding
├── PostgreSQL_14
│   ├── #recycle
│   ├── Postgre_okm_14.15
│   ├── conf
│   └── scripts
├── Transmission
│   ├── #recycle
│   └── rssseeds
├── ai
│   ├── #recycle
│   └── chatglm
├── backup
│   └── postgres
├── config
│   └── #recycle
├── development
│   ├── #recycle
│   ├── builds
│   ├── dependencies
│   ├── docker-data
│   ├── sources
│   └── tools
├── homes
│   ├── YYC
│   ├── elasticsearch
│   ├── gmy
│   └── super
├── logs
│   ├── #recycle
│   └── scripts
├── ollama
│   ├── #recycle
│   └── models
├── production
│   ├── #recycle
│   ├── api
│   ├── databases
│   ├── monitoring
│   └── web
├── public
│   └── #recycle
├── scripts
│   └── #recycle
├── virtualbox
│   └── #recycle
└── 小语项目

## Nas 应用安装

应用列表
├─ 网络安全类
│  ├─ AdGuard Home：网络安全防护工具（待安装）
│  ├─ ClamAV：病毒扫描安全工具（待安装）
│  └─ WireGuard：安全VPN网络服务工具（待安装）
├─ 下载工具类
│  ├─ aMule：P2P下载工具（待安装）
│  ├─ Aria2：多线程下载工具（待安装）
│  ├─ qBittorrent：BT下载工具（待安装）
│  ├─ 迅雷：国产下载工具（待安装）
│  └─ Transmission：下载/备份同步工具（已启用）
├─ 存储管理类
│  └─ 存储管理：NAS存储系统管理工具（已打开）
├─ 实用工具类
│  ├─ Apache Tomcat：Web服务器容器（待安装）
│  ├─ Calibre：电子书管理工具（待安装）
│  ├─ e107.cms：内容管理系统（待安装）
│  ├─ elfinder：Web文件管理工具（待安装）
│  ├─ FileBrowser：文件浏览工具（待安装）
│  ├─ Home Assistant：智能家居管理工具（待安装）
│  ├─ ManjisBT：实用工具（待安装）
│  ├─ NetFTP：FTP服务工具（待安装）
│  ├─ TNAS PC：NAS本地管理客户端（待安装）
│  ├─ 文本编辑器：文本编辑工具（已打开）
│  ├─ 文件管理：本地文件管理工具（已打开）
│  ├─ 在线Office：在线办公工具（已打开）
│  ├─ 全局搜索：系统内容搜索工具（已打开）
│  └─ Log Center：日志管理工具（已打开）
├─ 开发工具类
│  ├─ Bastillion：远程开发管理工具（待安装）
│  ├─ Docker Engine：Docker运行引擎（已停用）
│  ├─ Docker Manager：Docker可视化管理工具（已打开）
│  ├─ GitBucket：代码托管工具（待安装）
│  ├─ Grafana：数据可视化工具（待安装）
│  ├─ PHP 8.0：PHP运行环境（已卸载）
│  ├─ phpMyAdmin：MySQL数据库管理工具（待安装）
│  └─ Portainer：容器管理工具（已打开）
├─ 影音娱乐类
│  ├─ Bazaar：影音类应用市场（待安装）
│  ├─ 多媒体服务器：本地媒体服务工具（待安装）
│  ├─ iTunes服务器：iTunes媒体服务工具（待安装）
│  ├─ Jellyseerr：媒体请求管理工具（待安装）
│  ├─ Kavita：漫画管理工具（待安装）
│  ├─ Emby Server：媒体服务器（待安装）
│  ├─ Plex Media Server：媒体服务器（已启用）
│  ├─ Tautulli：媒体统计分析工具（待安装）
│  ├─ SABnzbd4：Usenet下载工具（待安装）
│  ├─ SickChill：媒体自动下载管理工具（待安装）
│  ├─ Sonarr：剧集管理工具（待安装）
│  ├─ 影视：影视资源管理工具（待安装）
│  └─ 影视客户端：影视播放客户端（待安装）
├─ 网络服务类
│  ├─ 贝锐蒲公英：异地组网工具（待安装）
│  ├─ FreshRSS：RSS订阅服务（待安装）
│  ├─ WordPress：博客系统（待安装）
│  └─ ZeroTier：虚拟局域网服务（待安装）
├─ 备份同步类
│  ├─ Centralized Backup：集中备份工具（待安装）
│  ├─ CloudSync：云存储同步工具（已打开）
│  ├─ Duplicati：多端备份同步工具（待安装）
│  ├─ Duplicati Backup：备份工具（待安装）
│  ├─ Duplicati Backup Vault：备份仓库工具（待安装）
│  ├─ ElephantDrive：云备份工具（待安装）
│  ├─ Resilio Sync：P2P同步工具（待安装）
│  ├─ TerraSync：备份同步工具（已打开）
│  ├─ TerraSync Client：同步客户端（已打开）
│  ├─ TFM Backup：备份工具（已打开）
│  ├─ TPC Backupper：备份工具（待安装）
│  └─ USB Copy：USB设备备份工具（已启用）
└─ 数据库类
   ├─ MariaDB：关系型数据库（已打开）
   ├─ PostgreSQL_kmn：PostgreSQL数据库（已启用）
   ├─ Redis：缓存数据库（待安装）
   └─ InfluxDB：时序数据库（待安装）

**手动安装：请选择 .tpk 或 .deb 格式的应用程序文件**
