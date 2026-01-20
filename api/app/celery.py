from celery import Celery

def make_celery(app):
    """创建 Celery 实例并与 Flask 应用绑定"""
    celery = Celery(
        app.import_name,
        backend=app.config['CELERY_RESULT_BACKEND'],
        broker=app.config['CELERY_BROKER_URL']
    )

    # 从 Flask 配置更新 Celery 配置
    celery.conf.update(
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        timezone='Asia/Shanghai',
        enable_utc=True,
        task_track_started=True,
        task_time_limit=30 * 60,  # 硬限制 30 分钟
        task_soft_time_limit=25 * 60,  # 软限制 25 分钟
        worker_prefetch_multiplier=4,  # 预取 4 倍任务
    )

    class ContextTask(celery.Task):
        """使任务在 Flask 上下文中运行"""
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery


# 注册任务
def init_celery(app):
    """初始化 Celery 并注册任务"""
    from .tasks import register_tasks
    celery = make_celery(app)
    register_tasks(celery)
    return celery
