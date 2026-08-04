import express from 'express';
import {
  getWeeklyOutboundReport,
  getMonthlyOutboundReport,
  getWeeklyInboundReport,
  getMonthlyInboundReport,
} from '../controllers/reportController.js';

const router = express.Router();

router.get('/weekly', getWeeklyOutboundReport);
router.get('/monthly', getMonthlyOutboundReport);
router.get('/inbound/weekly', getWeeklyInboundReport);
router.get('/inbound/monthly', getMonthlyInboundReport);

export default router;