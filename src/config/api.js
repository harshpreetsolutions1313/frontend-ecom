// API Configuration
// Centralized API base URL configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
'http://localhost:5000';

export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  PRODUCTS: `${API_BASE_URL}/api/products`,
  PRODUCT_BY_ID: (id) => `${API_BASE_URL}/api/products/${encodeURIComponent(id)}`,
  PRODUCTS_BY_CATEGORY: (category) => `${API_BASE_URL}/api/products/category/${encodeURIComponent(category)}`,
  PRODUCT_SEARCH: (query) => `${API_BASE_URL}/api/products/search?q=${encodeURIComponent(query)}`,
  PRODUCTS_PRICE_RANGE: (minPrice, maxPrice) => {
    const params = [];
    if (minPrice) params.push(`minPrice=${encodeURIComponent(minPrice)}`);
    if (maxPrice) params.push(`maxPrice=${encodeURIComponent(maxPrice)}`);
    return `${API_BASE_URL}/api/products/filter/price-range?${params.join('&')}`;
  },
  CATEGORIES_DETAILS: `${API_BASE_URL}/api/products/categories/details`,
  ORDERS_CREATE: `${API_BASE_URL}/api/orders/create`,
  ORDERS_CREATE_BATCH: `${API_BASE_URL}/api/orders/create-batch`,
  CART: `${API_BASE_URL}/api/users/cart`,
};

export default API_ENDPOINTS;
