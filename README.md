# DFFE Copilot | Departmental Knowledge & Environmental RAG Workspace

**Department of Forestry, Fisheries and the Environment (DFFE) — Republic of South Africa**  
*Branch: Corporate Management Services (CMS) — Chief Directorate: Government Information Technology Office (GITO)*

DFFE Copilot is an internal departmental knowledge, environmental intelligence, and Retrieval-Augmented Generation (RAG) workspace built for the Department of Forestry, Fisheries and the Environment (DFFE). It pairs multi-model inference with verified South African environmental reports, statutes, and departmental ICT reference documents across **9 Logical Knowledge Collections** and **10 DFFE Branches**.

**[Platform Overview](/public/about.html)** · **[Technical Documentation](/public/docs.html)**

---

## Core Architecture & Capabilities

1. **9-Collection DFFE & GITO Passage Retrieval & Source Explorer (`search_dffe_knowledge` / `/sources`)**:
   - Indexes verbatim, page-cited passages across **9 Logical Collections**: `DFFE Overview`, `CMS`, `GITO`, `ICT Governance`, `ICT Organogram`, `Digital Solutions`, `Infrastructure`, `Cybersecurity`, and `ICT Operations`.
   - Enforces strict **Structure Status** governance (`Official`, `Proposed`, `Statutory`, `Historical`), distinguishing the official DFFE Corporate Management Services webpage placement of GITO from the two proposed ICT organogram documents (**Source A**: *Revised ICT Organogram*, Page 1; and **Source B**: *DFFE Government ICT Proposed Operating Model and GITO Structure*, Pages 1–7).
2. **10-Branch Departmental & Environmental RAG Corpus (`/dffe`, `/gito`, `/eia`, `/soer`, `/programmes`, `/climate`, `/itbs`, `/pfma`, `/efishing`)**:
   - Grounded in published State of the Environment Outlook Reports (SoER / SAEO), EPWP environmental programmes (*Working for Water*, *Working on Fire*, *Working for Wetlands*, *Working for the Coast*, *Working on Waste*, *Ten Million Trees*), South African environmental statutes (*NEMA Act 107 of 1998*, *Climate Change Act 22 of 2024*, *NEMBA*, *NEMWA*, *NEMAQA*, *NEMPAA*, *MLRA*, *National Forests Act*), and internal CMS/GITO/FMS operational procedures.
   - Token-efficient lazy branch routing dynamically injects relevant branch context across all 10 DFFE branches.
3. **Client-Side Document Intelligence & 5-Tab Artifacts Canvas**:
   - Parse attached `.pdf` reports and `.csv` environmental monitoring tables directly in the browser and inspect verbatim RAG citations, Source A vs. Source B comparison briefs, or code/markdown deliverables in the side-by-side Canvas.

---

## Quick Start

### 1. Configure Environment
```bash
cp .env.example .env
```
Add your OpenRouter API key in `.env`:
```env
OPENROUTER_API_KEY=your_key_here
```

### 2. Install and Start
```bash
npm install
npm start
```
- **Main DFFE Copilot Workspace:** [http://localhost:3000](http://localhost:3000)

### 3. Run Automated Verification Suite
```bash
npm test
```

---

## Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Main DFFE Copilot Workspace & 5-Tab Artifacts Canvas |
| `GET` | `/api/dffe/corpus` | Verified DFFE RAG corpus metadata, series catalogue, 9 collections & 10 branches |
| `GET` | `/api/dffe/collections` | 9-Collection DFFE & GITO chunk metadata, statuses & Source A vs. Source B rules |
| `POST` | `/api/dffe/chunks/search` | Passage-level search across the 9 logical DFFE & GITO knowledge collections |
| `POST` | `/api/dffe/search` | Full DFFE RAG search returning both passage chunks and verified source documents |
| `GET` | `/api/dffe/branches` | 10-Branch DFFE organisational directory & dynamic branch classifier |
| `POST` | `/api/chat` | Mode-aware SSE streaming chat completion with RAG grounding & resilient fallback |
| `POST` | `/api/widget/execute` | Deterministic utility & Source Explorer widget execution |
