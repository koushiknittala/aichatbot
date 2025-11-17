# MSME ONE – Document-Aware AI Copilot

MSME ONE is a local-first Retrieval-Augmented Generation (RAG) chatbot for Micro, Small and Medium Enterprises. It lets founders upload policy PDFs, chat with AI agents that stay grounded in those documents, manage domain-specific knowledge bases, collect feedback, and even accept multilingual voice notes. Everything runs entirely on your machine using **Flask + React + Ollama + Whisper**—no paid APIs or external data sharing required.

---

## Table of Contents
1. [Key Features](#key-features)
2. [System Architecture](#system-architecture)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Running the App](#running-the-app)
6. [Configuration](#configuration)
7. [Using the Chatbot](#using-the-chatbot)
8. [Admin & Knowledge Management](#admin--knowledge-management)
9. [APIs & Integrations](#apis--integrations)
10. [Troubleshooting & FAQ](#troubleshooting--faq)
11. [Project Layout](#project-layout)

---

## Key Features
- **RAG Chat Experience** – Upload PDFs and ask contextual questions; responses cite the live document context.
- **Multiple AI Agents** – Maintain separate MSME advisors (e.g., GST, exports, HR); each tracks its own training set and model preference.
- **Local LLMs via Ollama** – Choose from `llama3.2`, `llama3`, `llama2`, `mistral`, `phi`, or any custom model listed in `add_custom_model.md`.
- **Speech & Translation** – Accept audio notes in `wav/mp3/m4a/ogg/webm`, transcribe or translate with Whisper and `deep-translator`.
- **Feedback Loop** – Collect “good/bad” votes per response; aggregate stats power continuous fine‑tuning decisions.
- **Admin Command Center** – JWT-secured dashboard for document uploads, model selection, training state, and chat log review.
- **Completely Offline** – No cloud APIs; PDFs, embeddings, logs, and meta-data stay inside `agent_data/` and `knowledge_base/`.

---

## System Architecture
| Layer | Tech | Responsibilities |
| --- | --- | --- |
| Frontend | React (Vite build served by Flask) | User chat UI, admin console, theme context, Axios API client |
| Backend | Flask + Flask-CORS | REST API, JWT auth, PDF ingestion, Whisper transcription, document chunking |
| AI Core | Ollama (LLM) + PyPDF2 + custom chunker | Generates grounded answers using uploaded PDFs + agent knowledge |
| Audio/Language | OpenAI Whisper, `deep-translator` | Speech-to-text, text translation |
| Storage | File system (`uploads/`, `admin_uploads/`, `agent_data/`) | Persistent knowledge base, chat history, admin settings |

---

## Prerequisites
- **OS**: Windows 10+, macOS, or Linux
- **Python**: 3.8+
- **Node.js**: 16+ (needed only to rebuild the React frontend)
- **Ollama**: Installed and running locally → <https://ollama.ai>
- **Disk Space**: ~6 GB for models + PDFs
- **GPU (optional)**: Improves Whisper + LLM inference speed

---

## Installation
```powershell
# 1. Clone or unzip the repo and enter it
cd pdfchatbot(rag)successss

# 2. Python deps
pip install -r requirements.txt

# 3. (Optional) Frontend deps if you need to modify React code
npm install

# 4. Download at least one Ollama model (recommended: llama3.2)
ollama pull llama3.2
```

> Tip: `download_model.bat` automates the Ollama pull on Windows.

---

## Running the App
### The fast way (Windows)
```powershell
start.bat
```
This launches the Flask API (which also serves the production React build under `build/`). Browse to `http://localhost:5000`.

### Manual steps
```powershell
# Terminal 1 – backend
python app.py

# Terminal 2 – (optional) React dev server
npm start   # served at http://localhost:3000, proxy requests to Flask
```
The Flask server listens on `0.0.0.0:5000` by default.

---

## Configuration
| Variable | Default | Purpose |
| --- | --- | --- |
| `SECRET_KEY` | hard-coded string in `app.py` | JWT signing key. **Change for production.** |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Override if Ollama runs remotely or on another port. |
| `OLLAMA_MODEL` | `llama3.2` | Fallback model when admin hasn’t selected one. |

Set these before starting the server:
```powershell
$env:SECRET_KEY = "replace-me"
$env:OLLAMA_MODEL = "llama3"
python app.py
```

---

## Using the Chatbot
1. **Open** `http://localhost:5000`.
2. **Upload** PDFs (drag/drop or folder select). Files live in `uploads/` and parsed into `knowledge_base/`.
3. **Ask Questions**. Prompts are combined with the most recent document chunks before hitting Ollama.
4. **Transcribe or Translate Audio** (optional). The `/api/transcribe` and `/api/translate` endpoints power the “voice note” UI.
5. **Collect Feedback**. Each response stores user ratings and the model used, accessible in admin stats.

Fallback logic (`get_simple_response`) ensures the bot still answers common MSME questions if Ollama is unavailable.

---

## Admin & Knowledge Management
- **Dashboard URL**: `http://localhost:5000/admin/login`
- **Default creds**: `admin1 / admin1234` (edit `ADMIN_CREDENTIALS` in `app.py`)
- **Capabilities**:
  - Upload single PDFs or entire folders per agent (`/api/admin/upload`)
  - Trigger training status updates (`/api/admin/train`)
  - Delete obsolete docs (`/api/admin/documents/<id>`)
  - Change default model + available model list (`/api/admin/settings`)
  - Inspect chat logs and feedback statistics (`/api/admin/logs`, `/api/admin/logs/stats`)

Data lives under `agent_data/`:
- `agents.json` → agent roster + training flags
- `admin_settings.json` → model configuration
- `chat_logs.json` → complete conversation history with timestamps + feedback labels

---

## APIs & Integrations
The key endpoints exposed by `app.py`:

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/upload` | Upload a single PDF for the current chat session |
| `POST` | `/api/chat` | Send a prompt (`message`, `agent_id`, optional `model` & `session_id`) |
| `POST` | `/api/transcribe` | Audio transcription or translation using Whisper |
| `POST` | `/api/translate` | Text translation via `deep-translator` |
| `GET` | `/api/agents` | Public list of available agents |
| `GET` | `/api/models` | Installed or configured Ollama models |
| `POST` | `/api/feedback` | Persist “good/bad” feedback on a response |
| `POST` | `/api/admin/login` | Obtain JWT for admin operations |
| `GET/POST/DELETE` | `/api/admin/*` | Protected endpoints for uploads, training, settings, logs |

All admin routes require a `Bearer <token>` header issued by `/api/admin/login`.

---

## Troubleshooting & FAQ
- **Blank UI or 404s**  
  - Ensure `build/index.html` exists (`npm run build` if you modified the frontend).  
  - Hard refresh (`Ctrl + Shift + R`).  
  - Check Flask logs for missing static files.

- **Ollama errors / timeouts**  
  - Start Ollama: `ollama serve`.  
  - Verify models: `ollama list`.  
  - Reduce load by switching to `phi` or `llama3.2`.  
  - Backend falls back to `get_simple_response` while offline.

- **Whisper slow or fails**  
  - First call downloads model weights; give it time.  
  - Ensure `ffmpeg` is installed for some audio formats.  
  - Delete stale files from `audio_temp/` if disk fills up.
- **JWT invalid after restart**  
  - Tokens expire in 24 hours. Log in again or align system clock.

- **Customize models**  
  - See `ADD_CUSTOM_MODEL.md` and `CUSTOM_MODELS.md` for registering additional Ollama checkpoints and UI labels.

---

## Project Layout
```
├── app.py                # Flask API + RAG + admin logic
├── requirements.txt      # Python deps (Flask, Whisper, PyPDF2, etc.)
├── package.json          # React dependencies and scripts
├── src/                  # React source (chat UI, admin panel, pages)
├── build/                # Production React bundle served by Flask
├── uploads/              # User PDFs uploaded from chat UI
├── admin_uploads/        # Admin-managed knowledge base documents
├── knowledge_base/       # JSON cache of parsed PDFs
├── agent_data/           # Agents, chat logs, admin settings (JSON files)
├── audio_temp/           # Temporary audio uploads for Whisper
├── start.bat             # Convenience launcher on Windows
└── download_model.bat    # Script to pull Ollama models
```

---

**Free • Private • No API Keys • 100% Local MSME copilot**
