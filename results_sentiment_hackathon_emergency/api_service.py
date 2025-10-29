import os
import time
from typing import List, Dict, Any, Optional
import torch
import torch.nn.functional as F
from dotenv import load_dotenv
# Note: PRAW, transformers, and torch must be installed in your environment
import praw
from transformers import AutoModelForSequenceClassification, AutoTokenizer

# --- FastAPI Imports ---
from fastapi import FastAPI, Query
import uvicorn # Used to run the server

# --- CONFIGURATION (Copied from reddit_sentiment_analyzer.py) ---
# NOTE: Using the absolute path you specified. Ensure this path is correct
# in the environment where the API is run.
MODEL_PATH = r"C:\MLops\docker\intra_hack\results_sentiment_hackathon_emergency\final_fine_tuned_model"
LABELS = ['negative', 'neutral', 'positive']
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# --- GLOBAL MODEL & TOKENIZER (Loaded once on startup) ---
ANALYSIS_MODEL: Optional[AutoModelForSequenceClassification] = None
ANALYSIS_TOKENIZER: Optional[AutoTokenizer] = None

# --- PRAW CREDENTIALS (Loaded from environment variables) ---
load_dotenv()
CLIENT_ID = os.environ.get("REDDIT_CLIENT_ID")
CLIENT_SECRET = os.environ.get("REDDIT_CLIENT_SECRET")
USER_AGENT = os.environ.get("REDDIT_USER_AGENT")

# --- GLOBAL IN-MEMORY CACHE ---
ANALYTICS_CACHE: Dict[str, List[Dict[str, Any]]] = {}

# --- FastAPI Application Setup ---
app = FastAPI(title="Reddit Sentiment Analyzer API", version="1.0")

# --- 1. PRAW Initialization ---
def initialize_reddit_client():
    """Initializes the PRAW client for read-only access."""
    if not all([CLIENT_ID, CLIENT_SECRET, USER_AGENT]):
        print("ERROR: PRAW environment variables not set. Please check setup.")
        # Returning None will cause fetch_and_cache_reddit_data to skip execution
        return None
    try:
        # PRAW is configured for unauthenticated (read-only) access using client_id/secret
        reddit = praw.Reddit(
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET,
            user_agent=USER_AGENT,
        )
        return reddit
    except Exception as e:
        print(f"PRAW Initialization Failed: {e}")
        return None

# --- 2. Model Loading (Executed only when the API starts) ---

@app.on_event("startup")
def load_sentiment_model():
    """Loads the fine-tuned model and tokenizer once when the server starts."""
    global ANALYSIS_MODEL, ANALYSIS_TOKENIZER
    if ANALYSIS_MODEL and ANALYSIS_TOKENIZER:
        return

    print(f"Loading fine-tuned model from {MODEL_PATH} on device {DEVICE}...")
    try:
        # Load the saved model and tokenizer
        ANALYSIS_MODEL = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
        ANALYSIS_TOKENIZER = AutoTokenizer.from_pretrained(MODEL_PATH)
        ANALYSIS_MODEL.to(DEVICE)
        ANALYSIS_MODEL.eval()
        print("Model loaded successfully.")
    except Exception as e:
        print(f"FATAL ERROR: Could not load the fine-tuned model. Ensure the path '{MODEL_PATH}' exists.")
        print(f"Error details: {e}")
        ANALYSIS_MODEL = None
        ANALYSIS_TOKENIZER = None

# --- 3. Inference Logic ---

def analyze_sentiment_batch(texts: List[str]) -> List[str]:
    """Runs the text batch through the fine-tuned BERT model."""
    global ANALYSIS_MODEL, ANALYSIS_TOKENIZER
    if not ANALYSIS_MODEL or not ANALYSIS_TOKENIZER:
        print("Analysis model is not available for inference.")
        # Return neutral/error state if model is missing
        return ["error"] * len(texts) 

    # Tokenize the batch
    inputs = ANALYSIS_TOKENIZER(
        texts,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=128
    )

    # Move tensors to the correct device
    inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = ANALYSIS_MODEL(**inputs)

    # Get probabilities and predictions
    predictions = F.softmax(outputs.logits, dim=-1)
    predicted_labels = torch.argmax(predictions, dim=-1).cpu().numpy()

    # Map indices back to label names
    sentiment_results = [LABELS[label_index] for label_index in predicted_labels]

    return sentiment_results

# --- 4. Data Fetching and Caching Logic (Adapted for API) ---

