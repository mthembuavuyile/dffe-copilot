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

function renderSensitivityBannerHtml(sensitivityAudit) {
  if (!sensitivityAudit) return '';
  const allowed = (sensitivityAudit.allowedSensitivities || ['public']).map(s => s.toUpperCase()).join(' · ');
  const withheld = Number(sensitivityAudit.withheldCount) || 0;
  const withheldText = withheld > 0
    ? `FM/IM Sensitivity Gate withheld <strong>${withheld}</strong> internal/restricted record(s) in this phase.`
    : `Full clearance active across all sensitivity tiers (${allowed}).`;

  return `
    <div class="atlas-dffe-sensitivity-bar" style="padding: 8px 12px; margin-bottom: 10px; border-radius: 6px; background: rgba(0, 102, 51, 0.07); border: 1px solid rgba(0, 102, 51, 0.22); font-size: 0.78rem; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px;">
      <span><strong>Active Context:</strong> ${escapeHtml(sensitivityAudit.phaseName || 'Phase 2: Public')} &bull; Allowed: <code>${escapeHtml(allowed)}</code></span>
      <span>${withheldText}</span>
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
      sensitivity: doc.sensitivity || 'public',
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
      audienceLabel: 'General Public',
      accessPhase: 'phase2_public'
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
        { id: 'internal_sop', label: 'Internal Directorate SOPs & Governance' }
      ],
      audiences: [
        { id: 'public', label: 'General Public' },
        { id: 'officials', label: 'DFFE Officials & Directorates' },
        { id: 'researchers', label: 'Researchers & Policy Analysts' },
        { id: 'compliance', label: 'Compliance & EIA Practitioners' }
      ],
      years: ['all', '2026', '2025', '2024'],
      phases: [
        { id: 'phase1_internal', shortLabel: 'Phase 1: Internal / Teams' },
        { id: 'phase2_public', shortLabel: 'Phase 2: Public / WhatsApp' },
        { id: 'phase3_enterprise', shortLabel: 'Phase 3: Enterprise Systems (RBAC)' }
      ]
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

    const phasesList = catalogue.phases || [
      { id: 'phase1_internal', shortLabel: 'Phase 1: Internal / Teams' },
      { id: 'phase2_public', shortLabel: 'Phase 2: Public / WhatsApp' },
      { id: 'phase3_enterprise', shortLabel: 'Phase 3: Enterprise Systems (RBAC)' }
    ];
    const phaseOptionsHtml = phasesList.map(p =>
      `<option value="${escapeHtml(p.id)}" ${p.id === (filters.accessPhase || 'phase2_public') ? 'selected' : ''}>${escapeHtml(p.shortLabel || p.name)}</option>`
    ).join('');

    const docsHtml = renderDocumentCardsHtml(data.documents || []);
    const sensitivityBannerHtml = renderSensitivityBannerHtml(data.sensitivityAudit);
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
          <div class="atlas-dffe-filter-field">
            <label class="atlas-dffe-filter-label">Deployment Phase (FM/IM)</label>
            <select class="atlas-dffe-select js-dffe-filter-phase" aria-label="Filter by Deployment Phase & Sensitivity">
              ${phaseOptionsHtml}
            </select>
          </div>
        </div>

        <div class="js-dffe-sensitivity-container">${sensitivityBannerHtml}</div>

        <div class="atlas-dffe-docs-container js-dffe-docs-list">
          ${docsHtml}
        </div>

        <div class="atlas-dffe-governance-footer">
          <span><strong>Scientific Integrity &amp; FM/IM Governance:</strong> Grounded in verified DFFE reports &amp; statutory acts (<a href="https://www.dffe.gov.za" target="_blank" rel="noopener noreferrer">dffe.gov.za</a>).</span>
          <a href="/dffe" class="atlas-dffe-portal-link">Open 3-Phase Agent Hub &amp; Channel Simulator &rarr;</a>
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
    const phaseSelect = root.querySelector('.js-dffe-filter-phase');
    const docsList = root.querySelector('.js-dffe-docs-list');
    const sensitivityContainer = root.querySelector('.js-dffe-sensitivity-container');
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
              `- **FM/IM Sensitivity Tier:** ${(doc.sensitivity || 'public').toUpperCase()}`,
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
      const accessPhase = phaseSelect ? phaseSelect.value : 'phase2_public';

      try {
        const res = await fetch(`${API_BASE}/api/dffe/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, series, year, audience, accessPhase, limit: 4 })
        });
        if (!res.ok) return;
        const updated = await res.json();
        docsList.innerHTML = renderDocumentCardsHtml(updated.documents || []);
        if (sensitivityContainer) {
          sensitivityContainer.innerHTML = renderSensitivityBannerHtml(updated.sensitivityAudit);
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
    yearSelect?.addEventListener('change', refreshFilteredResults);
    audienceSelect?.addEventListener('change', refreshFilteredResults);
    phaseSelect?.addEventListener('change', refreshFilteredResults);
  }
};

