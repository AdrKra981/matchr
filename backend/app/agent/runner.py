from functools import lru_cache
import json
import logging

from app.agent.tools import FETCH_JOBS_TOOL, RANK_JOBS_TOOL
from app.usecases.fetch_jobs import fetch_and_store_jobs
from app.usecases.rank_jobs import rank_jobs
from openai import OpenAI

@lru_cache(maxsize=1)
def get_client() -> OpenAI:
    return OpenAI()

logger = logging.getLogger(__name__)

MODEL = "gpt-4o-mini"

TOOLS = [
    FETCH_JOBS_TOOL,
    RANK_JOBS_TOOL,
]

TOOL_FUNCTIONS = {
    "fetch_jobs": lambda args, user_id: fetch_and_store_jobs(args["what"]),
    "rank_jobs": lambda args, user_id: rank_jobs(user_id, args.get("top_k", 10)),
}


def run_agent(user_message: str, user_id: int, max_steps: int = 6) -> str:
    messages = [
        {"role": "system", "content": "You are a career assistant. You have tools to "
         "fetch offers, rank them against the user's CV, and explain matches. "
         "Use them to help the user find a job."},
        {"role": "user", "content": user_message},
    ]

    for _ in range(max_steps):
        completion = get_client().chat.completions.create(
            model=MODEL, messages=messages, tools=TOOLS,
        )
        message = completion.choices[0].message
        messages.append(message)

        if not message.tool_calls:
            return message.content         

        for tc in message.tool_calls:
            print(f"🔧 {tc.function.name}({tc.function.arguments})")
            try:
                args = json.loads(tc.function.arguments)
                fn = TOOL_FUNCTIONS.get(tc.function.name)
                if fn is None:
                    result = {"error": f"Unknown tool: {tc.function.name}"}
                else:
                    result = fn(args, user_id)
            except Exception as e:
                logger.exception("tool failed", extra={"tool": tc.function.name})
                result = {"error": str(e)}
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(result, default=str),
            })
    return "You reached max steps."
