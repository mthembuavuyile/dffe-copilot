/**
 * Atlas — Scientific Intelligence Platform by Vylex Technologies
 * https://vylex.co.za
 * Technical Reasoning · Multi-Model Deliberation · Action Execution Layer
 */

import { state } from './state/store.js';
import { dom } from './ui/dom.js';
import { configureMarked } from './markdown/parser.js';
import {
  applyTheme,
  initInvestigationModes,
  renderModelOptions,
  syncModelDisplay,
  checkBackendHealth,
  updateDynamicGreeting,
  selectMode
} from './ui/theme.js';
import {
  getActiveSession,
  saveSessions,
  updateSessionMetrics,
  updateContextEstimator,
  createNewSession,
  loadSession,
  renderHistoryTree,
  fetchSessionTitle,
  formatFallbackTitle,
  setRenderSessionMessagesCallback
} from './ui/session-manager.js';
import {
  renderSessionMessages,
  setRegenerateCallback
} from './ui/message-renderer.js';
import { initCanvas } from './ui/canvas.js';
import {
  initModals,
  loadSavedSettings,
  autoResizeTextarea,
  openUnifiedSettings,
  toggleShortcutsModal,
  initComposerResizer,
  resetComposerHeight,
  shouldSubmitOnEnter
} from './ui/modals.js';
import { initVoiceDictation } from './audio/voice.js';
import { initSpeechPill, stopSpeakingResponse } from './audio/speech-pill.js';
import {
  executeChatTurn,
  regenerateLastResponse,
  initChatService
} from './services/chat-service.js';

// Connect circular UI callbacks
setRenderSessionMessagesCallback(renderSessionMessages);
setRegenerateCallback(regenerateLastResponse);

