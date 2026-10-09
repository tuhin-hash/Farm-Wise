import logging
from typing import Dict, Any, List, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY.strip()
        self.model = settings.GROQ_MODEL
        self.base_url = settings.GROQ_BASE_URL.rstrip("/")
        self.timeout = settings.LLM_TIMEOUT_SECONDS

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 1024
    ) -> Optional[str]:
        """Calls Groq/OpenAI compatible chat completions API asynchronously.
        Returns response string if successful, or None on failure/missing key.
        """
        if not self.is_configured:
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        return choices[0]["message"].get("content", "").strip()
                logger.warning(f"LLM API returned non-200 code: {response.status_code}")
                return None
        except Exception as e:
            logger.warning(f"LLM call failed or timed out: {e}. Falling back to rule-based engine.")
            return None

llm_service = LLMService()
