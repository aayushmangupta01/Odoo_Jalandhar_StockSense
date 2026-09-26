import axios from 'axios';

const fallbackBaseUrl =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api/inventory';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/inventory',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
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
  getLowStock: () => API.get('/low-stock').then((res) => res.data),
  getAlerts: () => API.get('/alerts').then((res) => res.data),

  // Products
  getProducts: () => API.get('/products').then((res) => res.data),
  getProductById: (id) => API.get(`/products/${id}`).then((res) => res.data),
  createProduct: (data) => API.post('/products', data).then((res) => res.data),
  updateProduct: (id, data) => API.put(`/products/${id}`, data).then((res) => res.data),

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

  // Deliveries
  getDeliveries: () => API.get('/deliveries').then((res) => res.data),
  createDelivery: (data) => API.post('/deliveries', data).then((res) => res.data),
  validateDelivery: (id) => API.post(`/deliveries/${id}/validate`).then((res) => res.data),

  // Adjustments & Verification
  getAdjustments: () => API.get('/adjustments').then((res) => res.data),
  createAdjustment: (data) => API.post('/adjustments', data).then((res) => res.data),

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
