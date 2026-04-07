import json
import os
from typing import Any, Dict

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is missing from your backend .env file")

client = OpenAI(api_key=OPENAI_API_KEY)


def call_llm_json(system_prompt: str, user_prompt: str, model: str = "gpt-4o-mini") -> Dict[str, Any]:
    response = client.chat.completions.create(
        model=model,
        temperature=0.3,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    content = response.choices[0].message.content

    if not content:
        raise RuntimeError("LLM returned an empty response")

    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Failed to parse LLM JSON response: {content}") from exc