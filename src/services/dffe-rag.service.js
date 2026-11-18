/**
 * DFFE Environmental Knowledge, RAG & Directorate Agent Studio Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides deterministic document retrieval, UNEP EnvironmentGPT-aligned
 * filtering (Report Series, Year, Audience), Siviwe Mpondo's 3-Phase
 * Information Management (FM/IM) Content Sensitivity Governance, and
 * Alucias Makonko's Self-Service Directorate Agent Creation & URL Grounding.
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
  sawic: 'waste',
  internal_sop: 'internal_sop',
  internal: 'internal_sop',
  sop: 'internal_sop'
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

const PHASE_ALIASES = {
  phase1: 'phase1_internal',
  phase1_internal: 'phase1_internal',
  internal: 'phase1_internal',
  teams: 'phase1_internal',
  phase2: 'phase2_public',
  phase2_public: 'phase2_public',
  public: 'phase2_public',
  external: 'phase2_public',
  whatsapp: 'phase2_public',
  phase3: 'phase3_enterprise',
  phase3_enterprise: 'phase3_enterprise',
  enterprise: 'phase3_enterprise',
  rbac: 'phase3_enterprise',
  restricted: 'phase3_enterprise'
};

class DffeRagService {
  constructor() {
    this.customDocuments = [];
    this.customAgents = [];
  }

  /**
   * Return all documents (core verified corpus + dynamically grounded directorate sources)
   */
  getAllDocuments() {
    return [...this.customDocuments, ...corpus.documents];
  }

  /**
   * Return corpus metadata (series list, years, audiences, governance policy, phases, agents)
   */
  getMetadata() {
    const allDocs = this.getAllDocuments();
    return {
      ...corpus.metadata,
      documentCount: allDocs.length,
      customDocumentCount: this.customDocuments.length,
      directorateAgents: this.getDirectorateAgents()
    };
  }

  /**
   * Return predefined + custom-created DFFE Directorate Agents
   */
  getDirectorateAgents() {
    const baseAgents = Array.isArray(corpus.metadata.directorateAgents)
      ? corpus.metadata.directorateAgents
      : [];
    return [...baseAgents, ...this.customAgents];
  }

  /**
   * Return deployment phase metadata
   */
  getDeploymentPhases() {
    return Array.isArray(corpus.metadata.deploymentPhases)
      ? corpus.metadata.deploymentPhases
      : [];
  }

  /**
   * Normalize deployment phase
   */
  normalizePhase(phase, audience = 'public') {
    if (phase && typeof phase === 'string') {
      const key = phase.trim().toLowerCase();
      if (PHASE_ALIASES[key]) return PHASE_ALIASES[key];
    }
    if (audience === 'officials') return 'phase1_internal';
    return 'phase2_public';
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
   * Dynamically ground a custom URL or policy document into the DFFE RAG Corpus
   * (Fulfils Alucias Makonko & Microsoft Copilot Studio self-service grounding requirement)
   */
  groundCustomSource(spec = {}) {
    const title = (spec.title || 'Custom DFFE Directorate Grounded Source').trim();
    const url = (spec.url || 'https://www.dffe.gov.za').trim();
    const series = this.normalizeSeries(spec.series || 'soer');
    const year = String(spec.year || new Date().getFullYear());
    const branch = (spec.branch || 'DFFE Directorate Custom Grounding').trim();
    const sensitivity = ['public', 'internal', 'restricted'].includes(spec.sensitivity)
      ? spec.sensitivity
      : 'internal';
    const summary = (spec.summary || `Custom grounded source from ${url}`).trim();

    let keyFindings = [];
    if (Array.isArray(spec.keyFindings) && spec.keyFindings.length > 0) {
      keyFindings = spec.keyFindings.map(f => String(f).trim()).filter(Boolean);
    } else if (typeof spec.content === 'string' && spec.content.trim()) {
      keyFindings = spec.content
        .split(/\r?\n|(?<=[.?!])\s+/)
        .map(s => s.replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(s => s.length >= 20)
        .slice(0, 6);
    }
    if (keyFindings.length === 0) {
      keyFindings = [
        `Grounded from official URL/document (${url}) for ${branch}.`,
        summary
      ];
    }

    const seriesMeta = corpus.metadata.seriesCatalogue.find(s => s.id === series) || corpus.metadata.seriesCatalogue[0];
    const governanceMap = {
      public: 'PUBLIC — Directorate Verified Grounded Source',
      internal: 'INTERNAL OFFICIAL — Phase 1 Directorate Grounded Source',
      restricted: 'RESTRICTED / SENSITIVE — Phase 3 FM/IM Authorised Grounding'
    };

    const rawTokens = this.tokenize(`${title} ${summary} ${keyFindings.join(' ')}`).slice(0, 14);
    const id = `dffe-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const newDoc = {
      id,
      title,
      series: series === 'all' ? 'soer' : series,
      seriesLabel: seriesMeta.label === 'All DFFE Sources' ? 'Directorate Grounded Source' : seriesMeta.label,
      year,
      branch,
      audiences: sensitivity === 'public' ? ['public', 'officials', 'researchers', 'compliance'] : ['officials', 'compliance'],
      sensitivity,
      governance: governanceMap[sensitivity],
      citation: `DFFE Directorate Grounding (${year}). ${title}. Retrieved from ${url}`,
      url,
      summary,
      keyFindings,
      keywords: rawTokens,
      isCustomGrounded: true
    };

    this.customDocuments.unshift(newDoc);
    return newDoc;
  }

  /**
   * Create and register a custom DFFE Directorate Agent
   * (Fulfils Microsoft Copilot Agent Creation demo & Alucias Makonko's internal agent builder requirement)
   */
  createDirectorateAgent(spec = {}) {
    const name = (spec.name || 'Custom DFFE Directorate Agent').trim();
    const directorate = (spec.directorate || 'DFFE Directorate').trim();
    const defaultSeries = this.normalizeSeries(spec.defaultSeries || spec.series || 'all');
    const defaultAudience = this.normalizeAudience(spec.defaultAudience || spec.audience || 'officials');
    const sensitivity = ['public', 'internal', 'restricted'].includes(spec.sensitivity)
      ? spec.sensitivity
      : 'internal';
    const description = (spec.description || `Scoped conversational agent for ${directorate}.`).trim();
    const deliverableFormat = (spec.deliverableFormat || 'Ministerial Briefing Note & Cited Compliance Summary').trim();
    const instructions = (spec.instructions || '').trim();

    const groundingUrls = Array.isArray(spec.groundingUrls)
      ? spec.groundingUrls.map(u => String(u).trim()).filter(Boolean)
      : (typeof spec.groundingUrl === 'string' && spec.groundingUrl.trim() ? [spec.groundingUrl.trim()] : ['https://www.dffe.gov.za']);

    const channels = Array.isArray(spec.channels) && spec.channels.length > 0
      ? spec.channels
      : (sensitivity === 'public'
        ? ['Internal Teams', 'dffe.gov.za Web', 'Citizen WhatsApp']
        : ['Internal Teams', 'DFFE Intranet Studio']);

    let groundedDoc = null;
    if ((spec.customDocumentText && spec.customDocumentText.trim()) || (spec.groundingTitle && spec.groundingTitle.trim())) {
      groundedDoc = this.groundCustomSource({
        title: spec.groundingTitle || `${name} — Grounded Reference Document`,
        url: groundingUrls[0] || 'https://www.dffe.gov.za',
        series: defaultSeries === 'all' ? 'internal_sop' : defaultSeries,
        year: String(new Date().getFullYear()),
        branch: directorate,
        sensitivity,
        summary: description,
        content: spec.customDocumentText || description
      });
    }

    const agent = {
      id: `dffe-agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      directorate,
      defaultSeries,
      defaultAudience,
      sensitivity,
      channels,
      groundingUrls,
      description,
      deliverableFormat,
      instructions,
      groundedDocumentId: groundedDoc ? groundedDoc.id : null,
      isCustomAgent: true,
      createdAt: new Date().toISOString()
    };

    this.customAgents.push(agent);
    return { agent, groundedDocument: groundedDoc };
  }

  /**
   * Detect if a natural-language query is asking about DFFE, South African environmental
   * programmes, State of the Environment (SoER), NEMA/EIA, EPWP, forestry, fisheries, etc.
   */
  isDffeQuery(text) {
    if (!text || typeof text !== 'string') return false;
    const lower = text.trim().toLowerCase();
    if (lower.length < 4) return false;

    return /\b(dffe|department of forestry|state of the environment|soer|saeo|environmental programmes?|working for water|working on fire|working for wetlands|working for the coast|working on waste|groen sebenza|ten million trees|nema|nemba|nemwa|nemaqa|nempaa|saaqis|sawic|ocims|frap|fishing rights|green scorpions|climate change act|sector emission targets|carbon budgets|basic assessment|environmental authorisation|environmental impact assessment|circular economy|extended producer responsibility|section 31l|section 24g|ministerial briefing|directorate agent)\b/i.test(lower);
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
   * Search and filter the verified DFFE corpus with 3-Phase FM/IM Sensitivity Governance
   * @param {object} options
   * @param {string} [options.query]
   * @param {string} [options.series]
   * @param {string} [options.year]
   * @param {string} [options.audience]
   * @param {string} [options.accessPhase]
   * @param {number} [options.limit]
   */
  searchKnowledge(options = {}) {
    const rawQuery = typeof options.query === 'string' ? options.query.trim() : '';
    const series = this.normalizeSeries(options.series);
    const year = this.normalizeYear(options.year);
    const audience = this.normalizeAudience(options.audience);
    const accessPhase = this.normalizePhase(options.accessPhase, audience);
    const limit = Math.min(Math.max(Number(options.limit) || 4, 1), 10);

    const phaseMeta = this.getDeploymentPhases().find(p => p.id === accessPhase) || this.getDeploymentPhases()[1] || {
      id: 'phase2_public',
      name: 'Phase 2: External Public Web & WhatsApp',
      shortLabel: 'Phase 2: Public / WhatsApp',
      allowedSensitivities: ['public'],
      authContext: 'Anonymous Citizen / Public Stakeholder'
    };

    const allowedSensitivities = Array.isArray(phaseMeta.allowedSensitivities)
      ? phaseMeta.allowedSensitivities
      : ['public'];

    const queryLower = rawQuery.toLowerCase();
    const tokens = this.tokenize(rawQuery);
    const allDocuments = this.getAllDocuments();

    // Track documents withheld due to Information Management (FM/IM) Sensitivity Gate
    const withheldBySensitivity = [];

    // 1. Apply hard metadata & FM/IM sensitivity filters
    let candidates = allDocuments.filter(doc => {
      const docSensitivity = doc.sensitivity || 'public';
      if (!allowedSensitivities.includes(docSensitivity)) {
        withheldBySensitivity.push({
          id: doc.id,
          title: doc.title,
          sensitivity: docSensitivity,
          governance: doc.governance
        });
        return false;
      }
      if (series !== 'all' && doc.series !== series) return false;
      if (year !== 'all' && String(doc.year).toLowerCase() !== year.toLowerCase()) return false;
      if (audience !== 'all' && Array.isArray(doc.audiences) && !doc.audiences.includes(audience)) {
        // In Phase 1 (Internal) or Phase 3 (Enterprise), allow official/restricted docs even if audience filter was set to public
        if (docSensitivity === 'public') return false;
      }
      return true;
    });

    // If strict year/series filter yielded 0 documents, relax year filter so user still sees closest verified DFFE sources with a filter note
    let filterRelaxed = false;
    if (candidates.length === 0 && year !== 'all') {
      candidates = allDocuments.filter(doc => {
        const docSensitivity = doc.sensitivity || 'public';
        if (!allowedSensitivities.includes(docSensitivity)) return false;
        return series === 'all' || doc.series === series;
      });
      filterRelaxed = true;
    }

    // 2. Score each candidate document against query
    const scored = candidates.map(doc => {
      let score = doc.isCustomGrounded ? 4 : 0;
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
      if (/\b(internal|sop|ministerial briefing|sharepoint|teams|directorate agent)\b/i.test(queryLower) && doc.id === 'dffe-internal-directorate-sop-2026') {
        score += 20;
      }
      if (/\b(restricted|docket|section 31l|section 24g|enforcement register|criminal|neces)\b/i.test(queryLower) && doc.id === 'dffe-restricted-emi-enforcement-register-2026') {
        score += 22;
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
        audienceLabel: audienceMeta.label,
        accessPhase: phaseMeta.id,
        accessPhaseLabel: phaseMeta.shortLabel || phaseMeta.name
      },
      sensitivityAudit: {
        phaseId: phaseMeta.id,
        phaseName: phaseMeta.name,
        authContext: phaseMeta.authContext,
        allowedSensitivities,
        withheldCount: withheldBySensitivity.length,
        withheldDocuments: withheldBySensitivity
      },
      governance: corpus.metadata.governancePolicy,
      officialPortal: corpus.metadata.officialPortal,
      totalCorpusDocuments: allDocuments.length,
      matchCount: matchedDocs.length,
      fallbackUsed,
      filterRelaxed,
      documents: matchedDocs,
      catalogue: {
        series: corpus.metadata.seriesCatalogue,
        audiences: corpus.metadata.audiences,
        years: corpus.metadata.years,
        phases: this.getDeploymentPhases(),
        agents: this.getDirectorateAgents()
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

    const { query, filters, documents, fallbackUsed, sensitivityAudit } = searchResult;
    const lines = [
      '[DFFE VERIFIED ENVIRONMENTAL KNOWLEDGE BASE — RAG GROUNDING CONTEXT]',
      `Query: "${query}"`,
      `Active Filters: Series="${filters.seriesLabel}" | Year="${filters.year}" | Target Audience="${filters.audienceLabel}"`,
      `Deployment Phase & FM/IM Governance Context: ${sensitivityAudit?.phaseName || 'Phase 2: Public'} (${sensitivityAudit?.authContext || 'Public'}) — Allowed Sensitivity Tiers: [${(sensitivityAudit?.allowedSensitivities || ['public']).join(', ').toUpperCase()}]`,
      'SCIENTIFIC INTEGRITY & INFORMATION MANAGEMENT (FM/IM) DIRECTIVE:',
      '1. Ground your response strictly in the verified Department of Forestry, Fisheries and the Environment (DFFE) documents provided below.',
      '2. Cite specific DFFE report titles, publication years, statutory acts (e.g., NEMA Act 107 of 1998, Climate Change Act 22 of 2024, NEMWA, NEMBA), and official URLs (https://www.dffe.gov.za/...).',
      '3. Tailor the explanation to the selected Target Audience and Deployment Phase while preserving scientific accuracy and quantitative indicators.',
      '4. Enforce Information Management (FM/IM) Sensitivity Guardrails: If the user asks for restricted enforcement dockets, Section 31L compliance notices, or internal SOPs while operating in Phase 2 (External Public Web/WhatsApp), explicitly state that the FM/IM Sensitivity Gate blocks unauthenticated access to internal/restricted DFFE records.'
    ];

    if (sensitivityAudit && sensitivityAudit.withheldCount > 0) {
      lines.push(`FM/IM SENSITIVITY GATE NOTICE: ${sensitivityAudit.withheldCount} internal/restricted DFFE record(s) (${sensitivityAudit.withheldDocuments.map(w => `${w.title} [${w.sensitivity.toUpperCase()}]`).join('; ')}) were withheld in the current access phase (${sensitivityAudit.phaseId}).`);
    }

    if (fallbackUsed) {
      lines.push('NOTE: No exact keyword match was found in the filtered DFFE corpus for this specific query; below are the closest baseline DFFE reference reports. State clearly if a specific sub-topic is not covered in the verified corpus.');
    }

    lines.push('\n--- RETRIEVED DFFE SOURCE DOCUMENTS ---');

    documents.forEach((doc, idx) => {
      lines.push(`\n[Source ${idx + 1}] ${doc.title} (${doc.year})`);
      lines.push(`- Series: ${doc.seriesLabel} | Responsible Branch: ${doc.branch}`);
      lines.push(`- Sensitivity & Governance Classification: [${(doc.sensitivity || 'public').toUpperCase()}] ${doc.governance}`);
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
