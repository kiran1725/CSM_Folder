import React from 'react';
import { LayoutDashboard, Calendar, Car, History, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Home',     key: 'Dashboard' },
  { icon: Calendar,        label: 'Appts',    key: 'My Appointments' },
  { icon: Car,             label: 'Cars',     key: 'My Vehicles' },
  { icon: History,         label: 'History',  key: 'Service History' },
  { icon: Settings,        label: 'Settings', key: 'Profile Settings' },
];

const MobileNav = ({ activeNav, setActiveNav }) => {
  return (
    <nav className="csms-bottom-nav" role="navigation" aria-label="Mobile navigation">
      {NAV_ITEMS.map(({ icon: Icon, label, key }) => (
        <button
          key={key}
          className={`csms-bnav-item ${activeNav === key ? 'active' : ''}`}
          onClick={() => setActiveNav(key)}
          aria-label={label}
          aria-current={activeNav === key ? 'page' : undefined}
        >
          <Icon size={20} aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
};

export default MobileNav;