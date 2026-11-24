import { createWidgetShell, escapeHtml, WIDGET_ICONS } from '../widget-utils.js';
import { API_BASE } from '../../config/constants.js';

function openReportInCanvas(title, markdownReport) {
  if (typeof window.atlasOpenMarkdownInCanvas === 'function') {
    window.atlasOpenMarkdownInCanvas(title, markdownReport);
    return;
  }
  const toggleBtn = document.getElementById('toggleCanvasBtn');
  const mdContent = document.getElementById('canvasMarkdownContent');
  const docTitle = document.getElementById('canvasDocumentTitle');
  const mdTab = document.querySelector('.canvas-tab[data-tab="markdown"]');
  if (docTitle) docTitle.textContent = title;
  if (mdContent && window.marked) {
    mdContent.innerHTML = window.marked.parse(markdownReport);
  } else if (mdContent) {
    mdContent.textContent = markdownReport;
  }
  const panel = document.getElementById('artifactsCanvasPanel');
  if (panel && !panel.classList.contains('open') && toggleBtn) {
    toggleBtn.click();
  }
  if (mdTab) mdTab.click();
}

function renderSourceConflictBannerHtml(sourceConflictDetected, sourceConflictRules = []) {
  if (!sourceConflictDetected || !Array.isArray(sourceConflictRules) || sourceConflictRules.length === 0) return '';
  const rulesAttr = escapeHtml(JSON.stringify(sourceConflictRules));
  return `
    <div class="atlas-dffe-conflict-bar" style="padding: 10px 12px; margin-bottom: 10px; border-radius: 6px; background: rgba(212, 160, 23, 0.1); border: 1px solid rgba(212, 160, 23, 0.35); font-size: 0.78rem; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px;">
      <div>
        <strong>Structure Status Distinction (Official vs. Proposed):</strong> The public DFFE CMS webpage confirms GITO is a Chief Directorate within CMS, whereas <strong>Source A</strong> (<em>Revised ICT Organogram</em>, Page 1) and <strong>Source B</strong> (<em>GITO Proposed Operating Model</em>, Pages 1–7) describe <strong>Proposed</strong> capability areas and differ in 4 structural dimensions.
      </div>
      <button type="button" class="atlas-dffe-action-btn js-dffe-open-conflict-explorer" data-rules="${rulesAttr}" style="white-space: nowrap;">
        <span>Compare Source A vs. Source B in Source Explorer</span>
      </button>
    </div>
  `;
}

