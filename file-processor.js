/**
 * File Processor — Local File Intelligence Engine
 *
 * Reads, extracts, and processes files from the user's local filesystem.
 * Supports: code files (25+ languages), text/markdown, PDF, DOCX, XLSX, images (OCR).
 *
 * Rich format packages are OPTIONAL — if not installed, returns a helpful message
 * telling the user which package to install. Core text/code reading works with zero deps.
 *
 * ALL OPERATIONS ARE READ-ONLY — no files are ever modified or deleted.
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────
// Supported File Types by Category
// ─────────────────────────────────────────────────
const FILE_CATEGORIES = {
  code: [
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.py', '.pyw',
    '.java', '.kt', '.kts', '.scala',
    '.c', '.h', '.cpp', '.hpp', '.cc', '.cxx',
    '.cs', '.fs',
    '.go', '.rs',
    '.rb', '.erb',
    '.php',
    '.swift',
    '.r',
    '.lua',
    '.pl', '.pm',
    '.html', '.htm', '.xhtml',
    '.css', '.scss', '.sass', '.less',
    '.vue', '.svelte',
    '.json', '.jsonc',
    '.xml', '.xsl', '.xslt',
    '.yaml', '.yml', '.toml',
    '.sql',
    '.graphql', '.gql',
    '.sh', '.bash', '.zsh',
    '.bat', '.cmd', '.ps1',
    '.proto',
  ],
  text: [
    '.md', '.mdx', '.markdown',
    '.txt', '.text',
    '.log',
    '.csv', '.tsv',
    '.env',
    '.ini', '.cfg', '.conf', '.config',
    '.gitignore', '.gitattributes',
    '.editorconfig',
    '.npmrc', '.yarnrc',
    '.htaccess',
    '.rst',
  ],
  pdf: ['.pdf'],
  word: ['.docx'],
  excel: ['.xlsx', '.xls'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif']
};

// Directories to skip during folder scanning
const DEFAULT_EXCLUDE_DIRS = [
  'node_modules', '.git', 'dist', 'build', 'out',
  '__pycache__', '.next', '.nuxt', '.output',
  'vendor', 'venv', '.venv', 'env',
  '.vscode', '.idea', '.vs',
  'coverage', '.nyc_output',
  '.cache', '.temp', '.tmp', 'tmp',
  'bower_components', '.parcel-cache',
  '.svn', '.hg',
];

// Special filenames recognized as text even without extensions
const TEXT_FILENAMES = [
  'makefile', 'dockerfile', 'rakefile', 'gemfile',
  'procfile', 'vagrantfile', 'jenkinsfile',
  '.gitignore', '.dockerignore', '.editorconfig',
  '.prettierrc', '.eslintrc', '.babelrc',
  'license', 'readme', 'changelog',
];

const DEFAULT_MAX_FILE_SIZE = 512 * 1024; // 512KB
const DEFAULT_MAX_FILES = 50;

// ─────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function parseSizeString(sizeStr) {
  if (typeof sizeStr === 'number') return sizeStr;
  const match = String(sizeStr).match(/^(\d+)\s*(B|KB|MB|GB)?$/i);
  if (!match) return DEFAULT_MAX_FILE_SIZE;
  const num = parseInt(match[1], 10);
  const unit = (match[2] || 'B').toUpperCase();
  switch (unit) {
    case 'KB': return num * 1024;
    case 'MB': return num * 1024 * 1024;
    case 'GB': return num * 1024 * 1024 * 1024;
    default: return num;
  }
}

function getAllSupportedExtensions() {
  return Object.values(FILE_CATEGORIES).flat();
}

// ─────────────────────────────────────────────────
// File Type Detection
// ─────────────────────────────────────────────────
function detectFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath).toLowerCase();

  // Handle special filenames without extensions
  if (!ext && TEXT_FILENAMES.includes(basename)) {
    return { ext: '', category: 'text', supported: true };
  }
  if (TEXT_FILENAMES.includes(basename)) {
    return { ext, category: 'text', supported: true };
  }

  for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
    if (extensions.includes(ext)) {
      return { ext, category, supported: true };
    }
  }

  return { ext, category: null, supported: false };
}

// ─────────────────────────────────────────────────
// File Readers — one per category
// ─────────────────────────────────────────────────

/** Read plain text / code files (built-in, no deps) */
function readTextFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

/** Read PDF files (optional dep: pdf-parse) */
async function readPDF(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || '[PDF contained no extractable text]';
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      const size = formatBytes(fs.statSync(filePath).size);
      return [
        `[PDF file detected: ${path.basename(filePath)}]`,
        `[File size: ${size}]`,
        `[To read PDF content, install: npm install pdf-parse]`,
      ].join('\n');
    }
    throw new Error(`Failed to read PDF: ${err.message}`);
  }
}

