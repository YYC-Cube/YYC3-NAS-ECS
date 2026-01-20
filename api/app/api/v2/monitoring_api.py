"""
系统监控API模块
提供系统状态、性能指标、资源使用情况等接口
"""

import os
import psutil
import platform
from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin

monitoring_bp = Blueprint('monitoring', __name__)


def get_system_stats():
    """获取系统基础统计信息"""
    try:
        # CPU使用率
        cpu_usage = psutil.cpu_percent(interval=1)
        
        # 内存使用情况
        memory = psutil.virtual_memory()
        memory_usage = memory.percent
        memory_total = memory.total / (1024 ** 3)  # GB
        memory_used = memory.used / (1024 ** 3)  # GB
        memory_available = memory.available / (1024 ** 3)  # GB
        
        # 磁盘使用情况
        disk = psutil.disk_usage('/')
        disk_usage = disk.percent
        disk_total = disk.total / (1024 ** 3)  # GB
        disk_used = disk.used / (1024 ** 3)  # GB
        disk_available = disk.free / (1024 ** 3)  # GB
        
        # 网络IO
        net_io = psutil.net_io_counters()
        network_in = net_io.bytes_recv / (1024 ** 2)  # MB
        network_out = net_io.bytes_sent / (1024 ** 2)  # MB
        
        # 系统运行时间
        uptime = datetime.now().timestamp() - psutil.boot_time()
        uptime_days = int(uptime // 86400)
        uptime_hours = int((uptime % 86400) // 3600)
        uptime_minutes = int((uptime % 3600) // 60)
        uptime_str = f"{uptime_days}天 {uptime_hours}小时 {uptime_minutes}分钟"
        
        # 系统负载
        load_avg = os.getloadavg() if hasattr(os, 'getloadavg') else [0, 0, 0]
        
        return {
            'cpu': {
                'usage': round(cpu_usage, 2),
                'cores': psutil.cpu_count(),
                'load_avg_1m': round(load_avg[0], 2) if load_avg else 0,
                'load_avg_5m': round(load_avg[1], 2) if load_avg else 0,
                'load_avg_15m': round(load_avg[2], 2) if load_avg else 0,
            },
            'memory': {
                'usage': round(memory_usage, 2),
                'total': round(memory_total, 2),
                'used': round(memory_used, 2),
                'available': round(memory_available, 2),
            },
            'disk': {
                'usage': round(disk_usage, 2),
                'total': round(disk_total, 2),
                'used': round(disk_used, 2),
                'available': round(disk_available, 2),
            },
            'network': {
                'in': round(network_in, 2),
                'out': round(network_out, 2),
                'in_speed': round(net_io.bytes_recv / (1024 ** 2), 2),  # MB/s
                'out_speed': round(net_io.bytes_sent / (1024 ** 2), 2),  # MB/s
            },
            'system': {
                'uptime': uptime_str,
                'uptime_seconds': int(uptime),
                'hostname': platform.node(),
                'os': platform.system(),
                'os_version': platform.release(),
                'architecture': platform.machine(),
                'python_version': platform.python_version(),
            },
            'timestamp': datetime.now().isoformat(),
        }
    except Exception as e:
        return {
            'error': str(e),
            'timestamp': datetime.now().isoformat(),
        }


@monitoring_bp.route('/stats', methods=['GET'])
@cross_origin()
def get_stats():
    """
    获取系统监控数据
    
    返回:
        JSON: 系统CPU、内存、磁盘、网络等监控数据
    """
    try:
        stats = get_system_stats()
        return jsonify({
            'success': True,
            'data': stats
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@monitoring_bp.route('/cpu', methods=['GET'])
@cross_origin()
def get_cpu_stats():
    """
    获取CPU详细统计信息
    
    查询参数:
        interval (int): 采样间隔，默认1秒
        
    返回:
        JSON: CPU使用率和核心信息
    """
    try:
        interval = request.args.get('interval', 1, type=int)
        
        cpu_percent = psutil.cpu_percent(interval=interval)
        cpu_count = psutil.cpu_count()
        cpu_count_logical = psutil.cpu_count(logical=True)
        
        per_cpu_percent = psutil.cpu_percent(interval=interval, percpu=True)
        
        return jsonify({
            'success': True,
            'data': {
                'usage': round(cpu_percent, 2),
                'physical_cores': cpu_count,
                'logical_cores': cpu_count_logical,
                'per_core_usage': [round(p, 2) for p in per_cpu_percent],
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@monitoring_bp.route('/memory', methods=['GET'])
@cross_origin()
def get_memory_stats():
    """
    获取内存详细统计信息
    
    返回:
        JSON: 内存使用情况，包括虚拟内存和交换内存
    """
    try:
        # 物理内存
        memory = psutil.virtual_memory()
        
        # 交换内存
        swap = psutil.swap_memory()
        
        return jsonify({
            'success': True,
            'data': {
                'virtual_memory': {
                    'total': round(memory.total / (1024 ** 3), 2),
                    'available': round(memory.available / (1024 ** 3), 2),
                    'used': round(memory.used / (1024 ** 3), 2),
                    'free': round(memory.free / (1024 ** 3), 2),
                    'percent': round(memory.percent, 2),
                },
                'swap_memory': {
                    'total': round(swap.total / (1024 ** 3), 2),
                    'used': round(swap.used / (1024 ** 3), 2),
                    'free': round(swap.free / (1024 ** 3), 2),
                    'percent': round(swap.percent, 2),
                }
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@monitoring_bp.route('/disk', methods=['GET'])
@cross_origin()
def get_disk_stats():
    """
    获取磁盘详细统计信息
    
    返回:
        JSON: 所有磁盘分区的使用情况
    """
    try:
        disk_partitions = []
        
        for partition in psutil.disk_partitions():
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                disk_partitions.append({
                    'device': partition.device,
                    'mountpoint': partition.mountpoint,
                    'fstype': partition.fstype,
                    'total': round(usage.total / (1024 ** 3), 2),
                    'used': round(usage.used / (1024 ** 3), 2),
                    'free': round(usage.free / (1024 ** 3), 2),
                    'percent': round(usage.percent, 2),
                })
            except PermissionError:
                continue
        
        return jsonify({
            'success': True,
            'data': {
                'partitions': disk_partitions
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@monitoring_bp.route('/network', methods=['GET'])
@cross_origin()
def get_network_stats():
    """
    获取网络详细统计信息
    
    返回:
        JSON: 网络IO和接口信息
    """
    try:
        # 网络IO统计
        net_io = psutil.net_io_counters()
        
        # 网络接口
        net_interfaces = {}
        for interface, addrs in psutil.net_if_addrs().items():
            net_interfaces[interface] = {
                'addresses': [
                    {
                        'family': addr.family.name,
                        'address': addr.address,
                        'netmask': addr.netmask,
                        'broadcast': addr.broadcast,
                    }
                    for addr in addrs
                ]
            }
        
        # 网络连接统计
        net_connections = {
            'total': 0,
            'established': 0,
            'listen': 0,
        }
        
        try:
            connections = psutil.net_connections(kind='inet')
            net_connections['total'] = len(connections)
            net_connections['established'] = sum(1 for c in connections if c.status == 'ESTABLISHED')
            net_connections['listen'] = sum(1 for c in connections if c.status == 'LISTEN')
        except psutil.AccessDenied:
            pass
        
        return jsonify({
            'success': True,
            'data': {
                'io_stats': {
                    'bytes_sent': net_io.bytes_sent,
                    'bytes_recv': net_io.bytes_recv,
                    'packets_sent': net_io.packets_sent,
                    'packets_recv': net_io.packets_recv,
                    'errin': net_io.errin,
                    'errout': net_io.errout,
                    'dropin': net_io.dropin,
                    'dropout': net_io.dropout,
                },
                'interfaces': net_interfaces,
                'connections': net_connections,
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@monitoring_bp.route('/processes', methods=['GET'])
@cross_origin()
def get_processes():
    """
    获取运行中的进程列表
    
    查询参数:
        limit (int): 返回的进程数量限制，默认20
        sort_by (str): 排序字段，默认'cpu'
        
    返回:
        JSON: 进程列表
    """
    try:
        limit = request.args.get('limit', 20, type=int)
        sort_by = request.args.get('sort_by', 'cpu')
        
        processes = []
        
        for proc in psutil.process_iter(['pid', 'name', 'username', 'cpu_percent', 'memory_percent']):
            try:
                processes.append({
                    'pid': proc.info['pid'],
                    'name': proc.info['name'],
                    'username': proc.info['username'],
                    'cpu_percent': round(proc.info['cpu_percent'], 2),
                    'memory_percent': round(proc.info['memory_percent'], 2),
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        # 排序
        processes.sort(key=lambda x: x.get(sort_by, 0), reverse=True)
        
        # 限制数量
        processes = processes[:limit]
        
        return jsonify({
            'success': True,
            'data': {
                'processes': processes,
                'total': len(processes),
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@monitoring_bp.route('/system', methods=['GET'])
@cross_origin()
def get_system_info():
    """
    获取系统信息
    
    返回:
        JSON: 系统详细信息
    """
    try:
        boot_time = datetime.fromtimestamp(psutil.boot_time())
        
        return jsonify({
            'success': True,
            'data': {
                'hostname': platform.node(),
                'os': platform.system(),
                'os_release': platform.release(),
                'os_version': platform.version(),
                'architecture': platform.machine(),
                'processor': platform.processor(),
                'python_version': platform.python_version(),
                'boot_time': boot_time.isoformat(),
                'uptime_seconds': datetime.now().timestamp() - psutil.boot_time(),
                'cpu_count': psutil.cpu_count(),
                'cpu_count_logical': psutil.cpu_count(logical=True),
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# 兼容旧接口
@monitoring_bp.route('/system/stats', methods=['GET'])
@cross_origin()
def get_stats_legacy():
    """
    兼容旧版本的系统统计接口
    
    返回:
        JSON: 系统监控数据（旧格式）
    """
    try:
        stats = get_system_stats()
        
        # 转换为旧格式
        legacy_stats = {
            'cpuUsage': stats['cpu']['usage'],
            'memoryUsage': stats['memory']['usage'],
            'diskUsage': stats['disk']['usage'],
            'networkIn': stats['network']['in'],
            'networkOut': stats['network']['out'],
            'uptime': stats['system']['uptime_seconds'],
            'timestamp': stats['timestamp'],
        }
        
        return jsonify(legacy_stats), 200
    except Exception as e:
        return jsonify({
            'error': str(e),
            'timestamp': datetime.now().isoformat(),
        }), 500
