// Production API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://opentl-backend-1.onrender.com';

export const api = {
    base: API_BASE_URL,
    
    // Helper for authenticated requests
    authHeaders: (token: string) => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }),
    
    // Common fetch wrapper
    fetch: async (url: string, options: RequestInit = {}) => {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
    }
};

export default api;
