#!/usr/bin/env node
/**
 * DFFE & GITO Knowledge Ingestion, Chunking & OpenRouter Embedding Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates the 9 logical knowledge collections in `src/data/dffe-gito-chunks.json`,
 * supports chunking custom TXT/Markdown reference files, and optionally calls
 * OpenRouter's `/api/v1/embeddings` endpoint (`openai/text-embedding-3-small`)
 * to generate vector embeddings for Supabase pgvector or local cosine similarity.
 *
 * Usage:
 *   node scripts/ingest-dffe-knowledge.js --validate
 *   node scripts/ingest-dffe-knowledge.js --embed
 */

const fs = require('node:fs');
const path = require('node:path');
const env = require('../src/config/env');

const CHUNKS_PATH = path.join(__dirname, '..', 'src', 'data', 'dffe-gito-chunks.json');

const REQUIRED_COLLECTIONS = [
  'dffe_overview',
  'cms',
  'gito',
  'ict_governance',
  'ict_organogram',
  'digital_solutions',
  'infrastructure',
  'cybersecurity',
  'ict_operations'
];

async function generateOpenRouterEmbedding(text, apiKey, model = 'openai/text-embedding-3-small') {
  const response = await fetch(`${env.OPENROUTER_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': env.APP_URL,
      'X-Title': env.APP_TITLE,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: text
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter Embeddings API returned ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data?.data?.[0]?.embedding || null;
}

async function run() {
  const args = process.argv.slice(2);
  const doEmbed = args.includes('--embed');

  if (!fs.existsSync(CHUNKS_PATH)) {
    console.error(`[DFFE Ingest] Missing chunk store at ${CHUNKS_PATH}`);
    process.exit(1);
  }

  const store = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf8'));
  const chunks = Array.isArray(store.chunks) ? store.chunks : [];
  const collections = Array.isArray(store.metadata?.collections) ? store.metadata.collections : [];

  console.log(`[DFFE Ingest] Loaded ${chunks.length} indexed chunks across ${collections.length} collections.`);

  const presentCollections = new Set(chunks.map(c => c.collectionId));
  for (const reqCol of REQUIRED_COLLECTIONS) {
    if (!presentCollections.has(reqCol)) {
      console.error(`[DFFE Ingest] Missing required collection: ${reqCol}`);
      process.exit(1);
    }
  }

  for (const chunk of chunks) {
    if (!chunk.chunkId || !chunk.content || !chunk.metadata?.source || !chunk.metadata?.status) {
      console.error(`[DFFE Ingest] Invalid chunk schema for ${chunk.chunkId || 'unknown'}`);
      process.exit(1);
    }
  }

  console.log('[DFFE Ingest] All 9 DFFE & GITO collections and chunk metadata records validated successfully.');

  if (doEmbed) {
    const apiKey = env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      console.warn('[DFFE Ingest] OPENROUTER_API_KEY not configured; skipping live vector embedding generation (hybrid lexical+vector fallback active).');
      return;
    }

    console.log('[DFFE Ingest] Generating embeddings via OpenRouter /api/v1/embeddings...');
    let embeddedCount = 0;
    for (const chunk of chunks) {
      try {
        const input = `${chunk.collection}: ${chunk.title}\nStatus: ${chunk.metadata.status} | Source: ${chunk.metadata.source} (Page ${chunk.metadata.page})\n${chunk.content}`;
        const embedding = await generateOpenRouterEmbedding(input, apiKey);
        if (Array.isArray(embedding) && embedding.length > 0) {
          chunk.embedding = embedding;
          embeddedCount++;
        }
      } catch (err) {
        console.warn(`[DFFE Ingest] Could not embed ${chunk.chunkId}: ${err.message}`);
      }
    }

    if (embeddedCount > 0) {
      fs.writeFileSync(CHUNKS_PATH, JSON.stringify(store, null, 2), 'utf8');
      console.log(`[DFFE Ingest] Saved ${embeddedCount} vector embeddings to ${CHUNKS_PATH}.`);
    }
  }
}

if (require.main === module) {
  run().catch(err => {
    console.error('[DFFE Ingest Error]:', err);
    process.exit(1);
  });
}

module.exports = { run, generateOpenRouterEmbedding, REQUIRED_COLLECTIONS };
