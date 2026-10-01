# 🧠 Implementation Plan — Local File Intelligence & Knowledge Feed

> **Status:** COMPLETED ✅ — Implemented & Verified
> **Affects:** [server.js](file:///C:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/server.js), [file-processor.js](file:///C:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/file-processor.js), [knowledge-store.js](file:///C:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/knowledge-store.js), [test-context.js](file:///C:/Users/provu/Desktop/Create%20Tunnel%20API%20for%20CUE/test-context.js)
> **Backwards compatible:** ✅ All existing CUE functionality remains untouched

---

## What This Adds

Two new capability modules that make your CUE chatbot **aware of files on your laptop** and **able to learn from data you feed it**:

| Module | What It Does |
|--------|-------------|
| 🗂️ **Local File Intelligence** | CUE can read, analyze, and understand any file or folder on your computer |
| 📚 **Knowledge Feed System** | You feed data (text, notes, rules, references) → CUE learns and applies it in every conversation |

Both work **entirely on your local machine** — nothing leaves your laptop except through the existing Antigravity connection.

---

## How It Works (The Big Picture)

```
┌─────────────┐                           ┌──────────────────────────────────────────────┐
│             │   POST /v1/chat/completions│                                              │
│   CUE App   │──────────────────────────▶│             Tunnel Server                    │
│             │                            │                                              │
│  "Analyze   │                            │  1. Intercept CUE's request                  │
│   my code"  │                            │  2. Inject loaded file context +              │
│             │                            │     knowledge feed into system prompt         │
│             │◀──────────────────────────│  3. Forward enriched prompt to Antigravity    │
│  Gets smart │   SSE streamed response    │  4. Stream response back to CUE              │
│  answer with│                            │                                              │
│  file context                            └──────────┬───────────────────────────────────┘
└─────────────┘                                       │
                                                      │ reads from
                                           ┌──────────┴───────────────┐
                                           │                          │
                                    ┌──────┴──────┐          ┌───────┴───────┐
                                    │ 🗂️ File     │          │ 📚 Knowledge  │
                                    │ Context     │          │ Feed Store    │
                                    │ (in-memory) │          │ (JSON on disk)│
                                    └─────────────┘          └───────────────┘
                                     ▲                        ▲
                                     │ YOU load via           │ YOU feed via
                                     │ new API endpoints      │ new API endpoints
                                     │                        │
                              ┌──────┴──────────────┐  ┌─────┴─────────────────┐
                              │ Your laptop files:  │  │ Your custom data:     │
                              │ • .js, .py, .ts     │  │ • "Always respond     │
                              │ • .md, .txt         │  │    in Filipino"       │
                              │ • .pdf, .docx, .xlsx│  │ • "My project uses    │
                              │ • .jpg, .png, .jpeg │  │    React + Express"   │
                              │ • entire folders    │  │ • Paste any text/data │
                              └─────────────────────┘  └───────────────────────┘
```

### Core Mechanism: Context Injection

The key technique is **context injection** — we prepend loaded file contents and knowledge data into the system prompt **before** forwarding to Antigravity. CUE never needs to know about this. From CUE's perspective, it's just sending normal chat requests. But the tunnel enriches them with your local context.

```
BEFORE (current):
  System: "You are a helpful assistant"     ← only what CUE sends
  User: "Explain this code"

AFTER (with file intelligence):
  System: "You are a helpful assistant"     ← what CUE sends
  System: "[LOADED CONTEXT]                 ← INJECTED by tunnel
           File: server.js (685 lines)
           <full file content here>
           
           File: package.json (20 lines)
           <full file content here>"
  System: "[KNOWLEDGE BASE]                 ← INJECTED by tunnel
           Rule: Always explain code step by step
           Note: This project uses Express 5"
  User: "Explain this code"                 ← CUE's original message
```

The AI now has **full visibility** into your files and knowledge when answering.

---

## Module 1: 🗂️ Local File Intelligence

### New API Endpoints

| # | Method | Endpoint | What It Does |
|---|--------|----------|-------------|
| 1 | `POST` | `/v1/context/load-file` | Read a single file and add its content to context |
| 2 | `POST` | `/v1/context/load-folder` | Scan a folder, read all supported files, add to context |
| 3 | `GET` | `/v1/context/list` | Show all currently loaded files/data |
| 4 | `DELETE` | `/v1/context/remove` | Remove a specific file from context |
| 5 | `DELETE` | `/v1/context/clear` | Clear all loaded context |
| 6 | `GET` | `/v1/context/browse` | Browse/list files in a directory (without loading them) |

### Supported File Types & Processing

| File Type | Extensions | Processing Method | npm Package |
|-----------|-----------|-------------------|-------------|
| **Code** | `.js`, `.ts`, `.py`, `.java`, `.c`, `.cpp`, `.cs`, `.go`, `.rs`, `.rb`, `.php`, `.swift`, `.kt`, `.html`, `.css`, `.scss`, `.json`, `.xml`, `.yaml`, `.yml`, `.sql`, `.sh`, `.bat`, `.ps1` | Direct text read (`fs.readFile`) | *none (built-in)* |
| **Text/Docs** | `.md`, `.txt`, `.log`, `.csv`, `.env`, `.ini`, `.cfg`, `.conf` | Direct text read | *none (built-in)* |
| **PDF** | `.pdf` | Extract text from all pages | `pdf-parse` |
| **Word** | `.docx` | Extract text + structure | `mammoth` |
| **Excel** | `.xlsx`, `.xls` | Extract all sheets as text tables | `xlsx` |
| **Images** | `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp` | OCR text extraction | `tesseract.js` |

### API Request/Response Examples

#### Load a single file
```bash
curl -X POST http://localhost:5678/v1/context/load-file \
  -H "Content-Type: application/json" \
  -d '{"path": "C:\\Users\\provu\\Desktop\\myproject\\server.js"}'
```
Response:
```json
{
  "success": true,
  "file": {
    "path": "C:\\Users\\provu\\Desktop\\myproject\\server.js",
    "name": "server.js",
    "type": "code",
    "size": 22374,
    "lines": 685,
    "loadedAt": "2026-10-01T09:15:00Z"
  },
  "contextSize": {
    "filesLoaded": 1,
    "totalChars": 22374,
    "estimatedTokens": 5594
  }
}
```

#### Load an entire folder
```bash
curl -X POST http://localhost:5678/v1/context/load-folder \
  -H "Content-Type: application/json" \
  -d '{
    "path": "C:\\Users\\provu\\Desktop\\myproject",
    "recursive": true,
    "extensions": [".js", ".py", ".md"],
    "maxFiles": 50,
    "maxSizePerFile": "500KB",
    "exclude": ["node_modules", ".git", "dist"]
  }'
```
Response:
```json
{
  "success": true,
  "folder": "C:\\Users\\provu\\Desktop\\myproject",
  "filesLoaded": 12,
  "filesSkipped": 3,
  "skippedReasons": [
    {"file": "large-data.json", "reason": "exceeds 500KB limit"},
    {"file": "image.psd", "reason": "unsupported extension"}
  ],
  "contextSize": {
    "filesLoaded": 12,
    "totalChars": 85430,
    "estimatedTokens": 21358
  }
}
```

#### Browse a folder (without loading)
```bash
curl http://localhost:5678/v1/context/browse?path=C:\\Users\\provu\\Desktop
```
Response:
```json
{
  "path": "C:\\Users\\provu\\Desktop",
  "contents": [
    {"name": "myproject", "type": "directory", "children": 47},
    {"name": "notes.txt", "type": "file", "size": 1234, "ext": ".txt", "supported": true},
    {"name": "photo.jpg", "type": "file", "size": 2048576, "ext": ".jpg", "supported": true}
  ]
}
```

### Folder Scanning Algorithm

```
loadFolder(path, options):
  1. Read directory listing
  2. Filter by allowed extensions (whitelist)
  3. Exclude directories: node_modules, .git, dist, __pycache__, etc.
  4. For each file:
     a. Check file size <= maxSizePerFile (default 500KB)
     b. Detect file type by extension
     c. Process through appropriate extractor:
        - Code/text → fs.readFileSync(path, 'utf-8')
        - PDF → pdf-parse(buffer) → text
        - DOCX → mammoth.extractRawText(buffer) → text
        - XLSX → xlsx.readFile(path) → iterate sheets → text table
        - Image → tesseract.recognize(path) → OCR text
     d. Add to in-memory context store
  5. If recursive: repeat for subdirectories
  6. Enforce global maxFiles limit (default 50)
  7. Return summary with loaded/skipped counts
```

### Safety Guards

| Guard | Default | Purpose |
|-------|---------|---------|
| `maxFiles` | 50 files per load operation | Prevent context overflow |
| `maxSizePerFile` | 500KB | Skip massive files that would bloat the prompt |
| `maxTotalContext` | 200,000 characters (~50K tokens) | Hard ceiling on total injected context |
| `excludeDirs` | `node_modules`, `.git`, `dist`, `build`, `__pycache__`, `.next`, `vendor` | Auto-skip irrelevant directories |
| Path validation | Must be absolute path, must exist | Prevent path traversal issues |
| Read-only | Files are **only read**, never written/modified | Your files are completely safe |

> **IMPORTANT: All file reading is READ-ONLY.** The tunnel will never write to, modify, or delete any of your files. It only reads their content to provide context to the AI.

---

## Module 2: 📚 Knowledge Feed System

### What Is This?

A **persistent local knowledge base** where you can feed text, rules, notes, and reference data. The AI will remember, adopt, and apply this knowledge in every conversation — even after restarting the tunnel.

### Use Cases

| Example Feed | How AI Uses It |
|-------------|---------------|
| *"Always respond in Filipino when I speak Filipino"* | AI adapts its language |
| *"My project uses React 19 + Express 5 + PostgreSQL"* | AI gives stack-specific answers |
| *"My coding style: use const over let, prefer arrow functions"* | AI follows your style |
| *"Company standard: all APIs must return {success, data, error}"* | AI applies your standards |
| Paste entire documentation text | AI references it when answering |
| Paste a CSV dataset | AI can analyze and discuss the data |

### New API Endpoints

| # | Method | Endpoint | What It Does |
|---|--------|----------|-------------|
| 7 | `POST` | `/v1/knowledge/feed` | Add a new piece of knowledge |
| 8 | `GET` | `/v1/knowledge/list` | List all knowledge entries |
| 9 | `PUT` | `/v1/knowledge/update` | Update an existing entry |
| 10 | `DELETE` | `/v1/knowledge/remove` | Remove a specific entry |
| 11 | `DELETE` | `/v1/knowledge/clear` | Clear all knowledge |
| 12 | `POST` | `/v1/knowledge/import-file` | Feed knowledge from a file (reads + stores permanently) |

### API Examples

#### Feed text knowledge
```bash
curl -X POST http://localhost:5678/v1/knowledge/feed \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Coding Standards",
    "content": "Always use TypeScript. Prefer functional components. Use Zod for validation. All functions must have JSDoc comments.",
    "category": "rules"
  }'
```
Response:
```json
{
  "success": true,
  "entry": {
    "id": "kb-1727766900-a3x9",
    "title": "My Coding Standards",
    "category": "rules",
    "chars": 134,
    "createdAt": "2026-10-01T09:15:00Z"
  },
  "totalEntries": 1,
  "estimatedTokens": 34
}
```

#### Feed knowledge from a file
```bash
curl -X POST http://localhost:5678/v1/knowledge/import-file \
  -H "Content-Type: application/json" \
  -d '{
    "path": "C:\\Users\\provu\\Desktop\\project-rules.md",
    "title": "Project Rules Document"
  }'
```

#### List all knowledge
```bash
curl http://localhost:5678/v1/knowledge/list
```
Response:
```json
{
  "entries": [
    {
      "id": "kb-1727766900-a3x9",
      "title": "My Coding Standards",
      "category": "rules",
      "chars": 134,
      "preview": "Always use TypeScript. Prefer functional...",
      "createdAt": "2026-10-01T09:15:00Z"
    }
  ],
  "totalEntries": 1,
  "totalChars": 134,
  "estimatedTokens": 34
}
```

### Storage

Knowledge is stored as a JSON file on disk so it **persists across restarts**:

```
📁 Create Tunnel API for CUE/
  └── 📁 data/
      └── knowledge.json    ← Persistent knowledge store
```

Structure of `knowledge.json`:
```json
{
  "version": 1,
  "entries": [
    {
      "id": "kb-1727766900-a3x9",
      "title": "My Coding Standards",
      "content": "Always use TypeScript...",
      "category": "rules",
      "createdAt": "2026-10-01T09:15:00Z",
      "updatedAt": "2026-10-01T09:15:00Z"
    }
  ]
}
```

### Knowledge Categories

| Category | Purpose | Injection Priority |
|----------|---------|-------------------|
| `rules` | Instructions the AI must follow | **Highest** — injected first |
| `context` | Background info about your project/work | Medium |
| `reference` | Documentation, specs, data to consult | Medium |
| `notes` | General notes and reminders | Lower |

---

## How Context Injection Works (Technical Detail)

When CUE sends a chat completion request, the tunnel now does this **before** forwarding to Antigravity:

```javascript
// PSEUDOCODE — what happens inside the modified chat handler

app.post('/v1/chat/completions', (req, res) => {
  let { messages } = req.body;
  
  // --- NEW: Inject file context + knowledge ---
  const injectedContext = [];
  
  // 1. Inject knowledge feed (persistent)
  if (knowledgeStore.hasEntries()) {
    injectedContext.push({
      role: 'system',
      content: `[YOUR KNOWLEDGE BASE]\n${knowledgeStore.format()}`
    });
  }
  
  // 2. Inject loaded file context (session)
  if (fileContext.hasFiles()) {
    injectedContext.push({
      role: 'system',
      content: `[LOADED FILES]\n${fileContext.format()}`
    });
  }
  
  // 3. Merge: original system + injected context + conversation
  messages = mergeMessages(messages, injectedContext);
  
  // --- Continue with existing logic (unchanged) ---
});
```

### Message Merge Strategy

```
Final message array sent to Antigravity:

  1. Original system message from CUE (AI Rules, etc.)
  2. [INJECTED] Knowledge Base entries (rules first, then context, reference, notes)
  3. [INJECTED] Loaded file contents (with filename headers)
  4. Original user/assistant messages from CUE (conversation history)
```

### Token Budget Management

The AI has a context window limit. We need to be smart about how much we inject:

```
Total available context: ~128K tokens (Gemini 2.5)

Budget allocation:
  - CUE's own messages: up to 50K tokens (conversation + system)
  - Knowledge feed:     up to 20K tokens (~80K chars)
  - Loaded files:       up to 50K tokens (~200K chars)
  - Reserved for AI:     ~8K tokens (response generation)
```

**When context exceeds budget:**
1. Knowledge feed: include all (usually small)
2. Loaded files: truncate large files with a note: `"[TRUNCATED — showing first 10,000 chars of 50,000]"`
3. If still over budget: include file summaries instead of full content

---

## New Files to Create

### 1. `file-processor.js` (NEW — ~250 lines)

Handles all file type extraction:

```javascript
// Responsibilities:
// - readTextFile(path)       → string content
// - readPDF(path)            → extracted text from all pages
// - readDOCX(path)           → extracted text
// - readXLSX(path)           → text table representation
// - readImage(path)          → OCR text extraction
// - detectFileType(path)     → { type, category, supported }
// - scanFolder(path, opts)   → [{ path, name, type, size }]
// - processFile(path)        → { content, metadata }
```

### 2. `knowledge-store.js` (NEW — ~200 lines)

Manages the persistent knowledge base:

```javascript
// Responsibilities:
// - load()                   → read knowledge.json from disk
// - save()                   → write knowledge.json to disk
// - add(title, content, cat) → create new entry
// - update(id, fields)       → modify existing entry
// - remove(id)               → delete entry
// - clear()                  → remove all entries
// - format()                 → build injection string for system prompt
// - getTokenEstimate()       → estimate total token usage
```

### 3. Modifications to `server.js`

| Section | Change |
|---------|--------|
| Imports (top) | Add `require('./file-processor')` and `require('./knowledge-store')` |
| After Express setup | Initialize `fileContext` (in-memory Map) and `knowledgeStore` |
| Chat completion handler | Add context injection logic before routing to CLI/SDK |
| New endpoint block | Add all 12 new endpoints (6 for context, 6 for knowledge) |
| Startup banner | Update to show context/knowledge status |

---

## New Dependencies

| Package | Version | Purpose | Size |
|---------|---------|---------|------|
| `pdf-parse` | `^1.1.1` | Extract text from PDF files | ~2MB |
| `mammoth` | `^1.8.0` | Extract text from DOCX files | ~1MB |
| `xlsx` | `^0.18.5` | Read Excel spreadsheets | ~3MB |
| `tesseract.js` | `^5.1.1` | OCR text from images | ~15MB (includes WASM engine) |
| `mime-types` | `^2.1.35` | Detect file MIME types | ~50KB |
| `chokidar` | `^4.0.0` | (Optional) Watch files for changes | ~500KB |

> **Note:** `tesseract.js` is the largest dependency (~15MB) because it includes a WebAssembly OCR engine. If you don't need image text extraction, we can make it optional and skip it.

---

## Implementation Phases

### Phase 1: Core File Reading (Day 1)
- [x] Create `file-processor.js` with text/code file support
- [x] Create in-memory file context store in `server.js`
- [x] Add `/v1/context/load-file` endpoint
- [x] Add `/v1/context/list` endpoint
- [x] Add `/v1/context/remove` and `/v1/context/clear` endpoints
- [x] Add `/v1/context/browse` endpoint
- [x] Modify chat completion handler to inject file context
- [x] Test with CUE: load a file → ask CUE about it

### Phase 2: Folder Scanning (Day 1-2)
- [x] Add folder scanning algorithm to `file-processor.js`
- [x] Add `/v1/context/load-folder` endpoint
- [x] Add exclude patterns and safety guards
- [x] Test: load a project folder → ask CUE to analyze the codebase

### Phase 3: Knowledge Feed System (Day 2)
- [x] Create `knowledge-store.js` with JSON persistence
- [x] Create `data/` directory and `knowledge.json`
- [x] Add all 6 `/v1/knowledge/*` endpoints
- [x] Modify chat handler to inject knowledge before file context
- [x] Test: feed rules → verify CUE follows them

### Phase 4: Rich File Formats (Day 2-3)
- [x] Install `pdf-parse`, `mammoth`, `xlsx`
- [x] Add PDF extraction to `file-processor.js`
- [x] Add DOCX extraction
- [x] Add XLSX extraction
- [x] (Optional) Install `tesseract.js` for image OCR
- [x] Add image OCR extraction
- [x] Test: load PDF/DOCX/XLSX/image → ask CUE about contents

---

## Updated Project Structure (After Implementation)

```
📁 Create Tunnel API for CUE/
│
├── 🖱️ Option-A-CLI.bat           ← unchanged
├── 🖱️ Option-B-SDK.bat           ← unchanged
├── 🖱️ start-tunnel.bat           ← unchanged
├── 🛑 kill-port.bat               ← unchanged
│
├── ⚙️ server.js                  ← MODIFIED: +12 endpoints, context injection
├── 📄 file-processor.js          ← NEW: file type extraction engine
├── 📄 knowledge-store.js         ← NEW: persistent knowledge base manager
├── 🐍 sdk_bridge.py              ← unchanged
│
├── 📁 data/                      ← NEW: persistent data directory
│   └── knowledge.json            ← NEW: knowledge feed storage
│
├── 🧪 test.js                    ← unchanged (existing tests still pass)
├── 🧪 test-stream.js             ← unchanged
├── 🧪 test-context.js            ← NEW: tests for file intelligence
│
├── 📦 package.json               ← MODIFIED: new dependencies added
├── 📖 DOCUMENTATION.md           ← UPDATED: document new features
├── 📖 README.md                  ← UPDATED: document new features
└── 📁 scratch/                   ← unchanged
```

---

## What Does NOT Change

Everything that currently works stays exactly the same:

| Component | Status |
|-----------|--------|
| CUE chat completions | ✅ Untouched — same endpoint, same format |
| CLI mode (Option A) | ✅ Untouched — same agy --print flow |
| SDK mode (Option B) | ✅ Untouched — same sdk_bridge.py flow |
| SSE streaming | ✅ Untouched — same heartbeat, same format |
| Model listing | ✅ Untouched |
| Health check / status | ✅ Untouched |
| Mode switching | ✅ Untouched |
| Batch launchers | ✅ Untouched |
| All existing tests | ✅ Still pass |

---

## Open Questions for Your Decision

Before I start coding, please confirm:

| # | Question | Options |
|---|----------|---------|
| 1 | **Image OCR support?** | Include `tesseract.js` (~15MB) for reading text from images, or skip it to keep the project lightweight? |
| 2 | **Auto-reload on file change?** | Should loaded files auto-refresh if you edit them, or only reload when you explicitly ask? |
| 3 | **Management UI?** | Do you want a simple web dashboard (HTML page) at `http://localhost:5678` to manage files and knowledge visually, or is API-only (curl commands) fine? |
| 4 | **Context persistence?** | Should loaded files persist across server restarts (saved to disk), or reset each time you start the tunnel? Knowledge feed always persists. |

---

## Summary

| Feature | Files Loaded → AI Reads Them | Data Fed → AI Learns & Applies |
|---------|------------------------------|-------------------------------|
| **What** | Read any file/folder on your laptop | Feed text/rules/data to CUE |
| **How** | New `/v1/context/*` API endpoints | New `/v1/knowledge/*` API endpoints |
| **Where** | In-memory (session) | On-disk JSON (persistent) |
| **When** | Injected into every chat request | Injected into every chat request |
| **Supports** | Code, text, PDF, DOCX, XLSX, images | Any text/data you paste or import |
| **Changes to CUE** | None | None |
| **New files** | 2 JS modules + 1 data file | Included in same 2 modules |
| **New dependencies** | 4-6 npm packages | None (pure Node.js) |
