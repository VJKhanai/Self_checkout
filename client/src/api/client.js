import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

export const apiError = (err) => {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.message) return err.message;
  return 'Something went wrong. Please try again.';
};

export default api;
