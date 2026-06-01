import React, { useState, useEffect, useCallback } from 'react';
import api, { carService, serviceRequestService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Car, History, Receipt, Tag,
  Headphones, Settings, Bell, Plus, Wrench, Clock,
  CheckCircle, AlertCircle, ChevronRight, LogOut,
  MapPin, Shield, X, Search, CheckCheck, Info, TriangleAlert,
  CreditCard, Wallet, Building2, Smartphone, Lock, User, Phone,
  Mail, MessageSquare, Send, Edit2, Save, EyeOff, Eye, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Toast System ─── */
const Toast = ({ toasts, remove }) => (
  <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <AnimatePresence>
      {toasts.map(t => {
        const s = { success: { border: '#10b981', icon: <CheckCheck size={16} color="#10b981" /> }, error: { border: '#ef4444', icon: <AlertCircle size={16} color="#ef4444" /> }, info: { border: '#3b82f6', icon: <Info size={16} color="#3b82f6" /> }, warning: { border: '#f59e0b', icon: <TriangleAlert size={16} color="#f59e0b" /> } }[t.type] || {};
        return (
          <motion.div key={t.id} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
            style={{ background: '#0d1521', border: `1px solid ${s.border}`, borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', minWidth: '280px', maxWidth: '360px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            {s.icon}
            <span style={{ flex: 1, fontSize: '13px', color: '#e2e8f0', fontWeight: '500' }}>{t.msg}</span>
            <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}><X size={14} /></button>
          </motion.div>
        );
      })}
    </AnimatePresence>
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, remove, success: m => add(m, 'success'), error: m => add(m, 'error'), info: m => add(m, 'info'), warning: m => add(m, 'warning') };
};

/* ─── Confirm Dialog ─── */
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', confirmColor = '#ef4444' }) => (
  <AnimatePresence>
    {open && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
          style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '380px', margin: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9', marginBottom: '8px' }}>{title}</div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px', lineHeight: '1.6' }}>{message}</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onCancel} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
            <button onClick={onConfirm} style={{ flex: 1, padding: '11px', background: confirmColor, border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>{confirmLabel}</button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ─── Dashboard ─── */
const Dashboard = () => {
  const [cars, setCars] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showAddCar, setShowAddCar] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [customService, setCustomService] = useState('');
  const [newCar, setNewCar] = useState({ car_model: '', car_brand: '', car_number: '' });
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submittingCar, setSubmittingCar] = useState(false);
  const [submittingService, setSubmittingService] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [payMethod, setPayMethod] = useState('card');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', category: 'General' });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });
  const [savingProfile, setSavingProfile] = useState(false);
  const [payInvoiceCar, setPayInvoiceCar] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  // Card form
  const [cardForm, setCardForm] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [showCvv, setShowCvv] = useState(false);
  const [savedCards, setSavedCards] = useState([
    { id: 1, type: 'visa',       last4: '4242', expiry: '12/27', name: 'My Visa Card',       isDefault: true  },
    { id: 2, type: 'mastercard', last4: '8888', expiry: '11/26', name: 'My Mastercard',       isDefault: false },
  ]);
  const [selectedSavedCard, setSelectedSavedCard] = useState(null);
  const [addingCard, setAddingCard] = useState(false);
  // UPI form
  const [upiId, setUpiId] = useState('');
  const [upiApps] = useState([
    { id: 'gpay',    label: 'Google Pay',  color: '#4285F4', emoji: '🔵' },
    { id: 'phonepe', label: 'PhonePe',     color: '#5f259f', emoji: '🟣' },
    { id: 'paytm',   label: 'Paytm',       color: '#00B9F1', emoji: '🔷' },
    { id: 'bhim',    label: 'BHIM UPI',    color: '#FF6B00', emoji: '🟠' },
  ]);
  const [selectedUpiApp, setSelectedUpiApp] = useState(null);
  // Net banking
  const [selectedBank, setSelectedBank] = useState('');
  const banks = ['State Bank of India','HDFC Bank','ICICI Bank','Axis Bank','Kotak Mahindra','Punjab National Bank','Bank of Baroda','Canara Bank','Union Bank','IndusInd Bank'];
  const toast = useToast();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    // Load saved cards from backend
    api.get('/payments/saved-cards').then(res => {
      if (res.data.length) setSavedCards(res.data.map(c => ({ id: c.id, type: c.card_type, last4: c.last4, expiry: c.expiry, name: c.name_on_card, isDefault: c.is_default })));
    }).catch(() => {});
  }, []);

  const fetchData = async () => {
    try {
      const [carsRes, reqsRes] = await Promise.all([carService.getCars(), serviceRequestService.getRequests()]);
      setCars(carsRes.data); setRequests(reqsRes.data);
      if (carsRes.data.length && !payInvoiceCar) setPayInvoiceCar(carsRes.data[0]);
    } catch { toast.error('Failed to load data. Please refresh.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (user) setProfileForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
  }, [user]);

  useEffect(() => {
    if (requests.length && !tickets.length) {
      setTickets(requests.filter(r => r.status === 'COMPLETED').slice(0, 2).map((r, i) => ({
        id: `TKT-${String(r.id).padStart(4,'0')}`,
        subject: `Issue with ${r.service_type}`,
        message: 'Please review the service done on my vehicle.',
        category: 'Service',
        status: i === 0 ? 'resolved' : 'open',
        date: new Date(r.request_date).toLocaleDateString('en-IN'),
        reply: i === 0 ? 'Thank you for your feedback. Issue has been resolved.' : null,
      })));
    }
  }, [requests]);

  const handleAddCar = async (e) => {
    e.preventDefault(); setSubmittingCar(true);
    const brand = newCar.car_brand, model = newCar.car_model;
    try {
      await carService.addCar(newCar);
      setShowAddCar(false); setNewCar({ car_model: '', car_brand: '', car_number: '' });
      await fetchData();
      toast.success(`${brand} ${model} added successfully!`);
    } catch { toast.error('Failed to add vehicle. Please try again.'); }
    finally { setSubmittingCar(false); }
  };

  const toggleService = (s) => {
    setSelectedServices(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleRequestService = async () => {
    const all = customService.trim()
      ? [...selectedServices, customService.trim()]
      : selectedServices;
    if (!all.length || !selectedCar) return;
    setSubmittingService(true);
    try {
      await Promise.all(
        all.map(svc =>
          serviceRequestService.createRequest({ car_id: selectedCar.id, service_type: svc })
        )
      );
      setShowServiceModal(false);
      setSelectedServices([]);
      setCustomService('');
      setSelectedCar(null);
      await fetchData();
      toast.success(
        all.length === 1
          ? `"${all[0]}" request submitted!`
          : `${all.length} service requests submitted!`
      );
    } catch { toast.error('Failed to submit service request(s).'); }
    finally { setSubmittingService(false); }
  };

  const handleLogout = () => setConfirm({ title: 'Sign Out', message: 'Are you sure you want to sign out?', confirmLabel: 'Sign Out', confirmColor: '#ef4444', onConfirm: () => { logout(); navigate('/login'); } });

  const openServiceModal = (car) => { setSelectedCar(car); setSelectedServices([]); setCustomService(''); setShowServiceModal(true); };

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleNavClick = (label) => {
    setActiveNav(label);
    const map = { 'My Vehicles': 'vehicles-section', 'Service History': 'history-section', 'My Appointments': 'appointments-section', 'Invoices & Bills': 'invoices-section' };
    if (map[label]) scrollTo(map[label]); else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusIcon = (s) => ({ PENDING: <Clock size={14} color="#f59e0b" />, IN_PROGRESS: <Wrench size={14} color="#3b82f6" />, COMPLETED: <CheckCircle size={14} color="#10b981" />, CANCELLED: <AlertCircle size={14} color="#ef4444" /> }[s] || null);
  const getStatusStyle = (s) => ({ PENDING: { background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }, IN_PROGRESS: { background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }, COMPLETED: { background: 'rgba(16,185,129,0.15)', color: '#10b981' }, CANCELLED: { background: 'rgba(239,68,68,0.15)', color: '#ef4444' } }[s] || {});

  const navItems = [{ icon: LayoutDashboard, label: 'Dashboard' }, { icon: Calendar, label: 'My Appointments' }, { icon: Car, label: 'My Vehicles' }, { icon: History, label: 'Service History' }, { icon: Receipt, label: 'Invoices & Bills' }, { icon: Tag, label: 'Offers & Coupons' }, { icon: CreditCard, label: 'Payments' }, { icon: Headphones, label: 'Support Tickets' }, { icon: Settings, label: 'Profile Settings' }];
  const quickActions = [
    { icon: Plus, label: 'Book Service', color: '#3b82f6', action: () => cars.length > 0 ? openServiceModal(cars[0]) : toast.warning('Add a vehicle first to book a service.') },
    { icon: History, label: 'Service History', color: '#8b5cf6', action: () => handleNavClick('Service History') },
    { icon: Receipt, label: 'Invoices & Bills', color: '#10b981', action: () => handleNavClick('Invoices & Bills') },
    { icon: Tag, label: 'Offers & Coupons', color: '#f59e0b', action: () => toast.info('No active offers at the moment.') },
    { icon: Headphones, label: 'Support', color: '#ef4444', action: () => toast.info('Support team available Mon–Sat, 9AM–6PM.') },
  ];

  const upcomingRequest = requests.find(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS');
  const completedCount = requests.filter(r => r.status === 'COMPLETED').length;
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const greeting = ['Good Morning', 'Good Afternoon', 'Good Evening'][[0,12,17].findLastIndex(h => new Date().getHours() >= h)];
  const filteredRequests = requests.filter(r => tableSearch === '' || r.service_type.toLowerCase().includes(tableSearch.toLowerCase()) || String(r.id).includes(tableSearch));
  const btn = { border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' };
  const fmtCard = v => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const fmtExpiry = v => { const d = v.replace(/\D/g,'').slice(0,4); return d.length >= 3 ? d.slice(0,2)+'/'+d.slice(2) : d; };
  const cardBrand = n => { const d = n.replace(/\s/g,''); if(d.startsWith('4')) return 'VISA'; if(d.startsWith('5')) return 'MC'; if(d.startsWith('3')) return 'AMEX'; return ''; };
  const handlePayment = async (total, method, invNo) => {
    setProcessingPayment(true);
    try {
      const payload = {
        invoice_no:    invNo,
        amount:        total,
        method:        payMethod === 'card' ? 'CARD' : payMethod === 'upi' ? 'UPI' : payMethod === 'netbank' ? 'NETBANK' : 'WALLET',
        method_detail: method,
        ...(payMethod === 'card' && selectedSavedCard  ? { saved_card_id: selectedSavedCard } : {}),
        ...(payMethod === 'card' && !selectedSavedCard ? { card_number: cardForm.number, card_name: cardForm.name, card_expiry: cardForm.expiry } : {}),
        ...(payMethod === 'upi'     ? { upi_id: upiId, upi_app: selectedUpiApp }    : {}),
        ...(payMethod === 'netbank' ? { bank_name: selectedBank }                    : {}),
        ...(payMethod === 'wallet'  ? { wallet_name: selectedBank }                  : {}),
      };
      const res = await api.post('/payments/initiate', payload);
      setPaymentSuccess({
        amount: total, method,
        invNo: res.data.invoice_no,
        txnId: res.data.transaction_id,
        date: new Date(res.data.created_at).toLocaleString('en-IN'),
      });
      // Refresh saved cards if a new card was used
      if (payMethod === 'card' && !selectedSavedCard && cardForm.number) {
        const cardsRes = await api.get('/payments/saved-cards');
        setSavedCards(cardsRes.data.map(c => ({ id: c.id, type: c.card_type, last4: c.last4, expiry: c.expiry, name: c.name_on_card, isDefault: c.is_default })));
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' }}>
      <Toast toasts={toast.toasts} remove={toast.remove} />
      <ConfirmDialog open={!!confirm} {...confirm} onConfirm={() => { confirm?.onConfirm(); setConfirm(null); }} onCancel={() => setConfirm(null)} />

      {/* Sidebar */}
      <aside style={{ width: '240px', flexShrink: 0, background: '#0d1521', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, transform: sidebarOpen ? 'translateX(0)' : undefined, transition: 'transform 0.3s ease' }}>
        {/* Close button — visible only on mobile via CSS */}
        <button onClick={() => setSidebarOpen(false)} className="csms-sidebar-close"
          style={{ display: 'none', position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', zIndex: 1, padding: '4px' }}>
          <X size={18} />
        </button>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Car size={20} color="#fff" /></div>
            <div><div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>AutoCare</div><div style={{ fontSize: '10px', color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase' }}>Service Center</div></div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(({ icon: Icon, label }) => (
            <button key={label} onClick={() => handleNavClick(label)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', background: activeNav === label ? 'rgba(59,130,246,0.15)' : 'transparent', color: activeNav === label ? '#60a5fa' : '#64748b', transition: 'all 0.2s' }}>
              <Icon size={18} /><span style={{ fontSize: '13px', fontWeight: activeNav === label ? '600' : '400' }}>{label}</span>
              {activeNav === label && <div style={{ marginLeft: 'auto', width: '5px', height: '5px', borderRadius: '50%', background: '#3b82f6' }} />}
            </button>
          ))}
        </nav>
        <div style={{ margin: '0 12px 16px', background: 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(29,78,216,0.1))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(59,130,246,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}><Shield size={18} color="#60a5fa" /></div>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#e2e8f0', marginBottom: '2px' }}>Keep Your Car</p>
          <p style={{ fontSize: '12px', color: '#60a5fa', fontWeight: '700', marginBottom: '6px' }}>Always Perfect</p>
          <p style={{ fontSize: '10px', color: '#64748b', marginBottom: '12px' }}>Get expert service and genuine care.</p>
          <button onClick={() => cars.length > 0 ? openServiceModal(cars[0]) : toast.warning('Add a vehicle first!')} style={{ ...btn, width: '100%', padding: '8px', background: '#3b82f6', color: '#fff' }}>Book Now</button>
        </div>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 12px 20px', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </aside>

      {/* Mobile overlay — closes sidebar when tapped */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99, backdropFilter: 'blur(2px)' }} />
      )}

      {/* Main */}
      <main style={{ marginLeft: '240px', flex: 1, padding: '24px 28px', minHeight: '100vh' }}>
        {/* Topbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', marginBottom: '2px' }}>{greeting}, {displayName}! 👋</h1>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Welcome back! Let's get your car in the best shape.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Hamburger — hidden on desktop, shown on mobile via CSS */}
            <button onClick={() => setSidebarOpen(true)} className="csms-hamburger"
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
              <Menu size={22} />
            </button>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => toast.info(`You have ${pendingCount} pending request(s).`)}>
              <Bell size={20} color="#94a3b8" />
              {pendingCount > 0 && <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '14px', height: '14px', background: '#ef4444', borderRadius: '50%', fontSize: '8px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0a0f1a', fontWeight: '700' }}>{pendingCount}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#fff' }}>{displayName.charAt(0).toUpperCase()}</div>
              <div><div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>{displayName}</div><div style={{ fontSize: '10px', color: '#64748b' }}>Customer</div></div>
            </div>
          </div>
        </div>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'linear-gradient(135deg,#0f2640,#1a3a5c,#0d1f36)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '80px' }}>🚗</div><div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{cars.length > 0 ? `${cars[0].car_brand} ${cars[0].car_model}` : 'Your Vehicle'}</div></div>
          </div>
          <div style={{ maxWidth: '55%' }}>
            <p style={{ fontSize: '12px', color: '#60a5fa', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Premium Service</p>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', lineHeight: '1.2', marginBottom: '8px' }}>Book your next service<br />in just a few taps</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Quick. Easy. Reliable.</p>
            <button onClick={() => cars.length > 0 ? openServiceModal(cars[0]) : toast.warning('Add a vehicle first!')} style={{ ...btn, padding: '12px 24px', background: '#3b82f6', color: '#fff' }}>
              <Plus size={18} /> Book Service
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Vehicles', value: cars.length, icon: Car, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', click: () => handleNavClick('My Vehicles') },
            { label: 'Active Requests', value: pendingCount, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', click: () => handleNavClick('Service History') },
            { label: 'Completed', value: completedCount, icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)', click: () => handleNavClick('Service History') },
          ].map(({ label, value, icon: Icon, color, bg, click }) => (
            <motion.div key={label} whileHover={{ y: -2 }} onClick={click}
              style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
              <div style={{ width: '48px', height: '48px', background: bg, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={22} color={color} /></div>
              <div><div style={{ fontSize: '26px', fontWeight: '700', color: '#f1f5f9', lineHeight: 1 }}>{loading ? '...' : value}</div><div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{label}</div></div>
            </motion.div>
          ))}
        </div>

        {/* Upcoming + Track */}
        <div id="appointments-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>Upcoming Appointment</h3>
              <span style={{ fontSize: '12px', color: '#3b82f6', cursor: 'pointer' }} onClick={() => scrollTo('history-section')}>View All</span>
            </div>
            {upcomingRequest ? (
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(59,130,246,0.15)', borderRadius: '12px', padding: '12px 14px', textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#60a5fa', lineHeight: 1 }}>{new Date(upcomingRequest.request_date).getDate()}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{new Date(upcomingRequest.request_date).toLocaleString('default', { month: 'short' })}</div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', marginBottom: '4px' }}>{upcomingRequest.service_type}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{cars.find(c => c.id === upcomingRequest.car_id) ? `${cars.find(c => c.id === upcomingRequest.car_id).car_brand} ${cars.find(c => c.id === upcomingRequest.car_id).car_model}` : 'Vehicle'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}><Clock size={11} color="#64748b" /><span style={{ fontSize: '11px', color: '#64748b' }}>{new Date(upcomingRequest.request_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                  <span style={{ ...getStatusStyle(upcomingRequest.status), fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>{upcomingRequest.status}</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', fontSize: '13px' }}>
                <Calendar size={32} color="#1e3a5f" style={{ margin: '0 auto 8px', display: 'block' }} />
                No upcoming appointments
                <br />
                <button onClick={() => cars.length > 0 ? openServiceModal(cars[0]) : toast.warning('Add a vehicle first!')} style={{ ...btn, marginTop: '12px', padding: '8px 16px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontSize: '12px' }}>
                  <Plus size={14} /> Book Now
                </button>
              </div>
            )}
          </div>
          <div style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>Track Your Service</h3>
              <MapPin size={16} color="#3b82f6" />
            </div>

            {/* ── Active service info bar ── */}
            {upcomingRequest && upcomingRequest.status !== 'CANCELLED' ? (() => {
              const trackedCar = cars.find(c => c.id === upcomingRequest.car_id);
              const st = upcomingRequest.status;

              // Step definitions — each step has: label, subtext, icon, done, active, cancelled
              const steps = [
                {
                  label: 'Vehicle Received',
                  sub: trackedCar ? `${trackedCar.car_brand} ${trackedCar.car_model}` : 'Your vehicle',
                  icon: <Car size={11} color="#fff" />,
                  activeIcon: <Car size={11} color="#60a5fa" />,
                  done: ['PENDING','IN_PROGRESS','COMPLETED'].includes(st),
                  active: false,
                },
                {
                  label: 'Inspection Done',
                  sub: 'Initial check complete',
                  icon: <CheckCircle size={11} color="#fff" />,
                  activeIcon: <Wrench size={11} color="#60a5fa" />,
                  done: ['IN_PROGRESS','COMPLETED'].includes(st),
                  active: st === 'PENDING',
                },
                {
                  label: 'In Service',
                  sub: upcomingRequest.service_type,
                  icon: <Wrench size={11} color="#fff" />,
                  activeIcon: <Wrench size={11} color="#60a5fa" />,
                  done: st === 'COMPLETED',
                  active: st === 'IN_PROGRESS',
                },
                {
                  label: 'Ready for Pickup',
                  sub: 'Service complete',
                  icon: <CheckCheck size={11} color="#fff" />,
                  activeIcon: <CheckCheck size={11} color="#60a5fa" />,
                  done: st === 'COMPLETED',
                  active: false,
                },
              ];

              const statusLabel = { PENDING: 'Pending', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed' }[st] || st;
              const statusColor = { PENDING: '#f59e0b', IN_PROGRESS: '#3b82f6', COMPLETED: '#10b981' }[st] || '#94a3b8';
              const statusBg   = { PENDING: 'rgba(245,158,11,0.12)', IN_PROGRESS: 'rgba(59,130,246,0.12)', COMPLETED: 'rgba(16,185,129,0.12)' }[st] || 'rgba(255,255,255,0.05)';

              return (
                <>
                  {/* Service summary pill */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', padding:'8px 12px', marginBottom:'16px' }}>
                    <div>
                      <div style={{ fontSize:'12px', fontWeight:'600', color:'#e2e8f0' }}>{upcomingRequest.service_type}</div>
                      <div style={{ fontSize:'10px', color:'#64748b', marginTop:'1px' }}>
                        {trackedCar ? `${trackedCar.car_brand} ${trackedCar.car_model} · ${trackedCar.car_number}` : `Request #${String(upcomingRequest.id).padStart(4,'0')}`}
                      </div>
                    </div>
                    <span style={{ fontSize:'10px', fontWeight:'700', background: statusBg, color: statusColor, padding:'3px 10px', borderRadius:'20px', letterSpacing:'0.3px' }}>{statusLabel}</span>
                  </div>

                  {/* Steps */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'0px' }}>
                    {steps.map(({ label, sub, icon, activeIcon, done, active }, i) => (
                      <div key={i}>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                          {/* Icon circle */}
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                            <div style={{
                              width:'22px', height:'22px', borderRadius:'50%', flexShrink:0,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              background: done ? '#3b82f6' : active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                              border: active ? '2px solid #3b82f6' : done ? 'none' : '1px solid rgba(255,255,255,0.08)',
                              boxShadow: done ? '0 0 8px rgba(59,130,246,0.4)' : active ? '0 0 10px rgba(59,130,246,0.25)' : 'none',
                              transition:'all 0.3s',
                            }}>
                              {done ? icon : active ? activeIcon : null}
                            </div>
                          </div>
                          {/* Label + sub */}
                          <div style={{ flex:1, paddingBottom:'2px' }}>
                            <div style={{ fontSize:'12px', fontWeight: done || active ? '600' : '400', color: done ? '#e2e8f0' : active ? '#60a5fa' : '#334155' }}>{label}</div>
                            <div style={{ fontSize:'10px', color: done ? '#64748b' : active ? 'rgba(96,165,250,0.7)' : '#1e293b', marginTop:'1px' }}>{sub}</div>
                          </div>
                          {/* Done tick */}
                          {done && <CheckCircle size={13} color="#3b82f6" style={{ flexShrink:0 }} />}
                          {active && (
                            <motion.div animate={{ opacity:[1,0.4,1] }} transition={{ duration:1.4, repeat:Infinity }}
                              style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#3b82f6', flexShrink:0 }} />
                          )}
                        </div>
                        {/* Connector line */}
                        {i < steps.length - 1 && (
                          <div style={{ marginLeft:'10px', width:'2px', height:'14px', background: steps[i+1].done || steps[i+1].active ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.05)', borderRadius:'1px' }} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bottom: date + request id */}
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:'14px', paddingTop:'12px', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize:'10px', color:'#475569' }}>
                      Submitted: {new Date(upcomingRequest.request_date).toLocaleDateString('en-IN',{ day:'numeric', month:'short', year:'numeric' })}
                    </span>
                    <span style={{ fontSize:'10px', color:'#475569' }}>#{String(upcomingRequest.id).padStart(4,'0')}</span>
                  </div>
                </>
              );
            })() : (
              <div style={{ textAlign:'center', padding:'28px 0' }}>
                <div style={{ width:'44px', height:'44px', background:'rgba(255,255,255,0.03)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
                  <MapPin size={20} color="#334155" />
                </div>
                <p style={{ fontSize:'12px', color:'#475569', marginBottom:'10px' }}>
                  {upcomingRequest?.status === 'CANCELLED' ? 'Your last request was cancelled.' : 'No active service to track.'}
                </p>
                <button onClick={() => cars.length > 0 ? openServiceModal(cars[0]) : toast.warning('Add a vehicle first!')}
                  style={{ ...btn, padding:'7px 16px', background:'rgba(59,130,246,0.15)', color:'#60a5fa', border:'1px solid rgba(59,130,246,0.25)', fontSize:'11px' }}>
                  <Plus size={13} /> Book a Service
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Vehicles */}
        <div id="vehicles-section" style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>My Vehicles</h3>
            <button onClick={() => setShowAddCar(true)} style={{ ...btn, padding: '7px 14px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', fontSize: '12px' }}>
              <Plus size={14} /> Add Car
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '12px' }}>
            {cars.map((car) => (
              <motion.div key={car.id} whileHover={{ y: -3 }} style={{ background: '#131e2e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '56px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Car size={28} color="#3b82f6" /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', marginBottom: '2px' }}>{car.car_brand} {car.car_model}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>{car.car_number}</div>
                  <button onClick={() => openServiceModal(car)} style={{ ...btn, padding: '5px 12px', background: 'transparent', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: '11px' }}>Request Service</button>
                </div>
                <ChevronRight size={16} color="#475569" />
              </motion.div>
            ))}
            {!loading && cars.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: '32px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                No vehicles yet.
                <button onClick={() => setShowAddCar(true)} style={{ ...btn, marginTop: '12px', padding: '8px 16px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontSize: '12px', display: 'inline-flex' }}>
                  <Plus size={14} /> Add your first car
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Access + Invoices */}
        <div id="invoices-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', marginBottom: '16px' }}>Quick Access</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
              {quickActions.map(({ icon: Icon, label, color, action }) => (
                <motion.button key={label} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={action}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '14px 8px', background: '#131e2e', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', cursor: 'pointer' }}>
                  <div style={{ width: '36px', height: '36px', background: `${color}20`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color={color} /></div>
                  <span style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', lineHeight: '1.3' }}>{label}</span>
                </motion.button>
              ))}
            </div>
          </div>
          <div style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>Recent Invoices</h3>
              <span style={{ fontSize: '12px', color: '#3b82f6', cursor: 'pointer' }} onClick={() => toast.info('Invoice download coming soon!')}>View All</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {requests.filter(r => r.status === 'COMPLETED').slice(0, 3).map((req) => (
                <motion.div key={req.id} whileHover={{ x: 3 }} onClick={() => toast.info(`Invoice #${String(req.id).padStart(4,'0')} — ${req.service_type}`)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#131e2e', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#e2e8f0', marginBottom: '2px' }}>INV-{String(req.id).padStart(4,'0')}</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>{req.service_type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '3px' }}>{new Date(req.request_date).toLocaleDateString()}</div>
                    <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '4px' }}>Completed</span>
                  </div>
                </motion.div>
              ))}
              {requests.filter(r => r.status === 'COMPLETED').length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: '#475569', fontSize: '12px' }}>No completed invoices yet</div>}
            </div>
          </div>
        </div>

        {/* History Table */}
        <div id="history-section" style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>Service History</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#131e2e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '6px 12px' }}>
              <Search size={14} color="#64748b" />
              <input value={tableSearch} onChange={e => setTableSearch(e.target.value)} placeholder="Search requests..."
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '12px', color: '#e2e8f0', width: '130px' }} />
              {tableSearch && <button onClick={() => setTableSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}><X size={12} /></button>}
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['Request ID', 'Service Type', 'Vehicle', 'Date', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => (
                <motion.tr key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => toast.info(`#${String(req.id).padStart(4,'0')} — ${req.service_type} (${req.status})`)}>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#60a5fa', fontWeight: '600' }}>#{String(req.id).padStart(4,'0')}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#e2e8f0' }}>{req.service_type}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#64748b' }}>{cars.find(c => c.id === req.car_id) ? `${cars.find(c => c.id === req.car_id).car_brand} ${cars.find(c => c.id === req.car_id).car_model}` : `Car #${req.car_id}`}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#94a3b8' }}>{new Date(req.request_date).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ ...getStatusStyle(req.status), display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                      {getStatusIcon(req.status)} {req.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
              {!loading && filteredRequests.length === 0 && (
                <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>{tableSearch ? `No results for "${tableSearch}"` : 'No service requests yet.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ══════════════════════ PAYMENTS PAGE ══════════════════════ */}
        {activeNav === 'Payments' && (() => {
          const SERVICE_PRICES = { 'Oil Change': 899, 'Brake Service': 699, 'Engine Repair': 1999, 'Tire Change': 499, 'AC Service': 1299, 'General Service': 2499, 'Spare Parts': 1499, 'Wheel Alignment': 799 };
          const activeCar  = payInvoiceCar || cars[0];
          const carReqs    = activeCar ? requests.filter(r => r.car_id === activeCar.id && r.status === 'COMPLETED') : [];
          const activeReqs = requests.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS');
          const subtotal   = carReqs.reduce((s, r) => s + (SERVICE_PRICES[r.service_type] || 999), 0);
          const gst        = Math.round(subtotal * 0.18);
          const discount   = couponApplied ? Math.round(subtotal * 0.1) : 0;
          const total      = subtotal + gst - discount;
          const invNo      = `INV-${new Date().getFullYear()}-${String((activeCar?.id || 0) * 100 + carReqs.length).padStart(4,'0')}`;
          const canPay     = carReqs.length > 0 && !processingPayment && (
            payMethod === 'card'    ? (selectedSavedCard || (cardForm.number.replace(/\s/g,'').length === 16 && cardForm.name && cardForm.expiry.length === 5 && cardForm.cvv.length >= 3)) :
            payMethod === 'upi'     ? (selectedUpiApp || upiId.includes('@')) :
            payMethod === 'netbank' ? !!selectedBank :
            true
          );

          /* ── Payment Success Screen ── */
          if (paymentSuccess) return (
            <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }}
              style={{ maxWidth:'480px', margin:'60px auto', background:'#0d1521', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'24px', padding:'48px 40px', textAlign:'center' }}>
              <div style={{ width:'72px', height:'72px', background:'rgba(16,185,129,0.15)', border:'2px solid #10b981', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:'32px' }}>✅</div>
              <h2 style={{ fontSize:'22px', fontWeight:'800', color:'#f1f5f9', marginBottom:'6px' }}>Payment Successful!</h2>
              <p style={{ fontSize:'13px', color:'#64748b', marginBottom:'28px' }}>Your payment has been processed securely</p>
              <div style={{ background:'#131e2e', borderRadius:'14px', padding:'20px', marginBottom:'24px', textAlign:'left' }}>
                {[['Transaction ID', paymentSuccess.txnId || `TXN${Date.now().toString().slice(-8)}`],['Invoice', paymentSuccess.invNo],['Amount Paid', `₹${paymentSuccess.amount.toLocaleString('en-IN')}`],['Method', paymentSuccess.method],['Date & Time', paymentSuccess.date]].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize:'12px', color:'#64748b' }}>{k}</span>
                    <span style={{ fontSize:'12px', fontWeight:'600', color: k==='Amount Paid'?'#10b981':'#e2e8f0' }}>{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setPaymentSuccess(null)} style={{ ...btn, width:'100%', padding:'12px', background:'#3b82f6', color:'#fff' }}>Done</button>
            </motion.div>
          );

          const payMethods = [
            { id: 'card',    icon: <CreditCard size={20} color="#3b82f6" />, label: 'Credit / Debit Card', sub: 'Visa, MasterCard, Rupay & more' },
            { id: 'upi',     icon: <Smartphone size={20} color="#10b981" />, label: 'UPI',                 sub: 'Pay using any UPI app' },
            { id: 'netbank', icon: <Building2 size={20} color="#f59e0b" />,  label: 'Net Banking',         sub: 'All major banks supported' },
            { id: 'wallet',  icon: <Wallet size={20} color="#8b5cf6" />,     label: 'Digital Wallets',     sub: 'Paytm, PhonePe, Google Pay & more' },
          ];

          return (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:'24px', alignItems:'start' }}>

              {/* ════ LEFT COLUMN ════ */}
              <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

                {/* Header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <h2 style={{ fontSize:'20px', fontWeight:'700', color:'#f1f5f9', margin:0 }}>Payment</h2>
                    <p style={{ fontSize:'12px', color:'#64748b', marginTop:'3px' }}>Complete your payment securely</p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', padding:'8px 14px', borderRadius:'10px' }}>
                    <Shield size={14} color="#10b981" /><span style={{ fontSize:'12px', color:'#10b981', fontWeight:'600' }}>Secure Payment</span>
                  </div>
                </div>

                {/* Active services banner */}
                {activeReqs.length > 0 && (
                  <div style={{ background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'12px', padding:'14px 16px' }}>
                    <div style={{ fontSize:'12px', fontWeight:'600', color:'#f59e0b', marginBottom:'8px' }}>⏳ {activeReqs.length} Active Service{activeReqs.length > 1 ? 's' : ''} In Progress</div>
                    {activeReqs.map(r => { const c = cars.find(x => x.id === r.car_id); return (
                      <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.03)', borderRadius:'8px', padding:'8px 10px', marginBottom:'4px' }}>
                        <div>
                          <div style={{ fontSize:'12px', fontWeight:'600', color:'#e2e8f0' }}>{r.service_type}</div>
                          <div style={{ fontSize:'10px', color:'#64748b' }}>{c ? `${c.car_brand} ${c.car_model} · ${c.car_number}` : `Car #${r.car_id}`}</div>
                        </div>
                        <span style={{ fontSize:'10px', fontWeight:'700', background:r.status==='IN_PROGRESS'?'rgba(59,130,246,0.15)':'rgba(245,158,11,0.15)', color:r.status==='IN_PROGRESS'?'#60a5fa':'#f59e0b', padding:'3px 10px', borderRadius:'20px' }}>{r.status.replace('_',' ')}</span>
                      </div>
                    ); })}
                  </div>
                )}

                {/* Vehicle selector */}
                {cars.length > 1 && (
                  <div style={{ background:'#0d1521', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'16px 20px' }}>
                    <label style={{ fontSize:'11px', color:'#94a3b8', display:'block', marginBottom:'8px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.4px' }}>Select Vehicle for Invoice</label>
                    <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                      {cars.map(c => (
                        <button key={c.id} onClick={() => setPayInvoiceCar(c)}
                          style={{ padding:'7px 14px', borderRadius:'8px', border:`1px solid ${activeCar?.id===c.id?'rgba(59,130,246,0.5)':'rgba(255,255,255,0.07)'}`, background:activeCar?.id===c.id?'rgba(59,130,246,0.15)':'#131e2e', color:activeCar?.id===c.id?'#60a5fa':'#94a3b8', fontSize:'12px', fontWeight:'500', cursor:'pointer', transition:'all 0.2s' }}>
                          {c.car_brand} {c.car_model} <span style={{ opacity:0.6 }}>· {c.car_number}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Payment Method Selector ── */}
                <div style={{ background:'#0d1521', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'20px' }}>
                  <h3 style={{ fontSize:'13px', fontWeight:'600', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Select Payment Method</h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {payMethods.map(m => (
                      <div key={m.id} onClick={() => { setPayMethod(m.id); setSelectedSavedCard(null); setAddingCard(false); }}
                        style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', borderRadius:'12px', border:`1px solid ${payMethod===m.id?'rgba(59,130,246,0.5)':'rgba(255,255,255,0.06)'}`, background:payMethod===m.id?'rgba(59,130,246,0.08)':'#131e2e', cursor:'pointer', transition:'all 0.2s' }}>
                        <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{m.icon}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'13px', fontWeight:'600', color:'#e2e8f0' }}>{m.label}</div>
                          <div style={{ fontSize:'11px', color:'#64748b', marginTop:'2px' }}>{m.sub}</div>
                        </div>
                        <div style={{ width:'18px', height:'18px', borderRadius:'50%', border:`2px solid ${payMethod===m.id?'#3b82f6':'rgba(255,255,255,0.15)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {payMethod===m.id && <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#3b82f6' }} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ══════════════ CARD FORM ══════════════ */}
                {payMethod === 'card' && (
                  <div style={{ background:'#0d1521', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'20px', display:'flex', flexDirection:'column', gap:'16px' }}>

                    {/* Saved Cards */}
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                        <h3 style={{ fontSize:'13px', fontWeight:'600', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', margin:0 }}>Saved Cards</h3>
                        <button onClick={() => { setAddingCard(p => !p); setSelectedSavedCard(null); }}
                          style={{ fontSize:'12px', color:'#3b82f6', background:'none', border:'none', cursor:'pointer', fontWeight:'600', display:'flex', alignItems:'center', gap:'4px' }}>
                          <Plus size={13} /> {addingCard ? 'Cancel' : 'Add New Card'}
                        </button>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                        {savedCards.map(card => (
                          <div key={card.id} onClick={() => { setSelectedSavedCard(card.id); setAddingCard(false); }}
                            style={{ display:'flex', alignItems:'center', gap:'14px', padding:'13px 16px', borderRadius:'12px', border:`1px solid ${selectedSavedCard===card.id?'rgba(59,130,246,0.5)':'rgba(255,255,255,0.06)'}`, background:selectedSavedCard===card.id?'rgba(59,130,246,0.08)':'#131e2e', cursor:'pointer', transition:'all 0.2s' }}>
                            <div style={{ width:'44px', height:'30px', background:card.type==='visa'?'#1A1F71':'#EB001B', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <span style={{ fontSize:'11px', fontWeight:'900', color:'#fff', letterSpacing:'0.5px' }}>{card.type==='visa'?'VISA':'MC'}</span>
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:'13px', fontWeight:'600', color:'#e2e8f0' }}>{card.type==='visa'?'Visa':'Mastercard'} **** **** **** {card.last4}</div>
                              <div style={{ fontSize:'11px', color:'#64748b', marginTop:'2px' }}>Expires {card.expiry}</div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                              {card.isDefault && <span style={{ fontSize:'10px', background:'rgba(16,185,129,0.15)', color:'#10b981', padding:'2px 8px', borderRadius:'6px', fontWeight:'600' }}>Default</span>}
                              <div style={{ width:'16px', height:'16px', borderRadius:'50%', border:`2px solid ${selectedSavedCard===card.id?'#3b82f6':'rgba(255,255,255,0.2)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                {selectedSavedCard===card.id && <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#3b82f6' }} />}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add New Card Form */}
                    {(addingCard || savedCards.length === 0) && (
                      <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'16px' }}>
                        <div style={{ marginBottom:'12px' }}>
                          <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'5px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.3px' }}>Card Number</label>
                          <div style={{ position:'relative' }}>
                            <input value={cardForm.number} onChange={e => setCardForm(p => ({...p, number: fmtCard(e.target.value)}))} placeholder="1234 5678 9012 3456" maxLength={19}
                              style={{ width:'100%', padding:'11px 50px 11px 14px', background:'#131e2e', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', color:'#e2e8f0', fontSize:'14px', outline:'none', letterSpacing:'2px', boxSizing:'border-box' }} />
                            <div style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', fontWeight:'800', color:'#64748b' }}>{cardBrand(cardForm.number)}</div>
                          </div>
                        </div>
                        <div style={{ marginBottom:'12px' }}>
                          <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'5px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.3px' }}>Cardholder Name</label>
                          <input value={cardForm.name} onChange={e => setCardForm(p => ({...p, name: e.target.value}))} placeholder="Name as on card"
                            style={{ width:'100%', padding:'11px 14px', background:'#131e2e', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', color:'#e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                          <div>
                            <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'5px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.3px' }}>Expiry Date</label>
                            <input value={cardForm.expiry} onChange={e => setCardForm(p => ({...p, expiry: fmtExpiry(e.target.value)}))} placeholder="MM/YY" maxLength={5}
                              style={{ width:'100%', padding:'11px 14px', background:'#131e2e', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', color:'#e2e8f0', fontSize:'14px', outline:'none', letterSpacing:'2px', boxSizing:'border-box' }} />
                          </div>
                          <div>
                            <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'5px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.3px' }}>CVV</label>
                            <div style={{ position:'relative' }}>
                              <input type={showCvv ? 'text' : 'password'} value={cardForm.cvv} onChange={e => setCardForm(p => ({...p, cvv: e.target.value.replace(/\D/g,'').slice(0,4)}))} placeholder="•••"
                                style={{ width:'100%', padding:'11px 40px 11px 14px', background:'#131e2e', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', color:'#e2e8f0', fontSize:'14px', outline:'none', letterSpacing:'3px', boxSizing:'border-box' }} />
                              <button onClick={() => setShowCvv(p => !p)} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#64748b', padding:0 }}>
                                {showCvv ? <Eye size={14} /> : <EyeOff size={14} />}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'12px', padding:'8px 12px', background:'rgba(16,185,129,0.06)', borderRadius:'8px' }}>
                          <Lock size={12} color="#10b981" />
                          <span style={{ fontSize:'11px', color:'#64748b' }}>Your card details are encrypted and secure.</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════ UPI FORM ══════════════ */}
                {payMethod === 'upi' && (
                  <div style={{ background:'#0d1521', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'20px' }}>
                    <h3 style={{ fontSize:'13px', fontWeight:'600', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Pay via UPI</h3>

                    {/* UPI App buttons */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'16px' }}>
                      {upiApps.map(app => (
                        <button key={app.id} onClick={() => { setSelectedUpiApp(app.id); setUpiId(''); }}
                          style={{ padding:'12px 8px', borderRadius:'12px', border:`1px solid ${selectedUpiApp===app.id?'rgba(59,130,246,0.5)':'rgba(255,255,255,0.07)'}`, background:selectedUpiApp===app.id?'rgba(59,130,246,0.12)':'#131e2e', cursor:'pointer', textAlign:'center', transition:'all 0.2s' }}>
                          <div style={{ fontSize:'22px', marginBottom:'4px' }}>{app.emoji}</div>
                          <div style={{ fontSize:'10px', fontWeight:'600', color:selectedUpiApp===app.id?'#60a5fa':'#94a3b8' }}>{app.label}</div>
                        </button>
                      ))}
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                      <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.06)' }} />
                      <span style={{ fontSize:'11px', color:'#475569' }}>OR ENTER UPI ID</span>
                      <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.06)' }} />
                    </div>

                    <div style={{ display:'flex', gap:'8px' }}>
                      <input value={upiId} onChange={e => { setUpiId(e.target.value); setSelectedUpiApp(null); }} placeholder="yourname@upi (e.g. 9876543210@okaxis)"
                        style={{ flex:1, padding:'11px 14px', background:'#131e2e', border:`1px solid ${upiId.includes('@')?'rgba(16,185,129,0.4)':'rgba(255,255,255,0.08)'}`, borderRadius:'10px', color:'#e2e8f0', fontSize:'13px', outline:'none' }} />
                      <button onClick={() => { if(upiId.includes('@')) toast.success('UPI ID verified!'); else toast.error('Enter a valid UPI ID'); }}
                        style={{ padding:'11px 16px', background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:'10px', color:'#60a5fa', fontSize:'12px', fontWeight:'600', cursor:'pointer', whiteSpace:'nowrap' }}>
                        Verify
                      </button>
                    </div>
                    {upiId.includes('@') && <div style={{ marginTop:'8px', fontSize:'11px', color:'#10b981', display:'flex', alignItems:'center', gap:'5px' }}><CheckCircle size={12} /> UPI ID looks valid</div>}
                  </div>
                )}

                {/* ══════════════ NET BANKING FORM ══════════════ */}
                {payMethod === 'netbank' && (
                  <div style={{ background:'#0d1521', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'20px' }}>
                    <h3 style={{ fontSize:'13px', fontWeight:'600', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Select Your Bank</h3>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px' }}>
                      {banks.map(b => (
                        <button key={b} onClick={() => setSelectedBank(b)}
                          style={{ padding:'10px 14px', borderRadius:'10px', border:`1px solid ${selectedBank===b?'rgba(59,130,246,0.5)':'rgba(255,255,255,0.06)'}`, background:selectedBank===b?'rgba(59,130,246,0.12)':'#131e2e', color:selectedBank===b?'#60a5fa':'#94a3b8', fontSize:'12px', fontWeight:'500', cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}>
                          🏦 {b}
                        </button>
                      ))}
                    </div>
                    {selectedBank && <div style={{ marginTop:'12px', padding:'10px 14px', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:'9px', fontSize:'12px', color:'#60a5fa' }}>Selected: <b>{selectedBank}</b></div>}
                  </div>
                )}

                {/* ══════════════ WALLET FORM ══════════════ */}
                {payMethod === 'wallet' && (
                  <div style={{ background:'#0d1521', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'20px' }}>
                    <h3 style={{ fontSize:'13px', fontWeight:'600', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Digital Wallets</h3>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
                      {[['🔵','Google Pay'],['🟣','PhonePe'],['🔷','Paytm'],['🟠','Amazon Pay'],['⚫','BHIM'],['🟡','Freecharge']].map(([emoji,name]) => (
                        <button key={name} onClick={() => { setSelectedBank(name); toast.info(`Opening ${name}...`); }}
                          style={{ padding:'14px', borderRadius:'12px', border:`1px solid ${selectedBank===name?'rgba(139,92,246,0.5)':'rgba(255,255,255,0.07)'}`, background:selectedBank===name?'rgba(139,92,246,0.1)':'#131e2e', cursor:'pointer', textAlign:'center', transition:'all 0.2s' }}>
                          <div style={{ fontSize:'24px', marginBottom:'5px' }}>{emoji}</div>
                          <div style={{ fontSize:'11px', fontWeight:'600', color:selectedBank===name?'#a78bfa':'#94a3b8' }}>{name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security badges */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px' }}>
                  {[['🔒','PCI DSS','Certified'],['🔐','256-bit SSL','Encrypted'],['✅','100% Secure','Payments'],['🏆','Trusted by','10M+ Customers']].map(([icon,title,sub]) => (
                    <div key={title} style={{ background:'#0d1521', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', padding:'12px', textAlign:'center' }}>
                      <div style={{ fontSize:'18px', marginBottom:'4px' }}>{icon}</div>
                      <div style={{ fontSize:'11px', fontWeight:'700', color:'#e2e8f0' }}>{title}</div>
                      <div style={{ fontSize:'10px', color:'#64748b' }}>{sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ════ RIGHT COLUMN — Invoice Summary ════ */}
              <div style={{ background:'#0d1521', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'22px', position:'sticky', top:'24px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                  <h3 style={{ fontSize:'14px', fontWeight:'700', color:'#f1f5f9', margin:0 }}>Invoice Summary</h3>
                  <span style={{ fontSize:'10px', color:'#64748b', background:'rgba(255,255,255,0.04)', padding:'3px 8px', borderRadius:'6px' }}>{invNo}</span>
                </div>

                {activeCar && (
                  <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px', background:'#131e2e', borderRadius:'10px', marginBottom:'16px' }}>
                    <div style={{ width:'44px', height:'44px', background:'rgba(59,130,246,0.1)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}><Car size={22} color="#60a5fa" /></div>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:'700', color:'#e2e8f0' }}>{activeCar.car_brand} {activeCar.car_model}</div>
                      <div style={{ fontSize:'11px', color:'#64748b' }}>{activeCar.car_number}</div>
                    </div>
                    <div style={{ marginLeft:'auto', textAlign:'right' }}>
                      <div style={{ fontSize:'10px', color:'#64748b' }}>Services</div>
                      <div style={{ fontSize:'16px', fontWeight:'800', color:'#3b82f6' }}>{carReqs.length}</div>
                    </div>
                  </div>
                )}

                {/* Line items */}
                <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'14px' }}>
                  {carReqs.length === 0
                    ? <div style={{ fontSize:'12px', color:'#475569', textAlign:'center', padding:'16px 0' }}>No completed services for this vehicle</div>
                    : carReqs.map(r => (
                      <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>
                          <div style={{ fontSize:'13px', color:'#94a3b8' }}>{r.service_type}</div>
                          <div style={{ fontSize:'10px', color:'#475569' }}>{new Date(r.request_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
                        </div>
                        <span style={{ fontSize:'13px', color:'#e2e8f0', fontWeight:'600' }}>₹{(SERVICE_PRICES[r.service_type]||999).toLocaleString('en-IN')}</span>
                      </div>
                    ))}

                  {carReqs.length > 0 && <>
                    <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'10px', display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:'12px', color:'#64748b' }}>Subtotal</span>
                      <span style={{ fontSize:'12px', color:'#e2e8f0' }}>₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:'12px', color:'#64748b' }}>GST (18%)</span>
                      <span style={{ fontSize:'12px', color:'#e2e8f0' }}>₹{gst.toLocaleString('en-IN')}</span>
                    </div>
                    {couponApplied && (
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:'12px', color:'#10b981' }}>Discount (10%)</span>
                        <span style={{ fontSize:'12px', color:'#10b981' }}>-₹{discount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {subtotal > 0 && (
                      <div style={{ background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:'8px', padding:'7px 12px', fontSize:'11px', color:'#10b981', display:'flex', alignItems:'center', gap:'6px' }}>
                        🎉 You are saving ₹{Math.round(subtotal * 0.08).toLocaleString('en-IN')} on this service
                      </div>
                    )}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:'12px', marginTop:'4px' }}>
                      <span style={{ fontSize:'14px', fontWeight:'700', color:'#f1f5f9' }}>Total Amount</span>
                      <span style={{ fontSize:'22px', fontWeight:'800', color:'#3b82f6' }}>₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  </>}
                </div>

                {/* Payment Offers */}
                <div style={{ background:'#131e2e', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'10px', padding:'12px 14px', marginBottom:'12px' }}>
                  <div style={{ fontSize:'11px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'10px' }}>Payment Offers</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ width:'28px', height:'28px', background:'rgba(59,130,246,0.15)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>%</div>
                      <div>
                        <div style={{ fontSize:'12px', fontWeight:'600', color:'#e2e8f0' }}>10% Instant Discount</div>
                        <div style={{ fontSize:'10px', color:'#64748b' }}>On SBI Credit Cards</div>
                      </div>
                    </div>
                    <button onClick={() => { setCouponApplied(true); toast.success('10% discount applied!'); }}
                      style={{ fontSize:'12px', color:'#3b82f6', background:'none', border:'none', cursor:'pointer', fontWeight:'600' }}>Apply</button>
                  </div>
                  <div style={{ display:'flex', gap:'8px', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:'10px' }}>
                    <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Have a coupon code?"
                      style={{ flex:1, background:'none', border:'none', outline:'none', color:'#94a3b8', fontSize:'12px' }} />
                    <button onClick={() => { if(couponCode.trim()){ setCouponApplied(true); toast.success('Coupon applied!'); } else toast.warning('Enter a coupon code first.'); }}
                      style={{ fontSize:'12px', color:'#3b82f6', background:'none', border:'none', cursor:'pointer', fontWeight:'600', whiteSpace:'nowrap' }}>Apply Code</button>
                  </div>
                </div>

                {/* Pay Button */}
                <button disabled={!canPay}
                  onClick={() => {
                    const methodLabel = payMethod==='card' ? (selectedSavedCard ? `Card **** ${savedCards.find(c=>c.id===selectedSavedCard)?.last4}` : `Card **** ${cardForm.number.slice(-4)}`) : payMethod==='upi' ? (selectedUpiApp ? upiApps.find(a=>a.id===selectedUpiApp)?.label : upiId) : payMethod==='netbank' ? selectedBank : selectedBank || 'Digital Wallet';
                    handlePayment(total, methodLabel, invNo);
                  }}
                  style={{ width:'100%', padding:'14px', background:canPay?'linear-gradient(135deg,#3b82f6,#1d4ed8)':'#1e2a3a', border:'none', borderRadius:'12px', color:canPay?'#fff':'#475569', fontSize:'14px', fontWeight:'700', cursor:canPay?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.2s' }}>
                  {processingPayment
                    ? <><motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }} style={{ width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%' }} /> Processing...</>
                    : <><Lock size={15} /> {carReqs.length > 0 ? `Pay ₹${total.toLocaleString('en-IN')} Securely` : 'No services to pay'}</>}
                </button>
                <p style={{ textAlign:'center', fontSize:'10px', color:'#475569', marginTop:'10px' }}>By proceeding, you agree to our <span style={{ color:'#3b82f6', cursor:'pointer' }}>Terms & Conditions</span></p>
              </div>

            </div>
          );
        })()}


        {/* ══════════════════════ SUPPORT TICKETS PAGE ══════════════════════ */}
        {activeNav === 'Support Tickets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>Support Tickets</h2>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>Raise issues or queries about your services</p>
            </div>
            {/* New ticket form */}
            <div style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '22px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Raise New Ticket</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', fontWeight: '600' }}>Subject</label>
                  <input value={newTicket.subject} onChange={e => setNewTicket(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Oil change not done properly"
                    style={{ width: '100%', padding: '9px 12px', background: '#131e2e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', color: '#e2e8f0', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', fontWeight: '600' }}>Category</label>
                  <select value={newTicket.category} onChange={e => setNewTicket(p => ({ ...p, category: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', background: '#131e2e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', color: '#e2e8f0', fontSize: '12px', outline: 'none' }}>
                    {['General','Service Quality','Billing','Vehicle Damage','Delay','Other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {/* Link to real service request */}
              {requests.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', fontWeight: '600' }}>Related Service Request (optional)</label>
                  <select value={newTicket.serviceRequestId || ''} onChange={e => {
                    const req = requests.find(r => r.id === parseInt(e.target.value));
                    if (req) {
                      const car = cars.find(c => c.id === req.car_id);
                      setNewTicket(p => ({ ...p, serviceRequestId: req.id, subject: p.subject || `Issue with ${req.service_type}`, relatedInfo: `${req.service_type} · ${car ? car.car_brand + ' ' + car.car_model : 'Car #' + req.car_id} · #${String(req.id).padStart(4,'0')}` }));
                    } else { setNewTicket(p => ({ ...p, serviceRequestId: null, relatedInfo: null })); }
                  }} style={{ width: '100%', padding: '9px 12px', background: '#131e2e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', color: '#e2e8f0', fontSize: '12px', outline: 'none' }}>
                    <option value=''>— None —</option>
                    {requests.map(r => { const c = cars.find(x => x.id === r.car_id); return <option key={r.id} value={r.id}>#{String(r.id).padStart(4,'0')} · {r.service_type} · {c ? c.car_brand + ' ' + c.car_model : 'Car #' + r.car_id} · {r.status}</option>; })}
                  </select>
                  {newTicket.relatedInfo && (
                    <div style={{ marginTop: '6px', padding: '6px 10px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '7px', fontSize: '11px', color: '#60a5fa' }}>
                      📎 Linked: {newTicket.relatedInfo}
                    </div>
                  )}
                </div>
              )}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', fontWeight: '600' }}>Message</label>
                <textarea value={newTicket.message} onChange={e => setNewTicket(p => ({ ...p, message: e.target.value }))} placeholder="Describe your issue in detail..." rows={3}
                  style={{ width: '100%', padding: '9px 12px', background: '#131e2e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', color: '#e2e8f0', fontSize: '12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <button disabled={!newTicket.subject || !newTicket.message || submittingTicket}
                onClick={() => {
                  if (!newTicket.subject || !newTicket.message) return;
                  setSubmittingTicket(true);
                  setTimeout(() => {
                    const id = `TKT-${String(Date.now()).slice(-4)}`;
                    setTickets(p => [{ id, ...newTicket, status: 'open', date: new Date().toLocaleDateString('en-IN'), reply: null }, ...p]);
                    setNewTicket({ subject: '', message: '', category: 'General' });
                    setSubmittingTicket(false);
                    toast.success(`Ticket ${id} submitted! We'll respond within 24hrs.`);
                  }, 800);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', background: newTicket.subject && newTicket.message ? '#3b82f6' : '#1e2a3a', border: 'none', borderRadius: '9px', color: newTicket.subject && newTicket.message ? '#fff' : '#475569', fontSize: '13px', fontWeight: '600', cursor: newTicket.subject && newTicket.message ? 'pointer' : 'not-allowed' }}>
                <Send size={14} /> {submittingTicket ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
            {/* Ticket list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tickets.length === 0 ? (
                <div style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                  <MessageSquare size={32} color="#1e2a3a" style={{ marginBottom: '10px' }} /><br />No tickets yet
                </div>
              ) : tickets.map(t => (
                <div key={t.id} style={{ background: '#0d1521', border: `1px solid ${t.status === 'resolved' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '14px', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#60a5fa', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '6px' }}>{t.id}</span>
                        <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', padding: '2px 8px', borderRadius: '6px' }}>{t.category}</span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>{t.subject}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>{t.date}</span>
                      <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: t.status === 'resolved' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: t.status === 'resolved' ? '#10b981' : '#f59e0b' }}>{t.status}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px', lineHeight: '1.5' }}>{t.message}</p>
                  {t.reply && (
                    <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px', padding: '10px 12px', marginTop: '8px' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#10b981', marginBottom: '4px' }}>💬 Support Reply</div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{t.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════ PROFILE SETTINGS PAGE ══════════════════════ */}
        {activeNav === 'Profile Settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>Profile Settings</h2>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>Manage your account details</p>
            </div>
            {/* Avatar + name */}
            <div style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>
                {(user?.name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9' }}>{user?.name || '—'}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>{user?.email}</div>
                <div style={{ fontSize: '11px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '2px 10px', borderRadius: '20px', display: 'inline-block', marginTop: '6px', fontWeight: '600' }}>Customer</div>
              </div>
            </div>
            {/* Personal info */}
            <div style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Personal Information</h3>
                <button onClick={() => setProfileEdit(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: profileEdit ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', border: `1px solid ${profileEdit ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}`, borderRadius: '8px', color: profileEdit ? '#10b981' : '#60a5fa', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  {profileEdit ? <><Save size={12} /> Save</> : <><Edit2 size={12} /> Edit</>}
                </button>
              </div>
              {[
                { icon: <User size={15} color="#64748b" />, label: 'Full Name',   key: 'name',  type: 'text',  placeholder: 'Your full name' },
                { icon: <Mail size={15} color="#64748b" />, label: 'Email',       key: 'email', type: 'email', placeholder: 'your@email.com' },
                { icon: <Phone size={15} color="#64748b" />, label: 'Phone',      key: 'phone', type: 'tel',   placeholder: '+91 9876543210' },
              ].map(({ icon, label, key, type, placeholder }) => (
                <div key={key} style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#131e2e', border: `1px solid ${profileEdit ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '10px' }}>
                    {icon}
                    <input type={type} value={profileForm[key]} onChange={e => setProfileForm(p => ({ ...p, [key]: e.target.value }))} readOnly={!profileEdit} placeholder={placeholder}
                      style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: profileEdit ? '#e2e8f0' : '#94a3b8', fontSize: '13px' }} />
                  </div>
                </div>
              ))}
              {profileEdit && (
                <button
                  disabled={savingProfile}
                  onClick={async () => {
                    setSavingProfile(true);
                    try {
                      await api.put('/users/me', { name: profileForm.name, phone: profileForm.phone });
                      setProfileEdit(false);
                      toast.success('Profile updated successfully!');
                    } catch {
                      toast.error('Failed to update profile. Please try again.');
                    } finally { setSavingProfile(false); }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: savingProfile ? '#1e3a5f' : '#3b82f6', border: 'none', borderRadius: '10px', color: savingProfile ? '#64748b' : '#fff', fontSize: '13px', fontWeight: '600', cursor: savingProfile ? 'not-allowed' : 'pointer', marginTop: '4px' }}>
                  <Save size={14} /> {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
            {/* Account stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
              {[
                { label: 'Vehicles', value: cars.length, color: '#3b82f6' },
                { label: 'Services Done', value: requests.filter(r => r.status === 'COMPLETED').length, color: '#10b981' },
                { label: 'Active Requests', value: requests.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS').length, color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Change Password */}
            <div style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showPwdForm ? '18px' : '0' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Change Password</h3>
                <button onClick={() => setShowPwdForm(p => !p)} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#94a3b8', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  {showPwdForm ? 'Cancel' : 'Change'}
                </button>
              </div>
              {showPwdForm && (
                <div>
                  {[['current','Current Password'],['newPwd','New Password'],['confirm','Confirm Password']].map(([key, label]) => (
                    <div key={key} style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '5px', fontWeight: '600' }}>{label}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#131e2e', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px' }}>
                        <Lock size={14} color="#64748b" />
                        <input type={showPwd[key] ? 'text' : 'password'} value={pwdForm[key]} onChange={e => setPwdForm(p => ({ ...p, [key]: e.target.value }))} placeholder="••••••••"
                          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: '13px' }} />
                        <button onClick={() => setShowPwd(p => ({ ...p, [key]: !p[key] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}>
                          {showPwd[key] ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={async () => {
                    if (pwdForm.newPwd !== pwdForm.confirm) { toast.error('Passwords do not match!'); return; }
                    if (pwdForm.newPwd.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
                    setSavingProfile(true);
                    try {
                      await api.put('/users/me/password', { current_password: pwdForm.current, new_password: pwdForm.newPwd });
                      setShowPwdForm(false); setPwdForm({ current: '', newPwd: '', confirm: '' });
                      toast.success('Password updated successfully!');
                    } catch (err) {
                      toast.error(err?.response?.data?.detail || 'Failed to update password.');
                    } finally { setSavingProfile(false); }
                  }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#3b82f6', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginTop: '4px' }}>
                    <Lock size={14} /> Update Password
                  </button>
                </div>
              )}
            </div>
            {/* Danger zone */}
            <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Danger Zone</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>Once you delete your account, there is no going back.</p>
              <button onClick={() => setConfirm({ title: 'Delete Account', message: 'Are you sure? All your data will be permanently deleted.', confirmLabel: 'Delete Account', confirmColor: '#ef4444', onConfirm: () => { logout(); navigate('/login'); } })}
                style={{ padding: '9px 18px', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '9px', color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                Delete Account
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Add Car Modal */}
      <AnimatePresence>
        {showAddCar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '420px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9' }}>Add Vehicle</h2>
                <button onClick={() => setShowAddCar(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
              </div>
              <form onSubmit={handleAddCar}>
                {[{ label: 'Car Brand', key: 'car_brand', placeholder: 'e.g. Toyota' }, { label: 'Car Model', key: 'car_model', placeholder: 'e.g. Camry' }, { label: 'Car Number', key: 'car_number', placeholder: 'e.g. ABC-1234' }].map(({ label, key, placeholder }) => (
                  <div key={key} style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '500' }}>{label}</label>
                    <input value={newCar[key]} onChange={e => setNewCar({ ...newCar, [key]: e.target.value })} placeholder={placeholder} required
                      style={{ width: '100%', padding: '10px 14px', background: '#131e2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                  <button type="button" onClick={() => setShowAddCar(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                  <button type="submit" disabled={submittingCar} style={{ flex: 1, padding: '12px', background: submittingCar ? '#1e3a5f' : '#3b82f6', border: 'none', borderRadius: '10px', color: submittingCar ? '#64748b' : '#fff', cursor: submittingCar ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    {submittingCar ? 'Saving...' : 'Save Vehicle'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service Modal — multi-select */}
      <AnimatePresence>
        {showServiceModal && (() => {
          const presets = ['Oil Change','Engine Repair','Brake Service','Tire Change','AC Service','General Service','Spare Parts','Wheel Alignment'];
          const allSelected = customService.trim() ? [...selectedServices, customService.trim()] : selectedServices;
          const canSubmit = allSelected.length > 0 && !submittingService;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>Request Service</h2>
                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>Select one or more services</p>
                  </div>
                  <button onClick={() => { setShowServiceModal(false); setSelectedServices([]); setCustomService(''); }}
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
                </div>

                {/* Vehicle selector */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Vehicle</label>
                  <select value={selectedCar?.id || ''} onChange={e => setSelectedCar(cars.find(c => c.id === parseInt(e.target.value)))}
                    style={{ width: '100%', padding: '10px 14px', background: '#131e2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#e2e8f0', fontSize: '13px', outline: 'none' }}>
                    {cars.map(c => <option key={c.id} value={c.id}>{c.car_brand} {c.car_model} — {c.car_number}</option>)}
                  </select>
                </div>

                {/* Services label + count badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Services</label>
                  {selectedServices.length > 0 && (
                    <span style={{ fontSize: '10px', fontWeight: '700', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', padding: '2px 10px', borderRadius: '20px' }}>
                      {selectedServices.length} selected
                    </span>
                  )}
                </div>

                {/* Preset service chips — multi-select */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px', marginBottom: '14px' }}>
                  {presets.map(s => {
                    const active = selectedServices.includes(s);
                    return (
                      <motion.button key={s} whileTap={{ scale: 0.96 }} onClick={() => toggleService(s)}
                        style={{
                          padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '500',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                          background: active ? 'rgba(59,130,246,0.18)' : '#131e2e',
                          border: `1px solid ${active ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.06)'}`,
                          color: active ? '#60a5fa' : '#94a3b8',
                          transition: 'all 0.15s',
                        }}>
                        <span>{s}</span>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? '#3b82f6' : 'rgba(255,255,255,0.05)', border: active ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
                          {active && <CheckCheck size={10} color="#fff" />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Custom service input */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '6px' }}>+ Add custom service</label>
                  <input value={customService} onChange={e => setCustomService(e.target.value)}
                    placeholder="e.g. Clutch Repair, Battery Replacement"
                    style={{ width: '100%', padding: '9px 14px', background: '#131e2e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', color: '#e2e8f0', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                {/* Selected summary */}
                {allSelected.length > 0 && (
                  <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Submitting {allSelected.length} request{allSelected.length > 1 ? 's' : ''}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {allSelected.map(s => (
                        <span key={s} style={{ fontSize: '11px', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', padding: '3px 10px', borderRadius: '20px', fontWeight: '500' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => { setShowServiceModal(false); setSelectedServices([]); setCustomService(''); }}
                    style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>
                    Cancel
                  </button>
                  <button onClick={handleRequestService} disabled={!canSubmit}
                    style={{ flex: 2, padding: '11px', background: canSubmit ? '#3b82f6' : '#1e2a3a', border: 'none', borderRadius: '10px', color: canSubmit ? '#fff' : '#475569', cursor: canSubmit ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    {submittingService
                      ? 'Submitting...'
                      : allSelected.length > 1
                        ? `Submit ${allSelected.length} Requests`
                        : 'Submit Request'}
                  </button>
                </div>

              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;