import requests
import logging
import json
from flask import Blueprint, request, jsonify, stream_with_context, Response
from app.auth.jwt_decorators import token_required

llm_bp = Blueprint('llm_v2', __name__, url_prefix='/llm')
logger = logging.getLogger('yyc3_llm')

# Ollama 服务地址 (根据 NAS 配置)
OLLAMA_BASE_URL = "http://192.168.3.45:11434"

# 模拟模型数据（用于演示）
MOCK_MODELS = [
    {
        'name': 'qwen:7b',
        'size': '4.7GB',
        'modified_at': '2025-01-20T10:30:00Z'
    },
    {
        'name': 'qwen:14b',
        'size': '9.2GB',
        'modified_at': '2025-01-20T10:30:00Z'
    },
    {
        'name': 'llama3:8b',
        'size': '4.9GB',
        'modified_at': '2025-01-18T14:20:00Z'
    },
    {
        'name': 'llama3:70b',
        'size': '40.2GB',
        'modified_at': '2025-01-18T14:20:00Z'
    }
]

@llm_bp.route('/generate', methods=['POST'])
@token_required
def generate_chat():
    """发送请求到 Ollama 进行对话生成"""
    try:
        data = request.json
        model = data.get('model', 'qwen:7b') # 默认模型
        prompt = data.get('prompt')
        stream = data.get('stream', False)
        system_prompt = data.get('system', '你是一个有用的AI助手，可以帮助用户管理NAS系统。')

        if not prompt:
            return jsonify({"success": False, "error": "Prompt is required"}), 400

        ollama_payload = {
            "model": model,
            "prompt": prompt,
            "stream": stream,
            "system": system_prompt
        }

        # 发送请求到 Ollama
        resp = requests.post(f"{OLLAMA_BASE_URL}/api/generate", json=ollama_payload, stream=stream, timeout=300)

        if resp.status_code == 200:
            if stream:
                def generate():
                    for line in resp.iter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                if 'response' in data:
                                    yield json.dumps({"response": data['response']}) + '\n'
                                if 'done' in data and data['done']:
                                    yield json.dumps({"done": True}) + '\n'
                            except json.JSONDecodeError:
                                continue
                return Response(stream_with_context(generate()), mimetype='application/x-ndjson')
            else:
                return jsonify(resp.json())
        else:
            return jsonify({"success": False, "error": "LLM service error"}), resp.status_code

    except requests.exceptions.ConnectionError:
        logger.error("Cannot connect to Ollama service at 192.168.3.45:11434")
        return jsonify({"success": False, "error": "LLM service unavailable"}), 503
    except Exception as e:
        logger.error(f"LLM error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@llm_bp.route('/tags', methods=['GET'])
@token_required
def list_models():
    """获取 Ollama 中已安装的模型列表"""
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=30)
        if resp.status_code == 200:
            return jsonify(resp.json())
        # 如果 Ollama 服务不可用，返回模拟数据
        return jsonify({"models": MOCK_MODELS})
    except requests.exceptions.ConnectionError:
        logger.warning("Cannot connect to Ollama service, returning mock data")
        return jsonify({"models": MOCK_MODELS})
    except Exception as e:
        logger.error(f"Failed to fetch models: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@llm_bp.route('/models/<model_name>', methods=['DELETE'])
@token_required
def delete_model(model_name):
    """删除指定的模型"""
    try:
        resp = requests.delete(f"{OLLAMA_BASE_URL}/api/delete", json={"name": model_name})
        if resp.status_code == 200:
            return jsonify({"success": True, "message": f"Model {model_name} deleted successfully"})
        return jsonify({"success": False, "error": "Failed to delete model"}), resp.status_code
    except Exception as e:
        logger.error(f"Failed to delete model: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@llm_bp.route('/pull', methods=['POST'])
@token_required
def pull_model():
    """拉取新模型"""
    try:
        data = request.json
        model_name = data.get('name')
        
        if not model_name:
            return jsonify({"success": False, "error": "Model name is required"}), 400
        
        def generate():
            resp = requests.post(f"{OLLAMA_BASE_URL}/api/pull", json={"name": model_name}, stream=True)
            for line in resp.iter_lines():
                if line:
                    try:
                        data = json.loads(line)
                        if 'status' in data:
                            yield json.dumps({"status": data['status']}) + '\n'
                        if 'digest' in data:
                            yield json.dumps({"digest": data['digest']}) + '\n'
                        if 'total' in data:
                            yield json.dumps({"total": data['total']}) + '\n'
                        if 'completed' in data:
                            yield json.dumps({"completed": data['completed']}) + '\n'
                    except json.JSONDecodeError:
                        continue
        
        return Response(stream_with_context(generate()), mimetype='application/x-ndjson')
    except Exception as e:
        logger.error(f"Failed to pull model: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@llm_bp.route('/chat', methods=['POST'])
@token_required
def chat_completion():
    """聊天补全接口（支持多轮对话）"""
    try:
        data = request.json
        model = data.get('model', 'qwen:7b')
        messages = data.get('messages', [])
        stream = data.get('stream', False)
        
        if not messages:
            return jsonify({"success": False, "error": "Messages are required"}), 400
        
        ollama_payload = {
            "model": model,
            "messages": messages,
            "stream": stream
        }
        
        resp = requests.post(f"{OLLAMA_BASE_URL}/api/chat", json=ollama_payload, stream=stream, timeout=300)
        
        if resp.status_code == 200:
            if stream:
                def generate():
                    for line in resp.iter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                if 'message' in data and 'content' in data['message']:
                                    yield json.dumps({"content": data['message']['content']}) + '\n'
                                if 'done' in data and data['done']:
                                    yield json.dumps({"done": True}) + '\n'
                            except json.JSONDecodeError:
                                continue
                return Response(stream_with_context(generate()), mimetype='application/x-ndjson')
            else:
                return jsonify(resp.json())
        else:
            return jsonify({"success": False, "error": "LLM service error"}), resp.status_code
    except Exception as e:
        logger.error(f"Chat completion error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
