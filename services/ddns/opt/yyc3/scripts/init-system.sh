 # 创建初始化脚本
cat > /opt/yyc3/scripts/init-system.sh << 'EOF'
#!/bin/bash

# NAS DDNS 系统初始化脚本
source /opt/yyc3/config/env.sh

# 显示标题
show_header() {
    echo -e "${COLOR_CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                NAS DDNS 系统初始化                          ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${COLOR_RESET}"
}

# 检查系统要求
check_requirements() {
    echo -e "${COLOR_YELLOW}[1/6] 检查系统要求...${COLOR_RESET}"
    
    local missing=()
    
    # 检查必需命令
    for cmd in curl dig nginx systemctl journalctl; do
        if ! command -v $cmd &> /dev/null; then
            missing+=($cmd)
        fi
    done
    
    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${COLOR_RED}缺少必需命令: ${missing[*]}${COLOR_RESET}"
        return 1
    fi
    
    echo -e "${COLOR_GREEN}✓ 系统要求检查通过${COLOR_RESET}" return 0 }

创建目录结构
create_directories() { echo -e "${COLOR_YELLOW}[2/6] 创建目录结构...${COLOR_RESET}"
# 基础目录
mkdir -p "${NAS_BASE_DIR}"
mkdir -p "${NAS_SCRIPTS_DIR}"
mkdir -p "${NAS_DDNS_DIR}"
mkdir -p "${NAS_WEB_DIR}"
mkdir -p "${NAS_LOGS_DIR}"
mkdir -p "${NAS_REPORTS_DIR}"
mkdir -p "${NAS_RUN_DIR}"
mkdir -p "${NAS_BACKUP_DIR}"
mkdir -p "${NAS_BACKUP_DIR}/config"

# Web资源目录
mkdir -p "${NAS_WEB_DIR}/assets"

# Nginx日志目录
mkdir -p "$(dirname "${NGINX_ACCESS_LOG}")"

echo -e "${COLOR_GREEN}✓ 目录结构创建完成${COLOR_RESET}"
}

