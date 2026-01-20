from flask import Blueprint, request, jsonify
from datetime import datetime

domains_bp = Blueprint('domains_v2', __name__, url_prefix='/domains')


def check_domain_resolution(domain):
    """检查域名解析"""
    try:
        import socket
        ip_address = socket.gethostbyname(domain)
        return {"resolved": True, "ip": ip_address}
    except Exception as e:
        return {"resolved": False, "error": str(e)}


def check_ssl_certificate(domain):
    """获取SSL证书状态"""
    try:
        import ssl
        import socket
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                return {
                    "valid": True,
                    "issuer": cert.get('issuer'),
                    "subject": cert.get('subject'),
                    "not_after": cert.get('notAfter'),
                    "not_before": cert.get('notBefore')
                }
    except Exception as e:
        return {"valid": False, "error": str(e)}


def get_whois_info(domain):
    """获取WHOIS信息"""
    # 简化实现，实际需要使用 whois 库
    return {" registrar": "Unknown", "status": "Unknown"}


def get_dns_records_for_domain(domain):
    """获取域名的DNS记录"""
    # 简化实现，实际需要调用 DNS API
    return []


def calculate_domain_health_score(resolution, ssl, records):
    """计算域名健康分数"""
    score = 100
    if not resolution.get("resolved"):
        score -= 50
    if not ssl.get("valid"):
        score -= 30
    return max(0, score)


@domains_bp.route('', methods=['GET'])
def list_domains():
    """列出所有管理的域名"""
    try:
        # domains = get_managed_domains()
        domains = [
            {"name": "0379.email", "registrar": "Aliyun", "expiry": "2025-12-31", "is_active": True},
            {"name": "ddns.0379.email", "registrar": "Aliyun", "expiry": "2025-12-31", "is_active": True}
        ]

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "domains": domains,
                "count": len(domains)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@domains_bp.route('/<string:domain>/status', methods=['GET'])
def get_domain_status(domain):
    """获取域名状态"""
    try:
        # 检查域名解析
        resolution_status = check_domain_resolution(domain)

        # 获取SSL证书状态
        ssl_status = check_ssl_certificate(domain)

        # 获取WHOIS信息
        whois_info = get_whois_info(domain)

        # 检查DNS记录
        dns_records = get_dns_records_for_domain(domain)

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "domain": domain,
                "resolution": resolution_status,
                "ssl": ssl_status,
                "whois": whois_info,
                "dns_records": {
                    "count": len(dns_records),
                    "records": dns_records[:10]  # 只返回前10条
                },
                "health_score": calculate_domain_health_score(
                    resolution_status, ssl_status, dns_records
                )
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@domains_bp.route('/<string:domain>/dnssec', methods=['GET'])
def get_dnssec_status(domain):
    """获取DNSSEC状态"""
    try:
        # dnssec_status = check_dnssec_status(domain)
        dnssec_status = {
            "enabled": False,
            "status": "not configured",
            "algorithm": None,
            "digest": None,
            "public_key": None,
            "flags": None
        }

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "domain": domain,
                "dnssec_enabled": dnssec_status.get("enabled", False),
                "status": dnssec_status.get("status"),
                "algorithm": dnssec_status.get("algorithm"),
                "digest": dnssec_status.get("digest"),
                "public_key": dnssec_status.get("public_key"),
                "flags": dnssec_status.get("flags")
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@domains_bp.route('/<string:domain>/transfer', methods=['POST'])
def initiate_domain_transfer(domain):
    """初始化域名转移"""
    data = request.get_json()

    try:
        # 验证转移授权码
        auth_code = data.get("auth_code")
        if not auth_code:
            return jsonify({
                "success": False,
                "error": "Authorization code is required"
            }), 400

        # 启动域名转移流程
        # transfer_result = initiate_domain_transfer_to_aliyun(domain, auth_code)
        transfer_result = {"status": "initiated", "transfer_id": "transfer_123"}

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": transfer_result,
            "message": "Domain transfer initiated"
        }), 202
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
