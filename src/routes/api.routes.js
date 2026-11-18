const express = require('express');
const { Readable } = require('stream');
const router = express.Router();

const chatController = require('../controllers/chat.controller');
const modelsController = require('../controllers/models.controller');
const healthController = require('../controllers/health.controller');
const toolController = require('../controllers/tool.controller');
const widgetController = require('../controllers/widget.controller');
const elevenlabsService = require('../services/elevenlabs.service');
const dffeRagService = require('../services/dffe-rag.service');
const dffeEiaScreeningCapability = require('../capabilities/dffe/dffe-eia-screening.capability');
const dffeIndicatorsCapability = require('../capabilities/dffe/dffe-indicators.capability');

// Security & Rate Limiting Middlewares
const { chatLimiter, titleLimiter, toolLimiter } = require('../middleware/rateLimiter');
const { modelGuard } = require('../middleware/modelGuard');

// Chat endpoints
router.get('/chat', (req, res) => chatController.getChatInfo(req, res));
router.post('/chat', chatLimiter, modelGuard, (req, res) => chatController.handleChat(req, res));
router.post('/title', titleLimiter, modelGuard, (req, res) => chatController.generateTitle(req, res));

// Models endpoint
router.get('/models', (req, res) => modelsController.getModels(req, res));

// Health endpoint
router.get('/health', (req, res) => healthController.getHealth(req, res));

// Tool endpoint — DISABLED in production to prevent remote code execution
if (process.env.NODE_ENV !== 'production') {
  router.post('/tool/execute', toolLimiter, (req, res) => toolController.execute(req, res));
}

// Atlas widget endpoint
router.post('/widget/execute', toolLimiter, (req, res) => widgetController.execute(req, res));

// DFFE Environmental Knowledge & RAG endpoints (UNEP EnvironmentGPT-aligned filtering, 3-Phase FM/IM Sensitivity & Agent Studio)
router.get('/dffe/corpus', (req, res) => {
  res.json(dffeRagService.getMetadata());
});

router.get('/dffe/search', toolLimiter, (req, res) => {
  const result = dffeRagService.searchKnowledge({
    query: req.query.q || req.query.query || '',
    series: req.query.series || 'all',
    year: req.query.year || 'all',
    audience: req.query.audience || 'public',
    accessPhase: req.query.accessPhase || req.query.phase || null,
    limit: req.query.limit || 4
  });
  res.json(result);
});

router.post('/dffe/search', toolLimiter, (req, res) => {
  const body = req.body || {};
  const result = dffeRagService.searchKnowledge({
    query: body.query || body.q || '',
    series: body.series || 'all',
    year: body.year || 'all',
    audience: body.audience || 'public',
    accessPhase: body.accessPhase || body.phase || null,
    limit: body.limit || 4
  });
  res.json(result);
});

// DFFE Directorate Agent Studio & Self-Service URL/Document Grounding endpoints
router.get('/dffe/agents', (req, res) => {
  res.json({
    agents: dffeRagService.getDirectorateAgents(),
    phases: dffeRagService.getDeploymentPhases()
  });
});

router.post('/dffe/agents', toolLimiter, (req, res) => {
  const body = req.body || {};
  if (!body.name && !body.directorate) {
    return res.status(400).json({ error: 'Agent name or directorate is required.' });
  }
  const created = dffeRagService.createDirectorateAgent(body);
  res.status(201).json({
    status: 'created',
    ...created,
    agents: dffeRagService.getDirectorateAgents()
  });
});

router.post('/dffe/ground', toolLimiter, (req, res) => {
  const body = req.body || {};
  if (!body.title && !body.url && !body.content) {
    return res.status(400).json({ error: 'Source title, URL, or content is required for RAG grounding.' });
  }
  const doc = dffeRagService.groundCustomSource(body);
  res.status(201).json({
    status: 'grounded',
    document: doc,
    totalCorpusDocuments: dffeRagService.getAllDocuments().length
  });
});

// Deterministic NEMA Section 24 EIA & National Screening Tool endpoint
router.post('/dffe/eia-screen', toolLimiter, async (req, res) => {
  const result = await dffeEiaScreeningCapability.execute(req.body || {});
  res.json(result);
});

// Deterministic SAAQIS, SAWIC, Climate Change Act & EPWP Indicators endpoint
router.post('/dffe/indicators', toolLimiter, async (req, res) => {
  const result = await dffeIndicatorsCapability.execute(req.body || {});
  res.json(result);
});

// Read-Aloud Text-to-Speech (ElevenLabs Free Tier API alongside Browser/Google Speech)
router.get('/tts/voices', (req, res) => {
  res.json({
    configured: elevenlabsService.isConfigured(),
    voices: elevenlabsService.getVoices()
  });
});

router.post('/tts/speak', toolLimiter, async (req, res) => {
  try {
    const rawText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const voiceId = typeof req.body?.voiceId === 'string' ? req.body.voiceId.trim() : elevenlabsService.DEFAULT_VOICE_ID;

    if (!rawText) {
      return res.status(400).json({ error: 'Text is required for speech synthesis.' });
    }

    const cappedText = rawText.slice(0, 4500);
    const audioStream = await elevenlabsService.convertTextToSpeech(cappedText, voiceId);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');

    if (typeof audioStream.pipe === 'function') {
      audioStream.pipe(res);
    } else if (typeof Readable.fromWeb === 'function' && typeof audioStream.getReader === 'function') {
      Readable.fromWeb(audioStream).pipe(res);
    } else {
      Readable.from(audioStream).pipe(res);
    }
  } catch (err) {
    const status = err.statusCode || 502;
    if (!res.headersSent) {
      res.status(status).json({
        error: err.message || 'ElevenLabs speech synthesis failed.'
      });
    } else {
      res.end();
    }
  }
});

module.exports = router;
