import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom';
import "../adminStyle/appointments.css"
import logo from '../assets/logo.png';

function Sidebar() {
  const location = useLocation();
  const isRentalActive = location.pathname === '/rental' || location.pathname === '/Post';
  const [rentalSubmenuOpen, setRentalSubmenuOpen] = useState(isRentalActive);

  useEffect(() => {
    if (isRentalActive) {
      setRentalSubmenuOpen(true);
    }
  }, [isRentalActive]);

  return (
    <aside className='sidebar'> 
      <div className='profile'> 
  <div className="profile-header">
    <img 
  src={logo} 
  alt="D'jackman Tailor Deluxe Logo" 
  className="profile-logo"
    />
    <h3 className="p" style={{ color: 'rgb(139, 69, 19)' }}>D'jackman Tailor Deluxe</h3>
  </div>
</div>

      <nav> 
        <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Dashboard
        </NavLink>
        <NavLink to="/customize" className={({ isActive }) => isActive ? 'active' : ''}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
          </svg>
          Customization
        </NavLink>
        <NavLink to="/drycleaning" className={({ isActive }) => isActive ? 'active' : ''}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
          </svg>
          Dry Cleaning
        </NavLink>
        <div className="menu-item-with-submenu">
          <div
            onClick={() => setRentalSubmenuOpen(!rentalSubmenuOpen)}
            className={isRentalActive ? 'menu-parent active' : 'menu-parent'}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.73 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12.73"></line>
            </svg>
            <span>Rental</span>
            <span className="submenu-arrow">{rentalSubmenuOpen ? '▲' : '▼'}</span>
          </div>
          {rentalSubmenuOpen && (
            <div className="submenu-container">
              <NavLink 
                to="/rental" 
                className={({ isActive }) => isActive ? 'submenu-item active' : 'submenu-item'}
              >
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                </svg>
                Rental
              </NavLink>
              <NavLink 
                to="/Post" 
                className={({ isActive }) => isActive ? 'submenu-item active' : 'submenu-item'}
              >
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Post rent
              </NavLink>
            </div>
          )}
        </div>
        <NavLink to="/repair" className={({ isActive }) => isActive ? 'active' : ''}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="6" cy="6" r="3"></circle>
            <circle cx="6" cy="18" r="3"></circle>
            <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
            <line x1="20" y1="20" x2="8.12" y2="8.12"></line>
          </svg>
          Repair
        </NavLink>
        <NavLink to="/billing" className={({ isActive }) => isActive ? 'active' : ''}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
          Billing
        </NavLink>
        <NavLink to="/inventory" className={({ isActive }) => isActive ? 'active' : ''}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
          Inventory
        </NavLink>
        <NavLink to="/customers" className={({ isActive }) => isActive ? 'active' : ''}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          Customer List
        </NavLink>
        <NavLink to="/shop-schedule" className={({ isActive }) => isActive ? 'active' : ''}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Shop Schedule
        </NavLink>
        <NavLink to="/walk-in-orders" className={({ isActive }) => isActive ? 'active' : ''}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          Walk-In Orders
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;