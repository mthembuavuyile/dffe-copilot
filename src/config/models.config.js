/**
 * DFFE Copilot — Curated Intelligence Models
 * Environmental research, policy synthesis, mathematical modelling, and systems engineering.
 */
const CURATED_MODELS = [
  {
    id: 'openrouter/free',
    name: 'DFFE Copilot Auto',
    badge: 'AUTO',
    description: 'Smart auto-router that selects the optimal reasoning model for DFFE environmental queries, policy analysis, and technical tasks.',
    isFree: true,
    context: 'Dynamic context',
    bestFor: ['research', 'solve', 'build', 'engineer', 'experiment', 'reason', 'discover']
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'DFFE Reasoning Core',
    badge: '1M',
    description: 'High-speed frontier reasoning model for State of the Environment (SoER) synthesis, multi-step analysis, and code generation.',
    isFree: true,
    context: '1,000,000 tokens',
    bestFor: ['reason', 'solve', 'build']
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'DFFE Research Engine',
    badge: '1M',
    description: 'Frontier-scale MoE model optimized for environmental research, biodiversity synthesis, and complex systems planning.',
    isFree: true,
    context: '1,000,000 tokens',
    bestFor: ['research', 'discover', 'engineer']
  },
  {
    id: 'poolside/laguna-s-2.1:free',
    name: 'DFFE Systems & Code Engine',
    badge: '262K',
    description: 'Specialized systems engineering model for DFFE IT Business Solutions, API integration, debugging, and architecture analysis.',
    isFree: true,
    context: '262,144 tokens',
    bestFor: ['build', 'experiment']
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'DFFE Data & Compute Engine',
    badge: '256K',
    description: 'Fast-inference engine for environmental dataset analysis (SAAQIS, SAWIC, OCIMS), CSV telemetry, and experimental workflows.',
    isFree: true,
    context: '256,000 tokens',
    bestFor: ['experiment', 'build', 'solve']
  },
  {
    id: 'z-ai/glm-5.2:free',
    name: 'DFFE Policy & Compliance Engine',
    badge: '256K',
    description: 'Large-scale reasoning model for NEMA/EIA statutory analysis, Climate Change Act compliance, and multi-step verification.',
    isFree: true,
    context: '256,000 tokens',
    bestFor: ['engineer', 'reason']
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'DFFE Core Intelligence',
    badge: '262K',
    description: 'Instruction-tuned core model with native tool calling, configurable thinking depth, and broad environmental and scientific knowledge.',
    isFree: true,
    context: '262,144 tokens',
    bestFor: ['research', 'solve', 'reason']
  }
];

module.exports = { CURATED_MODELS };