/** Read Word documents (optional dep: mammoth) */
async function readDOCX(filePath) {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '[DOCX contained no extractable text]';
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      const size = formatBytes(fs.statSync(filePath).size);
      return [
        `[Word document detected: ${path.basename(filePath)}]`,
        `[File size: ${size}]`,
        `[To read DOCX content, install: npm install mammoth]`,
      ].join('\n');
    }
    throw new Error(`Failed to read DOCX: ${err.message}`);
  }
}

/** Read Excel spreadsheets (optional dep: xlsx) */
async function readXLSX(filePath) {
  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheets = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      sheets.push(`--- Sheet: ${sheetName} ---\n${csv}`);
    }

    return sheets.join('\n\n') || '[XLSX contained no data]';
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      const size = formatBytes(fs.statSync(filePath).size);
      return [
        `[Excel file detected: ${path.basename(filePath)}]`,
        `[File size: ${size}]`,
        `[To read XLSX content, install: npm install xlsx]`,
      ].join('\n');
    }
    throw new Error(`Failed to read XLSX: ${err.message}`);
  }
}

/** Read images via OCR (optional dep: tesseract.js) */
async function readImage(filePath) {
  try {
    const Tesseract = require('tesseract.js');
    const { data } = await Tesseract.recognize(filePath, 'eng');
    if (data.text && data.text.trim()) {
      return `[OCR extracted text from image: ${path.basename(filePath)}]\n${data.text}`;
    }
    return `[Image: ${path.basename(filePath)} — OCR found no readable text in this image]`;
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      const size = formatBytes(fs.statSync(filePath).size);
      return [
        `[Image file detected: ${path.basename(filePath)}]`,
        `[File size: ${size}]`,
        `[To extract text via OCR, install: npm install tesseract.js]`,
      ].join('\n');
    }
    throw new Error(`Failed to process image: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────
// Main Processing Functions
// ─────────────────────────────────────────────────

/**
 * Process a single file: detect type, read content, return structured result.
 * @param {string} filePath - Absolute or relative path to the file
 * @param {object} options - { maxSizePerFile: number }
 * @returns {Promise<object>} Processed file data with content
 */
async function processFile(filePath, options = {}) {
  const maxSize = options.maxSizePerFile || DEFAULT_MAX_FILE_SIZE;
  const normalizedPath = path.resolve(filePath);

  if (!fs.existsSync(normalizedPath)) {
    throw new Error(`File not found: ${normalizedPath}`);
  }

  const stats = fs.statSync(normalizedPath);

  if (!stats.isFile()) {
    throw new Error(`Not a file: ${normalizedPath}`);
  }

  const fileType = detectFileType(normalizedPath);

  if (!fileType.supported) {
    throw new Error(`Unsupported file type: ${fileType.ext || 'no extension'}`);
  }

  if (stats.size > maxSize) {
    throw new Error(`File exceeds size limit: ${formatBytes(stats.size)} (max: ${formatBytes(maxSize)})`);
  }

  let content = '';

  switch (fileType.category) {
    case 'code':
    case 'text':
      content = readTextFile(normalizedPath);
      break;
    case 'pdf':
      content = await readPDF(normalizedPath);
      break;
    case 'word':
      content = await readDOCX(normalizedPath);
      break;
    case 'excel':
      content = await readXLSX(normalizedPath);
      break;
    case 'image':
      content = await readImage(normalizedPath);
      break;
    default:
      throw new Error(`No reader available for category: ${fileType.category}`);
  }

  return {
    path: normalizedPath,
    name: path.basename(normalizedPath),
    type: fileType.category,
    ext: fileType.ext,
    size: stats.size,
    lines: content.split('\n').length,
    content,
    processedAt: new Date().toISOString()
  };
}

/**
 * Scan a folder, read all supported files, return results.
 * @param {string} dirPath - Path to directory
 * @param {object} options - { recursive, extensions, maxFiles, maxSizePerFile, exclude }
 * @returns {Promise<object>} { loaded: [...], skipped: [...] }
 */
async function scanFolder(dirPath, options = {}) {
  const normalizedPath = path.resolve(dirPath);

  if (!fs.existsSync(normalizedPath)) {
    throw new Error(`Directory not found: ${normalizedPath}`);
  }

  const stats = fs.statSync(normalizedPath);
  if (!stats.isDirectory()) {
    throw new Error(`Not a directory: ${normalizedPath}`);
  }

  const {
    recursive = true,
    extensions = null,
    maxFiles = DEFAULT_MAX_FILES,
    maxSizePerFile = DEFAULT_MAX_FILE_SIZE,
    exclude = DEFAULT_EXCLUDE_DIRS,
  } = options;

  const results = { loaded: [], skipped: [] };
  const allowedExts = extensions || getAllSupportedExtensions();
  let fileCount = 0;

  async function walkDir(dir) {
    if (fileCount >= maxFiles) return;

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      results.skipped.push({ path: dir, reason: `Cannot read directory: ${err.message}` });
      return;
    }

    // Sort: files first (for predictable loading order)
    entries.sort((a, b) => {
      if (a.isFile() && !b.isFile()) return -1;
      if (!a.isFile() && b.isFile()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of entries) {
      if (fileCount >= maxFiles) break;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (exclude.some(ex => entry.name.toLowerCase() === ex.toLowerCase())) {
          continue;
        }
        if (recursive) {
          await walkDir(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const fileType = detectFileType(entry.name);

        // Check extension filter
        if (!fileType.supported) {
          results.skipped.push({ file: entry.name, path: fullPath, reason: `Unsupported type: ${ext || 'no extension'}` });
          continue;
        }
        if (extensions && !allowedExts.includes(ext)) {
          results.skipped.push({ file: entry.name, path: fullPath, reason: `Filtered by extension whitelist` });
          continue;
        }

        // Check file size
        try {
          const fstats = fs.statSync(fullPath);
          if (fstats.size === 0) {
            results.skipped.push({ file: entry.name, path: fullPath, reason: 'Empty file (0 bytes)' });
            continue;
          }
          if (fstats.size > maxSizePerFile) {
            results.skipped.push({ file: entry.name, path: fullPath, reason: `Exceeds size limit: ${formatBytes(fstats.size)} > ${formatBytes(maxSizePerFile)}` });
            continue;
          }
        } catch {
          results.skipped.push({ file: entry.name, path: fullPath, reason: 'Cannot read file stats' });
          continue;
        }

        // Process file
        try {
          const processed = await processFile(fullPath, { maxSizePerFile });
          results.loaded.push(processed);
          fileCount++;
        } catch (err) {
          results.skipped.push({ file: entry.name, path: fullPath, reason: err.message });
        }
      }
    }
  }

  await walkDir(normalizedPath);

  return results;
}

/**
 * Browse a directory — list contents without loading them.
 * @param {string} dirPath - Path to directory
 * @returns {object} Directory listing with metadata
 */
function browseFolder(dirPath) {
  const normalizedPath = path.resolve(dirPath);

  if (!fs.existsSync(normalizedPath)) {
    throw new Error(`Path not found: ${normalizedPath}`);
  }

  const stats = fs.statSync(normalizedPath);
  if (!stats.isDirectory()) {
    throw new Error(`Not a directory: ${normalizedPath}`);
  }

  let entries;
  try {
    entries = fs.readdirSync(normalizedPath, { withFileTypes: true });
  } catch (err) {
    throw new Error(`Cannot read directory: ${err.message}`);
  }

  const contents = [];

  for (const entry of entries) {
    const fullPath = path.join(normalizedPath, entry.name);

    if (entry.isDirectory()) {
      let childCount = 0;
      try {
        childCount = fs.readdirSync(fullPath).length;
      } catch { /* permission error — ok */ }

      contents.push({
        name: entry.name,
        type: 'directory',
        children: childCount,
        path: fullPath
      });
    } else if (entry.isFile()) {
      try {
        const fstats = fs.statSync(fullPath);
        const fileType = detectFileType(entry.name);
        contents.push({
          name: entry.name,
          type: 'file',
          size: fstats.size,
          sizeFormatted: formatBytes(fstats.size),
          ext: fileType.ext,
          category: fileType.category,
          supported: fileType.supported,
          path: fullPath
        });
      } catch {
        contents.push({
          name: entry.name,
          type: 'file',
          supported: false,
          error: 'Cannot read file info',
          path: fullPath
        });
      }
    }
  }

  // Sort: directories first, then files alphabetically
  contents.sort((a, b) => {
    if (a.type === 'directory' && b.type !== 'directory') return -1;
    if (a.type !== 'directory' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    path: normalizedPath,
    contents,
    totalItems: contents.length,
    directories: contents.filter(c => c.type === 'directory').length,
    files: contents.filter(c => c.type === 'file').length,
    supportedFiles: contents.filter(c => c.type === 'file' && c.supported).length
  };
}

// ─────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────
module.exports = {
  processFile,
  scanFolder,
  browseFolder,
  detectFileType,
  getAllSupportedExtensions,
  formatBytes,
  parseSizeString,
  FILE_CATEGORIES,
  DEFAULT_EXCLUDE_DIRS,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_MAX_FILES,
};
