from prometheus_client import Counter, Histogram

llm_calls = Counter("matchr_llm_calls_total", "Number of LLM API calls")
cache_hits = Counter("matchr_cache_hits_total", "Number of cache hits", ["kind"])
rank_latency = Histogram("matchr_rank_seconds", "Seconds to rank")