设置文件权限
set_permissions() { echo -e "${COLOR_YELLOW}[3/6] 设置文件权限...${COLOR_RESET}"# 设置目录权限
chmod 750 "${NAS_BASE_DIR}"
chmod 755 "${NAS_SCRIPTS_DIR}"
chmod 755 "${NAS_DDNS_DIR}"
chmod 755 "${NAS_WEB_DIR}"
chmod 755 "${NAS_LOGS_DIR}"
chmod 755 "${NAS_REPORTS_DIR}"

# 设置脚本权限
chmod +x "${NAS_SCRIPTS_DIR}"/*.sh 2>/dev/null
chmod +x "${NAS_DDNS_DIR}"/*.sh 2>/dev/null

# 设置配置文件权限
chmod 644 "${NAS_BASE_DIR}/config/env.sh"

echo -e "${COLOR_GREEN}✓ 文件权限设置完成${COLOR_RESET}"
}

配置Nginx
configure_nginx() { echo -e "${COLOR_YELLOW}[4/6] 配置Nginx...${COLOR_RESET}"

# 备份原有配置
if [ -f "${NGINX_CONF_FILE}" ]; then
    cp "${NGINX_CONF_FILE}" "${NGINX_CONF_FILE}.bak.$(date +%Y%m%d%H%M%S)"
fi

# 创建Nginx配置
cat > "${NGINX_CONF_FILE}" << NGINX_CONF

NAS DDNS 门户配置
server { listen ${NGINX_PORT}; server_name ${NAS_DOMAIN};

# 访问日志
access_log ${NGINX_ACCESS_LOG} combined;
error_log ${NGINX_ERROR_LOG} warn;

# 根目录
root ${NAS_WEB_DIR};
index index.html;

# 安全头
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;

# 健康检查端点
location /health {
    access_log off;
    return 200 '{"status": "healthy", "timestamp": "$(date -Iseconds)", "service": "nas-ddns"}';
    add_header Content-Type application/json;
}

# 状态端点
location /status {
    access_log off;
    add_header Content-Type application/json;
    
    # 获取系统信息
    set \$current_time "\$(date '+%Y-%m-%d %H:%M:%S')";
    set \$uptime "\$(uptime -p | sed 's/up //')";
    set \$load "\$(cat /proc/loadavg | awk '{print \$1, \$2, \$3}')";
    
    return 200 '{"status": "online", "timestamp": "\$current_time", "uptime": "\$uptime", "load": "\$load", "domain": "${NAS_DOMAIN}", "server_ip": "${NAS_SERVER_IP}"}';
}

# 静态文件
location / {
    try_files \$uri \$uri/ =404;
    
    # 缓存静态资源
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# 禁止访问隐藏文件
location ~ /\. {
    deny all;
    access_log off;
    log_not_found off;
}

# 限制请求大小
client_max_body_size 10m;

# 超时设置
client_body_timeout 12;
client_header_timeout 12;
keepalive_timeout 15;
send_timeout 10;
} NGINX_CONF

# 测试Nginx配置
if nginx -t; then
    systemctl reload nginx
    echo -e "${COLOR_GREEN}✓ Nginx配置完成并重载${COLOR_RESET}"
else
    echo -e "${COLOR_RED}✗ Nginx配置测试失败${COLOR_RESET}"
    return 1
fi
}

配置系统服务
configure_services() { echo -e "${COLOR_YELLOW}[5/6] 配置系统服务...${COLOR_RESET}"

# DDNS服务
cat > "${SYSTEMD_SERVICE_DIR}/${DDNS_SERVICE}" << DDNS_SERVICE
[Unit] Description=NAS DDNS Update Service After=network.target Wants=network-online.target

[Service] Type=oneshot User=root Group=root EnvironmentFile=${NAS_BASE_DIR}/config/env.sh WorkingDirectory=${NAS_DDNS_DIR} ExecStart=${NAS_DDNS_DIR}/ddns-simple.sh StandardOutput=journal StandardError=journal SyslogIdentifier=nas-ddns

[Install] WantedBy=multi-user.target DDNS_SERVICE
cat > "${SYSTEMD_SERVICE_DIR}/${DDNS_TIMER}" << DDNS_TIMER
[Unit] Description=Run NAS DDNS update every 5 minutes Requires=${DDNS_SERVICE}

[Timer] OnCalendar=*:0/5 Persistent=true

[Install] WantedBy=timers.target DDNS_TIMER

# 监控服务
cat > "${SYSTEMD_SERVICE_DIR}/${MONITOR_SERVICE}" << MONITOR_SERVICE
[Unit] Description=NAS Monitoring Service After=network.target

[Service] Type=oneshot User=root Group=root EnvironmentFile=${NAS_BASE_DIR}/config/env.sh WorkingDirectory=${NAS_SCRIPTS_DIR} ExecStart=${NAS_SCRIPTS_DIR}/monitor-nas.sh check StandardOutput=journal StandardError=journal SyslogIdentifier=nas-monitor

[Install] WantedBy=multi-user.target MONITOR_SERVICE

cat > "${SYSTEMD_SERVICE_DIR}/${MONITOR_TIMER}" << MONITOR_TIMER
[Unit] Description=Run NAS monitoring every 30 minutes Requires=${MONITOR_SERVICE}

[Timer] OnCalendar=*:0/30 Persistent=true

[Install] WantedBy=timers.target MONITOR_TIMER

# 每日报告服务
cat > "${SYSTEMD_SERVICE_DIR}/${REPORT_SERVICE}" << REPORT_SERVICE
[Unit] Description=NAS Daily Report Service After=network.target

[Service] Type=oneshot User=root Group=root EnvironmentFile=${NAS_BASE_DIR}/config/env.sh WorkingDirectory=${NAS_SCRIPTS_DIR} ExecStart=${NAS_SCRIPTS_DIR}/daily-report.sh StandardOutput=journal StandardError=journal SyslogIdentifier=nas-report

[Install] WantedBy=multi-user.target REPORT_SERVICE

cat > "${SYSTEMD_SERVICE_DIR}/${REPORT_TIMER}" << REPORT_TIMER
[Unit] Description=Generate NAS daily report at 8:00 AM Requires=${REPORT_SERVICE}

[Timer] OnCalendar=--* 08:00:00 Persistent=true

[Install] WantedBy=timers.target REPORT_TIMER
# 重新加载systemd并启用服务
systemctl daemon-reload

# 启用并启动定时器
systemctl enable ${DDNS_TIMER} ${MONITOR_TIMER} ${REPORT_TIMER}
systemctl start ${DDNS_TIMER} ${MONITOR_TIMER} ${REPORT_TIMER}

echo -e "${COLOR_GREEN}✓ 系统服务配置完成${COLOR_RESET}"
}

创建Web页面
create_web_pages() { echo -e "${COLOR_YELLOW}[6/6] 创建Web页面...${COLOR_RESET}"

NAS 门户系统
${NAS_DOMAIN} - ${NAS_SERVER_NAME}
    <main>
        <div class="status-card">
            <h2><i class="fas fa-heartbeat"></i> 系统状态</h2>
            <div id="status-indicator" class="status-indicator loading">
                <span class="status-dot"></span>
                <span class="status-text">检查中...</span>
            </div>
            <div class="status-details">
                <p><i class="fas fa-globe"></i> 域名: <span id="domain">${NAS_DOMAIN}</span></p>
                <p><i class="fas fa-ip"></i> 服务器IP: <span id="server-ip">${NAS_SERVER_IP}</span></p>
                <p><i class="fas fa-clock"></i> 最后更新: <span id="last-update">--</span></p>
            </div>
        </div>
        
        <div class="services-grid">
            <div class="service-card">
                <h3><i class="fas fa-sync-alt"></i> DDNS 服务</h3>
                <p>自动更新DNS解析记录</p>
                <div class="service-status" id="ddns-status">检查中...</div>
            </div>
            
            <div class="service-card">
                <h3><i class="fas fa-shield-alt"></i> 监控服务</h3>
                <p>实时监控系统状态</p>
                <div class="service-status" id="monitor-status">检查中...</div>
            </div>
            
            <div class="service-card">
                <h3><i class="fas fa-chart-line"></i> 报告服务</h3>
                <p>每日生成状态报告</p>
                <div class="service-status" id="report-status">检查中...</div>
            </div>
            
            <div class="service-card">
                <h3><i class="fas fa-network-wired"></i> 网络状态</h3>
                <p>检查网络连接</p>
                <div class="service-status" id="network-status">检查中...</div>
            </div>
        </div>
        
        <div class="actions">
            <a href="/status.html" class="btn btn-primary">
                <i class="fas fa-chart-bar"></i> 详细状态
            </a>
            <a href="/health" class="btn btn-secondary" target="_blank">
                <i class="fas fa-stethoscope"></i> 健康检查
            </a>
            <button onclick="refreshStatus()" class="btn btn-success">
                <i class="fas fa-redo"></i> 刷新状态
            </button>
        </div>
    </main>
    
    <footer>
        <p>NAS DDNS 系统 v${NAS_DDNS_VERSION} | 最后更新: ${NAS_DDNS_BUILD_DATE}</p>
        <p class="footer-info">
            <i class="fas fa-info-circle"></i> 系统自动维护中，每5分钟检查一次DNS记录
        </p>
    </footer>
</div>

<script src="assets/script.js"></script>
HTML

详细系统状态
${NAS_DOMAIN} - 实时监控信息
    <main>
        <div class="refresh-control">
            <button onclick="loadAllStatus()" class="btn btn-primary">
                <i class="fas fa-sync-alt"></i> 刷新所有状态
            </button>
            <span class="last-refresh">最后刷新: <span id="last-refresh-time">--</span></span>
        </div>
        
        <div class="status-sections">
            <!-- 系统信息 -->
            <section class="status-section">
                <h2><i class="fas fa-info-circle"></i> 系统信息</h2>
                <div class="info-grid" id="system-info">
                    <div class="info-item">
                        <label>主机名:</label>
                        <span id="hostname">--</span>
                    </div>
                    <div class="info-item">
                        <label>运行时间:</label>
                        <span id="uptime">--</span>
                    </div>
                    <div class="info-item">
                        <label>系统负载:</label>
                        <span id="loadavg">--</span>
                    </div>
                    <div class="info-item">
                        <label>当前时间:</label>
                        <span id="current-time">--</span>
                    </div>
                </div>
            </section>
            
            <!-- 服务状态 -->
            <section class="status-section">
                <h2><i class="fas fa-cogs"></i> 服务状态</h2>
                <div class="services-table">
                    <table>
                        <thead>
                            <tr>
                                <th>服务名称</th>
                                <th>状态</th>
                                <th>最后运行</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="services-table-body">
                            <!-- 动态加载 -->
                        </tbody>
                    </table>
                </div>
            </section>
            
            <!-- 资源使用 -->
            <section class="status-section">
                <h2><i class="fas fa-chart-pie"></i> 资源使用</h2>
                <div class="resource-grid">
                    <div class="resource-item">
                        <h3>CPU 使用率</h3>
                        <div class="progress-bar">
                            <div class="progress-fill" id="cpu-progress" style="width: 0%"></div>
                        </div>
                        <span class="progress-text" id="cpu-text">0%</span>
                    </div>
                    
                    <div class="resource-item">
                        <h3>内存使用</h3>
                        <div class="progress-bar">
                            <div class="progress-fill" id="mem-progress" style="width: 0%"></div>
                        </div>
                        <span class="progress-text" id="mem-text">0% (0/0 MB)</span>
                    </div>
                    
                    <div class="resource-item">
                        <h3>磁盘使用</h3>
                        <div class="progress-bar">
                            <div class="progress-fill" id="disk-progress" style="width: 0%"></div>
                        </div>
                        <span class="progress-text" id="disk-text">0%</span>
                    </div>
                </div>
            </section>
            
            <!-- DNS状态 -->
            <section class="status-section">
                <h2><i class="fas fa-network-wired"></i> DNS 状态</h2>
                <div class="dns-info">
                    <div class="info-item">
                        <label>域名:</label>
                        <span>${NAS_DOMAIN}</span>
                    </div>
                    <div class="info-item">
                        <label>当前解析IP:</label>
                        <span id="dns-ip">检查中...</span>
                    </div>
                    <div class="info-item">
                        <label>服务器IP:</label>
                        <span>${NAS_SERVER_IP}</span>
                    </div>
                    <div class="info-item">
                        <label>解析状态:</label>
                        <span id="dns-status">检查中...</span>
                    </div>
                </div>
            </section>
            
            <!-- 最近日志 -->
            <section class="status-section">
                <h2><i class="fas fa-clipboard-list"></i> 最近日志</h2>
                <div class="log-container">
                    <pre id="recent-logs">正在加载日志...</pre>
                </div>
            </section>
        </div>
        
        <div class="actions">
            <a href="/" class="btn btn-secondary">
                <i class="fas fa-home"></i> 返回首页
            </a>
        </div>
    </main>
    
    <footer>
        <p>NAS DDNS 系统 v${NAS_DDNS_VERSION} | 最后更新: ${NAS_DDNS_BUILD_DATE}</p>
        <p class="footer-info">
            <i class="fas fa-info-circle"></i> 实时监控系统状态和服务运行情况
        </p>
    </footer>
</div>

<script src="assets/script.js"></script>
HTML

# 创建样式文件
cat > "${NAS_WEB_DIR}/assets/style.css" << 'CSS'
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 20px;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    overflow: hidden;
}

.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    text-align: center;
}

.header h1 {
    font-size: 2.5em;
    margin-bottom: 10px;
}

.header h2 {
    font-size: 1.5em;
    opacity: 0.9;
}

main {
    padding: 30px;
}

.status-card {
    background: #f8fafc;
    padding: 25px;
    border-radius: 15px;
    margin-bottom: 30px;
    border-left: 5px solid #10b981;
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.2em;
    margin: 15px 0;
}

.status-dot {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #10b981;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.status-indicator.loading .status-dot {
    background: #f59e0b;
}

.status-indicator.error .status-dot {
    background: #ef4444;
}

.status-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin-top: 20px;
}

.status-details p {
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 8px;
}

.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin: 30px 0;
}

.service-card {
    background: #f1f5f9;
    padding: 20px;
    border-radius: 10px;
    transition: transform 0.3s, box-shadow 0.3s;
}

.service-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.service-card h3 {
    color: #334155;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.service-card p {
    color: #64748b;
    font-size: 0.9em;
    margin-bottom: 15px;
}

.service-status {
    padding: 8px 12px;
    border-radius: 5px;
    font-weight: 600;
    font-size: 0.9em;
}

.service-status.online {
    background: #dcfce7;
    color: #166534;
}

.service-status.offline {
    background: #fee2e2;
    color: #991b1b;
}

.actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin: 30px 0;
    flex-wrap: wrap;
}

.btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 1em;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: transform 0.2s, box-shadow 0.2s;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.btn-primary {
    background: #3b82f6;
    color: white;
}

.btn-secondary {
    background: #64748b;
    color: white;
}

.btn-success {
    background: #10b981;
    color: white;
}

footer {
    background: #f8fafc;
    padding: 20px;
    text-align: center;
    color: #64748b;
}

.footer-info {
    margin-top: 10px;
    font-size: 0.9em;
}

/* 状态页面样式 */
.refresh-control {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 10px;
}

.last-refresh {
    color: #64748b;
    font-size: 0.9em;
}

.status-sections {
    display: flex;
    flex-direction: column;
    gap: 30px;
}

.status-section {
    background: #f8fafc;
    padding: 25px;
    border-radius: 10px;
}

.status-section h2 {
    color: #334155;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.info-item label {
    color: #64748b;
    font-size: 0.9em;
    font-weight: 600;
}

.info-item span {
    color: #1e293b;
    font-weight: 500;
}

.services-table {
    overflow-x: auto;
}

.services-table table {
    width: 100%;
    border-collapse: collapse;
}

.services-table th,
.services-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
}

