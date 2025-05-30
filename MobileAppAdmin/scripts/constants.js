// Base API URL
const BASE_API_URL = 'https://slvetooltitans.com/api';

// Product APIs
const PRODUCT_API = {
    GET_ALL: `${BASE_API_URL}/products/getAllProduct`,
    CREATE: `${BASE_API_URL}/products/createProduct`,
    UPDATE: (productId) => `${BASE_API_URL}/products/updateProduct/${productId}`,
    DELETE: (productId) => `${BASE_API_URL}/products/deleteProduct/${productId}`
};

// Category APIs
const CATEGORY_API = {
    GET_ALL: `${BASE_API_URL}/categories`,
    CREATE: `${BASE_API_URL}/categories/createCategory`,
    UPDATE: (categoryId) => `${BASE_API_URL}/categories/update/${categoryId}`,
    DELETE: (categoryId) => `${BASE_API_URL}/categories/delete/${categoryId}`
};

// Constants will be available globally.
// If module system is desired later, ensure scripts are loaded with type="module"
// and use import/export syntax.
// export { PRODUCT_API, CATEGORY_API };