/**
 * DFFE NEMA Section 24 EIA & National Screening Tool Capability
 * ─────────────────────────────────────────────────────────────
 * Deterministic regulatory workflow tool for evaluating proposed
 * developments under NEMA EIA Regulations (GNR 982–985), Listing
 * Notices 1, 2 & 3, REDZ Fast-Track timeframes, and mandatory
 * DFFE National Web-Based Environmental Screening Tool protocols.
 */

const schema = {
  type: 'function',
  function: {
    name: 'screen_nema_eia_activity',
    description: 'Run a deterministic NEMA Section 24 Environmental Impact Assessment (EIA) & DFFE National Environmental Screening Tool check for a proposed development or project (e.g., solar PV/wind energy, coastal infrastructure, industrial waste/chemical facility, water pipeline, township development, mining, or Section 24G unlawful commencement). Determines the applicable Listing Notice (1, 2, or 3), assessment pathway (Basic Assessment 197-day, Scoping & EIR 300-day, or REDZ 57-day Fast-Track), Competent Authority, and mandatory specialist protocols.',
    parameters: {
      type: 'object',
      properties: {
        projectDescription: {
          type: 'string',
          description: 'Description of the proposed development, activity, or compliance scenario, e.g. "75 MW Solar PV facility and grid connection in a Renewable Energy Development Zone (REDZ)" or "Hazardous waste treatment and landfill facility in Gauteng".'
        },
        locationOrCorridor: {
          type: 'string',
          description: 'Optional province, locality, or corridor, e.g. "Northern Cape REDZ", "Western Cape Coastal Protection Zone", "Mpumalanga Highveld", "KwaZulu-Natal Estuary".'
        }
      },
      required: ['projectDescription']
    }
  }
};

