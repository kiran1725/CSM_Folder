import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Car, ClipboardList, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass-card" style={{ 
      margin: '20px', 
      padding: '16px 32px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      position: 'sticky',
      top: '20px',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '800', 
          background: 'linear-gradient(to right, #fff, var(--primary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>CarHub Connect</h2>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)' }}>
          <Car size={18} />
          My Cars
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
          <User size={18} />
          <span>{user?.name || user?.email}</span>
        </div>
        <button onClick={handleLogout} className="glow-btn" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;