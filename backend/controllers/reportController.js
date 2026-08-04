import Outbound from '../models/Outbound.js';
import Inbound from '../models/Inbound.js';

// گزارش خروج هفتگی
export const getWeeklyOutboundReport = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await Outbound.find({ createdAt: { $gte: sevenDaysAgo } })
      .populate('drug', 'name brand dosageForm dose')
      .sort({ createdAt: -1 });

    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت گزارش خروج هفتگی', error: error.message });
  }
};

// گزارش خروج ماهانه
export const getMonthlyOutboundReport = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await Outbound.find({ createdAt: { $gte: thirtyDaysAgo } })
      .populate('drug', 'name brand dosageForm dose')
      .sort({ createdAt: -1 });

    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت گزارش خروج ماهانه', error: error.message });
  }
};

// گزارش ورود هفتگی
export const getWeeklyInboundReport = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await Inbound.find({ createdAt: { $gte: sevenDaysAgo } })
      .populate('drug', 'name brand dosageForm dose')
      .sort({ createdAt: -1 });

    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت گزارش ورود هفتگی', error: error.message });
  }
};

// گزارش ورود ماهانه
export const getMonthlyInboundReport = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await Inbound.find({ createdAt: { $gte: thirtyDaysAgo } })
      .populate('drug', 'name brand dosageForm dose')
      .sort({ createdAt: -1 });

    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت گزارش ورود ماهانه', error: error.message });
  }
};