/**
 * Knowledge Store — Persistent Local Knowledge Base
 *
 * Stores, retrieves, and manages knowledge entries that get injected
 * into every AI conversation as system context.
 *
 * Data persists in data/knowledge.json and survives server restarts.
 *
 * Categories (in injection priority order):
 *   - rules:     Instructions the AI must follow (highest priority)
 *   - context:   Background info about your project/work
 *   - reference: Documentation, specs, data to consult
 *   - notes:     General notes and reminders (lowest priority)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const KNOWLEDGE_FILE = path.join(DATA_DIR, 'knowledge.json');

const VALID_CATEGORIES = ['rules', 'context', 'reference', 'notes'];
const CATEGORY_PRIORITY = { rules: 0, context: 1, reference: 2, notes: 3 };

class KnowledgeStore {
  constructor() {
    this.entries = [];
    this.version = 1;
    this._ensureDataDir();
    this.load();
  }

  /** Ensure the data/ directory exists */
  _ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  /** Generate a unique entry ID */
  _generateId() {
    return 'kb-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  }

  /** Load knowledge from disk */
  load() {
    try {
      if (fs.existsSync(KNOWLEDGE_FILE)) {
        const raw = fs.readFileSync(KNOWLEDGE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        this.entries = data.entries || [];
        this.version = data.version || 1;
        if (this.entries.length > 0) {
          console.log(`📚 Knowledge store loaded: ${this.entries.length} entries (${this.getTotalChars()} chars)`);
        }
      }
    } catch (err) {
      console.error('⚠️  Failed to load knowledge store:', err.message);
      this.entries = [];
    }
  }

  /** Save knowledge to disk */
  save() {
    this._ensureDataDir();
    const data = JSON.stringify({
      version: this.version,
      lastModified: new Date().toISOString(),
      entries: this.entries
    }, null, 2);
    fs.writeFileSync(KNOWLEDGE_FILE, data, 'utf-8');
  }

  /** Check if there are any entries */
  hasEntries() {
    return this.entries.length > 0;
  }

  /**
   * Add a new knowledge entry
   * @param {string} title - Entry title
   * @param {string} content - Entry content
   * @param {string} category - One of: rules, context, reference, notes
   * @returns {object} Created entry
   */
  add(title, content, category = 'notes') {
    if (!title || typeof title !== 'string') {
      throw new Error('title is required and must be a string');
    }
    if (!content || typeof content !== 'string') {
      throw new Error('content is required and must be a string');
    }
    if (!VALID_CATEGORIES.includes(category)) {
      throw new Error(`Invalid category "${category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }

    const entry = {
      id: this._generateId(),
      title: title.trim(),
      content: content.trim(),
      category,
      chars: content.trim().length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.entries.push(entry);
    this.save();
    return entry;
  }

  /**
   * Update an existing entry
   * @param {string} id - Entry ID
   * @param {object} fields - Fields to update: { title?, content?, category? }
   * @returns {object} Updated entry
   */
  update(id, fields) {
    const idx = this.entries.findIndex(e => e.id === id);
    if (idx === -1) {
      throw new Error(`Knowledge entry not found: ${id}`);
    }

    const entry = this.entries[idx];

    if (fields.title !== undefined) {
      entry.title = String(fields.title).trim();
    }
    if (fields.content !== undefined) {
      entry.content = String(fields.content).trim();
      entry.chars = entry.content.length;
    }
    if (fields.category !== undefined) {
      if (!VALID_CATEGORIES.includes(fields.category)) {
        throw new Error(`Invalid category "${fields.category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`);
      }
      entry.category = fields.category;
    }

    entry.updatedAt = new Date().toISOString();
    this.save();
    return entry;
  }

  /**
   * Remove an entry by ID
   * @param {string} id - Entry ID
   * @returns {object} Removed entry
   */
  remove(id) {
    const idx = this.entries.findIndex(e => e.id === id);
    if (idx === -1) {
      throw new Error(`Knowledge entry not found: ${id}`);
    }
    const removed = this.entries.splice(idx, 1)[0];
    this.save();
    return removed;
  }

  /**
   * Clear all entries
   * @returns {number} Count of entries removed
   */
  clear() {
    const count = this.entries.length;
    this.entries = [];
    this.save();
    return count;
  }

  /**
   * List all entries (with content truncated for preview)
   * @returns {Array} Entry summaries
   */
  list() {
    return this.entries.map(e => ({
      id: e.id,
      title: e.title,
      category: e.category,
      chars: e.chars || e.content.length,
      preview: e.content.substring(0, 120) + (e.content.length > 120 ? '...' : ''),
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    }));
  }

  /**
   * Get a single entry by ID (full content)
   * @param {string} id - Entry ID
   * @returns {object|null} Full entry or null
   */
  getEntry(id) {
    return this.entries.find(e => e.id === id) || null;
  }

  /**
   * Format all knowledge entries for system prompt injection.
   * Entries are sorted by category priority (rules first).
   * @returns {string} Formatted knowledge text block
   */
  format() {
    if (!this.hasEntries()) return '';

    // Sort by category priority: rules → context → reference → notes
    const sorted = [...this.entries].sort((a, b) => {
      return (CATEGORY_PRIORITY[a.category] ?? 99) - (CATEGORY_PRIORITY[b.category] ?? 99);
    });

    const parts = [
      '══════════════════════════════════════════',
      '📚 YOUR KNOWLEDGE BASE',
      'You must adopt, follow, apply, obey, learn, study, and understand the following knowledge.',
      'Apply this knowledge in ALL your responses without exception.',
      '══════════════════════════════════════════',
    ];

    for (const entry of sorted) {
      parts.push(`\n### [${entry.category.toUpperCase()}] ${entry.title}`);
      parts.push(entry.content);
    }

    parts.push('\n══════════════════════════════════════════');

    return parts.join('\n');
  }

  /** Get total character count across all entries */
  getTotalChars() {
    return this.entries.reduce((sum, e) => sum + (e.chars || e.content.length), 0);
  }

  /** Estimate total token usage (~4 chars per token) */
  getTokenEstimate() {
    return Math.ceil(this.getTotalChars() / 4);
  }
}

module.exports = KnowledgeStore;
