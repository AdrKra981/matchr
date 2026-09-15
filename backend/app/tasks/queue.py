from redis import Redis
from rq import Queue

redis_conn = Redis(
    host="redis",
    port=6379,
)

task_queue = Queue("matchr", connection=redis_conn)