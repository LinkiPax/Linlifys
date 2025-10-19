// src/utils/auth.js
import axios from 'axios';

export const verifyToken = async () => {
    try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
            throw new Error('No token found');
        }

        const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/user/verify-token`,
            {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Token verification failed:', error);
        
        // Clear invalid token
        if (error.response?.status === 401 || error.response?.status === 400) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            localStorage.removeItem('userId');
        }
        
        throw error;
    }
};