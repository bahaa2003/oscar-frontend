import React, { useState } from 'react';
import { LayoutDashboard, Folder, MessageSquare, BarChart3, Settings } from 'lucide-react';
import './Sidebar.css';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: Folder },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`sidebar ${isExpanded ? 'expanded' : ''}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {menuItems.map(item => (
        <div 
          key={item.id} 
          className={`sidebar-item ${activeItem === item.id ? 'active' : ''}`}
          onClick={() => setActiveItem(item.id)}
        >
          <item.icon className="sidebar-icon" />
          <span className="sidebar-text">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;