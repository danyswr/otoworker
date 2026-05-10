<div align="center">
  <img width="120" src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="Otoworker Logo" />
  <h1 style="margin-top: 20px;">Otoworker</h1>
  <p><strong>An Autonomous AI Agent Workspace with Premium Glassmorphism UI</strong></p>
</div>

<hr />

## 🌟 Overview

**Otoworker** is a next-generation AI workspace designed to orchestrate autonomous agents seamlessly. Combining a sleek, ultra-modern Glassmorphism frontend with a robust, highly concurrent Python backend, it allows users to interact with multiple AI roles (e.g., Data Analysts, Researchers) to automate complex tasks, execute shell commands, and conduct deep research.

## ✨ Features

- 🎨 **Premium UI/UX**: Built with Next.js 15, Tailwind CSS, and Framer Motion. Features a dynamic Glassmorphism design, segmented navigation, and smooth micro-animations.
- 🤖 **Autonomous Agents**: Powered by CrewAI and FastAPI on the backend. Agents can execute actions, perform research, and report back in real-time.
- 🔄 **Multi-Model Support**: Seamlessly switch between **Google Gemini** (default) and **OpenRouter** APIs via the integrated settings panel.
- 💬 **Interactive Chat Interface**: A sticky, fully responsive chat sidebar for assigning tasks, viewing intelligent system thoughts, and observing agent execution.
- ⚡ **High Performance**: Strict API handling, optimized polling, and strict port management ensure 24/7 stability.

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.1.4 (React 19)
- **Styling**: Tailwind CSS, PostCSS, Framer Motion
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **AI Orchestration**: CrewAI, LangChain
- **LLM Integration**: Google GenAI, OpenRouter
- **Server**: Uvicorn

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Valid API Keys for Gemini and/or OpenRouter

### 1. Clone the Repository
```bash
git clone https://github.com/qinleeyan/otoworker.git
cd otoworker
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```
Create a `.env` file in the `backend` directory:
```env
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

Run the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
Open a new terminal session in the project root:
```bash
npm install
```
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the Next.js development server (locked to port 3000):
```bash
npm run dev
```

## 🔒 Security
- **API Keys**: All `.env` and `.env.local` files are ignored by git. Never commit your API keys.
- **Shell Execution**: Ensure you fully trust the agents when utilizing the `execute_shell_command` tool, as it can access your local environment.

## 📄 License
This project is proprietary and confidential. All rights reserved.
