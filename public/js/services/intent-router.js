/**
 * intent-router.js
 * Deterministic DFFE Operational Tool Intents & Slash Command Routing.
 * Routes DFFE RAG queries, NEMA Section 24 EIA screening, SAAQIS/SAWIC/Climate
 * indicators, Directorate Agent Studio commands, and environmental utilities.
 */

import { state } from '../state/store.js';
import { API_BASE } from '../config/constants.js';
import { parseMarkdownSafely, enhanceCodeBlocks, renderMathSafely } from '../markdown/parser.js';
import { saveSessions, updateSessionMetrics } from '../ui/session-manager.js';
import { scrollToBottom } from '../ui/message-renderer.js';
import { renderWidget, mountWidget } from '../widgets/widget-renderer.js';

export function detectLocalWidgetIntent(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Never hijack prompts in Build mode or when user is asking to draft/write/synthesize a document or code
  if (state.activeMode === 'build' || /\b(build|write|create|code|html|css|js|javascript|python|component|website|app|portfolio|page|synthesize|explain|briefing|policy)\b/i.test(lower)) {
    return null;
  }

  // If the prompt is a multi-sentence analytical query, let the main DFFE RAG + reasoning engine handle it
  if (trimmed.length > 100 && !/^(what'?s the weather|convert\s+\d+|what is the time)/i.test(trimmed)) {
    return null;
  }

  const stripTrailing = (value) => value.replace(/[?.!]+$/g, '').trim();
  const pickMatch = (patterns) => {
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match?.[1]) return stripTrailing(match[1]);
    }
    return '';
  };

  // Strict OCR trigger
  if (/^(?:open\s+)?(?:scan\s+)?ocr\b/i.test(trimmed) || /^(?:scan|extract|read)\s+text\s+from\s+(?:an?\s+)?(?:image|photo|camera|screenshot|picture)$/i.test(trimmed)) {
    return { tool: 'scan_ocr', args: {}, label: 'Opened OCR document scanner.' };
  }

  // QR Code Scan trigger
  if (/^(?:open\s+)?(?:scan|read|decode)\s+(?:a\s+)?qr(?:\s*code)?$/i.test(trimmed) || /^(?:qr\s*(?:scan|scanner|reader)|scan\s*qr)$/i.test(trimmed)) {
    return { tool: 'scan_qr', args: {}, label: 'Opened QR Code Scanner.' };
  }

  // QR Code Generation trigger
  const qrGenMatch = trimmed.match(/^(?:generate|make|create|build|encode)\s+(?:a\s+)?(?:qr|qr\s*code)\s+(?:for|of|with|saying|containing)?\s*(.+)$/i)
    || trimmed.match(/^(?:qr|qr\s*code)\s+(?:for|of|with)?\s*(.+)$/i);
  if (qrGenMatch && qrGenMatch[1] && !/\b(scanner|reader|camera)\b/i.test(qrGenMatch[1])) {
    const qrData = stripTrailing(qrGenMatch[1].replace(/^(?:the\s+)?(?:note|text|link|url|phrase|string|message)\s+/i, '').trim());
    if (qrData) {
      return { tool: 'generate_qr', args: { data: qrData }, label: `Generated QR code for "${qrData}".` };
    }
  }

  const currency = trimmed.match(/^\s*(?:convert\s+)?(\d+(?:\.\d+)?)\s*([a-z]{3})\s+(?:to|in|into)\s+([a-z]{3})\s*\??$/i);
  if (currency) {
    return {
      tool: 'convert_currency',
      args: { amount: parseFloat(currency[1]), from: currency[2].toUpperCase(), to: currency[3].toUpperCase() },
      label: 'Converted live currency rate.'
    };
  }

  const unit = trimmed.match(/^\s*(?:convert\s+)?(-?\d+(?:\.\d+)?)\s*([a-zA-Z°/ ]{1,22})\s+(?:to|in|into)\s+([a-zA-Z°/ ]{1,22})\s*\??$/i);
  if (unit && !/^[a-z]{3}$/i.test(unit[2].trim()) && !/^[a-z]{3}$/i.test(unit[3].trim())) {
    return {
      tool: 'convert_units',
      args: { value: parseFloat(unit[1]), from: unit[2].trim(), to: unit[3].trim() },
      label: 'Converted measurement units.'
    };
  }

  const definition = pickMatch([/^(?:define|meaning of|what does)\s+["']?([a-z][a-z-]*)["']?(?:\s+mean)?\??$/i]);
  if (definition) {
    return { tool: 'define_word', args: { word: definition }, label: 'Fetched dictionary definition.' };
  }

  const weather = pickMatch([/^(?:what'?s the\s+)?weather\s+(?:in|for|at)\s+(.+)\??$/i, /^(?:forecast|temperature)\s+(?:in|for|at)\s+(.+)\??$/i]);
  if (weather) {
    return { tool: 'get_weather', args: { city: weather }, label: 'Fetched live environmental weather telemetry.' };
  }

  const math = pickMatch([/^(?:derivative|integral|simplify|factor|solve|limit)\s+(?:of\s+)?(.+)$/i]);
  if (math && /[0-9x-z=+\-*/^()]/i.test(math) && trimmed.length < 50) {
    const opMatch = lower.match(/\b(derivative|integral|simplify|factor|solve|limit)\b/);
    const operation = opMatch ? opMatch[1] : 'simplify';
    return { tool: 'solve_math', args: { expression: math, operation }, label: 'Solved quantitative expression.' };
  }

  const time = pickMatch([/^(?:what'?s the\s+)?(?:time|date)\s+(?:in|for|at)\s+(.+)\??$/i]);
  if (time || /^(what'?s\s+)?(?:the\s+)?(?:current\s+)?time\??$/i.test(trimmed)) {
    return { tool: 'get_current_time', args: { timezone: time }, label: 'Resolved live time.' };
  }

  const place = pickMatch([/^(?:find|search for|show me)\s+(.+?)\s+(?:near|in)\s+(.+)$/i]);
  if (place && /\b(park|reserve|wetland|estuary|station|office|landmark|hospital|library|school|museum)\b/i.test(place)) {
    const match = trimmed.match(/^(?:find|search for|show me)\s+(.+?)\s+(?:near|in)\s+(.+)$/i);
    return { tool: 'search_places', args: { query: stripTrailing(match[1]), near: stripTrailing(match[2]) }, label: 'Searched geographic locations.' };
  }

  return null;
}

export function resolveSlashCommand(prompt) {
  if (!prompt || typeof prompt !== 'string') return null;
  const slashMatch = prompt.match(/^\/([a-z]+)(?:\s+(.*))?/i);
  if (!slashMatch) return null;

  const command = slashMatch[1].toLowerCase();
  const arg = slashMatch[2] || '';

  let toolToCall = null;
  let argsPayload = {};
  let isWebSearch = false;
  let isDffeRag = false;
  let dffeFilters = null;
  let overrideText = null;

  if (command === 'sources') {
    toolToCall = 'search_dffe_knowledge';
    argsPayload = {
      query: arg.trim() || 'What is the Chief Directorate: GITO, and what directorates or sub-directorates fall under it?',
      series: state.dffeFilters?.series || 'all',
      collection: state.dffeFilters?.collection || 'all',
      status: state.dffeFilters?.status || 'all',
      year: state.dffeFilters?.year || 'all',
      audience: state.dffeFilters?.audience || 'public'
    };
  } else if (
    command === 'dffe' ||
    command === 'soer' ||
    command === 'programmes' ||
    command === 'nema' ||
    command === 'eia' ||
    command === 'screening' ||
    command === 'sop' ||
    command === 'gito' ||
    command === 'organogram' ||
    command === 'dpsa' ||
    command === 'cybersecurity' ||
    command === 'climate' ||
    command === 'air' ||
    command === 'saaqis' ||
    command === 'waste' ||
    command === 'sawic' ||
    command === 'itbs' ||
    command === 'cms' ||
    command === 'pfma' ||
    command === 'efishing' ||
    command === 'permit' ||
    command === 'service'
  ) {
    const defaultSeriesMap = {
      dffe: state.dffeFilters?.series || 'all',
      soer: 'soer',
      programmes: 'programmes',
      nema: 'legislation',
      eia: 'legislation',
      screening: 'legislation',
      sop: 'internal_sop',
      gito: 'gito_ict',
      organogram: 'gito_ict',
      dpsa: 'gito_ict',
      cybersecurity: 'gito_ict',
      climate: 'climate',
      air: 'climate',
      saaqis: 'climate',
      waste: 'waste',
      sawic: 'waste',
      itbs: 'internal_sop',
      cms: 'internal_sop',
      pfma: 'internal_sop',
      efishing: 'forestry_fisheries',
      permit: 'forestry_fisheries',
      service: 'internal_sop'
    };
    const defaultCollectionMap = {
      gito: 'gito',
      organogram: 'ict_organogram',
      dpsa: 'ict_governance',
      cybersecurity: 'cybersecurity',
      itbs: 'digital_solutions',
      cms: 'cms'
    };
    const defaultQueryMap = {
      dffe: 'What environmental programmes is DFFE currently running, and what are the key findings from the latest State of the Environment reports?',
      soer: 'Summarize the latest South Africa State of the Environment Report (SoER) key findings across biodiversity, water, climate, land degradation, and waste.',
      programmes: 'Explain DFFE EPWP environmental programmes: Working for Water, Working on Fire, Working for Wetlands, Working for the Coast, Working on Waste, and Ten Million Trees.',
      nema: 'Explain NEMA Section 24 EIA regulations, Listing Notices 1, 2 and 3, the mandatory DFFE National Environmental Screening Tool, and Green Scorpions compliance.',
      eia: 'Explain the NEMA Section 24 EIA pathway, Listing Notices 1, 2 & 3, mandatory DFFE National Environmental Screening Tool protocols, and statutory decision timeframes.',
      screening: 'Explain the mandatory DFFE National Web-Based Environmental Screening Tool requirements under NEMA Section 24.',
      sop: 'Explain DFFE internal Corporate Management Services (CMS) and GITO operational procedures for ICT requests, HR leave, and PFMA procurement.',
      gito: 'What is the Chief Directorate: GITO, and what directorates or sub-directorates fall under it?',
      organogram: 'Compare the Revised ICT Organogram (Source A) and the DFFE Government ICT Proposed Operating Model (Source B) under GITO.',
      dpsa: 'Explain the DPSA Corporate Governance of ICT Policy Framework (CGICTPF Version 2, March 2022) and the 8 GITO design principles.',
      cybersecurity: 'How is Cybersecurity & Information Security structured in Source A versus Source B under GITO?',
      climate: 'Explain the Climate Change Act (Act 22 of 2024) Sector Emission Targets (SETs), mandatory company Carbon Budgets, and municipal adaptation duties.',
      air: 'Summarize the State of Air Report and National Priority Area Air Quality Management Plans (Highveld, Vaal Triangle, Waterberg-Bojanala) on SAAQIS.',
      saaqis: 'Summarize the State of Air Report and National Priority Area Air Quality Management Plans (Highveld, Vaal Triangle, Waterberg-Bojanala) on SAAQIS.',
      waste: 'Explain the National Waste Management Strategy (NWMS) and NEMWA Section 18 Extended Producer Responsibility (EPR) targets tracked on SAWIC.',
      sawic: 'Explain the National Waste Management Strategy (NWMS) and NEMWA Section 18 Extended Producer Responsibility (EPR) targets tracked on SAWIC.',
      itbs: 'How do I request IT equipment or VPN access in GITO / ITBS, and how are internal approvals routed?',
      cms: 'What are the DFFE Corporate Management Services (CMS) procedures for employee leave, new staff onboarding, and ICT equipment requests?',
      pfma: 'What are the DFFE Financial Management Services (FMS) PFMA Supply Chain Management procurement thresholds, SITA ICT alignment rules, and 30-day invoice requirements?',
      efishing: 'How do citizens and small-scale fishing co-operatives apply for permits on DFFE e-Fishing and under the Marine Living Resources Act (MLRA)?',
      permit: 'How do applicants apply for a National Forests Act Section 15 protected tree licence or NEMBA TOPS / Bioprospecting permit?',
      service: 'What are the DFFE internal procedures for GITO / ITBS equipment requests, CMS HR leave, and FMS PFMA procurement?'
    };

    isDffeRag = true;
    overrideText = arg.trim()
      ? (command === 'eia' ? `Evaluate the NEMA Section 24 EIA pathway, applicable Listing Notices (1, 2 or 3), DFFE National Screening Tool specialist protocols, and statutory decision timeframes for: ${arg.trim()}` : arg.trim())
      : defaultQueryMap[command];
    dffeFilters = {
      series: defaultSeriesMap[command] || 'all',
      collection: defaultCollectionMap[command] || state.dffeFilters?.collection || 'all'
    };
  } else if (command === 'web') {
    isWebSearch = true;
    overrideText = arg;
  } else if (command === 'define' || command === 'dict') {
    toolToCall = 'define_word';
    argsPayload = { word: arg || 'biodiversity' };
  } else if (command === 'weather') {
    toolToCall = 'get_weather';
    argsPayload = { city: arg || 'Pretoria' };
  } else if (command === 'currency' || command === 'convert') {
    const parts = arg.split(' ').map(p => p.trim()).filter(Boolean);
    toolToCall = 'convert_currency';
    const convertMatch = arg.match(/(\d+(?:\.\d+)?)\s*([a-z]{3})\s+(?:to|in|into)?\s*([a-z]{3})/i);
    argsPayload = convertMatch
      ? { amount: parseFloat(convertMatch[1]), from: convertMatch[2].toUpperCase(), to: convertMatch[3].toUpperCase() }
      : { amount: parseFloat(parts[0]) || 1, from: parts[1] || 'USD', to: (parts[2] || parts[3]) || 'ZAR' };
  } else if (command === 'math') {
    toolToCall = 'solve_math';
    argsPayload = { expression: arg || '2+2', operation: 'simplify' };
  } else if (command === 'image') {
    toolToCall = 'search_images';
    const numMatch = (arg || '').match(/^(\d+)\s+(.+)$/);
    if (numMatch) {
      argsPayload = {
        limit: Math.min(Math.max(parseInt(numMatch[1], 10) || 8, 1), 12),
        query: numMatch[2].trim()
      };
    } else {
      argsPayload = { query: arg || 'South Africa biodiversity conservation', limit: 8 };
    }
  } else if (command === 'qr' || command === 'generateqr') {
    toolToCall = 'generate_qr';
    argsPayload = { data: arg || 'https://www.dffe.gov.za' };
  } else if (command === 'scanqr' || command === 'qrscan') {
    toolToCall = 'scan_qr';
    argsPayload = {};
  } else if (command === 'ocr') {
    toolToCall = 'scan_ocr';
    argsPayload = {};
  } else if (command === 'time') {
    toolToCall = 'get_current_time';
    argsPayload = { timezone: arg || 'Africa/Johannesburg' };
  } else if (command === 'unit') {
    const unitMatch = arg.match(/(-?\d+(?:\.\d+)?)\s*([a-zA-Z°/ ]{1,22})\s+(?:to|in|into)\s+([a-zA-Z°/ ]{1,22})/i);
    toolToCall = 'convert_units';
    argsPayload = unitMatch
      ? { value: parseFloat(unitMatch[1]), from: unitMatch[2].trim(), to: unitMatch[3].trim() }
      : { value: 1, from: 'km', to: 'miles' };
  } else if (command === 'places' || command === 'place') {
    const nearMatch = arg.match(/(.+?)\s+(?:near|in)\s+(.+)$/i);
    toolToCall = 'search_places';
    argsPayload = nearMatch
      ? { query: nearMatch[1].trim(), near: nearMatch[2].trim() }
      : { query: arg || 'Environment House Pretoria' };
  } else {
    // Unrecognized slash command; do not hijack, let main reasoning engine handle
    return null;
  }

  return {
    command,
    toolToCall,
    argsPayload,
    isWebSearch,
    isDffeRag,
    dffeFilters,
    overrideText,
    label: `Opened DFFE Source Explorer for \`/${command}\`.`
  };
}

export async function runLocalWidget(toolToCall, argsPayload, statusText, context, options = {}) {
  const { session, bubble, widgetsContainer, statusAnimator, accumulatedWidgets } = context;
  const fallbackToAi = Boolean(options.fallbackToAi);

  if (statusAnimator) {
    statusAnimator.stop();
  }

  let res;
  try {
    res = await fetch(`${API_BASE}/api/widget/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: state.abortController ? state.abortController.signal : undefined,
      body: JSON.stringify({ tool: toolToCall, args: argsPayload })
    });
  } catch (fetchErr) {
    if (fetchErr?.name === 'AbortError' || !fallbackToAi) throw fetchErr;
    return false;
  }

  if (!res.ok) {
    let errorMsg = `Widget service failed with status ${res.status}`;
    try {
      const errData = await res.json();
      if (errData?.error) errorMsg = errData.error;
    } catch (_) {}
    if (fallbackToAi) {
      return false;
    }
    throw new Error(errorMsg);
  }
  const widgetResult = await res.json();

  if (!widgetResult || typeof widgetResult.type !== 'string') {
    if (fallbackToAi) {
      return false;
    }
    if (widgetResult?.error) {
      const formattedNotice = `<div class="atlas-widget-notice" style="padding: 10px 14px; margin: 6px 0; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-light); font-size: 13.5px; color: var(--text-muted);">${parseMarkdownSafely(widgetResult.error, false)}</div>`;
      bubble.innerHTML = formattedNotice;
      session.messages.push({
        role: 'assistant',
        content: widgetResult.error,
        widgets: []
      });
      session.updatedAt = new Date().toISOString();
      saveSessions();
      updateSessionMetrics();
      scrollToBottom(true);
      return true;
    }
    throw new Error('Widget service returned an invalid response.');
  }

  if (widgetResult.error && fallbackToAi) {
    return false;
  }

  accumulatedWidgets.push(widgetResult);

  const renderer = (typeof renderWidget === 'function' ? renderWidget : window.atlasRenderWidget);
  const mounter = (typeof mountWidget === 'function' ? mountWidget : window.atlasMountWidget);

  if (renderer) {
    try {
      const widgetHtml = renderer(widgetResult.type, widgetResult.data);
      if (widgetHtml && widgetsContainer) {
        const widgetBox = document.createElement('div');
        widgetBox.className = 'widget-mount-point';
        widgetBox.innerHTML = widgetHtml;
        widgetsContainer.appendChild(widgetBox);
        if (mounter) {
          try {
            mounter(widgetBox, widgetResult.type, widgetResult.data);
          } catch (mErr) {
            console.warn('[DFFE Widgets] Widget mount error:', mErr);
          }
        }
      }
    } catch (rErr) {
      console.warn('[DFFE Widgets] Widget render error:', rErr);
    }
  }

  bubble.innerHTML = parseMarkdownSafely(statusText, false);
  enhanceCodeBlocks(bubble);
  renderMathSafely(bubble);

  session.messages.push({
    role: 'assistant',
    content: statusText,
    widgets: accumulatedWidgets
  });
  session.updatedAt = new Date().toISOString();
  saveSessions();
  updateSessionMetrics();

  scrollToBottom(true);
  return true;
}

/**
 * Balanced Autonomous Need Classifier
 * Detects if a prompt genuinely requires real-time web grounding or deep reasoning.
 */
export function detectAutonomousNeed(text) {
  if (!text || typeof text !== 'string') return { needsWeb: false, needsReasoning: false, reason: null };
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (state.activeMode === 'build' || /\b(build|write|create|code|html|css|js|javascript|python|component|website|app|portfolio|page|function|class|regex|sql|docker|git|bug|fix)\b/i.test(lower)) {
    return { needsWeb: false, needsReasoning: false, reason: null };
  }

  if (
    /^(?:explain|what is|how does|define)\s+(?:photosynthesis|gravity|calculus|mitosis|relativity|tcp|http|dns|binary search|recursion|a black hole)\b/i.test(lower) ||
    /^(?:write|compose)\s+(?:a poem|a story|an essay|an email|a letter)\b/i.test(lower) ||
    /^(?:hi|hello|hey|who are you|what can you do|good morning)\b/i.test(lower)
  ) {
    return { needsWeb: false, needsReasoning: false, reason: null };
  }

  let needsWeb = false;
  let needsReasoning = false;
  let reason = null;

  if (/\b(search (?:the )?(?:web|internet|online)|look up (?:online|on the web)|google (?:it|this)|check (?:the )?(?:web|news|internet))\b/i.test(lower)) {
    needsWeb = true;
    reason = 'Explicit web search requested';
  }

  const deepReasoningSignals = /\b(prove that|formal proof|step-by-step proof|derive (?:the|an) equation|solve (?:this|the) (?:logic )?puzzle|game theory equilibrium|carbon budget trajectory|gaussian plume)\b/i.test(lower);
  if (deepReasoningSignals) {
    needsReasoning = true;
    reason = reason ? `${reason} & Quantitative Environmental Modelling` : 'Quantitative Environmental Modelling required';
  }

  return { needsWeb, needsReasoning, reason };
}
