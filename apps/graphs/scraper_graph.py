"""LangGraph graph for web search and AI-powered analysis."""

import logging
import os
from typing import TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from tavily import TavilyClient

logger = logging.getLogger(__name__)


class ScraperState(TypedDict):
    """State for the scraper graph."""

    query: str
    search_results: str | None
    result: str | None


SYSTEM_PROMPT = (
    "You are a web research assistant. You will receive a user query and web "
    "search results.\n\n"
    "Your task:\n"
    "1. Carefully read the search results.\n"
    "2. Identify the most important information that answers the query.\n"
    "3. Write a clear, concise summary in plain text.\n"
    "4. If there is uncertainty or conflicting information, call it out.\n"
)


DEFAULT_QUERY = "whats new iphone price?"


def search(state: ScraperState) -> dict:
    """Use Tavily search to find relevant content for the query."""
    query = state.get("query") or DEFAULT_QUERY
    api_key = os.getenv("TAVILY_API_KEY")

    if not api_key:
        return {"search_results": "Error: TAVILY_API_KEY not configured"}

    try:
        client = TavilyClient(api_key=api_key)
        response = client.search(
            query=query,
            max_results=3,
            include_answer=True,
        )

        answer = response.get("answer", [])

        if answer:
            return {"search_results": answer}
        return {"search_results": f"No search results found for: {query}"}

    except Exception as exception:
        logger.exception("Failed to search for: %s", query)
        return {"search_results": f"Failed to search for '{query}': {str(exception)}"}


def agent(state: ScraperState) -> dict:
    """LLM agent that summarizes Tavily search results."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {"result": "Error: OPENAI_API_KEY not configured"}

    model_name = os.getenv("OPENAI_MODEL", "gpt-4")
    llm = ChatOpenAI(model=model_name, temperature=0.3)

    query = state.get("query") or DEFAULT_QUERY
    search_results = state.get("search_results", "") or ""

    max_content_length = 50000
    truncated_content = search_results[:max_content_length]
    if len(search_results) > max_content_length:
        truncated_content += "\n\n[Content truncated...]"

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(
            content=(
                f"User query: {query}\n\n"
                f"Web search results:\n{truncated_content}\n\n"
                "Please provide a concise summary of the key information "
                "relevant to the query."
            )
        ),
    ]

    response = llm.invoke(messages)

    return {"result": response.content}


def create_graph():
    """Create and compile the scraper graph."""
    workflow = StateGraph(ScraperState)

    workflow.add_node("search", search)
    workflow.add_node("agent", agent)

    workflow.set_entry_point("search")
    workflow.add_edge("search", "agent")
    workflow.add_edge("agent", END)

    return workflow.compile()


graph = create_graph()
