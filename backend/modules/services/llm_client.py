# backend/modules/services/llm_client.py

import json
import os
from typing import Any, Dict, Optional

from openai import OpenAI


class LLMClient:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "OPENAI_API_KEY is not set. Add it to your environment or .env file."
            )

        self.client = OpenAI(api_key=api_key)

        # Default model (can be swapped later dynamically)
        self.default_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.4,
    ) -> str:
        """
        Simple text generation.
        """
        model_to_use = model or self.default_model
        system_content = system_prompt or "You are GeoPulse Intelligence."

        response = self.client.chat.completions.create(
            model=model_to_use,
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
        )

        content = response.choices[0].message.content
        return content.strip() if content else ""

    def generate_structured_json(
        self,
        prompt: str,
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
    ) -> Dict[str, Any]:
        """
        Structured JSON output for agents.
        """
        model_to_use = model or self.default_model
        system_content = system_prompt or """
You are GeoPulse Intelligence.

Rules:
- Always return valid JSON
- No explanations outside JSON
- Be precise, structured, and executive-level
""".strip()

        response = self.client.chat.completions.create(
            model=model_to_use,
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
        )

        content = response.choices[0].message.content or ""

        try:
            return json.loads(content)
        except Exception:
            return {
                "error": "Invalid JSON returned",
                "raw": content,
            }