# DFFE Copilot | 3-Phase Conversational Agentic Platform & RAG Assistant

**Department of Forestry, Fisheries and the Environment (DFFE) — Republic of South Africa**  
*Directorate: IT Business Solutions — Software Development & AI Engineering (Environment House, Pretoria)*

DFFE Copilot is an in-house **3-Phase Conversational Agentic Platform, Directorate Agent Studio, and Retrieval-Augmented Generation (RAG) Workspace** built for the Department of Forestry, Fisheries and the Environment (DFFE). Modeled on the **UNEP EnvironmentGPT (`wesr.unep.org/environmentgpt/`)** scientific integrity architecture and the **DFFE / Microsoft / SITA** phased agentic deployment strategy, it goes beyond a static Q&A chatbot by combining source-cited RAG retrieval with **self-service Directorate Agent creation**, **deterministic NEMA / Climate / SAAQIS / SAWIC operational tools**, **multi-channel publishing (`dffe.gov.za` Web, Microsoft Teams, Citizen WhatsApp)**, and **Information Management (FM/IM) Content Sensitivity Governance**.

**[3-Phase Agent Hub & Multi-Channel Simulator](/public/dffe.html)** · **[Platform Overview](/public/about.html)** · **[Technical Documentation](/public/docs.html)**

---

## Strategic Architecture: The 3-Phase DFFE Agentic Roadmap

| Phase | Target Audience & Channels | Information Management (FM/IM) Sensitivity Scope | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Phase 1: Internal Official & Microsoft Teams** | Internal DFFE staff & directorates (`@dffe.gov.za`) via Intranet Studio & Microsoft Teams | `PUBLIC` + `INTERNAL-OFFICIAL` (Withholds `RESTRICTED` criminal dockets) | Query public + internal SOP corpora, **create & ground custom Directorate Agents** on specific `dffe.gov.za` or SharePoint URLs, and draft Ministerial Briefing Notes in the Artifacts Canvas. |
| **Phase 2: External Public Website & Citizen WhatsApp** | Citizens, researchers, small-scale fishers, EPWP participants & EIA applicants via `dffe.gov.za` & WhatsApp | Strictly `PUBLIC-APPROVED` only (FM/IM Sensitivity Gate blocks all `INTERNAL` & `RESTRICTED` records) | UNEP EnvironmentGPT-aligned filtering by **Report Series**, **Publication Year**, and **Target Audience** over State of the Environment Reports (SoER), EPWP programmes, and statutory acts. |
| **Phase 3: Enterprise System-Connected & FM/IM RBAC** | Authorised Environmental Management Inspectors (Green Scorpions) & Compliance Officers | `PUBLIC` + `INTERNAL` + `RESTRICTED / SENSITIVE` (Entra ID + FM/IM Security Clearance) | Deterministic connectors to **DFFE National Environmental Screening Tool**, **SAAQIS** (Air Quality Priority Areas), **SAWIC** (Waste & EPR targets), **Climate Change Act Carbon Budgets**, and **NECES Section 31L / 24G enforcement registers**. |

---

## Core Operational Capabilities (Why DFFE Copilot Is Not a "Glorified Chatbot")

1. **UNEP EnvironmentGPT-Aligned RAG & Citation Engine (`search_dffe_knowledge` / `/dffe`, `/soer`, `/programmes`, `/nema`)**:
   - Grounded strictly in verified DFFE publications, State of the Environment Outlook Reports (SoER / SAEO), EPWP compendiums, and South African environmental statutes (`NEMA Act 107 of 1998`, `Climate Change Act 22 of 2024`, `NEMBA`, `NEMWA`, `NEMAQA`, `NEMPAA`, `MLRA`).
   - Supports multi-dimensional filtering by **Report Series**, **Year**, **Target Audience**, and **3-Phase FM/IM Sensitivity Tier**.
2. **Self-Service Directorate Agent Studio & Live URL/Document Grounding (`manage_dffe_directorate_agent` / `/agent`, `/ground`, `/sensitivity`)**:
   - Enables DFFE branches and directorates (*Biodiversity & Conservation*, *Regulatory Compliance & Sector Monitoring*, *Climate Change & Air Quality*, *Environmental Programmes*, *Chemicals & Waste*, *Forestry & Fisheries*) to provision scoped agents grounded on specific URLs, policy extracts, and sensitivity classifications.
3. **Deterministic NEMA Section 24 EIA & National Screening Tool Engine (`screen_nema_eia_activity` / `/eia`)**:
   - Evaluates proposed developments against **Listing Notices 1, 2, and 3 (GNR 983–985)**, determines whether **Basic Assessment (197 days)**, **Scoping & EIR (300 days)**, **REDZ Fast-Track (57 days)**, or **Section 24G Rectification** applies, identifies the Competent Authority, and generates a mandatory **National Web-Based Environmental Screening Tool (`screening.environment.gov.za`)** checklist in the Canvas.
