/**
 * store.js
 * Central reactive application state object and initial session storage loader.
 */

import { FREE_MODELS, PERSONA_PRESETS } from '../config/constants.js';
import { normalizeSessionContinuations } from '../ui/continuation-helper.js';

export function loadInitialSessions() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  const savedInvestigations = localStorage.getItem('atlas_investigations') || localStorage.getItem('omni_sessions') || '[]';
  try {
    const rawParsed = JSON.parse(savedInvestigations);
    if (Array.isArray(rawParsed)) {
      const valid = rawParsed.filter(s => s && Array.isArray(s.messages) && s.messages.length > 0);
      let anyModified = false;
      valid.forEach(s => {
        if (normalizeSessionContinuations(s)) anyModified = true;
      });
      if (anyModified) {
        localStorage.setItem('atlas_investigations', JSON.stringify(valid));
      }
      return valid;
    }
  } catch (e) {
    return [];
  }
  return [];
}

const rawSavedTheme = (typeof window !== 'undefined' && window.localStorage?.getItem('omni_theme')) || 'dffe';
const normalizedInitialTheme = rawSavedTheme === 'vylex' ? 'dffe' : rawSavedTheme;

export const state = {
  theme: normalizedInitialTheme,
  currentModel: (typeof window !== 'undefined' && window.localStorage?.getItem('omni_model')) || 'openrouter/free',
  models: FREE_MODELS,
  apiKey: (typeof window !== 'undefined' && window.localStorage?.getItem('atlas_openrouter_api_key')) || '',
  activeMode: (typeof window !== 'undefined' && window.localStorage?.getItem('atlas_mode')) || 'auto',
  accountName: (typeof window !== 'undefined' && window.localStorage?.getItem('atlas_account_name')) || 'Your Name',
  systemPrompt: (typeof window !== 'undefined' && window.localStorage?.getItem('omni_sys_prompt')) || PERSONA_PRESETS.auto,
  activePreset: (typeof window !== 'undefined' && window.localStorage?.getItem('omni_preset')) || 'auto',
  temperature: parseFloat((typeof window !== 'undefined' && window.localStorage?.getItem('omni_temp')) || '0.7'),
  defaultVoiceName: (typeof window !== 'undefined' && window.localStorage?.getItem('atlas_default_voice')) || '',
  isDeepReasoning: (typeof window !== 'undefined' && window.localStorage?.getItem('omni_deep_reasoning')) === 'true',
  isWebSearch: (typeof window !== 'undefined' && window.localStorage?.getItem('omni_web_search')) === 'true',
  sessions: loadInitialSessions(),
  activeSessionId: null,
  isGenerating: false,
  abortController: null,
  activeArtifact: null,
  artifacts: [],
  activeArtifactIndex: 0,
  lastUserPrompt: '',
  isReadingResponse: false,
  activeSpeechButton: null,
  projectFiles: [],
  dffeFilters: {
    series: (typeof window !== 'undefined' && window.localStorage?.getItem('atlas_dffe_series')) || 'all',
    collection: (typeof window !== 'undefined' && window.localStorage?.getItem('atlas_dffe_collection')) || 'all',
    status: (typeof window !== 'undefined' && window.localStorage?.getItem('atlas_dffe_status')) || 'all',
    year: (typeof window !== 'undefined' && window.localStorage?.getItem('atlas_dffe_year')) || 'all',
    audience: (typeof window !== 'undefined' && window.localStorage?.getItem('atlas_dffe_audience')) || 'public'
  }
};
