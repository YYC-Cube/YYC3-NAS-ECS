from flask import Blueprint, request, jsonify
from datetime import datetime
import psutil
import socket
import platform

monitor_bp = Blueprint('monitoring_v2', __name__, url_prefix='/monitoring')


def get_network_interfaces_stats():
    """获取网络接口统计"""
    interfaces = {}
    stats = psutil.net_io_counters(pernic=True)
    for name, stat in stats.items():
        interfaces[name] = {
            "bytes_sent": stat.bytes_sent,
            "bytes_recv": stat.bytes_recv,
            "packets_sent": stat.packets_sent,
            "packets_recv": stat.packets_recv,
            "errors_in": stat.errin,
            "errors_out": stat.errout,
            "drops_in": stat.dropin,
            "drops_out": stat.dropout
        }
    return interfaces


def get_system_uptime():
    """获取系统运行时间"""
    boot_time = psutil.boot_time()
    uptime = datetime.now() - datetime.fromtimestamp(boot_time)
    days = uptime.days
    hours, remainder = divmod(uptime.seconds, 3600)
    minutes, _ = divmod(remainder, 60)
    return f"{days}d {hours}h {minutes}m"


def get_service_status(service_name):
    """获取服务状态"""
    try:
        import subprocess
        result = subprocess.run(
            ["systemctl", "is-active", service_name],
            capture_output=True,
            text=True
        )
        return {
            "name": service_name,
            "status": result.stdout.strip(),
            "running": result.stdout.strip() == "active"
        }
    except Exception as e:
        return {
            "name": service_name,
            "status": "unknown",
            "error": str(e)
        }


def get_all_services_status():
    """获取所有服务状态"""
    services = ["nginx", "postgres", "redis", "api"]
    return {name: get_service_status(name) for name in services}


def check_dns_health(domain):
    """检查DNS健康状态"""
    try:
        import socket
        ip = socket.gethostbyname(domain)
        return {
            "domain": domain,
            "healthy": True,
            "ip": ip,
            "response_time": 0.1
        }
    except Exception as e:
        return {
            "domain": domain,
            "healthy": False,
            "error": str(e)
        }


def check_web_health(url):
    """检查Web服务健康状态"""
    try:
        import requests
        response = requests.get(url, timeout=10)
        return {
            "url": url,
            "healthy": response.status_code == 200,
            "status_code": response.status_code,
            "response_time": response.elapsed.total_seconds()
        }
    except Exception as e:
        return {
            "url": url,
            "healthy": False,
            "error": str(e)
        }


@monitor_bp.route('/system', methods=['GET'])
def get_system_monitoring():
    """获取系统实时监控数据"""
    metrics = request.args.get('metrics', 'all')

    try:
        monitoring_data = {}

        if metrics in ['all', 'cpu']:
            monitoring_data['cpu'] = {
                "percent": psutil.cpu_percent(interval=1),
                "percent_per_core": psutil.cpu_percent(interval=1, percpu=True),
                "load_average": psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None,
                "frequency": psutil.cpu_freq().current if hasattr(psutil.cpu_freq(), 'current') else None
            }

        if metrics in ['all', 'memory']:
            memory = psutil.virtual_memory()
            monitoring_data['memory'] = {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent,
                "used": memory.used,
                "free": memory.free,
                "buffers": getattr(memory, 'buffers', 0),
                "cached": getattr(memory, 'cached', 0)
            }

        if metrics in ['all', 'disk']:
            disk = psutil.disk_usage('/')
            monitoring_data['disk'] = {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk.percent
            }

            # IO统计
            disk_io = psutil.disk_io_counters()
            if disk_io:
                monitoring_data['disk_io'] = {
                    "read_count": disk_io.read_count,
                    "write_count": disk_io.write_count,
                    "read_bytes": disk_io.read_bytes,
                    "write_bytes": disk_io.write_bytes
                }

        if metrics in ['all', 'network']:
            net_io = psutil.net_io_counters()
            if net_io:
                monitoring_data['network'] = {
                    "bytes_sent": net_io.bytes_sent,
                    "bytes_recv": net_io.bytes_recv,
                    "packets_sent": net_io.packets_sent,
                    "packets_recv": net_io.packets_recv,
                    "interfaces": get_network_interfaces_stats()
                }

        if metrics in ['all', 'processes']:
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
                try:
                    processes.append(proc.info)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

            monitoring_data['processes'] = {
                "total": len(processes),
                "top_cpu": sorted(processes, key=lambda x: x.get('cpu_percent', 0), reverse=True)[:10],
                "top_memory": sorted(processes, key=lambda x: x.get('memory_percent', 0), reverse=True)[:10]
            }

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": monitoring_data,
            "metadata": {
                "hostname": socket.gethostname(),
                "platform": platform.platform(),
                "uptime": get_system_uptime()
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@monitor_bp.route('/services', methods=['GET'])
def get_services_status():
    """获取服务状态"""
    service_name = request.args.get('service')

    try:
        if service_name:
            # 获取特定服务状态
            service_status = get_service_status(service_name)
            services_data = {service_name: service_status}
        else:
            # 获取所有服务状态
            services_data = get_all_services_status()

        # 计算总体健康状态
        healthy_services = sum(1 for s in services_data.values() if s.get('running', False))
        total_services = len(services_data)

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "services": services_data,
                "summary": {
                    "total": total_services,
                    "healthy": healthy_services,
                    "unhealthy": total_services - healthy_services,
                    "health_percentage": (healthy_services / total_services * 100) if total_services > 0 else 0
                }
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@monitor_bp.route('/dns/health', methods=['GET'])
def get_dns_health():
    """获取DNS健康状态"""
    domain = request.args.get('domain', 'ddns.0379.email')

    try:
        dns_health_data = check_dns_health(domain)

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": dns_health_data
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@monitor_bp.route('/web/health', methods=['GET'])
def get_web_health():
    """获取Web服务健康状态"""
    url = request.args.get('url', 'https://ddns.0379.email')

    try:
        web_health_data = check_web_health(url)

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": web_health_data
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
