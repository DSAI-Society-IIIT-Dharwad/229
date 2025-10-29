import os
import requests
import re
import json
from typing import Dict, Any, List
from fastapi import FastAPI
from pydantic import BaseModel

# LangChain Imports
from langchain_groq import ChatGroq
# FIX: AgentExecutor is no longer necessary when using the runnable agent returned by create_agent
from langchain.agents import create_agent 
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import tool
# FIX: Memory classes have moved to langchain_community
from langchain_community.memory.buffer import ConversationBufferWindowMemory
from langchain_community.chat_history import ChatMessageHistory
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_core.runnables import Runnable

# --- Configuration (from chatbot_agent.py) ---
BASE_API_URL = "http://127.0.0.1:8000/analyze"
# Changed AGENT_EXECUTOR to AGENT_CHAIN to reflect the new runnable structure
AGENT_CHAIN: Runnable | None = None 
SYSTEM_PROMPT = (
    "You are a helpful and engaging sentiment analysis chatbot. "
    "Your primary function is to analyze public opinion on specific products or topics "
    "by utilizing the 'reddit_sentiment_tool'. "
    "You MUST use this tool ONLY if the user asks for a specific subreddit and topic (e.g., 'What is the sentiment on r/apple about the iPhone 16?'). "
    "Do NOT use the tool for general conversation or common knowledge questions. "
    "Always summarize the JSON output from the tool in a friendly, conversational way, citing the numbers (positive/negative/neutral count)."
)

# --- Pydantic Models for API Request/Response ---

class Message(BaseModel):
    """Represents a single message in the chat history."""
    role: str # 'human' or 'ai'
    content: str

class ChatRequest(BaseModel):
    """The payload sent from the frontend."""
    user_input: str
    chat_history: List[Message] = []

class ChatResponse(BaseModel):
    """The payload sent back to the frontend."""
    ai_response: str
    new_chat_history: List[Message]

# --- 1. Custom Tool Definition: API Wrapper (Identical to Canvas) ---

@tool
def reddit_sentiment_tool(query: str) -> str:
    """
    Analyzes sentiment on Reddit for a given subreddit and topic.
    The query MUST be formatted exactly as 'subreddit=<name>, topic=<keyword>'.
    Example: 'subreddit=apple, topic=iPhone 16'
    """
    # 1. Parse the input string (The LLM is guided to format it correctly)
    try:
        sub_match = re.search(r'subreddit=([^,]+)', query, re.IGNORECASE)
        topic_match = re.search(r'topic=(.*)', query, re.IGNORECASE)

        if not sub_match or not topic_match:
            return "Error: Query format is incorrect. Must use 'subreddit=<name>, topic=<keyword>'."
        
        subreddit = sub_match.group(1).strip()
        topic = topic_match.group(1).strip()
        
    except Exception:
        return "Error parsing query parameters. Please check format."

    # 2. Make the API Call
    params = {"subreddit": subreddit, "topic": topic}
    try:
        response = requests.get(BASE_API_URL, params=params, timeout=30)
        response.raise_for_status() 
        data = response.json()
        
        if data.get("status") == "success":
            # Summarize the raw JSON output for the LLM
            sentiments = [item['sentiment'] for item in data.get('data', [])]
            
            summary = {
                "total_posts_analyzed": data.get("results_count", 0),
                "positive_count": sentiments.count("positive"),
                "negative_count": sentiments.count("negative"),
                "neutral_count": sentiments.count("neutral"),
                "sample_data_for_LLM": data.get('data', [])[:3]
            }
            
            return json.dumps(summary, indent=2)

        else:
            return f"API returned an error status: {data.get('message', 'Unknown API Error')}"

    except requests.exceptions.RequestException as e:
        return f"Error connecting to the local API at {BASE_API_URL}. Is the FastAPI server running? Error: {e}"
    except Exception as e:
        return f"An unexpected error occurred during API processing: {e}"


# --- 2. FastAPI Application Setup ---
app = FastAPI(title="Groq Conversational Agent API")


@app.on_event("startup")
def setup_agent():
    """Initializes the LLM and Agent Chain once on server startup."""
    global AGENT_CHAIN

    if not os.environ.get("GROQ_API_KEY"):
        print("FATAL ERROR: GROQ_API_KEY environment variable not set.")
        return 

    # 2.1. Initialize LLM (Using Groq Mixtral)
    llm = ChatGroq(model="mixtral-8x7b-32768", temperature=0)

    # 2.2. Define Tools
    tools = [reddit_sentiment_tool]

    # 2.3. Define Agent Prompt
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            # This is the memory placeholder that gets filled in the endpoint
            MessagesPlaceholder(variable_name="chat_history"), 
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]
    )
    
    # 2.4. Create the Agent Chain (using create_agent)
    # The result is a fully runnable LangChain object, replacing AgentExecutor
    AGENT_CHAIN = create_agent(
        llm, 
        tools, 
        prompt, 
        handle_parsing_errors=True # Passed directly to the agent in this format
    )
    print("Groq Agent Chain initialized successfully.")


# --- 3. API Endpoint Definition ---

def _load_history_from_request(history_data: List[Message]) -> ChatMessageHistory:
    """Converts the simple Pydantic history list into a LangChain ChatMessageHistory object."""
    message_history = ChatMessageHistory()
    for msg in history_data:
        if msg.role == 'human':
            message_history.add_message(HumanMessage(content=msg.content))
        elif msg.role == 'ai':
            message_history.add_message(AIMessage(content=msg.content))
    return message_history

def _export_history_for_response(chat_history: ChatMessageHistory) -> List[Message]:
    """Converts the LangChain ChatMessageHistory back into the Pydantic list."""
    exported_history = []
    for msg in chat_history.messages:
        role = 'human' if isinstance(msg, HumanMessage) else 'ai'
        exported_history.append(Message(role=role, content=msg.content))
    return exported_history


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Receives user input and full chat history, processes the response using the Groq agent,
    and returns the updated history.
    """
    global AGENT_CHAIN
    if AGENT_CHAIN is None:
        return ChatResponse(
            ai_response="Error: Chat agent failed to initialize. Check GROQ_API_KEY and model path.",
            new_chat_history=request.chat_history
        )

    # 1. Load the history from the request payload
    langchain_history = _load_history_from_request(request.chat_history)
    
    # 2. Wrap the history in a temporary memory object for the agent
    # We use a window memory only for consistent typing, but the history itself controls the window
    memory = ConversationBufferWindowMemory(
        k=5, 
        memory_key="chat_history", 
        return_messages=True,
        chat_memory=langchain_history 
    )

    # 3. Invoke the Agent Chain directly
    # We pass chat_history and input explicitly
    result: Dict[str, Any] = AGENT_CHAIN.invoke(
        {
            "input": request.user_input, 
            "chat_history": langchain_history.messages # Pass the list of messages directly
        }
    )

    # The agent's output is just the response text, we manually update the history object
    # NOTE: We use the history object created from the request which is named 'langchain_history'
    # but the history object in memory (which includes the full conversation up to this point) is 'memory.chat_memory'
    new_langchain_history = memory.chat_memory 
    new_langchain_history.add_message(HumanMessage(content=request.user_input))
    new_langchain_history.add_message(AIMessage(content=result['output']))
    
    # 4. Export the updated history (user message + AI response)
    new_history_list = _export_history_for_response(new_langchain_history)
    
    # 5. Return the AI's final response and the full updated history
    return ChatResponse(
        ai_response=result['output'],
        new_chat_history=new_history_list
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) # Running on port 8001 to avoid conflict with api_service.py (port 8000)
