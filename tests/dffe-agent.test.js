const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const app = require('../src/server');
const dffeRagService = require('../src/services/dffe-rag.service');
const { capabilityRegistry } = require('../src/capabilities');
const { DFFE_AGENT_TOOLS } = require('../src/config/tools.config');

describe('DFFE Copilot RAG Knowledge Assistant & 9-Collection Source Explorer Suite', () => {
  test('dffeRagService answers the canonical DFFE programmes and SoER query with verified sources', () => {
    const query = 'What environmental programmes is DFFE currently running, and what are the key findings from the latest State of the Environment reports?';
    assert.strictEqual(dffeRagService.isDffeQuery(query), true, 'Must detect canonical DFFE prompt');

    const result = dffeRagService.searchKnowledge({ query, series: 'all', year: 'all', audience: 'public' });
    assert.ok(result.documents.length >= 2, 'Should retrieve multiple relevant DFFE documents');

    const ids = result.documents.map(d => d.id);
    assert.ok(ids.includes('dffe-epwp-programmes-2026'), 'Must retrieve DFFE EPWP Environmental Programmes');
    assert.ok(ids.includes('dffe-soer-synthesis-2026'), 'Must retrieve South Africa State of the Environment Report (SoER)');
  });

  test('dffeRagService supports filtering by Report Series, Year, and Audience and grounds EIA/REDZ queries', () => {
    const soerOnly = dffeRagService.searchKnowledge({ query: '', series: 'soer', year: '2026', audience: 'public' });
    assert.ok(soerOnly.documents.length >= 1);
    assert.ok(soerOnly.documents.every(d => d.series === 'soer'), 'All filtered docs must belong to soer series');

    const eiaQuery = '75 MW Solar PV & Grid Connection in a Renewable Energy Development Zone (REDZ)';
    assert.strictEqual(dffeRagService.isDffeQuery(eiaQuery), true, 'Must detect EIA / REDZ project queries');
    const complianceDocs = dffeRagService.searchKnowledge({ query: eiaQuery, series: 'legislation', audience: 'compliance' });
    assert.ok(complianceDocs.documents.some(d => d.id === 'dffe-nema-eia-screening-2026'));

    const grounding = dffeRagService.formatDffeGroundingContext(soerOnly);
    assert.ok(grounding.includes('[DFFE VERIFIED ENVIRONMENTAL KNOWLEDGE BASE — RAG GROUNDING CONTEXT]'));
    assert.ok(grounding.includes('https://www.dffe.gov.za'));
  });

  test('DFFE_AGENT_TOOLS exposes clean RAG & utility tools without consumer or fake-widget bloat', async () => {
    const dffeToolNames = DFFE_AGENT_TOOLS.map(t => t.function?.name);

    // Must include real DFFE RAG knowledge retrieval and live web search
    assert.ok(dffeToolNames.includes('search_dffe_knowledge'));
    assert.ok(dffeToolNames.includes('search_web'));

    // Must exclude fake regex demo-theatre tools and consumer entertainment bloat
    const forbiddenBloat = [
      'screen_nema_eia_activity',
      'query_dffe_environmental_indicators',
      'manage_dffe_directorate_agent',
      'triage_dffe_service_or_permit',
      'get_movie_info',
      'discover_movies',
      'get_stock_chart',
      'get_crypto_terminal',
      'get_crypto_price',
      'get_bible_verse',
      'tell_joke',
      'give_advice',
      'get_reddit_posts',
      'search_reddit'
    ];
    for (const bloatTool of forbiddenBloat) {
      assert.ok(!dffeToolNames.includes(bloatTool), `DFFE_AGENT_TOOLS must not expose bloat tool: ${bloatTool}`);
    }

    const ragRes = await capabilityRegistry.execute('search_dffe_knowledge', {
      query: 'Working for Water and Working on Fire',
      series: 'programmes'
    });
    assert.strictEqual(ragRes.type, 'dffe_knowledge');
  });

  test('10-Branch token-efficient dynamic routing classifies queries across all 10 DFFE Branches', () => {
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

  test('HTTP endpoints /api/dffe/corpus, /api/dffe/search, /api/dffe/collections, /api/dffe/chunks/search, and /api/dffe/branches respond cleanly', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const corpusRes = await fetch(`http://127.0.0.1:${port}/api/dffe/corpus`);
      assert.strictEqual(corpusRes.status, 200);
      const corpusData = await corpusRes.json();
      assert.ok(corpusData.department.includes('Department of Forestry, Fisheries and the Environment'));
      assert.ok(corpusData.documentCount >= 10);

      const searchRes = await fetch(`http://127.0.0.1:${port}/api/dffe/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: '75 MW Solar PV & Grid Connection in a Renewable Energy Development Zone (REDZ)',
          series: 'legislation'
        })
      });
      assert.strictEqual(searchRes.status, 200);
      const searchData = await searchRes.json();
      assert.ok(searchData.documents.some(d => d.id === 'dffe-nema-eia-screening-2026'));

      const branchesRes = await fetch(`http://127.0.0.1:${port}/api/dffe/branches?q=ITBS+laptop+request`);
      assert.strictEqual(branchesRes.status, 200);
      const branchesData = await branchesRes.json();
      assert.strictEqual(branchesData.branchCount, 10);
      assert.ok(branchesData.matchedBranches.some(b => b.number === 4));

      // Verify legacy /dffe route redirects cleanly to main workspace /
      const redirectRes = await fetch(`http://127.0.0.1:${port}/dffe`, { redirect: 'manual' });
      assert.strictEqual(redirectRes.status, 301);
      assert.strictEqual(redirectRes.headers.get('location'), '/');
    } finally {
      server.close();
    }
  });

  test('DFFE Source Explorer widget renders cleanly and slash commands route through the real RAG + AI pipeline', async () => {
    const { dffeWidget } = await import('../public/js/widgets/components/dffe-widget.js');
    const { resolveSlashCommand } = await import('../public/js/services/intent-router.js');

    const sampleData = dffeRagService.searchKnowledge({
      query: 'State of the Environment',
      series: 'soer'
    });
    const html = dffeWidget.render(sampleData);
    assert.ok(html.includes('atlas-dffe-filter-bar'), 'Widget must render filter bar');
    assert.ok(html.includes('Official Source (dffe.gov.za)'), 'Widget must include official dffe.gov.za source button');
    assert.ok(html.includes('Open Brief in Canvas'), 'Widget must include Open Brief in Canvas button');
    assert.ok(!html.includes('Open 3-Phase Agent Hub'), 'Widget must not contain dead 3-Phase Agent Hub link');

    // Domain slash commands route through real RAG + AI chat pipeline (isDffeRag = true, toolToCall = null)
    const slashGito = resolveSlashCommand('/gito What directorates or sub-directorates fall under GITO?');
    assert.strictEqual(slashGito.isDffeRag, true);
    assert.strictEqual(slashGito.toolToCall, null);
    assert.strictEqual(slashGito.dffeFilters.series, 'gito_ict');
    assert.strictEqual(slashGito.dffeFilters.collection, 'gito');

    const slashEia = resolveSlashCommand('/eia 75 MW Solar PV & Grid Connection in a Renewable Energy Development Zone (REDZ)');
    assert.strictEqual(slashEia.isDffeRag, true);
    assert.strictEqual(slashEia.toolToCall, null);
    assert.strictEqual(slashEia.dffeFilters.series, 'legislation');
    assert.ok(slashEia.overrideText.includes('75 MW Solar PV'));

    const slashItbs = resolveSlashCommand('/itbs Request laptop and VPN');
    assert.strictEqual(slashItbs.isDffeRag, true);
    assert.strictEqual(slashItbs.toolToCall, null);
    assert.strictEqual(slashItbs.dffeFilters.series, 'internal_sop');

    // /sources explicitly opens the interactive Source Explorer widget
    const slashSources = resolveSlashCommand('/sources GITO organogram');
    assert.strictEqual(slashSources.toolToCall, 'search_dffe_knowledge');

    // Consumer & fake-studio bloat slash commands must NOT hijack the composer
    assert.strictEqual(resolveSlashCommand('/agent'), null);
    assert.strictEqual(resolveSlashCommand('/sensitivity'), null);
    assert.strictEqual(resolveSlashCommand('/movie Interstellar'), null);
    assert.strictEqual(resolveSlashCommand('/crypto bitcoin'), null);
    assert.strictEqual(resolveSlashCommand('/reddit news'), null);
    assert.strictEqual(resolveSlashCommand('/bible John 3:16'), null);
    assert.strictEqual(resolveSlashCommand('/joke'), null);

    const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
    assert.ok(indexHtml.includes('id="dffeKnowledgeBar"'), 'Main workspace must include DFFE Knowledge Filter Bar');
    assert.ok(indexHtml.includes('id="dffeWorkflowCardsGrid"'), 'Homescreen must include 4 focused DFFE Workflow Cards');
    assert.ok(indexHtml.includes('id="dffeFilterCollection"'), 'Knowledge scope bar must include 9-Collection filter');
    assert.ok(!indexHtml.includes('href="/dffe"'), 'Main workspace must not contain links to removed /dffe page');
    assert.ok(!indexHtml.includes('id="dffeFilterAgent"'), 'Main workspace must not include fake Directorate Agent selector');
    assert.ok(!indexHtml.includes('id="dffeFilterPhase"'), 'Main workspace must not include fake 3-Phase FM/IM selector');
  });

  test('DFFE & GITO 9-Collection Chunk Store, Approved vs. Proposed Status & Source A vs. Source B Conflict Rules work end-to-end', async () => {
    const collections = dffeRagService.getCollections();
    assert.strictEqual(collections.length, 9, 'Must define all 9 logical DFFE & GITO knowledge collections');
    const colIds = collections.map(c => c.id);
    for (const expectedCol of ['dffe_overview', 'cms', 'gito', 'ict_governance', 'ict_organogram', 'digital_solutions', 'infrastructure', 'cybersecurity', 'ict_operations']) {
      assert.ok(colIds.includes(expectedCol), `Must include logical collection: ${expectedCol}`);
    }

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

    const officialCmsChunk = gitoRes.chunks.find(c => c.chunkId === 'cms-01-branch-purpose-and-gito-placement');
    assert.strictEqual(officialCmsChunk.metadata.status, 'Official');

    const groundingText = dffeRagService.formatDffeGroundingContext(gitoRes);
    assert.ok(groundingText.includes('DFFE KNOWLEDGE ASSISTANT — 10 MANDATORY KNOWLEDGE & CITATION RULES:'));
    assert.ok(groundingText.includes('The available DFFE reference documents do not specify this information.'));
    assert.ok(groundingText.includes('[IMPORTANT SOURCE-CONFLICT & STATUS RULE — SOURCE A vs. SOURCE B PROPOSED GITO ORGANOGRAMS]'));
    assert.ok(groundingText.includes('Structure status: Proposed'));

    const appDevRes = dffeRagService.searchChunks({
      query: 'What does Applications Development and Support do?',
      collection: 'digital_solutions'
    });
    assert.ok(appDevRes.chunks.some(c => c.chunkId === 'dig-sol-01-unit2-responsibilities'));
    assert.ok(appDevRes.chunks[0].content.includes('Applications Development and Support'));

    const { dffeWidget } = await import('../public/js/widgets/components/dffe-widget.js');
    const gitoHtml = dffeWidget.render(gitoRes);
    assert.ok(gitoHtml.includes('Source Explorer — Indexed Knowledge Passages &amp; Page Citations (9 Logical Collections)'));
    assert.ok(gitoHtml.includes('Structure status: Proposed'));
    assert.ok(gitoHtml.includes('Compare Source A vs. Source B in Source Explorer'));
    assert.ok(gitoHtml.includes('Inspect in Source Explorer (Page 1)'));

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
