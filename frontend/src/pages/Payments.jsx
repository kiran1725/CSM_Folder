import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { paymentService, carService, serviceRequestService } from '../services/api';
import {
  LayoutDashboard, Calendar, Car, History, Receipt, Tag,
  Headphones, Settings, Bell, LogOut, Shield, X, CreditCard,
  Smartphone, Building2, Wallet, CheckCircle, Clock, AlertCircle,
  Plus, Lock, CheckCheck, Info, TriangleAlert, Trash2, RefreshCcw,
  MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Toast ─── */
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

/* ─── Constants ─── */
const METHOD_LABELS = { CREDIT_DEBIT_CARD: 'Credit / Debit Card', UPI: 'UPI', NET_BANKING: 'Net Banking', DIGITAL_WALLET: 'Digital Wallet' };
const METHOD_SUBLABELS = { CREDIT_DEBIT_CARD: 'Visa, MasterCard, Rupay & more', UPI: 'Pay using any UPI app', NET_BANKING: 'All major banks supported', DIGITAL_WALLET: 'Pay using Paytm, PhonePe, Google Pay & more' };
const SERVICE_PRICES = { 'General Service': 2499, 'Oil Change': 899, 'Brake Service': 699, 'Brake Inspection': 699, 'Engine Repair': 1999, 'Engine Check': 999, 'Tire Change': 599, 'AC Service': 999 };
const RAZORPAY_KEY_ID = 'rzp_test_SxekrXowMq4G6Z';
const GST_RATE = 18;
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',       path: '/dashboard' },
  { icon: Calendar,        label: 'My Appointments', path: '/dashboard' },
  { icon: Car,             label: 'My Vehicles',     path: '/dashboard' },
  { icon: History,         label: 'Service History', path: '/dashboard' },
  { icon: Receipt,         label: 'Invoices & Bills',path: '/dashboard' },
  { icon: Tag,             label: 'Offers & Coupons',path: '/dashboard' },
  { icon: Headphones,      label: 'Support Tickets', path: '/dashboard' },
  { icon: CreditCard,      label: 'Payments',        path: '/payments'  },
  { icon: Settings,        label: 'Profile Settings',path: '/dashboard' },
];

/* ─── Helpers ─── */
const MethodIcon = ({ method, size = 18 }) => ({ CREDIT_DEBIT_CARD: <CreditCard size={size} color="#60a5fa" />, UPI: <Smartphone size={size} color="#8b5cf6" />, NET_BANKING: <Building2 size={size} color="#10b981" />, DIGITAL_WALLET: <Wallet size={size} color="#f59e0b" /> }[method] || <CreditCard size={size} color="#60a5fa" />);