export const dffeEiaScreeningWidget = {
  type: 'dffe_eia_screening',

  render(data) {
    if (!data) return '';
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const protocolsHtml = (data.specialistProtocols || []).map(p => `<li>${escapeHtml(p)}</li>`).join('');
    const milestonesHtml = (data.statutoryMilestones || []).map(m => `
      <div style="padding: 8px 10px; border-radius: 5px; background: var(--bg-app, #fff); border: 1px solid var(--border-subtle, #dce6df); margin-bottom: 6px;">
        <div style="display:flex; justify-content:space-between; font-weight:600; font-size:0.8rem;">
          <span>${escapeHtml(m.phase)}</span>
          <span style="color:var(--accent-primary, #006633); font-family:var(--font-mono, monospace);">${escapeHtml(m.days)}</span>
        </div>
        <div style="font-size:0.76rem; color:var(--text-secondary, #3b4d42); margin-top:2px;">${escapeHtml(m.detail)}</div>
      </div>
    `).join('');

    const payloadAttr = escapeHtml(JSON.stringify(data));
    const metaRight = `<span class="atlas-widget-count-badge">${escapeHtml(String(data.decisionTimeframeDays || 197))} DAYS STATUTORY</span>`;

    const content = `
      <div class="atlas-dffe-eia-root">
        <div class="atlas-dffe-doc-card">
          <div class="atlas-dffe-doc-badges">
            <span class="atlas-dffe-series-tag">${escapeHtml(data.listingNotice)}</span>
            <span class="atlas-dffe-year-tag">${escapeHtml(String(data.decisionTimeframeDays))} Days Decision Window</span>
            <span class="atlas-dffe-gov-tag">${data.fastTrackApplicable ? 'REDZ 57-DAY FAST-TRACK' : 'NEMA SECTION 24 EIA'}</span>
          </div>
          <h4 class="atlas-dffe-doc-title">${escapeHtml(data.projectDescription)}</h4>
          <div class="atlas-dffe-doc-branch"><strong>Competent Authority:</strong> ${escapeHtml(data.competentAuthority)}</div>
          <p class="atlas-dffe-doc-summary"><strong>Required Assessment Pathway:</strong> ${escapeHtml(data.assessmentProcess)} (${escapeHtml(data.locationOrCorridor)})</p>

          <div style="margin: 10px 0;">
            <div style="font-size:0.76rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">Mandatory DFFE National Screening Tool Protocols</div>
            <ul class="atlas-dffe-findings-list">${protocolsHtml}</ul>
          </div>

          <div style="margin: 10px 0;">
            <div style="font-size:0.76rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">Statutory NEMA Milestone Roadmap</div>
            ${milestonesHtml}
          </div>

          <div class="atlas-dffe-doc-actions">
            <a href="${escapeHtml(data.screeningToolUrl || 'https://screening.environment.gov.za')}" target="_blank" rel="noopener noreferrer" class="atlas-dffe-action-btn primary">
              <span>Launch DFFE National Screening Tool</span>
              ${WIDGET_ICONS.externalLink}
            </a>
            <button type="button" class="atlas-dffe-action-btn js-eia-open-canvas" data-eia="${payloadAttr}">
              <span>Open EIA Screening Checklist in Canvas</span>
            </button>
          </div>
        </div>
      </div>
    `;

    return createWidgetShell(
      'dffe_eia_screening',
      WIDGET_ICONS.dffe,
      'NEMA Section 24 EIA & National Screening Tool Engine',
      content,
      metaRight
    );
  },

  mount(container) {
    if (!container) return;
    container.querySelectorAll('.js-eia-open-canvas').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          const d = JSON.parse(btn.getAttribute('data-eia') || '{}');
          const md = [
            `# NEMA Section 24 EIA Screening & Compliance Checklist`,
            ``,
            `- **Proposed Activity:** ${d.projectDescription}`,
            `- **Geographic Scope:** ${d.locationOrCorridor}`,
            `- **Triggered Listing Notice:** ${d.listingNotice}`,
            `- **Assessment Pathway:** ${d.assessmentProcess}`,
            `- **Statutory Decision Timeframe:** ${d.decisionTimeframeDays} Days`,
            `- **Competent Authority:** ${d.competentAuthority}`,
            `- **Screening Portal:** [${d.screeningToolUrl}](${d.screeningToolUrl})`,
            ``,
            `## Mandatory Specialist Protocols`,
            ...(d.specialistProtocols || []).map(p => `- [ ] ${p}`),
            ``,
            `## Statutory Timeframe Milestones`,
            ...(d.statutoryMilestones || []).map(m => `- **${m.phase} (${m.days}):** ${m.detail}`)
          ].join('\n');
          openReportInCanvas('NEMA Section 24 EIA Screening Checklist', md);
        } catch (e) {
          console.warn('[DFFE EIA Widget] Canvas open error:', e);
        }
      });
    });
  }
};

