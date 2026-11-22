/**
 * DFFE Service, Permit & Internal ITBS Workflow Triage Capability
 * ─────────────────────────────────────────────────────────────────────────────
 * Deterministic workflow engine bridging both:
 * 1. INTERNAL CORPORATE & ITBS WORKFLOWS (Branch 4: CMS / GITO / ITBS & Branch 6: FMS)
 *    - IT Equipment & Laptop/VPN Requests (Power Apps + SharePoint List + Power Automate schema)
 *    - Employee Leave, HR Onboarding & Departmental Template Lookup
 *    - PFMA / Supply Chain Management (SCM) & SITA ICT Procurement Checklists
 * 2. CITIZEN, PERMIT & ENFORCEMENT WORKFLOWS (Branches 1, 7, 8, 9, 10)
 *    - e-Fishing Recreational & Small-Scale Fisheries (FRAP) Permits (MLRA)
 *    - National Forests Act Protected Tree Licensing & NEMBA TOPS/Bioprospecting Permits
 *    - Green Scorpions (EMI) Environmental Crime & Pollution Reporting Triage
 */

const branchesData = require('../../data/dffe-branches.json');

const schema = {
  type: 'function',
  function: {
    name: 'triage_dffe_service_or_permit',
    description: 'Run a deterministic DFFE workflow triage for internal departmental processes (ITBS IT equipment/VPN requests, HR leave/onboarding SOPs, PFMA/SITA Supply Chain procurement checklists, Power Platform automation blueprints) OR citizen/regulatory services (e-Fishing permits, Small-Scale Fisheries co-ops, National Forests Act tree permits, NEMBA TOPS/bioprospecting permits, or Green Scorpions environmental crime reporting). Returns exact responsible DFFE Branch, Chief Directorate, required documents, turnaround timeframes, and a ready-to-use digital form/checklist.',
    parameters: {
      type: 'object',
      properties: {
        serviceCategory: {
          type: 'string',
          enum: [
            'auto',
            'itbs_equipment_request',
            'cms_hr_onboarding_leave',
            'fms_pfma_procurement',
            'efishing_marine_permit',
            'forestry_tops_biodiversity_permit',
            'emi_crime_incident_report'
          ],
          description: 'Category of DFFE workflow: "itbs_equipment_request" (CMS/GITO/ITBS laptop, VPN, software, or Power Platform request), "cms_hr_onboarding_leave" (HR leave policy, onboarding, or templates), "fms_pfma_procurement" (Financial Management PFMA/SCM/SITA procurement thresholds), "efishing_marine_permit" (e-Fishing recreational or Small-Scale/FRAP permit), "forestry_tops_biodiversity_permit" (National Forests Act tree permit or NEMBA TOPS/Bioprospecting permit), "emi_crime_incident_report" (Green Scorpions pollution/dumping/poaching report), or "auto".'
        },
        requestDetails: {
          type: 'string',
          description: 'Specific request or scenario details, e.g. "Request a developer laptop and VPN access in ITBS", "Recreational rock lobster permit on e-Fishing", "PFMA quotation threshold for R180,000 ICT software", or "Report illegal hazardous waste dumping in Germiston".'
        }
      },
      required: ['requestDetails']
    }
  }
};

function classifyServiceCategory(serviceCategory = 'auto', requestDetails = '') {
  if (serviceCategory && serviceCategory !== 'auto') return serviceCategory;
  const text = String(requestDetails || '').toLowerCase();

  if (/\b(laptop|monitor|equipment|vpn|itbs|gito|helpdesk|service desk|power apps|power automate|sharepoint|software install|printer|asset)\b/i.test(text)) {
    return 'itbs_equipment_request';
  }
  if (/\b(leave|onboarding|hr|human resource|pmds|payslip|persal|new employee|induction|template)\b/i.test(text)) {
    return 'cms_hr_onboarding_leave';
  }
  if (/\b(pfma|scm|supply chain|procurement|tender|rfq|quotation|sita|invoice|csd|budget|s&t|travel claim|fms)\b/i.test(text)) {
    return 'fms_pfma_procurement';
  }
  if (/\b(e-fishing|efishing|fishing permit|angling|rock lobster|kreef|abalone|hake|frap|small-scale fish|mlra|vessel|harbour)\b/i.test(text)) {
    return 'efishing_marine_permit';
  }
  if (/\b(tree|forest|yellowwood|camel thorn|milkwood|timber|tops|bioprospecting|cites|rooibos|buchu|nemba|protected species)\b/i.test(text)) {
    return 'forestry_tops_biodiversity_permit';
  }
  if (/\b(crime|report|illegal|dumping|pollution|poaching|spill|green scorpions|emi|hotline|section 28|section 31l|unlawful)\b/i.test(text)) {
    return 'emi_crime_incident_report';
  }
  return 'itbs_equipment_request';
}

