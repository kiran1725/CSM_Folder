import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { KeyRound, Mail, User as UserIcon, Phone, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import './Login.css';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', role: 'CUSTOMER' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.register(formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const pwd = formData.password;
  const strength = pwd.length === 0 ? null : pwd.length < 6 ? { label: 'Weak', color: '#ef4444', width: '33%' } : pwd.length < 10 ? { label: 'Medium', color: '#f59e0b', width: '66%' } : { label: 'Strong', color: '#10b981', width: '100%' };

  return (
    <div className="login-container">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
        className="login-box glass-card"
      >
        <div className="login-header">
          <h1>Join CSMS</h1>
          <p>Get premium care for your vehicle</p>
        </div>

        {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8' }} />
              <input name="name" type="text" className="input-field" placeholder="Ex: Virat Kohli"
                style={{ paddingLeft: '44px' }} value={formData.name} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8' }} />
              <input name="email" type="email" className="input-field" placeholder="email@example.com"
                style={{ paddingLeft: '44px' }} value={formData.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8' }} />
              <input name="phone" type="text" className="input-field" placeholder="+91 9876543210"
                style={{ paddingLeft: '44px' }} value={formData.phone} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8' }} />
              <input name="password" type={showPassword ? 'text' : 'password'} className="input-field"
                placeholder="Min. 8 characters"
                style={{ paddingLeft: '44px', paddingRight: '44px' }}
                value={formData.password} onChange={handleChange} required />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                style={{ position: 'absolute', right: '14px', top: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex', alignItems: 'center' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {strength && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Password strength</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: strength.color }}>{strength.label}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '2px', transition: 'all 0.3s ease', width: strength.width, background: strength.color }} />
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="glow-btn" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="login-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;