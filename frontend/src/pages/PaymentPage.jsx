import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ArrowLeft, CreditCard, Smartphone, Building2, Wallet,
  Shield, CheckCircle, Lock, X, Plus, Trash2,
  AlertCircle, CheckCheck, Info, TriangleAlert, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Toast ─── */
const Toast = ({ toasts, remove }) => (
  <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <AnimatePresence>
      {toasts.map(t => {
        const s = {
          success: { border: '#10b981', icon: <CheckCheck size={15} color="#10b981" /> },
          error:   { border: '#ef4444', icon: <AlertCircle size={15} color="#ef4444" /> },
          info:    { border: '#3b82f6', icon: <Info size={15} color="#3b82f6" /> },
          warning: { border: '#f59e0b', icon: <TriangleAlert size={15} color="#f59e0b" /> },
        }[t.type] || {};
        return (
          <motion.div key={t.id} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
            style={{ background: '#0d1521', border: `1px solid ${s.border}`, borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', minWidth: '280px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
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
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, remove, success: m => add(m, 'success'), error: m => add(m, 'error'), info: m => add(m, 'info'), warning: m => add(m, 'warning') };
};

/* ─── Card logo ─── */
const CardLogo = ({ type, size = 32 }) => {
  const logos = {
    visa:       <div style={{ fontSize: size * 0.45 + 'px', fontWeight: '900', color: '#1a1f71', fontStyle: 'italic', letterSpacing: '-1px' }}>VISA</div>,
    mastercard: <div style={{ display: 'flex' }}><div style={{ width: size * 0.55 + 'px', height: size * 0.55 + 'px', borderRadius: '50%', background: '#eb001b', opacity: 0.9 }} /><div style={{ width: size * 0.55 + 'px', height: size * 0.55 + 'px', borderRadius: '50%', background: '#f79e1b', marginLeft: -(size * 0.25) + 'px' }} /></div>,
    amex:       <div style={{ fontSize: size * 0.35 + 'px', fontWeight: '900', color: '#007bc1' }}>AMEX</div>,
    rupay:      <div style={{ fontSize: size * 0.35 + 'px', fontWeight: '900', color: '#1a5276' }}>RuPay</div>,
  };
  return logos[type] || <CreditCard size={size * 0.6} color="#94a3b8" />;
};

/* ─── Payment Methods config ─── */
const METHODS = [
  { id: 'CREDIT_DEBIT_CARD', label: 'Credit / Debit Card', sub: 'Visa, MasterCard, Rupay & more', icon: CreditCard },
  { id: 'UPI',               label: 'UPI',                 sub: 'Pay using any UPI app',          icon: Smartphone },
  { id: 'NET_BANKING',       label: 'Net Banking',         sub: 'All major banks supported',      icon: Building2 },
  { id: 'DIGITAL_WALLET',    label: 'Digital Wallets',     sub: 'Pay using Paytm, PhonePe, Google Pay & more', icon: Wallet },
];

const UPI_APPS = ['PhonePe', 'Google Pay', 'Paytm', 'BHIM', 'Amazon Pay'];
const BANKS   = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Yes Bank'];
const WALLETS = ['Paytm', 'PhonePe', 'Amazon Pay', 'Mobikwik', 'Freecharge'];

/* ─── Main Component ─── */
const PaymentPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();
  const toast     = useToast();

  // Payment context passed via navigate state
  const paymentContext = location.state || {};
  const {
    serviceRequestId = null,
    serviceType      = 'General Service',
    carBrand         = '',
    carModel         = '',
    carNumber        = '',
    lineItems        = [],   // [{ label, amount }]
  } = paymentContext;

  // Build line items with defaults if none passed
  const items = lineItems.length > 0 ? lineItems : [
    { label: serviceType || 'Service Charge', amount: 1499 },
  ];

  const subtotal   = items.reduce((s, i) => s + i.amount, 0);
  const gstRate    = 18;
  const gstAmount  = Math.round(subtotal * gstRate / 100);
  const discount   = 0;
  const total      = subtotal + gstAmount - discount;

  // State
  const [selectedMethod, setSelectedMethod] = useState('CREDIT_DEBIT_CARD');
  const [savedCards, setSavedCards]         = useState([]);
  const [selectedCard, setSelectedCard]     = useState(null);
  const [showAddCard, setShowAddCard]       = useState(false);
  const [processing, setProcessing]         = useState(false);
  const [paid, setPaid]                     = useState(false);
  const [paidData, setPaidData]             = useState(null);

  // Card form
  const [cardForm, setCardForm] = useState({ number: '', name: '', expiry: '', cvv: '', save: true });
  // UPI
  const [upiId, setUpiId]       = useState('');
  const [upiApp, setUpiApp]     = useState('');
  // Net banking
  const [bank, setBank]         = useState('');
  // Wallet
  const [wallet, setWallet]     = useState('');
  // Add card form
  const [newCard, setNewCard]   = useState({ number: '', name: '', expiry: '', isDefault: false });

  useEffect(() => { fetchSavedCards(); }, []);

  const fetchSavedCards = async () => {
    try {
      const res = await api.get('/payments/saved-cards');
      setSavedCards(res.data);
      const def = res.data.find(c => c.is_default);
      if (def) setSelectedCard(def.id);
    } catch { /* no cards yet */ }
  };

  const detectCardType = (num) => {
    const n = num.replace(/\s/g, '');
    if (n.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(n)) return 'mastercard';
    if (/^3[47]/.test(n)) return 'amex';
    if (n.startsWith('6')) return 'rupay';
    return 'unknown';
  };

  const formatCardNumber = (val) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (val) => {
    const d = val.replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? d.slice(0,2) + '/' + d.slice(2) : d;
  };

  const handleAddSavedCard = async () => {
    if (!newCard.number || !newCard.expiry) return toast.warning('Enter card number and expiry.');
    const last4    = newCard.number.replace(/\s/g, '').slice(-4);
    const cardType = detectCardType(newCard.number);
    try {
      await api.post('/payments/saved-cards', {
        card_type:    cardType,
        last4,
        expiry:       newCard.expiry,
        name_on_card: newCard.name,
        is_default:   newCard.isDefault,
      });
      toast.success('Card saved successfully!');
      setShowAddCard(false);
      setNewCard({ number: '', name: '', expiry: '', isDefault: false });
      fetchSavedCards();
    } catch { toast.error('Failed to save card.'); }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await api.delete(`/payments/saved-cards/${cardId}`);
      toast.info('Card removed.');
      fetchSavedCards();
    } catch { toast.error('Failed to remove card.'); }
  };

  const handleSetDefault = async (cardId) => {
    try {
      await api.patch(`/payments/saved-cards/${cardId}/set-default`);
      fetchSavedCards();
    } catch { toast.error('Failed to update default card.'); }
  };

  const handlePay = async () => {
    // Validate
    if (selectedMethod === 'CREDIT_DEBIT_CARD' && !selectedCard && (!cardForm.number || !cardForm.name || !cardForm.expiry || !cardForm.cvv)) {
      return toast.warning('Please fill in all card details.');
    }
    if (selectedMethod === 'UPI' && !upiId && !upiApp) return toast.warning('Enter UPI ID or select a UPI app.');
    if (selectedMethod === 'NET_BANKING' && !bank) return toast.warning('Please select a bank.');
    if (selectedMethod === 'DIGITAL_WALLET' && !wallet) return toast.warning('Please select a wallet.');

    setProcessing(true);
    try {
      // 1. Initiate payment record
      const initiateRes = await api.post('/payments/initiate', {
        service_request_id: serviceRequestId,
        service_breakdown:  items,
        subtotal,
        gst_rate:   gstRate,
        gst_amount: gstAmount,
        discount,
        total_amount: total,
        payment_method: selectedMethod,
      });

      const paymentId = initiateRes.data.id;

      // 2. Process/confirm payment
      const payRes = await api.patch(`/payments/${paymentId}/pay`, {
        payment_method: selectedMethod,
        notes: selectedMethod === 'UPI' ? (upiId || upiApp) : selectedMethod === 'NET_BANKING' ? bank : selectedMethod === 'DIGITAL_WALLET' ? wallet : (selectedCard ? `Saved card` : `**** ${cardForm.number.slice(-4)}`),
      });

      // 3. Auto-save new card if checkbox ticked
      if (selectedMethod === 'CREDIT_DEBIT_CARD' && !selectedCard && cardForm.save && cardForm.number) {
        try {
          await api.post('/payments/saved-cards', {
            card_type:    detectCardType(cardForm.number),
            last4:        cardForm.number.replace(/\s/g,'').slice(-4),
            expiry:       cardForm.expiry,
            name_on_card: cardForm.name,
            is_default:   savedCards.length === 0,
          });
        } catch { /* non-critical */ }
      }

      setPaidData(payRes.data);
      setPaid(true);
      toast.success(`Payment of ₹${total.toLocaleString()} successful!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  /* ─── Success Screen ─── */
  if (paid && paidData) return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI',sans-serif" }}>
      <Toast toasts={toast.toasts} remove={toast.remove} />
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: '#0d1521', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '24px', padding: '48px', maxWidth: '480px', width: '90%', textAlign: 'center' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
          style={{ width: '80px', height: '80px', background: 'rgba(16,185,129,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <CheckCircle size={40} color="#10b981" />
        </motion.div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#f1f5f9', marginBottom: '8px' }}>Payment Successful!</h2>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>Your payment has been processed securely.</p>
        <div style={{ background: '#131e2e', borderRadius: '16px', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Invoice Number</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#60a5fa' }}>{paidData.invoice_number}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Amount Paid</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>₹{paidData.total_amount.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Payment Method</span>
            <span style={{ fontSize: '12px', color: '#e2e8f0' }}>{paidData.payment_method?.replace(/_/g,' ')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Status</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '2px 10px', borderRadius: '20px' }}>PAID</span>
          </div>
        </div>
        <button onClick={() => navigate('/dashboard')}
          style={{ width: '100%', padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </motion.div>
    </div>
  );

  /* ─── Main Payment UI ─── */
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Segoe UI',sans-serif" }}>
      <Toast toasts={toast.toasts} remove={toast.remove} />

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/dashboard')}
            style={{ width: '36px', height: '36px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={18} color="#475569" />
          </button>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Payment</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Complete your payment securely</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
          <Shield size={18} color="#3b82f6" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>Secure Payment</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Your payment is safe with us</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>

        {/* Left: Payment Methods */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Method selector */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '16px' }}>Select Payment Method</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {METHODS.map(({ id, label, sub, icon: Icon }) => (
                <div key={id} onClick={() => setSelectedMethod(id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', border: `2px solid ${selectedMethod === id ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '12px', cursor: 'pointer', background: selectedMethod === id ? '#eff6ff' : '#fff', transition: 'all 0.15s' }}>
                  <div style={{ width: '40px', height: '40px', background: selectedMethod === id ? '#dbeafe' : '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} color={selectedMethod === id ? '#3b82f6' : '#64748b'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{label}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{sub}</div>
                  </div>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${selectedMethod === id ? '#3b82f6' : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedMethod === id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Method-specific inputs */}
          <AnimatePresence mode="wait">

            {/* Card */}
            {selectedMethod === 'CREDIT_DEBIT_CARD' && (
              <motion.div key="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

                {/* Saved cards */}
                {savedCards.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>Saved Cards</h4>
                      <button onClick={() => setShowAddCard(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                        <Plus size={14} /> Add New Card
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {savedCards.map(card => (
                        <div key={card.id} onClick={() => setSelectedCard(card.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', border: `2px solid ${selectedCard === card.id ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '12px', cursor: 'pointer', background: selectedCard === card.id ? '#eff6ff' : '#fff' }}>
                          <div style={{ width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CardLogo type={card.card_type} size={36} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>**** **** **** {card.last4}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Expires {card.expiry} {card.name_on_card ? `· ${card.name_on_card}` : ''}</div>
                          </div>
                          {card.is_default && <span style={{ fontSize: '10px', background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>Default</span>}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {!card.is_default && (
                              <button onClick={e => { e.stopPropagation(); handleSetDefault(card.id); }}
                                style={{ fontSize: '10px', color: '#3b82f6', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer' }}>Set Default</button>
                            )}
                            <button onClick={e => { e.stopPropagation(); handleDeleteCard(card.id); }}
                              style={{ background: '#fff', border: '1px solid #fee2e2', borderRadius: '6px', padding: '3px 6px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${selectedCard === card.id ? '#3b82f6' : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {selectedCard === card.id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }} />}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setSelectedCard(null)}
                      style={{ marginTop: '12px', fontSize: '13px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                      Use a different card
                    </button>
                  </div>
                )}

                {/* New card form */}
                {(!selectedCard || savedCards.length === 0) && (
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '14px' }}>
                      {savedCards.length > 0 ? 'Enter New Card' : 'Card Details'}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Card Number</label>
                        <div style={{ position: 'relative' }}>
                          <input value={cardForm.number} onChange={e => setCardForm({ ...cardForm, number: formatCardNumber(e.target.value) })}
                            placeholder="0000 0000 0000 0000"
                            style={{ width: '100%', padding: '11px 44px 11px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', letterSpacing: '2px' }} />
                          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                            <CardLogo type={detectCardType(cardForm.number)} size={28} />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Name on Card</label>
                        <input value={cardForm.name} onChange={e => setCardForm({ ...cardForm, name: e.target.value })}
                          placeholder="As printed on card"
                          style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Expiry Date</label>
                          <input value={cardForm.expiry} onChange={e => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })}
                            placeholder="MM/YY"
                            style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px', fontWeight: '500' }}>CVV</label>
                          <input value={cardForm.cvv} onChange={e => setCardForm({ ...cardForm, cvv: e.target.value.slice(0,4) })}
                            placeholder="•••" type="password" maxLength={4}
                            style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" id="saveCard" checked={cardForm.save} onChange={e => setCardForm({ ...cardForm, save: e.target.checked })} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                        <label htmlFor="saveCard" style={{ fontSize: '13px', color: '#475569', cursor: 'pointer' }}>Save card for future payments</label>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px' }}>
                  <Lock size={13} /><span>Your payment details are encrypted and secure.</span>
                </div>
              </motion.div>
            )}

            {/* UPI */}
            {selectedMethod === 'UPI' && (
              <motion.div key="upi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '16px' }}>UPI Payment</h4>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Enter UPI ID</label>
                  <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi"
                    style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', marginBottom: '14px' }}>— or choose a UPI app —</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                  {UPI_APPS.map(app => (
                    <div key={app} onClick={() => setUpiApp(app)}
                      style={{ padding: '12px', border: `2px solid ${upiApp === app ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '10px', textAlign: 'center', cursor: 'pointer', background: upiApp === app ? '#eff6ff' : '#fff' }}>
                      <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                        {app === 'PhonePe' ? '💜' : app === 'Google Pay' ? '🔵' : app === 'Paytm' ? '💙' : app === 'BHIM' ? '🟠' : '🟡'}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: upiApp === app ? '#3b82f6' : '#475569' }}>{app}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Net Banking */}
            {selectedMethod === 'NET_BANKING' && (
              <motion.div key="netbank" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '16px' }}>Net Banking</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {BANKS.map(b => (
                    <div key={b} onClick={() => setBank(b)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: `2px solid ${bank === b ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '10px', cursor: 'pointer', background: bank === b ? '#eff6ff' : '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Building2 size={18} color={bank === b ? '#3b82f6' : '#94a3b8'} />
                        <span style={{ fontSize: '13px', fontWeight: '500', color: '#0f172a' }}>{b}</span>
                      </div>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${bank === b ? '#3b82f6' : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {bank === b && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Digital Wallet */}
            {selectedMethod === 'DIGITAL_WALLET' && (
              <motion.div key="wallet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '16px' }}>Digital Wallets</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {WALLETS.map(w => (
                    <div key={w} onClick={() => setWallet(w)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', border: `2px solid ${wallet === w ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '10px', cursor: 'pointer', background: wallet === w ? '#eff6ff' : '#fff' }}>
                      <span style={{ fontSize: '22px' }}>{w === 'Paytm' ? '💙' : w === 'PhonePe' ? '💜' : w === 'Amazon Pay' ? '🟡' : w === 'Mobikwik' ? '🔵' : '🟢'}</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{w}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>Digital Wallet</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trust badges */}
          <div style={{ background: '#fff', borderRadius: '14px', padding: '16px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
            {[{ icon: '🔒', label: 'PCI DSS', sub: 'Certified' }, { icon: '🛡️', label: '256-bit SSL', sub: 'Encrypted' }, { icon: '✅', label: '100% Secure', sub: 'Payments' }, { icon: '⭐', label: 'Trusted by', sub: '10M+ Customers' }].map(({ icon, label, sub }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>{icon}</div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#0f172a' }}>{label}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Invoice Summary */}
        <div style={{ position: 'sticky', top: '90px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>Invoice Summary</h3>
              <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>INV-{new Date().getFullYear()}-XXXX</span>
            </div>

            {/* Car info */}
            {(carBrand || carModel) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: '#f8fafc', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ fontSize: '36px' }}>🚗</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{carBrand} {carModel}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{carNumber}</div>
                </div>
              </div>
            )}

            {/* Line items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#475569' }}>{item.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#0f172a' }}>₹{item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#475569' }}>GST ({gstRate}%)</span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#0f172a' }}>₹{gstAmount.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#10b981' }}>Discount</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#10b981' }}>-₹{discount.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Total Amount</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#3b82f6' }}>₹{total.toLocaleString()}</span>
            </div>

            {discount > 0 && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '16px' }}>🎉</span>
                <span style={{ fontSize: '12px', color: '#166534', fontWeight: '500' }}>You are saving ₹{discount.toLocaleString()} on this service</span>
              </div>
            )}

            {/* Pay button */}
            <motion.button
              onClick={handlePay}
              disabled={processing}
              whileHover={{ scale: processing ? 1 : 1.01 }}
              whileTap={{ scale: processing ? 1 : 0.98 }}
              style={{ width: '100%', padding: '16px', background: processing ? '#93c5fd' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}>
              <Lock size={18} />
              {processing ? 'Processing Payment...' : `Pay ₹${total.toLocaleString()} Securely`}
            </motion.button>

            <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '12px' }}>
              By proceeding, you agree to our <span style={{ color: '#3b82f6', cursor: 'pointer' }}>Terms & Conditions</span>
            </p>
          </div>

          {/* Payment Offers */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '14px' }}>Payment Offers</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', background: '#ede9fe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>%</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>10% Instant Discount</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>On SBI Credit Cards</div>
                </div>
              </div>
              <button style={{ fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Apply</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <span style={{ fontSize: '13px', color: '#475569' }}>Have a coupon code?</span>
              <button style={{ fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }} onClick={() => toast.info('Enter coupon code feature coming soon!')}>Apply Code</button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Card Modal */}
      <AnimatePresence>
        {showAddCard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Add New Card</h3>
                <button onClick={() => setShowAddCard(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}><X size={18} color="#64748b" /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Card Number</label>
                  <input value={newCard.number} onChange={e => setNewCard({ ...newCard, number: formatCardNumber(e.target.value) })}
                    placeholder="0000 0000 0000 0000"
                    style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', letterSpacing: '2px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Name on Card</label>
                  <input value={newCard.name} onChange={e => setNewCard({ ...newCard, name: e.target.value })} placeholder="Full name"
                    style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Expiry</label>
                  <input value={newCard.expiry} onChange={e => setNewCard({ ...newCard, expiry: formatExpiry(e.target.value) })} placeholder="MM/YY"
                    style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="isDefault" checked={newCard.isDefault} onChange={e => setNewCard({ ...newCard, isDefault: e.target.checked })} style={{ width: '16px', height: '16px' }} />
                  <label htmlFor="isDefault" style={{ fontSize: '13px', color: '#475569' }}>Set as default card</label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setShowAddCard(false)} style={{ flex: 1, padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                <button onClick={handleAddSavedCard} style={{ flex: 1, padding: '12px', background: '#3b82f6', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Save Card</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentPage;