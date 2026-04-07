from __future__ import annotations

import json
import os
from typing import Type, TypeVar

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel, ValidationError

load_dotenv()

T = TypeVar("T", bound=BaseModel)


class LLMClient:
    def __init__(self) -> None:
        api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=api_key) if api_key else None
        self.model = os.getenv("OPENAI_MODEL", "gpt-4.1")

    def generate_structured_json(
        self,
        prompt: str,
        stage: str,
        response_model: Type[T],
    ) -> T:
        if self.client is None:
            return response_model()  # safe fallback

        response = self.client.chat.completions.create(
            model=self.model,
            temperature=0.2,
            max_tokens=1800,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are GeoPulse AI, an executive-grade intelligence system. "
                        "Return valid JSON only."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
        )

        content = response.choices[0].message.content or "{}"
        parsed = self._extract_json(content)

        try:
            return response_model.model_validate(parsed)
        except ValidationError:
            return response_model()

    def _extract_json(self, content: str) -> dict:
        text = content.strip()

        if text.startswith("```"):
            text = text.strip("`")
            if text.startswith("json"):
                text = text[4:].strip()

        start = text.find("{")
        end = text.rfind("}")

        if start == -1 or end == -1 or end <= start:
            return {}

        json_text = text[start : end + 1]

        try:
            return json.loads(json_text)
        except json.JSONDecodeError:
            return {}