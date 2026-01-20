# API 与 Redis 编排（Compose）

## 目标

- 一键启动 API 与 Redis，联调 `/status` 可见 `redis: ok|fail`。
- dev 连接 `redis-dev`；prod 连接 `redis-prod`。

## 前置

- 本地先在 `api/` 目录执行一次 `npm install`（dev 服务使用宿主机代码挂载）。
- 变量：`REDIS_PROD_PASSWORD`（生产认证），可在 `.env.local` 配置。

## 启动

- 开发联调：
  - `docker compose -f config/docker-compose.yml up -d redis-dev api-dev`
  - 访问 `http://localhost:${API_DEV_PORT-默认3000}/status`
- 生产演练：
  - `docker compose -f config/docker-compose.yml up -d redis-prod api-prod`
  - 访问 `http://localhost:${API_PROD_PORT-默认3001}/status`

## 环境映射与变量

- `api-dev`：绑定 `/Users/yanyu/Projects/redis-config/api` 到容器 `/usr/src/app`；`REDIS_HOST=redis-dev`，`REDIS_PORT=6380`。
- `api-prod`：镜像构建自 `api/Dockerfile`；`REDIS_HOST=redis-prod`，`REDIS_PORT=6379`，`REDIS_PASSWORD` 来自 `.env.local`。

## 常用操作

- 查看日志：
  - `docker compose -f config/docker-compose.yml logs -f api-dev`
  - `docker compose -f config/docker-compose.yml logs -f api-prod`
- 停止服务：
  - `docker compose -f config/docker-compose.yml stop api-dev api-prod`
- 删除服务与网络：
  - `docker compose -f config/docker-compose.yml down`

## 备注

- `api-dev` 没有容器内安装依赖，依赖来自宿主机项目目录；如需容器内热重载可改为使用 `nodemon` 并安装到镜像或容器。
- `api-prod` 默认以 `node index.js` 启动，可按需改为 `npm run start`。

## 变量插值与优先级（重要）

- Compose 变量插值来源顺序：`Shell 环境` > `config/.env` > `Compose 文件中的默认值`。
- `env_file:` 加载的是“容器内环境变量”，不会参与 Compose 变量插值（因此 `REDIS_PROD_PASSWORD` 要在 `config/.env` 或 Shell 中设置）。
- 建议将以下键写入 `config/.env`：
  - `REDIS_DEV_PORT=6381`、`REDIS_PROD_PORT=6380`
  - `API_DEV_PORT=3000`、`API_PROD_PORT=3001`
  - `REDIS_PROD_PASSWORD=…`（与生产配置一致）
- 覆盖示例：
  - 临时覆盖端口与密码：`REDIS_DEV_PORT=6382 REDIS_PROD_PASSWORD=xxxx docker compose -f config/docker-compose.yml up -d redis-dev api-dev`

## 热重载（api-dev）

- 安装：已将 `nodemon` 作为开发依赖安装。
- 启动命令：`api-dev` 使用 `npm run dev`（`nodemon index.js`）。
- 修改代码后容器自动重启；如需关闭热重载，可将命令改回 `node index.js`。
