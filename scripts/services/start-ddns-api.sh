#!/bin/bash
# DDNS API启动脚本 - 初始化和启动API服务

# 确保日志目录存在
mkdir -p /opt/yyc3/logs

# 进入API目录
cd /opt/yyc3/api/ddns

# 检查Python版本
PYTHON_VERSION=$(python3 --version 2>&1 | grep -oP '(?<=Python )\d+\.\d+')
if (( $(echo "$PYTHON_VERSION < 3.9" | bc -l) )); then
    echo "警告: Python版本低于3.9，可能存在兼容性问题"
fi

# 激活虚拟环境
if [ -d "venv" ]; then
    echo "激活虚拟环境..."
    source venv/bin/activate
else
    echo "创建新的虚拟环境..."
    python3 -m venv venv
    source venv/bin/activate
fi

# 安装或更新依赖
echo "安装/更新Python依赖..."
pip install --upgrade pip
pip install -r requirements.txt

# 检查环境变量
if [ ! -f ".env" ]; then
    echo "复制环境变量示例文件..."
    cp .env.example .env
fi

# 检查配置文件
if [ ! -f "config.py" ]; then
    echo "警告: 配置文件 config.py 不存在"
fi

# 检查Gunicorn配置
if [ ! -f "gunicorn_config.py" ]; then
    echo "创建Gunicorn配置文件..."
    cat > gunicorn_config.py << 'EOF'
bind = '0.0.0.0:5000'
workers = 4
worker_class = 'gevent'
timeout = 120
accesslog = '/opt/yyc3/logs/gunicorn_access.log'
errorlog = '/opt/yyc3/logs/gunicorn_error.log'
loglevel = 'info'
EOF
fi

# 启动服务
echo "启动DDNS API服务..."
gunicorn --config gunicorn_config.py app:app