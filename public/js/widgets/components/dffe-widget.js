import { createWidgetShell, escapeHtml, WIDGET_ICONS } from '../widget-utils.js';
import { API_BASE } from '../../config/constants.js';

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
        { id: 'waste', label: 'Chemicals, Waste & Circular Economy' }
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

    const yearOptionsHtml = catalogue.years.map(y =>
      `<option value="${escapeHtml(y)}" ${String(y).toLowerCase() === String(filters.year).toLowerCase() ? 'selected' : ''}>${y === 'all' ? 'All Years' : escapeHtml(y)}</option>`
    ).join('');

    const audienceOptionsHtml = catalogue.audiences.map(a =>
      `<option value="${escapeHtml(a.id)}" ${a.id === filters.audience ? 'selected' : ''}>${escapeHtml(a.label)}</option>`
    ).join('');

    const docsHtml = renderDocumentCardsHtml(data.documents || []);
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

        <div class="atlas-dffe-docs-container js-dffe-docs-list">
          ${docsHtml}
        </div>

        <div class="atlas-dffe-governance-footer">
          <span><strong>Scientific Integrity &amp; Governance:</strong> Grounded in published DFFE reports &amp; statutory acts (<a href="https://www.dffe.gov.za" target="_blank" rel="noopener noreferrer">dffe.gov.za</a>).</span>
          <a href="/dffe" class="atlas-dffe-portal-link">Open DFFE Portal Simulator &rarr;</a>
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
    const yearSelect = root.querySelector('.js-dffe-filter-year');
    const audienceSelect = root.querySelector('.js-dffe-filter-audience');
    const docsList = root.querySelector('.js-dffe-docs-list');
    const countBadge = container.querySelector('.atlas-widget-count-badge');

    const bindCardActions = () => {
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

            if (typeof window.atlasOpenMarkdownInCanvas === 'function') {
              window.atlasOpenMarkdownInCanvas(doc.title || 'DFFE Report Brief', markdownReport);
            } else {
              const toggleBtn = document.getElementById('toggleCanvasBtn');
              const mdContent = document.getElementById('canvasMarkdownContent');
              const docTitle = document.getElementById('canvasDocumentTitle');
              const mdTab = document.querySelector('.canvas-tab[data-tab="markdown"]');
              if (docTitle) docTitle.textContent = doc.title || 'DFFE Report Brief';
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
            input.value = `Based on the DFFE "${title}", what are the primary operational targets, compliance obligations, and implementation priorities?`;
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
      const year = yearSelect ? yearSelect.value : 'all';
      const audience = audienceSelect ? audienceSelect.value : 'public';

      try {
        const res = await fetch(`${API_BASE}/api/dffe/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, series, year, audience, limit: 4 })
        });
        if (!res.ok) return;
        const updated = await res.json();
        docsList.innerHTML = renderDocumentCardsHtml(updated.documents || []);
        if (countBadge) {
          countBadge.textContent = `${(updated.documents || []).length} VERIFIED SOURCES`;
        }
        bindCardActions();
      } catch (err) {
        console.warn('[DFFE Widget] Filter update failed:', err);
      }
    };

    seriesSelect?.addEventListener('change', refreshFilteredResults);
    yearSelect?.addEventListener('change', refreshFilteredResults);
    audienceSelect?.addEventListener('change', refreshFilteredResults);
  }
};
