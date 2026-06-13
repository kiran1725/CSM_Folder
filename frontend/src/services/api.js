import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
};

export const carService = {
  getCars: () => api.get('/cars/'),
  addCar: (carData) => api.post('/cars/', carData),
};

export const serviceRequestService = {
  getRequests: () => api.get('/service-requests/me'),
  getAllRequests: () => api.get('/service-requests/all'),
  createRequest: (requestData) => api.post('/service-requests/', requestData),
  updateStatus: (requestId, status) =>
    api.patch(`/service-requests/${requestId}/status`, { status }),
};

export const paymentService = {
  getPayments:   ()           => api.get('/payments/'),
  createPayment: (data)       => api.post('/payments/', data),
  updatePayment: (id, data)   => api.patch(`/payments/${id}`, data),   // ← marks as PAID after Razorpay
  deletePayment: (id)         => api.delete(`/payments/${id}`),
  getPaymentById:(id)         => api.get(`/payments/${id}`),
};

export const adminService = {
  getAllUsers: () => api.get('/admin/users'),
  getAllCars:  () => api.get('/admin/cars'),
};

export default api;