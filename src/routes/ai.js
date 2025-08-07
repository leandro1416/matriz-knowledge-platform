import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import { syncBlockMiddleware } from '../middlewares/obsidianSync.middleware.js';
import { askAI, getAIStatus, getAIChain, searchAIHistory, rateAIResponse, backupBlockchain, forceBlockchainSave } from '../controllers/ai.controller.js';

const router = Router();

router.post('/ask', auth, syncBlockMiddleware, askAI);
router.post('/test', syncBlockMiddleware, askAI); // Rota de teste sem autenticação
router.get('/status', getAIStatus);
router.get('/chain', auth, getAIChain);
router.get('/search', auth, searchAIHistory);
router.post('/:hash/rate', auth, rateAIResponse);
router.post('/blockchain/backup', auth, backupBlockchain);
router.post('/blockchain/save', auth, forceBlockchainSave);

export default router; 