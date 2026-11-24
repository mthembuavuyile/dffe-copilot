const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const app = require('../src/server');
const dffeRagService = require('../src/services/dffe-rag.service');
const { capabilityRegistry } = require('../src/capabilities');
const { ATLAS_TOOLS, DFFE_AGENT_TOOLS } = require('../src/config/tools.config');

describe('DFFE 3-Phase Conversational Agentic Platform & RAG Suite (UNEP EnvironmentGPT & Microsoft/SITA Architecture)', () => {
  test('dffeRagService answers the canonical Microsoft meeting query with both Programmes and SoER sources', () => {
    const query = 'What environmental programmes is DFFE currently running, and what are the key findings from the latest State of the Environment reports?';
    assert.strictEqual(dffeRagService.isDffeQuery(query), true, 'Must detect canonical DFFE meeting prompt');

    const result = dffeRagService.searchKnowledge({ query, series: 'all', year: 'all', audience: 'public' });
    assert.ok(result.documents.length >= 2, 'Should retrieve multiple relevant DFFE documents');

    const ids = result.documents.map(d => d.id);
    assert.ok(ids.includes('dffe-epwp-programmes-2026'), 'Must retrieve DFFE EPWP Environmental Programmes');
    assert.ok(ids.includes('dffe-soer-synthesis-2026'), 'Must retrieve South Africa State of the Environment Report (SoER)');
  });

  test('dffeRagService supports UNEP EnvironmentGPT filtering by Report Series, Year, and Audience', () => {
    const soerOnly = dffeRagService.searchKnowledge({ query: '', series: 'soer', year: '2026', audience: 'public' });
    assert.ok(soerOnly.documents.length >= 1);
    assert.ok(soerOnly.documents.every(d => d.series === 'soer'), 'All filtered docs must belong to soer series');

    const complianceDocs = dffeRagService.searchKnowledge({ query: 'NEMA EIA screening tool', series: 'legislation', audience: 'compliance' });
    assert.ok(complianceDocs.documents.some(d => d.id === 'dffe-nema-eia-screening-2026'));

    const grounding = dffeRagService.formatDffeGroundingContext(soerOnly);
    assert.ok(grounding.includes('[DFFE VERIFIED ENVIRONMENTAL KNOWLEDGE BASE — RAG GROUNDING CONTEXT]'));
    assert.ok(grounding.includes('https://www.dffe.gov.za'));
  });

  test('Siviwe Mpondo 3-Phase FM/IM Content Sensitivity Gate strictly isolates Public, Internal, and Restricted records', () => {
    const sensitiveQuery = 'Section 31L enforcement register and internal directorate SOP';

    // Phase 2: Public Website & WhatsApp -> blocks internal and restricted docs
    const phase2 = dffeRagService.searchKnowledge({
      query: sensitiveQuery,
      accessPhase: 'phase2_public',
      limit: 10
    });
    assert.ok(phase2.documents.every(d => (d.sensitivity || 'public') === 'public'), 'Phase 2 Public must only return public documents');
    assert.ok(phase2.sensitivityAudit.withheldCount >= 2, 'Phase 2 Public must withhold internal SOP and restricted EMI register');

    // Phase 1: Internal Official & Microsoft Teams -> unlocks internal SOP, still blocks restricted criminal dockets
    const phase1 = dffeRagService.searchKnowledge({
      query: sensitiveQuery,
      accessPhase: 'phase1_internal',
      limit: 10
    });
    assert.ok(phase1.documents.some(d => d.id === 'dffe-internal-directorate-sop-2026'), 'Phase 1 Internal must unlock internal directorate SOP');
    assert.ok(!phase1.documents.some(d => d.id === 'dffe-restricted-emi-enforcement-register-2026'), 'Phase 1 Internal must still gate restricted EMI enforcement register');
    assert.ok(phase1.sensitivityAudit.withheldCount >= 1);

    // Phase 3: Enterprise Systems & FM/IM RBAC -> unlocks public, internal, and restricted records
    const phase3 = dffeRagService.searchKnowledge({
      query: sensitiveQuery,
      accessPhase: 'phase3_enterprise',
      limit: 10
    });
    assert.ok(phase3.documents.some(d => d.id === 'dffe-restricted-emi-enforcement-register-2026'), 'Phase 3 Enterprise RBAC must unlock restricted EMI enforcement register');
    assert.strictEqual(phase3.sensitivityAudit.withheldCount, 0);
  });

  test('DFFE_AGENT_TOOLS strips consumer entertainment bloat while registering all 5 DFFE operational capabilities', async () => {
    const dffeToolNames = DFFE_AGENT_TOOLS.map(t => t.function?.name);

    // Must include all 5 DFFE operational capabilities
    assert.ok(dffeToolNames.includes('search_dffe_knowledge'));
    assert.ok(dffeToolNames.includes('screen_nema_eia_activity'));
    assert.ok(dffeToolNames.includes('query_dffe_environmental_indicators'));
    assert.ok(dffeToolNames.includes('manage_dffe_directorate_agent'));
    assert.ok(dffeToolNames.includes('triage_dffe_service_or_permit'));

    // Must exclude Vylex Atlas consumer entertainment bloat from LLM chat tools
    const forbiddenBloat = ['get_movie_info', 'discover_movies', 'get_stock_chart', 'get_crypto_terminal', 'get_crypto_price', 'get_bible_verse', 'tell_joke', 'give_advice', 'get_reddit_posts', 'search_reddit'];
    for (const bloatTool of forbiddenBloat) {
      assert.ok(!dffeToolNames.includes(bloatTool), `DFFE_AGENT_TOOLS must not expose consumer bloat tool: ${bloatTool}`);
    }

    // Verify deterministic execution of all 5 DFFE capabilities
    const ragRes = await capabilityRegistry.execute('search_dffe_knowledge', {
      query: 'Working for Water and Working on Fire',
      series: 'programmes'
    });
    assert.strictEqual(ragRes.type, 'dffe_knowledge');

    const eiaRedz = await capabilityRegistry.execute('screen_nema_eia_activity', {
      projectDescription: '100 MW Solar PV facility in a Renewable Energy Development Zone (REDZ)'
    });
    assert.strictEqual(eiaRedz.type, 'dffe_eia_screening');
    assert.strictEqual(eiaRedz.data.decisionTimeframeDays, 57, 'REDZ projects must trigger 57-day fast-track timeframe');
    assert.strictEqual(eiaRedz.data.fastTrackApplicable, true);

    const eiaLn2 = await capabilityRegistry.execute('screen_nema_eia_activity', {
      projectDescription: 'Commercial hazardous waste incinerator and petrochemical refinery'
    });
    assert.strictEqual(eiaLn2.data.decisionTimeframeDays, 300, 'Listing Notice 2 high-impact activities must trigger 300-day S&EIR');

    const indRes = await capabilityRegistry.execute('query_dffe_environmental_indicators', {
      domain: 'climate',
      facilityEmissionsMt: 4.0
    });
    assert.strictEqual(indRes.type, 'dffe_indicators');
    assert.strictEqual(indRes.data.climateChangeAct.carbonBudgetModel.baselineEmissionsMt, 4.0);
    assert.ok(indRes.data.saaqisAirQuality.priorityAreas.length >= 3);

    const studioRes = await capabilityRegistry.execute('manage_dffe_directorate_agent', {
      action: 'overview'
    });
    assert.strictEqual(studioRes.type, 'dffe_agent_studio');
    assert.ok(studioRes.data.agents.length >= 6);
    assert.strictEqual(studioRes.data.phases.length, 3);

    const itbsTriageRes = await capabilityRegistry.execute('triage_dffe_service_or_permit', {
      requestDetails: 'How do I request a developer laptop and VPN access in ITBS with Power Automate manager approval?'
    });
    assert.strictEqual(itbsTriageRes.type, 'dffe_service_triage');
    assert.strictEqual(itbsTriageRes.data.category, 'itbs_equipment_request');
    assert.strictEqual(itbsTriageRes.data.branchNumber, 4);
    assert.ok(itbsTriageRes.data.powerPlatformBlueprint.automationLayer.includes('Power Automate'));

    const efishingTriageRes = await capabilityRegistry.execute('triage_dffe_service_or_permit', {
      requestDetails: 'Apply for an online e-Fishing recreational rock lobster permit'
    });
    assert.strictEqual(efishingTriageRes.type, 'dffe_service_triage');
    assert.strictEqual(efishingTriageRes.data.category, 'efishing_marine_permit');
    assert.strictEqual(efishingTriageRes.data.branchNumber, 10);
  });

  test('10-Branch token-efficient dynamic routing classifies queries across all 10 DFFE Branches without prompt bloat', () => {
    const branches = dffeRagService.getBranches();
    assert.strictEqual(branches.length, 10, 'Must define all 10 core DFFE Branches');

    const cmsMatch = dffeRagService.detectRelevantBranches('How do I submit an IT equipment request in GITO / ITBS or check the HR leave policy on SharePoint?');
    assert.ok(cmsMatch.some(b => b.number === 4 && b.shortCode === 'CMS'), 'Must dynamically detect Branch 4: Corporate Management Services (CMS)');

    const fmsMatch = dffeRagService.detectRelevantBranches('What are the PFMA Supply Chain Management quotation thresholds and SITA ICT procurement rules?');
    assert.ok(fmsMatch.some(b => b.number === 6 && b.shortCode === 'FMS'), 'Must dynamically detect Branch 6: Financial Management Services (FMS)');

    const fishMatch = dffeRagService.detectRelevantBranches('Where do small-scale fishing co-operatives and recreational anglers apply on e-Fishing under FRAP?');
    assert.ok(fishMatch.some(b => b.number === 10 && b.shortCode === 'FISH'), 'Must dynamically detect Branch 10: Fisheries Management');

    const lazyContext = dffeRagService.formatRelevantBranchContext('Request laptop in ITBS and check PFMA procurement rules');
    assert.ok(lazyContext.includes('[DFFE DYNAMIC BRANCH & DIRECTORATE CONTEXT (TOKEN-EFFICIENT LAZY ROUTING)]'));
    assert.ok(lazyContext.includes('Branch 4: Corporate Management Services'));
    assert.ok(lazyContext.includes('Branch 6: Financial Management Services'));
    assert.ok(!lazyContext.includes('Branch 9: Oceans and Coasts'), 'Must NOT inject unrelated branch profiles into turn context');
  });

  test('HTTP endpoints /api/dffe/corpus, /api/dffe/search, /api/dffe/agents, /api/dffe/ground, /api/dffe/eia-screen, /api/dffe/indicators, and /dffe respond cleanly', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const corpusRes = await fetch(`http://127.0.0.1:${port}/api/dffe/corpus`);
      assert.strictEqual(corpusRes.status, 200);
      const corpusData = await corpusRes.json();
      assert.ok(corpusData.department.includes('Department of Forestry, Fisheries and the Environment'));
      assert.ok(corpusData.documentCount >= 10);

      // Provision a new Directorate Agent via POST /api/dffe/agents (Alucias Makonko & Copilot Studio self-service requirement)
      const createAgentRes = await fetch(`http://127.0.0.1:${port}/api/dffe/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'NAGOYA Bioprospecting Permit Agent',
          directorate: 'Branch: Biodiversity and Conservation',
          groundingUrl: 'https://www.dffe.gov.za/bioprospecting-permits',
          sensitivity: 'internal',
          customDocumentText: 'NEMBA Section 81 bioprospecting permit applications require benefit-sharing agreements with indigenous knowledge holders for Rooibos and Buchu.'
        })
      });
      assert.strictEqual(createAgentRes.status, 201);
      const createdData = await createAgentRes.json();
      assert.strictEqual(createdData.status, 'created');
      assert.strictEqual(createdData.agent.name, 'NAGOYA Bioprospecting Permit Agent');
      assert.ok(createdData.groundedDocument, 'Must automatically ground custom policy text into RAG corpus');

      // Verify newly grounded source is searchable in Phase 1 (Internal) but gated in Phase 2 (Public)
      const searchInternalRes = await fetch(`http://127.0.0.1:${port}/api/dffe/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'NEMBA Section 81 bioprospecting permit Rooibos',
          accessPhase: 'phase1_internal'
        })
      });
      const searchInternalData = await searchInternalRes.json();
      assert.ok(searchInternalData.documents.some(d => d.id === createdData.groundedDocument.id));

      // Test POST /api/dffe/eia-screen
      const eiaRes = await fetch(`http://127.0.0.1:${port}/api/dffe/eia-screen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectDescription: '75 MW Solar PV in REDZ' })
      });
      assert.strictEqual(eiaRes.status, 200);
      const eiaData = await eiaRes.json();
      assert.strictEqual(eiaData.type, 'dffe_eia_screening');
      assert.strictEqual(eiaData.data.decisionTimeframeDays, 57);

      // Test POST /api/dffe/indicators
      const indRes = await fetch(`http://127.0.0.1:${port}/api/dffe/indicators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'saaqis' })
      });
      assert.strictEqual(indRes.status, 200);
      const indData = await indRes.json();
      assert.strictEqual(indData.type, 'dffe_indicators');

      // Test GET /api/dffe/branches
      const branchesRes = await fetch(`http://127.0.0.1:${port}/api/dffe/branches?q=ITBS+laptop+request`);
      assert.strictEqual(branchesRes.status, 200);
      const branchesData = await branchesRes.json();
      assert.strictEqual(branchesData.branchCount, 10);
      assert.ok(branchesData.matchedBranches.some(b => b.number === 4));

      // Test POST /api/dffe/service-triage
      const triageRes = await fetch(`http://127.0.0.1:${port}/api/dffe/service-triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestDetails: 'PFMA quotation threshold for R250,000 ICT software' })
      });
      assert.strictEqual(triageRes.status, 200);
      const triageData = await triageRes.json();
      assert.strictEqual(triageData.type, 'dffe_service_triage');
      assert.strictEqual(triageData.data.category, 'fms_pfma_procurement');

      const portalRes = await fetch(`http://127.0.0.1:${port}/dffe`);
      assert.strictEqual(portalRes.status, 200);
      const portalHtml = await portalRes.text();
      assert.ok(portalHtml.includes('DFFE Environmental Intelligence &amp; RAG Assistant'));
      assert.ok(portalHtml.includes('id="dffeChatDrawer"'), 'Portal must include multi-channel conversational drawer');
      assert.ok(portalHtml.includes('id="createAgentForm"'), 'Portal must include self-service Directorate Agent Builder form');
    } finally {
      server.close();
    }
  });

  test('DFFE widgets render cleanly and slash commands route DFFE workflows while rejecting consumer bloat', async () => {
    const {
      dffeWidget,
      dffeEiaScreeningWidget,
      dffeIndicatorsWidget,
      dffeAgentStudioWidget,
      dffeServiceTriageWidget
    } = await import('../public/js/widgets/components/dffe-widget.js');
    const { resolveSlashCommand } = await import('../public/js/services/intent-router.js');

    const sampleData = dffeRagService.searchKnowledge({
      query: 'State of the Environment',
      series: 'soer'
    });
    const html = dffeWidget.render(sampleData);
    assert.ok(html.includes('atlas-dffe-filter-bar'), 'Widget must render UNEP EnvironmentGPT filter bar');
    assert.ok(html.includes('Official Source (dffe.gov.za)'), 'Widget must include official dffe.gov.za source button');
    assert.ok(html.includes('Open Brief in Canvas'), 'Widget must include Open Brief in Canvas button');

    const eiaPayload = await capabilityRegistry.execute('screen_nema_eia_activity', { projectDescription: 'Solar PV in REDZ' });
    const eiaHtml = dffeEiaScreeningWidget.render(eiaPayload.data);
    assert.ok(eiaHtml.includes('57 DAYS STATUTORY'));
    assert.ok(eiaHtml.includes('Open EIA Screening Checklist in Canvas'));

    const indPayload = await capabilityRegistry.execute('query_dffe_environmental_indicators', { domain: 'climate' });
    const indHtml = dffeIndicatorsWidget.render(indPayload.data);
    assert.ok(indHtml.includes('SAAQIS Priority Area Ambient Air Quality Benchmarks'));

    const studioPayload = await capabilityRegistry.execute('manage_dffe_directorate_agent', { action: 'overview' });
    const studioHtml = dffeAgentStudioWidget.render(studioPayload.data);
    assert.ok(studioHtml.includes('Active DFFE Directorate Agents'));

    const triagePayload = await capabilityRegistry.execute('triage_dffe_service_or_permit', { requestDetails: 'ITBS laptop request' });
    const triageHtml = dffeServiceTriageWidget.render(triagePayload.data);
    assert.ok(triageHtml.includes('ITBS / Microsoft 365 &amp; Power Platform Enterprise Architecture'));
    assert.ok(triageHtml.includes('Open Workflow Form &amp; SOP in Canvas'));

    // Verify DFFE slash commands
    const slashGito = resolveSlashCommand('/gito What directorates or sub-directorates fall under GITO?');
    assert.strictEqual(slashGito.toolToCall, 'search_dffe_knowledge');
    assert.strictEqual(slashGito.argsPayload.series, 'gito_ict');
    assert.strictEqual(slashGito.argsPayload.collection, 'gito');

    const slashItbs = resolveSlashCommand('/itbs Request laptop and VPN');
    assert.strictEqual(slashItbs.toolToCall, 'triage_dffe_service_or_permit');
    assert.strictEqual(slashItbs.argsPayload.serviceCategory, 'itbs_equipment_request');

    const slashEfishing = resolveSlashCommand('/efishing rock lobster permit');
    assert.strictEqual(slashEfishing.toolToCall, 'triage_dffe_service_or_permit');
    assert.strictEqual(slashEfishing.argsPayload.serviceCategory, 'efishing_marine_permit');
    const slashDffe = resolveSlashCommand('/dffe Working for Water');
    assert.strictEqual(slashDffe.toolToCall, 'search_dffe_knowledge');

    const slashEia = resolveSlashCommand('/eia Coastal desalination plant');
    assert.strictEqual(slashEia.toolToCall, 'screen_nema_eia_activity');

    const slashClimate = resolveSlashCommand('/climate Carbon budget');
    assert.strictEqual(slashClimate.toolToCall, 'query_dffe_environmental_indicators');
    assert.strictEqual(slashClimate.argsPayload.domain, 'climate');

    const slashAir = resolveSlashCommand('/air Highveld PM2.5');
    assert.strictEqual(slashAir.toolToCall, 'query_dffe_environmental_indicators');
    assert.strictEqual(slashAir.argsPayload.domain, 'saaqis');

    const slashAgent = resolveSlashCommand('/agent');
    assert.strictEqual(slashAgent.toolToCall, 'manage_dffe_directorate_agent');

    // Consumer bloat slash commands must NOT hijack the composer
    assert.strictEqual(resolveSlashCommand('/movie Interstellar'), null);
    assert.strictEqual(resolveSlashCommand('/crypto bitcoin'), null);
    assert.strictEqual(resolveSlashCommand('/reddit news'), null);
    assert.strictEqual(resolveSlashCommand('/bible John 3:16'), null);
    assert.strictEqual(resolveSlashCommand('/joke'), null);

    const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
    assert.ok(indexHtml.includes('id="dffeKnowledgeBar"'), 'Main workspace must include DFFE Knowledge Filter Bar');
    assert.ok(indexHtml.includes('id="dffeWorkflowCardsGrid"'), 'De-cluttered homescreen must include 4 focused DFFE Workflow Cards');
    assert.ok(indexHtml.includes('id="dffeToggleScopeDrawerBtn"'), 'De-cluttered homescreen must collapse 5 dropdowns behind progressive disclosure toggle');
    assert.ok(!indexHtml.includes('data-mode="build"'), 'De-cluttered homescreen must not expose developer Build mode card on landing screen');
    assert.ok(indexHtml.includes('id="dffeFilterAgent"'), 'Main workspace must include Directorate Agent selector');
    assert.ok(indexHtml.includes('id="dffeFilterPhase"'), 'Main workspace must include 3-Phase FM/IM selector');
    assert.ok(indexHtml.includes('data-preset="dffe"'), 'Personalization settings must include DFFE Environmental Specialist preset');
  });

  test('DFFE & GITO 9-Collection Chunk Store, Approved vs. Proposed Status & Source A vs. Source B Conflict Rules work end-to-end', async () => {
    const collections = dffeRagService.getCollections();
    assert.strictEqual(collections.length, 9, 'Must define all 9 logical DFFE & GITO knowledge collections');
    const colIds = collections.map(c => c.id);
    for (const expectedCol of ['dffe_overview', 'cms', 'gito', 'ict_governance', 'ict_organogram', 'digital_solutions', 'infrastructure', 'cybersecurity', 'ict_operations']) {
      assert.ok(colIds.includes(expectedCol), `Must include logical collection: ${expectedCol}`);
    }

    // Canonical user query: "What is the Chief Directorate: GITO, and what directorates or sub-directorates fall under it?"
    const gitoQuery = 'What is the Chief Directorate: GITO, and what directorates or sub-directorates fall under it?';
    assert.strictEqual(dffeRagService.isDffeQuery(gitoQuery), true);

    const gitoRes = dffeRagService.searchKnowledge({ query: gitoQuery });
    assert.ok(Array.isArray(gitoRes.chunks) && gitoRes.chunks.length >= 3, 'Must return indexed passage chunks');
    assert.strictEqual(gitoRes.sourceConflictDetected, true, 'Must flag Source A vs. Source B proposed organogram distinction');
    assert.strictEqual(gitoRes.sourceConflictRules.length, 4, 'Must include all 4 Source A vs. Source B conflict dimensions');

    const chunkIds = gitoRes.chunks.map(c => c.chunkId);
    assert.ok(chunkIds.includes('ict-org-01-source-a-revised-organogram'), 'Must retrieve Source A Revised ICT Organogram chunk (Page 1)');
    assert.ok(chunkIds.includes('ict-org-02-source-b-four-unit-model-and-conflicts'), 'Must retrieve Source B 4-Unit Operating Model & Conflicts chunk');
    assert.ok(chunkIds.includes('cms-01-branch-purpose-and-gito-placement'), 'Must retrieve Official CMS placement chunk');

    const sourceAChunk = gitoRes.chunks.find(c => c.chunkId === 'ict-org-01-source-a-revised-organogram');
    assert.strictEqual(sourceAChunk.metadata.status, 'Proposed');
    assert.strictEqual(sourceAChunk.metadata.page, 1);
    assert.strictEqual(sourceAChunk.metadata.department, 'DFFE');
    assert.strictEqual(sourceAChunk.metadata.directorate, 'GITO');

    const officialCmsChunk = gitoRes.chunks.find(c => c.chunkId === 'cms-01-branch-purpose-and-gito-placement');
    assert.strictEqual(officialCmsChunk.metadata.status, 'Official');

    // Verify RAG grounding context includes the 10 Knowledge Rules, Source Conflict notice, and verbatim chunks
    const groundingText = dffeRagService.formatDffeGroundingContext(gitoRes);
    assert.ok(groundingText.includes('DFFE KNOWLEDGE ASSISTANT — 10 MANDATORY KNOWLEDGE & CITATION RULES:'));
    assert.ok(groundingText.includes('The available DFFE reference documents do not specify this information.'));
    assert.ok(groundingText.includes('[IMPORTANT SOURCE-CONFLICT & STATUS RULE — SOURCE A vs. SOURCE B PROPOSED GITO ORGANOGRAMS]'));
    assert.ok(groundingText.includes('Structure status: Proposed'));

    // Verify specific sub-function query: "What does Applications Development and Support do?"
    const appDevRes = dffeRagService.searchChunks({
      query: 'What does Applications Development and Support do?',
      collection: 'digital_solutions'
    });
    assert.ok(appDevRes.chunks.some(c => c.chunkId === 'dig-sol-01-unit2-responsibilities'));
    assert.ok(appDevRes.chunks[0].content.includes('Applications Development and Support'));

    // Verify Source Explorer rendering in dffeWidget
    const { dffeWidget } = await import('../public/js/widgets/components/dffe-widget.js');
    const gitoHtml = dffeWidget.render(gitoRes);
    assert.ok(gitoHtml.includes('Source Explorer — Indexed Knowledge Passages &amp; Page Citations (9 Logical Collections)'));
    assert.ok(gitoHtml.includes('Structure status: Proposed'));
    assert.ok(gitoHtml.includes('Compare Source A vs. Source B in Source Explorer'));
    assert.ok(gitoHtml.includes('Inspect in Source Explorer (Page 1)'));

    // Verify HTTP endpoints /api/dffe/collections and /api/dffe/chunks/search
    const server = app.listen(0);
    const port = server.address().port;
    try {
      const colRes = await fetch(`http://127.0.0.1:${port}/api/dffe/collections`);
      assert.strictEqual(colRes.status, 200);
      const colData = await colRes.json();
      assert.strictEqual(colData.collectionCount, 9);
      assert.ok(colData.totalChunks >= 12);

      const chunkSearchRes = await fetch(`http://127.0.0.1:${port}/api/dffe/chunks/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Cybersecurity placement in Source A versus Source B',
          collection: 'cybersecurity',
          status: 'Proposed'
        })
      });
      assert.strictEqual(chunkSearchRes.status, 200);
      const chunkSearchData = await chunkSearchRes.json();
      assert.ok(chunkSearchData.chunks.some(c => c.chunkId === 'cyber-01-security-governance-and-placement-comparison'));
    } finally {
      server.close();
    }
  });
});
