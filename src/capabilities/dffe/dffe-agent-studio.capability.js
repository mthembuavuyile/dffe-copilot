/**
 * DFFE Directorate Agent Studio & FM/IM Sensitivity Governance Capability
 * ─────────────────────────────────────────────────────────────────────────
 * Directly implements the two key insights from the DFFE / Microsoft / SITA
 * meeting:
 * 1. Alucias Makonko & Microsoft Copilot Studio Demo: Internal directorates
 *    can create/configure their own scoped agents grounded on specific URLs,
 *    SharePoint documents, and instructions.
 * 2. Siviwe Mpondo's 3-Phase Roadmap & FM/IM Sensitivity Gate: Demonstrates
 *    Phase 1 (Internal/Teams), Phase 2 (External Public Web & WhatsApp),
 *    and Phase 3 (Authenticated Enterprise Systems + Content Sensitivity RBAC).
 */

const dffeRagService = require('../../services/dffe-rag.service');

const schema = {
  type: 'function',
  function: {
    name: 'manage_dffe_directorate_agent',
    description: 'List, create, ground, or audit DFFE Directorate Agents across the 3-Phase DFFE Agentic Roadmap (Phase 1: Internal Official & Microsoft Teams, Phase 2: External Public dffe.gov.za Web & Citizen WhatsApp, Phase 3: Authenticated Enterprise Systems with Information Management FM/IM Content Sensitivity RBAC). Use this tool when the user wants to create a custom directorate agent, ground an agent on a specific URL or document, or inspect the 3-Phase deployment & sensitivity governance architecture.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['overview', 'create_agent', 'ground_source', 'sensitivity_audit'],
          description: 'Action to perform: "overview" (show all Directorate Agents & 3-Phase Roadmap), "create_agent" (provision a new custom Directorate Agent grounded on specific URLs/docs), "ground_source" (add a URL or document text to the verified RAG corpus), or "sensitivity_audit" (test Siviwe Mpondo\'s FM/IM Content Sensitivity Gate across Phase 1, Phase 2, and Phase 3).'
        },
        name: {
          type: 'string',
          description: 'Name of the new Directorate Agent or grounded document (when action is create_agent or ground_source).'
        },
        directorate: {
          type: 'string',
          description: 'Responsible DFFE Branch or Chief Directorate, e.g. "Branch: Biodiversity and Conservation" or "Directorate: IT Business Solutions".'
        },
        groundingUrl: {
          type: 'string',
          description: 'Official URL or SharePoint/web link to ground the agent on, e.g. "https://www.dffe.gov.za/legislation/acts".'
        },
        customText: {
          type: 'string',
          description: 'Optional policy text, SOP clauses, or key findings to ingest into the grounded RAG corpus.'
        },
        sensitivity: {
          type: 'string',
          enum: ['public', 'internal', 'restricted'],
          description: 'Information Management (FM/IM) content sensitivity classification: "public" (Public-Approved), "internal" (Internal Official / Teams Only), or "restricted" (Phase 3 Security Clearance / EMI Only).'
        }
      }
    }
  }
};

async function execute(args = {}) {
  const action = args.action || 'overview';
  let createdAgent = null;
  let groundedDocument = null;

  if (action === 'create_agent' && (args.name || args.directorate || args.groundingUrl)) {
    const res = dffeRagService.createDirectorateAgent({
      name: args.name || 'DFFE Custom Directorate Agent',
      directorate: args.directorate || 'DFFE Directorate: IT Business Solutions',
      defaultSeries: args.series || 'all',
      sensitivity: args.sensitivity || 'internal',
      groundingUrl: args.groundingUrl || 'https://www.dffe.gov.za',
      description: args.customText || `Custom conversational agent grounded for ${args.directorate || 'DFFE Directorate'}.`,
      customDocumentText: args.customText || ''
    });
    createdAgent = res.agent;
    groundedDocument = res.groundedDocument;
  } else if (action === 'ground_source' && (args.name || args.groundingUrl || args.customText)) {
    groundedDocument = dffeRagService.groundCustomSource({
      title: args.name || 'Custom Directorate Grounded Policy Source',
      url: args.groundingUrl || 'https://www.dffe.gov.za',
      branch: args.directorate || 'DFFE Directorate Custom Grounding',
      sensitivity: args.sensitivity || 'internal',
      summary: args.customText || `Grounded reference from ${args.groundingUrl || 'dffe.gov.za'}`,
      content: args.customText || ''
    });
  }

  // Run a live 3-phase FM/IM sensitivity comparison audit so stakeholders can see exact governance enforcement
  const phase2Check = dffeRagService.searchKnowledge({
    query: 'Section 31L enforcement register and internal directorate SOP',
    accessPhase: 'phase2_public',
    limit: 6
  });
  const phase1Check = dffeRagService.searchKnowledge({
    query: 'Section 31L enforcement register and internal directorate SOP',
    accessPhase: 'phase1_internal',
    limit: 6
  });
  const phase3Check = dffeRagService.searchKnowledge({
    query: 'Section 31L enforcement register and internal directorate SOP',
    accessPhase: 'phase3_enterprise',
    limit: 6
  });

  return {
    type: 'dffe_agent_studio',
    data: {
      action,
      createdAgent,
      groundedDocument,
      agents: dffeRagService.getDirectorateAgents(),
      phases: dffeRagService.getDeploymentPhases(),
      totalCorpusDocuments: dffeRagService.getAllDocuments().length,
      sensitivityComparison: {
        phase2_public: {
          allowedSensitivities: ['public'],
          withheldCount: phase2Check.sensitivityAudit.withheldCount,
          withheldTitles: phase2Check.sensitivityAudit.withheldDocuments.map(d => d.title)
        },
        phase1_internal: {
          allowedSensitivities: ['public', 'internal'],
          withheldCount: phase1Check.sensitivityAudit.withheldCount,
          withheldTitles: phase1Check.sensitivityAudit.withheldDocuments.map(d => d.title)
        },
        phase3_enterprise: {
          allowedSensitivities: ['public', 'internal', 'restricted'],
          withheldCount: phase3Check.sensitivityAudit.withheldCount,
          withheldTitles: []
        }
      }
    }
  };
}

module.exports = {
  name: 'manage_dffe_directorate_agent',
  domain: 'dffe',
  schema,
  execute,
  slashCommand: 'agent'
};
