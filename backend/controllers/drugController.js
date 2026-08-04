import Drug from '../models/Drug.js';
import Inbound from '../models/Inbound.js';
import Outbound from '../models/Outbound.js';

const calculateExpiryStatus = (expiryDate, dosageForm) => {
  const today = new Date();
  const exp = new Date(expiryDate);
  const diffTime = exp - today;
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isInjectable = ['آمپول', 'ویال', 'سرم'].includes(dosageForm);

  let status = 'GREEN';
  if (isInjectable) {
    if (totalDays < 180) status = 'RED';
    else if (totalDays <= 365) status = 'YELLOW';
  } else {
    if (totalDays < 365) status = 'RED';
    else if (totalDays <= 730) status = 'YELLOW';
  }

  let text = '';
  if (totalDays <= 0) {
    text = 'منقضی شده';
  } else {
    const years = Math.floor(totalDays / 365);
    const remainingDaysAfterYears = totalDays % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);
    const days = remainingDaysAfterYears % 30;

    if (years > 0) {
      text = months > 0 ? `${years} سال و ${months} ماه مانده` : `${years} سال مانده`;
    } else if (months > 0) {
      text = days > 0 ? `${months} ماه و ${days} روز مانده` : `${months} ماه مانده`;
    } else {
      text = `${totalDays} روز مانده`;
    }
  }

  return { totalDays, text, status };
};

export const getTodayStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayInbounds = await Inbound.find({ createdAt: { $gte: startOfToday } });
    const todayOutbounds = await Outbound.find({ createdAt: { $gte: startOfToday } });

    const todayInCount = todayInbounds.reduce((acc, curr) => acc + curr.initialQuantity, 0);
    const todayOutCount = todayOutbounds.reduce((acc, curr) => acc + curr.totalQuantity, 0);

    res.status(200).json({ todayInCount, todayOutCount });
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت آمار امروز', error: error.message });
  }
};

