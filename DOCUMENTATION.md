# 🚇 CUE Tunnel API — Complete Setup & Usage Guide

> **What this does:** Runs a local server on your laptop that lets the CUE app use your Antigravity subscription as its AI brain — no separate API keys needed.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (30 seconds)](#quick-start-30-seconds)
- [Option A — CLI Mode](#option-a--cli-mode)
- [Option B — SDK Mode](#option-b--sdk-mode)
- [Configuring CUE](#configuring-cue)
- [What Happens When You Start Running (Under the Hood)](#what-happens-when-you-start-running-under-the-hood)
- [Purpose of Every File & Folder](#purpose-of-every-file--folder)
- [Verify It Works](#verify-it-works)
- [Daily Usage Workflow](#daily-usage-workflow)
- [Switching Between Modes](#switching-between-modes)
- [Troubleshooting](#troubleshooting)
- [How It Works (Technical Architecture)](#how-it-works-technical-architecture)
- [Local File Intelligence](#local-file-intelligence)
- [Knowledge Feed System](#knowledge-feed-system)


---

## Prerequisites

Before running, make sure you have:

| Requirement | Check Command | Expected |
|-------------|--------------|----------|
| **Node.js** (v18+) | `node --version` | `v22.19.0` or higher |
| **npm** | `npm --version` | `10.x` or higher |
| **Antigravity CLI** | `agy --version` | `1.2.5` or higher |
| **Active Antigravity subscription** | `agy models` | Shows available models |

**Optional (for Option B only):**

| Requirement | Check Command | Expected |
|-------------|--------------|----------|
| **Python** (3.10+) | `python --version` | `3.10` or higher |
| **Antigravity SDK** | `pip show google-antigravity` | Shows package info |

---

## Quick Start (30 seconds)

### Step 1: Install dependencies (first time only)

Open a terminal in the project folder and run:

```bash
npm install
```

### Step 2: Start the tunnel

**Double-click one of these files:**

| File | What It Does |
|------|-------------|
| `Option-A-CLI.bat` | ⌨️ Starts using Antigravity CLI (always works) |
| `Option-B-SDK.bat` | 🐍 Starts using Python SDK (faster, needs SDK installed) |
| `start-tunnel.bat` | 🔄 Auto-detects best available mode |

**Or run from terminal:**

```bash
npm start
```

### Step 3: Open CUE and chat!

CUE is already configured to use the tunnel. Just open it and start chatting.

---

## Option A — CLI Mode

**Best for:** Getting started immediately. No extra installation needed.

### How to Run

**Method 1: Double-click**
```
📁 Create Tunnel API for CUE
  └── 🖱️ Double-click → Option-A-CLI.bat
```

**Method 2: Terminal**
```bash
cd "C:\Users\provu\Desktop\Create Tunnel API for CUE"
node server.js --mode=cli
```

**Method 3: npm script**
```bash
npm run start:cli
```

### What You'll See

```
╔══════════════════════════════════════════════╗
║   CUE Tunnel API - OPTION A (CLI Mode)      ║
║   Uses: agy --print (Antigravity CLI)        ║
╚══════════════════════════════════════════════╝

  Starting server on http://localhost:5678 ...
```

### Characteristics

- ✅ Works immediately — no extra setup
- ✅ Uses your existing `agy` CLI
- ⚠️ ~30-60 second response time (CLI boot overhead per request)
- ⚠️ Each request spawns a new `agy` process

---

## Option B — SDK Mode

**Best for:** Faster responses and better streaming. Requires one-time Python SDK installation.

### One-Time Setup

```bash
pip install google-antigravity
```

Verify installation:
```bash
python -c "from google.antigravity import Agent; print('SDK ready!')"
```

### How to Run

**Method 1: Double-click**
```
📁 Create Tunnel API for CUE
  └── 🖱️ Double-click → Option-B-SDK.bat
```

> The batch file will automatically check if the SDK is installed and show an error with instructions if it's not.

**Method 2: Terminal**
```bash
cd "C:\Users\provu\Desktop\Create Tunnel API for CUE"
node server.js --mode=sdk
```

**Method 3: npm script**
```bash
npm run start:sdk
```

### Characteristics

- ✅ Faster responses than CLI mode
- ✅ Proper streaming support
- ✅ Lower overhead per request
- ⚠️ Requires `pip install google-antigravity` first

---

## Configuring CUE

> **Already done!** CUE was automatically configured during setup. If you need to reconfigure manually, follow these steps:

### Step 1: Open CUE Settings

Launch CUE → Click the **⚙️ gear icon** (Settings)

### Step 2: Set Provider to Custom

In the **Provider** dropdown, select **`Custom`**

### Step 3: Enter Base URL

```
http://localhost:5678/v1
```

### Step 4: Set Model Names

| Field | Value |
|-------|-------|
| **Fast Model** | `antigravity` |
| **Smart Model** | `antigravity` |

### Step 5: API Key

Leave the API Key field **empty** (or type anything — it's ignored).

### Settings Summary

```
Provider:     Custom
Base URL:     http://localhost:5678/v1
Fast Model:   antigravity
Smart Model:  antigravity
API Key:      (empty)
```

---

## What Happens When You Start Running (Under the Hood)

When you double-click [Option-A-CLI.bat](file:///c:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/Option-A-CLI.bat) (or [Option-B-SDK.bat](file:///c:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/Option-B-SDK.bat)), here is the exact step-by-step sequence of events that occurs across Windows, Node.js, your network, and Antigravity:

```
[Double-Click .bat]
       │
       ▼
1. Windows Shell (cmd.exe)
   ├── Sets window title & terminal color (Green for CLI / Cyan for SDK)
   ├── (Option B only) Runs pre-check: python -c "from google.antigravity import Agent"
   └── Spawns Node.js: node server.js --mode=cli (or --mode=sdk)
       │
       ▼
2. Node.js Runtime & Express Server Startup
   ├── Loads express framework & parses CLI flags (--mode, --port, --agy-path)
   ├── Configures 50MB body parsers (JSON & urlencoded) for screenshots/multimodal
   ├── Injects global CORS headers (Access-Control-Allow-Origin: *)
   └── Binds TCP port 5678 on 0.0.0.0 (localhost)
       │
       ▼
3. Server Ready Banner Displayed
   ├── Prints green/blue ASCII box in the terminal window
   ├── Confirms active mode (CLI or SDK) and Base URL (http://localhost:5678)
   └── Sits quietly in event loop waiting for incoming HTTP requests (~30MB RAM)
       │
       ▼
4. You Interact with CUE App
   ├── You type a message, speak (Whisper voice-to-text), or click Smart/Fast
   ├── CUE automatically injects your AI Rules into system instructions
   └── CUE issues HTTP POST http://localhost:5678/v1/chat/completions
       │
       ▼
5. Inside the Tunnel Server (server.js)
   ├── Parses incoming OpenAI JSON payload (messages, model, stream=true)
   │
   ├── [IF OPTION A - CLI MODE]:
   │   ├── Formats conversation into structured text prompt
   │   ├── Spawns OS child process: agy --print "<prompt>"
   │   ├── agy CLI authenticates via your existing laptop Antigravity session
   │   └── Intercepts stdout text chunks in real-time
   │
   └── [IF OPTION B - SDK MODE]:
       ├── Spawns child process: python sdk_bridge.py --stream
       ├── Pipes OpenAI messages JSON array to Python stdin
       ├── Python imports google.antigravity and runs Agent(config).chat()
       └── Intercepts NDJSON token events {"type":"token","content":"..."} on stdout
       │
       ▼
6. Server-Sent Events (SSE) Streaming Back to CUE
   ├── Tunnel packages text tokens into OpenAI SSE chunk format:
   │   data: {"id":"chatcmpl-...","object":"chat.completion.chunk","choices":[{"delta":{"content":"..."}}]}
   ├── Flushes chunks instantly over open HTTP socket to CUE
   ├── CUE renders each token live on your screen (typing effect)
   └── When complete, tunnel sends:
       data: {"choices":[{"delta":{},"finish_reason":"stop"}]}
       data: [DONE]
       │
       ▼
7. Teardown / Exit (When you are done)
   └── Closing terminal window or pressing Ctrl+C gracefully terminates node.exe, releases port 5678, and kills any running agy/python child processes.
```

### Detailed Breakdown of Each Phase

#### Phase 1: Process Startup & Windows Execution
- **What process starts first?** Windows launches `cmd.exe` executing your chosen `.bat` file.
- **Window appearance**: The terminal window sets its title and text color:
  - `Option-A-CLI.bat` sets **Color 0A** (bright green).
  - `Option-B-SDK.bat` sets **Color 0B** (bright cyan/blue).
- **Option B pre-flight check**: Before starting the server, `Option-B-SDK.bat` runs `python -c "from google.antigravity import Agent" 2>nul`.
  - If the SDK is missing: The batch script changes the console to **Color 0C** (red) and prints an error box telling you to run `pip install google-antigravity`.
  - If installed: It proceeds immediately to spawn Node.

#### Phase 2: Express Server & Network Port Binding
- **Node.js boots**: Windows runs `node server.js --mode=...`.
- **Port Allocation**: The server opens a TCP socket on port `5678`.
- **CORS Configuration**: It applies `Access-Control-Allow-Origin: *` and `Access-Control-Allow-Headers: *` middleware so Electron apps (like CUE) or browser scripts can send requests without being blocked by cross-origin security policies.
- **Payload Capacity**: Configured with a 50MB request size limit (`express.json({ limit: '50mb' })`) so CUE's screenshot captures and base64 images can be processed without payload-too-large errors.
- **Readiness**: The ASCII banner is printed. The server is now actively listening for traffic.

#### Phase 3: Handling CUE Features Under the Hood
When you interact with CUE, here is how each feature flows through the tunnel:
- **Typing in Chat**: CUE sends an array of message objects: `[{"role": "user", "content": "..."}]`.
- **Voice / Audio Button**: When you speak into the microphone, CUE's internal Whisper AI transcribes your voice to text *locally* on your machine. CUE then sends the resulting text through the tunnel as a standard user message.
- **AI Rules**: Any prompt rules you configure in CUE are prepended to the request as a `{"role": "system", "content": "..."}` message. The tunnel server extracts this and feeds it to Antigravity as top-level system instructions.
- **Smart vs Fast Toggle**:
  - In *Fast* mode: CUE sets `max_tokens: 700` in the JSON body.
  - In *Smart* mode: CUE sets `max_tokens: 1400` in the JSON body.
  - The tunnel receives and honors this token limit.
- **Follow-up / Recap / History**: CUE maintains previous conversation turns in local storage and includes previous `user` and `assistant` messages in the `messages` array for contextual continuity.

#### Phase 4: AI Model Invocation (CLI vs SDK)
- **Option A (CLI Mode)**:
  - Node combines system instructions and message history into a clear multi-turn prompt string.
  - Node calls `child_process.spawn('agy', ['--print', prompt])`.
  - The `agy.exe` process starts up, logs into your Antigravity subscription credentials stored locally in your user profile, queries the model, and outputs text to `stdout`.
  - *Note on latency*: Starting `agy.exe` from scratch takes ~30–45 seconds of startup initialization before text begins streaming.
- **Option B (SDK Mode)**:
  - Node calls `child_process.spawn('python', ['sdk_bridge.py', '--stream'])`.
  - Node writes the raw JSON messages array into Python's `stdin`.
  - Python's `google.antigravity.Agent` maintains an async connection with the Antigravity backend.
  - As tokens arrive from Antigravity, Python prints NDJSON lines to `stdout`.
  - *Note on latency*: Once initialized, streaming begins much faster with lower overhead per turn.

#### Phase 5: Stream Formatting (OpenAI SSE Protocol)
- CUE expects OpenAI-standard Server-Sent Events (`Content-Type: text/event-stream`).
- The tunnel converts raw incoming text into chunks matching the exact format:
  ```
  data: {"id":"chatcmpl-xyz","object":"chat.completion.chunk","choices":[{"delta":{"content":"Hello"}}]}

  data: {"id":"chatcmpl-xyz","object":"chat.completion.chunk","choices":[{"delta":{"content":" world"}}]}

  data: {"id":"chatcmpl-xyz","object":"chat.completion.chunk","choices":[{"delta":{},"finish_reason":"stop"}]}

  data: [DONE]
  ```
- CUE's Electron renderer listens on the stream and displays the text token by token on your screen.

#### Phase 6: Shutdown & Cleanup
- When you close the terminal or hit `Ctrl+C`:
  - Node catches `SIGINT` / process termination.
  - The TCP port `5678` is immediately freed.
  - Any child CLI or Python processes are terminated.

---

## Verify It Works

### Quick Check (Browser)

Open this URL in your browser:

```
http://localhost:5678/v1/tunnel/status
```

You should see:
```json
{
  "status": "running",
  "mode": "cli",
  "port": 5678
}
```

### Full Test Suite

Run in terminal:

```bash
cd "C:\Users\provu\Desktop\Create Tunnel API for CUE"
node test.js
```

### Streaming Test

```bash
node test-stream.js
```

---

## Daily Usage Workflow

### Every Time You Want to Use CUE:

```
1. Double-click  →  Option-A-CLI.bat  (or Option-B-SDK.bat)
2. Wait for      →  "Server running on http://localhost:5678"
3. Open CUE      →  Start chatting!
4. When done     →  Close the terminal window (Ctrl+C or X button)
```

### Important Rules

- ⚡ **Start the tunnel BEFORE opening CUE** — CUE needs the server running to send requests
- 🔒 **Keep the terminal window open** — closing it stops the tunnel
- 🔄 **After PC restart** — run the bat file again (the tunnel doesn't auto-start)
- 💡 **One tunnel at a time** — don't run both Option A and B simultaneously

---

## Switching Between Modes

### Before Starting (pick one bat file)

| I want... | Double-click |
|-----------|-------------|
| CLI mode (always works) | `Option-A-CLI.bat` |
| SDK mode (faster) | `Option-B-SDK.bat` |
| Auto-detect best | `start-tunnel.bat` |

### While Server Is Running (no restart needed)

Switch to CLI mode:
```bash
curl -X POST http://localhost:5678/v1/tunnel/mode -H "Content-Type: application/json" -d "{\"mode\":\"cli\"}"
```

Switch to SDK mode:
```bash
curl -X POST http://localhost:5678/v1/tunnel/mode -H "Content-Type: application/json" -d "{\"mode\":\"sdk\"}"
```

Check current mode:
```bash
curl http://localhost:5678/v1/tunnel/status
```

---

## Troubleshooting

### "CUE says: Set a Base URL for the Custom provider"

**Cause:** CUE settings were reset or not saved.

**Fix:** Open CUE Settings → Set provider to `Custom` → Set Base URL to `http://localhost:5678/v1`

---

### "CUE shows an error or no response"

**Cause:** Tunnel server is not running.

**Fix:**
1. Check if the terminal with the tunnel is open
2. If not, double-click `Option-A-CLI.bat` to start it
3. Verify: open `http://localhost:5678/v1/tunnel/status` in browser

---

### "Port 5678 is already in use"

**Cause:** Another instance of the tunnel (or another app) is using port 5678.

**Fix (1-Click):**
Double-click [**kill-port.bat**](file:///c:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/kill-port.bat) — it automatically detects any process on port 5678 and terminates it cleanly!

**Manual Fix (Command line):**
```bash
# Double-click kill-port.bat, or run:
kill-port.bat

# Or manually via netstat/taskkill:
netstat -ano | findstr :5678
taskkill /PID <PID> /F
```
node server.js --port=5679
```
> If you change the port, update CUE's Base URL to `http://localhost:5679/v1`

---

### "Option-B-SDK.bat shows SDK not installed"

**Cause:** Antigravity Python SDK is not installed.

**Fix:**
```bash
pip install google-antigravity
```
Then double-click `Option-B-SDK.bat` again.

---

### "Responses are slow (30-60 seconds)"

**Cause:** CLI mode (Option A) has overhead from spawning a new `agy` process per request.

**Fix:** Switch to SDK mode (Option B) for faster responses:
```bash
pip install google-antigravity
# Then use Option-B-SDK.bat instead
```

---

### "agy is not recognized as a command"

**Cause:** Antigravity CLI is not installed or not in PATH.

**Fix:**
1. Verify: `where agy` should show the path
2. If not found, reinstall Antigravity or add its path manually
3. Default location: `C:\Users\provu\AppData\Local\agy\bin\agy.exe`

---

### Switching Back to Gemini

If you want to stop using the tunnel and go back to the Gemini API:

1. Open CUE Settings
2. Change Provider from `Custom` to `Gemini`
3. Your Gemini API key is still saved — it will work immediately

---

## Purpose of Every File & Folder

Here is the complete map of every file and folder in the `Create Tunnel API for CUE` directory, explaining what it does, why it exists, and whether you should touch it.

```
📁 Create Tunnel API for CUE/
│
├── 🖱️ Option-A-CLI.bat          ← Double-click: Launch CLI mode (Green terminal)
├── 🖱️ Option-B-SDK.bat          ← Double-click: Launch SDK mode (Cyan terminal)
├── 🖱️ start-tunnel.bat          ← Double-click: Auto-detect & launch best mode
├── 🛑 kill-port.bat              ← Double-click: Instantly free port 5678 if busy
│
├── ⚙️ server.js                 ← Core Express HTTP proxy server (Port 5678)
├── 🐍 sdk_bridge.py             ← Python SDK bridge script for Option B
│
├── 🧪 test.js                   ← Quick end-to-end integration test suite
├── 🧪 test-stream.js            ← In-depth SSE streaming format validator
│
├── 📦 package.json              ← Node.js package manifest & npm scripts
├── 🔒 package-lock.json         ← Exact dependency lockfile
├── 📁 node_modules/             ← Installed npm libraries (Express & dependencies)
│
├── 📖 DOCUMENTATION.md          ← Complete user manual & architecture guide
├── 📖 README.md                 ← Fast reference guide
└── 📑 tunnel_api_proposal.md    ← Original research & reverse-engineering notes
```

### Quick Reference Table

| File / Folder | Type | Role | When to Use / Touch |
|---|---|---|---|
| [**Option-A-CLI.bat**](file:///c:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/Option-A-CLI.bat) | Batch Script | 1-Click launcher for CLI mode | **Daily use**: Double-click to start Option A (works immediately) |
| [**Option-B-SDK.bat**](file:///c:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/Option-B-SDK.bat) | Batch Script | 1-Click launcher for SDK mode | **Daily use**: Double-click to start Option B (faster responses) |
| [**start-tunnel.bat**](file:///c:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/start-tunnel.bat) | Batch Script | Auto-detecting launcher | Use if you want auto-fallback or custom command line arguments |
| [**kill-port.bat**](file:///c:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/kill-port.bat) | Batch Script | 1-Click port release tool | Double-click whenever port 5678 is in use or locked |
| [**server.js**](file:///c:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/server.js) | Node.js | Core proxy server (port 5678) | **Core engine**: Never delete. Translates CUE OpenAI requests to Antigravity |
| [**sdk_bridge.py**](file:///c:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/sdk_bridge.py) | Python 3 | SDK integration bridge | **Option B engine**: Interfaces with `google.antigravity` Python SDK |
| [**test.js**](file:///c:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/test.js) | Node.js | Integration test suite | Run `node test.js` to verify server health, models, and completions |
| [**test-stream.js**](file:///c:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/test-stream.js) | Node.js | SSE streaming validator | Run `node test-stream.js` to test strict token-by-token streaming |
| [**package.json**](file:///c:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/package.json) | JSON | Node project configuration | Defines dependencies (`express`) and npm commands (`npm start`, etc.) |
| [**package-lock.json**](file:///c:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/package-lock.json) | JSON | Dependency lockfile | Auto-generated by npm. Do not edit manually |
| **`node_modules/`** | Directory | Third-party packages | Contains Express.js and its libraries. Rebuilt via `npm install` |
| [**DOCUMENTATION.md**](file:///c:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/DOCUMENTATION.md) | Markdown | Full operations manual | Read whenever you need guidance, troubleshooting, or technical details |
| [**README.md**](file:///c:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/README.md) | Markdown | Project overview | Quick overview and summary of commands |
| [**tunnel_api_proposal.md**](file:///c:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/tunnel_api_proposal.md) | Markdown | Historical design spec | Analysis of CUE's Electron internals and initial design proposal |

---

### Detailed Breakdown of Every File

#### 1. `Option-A-CLI.bat`
- **What it is**: A Windows batch file launcher configured for Option A.
- **What it does**:
  1. Opens a dedicated terminal window with a custom title and **Green color (`color 0A`)**.
  2. Runs `node server.js --mode=cli`.
- **Why it matters**: It is your plug-and-play button. Because you already have Antigravity CLI installed on your laptop, double-clicking this file works instantly with zero setup.

#### 2. `Option-B-SDK.bat`
- **What it is**: A Windows batch file launcher configured for Option B.
- **What it does**:
  1. Opens a dedicated terminal window with a **Cyan/Blue color (`color 0B`)**.
  2. Runs a safety pre-flight check: `python -c "from google.antigravity import Agent; print('  SDK found!')"`.
  3. If Python or the SDK is missing, it turns the window **Red (`color 0C`)** and shows a clean instruction banner telling you to run `pip install google-antigravity`.
  4. If the SDK is installed, it runs `node server.js --mode=sdk`.
- **Why it matters**: Gives you a fast, reliable launcher for the high-speed Python SDK mode without guessing whether the environment is ready.

#### 3. `start-tunnel.bat`
- **What it is**: The universal launcher batch file.
- **What it does**: Runs `node server.js %*`. It passes any command-line arguments directly to Node.js and allows `server.js` to automatically detect whether the Python SDK is installed.
- **Why it matters**: Useful if you want automatic fallback or want to pass custom flags like `--port=5679`.

#### 4. `server.js`
- **What it is**: The core Express.js web server (570 lines of pure Node.js).
- **What it does**:
  - Starts an HTTP listener on port `5678`.
  - Exposes standard OpenAI endpoints: `POST /v1/chat/completions` and `GET /v1/models`.
  - Exposes tunnel management endpoints: `GET /v1/tunnel/status` and `POST /v1/tunnel/mode`.
  - In Option A: Converts JSON messages to prompt text, spawns `agy --print`, and transforms stdout into OpenAI SSE format chunks.
  - In Option B: Spawns `sdk_bridge.py`, feeds messages via stdin, and streams tokens to CUE.
  - Applies global CORS headers so Electron cross-origin requests never get blocked.
- **Why it matters**: Without `server.js`, CUE cannot talk to Antigravity. It is the translator between CUE's OpenAI format and your Antigravity subscription.

#### 5. `sdk_bridge.py`
- **What it is**: An asynchronous Python 3 script using `asyncio` and `google.antigravity`.
- **What it does**:
  - Reads OpenAI-formatted message JSON from standard input (`sys.stdin`).
  - Instantiates `LocalAgentConfig` with system prompt instructions and capabilities.
  - Connects to the Antigravity Agent: `async with Agent(config) as agent:`.
  - Streams tokens as newline-delimited JSON (NDJSON) lines: `{"type": "token", "content": "..."}`.
- **Why it matters**: Provides direct access to the Antigravity Python SDK for lower latency and smoother streaming.

#### 6. `test.js`
- **What it is**: An automated JavaScript test runner.
- **What it does**:
  - Runs 4 sequential checks against `http://localhost:5678`:
    1. Health check (`/v1/tunnel/status`)
    2. Model listing (`/v1/models`)
    3. Non-streaming chat completion
    4. Streaming chat completion
- **Why it matters**: Lets you verify that the entire tunnel pipeline is operating properly in just a few seconds.

#### 7. `test-stream.js`
- **What it is**: A dedicated deep-verification script for Server-Sent Events.
- **What it does**:
  - Sends a streaming completion request to the tunnel.
  - Verifies HTTP response headers (`Content-Type: text/event-stream`, `Access-Control-Allow-Origin: *`).
  - Reads raw chunks from the network reader, counts total SSE events, validates each JSON chunk structure, confirms presence of `delta.content`, checks `finish_reason: "stop"`, and ensures the stream terminates with `data: [DONE]`.
- **Why it matters**: Confirms that CUE will receive standard-compliant streaming tokens without glitching.

#### 8. `package.json`
- **What it is**: Standard Node.js project manifest.
- **What it does**: Declares `express` as a dependency and registers convenience scripts:
  - `npm start` → Starts auto mode
  - `npm run start:cli` → Starts Option A
  - `npm run start:sdk` → Starts Option B
  - `npm test` → Runs `test.js`
  - `npm run install-sdk` → Runs `pip install google-antigravity`
- **Why it matters**: Allows Node package managers to install dependencies and run predefined shortcuts.

#### 9. `package-lock.json`
- **What it is**: Auto-generated dependency tree snapshot.
- **What it does**: Locks the exact cryptographic hashes and version numbers of Express and all of its sub-packages.
- **Why it matters**: Guarantees identical installations if run on another computer.

#### 10. `node_modules/`
- **What it is**: The directory containing downloaded npm packages.
- **What it does**: Holds the code for `express`, `body-parser`, `qs`, and other required libraries.
- **Why it matters**: Node.js requires this directory to load third-party modules at runtime.

#### 11. `DOCUMENTATION.md`
- **What it is**: The comprehensive manual for this project.
- **What it does**: Documents setup instructions, daily usage, architectural diagrams, troubleshooting tips, under-the-hood lifecycle, and file reference.
- **Why it matters**: The single source of truth for understanding and operating the tunnel.

#### 12. `README.md`
- **What it is**: High-level repository overview.
- **What it does**: Provides a quick summary of the project, quick start steps, and essential links.

#### 13. `tunnel_api_proposal.md`
- **What it is**: The initial research and design proposal.
- **What it does**: Details how CUE v0.2.2 was analyzed from its Electron package, documenting its 8 supported LLM providers and showing how the "Custom" provider was chosen to bridge to Antigravity without modifying CUE's code.

---

## How It Works (Technical Architecture)

### Architecture

```
┌──────────────┐     POST /v1/chat/completions     ┌──────────────────┐
│              │  ─────────────────────────────────→ │                  │
│   CUE App    │     (OpenAI-compatible JSON)       │  Tunnel Server   │
│  (Electron)  │                                     │  localhost:5678   │
│              │  ←───────────────────────────────── │                  │
└──────────────┘     SSE stream / JSON response      └────────┬─────────┘
                                                              │
                                                    ┌─────────┴─────────┐
                                                    │                   │
                                              ┌─────┴─────┐     ┌──────┴──────┐
                                              │  Option A  │     │  Option B   │
                                              │  agy CLI   │     │ Python SDK  │
                                              │  --print   │     │ Agent()     │
                                              └─────┬──────┘     └──────┬──────┘
                                                    │                   │
                                                    └─────────┬─────────┘
                                                              │
                                                    ┌─────────┴─────────┐
                                                    │   Your Antigravity │
                                                    │   Subscription     │
                                                    └───────────────────┘
```

### Request Flow

1. **CUE sends** a standard OpenAI chat completion request to `http://localhost:5678/v1/chat/completions`
2. **Tunnel receives** the request, extracts `messages`, `model`, `stream`, and `max_tokens`
3. **Option A (CLI):** Converts messages to a prompt string → spawns `agy --print` → pipes output back as SSE
4. **Option B (SDK):** Passes messages to `sdk_bridge.py` via stdin → Python SDK calls Antigravity → streams tokens back as SSE
5. **CUE receives** the response in the same format as any OpenAI-compatible API

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/chat/completions` | Chat completion (streaming & non-streaming) |
| `GET` | `/v1/models` | List available models |
| `GET` | `/v1/tunnel/status` | Server health check |
| `POST` | `/v1/tunnel/mode` | Switch between `cli` and `sdk` mode |

### CUE Features Through the Tunnel

| Feature | How It Works |
|---------|-------------|
| 💬 Chat | Messages forwarded as-is |
| 🎤 Audio | CUE transcribes locally via Whisper → sends text |
| 🧠 Smart/Fast toggle | CUE sets `max_tokens: 1400` or `700` |
| 📋 AI Rules | CUE injects into system prompt automatically |
| 🔄 Follow-up/Recap | CUE manages conversation turns |
| 📜 History | Stored locally by CUE — no tunnel involvement |
| 📸 Screenshots | Base64 images in messages (text extracted in CLI mode) |

### Command-Line Options

```bash
node server.js [options]

  --port=5678       Custom port (default: 5678)
  --mode=auto       Force mode: auto, cli, or sdk (default: auto)
  --agy-path=agy    Custom path to agy executable
```

---

## Local File Intelligence

The **Local File Intelligence Engine** (`file-processor.js`) allows CUE to read, analyze, and understand files directly from your computer without uploading them to third-party services.

### Supported File Types

- **Code (25+ languages):** `.js`, `.ts`, `.py`, `.java`, `.c`, `.cpp`, `.cs`, `.go`, `.rs`, `.rb`, `.php`, `.swift`, `.kt`, `.html`, `.css`, `.json`, `.yaml`, `.sql`, etc.
- **Documents & Text:** `.md`, `.txt`, `.log`, `.csv`, `.env`, `.ini`, etc.
- **PDF Documents:** `.pdf` (powered by `pdf-parse`)
- **Word Documents:** `.docx` (powered by `mammoth`)
- **Excel Spreadsheets:** `.xlsx`, `.xls` (powered by `xlsx`)
- **Images:** `.jpg`, `.png`, `.jpeg`, `.webp` (OCR powered by `tesseract.js`)

### Endpoints

#### 1. Load Single File: `POST /v1/context/load-file`
Loads a local file into memory and injects its contents into future CUE conversations.
```bash
curl -X POST http://localhost:5678/v1/context/load-file \
  -H "Content-Type: application/json" \
  -d '{"path": "C:\\Users\\provu\\Desktop\\myproject\\server.js"}'
```

#### 2. Load Folder: `POST /v1/context/load-folder`
Scans a folder, respects blacklist/whitelist, and loads supported files.
```bash
curl -X POST http://localhost:5678/v1/context/load-folder \
  -H "Content-Type: application/json" \
  -d '{
    "path": "C:\\Users\\provu\\Desktop\\myproject",
    "recursive": true,
    "maxFiles": 50,
    "maxSizePerFile": "500KB"
  }'
```

#### 3. Browse Folder: `GET /v1/context/browse?path=...`
Lists directory contents and marks whether files are supported without loading them.

#### 4. List Context: `GET /v1/context/list`
Returns loaded files, line counts, sizes, and estimated token usage.

#### 5. Remove File: `DELETE /v1/context/remove`
Removes a single file from the loaded context.

#### 6. Clear Context: `DELETE /v1/context/clear`
Clears all in-memory loaded files.

---

## Knowledge Feed System

The **Knowledge Feed System** (`knowledge-store.js`) manages a persistent local knowledge base in `data/knowledge.json`. Data you feed here is automatically remembered and applied across server restarts.

### Categories & Priorities

1. **`rules`** (Highest priority): Explicit instructions and constraints CUE must obey.
2. **`context`**: Architecture or project details.
3. **`reference`**: Documentation, schemas, specs.
4. **`notes`**: Miscellaneous reminders.

### Endpoints

#### 1. Feed Knowledge: `POST /v1/knowledge/feed`
```bash
curl -X POST http://localhost:5678/v1/knowledge/feed \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Coding Standards",
    "content": "Always prefer functional components and TypeScript.",
    "category": "rules"
  }'
```

#### 2. Import File to Knowledge: `POST /v1/knowledge/import-file`
Reads a local file and stores its content permanently in the knowledge base.
```bash
curl -X POST http://localhost:5678/v1/knowledge/import-file \
  -H "Content-Type: application/json" \
  -d '{"path": "C:\\Users\\provu\\Desktop\\standards.md", "title": "Standards"}'
```

#### 3. List Knowledge: `GET /v1/knowledge/list`
Lists all entries, character counts, and token estimates.

#### 4. Update Knowledge: `PUT /v1/knowledge/update`
Update title, content, or category of an existing entry.

#### 5. Remove Knowledge: `DELETE /v1/knowledge/remove`
Remove an entry by ID.

#### 6. Clear Knowledge: `DELETE /v1/knowledge/clear`
Clear all stored knowledge entries.

