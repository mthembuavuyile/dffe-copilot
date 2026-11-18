/**
 * constants.js
 * Application constants, investigation mode definitions, vector icon library,
 * persona presets, and curated DFFE Copilot models.
 */

export const API_BASE = (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http'))
  ? window.location.origin
  : 'http://localhost:3000';

export const INVESTIGATION_MODES = {
  auto: {
    id: 'auto',
    name: 'Auto',
    desc: 'Adapts the response to your environmental, policy, or technical question with source citations',
    actionHint: 'what environmental or departmental question can I help with?',
    suggestions: [
      { label: 'DFFE Programmes & SoER Findings', prompt: 'What environmental programmes is DFFE currently running, and what are the key findings from the latest State of the Environment reports?' },
      { label: 'NEMA EIA & Screening Tool', prompt: 'Explain NEMA Section 24 EIA Listing Notices 1, 2 and 3, the mandatory DFFE National Screening Tool, and REDZ fast-track timeframes.' },
      { label: 'Climate Change Act & Carbon Budgets', prompt: 'Synthesize the Climate Change Act (Act 22 of 2024) Sector Emission Targets (SETs), mandatory company Carbon Budgets, and municipal adaptation duties.' }
    ]
  },
  research: {
    id: 'research',
    name: 'Research',
    desc: 'State of the Environment synthesis, evidence evaluation, biodiversity & climate research maps',
    actionHint: 'what environmental report or scientific evidence shall we explore?',
    suggestions: [
      { label: 'State of the Environment Synthesis', prompt: 'Synthesize the latest South Africa State of the Environment Report (SoER) findings across biodiversity (30x30), inland water, air quality (SAAQIS), and waste (SAWIC).' },
      { label: 'Biodiversity White Paper & NEMBA', prompt: 'Synthesize the four strategic pillars of DFFE\'s White Paper on Conservation and Sustainable Use of South Africa\'s Biodiversity and the National Biodiversity Economy Strategy.' },
      { label: 'Oceans, Coasts & FRAP Stock Outlook', prompt: 'Evaluate DFFE\'s Marine Protected Areas (MPAs), OCIMS satellite monitoring, and Small-Scale Fisheries co-operative allocations under the Marine Living Resources Act.' }
    ]
  },
  solve: {
    id: 'solve',
    name: 'Solve',
    desc: 'Quantitative environmental modelling, carbon budget calculations, and mathematical derivations',
    actionHint: 'what environmental calculation or derivation shall we solve?',
    suggestions: [
      { label: 'Catchment Runoff Recovery Model', prompt: 'Model the annual surface water runoff recovery (in million cubic metres) achieved by clearing 250,000 hectares of high-density invasive alien plants under Working for Water.' },
      { label: 'Sector Carbon Budget Trajectory', prompt: 'Calculate the linear and compound annual emissions reduction rate required for an industrial facility to align with South Africa\'s 350–420 Mt CO2-eq 2030 NDC target band.' },
      { label: 'Atmospheric Dispersion Plume', prompt: 'Derive and calculate ground-level PM2.5 concentration downwind of an industrial stack using the Gaussian plume dispersion equation.' }
    ]
  },
  build: {
    id: 'build',
    name: 'Build',
    desc: 'DFFE IT Business Solutions architecture, code generation, API integration, and debugging',
    actionHint: 'what DFFE digital service or system shall we build?',
    suggestions: [
      { label: 'DFFE RAG Ingestion Pipeline', prompt: 'Write a production-ready Node.js / Python PDF chunking and pgvector ingestion pipeline for indexing 50-page DFFE State of the Environment PDF reports with page citations.' },
      { label: 'SAAQIS Air Quality Dashboard', prompt: 'Build an interactive HTML/CSS/JS dashboard for monitoring PM2.5, PM10, and SO2 across the Vaal Triangle, Highveld, and Waterberg-Bojanala Priority Areas.' },
      { label: 'NEMA EIA Timeframe Calculator', prompt: 'Build an interactive web calculator for tracking statutory NEMA Basic Assessment (197-day), S&EIR (300-day), and REDZ (57-day) application milestones.' }
    ]
  },
  engineer: {
    id: 'engineer',
    name: 'Engineer',
    desc: 'Systems integration, POPIA governance constraints, scalability analysis, and cost trade-offs',
    actionHint: 'what departmental architecture or system constraint shall we analyze?',
    suggestions: [
      { label: 'DFFE In-House RAG vs Vendor Lock-In', prompt: 'Deconstruct the architecture, security governance, POPIA compliance, and 5-year total cost of ownership of an in-house DFFE RAG platform versus proprietary cloud licensing.' },
      { label: 'Public vs Internal Entra ID Separation', prompt: 'Design a dual-tier security architecture separating unauthenticated public DFFE report discovery from Microsoft Entra ID-authenticated internal directorate SharePoint search.' },
      { label: 'National Systems API Federation', prompt: 'Design a federated API gateway integrating SAAQIS, SAWIC, OCIMS, and the National Environmental Screening Tool with read-only governance guardrails.' }
    ]
  },
  experiment: {
    id: 'experiment',
    name: 'Experiment',
    desc: 'Environmental dataset analysis (CSV/PDF), SAAQIS/SAWIC telemetry, and statistical testing',
    actionHint: 'what environmental dataset or monitoring series shall we analyze?',
    suggestions: [
      { label: 'SAAQIS Winter PM2.5 Anomaly Test', prompt: 'Design a statistical hypothesis test and Python analysis pipeline to evaluate winter PM2.5 exceedances across Highveld monitoring stations.' },
      { label: 'SAWIC EPR Diversion Regression', prompt: 'Analyze Extended Producer Responsibility (EPR) waste diversion rates across paper, packaging, e-waste, and lighting sectors.' },
      { label: 'Wetland Rehabilitation Impact', prompt: 'Formulate a before-after-control-impact (BACI) statistical model for evaluating Working for Wetlands rehabilitation sites.' }
    ]
  },
  reason: {
    id: 'reason',
    name: 'Reason',
    desc: 'Statutory & policy decomposition, NEMA/EIA compliance logic, and assumption verification',
    actionHint: 'what legislative provision or policy trade-off shall we deconstruct?',
    suggestions: [
      { label: 'NEMA Section 28 Duty of Care', prompt: 'Deconstruct the legal elements, strict liability principles, and Environmental Management Inspector (Green Scorpions) enforcement powers under NEMA Section 28 and Section 24G.' },
      { label: 'Just Transition Policy Trade-Offs', prompt: 'Analyze the socio-economic and environmental trade-offs in phasing down coal-fired generation while protecting Mpumalanga livelihoods under the Climate Change Act.' },
      { label: 'Challenge My Policy Proposal', prompt: 'Challenge this proposal: "DFFE should deploy a single unsegmented AI chatbot connected to both internal SharePoint and the public website." Identify governance and POPIA risks.' }
    ]
  },
  discover: {
    id: 'discover',
    name: 'Discover',
    desc: 'Cross-sector environmental synthesis, anomaly detection, and policy hypothesis generation',
    actionHint: 'what cross-directorate environmental relationship shall we explore?',
    suggestions: [
      { label: 'Invasive Species & Wildfire Nexus', prompt: 'Explore the empirical relationship between invasive alien plant density (Working for Water) and wildfire intensity (Working on Fire) across Western Cape and KwaZulu-Natal catchments.' },
      { label: 'Circular Economy & Municipal Methane', prompt: 'Generate 3 testable hypotheses linking municipal organic waste diversion under NEMWA to landfill methane reductions under South Africa\'s NDC.' },
      { label: 'Estuary Health & Small-Scale Fisheries', prompt: 'Map the ecological links between inland river nutrient loading, estuary mouth dynamics, and coastal linefish recruitment.' }
    ]
  }
};

export const INVESTIGATION_STATUS_TERMS = {
  research: [
    'Searching verified DFFE publications...',
    'Evaluating State of the Environment indicators...',
    'Synthesizing departmental evidence & citations...',
    'Mapping environmental research landscape...',
    'Verifying source references...'
  ],
  solve: [
    'Deconstructing quantitative formulation...',
    'Deriving step-by-step environmental model...',
    'Verifying units & boundary conditions...',
    'Computing analytical solution...',
    'Checking consistency...'
  ],
  build: [
    'Analyzing DFFE IT architecture & dependencies...',
    'Constructing implementation logic...',
    'Evaluating POPIA & security guardrails...',
    'Optimizing system structure...',
    'Assembling code artifact...'
  ],
  engineer: [
    'Modeling system constraints & governance...',
    'Assessing failure modes & data boundaries...',
    'Benchmarking scalability & cost trade-offs...',
    'Verifying architectural robustness...',
    'Structuring system topology...'
  ],
  experiment: [
    'Formulating environmental test hypotheses...',
    'Inspecting dataset distributions...',
    'Evaluating statistical anomalies...',
    'Validating empirical outcomes...'
  ],
  reason: [
    'Deconstructing statutory & policy logic...',
    'Tracing NEMA / SEMA dependencies...',
    'Exposing implicit assumptions...',
    'Constructing compliance analysis...'
  ],
  discover: [
    'Mapping cross-directorate indicators...',
    'Synthesizing ecological relationships...',
    'Evaluating unexplained patterns...',
    'Formulating testable hypotheses...'
  ],
  default: [
    'Retrieving verified DFFE knowledge context...',
    'Formulating grounded reasoning trace...',
    'Cross-checking source citations...',
    'Evaluating governance boundaries...',
    'Structuring response...'
  ]
};

export const ICONS = {
  freeRouter: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>`,
  ox: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
  owl: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="10" r="3"></circle><circle cx="16" cy="10" r="3"></circle><path d="M12 13l-1 2h2l-1-2z"></path><path d="M4 4c0 4 2 8 8 8s8-4 8-8"></path></svg>`,
  sonoma: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>`,
  hunter: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>`,
  polaris: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"></path></svg>`,
  aurora: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>`,
  code: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
  canvas: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="15" y1="3" x2="15" y2="21"></line></svg>`,
  copy: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
  check: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6DBE45" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  retry: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`,
  alert: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  reasoning: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>`,
  speaker: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`,
  stop: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="1"></rect></svg>`,
  pin: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.76V6a3 3 0 0 0-6 0v4.76a2 2 0 0 1-1.11 1.8l-1.78.88A2 2 0 0 0 5 15.24Z"></path></svg>`,
  edit: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
  regenerate: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`
};

export function getModelIcon(modelId) {
  if (!modelId) return ICONS.freeRouter;
  if (modelId === 'openrouter/free') return ICONS.freeRouter;
  if (modelId.includes('ox')) return ICONS.ox;
  if (modelId.includes('nemotron')) return ICONS.polaris;
  if (modelId.includes('laguna') || modelId.includes('poolside')) return ICONS.code;
  if (modelId.includes('north') || modelId.includes('cohere')) return ICONS.hunter;
  if (modelId.includes('glm') || modelId.includes('z-ai')) return ICONS.owl;
  if (modelId.includes('gemma')) return ICONS.aurora;
  return ICONS.freeRouter;
}

export const FREE_MODELS = [
  {
    id: 'openrouter/free',
    name: 'DFFE Copilot Auto',
    badge: 'AUTO',
    isFree: true,
    context: 'Dynamic context',
    desc: 'Smart auto-router that selects the optimal reasoning model for DFFE environmental queries, policy analysis, and technical tasks.'
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'DFFE Reasoning Core',
    badge: '1M',
    isFree: true,
    context: '1,000,000 tokens',
    desc: 'High-speed frontier reasoning model for State of the Environment (SoER) synthesis, multi-step analysis, and code generation.'
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'DFFE Research Engine',
    badge: '1M',
    isFree: true,
    context: '1,000,000 tokens',
    desc: 'Frontier-scale MoE model optimized for environmental research, biodiversity synthesis, and complex systems planning.'
  },
  {
    id: 'poolside/laguna-s-2.1:free',
    name: 'DFFE Systems & Code Engine',
    badge: '262K',
    isFree: true,
    context: '262,144 tokens',
    desc: 'Specialized systems engineering model for DFFE IT Business Solutions, API integration, debugging, and architecture analysis.'
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'DFFE Data & Compute Engine',
    badge: '256K',
    isFree: true,
    context: '256,000 tokens',
    desc: 'Fast-inference engine for environmental dataset analysis (SAAQIS, SAWIC, OCIMS), CSV telemetry, and experimental workflows.'
  },
  {
    id: 'z-ai/glm-5.2:free',
    name: 'DFFE Policy & Compliance Engine',
    badge: '256K',
    isFree: true,
    context: '256,000 tokens',
    desc: 'Large-scale reasoning model for NEMA/EIA statutory analysis, Climate Change Act compliance, and multi-step verification.'
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'DFFE Core Intelligence',
    badge: '262K',
    isFree: true,
    context: '262,144 tokens',
    desc: 'Instruction-tuned core model with native tool calling, configurable thinking depth, and broad environmental and scientific knowledge.'
  }
];

export const PERSONA_PRESETS = {
  auto: 'You are DFFE Copilot, the adaptive environmental intelligence and technical assistant for the Department of Forestry, Fisheries and the Environment (Republic of South Africa). Match your depth, structure, tone, and method to the user request, citing official DFFE reports and https://www.dffe.gov.za sources whenever answering environmental or policy questions.',
  dffe: 'You are the DFFE Copilot Environmental Specialist for the Department of Forestry, Fisheries and the Environment (Republic of South Africa). Provide scientifically rigorous, source-cited answers grounded in published DFFE State of the Environment Reports (SoER/SAEO), EPWP Environmental Programmes (Working for Water, Working on Fire, Working for Wetlands, Working for the Coast, Working on Waste, Ten Million Trees), and statutory frameworks (NEMA Act 107 of 1998, Climate Change Act 22 of 2024, NEMBA, NEMWA, NEMAQA, NEMPAA, MLRA). Always include official document citations, publication years, and https://www.dffe.gov.za reference links, and explicitly state when a claim falls outside verified public DFFE records.',
  scientist: 'You are a rigorous DFFE environmental researcher. Apply the scientific method to every problem. Form hypotheses, gather evidence from State of the Environment reports, and always quantify your uncertainty.',
  mathematician: 'You are a quantitative environmental modeller and mathematician. Approach every problem with mathematical rigor. Provide formal definitions, state equations precisely, prove claims step by step, and verify results.',
  engineer: 'You are a principal systems engineer in DFFE IT Business Solutions. Focus on architecture, scalability, POPIA governance, reliability, and operational excellence. Always present trade-offs, identify failure modes, and consider cost.',
  builder: 'You are an elite full-stack software engineer in DFFE IT Business Solutions. Provide clean, modular, production-ready code with robust error handling, modern patterns, and clear architectural explanations.',
  reasoner: 'You are a senior environmental policy and statutory compliance analyst. Break down legislative and logical problems step by step with structured analysis and explicit chain-of-thought verification.',
  concise: 'You are an executive briefing writer for DFFE. Output direct, structured answers and ministerial summaries with minimal preamble or filler.'
};
