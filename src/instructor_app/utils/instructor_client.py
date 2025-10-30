"""Instructor client wrapper for LLM interactions."""

import os
from typing import AsyncIterator, Dict, Optional, Type

import instructor
from openai import AsyncOpenAI
from pydantic import BaseModel


class InstructorClient:
    """Wrapper for instructor client with streaming support."""

    def __init__(
        self,
        provider: str = "openai",
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
    ):
        self.provider = provider.lower()
        self.api_key = api_key or self._get_default_api_key()
        self.model = model or self._get_default_model()
        self.base_url = base_url or self._get_default_base_url()
        self.client = self._initialize_client()

    def _get_default_api_key(self) -> str:
        """Get default API key based on provider."""
        if self.provider == "openai":
            return os.getenv("OPENAI_API_KEY", "")
        elif self.provider == "litellm":
            return os.getenv("LITELLM_API_KEY", "")
        elif self.provider == "ollama":
            # Ollama may or may not require an API key depending on configuration
            # Use "ollama" as default placeholder if none provided
            return os.getenv("OLLAMA_API_KEY", "ollama")
        return ""

    def _get_default_model(self) -> str:
        """Get default model based on provider."""
        if self.provider == "openai":
            return "gpt-4o-mini"
        elif self.provider == "litellm":
            return "gpt-4o-mini"
        elif self.provider == "ollama":
            return "llama2"
        return "gpt-4o-mini"

    def _get_default_base_url(self) -> Optional[str]:
        """Get default base URL based on provider."""
        if self.provider == "ollama":
            return "http://localhost:11434"
        elif self.provider == "litellm":
            return "http://localhost:4000"
        return None  # Use default OpenAI endpoint

    def _initialize_client(self):
        """Initialize the instructor-patched client."""
        if self.provider in ["openai", "litellm", "ollama"]:
            # All these providers use OpenAI-compatible /v1 endpoints
            # Add /v1 to Ollama base URL if not already present
            base_url = self.base_url
            if self.provider == "ollama" and base_url and not base_url.endswith("/v1"):
                base_url = f"{base_url.rstrip('/')}/v1"
            
            base_client = AsyncOpenAI(
                api_key=self.api_key,
                base_url=base_url
            )
            return instructor.from_openai(base_client, mode=instructor.Mode.MD_JSON)
        else:
            # Default to OpenAI
            base_client = AsyncOpenAI(api_key=self.api_key)
            return instructor.from_openai(base_client, mode=instructor.Mode.MD_JSON)

    async def create_completion(
        self,
        response_model: Type[BaseModel],
        messages: list[Dict[str, str]],
        **kwargs,
    ) -> BaseModel:
        """Create a completion with structured output."""
        return await self.client.chat.completions.create(
            model=self.model,
            response_model=response_model,
            messages=messages,
            **kwargs,
        )

    async def create_streaming_completion(
        self,
        response_model: Type[BaseModel],
        messages: list[Dict[str, str]],
        **kwargs,
    ) -> AsyncIterator[BaseModel]:
        """Create a streaming completion with structured output."""
        async for partial in self.client.chat.completions.create_partial(
            model=self.model,
            response_model=response_model,
            messages=messages,
            stream=True,
            **kwargs,
        ):
            yield partial

