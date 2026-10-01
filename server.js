/**
 * CUE Tunnel API — Local OpenAI-Compatible Proxy to Antigravity
 *
 * Bridges CUE's "Custom" provider (OpenAI chat/completions format) to your
 * Antigravity subscription via either:
 *   Mode B (default): Antigravity Python SDK — lower latency, proper streaming
 *   Mode A (fallback): agy CLI --print — shells out per request
 *
 * Usage:
 *   node server.js                     # start with auto-detected mode
 *   node server.js --mode=cli          # force CLI mode (Option A)
 *   node server.js --mode=sdk          # force SDK mode (Option B)
 *   node server.js --port=5678         # custom port
 *
 * Then in CUE → Settings → Provider: Custom
 *   Base URL: http://localhost:5678/v1
 *   Model:    antigravity  (or any string — it's ignored by the proxy)
 */

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { processFile, scanFolder, browseFolder, detectFileType, getAllSupportedExtensions, formatBytes, parseSizeString, DEFAULT_EXCLUDE_DIRS } = require('./file-processor');
const KnowledgeStore = require('./knowledge-store');

// Global safety crash guards & lifecycle logging
process.on('uncaughtException', (err) => {
  console.error('⚠️ [Server Guard] Uncaught Exception:', err.stack || err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ [Server Guard] Unhandled Rejection:', reason);
});
process.on('beforeExit', (code) => {
  console.log(`🛑 [Lifecycle] Node beforeExit fired with code: ${code}. Event loop empty!`);
});
process.on('exit', (code) => {
  console.log(`🛑 [Lifecycle] Node process exit fired with code: ${code}`);
});
process.on('SIGINT', () => {
  console.log('🛑 [Signal] Process received SIGINT');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('🛑 [Signal] Process received SIGTERM');
  process.exit(0);
});

// ─────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name, fallback) {
  const match = args.find(a => a.startsWith(`--${name}=`));
  return match ? match.split('=')[1] : fallback;
}

const PORT = parseInt(getArg('port', '5678'), 10);
const FORCED_MODE = getArg('mode', 'auto'); // 'auto', 'sdk', 'cli'
const AGY_PATH = getArg('agy-path', 'agy');
const SDK_SCRIPT = path.join(__dirname, 'sdk_bridge.py');

// ─────────────────────────────────────────────────
// Context & Knowledge Stores
// ─────────────────────────────────────────────────
const fileContext = new Map();       // In-memory: loaded files (resets on restart)
const knowledgeStore = new KnowledgeStore(); // Persistent: knowledge base (survives restarts)
const MAX_TOTAL_CONTEXT_CHARS = 200000; // ~50K tokens max for injected file context

// ─────────────────────────────────────────────────
// Mode detection
// ─────────────────────────────────────────────────
let activeMode = 'cli'; // default to CLI (Option A) — uses your subscription directly

async function detectMode() {
  if (FORCED_MODE === 'cli') {
    activeMode = 'cli';
    return;
  }
  if (FORCED_MODE === 'sdk') {
    if (!process.env.GEMINI_API_KEY) {
      console.log('ℹ️  Option B (SDK) requires GEMINI_API_KEY. Defaulting to Option A (CLI Mode) which uses your Antigravity subscription directly.');
      activeMode = 'cli';
      return;
    }
    activeMode = 'sdk';
    return;
  }

  // Default: CLI mode (Option A) because it authenticates via your existing Antigravity subscription
  activeMode = 'cli';
  console.log('✅ Mode: Option A (CLI) — powered by your Antigravity subscription');
}

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────
function generateId() {
  return 'chatcmpl-' + Math.random().toString(36).substring(2, 15);
}

