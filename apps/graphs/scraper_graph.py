"""LangGraph graph for web search and AI-powered analysis."""

import logging
import os
from typing import Annotated, TypedDict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, BaseMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from tavily import TavilyClient

logger = logging.getLogger(__name__)


class ScraperState(TypedDict):
    messages: Annotated[list, add_messages]
    query: str
    search_results: str | None
    result: str | None


SYSTEM_PROMPT = (
    "You are a helpful assistant. You may receive web search results alongside the user query.\n\n"
    "If web search results are provided:\n"
    "1. Carefully read them and identify the most relevant information.\n"
    "2. Write a clear, concise summary that answers the query.\n"
    "3. If there is uncertainty or conflicting information, call it out.\n\n"
    "If no web search results are provided:\n"
    "1. Answer directly from your own knowledge.\n"
    "2. If the query requires real-time or up-to-date web data, let the user know they can add a Tavily API key in the Settings section to enable web search.\n\n"
    "Always take prior conversation context into account for follow-up questions.\n"
)


def extract_query(state: ScraperState) -> dict:
    """Extract the latest human message content into state["query"]."""
    messages = state["messages"]
    for msg in reversed(messages):
        if isinstance(msg, BaseMessage) and msg.type in ("human", "user"):
            return {"query": msg.content if isinstance(msg.content, str) else ""}
    return {"query": ""}


def search(state: ScraperState, config: RunnableConfig) -> dict:
    """Use Tavily to search for state["query"]."""
    query = state["query"]
    if not query:
        return {"search_results": "No query provided."}

    configurable = config.get("configurable", {})
    api_key = configurable.get("tavily_api_key")
    if not api_key:
        return {"search_results": ""}

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


def agent(state: ScraperState, config: RunnableConfig) -> dict:
    """Summarize search results with full conversation context."""
    configurable = config.get("configurable", {})
    api_key = configurable.get("openai_api_key")
    model = configurable.get("openai_model") or "gpt-4o-mini"

    if not api_key:
        error = "No OpenAI API key provided. Please add your API key in the settings."
        return {"messages": [AIMessage(content=error)], "result": error}

    query = state["query"]
    if not query:
        error = "No user query found in message history."
        return {"messages": [AIMessage(content=error)], "result": error}

    search_results = state.get("search_results") or ""
    if len(search_results) > 50000:
        search_results = search_results[:50000] + "\n\n[Content truncated...]"

    search_section = f"Web search results:\n{search_results}\n\n" if search_results else ""
    augmented_query = f"User query: {query}\n\n{search_section}Please answer the query."
    llm_messages = (
        [SystemMessage(content=SYSTEM_PROMPT)]
        + list(state["messages"][:-1])
        + [HumanMessage(content=augmented_query)]
    )

    llm = ChatOpenAI(api_key=api_key, model=model, temperature=0.3)

    try:
        response = llm.invoke(llm_messages)
        return {"messages": [AIMessage(content=response.content)], "result": response.content}
    except Exception as exc:
        logger.exception("LLM invocation failed")
        error = f"Error: LLM call failed — {exc}"
        return {"messages": [AIMessage(content=error)], "result": error}


def create_graph():
    """Create the scraper graph — persistence is handled by the LangGraph platform."""
    workflow = StateGraph(ScraperState)

    workflow.add_node("extract_query", extract_query)
    workflow.add_node("search", search)
    workflow.add_node("agent", agent)

    workflow.add_edge(START, "extract_query")
    workflow.add_edge("extract_query", "search")
    workflow.add_edge("search", "agent")
    workflow.add_edge("agent", END)

    return workflow.compile()


graph = create_graph()
