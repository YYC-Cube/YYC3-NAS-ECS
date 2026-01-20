import requests
  import logging
  from flask import Blueprint, request, jsonify, stream_with_context, Response
  from app.auth.jwt_decorators import token_required

  llm_bp = Blueprint('llm_v2', __name__, url_prefix='/llm')
  logger = logging.getLogger('yyc3_llm')

  # Ollama 服务地址 (根据 NAS 配置)
  OLLAMA_BASE_URL = "http://192.168.3.45:11434"

  @llm_bp.route('/generate', methods=['POST'])
  @token_required
  def generate_chat():
      """发送请求到 Ollama 进行对话生成"""
      try:
          data = request.json
          model = data.get('model', 'qwen:7b') # 默认模型
          prompt = data.get('prompt')
          stream = data.get('stream', False)

          if not prompt:
              return jsonify({"success": False, "error": "Prompt is required"}), 400

          ollama_payload = {
              "model": model,
              "prompt": prompt,
              "stream": stream
          }

          # 发送请求到 Ollama
          resp = requests.post(f"{OLLAMA_BASE_URL}/api/generate", json=ollama_payload, stream=stream)

          if resp.status_code == 200:
              if stream:
                  def generate():
                      for chunk in resp.iter_content(chunk_size=1024):
                          if chunk:
                              yield chunk
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
          resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags")
          if resp.status_code == 200:
              return jsonify(resp.json())
          return jsonify({"models": []})
      except Exception as e:
          logger.error(f"Failed to fetch models: {e}")
          return jsonify({"success": False, "error": str(e)}), 500
