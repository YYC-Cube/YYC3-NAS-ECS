根据你的情况，你已经在阿里云ECS上通过Frp成功打通了多个子域名服务。现在需要将 `nas.0379.email` 改为 `ddns.0379.email`，以下是具体步骤：

## **步骤一：在阿里云DNS中修改记录**

1. **登录阿里云控制台**
   - 进入 [阿里云DNS控制台](https://dns.console.aliyun.com/)

2. **找到域名解析设置**
   - 选择你的域名 `0379.email`
   - 找到现有的 `nas` 记录（可能是A记录或CNAME记录）

3. **修改记录**
   - **方法A：直接修改现有记录**
     - 点击 `nas` 记录的"修改"
     - 将"主机记录"从 `nas` 改为 `ddns`
     - "记录值"保持为 `8.152.195.33`（你的ECS公网IP）
     - TTL建议设置为600秒（10分钟）

   - **方法B：添加新记录（推荐）**
     - 点击"添加记录"
     - 记录类型：A
     - 主机记录：`ddns`
     - 记录值：`8.152.195.33`
     - TTL：600秒
     - 这样 `nas.0379.email` 和 `ddns.0379.email` 可以同时存在

## **步骤二：更新Frp客户端配置**

在你的NAS本地服务器上，修改Frp客户端配置：

```ini
# frpc.ini 配置文件
[common]
server_addr = 8.152.195.33  # 你的ECS IP
server_port = 7000          # Frp服务端口

# 修改nas配置段或新增ddns配置段
[ddns-web]
type = https
local_port = 443           # 你的NAS HTTPS端口
custom_domains = ddns.0379.email

# 如果之前有nas配置，可以注释掉或删除
# [nas-web]
# type = https
# local_port = 443
# custom_domains = nas.0379.email
```

## **步骤三：重启Frp服务**

```bash
# 重启Frp客户端
sudo systemctl restart frpc

# 查看状态
sudo systemctl status frpc
```

## **步骤四：检查SSL证书**

由于你使用HTTPS，需要确保SSL证书包含新域名：

1. **如果使用Let's Encrypt**：
   ```bash
   # 更新证书（假设使用acme.sh）
   acme.sh --issue -d ddns.0379.email --webroot /your/webroot/path
   
   # 或重新申请包含所有域名的证书
   acme.sh --issue -d api.0379.email -d llm.0379.email -d mail.0379.email \
           -d admin.0379.email -d ddns.0379.email -d monitor.0379.email \
           --webroot /your/webroot/path
   ```

2. **配置Web服务器使用新证书**
   - 更新Nginx/Apache配置中的证书路径

## **步骤五：测试连接**

1. **等待DNS生效**（约10分钟）：
   ```bash
   # 检查DNS解析
   nslookup ddns.0379.email
   dig ddns.0379.email
   ```

2. **测试HTTPS访问**：
   ```bash
   # 测试连接
   curl -I https://ddns.0379.email/
   
   # 检查证书
   openssl s_client -connect ddns.0379.email:443 -servername ddns.0379.email
   ```

## **步骤六：更新相关服务配置**

检查并更新以下配置：
- **NAS系统设置**：如果NAS有外部访问设置，更新域名
- **书签/快捷方式**：更新浏览器书签
- **监控系统**：如Uptime Kuma、Prometheus等监控配置
- **API调用**：如果有其他服务调用nas域名，更新为ddns

## **注意事项**

1. **过渡期建议**：保持 `nas.0379.email` 和 `ddns.0379.email` 同时运行一段时间
2. **证书更新**：确保新域名的SSL证书有效
3. **防火墙规则**：确认ECS安全组允许443端口访问
4. **Frp日志**：查看Frp日志确认连接成功
   ```bash
   journalctl -u frpc -f
   ```

## **完整示例配置**

如果你选择同时保留两个域名，Frp配置可以这样写：

```ini
[ddns-web]
type = https
local_port = 443
custom_domains = ddns.0379.email,nas.0379.email
```

这样两个域名都会指向同一个本地服务。

完成以上步骤后，`https://ddns.0379.email/` 应该可以正常访问了。如果遇到问题，请检查Frp服务端和客户端的日志。
