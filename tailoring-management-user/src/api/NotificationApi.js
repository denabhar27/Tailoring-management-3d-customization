

const getApiBase = () => {
  
  if (import.meta.env.VITE_API_URL) {
    console.log('[NOTIFICATION API] Using VITE_API_URL from env:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('[NOTIFICATION API] Using localhost');
    return 'http://localhost:5000';
  }

  const possibleIPs = [
    '192.168.1.202',  
    '192.168.254.102', 
    window.location.hostname.split(':')[0] 
  ];

  const backendIP = possibleIPs[0];
  const apiBase = `http://${backendIP}:5000`;
  console.log('[NOTIFICATION API] Auto-detected API base URL:', apiBase);
  console.log('[NOTIFICATION API] If this is wrong, set VITE_API_URL in .env file');
  return apiBase;
};

const API_BASE = getApiBase();

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const notificationApi = {
  
  getNotifications: async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); 
      
      const res = await fetch(`${API_BASE}/api/notifications`, {
        method: 'GET',
        headers: getAuthHeaders(),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch notifications: ${res.status} ${res.statusText}`);
      }
      return res.json();
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Request timeout: Backend server may be unavailable. Please check if the server is running.');
      }
      if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION')) {
        throw new Error('Cannot connect to server. Please check if the backend is running and accessible.');
      }
      throw err;
    }
  },

  getUnreadCount: async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); 
      
      const res = await fetch(`${API_BASE}/api/notifications/unread-count`, {
        method: 'GET',
        headers: getAuthHeaders(),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch unread count: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      return data.count || 0;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Request timeout: Backend server may be unavailable.');
      }
      if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION')) {
        
        console.warn('Failed to fetch unread count, returning 0:', err.message);
        return 0;
      }
      throw err;
    }
  },

  markAsRead: async (notificationId) => {
    const res = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark as read');
    return res.json();
  },

  markAllAsRead: async () => {
    const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark all as read');
    return res.json();
  },
};