export const dffeIndicatorsWidget = {
  type: 'dffe_indicators',

  render(data) {
    if (!data) return '';
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const cc = data.climateChangeAct || {};
    const cb = cc.carbonBudgetModel || {};
    const saaqis = data.saaqisAirQuality || {};
    const sawic = data.sawicWasteCircular || {};
    const epwp = data.epwpAndFisheries || {};

    const airRows = (saaqis.priorityAreas || []).map(pa => `
      <div style="padding: 8px 10px; border-radius: 5px; background: var(--bg-app, #fff); border: 1px solid var(--border-subtle, #dce6df); margin-bottom: 6px; font-size:0.78rem;">
        <div style="display:flex; justify-content:space-between; font-weight:700;">
          <span>${escapeHtml(pa.area)}</span>
          <span style="font-family:var(--font-mono, monospace); color:var(--accent-primary, #006633);">PM2.5: ${escapeHtml(String(pa.pm25DailyAvgUgM3))} µg/m³ (NAAQS: ${escapeHtml(String(pa.naaqsDailyLimitUgM3))})</span>
        </div>
        <div style="color:var(--text-secondary); margin-top:2px;">SO2: ${escapeHtml(String(pa.so2DailyAvgUgM3))} µg/m³ &bull; ${escapeHtml(String(pa.monitoredStations))} Stations &bull; ${escapeHtml(pa.status)}</div>
      </div>
    `).join('');

    const eprRows = (sawic.eprSectors || []).map(s => `
      <li><strong>${escapeHtml(s.sector)}:</strong> Collection Target ${escapeHtml(s.collectionTargetPct)} | Current Recycling ${escapeHtml(s.recyclingRatePct)} (${escapeHtml(String(s.registeredPros))} PROs)</li>
    `).join('');

    const payloadAttr = escapeHtml(JSON.stringify(data));

    const content = `
      <div class="atlas-dffe-indicators-root">
        <div class="atlas-dffe-doc-card">
          <div class="atlas-dffe-doc-badges">
            <span class="atlas-dffe-series-tag">Climate Change Act 22 of 2024</span>
            <span class="atlas-dffe-year-tag">SAAQIS &amp; SAWIC Telemetry</span>
            <span class="atlas-dffe-gov-tag">PHASE 3 SYSTEM CONNECTOR</span>
          </div>
          <h4 class="atlas-dffe-doc-title">National Environmental Systems &amp; Carbon Budget Telemetry</h4>
          <p class="atlas-dffe-doc-summary">
            <strong>2030 National NDC Target Band:</strong> ${escapeHtml(cc.ndc2030Band || '350–420 Mt CO2-eq')} &bull;
            <strong>Facility Carbon Budget Model:</strong> ${escapeHtml(String(cb.baselineEmissionsMt || 2.5))} Mt &rarr; ${escapeHtml(String(cb.allocated2030CapMt || 1.95))} Mt (${escapeHtml(cb.compoundAnnualReductionPct || '4.85%/yr')})
          </p>

          <div style="margin: 10px 0;">
            <div style="font-size:0.76rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">SAAQIS Priority Area Ambient Air Quality Benchmarks</div>
            ${airRows}
          </div>

          <div style="margin: 10px 0;">
            <div style="font-size:0.76rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">SAWIC Extended Producer Responsibility (EPR) Sector Targets</div>
            <ul class="atlas-dffe-findings-list">${eprRows}</ul>
          </div>

          <div class="atlas-dffe-doc-actions">
            <a href="https://saaqis.environment.gov.za" target="_blank" rel="noopener noreferrer" class="atlas-dffe-action-btn primary">
              <span>SAAQIS Portal</span>
              ${WIDGET_ICONS.externalLink}
            </a>
            <a href="https://sawic.environment.gov.za" target="_blank" rel="noopener noreferrer" class="atlas-dffe-action-btn">
              <span>SAWIC Portal</span>
              ${WIDGET_ICONS.externalLink}
            </a>
            <button type="button" class="atlas-dffe-action-btn js-indicators-open-canvas" data-ind="${payloadAttr}">
              <span>Open Systems Brief in Canvas</span>
            </button>
          </div>
        </div>
      </div>
    `;

    return createWidgetShell(
      'dffe_indicators',
      WIDGET_ICONS.dffe,
      'DFFE National Systems Telemetry (Climate · SAAQIS · SAWIC · EPWP)',
      content,
      '<span class="atlas-widget-count-badge">LIVE BENCHMARKS</span>'
    );
  },

  mount(container) {
    if (!container) return;
    container.querySelectorAll('.js-indicators-open-canvas').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          const d = JSON.parse(btn.getAttribute('data-ind') || '{}');
          const cc = d.climateChangeAct || {};
          const cb = cc.carbonBudgetModel || {};
          const md = [
            `# DFFE National Environmental Systems & Climate Compliance Brief`,
            ``,
            `## 1. Climate Change Act (Act 22 of 2024) & Carbon Budget Trajectory`,
            `- **National 2030 NDC Target Band:** ${cc.ndc2030Band}`,
            `- **Baseline Facility Emissions:** ${cb.baselineEmissionsMt} Mt CO2-eq`,
            `- **Allocated 2030 Carbon Cap:** ${cb.allocated2030CapMt} Mt CO2-eq (${cb.compoundAnnualReductionPct})`,
            `- **5-Year Cumulative Carbon Budget:** ${cb.fiveYearBudgetTotalMt} Mt CO2-eq`,
            ``,
            `## 2. SAAQIS Priority Area Air Quality Status`,
            ...((d.saaqisAirQuality?.priorityAreas) || []).map(p => `- **${p.area}:** PM2.5 = ${p.pm25DailyAvgUgM3} µg/m³ (NAAQS Limit: ${p.naaqsDailyLimitUgM3} µg/m³) — ${p.status}`),
            ``,
            `## 3. SAWIC Extended Producer Responsibility (EPR) Targets`,
            ...((d.sawicWasteCircular?.eprSectors) || []).map(s => `- **${s.sector}:** Collection Target ${s.collectionTargetPct}, Current Recycling ${s.recyclingRatePct}`)
          ].join('\n');
          openReportInCanvas('DFFE National Environmental Systems Brief', md);
        } catch (e) {
          console.warn('[DFFE Indicators Widget] Canvas open error:', e);
        }
      });
    });
  }
};

