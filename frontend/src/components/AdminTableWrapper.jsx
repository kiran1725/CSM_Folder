import React from 'react';

/**
 * AdminTableWrapper
 * Wraps any admin data table in a horizontally-scrollable
 * container so it never overflows on mobile screens.
 *
 * Usage:
 *   <AdminTableWrapper>
 *     <table>...</table>
 *   </AdminTableWrapper>
 */
const AdminTableWrapper = ({ children, minWidth = 580 }) => {
  return (
    <div
      className="admin-table-wrap"
      style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        borderRadius: '12px',
        width: '100%',
      }}
    >
      <div style={{ minWidth }}>
        {children}
      </div>
    </div>
  );
};

export default AdminTableWrapper;