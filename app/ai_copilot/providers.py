from abc import ABC, abstractmethod


class AIProvider(ABC):
    @abstractmethod
    def summarize(self, prompt: str, context: dict) -> str:
        raise NotImplementedError


class MockAIProvider(AIProvider):
    def summarize(self, prompt: str, context: dict) -> str:
        return f"Rule-based summary for '{prompt}': {context}"


class OpenAIProvider(AIProvider):
    def summarize(self, prompt: str, context: dict) -> str:
        return "OpenAI provider is configured as an optional integration point. No external call is made by default."


def get_ai_provider(provider_name: str = "mock") -> AIProvider:
    if provider_name == "openai":
        return OpenAIProvider()
    return MockAIProvider()