export const getDrugHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const drug = await Drug.findById(id);
    if (!drug) return res.status(404).json({ message: 'دارو یافت نشد' });

    const inbounds = await Inbound.find({ drug: id }).sort({ createdAt: -1 });
    const outbounds = await Outbound.find({ drug: id }).sort({ createdAt: -1 });

    const history = [
      ...inbounds.map((i) => ({
        type: 'IN',
        quantity: i.initialQuantity,
        remaining: i.quantity,
        date: i.createdAt,
        expiryDate: i.expiryDate,
        notes: 'ورود به انبار',
      })),
      ...outbounds.map((o) => ({
        type: 'OUT',
        quantity: o.totalQuantity,
        date: o.createdAt,
        notes: o.notes || 'خروج از انبار',
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({ drug, history });
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت تاریخچه دارو', error: error.message });
  }
};

export const addDrugOrInbound = async (req, res) => {
  try {
    const { name, brand, dosageForm, unit, dose, location, minQuantity, expiryDate, quantity } = req.body;

    const cleanName = name ? name.trim() : '';
    const cleanBrand = brand && brand.trim() !== '' ? brand.trim() : 'نامشخص';
    const cleanDose = dose ? dose.trim() : '-';
    const cleanForm = dosageForm ? dosageForm.trim() : 'قرص';
    const numMin = Number(minQuantity) > 0 ? Number(minQuantity) : 10;

    let drug = await Drug.findOne({
      name: { $regex: `^${cleanName}$`, $options: 'i' },
      dose: { $regex: `^${cleanDose}$`, $options: 'i' },
      dosageForm: cleanForm,
    });

    if (!drug) {
      drug = await Drug.create({
        name: cleanName,
        brand: cleanBrand,
        dosageForm: cleanForm,
        unit: unit || 'عدد',
        dose: cleanDose,
        location: location ? location.trim() : 'نامشخص',
        minQuantity: numMin,
      });
    } else {
      if (minQuantity) drug.minQuantity = numMin;
      if (location && location !== 'نامشخص') drug.location = location.trim();
      if (brand && brand.trim() !== '') drug.brand = brand.trim();
      if (unit) drug.unit = unit;
      await drug.save();
    }

    const inbound = await Inbound.create({
      drug: drug._id,
      expiryDate: new Date(expiryDate),
      initialQuantity: Number(quantity),
      quantity: Number(quantity),
    });

    res.status(201).json({ message: 'ورود دارو با موفقیت ثبت گردید', drug, inbound });
  } catch (error) {
    console.error('Error in addDrugOrInbound:', error);
    res.status(400).json({ message: 'خطا در ثبت ورود دارو', error: error.message });
  }
};

// دریافت لیست داروها با فیلتر هوشمند کارت‌های داشبورد
export const getDrugsList = async (req, res) => {
  try {
    const { search, dosageForm, categoryFilter, expiryBefore, sortBy } = req.query;
    let drugQuery = {};

    if (search) {
      drugQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { dosageForm: { $regex: search, $options: 'i' } },
      ];
    }

    if (dosageForm) drugQuery.dosageForm = dosageForm;

    const drugs = await Drug.find(drugQuery);

    let drugsWithDetails = await Promise.all(
      drugs.map(async (drug) => {
        let inboundQuery = { drug: drug._id, quantity: { $gt: 0 } };
        if (expiryBefore) {
          inboundQuery.expiryDate = { $lte: new Date(expiryBefore) };
        }

        const inbounds = await Inbound.find(inboundQuery).sort({ expiryDate: 1 });
        const totalQuantity = inbounds.reduce((acc, curr) => acc + curr.quantity, 0);

        let nearestExpiry = null;
        let expiryInfo = { totalDays: 0, text: 'بدون موجودی', status: 'GREEN' };

        if (inbounds.length > 0) {
          nearestExpiry = inbounds[0].expiryDate;
          expiryInfo = calculateExpiryStatus(nearestExpiry, drug.dosageForm);
        }

        const entries = inbounds.map((item) => {
          const info = calculateExpiryStatus(item.expiryDate, drug.dosageForm);
          return {
            _id: item._id,
            expiryDate: item.expiryDate,
            quantity: item.quantity,
            inboundDate: item.inboundDate,
            daysRemainingText: info.text,
            status: info.status,
          };
        });

        const isLowStock = totalQuantity <= drug.minQuantity;

        return {
          _id: drug._id,
          name: drug.name,
          brand: drug.brand,
          dosageForm: drug.dosageForm,
          unit: drug.unit || 'عدد',
          dose: drug.dose,
          location: drug.location,
          minQuantity: drug.minQuantity,
          totalQuantity,
          nearestExpiry,
          expiryText: expiryInfo.text,
          expiryStatus: expiryInfo.status,
          isLowStock,
          entries,
          createdAt: drug.createdAt,
        };
      })
    );

    let result = drugsWithDetails.filter(d => d.entries.length > 0 || !expiryBefore);

    // کلیک روی کارت‌های فیلتر داشبورد
    if (categoryFilter === 'lowStock') {
      result = result.filter((d) => d.isLowStock);
    } else if (categoryFilter === 'expiringSoon') {
      result = result.filter((d) => d.expiryStatus === 'RED' || d.expiryStatus === 'YELLOW');
    } else if (categoryFilter === 'todayIn') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayInbounds = await Inbound.find({ createdAt: { $gte: startOfToday } });
      const drugIds = new Set(todayInbounds.map(i => i.drug.toString()));
      result = result.filter((d) => drugIds.has(d._id.toString()));
    } else if (categoryFilter === 'todayOut') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayOutbounds = await Outbound.find({ createdAt: { $gte: startOfToday } });
      const drugIds = new Set(todayOutbounds.map(o => o.drug.toString()));
      result = result.filter((d) => drugIds.has(d._id.toString()));
    }

    if (sortBy === 'stockDesc') {
      result.sort((a, b) => b.totalQuantity - a.totalQuantity);
    } else if (sortBy === 'stockAsc') {
      result.sort((a, b) => a.totalQuantity - b.totalQuantity);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      result.sort((a, b) => {
        if (!a.nearestExpiry) return 1;
        if (!b.nearestExpiry) return -1;
        return new Date(a.nearestExpiry) - new Date(b.nearestExpiry);
      });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت لیست داروها', error: error.message });
  }
};