const availableSlashCommands = [
  { cmd: '/dffe', desc: 'Search verified DFFE environmental reports & RAG corpus', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>' },
  { cmd: '/soer', desc: 'State of the Environment Report (SoER) findings & indicators', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' },
  { cmd: '/eia', desc: 'NEMA Section 24 EIA & National Screening Tool pathway assessment', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>' },
  { cmd: '/climate', desc: 'Climate Change Act 22 of 2024 Carbon Budgets & Sector Emission Targets', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>' },
  { cmd: '/air', desc: 'SAAQIS Priority Area Ambient Air Quality (PM2.5, PM10, SO2) telemetry', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>' },
  { cmd: '/waste', desc: 'SAWIC & NEMWA Extended Producer Responsibility (EPR) targets', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>' },
  { cmd: '/programmes', desc: 'DFFE EPWP programmes (Working for Water, Fire, Wetlands, Coast)', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
  { cmd: '/nema', desc: 'NEMA legislation, Listing Notices 1–3 & Green Scorpions compliance', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>' },
  { cmd: '/agent', desc: 'DFFE Directorate Agent Studio & 3-Phase Deployment Roadmap', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="6" r="2"/><line x1="7" y1="7" x2="10" y2="10"/><line x1="17" y1="7" x2="14" y2="10"/></svg>' },
  { cmd: '/ground', desc: 'Ground a custom official URL or policy excerpt into DFFE RAG', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' },
  { cmd: '/sensitivity', desc: 'Audit Information Management (FM/IM) 3-Phase Content Sensitivity Gate', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
  { cmd: '/web', desc: 'Search the live web for external environmental intelligence', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>' },
  { cmd: '/weather', desc: 'Live regional meteorological & climate telemetry', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>' },
  { cmd: '/places', desc: 'Search reserves, catchments, stations & geographic landmarks', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>' },
  { cmd: '/math', desc: 'Quantitative environmental & mathematical modelling', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>' },
  { cmd: '/unit', desc: 'Convert environmental & physical measurement units', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>' },
  { cmd: '/ocr', desc: 'Extract text from scanned permits or environmental reports', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg>' },
  { cmd: '/qr', desc: 'Generate QR code for official DFFE publications or links', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01"></path></svg>' },
  { cmd: '/clear', desc: 'Clear conversation history', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>' },
  { cmd: '/exit', desc: 'Start a fresh session', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>' },
  { cmd: '/settings', desc: 'Open unified settings', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>' },
  { cmd: '/shortcuts', desc: 'Show keyboard shortcuts', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="6" y1="8" x2="6.01" y2="8"></line><line x1="10" y1="8" x2="10.01" y2="8"></line><line x1="14" y1="8" x2="14.01" y2="8"></line><line x1="18" y1="8" x2="18.01" y2="8"></line><line x1="6" y1="12" x2="6.01" y2="12"></line><line x1="18" y1="12" x2="18.01" y2="12"></line><line x1="7" y1="16" x2="17" y2="16"></line></svg>' }
];

let slashSelectedIndex = 0;

function updateSlashCommandSelection(items) {
  items.forEach((item, index) => {
    if (index === slashSelectedIndex) {
      item.classList.add('selected');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('selected');
    }
  });
}

function handleSlashCommandInput() {
  if (!dom.messageInput) return;
  const val = dom.messageInput.value;
  const popup = document.getElementById('slashCommandsPopup');
  if (!popup) return;

  if (val.startsWith('/')) {
    const query = val.toLowerCase();
    const filtered = availableSlashCommands.filter(c => c.cmd.startsWith(query));

    if (filtered.length > 0) {
      popup.innerHTML = '';
      filtered.forEach((cmd, idx) => {
        const item = document.createElement('div');
        item.className = 'slash-command-item' + (idx === 0 ? ' selected' : '');
        item.innerHTML = `
          <div class="slash-command-icon">${cmd.icon}</div>
          <div class="slash-command-info">
            <span class="slash-command-name">${cmd.cmd}</span>
            <span class="slash-command-desc">${cmd.desc}</span>
          </div>
        `;
        item.addEventListener('click', () => {
          dom.messageInput.value = cmd.cmd + ' ';
          dom.messageInput.focus();
          popup.style.display = 'none';
        });
        item.addEventListener('mouseenter', () => {
          slashSelectedIndex = idx;
          updateSlashCommandSelection(popup.querySelectorAll('.slash-command-item'));
        });
        popup.appendChild(item);
      });
      slashSelectedIndex = 0;
      popup.style.display = 'flex';
    } else {
      popup.style.display = 'none';
    }
  } else {
    popup.style.display = 'none';
  }
}

async function handleChatSubmit(e) {
  if (e) e.preventDefault();
  if (!dom.messageInput) return;
  const prompt = dom.messageInput.value.trim();
  if (!prompt || state.isGenerating) return;

  stopSpeakingResponse();

  const cleanPrompt = prompt.toLowerCase().trim();
  if (cleanPrompt === '/retry' || /^(?:retry|try again|redo|retry search|retry this)$/i.test(cleanPrompt)) {
    dom.messageInput.value = '';
    autoResizeTextarea();
    regenerateLastResponse();
    return;
  }

  if (cleanPrompt === '/settings') {
    dom.messageInput.value = '';
    autoResizeTextarea();
    openUnifiedSettings();
    return;
  }

  if (cleanPrompt === '/shortcuts') {
    dom.messageInput.value = '';
    autoResizeTextarea();
    toggleShortcutsModal(true);
    return;
  }

  if (cleanPrompt === '/clear') {
    dom.messageInput.value = '';
    autoResizeTextarea();
    const session = getActiveSession();
    if (session && confirm('Clear all messages in this investigation?')) {
      stopSpeakingResponse();
      session.messages = [];
      saveSessions();
      renderHistoryTree();
      loadSession(session.id);
    }
    return;
  }

  if (cleanPrompt === '/exit') {
    dom.messageInput.value = '';
    autoResizeTextarea();
    createNewSession();
    return;
  }

  let session = getActiveSession();
  if (!session) {
    createNewSession();
    session = getActiveSession();
  }

  const attachedFiles = state.projectFiles && state.projectFiles.length ? [...state.projectFiles] : [];
  session.messages.push({
    role: 'user',
    content: prompt,
    attachments: attachedFiles
  });
  session.updatedAt = new Date().toISOString();
  state.lastUserPrompt = prompt;

  if (session.messages.filter(m => m.role === 'user').length === 1) {
    session.title = formatFallbackTitle(prompt);
    // Note: AI title refinement is deferred until stream completion in chat-service.js
    // to avoid concurrent request collisions on OpenRouter (concurrency limit = 1 on free tier).
  }

  saveSessions();
  renderHistoryTree();
  renderSessionMessages(session);
  updateSessionMetrics();

  dom.messageInput.value = '';
  resetComposerHeight();
  autoResizeTextarea();
  updateContextEstimator();

  executeChatTurn(session);
}

function initComposerListeners() {
  initComposerResizer();
  dom.chatForm?.addEventListener('submit', handleChatSubmit);
  dom.newChatBtn?.addEventListener('click', () => createNewSession());

  dom.historySearchInput?.addEventListener('input', (e) => {
    renderHistoryTree(e.target.value.trim());
  });

  dom.messageInput?.addEventListener('input', () => {
    autoResizeTextarea();
    handleSlashCommandInput();
    updateContextEstimator();
  });

  dom.messageInput?.addEventListener('keydown', (e) => {
    const popup = document.getElementById('slashCommandsPopup');
    const isPopupVisible = popup && popup.style.display === 'flex';

    if (isPopupVisible) {
      const items = popup.querySelectorAll('.slash-command-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        slashSelectedIndex = (slashSelectedIndex + 1) % items.length;
        updateSlashCommandSelection(items);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        slashSelectedIndex = (slashSelectedIndex - 1 + items.length) % items.length;
        updateSlashCommandSelection(items);
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[slashSelectedIndex]) {
          items[slashSelectedIndex].click();
        }
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        popup.style.display = 'none';
        return;
      }
    }

    if (shouldSubmitOnEnter(e)) {
      e.preventDefault();
      if (!state.isGenerating && dom.messageInput.value.trim().length > 0) {
        dom.chatForm?.dispatchEvent(new Event('submit'));
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      createNewSession();
    }
  });

  window.atlasQueryMovie = (title) => {
    if (!title || !dom.messageInput) return;
    dom.messageInput.value = `/movie ${title}`;
    autoResizeTextarea();
    if (dom.chatForm) {
      dom.chatForm.dispatchEvent(new Event('submit'));
    }
  };

  // Wire DFFE Environmental Knowledge Filter Bar, 3-Phase FM/IM Switcher & Directorate Agent Studio
  const dffeSeriesEl = document.getElementById('dffeFilterSeries');
  const dffeYearEl = document.getElementById('dffeFilterYear');
  const dffeAudienceEl = document.getElementById('dffeFilterAudience');
  const dffePhaseEl = document.getElementById('dffeFilterPhase');
  const dffeAgentEl = document.getElementById('dffeFilterAgent');
  const dffeBrowseBtn = document.getElementById('dffeBrowseCorpusBtn');
  const dffeRunEiaBtn = document.getElementById('dffeRunEiaBtn');
  const dffeRunStudioBtn = document.getElementById('dffeRunStudioBtn');

  if (dffeSeriesEl && state.dffeFilters?.series) dffeSeriesEl.value = state.dffeFilters.series;
  if (dffeYearEl && state.dffeFilters?.year) dffeYearEl.value = state.dffeFilters.year;
  if (dffeAudienceEl && state.dffeFilters?.audience) dffeAudienceEl.value = state.dffeFilters.audience;
  if (dffePhaseEl && state.dffeFilters?.accessPhase) dffePhaseEl.value = state.dffeFilters.accessPhase;
  if (dffeAgentEl && state.dffeFilters?.agentId) dffeAgentEl.value = state.dffeFilters.agentId;

  dffeSeriesEl?.addEventListener('change', (e) => {
    state.dffeFilters.series = e.target.value;
    localStorage.setItem('atlas_dffe_series', e.target.value);
  });

  dffeYearEl?.addEventListener('change', (e) => {
    state.dffeFilters.year = e.target.value;
    localStorage.setItem('atlas_dffe_year', e.target.value);
  });

  dffeAudienceEl?.addEventListener('change', (e) => {
    state.dffeFilters.audience = e.target.value;
    localStorage.setItem('atlas_dffe_audience', e.target.value);
  });

  dffePhaseEl?.addEventListener('change', (e) => {
    state.dffeFilters.accessPhase = e.target.value;
    localStorage.setItem('atlas_dffe_phase', e.target.value);
  });

  dffeAgentEl?.addEventListener('change', (e) => {
    state.dffeFilters.agentId = e.target.value;
    localStorage.setItem('atlas_dffe_agent', e.target.value);
    const agentSeriesMap = {
      'dffe-general-agent': 'all',
      'dffe-eia-compliance-agent': 'legislation',
      'dffe-climate-air-agent': 'climate',
      'dffe-epwp-fisheries-agent': 'programmes',
      'dffe-waste-circular-agent': 'waste'
    };
    if (agentSeriesMap[e.target.value] && dffeSeriesEl) {
      dffeSeriesEl.value = agentSeriesMap[e.target.value];
      state.dffeFilters.series = agentSeriesMap[e.target.value];
      localStorage.setItem('atlas_dffe_series', state.dffeFilters.series);
    }
  });

  dffeBrowseBtn?.addEventListener('click', () => {
    if (!dom.messageInput) return;
    const seriesVal = state.dffeFilters?.series || 'all';
    const cmdMap = {
      soer: '/soer',
      programmes: '/programmes',
      legislation: '/nema',
      internal_sop: '/sop'
    };
    const slashCmd = cmdMap[seriesVal] || '/dffe';
    dom.messageInput.value = slashCmd;
    autoResizeTextarea();
    dom.chatForm?.dispatchEvent(new Event('submit'));
  });

  dffeRunEiaBtn?.addEventListener('click', () => {
    if (!dom.messageInput) return;
    dom.messageInput.value = '/eia 75 MW Solar PV & Grid Connection in a Renewable Energy Development Zone (REDZ)';
    autoResizeTextarea();
    dom.chatForm?.dispatchEvent(new Event('submit'));
  });

  dffeRunStudioBtn?.addEventListener('click', () => {
    if (!dom.messageInput) return;
    dom.messageInput.value = '/agent';
    autoResizeTextarea();
    dom.chatForm?.dispatchEvent(new Event('submit'));
  });
}

function init() {
  configureMarked();
  applyTheme(state.theme);

  // Wire theme selector buttons
  dom.themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme-val');
      if (theme) applyTheme(theme);
    });
  });

  renderHistoryTree();
  initInvestigationModes();
  renderModelOptions();
  syncModelDisplay(state.currentModel);
  loadSavedSettings();
  updateDynamicGreeting();

  initCanvas();
  initModals();
  initComposerListeners();
  initVoiceDictation();
  initSpeechPill();
  initChatService();

  updateContextEstimator();
  checkBackendHealth();

  if (state.sessions.length > 0) {
    loadSession(state.sessions[0].id);
  } else {
    createNewSession();
  }

  window.atlasOpenSettings = (tab = 'general-settings') => {
    openUnifiedSettings(tab);
  };

  handleIncomingQueryParameters();
}

function handleIncomingQueryParameters() {
  try {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || params.get('prompt');
    const mode = params.get('mode');
    const autoSend = params.get('send') === '1' || params.get('send') === 'true' || params.get('demo') === '1';
    const apiKeyParam = params.get('key') || params.get('apiKey');

    if (apiKeyParam && typeof apiKeyParam === 'string' && apiKeyParam.trim().startsWith('sk-or-')) {
      state.apiKey = apiKeyParam.trim();
      localStorage.setItem('atlas_openrouter_api_key', state.apiKey);
      if (dom.customApiKeyInput) dom.customApiKeyInput.value = state.apiKey;
    }

    if (mode) {
      selectMode(mode);
    }

    if (query && dom.messageInput) {
      const activeSession = getActiveSession();
      if (activeSession && activeSession.messages && activeSession.messages.length > 0) {
        createNewSession();
      }

      dom.messageInput.value = query;
      autoResizeTextarea();
      updateContextEstimator();
      dom.messageInput.focus();

      // Clean the URL without reloading to keep browser history clean
      const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);

      if (autoSend && dom.chatForm) {
        setTimeout(() => {
          dom.chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
        }, 200);
      }
    }
  } catch (err) {
    console.warn('[Atlas] Failed parsing query parameters:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
