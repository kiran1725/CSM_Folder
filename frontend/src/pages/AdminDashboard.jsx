import React, { useState, useEffect, useCallback } from 'react';
import { serviceRequestService, adminService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Users, Car, Wrench, UserCheck,
  Receipt, BarChart2, Bell, Settings, LogOut,
  Clock, CheckCircle, AlertCircle, Search, Filter,
  TrendingUp, TrendingDown, RefreshCw, ChevronDown, X,
  CheckCheck, Info, TriangleAlert, Construction, Mail,
  Phone, Hash, MapPin, User, Shield, Trash2, BellOff,
  Edit3, Save, Eye, EyeOff, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Services from './Services';

/* ─── Toast ─── */
const Toast = ({ toasts, remove }) => (
  <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <AnimatePresence>
      {toasts.map(t => {
        const s = {
          success: { border: '#10b981', icon: <CheckCheck size={15} color="#10b981" /> },
          error:   { border: '#ef4444', icon: <AlertCircle size={15} color="#ef4444" /> },
          info:    { border: '#7c3aed', icon: <Info size={15} color="#7c3aed" /> },
          warning: { border: '#f59e0b', icon: <TriangleAlert size={15} color="#f59e0b" /> },
        }[t.type] || {};
        return (
          <motion.div key={t.id} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
            style={{ background: '#fff', border: `1px solid ${s.border}`, borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', minWidth: '280px', maxWidth: '360px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
            {s.icon}
            <span style={{ flex: 1, fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>{t.msg}</span>
            <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={14} /></button>
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
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '380px', margin: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>{title}</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>{message}</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onCancel} style={{ flex: 1, padding: '11px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>Cancel</button>
            <button onClick={onConfirm} style={{ flex: 1, padding: '11px', background: confirmColor, border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>{confirmLabel}</button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ActionBtn = ({ onClick, label, bg, color, loading: l }) => (
  <button onClick={onClick} disabled={l}
    style={{ padding: '5px 14px', background: l ? '#f1f5f9' : bg, color: l ? '#94a3b8' : color, border: 'none', borderRadius: '7px', fontSize: '11px', cursor: l ? 'not-allowed' : 'pointer', fontWeight: '600', minWidth: '60px', transition: 'all 0.2s' }}>
    {l ? '...' : label}
  </button>
);

const ComingSoon = ({ label, icon: Icon }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
    <div style={{ width: '72px', height: '72px', background: '#f1f5f9', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={32} color="#c4b5fd" />
    </div>
    <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{label}</div>
    <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Construction size={14} /> This section is coming soon
    </div>
  </motion.div>
);

const getStatusStyle = (s) => ({ PENDING: { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' }, IN_PROGRESS: { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' }, COMPLETED: { bg: '#d1fae5', color: '#065f46', dot: '#10b981' }, CANCELLED: { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' } }[s] || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8' });
const getStatusIcon = (s) => ({ PENDING: <Clock size={13} />, IN_PROGRESS: <Wrench size={13} />, COMPLETED: <CheckCircle size={13} />, CANCELLED: <AlertCircle size={13} /> }[s] || null);

/* ══════════════════════════════════════════
   SETTINGS SECTION
══════════════════════════════════════════ */
const SettingsSection = ({ users, cars, requests, toast, defaultTab, notifications, setNotifications }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab || 'profile');
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [twoFA, setTwoFA] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30 minutes');
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const SESSION_OPTIONS = ['5 minutes', '15 minutes', '30 minutes', '1 hour', '2 hours', '4 hours', '8 hours'];
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    role: user?.role || 'ADMIN',
  });

  const markAllRead = () => {
    setNotifications(p => p.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read.');
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success('All notifications cleared.');
  };

  const clearOne = (id) => setNotifications(p => p.filter(n => n.id !== id));

  const handleSaveProfile = () => {
    setEditMode(false);
    setShowPassword(false);
    if (password) {
      toast.success('Profile & password updated successfully!');
    } else {
      toast.success('Profile updated successfully!');
    }
    setPassword('');
  };

  const inp = { width: '100%', padding: '10px 14px', background: editMode ? '#fff' : '#f8fafc', border: `1px solid ${editMode ? '#a78bfa' : '#e2e8f0'}`, borderRadius: '10px', fontSize: '13px', color: editMode ? '#0f172a' : '#64748b', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' };

  const tabs = [
    { id: 'profile', label: 'Admin Profile', icon: User },
    { id: 'customers', label: 'Customer Accounts', icon: Users },
    { id: 'notifications', label: `Notifications ${notifications.filter(n => !n.read).length > 0 ? `(${notifications.filter(n => !n.read).length})` : ''}`, icon: Bell },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Settings</h2>
        <p style={{ fontSize: '12px', color: '#94a3b8' }}>Manage your profile, customer accounts and notifications</p>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '12px', padding: '4px', marginBottom: '20px', width: 'fit-content' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: activeTab === id ? '600' : '400', background: activeTab === id ? '#fff' : 'transparent', color: activeTab === id ? '#7c3aed' : '#64748b', boxShadow: activeTab === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── ADMIN PROFILE TAB ── */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Profile card */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>Admin Credentials</h3>
              <button onClick={() => editMode ? handleSaveProfile() : setEditMode(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: editMode ? '#7c3aed' : '#f1f5f9', color: editMode ? '#fff' : '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                {editMode ? <><Save size={13} /> Save</> : <><Edit3 size={13} /> Edit</>}
              </button>
            </div>

            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '16px', background: 'linear-gradient(135deg,#ede9fe,#f5f3ff)', borderRadius: '12px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                {(profile.name || profile.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{profile.name || 'Admin'}</div>
                <div style={{ fontSize: '11px', color: '#7c3aed', fontWeight: '500', marginTop: '2px' }}>{profile.role} · Super Admin</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Active</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Full Name', key: 'name', icon: User, placeholder: 'Enter full name' },
                { label: 'Email Address', key: 'email', icon: Mail, placeholder: 'Enter email', type: 'email' },
                { label: 'Phone Number', key: 'phone', icon: Phone, placeholder: 'Enter phone number' },
                { label: 'Address', key: 'address', icon: MapPin, placeholder: 'Enter address' },
              ].map(({ label, key, icon: Icon, placeholder, type = 'text' }) => (
                <div key={key}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <Icon size={14} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type={type} value={profile[key]} readOnly={!editMode}
                      onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ ...inp, paddingLeft: '36px' }} />
                  </div>
                </div>
              ))}

              {/* Password row */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Shield size={14} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={editMode ? password : '••••••••'}
                    readOnly={!editMode}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={editMode ? 'Enter new password' : ''}
                    style={{ ...inp, paddingLeft: '36px', paddingRight: '40px' }}
                  />
                  <button onClick={() => setShowPassword(p => !p)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {editMode && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>Leave blank to keep current password</div>}
              </div>
            </div>

            {editMode && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                <button onClick={() => setEditMode(false)} style={{ flex: 1, padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>Cancel</button>
                <button onClick={handleSaveProfile} style={{ flex: 1, padding: '10px', background: '#7c3aed', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Save Changes</button>
              </div>
            )}
          </div>

          {/* Stats card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '16px' }}>System Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'Total Users', value: users.length, color: '#7c3aed', bg: '#ede9fe', icon: Users },
                  { label: 'Total Vehicles', value: cars.length, color: '#0891b2', bg: '#e0f2fe', icon: Car },
                  { label: 'Total Requests', value: requests.length, color: '#059669', bg: '#d1fae5', icon: Wrench },
                  { label: 'Pending', value: requests.filter(r => r.status === 'PENDING').length, color: '#d97706', bg: '#fef3c7', icon: Clock },
                ].map(({ label, value, color, bg, icon: Icon }) => (
                  <div key={label} style={{ background: bg, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                    <Icon size={18} color={color} style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '20px', fontWeight: '700', color, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: '10px', color: color, opacity: 0.7, marginTop: '3px' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '14px' }}>Account Security</h3>

              {/* 2FA Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#1e293b' }}>Two-factor authentication</div>
                  <div style={{ fontSize: '11px', color: twoFA ? '#10b981' : '#ef4444', marginTop: '2px' }}>{twoFA ? 'Enabled' : 'Disabled'}</div>
                </div>
                <button
                  onClick={() => {
                    setTwoFA(p => !p);
                    toast.success(twoFA ? '2FA disabled.' : '2FA enabled successfully!');
                  }}
                  style={{
                    padding: '5px 14px', border: 'none', borderRadius: '7px', cursor: 'pointer',
                    fontSize: '11px', fontWeight: '600', transition: 'all 0.2s',
                    background: twoFA ? '#fee2e2' : '#7c3aed',
                    color: twoFA ? '#dc2626' : '#fff',
                  }}>
                  {twoFA ? 'Disable' : 'Enable'}
                </button>
              </div>

              {/* Last login Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#1e293b' }}>Last login</div>
                  <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>Just now</div>
                </div>
              </div>

              {/* Session Timeout Row */}
              <div style={{ padding: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#1e293b' }}>Session timeout</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{sessionTimeout}</div>
                  </div>
                  <button
                    onClick={() => setShowSessionPicker(p => !p)}
                    style={{ padding: '5px 12px', background: showSessionPicker ? '#ede9fe' : '#f1f5f9', border: `1px solid ${showSessionPicker ? '#a78bfa' : '#e2e8f0'}`, borderRadius: '7px', color: showSessionPicker ? '#7c3aed' : '#64748b', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}>
                    {showSessionPicker ? 'Close' : 'Change'}
                  </button>
                </div>
                {showSessionPicker && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                    {SESSION_OPTIONS.map(opt => (
                      <button key={opt} onClick={() => {
                        setSessionTimeout(opt);
                        setShowSessionPicker(false);
                        toast.success(`Session timeout set to ${opt}`);
                      }}
                        style={{
                          padding: '5px 12px', borderRadius: '20px', border: '1px solid',
                          fontSize: '11px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.15s',
                          background: sessionTimeout === opt ? '#7c3aed' : '#f8fafc',
                          color: sessionTimeout === opt ? '#fff' : '#64748b',
                          borderColor: sessionTimeout === opt ? '#7c3aed' : '#e2e8f0',
                        }}>
                        {opt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOMER ACCOUNTS TAB ── */}
      {activeTab === 'customers' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '18px' }}>Customer Credentials & Vehicle Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {users.map((customer, i) => {
              const customerCars = cars.filter(c => c.user_id === customer.id);
              const customerReqs = requests.filter(r => r.user_id === customer.id);
              const activeReq = customerReqs.find(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS');
              return (
                <motion.div key={customer.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                  {/* Customer header */}
                  <div style={{ background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: `hsl(${(customer.id * 47) % 360},60%,85%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: `hsl(${(customer.id * 47) % 360},50%,35%)`, flexShrink: 0 }}>
                      {(customer.name || customer.email).charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{customer.name || '—'}</div>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={12} />{customer.email}</span>
                        <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}><Phone size={12} />{customer.phone || 'No phone'}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}><Hash size={12} />ID: {customer.id}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#7c3aed' }}>{customerReqs.length}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Services</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#059669' }}>{customerReqs.filter(r => r.status === 'COMPLETED').length}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Done</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#0891b2' }}>{customerCars.length}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Vehicles</div>
                      </div>
                    </div>
                    {activeReq && (
                      <span style={{ background: getStatusStyle(activeReq.status).bg, color: getStatusStyle(activeReq.status).color, fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600', flexShrink: 0 }}>
                        {activeReq.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Vehicles row */}
                  {customerCars.length > 0 && (
                    <div style={{ padding: '12px 20px', background: '#fff', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Registered Vehicles</div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {customerCars.map(car => {
                          const carReqs = requests.filter(r => r.car_id === car.id);
                          const carActive = carReqs.find(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS');
                          return (
                            <div key={car.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px' }}>
                              <div style={{ width: '32px', height: '32px', background: '#ede9fe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Car size={16} color="#7c3aed" /></div>
                              <div>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>{car.car_brand} {car.car_model}</div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                                  <span style={{ fontSize: '10px', color: '#64748b', background: '#e2e8f0', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>{car.car_number}</span>
                                  {carActive && <span style={{ fontSize: '10px', color: getStatusStyle(carActive.status).color, background: getStatusStyle(carActive.status).bg, padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>{carActive.status.replace('_', ' ')}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* No vehicles */}
                  {customerCars.length === 0 && (
                    <div style={{ padding: '12px 20px', background: '#fff', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Car size={14} /> No vehicles registered yet
                    </div>
                  )}
                </motion.div>
              );
            })}
            {users.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '13px' }}>No customers found.</div>
            )}
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {activeTab === 'notifications' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '2px' }}>Notifications</h3>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>{notifications.filter(n => !n.read).length} unread, {notifications.length} total</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={markAllRead} disabled={notifications.every(n => n.read)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '9px', color: '#64748b', cursor: notifications.every(n => n.read) ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '500', opacity: notifications.every(n => n.read) ? 0.5 : 1 }}>
                <CheckCheck size={14} /> Mark all read
              </button>
              <button onClick={clearAll} disabled={notifications.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#fff5f5', border: '1px solid #fee2e2', borderRadius: '9px', color: '#dc2626', cursor: notifications.length === 0 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '500', opacity: notifications.length === 0 ? 0.5 : 1 }}>
                <Trash2 size={14} /> Clear all
              </button>
            </div>
          </div>

          {notifications.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AnimatePresence>
                {notifications.map((notif, i) => {
                  const colors = { warning: { bg: '#fef3c7', border: '#fde68a', dot: '#f59e0b', icon: <TriangleAlert size={14} color="#d97706" /> }, info: { bg: '#dbeafe', border: '#bfdbfe', dot: '#3b82f6', icon: <Info size={14} color="#2563eb" /> } }[notif.type] || {};
                  return (
                    <motion.div key={notif.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }} transition={{ delay: i * 0.03 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: notif.read ? '#fafafa' : colors.bg, border: `1px solid ${notif.read ? '#f1f5f9' : colors.border}`, borderRadius: '12px', transition: 'all 0.2s' }}>
                      <div style={{ width: '34px', height: '34px', background: notif.read ? '#f1f5f9' : '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        {colors.icon}
                      </div>
                      {!notif.read && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: colors.dot, flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: notif.read ? '400' : '600', color: '#0f172a', marginBottom: '2px' }}>{notif.title}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{notif.body}</div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>{notif.time}</div>
                      <button onClick={() => clearOne(notif.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '4px', borderRadius: '6px', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}>
                        <X size={14} />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ width: '56px', height: '56px', background: '#f1f5f9', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <BellOff size={24} color="#cbd5e1" />
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>All caught up!</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>No notifications at the moment.</div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

/* ══════════════════════════════════════════
   APPOINTMENTS SECTION
══════════════════════════════════════════ */
const AppointmentsSection = ({ requests, loading, updatingId, confirmStatusUpdate }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const filtered = requests.filter(r => {
    const mf = filter === 'ALL' || r.status === filter;
    const ms = search === '' || r.service_type.toLowerCase().includes(search.toLowerCase()) || String(r.id).includes(search) || String(r.user_id).includes(search);
    return mf && ms;
  });
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Appointments</h2>
        <p style={{ fontSize: '12px', color: '#94a3b8' }}>Manage all customer service appointments</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total', count: requests.length, color: '#7c3aed', val: 'ALL' },
          { label: 'Pending', count: requests.filter(r => r.status === 'PENDING').length, color: '#d97706', val: 'PENDING' },
          { label: 'In Progress', count: requests.filter(r => r.status === 'IN_PROGRESS').length, color: '#1d4ed8', val: 'IN_PROGRESS' },
          { label: 'Completed', count: requests.filter(r => r.status === 'COMPLETED').length, color: '#059669', val: 'COMPLETED' },
        ].map(({ label, count, color, val }) => (
          <div key={label} onClick={() => setFilter(val)} style={{ background: '#fff', border: `1px solid ${filter === val ? color : '#e2e8f0'}`, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.15s' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: filter === val ? color : '#0f172a', marginBottom: '2px' }}>{loading ? '—' : count}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
              <span style={{ fontSize: '11px', color: '#64748b' }}>{label}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 12px', flex: 1, maxWidth: '300px' }}>
            <Search size={14} color="#94a3b8" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by service, user ID..."
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '12px', color: '#1e293b', width: '100%' }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}><X size={12} /></button>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 12px' }}>
            <Filter size={13} color="#94a3b8" />
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <span style={{ fontSize: '12px', color: '#94a3b8', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 12px' }}>{filtered.length} records</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Request ID', 'User ID', 'Service Type', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((req, i) => {
                const st = getStatusStyle(req.status);
                const isUpdating = updatingId === req.id;
                return (
                  <motion.tr key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    style={{ borderBottom: '1px solid #f8fafc' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#7c3aed' }}>#{String(req.id).padStart(4,'0')}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#7c3aed' }}>{String(req.user_id).charAt(0)}</div>
                        <span style={{ fontSize: '12px', color: '#475569' }}>User #{req.user_id}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>{req.service_type}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#94a3b8' }}>{new Date(req.request_date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: st.bg, color: st.color, display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {req.status === 'PENDING' && <ActionBtn onClick={() => confirmStatusUpdate(req.id, 'IN_PROGRESS', req.service_type)} label="Start" bg="#dbeafe" color="#1d4ed8" loading={isUpdating} />}
                        {req.status === 'IN_PROGRESS' && <ActionBtn onClick={() => confirmStatusUpdate(req.id, 'COMPLETED', req.service_type)} label="Complete" bg="#d1fae5" color="#065f46" loading={isUpdating} />}
                        {(req.status === 'PENDING' || req.status === 'IN_PROGRESS') && <ActionBtn onClick={() => confirmStatusUpdate(req.id, 'CANCELLED', req.service_type)} label="Cancel" bg="#fee2e2" color="#991b1b" loading={isUpdating} />}
                        {(req.status === 'COMPLETED' || req.status === 'CANCELLED') && <span style={{ fontSize: '11px', color: '#cbd5e1', padding: '5px 0' }}>No actions</span>}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {!loading && filtered.length === 0 && <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No appointments found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════
   CUSTOMERS SECTION
══════════════════════════════════════════ */
const CustomersSection = ({ users, requests, loading }) => {
  const [search, setSearch] = useState('');
  const filtered = users.filter(u => search === '' || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || String(u.id).includes(search));
  const getStats = (uid) => {
    const ur = requests.filter(r => r.user_id === uid);
    return { total: ur.length, completed: ur.filter(r => r.status === 'COMPLETED').length, active: ur.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS').length, last: [...ur].sort((a,b) => new Date(b.request_date)-new Date(a.request_date))[0] };
  };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Customers</h2>
        <p style={{ fontSize: '12px', color: '#94a3b8' }}>All registered customers and their service history</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Customers', value: users.length, icon: Users, color: '#7c3aed', bg: '#ede9fe' },
          { label: 'With Active Jobs', value: [...new Set(requests.filter(r => r.status==='PENDING'||r.status==='IN_PROGRESS').map(r=>r.user_id))].length, icon: Clock, color: '#d97706', bg: '#fef3c7' },
          { label: 'Avg Services / Customer', value: users.length ? (requests.length/users.length).toFixed(1) : '0', icon: Wrench, color: '#059669', bg: '#d1fae5' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', background: bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={20} color={color} /></div>
            <div><div style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', lineHeight: 1 }}>{loading ? '—' : value}</div><div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>{label}</div></div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>Customer List</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 12px' }}>
            <Search size={14} color="#94a3b8" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '12px', color: '#1e293b', width: '200px' }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}><X size={12} /></button>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((c, i) => {
            const s = getStats(c.id);
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.04 }} whileHover={{ x: 2 }}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: `hsl(${(c.id*47)%360},60%,85%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: `hsl(${(c.id*47)%360},50%,35%)`, flexShrink: 0 }}>{(c.name||c.email||'?').charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '3px' }}>{c.name||'—'}</div>
                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={11}/>{c.email}</span>
                    {c.phone && <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={11}/>{c.phone}</span>}
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}><Hash size={11}/>ID: {c.id}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', flexShrink: 0 }}>
                  {[{val:s.total,label:'Services',color:'#7c3aed'},{val:s.completed,label:'Done',color:'#059669'},{val:s.active,label:'Active',color:'#d97706'}].map(({val,label,color})=>(
                    <div key={label} style={{ textAlign: 'center' }}><div style={{ fontSize: '16px', fontWeight: '700', color }}>{val}</div><div style={{ fontSize: '10px', color: '#94a3b8' }}>{label}</div></div>
                  ))}
                </div>
                {s.last ? (
                  <div style={{ background: '#ede9fe', borderRadius: '8px', padding: '6px 10px', textAlign: 'right', flexShrink: 0, minWidth: '110px' }}>
                    <div style={{ fontSize: '10px', color: '#7c3aed', fontWeight: '600', marginBottom: '2px' }}>Last Service</div>
                    <div style={{ fontSize: '11px', color: '#5b21b6', fontWeight: '500' }}>{s.last.service_type}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>{new Date(s.last.request_date).toLocaleDateString()}</div>
                  </div>
                ) : <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '6px 10px', flexShrink: 0 }}><div style={{ fontSize: '11px', color: '#cbd5e1' }}>No services yet</div></div>}
              </motion.div>
            );
          })}
          {!loading && filtered.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '13px' }}>No customers found.</div>}
        </div>
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════
   VEHICLES SECTION
══════════════════════════════════════════ */
const VehiclesSection = ({ cars, requests, users, loading }) => {
  const [search, setSearch] = useState('');
  const filtered = cars.filter(c => search===''||c.car_brand?.toLowerCase().includes(search.toLowerCase())||c.car_model?.toLowerCase().includes(search.toLowerCase())||c.car_number?.toLowerCase().includes(search.toLowerCase())||String(c.user_id).includes(search));
  const getOwner = uid => users.find(u => u.id === uid);
  const getCarReqs = cid => requests.filter(r => r.car_id === cid);
  const brandColors = ['#7c3aed','#0891b2','#059669','#d97706','#dc2626'];
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Vehicles</h2>
        <p style={{ fontSize: '12px', color: '#94a3b8' }}>All registered customer vehicles</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Vehicles', value: cars.length, icon: Car, color: '#7c3aed', bg: '#ede9fe' },
          { label: 'Serviced Vehicles', value: [...new Set(requests.map(r=>r.car_id))].length, icon: Wrench, color: '#059669', bg: '#d1fae5' },
          { label: 'Unique Brands', value: [...new Set(cars.map(c=>c.car_brand))].length, icon: Hash, color: '#d97706', bg: '#fef3c7' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', background: bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={20} color={color} /></div>
            <div><div style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', lineHeight: 1 }}>{loading ? '—' : value}</div><div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>{label}</div></div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>Vehicle Registry</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 12px' }}>
            <Search size={14} color="#94a3b8" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brand, model, plate..."
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '12px', color: '#1e293b', width: '200px' }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}><X size={12} /></button>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '12px' }}>
          {filtered.map((car, i) => {
            const owner = getOwner(car.user_id);
            const carReqs = getCarReqs(car.id);
            const activeReq = carReqs.find(r => r.status==='PENDING'||r.status==='IN_PROGRESS');
            const color = brandColors[i % brandColors.length];
            return (
              <motion.div key={car.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i*0.04 }} whileHover={{ y: -2 }}
                style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', background: `${color}18`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Car size={24} color={color} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '3px' }}>{car.car_brand} {car.car_model}</div>
                    <div style={{ display: 'inline-block', background: '#e2e8f0', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>{car.car_number}</div>
                    {owner && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: `hsl(${(owner.id*47)%360},60%,85%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', color: `hsl(${(owner.id*47)%360},50%,35%)` }}>{(owner.name||owner.email).charAt(0).toUpperCase()}</div>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{owner.name||owner.email}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{carReqs.length} service{carReqs.length!==1?'s':''}</span>
                      {activeReq ? <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600', background: getStatusStyle(activeReq.status).bg, color: getStatusStyle(activeReq.status).color }}>{activeReq.status.replace('_',' ')}</span>
                        : carReqs.length > 0 ? <span style={{ fontSize: '10px', color: '#10b981', background: '#d1fae5', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>No active job</span>
                        : <span style={{ fontSize: '10px', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '20px' }}>Never serviced</span>}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {!loading && filtered.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '13px' }}>No vehicles found.</div>}
        </div>
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════
   MAIN ADMIN DASHBOARD
══════════════════════════════════════════ */
const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);

  const [filter, setFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [reqRes, usersRes, carsRes] = await Promise.all([
        serviceRequestService.getAllRequests(),
        adminService.getAllUsers(),
        adminService.getAllCars(),
      ]);
      setRequests(reqRes.data);
      setUsers(usersRes.data);
      setCars(carsRes.data);
    } catch { toast.error('Failed to load data.'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleRefresh = async () => { setRefreshing(true); await fetchAll(true); toast.success('Data refreshed!'); };

  // Build notifications from requests whenever requests change
  useEffect(() => {
    setNotifications(prev => {
      const readIds = new Set(prev.filter(n => n.read).map(n => n.id));
      const clearedIds = new Set(
        requests.map(r => r.id).filter(id => !prev.some(n => n.id === id) && prev.length > 0)
      );
      return requests
        .filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS')
        .map(r => ({
          id: r.id,
          title: r.status === 'PENDING' ? 'New service request' : 'Service in progress',
          body: `${r.service_type} — User #${r.user_id}`,
          time: new Date(r.request_date).toLocaleDateString(),
          type: r.status === 'PENDING' ? 'warning' : 'info',
          read: readIds.has(r.id),
        }));
    });
  }, [requests]);

  const confirmStatusUpdate = (id, newStatus, serviceType) => {
    const cfg = {
      IN_PROGRESS: { title: 'Start Service', msg: `Start #${String(id).padStart(4,'0')} (${serviceType})?`, label: 'Start', color: '#3b82f6' },
      COMPLETED:   { title: 'Complete Request', msg: `Mark #${String(id).padStart(4,'0')} as completed?`, label: 'Complete', color: '#10b981' },
      CANCELLED:   { title: 'Cancel Request', msg: `Cancel #${String(id).padStart(4,'0')}? Cannot be undone.`, label: 'Cancel', color: '#ef4444' },
    }[newStatus];
    if (!cfg) return;
    setConfirm({ title: cfg.title, message: cfg.msg, confirmLabel: cfg.label, confirmColor: cfg.color, onConfirm: () => executeUpdate(id, newStatus) });
  };

  const executeUpdate = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await serviceRequestService.updateStatus(id, newStatus);
      await fetchAll(true);
      const msgs = { IN_PROGRESS: 'Service started!', COMPLETED: 'Marked as completed!', CANCELLED: 'Request cancelled.' };
      const types = { IN_PROGRESS: 'info', COMPLETED: 'success', CANCELLED: 'warning' };
      toast[types[newStatus]](msgs[newStatus]);
    } catch { toast.error('Failed to update status.'); }
    finally { setUpdatingId(null); }
  };

  const handleLogout = () => setConfirm({ title: 'Sign Out', message: 'Sign out of the admin panel?', confirmLabel: 'Sign Out', confirmColor: '#ef4444', onConfirm: () => { logout(); navigate('/login'); } });

  const pendingCount   = requests.filter(r => r.status === 'PENDING').length;
  const unreadCount    = notifications.filter(n => !n.read).length;
  const inProgressCount = requests.filter(r => r.status === 'IN_PROGRESS').length;
  const completedCount = requests.filter(r => r.status === 'COMPLETED').length;
  const cancelledCount = requests.filter(r => r.status === 'CANCELLED').length;
  const totalCount     = requests.length;

  const filteredRequests = requests.filter(req => {
    const mf = filter === 'ALL' || req.status === filter;
    const ms = searchQuery === '' || req.service_type.toLowerCase().includes(searchQuery.toLowerCase()) || String(req.id).includes(searchQuery) || String(req.user_id).includes(searchQuery);
    return mf && ms;
  });

  const serviceCounts = requests.reduce((acc, r) => { acc[r.service_type] = (acc[r.service_type]||0)+1; return acc; }, {});
  const topServices = Object.entries(serviceCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxSvc = topServices[0]?.[1] || 1;

  const displayName = user?.name || user?.email?.split('@')[0] || 'Admin';
  const greeting = ['Good Morning','Good Afternoon','Good Evening'][[0,12,17].findLastIndex(h=>new Date().getHours()>=h)];
  const total = totalCount||1;
  const R=36, CX=44, CY=44, C=2*Math.PI*R;
  const cArc=(completedCount/total)*C, iArc=(inProgressCount/total)*C, pArc=(pendingCount/total)*C;

  // ── Sidebar nav items — Notifications moved into Settings tabs ──
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard'    },
    { icon: Calendar,        label: 'Appointments' },
    { icon: Users,           label: 'Customers'    },
    { icon: Car,             label: 'Vehicles'     },
    { icon: Wrench,          label: 'Services'     },
    { icon: UserCheck,       label: 'Technicians'  },
    { icon: Receipt,         label: 'Invoices'     },
    { icon: BarChart2,       label: 'Reports'      },
    { icon: Settings,        label: 'Settings'     },
  ];

  const renderContent = () => {
    switch (activeNav) {
      case 'Appointments':
        return <AppointmentsSection requests={requests} loading={loading} updatingId={updatingId} confirmStatusUpdate={confirmStatusUpdate} />;
      case 'Customers':
        return <CustomersSection users={users} requests={requests} loading={loading} />;
      case 'Vehicles':
        return <VehiclesSection cars={cars} requests={requests} users={users} loading={loading} />;
      
      case 'Settings':
        return <SettingsSection users={users} cars={cars} requests={requests} toast={toast} defaultTab={settingsTab} key={settingsTab} notifications={notifications} setNotifications={setNotifications} />;
      case 'Services':
        return <Services />; 
      case 'Dashboard':
        return (
          <>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>{greeting}, Admin! 👋</h1>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Here's what's happening in your service center today.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Hamburger — CSS shows on mobile */}
                <button className="admin-hamburger" onClick={() => setSidebarOpen(true)}
                  style={{ display:'none', alignItems:'center', justifyContent:'center', width:38, height:38, background:'none', border:'1px solid rgba(0,0,0,0.15)', borderRadius:8, cursor:'pointer' }}>
                  <Menu size={18} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <Search size={14} color="#94a3b8" />
                  <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search requests..."
                    style={{ border: 'none', outline: 'none', fontSize: '12px', color: '#1e293b', background: 'transparent', width: '160px' }} />
                  {searchQuery && <button onClick={()=>setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}><X size={13}/></button>}
                </div>
                <motion.button onClick={handleRefresh} disabled={refreshing} whileTap={{ rotate: 180 }}
                  style={{ width: '38px', height: '38px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: refreshing?'not-allowed':'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <RefreshCw size={15} color={refreshing?'#c4b5fd':'#64748b'}/>
                </motion.button>

                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={()=>{ setSettingsTab('notifications'); setActiveNav('Settings'); }}>
                  <div style={{ width: '38px', height: '38px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}><Bell size={16} color="#64748b"/></div>
                  {unreadCount>0 && <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '14px', height: '14px', background: '#ef4444', borderRadius: '50%', fontSize: '8px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #f8fafc', fontWeight: '700' }}>{unreadCount}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '6px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', fontWeight: '700' }}>{displayName.charAt(0).toUpperCase()}</div>
                  <div><div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>{displayName}</div><div style={{ fontSize: '10px', color: '#94a3b8' }}>Super Admin</div></div>
                  <ChevronDown size={13} color="#94a3b8"/>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
              {[
                { label:'Total Appointments', value:totalCount,     icon:Calendar,     iconBg:'#ede9fe', iconColor:'#7c3aed', trend:'+12%', up:true  },
                { label:'Ongoing Services',   value:inProgressCount, icon:Wrench,       iconBg:'#fef3c7', iconColor:'#d97706', trend:'+8%',  up:true  },
                { label:'Completed Services', value:completedCount,  icon:CheckCircle,  iconBg:'#d1fae5', iconColor:'#059669', trend:'+18%', up:true  },
                { label:'Cancelled',          value:cancelledCount,  icon:AlertCircle,  iconBg:'#fee2e2', iconColor:'#dc2626', trend:'-3%',  up:false },
              ].map(({ label, value, icon: Icon, iconBg, iconColor, trend, up }) => (
                <motion.div key={label} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} whileHover={{ y:-2 }}
                  style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'14px', padding:'16px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', cursor:'pointer' }}
                  onClick={()=>setActiveNav('Appointments')}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                    <div style={{ width:'36px', height:'36px', background:iconBg, borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon size={18} color={iconColor}/></div>
                    <span style={{ fontSize:'11px', fontWeight:'600', color:up?'#059669':'#dc2626', display:'flex', alignItems:'center', gap:'2px' }}>{up?<TrendingUp size={12}/>:<TrendingDown size={12}/>} {trend}</span>
                  </div>
                  <div style={{ fontSize:'26px', fontWeight:'700', color:'#0f172a', lineHeight:1, marginBottom:'4px' }}>{loading?'—':value}</div>
                  <div style={{ fontSize:'11px', color:'#94a3b8' }}>{label}</div>
                </motion.div>
              ))}
            </div>

            {/* Quick Nav Cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px' }}>
              {[
                { label:'Customers',      value:users.length,    icon:Users,  color:'#0891b2', bg:'#e0f2fe', nav:'Customers',     sub:'registered users' },
                { label:'Vehicles',       value:cars.length,     icon:Car,    color:'#059669', bg:'#d1fae5', nav:'Vehicles',      sub:'registered cars'  },
                { label:'Pending Actions',value:pendingCount,    icon:Clock,  color:'#d97706', bg:'#fef3c7', nav:'Appointments',  sub:'need attention'   },
              ].map(({ label, value, icon: Icon, color, bg, nav, sub }) => (
                <motion.div key={label} whileHover={{ y:-2 }} onClick={()=>setActiveNav(nav)}
                  style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'14px', padding:'16px', cursor:'pointer', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', display:'flex', alignItems:'center', gap:'14px' }}>
                  <div style={{ width:'44px', height:'44px', background:bg, borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon size={22} color={color}/></div>
                  <div>
                    <div style={{ fontSize:'22px', fontWeight:'700', color:'#0f172a', lineHeight:1 }}>{loading?'—':value}</div>
                    <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px' }}>{label} · {sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Middle Row */}
            <div style={{ display:'grid', gridTemplateColumns:'1.8fr 1.2fr', gap:'14px', marginBottom:'20px' }}>
              <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'14px', padding:'18px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                  <h3 style={{ fontSize:'14px', fontWeight:'600', color:'#0f172a' }}>Recent Service Requests</h3>
                  <span style={{ fontSize:'11px', color:'#7c3aed', cursor:'pointer', fontWeight:'500' }} onClick={()=>setActiveNav('Appointments')}>View All →</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {requests.slice(0,5).map(req => {
                    const st = getStatusStyle(req.status);
                    const isUpd = updatingId===req.id;
                    return (
                      <motion.div key={req.id} initial={{ opacity:0 }} animate={{ opacity:1 }} whileHover={{ x:2 }}
                        style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background:'#f8fafc', borderRadius:'10px', border:'1px solid #f1f5f9' }}>
                        <div style={{ width:'32px', height:'32px', background:st.bg, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><span style={{ color:st.color }}>{getStatusIcon(req.status)}</span></div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'12px', fontWeight:'600', color:'#0f172a' }}>{req.service_type}</div>
                          <div style={{ fontSize:'10px', color:'#94a3b8' }}>User #{req.user_id} · {new Date(req.request_date).toLocaleDateString()}</div>
                        </div>
                        <span style={{ background:st.bg, color:st.color, fontSize:'10px', fontWeight:'600', padding:'3px 8px', borderRadius:'20px', flexShrink:0 }}>{req.status.replace('_',' ')}</span>
                        <div style={{ display:'flex', gap:'4px' }}>
                          {req.status==='PENDING'      && <ActionBtn onClick={()=>confirmStatusUpdate(req.id,'IN_PROGRESS',req.service_type)} label="Start"    bg="#dbeafe" color="#1d4ed8" loading={isUpd}/>}
                          {req.status==='IN_PROGRESS'  && <ActionBtn onClick={()=>confirmStatusUpdate(req.id,'COMPLETED',req.service_type)}   label="Complete" bg="#d1fae5" color="#065f46" loading={isUpd}/>}
                          {(req.status==='PENDING'||req.status==='IN_PROGRESS') && <ActionBtn onClick={()=>confirmStatusUpdate(req.id,'CANCELLED',req.service_type)} label="Cancel" bg="#fee2e2" color="#991b1b" loading={isUpd}/>}
                        </div>
                      </motion.div>
                    );
                  })}
                  {!loading&&requests.length===0 && <div style={{ textAlign:'center', padding:'32px', color:'#94a3b8', fontSize:'13px' }}>No service requests yet.</div>}
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'14px', padding:'18px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                  <h3 style={{ fontSize:'14px', fontWeight:'600', color:'#0f172a', marginBottom:'14px' }}>Top Services</h3>
                  {topServices.length>0 ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                      {topServices.map(([name,count],i)=>{
                        const colors=['#7c3aed','#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe'];
                        return (
                          <div key={name}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                              <span style={{ fontSize:'12px', color:'#475569', display:'flex', alignItems:'center', gap:'6px' }}><Wrench size={12} color={colors[i]}/>{name}</span>
                              <span style={{ fontSize:'12px', fontWeight:'600', color:colors[i] }}>{count}</span>
                            </div>
                            <div style={{ height:'5px', background:'#f1f5f9', borderRadius:'3px' }}>
                              <motion.div initial={{ width:0 }} animate={{ width:`${(count/maxSvc)*100}%` }} transition={{ duration:0.6, delay:i*0.1 }} style={{ height:'100%', background:colors[i], borderRadius:'3px' }}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : <div style={{ textAlign:'center', padding:'16px', color:'#94a3b8', fontSize:'12px' }}>No data yet</div>}
                </div>
                <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'14px', padding:'18px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                  <h3 style={{ fontSize:'14px', fontWeight:'600', color:'#0f172a', marginBottom:'14px' }}>Service Status</h3>
                  <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                    <svg width="88" height="88" viewBox="0 0 88 88" style={{ flexShrink:0 }}>
                      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth="10"/>
                      {totalCount>0&&<>
                        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#7c3aed" strokeWidth="10" strokeDasharray={`${cArc} ${C}`} strokeDashoffset={C*0.25} strokeLinecap="round" transform={`rotate(-90 ${CX} ${CY})`}/>
                        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f59e0b" strokeWidth="10" strokeDasharray={`${iArc} ${C}`} strokeDashoffset={C*0.25-cArc} strokeLinecap="round" transform={`rotate(-90 ${CX} ${CY})`}/>
                        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#3b82f6" strokeWidth="10" strokeDasharray={`${pArc} ${C}`} strokeDashoffset={C*0.25-cArc-iArc} strokeLinecap="round" transform={`rotate(-90 ${CX} ${CY})`}/>
                      </>}
                      <text x={CX} y={CY-5} textAnchor="middle" fontSize="16" fontWeight="700" fill="#0f172a">{totalCount}</text>
                      <text x={CX} y={CY+12} textAnchor="middle" fontSize="9" fill="#94a3b8">Total</text>
                    </svg>
                    <div style={{ display:'flex', flexDirection:'column', gap:'7px', flex:1 }}>
                      {[{label:'Completed',count:completedCount,color:'#7c3aed'},{label:'In Progress',count:inProgressCount,color:'#f59e0b'},{label:'Pending',count:pendingCount,color:'#3b82f6'},{label:'Cancelled',count:cancelledCount,color:'#ef4444'}].map(({label,count,color})=>(
                        <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }} onClick={()=>setActiveNav('Appointments')}>
                          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                            <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:color }}/>
                            <span style={{ fontSize:'11px', color:'#64748b' }}>{label}</span>
                          </div>
                          <span style={{ fontSize:'11px', fontWeight:'600', color:'#0f172a' }}>{count} ({totalCount>0?Math.round((count/totalCount)*100):0}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Table */}
            <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'14px', padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                <h3 style={{ fontSize:'14px', fontWeight:'600', color:'#0f172a' }}>All Service Requests</h3>
                <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'6px 12px' }}>
                    <Filter size={13} color="#94a3b8"/>
                    <select value={filter} onChange={e=>setFilter(e.target.value)} style={{ background:'transparent', border:'none', outline:'none', fontSize:'12px', color:'#475569', cursor:'pointer' }}>
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                  <div style={{ fontSize:'12px', color:'#94a3b8', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'6px 12px' }}>{filteredRequests.length} records</div>
                </div>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#f8fafc' }}>
                      {['Request ID','User ID','Service Type','Date','Status','Actions'].map(h=>(
                        <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid #f1f5f9', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((req,i)=>{
                      const st=getStatusStyle(req.status);
                      const isUpd=updatingId===req.id;
                      return (
                        <motion.tr key={req.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.02 }}
                          style={{ borderBottom:'1px solid #f8fafc' }}
                          onMouseEnter={e=>e.currentTarget.style.background='#fafafa'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <td style={{ padding:'12px 14px', fontSize:'13px', fontWeight:'600', color:'#7c3aed' }}>#{String(req.id).padStart(4,'0')}</td>
                          <td style={{ padding:'12px 14px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                              <div style={{ width:'26px', height:'26px', borderRadius:'50%', background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'700', color:'#7c3aed' }}>{String(req.user_id).charAt(0)}</div>
                              <span style={{ fontSize:'12px', color:'#475569' }}>User #{req.user_id}</span>
                            </div>
                          </td>
                          <td style={{ padding:'12px 14px', fontSize:'13px', color:'#1e293b', fontWeight:'500' }}>{req.service_type}</td>
                          <td style={{ padding:'12px 14px', fontSize:'12px', color:'#94a3b8' }}>{new Date(req.request_date).toLocaleDateString()}</td>
                          <td style={{ padding:'12px 14px' }}>
                            <span style={{ background:st.bg, color:st.color, display:'inline-flex', alignItems:'center', gap:'4px', padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', whiteSpace:'nowrap' }}>
                              <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:st.dot, display:'inline-block' }}/>
                              {req.status.replace('_',' ')}
                            </span>
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            <div style={{ display:'flex', gap:'6px' }}>
                              {req.status==='PENDING'     && <ActionBtn onClick={()=>confirmStatusUpdate(req.id,'IN_PROGRESS',req.service_type)} label="Start"    bg="#dbeafe" color="#1d4ed8" loading={isUpd}/>}
                              {req.status==='IN_PROGRESS' && <ActionBtn onClick={()=>confirmStatusUpdate(req.id,'COMPLETED',req.service_type)}   label="Complete" bg="#d1fae5" color="#065f46" loading={isUpd}/>}
                              {(req.status==='PENDING'||req.status==='IN_PROGRESS') && <ActionBtn onClick={()=>confirmStatusUpdate(req.id,'CANCELLED',req.service_type)} label="Cancel" bg="#fee2e2" color="#991b1b" loading={isUpd}/>}
                              {(req.status==='COMPLETED'||req.status==='CANCELLED') && <span style={{ fontSize:'11px', color:'#cbd5e1', padding:'5px 0' }}>No actions</span>}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                    {!loading&&filteredRequests.length===0 && <tr><td colSpan="6" style={{ padding:'40px', textAlign:'center', color:'#94a3b8', fontSize:'13px' }}>{searchQuery?`No results for "${searchQuery}"`:'No requests found.'}</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      default:
        const navItem = navItems.find(n => n.label === activeNav);
        return <ComingSoon label={activeNav} icon={navItem?.icon || LayoutDashboard} />;
    }
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc', fontFamily:"'Segoe UI',sans-serif", color:'#1e293b' }}>
      <Toast toasts={toast.toasts} remove={toast.remove}/>
      <ConfirmDialog open={!!confirm} {...confirm} onConfirm={()=>{ confirm?.onConfirm(); setConfirm(null); }} onCancel={()=>setConfirm(null)}/>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ width:'220px', flexShrink:0, background:'#fff', borderRight:'1px solid #e2e8f0', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, zIndex:300, boxShadow:'2px 0 8px rgba(0,0,0,0.04)', transition:'transform 0.3s ease' }}>
        {/* Close button — CSS shows it on mobile */}
        <button onClick={() => setSidebarOpen(false)} className="admin-sidebar-close"
          style={{ display:'none', position:'absolute', top:'12px', right:'12px', background:'none', border:'none', cursor:'pointer', color:'#64748b', padding:'4px', zIndex:1 }}>
          <X size={16} />
        </button>
        <div style={{ padding:'20px 16px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'34px', height:'34px', background:'linear-gradient(135deg,#7c3aed,#5b21b6)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}><Car size={18} color="#fff"/></div>
            <div><div style={{ fontSize:'13px', fontWeight:'700', color:'#1e293b' }}>CarHub Connect</div><div style={{ fontSize:'10px', color:'#94a3b8' }}>Admin Panel</div></div>
          </div>
        </div>
        <nav style={{ flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:'1px', overflowY:'auto' }}>
          {navItems.map(({ icon: Icon, label }) => (
            <button key={label} onClick={()=>setActiveNav(label)}
              style={{ display:'flex', alignItems:'center', gap:'9px', padding:'9px 10px', borderRadius:'9px', border:'none', cursor:'pointer', width:'100%', textAlign:'left', background:activeNav===label?'rgba(124,58,237,0.08)':'transparent', color:activeNav===label?'#7c3aed':'#64748b', transition:'all 0.15s' }}>
              <Icon size={16}/>
              <span style={{ fontSize:'12px', fontWeight:activeNav===label?'600':'400' }}>{label}</span>
              {label==='Notifications' && unreadCount>0 && <span style={{ marginLeft:'auto', background:'#ef4444', color:'#fff', borderRadius:'10px', fontSize:'10px', padding:'1px 6px', fontWeight:'700' }}>{unreadCount}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding:'12px 8px', borderTop:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', marginBottom:'4px' }}>
            <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', color:'#fff', fontWeight:'700', flexShrink:0 }}>{displayName.charAt(0).toUpperCase()}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'12px', fontWeight:'600', color:'#1e293b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{displayName}</div>
              <div style={{ fontSize:'10px', color:'#94a3b8' }}>Super Admin</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:'8px', width:'100%', padding:'8px 10px', borderRadius:'8px', border:'1px solid #fee2e2', background:'#fff5f5', color:'#dc2626', cursor:'pointer', fontSize:'12px', fontWeight:'500' }}>
            <LogOut size={14}/> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:299 }} />
      )}

      {/* Main */}
      <main style={{ marginLeft:'220px', flex:1, padding:'20px 24px', minHeight:'100vh' }}>
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;