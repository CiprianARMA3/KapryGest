import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Users
export const getUsers = () => api.get('/users');
export const createUser = (data: any) => api.post('/users', data);
export const updateUser = (id: number, data: any) => api.put(`/users/${id}`, data);
export const deleteUser = (id: number) => api.delete(`/users/${id}`);

// Payments
export const getPayments = () => api.get('/payments');
export const createPayment = (data: any) => api.post('/payments', data);

// Subscriptions
export const getSubscriptions = () => api.get('/subscriptions');
export const createSubscription = (data: any) => api.post('/subscriptions', data);