export const adjustStock = async (req, res) => {
  try {
    const { inboundId, newQuantity, reason } = req.body;
    const inbound = await Inbound.findById(inboundId);
    if (!inbound) return res.status(404).json({ message: 'سری ورود پیدا نشد' });

    const oldQty = inbound.quantity;
    const numNewQty = Number(newQuantity);
    const diff = oldQty - numNewQty;

    inbound.quantity = numNewQty;
    await inbound.save();

    if (diff > 0) {
      await Outbound.create({
        drug: inbound.drug,
        totalQuantity: diff,
        notes: `اصلاح موجودی (از ${oldQty} به ${numNewQty}) - علت: ${reason || 'نامشخص'}`,
        breakdown: [{ inboundId, expiryDate: inbound.expiryDate, quantityDeducted: diff }],
      });
    }

    res.status(200).json({ message: 'موجودی اصلاح شد', inbound });
  } catch (error) {
    res.status(400).json({ message: 'خطا در اصلاح موجودی', error: error.message });
  }
};

export const previewWithdrawal = async (req, res) => {
  try {
    const { drugId, requestedQuantity } = req.body;
    const drug = await Drug.findById(drugId);
    if (!drug) return res.status(404).json({ message: 'دارو یافت نشد' });

    const inbounds = await Inbound.find({ drug: drugId, quantity: { $gt: 0 } }).sort({ expiryDate: 1 });

    let remainingNeeded = Number(requestedQuantity);
    let breakdown = [];

    for (const item of inbounds) {
      if (remainingNeeded <= 0) break;
      const take = Math.min(item.quantity, remainingNeeded);
      breakdown.push({
        inboundId: item._id,
        expiryDate: item.expiryDate,
        quantityDeducted: take,
      });
      remainingNeeded -= take;
    }

    if (remainingNeeded > 0) return res.status(400).json({ message: 'موجودی کافی نیست!' });

    res.status(200).json({ drugName: drug.name, requestedQuantity: Number(requestedQuantity), breakdown });
  } catch (error) {
    res.status(400).json({ message: 'خطا در پیش‌نمایش خروج', error: error.message });
  }
};

export const confirmWithdrawal = async (req, res) => {
  try {
    const { drugId, totalQuantity, notes, breakdown } = req.body;
    for (const item of breakdown) {
      await Inbound.findByIdAndUpdate(item.inboundId, { $inc: { quantity: -item.quantityDeducted } });
    }
    const outbound = await Outbound.create({
      drug: drugId,
      totalQuantity: Number(totalQuantity),
      notes: notes || '',
      breakdown,
    });
    res.status(200).json({ message: 'خروج دارو ثبت شد', outbound });
  } catch (error) {
    res.status(400).json({ message: 'خطا در ثبت نهایی خروج', error: error.message });
  }
};

export const updateDrug = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, dosageForm, unit, dose, location, minQuantity } = req.body;
    const drug = await Drug.findByIdAndUpdate(
      id, 
      { name, brand, dosageForm, unit, dose, location, minQuantity: Number(minQuantity) }, 
      { new: true }
    );
    res.status(200).json({ message: 'دارو ویرایش شد', drug });
  } catch (error) {
    res.status(400).json({ message: 'خطا در ویرایش دارو', error: error.message });
  }
};

export const deleteDrug = async (req, res) => {
  try {
    const { id } = req.params;
    await Drug.findByIdAndDelete(id);
    await Inbound.deleteMany({ drug: id });
    await Outbound.deleteMany({ drug: id });
    res.status(200).json({ message: 'دارو حذف شد' });
  } catch (error) {
    res.status(400).json({ message: 'خطا در حذف دارو', error: error.message });
  }
};