function buildPromptFromMessages(messages) {
  // Convert OpenAI messages format to a single prompt string for AGY
  let systemPrompt = '';
  const conversationParts = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemPrompt = typeof msg.content === 'string'
        ? msg.content
        : msg.content.map(c => c.text || '').join('\n');
    } else if (msg.role === 'user') {
      let text = '';
      if (typeof msg.content === 'string') {
        text = msg.content;
      } else if (Array.isArray(msg.content)) {
        // Handle multimodal (text + image) — extract text parts only for CLI
        text = msg.content
          .filter(c => c.type === 'text')
          .map(c => c.text)
          .join('\n');
        // Note: image_url parts are dropped in CLI mode (AGY doesn't accept images via CLI)
      }
      conversationParts.push(`User: ${text}`);
    } else if (msg.role === 'assistant') {
      const text = typeof msg.content === 'string' ? msg.content : '';
      conversationParts.push(`Assistant: ${text}`);
    }
  }

  let fullPrompt = '';
  if (systemPrompt) {
    fullPrompt += `[System Instructions]\n${systemPrompt}\n\n`;
  }
  if (conversationParts.length > 0) {
    fullPrompt += conversationParts.join('\n\n');
  }

  return fullPrompt;
}

// ─────────────────────────────────────────────────
// Mode A: AGY CLI --print (streaming via stream-json)
// ─────────────────────────────────────────────────
function streamViaCLI(prompt, res, requestId, model) {
  const scratchDir = path.join(__dirname, 'scratch');
  if (!fs.existsSync(scratchDir)) {
    try { fs.mkdirSync(scratchDir, { recursive: true }); } catch { /* ignore */ }
  }

  const child = spawn(AGY_PATH, [
    '--print', prompt,
    '--output-format', 'stream-json',
    '--dangerously-skip-permissions',
    '--disable-slash-commands'
  ], {
    cwd: scratchDir,
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let buffer = '';
  let fullText = '';
  let sentHeader = false;
  let isDone = false;
  let keepAlive = null;

  function sendSSEChunk(content) {
    if (isDone || res.writableEnded || res.destroyed) {
      if (keepAlive) clearInterval(keepAlive);
      return;
    }
    if (!sentHeader) {
      try {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        });
        sentHeader = true;
      } catch {
        return;
      }
    }

    const chunk = {
      id: requestId,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: model || 'antigravity',
      choices: [{
        index: 0,
        delta: { content },
        finish_reason: null
      }]
    };
    try {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    } catch {
      // client disconnected
    }
  }

  function sendDone() {
    isDone = true;
    if (keepAlive) clearInterval(keepAlive);
    if (res.writableEnded || res.destroyed) return;

    if (!sentHeader) {
      try {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        });
        sentHeader = true;
      } catch {
        return;
      }
    }

    const finalChunk = {
      id: requestId,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: model || 'antigravity',
      choices: [{
        index: 0,
        delta: {},
        finish_reason: 'stop'
      }]
    };
    try {
      res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch {
      // ignore
    }
  }

  // Keep-alive heartbeat: send an invisible zero-width space immediately and every 5s
  // This rearms CUE's internal 25-second stream watchdog so it never times out during CLI boot!
  sendSSEChunk('\u200B');
  keepAlive = setInterval(() => {
    if (!isDone && !fullText && !res.writableEnded && !res.destroyed) {
      sendSSEChunk('\u200B');
    } else {
      if (keepAlive) clearInterval(keepAlive);
    }
  }, 5000);

  child.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        // stream-json events: text_delta contains the streamed content
        if (event.event === 'step_update' && event.step_update?.text_delta) {
          const delta = event.step_update.text_delta;
          fullText += delta;
          sendSSEChunk(delta);
        } else if (event.event === 'result' && event.result?.response && !fullText) {
          const resp = event.result.response;
          fullText += resp;
          sendSSEChunk(resp);
        }
      } catch {
        // ignore malformed lines
      }
    }
  });

  child.stderr.on('data', (data) => {
    // AGY prints progress/status to stderr - ignore
  });

  child.on('close', (code) => {
    // Process any remaining buffer
    if (buffer.trim()) {
      try {
        const event = JSON.parse(buffer);
        if (event.event === 'step_update' && event.step_update?.text_delta) {
          fullText += event.step_update.text_delta;
          sendSSEChunk(event.step_update.text_delta);
        } else if (event.event === 'result' && event.result?.response && !fullText) {
          fullText += event.result.response;
          sendSSEChunk(event.result.response);
        }
      } catch { /* ignore */ }
    }

    // Safety fallback: if AGY produced no output, never leave CUE hanging!
    if (!fullText) {
      console.warn('⚠️  AGY produced no output, sending prompt acknowledged');
      sendSSEChunk("I received your request! Please ask your question again.");
    }

    sendDone();
  });

  child.on('error', (err) => {
    console.error('CLI spawn error:', err.message);
    if (!sentHeader) {
      try {
        res.status(500).json({
          error: { message: `AGY CLI error: ${err.message}`, type: 'server_error' }
        });
      } catch {}
    } else {
      sendDone();
    }
  });

  // Handle client disconnect
  res.on('close', () => {
    isDone = true;
    if (keepAlive) clearInterval(keepAlive);
    try { child.kill('SIGTERM'); } catch {}
  });
}

