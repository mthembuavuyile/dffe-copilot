/**
 * DFFE Environmental Knowledge & RAG (Retrieval-Augmented Generation) Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides deterministic document retrieval, UNEP EnvironmentGPT-aligned
 * filtering (Report Series, Year, Audience), scientific integrity verification,
 * and source-cited RAG grounding over published DFFE reports and legislation.
 */

const corpus = require('../data/dffe-corpus.json');

const STOP_WORDS = new Set([
  'what', 'which', 'where', 'when', 'who', 'whom', 'whose', 'why', 'how',
  'are', 'is', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could',
  'may', 'might', 'must', 'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then',
  'else', 'for', 'of', 'to', 'in', 'on', 'at', 'by', 'with', 'from', 'about',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'under', 'again', 'further', 'once', 'here', 'there', 'all', 'any', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'tell', 'me', 'give',
  'show', 'explain', 'summary', 'summarize', 'dffe', 'department'
]);

const SERIES_ALIASES = {
  all: 'all',
  soer: 'soer',
  saeo: 'soer',
  'state-of-environment': 'soer',
  'state of the environment': 'soer',
  programmes: 'programmes',
  programs: 'programmes',
  epwp: 'programmes',
  legislation: 'legislation',
  nema: 'legislation',
  eia: 'legislation',
  compliance: 'legislation',
  climate: 'climate',
  'air-quality': 'climate',
  air: 'climate',
  saaqis: 'climate',
  forestry_fisheries: 'forestry_fisheries',
  forestry: 'forestry_fisheries',
  fisheries: 'forestry_fisheries',
  oceans: 'forestry_fisheries',
  waste: 'waste',
  circular: 'waste',
  chemicals: 'waste',
  sawic: 'waste'
};

const AUDIENCE_ALIASES = {
  all: 'all',
  public: 'public',
  'general public': 'public',
  officials: 'officials',
  internal: 'officials',
  employee: 'officials',
  employees: 'officials',
  researchers: 'researchers',
  policy: 'researchers',
  compliance: 'compliance',
  eia: 'compliance'
};

class DffeRagService {
  /**
   * Return corpus metadata (series list, years, audiences, governance policy)
   */
  getMetadata() {
    return {
      ...corpus.metadata,
      documentCount: corpus.documents.length
    };
  }

  /**
   * Normalize series filter value
   */
  normalizeSeries(series) {
    if (!series || typeof series !== 'string') return 'all';
    const key = series.trim().toLowerCase();
    return SERIES_ALIASES[key] || 'all';
  }

  /**
   * Normalize audience filter value
   */
  normalizeAudience(audience) {
    if (!audience || typeof audience !== 'string') return 'public';
    const key = audience.trim().toLowerCase();
    return AUDIENCE_ALIASES[key] || 'public';
  }

  /**
   * Normalize year filter value
   */
  normalizeYear(year) {
    if (!year || typeof year !== 'string') return 'all';
    const trimmed = year.trim();
    if (/^(all|any|\*)$/i.test(trimmed)) return 'all';
    return trimmed;
  }

  /**
   * Detect if a natural-language query is asking about DFFE, South African environmental
   * programmes, State of the Environment (SoER), NEMA/EIA, EPWP, forestry, fisheries, etc.
   */
  isDffeQuery(text) {
    if (!text || typeof text !== 'string') return false;
    const lower = text.trim().toLowerCase();
    if (lower.length < 4) return false;

    return /\b(dffe|department of forestry|state of the environment|soer|saeo|environmental programmes?|working for water|working on fire|working for wetlands|working for the coast|working on waste|groen sebenza|ten million trees|nema|nemba|nemwa|nemaqa|nempaa|saaqis|sawic|ocims|frap|fishing rights|green scorpions|climate change act|sector emission targets|carbon budgets|basic assessment|environmental authorisation|environmental impact assessment|circular economy|extended producer responsibility)\b/i.test(lower);
  }

