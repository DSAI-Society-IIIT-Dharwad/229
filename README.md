# Sentiment Analyzer 🔍

An AI-powered conversational chatbot that analyzes sentiment for specific subreddits and topics using fine-tuned BERT models and LangChain.

![Tech Stack](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Express](https://img.shields.io/badge/Express-5.1-green?style=flat-square&logo=express)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-teal?style=flat-square&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.x-yellow?style=flat-square&logo=python)

## 🌟 Features

- **🤖 AI-Powered Sentiment Analysis**: Uses fine-tuned BERT models (ELECTRA) for accurate sentiment classification
- **💬 Conversational Interface**: Natural language chatbot powered by LangChain and Groq Mixtral-8x7b
- **📊 Data Integration**: Fetches and analyzes real-time data from any subreddit using PRAW
- **🎨 Modern UI**: Beautiful, responsive interface built with Next.js, React, and Tailwind CSS
- **📈 Sentiment Breakdown**: Get positive, negative, and neutral sentiment counts with sample quotes
- **💾 Chat History**: Persistent chat sessions with localStorage
- **🚀 Real-time Analysis**: Fast processing with GPU acceleration support

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (Next.js)                     │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Chat UI   │  │  Topic Cards │  │  Sidebar     │        │
│  └────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP POST /chat
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Chat Service (FastAPI + LangChain)          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Groq Mixtral-8x7b LLM + Sentiment Analysis Tool     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP GET /analyze
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         Sentiment Analysis API (FastAPI + BERT)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PRAW Data   │→ │  Fine-tuned  │→ │  Sentiment   │     │
│  │  Scraper     │  │  ESD Model   │  │  Results     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 16.0** - React framework with App Router
- **React 19.2** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS v4** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Radix UI** - Accessible component primitives

### Backend (Server)
- **Express 5.1** - Web framework
- **Prisma** - Database ORM
- **TypeScript** - Type safety
- **CORS** - Cross-origin resource sharing

### AI Services
- **FastAPI** - High-performance Python API framework
- **LangChain** - LLM orchestration framework
- **Groq** - Fast LLM inference (Mixtral-8x7b)
- **Transformers** - BERT model implementation
- **PyTorch** - Deep learning framework
- **PRAW** - Reddit API wrapper

## 📦 Installation

### Prerequisites
- Node.js 20.x or higher
- Python 3.8 or higher
- pnpm (recommended) or npm
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/DSAI-Society-IIIT-Dharwad/229.git
cd 229
```

### 2. Setup Frontend (Client)
```bash
cd client
pnpm install
# or npm install

# Start development server
pnpm dev
```

The frontend will run on `http://localhost:3000`

### 3. Setup Backend (Server)
```bash
cd server
pnpm install
# or npm install

# Generate Prisma Client
npx prisma generate

# Start development server
pnpm dev
```

The backend will run on `http://localhost:6969`

### 4. Setup AI Services

#### Install Python Dependencies
```bash
cd results_sentiment_hackathon_emergency
pip install -r requirements.txt
```

Required packages:
- `fastapi`
- `uvicorn`
- `praw`
- `transformers`
- `torch`
- `langchain`
- `langchain-groq`
- `langchain-community`
- `python-dotenv`

#### Configure Environment Variables

Create a `.env` file in `results_sentiment_hackathon_emergency/`:

```env
# Reddit API Credentials
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=your_app_name/1.0

# Groq API Key (for LLM)
GROQ_API_KEY=your_groq_api_key
```

**Getting API Keys:**
- **Reddit API**: Create an app at https://www.reddit.com/prefs/apps
- **Groq API**: Get a free API key at https://console.groq.com

#### Start Sentiment Analysis API
```bash
cd results_sentiment_hackathon_emergency
python api_service.py
```
Runs on `http://localhost:8000`

#### Start AI Chat Service
```bash
cd results_sentiment_hackathon_emergency
python chat_api_service.py
```
Runs on `http://10.0.15.84:8001` (or configure your IP)

## 🚀 Usage

### Example Queries

1. **"What is the sentiment on r/apple about the iPhone 16?"**
   - Analyzes sentiment from r/apple subreddit about iPhone 16

2. **"What is the sentiment on r/gaming about the PS5 Pro?"**
   - Analyzes gaming community sentiment about PS5 Pro

3. **"What is the sentiment on r/technology about AI?"**
   - Analyzes technology discussions about AI

### Chat Response Format

```
I'll use the sentiment_tool to analyze the sentiment on r/apple about the iPhone 16.

**Sentiment Analysis:**

The tool analyzed 100 comments from r/apple about the iPhone 16. Here's the summary:

* **Positive Sentiment:** 62 comments (62%)
* **Negative Sentiment:** 20 comments (20%)
* **Neutral Sentiment:** 18 comments (18%)

**Some Common Themes:**

* Users love the new camera features
* Some disappointed with battery life
* A few users are neutral about the upgrade
```

## 📁 Project Structure

```
intraIIIT/
├── client/                          # Next.js Frontend
│   ├── app/
│   │   ├── globals.css             # Global styles
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Main chat page
│   ├── components/
│   │   ├── ChatHeader.tsx          # Chat header component
│   │   ├── ChatInput.tsx           # Message input component
│   │   ├── ChatMessages.tsx        # Message display with formatting
│   │   ├── NewChatModal.tsx        # New chat modal dialog
│   │   ├── Sidebar.tsx             # Chat sidebar
│   │   ├── TopicCards.tsx          # Example topic cards
│   │   ├── WelcomeSection.tsx      # Welcome screen
│   │   └── ui/                     # Reusable UI components
│   └── package.json
│
├── server/                          # Express Backend
│   ├── index.ts                    # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   └── migrations/             # Database migrations
│   └── package.json
│
└── results_sentiment_hackathon_emergency/  # AI Services
    ├── api_service.py              # Sentiment analysis API
    ├── chat_api_service.py         # Conversational AI API
    ├── SA.ipynb                    # Model training notebook
    ├── final_fine_tuned_model/     # Fine-tuned BERT model
    └── .env                        # Environment variables
```

## 🔑 Environment Variables

### Client
No environment variables required (API endpoint is hardcoded for now)

### Server
Create a `.env` file in the `server/` directory:
```env
DATABASE_URL="your_database_url"
PORT=6969
```

### AI Services
Create a `.env` file in `results_sentiment_hackathon_emergency/`:
```env
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=your_app_name/1.0
GROQ_API_KEY=your_groq_api_key
```

## 🎯 Model Information

- **Base Model**: `google/electra-small-discriminator`
- **Dataset**: TweetEval Sentiment Dataset
- **Labels**: Negative, Neutral, Positive
- **Training**: Fine-tuned using PyTorch with GPU acceleration
- **Performance**: Fast inference with high accuracy

## 🐛 Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure the AI chat service has CORS enabled:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Prisma Client Not Found
```bash
cd server
npx prisma generate
```

### Reddit API Rate Limiting
Reddit API has rate limits. If you hit them, wait a few minutes before trying again.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is part of DSAI Society, IIIT Dharwad.

## 👥 Team

Developed by the DSAI Society at IIIT Dharwad

## 🔗 Links

- **Repository**: https://github.com/DSAI-Society-IIIT-Dharwad/229
- **Groq Console**: https://console.groq.com
- **Reddit API**: https://www.reddit.com/dev/api

---

Made with ❤️ by DSAI Society, IIIT Dharwad