// Non-streaming CLI mode
function respondViaCLI(prompt, res, requestId, model) {
  const scratchDir = path.join(__dirname, 'scratch');
  if (!fs.existsSync(scratchDir)) {
    try { fs.mkdirSync(scratchDir, { recursive: true }); } catch { /* ignore */ }
  }

  const child = spawn(AGY_PATH, [
    '--print', prompt,
    '--output-format', 'json',
    '--dangerously-skip-permissions',
    '--disable-slash-commands'
  ], {
    cwd: scratchDir,
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (data) => { stdout += data.toString(); });
  child.stderr.on('data', (data) => { stderr += data.toString(); });

  child.on('close', (code) => {
    try {
      const result = JSON.parse(stdout);
      const responseText = result.response || '';

      res.json({
        id: requestId,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model || 'antigravity',
        choices: [{
          index: 0,
          message: { role: 'assistant', content: responseText.trim() },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: result.usage?.input_tokens || 0,
          completion_tokens: result.usage?.output_tokens || 0,
          total_tokens: result.usage?.total_tokens || 0
        }
      });
    } catch (err) {
      res.status(500).json({
        error: { message: `AGY CLI returned invalid output: ${stdout.substring(0, 200)}`, type: 'server_error' }
      });
    }
  });

  child.on('error', (err) => {
    res.status(500).json({
      error: { message: `AGY CLI error: ${err.message}`, type: 'server_error' }
    });
  });
}

// ─────────────────────────────────────────────────
// Mode B: Antigravity Python SDK bridge
// ─────────────────────────────────────────────────
function streamViaSDK(messages, res, requestId, model) {
  const messagesJson = JSON.stringify(messages);

  const child = spawn('python', [SDK_SCRIPT, '--stream'], {
    cwd: __dirname,
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Send messages via stdin
  child.stdin.write(messagesJson);
  child.stdin.end();

  let buffer = '';
  let sentHeader = false;

  function sendSSEChunk(content) {
    if (!sentHeader) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      sentHeader = true;
    }

    const chunk = {
      id: requestId,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: model || 'antigravity',
      choices: [{
        index: 0,
        delta: { content },
        finish_reason: null
      }]
    };
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }

  function sendDone() {
    if (!sentHeader) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      sentHeader = true;
    }

    const finalChunk = {
      id: requestId,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: model || 'antigravity',
      choices: [{
        index: 0,
        delta: {},
        finish_reason: 'stop'
      }]
    };
    res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }

  child.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        if (event.type === 'token' && event.content) {
          sendSSEChunk(event.content);
        } else if (event.type === 'error') {
          console.error('SDK error:', event.message);
        }
      } catch { /* ignore */ }
    }
  });

  child.stderr.on('data', (data) => {
    // SDK progress output
  });

  child.on('close', () => {
    if (buffer.trim()) {
      try {
        const event = JSON.parse(buffer);
        if (event.type === 'token' && event.content) {
          sendSSEChunk(event.content);
        }
      } catch { /* ignore */ }
    }
    sendDone();
  });

  child.on('error', (err) => {
    console.error('SDK spawn error:', err.message);
    if (!sentHeader) {
      res.status(500).json({
        error: { message: `SDK bridge error: ${err.message}`, type: 'server_error' }
      });
    } else {
      sendDone();
    }
  });

  res.on('close', () => {
    child.kill('SIGTERM');
  });
}

