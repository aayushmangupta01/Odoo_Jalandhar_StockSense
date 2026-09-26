import axios from 'axios';
import authApi from './authApi';

const fallbackBaseUrl =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api/inventory';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/inventory',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

API.interceptors.request.use((config) => {
  const token = authApi.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const isRetryableNetworkError = (error) => {
  if (!error) return false;

  const status = error.response?.status;
  const code = error.code;
  const message = (error.message || '').toLowerCase();

  return (
    !error.response ||
    status === 403 ||
    status === 502 ||
    code === 'ERR_NETWORK' ||
    code === 'ECONNABORTED' ||
    message.includes('network error') ||
    message.includes('failed to fetch')
  );
};

const getDirectFallbackUrl = (requestUrl = '') => {
  const normalizedPath = requestUrl.startsWith('/')
    ? requestUrl
    : `/${requestUrl}`;
  return `${fallbackBaseUrl.replace(/\/$/, '')}${normalizedPath}`;
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;

    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (!isRetryableNetworkError(error)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const fallbackResponse = await axios({
        ...originalRequest,
        baseURL: undefined,
        url: getDirectFallbackUrl(originalRequest.url || ''),
        headers: {
          ...originalRequest.headers,
          ...(authApi.getToken() ? { Authorization: `Bearer ${authApi.getToken()}` } : {}),
          'X-Direct-Fallback': 'true',
        },
      });

      return fallbackResponse;
    } catch (fallbackError) {
      return Promise.reject(fallbackError);
    }
  }
);

export const inventoryApi = {
  getSummary: () => API.get('/summary').then((res) => res.data),
  getCategoryStock: () => API.get('/category-stock').then((res) => res.data),
  getStaffDashboard: () => API.get('/staff/dashboard').then((res) => res.data),
  getLowStock: () => API.get('/low-stock').then((res) => res.data),
  getAlerts: () => API.get('/alerts').then((res) => res.data),

  // Products
  getProducts: () => API.get('/products').then((res) => res.data),
  getProductById: (id) => API.get(`/products/${id}`).then((res) => res.data),
  createProduct: (data) => API.post('/products', data).then((res) => res.data),
  updateProduct: (id, data) => API.put(`/products/${id}`, data).then((res) => res.data),
  setProductStatus: (id, status) => API.patch(`/products/${id}/status`, { status }).then((res) => res.data),

  // Categories
  getCategories: () => API.get('/categories').then((res) => res.data),
  createCategory: (data) => API.post('/categories', data).then((res) => res.data),

  // Current Stock
  getStock: () => API.get('/stock').then((res) => res.data),

  // Receipts
  getReceipts: () => API.get('/receipts').then((res) => res.data),
  getReceiptById: (id) => API.get(`/receipts/${id}`).then((res) => res.data),
  createReceipt: (data) => API.post('/receipts', data).then((res) => res.data),
  validateReceipt: (id) => API.post(`/receipts/${id}/validate`).then((res) => res.data),
  updateReceiptStatus: (id, status) => API.patch(`/receipts/${id}/status`, { status }).then((res) => res.data),

  // Deliveries
  getDeliveries: () => API.get('/deliveries').then((res) => res.data),
  createDelivery: (data) => API.post('/deliveries', data).then((res) => res.data),
  validateDelivery: (id) => API.post(`/deliveries/${id}/validate`).then((res) => res.data),
  updateDeliveryStatus: (id, status) => API.patch(`/deliveries/${id}/status`, { status }).then((res) => res.data),

  // Adjustments & Verification
  getAdjustments: () => API.get('/adjustments').then((res) => res.data),
  createAdjustment: (data) => API.post('/adjustments', data).then((res) => res.data),
  getAdjustmentRequests: () => API.get('/adjustment-requests').then((res) => res.data),
  createAdjustmentRequest: (data) => API.post('/adjustment-requests', data).then((res) => res.data),
  approveAdjustmentRequest: (id, review_note) => API.post(`/adjustment-requests/${id}/approve`, { review_note }).then((res) => res.data),
  rejectAdjustmentRequest: (id, review_note) => API.post(`/adjustment-requests/${id}/reject`, { review_note }).then((res) => res.data),
  getAuditLogs: () => API.get('/audit-logs').then((res) => res.data),
  getTransfers: () => API.get('/transfers').then((res) => res.data),
  getTransfer: (id) => API.get(`/transfers/${id}`).then((res) => res.data),
  createTransfer: (data) => API.post('/transfers', data).then((res) => res.data),
  approveTransfer: (id) => API.post(`/transfers/${id}/approve`).then((res) => res.data),
  processTransfer: (id) => API.post(`/transfers/${id}/process`).then((res) => res.data),
  getMyActivity: () => API.get('/my-activity').then((res) => res.data),

  // Opening Stock
  getOpeningStock: () => API.get('/opening-stock').then((res) => res.data),
  createOpeningStock: (data) => API.post('/opening-stock', data).then((res) => res.data),

  // Movements & Ledger
  getMovements: () => API.get('/movements').then((res) => res.data),
  getLedger: (params) => API.get('/ledger', { params }).then((res) => res.data),

  // Intelligence
  getAnomalies: () => API.get('/intelligence/anomalies').then((res) => res.data),
  getForecast: () => API.get('/intelligence/forecast').then((res) => res.data),
  getExplanation: (productId) => API.get(`/intelligence/explanations/${productId}`).then((res) => res.data),
  getLocationIntelligence: () => API.get('/intelligence/location').then((res) => res.data),
  queryStockDetective: (query) => API.post('/stock-detective/query', { query }).then((res) => res.data),
};

export default inventoryApi;