function evaluateServiceWorkflow(rawCategory = 'auto', requestDetails = '') {
  const category = classifyServiceCategory(rawCategory, requestDetails);
  const details = requestDetails.trim() || 'DFFE Departmental Workflow & Service Triage';

  const workflows = {
    itbs_equipment_request: {
      category: 'itbs_equipment_request',
      title: 'CMS / GITO / ITBS — Internal IT Service & Equipment Request Workflow',
      branchNumber: 4,
      branchName: 'Branch 4: Corporate Management Services (CMS)',
      directorate: 'Chief Directorate: GITO → Directorate: IT Business Solutions (ITBS) & ICT Operations',
      sensitivity: 'INTERNAL-OFFICIAL (Phase 1 Entra ID / SharePoint)',
      turnaroundSla: '24–72 Hours (Standard ICT Provisioning) / 5 Business Days (New Hardware Allocation)',
      portalOrSystem: 'DFFE SharePoint Intranet & ITBS Power Apps Service Portal',
      portalUrl: 'https://www.dffe.gov.za',
      summary: 'Digitised internal workflow for requesting DFFE ICT equipment (laptops, monitors, 3G/LTE data cards), VPN remote access, Microsoft 365 / Power Platform environment provisioning, or logging technical incidents.',
      steps: [
        { step: '1. Submit Digital Request (Power Apps / SharePoint)', actor: 'DFFE Employee (@dffe.gov.za)', detail: 'Complete the ITBS Equipment / Access Request form specifying business justification, PERSAL number, and asset category.' },
        { step: '2. Automated Line-Manager Approval (Power Automate)', actor: 'Director / Deputy Director', detail: 'Power Automate routes an adaptive card in Microsoft Teams & Outlook for one-click digital sign-off.' },
        { step: '3. GITO Security & Asset Registry Verification', actor: 'GITO / ITBS & SCM Asset Management', detail: 'Verifies Entra ID role-based access control (RBAC), software licensing compliance, and stock availability in the IT Asset Register.' },
        { step: '4. Provisioning, Barcode Tagging & Handover', actor: 'ICT Operations / Service Desk', detail: 'Device is enrolled in Microsoft Intune / Defender, tagged against the employee PERSAL record, and closed with an audit trail.' }
      ],
      requiredChecklist: [
        'Valid DFFE PERSAL Number & Directorate Cost Centre Code',
        'Line Manager (Deputy Director / Director) motivation & digital approval',
        'Signed DFFE ICT Acceptable Use & Mobile Device Security Undertaking (POPIA / GITO policy)',
        'For Lost/Replacement Equipment: SAPS Case Number & Loss Control Declaration'
      ],
      powerPlatformBlueprint: {
        dataLayer: 'SharePoint List: `DFFE_ITBS_ServiceRequests` + `DFFE_IT_AssetRegister` (or Dataverse)',
        appLayer: 'Power Apps Canvas / Model-Driven App embedded in Microsoft Teams & SharePoint Viva Connections',
        automationLayer: 'Power Automate flow: `On_Item_Created -> Start_And_Wait_For_Approval (Manager) -> Update_Status -> Notify_ITBS_Queue`',
        reportingLayer: 'Power BI SLA & Asset Lifecycle Dashboard for GITO Management'
      }
    },
    cms_hr_onboarding_leave: {
      category: 'cms_hr_onboarding_leave',
      title: 'CMS — Employee Leave, Onboarding & Departmental Templates SOP',
      branchNumber: 4,
      branchName: 'Branch 4: Corporate Management Services (CMS)',
      directorate: 'Chief Directorate: Human Resource Management & Chief Directorate: Information Management (FM/IM)',
      sensitivity: 'INTERNAL-OFFICIAL (Phase 1 Entra ID / SharePoint)',
      turnaroundSla: 'Immediate (Self-Service Templates) / 48 Hours (HR Leave & PERSAL Capture)',
      portalOrSystem: 'DFFE SharePoint Intranet — HR & Corporate Templates Library',
      portalUrl: 'https://www.dffe.gov.za',
      summary: 'Standard operating procedures for employee leave applications, new official/intern onboarding checklists, PMDS performance agreements, and approved ministerial/directorate document templates.',
      steps: [
        { step: '1. Access Approved SharePoint Template Library', actor: 'DFFE Official / Intern', detail: 'Navigate to the CMS SharePoint Intranet Hub -> Corporate Templates & HR Policies (filtered by FM/IM sensitivity).' },
        { step: '2. Complete Digital Leave / Onboarding Form', actor: 'Employee', detail: 'Attach required supporting documents (e.g., medical certificate for sick leave >2 days, certified ID/qualifications for onboarding).' },
        { step: '3. Supervisor Recommendation & HR Registry Capture', actor: 'Supervisor & CMS HR Operations', detail: 'Supervisor approves electronically; HR captures leave credits or onboarding record on PERSAL.' }
      ],
      requiredChecklist: [
        'Annual Leave: 22 to 30 working days per cycle depending on service tenure (submitted prior to departure)',
        'Onboarding Packet: Certified ID, Qualifications, Tax/Banking details, PERSAL appointment form, Security Vetting (Z204), and GITO ICT Access form',
        'Official Templates: Ministerial Briefing Note (DG Submission), Internal Memorandum, S&T Claim, and PowerPoint Brand Identity available on SharePoint'
      ],
      powerPlatformBlueprint: {
        dataLayer: 'SharePoint Document Library (`CMS_Approved_Policies`) + Microsoft Lists (`HR_Onboarding_Tracker`)',
        appLayer: 'SharePoint Online Employee Onboarding Portal + Copilot Studio HR Policy Assistant',
        automationLayer: 'Power Automate automated welcome email, task reminders, and ITBS account provisioning trigger',
        reportingLayer: 'HR Onboarding Completion & Leave Liability Power BI Report'
      }
    },
    fms_pfma_procurement: {
      category: 'fms_pfma_procurement',
      title: 'FMS — PFMA Supply Chain Management (SCM) & SITA ICT Procurement Guide',
      branchNumber: 6,
      branchName: 'Branch 6: Financial Management Services (FMS)',
      directorate: 'Chief Directorate: Supply Chain Management (SCM) & Office of the CFO',
      sensitivity: 'INTERNAL-OFFICIAL (Phase 1 Financial & SCM Governance)',
      turnaroundSla: '3–7 Days (RFQ Quotations) / 30 Days Statutory Supplier Invoice Payment under PFMA',
      portalOrSystem: 'LOGIS / BAS, National Treasury CSD & SITA Transversal Contracts',
      portalUrl: 'https://www.dffe.gov.za/tenders',
      summary: 'Statutory public procurement workflow governed by the Public Finance Management Act (PFMA, Act 1 of 1999), National Treasury SCM Instructions, and SITA transversal ICT frameworks.',
      steps: [
        { step: '1. Demand Management & Specification (TOR)', actor: 'Requesting Directorate (e.g. ITBS)', detail: 'Verify item is on the approved Annual Procurement Plan (APP) and confirmed against budget availability.' },
        { step: '2. Procurement Threshold & CSD / SITA Routing', actor: 'FMS Supply Chain Management', detail: 'Petty Cash (<R2,000); Written Price Quotations / RFQ via Central Supplier Database (R2,000 – R1,000,000); Competitive Bidding / Tender (>R1,000,000); or SITA Transversal Contract for ICT.' },
        { step: '3. Evaluation, Adjudication (BAC) & Purchase Order', actor: 'SCM / Bid Adjudication Committee', detail: 'Evaluate compliance, specific goals (PPPFA 80/20 or 90/10), and issue official LOGIS Purchase Order.' },
        { step: '4. Delivery Verification & 30-Day Invoice Settlement', actor: 'Directorate & FMS Finance', detail: 'Confirm goods/services received and process payment within 30 days as mandated by PFMA Section 38(1)(f).' }
      ],
      requiredChecklist: [
        'Approved Internal Requisition Memo signed by Responsibility Manager (Chief Director / Director)',
        'Terms of Reference (TOR) / Technical Specification (plus GITO/SITA sign-off for all ICT hardware, software, or cloud services)',
        'National Treasury Central Supplier Database (CSD) tax-compliant supplier verification',
        'Signed Declaration of Interest (SBD 4) by all specification and evaluation officials'
      ],
      powerPlatformBlueprint: {
        dataLayer: 'SharePoint / Dataverse `SCM_Requisition_Tracker` & `Invoice_30Day_Monitor`',
        appLayer: 'Power Apps Digital Procurement Requisition & Spec Submission Portal',
        automationLayer: 'Power Automate multi-stage approval (Director -> Chief Director -> Budget -> SCM) with 30-day invoice SLA alerts',
        reportingLayer: 'CFO PFMA 30-Day Invoice Compliance & Procurement Turnaround Dashboard'
      }
    },
    efishing_marine_permit: {
      category: 'efishing_marine_permit',
      title: 'Fisheries Management — e-Fishing Recreational & Small-Scale (FRAP) Permit Guide',
      branchNumber: 10,
      branchName: 'Branch 10: Fisheries Management',
      directorate: 'Chief Directorate: Marine Resources Management & Small-Scale Fisheries',
      sensitivity: 'PUBLIC-APPROVED (Phase 2 Citizen Web & WhatsApp Ready)',
      turnaroundSla: 'Instant Digital Issuance (e-Fishing Recreational Permits) / Scheduled Window (FRAP & Small-Scale Co-ops)',
      portalOrSystem: 'DFFE e-Fishing Online Permitting Portal',
      portalUrl: 'https://www.dffe.gov.za/fisheries',
      summary: 'Digital permit application and compliance guide under the Marine Living Resources Act (MLRA, Act 18 of 1998) for recreational anglers, small-scale fishing co-operatives, and FRAP commercial rights holders.',
      steps: [
        { step: '1. Register / Sign In on DFFE e-Fishing Portal', actor: 'Citizen / Angler / Co-operative', detail: 'Create an applicant profile using South African ID or passport number on the official DFFE e-Fishing platform.' },
        { step: '2. Select Permit Category & Species Endorsement', actor: 'Applicant', detail: 'Choose Recreational Angling, West Coast Rock Lobster (WCRL), Cast Net, Scuba/Spearfishing, Mud Crab, or Vessel Licence (annual or 4-week validity).' },
        { step: '3. Digital Payment & Instant PDF / QR Permit Issuance', actor: 'e-Fishing Payment Gateway', detail: 'Pay prescribed statutory fee online; download digital permit with verification QR code for inspection by Fishery Control Officers.' }
      ],
      requiredChecklist: [
        'Valid South African ID Document or Passport',
        'Strictly observe daily bag limits, minimum size limits, closed seasons, and Marine Protected Area (MPA) no-take zones',
        'Recreational catch may NEVER be sold or bartered (Section 18 MLRA criminal offence)',
        'For Small-Scale Fisheries: Verified registration under one of the 315+ recognized Small-Scale Fishing Co-operatives'
      ]
    },
    forestry_tops_biodiversity_permit: {
      category: 'forestry_tops_biodiversity_permit',
      title: 'Forestry & Biodiversity — Protected Tree (NFA), TOPS & Bioprospecting Permit Guide',
      branchNumber: 7,
      branchName: 'Branch 7: Forestry Management & Branch 1: Biodiversity and Conservation',
      directorate: 'Chief Directorate: Forestry Regulation & Chief Directorate: Biodiversity Economy',
      sensitivity: 'PUBLIC-APPROVED (Phase 2 Citizen & Stakeholder Service)',
      turnaroundSla: '30–60 Working Days (Statutory Evaluation & Site Inspection)',
      portalOrSystem: 'DFFE Forestry & NEMBA Permitting Registry',
      portalUrl: 'https://www.dffe.gov.za/permits-licences',
      summary: 'Licensing workflow under the National Forests Act (Act 84 of 1998) for protected indigenous trees and under NEMBA (Act 10 of 2004) for Threatened or Protected Species (TOPS) and Nagoya Bioprospecting.',
      steps: [
        { step: '1. Verify Protected Status & Statutory Trigger', actor: 'Applicant / Landowner / Researcher', detail: 'Check if species is listed on the National Forests Act Protected Tree List (e.g. Yellowwood, Camel Thorn, White Milkwood) or NEMBA TOPS / Section 81 Bioprospecting list.' },
        { step: '2. Submit Application & Specialist Supporting Docs', actor: 'Applicant', detail: 'Lodge application form with GPS coordinates, site photographs, ecological motivation, or Benefit-Sharing Agreement (for indigenous biological resources).' },
        { step: '3. Regional Forestry / Biodiversity Inspection & Issuance', actor: 'DFFE Regional Officer / Issuing Authority', detail: 'Officer conducts site verification and issues conditional permit or licence.' }
      ],
      requiredChecklist: [
        'Exact GPS coordinates (latitude/longitude), property Erf/Farm description, and landowner consent',
        'For Protected Trees (NFA s15): Arborist assessment or proof that development layout cannot avoid the protected tree',
        'For Bioprospecting (NEMBA s81): Prior Informed Consent (PIC) and Material Transfer / Benefit-Sharing Agreement with indigenous knowledge holders'
      ]
    },
    emi_crime_incident_report: {
      category: 'emi_crime_incident_report',
      title: 'RCSM (Green Scorpions) — Environmental Crime, Pollution & Incident Triage',
      branchNumber: 8,
      branchName: 'Branch 8: Regulatory Compliance and Sector Monitoring (RCSM)',
      directorate: 'Chief Directorate: Environmental Enforcement (Environmental Management Inspectors — EMIs)',
      sensitivity: 'PUBLIC INTAKE -> PHASE 3 RESTRICTED NECES ENFORCEMENT TRIAGE',
      turnaroundSla: 'Immediate Hotline Intake (24h Emergency Spill/Poaching) / 5–14 Days Inspection Triage',
      portalOrSystem: 'DFFE Environmental Crimes Hotline (0800 205 005) & NECES Case Triage',
      portalUrl: 'https://www.dffe.gov.za',
      summary: 'Structured reporting and compliance triage workflow for illegal waste dumping, hazardous chemical spills, unlawful EIA commencement (NEMA Section 24G), air emission exceedances, and wildlife trafficking.',
      steps: [
        { step: '1. Capture Incident Evidence & Geo-Location', actor: 'Complainant / Whistleblower / Official', detail: 'Record exact location (GPS/street address), date/time, nature of offence, vehicle registration or facility name, and dated photographs.' },
        { step: '2. Statutory Offence Classification', actor: 'RCSM Compliance & Enforcement Triage', detail: 'Classify under NEMA Section 28 (Duty of Care / Pollution), Section 24F/24G (Unlawful EIA commencement), NEMWA Section 20/26 (Illegal dumping/waste facility), or NEMBA (Poaching).' },
        { step: '3. Route to Designated Grade 1–5 EMI (Green Scorpions)', actor: 'National / Provincial / Municipal EMI', detail: 'Log case in NECES, conduct site inspection, and issue Section 31L Pre-Compliance / Compliance Notice, Section 28 Directive, or open criminal docket.' }
      ],
      requiredChecklist: [
        'DFFE National Environmental Crimes & Incidents Hotline: 0800 205 005 (Toll-Free, Whistleblower protected under NEMA Section 31)',
        'Exact locality, province, municipality, and GPS coordinates of the incident',
        'Description of environmental harm (watercourse contamination, critical biodiversity clearing, toxic air plume, or hazardous waste)'
      ]
    }
  };

  const selected = workflows[category] || workflows.itbs_equipment_request;
  return {
    ...selected,
    requestDetails: details,
    totalBranchesInDepartment: branchesData.branches.length,
    timestamp: new Date().toISOString()
  };
}

async function execute(args = {}) {
  const serviceCategory = args.serviceCategory || 'auto';
  const requestDetails = typeof args.requestDetails === 'string'
    ? args.requestDetails
    : (typeof args.query === 'string' ? args.query : 'ITBS IT equipment request and approval workflow');

  const result = evaluateServiceWorkflow(serviceCategory, requestDetails);
  return {
    type: 'dffe_service_triage',
    data: result
  };
}

module.exports = {
  name: 'triage_dffe_service_or_permit',
  domain: 'dffe',
  schema,
  execute,
  evaluateServiceWorkflow,
  slashCommand: 'service'
};
