 import os
  import shutil
  import psutil
  import logging
  from flask import Blueprint, jsonify
  from app.auth.jwt_decorators import token_required

  nas_bp = Blueprint('nas_v2', __name__, url_prefix='/nas')
  logger = logging.getLogger('yyc3_nas')

  # 定义卷配置 (基于您的系统信息)
  VOLUMES = {
      "volume1": {
          "path": "/Volume1",
          "type": "RAID6",
          "device": "4x8T-WD-HA340",
          "fs": "Btrfs"
      },
      "volume2": {
          "path": "/Volume2",
          "type": "RAID1",
          "device": "2x2T-SN850X",
          "fs": "Btrfs"
      }
  }

  def get_directory_structure(path, level=0):
      """递归获取目录结构 (模拟树状图)"""
      structure = []
      try:
          if not os.path.exists(path):
              return []

          # 限制递归深度防止性能问题
          if level > 3:
              return [{"name": "...", "type": "limit"}]

          with os.scandir(path) as entries:
              for entry in entries:
                  # 跳过隐藏文件和系统文件夹
                  if entry.name.startswith('.') or entry.name in ['#recycle', '@', 'lost+found']:
                      continue

                  item = {
                      "name": entry.name,
                      "type": "directory" if entry.is_dir() else "file",
                      "path": entry.path
                  }

                  if entry.is_dir():
                      item["children"] = get_directory_structure(entry.path, level + 1)

                  structure.append(item)
      except PermissionError:
          logger.warning(f"Permission denied: {path}")
      except Exception as e:
          logger.error(f"Error reading {path}: {e}")

      return structure

  @nas_bp.route('/storage', methods=['GET'])
  @token_required
  def get_storage_info():
      """获取详细的存储信息"""
      volumes_info = []

      for vol_name, vol_config in VOLUMES.items():
          path = vol_config["path"]

          if not os.path.exists(path):
              continue

          # 获取磁盘使用情况 (psutil)
          try:
              total, used, free, percent = shutil.disk_usage(path)
              usage_data = {
                  "total": total,
                  "used": used,
                  "free": free,
                  "percent": percent,
                  "total_gb": round(total / (1024**3), 2),
                  "used_gb": round(used / (1024**3), 2),
                  "free_gb": round(free / (1024**3), 2)
              }
          except Exception as e:
              usage_data = {"error": str(e)}

          # 获取目录结构 (取前两层以优化性能)
          dir_structure = get_directory_structure(path)

          volumes_info.append({
              "name": vol_name.upper(),
              "mount_point": path,
              "device": vol_config["device"],
              "array_type": vol_config["type"],
              "file_system": vol_config["fs"],
              "usage": usage_data,
              "structure": dir_structure
          })

      return jsonify({
          "success": True,
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
