import axios from "axios";

const getApiBase = () => {
  
  if (typeof window !== 'undefined' && window.REACT_NATIVE_AUTH?.apiBaseUrl) {
    return window.REACT_NATIVE_AUTH.apiBaseUrl;
  }

  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api';
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:5000/api`;
    }
  }

  return 'http://localhost:5000/api';
};

const BASE_URL = getApiBase();

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export async function getAllGarmentTypes() {
  try {
    const response = await axios.get(`${BASE_URL}/garment-types`);
    return response.data;
  } catch (error) {
    console.error("Get garment types error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching garment types",
      garments: []
    };
  }
}

export async function getAllGarmentTypesAdmin() {
  try {
    const response = await axios.get(`${BASE_URL}/garment-types/admin`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get garment types (admin) error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching garment types",
      garments: []
    };
  }
}

export async function createGarmentType(garmentData) {
  try {
    const response = await axios.post(
      `${BASE_URL}/garment-types`,
      garmentData,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Create garment type error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error creating garment type"
    };
  }
}

export async function updateGarmentType(garmentId, garmentData) {
  try {
    const response = await axios.put(
      `${BASE_URL}/garment-types/${garmentId}`,
      garmentData,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Update garment type error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error updating garment type"
    };
  }
}

export async function deleteGarmentType(garmentId) {
  try {
    const response = await axios.delete(
      `${BASE_URL}/garment-types/${garmentId}?permanent=true`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Delete garment type error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error deleting garment type"
    };
  }
}

