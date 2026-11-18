/**
 * DFFE Environmental Knowledge & RAG Capability
 * ─────────────────────────────────────────────────────────────
 * Retrieves authoritative Department of Forestry, Fisheries and the
 * Environment (DFFE) reports, State of the Environment (SoER) findings,
 * EPWP environmental programmes, and NEMA/Climate Change legislation
 * with UNEP EnvironmentGPT-aligned filtering (Series, Year, Audience)
 * and Siviwe Mpondo's 3-Phase FM/IM Sensitivity Governance.
 */

const dffeRagService = require('../../services/dffe-rag.service');

const schema = {
  type: 'function',
  function: {
    name: 'search_dffe_knowledge',
    description: 'Search the verified Department of Forestry, Fisheries and the Environment (DFFE) knowledge base and RAG corpus for South African State of the Environment Reports (SoER), DFFE environmental programmes (Working for Water, Working on Fire, Working for Wetlands, Working for the Coast, Working on Waste, Ten Million Trees), environmental legislation (NEMA EIA, Climate Change Act 22 of 2024, NEMBA, NEMWA, NEMAQA), air quality (SAAQIS), waste (SAWIC), forestry/fisheries (FRAP, OCIMS), and internal directorate SOPs. Supports filtering by report series, year, audience, and 3-phase deployment sensitivity.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural-language environmental question or topic, e.g. "What environmental programmes is DFFE currently running, and what are the key findings from the latest State of the Environment reports?"'
        },
        series: {
          type: 'string',
          enum: ['all', 'soer', 'programmes', 'legislation', 'climate', 'forestry_fisheries', 'waste', 'internal_sop'],
          description: 'Optional DFFE report series filter: "all", "soer" (State of the Environment), "programmes" (EPWP), "legislation" (NEMA/EIA), "climate" (Climate Change & Air Quality), "forestry_fisheries" (Forestry, Fisheries & Oceans), "waste" (Chemicals, Waste & Circular Economy), or "internal_sop" (Internal Directorate SOPs).'
        },
        year: {
          type: 'string',
          description: 'Optional publication year filter, e.g. "all", "2026", "2025", "2024".'
        },
        audience: {
          type: 'string',
          enum: ['public', 'officials', 'researchers', 'compliance'],
          description: 'Target audience filter: "public" (General Public), "officials" (DFFE Officials & Directorates), "researchers" (Researchers & Policy Analysts), or "compliance" (Compliance & EIA Practitioners).'
        },
        accessPhase: {
          type: 'string',
          enum: ['phase1_internal', 'phase2_public', 'phase3_enterprise'],
          description: 'Deployment phase & FM/IM sensitivity context: "phase1_internal" (Internal Official / Teams), "phase2_public" (External Public Web & WhatsApp), or "phase3_enterprise" (Authenticated Enterprise Systems & Restricted EMI Records).'
        }
      },
      required: ['query']
    }
  }
};

async function execute(args = {}) {
  const query = typeof args.query === 'string' ? args.query.trim() : '';
  const series = args.series || 'all';
  const year = args.year || 'all';
  const audience = args.audience || 'public';
  const accessPhase = args.accessPhase || null;

  try {
    const result = dffeRagService.searchKnowledge({
      query: query || 'DFFE environmental programmes and State of the Environment findings',
      series,
      year,
      audience,
      accessPhase,
      limit: Number(args.limit) || 4
    });

    return {
      type: 'dffe_knowledge',
      data: result
    };
  } catch (err) {
    console.error('[DFFE Capability Error]:', err.message);
    return {
      error: `DFFE knowledge retrieval failed: ${err.message}`
    };
  }
}

module.exports = {
  name: 'search_dffe_knowledge',
  domain: 'dffe',
  schema,
  execute,
  slashCommand: 'dffe'
};