  /**
   * Tokenize query into meaningful search terms
   */
  tokenize(query) {
    if (!query || typeof query !== 'string') return [];
    return query
      .toLowerCase()
      .replace(/[^a-z0-9.\-\s]/g, ' ')
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length >= 2 && !STOP_WORDS.has(t));
  }

  /**
   * Search and filter the verified DFFE corpus
   * @param {object} options
   * @param {string} [options.query]
   * @param {string} [options.series]
   * @param {string} [options.year]
   * @param {string} [options.audience]
   * @param {number} [options.limit]
   */
  searchKnowledge(options = {}) {
    const rawQuery = typeof options.query === 'string' ? options.query.trim() : '';
    const series = this.normalizeSeries(options.series);
    const year = this.normalizeYear(options.year);
    const audience = this.normalizeAudience(options.audience);
    const limit = Math.min(Math.max(Number(options.limit) || 4, 1), 8);

    const queryLower = rawQuery.toLowerCase();
    const tokens = this.tokenize(rawQuery);

    // 1. Apply hard metadata filters (series, year, audience)
    let candidates = corpus.documents.filter(doc => {
      if (series !== 'all' && doc.series !== series) return false;
      if (year !== 'all' && String(doc.year).toLowerCase() !== year.toLowerCase()) return false;
      if (audience !== 'all' && Array.isArray(doc.audiences) && !doc.audiences.includes(audience)) {
        return false;
      }
      return true;
    });

    // If strict year/series filter yielded 0 documents, relax year filter so user still sees closest verified DFFE sources with a filter note
    let filterRelaxed = false;
    if (candidates.length === 0 && year !== 'all') {
      candidates = corpus.documents.filter(doc => series === 'all' || doc.series === series);
      filterRelaxed = true;
    }

    // 2. Score each candidate document against query
    const scored = candidates.map(doc => {
      let score = 0;
      const matchedKeywords = [];

      const titleLower = doc.title.toLowerCase();
      const summaryLower = doc.summary.toLowerCase();
      const branchLower = (doc.branch || '').toLowerCase();
      const findingsLower = (doc.keyFindings || []).join(' ').toLowerCase();
      const keywordsList = (doc.keywords || []).map(k => k.toLowerCase());

      // Exact phrase matches on curated keywords
      for (const kw of keywordsList) {
        if (queryLower.includes(kw)) {
          score += kw.includes(' ') ? 12 : 6;
          matchedKeywords.push(kw);
        }
      }

      // Multi-intent boosts for canonical meeting questions
      if (/\b(programme|programmes|working for|epwp|projects)\b/i.test(queryLower) && doc.series === 'programmes') {
        score += 18;
      }
      if (/\b(state of the environment|soer|saeo|latest.*report|key findings)\b/i.test(queryLower) && doc.series === 'soer') {
        score += 18;
      }
      if (/\b(nema|eia|screening|authorisation|basic assessment|listing notice|green scorpions)\b/i.test(queryLower) && doc.id === 'dffe-nema-eia-screening-2026') {
        score += 18;
      }
      if (/\b(climate change|carbon budget|emission target|act 22|ndc|ghg)\b/i.test(queryLower) && doc.id === 'dffe-climate-change-act-2026') {
        score += 18;
      }
      if (/\b(air quality|saaqis|pm2\.5|pm10|priority area|highveld|vaal)\b/i.test(queryLower) && doc.id === 'dffe-saaqis-air-quality-2026') {
        score += 18;
      }
      if (/\b(waste|circular economy|epr|nemwa|sawic|recycling)\b/i.test(queryLower) && doc.id === 'dffe-waste-circular-economy-2026') {
        score += 18;
      }
      if (/\b(fisheries|fishing|frap|forestry|oceans|coasts|ocims|mpa|abalone|hake)\b/i.test(queryLower) && doc.id === 'dffe-forestry-fisheries-oceans-2026') {
        score += 18;
      }
      if (/\b(biodiversity|nemba|white paper|rhino|poaching|tops|bioprospecting)\b/i.test(queryLower) && doc.id === 'dffe-biodiversity-nemba-whitepaper-2026') {
        score += 18;
      }

      // Token-level TF scoring
      for (const token of tokens) {
        if (titleLower.includes(token)) score += 5;
        if (summaryLower.includes(token)) score += 3;
        if (findingsLower.includes(token)) score += 4;
        if (branchLower.includes(token)) score += 2;
        if (keywordsList.some(k => k.includes(token))) score += 3;
      }

      // Rank individual findings within the document so the most relevant bullet points appear first
      const rankedFindings = (doc.keyFindings || []).map(finding => {
        const fLower = finding.toLowerCase();
        let fScore = 0;
        for (const token of tokens) {
          if (fLower.includes(token)) fScore += 2;
        }
        return { text: finding, score: fScore };
      }).sort((a, b) => b.score - a.score).map(f => f.text);

      return {
        ...doc,
        relevanceScore: score,
        matchedKeywords: [...new Set(matchedKeywords)].slice(0, 6),
        keyFindings: rankedFindings
      };
    });

    // Sort by relevanceScore descending; if no query was provided (browse mode), preserve natural order
    const hasActiveQuery = tokens.length > 0;
    const sorted = hasActiveQuery
      ? scored.sort((a, b) => b.relevanceScore - a.relevanceScore)
      : scored;

    // Filter to positive matches when query is specific, or fallback to top overview documents (SoER + Programmes)
    let matchedDocs = hasActiveQuery
      ? sorted.filter(d => d.relevanceScore > 0)
      : sorted;

    let fallbackUsed = false;
    if (matchedDocs.length === 0) {
      fallbackUsed = true;
      matchedDocs = sorted.slice(0, 2);
    } else {
      matchedDocs = matchedDocs.slice(0, limit);
    }

    const seriesMeta = corpus.metadata.seriesCatalogue.find(s => s.id === series) || corpus.metadata.seriesCatalogue[0];
    const audienceMeta = corpus.metadata.audiences.find(a => a.id === audience) || corpus.metadata.audiences[0];

    return {
      query: rawQuery || 'DFFE Environmental Knowledge Overview',
      filters: {
        series,
        seriesLabel: seriesMeta.label,
        year,
        audience,
        audienceLabel: audienceMeta.label
      },
      governance: corpus.metadata.governancePolicy,
      officialPortal: corpus.metadata.officialPortal,
      totalCorpusDocuments: corpus.documents.length,
      matchCount: matchedDocs.length,
      fallbackUsed,
      filterRelaxed,
      documents: matchedDocs,
      catalogue: {
        series: corpus.metadata.seriesCatalogue,
        audiences: corpus.metadata.audiences,
        years: corpus.metadata.years
      }
    };
  }

  /**
   * Format retrieved DFFE documents into an authoritative RAG grounding block
   * for injection into the LLM system prompt.
   */
  formatDffeGroundingContext(searchResult) {
    if (!searchResult || !Array.isArray(searchResult.documents) || searchResult.documents.length === 0) {
      return '';
    }

    const { query, filters, documents, fallbackUsed } = searchResult;
    const lines = [
      '[DFFE VERIFIED ENVIRONMENTAL KNOWLEDGE BASE — RAG GROUNDING CONTEXT]',
      `Query: "${query}"`,
      `Active Filters: Series="${filters.seriesLabel}" | Year="${filters.year}" | Target Audience="${filters.audienceLabel}"`,
      'SCIENTIFIC INTEGRITY & GOVERNANCE DIRECTIVE:',
      '1. Ground your response strictly in the verified Department of Forestry, Fisheries and the Environment (DFFE) documents provided below.',
      '2. Cite specific DFFE report titles, publication years, statutory acts (e.g., NEMA Act 107 of 1998, Climate Change Act 22 of 2024, NEMWA, NEMBA), and official URLs (https://www.dffe.gov.za/...).',
      '3. Tailor the explanation to the selected Target Audience while preserving scientific accuracy and quantitative indicators.',
      '4. If the user asks for internal unpublished DFFE employee records, restricted cabinet memoranda, or facts not supported by verified sources, explicitly state that the information is outside the approved public DFFE corpus and cannot be verified.'
    ];

    if (fallbackUsed) {
      lines.push('NOTE: No exact keyword match was found in the filtered DFFE corpus for this specific query; below are the closest baseline DFFE reference reports. State clearly if a specific sub-topic is not covered in the verified corpus.');
    }

    lines.push('\n--- RETRIEVED DFFE SOURCE DOCUMENTS ---');

    documents.forEach((doc, idx) => {
      lines.push(`\n[Source ${idx + 1}] ${doc.title} (${doc.year})`);
      lines.push(`- Series: ${doc.seriesLabel} | Responsible Branch: ${doc.branch}`);
      lines.push(`- Governance Classification: ${doc.governance}`);
      lines.push(`- Official Citation: ${doc.citation}`);
      lines.push(`- Reference URL: ${doc.url}`);
      lines.push(`- Executive Summary: ${doc.summary}`);
      lines.push(`- Key Verified Findings & Statutory Provisions:`);
      (doc.keyFindings || []).forEach(f => {
        lines.push(`  * ${f}`);
      });
    });

    lines.push('\n--- END DFFE RAG CONTEXT ---');
    return lines.join('\n');
  }
}

module.exports = new DffeRagService();
