        "hostname": "YanYuCloudCube",
          "volumes": volumes_info
      })

  @nas_bp.route('/services', methods=['GET'])
  @token_required
  def get_nas_services():
      """获取已安装服务的运行状态 (模拟)"""
      # 这里应该调用本地命令或 API 检查 Docker 容器状态
      # 由于没有真实权限，我们返回配置文件中的列表
      installed_services = {
          "docker": {"status": "running", "containers": 12},
          "plex": {"status": "running", "port": 32400},
          "transmission": {"status": "running", "port": 9091},
          "mysql": {"status": "running", "port": 3306},
          "postgresql": {"status": "running", "port": 5432}
      }

      return jsonify({
          "success": True,
          "services": installed_services
      })

--------

### 3. 新增：FRP 隧道状态服务集成

文件路径:  src/app/api/v2/network/frp.py  功能: 查询 ECS 上的 FRP Dashboard API，获取各实例的连接状态。

  # src/app/api/v2/network/frp.py
  import requests
  import logging
  from flask import Blueprint, jsonify, request
  from app.auth.jwt_decorators import token_required

  frp_bp = Blueprint('frp_v2', __name__, url_prefix='/network/frp')
  logger = logging.getLogger('yyc3_frp')

  # FRP Dashboard API 地址 (假设在 ECS 本地通过内网访问，或通过配置获取)
  FRP_API_URL = "http://127.0.0.1:7400/api/proxy"
  # 注意：FRPS 默认不开启详细 API，这里假设配置了 dashboard proxy 或者直接解析 FRP 状态文件
  # 更通用的做法是读取 FRPS 生成的 JSON 文件，或者由监控服务定期写入数据库

  @frp_bp.route('/status', methods=['GET'])
  @token_required
  def get_frp_status():
      """获取 FRP 客户端连接状态"""
      try:
          # 方案A: 如果 FRPS 配置了 Dashboard API，直接请求
          # resp = requests.get(FRP_API_URL) ...

          # 方案B: (模拟数据) 根据您提供的系统信息表
          # 实际生产中，建议由 FRPS 日志解析器推送到 PostgreSQL，然后这里查询数据库
          system_info = [
              {"name": "admin-0379", "port": "18080", "connections": 0, "status": "online"},
              {"name": "api-0379", "port": "18080", "connections": 0, "status": "online"},
              {"name": "ddns-0379", "port": "18080", "connections": 0, "status": "online"},
              {"name": "llm-0379", "port": "18080", "connections": 0, "status": "online"},
              {"name": "mail-0379", "port": "18080", "connections": 0, "status": "online"},
              {"name": "monitor-0379", "port": "18080", "connections": 0, "status": "online"},
              {"name": "nas-0379", "port": "18080", "connections": 0, "status": "online"},
          ]

          return jsonify({
              "success": True,
              "client_version": "0.64.0",
              "server_status": "running",
              "proxies": system_info
          })

      except Exception as e:
          logger.error(f"Failed to fetch FRP status: {e}")
          return jsonify({"success": False, "error": str(e)}), 500
