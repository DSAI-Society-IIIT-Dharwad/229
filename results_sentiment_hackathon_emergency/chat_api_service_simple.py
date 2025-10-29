import os
import re
import json
import requests
from typing import Dict, Any, List, Union
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path

# Initialize environment variables
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Global LLM instance
llm = None

# Debug print to check if environment variable is loaded
print(f"GROQ_API_KEY loaded: {'GROQ_API_KEY' in os.environ}")
# --- LangChain/LangGraph Imports ---
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_core.tools import Tool

# --- Configuration ---
BASE_API_URL = "http://127.0.0.1:8000/analyze"

SYSTEM_PROMPT = (
    "You are a helpful and engaging sentiment analysis chatbot. "
    "Your primary function is to analyze public opinion on specific products or topics "
    "by utilizing the 'reddit_sentiment_tool'. "
    "You MUST use this tool ONLY if the user asks for a specific subreddit and topic "
    "(e.g., 'What is the sentiment on r/apple about the iPhone 16?'). "
    "Do NOT use the tool for general conversation or common knowledge questions. "
    "Always summarize the JSON output from the tool in a friendly, conversational way, "
    "citing the numbers (positive/negative/neutral count)."
)

# --- FastAPI Application Setup ---
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI app"""
    global llm
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("❌ FATAL ERROR: GROQ_API_KEY environment variable not set.")
        print(f"Current environment variables: {list(os.environ.keys())}")
    else:
        print(f"✓ Found GROQ_API_KEY: {api_key[:8]}...")
        try:
            llm = ChatGroq(
                model="llama-3.1-8b-instant",  # Using Mixtral instruct model which is currently supported
                temperature=0,
                max_tokens=1024,
                streaming=False
            )
            print("✅ Groq LLM initialized successfully.")
        except Exception as e:
            print(f"❌ Error initializing LLM: {str(e)}")
            llm = None
    yield
    llm = None

app = FastAPI(title="Groq Agent API", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# --- Pydantic Models for API ---
class Message(BaseModel):
    """Represents a single message in the chat history."""
    role: str  # 'human', 'ai'
    content: str

class ChatRequest(BaseModel):
    """The payload sent from the frontend."""
    user_input: str
    chat_history: List[Message] = []

class ChatResponse(BaseModel):
    """The payload sent back to the frontend."""
    ai_response: str
    new_chat_history: List[Message]

# --- 1. Custom Tool Definition: API Wrapper ---
def reddit_sentiment_tool(query: str) -> str:
    """
    Analyzes sentiment on Reddit for a given subreddit and topic.
    The query MUST be formatted exactly as 'subreddit=<n>, topic=<keyword>'.
    Example: 'subreddit=apple, topic=iPhone 16'
    """
    try:
        sub_match = re.search(r'subreddit=([^,]+)', query, re.IGNORECASE)
        topic_match = re.search(r'topic=(.*)', query, re.IGNORECASE)

        if not sub_match or not topic_match:
            return "Error: Query format is incorrect. Must use 'subreddit=<n>, topic=<keyword>'."

        subreddit = sub_match.group(1).strip()
        topic = topic_match.group(1).strip()
    except Exception:
        return "Error parsing query parameters. Please check format."

    params = {"subreddit": subreddit, "topic": topic}
    try:
        response = requests.get(BASE_API_URL, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()

        if data.get("status") == "success":
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
        return f"Error connecting to API at {BASE_API_URL}. Is the FastAPI server running? Error: {e}"
    except Exception as e:
        return f"Unexpected error: {e}"

sentiment_tool = Tool(
    name="reddit_sentiment_tool",
    func=reddit_sentiment_tool,
    description="Analyzes sentiment on Reddit for a given subreddit and topic. Format: 'subreddit=<name>, topic=<keyword>'"
)

# --- 2. LLM Setup ---
# Note: LLM setup is now handled in the lifespan context manager at the top of the file

# --- 3. Utility Functions ---
def _load_messages_for_chain(history_data: List[Message], current_input: str) -> List[BaseMessage]:
    """Converts the Pydantic history list into a LangChain BaseMessage list."""
    messages: List[BaseMessage] = []
    
    # Add historical messages
    for msg in history_data:
        if msg.role == 'human':
            messages.append(HumanMessage(content=msg.content))
        elif msg.role == 'ai':
            messages.append(AIMessage(content=msg.content))
    
    return messages

# --- 4. API Endpoint Definition ---
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Receives user input and chat history, processes the response using the LLM.
    """
    global llm
    if llm is None:
        return ChatResponse(
            ai_response="Error: Chat LLM failed to initialize. Check GROQ_API_KEY.",
            new_chat_history=request.chat_history
        )

    # Convert chat history to LangChain format
    chat_history = _load_messages_for_chain(request.chat_history, request.user_input)

    # Check if we should use the sentiment tool
    if "subreddit" in request.user_input.lower() and "topic" in request.user_input.lower():
        # Get sentiment analysis
        tool_result = reddit_sentiment_tool(request.user_input)
        
        # Create messages for the LLM
        messages = [
            HumanMessage(content=SYSTEM_PROMPT),
            *chat_history,
            HumanMessage(content=f"Here's the sentiment analysis result: {tool_result}. Please summarize it in a friendly way.")
        ]
    else:
        # Normal conversation
        messages = [
            HumanMessage(content=SYSTEM_PROMPT),
            *chat_history,
            HumanMessage(content=request.user_input)
        ]

    # Get response from LLM
    try:
        result = await llm.ainvoke(messages)
        response_content = result.content
    except Exception as e:
        print(f"Error during LLM invocation: {str(e)}")
        return ChatResponse(
            ai_response="I apologize, but I encountered an error processing your request. Please try again.",
            new_chat_history=request.chat_history
        )

    # Create new messages
    human_message = HumanMessage(content=request.user_input)
    ai_message = AIMessage(content=response_content)
    
    # Update history
    new_history = request.chat_history + [
        Message(role="human", content=request.user_input),
        Message(role="ai", content=response_content)
    ]
    
    return ChatResponse(
        ai_response=result.content,
        new_chat_history=new_history
    )

if __name__ == "__main__":
    import uvicorn
    # Running on port 8001
    uvicorn.run(app, host="0.0.0.0", port=8001)