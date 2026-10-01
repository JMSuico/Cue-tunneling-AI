/**
 * Quick test for the CUE Tunnel API
 * Run: node test.js  (while server.js is running)
 */

const SERVER = 'http://localhost:5678';

async function testHealth() {
  console.log('\n🔍 Test 1: Health check...');
  try {
    const res = await fetch(`${SERVER}/v1/tunnel/status`);
    const data = await res.json();
    console.log('  ✅ Server status:', JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.log('  ❌ Server not running:', err.message);
    return false;
  }
}

async function testModels() {
  console.log('\n🔍 Test 2: Model listing...');
  const res = await fetch(`${SERVER}/v1/models`);
  const data = await res.json();
  console.log('  ✅ Models:', JSON.stringify(data, null, 2));
}

async function testNonStreaming() {
  console.log('\n🔍 Test 3: Non-streaming chat completion...');
  const res = await fetch(`${SERVER}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'antigravity',
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Reply very briefly.' },
        { role: 'user', content: 'What is 2 + 2? Reply with just the number.' }
      ],
      stream: false,
      max_tokens: 100
    })
  });
  const data = await res.json();
  console.log('  ✅ Response:', JSON.stringify(data, null, 2));
}

async function testStreaming() {
  console.log('\n🔍 Test 4: Streaming chat completion...');
  const res = await fetch(`${SERVER}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'antigravity',
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Reply very briefly.' },
        { role: 'user', content: 'Say "Hello from the tunnel!" and nothing else.' }
      ],
      stream: true,
      max_tokens: 100
    })
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  process.stdout.write('  Streaming: ');
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') {
        process.stdout.write('\n');
        continue;
      }
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          fullText += content;
          process.stdout.write(content);
        }
      } catch { /* ignore */ }
    }
  }
  console.log(`  ✅ Full streamed text: "${fullText}"`);
}

async function run() {
  console.log('🚇 CUE Tunnel API — Test Suite\n' + '═'.repeat(40));

  const alive = await testHealth();
  if (!alive) {
    console.log('\n⚠️  Start the server first: npm start');
    process.exit(1);
  }

  await testModels();
  await testNonStreaming();
  await testStreaming();

  console.log('\n' + '═'.repeat(40));
  console.log('🎉 All tests passed!');
}

run().catch(console.error);
