# 🚇 CUE Tunnel API

**Local OpenAI-compatible proxy** that bridges the [CUE](https://github.com/nicepkg/cue) app to your **Antigravity subscription** — no separate API keys needed.

## How It Works

```
CUE App  →  localhost:5678  →  Your Antigravity Subscription
         (OpenAI format)    (CLI or SDK bridge)
```

CUE's **Custom provider** sends standard OpenAI `POST /v1/chat/completions` requests. This tunnel intercepts them and routes through your Antigravity subscription using either:

- **Mode A (CLI)**: Pipes through `agy --print` — always available, no setup
- **Mode B (SDK)**: Uses the Antigravity Python SDK — faster, better streaming

## Quick Start

### 1. Start the Tunnel

```bash
# Auto-detect best mode (SDK if available, CLI fallback)
npm start

# Or force a specific mode
npm run start:cli    # Force CLI mode
npm run start:sdk    # Force SDK mode

# Or just double-click one of the launcher files:
Option-A-CLI.bat     # Launch Option A (CLI mode - works immediately)
Option-B-SDK.bat     # Launch Option B (SDK mode - faster)
start-tunnel.bat     # Auto-detect mode
```

### 2. Configure CUE

Open CUE → Settings (gear icon):

| Setting | Value |
|---------|-------|
| **Provider** | `Custom` |
| **Base URL** | `http://localhost:5678/v1` |
| **Fast Model** | `antigravity` |
| **Smart Model** | `antigravity` |
| **API Key** | *(leave empty)* |

### 3. Use CUE Normally!

All features work through the tunnel:
- 💬 Chat & follow-up conversations
- 🎤 Audio transcription (Whisper runs locally in CUE)
- 📋 AI Rules (injected into system prompt by CUE)
- 🧠 Smart/Fast toggle
- 📜 History (stored locally by CUE)
- 📸 Screenshot analysis

## Install SDK Mode (Optional, Recommended)

For lower latency and proper streaming:

```bash
pip install google-antigravity
```

Then restart the tunnel — it will auto-detect and use SDK mode.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /v1/chat/completions` | OpenAI-compatible chat (CUE calls this) |
| `GET /v1/models` | List available models |
| `GET /v1/tunnel/status` | Health check & current mode |
| `POST /v1/tunnel/mode` | Switch between `cli` and `sdk` mode |
| **Local File Intelligence** | |
| `POST /v1/context/load-file` | Load single local file into AI context (`{ "path": "..." }`) |
| `POST /v1/context/load-folder` | Scan folder & load all supported files (`{ "path": "...", "recursive": true }`) |
| `GET /v1/context/list` | List all loaded files & token budget stats |
| `GET /v1/context/browse?path=...` | Browse files in a directory without loading |
| `DELETE /v1/context/remove` | Remove single file from context (`{ "path": "..." }`) |
| `DELETE /v1/context/clear` | Clear all loaded file context |
| **Knowledge Feed System** | |
| `POST /v1/knowledge/feed` | Feed persistent knowledge (`{ "title": "...", "content": "...", "category": "rules" }`) |
| `POST /v1/knowledge/import-file` | Import knowledge from local file into persistent base |
| `GET /v1/knowledge/list` | List all persistent knowledge entries |
| `PUT /v1/knowledge/update` | Update existing knowledge entry |
| `DELETE /v1/knowledge/remove` | Delete knowledge entry |
| `DELETE /v1/knowledge/clear` | Clear all persistent knowledge |

## 🗂️ Local File Intelligence & 📚 Knowledge Feed

Your CUE chatbot can now read and analyze any file on your computer and learn from fed data:
- **Local File Reading**: Supports 30+ code extensions, Markdown, plain text, PDF (`pdf-parse`), Word (`mammoth`), Excel (`xlsx`), and Images via OCR (`tesseract.js`).
- **Read-Only Safety**: All operations are strictly read-only.
- **Context Injection**: Loaded files and knowledge entries are automatically injected into the AI system prompt before forwarding to Antigravity.
- **Persistent Knowledge**: Fed knowledge survives server restarts and is stored in `data/knowledge.json`.

## Switching Modes at Runtime

```bash
# Switch to CLI mode
curl -X POST http://localhost:5678/v1/tunnel/mode -H "Content-Type: application/json" -d "{\"mode\":\"cli\"}"

# Switch to SDK mode
curl -X POST http://localhost:5678/v1/tunnel/mode -H "Content-Type: application/json" -d "{\"mode\":\"sdk\"}"
```

## Command-Line Options

```bash
node server.js [options]

  --port=5678       Custom port (default: 5678)
  --mode=auto       Force mode: auto, cli, or sdk (default: auto)
  --agy-path=agy    Custom path to agy executable
```

## Project Structure
 
```
├── Option-A-CLI.bat   # 1-click launcher for Option A (CLI mode)
├── Option-B-SDK.bat   # 1-click launcher for Option B (SDK mode)
├── start-tunnel.bat   # Universal startup script (auto-detects mode)
├── kill-port.bat      # 1-click port killer (frees port 5678 if busy)
├── server.js          # Express proxy server with Context Injection & 12 new endpoints
├── file-processor.js  # Local file intelligence engine (30+ file types, PDF, DOCX, XLSX, OCR)
├── knowledge-store.js # Persistent local knowledge base manager (JSON storage)
├── sdk_bridge.py      # Python SDK bridge (Option B)
├── data/              # Persistent knowledge base directory
│   └── knowledge.json # Persistent knowledge store
├── test.js            # Standard integration test suite
├── test-stream.js     # SSE streaming validation test
├── test-context.js    # Unit & integration test suite for File Intelligence & Knowledge
├── package.json       # Node dependencies and scripts
├── DOCUMENTATION.md   # Comprehensive user & technical documentation
└── README.md          # Quick reference guide
```

