"""遗留入口兼容层。

实际应用实现已迁移至 `app/` 包（含环境校验与生产安全守卫）。
生产部署统一使用 `wsgi:app`；本文件仅为历史 `python app.py` 用法保留。
"""

from app import create_app  # noqa: F401  统一入口，避免双份实现漂移

# 创建应用实例
app = create_app()

# 导出 WSGI 应用
application = app

if __name__ == '__main__':
    # 开发模式
    if app.config['ENVIRONMENT'] == 'development':
        app.run(host='0.0.0.0', port=8080, debug=True)
    else:
        # 生产模式（仅限临时调试；正规生产部署请使用 gunicorn + wsgi:app）
        app.logger.warning(
            "Running via app.py in production-like mode is discouraged; "
            "use `gunicorn wsgi:app` instead"
        )
        app.run()
