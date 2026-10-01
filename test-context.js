/**
 * Test Suite for Local File Intelligence & Knowledge Feed
 *
 * Can be run standalone to verify:
 *   1. file-processor.js (reading, scanning, browsing, file type detection)
 *   2. knowledge-store.js (CRUD, persistence, formatting, categories)
 *   3. Live HTTP endpoints (if tunnel server is running on http://localhost:5678)
 *
 * Usage:
 *   node test-context.js
 */

const path = require('path');
const fs = require('fs');
const {
  processFile,
  scanFolder,
  browseFolder,
  detectFileType,
  getAllSupportedExtensions,
  formatBytes
} = require('./file-processor');
const KnowledgeStore = require('./knowledge-store');

const SERVER = 'http://localhost:5678';
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runUnitTests() {
  console.log('\n========================================');
  console.log('🧪 Unit Tests: file-processor.js');
  console.log('========================================');

  // Test 1: detectFileType
  const jsType = detectFileType('server.js');
  assert(jsType.supported === true && jsType.category === 'code', 'detectFileType("server.js") -> code, supported');

  const mdType = detectFileType('README.md');
  assert(mdType.supported === true && mdType.category === 'text', 'detectFileType("README.md") -> text, supported');

  const pdfType = detectFileType('document.pdf');
  assert(pdfType.supported === true && pdfType.category === 'pdf', 'detectFileType("document.pdf") -> pdf, supported');

  const docxType = detectFileType('report.docx');
  assert(docxType.supported === true && docxType.category === 'word', 'detectFileType("report.docx") -> word, supported');

  const xlsxType = detectFileType('data.xlsx');
  assert(xlsxType.supported === true && xlsxType.category === 'excel', 'detectFileType("data.xlsx") -> excel, supported');

  const imgType = detectFileType('photo.png');
  assert(imgType.supported === true && imgType.category === 'image', 'detectFileType("photo.png") -> image, supported');

  const unkType = detectFileType('archive.zip');
  assert(unkType.supported === false, 'detectFileType("archive.zip") -> unsupported');

  // Test 2: processFile on this workspace's package.json
  const pkgPath = path.join(__dirname, 'package.json');
  const pkgResult = await processFile(pkgPath);
  assert(pkgResult.name === 'package.json', 'processFile read package.json name correctly');
  assert(pkgResult.content.includes('cue-tunnel-api'), 'processFile read package.json content correctly');
  assert(pkgResult.lines > 5, `processFile counted lines correctly (${pkgResult.lines} lines)`);

  // Test 3: browseFolder
  const browseResult = browseFolder(__dirname);
  assert(browseResult.path === __dirname, 'browseFolder returns current directory');
  assert(Array.isArray(browseResult.contents) && browseResult.contents.length > 0, `browseFolder found ${browseResult.contents.length} items`);
  const foundServer = browseResult.contents.some(c => c.name === 'server.js');
  assert(foundServer, 'browseFolder listed server.js');

  // Test 4: scanFolder
  const scanResult = await scanFolder(__dirname, {
    recursive: false,
    extensions: ['.js', '.json', '.md'],
    maxFiles: 10
  });
  assert(scanResult.loaded.length > 0, `scanFolder loaded ${scanResult.loaded.length} files`);
  const loadedPkg = scanResult.loaded.some(f => f.name === 'package.json');
  assert(loadedPkg, 'scanFolder loaded package.json');

  console.log('\n========================================');
  console.log('🧪 Unit Tests: knowledge-store.js');
  console.log('========================================');

  const testStore = new KnowledgeStore();
  const initialCount = testStore.entries.length;

  // Add entry
  const entry = testStore.add('Test Rule', 'Always be concise and accurate.', 'rules');
  assert(entry && entry.id.startsWith('kb-'), 'testStore.add returned new entry with ID');
  assert(testStore.entries.length === initialCount + 1, 'testStore.entries count increased by 1');

  // Format entry
  const formatted = testStore.format();
  assert(formatted.includes('Always be concise and accurate.'), 'testStore.format includes content');
  assert(formatted.includes('Test Rule'), 'testStore.format includes title');

  // Update entry
  const updated = testStore.update(entry.id, { content: 'Updated rule content.' });
  assert(updated.content === 'Updated rule content.', 'testStore.update changed content');

  // Clean up test entry
  testStore.remove(entry.id);
  assert(testStore.entries.length === initialCount, 'testStore.remove removed the test entry');
}

async function runLiveEndpointTests() {
  console.log('\n========================================');
  console.log('🌐 Integration Tests: Live HTTP Endpoints');
  console.log('========================================');

  let serverUp = false;
  try {
    const res = await fetch(`${SERVER}/v1/tunnel/status`);
    if (res.ok) serverUp = true;
  } catch {
    serverUp = false;
  }

  if (!serverUp) {
    console.log('  ⚠️  Tunnel server is not running on port 5678.');
    console.log('      To test HTTP endpoints, start the server (`node server.js`) and re-run.');
    return;
  }

  console.log('  Connected to server at ' + SERVER);

  // 1. Context: Load single file
  const loadFileRes = await fetch(`${SERVER}/v1/context/load-file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: path.join(__dirname, 'package.json') })
  });
  const loadFileData = await loadFileRes.json();
  assert(loadFileData.success === true, 'POST /v1/context/load-file loaded package.json');

  // 2. Context: List files
  const listCtxRes = await fetch(`${SERVER}/v1/context/list`);
  const listCtxData = await listCtxRes.json();
  assert(listCtxData.files.length >= 1, `GET /v1/context/list returns ${listCtxData.files.length} loaded file(s)`);

  // 3. Context: Browse directory
  const browseRes = await fetch(`${SERVER}/v1/context/browse?path=${encodeURIComponent(__dirname)}`);
  const browseData = await browseRes.json();
  assert(Array.isArray(browseData.contents), 'GET /v1/context/browse returns contents');

  // 4. Knowledge: Feed entry
  const feedRes = await fetch(`${SERVER}/v1/knowledge/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Test Integration Rule',
      content: 'CUE must always confirm understanding.',
      category: 'rules'
    })
  });
  const feedData = await feedRes.json();
  assert(feedData.success === true && feedData.entry?.id, 'POST /v1/knowledge/feed created entry');

  const createdId = feedData.entry?.id;

  // 5. Knowledge: List entries
  const listKbRes = await fetch(`${SERVER}/v1/knowledge/list`);
  const listKbData = await listKbRes.json();
  assert(Array.isArray(listKbData.entries) && listKbData.entries.length >= 1, 'GET /v1/knowledge/list returns entries');

  // 6. Knowledge: Remove entry
  if (createdId) {
    const removeKbRes = await fetch(`${SERVER}/v1/knowledge/remove`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: createdId })
    });
    const removeKbData = await removeKbRes.json();
    assert(removeKbData.success === true, 'DELETE /v1/knowledge/remove deleted entry');
  }

  // 7. Context: Clear
  const clearCtxRes = await fetch(`${SERVER}/v1/context/clear`, { method: 'DELETE' });
  const clearCtxData = await clearCtxRes.json();
  assert(clearCtxData.success === true, 'DELETE /v1/context/clear reset context');
}

async function main() {
  try {
    await runUnitTests();
    await runLiveEndpointTests();

    console.log('\n========================================');
    console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

main();
