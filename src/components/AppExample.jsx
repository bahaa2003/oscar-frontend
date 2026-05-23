import React from 'react';
import Sidebar from './Sidebar';

const AppExample = () => {
  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', paddingLeft: '80px' }}>
      <Sidebar />
      <div style={{ padding: '20px' }}>
        <h1>Main Content Area</h1>
        <p>This is where your main application content would go. The sidebar is fixed on the left and expands on hover.</p>
        <p>The active item is "Dashboard" by default, and you can click other items to change the active state.</p>
      </div>
    </div>
  );
};

export default AppExample;