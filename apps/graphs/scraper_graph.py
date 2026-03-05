"""LangGraph graph for web search and AI-powered analysis."""

import logging
import operator
import os
from typing import Annotated, TypedDict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from tavily import TavilyClient

logger = logging.getLogger(__name__)


class ScraperState(TypedDict):
    """State for the scraper graph.

    `messages` uses operator.add so LangGraph's checkpointer (MemorySaver
    locally, server-managed in langgraph dev) accumulates the full conversation
    across runs on the same thread as plain (role, content) tuples.
    """

    messages: Annotated[list, operator.add]
    search_results: str | None
    result: str | None


SYSTEM_PROMPT = (
    "You are a web research assistant. You will receive a user query and web "
    "search results.\n\n"
    "Your task:\n"
    "1. Carefully read the search results.\n"
    "2. Identify the most important information that answers the query.\n"
    "3. Write a clear, concise summary in plain text.\n"
    "4. Take prior conversation context into account for follow-up questions.\n"
    "5. If there is uncertainty or conflicting information, call it out.\n"
)


def _get_last_human_query(messages: list[tuple[str, str]]) -> str:
    for item in reversed(messages):
        if not (isinstance(item, (tuple, list)) and len(item) == 2):
            continue
        role, content = item
        if role in ("user", "human"):
            return content
    return ""


def search(state: ScraperState) -> dict:
    """Use Tavily to search for the latest human message query."""
    query = _get_last_human_query(state["messages"])
    if not query:
        return {"search_results": "No query provided."}

    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        return {"search_results": "Error: TAVILY_API_KEY not configured"}

    try:
        client = TavilyClient(api_key=api_key)
        response = client.search(query=query, max_results=5, include_answer=True)

        parts = []

        answer = response.get("answer", "")
        if answer:
            parts.append(f"Direct answer: {answer}")

        for result in response.get("results", []):
            title = result.get("title", "")
            url = result.get("url", "")
            content = result.get("content", "").strip()
            if content:
                parts.append(f"Source: {title}\nURL: {url}\n{content}")

        if parts:
            return {"search_results": "\n\n---\n\n".join(parts)}
        return {"search_results": f"No search results found for: {query}"}

    except Exception as exception:
        logger.exception("Failed to search for: %s", query)
        return {"search_results": f"Search failed for '{query}': {str(exception)}"}


_ROLE_MAP = {
    "user": HumanMessage,
    "human": HumanMessage,
    "assistant": AIMessage,
    "ai": AIMessage,
}

_LLM = ChatOpenAI(model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"), temperature=0.3)


def agent(state: ScraperState) -> dict:
    """Summarize search results with full conversation context."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        error = "Error: OPENAI_API_KEY not configured"
        return {"messages": [("assistant", error)], "result": error}

    all_messages = state["messages"]
    query = _get_last_human_query(all_messages)
    if not query:
        error = "No user query found in message history."
        return {"messages": [("assistant", error)], "result": error}

    search_results = state.get("search_results") or ""
    if len(search_results) > 50000:
        truncated = search_results[:50000] + "\n\n[Content truncated...]"
    else:
        truncated = search_results

    # Replace raw user turn with search-enriched version so the model has grounded context
    llm_messages = [SystemMessage(content=SYSTEM_PROMPT)]
    for role, content in all_messages[:-1]:
        msg_class = _ROLE_MAP.get(role)
        if msg_class:
            llm_messages.append(msg_class(content=content))

    llm_messages.append(
        HumanMessage(
            content=(
                f"User query: {query}\n\n"
                f"Web search results:\n{truncated}\n\n"
                "Please provide a concise summary of the key information "
                "relevant to the query."
            )
        )
    )

    try:
        response = _LLM.invoke(llm_messages)
        return {"messages": [("assistant", response.content)], "result": response.content}
    except Exception as exc:
        logger.exception("LLM invocation failed")
        error = f"Error: LLM call failed — {exc}"
        return {"messages": [("assistant", error)], "result": error}


def create_graph():
    """Create the scraper graph — persistence is handled by the LangGraph platform."""
    workflow = StateGraph(ScraperState)

    workflow.add_node("search", search)
    workflow.add_node("agent", agent)

    workflow.add_edge(START, "search")
    workflow.add_edge("search", "agent")
    workflow.add_edge("agent", END)

    return workflow.compile()


graph = create_graph()
