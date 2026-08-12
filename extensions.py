from flask_socketio import SocketIO
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

socketio = SocketIO(cors_allowed_origins="*", async_mode='eventlet',
                   ping_timeout=60, ping_interval=25,
                   logger=False, engineio_logger=False)
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

