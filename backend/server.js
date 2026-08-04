import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import drugRoutes from './routes/drugRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors());

// اتصال مسیرهای API
app.use('/api/drugs', drugRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.send('API سیستم انبارداری داروخانه فعال است 🚀');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});