"""LangGraph graph for stock chat analysis."""
import os
from typing import Annotated, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END


class StockChatState(TypedDict):
    """State for the stock chat graph."""
    query: str
    stock_data: list[dict] | None
    messages: list[dict]
    analysis: str | None


def fetch_stock_data(state: StockChatState) -> StockChatState:
    """Fetch stock data from the NestJS API."""
    stock_data = [
        {
            "symbol": "IBM",
            "name": "IBM",
            "price": 145.00,
            "changePercent": 0.01
        }
    ]
    state["stock_data"] = stock_data
    return state


def analyze_stock_data(state: StockChatState) -> StockChatState:
    """Analyze stock data using OpenAI LLM."""
    query = state["query"]
    stock_data = state.get("stock_data", [])
    
    # Initialize OpenAI client
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        state["analysis"] = "Error: OPENAI_API_KEY not configured"
        return state
    
    model_name = os.getenv("OPENAI_MODEL", "gpt-4")
    
    llm_kwargs = {
        "temperature": 0.7,
    }
    
    llm = ChatOpenAI(model=model_name, **llm_kwargs)
    
    # Create system message
    system_message = SystemMessage(
        content="You are a helpful financial analyst assistant. "
        "Analyze the provided stock data and answer the user's question. "
        "Be concise and informative."
    )
    
    # Format stock data for the prompt
    stock_data_str = "\n".join([
        f"{stock['symbol']}: {stock['name']} - ${stock['price']:.2f} "
        f"({stock['changePercent']:+.2f}%)"
        for stock in stock_data
    ]) if stock_data else "No stock data available."
    
    # Create user message with query and stock data
    user_message = HumanMessage(
        content=f"User Question: {query}\n\nStock Data:\n{stock_data_str}"
    )
    
    try:
        # Get analysis from LLM
        response = llm.invoke([system_message, user_message])
        state["analysis"] = response.content
    except Exception as e:
        state["analysis"] = f"Error analyzing stock data: {str(e)}"
    
    return state


# Build the graph
def create_graph():
    """Create and compile the stock chat graph."""
    print("Creating graph...")
    print(os.getenv("OPENAI_API_KEY"))
    workflow = StateGraph(StockChatState)
    
    # Add nodes
    workflow.add_node("fetch_stock_data", fetch_stock_data)
    workflow.add_node("analyze_stock_data", analyze_stock_data)
    
    # Define the flow
    workflow.set_entry_point("fetch_stock_data")
    workflow.add_edge("fetch_stock_data", "analyze_stock_data")
    workflow.add_edge("analyze_stock_data", END)
    
    # Compile the graph
    return workflow.compile()


# Create the graph instance
graph = create_graph()