export const dffeAgentStudioWidget = {
  type: 'dffe_agent_studio',

  render(data) {
    if (!data) return '';
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const agents = data.agents || [];
    const phases = data.phases || [];

    const createdNoticeHtml = data.createdAgent
      ? `<div style="padding:10px 12px; margin-bottom:10px; border-radius:6px; background:rgba(0,102,51,0.1); border:1px solid rgba(0,102,51,0.3); font-size:0.8rem;">
          <strong>New Directorate Agent Provisioned:</strong> ${escapeHtml(data.createdAgent.name)} (${escapeHtml(data.createdAgent.directorate)}) &bull; Sensitivity: <code>${escapeHtml(data.createdAgent.sensitivity.toUpperCase())}</code>
        </div>`
      : data.groundedDocument
      ? `<div style="padding:10px 12px; margin-bottom:10px; border-radius:6px; background:rgba(0,102,51,0.1); border:1px solid rgba(0,102,51,0.3); font-size:0.8rem;">
          <strong>Custom Source Grounded into DFFE RAG Corpus:</strong> ${escapeHtml(data.groundedDocument.title)} (<code>${escapeHtml(data.groundedDocument.url)}</code>)
        </div>`
      : '';

    const agentsHtml = agents.map(ag => `
      <div style="padding:10px 12px; border-radius:6px; background:var(--bg-app, #fff); border:1px solid var(--border-subtle, #dce6df); margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
          <strong style="font-size:0.86rem;">${escapeHtml(ag.name)}</strong>
          <div style="display:flex; gap:6px;">
            <span class="atlas-dffe-series-tag">${escapeHtml((ag.sensitivity || 'public').toUpperCase())}</span>
            <span class="atlas-dffe-year-tag">${escapeHtml((ag.channels || []).join(' · '))}</span>
          </div>
        </div>
        <div style="font-size:0.74rem; color:var(--text-muted); margin:2px 0 4px;">${escapeHtml(ag.directorate)}</div>
        <div style="font-size:0.78rem; color:var(--text-secondary);">${escapeHtml(ag.description)}</div>
        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:4px; font-family:var(--font-mono, monospace);">Grounded URLs: ${escapeHtml((ag.groundingUrls || []).join(', '))}</div>
      </div>
    `).join('');

    const phasesHtml = phases.map(p => `
      <div style="padding:8px 10px; border-radius:5px; background:var(--bg-app, #fff); border-left:3px solid var(--accent-primary, #006633); margin-bottom:6px; font-size:0.78rem;">
        <strong>${escapeHtml(p.name)}</strong> &bull; <code>${escapeHtml(p.authContext)}</code>
        <div style="color:var(--text-secondary); margin-top:2px;">${escapeHtml(p.description)}</div>
      </div>
    `).join('');

    const content = `
      <div class="atlas-dffe-studio-root">
        ${createdNoticeHtml}
        <div class="atlas-dffe-doc-card">
          <h4 class="atlas-dffe-doc-title">Active DFFE Directorate Agents (${escapeHtml(String(agents.length))})</h4>
          <p class="atlas-dffe-doc-summary">Each Directorate Agent is scoped to verified DFFE series, official URLs, and Information Management (FM/IM) content sensitivity guardrails.</p>
          ${agentsHtml}

          <div style="margin-top:12px;">
            <div style="font-size:0.76rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">Siviwe Mpondo's 3-Phase Agentic Deployment &amp; FM/IM Sensitivity Architecture</div>
            ${phasesHtml}
          </div>

          <div class="atlas-dffe-doc-actions" style="margin-top:10px;">
            <a href="/dffe" class="atlas-dffe-action-btn primary">
              <span>Open Full Directorate Agent Studio &amp; Multi-Channel Simulator &rarr;</span>
            </a>
          </div>
        </div>
      </div>
    `;

    return createWidgetShell(
      'dffe_agent_studio',
      WIDGET_ICONS.dffe,
      'DFFE Directorate Agent Studio & 3-Phase FM/IM Governance',
      content,
      `<span class="atlas-widget-count-badge">${escapeHtml(String(agents.length))} AGENTS</span>`
    );
  }
};
