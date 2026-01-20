"""
NAS管理API模块
提供NAS服务状态、存储卷管理、文件共享配置等接口
"""

import os
import subprocess
import requests
from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin

nas_bp = Blueprint('nas', __name__)

# NAS API配置
NAS_API_URL = os.getenv('NAS_API_URL', 'http://localhost:6004')
NAS_API_KEY = os.getenv('NAS_API_KEY', '')


def call_nas_api(endpoint, method='GET', data=None):
    """
    调用NAS API
    
    Args:
        endpoint: API端点
        method: HTTP方法
        data: 请求数据
        
    Returns:
        dict: API响应
    """
    try:
        url = f"{NAS_API_URL}{endpoint}"
        headers = {
            'Content-Type': 'application/json',
        }
        
        if NAS_API_KEY:
            headers['Authorization'] = f'Bearer {NAS_API_KEY}'
        
        if method == 'GET':
            response = requests.get(url, headers=headers, timeout=10)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == 'PUT':
            response = requests.put(url, headers=headers, json=data, timeout=10)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers, timeout=10)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {
            'error': str(e),
            'service': 'nas',
            'available': False
        }


# ========== 模拟数据（当NAS API不可用时） ==========

MOCK_NAS_STATUS = {
    'running': True,
    'status': 'online',
    'uptime': '15天 3小时 45分钟',
    'version': 'DSM 7.2.1-69057 Update 3',
    'cpuUsage': 12.5,
    'memoryUsage': 45.3,
    'temperature': 42,
}

MOCK_NAS_VOLUMES = [
    {
        'id': 'vol1',
        'name': 'Volume 1',
        'type': 'Btrfs',
        'total': 16000,
        'used': 8750,
        'available': 7250,
        'health': 'healthy',
        'mountPoint': '/volume1'
    },
    {
        'id': 'vol2',
        'name': 'Volume 2',
        'type': 'EXT4',
        'total': 8000,
        'used': 3200,
        'available': 4800,
        'health': 'healthy',
        'mountPoint': '/volume2'
    }
]

MOCK_NAS_SHARES = [
    {
        'id': 'share1',
        'name': 'Documents',
        'path': '/volume1/documents',
        'type': 'smb',
        'enabled': True,
        'users': ['admin', 'user1', 'user2'],
        'permissions': 'full',
        'status': 'active'
    },
    {
        'id': 'share2',
        'name': 'Media',
        'path': '/volume1/media',
        'type': 'webdav',
        'enabled': True,
        'users': ['admin', 'media_user'],
        'permissions': 'read',
        'status': 'active'
    },
    {
        'id': 'share3',
        'name': 'Backups',
        'path': '/volume2/backups',
        'type': 'nfs',
        'enabled': False,
        'users': ['admin'],
        'permissions': 'full',
        'status': 'inactive'
    }
]

MOCK_NAS_FILES = [
    {
        'id': 'file-1',
        'name': '重要文档.pdf',
        'type': 'file',
        'size': 2048576,
        'updatedAt': '2025-01-05T10:30:00',
        'parentId': None
    },
    {
        'id': 'folder-1',
        'name': '工作资料',
        'type': 'folder',
        'size': 0,
        'updatedAt': '2025-01-05T09:00:00',
        'parentId': None
    },
]


# ========== NAS 状态接口 ==========

