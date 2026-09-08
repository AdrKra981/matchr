FETCH_JOBS_TOOL = {
    "type": "function",
    "function": {
        "name": "fetch_jobs",
        "description": "Retrieves job postings for the specified role/query and saves them to the database.",
        "parameters": {
            "type": "object",
            "properties": {
                "what": {
                    "type": "string",
                    "description": "Role or keywords for searching, e.g. 'python developer'",
                }
            },
            "required": ["what"],
        },
    },
}
RANK_JOBS_TOOL = {
    "type": "function",
    "function": {
        "name": "rank_jobs",
        "description": "Ranks saved jobs based on relevance to the user's CV and returns the top N.",
        "parameters": {
            "type": "object",
            "properties": {
                "top_k": {
                    "type": "integer",
                    "description": "Number of top jobs to return, default 10",
                }
            },
            "required": [],
        },
    },
}