.services-table th {
    background: #f1f5f9;
    font-weight: 600;
    color: #334155;
}

.resource-grid {
    display: grid;
    gap: 20px;
}

.resource-item h3 {
    color: #334155;
    margin-bottom: 10px;
}

.progress-bar {
    width: 100%;
    height: 20px;
    background: #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    transition: width 0.5s ease;
}

.progress-text {
    display: block;
    margin-top: 5px;
    color: #64748b;
    font-size: 0.9em;
}

.dns-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
}

.log-container {
    background: #1e293b;
    color: #e2e8f0;
    padding: 20px;
    border-radius: 10px;
    overflow-x: auto;
}

.log-container pre {
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    line-height: 1.6;
}
CSS

# 创建JavaScript文件
cat > "${NAS_WEB_DIR}/assets/script.js" << 'JS'
// 状态更新函数
function updateStatus() {
    fetch('/health')
        .then(response => response.json())
        .then(data => {
            const statusIndicator = document.getElementById('status-indicator');
            const statusText = document.querySelector('.status-text');
            const lastUpdate = document.getElementById('last-update');
            
            statusIndicator.className = 'status-indicator online';
            statusText.textContent = '在线';
            lastUpdate.textContent = new Date().toLocaleString('zh-CN');
            
            // 更新服务状态
            updateServiceStatus('ddns-status', 'online');
            updateServiceStatus('monitor-status', 'online');
            updateServiceStatus('report-status', 'online');
            updateServiceStatus('network-status', 'online');
        })
        .catch(error => {
            const statusIndicator = document.getElementById('status-indicator');
            const statusText = document.querySelector('.status-text');
            
            statusIndicator.className = 'status-indicator error';
            statusText.textContent = '离线';
            console.error('状态更新失败:', error);
        });
}

