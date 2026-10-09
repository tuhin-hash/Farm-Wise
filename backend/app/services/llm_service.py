"""LLM service — optional Groq/LangChain integration with graceful fallback."""
from __future__ import annotations

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_llm_instance = None
_llm_available = False


def is_llm_available() -> bool:
    """Check if an LLM API key is configured."""
    return bool(os.environ.get("GROQ_API_KEY", "").strip())


def get_mode() -> str:
    """Return 'llm' if LLM is available, else 'demo'."""
    return "llm" if is_llm_available() else "demo"


def get_llm():
    """Get or create the LLM instance. Returns None if not configured."""
    global _llm_instance, _llm_available
    if _llm_instance is not None:
        return _llm_instance

    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not api_key:
        _llm_available = False
        logger.info("No GROQ_API_KEY found. Running in demo/fallback mode.")
        return None

    model = os.environ.get("GROQ_MODEL", "llama-3.1-70b-versatile")
    try:
        from langchain_groq import ChatGroq
        _llm_instance = ChatGroq(
            api_key=api_key,
            model_name=model,
            temperature=0.3,
            max_tokens=2048,
            request_timeout=30,
        )
        _llm_available = True
        logger.info(f"LLM initialized: Groq/{model}")
        return _llm_instance
    except Exception as e:
        logger.warning(f"Failed to initialize LLM: {e}. Falling back to demo mode.")
        _llm_available = False
        return None


def llm_interpret(prompt: str, fallback: str = "") -> str:
    """Send a prompt to the LLM. Returns fallback string on any failure."""
    llm = get_llm()
    if llm is None:
        return fallback
    try:
        from langchain_core.messages import HumanMessage
        response = llm.invoke([HumanMessage(content=prompt)])
        return response.content
    except Exception as e:
        logger.warning(f"LLM call failed: {e}. Using fallback.")
        return fallback
