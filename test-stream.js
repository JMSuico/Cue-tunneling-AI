/**
 * HARD VERIFICATION TEST 7: Streaming SSE format validation
 * Uses native Node.js fetch (no PowerShell escaping issues)
 */

const SERVER = 'http://localhost:5678';

async function testStreaming() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  TEST 7/7: STREAMING CHAT COMPLETION (REAL LLM)');
  console.log('═══════════════════════════════════════════════════');
  console.log('  Sending request... (may take 30-60s for AGY CLI boot)');

  const startTime = Date.now();

  const res = await fetch(`${SERVER}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'antigravity',
      messages: [
        { role: 'system', content: 'Reply with ONLY the exact text: CONFIRMED' },
        { role: 'user', content: 'Say it now.' }
      ],
      stream: true,
      max_tokens: 30
    })
  });

  // Validate response headers
  const contentType = res.headers.get('content-type');
  const cors = res.headers.get('access-control-allow-origin');
  console.log(`\n  Response status: ${res.status}`);
  console.log(`  Content-Type: ${contentType}`);
  console.log(`  CORS header: ${cors}`);

  const isSSE = contentType?.includes('text/event-stream');
  console.log(`  Is SSE format: ${isSSE ? '✅ YES' : '❌ NO'}`);

  // Read and parse SSE stream
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullRaw = '';
  let fullContent = '';
  let chunkCount = 0;
  let validChunks = 0;
  let invalidChunks = 0;
  let hasDone = false;
  let hasFinishStop = false;
  let firstChunkId = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    fullRaw += text;

    const lines = text.split('\n').filter(l => l.startsWith('data: '));
    for (const line of lines) {
      const data = line.slice(6).trim();
      if (data === '[DONE]') {
        hasDone = true;
        continue;
      }
      chunkCount++;
      try {
        const parsed = JSON.parse(data);
        // Validate chunk format
        if (parsed.object === 'chat.completion.chunk' &&
            parsed.id &&
            parsed.choices?.[0] !== undefined) {
          validChunks++;
          if (!firstChunkId) firstChunkId = parsed.id;
          const content = parsed.choices[0].delta?.content;
          if (content) fullContent += content;
          if (parsed.choices[0].finish_reason === 'stop') hasFinishStop = true;
        } else {
          invalidChunks++;
          console.log(`  ⚠️ Invalid chunk format: ${data.substring(0, 100)}`);
        }
      } catch (e) {
        invalidChunks++;
        console.log(`  ⚠️ JSON parse error: ${data.substring(0, 100)}`);
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n  ─── RESULTS ───');
  console.log(`  Time elapsed: ${elapsed}s`);
  console.log(`  Total SSE chunks: ${chunkCount}`);
  console.log(`  Valid chunks: ${validChunks} ${validChunks > 0 ? '✅' : '❌'}`);
  console.log(`  Invalid chunks: ${invalidChunks} ${invalidChunks === 0 ? '✅' : '❌'}`);
  console.log(`  Has [DONE] terminator: ${hasDone ? '✅ YES' : '❌ NO'}`);
  console.log(`  Has finish_reason=stop: ${hasFinishStop ? '✅ YES' : '❌ NO'}`);
  console.log(`  Chunk ID format: ${firstChunkId || 'N/A'} ${firstChunkId?.startsWith('chatcmpl-') ? '✅' : '❌'}`);
  console.log(`  Reconstructed content: "${fullContent}"`);

  // Final verdict
  const allPass = isSSE && validChunks > 0 && invalidChunks === 0 && hasDone && hasFinishStop;
  console.log(`\n  ═══ ${allPass ? '✅ PASS: ALL STREAMING CHECKS PASSED!' : '❌ SOME CHECKS FAILED'} ═══`);

  return allPass;
}

testStreaming()
  .then(pass => process.exit(pass ? 0 : 1))
  .catch(err => {
    console.error('  FATAL ERROR:', err.message);
    process.exit(1);
  });