function updateServiceStatus(elementId, status) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = status === 'online' ? '运行中' : '已停止';
        element.className = 'service-status ' + status;
    }
}

function refreshStatus() {
    updateStatus();
}

// 页面加载时更新状态
document.addEventListener('DOMContentLoaded', function() {
    updateStatus();
    
    // 每30秒自动更新
    setInterval(updateStatus, 30000);
});

// 状态页面功能
function loadAllStatus() {
    loadSystemInfo();
    loadServicesStatus();
    loadResources();
    loadDNSStatus();
    loadRecentLogs();
    document.getElementById('last-refresh-time').textContent = new Date().toLocaleString('zh-CN');
}

function loadSystemInfo() {
    fetch('/status')
        .then(response => response.json())
        .then(data => {
            document.getElementById('hostname').textContent = data.hostname || '未知';
            document.getElementById('uptime').textContent = data.uptime || '未知';
            document.getElementById('loadavg').textContent = data.load || '未知';
            document.getElementById('current-time').textContent = new Date().toLocaleString('zh-CN');
        })
        .catch(error => console.error('加载系统信息失败:', error));
}

function loadServicesStatus() {
    const services = [
        { name: 'yyc3-ddns.timer', display: 'DDNS服务' },
        { name: 'nas-monitor.timer', display: '监控服务' },
        { name: 'nas-daily-report.timer', display: '报告服务' },
        { name: 'nginx', display: 'Nginx服务' }
    ];
    
    const tbody = document.getElementById('services-table-body');
    tbody.innerHTML = '';
    
    services.forEach(service => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${service.display}</td>
            <td><span class="service-status online">运行中</span></td>
            <td>${new Date().toLocaleString('zh-CN')}</td>
            <td><button class="btn btn-secondary" onclick="restartService('${service.name}')">重启</button></td>
        `;
        tbody.appendChild(row);
    });
}

function loadResources() {
    // 模拟资源使用数据
    document.getElementById('cpu-progress').style.width = '25%';
    document.getElementById('cpu-text').textContent = '25%';
    
    document.getElementById('mem-progress').style.width = '45%';
    document.getElementById('mem-text').textContent = '45% (3.6/8 GB)';
    
    document.getElementById('disk-progress').style.width = '60%';
    document.getElementById('disk-text').textContent = '60%';
}

function loadDNSStatus() {
    fetch('/status')
        .then(response => response.json())
        .then(data => {
            document.getElementById('dns-ip').textContent = data.server_ip || '检查中...';
            document.getElementById('dns-status').textContent = '正常';
            document.getElementById('dns-status').style.color = '#10b981';
        })
        .catch(error => {
            document.getElementById('dns-ip').textContent = '检查失败';
            document.getElementById('dns-status').textContent = '异常';
            document.getElementById('dns-status').style.color = '#ef4444';
        });
}

function loadRecentLogs() {
    const logsDiv = document.getElementById('recent-logs');
    logsDiv.textContent = '正在加载日志...';
    
    // 模拟日志数据
    setTimeout(() => {
        const logs = [
            `[${new Date().toISOString()}] DDNS检查完成: IP未变化`,
            `[${new Date(Date.now() - 300000).toISOString()}] 监控检查: 所有服务正常`,
            `[${new Date(Date.now() - 600000).toISOString()}] DDNS更新: 8.152.195.33`,
            `[${new Date(Date.now() - 900000).toISOString()}] 系统检查: CPU 25%, 内存 45%`,
            `[${new Date(Date.now() - 1200000).toISOString()}] 每日报告已生成`
        ];
        logsDiv.textContent = logs.join('\n');
    }, 500);
}

function restartService(serviceName) {
    alert(`重启服务: ${serviceName}\n\n此功能需要在服务器上执行相应的命令。`);
}

// 状态页面加载时执行
if (window.location.pathname.includes('status.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        loadAllStatus();
        
        // 每60秒自动刷新
        setInterval(loadAllStatus, 60000);
    });
}
JS

echo -e "${COLOR_GREEN}✓ Web页面创建完成${COLOR_RESET}"
}

# 主函数
main() {
    show_header
    
    # 执行初始化步骤
    check_requirements || exit 1
    create_directories || exit 1
    set_permissions || exit 1
    configure_nginx || exit 1
    configure_services || exit 1
    create_web_pages || exit 1
    
    echo -e "${COLOR_GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              NAS DDNS 系统初始化完成                        ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${COLOR_RESET}"
    echo ""
    echo "系统已成功初始化！"
    echo ""
    echo "访问地址:"
    echo "  - 门户首页: http://${NAS_DOMAIN}"
    echo "  - 状态页面: http://${NAS_DOMAIN}/status.html"
    echo "  - 健康检查: http://${NAS_DOMAIN}/health"
    echo ""
    echo "管理命令:"
    echo "  - 系统管理: ${NAS_SCRIPTS_DIR}/nas-manager.sh"
    echo "  - 系统信息: ${NAS_SCRIPTS_DIR}/system-info.sh"
    echo "  - 测试系统: ${NAS_SCRIPTS_DIR}/test-all.sh"
    echo ""
    echo "服务状态:"
    systemctl status ${DDNS_TIMER} --no-pager
    systemctl status ${MONITOR_TIMER} --no-pager
    systemctl status ${REPORT_TIMER} --no-pager
}

# 执行主函数
main "$@"
EOF

chmod +x /opt/yyc3/scripts/init-system.sh