def fetch_and_cache_reddit_data(subreddit_name: str, keyword: str, limit: int = 100) -> List[Dict[str, Any]]:
    """Fetches a mini-batch of comments/posts from Reddit based on a keyword."""
    reddit = initialize_reddit_client()
    if not reddit:
        return []

    # Check cache first
    cache_key = f"{subreddit_name}_{keyword}"
    if cache_key in ANALYTICS_CACHE:
        print(f"CACHE HIT: Returning {len(ANALYTICS_CACHE[cache_key])} items for '{keyword}'")
        return ANALYTICS_CACHE[cache_key]

    print(f"CACHE MISS: Fetching new data for '{keyword}' from r/{subreddit_name}...")
    
    scraped_data = []
    # Using a slightly lower limit for speed in API response
    submission_limit = limit // 2 if limit > 10 else limit

    try:
        # 1. Fetch relevant submissions (posts)
        submissions = reddit.subreddit(subreddit_name).search(keyword, limit=submission_limit, sort='new')
        
        for submission in submissions:
            # Extract post body
            if submission.selftext:
                text_content = submission.title + " | " + submission.selftext
                scraped_data.append({
                    "id": f"p_{submission.id}",
                    "raw_text": text_content,
                    "source": subreddit_name,
                    "type": "post",
                })

            if len(scraped_data) >= limit:
                break
                
            # 2. Fetch comments
            submission.comments.replace_more(limit=0)
            for comment in submission.comments.list()[:2]: # Max 2 comments per post
                if comment.body:
                    scraped_data.append({
                        "id": f"c_{comment.id}",
                        "raw_text": comment.body,
                        "source": subreddit_name,
                        "type": "comment",
                    })
                if len(scraped_data) >= limit:
                    break
        
        final_data = scraped_data[:limit]
        # Store in cache
        ANALYTICS_CACHE[cache_key] = final_data
        
        return final_data
    except Exception as e:
        print(f"Error fetching data from Reddit: {e}")
        return []

# --- 5. Analysis Orchestration (The core function wrapped by the endpoint) ---

def run_analysis_pipeline(subreddit: str, topic: str) -> List[Dict[str, Any]]:
    """Combines fetching and analysis."""
    
    # 1. Fetch the mini-batch of raw text
    raw_posts = fetch_and_cache_reddit_data(subreddit, topic, limit=50) # Use a smaller limit for fast API response
    
    if not raw_posts:
        return []

    # Check for model readiness before inference
    global ANALYSIS_MODEL
    if not ANALYSIS_MODEL:
         # Log and return raw data if analysis failed
         print("Model not loaded, returning unanalyzed data.")
         # Return a simplified structure indicating missing analysis
         return [{
             "id": post["id"], 
             "text": post["raw_text"][:100].replace('\n', ' ') + "...",
             "sentiment": "MODEL_ERROR", 
             "aspect": "N/A"
         } for post in raw_posts]


    # --- Phase 2: REAL BERT Sentiment Inference ---
    texts_to_analyze = [post["raw_text"] for post in raw_posts]
    sentiment_results = analyze_sentiment_batch(texts_to_analyze)

    # MOCK ASPECT CLASSIFICATION (still needed)
    def mock_aspect_classify(text):
        text_lower = text.lower()
        if "performance" in text_lower or "lag" in text_lower or "speed" in text_lower or "fast" in text_lower:
            return "Performance"
        elif "battery" in text_lower or "charge" in text_lower or "life" in text_lower:
            return "Battery"
        elif "design" in text_lower or "look" in text_lower or "feel" in text_lower:
            return "Design"
        elif "bug" in text_lower or "error" in text_lower:
            return "Software"
        return "Overall"


    analyzed_data = []
    for i, post in enumerate(raw_posts):
        analyzed_data.append({
            "id": post["id"],
            "text": post["raw_text"][:150].replace('\n', ' ') + "...",
            "aspect": mock_aspect_classify(post["raw_text"]),
            "sentiment": sentiment_results[i], 
            "timestamp": time.time(),
        })

    return analyzed_data


# --- 6. API Endpoint Definition ---

@app.get("/analyze")
def analyze_reddit_topic(
    subreddit: str = Query(..., description="The subreddit to search, e.g., 'apple'"),
    topic: str = Query(..., description="The keyword or topic to analyze, e.g., 'iPhone 16'"),
):
    """
    Fetches posts from a subreddit for a given topic and returns sentiment analysis
    results using the fine-tuned BERT model.
    """
    results = run_analysis_pipeline(subreddit, topic)
    if not results:
        return {"status": "error", "message": "Could not fetch data or model failed to load."}
    
    return {
        "status": "success",
        "query": {"subreddit": subreddit, "topic": topic},
        "results_count": len(results),
        "analysis_source": "Fine-Tuned BERT",
        "data": results,
    }

# --- 7. Server Execution ---

if __name__ == "__main__":
    # To run this API service, you would typically use: uvicorn api_service:app --reload
    # We call run() directly for compatibility with typical Python execution environments.
    uvicorn.run(app, host="0.0.0.0", port=8000)
