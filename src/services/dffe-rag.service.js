/**
 * DFFE Environmental Knowledge, RAG & Directorate Agent Studio Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides deterministic document retrieval, UNEP EnvironmentGPT-aligned
 * filtering (Report Series, Year, Audience), Siviwe Mpondo's 3-Phase
 * Information Management (FM/IM) Content Sensitivity Governance, and
 * Alucias Makonko's Self-Service Directorate Agent Creation & URL Grounding.
 */

const corpus = require('../data/dffe-corpus.json');
const branchesManifest = require('../data/dffe-branches.json');
const gitoChunksStore = require('../data/dffe-gito-chunks.json');

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
  sop: 'internal_sop',
  gito_ict: 'gito_ict',
  gito: 'gito_ict',
  ict: 'gito_ict',
  organogram: 'gito_ict',
  cms: 'gito_ict'
};

const COLLECTION_ALIASES = {
  all: 'all',
  dffe_overview: 'dffe_overview',
  'dffe overview': 'dffe_overview',
  overview: 'dffe_overview',
  cms: 'cms',
  'corporate management services': 'cms',
  gito: 'gito',
  'government information technology office': 'gito',
  'government information technology officer': 'gito',
  ict_governance: 'ict_governance',
  'ict governance': 'ict_governance',
  governance: 'ict_governance',
  dpsa: 'ict_governance',
  cgictpf: 'ict_governance',
  ict_organogram: 'ict_organogram',
  'ict organogram': 'ict_organogram',
  organogram: 'ict_organogram',
  digital_solutions: 'digital_solutions',
  'digital solutions': 'digital_solutions',
  applications: 'digital_solutions',
  infrastructure: 'infrastructure',
  'ict infrastructure': 'infrastructure',
  cybersecurity: 'cybersecurity',
  security: 'cybersecurity',
  ict_operations: 'ict_operations',
  'ict operations': 'ict_operations',
  operations: 'ict_operations',
  portfolio: 'ict_operations'
};