4. **DFFE National Environmental Systems Telemetry & Carbon Budget Engine (`query_dffe_environmental_indicators` / `/climate`, `/air`, `/waste`)**:
   - Provides deterministic benchmarks and quantitative modelling across **Climate Change Act (Act 22 of 2024)** (2030 NDC $350\text{–}420\text{ Mt CO}_2\text{-eq}$ trajectory, Sector Emission Targets, and 5-year company Carbon Budget reduction modelling), **SAAQIS** (Highveld, Vaal Triangle, and Waterberg-Bojanala Priority Area $\text{PM}_{2.5}/\text{PM}_{10}/\text{SO}_2$ telemetry), **SAWIC** (Extended Producer Responsibility recycling targets), and **EPWP / FRAP** metrics.
5. **DFFE 10-Branch Dynamic Routing & Service / Permit / ITBS Workflow Engine (`triage_dffe_service_or_permit` / `/itbs`, `/cms`, `/pfma`, `/efishing`, `/permit`)**:
   - Token-efficient lazy-loading architecture across all **10 DFFE Branches** (*Biodiversity & Conservation*, *Chemicals & Waste*, *Climate Change & Air Quality*, *Corporate Management Services [CMS / GITO / ITBS]*, *Environmental Programmes [EPWP]*, *Financial Management Services [FMS]*, *Forestry Management*, *Regulatory Compliance & Sector Monitoring [RCSM]*, *Oceans & Coasts*, and *Fisheries Management*).
   - Deterministically triages internal **GITO / ITBS IT equipment & VPN requests** (with SharePoint / Power Apps / Power Automate blueprints), **CMS HR leave & onboarding SOPs**, **FMS PFMA & SITA ICT procurement thresholds**, **e-Fishing recreational & Small-Scale Fisheries (FRAP) permits**, and **National Forests Act / NEMBA TOPS permits**.
6. **Client-Side Document Intelligence & Deliverable Canvas**:
   - Parse attached `.pdf` reports and `.csv` environmental monitoring tables directly in the browser and generate structured **Ministerial Briefing Notes**, **EIA Screening Checklists**, **ITBS Digital Workflow Blueprints**, and **Compliance Assessments** in the side-by-side Canvas.

---

## Quick Start

### 1. Configure Environment
```bash
cp .env.example .env
```
Add your OpenRouter or Azure OpenAI/Foundry API key in `.env`:
```env
OPENROUTER_API_KEY=your_key_here
```

### 2. Install and Start
```bash
npm install
npm start
```
- **Main DFFE Agentic Workspace:** [http://localhost:3000](http://localhost:3000)
- **3-Phase Agent Hub, Agent Builder & Multi-Channel Simulator (`Web` · `WhatsApp` · `Teams`):** [http://localhost:3000/dffe](http://localhost:3000/dffe)

### 3. Run Automated Verification Suite
```bash
npm test
```

---

## Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Main DFFE Copilot Workspace & Deliverable Canvas |
| `GET` | `/dffe` | 3-Phase Agent Studio, EIA Simulator & Multi-Channel (`Web` · `WhatsApp` · `Teams`) Hub |
| `GET` | `/api/dffe/corpus` | Verified DFFE RAG corpus metadata, series catalogue, 10 branches, phases & directorate agents |
| `GET` | `/api/dffe/branches` | 10-Branch DFFE organisational directory & zero-token dynamic branch classifier |
| `POST` | `/api/dffe/search` | UNEP EnvironmentGPT-aligned RAG search with 3-Phase FM/IM Sensitivity Gate |
| `GET` | `/api/dffe/agents` | List predefined & custom DFFE Directorate Agents and 3-Phase governance profiles |
| `POST` | `/api/dffe/agents` | Provision a new custom Directorate Agent grounded on specific URLs/documents |
| `POST` | `/api/dffe/ground` | Dynamically ingest an official URL or policy extract into the session RAG corpus |
| `POST` | `/api/dffe/eia-screen` | Deterministic NEMA Section 24 EIA & National Screening Tool pathway engine |
| `POST` | `/api/dffe/indicators` | Deterministic Climate Change Act Carbon Budget, SAAQIS, SAWIC & EPWP indicators |
| `POST` | `/api/dffe/service-triage` | Deterministic CMS/GITO/ITBS equipment, HR leave, PFMA/SITA procurement & e-Fishing permit workflow triage |
| `POST` | `/api/chat` | Mode & Agent-aware SSE streaming chat completion with DFFE operational tool loop |
| `POST` | `/api/widget/execute` | Direct deterministic DFFE capability & widget execution |