const StatusBadge = ({ status }) => {
  const cfg = { PAID: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Paid' }, PENDING: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'Pending' }, FAILED: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Failed' }, REFUNDED: { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6', label: 'Refunded' } }[status] || { bg: 'rgba(255,255,255,0.05)', color: '#94a3b8', label: status };
  return <span style={{ background: cfg.bg, color: cfg.color, fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' }}>{cfg.label}</span>;
};

/* ─── Sidebar ─── */
const Sidebar = ({ active, onNavigate, onLogout }) => (
  <aside style={{ width: '240px', flexShrink: 0, background: '#0d1521', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100 }}>
    <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Car size={20} color="#fff" /></div>
        <div><div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>CarHub Connect</div><div style={{ fontSize: '10px', color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase' }}>All Your Car Needs in One Hub</div></div>
      </div>
    </div>
    <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
      {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
        <button key={label} onClick={() => onNavigate(path)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', background: active === label ? 'rgba(59,130,246,0.15)' : 'transparent', color: active === label ? '#60a5fa' : '#64748b', transition: 'all 0.2s' }}>
          <Icon size={18} />
          <span style={{ fontSize: '13px', fontWeight: active === label ? '600' : '400' }}>{label}</span>
          {active === label && <div style={{ marginLeft: 'auto', width: '5px', height: '5px', borderRadius: '50%', background: '#3b82f6' }} />}
        </button>
      ))}
    </nav>
    <div style={{ margin: '0 12px 16px', background: 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(29,78,216,0.1))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '14px', padding: '16px' }}>
      <div style={{ width: '36px', height: '36px', background: 'rgba(59,130,246,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}><Shield size={18} color="#60a5fa" /></div>
      <p style={{ fontSize: '12px', fontWeight: '600', color: '#e2e8f0', marginBottom: '2px' }}>Need Help?</p>
      <p style={{ fontSize: '10px', color: '#64748b', marginBottom: '12px' }}>Our support team is always here for you.</p>
      <button style={{ border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', width: '100%', padding: '8px', background: '#3b82f6', color: '#fff' }}>Contact Support</button>
    </div>
    <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 12px 20px', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}>
      <LogOut size={16} /> Sign Out
    </button>
  </aside>
);

/* ─── Create Payment Modal ─── */
const CreatePaymentModal = ({ cars, requests, onClose, onCreate, toast }) => {
  const [selectedRequest, setSelectedRequest] = useState('');
  const [selectedMethod, setSelectedMethod]   = useState('CREDIT_DEBIT_CARD');
  const [submitting, setSubmitting]           = useState(false);

  const completedRequests = requests.filter(r => r.status === 'COMPLETED');

  const getLineItems = () => {
    const req = requests.find(r => String(r.id) === String(selectedRequest));
    if (!req) return [];
    return [{ label: req.service_type, amount: SERVICE_PRICES[req.service_type] ?? 999 }];
  };

  const lineItems  = getLineItems();
  const subtotal   = lineItems.reduce((s, i) => s + i.amount, 0);
  const gstAmount  = Math.round(subtotal * GST_RATE / 100);
  const total      = subtotal + gstAmount;
  const canProceed = selectedRequest !== '';

  const loadRazorpay = () =>
    new Promise(resolve => {
      if (window.Razorpay) return resolve(true);
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  // Map our method keys → Razorpay method config
  const getRazorpayMethodConfig = (method) => {
    switch (method) {
      case 'CREDIT_DEBIT_CARD':
        return { method: 'card' };
      case 'UPI':
        return { method: 'upi' };
      case 'NET_BANKING':
        return { method: 'netbanking' };
      case 'DIGITAL_WALLET':
        return { method: 'wallet' };
      default:
        return {};
    }
  };

  const savePaymentToBackend = async (razorpayPaymentId, method) => {
    await onCreate({
      service_request_id: parseInt(selectedRequest),
      service_breakdown: lineItems,
      subtotal,
      gst_rate: GST_RATE,
      gst_amount: gstAmount,
      discount: 0,
      total_amount: total,
      payment_method: method,
      razorpay_payment_id: razorpayPaymentId,
    });
  };

  const handleSubmit = async () => {
    if (!canProceed) return;
    setSubmitting(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Failed to load Razorpay. Check your internet connection.');
        setSubmitting(false);
        return;
      }

      const req = requests.find(r => String(r.id) === String(selectedRequest));

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: total * 100,
        currency: 'INR',
        name: 'CarHub Connect',
        description: req?.service_type || 'Auto Service Payment',
        image: 'https://ui-avatars.com/api/?name=CarHub+Connect&background=3b82f6&color=fff&size=128',
        config: {
          display: {
            ...(selectedMethod === 'CREDIT_DEBIT_CARD' && {
              blocks: { card: { name: 'Pay with Card', instruments: [{ method: 'card' }] } },
              sequence: ['block.card'],
              preferences: { show_default_blocks: false },
            }),
            ...(selectedMethod === 'UPI' && {
              blocks: { upi: { name: 'Pay via UPI', instruments: [{ method: 'upi' }] } },
              sequence: ['block.upi'],
              preferences: { show_default_blocks: false },
            }),
            ...(selectedMethod === 'NET_BANKING' && {
              blocks: { nb: { name: 'Pay via Net Banking', instruments: [{ method: 'netbanking' }] } },
              sequence: ['block.nb'],
              preferences: { show_default_blocks: false },
            }),
            ...(selectedMethod === 'DIGITAL_WALLET' && {
              blocks: { wallet: { name: 'Pay via Wallet', instruments: [{ method: 'wallet' }] } },
              sequence: ['block.wallet'],
              preferences: { show_default_blocks: false },
            }),
          },
        },
        handler: async (response) => {
          try {
            await savePaymentToBackend(response.razorpay_payment_id, selectedMethod);
            toast.success(`✅ Payment of ₹${total.toLocaleString('en-IN')} successful!`);
            onClose();
          } catch {
            toast.error('Payment done but failed to save. Note your Payment ID: ' + response.razorpay_payment_id);
          }
        },
        prefill: { name: '', email: '', contact: '' },
        notes: {
          service_type: req?.service_type || '',
          service_request_id: String(selectedRequest),
        },
        theme: {
          color: selectedMethod === 'CREDIT_DEBIT_CARD' ? '#3b82f6'
               : selectedMethod === 'UPI'               ? '#8b5cf6'
               : selectedMethod === 'NET_BANKING'       ? '#10b981'
               :                                          '#f59e0b',
        },
        modal: {
          backdropclose: false,
          escape: true,
          ondismiss: () => {
            toast.warning('Payment cancelled.');
            setSubmitting(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        toast.error(`Payment failed: ${resp.error?.description || 'Unknown error'}`);
        setSubmitting(false);
      });
      rzp.open();
      setSubmitting(false);
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
        style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', width: '100%', maxWidth: '860px', display: 'grid', gridTemplateColumns: '1fr 340px', overflow: 'hidden', maxHeight: '92vh' }}>

        {/* ── LEFT: Form ── */}
        <div style={{ padding: '32px', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>Payment</h2>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Complete your payment securely</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={13} color="#10b981" />
              <div><div style={{ fontSize: '11px', fontWeight: '600', color: '#10b981' }}>Secure Payment</div><div style={{ fontSize: '10px', color: '#475569' }}>Your payment is safe with us</div></div>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b' }}><X size={16} /></button>
            </div>
          </div>

          {/* Select service request */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Select Service Request</div>
            {completedRequests.length === 0 ? (
              <div style={{ background: '#131e2e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                No completed service requests. Mark a service as completed first.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {completedRequests.map(req => {
                  const car = cars.find(c => c.id === req.car_id);
                  const sel = String(selectedRequest) === String(req.id);
                  return (
                    <motion.div key={req.id} whileHover={{ scale: 1.005 }} onClick={() => setSelectedRequest(String(req.id))}
                      style={{ background: sel ? 'rgba(59,130,246,0.1)' : '#131e2e', border: `1px solid ${sel ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}>
                      <div style={{ width: '40px', height: '40px', background: sel ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Car size={20} color={sel ? '#60a5fa' : '#475569'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: sel ? '#e2e8f0' : '#94a3b8', marginBottom: '2px' }}>{req.service_type}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{car ? `${car.car_brand} ${car.car_model} · ${car.car_number}` : `Request #${String(req.id).padStart(4,'0')}`} · {new Date(req.request_date).toLocaleDateString('en-IN')}</div>
                      </div>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${sel ? '#3b82f6' : '#334155'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {sel && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Select payment method */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Select Payment Method</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.keys(METHOD_LABELS).map(method => {
                const sel = selectedMethod === method;
                return (
                  <motion.div key={method} whileHover={{ scale: 1.005 }} onClick={() => setSelectedMethod(method)}
                    style={{ background: sel ? 'rgba(59,130,246,0.08)' : '#131e2e', border: `1px solid ${sel ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.2s' }}>
                    <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><MethodIcon method={method} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: sel ? '#e2e8f0' : '#94a3b8' }}>{METHOD_LABELS[method]}</div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '1px' }}>{METHOD_SUBLABELS[method]}</div>
                    </div>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${sel ? '#3b82f6' : '#334155'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {sel && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[{ icon: <Shield size={13} color="#10b981" />, label: 'PCI DSS', sub: 'Certified' }, { icon: <Lock size={13} color="#3b82f6" />, label: '256-bit SSL', sub: 'Encrypted' }, { icon: <CheckCircle size={13} color="#10b981" />, label: '100% Secure', sub: 'Payments' }, { icon: <CheckCheck size={13} color="#8b5cf6" />, label: 'Trusted by', sub: '10M+ Customers' }].map(({ icon, label, sub }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '6px 10px', flex: '1', minWidth: '100px' }}>
                {icon}
                <div><div style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8' }}>{label}</div><div style={{ fontSize: '9px', color: '#475569' }}>{sub}</div></div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Invoice Summary ── */}
        <div style={{ background: '#080f1b', borderLeft: '1px solid rgba(255,255,255,0.06)', padding: '32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Invoice Summary</span>
            {selectedRequest && <span style={{ fontSize: '10px', color: '#334155' }}>INV-PREVIEW</span>}
          </div>

          {selectedRequest ? (() => {
            const req = requests.find(r => String(r.id) === String(selectedRequest));
            const car = req ? cars.find(c => c.id === req.car_id) : null;
            return (
              <>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ width: '44px', height: '44px', background: 'rgba(59,130,246,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Car size={22} color="#3b82f6" /></div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>{car ? `${car.car_brand} ${car.car_model}` : 'Vehicle'}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{car?.car_number || `SR #${String(req.id).padStart(4,'0')}`}</div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {lineItems.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>{item.label}</span>
                      <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '500' }}>₹{item.amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>GST (18%)</span>
                    <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '500' }}>₹{gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#e2e8f0' }}>Total Amount</span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <CheckCircle size={14} color="#10b981" />
                    <span style={{ fontSize: '12px', color: '#10b981' }}>Secure & encrypted transaction</span>
                  </div>
                </div>
              </>
            );
          })() : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: '12px', textAlign: 'center', gap: '8px' }}>
              <Receipt size={32} color="#1a2a3a" />
              <span>Select a completed service<br />to see the invoice</span>
            </div>
          )}

          <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={!canProceed || submitting}
            style={{ width: '100%', padding: '14px', background: canProceed && !submitting ? '#3b82f6' : '#131e2e', border: 'none', borderRadius: '12px', color: canProceed && !submitting ? '#fff' : '#334155', cursor: canProceed && !submitting ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', marginTop: '4px' }}>
            <Lock size={16} />
            {submitting ? 'Processing...' : canProceed ? `Pay ₹${total.toLocaleString('en-IN')} Securely` : 'Pay Securely'}
          </motion.button>
          <div style={{ textAlign: 'center', fontSize: '10px', color: '#334155', marginTop: '8px' }}>
            By proceeding, you agree to our <span style={{ color: '#3b82f6', cursor: 'pointer' }}>Terms &amp; Conditions</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Payment Detail Modal ─── */
const PaymentDetailModal = ({ payment, onClose }) => {
  if (!payment) return null;
  const items = payment.service_breakdown || [{ label: payment.service_type || 'Service', amount: payment.subtotal }];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
        style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9' }}>{payment.invoice_number}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{new Date(payment.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b' }}><X size={16} /></button>
        </div>

        {payment.car && (
          <div style={{ background: '#131e2e', borderRadius: '12px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(59,130,246,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Car size={20} color="#3b82f6" /></div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>{payment.car.car_brand} {payment.car.car_model}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{payment.car.car_number}</div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Service Breakdown</div>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>{item.label}</span>
              <span style={{ fontSize: '13px', color: '#e2e8f0' }}>₹{item.amount.toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>GST ({payment.gst_rate}%)</span>
            <span style={{ fontSize: '13px', color: '#e2e8f0' }}>₹{Math.round(payment.gst_amount).toLocaleString('en-IN')}</span>
          </div>
          {payment.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#10b981' }}>Discount</span>
              <span style={{ fontSize: '13px', color: '#10b981' }}>−₹{payment.discount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#e2e8f0' }}>Total</span>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#3b82f6' }}>₹{payment.total_amount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div style={{ background: '#131e2e', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Status</span>
            <StatusBadge status={payment.payment_status} />
          </div>
          {payment.payment_method && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Method</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MethodIcon method={payment.payment_method} size={14} /><span style={{ fontSize: '12px', color: '#94a3b8' }}>{METHOD_LABELS[payment.payment_method]}</span></div>
            </div>
          )}
          {payment.paid_at && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Paid at</span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(payment.paid_at).toLocaleString('en-IN')}</span>
            </div>
          )}
          {(payment.payment_status === 'PAID' || payment.payment_status === 'SUCCESS') && (
            <button
              onClick={() => window.open(`http://localhost:8000/payments/invoice/${payment.id}/pdf?token=${localStorage.getItem('token')}`, '_blank')}
              style={{ border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '10px', background: '#3b82f6', color: '#fff', fontSize: '12.5px', marginTop: '16px' }}
            >
              Download PDF Invoice
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Main Payments Page ─── */
const Payments = () => {
  const [payments, setPayments]           = useState([]);
  const [cars, setCars]                   = useState([]);
  const [requests, setRequests]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showCreate, setShowCreate]       = useState(false);
  const [detailPayment, setDetailPayment] = useState(null);
  const [filterStatus, setFilterStatus]   = useState('ALL');
  const toast    = useToast();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName  = user?.name || user?.email?.split('@')[0] || 'User';
  const pendingCount = payments.filter(p => p.payment_status === 'PENDING').length;

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pr, cr, rr] = await Promise.all([paymentService.getPayments(), carService.getCars(), serviceRequestService.getRequests()]);
      setPayments(pr.data); setCars(cr.data); setRequests(rr.data);
    } catch { toast.error('Failed to load payments. Please refresh.'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (payload) => {
    // 1. Create payment record
    const res = await paymentService.createPayment(payload);
    const paymentId = res?.data?.id;
    // 2. If Razorpay payment_id present → mark as PAID immediately
    if (paymentId && payload.razorpay_payment_id) {
      try {
        await paymentService.updatePayment(paymentId, { payment_status: 'PAID' });
      } catch (_) { /* non-fatal */ }
    }
    toast.success('Payment recorded successfully!');
    await fetchAll();
  };

  const handleDelete = async (id) => {
    try {
      await paymentService.deletePayment(id);
      toast.success('Invoice deleted.');
      setPayments(p => p.filter(pay => pay.id !== id));
    } catch { toast.error('Failed to delete invoice.'); }
  };

  const totalPaid    = payments.filter(p => p.payment_status === 'PAID').reduce((s, p) => s + p.total_amount, 0);
  const totalPending = payments.filter(p => p.payment_status === 'PENDING').reduce((s, p) => s + p.total_amount, 0);
  const paidCount    = payments.filter(p => p.payment_status === 'PAID').length;
  const filtered     = filterStatus === 'ALL' ? payments : payments.filter(p => p.payment_status === filterStatus);
  const FILTER_TABS  = ['ALL', 'PAID', 'PENDING', 'FAILED', 'REFUNDED'];
  const btn          = { border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', fontFamily: "'Segoe UI',sans-serif", color: '#e2e8f0' }}>
      <Toast toasts={toast.toasts} remove={toast.remove} />
      <Sidebar active="Payments" onNavigate={p => navigate(p)} onLogout={() => { logout(); navigate('/login'); }} />

      <main style={{ marginLeft: '240px', flex: 1, padding: '28px 32px', minHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>Payments</h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>Manage and track your payment history</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => toast.info(`${pendingCount} pending payment(s).`)}>
              <Bell size={20} color="#94a3b8" />
              {pendingCount > 0 && <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '14px', height: '14px', background: '#ef4444', borderRadius: '50%', fontSize: '8px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0a0f1a', fontWeight: '700' }}>{pendingCount}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#fff' }}>{displayName.charAt(0).toUpperCase()}</div>
              <div><div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>{displayName}</div><div style={{ fontSize: '10px', color: '#64748b' }}>Customer</div></div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Paid',     value: `₹${totalPaid.toLocaleString('en-IN')}`,   icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
            { label: 'Pending Amount', value: `₹${totalPending.toLocaleString('en-IN')}`, icon: Clock,       color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
            { label: 'Transactions',   value: paidCount,                                   icon: Receipt,     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <motion.div key={label} whileHover={{ y: -2 }}
              style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: bg, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={22} color={color} /></div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', lineHeight: 1 }}>{loading ? '—' : value}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Table card */}
        <div style={{ background: '#0d1521', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '4px', background: '#131e2e', borderRadius: '10px', padding: '4px' }}>
              {FILTER_TABS.map(tab => (
                <button key={tab} onClick={() => setFilterStatus(tab)}
                  style={{ ...btn, padding: '6px 14px', fontSize: '12px', fontWeight: filterStatus === tab ? '600' : '400', background: filterStatus === tab ? '#3b82f6' : 'transparent', color: filterStatus === tab ? '#fff' : '#64748b' }}>
                  {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <motion.button whileTap={{ scale: 0.97 }} onClick={fetchAll}
                style={{ ...btn, padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '12px' }}>
                <RefreshCcw size={14} /> Refresh
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowCreate(true)}
                style={{ ...btn, padding: '8px 16px', background: '#3b82f6', color: '#fff', fontSize: '13px' }}>
                <Plus size={16} /> New Payment
              </motion.button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: '12px' }}><RefreshCcw size={24} color="#334155" /></motion.div>
              <div style={{ fontSize: '13px' }}>Loading payments...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center' }}>
              <Receipt size={40} color="#1e3a5f" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>{filterStatus === 'ALL' ? 'No payments yet' : `No ${filterStatus.toLowerCase()} payments`}</div>
              <div style={{ fontSize: '12px', color: '#334155', marginBottom: '16px' }}>{filterStatus === 'ALL' ? 'Complete a service and record your first payment.' : 'Switch to a different filter.'}</div>
              {filterStatus === 'ALL' && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCreate(true)}
                  style={{ ...btn, display: 'inline-flex', padding: '9px 18px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: '13px' }}>
                  <Plus size={15} /> Create Payment
                </motion.button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Invoice', 'Service', 'Vehicle', 'Method', 'Date', 'Amount', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map(pay => (
                      <motion.tr key={pay.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        onClick={() => setDetailPayment(pay)}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#60a5fa' }}>{pay.invoice_number}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: '13px', color: '#e2e8f0' }}>{pay.service_type || '—'}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{pay.car ? `${pay.car.car_brand} ${pay.car.car_model}` : '—'}</div>
                          {pay.car && <div style={{ fontSize: '10px', color: '#475569' }}>{pay.car.car_number}</div>}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {pay.payment_method
                            ? <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MethodIcon method={pay.payment_method} size={14} /><span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{METHOD_LABELS[pay.payment_method]}</span></div>
                            : <span style={{ fontSize: '12px', color: '#334155' }}>—</span>}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(pay.created_at).toLocaleDateString('en-IN')}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>₹{pay.total_amount.toLocaleString('en-IN')}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <StatusBadge status={pay.payment_status} />
                        </td>
                        <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setDetailPayment(pay)}
                              style={{ padding: '5px 10px', background: 'rgba(59,130,246,0.1)', border: 'none', borderRadius: '6px', color: '#60a5fa', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}>
                              View
                            </motion.button>
                            {pay.payment_status === 'PENDING' && (
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(pay.id)}
                                style={{ padding: '5px 7px', background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Trash2 size={13} />
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && <CreatePaymentModal cars={cars} requests={requests} onClose={() => setShowCreate(false)} onCreate={handleCreate} toast={toast} />}
      </AnimatePresence>
      <AnimatePresence>
        {detailPayment && <PaymentDetailModal payment={detailPayment} onClose={() => setDetailPayment(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default Payments;