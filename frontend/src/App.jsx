import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import PaymentPage from './pages/PaymentPage';
import './index.css';

const ProtectedRoute = ({ children, role }) => {
  const { user, token, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f1a', color: '#e2e8f0', fontSize: '14px' }}>
      Loading...
    </div>
  );

  if (!token) return <Navigate to="/login" replace />;

  // Case-insensitive role check — prevents mismatch between "admin" and "ADMIN"
  if (role && user?.role?.toUpperCase() !== role.toUpperCase()) {
    // Redirect to their correct dashboard instead of "/" (which loops to /login)
    const fallback = user?.role?.toUpperCase() === 'ADMIN' ? '/admin-dashboard' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root: redirect based on role, not blindly to /login */}
          <Route path="/" element={<RootRedirect />} />

          <Route path="/dashboard" element={
            <ProtectedRoute role="CUSTOMER"><Dashboard /></ProtectedRoute>
          } />
          <Route path="/payment" element={
            <ProtectedRoute role="CUSTOMER"><PaymentPage /></ProtectedRoute>
          } />
          <Route path="/admin-dashboard" element={
            <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Redirects to the right page based on auth state
const RootRedirect = () => {
  const { user, token, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f1a', color: '#e2e8f0', fontSize: '14px' }}>
      Loading...
    </div>
  );

  if (!token) return <Navigate to="/login" replace />;
  if (user?.role?.toUpperCase() === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

export default App;