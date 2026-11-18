const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const app = require('../src/server');
const dffeRagService = require('../src/services/dffe-rag.service');
const { capabilityRegistry } = require('../src/capabilities');
const { ATLAS_TOOLS } = require('../src/config/tools.config');

describe('DFFE Environmental Intelligence & RAG Agent (UNEP EnvironmentGPT Reference)', () => {
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

  test('search_dffe_knowledge capability is registered in ATLAS_TOOLS and capabilityRegistry', async () => {
    const toolNames = ATLAS_TOOLS.map(t => t.function?.name);
    assert.ok(toolNames.includes('search_dffe_knowledge'), 'ATLAS_TOOLS must include search_dffe_knowledge');

    const res = await capabilityRegistry.execute('search_dffe_knowledge', {
      query: 'Working for Water and Working on Fire',
      series: 'programmes'
    });
    assert.strictEqual(res.type, 'dffe_knowledge');
    assert.ok(res.data);
    assert.strictEqual(res.data.filters.series, 'programmes');
    assert.ok(res.data.documents.some(d => d.id === 'dffe-epwp-programmes-2026'));
  });

  test('GET /api/dffe/corpus, POST /api/dffe/search, and GET /dffe portal respond with 200 OK', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const corpusRes = await fetch(`http://127.0.0.1:${port}/api/dffe/corpus`);
      assert.strictEqual(corpusRes.status, 200);
      const corpusData = await corpusRes.json();
      assert.ok(corpusData.department.includes('Department of Forestry, Fisheries and the Environment'));
      assert.ok(corpusData.documentCount >= 8);

      const searchRes = await fetch(`http://127.0.0.1:${port}/api/dffe/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Climate Change Act 22 of 2024 carbon budgets',
          series: 'climate'
        })
      });
      assert.strictEqual(searchRes.status, 200);
      const searchData = await searchRes.json();
      assert.ok(searchData.documents.some(d => d.id === 'dffe-climate-change-act-2026'));

      const portalRes = await fetch(`http://127.0.0.1:${port}/dffe`);
      assert.strictEqual(portalRes.status, 200);
      const portalHtml = await portalRes.text();
      assert.ok(portalHtml.includes('DFFE Environmental Intelligence &amp; RAG Assistant'));
      assert.ok(portalHtml.includes('id="dffeChatDrawer"'), 'Portal must include embeddable website chat bubble simulator');
    } finally {
      server.close();
    }
  });

  test('dffeWidget renders UNEP EnvironmentGPT filter bar, citations, and Canvas actions, and slash commands route cleanly', async () => {
    const { dffeWidget } = await import('../public/js/widgets/components/dffe-widget.js');
    const { resolveSlashCommand } = await import('../public/js/services/intent-router.js');

    const sampleData = dffeRagService.searchKnowledge({
      query: 'State of the Environment',
      series: 'soer'
    });
    const html = dffeWidget.render(sampleData);
    assert.ok(html.includes('atlas-dffe-filter-bar'), 'Widget must render UNEP EnvironmentGPT filter bar');
    assert.ok(html.includes('Official Source (dffe.gov.za)'), 'Widget must include official dffe.gov.za source button');
    assert.ok(html.includes('Open Brief in Canvas'), 'Widget must include Open Brief in Canvas button');

    const slashDffe = resolveSlashCommand('/dffe Working for Water');
    assert.strictEqual(slashDffe.toolToCall, 'search_dffe_knowledge');
    assert.strictEqual(slashDffe.argsPayload.query, 'Working for Water');

    const slashSoer = resolveSlashCommand('/soer');
    assert.strictEqual(slashSoer.toolToCall, 'search_dffe_knowledge');
    assert.strictEqual(slashSoer.argsPayload.series, 'soer');

    const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
    assert.ok(indexHtml.includes('id="dffeKnowledgeBar"'), 'Main workspace must include DFFE Knowledge Filter Bar');
    assert.ok(indexHtml.includes('data-preset="dffe"'), 'Personalization settings must include DFFE Environmental Specialist preset');
  });
});