function renderChunkCardsHtml(chunks = [], sourceConflictRules = []) {
  if (!Array.isArray(chunks) || chunks.length === 0) return '';
  const rulesAttr = escapeHtml(JSON.stringify(sourceConflictRules || []));

  const cardsHtml = chunks.slice(0, 4).map((chunk, idx) => {
    const meta = chunk.metadata || {};
    const status = meta.status || 'Proposed';
    const isProposed = status.toLowerCase() === 'proposed';
    const statusBadgeStyle = isProposed
      ? 'background: rgba(212, 160, 23, 0.14); color: #92400E; border: 1px solid rgba(212, 160, 23, 0.4);'
      : 'background: rgba(0, 102, 51, 0.1); color: #006633; border: 1px solid rgba(0, 102, 51, 0.25);';

    const chunkJsonAttr = escapeHtml(JSON.stringify({
      chunkId: chunk.chunkId,
      collection: chunk.collection,
      collectionId: chunk.collectionId,
      title: chunk.title,
      content: chunk.content,
      metadata: meta
    }));

    return `
      <div class="atlas-dffe-doc-card atlas-dffe-chunk-card" data-chunk-id="${escapeHtml(chunk.chunkId || `chunk-${idx}`)}">
        <div class="atlas-dffe-doc-top">
          <div class="atlas-dffe-doc-badges">
            <span class="atlas-dffe-series-tag">Collection: ${escapeHtml(chunk.collection || 'GITO')}</span>
            <span class="atlas-dffe-year-tag">Page: ${escapeHtml(String(meta.page || '1'))}</span>
            <span class="atlas-dffe-gov-tag" style="${statusBadgeStyle}">Structure status: ${escapeHtml(status)}</span>
          </div>
          <h4 class="atlas-dffe-doc-title">${escapeHtml(chunk.title)}</h4>
          <div class="atlas-dffe-doc-branch">
            <strong>Source:</strong> ${escapeHtml(meta.source || 'DFFE Reference')} &bull;
            <strong>Section:</strong> ${escapeHtml(meta.section || 'General')} &bull;
            <strong>Directorate:</strong> ${escapeHtml(meta.directorate || 'GITO')}
          </div>
        </div>

        <p class="atlas-dffe-doc-summary" style="white-space: pre-line;">${escapeHtml(chunk.content || '')}</p>

        ${meta.approvalCaveat ? `
          <div class="atlas-dffe-doc-citation" style="margin-bottom: 8px;">
            <span class="atlas-dffe-citation-label">Status &amp; Approval Caveat:</span>
            <span>${escapeHtml(meta.approvalCaveat)}</span>
          </div>
        ` : ''}

        <div class="atlas-dffe-doc-actions">
          <button type="button" class="atlas-dffe-action-btn primary js-dffe-open-source-explorer" data-chunk="${chunkJsonAttr}" data-rules="${rulesAttr}">
            <span>Inspect in Source Explorer (Page ${escapeHtml(String(meta.page || '1'))})</span>
          </button>
          <a href="${escapeHtml(meta.url || 'https://www.dffe.gov.za/corporate-management-services')}" target="_blank" rel="noopener noreferrer" class="atlas-dffe-action-btn">
            <span>View Original Source</span>
            ${WIDGET_ICONS.externalLink}
          </a>
          <button type="button" class="atlas-dffe-action-btn js-dffe-ask-followup" data-title="${escapeHtml(chunk.title)}">
            <span>Ask Follow-Up</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="atlas-dffe-chunks-section" style="margin-bottom: 14px;">
      <div style="font-size: 0.76rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted, #5f7367); margin-bottom: 8px;">
        Source Explorer — Indexed Knowledge Passages &amp; Page Citations (9 Logical Collections)
      </div>
      <div class="atlas-dffe-docs-container">
        ${cardsHtml}
      </div>
    </div>
  `;
}

function renderDocumentCardsHtml(documents = []) {
  if (!Array.isArray(documents) || documents.length === 0) {
    return `<div class="atlas-dffe-empty">No verified DFFE publications matched the selected filter criteria.</div>`;
  }

  return documents.map((doc, idx) => {
    const findingsHtml = (doc.keyFindings || []).slice(0, 4).map(finding => {
      return `<li>${escapeHtml(finding)}</li>`;
    }).join('');

    const docJsonAttr = escapeHtml(JSON.stringify({
      title: doc.title,
      year: doc.year,
      seriesLabel: doc.seriesLabel,
      branch: doc.branch,
      governance: doc.governance,
      citation: doc.citation,
      url: doc.url,
      summary: doc.summary,
      keyFindings: doc.keyFindings || []
    }));

    return `
      <div class="atlas-dffe-doc-card" data-doc-id="${escapeHtml(doc.id || `doc-${idx}`)}">
        <div class="atlas-dffe-doc-top">
          <div class="atlas-dffe-doc-badges">
            <span class="atlas-dffe-series-tag">${escapeHtml(doc.seriesLabel || 'DFFE Report')}</span>
            <span class="atlas-dffe-year-tag">${escapeHtml(doc.year || '2026')}</span>
            <span class="atlas-dffe-gov-tag">${escapeHtml(doc.governance || 'PUBLIC — Verified')}</span>
          </div>
          <h4 class="atlas-dffe-doc-title">${escapeHtml(doc.title)}</h4>
          <div class="atlas-dffe-doc-branch">${escapeHtml(doc.branch || 'Department of Forestry, Fisheries and the Environment')}</div>
        </div>

        <p class="atlas-dffe-doc-summary">${escapeHtml(doc.summary || '')}</p>

        ${findingsHtml ? `<ul class="atlas-dffe-findings-list">${findingsHtml}</ul>` : ''}

        <div class="atlas-dffe-doc-citation">
          <span class="atlas-dffe-citation-label">Source Citation:</span>
          <span>${escapeHtml(doc.citation || 'DFFE Official Publication')}</span>
        </div>

        <div class="atlas-dffe-doc-actions">
          <a href="${escapeHtml(doc.url || 'https://www.dffe.gov.za')}" target="_blank" rel="noopener noreferrer" class="atlas-dffe-action-btn primary">
            <span>Official Source (dffe.gov.za)</span>
            ${WIDGET_ICONS.externalLink}
          </a>
          <button type="button" class="atlas-dffe-action-btn js-dffe-open-canvas" data-doc="${docJsonAttr}">
            <span>Open Brief in Canvas</span>
          </button>
          <button type="button" class="atlas-dffe-action-btn js-dffe-ask-followup" data-title="${escapeHtml(doc.title)}">
            <span>Ask Follow-Up</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export const dffeWidget = {
  type: 'dffe_knowledge',

  render(data) {
    if (!data) return '';
    if (data.error) {
      return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;
    }

    const filters = data.filters || {
      series: 'all',
      seriesLabel: 'All DFFE Sources',
      collection: 'all',
      status: 'all',
      year: 'all',
      audience: 'public',
      audienceLabel: 'General Public'
    };

    const catalogue = data.catalogue || {
      series: [
        { id: 'all', label: 'All DFFE Sources' },
        { id: 'soer', label: 'State of the Environment (SoER)' },
        { id: 'programmes', label: 'Environmental Programmes (EPWP)' },
        { id: 'legislation', label: 'Legislation & EIA (NEMA)' },
        { id: 'climate', label: 'Climate Change & Air Quality' },
        { id: 'forestry_fisheries', label: 'Forestry, Fisheries & Oceans' },
        { id: 'waste', label: 'Chemicals, Waste & Circular Economy' },
        { id: 'internal_sop', label: 'Internal Directorate SOPs & Governance' },
        { id: 'gito_ict', label: 'GITO & ICT Governance / Organogram' }
      ],
      collections: [
        { id: 'dffe_overview', name: 'DFFE Overview' },
        { id: 'cms', name: 'CMS' },
        { id: 'gito', name: 'GITO' },
        { id: 'ict_governance', name: 'ICT Governance' },
        { id: 'ict_organogram', name: 'ICT Organogram' },
        { id: 'digital_solutions', name: 'Digital Solutions' },
        { id: 'infrastructure', name: 'Infrastructure' },
        { id: 'cybersecurity', name: 'Cybersecurity' },
        { id: 'ict_operations', name: 'ICT Operations' }
      ],
      statuses: [
        { id: 'Official', label: 'Official (Approved Fact)' },
        { id: 'Proposed', label: 'Proposed (ICT Organogram / Model)' },
        { id: 'Statutory', label: 'Statutory (DPSA CGICTPF / Act)' },
        { id: 'Historical', label: 'Historical (Pre-April 2021)' }
      ],
      audiences: [
        { id: 'public', label: 'General Public' },
        { id: 'officials', label: 'DFFE Officials & Directorates' },
        { id: 'researchers', label: 'Researchers & Policy Analysts' },
        { id: 'compliance', label: 'Compliance & EIA Practitioners' }
      ],
      years: ['all', '2026', '2025', '2024']
    };

    const seriesOptionsHtml = catalogue.series.map(s =>
      `<option value="${escapeHtml(s.id)}" ${s.id === filters.series ? 'selected' : ''}>${escapeHtml(s.label)}</option>`
    ).join('');

    const collectionsList = catalogue.collections || [];
    const collectionOptionsHtml = [
      `<option value="all" ${(filters.collection || 'all') === 'all' ? 'selected' : ''}>All 9 Knowledge Collections</option>`,
      ...collectionsList.map(c =>
        `<option value="${escapeHtml(c.id)}" ${c.id === filters.collection ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
      )
    ].join('');

    const statusesList = catalogue.statuses || [];
    const statusOptionsHtml = [
      `<option value="all" ${(filters.status || 'all') === 'all' ? 'selected' : ''}>All Statuses (Official &amp; Proposed)</option>`,
      ...statusesList.map(st =>
        `<option value="${escapeHtml(st.id)}" ${String(st.id).toLowerCase() === String(filters.status || 'all').toLowerCase() ? 'selected' : ''}>${escapeHtml(st.id)} — ${escapeHtml(st.label)}</option>`
      )
    ].join('');

    const yearOptionsHtml = catalogue.years.map(y =>
      `<option value="${escapeHtml(y)}" ${String(y).toLowerCase() === String(filters.year).toLowerCase() ? 'selected' : ''}>${y === 'all' ? 'All Years' : escapeHtml(y)}</option>`
    ).join('');

    const audienceOptionsHtml = catalogue.audiences.map(a =>
      `<option value="${escapeHtml(a.id)}" ${a.id === filters.audience ? 'selected' : ''}>${escapeHtml(a.label)}</option>`
    ).join('');

    const docsHtml = renderDocumentCardsHtml(data.documents || []);
    const chunksHtml = renderChunkCardsHtml(data.chunks || [], data.sourceConflictRules || []);
    const conflictBannerHtml = renderSourceConflictBannerHtml(data.sourceConflictDetected, data.sourceConflictRules);
    const metaRight = `<span class="atlas-widget-count-badge">${escapeHtml(String((data.documents || []).length))} VERIFIED SOURCES</span>`;

    const content = `
      <div class="atlas-dffe-widget-root" data-query="${escapeHtml(data.query || '')}">
        <div class="atlas-dffe-filter-bar" role="region" aria-label="DFFE Knowledge Base Filters">
          <div class="atlas-dffe-filter-field">
            <label class="atlas-dffe-filter-label">Report Series</label>
            <select class="atlas-dffe-select js-dffe-filter-series" aria-label="Filter by Report Series">
              ${seriesOptionsHtml}
            </select>
          </div>
          <div class="atlas-dffe-filter-field">
            <label class="atlas-dffe-filter-label">Knowledge Collection (9)</label>
            <select class="atlas-dffe-select js-dffe-filter-collection" aria-label="Filter by Knowledge Collection">
              ${collectionOptionsHtml}
            </select>
          </div>
          <div class="atlas-dffe-filter-field">
            <label class="atlas-dffe-filter-label">Structure Status</label>
            <select class="atlas-dffe-select js-dffe-filter-status" aria-label="Filter by Official vs Proposed Status">
              ${statusOptionsHtml}
            </select>
          </div>
          <div class="atlas-dffe-filter-field">
            <label class="atlas-dffe-filter-label">Year</label>
            <select class="atlas-dffe-select js-dffe-filter-year" aria-label="Filter by Year">
              ${yearOptionsHtml}
            </select>
          </div>
          <div class="atlas-dffe-filter-field">
            <label class="atlas-dffe-filter-label">Audience</label>
            <select class="atlas-dffe-select js-dffe-filter-audience" aria-label="Filter by Target Audience">
              ${audienceOptionsHtml}
            </select>
          </div>
        </div>

        <div class="js-dffe-sensitivity-container">${conflictBannerHtml}</div>

        <div class="js-dffe-chunks-list">${chunksHtml}</div>

        <div class="atlas-dffe-docs-container js-dffe-docs-list">
          ${docsHtml}
        </div>

        <div class="atlas-dffe-governance-footer">
          <span><strong>DFFE Knowledge &amp; Reference Corpus:</strong> Grounded in verified DFFE publications &amp; statutory acts (<a href="https://www.dffe.gov.za" target="_blank" rel="noopener noreferrer">dffe.gov.za</a>).</span>
        </div>
      </div>
    `;

    return createWidgetShell(
      'dffe_knowledge',
      WIDGET_ICONS.dffe,
      'DFFE Environmental Knowledge & RAG Citations',
      content,
      metaRight
    );
  },

  mount(container, data) {
    if (!container) return;
    const root = container.querySelector('.atlas-dffe-widget-root');
    if (!root) return;

    const seriesSelect = root.querySelector('.js-dffe-filter-series');
    const collectionSelect = root.querySelector('.js-dffe-filter-collection');
    const statusSelect = root.querySelector('.js-dffe-filter-status');
    const yearSelect = root.querySelector('.js-dffe-filter-year');
    const audienceSelect = root.querySelector('.js-dffe-filter-audience');
    const docsList = root.querySelector('.js-dffe-docs-list');
    const chunksList = root.querySelector('.js-dffe-chunks-list');
    const sensitivityContainer = root.querySelector('.js-dffe-sensitivity-container');
    const countBadge = container.querySelector('.atlas-widget-count-badge');

    const bindCardActions = () => {
      root.querySelectorAll('.js-dffe-open-source-explorer').forEach(btn => {
        btn.addEventListener('click', () => {
          try {
            const chunk = JSON.parse(btn.getAttribute('data-chunk') || '{}');
            const rules = JSON.parse(btn.getAttribute('data-rules') || '[]');
            const meta = chunk.metadata || {};
            const conflictSection = Array.isArray(rules) && rules.length > 0
              ? [
                  ``,
                  `## Source A vs. Source B Proposed Organogram Comparison`,
                  `> **Important Distinction:** The public DFFE CMS webpage confirms that GITO is a Chief Directorate within CMS. Both internal ICT organogram documents are **Proposed** and must never be silently merged or presented as confirmed approved posts.`,
                  ``,
                  ...rules.map(r => `### ${r.dimension}\n- **${r.sourceA}**\n- **${r.sourceB}**`)
                ]
              : [];

            const explorerMarkdown = [
              `# Source Explorer — ${chunk.title || 'Indexed Knowledge Record'}`,
              ``,
              `## Record Metadata & Structure Status`,
              `- **Knowledge Collection:** ${chunk.collection || 'GITO'} (\`${chunk.collectionId || 'gito'}\`)`,
              `- **Source Document:** ${meta.source || 'DFFE Reference'}`,
              `- **Page Reference:** ${meta.page || '1'}`,
              `- **Document Section:** ${meta.section || 'General'}`,
              `- **Category:** ${meta.category || 'Organisational structure'}`,
              `- **Structure Status:** **${meta.status || 'Proposed'}**`,
              `- **Department:** ${meta.department || 'DFFE'}`,
              `- **Branch:** ${meta.branch || 'Corporate Management Services (CMS)'}`,
              `- **Directorate:** ${meta.directorate || 'GITO'}`,
              `- **Official Reference Link:** [${meta.url || 'https://www.dffe.gov.za/corporate-management-services'}](${meta.url || 'https://www.dffe.gov.za/corporate-management-services'})`,
              ``,
              `## Status & Approval Caveat`,
              `> ${meta.approvalCaveat || 'Always distinguish approved departmental facts from proposed organisational arrangements.'}`,
              ``,
              `## Exact Verbatim Passage Used to Ground the AI Response`,
              `\`\`\`text`,
              `${chunk.content || ''}`,
              `\`\`\``,
              ...conflictSection
            ].join('\n');

            openReportInCanvas(`Source Explorer: ${chunk.collection || 'GITO'} (Page ${meta.page || '1'})`, explorerMarkdown);
          } catch (err) {
            console.warn('[DFFE Source Explorer] Failed opening chunk in canvas:', err);
          }
        });
      });

      root.querySelectorAll('.js-dffe-open-conflict-explorer').forEach(btn => {
        btn.addEventListener('click', () => {
          try {
            const rules = JSON.parse(btn.getAttribute('data-rules') || '[]');
            const md = [
              `# Source Explorer — Source A vs. Source B Proposed GITO Organogram Comparison`,
              ``,
              `- **Official Public Departmental Fact:** The [DFFE Corporate Management Services webpage](https://www.dffe.gov.za/corporate-management-services) confirms that the **Chief Directorate: Government Information Technology Office (GITO)** sits within the **Corporate Management Services (CMS)** branch under the **DDG: Corporate Management Services**.`,
              `- **Structure Status of Internal ICT Organograms:** **Proposed** (\`Structure status: Proposed\`)`,
              `- **Approval Caveat:** Functional sub-units do not constitute posts. Final posts, grades, and establishment are subject to an approved business case, consultation, affordability, job evaluation, and DPSA organisational-design processes.`,
              ``,
              `## Four Key Differences Between Source A (1-Page Organogram) and Source B (7-Page Operating Model)`,
              ...rules.map(r => `### ${r.dimension}\n- **${r.sourceA}**\n- **${r.sourceB}**`)
            ].join('\n');
            openReportInCanvas('Source Explorer: Source A vs. Source B Comparison', md);
          } catch (err) {
            console.warn('[DFFE Source Explorer] Failed opening conflict matrix:', err);
          }
        });
      });

      root.querySelectorAll('.js-dffe-open-canvas').forEach(btn => {
        btn.addEventListener('click', () => {
          try {
            const doc = JSON.parse(btn.getAttribute('data-doc') || '{}');
            const markdownReport = [
              `# ${doc.title || 'DFFE Report Brief'}`,
              ``,
              `- **Report Series:** ${doc.seriesLabel || 'DFFE Publication'}`,
              `- **Publication Year:** ${doc.year || '2026'}`,
              `- **Responsible Branch:** ${doc.branch || 'DFFE'}`,
              `- **Governance Status:** ${doc.governance || 'PUBLIC — Verified DFFE Publication'}`,
              `- **Official Citation:** ${doc.citation || 'DFFE'}`,
              `- **Official Portal Link:** [${doc.url || 'https://www.dffe.gov.za'}](${doc.url || 'https://www.dffe.gov.za'})`,
              ``,
              `## Executive Summary`,
              `${doc.summary || ''}`,
              ``,
              `## Key Verified Findings & Statutory Provisions`,
              ...(doc.keyFindings || []).map(f => `- ${f}`)
            ].join('\n');

            openReportInCanvas(doc.title || 'DFFE Report Brief', markdownReport);
          } catch (err) {
            console.warn('[DFFE Widget] Failed opening brief in canvas:', err);
          }
        });
      });

      root.querySelectorAll('.js-dffe-ask-followup').forEach(btn => {
        btn.addEventListener('click', () => {
          const title = btn.getAttribute('data-title') || 'this DFFE report';
          const input = document.getElementById('messageInput');
          if (input) {
            input.value = `Based on the DFFE reference "${title}", explain the exact departmental structure, whether it is official or proposed, and cite the source and page references.`;
            input.focus();
            input.dispatchEvent(new Event('input'));
          }
        });
      });
    };

    bindCardActions();

    const refreshFilteredResults = async () => {
      if (!docsList) return;
      const query = root.getAttribute('data-query') || data?.query || '';
      const series = seriesSelect ? seriesSelect.value : 'all';
      const collection = collectionSelect ? collectionSelect.value : 'all';
      const status = statusSelect ? statusSelect.value : 'all';
      const year = yearSelect ? yearSelect.value : 'all';
      const audience = audienceSelect ? audienceSelect.value : 'public';

      try {
        const res = await fetch(`${API_BASE}/api/dffe/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, series, collection, status, year, audience, limit: 4 })
        });
        if (!res.ok) return;
        const updated = await res.json();
        docsList.innerHTML = renderDocumentCardsHtml(updated.documents || []);
        if (chunksList) {
          chunksList.innerHTML = renderChunkCardsHtml(updated.chunks || [], updated.sourceConflictRules || []);
        }
        if (sensitivityContainer) {
          sensitivityContainer.innerHTML = renderSourceConflictBannerHtml(updated.sourceConflictDetected, updated.sourceConflictRules);
        }
        if (countBadge) {
          countBadge.textContent = `${(updated.documents || []).length} VERIFIED SOURCES`;
        }
        bindCardActions();
      } catch (err) {
        console.warn('[DFFE Widget] Filter update failed:', err);
      }
    };

    seriesSelect?.addEventListener('change', refreshFilteredResults);
    collectionSelect?.addEventListener('change', refreshFilteredResults);
    statusSelect?.addEventListener('change', refreshFilteredResults);
    yearSelect?.addEventListener('change', refreshFilteredResults);
    audienceSelect?.addEventListener('change', refreshFilteredResults);
  }
};