function respondViaSDK(messages, res, requestId, model) {
  const messagesJson = JSON.stringify(messages);

  const child = spawn('python', [SDK_SCRIPT], {
    cwd: __dirname,
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  child.stdin.write(messagesJson);
  child.stdin.end();

  let stdout = '';

  child.stdout.on('data', (data) => { stdout += data.toString(); });

  child.on('close', () => {
    try {
      const result = JSON.parse(stdout);
      res.json({
        id: requestId,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model || 'antigravity',
        choices: [{
          index: 0,
          message: { role: 'assistant', content: result.response || '' },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: result.usage?.input_tokens || 0,
          completion_tokens: result.usage?.output_tokens || 0,
          total_tokens: result.usage?.total_tokens || 0
        }
      });
    } catch {
      res.status(500).json({
        error: { message: `SDK returned invalid output`, type: 'server_error' }
      });
    }
  });

  child.on('error', (err) => {
    res.status(500).json({
      error: { message: `SDK bridge error: ${err.message}`, type: 'server_error' }
    });
  });
}

// ─────────────────────────────────────────────────
// Context Injection (File Intelligence + Knowledge Feed)
// ─────────────────────────────────────────────────

/**
 * Format all loaded files into a structured text block for system prompt injection.
 * Respects MAX_TOTAL_CONTEXT_CHARS budget — truncates individual files if needed.
 */
function formatFileContext() {
  if (fileContext.size === 0) return '';

  const parts = [
    '══════════════════════════════════════════',
    '🗂️ LOADED FILES FROM USER\'S COMPUTER',
    `${fileContext.size} file(s) loaded. Read, analyze, understand, and reference these files when answering.`,
    '══════════════════════════════════════════',
  ];

  let totalChars = 0;

  for (const [filePath, fileData] of fileContext) {
    const header = `\n─── File: ${fileData.name} (${fileData.lines} lines | ${fileData.type} | ${formatBytes(fileData.size)}) ───`;
    let content = fileData.content;
    const available = MAX_TOTAL_CONTEXT_CHARS - totalChars;

    if (available <= 0) {
      parts.push(`\n[REMAINING FILES OMITTED — context limit reached]`);
      break;
    }

    if (content.length > available) {
      content = content.substring(0, available) + `\n[TRUNCATED — showing first ${available.toLocaleString()} of ${content.length.toLocaleString()} chars]`;
    }

    parts.push(header);
    parts.push(content);
    totalChars += header.length + content.length;
  }

  parts.push('\n══════════════════════════════════════════');
  return parts.join('\n');
}

/**
 * Inject loaded file context + knowledge feed into the messages array.
 * Appends to the existing system message (or creates one) so the AI
 * has full visibility into the user's files and knowledge.
 */
function injectContext(messages) {
  if (fileContext.size === 0 && !knowledgeStore.hasEntries()) {
    return messages; // nothing to inject
  }

  let injection = '';

  // Knowledge feed (highest priority — rules, context, reference, notes)
  if (knowledgeStore.hasEntries()) {
    injection += '\n\n' + knowledgeStore.format();
  }

  // Loaded file context
  if (fileContext.size > 0) {
    injection += '\n\n' + formatFileContext();
  }

  if (!injection.trim()) return messages;

  // Shallow copy the messages array so we don't mutate the original
  const enriched = messages.map(m => ({ ...m }));

  // Find existing system message and append injection to it
  const sysIdx = enriched.findIndex(m => m.role === 'system');
  if (sysIdx >= 0) {
    const existing = typeof enriched[sysIdx].content === 'string'
      ? enriched[sysIdx].content
      : JSON.stringify(enriched[sysIdx].content);
    enriched[sysIdx] = { ...enriched[sysIdx], content: existing + injection };
  } else {
    // No system message from CUE — create one with just the injected context
    enriched.unshift({ role: 'system', content: injection.trim() });
  }

  return enriched;
}

/** Get current context statistics */
function getContextStats() {
  let totalChars = 0;
  for (const [, data] of fileContext) {
    totalChars += data.content.length;
  }
  totalChars += knowledgeStore.getTotalChars();
  return {
    filesLoaded: fileContext.size,
    knowledgeEntries: knowledgeStore.entries.length,
    totalChars,
    estimatedTokens: Math.ceil(totalChars / 4)
  };
}

// ─────────────────────────────────────────────────
// Express Server
// ─────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '50mb' })); // CUE sends base64 screenshots

// CORS for any local app
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Global request logger for debugging
app.use((req, res, next) => {
  if (req.method !== 'OPTIONS') {
    console.log(`🌐 [${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Health check / model listing (supports /v1/models and /models)
app.get(['/v1/models', '/models'], (req, res) => {
  res.json({
    object: 'list',
    data: [{
      id: 'antigravity',
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: 'antigravity-tunnel'
    }]
  });
});

// Main endpoint: OpenAI-compatible chat completions (supports /v1/chat/completions and /chat/completions)
app.post(['/v1/chat/completions', '/chat/completions'], (req, res) => {
  const { messages, model, stream, max_tokens } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({
      error: { message: 'messages array is required', type: 'invalid_request_error' }
    });
  }

  const requestId = generateId();
  const requestedModel = model || 'antigravity';

  // Inject loaded file context + knowledge feed into messages
  const enrichedMessages = injectContext(messages);
  const ctxInfo = fileContext.size > 0 || knowledgeStore.hasEntries()
    ? ` | 📎 ${fileContext.size} files, ${knowledgeStore.entries.length} knowledge`
    : '';

  console.log(`📨 ${new Date().toLocaleTimeString()} | ${stream ? 'STREAM' : 'SYNC'} | ${activeMode.toUpperCase()} mode | ${messages.length} msgs${ctxInfo} | model: ${requestedModel}`);

  if (activeMode === 'sdk') {
    if (stream) {
      streamViaSDK(enrichedMessages, res, requestId, requestedModel);
    } else {
      respondViaSDK(enrichedMessages, res, requestId, requestedModel);
    }
  } else {
    // CLI mode
    const prompt = buildPromptFromMessages(enrichedMessages);

    if (stream) {
      streamViaCLI(prompt, res, requestId, requestedModel);
    } else {
      respondViaCLI(prompt, res, requestId, requestedModel);
    }
  }
});

// Status endpoint (supports /v1/tunnel/status, /tunnel/status, /status)
app.get(['/v1/tunnel/status', '/tunnel/status', '/status'], (req, res) => {
  res.json({
    status: 'running',
    mode: activeMode,
    port: PORT,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Switch mode endpoint
app.post('/v1/tunnel/mode', (req, res) => {
  const { mode } = req.body;
  if (!['cli', 'sdk'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be "cli" or "sdk"' });
  }
  activeMode = mode;
  console.log(`🔄 Switched to ${mode.toUpperCase()} mode`);
  res.json({ mode: activeMode, message: `Switched to ${mode.toUpperCase()} mode` });
});

// ─────────────────────────────────────────────────
// File Context Endpoints (Local File Intelligence)
// ─────────────────────────────────────────────────

// Load a single file into context
app.post('/v1/context/load-file', async (req, res) => {
  try {
    const { path: filePath, maxSizePerFile } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: { message: 'path is required', type: 'invalid_request_error' } });
    }
    const options = {};
    if (maxSizePerFile) options.maxSizePerFile = parseSizeString(maxSizePerFile);

    const result = await processFile(filePath, options);
    fileContext.set(result.path, result);

    console.log(`📄 Loaded file: ${result.name} (${result.lines} lines, ${formatBytes(result.size)})`);

    const stats = getContextStats();
    res.json({
      success: true,
      file: {
        path: result.path, name: result.name, type: result.type,
        ext: result.ext, size: result.size, lines: result.lines,
        loadedAt: result.processedAt
      },
      contextSize: {
        filesLoaded: stats.filesLoaded,
        totalChars: stats.totalChars,
        estimatedTokens: stats.estimatedTokens
      }
    });
  } catch (err) {
    res.status(400).json({ error: { message: err.message, type: 'file_error' } });
  }
});

// Load all supported files from a folder
app.post('/v1/context/load-folder', async (req, res) => {
  try {
    const {
      path: dirPath, recursive = true, extensions,
      maxFiles, maxSizePerFile, exclude
    } = req.body;
    if (!dirPath) {
      return res.status(400).json({ error: { message: 'path is required', type: 'invalid_request_error' } });
    }

    const options = { recursive };
    if (extensions) options.extensions = extensions;
    if (maxFiles) options.maxFiles = maxFiles;
    if (maxSizePerFile) options.maxSizePerFile = parseSizeString(maxSizePerFile);
    if (exclude) options.exclude = [...DEFAULT_EXCLUDE_DIRS, ...exclude];

    const results = await scanFolder(dirPath, options);

    // Add loaded files to context
    for (const file of results.loaded) {
      fileContext.set(file.path, file);
    }

    console.log(`📁 Loaded folder: ${dirPath} (${results.loaded.length} files loaded, ${results.skipped.length} skipped)`);

    const stats = getContextStats();
    res.json({
      success: true,
      folder: dirPath,
      filesLoaded: results.loaded.length,
      filesSkipped: results.skipped.length,
      loadedFiles: results.loaded.map(f => ({
        name: f.name, path: f.path, type: f.type, lines: f.lines, size: f.size
      })),
      skippedReasons: results.skipped.slice(0, 20),
      contextSize: {
        filesLoaded: stats.filesLoaded,
        totalChars: stats.totalChars,
        estimatedTokens: stats.estimatedTokens
      }
    });
  } catch (err) {
    res.status(400).json({ error: { message: err.message, type: 'folder_error' } });
  }
});

// List all loaded files in context
app.get('/v1/context/list', (req, res) => {
  const files = [];
  for (const [, data] of fileContext) {
    files.push({
      path: data.path, name: data.name, type: data.type,
      ext: data.ext, size: data.size,
      sizeFormatted: formatBytes(data.size),
      lines: data.lines, loadedAt: data.processedAt
    });
  }
  const stats = getContextStats();
  res.json({
    files,
    contextSize: {
      filesLoaded: stats.filesLoaded,
      knowledgeEntries: stats.knowledgeEntries,
      totalChars: stats.totalChars,
      estimatedTokens: stats.estimatedTokens
    }
  });
});

// Browse a directory without loading files
app.get('/v1/context/browse', (req, res) => {
  try {
    const dirPath = req.query.path;
    if (!dirPath) {
      return res.status(400).json({ error: { message: 'path query parameter is required (e.g. ?path=C:\\Users\\...)', type: 'invalid_request_error' } });
    }
    const result = browseFolder(dirPath);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: { message: err.message, type: 'browse_error' } });
  }
});

// Remove a specific file from context
app.delete('/v1/context/remove', (req, res) => {
  const filePath = req.body?.path || req.query?.path;
  if (!filePath) {
    return res.status(400).json({ error: { message: 'path is required', type: 'invalid_request_error' } });
  }
  const normalizedPath = path.resolve(filePath);
  if (fileContext.has(normalizedPath)) {
    const removed = fileContext.get(normalizedPath);
    fileContext.delete(normalizedPath);
    console.log(`🗑️  Removed from context: ${removed.name}`);
    res.json({ success: true, removed: removed.name, filesRemaining: fileContext.size });
  } else {
    res.status(404).json({ error: { message: `File not found in context: ${filePath}`, type: 'not_found' } });
  }
});

// Clear all file context
app.delete('/v1/context/clear', (req, res) => {
  const count = fileContext.size;
  fileContext.clear();
  console.log(`🗑️  Cleared all file context (${count} files removed)`);
  res.json({ success: true, filesCleared: count });
});

// ─────────────────────────────────────────────────
// Knowledge Feed Endpoints
// ─────────────────────────────────────────────────

// Feed new knowledge
app.post('/v1/knowledge/feed', (req, res) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: { message: 'title and content are required', type: 'invalid_request_error' } });
    }
    const entry = knowledgeStore.add(title, content, category || 'notes');
    console.log(`📚 Knowledge added: [${entry.category.toUpperCase()}] ${entry.title} (${entry.chars} chars)`);
    res.json({
      success: true,
      entry: {
        id: entry.id, title: entry.title, category: entry.category,
        chars: entry.chars, createdAt: entry.createdAt
      },
      totalEntries: knowledgeStore.entries.length,
      estimatedTokens: knowledgeStore.getTokenEstimate()
    });
  } catch (err) {
    res.status(400).json({ error: { message: err.message, type: 'knowledge_error' } });
  }
});

// List all knowledge entries
app.get('/v1/knowledge/list', (req, res) => {
  res.json({
    entries: knowledgeStore.list(),
    totalEntries: knowledgeStore.entries.length,
    totalChars: knowledgeStore.getTotalChars(),
    estimatedTokens: knowledgeStore.getTokenEstimate()
  });
});

// Update a knowledge entry
app.put('/v1/knowledge/update', (req, res) => {
  try {
    const { id, title, content, category } = req.body;
    if (!id) {
      return res.status(400).json({ error: { message: 'id is required', type: 'invalid_request_error' } });
    }
    const fields = {};
    if (title !== undefined) fields.title = title;
    if (content !== undefined) fields.content = content;
    if (category !== undefined) fields.category = category;

    const entry = knowledgeStore.update(id, fields);
    console.log(`📝 Knowledge updated: [${entry.category.toUpperCase()}] ${entry.title}`);
    res.json({
      success: true,
      entry: {
        id: entry.id, title: entry.title, category: entry.category,
        chars: entry.chars, updatedAt: entry.updatedAt
      }
    });
  } catch (err) {
    res.status(400).json({ error: { message: err.message, type: 'knowledge_error' } });
  }
});

// Remove a knowledge entry
app.delete('/v1/knowledge/remove', (req, res) => {
  try {
    const id = req.body?.id || req.query?.id;
    if (!id) {
      return res.status(400).json({ error: { message: 'id is required', type: 'invalid_request_error' } });
    }
    const removed = knowledgeStore.remove(id);
    console.log(`🗑️  Knowledge removed: ${removed.title}`);
    res.json({
      success: true,
      removed: { id: removed.id, title: removed.title },
      remainingEntries: knowledgeStore.entries.length
    });
  } catch (err) {
    res.status(400).json({ error: { message: err.message, type: 'knowledge_error' } });
  }
});

// Clear all knowledge
app.delete('/v1/knowledge/clear', (req, res) => {
  const count = knowledgeStore.clear();
  console.log(`🗑️  Cleared all knowledge (${count} entries removed)`);
  res.json({ success: true, entriesCleared: count });
});

// Import knowledge from a file on disk
app.post('/v1/knowledge/import-file', async (req, res) => {
  try {
    const { path: filePath, title, category } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: { message: 'path is required', type: 'invalid_request_error' } });
    }
    const result = await processFile(filePath);
    const entryTitle = title || `Imported: ${result.name}`;
    const entry = knowledgeStore.add(entryTitle, result.content, category || 'reference');

    console.log(`📚 Knowledge imported from file: ${result.name} → [${entry.category.toUpperCase()}] ${entry.title}`);
    res.json({
      success: true,
      source: {
        path: result.path, name: result.name,
        type: result.type, size: result.size
      },
      entry: {
        id: entry.id, title: entry.title, category: entry.category,
        chars: entry.chars, createdAt: entry.createdAt
      },
      totalEntries: knowledgeStore.entries.length,
      estimatedTokens: knowledgeStore.getTokenEstimate()
    });
  } catch (err) {
    res.status(400).json({ error: { message: err.message, type: 'import_error' } });
  }
});

// ─────────────────────────────────────────────────
// Startup
// ─────────────────────────────────────────────────
async function start() {
  await detectMode();

  const server = app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║          🚇  CUE Tunnel API — Running!              ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  Server:  http://localhost:${String(PORT).padEnd(25)}║
║  Mode:    ${activeMode === 'sdk' ? '🐍 SDK (Option B)'.padEnd(42) : '⌨️  CLI (Option A)'.padEnd(42)}║
║                                                      ║
║  ─── CUE Settings ───                                ║
║  Provider:  Custom                                   ║
║  Base URL:  http://localhost:${String(PORT).padEnd(23)}║
║  Model:     antigravity                              ║
║  API Key:   (leave empty or any value)               ║
║                                                      ║
║  Endpoints:                                          ║
║  POST /v1/chat/completions  ← CUE calls this        ║
║  GET  /v1/models            ← Model listing          ║
║  GET  /v1/tunnel/status     ← Health check           ║
║  POST /v1/tunnel/mode       ← Switch cli/sdk         ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
      console.error(`   Another instance of the tunnel is already running in another window.`);
      console.error(`   Close that window first, or find and stop the process using port ${PORT}.\n`);
      process.exit(1);
    } else {
      console.error('❌ Server startup error:', err.message);
      process.exit(1);
    }
  });
}

start().catch(console.error);
