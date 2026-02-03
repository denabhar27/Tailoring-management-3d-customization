import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserHomePage.css';
import '../styles/Guesthome.css';
import '../styles/Transitions.css';
import { initScrollAnimations, initHeaderScroll } from '../utils/scrollAnimations';
import logo from "../assets/logo.png";
import dp from "../assets/dp.png";
import appointmentBg from "../assets/background.jpg";
import heroBg from "../assets/tailorbackground.jpg";
import suitSample from "../assets/suits.png";
import customizeBg from "../assets/background.jpg";
import repairBg from "../assets/repair.png";
import brown from "../assets/brown.png";
import full from "../assets/full.png";
import tuxedo from "../assets/tuxedo.png";
import dryCleanBg from "../assets/dryclean.png";
import { getUser, logoutUser } from '../api/AuthApi';
import { notificationApi } from '../api/NotificationApi';
import { getCartSummary } from '../api/CartApi';
import RentalClothes from './components/RentalClothes';
import Cart from './components/Cart';
import RepairFormModal from './components/RepairFormModal';
import DryCleaningFormModal from './components/DryCleaningFormModal';
import CustomizationFormModal from './components/CustomizationFormModal';
import OrderDetailsModal from './OrderDetailsModal';

const UserHomePage = ({ userName, setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [repairFormModalOpen, setRepairFormModalOpen] = useState(false);
  const [dryCleaningFormModalOpen, setDryCleaningFormModalOpen] = useState(false);
  const [customizationFormModalOpen, setCustomizationFormModalOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointments, setAppointments] = useState(() => {
    try {
      const s = typeof window !== 'undefined' && localStorage.getItem('appointments');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [orderDetailsModalOpen, setOrderDetailsModalOpen] = useState(false);
  const [selectedOrderItemId, setSelectedOrderItemId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen]);

  useEffect(() => {
    const shouldReopen = sessionStorage.getItem('reopenCustomizationModal');
    if (shouldReopen === 'true') {
      sessionStorage.removeItem('reopenCustomizationModal');
      
      setTimeout(() => {
        setCustomizationFormModalOpen(true);
      }, 100);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    fetchCartCount();
  }, []);

  useEffect(() => {
    const scrollObserver = initScrollAnimations();
    const headerCleanup = initHeaderScroll();
    
    return () => {
      if (scrollObserver) scrollObserver.disconnect();
      if (headerCleanup) headerCleanup();
    };
  }, []);

  useEffect(() => {
    if (cartOpen) {
      fetchCartCount();
    }
  }, [cartOpen]);

  const fetchCartCount = async () => {
    try {
      const result = await getCartSummary();
      if (result.success) {
        setCartItemCount(result.itemCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch cart count:', err);
      setCartItemCount(0);
    }
  };

  useEffect(() => {
    if (notificationsOpen) {
      fetchNotifications();
    }
  }, [notificationsOpen]);

  const fetchNotifications = async () => {
    try {
      console.log('[NOTIFICATIONS] Attempting to fetch notifications...');
      const result = await notificationApi.getNotifications();
      console.log('[NOTIFICATIONS] Received result:', result);
      if (result.success) {
        setNotifications(result.data || []);
      } else {
        console.warn('[NOTIFICATIONS] API returned success:false');
        setNotifications([]);
      }
    } catch (err) {
      console.error('[NOTIFICATIONS] Failed to fetch notifications:', err.message || err);
      
      setNotifications([]);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notificationId ? { ...n, is_read: 1 } : n
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = (notif) => {
    
    if (!notif.is_read) {
      handleMarkAsRead(notif.notification_id);
    }
    
    if (notif.order_item_id) {
      setSelectedOrderItemId(notif.order_item_id);
      setOrderDetailsModalOpen(true);
    }
  };

  const serviceOptions = [
    { type: 'Repair', description: 'Fix and enhance your clothes' },
    { type: 'Customize', description: 'Personalize and customize' },
    { type: 'Dry Cleaning', description: 'Impeccable clean on your suit' },
  ];

  const user = getUser() || {
    name: userName || 'User',
    email: '',
    avatar: dp,
  };

  const handleLogout = () => {
    logoutUser();
    if (typeof setIsLoggedIn === 'function') {
      setIsLoggedIn(false);
    }
    navigate('/', { replace: true });
  };

  const handleCartUpdate = () => {
    fetchCartCount(); 
    console.log('Cart was updated from repair modal!');
   
  };

  const addServiceToCart = (type) => {
    if (type === 'Repair') {
     
      setServiceModalOpen(false);
      setRepairFormModalOpen(true);
      return;
    }

    if (type === 'Customize') {
     
      setServiceModalOpen(false);
      setCustomizationFormModalOpen(true);
      return;
    }
    
    if (type === 'Dry Cleaning') {
   
      setServiceModalOpen(false);
      setDryCleaningFormModalOpen(true);
      return;
    }

    setCartItems((prev) => {
      const id = 'ORD-' + String(prev.length + 1).padStart(4, '0');
      const newItem = {
        id,
        type,
        details: { brand: '', size: '', notes: '', repair: '', datetime: '' },
        status: 'pending',
        toPay: true,
        expanded: false,
      };
      return [...prev, newItem];
    });
    setServiceModalOpen(false);
    setCartOpen(true);
  };

  const updateItemDetails = (id, patch) => {
    setCartItems((prev) => prev.map((it) => (it.id === id ? { ...it, details: { ...it.details, ...patch } } : it)));
  };

  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((it) => it.id !== id));
  };

  const submitAppointment = async () => {
    if (cartItems.length === 0 || !appointmentDate) return;
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const payload = {
      services: cartItems.map((it) => ({ orderId: it.id, serviceType: it.type, details: { ...it.details, date: appointmentDate } })),
      customer: { name: user.name, email: user.email },
      date: appointmentDate,
    };
    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE}/api/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to submit');
      setAppointments((prev) => {
        const id = 'APT-' + String(prev.length + 1).padStart(4, '0');
        const next = [...prev, { id, status: 'pending', services: cartItems, date: appointmentDate }];
        try { localStorage.setItem('appointments', JSON.stringify(next)); } catch (e) { void e }
        return next;
      });
      setSummaryModalOpen(false);
      setCartItems([]);
      setAppointmentDate('');
    } catch {
      setSummaryModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = [
    { name: 'Rental', img: heroBg },
    { name: 'Customize', img: customizeBg },
    { name: 'Repair', img: repairBg },
    { name: 'Dry Cleaning', img: dryCleanBg },
  ];

  return (
    <>
      <header className="header">
        <div className="logo">
          <img src={logo} alt="Logo" className="logo-img" />
          <span className="logo-text">D’jackman Tailor Deluxe</span>
        </div>

        <nav className="nav">
          <a href="#top">Home</a>
          <a href="#Appointment">Appointment</a>
          <a href="#Rentals">Rental</a>
          <a href="#Customize">Customize</a>
          <a href="#Repair">Repair</a>
          <a href="#DryCleaning">Dry Cleaning</a>
        </nav>
        <button className="notif-button icon-button" onClick={() => setNotificationsOpen(true)} aria-label="Notifications">
          <svg width="24" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3a6 6 0 0 1 6 6v4l2 2H4l2-2V9a6 6 0 0 1 6-6z" stroke="#8B4513" strokeWidth="2" fill="none"/><circle cx="12" cy="20" r="2" fill="#8B4513"/></svg>
          {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
        </button>
        <button className="cart-button icon-button" onClick={() => setCartOpen(true)} aria-label="Cart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 6h14l-2 9H8L6 6z" stroke="#8B4513" strokeWidth="2" fill="none"/><circle cx="9" cy="20" r="2" fill="#8B4513"/><circle cx="17" cy="20" r="2" fill="#8B4513"/></svg>
          {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
        </button>
        <button className="profile-button icon-button" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} aria-label="Profile">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#8B4513" strokeWidth="2" fill="none"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="#8B4513" strokeWidth="2" fill="none"/></svg>
        </button>
        <div className="profile-dropdown">
          {profileDropdownOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => {
                setProfileDropdownOpen(false);
                navigate('/profile');
              }}>
                My Profile
              </button>
              <button className="dropdown-item" onClick={() => {
                setProfileDropdownOpen(false);
                setServiceModalOpen(true);
              }}>
                Book Services
              </button>
              <button className="dropdown-item logout-item" onClick={() => {
                setProfileDropdownOpen(false);
                handleLogout();
              }}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {}
            <section className="hero" id="top" style={{ backgroundImage: `url(${heroBg})` }}>
              <div className="hero-overlay"></div>
              <div className="hero-content">
                <h1>Welcome to Jackman <br />Tailor Deluxe!</h1>
                <p>Your Perfect Fit Awaits.</p>
              </div>
            </section>
      <section className="services fade-in-up">
        <h2 className="fade-in-up">Jackman's Services</h2>
        <div className="services-grid stagger-children">
          {services.map(({ name, img }) => (
            <div key={name} className="service-card glow-on-hover">
              <div
                className="service-img"
                style={{ backgroundImage: `url(${img})` }}
              ></div>
              <div className="service-footer">
                <h3>{name}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="appointment" id="Appointment">
        <h2>Book a Service</h2>
        <div className="appointment-content">
          <img src={appointmentBg} alt="Tailor" className="appointment-img" />
          <div className="appointment-overlay">
            <p>Ready for a fitting or consultation?</p>
            <p>We’re excited to serve you again!</p>
            <button className="btn-book" onClick={() => setServiceModalOpen(true)}>Book Service</button>
          </div>
        </div>
      </section>

      {/* Rental Clothes */}
      <RentalClothes openAuthModal={() => setServiceModalOpen(true)} />

      <section className="customization fade-in-up" id="Customize">
        <div className="custom-text fade-in-left">
          <h2>Customization</h2>
          <p>Got a style in mind?</p>
          <p>Personalize it and turn your vision into reality!</p>
        </div>
        <div className="custom-image fade-in-right scale-in" style={{ backgroundImage: `url('/src/assets/background.jpg'), url(${customizeBg})` }}>
          <button className="btn-customize glow-on-hover" onClick={() => setCustomizationFormModalOpen(true)}>Customize now!</button>
        </div>
      </section>

      <section className="repair fade-in-up" id="Repair">
        <h2 className="fade-in-up">Repair Service</h2>
        <div className="repair-bg scale-in" style={{ backgroundImage: `url(${repairBg})` }}>
          <div className="repair-overlay"></div>
          <div className="repair-content">
            <h3 className="fade-in-up">Need reliable repair services?</h3>
            <p className="fade-in-up">Get in touch with us today!</p>
            <button className="repair-book glow-on-hover" onClick={() => setRepairFormModalOpen(true)}>Book Repair!</button>
          </div>
        </div>
      </section>

      <section className="clean fade-in-up" id="DryCleaning">
        <h2 className="fade-in-up">Dry Cleaning Service</h2>
        <div className="clean-bg scale-in" style={{ backgroundImage: `url(${dryCleanBg})` }}>
          <div className="clean-overlay"></div>
          <div className="clean-content">
            <h3 className="fade-in-up">Keep your garments fresh and spotless</h3>
            <p className="fade-in-up">Premium care for suits, gowns, and more</p>
            <button className="clean-book glow-on-hover" onClick={() => setDryCleaningFormModalOpen(true)}>Book Dry Cleaning</button>
          </div>
        </div>
      </section>

      {serviceModalOpen && (
        <div className="auth-modal-overlay" onClick={() => setServiceModalOpen(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-container">
              <div className="auth-header">
                <h2>Select Service</h2>
                <p className="auth-subtitle">Choose the service you want to book</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {serviceOptions.map((s) => (
                  <button key={s.type} className="auth-submit" onClick={() => addServiceToCart(s.type)}>{s.type}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {notificationsOpen && (
        <div className="auth-modal-overlay" onClick={() => setNotificationsOpen(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-container">
              <div className="auth-header">
                <h2>Notifications</h2>
                <p className="auth-subtitle">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
                {notifications.length > 0 && (
                  <button
                    className="btn-secondary"
                    onClick={handleMarkAllAsRead}
                    style={{ fontSize: '13px', padding: '6px 12px', marginTop: '8px' }}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div style={{ padding: '14px', display: 'grid', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                {notifications.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                    No notifications yet
                  </div>
                )}
                {notifications.map((notif) => (
                  <div
                    key={notif.notification_id}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      border: '1px solid #eee',
                      borderRadius: '10px',
                      padding: '12px',
                      backgroundColor: notif.is_read ? '#f9f9f9' : '#fff',
                      cursor: notif.is_read ? 'default' : 'pointer',
                      opacity: notif.is_read ? 0.7 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{notif.title}</div>
                        <div style={{ fontSize: '14px', color: '#555', lineHeight: 1.4 }}>{notif.message}</div>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
                          {new Date(notif.created_at).toLocaleString()}
                        </div>
                      </div>
                      {!notif.is_read && (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: '#8B4513',
                            marginTop: 4,
                            marginLeft: 8,
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    {cartOpen && (
  <div className="cart-drawer" onClick={() => setCartOpen(false)}>
    <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
      <div className="cart-header">
        <div className="cart-title">Cart ({cartItems.length})</div>
        <button className="cart-close" onClick={() => setCartOpen(false)}>×</button>
      </div>
      <div className="cart-items">
        {cartItems.length === 0 && <div className="cart-empty">No services selected</div>}
        {cartItems.map((it) => (
          <div key={it.id} className="cart-card">
            <div className="cart-card-top">
              <div className="cart-id">{it.id}</div>
              <div className="cart-type">{it.type}</div>
            </div>
            <div className="cart-card-body">
              <div className="cart-form">
                {serviceForms[it.type]?.map((field) => (
                  <div key={field.name} className="form-group">
                    <label>{field.label}</label>
                    {field.type === "textarea" ? (
                      <textarea
                        rows={3}
                        value={it.details[field.name] || ""}
                        onChange={(e) =>
                          updateItemDetails(it.id, { [field.name]: e.target.value })
                        }
                      />
                    ) : field.type === "file" ? (
                      <input
                        type="file"
                        onChange={(e) =>
                          updateItemDetails(it.id, { [field.name]: e.target.files[0] })
                        }
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={it.details[field.name] || ""}
                        onChange={(e) =>
                          updateItemDetails(it.id, { [field.name]: e.target.value })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="cart-actions">
                <button className="btn-danger" onClick={() => removeItem(it.id)}>Remove</button>
              </div>
            </div> {/* End of cart-card-body */}
          </div> // End of cart-card
        ))}
      </div> {/* End of cart-items */}
      <div className="cart-footer">
        <button className="btn-primary" disabled={cartItems.length === 0} onClick={() => { setCartOpen(false); setSummaryModalOpen(true); }}>Proceed to booking</button>
      </div>
    </div>
  </div>
)}

     {summaryModalOpen && (
  <div className="auth-modal-overlay" onClick={() => setSummaryModalOpen(false)}>
    <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
      <div className="auth-container">
        <div className="auth-header">
          <h2>Finalize Appointment</h2>
          <p className="auth-subtitle">Review your services and select appointment date</p>
        </div>
        <div style={{ padding: '16px 18px', maxHeight: '400px', overflowY: 'auto' }}>
          {cartItems.map((it) => (
            <div key={it.id} style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #eee' }}>
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '8px', color: '#8B4513' }}>
                {it.type} • {it.id}
              </div>
              {serviceForms[it.type]?.map((field) => {
                const value = it.details[field.name];
                let displayValue = value || '-';
                
                // Special handling for file inputs
                if (field.type === 'file' && value) {
                  displayValue = value.name || 'File uploaded';
                }
                
                return (
                  <div key={field.name} style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                    <strong>{field.label}:</strong> {displayValue}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 18px', borderTop: '1px solid #eee' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
            Select Appointment Date:
          </label>
          <input
            type="date"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px 14px', 
              marginBottom: '16px', 
              border: '1px solid #ddd', 
              borderRadius: '10px',
              fontSize: '14px'
            }}
            min={new Date().toISOString().split('T')[0]}
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={() => setSummaryModalOpen(false)} className="btn-secondary">
              Back
            </button>
            <button 
              onClick={submitAppointment} 
              className="btn-primary" 
              disabled={!appointmentDate || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      {/* Cart Component */}
      <Cart 
        isOpen={cartOpen} 
        onClose={() => {
          setCartOpen(false);
          fetchCartCount(); // Refresh cart count when cart closes
        }}
        onCartUpdate={handleCartUpdate}
      />

      {/* Repair Form Modal Component */}
      <RepairFormModal 
        isOpen={repairFormModalOpen} 
        onClose={() => setRepairFormModalOpen(false)}
        onCartUpdate={handleCartUpdate}
      />

      {/* Dry Cleaning Form Modal Component */}
      <DryCleaningFormModal 
        isOpen={dryCleaningFormModalOpen} 
        onClose={() => setDryCleaningFormModalOpen(false)}
        onCartUpdate={handleCartUpdate}
      />

      {/* Customization Form Modal Component */}
      <CustomizationFormModal 
        isOpen={customizationFormModalOpen} 
        onClose={() => setCustomizationFormModalOpen(false)}
        onCartUpdate={handleCartUpdate}
      />

      {/* Order Details Modal Component */}
      <OrderDetailsModal
        isOpen={orderDetailsModalOpen}
        onClose={() => setOrderDetailsModalOpen(false)}
        orderItemId={selectedOrderItemId}
      />

    </>
  );
};

export default UserHomePage;