const STATUS_ALIASES = {
  all: 'all',
  official: 'Official',
  approved: 'Official',
  proposed: 'Proposed',
  draft: 'Proposed',
  statutory: 'Statutory',
  policy: 'Statutory',
  historical: 'Historical',
  history: 'Historical'
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
    this.customChunks = [];
    this.customAgents = [];
  }

  /**
   * Return all documents (core verified corpus + dynamically grounded directorate sources)
   */
  getAllDocuments() {
    return [...this.customDocuments, ...corpus.documents];
  }

  /**
   * Return all indexed passage chunks across the 9 logical collections
   */
  getAllChunks() {
    const baseChunks = Array.isArray(gitoChunksStore.chunks) ? gitoChunksStore.chunks : [];
    return [...this.customChunks, ...baseChunks];
  }

  /**
   * Return the 9 logical DFFE & GITO knowledge collections
   */
  getCollections() {
    return Array.isArray(gitoChunksStore.metadata?.collections)
      ? gitoChunksStore.metadata.collections
      : [];
  }

  /**
   * Return structure status classifications (Official, Proposed, Statutory, Historical)
   */
  getStatuses() {
    return Array.isArray(gitoChunksStore.metadata?.statuses)
      ? gitoChunksStore.metadata.statuses
      : [];
  }

  /**
   * Return the 4 explicit Source A vs. Source B organogram conflict rules
   */
  getSourceConflictRules() {
    return Array.isArray(gitoChunksStore.metadata?.sourceConflictRules)
      ? gitoChunksStore.metadata.sourceConflictRules
      : [];
  }

  /**
   * Normalize collection filter
   */
  normalizeCollection(collection) {
    if (!collection || typeof collection !== 'string') return 'all';
    const key = collection.trim().toLowerCase();
    return COLLECTION_ALIASES[key] || 'all';
  }

  /**
   * Normalize structure status filter (Official, Proposed, Statutory, Historical, all)
   */
  normalizeStatus(status) {
    if (!status || typeof status !== 'string') return 'all';
    const key = status.trim().toLowerCase();
    return STATUS_ALIASES[key] || 'all';
  }

  /**
   * Return corpus metadata (series list, years, audiences, governance policy, phases, agents, branches, collections, chunks)
   */
  getMetadata() {
    const allDocs = this.getAllDocuments();
    const allChunks = this.getAllChunks();
    return {
      ...corpus.metadata,
      documentCount: allDocs.length,
      customDocumentCount: this.customDocuments.length,
      chunkCount: allChunks.length,
      collectionCount: this.getCollections().length,
      collections: this.getCollections(),
      statuses: this.getStatuses(),
      sourceConflictRules: this.getSourceConflictRules(),
      branchCount: branchesManifest.branches.length,
      branches: branchesManifest.branches,
      directorateAgents: this.getDirectorateAgents()
    };
  }

  /**
   * Return all 10 DFFE Branches from the structured manifest
   */
  getBranches() {
    return Array.isArray(branchesManifest.branches) ? branchesManifest.branches : [];
  }

  /**
   * Zero-token deterministic classifier that matches a user query to the 1 or 2 most relevant
   * DFFE Branches out of the 10 departmental branches, avoiding token bloat from hardcoding all 10.
   * @param {string} query
   * @param {number} [maxBranches=2]
   * @returns {Array<object>}
   */
  detectRelevantBranches(query, maxBranches = 2) {
    if (!query || typeof query !== 'string') return [];
    const lower = query.trim().toLowerCase();
    const tokens = this.tokenize(lower);
    const branches = this.getBranches();

    const scored = branches.map(branch => {
      let score = 0;
      const nameLower = branch.name.toLowerCase();
      if (lower.includes(nameLower)) score += 20;
      if (branch.shortCode && new RegExp(`\\b${branch.shortCode.toLowerCase()}\\b`).test(lower)) score += 14;

      for (const kw of (branch.keywords || [])) {
        const kwLower = kw.toLowerCase();
        if (lower.includes(kwLower)) {
          score += kwLower.includes(' ') ? 12 : 6;
        }
      }

      const combinedText = `${branch.mandate} ${(branch.chiefDirectorates || []).join(' ')} ${(branch.statutes || []).join(' ')} ${(branch.systemsAndPortals || []).join(' ')}`.toLowerCase();
      for (const t of tokens) {
        if (combinedText.includes(t)) score += 2;
      }

      return { branch, score };
    }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);

    return scored.slice(0, maxBranches).map(item => item.branch);
  }

  /**
   * Format matched DFFE Branch micro-cards for lazy injection (~150-300 tokens only when relevant)
   */
  formatRelevantBranchContext(query) {
    const matched = this.detectRelevantBranches(query, 2);
    if (!matched || matched.length === 0) return '';

    const lines = [
      '[DFFE DYNAMIC BRANCH & DIRECTORATE CONTEXT (TOKEN-EFFICIENT LAZY ROUTING)]'
    ];
    matched.forEach(b => {
      lines.push(`- Branch ${b.number}: ${b.name} (${b.shortCode}) — Mandate: ${b.mandate}`);
      lines.push(`  * Chief Directorates: ${(b.chiefDirectorates || []).join(' | ')}`);
      lines.push(`  * Core Statutes & Frameworks: ${(b.statutes || []).join('; ')}`);
      lines.push(`  * Enterprise Systems & Portals: ${(b.systemsAndPortals || []).join('; ')}`);
      lines.push(`  * Key Operational Workflows: ${(b.coreWorkflows || []).join('; ')}`);
    });
    return lines.join('\n');
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
      collection: spec.collection || 'GITO',
      collectionId: this.normalizeCollection(spec.collectionId || spec.collection || 'gito') === 'all' ? 'gito' : this.normalizeCollection(spec.collectionId || spec.collection),
      status: this.normalizeStatus(spec.status) === 'all' ? 'Proposed' : this.normalizeStatus(spec.status),
      page: spec.page || 'Page 1',
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

    // Also index as a searchable passage chunk in the 9-collection chunk store
    this.customChunks.unshift({
      chunkId: `chunk-${id}`,
      collection: newDoc.collection,
      collectionId: newDoc.collectionId,
      title,
      content: `${summary}\n${keyFindings.join('\n')}`,
      metadata: {
        source: title,
        sourceId: 'CUSTOM_GROUNDED',
        page: newDoc.page,
        section: 'Custom Grounded Passage',
        category: newDoc.seriesLabel,
        status: newDoc.status,
        approvalCaveat: newDoc.status === 'Proposed'
          ? 'Structure status: Proposed — Custom grounded document awaiting formal approval.'
          : 'Grounded departmental reference source.',
        department: 'DFFE',
        branch,
        directorate: spec.directorate || 'GITO',
        sensitivity,
        url
      },
      keywords: rawTokens,
      isCustomGrounded: true
    });

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

    return /\b(dffe|deff|daff|department of forestry|state of the environment|soer|saeo|environmental programmes?|working for water|working on fire|working for wetlands|working for the coast|working on waste|groen sebenza|ten million trees|nema|nemba|nemwa|nemaqa|nempaa|saaqis|sawic|ocims|frap|e-fishing|efishing|fishing rights|fishing permit|green scorpions|climate change act|sector emission targets|carbon budgets|basic assessment|environmental authorisation|environmental impact assessment|circular economy|extended producer responsibility|section 31l|section 24g|ministerial briefing|directorate agent|gito|government information technology|itbs|it business solutions|corporate management services|cms|financial management services|fms|pfma|supply chain|sita|leave policy|equipment request|onboarding|sharepoint|power apps|power automate|protected tree|national forests act|organogram|capability area|capability unit|sub-directorate|chief directorate|dpsa|cgictpf|applications development|business enablement|business relationship|demand management|ict governance|ict infrastructure|ict operations|cybersecurity|service desk|service management|hybrid 4ir|communities of practice|steering committee|data governance forum|disaster recovery|enterprise architecture)\b/i.test(lower);
  }

  /**
   * Search chunk-level passages across the 9 logical DFFE & GITO knowledge collections
   * @param {object} options
   * @param {string} [options.query]
   * @param {string} [options.collection]
   * @param {string} [options.status]
   * @param {string} [options.accessPhase]
   * @param {number} [options.limit]
   */
  searchChunks(options = {}) {
    const rawQuery = typeof options.query === 'string' ? options.query.trim() : '';
    const collection = this.normalizeCollection(options.collection);
    const status = this.normalizeStatus(options.status);
    const limit = Math.min(Math.max(Number(options.limit) || 6, 1), 15);

    const queryLower = rawQuery.toLowerCase();
    const tokens = this.tokenize(rawQuery);
    const allChunks = this.getAllChunks();

    // Filter by collection & status
    let candidates = allChunks.filter(chunk => {
      if (collection !== 'all' && chunk.collectionId !== collection) return false;
      if (status !== 'all' && String(chunk.metadata?.status || '').toLowerCase() !== status.toLowerCase()) return false;
      return true;
    });

    if (candidates.length === 0) {
      candidates = allChunks;
    }

    const scored = candidates.map(chunk => {
      let score = chunk.isCustomGrounded ? 4 : 0;
      const matchedKeywords = [];

      const titleLower = (chunk.title || '').toLowerCase();
      const contentLower = (chunk.content || '').toLowerCase();
      const collectionLower = (chunk.collection || '').toLowerCase();
      const categoryLower = (chunk.metadata?.category || '').toLowerCase();
      const sectionLower = (chunk.metadata?.section || '').toLowerCase();
      const keywordsList = (chunk.keywords || []).map(k => k.toLowerCase());

      for (const kw of keywordsList) {
        if (queryLower.includes(kw)) {
          score += kw.includes(' ') ? 14 : 7;
          matchedKeywords.push(kw);
        }
      }

      // Canonical question intent boosts across the 9 collections
      if (/\b(gito|directorates?|sub-directorates?|fall under|organogram|capability area|capability unit|four units?|4 units?|structure)\b/i.test(queryLower)) {
        if (chunk.chunkId === 'ict-org-01-source-a-revised-organogram') score += 26;
        if (chunk.chunkId === 'ict-org-02-source-b-four-unit-model-and-conflicts') score += 24;
        if (chunk.chunkId === 'cms-01-branch-purpose-and-gito-placement') score += 24;
        if (chunk.chunkId === 'gito-01-role-and-accountability') score += 20;
      }
      if (/\b(applications? development|business enablement|business relationship|demand management|data governance|bi|analytics|digital adoption|decentralis)\b/i.test(queryLower) && chunk.collectionId === 'digital_solutions') {
        score += 24;
      }
      if (/\b(hybrid 4ir|4ir|communities of practice|product teams?|experimentation|controlled innovation)\b/i.test(queryLower) && chunk.chunkId === 'dig-sol-02-hybrid-4ir-delivery-layer') {
        score += 26;
      }
      if (/\b(cybersecurity|information security|incident response|vulnerability|threat|security monitoring|security governance)\b/i.test(queryLower) && chunk.collectionId === 'cybersecurity') {
        score += 25;
      }
      if (/\b(infrastructure|networks?|hosting|cloud|service desk|end-user support|identity administration|directory services|patching)\b/i.test(queryLower) && chunk.collectionId === 'infrastructure') {
        score += 24;
      }
      if (/\b(portfolio|commercial|service management|contracts?|licences?|vendor|sita|sla|service-level|assets?|configuration|availability)\b/i.test(queryLower) && chunk.collectionId === 'ict_operations') {
        score += 24;
      }
      if (/\b(dpsa|cgictpf|corporate governance of ict|design principles|steering committee|review forum|data governance forum|operational committee|segregation of duties)\b/i.test(queryLower) && chunk.collectionId === 'ict_governance') {
        score += 24;
      }
      if (/\b(approved|implemented|funded posts?|grades?|salary|validation|business case|job evaluation|functionality assessment)\b/i.test(queryLower) && chunk.chunkId === 'ict-org-03-implementation-validation-11-requirements') {
        score += 25;
      }
      if (/\b(history|april 2021|name change|deff|daff|former department)\b/i.test(queryLower) && chunk.chunkId === 'dffe-ov-02-history-name-change') {
        score += 26;
      }
      if (/\b(what is dffe|mandate|section 24|constitution|director-general|accounting officer)\b/i.test(queryLower) && chunk.collectionId === 'dffe_overview') {
        score += 22;
      }

      for (const token of tokens) {
        if (titleLower.includes(token)) score += 6;
        if (contentLower.includes(token)) score += 4;
        if (collectionLower.includes(token)) score += 5;
        if (categoryLower.includes(token)) score += 3;
        if (sectionLower.includes(token)) score += 2;
      }

      return {
        ...chunk,
        relevanceScore: score,
        matchedKeywords: [...new Set(matchedKeywords)].slice(0, 6)
      };
    });

    const hasActiveQuery = tokens.length > 0;
    const sorted = hasActiveQuery
      ? scored.sort((a, b) => b.relevanceScore - a.relevanceScore)
      : scored;

    let matchedChunks = hasActiveQuery
      ? sorted.filter(c => c.relevanceScore > 0)
      : sorted;

    if (matchedChunks.length === 0) {
      matchedChunks = sorted.slice(0, Math.min(3, limit));
    } else {
      matchedChunks = matchedChunks.slice(0, limit);
    }

    const sourceConflictDetected = matchedChunks.some(c =>
      c.collectionId === 'ict_organogram' ||
      c.collectionId === 'cybersecurity' ||
      c.collectionId === 'ict_operations' ||
      c.metadata?.sourceId === 'SOURCE_A' ||
      c.metadata?.sourceId === 'SOURCE_B' ||
      c.metadata?.sourceId === 'SOURCE_A_AND_B'
    );

    return {
      query: rawQuery,
      filters: {
        collection,
        status
      },
      totalChunks: allChunks.length,
      matchCount: matchedChunks.length,
      sourceConflictDetected,
      sourceConflictRules: this.getSourceConflictRules(),
      chunks: matchedChunks,
      collections: this.getCollections(),
      statuses: this.getStatuses()
    };
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
      if (/\b(cms|corporate management|gito|itbs|it business solutions|equipment request|laptop|vpn|leave policy|employee leave|onboarding|template|power apps|power automate|asset management)\b/i.test(queryLower) && doc.id === 'dffe-cms-itbs-hr-sop-2026') {
        score += 22;
      }
      if (/\b(gito|government information technology|organogram|capability area|capability unit|sub-directorate|directorates?.*under gito|revised ict organogram|cybersecurity|digital solutions|applications development|service desk|ict governance|ict infrastructure)\b/i.test(queryLower) && doc.id === 'dffe-gito-organogram-source-a-2026') {
        score += 26;
      }
      if (/\b(gito|operating model|source b|four consolidated|portfolio commercial|service management|hybrid 4ir|communities of practice|dpsa|cgictpf|design principles|segregation of duties|job evaluation|functionality assessment)\b/i.test(queryLower) && doc.id === 'dffe-gito-operating-model-source-b-2026') {
        score += 25;
      }
      if (/\b(fms|financial management|pfma|supply chain|scm|procurement|tender|rfq|quotation|sita|csd|invoice|30 days)\b/i.test(queryLower) && doc.id === 'dffe-fms-pfma-scm-procurement-2026') {
        score += 22;
      }
      if (/\b(e-fishing|efishing|fishing permit|recreational fishing|protected tree|tree permit|national forests act|yellowwood|camel thorn)\b/i.test(queryLower) && doc.id === 'dffe-efishing-permits-Customer-guide-2026') {
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

    // Also run chunk-level search across the 9 logical DFFE & GITO knowledge collections
    const collectionFilter = this.normalizeCollection(options.collection);
    const statusFilter = this.normalizeStatus(options.status);
    const chunkSearchResult = this.searchChunks({
      query: rawQuery,
      collection: collectionFilter,
      status: statusFilter,
      accessPhase: phaseMeta.id,
      limit: Number(options.chunkLimit) || 6
    });

    return {
      query: rawQuery || 'DFFE Environmental Knowledge Overview',
      filters: {
        series,
        seriesLabel: seriesMeta.label,
        collection: collectionFilter,
        status: statusFilter,
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
      totalChunks: chunkSearchResult.totalChunks,
      matchCount: matchedDocs.length,
      chunkMatchCount: chunkSearchResult.matchCount,
      sourceConflictDetected: chunkSearchResult.sourceConflictDetected,
      sourceConflictRules: chunkSearchResult.sourceConflictRules,
      fallbackUsed,
      filterRelaxed,
      documents: matchedDocs,
      chunks: chunkSearchResult.chunks,
      catalogue: {
        series: corpus.metadata.seriesCatalogue,
        collections: this.getCollections(),
        statuses: this.getStatuses(),
        audiences: corpus.metadata.audiences,
        years: corpus.metadata.years,
        phases: this.getDeploymentPhases(),
        agents: this.getDirectorateAgents()
      }
    };
  }

  /**
   * Format retrieved DFFE documents & passage chunks into an authoritative RAG grounding block
   * for injection into the LLM system prompt, enforcing the 10 DFFE Knowledge Rules.
   */
  formatDffeGroundingContext(searchResult) {
    if (!searchResult || ((!Array.isArray(searchResult.documents) || searchResult.documents.length === 0) && (!Array.isArray(searchResult.chunks) || searchResult.chunks.length === 0))) {
      return '';
    }

    const { query, filters, documents = [], chunks = [], fallbackUsed, sensitivityAudit, sourceConflictDetected, sourceConflictRules = [] } = searchResult;
    const branchContext = this.formatRelevantBranchContext(query);
    const lines = [
      '[DFFE VERIFIED ENVIRONMENTAL KNOWLEDGE BASE — RAG GROUNDING CONTEXT]',
      `Query: "${query}"`,
      `Active Filters: Series="${filters?.seriesLabel || 'All'}" | Collection="${filters?.collection || 'all'}" | Status="${filters?.status || 'all'}" | Year="${filters?.year || 'all'}" | Target Audience="${filters?.audienceLabel || 'Public'}"`,
      `Deployment Phase & FM/IM Governance Context: ${sensitivityAudit?.phaseName || 'Phase 2: Public'} (${sensitivityAudit?.authContext || 'Public'}) — Allowed Sensitivity Tiers: [${(sensitivityAudit?.allowedSensitivities || ['public']).join(', ').toUpperCase()}]`,
      'DFFE KNOWLEDGE ASSISTANT — 10 MANDATORY KNOWLEDGE & CITATION RULES:',
      '1. Prioritise the approved and current DFFE documents available in the knowledge base.',
      '2. Use official DFFE (https://www.dffe.gov.za) and DPSA (CGICTPF Version 2, March 2022) publications as authoritative public references.',
      '3. Strictly distinguish approved organisational structures (Official Public Departmental Facts) from proposed structures (Source A: Revised_ICT_Organogram.pdf and Source B: DFFE Government ICT Proposed Operating Model and GITO Structure(1).pdf) and draft documents.',
      '4. Never invent directorates, sub-directorates, job titles, post grades, salary levels, reporting lines, responsibilities, policies or departmental procedures.',
      '5. When answering organisational questions, explain the hierarchy: Department (DFFE) > Branch (e.g., Corporate Management Services [CMS]) > Chief Directorate (e.g., Government Information Technology Office [GITO]) > Directorate > Sub-directorate, where documented.',
      '6. When information comes from a proposed organogram, explicitly identify it under a heading such as "Proposed functional structure", never present the capability areas as confirmed approved directorates/posts, and include a "SOURCES" section at the end with "Structure status: Proposed".',
      '7. Cite the document name, page number (e.g., Page 1 to Page 7), and relevant section whenever possible.',
      '8. If specific information is unavailable in the reference sources, state verbatim: "The available DFFE reference documents do not specify this information."',
      '9. Do not confuse DFFE with historical departmental structures or former department names (note the April 2021 rename from DEFF to DFFE and the shift of forestry and fisheries from the former DAFF).',
      '10. Enforce Information Management (FM/IM) Sensitivity Guardrails: Do not expose confidential internal or restricted information to users who are not authorised to access it in the active Deployment Phase.'
    ];

    if (branchContext) {
      lines.push(`\n${branchContext}`);
    }

    if (sourceConflictDetected && sourceConflictRules.length > 0) {
      lines.push('\n[IMPORTANT SOURCE-CONFLICT & STATUS RULE — SOURCE A vs. SOURCE B PROPOSED GITO ORGANOGRAMS]');
      lines.push('The public DFFE CMS webpage (https://www.dffe.gov.za/corporate-management-services) confirms that GITO is a Chief Directorate within the CMS branch. However, the two supplied internal ICT structure documents are BOTH PROPOSED and differ in four ways — never merge them silently or present them as approved establishment posts:');
      sourceConflictRules.forEach(rule => {
        lines.push(`- ${rule.dimension}:`);
        lines.push(`  * ${rule.sourceA}`);
        lines.push(`  * ${rule.sourceB}`);
      });
    }

    if (sensitivityAudit && sensitivityAudit.withheldCount > 0) {
      lines.push(`FM/IM SENSITIVITY GATE NOTICE: ${sensitivityAudit.withheldCount} internal/restricted DFFE record(s) (${sensitivityAudit.withheldDocuments.map(w => `${w.title} [${w.sensitivity.toUpperCase()}]`).join('; ')}) were withheld in the current access phase (${sensitivityAudit.phaseId}).`);
    }

    if (fallbackUsed) {
      lines.push('NOTE: No exact keyword match was found in the filtered DFFE corpus for this specific query; below are the closest baseline DFFE reference reports. State clearly if a specific sub-topic is not covered in the verified corpus.');
    }

    if (chunks.length > 0) {
      lines.push('\n--- RETRIEVED DFFE & GITO PASSAGE CHUNKS (9 LOGICAL COLLECTIONS) ---');
      chunks.forEach((chunk, idx) => {
        const meta = chunk.metadata || {};
        lines.push(`\n[Chunk ${idx + 1}] ${chunk.collection} / ${chunk.title}`);
        lines.push(`- Metadata: Source="${meta.source || 'DFFE Reference'}" | Page="${meta.page || '1'}" | Section="${meta.section || 'General'}" | Category="${meta.category || chunk.collection}" | Status="${meta.status || 'Proposed'}" | Department="${meta.department || 'DFFE'}" | Directorate="${meta.directorate || 'GITO'}"`);
        if (meta.approvalCaveat) {
          lines.push(`- Status & Approval Caveat: ${meta.approvalCaveat}`);
        }
        if (meta.url) {
          lines.push(`- Reference URL: ${meta.url}`);
        }
        lines.push(`- Content: ${chunk.content}`);
      });
    }

    if (documents.length > 0) {
      lines.push('\n--- RETRIEVED DFFE SOURCE DOCUMENTS ---');
      documents.forEach((doc, idx) => {
        lines.push(`\n[Source ${idx + 1}] ${doc.title} (${doc.year})`);
        lines.push(`- Series: ${doc.seriesLabel} | Responsible Branch: ${doc.branch}${doc.status ? ` | Structure Status: ${doc.status}` : ''}${doc.page ? ` | Page: ${doc.page}` : ''}`);
        lines.push(`- Sensitivity & Governance Classification: [${(doc.sensitivity || 'public').toUpperCase()}] ${doc.governance}`);
        lines.push(`- Official Citation: ${doc.citation}`);
        lines.push(`- Reference URL: ${doc.url}`);
        lines.push(`- Executive Summary: ${doc.summary}`);
        lines.push(`- Key Verified Findings & Statutory Provisions:`);
        (doc.keyFindings || []).forEach(f => {
          lines.push(`  * ${f}`);
        });
      });
    }

    lines.push('\n--- END DFFE RAG CONTEXT ---');
    return lines.join('\n');
  }
}

module.exports = new DffeRagService();
