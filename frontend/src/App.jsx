import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Pill, PlusCircle, LogOut, Search, AlertTriangle, ShieldAlert, 
  PackageCheck, Sun, Moon, ChevronDown, ChevronUp, Edit3, Trash2,
  FileText, Layers, CheckCircle2, KeyRound, TrendingDown, TrendingUp, 
  SlidersHorizontal, Wrench, X, History, FileSpreadsheet, Printer, AlertOctagon, Filter
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

function CustomSelect({ options, value, onChange, placeholder, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block text-right">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2.5 px-4 py-2.5 rounded-2xl border bg-slate-900/90 border-slate-800 text-xs font-semibold hover:border-emerald-500/50 transition duration-200 shadow-sm cursor-pointer whitespace-nowrap min-w-[150px]"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-emerald-400" />}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-400' : 'opacity-50'}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl border bg-slate-900/95 border-slate-800 shadow-2xl p-2 z-50 modal-box backdrop-blur-md">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-right px-3.5 py-2.5 text-xs rounded-xl transition flex items-center justify-between cursor-pointer my-0.5 ${
                value === option.value
                  ? 'bg-emerald-600/20 text-emerald-400 font-bold border border-emerald-500/30'
                  : 'hover:bg-slate-800/80 text-slate-300'
              }`}
            >
              <span>{option.label}</span>
              {value === option.value && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [storedPassword, setStoredPassword] = useState(() => localStorage.getItem('appPassword') || '123456');

  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [drugs, setDrugs] = useState([]);
  const [todayStats, setTodayStats] = useState({ todayInCount: 0, todayOutCount: 0 });
  const [search, setSearch] = useState('');
  const [dosageFilter, setDosageFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [expiryBeforeDate, setExpiryBeforeDate] = useState('');
  const [sortBy, setSortBy] = useState('expiryAsc');

  const [expandedDrugId, setExpandedDrugId] = useState(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedDrugHistory, setSelectedDrugHistory] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDrug, setNewDrug] = useState({
    name: '', brand: '', dosageForm: 'قرص', unit: 'عدد', dose: '',
    expiryDate: '', quantity: '', location: '', minQuantity: 10
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [drugToDelete, setDrugToDelete] = useState(null);

  const [isAdjustModalOpen, setIsEditAdjustOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({ inboundId: null, oldQty: 0, newQty: '', reason: '' });

  const [isOutModalOpen, setIsOutModalOpen] = useState(false);
  const [selectedDrugForOut, setSelectedDrugForOut] = useState(null);
  const [requestedQty, setRequestedQty] = useState(1);
  const [outNotes, setOutNotes] = useState('');
  const [previewData, setPreviewData] = useState(null);

  const [reportCategory, setReportCategory] = useState('outbound');
  const [reportType, setReportType] = useState('weekly');
  const [reportData, setReportData] = useState(null);

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');

  const sortOptions = [
    { value: 'expiryAsc', label: '⏳ نزدیک‌ترین انقضا (FEFO)' },
    { value: 'stockDesc', label: '📈 بیشترین موجودی' },
    { value: 'stockAsc', label: '📉 کمترین موجودی' },
    { value: 'newest', label: '✨ جدیدترین ورود' },
  ];

  const dosageOptions = [
    { value: '', label: 'همه اشکال دارویی' },
    { value: 'قرص', label: '💊 قرص' },
    { value: 'کپسول', label: '💊 کپسول' },
    { value: 'آمپول', label: '💉 آمپول' },
    { value: 'ویال', label: '🧪 ویال' },
    { value: 'سرم', label: '🩸 سرم' },
    { value: 'شربت', label: '🧴 شربت' },
    { value: 'قطره', label: '💧 قطره' },
  ];

  const categoryOptions = [
    { value: '', label: 'همه وضعیت‌ها' },
    { value: 'lowStock', label: '🔴 نیاز به سفارش (کم موجود)' },
    { value: 'expiringSoon', label: '🟡 / 🔴 نزدیک به انقضا' },
    { value: 'todayIn', label: '🟢 ورودی‌های امروز' },
    { value: 'todayOut', label: '🔴 خروجی‌های امروز' },
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    if (usernameInput === 'admin' && passwordInput === storedPassword) {
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      showToast('خوش آمدید! ورود موفقیت‌آمیز بود');
    } else {
      showToast('نام کاربری یا رمز عبور اشتباه است!', 'error');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    showToast('از حساب کاربری خارج شدید', 'error');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (oldPass !== storedPassword) {
      showToast('رمز عبور فعلی اشتباه است', 'error');
      return;
    }
    setStoredPassword(newPass);
    localStorage.setItem('appPassword', newPass);
    setOldPass(''); setNewPass('');
    showToast('رمز عبور با موفقیت تغییر یافت');
    setActiveTab('inventory');
  };

  const fetchDrugs = async () => {
    try {
      let url = `${API_URL}/drugs?search=${search}&sortBy=${sortBy}`;
      if (dosageFilter) url += `&dosageForm=${dosageFilter}`;
      if (categoryFilter) url += `&categoryFilter=${categoryFilter}`;
      if (expiryBeforeDate) url += `&expiryBefore=${expiryBeforeDate}`;
      const response = await axios.get(url);
      setDrugs(response.data);

      const statsRes = await axios.get(`${API_URL}/drugs/today-stats`);
      setTodayStats(statsRes.data);
    } catch (error) {
      console.error('خطا در دریافت داروها:', error);
    }
  };

  const fetchReport = async () => {
    try {
      const endpoint = reportCategory === 'inbound' ? `reports/inbound/${reportType}` : `reports/${reportType}`;
      const response = await axios.get(`${API_URL}/${endpoint}`);
      setReportData(response.data);
    } catch (error) {
      console.error('خطا در دریافت گزارشات:', error);
    }
  };

  const exportToExcel = () => {
    if (drugs.length === 0) return showToast('هیچ دارویی برای خروجی وجود ندارد', 'error');
    
    const headers = "نام دارو,نام برند,شکل دارو,واحد,موجودی کل,حداقل موجودی مجاز,موقعیت قفسه\n";
    const rows = drugs.map(d => `"${d.name}","${d.brand}","${d.dosageForm}","${d.unit}",${d.totalQuantity},${d.minQuantity},"${d.location}"`).join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `گزارش_انبار_داروخانه_${new Date().toLocaleDateString('fa-IR')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('فایل اکسل با موفقیت دانلود شد');
  };

  const handlePrint = () => {
    window.print();
  };

  const openDrugHistory = async (drugId) => {
    try {
      const res = await axios.get(`${API_URL}/drugs/${drugId}/history`);
      setSelectedDrugHistory(res.data);
      setIsHistoryModalOpen(true);
    } catch (error) {
      showToast('خطا در دریافت تاریخچه دارو', 'error');
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      if (activeTab === 'inventory') fetchDrugs();
      else if (activeTab === 'reports') fetchReport();
    }
  }, [search, dosageFilter, categoryFilter, expiryBeforeDate, sortBy, activeTab, reportCategory, reportType, isLoggedIn]);

  const handleAddDrug = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/drugs`, newDrug);
      setIsAddModalOpen(false);
      setNewDrug({
        name: '', brand: '', dosageForm: 'قرص', unit: 'عدد', dose: '',
        expiryDate: '', quantity: '', location: '', minQuantity: 10
      });
      fetchDrugs();
      showToast('ورود دارو با موفقیت ثبت شد');
    } catch (error) {
      showToast(error.response?.data?.message || error.message, 'error');
    }
  };

  const handleUpdateDrug = async (e) => {
    e.preventDefault();
    if (!editingDrug) return;
    try {
      await axios.put(`${API_URL}/drugs/${editingDrug._id}`, editingDrug);
      setIsEditModalOpen(false);
      setEditingDrug(null);
      fetchDrugs();
      showToast('اطلاعات دارو با موفقیت ویرایش شد');
    } catch (error) {
      showToast(error.response?.data?.message || error.message, 'error');
    }
  };

  const handleConfirmAdjustment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/drugs/adjust`, {
        inboundId: adjustData.inboundId,
        newQuantity: Number(adjustData.newQty),
        reason: adjustData.reason
      });
      setIsEditAdjustOpen(false);
      fetchDrugs();
      showToast('موجودی با موفقیت اصلاح گردید');
    } catch (error) {
      showToast(error.response?.data?.message || error.message, 'error');
    }
  };

  const confirmDeleteDrug = async () => {
    if (!drugToDelete) return;
    try {
      await axios.delete(`${API_URL}/drugs/${drugToDelete._id}`);
      setIsDeleteModalOpen(false);
      setDrugToDelete(null);
      fetchDrugs();
      showToast('دارو با موفقیت حذف شد', 'error');
    } catch (error) {
      showToast(error.response?.data?.message || error.message, 'error');
    }
  };

  const handlePreviewOutbound = async (e) => {
    e.preventDefault();
    if (!selectedDrugForOut) return;
    try {
      const response = await axios.post(`${API_URL}/drugs/withdraw-preview`, {
        drugId: selectedDrugForOut._id,
        requestedQuantity: Number(requestedQty)
      });
      setPreviewData(response.data);
    } catch (error) {
      showToast(error.response?.data?.message || error.message, 'error');
    }
  };

  const handleConfirmOutbound = async () => {
    if (!previewData) return;
    try {
      await axios.post(`${API_URL}/drugs/withdraw-confirm`, {
        drugId: selectedDrugForOut._id,
        totalQuantity: previewData.requestedQuantity,
        notes: outNotes,
        breakdown: previewData.breakdown
      });
      setIsOutModalOpen(false);
      setSelectedDrugForOut(null);
      setPreviewData(null);
      setRequestedQty(1);
      setOutNotes('');
      fetchDrugs();
      showToast('خروج دارو ثبت شد');
    } catch (error) {
      showToast(error.response?.data?.message || error.message, 'error');
    }
  };

  const renderExpiryBadge = (status, text) => {
    let colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (status === 'RED') colorClass = 'bg-red-500/10 text-red-400 border-red-500/30';
    else if (status === 'YELLOW') colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';

    return <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${colorClass}`}>{text}</span>;
  };

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 dir-rtl ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
        <div className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl modal-box ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-emerald-600 text-white rounded-2xl shadow-lg mb-4">
              <Pill className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black">ورود به سیستم انبارداری</h1>
            <p className="text-xs opacity-60 mt-1">ویژه انباردار داروخانه</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold opacity-70">نام کاربری</label>
              <input required type="text" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} className={`w-full border p-3 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} placeholder="admin" />
            </div>
            <div>
              <label className="text-xs font-semibold opacity-70">رمز عبور</label>
              <input required type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className={`w-full border p-3 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition cursor-pointer">
              ورود به سامانه انبار
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalStockCount = drugs.reduce((acc, d) => acc + d.totalQuantity, 0);
  const lowStockCount = drugs.filter(d => d.isLowStock).length;
  // اصلاح شمارش کارت نزدیک به انقضا (شامل هر دو وضعیت RED و YELLOW)
  const criticalExpCount = drugs.filter(d => d.expiryStatus === 'RED' || d.expiryStatus === 'YELLOW').length;

  return (
    <div className={`min-h-screen dir-rtl p-4 md:p-6 font-sans relative transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* پیام توست انیمیشن‌دار */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 px-5 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 text-sm font-bold toast-box ${
          toast.type === 'error' ? 'bg-red-600 text-white border-red-500' : 'bg-emerald-600 text-white border-emerald-500'
        }`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}><X className="w-4 h-4 cursor-pointer" /></button>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        
        {/* هدر */}
        <header className={`flex flex-col md:flex-row justify-between items-center p-6 rounded-2xl border mb-6 gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg">
              <Pill className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black">سیستم انبارداری داروخانه</h1>
              <p className="text-xs opacity-60 mt-0.5">انباردار آنلاین: <span className="text-emerald-400 font-bold">مدیر انبار (Admin)</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button onClick={exportToExcel} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer">
              <FileSpreadsheet className="w-4 h-4" /> خروجی اکسل
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer">
              <Printer className="w-4 h-4" /> چاپ لیست
            </button>

            <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-xl border transition cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-100 border-slate-200'}`}>
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg cursor-pointer">
              <PlusCircle className="w-5 h-5" />
              ثبت ورود دارو
            </button>

            <button onClick={handleLogout} className="p-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer" title="خروج از حساب">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* منوی تب‌ها */}
        <div className="flex border-b border-slate-800 mb-6 gap-2 overflow-x-auto">
          <button onClick={() => setActiveTab('inventory')} className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 cursor-pointer transition whitespace-nowrap ${activeTab === 'inventory' ? 'border-emerald-500 text-emerald-400' : 'border-transparent opacity-60'}`}>
            <PackageCheck className="w-4 h-4" /> انبار و موجودی داروها
          </button>
          <button onClick={() => setActiveTab('reports')} className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 cursor-pointer transition whitespace-nowrap ${activeTab === 'reports' ? 'border-emerald-500 text-emerald-400' : 'border-transparent opacity-60'}`}>
            <FileText className="w-4 h-4" /> گزارشات (ورودی و خروجی)
          </button>
          <button onClick={() => setActiveTab('password')} className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 cursor-pointer transition whitespace-nowrap ${activeTab === 'password' ? 'border-emerald-500 text-emerald-400' : 'border-transparent opacity-60'}`}>
            <KeyRound className="w-4 h-4" /> تغییر رمز عبور
          </button>
        </div>

        {/* ================= تب ۱: انبار ================= */}
        {activeTab === 'inventory' && (
          <div className="accordion-box">
            {/* کارت‌های کلیک‌پذیر داشبورد با انیمیشن و شمارش دقیق */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <div 
                onClick={() => setCategoryFilter('')} 
                className={`p-4 rounded-2xl border transition cursor-pointer hover:border-emerald-500 hover:scale-[1.02] ${categoryFilter === '' ? 'border-emerald-500 bg-emerald-500/10' : darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
              >
                <span className="text-[11px] opacity-60">تنوع دارویی</span>
                <h3 className="text-xl font-black mt-1">{drugs.length} قلم</h3>
              </div>

              <div 
                onClick={() => setCategoryFilter('')} 
                className={`p-4 rounded-2xl border transition cursor-pointer hover:border-emerald-500 hover:scale-[1.02] ${categoryFilter === '' ? 'border-emerald-500 bg-emerald-500/10' : darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
              >
                <span className="text-[11px] opacity-60">موجودی کل انبار</span>
                <h3 className="text-xl font-black text-emerald-400 mt-1">{totalStockCount.toLocaleString()} عدد</h3>
              </div>

              <div 
                onClick={() => setCategoryFilter('lowStock')} 
                className={`p-4 rounded-2xl border transition cursor-pointer hover:border-red-500 hover:scale-[1.02] ${categoryFilter === 'lowStock' ? 'border-red-500 bg-red-500/10' : darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
              >
                <span className="text-[11px] opacity-60">🔴 نیازمند سفارش</span>
                <h3 className="text-xl font-black text-red-400 mt-1">{lowStockCount} دارو</h3>
              </div>

              <div 
                onClick={() => setCategoryFilter('expiringSoon')} 
                className={`p-4 rounded-2xl border transition cursor-pointer hover:border-amber-500 hover:scale-[1.02] ${categoryFilter === 'expiringSoon' ? 'border-amber-500 bg-amber-500/10' : darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
              >
                <span className="text-[11px] opacity-60">🟡 / 🔴 نزدیک به انقضا</span>
                <h3 className="text-xl font-black text-amber-400 mt-1">{criticalExpCount} دارو</h3>
              </div>

              <div 
                onClick={() => setCategoryFilter('todayIn')} 
                className={`p-4 rounded-2xl border transition cursor-pointer hover:border-emerald-500 hover:scale-[1.02] ${categoryFilter === 'todayIn' ? 'border-emerald-500 bg-emerald-500/10' : darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
              >
                <span className="text-[11px] opacity-60">🟢 ورودی امروز</span>
                <h3 className="text-xl font-black text-emerald-400 mt-1">{todayStats.todayInCount} عدد</h3>
              </div>

              <div 
                onClick={() => setCategoryFilter('todayOut')} 
                className={`p-4 rounded-2xl border transition cursor-pointer hover:border-red-500 hover:scale-[1.02] ${categoryFilter === 'todayOut' ? 'border-red-500 bg-red-500/10' : darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
              >
                <span className="text-[11px] opacity-60">🔴 خروجی امروز</span>
                <h3 className="text-xl font-black text-red-400 mt-1">{todayStats.todayOutCount} عدد</h3>
              </div>
            </div>

            {/* فیلترها و سرچ */}
            <div className={`p-4 rounded-2xl border mb-6 flex flex-col md:flex-row gap-4 items-center justify-between ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="relative w-full md:w-80">
                <Search className="absolute right-3.5 top-3 w-4 h-4 opacity-40" />
                <input type="text" placeholder="جستجوی نام دارو، نام برند..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full pr-10 pl-4 py-2 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <CustomSelect
                  options={sortOptions}
                  value={sortBy}
                  onChange={setSortBy}
                  placeholder="مرتب‌سازی"
                  icon={SlidersHorizontal}
                />

                <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border bg-slate-900/90 border-slate-800 text-xs">
                  <span className="opacity-60 whitespace-nowrap">انقضا تا:</span>
                  <input type="date" value={expiryBeforeDate} onChange={(e) => setExpiryBeforeDate(e.target.value)} className="bg-transparent focus:outline-none text-xs text-emerald-400" />
                  {expiryBeforeDate && <button onClick={() => setExpiryBeforeDate('')} className="text-xs text-red-400 hover:underline px-1 cursor-pointer">✕</button>}
                </div>

                <CustomSelect
                  options={dosageOptions}
                  value={dosageFilter}
                  onChange={setDosageFilter}
                  placeholder="شکل دارویی"
                  icon={Filter}
                />

                <CustomSelect
                  options={categoryOptions}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  placeholder="وضعیت انبار"
                />
              </div>
            </div>

            {/* جدول آکاردئونی داروها */}
            <div className={`rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <table dir="rtl" className="w-full text-right text-sm border-collapse">
                <thead className={`sticky top-0 z-20 text-xs uppercase border-b shadow-md ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                  <tr>
                    <th className="p-4 text-right">دارو / نام برند / دوز</th>
                    <th className="p-4 text-right">شکل / واحد</th>
                    <th className="p-4 text-right">موجودی کل</th>
                    <th className="p-4 text-right">وضعیت موجودی</th>
                    <th className="p-4 text-right">نزدیک‌ترین انقضا (FEFO)</th>
                    <th className="p-4 text-right">موقعیت</th>
                    <th className="p-4 text-center">عملیات</th>
                  </tr>
                </thead>

                <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                  {drugs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center p-8 opacity-50">هیچ دارویی یافت نشد.</td>
                    </tr>
                  ) : (
                    drugs.map((drug) => {
                      const isExpanded = expandedDrugId === drug._id;
                      return (
                        <React.Fragment key={drug._id}>
                          <tr 
                            onClick={() => setExpandedDrugId(isExpanded ? null : drug._id)}
                            className={`transition cursor-pointer select-none ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}
                          >
                            <td className="p-4 text-right">
                              <div className="flex items-center gap-2">
                                <button className="p-1 rounded-lg border border-slate-700">
                                  {isExpanded ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
                                </button>
                                <div>
                                  <span className="font-bold text-base">{drug.name}</span>
                                  <div className="text-xs opacity-60">نام برند: {drug.brand} | دوز: {drug.dose}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <span className="px-2.5 py-1 rounded-lg text-xs border bg-slate-800/50">
                                {drug.dosageForm} ({drug.unit})
                              </span>
                            </td>
                            <td className="p-4 text-right font-black">{drug.totalQuantity} {drug.unit}</td>
                            <td className="p-4 text-right">
                              {drug.isLowStock ? (
                                <span className="text-xs px-2.5 py-1 rounded-lg border font-bold bg-red-500/10 text-red-400 border-red-500/30 animate-pulse" title={`حداقل موجودی مجاز: ${drug.minQuantity} ${drug.unit}`}>
                                  🔴 نیاز به سفارش (زیر {drug.minQuantity})
                                </span>
                              ) : (
                                <span className="text-xs px-2.5 py-1 rounded-lg border font-medium bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                  🟢 کافی (حد مجاز: {drug.minQuantity})
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              {drug.entries.length > 0 ? renderExpiryBadge(drug.expiryStatus, drug.expiryText) : <span className="text-xs opacity-40">بدون موجودی</span>}
                            </td>
                            <td className="p-4 text-right text-xs font-mono">{drug.location}</td>
                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-2">
                                <button disabled={drug.totalQuantity === 0} onClick={() => { setSelectedDrugForOut(drug); setIsOutModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                                  <LogOut className="w-3.5 h-3.5" /> خروج FEFO
                                </button>
                                <button onClick={() => openDrugHistory(drug._id)} className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-blue-400 cursor-pointer" title="تاریخچه کامل این دارو">
                                  <History className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { setEditingDrug(drug); setIsEditModalOpen(true); }} className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-amber-400 cursor-pointer" title="ویرایش دارو">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { setDrugToDelete(drug); setIsDeleteModalOpen(true); }} className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer" title="حذف دارو">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* جزئیات آکاردئونی */}
                          {isExpanded && (
                            <tr className={darkMode ? 'bg-slate-950/80' : 'bg-slate-50'}>
                              <td colSpan="7" className="p-4 pr-12 accordion-box">
                                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                  <h4 className="text-xs font-bold mb-3 text-emerald-400 flex items-center gap-1">
                                    <Layers className="w-4 h-4" /> لیست ورودهای فعال این دارو (به ترتیب خروج FEFO):
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {drug.entries.map((entry, idx) => (
                                      <div key={entry._id} className={`p-3 rounded-lg border text-xs ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex justify-between items-center font-bold mb-1">
                                          <span>ورود سری {idx + 1}</span>
                                          <span className="text-emerald-400">{entry.quantity} {drug.unit}</span>
                                        </div>
                                        <div className="opacity-60 mb-2">انقضا: {new Date(entry.expiryDate).toLocaleDateString('fa-IR')}</div>
                                        {renderExpiryBadge(entry.status, entry.daysRemainingText)}
                                        <button
                                          onClick={() => {
                                            setAdjustData({ inboundId: entry._id, oldQty: entry.quantity, newQty: entry.quantity, reason: '' });
                                            setIsEditAdjustOpen(true);
                                          }}
                                          className="mt-3 w-full py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 flex items-center justify-center gap-1 font-bold cursor-pointer"
                                        >
                                          <Wrench className="w-3 h-3" /> اصلاح موجودی / ضایعات
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= تب ۲: گزارشات ================= */}
        {activeTab === 'reports' && (
          <div className={`p-6 rounded-2xl border accordion-box ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <div>
                <h2 className="text-lg font-bold">گزارشات کامل انبار</h2>
                <p className="text-xs opacity-60 mt-1">مشاهده دقیق تاریخچه ورودی‌ها و خروجی‌های کالا</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className={`flex p-1 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                  <button onClick={() => setReportCategory('outbound')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${reportCategory === 'outbound' ? 'bg-red-600 text-white' : 'opacity-60'}`}>
                    🔴 گزارش خروجی‌ها
                  </button>
                  <button onClick={() => setReportCategory('inbound')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${reportCategory === 'inbound' ? 'bg-emerald-600 text-white' : 'opacity-60'}`}>
                    🟢 گزارش ورودی‌ها
                  </button>
                </div>

                <div className={`flex p-1 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                  <button onClick={() => setReportType('weekly')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${reportType === 'weekly' ? 'bg-slate-700 text-white' : 'opacity-60'}`}>
                    ۷ روز گذشته (هفتگی)
                  </button>
                  <button onClick={() => setReportType('monthly')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${reportType === 'monthly' ? 'bg-slate-700 text-white' : 'opacity-60'}`}>
                    ۳۰ روز گذشته (ماهانه)
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-right text-sm">
                <thead className={`text-xs border-b ${darkMode ? 'bg-slate-950 opacity-60' : 'bg-slate-50'}`}>
                  <tr>
                    <th className="p-4">نام دارو</th>
                    <th className="p-4">نام برند</th>
                    <th className="p-4">شکل دارو</th>
                    <th className="p-4">{reportCategory === 'inbound' ? 'تعداد ورودی' : 'تعداد خروجی'}</th>
                    <th className="p-4">{reportCategory === 'inbound' ? 'تاریخ انقضای ثبت‌شده' : 'علت / توضیحات'}</th>
                    <th className="p-4">تاریخ ثبت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {!reportData || reportData.logs.length === 0 ? (
                    <tr><td colSpan="6" className="text-center p-8 opacity-50">در این بازه هیچ تراکنشی ثبت نشده است.</td></tr>
                  ) : (
                    reportData.logs.map((log) => (
                      <tr key={log._id}>
                        <td className="p-4 font-bold">{log.drug ? log.drug.name : 'داروی حذف‌شده'}</td>
                        <td className="p-4 text-xs opacity-70">{log.drug ? log.drug.brand : '-'}</td>
                        <td className="p-4"><span className="px-2 py-0.5 rounded text-xs border">{log.drug ? log.drug.dosageForm : '-'}</span></td>
                        <td className="p-4 font-bold">
                          {reportCategory === 'inbound' ? (
                            <span className="text-emerald-400 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> {log.initialQuantity || log.quantity}</span>
                          ) : (
                            <span className="text-red-400 flex items-center gap-1"><TrendingDown className="w-4 h-4" /> {log.totalQuantity || log.quantity}</span>
                          )}
                        </td>
                        <td className="p-4 text-xs opacity-70">
                          {reportCategory === 'inbound' ? new Date(log.expiryDate).toLocaleDateString('fa-IR') : (log.notes || 'خروج عادی')}
                        </td>
                        <td className="p-4 text-xs dir-ltr text-right">{new Date(log.createdAt).toLocaleString('fa-IR')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= تب ۳: تغییر رمز ================= */}
        {activeTab === 'password' && (
          <div className={`max-w-md mx-auto p-6 rounded-2xl border accordion-box ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" /> تغییر رمز عبور انباردار
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold opacity-70">رمز عبور فعلی *</label>
                <input required type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} className={`w-full border p-2.5 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div>
                <label className="text-xs font-semibold opacity-70">رمز عبور جدید *</label>
                <input required type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className={`w-full border p-2.5 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition cursor-pointer">
                ذخیره رمز جدید
              </button>
            </form>
          </div>
        )}

        {/* ================= مودال اختصاصی تأیید حذف دارو ================= */}
        {isDeleteModalOpen && drugToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-backdrop">
            <div className={`rounded-2xl max-w-md w-full p-6 border shadow-2xl modal-box ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-3 text-red-400 mb-4">
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">تأیید حذف دارو</h3>
              </div>
              <p className="text-xs leading-relaxed opacity-80 mb-6">
                آیا از حذف کامل داروی <strong className="text-red-400 font-bold">«{drugToDelete.name} ({drugToDelete.brand})»</strong> و تمام سوابق ورود و خروج آن اطمینان دارید؟ این عملیات غیرقابل بازگشت است.
              </p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold opacity-70 cursor-pointer hover:bg-slate-800">
                  انصراف
                </button>
                <button type="button" onClick={confirmDeleteDrug} className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg">
                  حذف قطعی دارو
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= مودال تاریخچه اختصاصی دارو ================= */}
        {isHistoryModalOpen && selectedDrugHistory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-backdrop">
            <div className={`rounded-2xl max-w-xl w-full p-6 border shadow-2xl max-h-[85vh] overflow-y-auto modal-box ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-blue-400">
                  <History className="w-5 h-5" /> تاریخچه کامل داروی: {selectedDrugHistory.drug.name} ({selectedDrugHistory.drug.brand})
                </h2>
                <button onClick={() => setIsHistoryModalOpen(false)}><X className="w-5 h-5 opacity-60 cursor-pointer" /></button>
              </div>

              <div className="space-y-3">
                {selectedDrugHistory.history.length === 0 ? (
                  <p className="text-xs opacity-50 text-center py-6">هیچ تراکنشی ثبت نشده است.</p>
                ) : (
                  selectedDrugHistory.history.map((item, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border text-xs flex justify-between items-center ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div>
                        <div className="font-bold mb-1 flex items-center gap-1.5">
                          {item.type === 'IN' ? (
                            <span className="text-emerald-400 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> ورود: +{item.quantity} {selectedDrugHistory.drug.unit}</span>
                          ) : (
                            <span className="text-red-400 flex items-center gap-1"><TrendingDown className="w-4 h-4" /> خروج: -{item.quantity} {selectedDrugHistory.drug.unit}</span>
                          )}
                        </div>
                        <div className="opacity-60">{item.notes}</div>
                      </div>
                      <div className="text-left dir-ltr opacity-60">
                        {new Date(item.date).toLocaleString('fa-IR')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= مودال ثبت ورود داروی جدید ================= */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-backdrop">
            <div className={`rounded-2xl max-w-lg w-full p-6 border shadow-2xl modal-box ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-400">
                <PlusCircle className="w-5 h-5" /> ثبت ورود جدید به انبار
              </h2>
              <form onSubmit={handleAddDrug} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold opacity-70">نام عمومی دارو *</label>
                  <input required type="text" value={newDrug.name} onChange={(e) => setNewDrug({...newDrug, name: e.target.value})} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} placeholder="مثلا: استامینوفن" />
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-70">نام برند (اختیاری)</label>
                  <input type="text" value={newDrug.brand} onChange={(e) => setNewDrug({...newDrug, brand: e.target.value})} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} placeholder="مثلا: حکیم / عبیدی" />
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-70">شکل دارو *</label>
                  <select value={newDrug.dosageForm} onChange={(e) => setNewDrug({...newDrug, dosageForm: e.target.value})} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <option value="قرص">قرص</option>
                    <option value="کپسول">کپسول</option>
                    <option value="آمپول">آمپول</option>
                    <option value="ویال">ویال</option>
                    <option value="سرم">سرم</option>
                    <option value="پماد/کرم">پماد/کرم</option>
                    <option value="شربت">شربت</option>
                    <option value="قطره">قطره</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-70">واحد سنجش *</label>
                  <select value={newDrug.unit} onChange={(e) => setNewDrug({...newDrug, unit: e.target.value})} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <option value="عدد">عدد</option>
                    <option value="بسته">بسته</option>
                    <option value="ورق">ورق</option>
                    <option value="شیشه">شیشه</option>
                    <option value="تیوپ">تیوپ</option>
                    <option value="باکس">باکس</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-70">دوز دارو</label>
                  <input type="text" value={newDrug.dose} onChange={(e) => setNewDrug({...newDrug, dose: e.target.value})} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} placeholder="مثلا: 500mg" />
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-70">تعداد ورودی *</label>
                  <input required type="number" min="1" value={newDrug.quantity} onChange={(e) => setNewDrug({...newDrug, quantity: e.target.value})} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-70">تاریخ انقضا *</label>
                  <input required type="date" value={newDrug.expiryDate} onChange={(e) => setNewDrug({...newDrug, expiryDate: e.target.value})} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-70">موقعیت (قفسه)</label>
                  <input type="text" value={newDrug.location} onChange={(e) => setNewDrug({...newDrug, location: e.target.value})} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} placeholder="مثلا: A-3" />
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-70">حداقل موجودی مجاز (حد سفارش) *</label>
                  <input type="number" min="1" value={newDrug.minQuantity} onChange={(e) => setNewDrug({...newDrug, minQuantity: e.target.value})} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} placeholder="مثلا: 100" />
                </div>

                <div className="col-span-2 flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold opacity-70 cursor-pointer">انصراف</button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer">ثبت ورود</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= مودال ویرایش دارو ================= */}
        {isEditModalOpen && editingDrug && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-backdrop">
            <div className={`rounded-2xl max-w-lg w-full p-6 border shadow-2xl modal-box ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-amber-400">
                <Edit3 className="w-5 h-5" /> ویرایش اطلاعات دارو
              </h2>
              <form onSubmit={handleUpdateDrug} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold opacity-70">نام دارو *</label>
                  <input required type="text" value={editingDrug.name} onChange={(e) => setEditingDrug({...editingDrug, name: e.target.value})} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-70">نام برند (اختیاری)</label>
                  <input type="text" value={editingDrug.brand} onChange={(e) => setEditingDrug({...editingDrug, brand: e.target.value})} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-70">شکل دارو *</label>
                  <select value={editingDrug.dosageForm} onChange={(e) => setEditingDrug({...editingDrug, dosageForm: e.target.value})} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <option value="قرص">قرص</option>
                    <option value="کپسول">کپسول</option>
                    <option value="آمپول">آمپول</option>
                    <option value="ویال">ویال</option>
                    <option value="سرم">سرم</option>
                    <option value="پماد/کرم">پماد/کرم</option>
                    <option value="شربت">شربت</option>
                    <option value="قطره">قطره</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-70">واحد سنجش *</label>
                  <select value={editingDrug.unit} onChange={(e) => setEditingDrug({...editingDrug, unit: e.target.value})} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <option value="عدد">عدد</option>
                    <option value="بسته">بسته</option>
                    <option value="ورق">ورق</option>
                    <option value="شیشه">شیشه</option>
                    <option value="تیوپ">تیوپ</option>
                    <option value="باکس">باکس</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-70">دوز دارو</label>
                  <input type="text" value={editingDrug.dose} onChange={(e) => setEditingDrug({...editingDrug, dose: e.target.value})} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-70">موقعیت (قفسه)</label>
                  <input type="text" value={editingDrug.location} onChange={(e) => setEditingDrug({...editingDrug, location: e.target.value})} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-70">حداقل موجودی مجاز (حد سفارش) *</label>
                  <input type="number" min="1" value={editingDrug.minQuantity} onChange={(e) => setEditingDrug({...editingDrug, minQuantity: e.target.value})} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
                </div>

                <div className="col-span-2 flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold opacity-70 cursor-pointer">انصراف</button>
                  <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer">ذخیره تغییرات</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= مودال اصلاح موجودی ================= */}
        {isAdjustModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-backdrop">
            <div className={`rounded-2xl max-w-md w-full p-6 border shadow-2xl modal-box ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className="text-lg font-bold mb-2 text-amber-400 flex items-center gap-2">
                <Wrench className="w-5 h-5" /> اصلاح موجودی / ضایعات
              </h2>
              <p className="text-xs opacity-60 mb-4">موجودی قبلی این سری: <strong>{adjustData.oldQty}</strong></p>

              <form onSubmit={handleConfirmAdjustment} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold opacity-70">موجودی واقعی جدید *</label>
                  <input required type="number" min="0" value={adjustData.newQty} onChange={(e) => setAdjustData({...adjustData, newQty: e.target.value})} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-70">علت اصلاح / کسر *</label>
                  <input required type="text" value={adjustData.reason} onChange={(e) => setAdjustData({...adjustData, reason: e.target.value})} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} placeholder="مثلا: شکستگی، آسیب فیزیکی، ضایعات" />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setIsEditAdjustOpen(false)} className="px-4 py-2 rounded-xl text-xs opacity-70 cursor-pointer">انصراف</button>
                  <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer">ثبت اصلاح موجودی</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= مودال پیش‌نمایش خروج FEFO ================= */}
        {isOutModalOpen && selectedDrugForOut && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-backdrop">
            <div className={`rounded-2xl max-w-md w-full p-6 border shadow-2xl modal-box ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className="text-lg font-bold mb-2 text-amber-400 flex items-center gap-2">
                <LogOut className="w-5 h-5" /> ثبت خروج هوشمند FEFO
              </h2>
              <p className="text-xs opacity-60 mb-4">دارو: <strong>{selectedDrugForOut.name} ({selectedDrugForOut.brand})</strong> | موجودی کل: {selectedDrugForOut.totalQuantity} {selectedDrugForOut.unit}</p>

              {!previewData ? (
                <form onSubmit={handlePreviewOutbound} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold opacity-70">تعداد خروجی مورد نظر *</label>
                    <input required type="number" min="1" max={selectedDrugForOut.totalQuantity} value={requestedQty} onChange={(e) => setRequestedQty(e.target.value)} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold opacity-70">علت / توضیحات (اختیاری)</label>
                    <input type="text" value={outNotes} onChange={(e) => setOutNotes(e.target.value)} className={`w-full border p-2 rounded-xl text-sm mt-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} placeholder="مثلا: فروش روزانه" />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button type="button" onClick={() => setIsOutModalOpen(false)} className="px-4 py-2 rounded-xl text-xs opacity-70 cursor-pointer">انصراف</button>
                    <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer">پیش‌نمایش FEFO</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border text-xs space-y-2 ${darkMode ? 'bg-slate-950 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="font-bold text-amber-400">پیش‌نمایش کسر موجودی ({previewData.requestedQuantity} {selectedDrugForOut.unit}):</div>
                    {previewData.breakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-slate-800 pb-1">
                        <span>از انقضای {new Date(item.expiryDate).toLocaleDateString('fa-IR')}:</span>
                        <strong className="text-emerald-400 font-bold">{item.quantityDeducted} {selectedDrugForOut.unit}</strong>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-amber-400 font-semibold text-center">آیا این خروج مورد تایید است؟</p>
                  <div className="flex justify-end gap-2 mt-4">
                    <button type="button" onClick={() => setPreviewData(null)} className="px-4 py-2 rounded-xl text-xs opacity-70 cursor-pointer">ویرایش تعداد</button>
                    <button type="button" onClick={handleConfirmOutbound} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
                      <CheckCircle2 className="w-4 h-4" /> تایید نهایی و کسر
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}