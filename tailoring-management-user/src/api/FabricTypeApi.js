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

export async function getAllFabricTypes() {
  try {
    const response = await axios.get(`${BASE_URL}/fabric-types`);
    return response.data;
  } catch (error) {
    console.error("Get fabric types error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching fabric types",
      fabrics: []
    };
  }
}

export async function getAllFabricTypesAdmin() {
  try {
    const response = await axios.get(`${BASE_URL}/fabric-types/admin`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get fabric types (admin) error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching fabric types",
      fabrics: []
    };
  }
}

export async function createFabricType(fabricData) {
  try {
    const response = await axios.post(
      `${BASE_URL}/fabric-types`,
      fabricData,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Create fabric type error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error creating fabric type"
    };
  }
}

export async function updateFabricType(fabricId, fabricData) {
  try {
    const response = await axios.put(
      `${BASE_URL}/fabric-types/${fabricId}`,
      fabricData,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Update fabric type error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error updating fabric type"
    };
  }
}

export async function deleteFabricType(fabricId) {
  try {
    const response = await axios.delete(
      `${BASE_URL}/fabric-types/${fabricId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Delete fabric type error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error deleting fabric type"
    };
  }
}