@nas_bp.route('/info', methods=['GET'])
@cross_origin()
def get_nas_info():
    """
    获取NAS完整信息（系统信息、存储卷、服务状态）
    
    返回:
        JSON: NAS完整信息
    """
    try:
        # 尝试调用真实NAS API
        result = call_nas_api('/info')
        
        if 'error' in result:
            # API不可用，返回模拟数据
            nas_info = {
                'system': MOCK_NAS_STATUS,
                'volumes': MOCK_NAS_VOLUMES,
                'shares': MOCK_NAS_SHARES,
                'services': [
                    {
                        'name': 'SMB',
                        'status': 'running',
                        'port': 445
                    },
                    {
                        'name': 'AFP',
                        'status': 'stopped',
                        'port': 548
                    },
                    {
                        'name': 'NFS',
                        'status': 'running',
                        'port': 2049
                    },
                    {
                        'name': 'WebDAV',
                        'status': 'running',
                        'port': 5005
                    }
                ]
            }
            return jsonify({
                'success': True,
                'data': nas_info,
                'source': 'mock'
            }), 200
        
        return jsonify({
            'success': True,
            'data': result,
            'source': 'api'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@nas_bp.route('/status', methods=['GET'])
@cross_origin()
def get_nas_status():
    """
    获取NAS服务状态
    
    返回:
        JSON: NAS服务状态信息
    """
    try:
        # 尝试调用真实NAS API
        result = call_nas_api('/status')
        
        if 'error' in result:
            # API不可用，返回模拟数据
            return jsonify({
                'success': True,
                'data': MOCK_NAS_STATUS,
                'source': 'mock'
            }), 200
        
        return jsonify({
            'success': True,
            'data': result,
            'source': 'api'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@nas_bp.route('/start', methods=['POST'])
@cross_origin()
def start_nas():
    """
    启动NAS服务
    
    返回:
        JSON: 操作结果
    """
    try:
        result = call_nas_api('/start', method='POST')
        
        if 'error' in result:
            return jsonify({
                'success': True,
                'message': 'NAS服务启动命令已发送（模拟）'
            }), 200
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@nas_bp.route('/stop', methods=['POST'])
@cross_origin()
def stop_nas():
    """
    停止NAS服务
    
    返回:
        JSON: 操作结果
    """
    try:
        result = call_nas_api('/stop', method='POST')
        
        if 'error' in result:
            return jsonify({
                'success': True,
                'message': 'NAS服务停止命令已发送（模拟）'
            }), 200
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ========== 存储卷接口 ==========

@nas_bp.route('/volumes', methods=['GET'])
@cross_origin()
def get_nas_volumes():
    """
    获取存储卷列表
    
    返回:
        JSON: 存储卷列表
    """
    try:
        # 尝试调用真实NAS API
        result = call_nas_api('/volumes')
        
        if 'error' in result:
            # API不可用，返回模拟数据
            return jsonify({
                'success': True,
                'data': MOCK_NAS_VOLUMES,
                'source': 'mock'
            }), 200
        
        return jsonify({
            'success': True,
            'data': result,
            'source': 'api'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@nas_bp.route('/volumes/<volume_id>', methods=['GET'])
@cross_origin()
def get_nas_volume(volume_id):
    """
    获取单个存储卷详情
    
    Args:
        volume_id: 存储卷ID
        
    返回:
        JSON: 存储卷详情
    """
    try:
        result = call_nas_api(f'/volumes/{volume_id}')
        
        if 'error' in result:
            # 从模拟数据中查找
            volume = next((v for v in MOCK_NAS_VOLUMES if v['id'] == volume_id), None)
            if volume:
                return jsonify({
                    'success': True,
                    'data': volume,
                    'source': 'mock'
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': 'Volume not found'
                }), 404
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ========== 文件共享接口 ==========

@nas_bp.route('/shares', methods=['GET'])
@cross_origin()
def get_nas_shares():
    """
    获取文件共享列表
    
    返回:
        JSON: 文件共享列表
    """
    try:
        # 尝试调用真实NAS API
        result = call_nas_api('/shares')
        
        if 'error' in result:
            # API不可用，返回模拟数据
            return jsonify({
                'success': True,
                'data': MOCK_NAS_SHARES,
                'source': 'mock'
            }), 200
        
        return jsonify({
            'success': True,
            'data': result,
            'source': 'api'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@nas_bp.route('/shares/<share_id>', methods=['GET'])
@cross_origin()
def get_nas_share(share_id):
    """
    获取单个文件共享详情
    
    Args:
        share_id: 共享ID
        
    返回:
        JSON: 文件共享详情
    """
    try:
        result = call_nas_api(f'/shares/{share_id}')
        
        if 'error' in result:
            # 从模拟数据中查找
            share = next((s for s in MOCK_NAS_SHARES if s['id'] == share_id), None)
            if share:
                return jsonify({
                    'success': True,
                    'data': share,
                    'source': 'mock'
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': 'Share not found'
                }), 404
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@nas_bp.route('/shares/<share_id>/toggle', methods=['POST'])
@cross_origin()
def toggle_nas_share(share_id):
    """
    切换文件共享状态
    
    Args:
        share_id: 共享ID
        
    返回:
        JSON: 操作结果
    """
    try:
        # 获取当前状态
        share = next((s for s in MOCK_NAS_SHARES if s['id'] == share_id), None)
        if share:
            share['enabled'] = not share['enabled']
            share['status'] = 'active' if share['enabled'] else 'inactive'
        
        # 尝试调用真实NAS API
        result = call_nas_api(f'/shares/{share_id}/toggle', method='POST')
        
        if 'error' in result:
            # API不可用，返回模拟结果
            if share:
                return jsonify({
                    'success': True,
                    'data': share,
                    'message': f'文件共享 "{share["name"]}" 已{"启用" if share["enabled"] else "禁用"}',
                    'source': 'mock'
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': 'Share not found'
                }), 404
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ========== 文件管理接口 ==========

@nas_bp.route('/files', methods=['GET'])
@cross_origin()
def get_nas_files():
    """
    获取文件列表
    
    查询参数:
        parent_id: 父文件夹ID
        
    返回:
        JSON: 文件列表
    """
    try:
        parent_id = request.args.get('parent_id')
        
        # 尝试调用真实NAS API
        result = call_nas_api('/files', params={'parent_id': parent_id})
        
        if 'error' in result:
            # API不可用，返回模拟数据
            if parent_id:
                # 过滤子文件
                files = [f for f in MOCK_NAS_FILES if f.get('parentId') == parent_id]
            else:
                # 返回根目录文件
                files = [f for f in MOCK_NAS_FILES if not f.get('parentId')]
            
            return jsonify({
                'success': True,
                'data': files,
                'source': 'mock'
            }), 200
        
        return jsonify({
            'success': True,
            'data': result,
            'source': 'api'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
