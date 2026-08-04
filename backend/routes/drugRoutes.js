import express from 'express';
import { 
  addDrugOrInbound, getDrugsList, previewWithdrawal, confirmWithdrawal, 
  updateDrug, deleteDrug, adjustStock, getTodayStats, getDrugHistory 
} from '../controllers/drugController.js';

const router = express.Router();

router.get('/today-stats', getTodayStats); // آمار آمار امروز
router.get('/:id/history', getDrugHistory); // تاریخچه کامل یک دارو
router.post('/', addDrugOrInbound);
router.get('/', getDrugsList);
router.put('/:id', updateDrug);
router.delete('/:id', deleteDrug);
router.post('/adjust', adjustStock);
router.post('/withdraw-preview', previewWithdrawal);
router.post('/withdraw-confirm', confirmWithdrawal);

export default router;