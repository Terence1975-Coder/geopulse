import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None


def run_llm(prompt: str, model: str = "gpt-4.1") -> str:
    if not api_key or client is None:
        return "OPENAI_API_KEY is not set. LLM response could not be generated."

    try:
        response = client.chat.completions.create(
            model=model,
            temperature=0.3,
            max_tokens=4000,
            messages=[
                {
                    "role": "system",
                    "content": "You are GeoPulse AI, an executive-grade intelligence system producing grounded, commercially useful outputs.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
        )

        content = response.choices[0].message.content
        return content.strip() if content else ""

    except Exception as exc:
        return f"LLM generation failed: {str(exc)}"