function evaluateEiaPathway(projectDescription = '', locationOrCorridor = '') {
  const combined = `${projectDescription} ${locationOrCorridor}`.toLowerCase();

  const isRedz = /\b(redz|renewable energy development zone|strategic transmission corridor|efc|energy corridor|solar|wind|bess|battery storage|photovoltaic)\b/i.test(combined);
  const isLargeScaleOrLn2 = /\b(nuclear|refinery|petrochemical|hazardous waste|incinerat|smelter|coal-fired|lng|desalination|port|harbour|dam|bulk chemical|300\s*mw|200\s*mw|100\s*mw|50\s*mw|scoping|s&eir|listing notice 2)\b/i.test(combined);
  const isCoastalOrCba = /\b(coast|estuary|dune|marine|wetland|cba|critical biodiversity|protected area|national park|buffer|Ramsar|listing notice 3|indigenous forest)\b/i.test(combined);
  const isMining = /\b(mining|mine|prospecting|quarry|coal mine|tailings|mprda|dmre)\b/i.test(combined);
  const isSection24G = /\b(24g|unlawful|already commenced|without authorisation|rectification|illegal clearing|section 31l|green scorpions)\b/i.test(combined);

  let listingNotice = 'Listing Notice 1 (GNR 983)';
  let assessmentProcess = 'Basic Assessment Process (BAR)';
  let decisionTimeframeDays = 197;
  let fastTrackApplicable = false;
  let competentAuthority = 'Provincial Department of Environmental Affairs / DFFE National (if national priority, cross-boundary, or state-owned)';

  if (isSection24G) {
    listingNotice = 'NEMA Section 24G Rectification (Unlawful Commencement of Listed Activity)';
    assessmentProcess = 'Section 24G Rectification Application + Mandatory Administrative Fine Assessment (up to R10 Million)';
    decisionTimeframeDays = 240;
    competentAuthority = 'DFFE Minister / Provincial MEC & Grade 1–5 Environmental Management Inspectors (Green Scorpions)';
  } else if (isRedz) {
    listingNotice = 'Listing Notice 1 / Listing Notice 2 — Gazetted REDZ & Strategic Transmission Corridor Notice';
    assessmentProcess = 'Streamlined Basic Assessment Process (REDZ Fast-Track)';
    decisionTimeframeDays = 57;
    fastTrackApplicable = true;
    competentAuthority = 'Department of Forestry, Fisheries and the Environment (DFFE National — Integrated Permitting System)';
  } else if (isLargeScaleOrLn2) {
    listingNotice = 'Listing Notice 2 (GNR 984 — High-Impact / Large-Scale threshold activity)';
    assessmentProcess = 'Full Scoping and Environmental Impact Reporting (S&EIR)';
    decisionTimeframeDays = 300;
    competentAuthority = 'Department of Forestry, Fisheries and the Environment (DFFE National)';
  } else if (isCoastalOrCba) {
    listingNotice = 'Listing Notice 3 (GNR 985 — Activity within Geographically Sensitive Area / CBA / Coastal Zone)';
    assessmentProcess = 'Basic Assessment Process (BAR) with Geographically Sensitive Overlay';
    decisionTimeframeDays = 197;
  }

  if (isMining) {
    competentAuthority = 'Department of Mineral Resources and Energy (DMRE) as Competent Authority; DFFE Minister as Section 43 Appeal Authority (One Environmental System)';
  }

  const specialistProtocols = [
    'Terrestrial Biodiversity & Plant/Animal Species Theme Protocol (DFFE National Screening Tool)',
    'Aquatic Biodiversity & Wetland Delineation Protocol (DWS Section 21 Water Use License alignment)',
    'Agricultural Agro-Ecosystem & Soil Capability Assessment Protocol',
    'Archaeological, Cultural Heritage & Palaeontological (SAHRA) Theme Protocol'
  ];

  if (isRedz) {
    specialistProtocols.push('Avian & Bat Collision/Monitoring Protocol (Wind & Solar PV Specialist Guideline)');
    specialistProtocols.push('Visual Impact & Landscape Sensitivity Protocol');
  }
  if (isLargeScaleOrLn2) {
    specialistProtocols.push('Atmospheric Dispersion Modelling & Air Quality Impact Assessment (NEMAQA Section 21 AEL)');
    specialistProtocols.push('Climate Change Impact & GHG Mitigation Assessment (Climate Change Act 22 of 2024 alignment)');
  }
  if (isCoastalOrCba) {
    specialistProtocols.push('Estuarine / Marine Ecology & Coastal Setback Line Assessment (NEM:ICMA Act 24 of 2008)');
  }

  const statutoryMilestones = isRedz
    ? [
        { phase: '1. Pre-Application & DFFE Screening Tool Report', days: 'Day 0', detail: 'Generate mandatory site sensitivity report at screening.environment.gov.za and register EAP (EAPASA).' },
        { phase: '2. Draft BAR & 30-Day Public Participation', days: 'Days 1–90', detail: 'Submit Application for EA, notify I&APs, organs of state, and host public comment period.' },
        { phase: '3. Final BAR Submission to DFFE', days: 'Day 90', detail: 'Lodge Final Basic Assessment Report, EMPr, and Comments & Responses Report.' },
        { phase: '4. Competent Authority REDZ Decision', days: '57 Days from Final BAR', detail: 'Expedited DFFE Environmental Authorisation decision under REDZ Gazette Notice.' }
      ]
    : isLargeScaleOrLn2
    ? [
        { phase: '1. DFFE National Screening Tool & Application', days: 'Day 0', detail: 'Generate site sensitivity verification report at screening.environment.gov.za.' },
        { phase: '2. Scoping Report & 30-Day Public Participation', days: 'Days 1–44', detail: 'Submit Final Scoping Report & Plan of Study for EIA within 44 days; DFFE decision within 43 days.' },
        { phase: '3. Specialist Studies & Draft EIR Consultation', days: 'Days 88–193', detail: 'Execute specialist protocols, draft EMPr, and conduct 30-day public review (106 days).' },
        { phase: '4. Competent Authority S&EIR Decision', days: '107 Days from Final EIR (300 Days Total)', detail: 'DFFE issues or refuses Environmental Authorisation with binding EMPr conditions.' }
      ]
    : [
        { phase: '1. DFFE National Screening Tool & Application', days: 'Day 0', detail: 'Generate mandatory site sensitivity report at screening.environment.gov.za.' },
        { phase: '2. Draft BAR & 30-Day Public Participation', days: 'Days 1–90', detail: 'Compile Basic Assessment Report, EMPr, specialist verification, and 30-day I&AP comment period.' },
        { phase: '3. Competent Authority Review & Decision', days: '107 Days from Final BAR (197 Days Total)', detail: 'Decision on Environmental Authorisation plus 20-day NEMA Section 43 appeal window.' }
      ];

  return {
    projectDescription: projectDescription || 'Proposed Infrastructure / Environmental Development',
    locationOrCorridor: locationOrCorridor || 'Republic of South Africa (National Screening Scope)',
    listingNotice,
    assessmentProcess,
    decisionTimeframeDays,
    fastTrackApplicable,
    competentAuthority,
    screeningToolUrl: 'https://screening.environment.gov.za',
    eapasaRequirement: 'Mandatory registration with the Environmental Assessment Practitioners Association of South Africa (EAPASA) under NEMA Section 24H.',
    specialistProtocols,
    statutoryMilestones,
    statutoryBasis: 'National Environmental Management Act (NEMA, Act 107 of 1998) Section 24 & 2014 EIA Regulations (as amended).'
  };
}

async function execute(args = {}) {
  const projectDescription = typeof args.projectDescription === 'string'
    ? args.projectDescription.trim()
    : (typeof args.query === 'string' ? args.query.trim() : '75 MW Solar PV & Grid Connection in a Renewable Energy Development Zone (REDZ)');
  const locationOrCorridor = typeof args.locationOrCorridor === 'string' ? args.locationOrCorridor.trim() : '';

  const assessment = evaluateEiaPathway(projectDescription, locationOrCorridor);
  return {
    type: 'dffe_eia_screening',
    data: assessment
  };
}

module.exports = {
  name: 'screen_nema_eia_activity',
  domain: 'dffe',
  schema,
  execute,
  evaluateEiaPathway,
  slashCommand: 'eia'
};
