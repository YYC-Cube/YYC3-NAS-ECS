bind = "127.0.0.1:8080"
workers = 2
worker_class = "sync"
timeout = 30
keepalive = 2
errorlog = "/opt/nas-ecs/logs/gunicorn_error.log"
accesslog = "/opt/nas-ecs/logs/gunicorn_access.log"
loglevel = "info"
