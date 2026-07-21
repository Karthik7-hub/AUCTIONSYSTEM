import axios from 'axios';
import { API_URL } from '@config/api';

const http = axios.create({ baseURL: API_URL });

// --- REQUEST INTERCEPTOR ---
// Automatically attach Authorization header using the token stored for the current context.
// We peek at the URL to determine which token to use.
http.interceptors.request.use((config) => {
    let token = null;

    if (config.url?.includes('/api/super-admin') || config.url?.includes('/api/verify-super-token')) {
        token = localStorage.getItem('sa_access_token');
    } else {
        // For host endpoints: find first matching access token in storage
        // The AuctionLayout will set a global window.__auctionId for context
        const auctionId = window.__auctionId;
        if (auctionId) token = localStorage.getItem(`access_token_${auctionId}`);
    }

    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// --- RESPONSE INTERCEPTOR ---
// On 401, try to refresh the access token once, then retry the original request.
// If refresh fails (refresh token also expired), force logout.
let isRefreshing = false;
let refreshQueue = []; // queue of failed requests waiting for the new token

const processQueue = (error, token = null) => {
    refreshQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    refreshQueue = [];
};

http.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;
        if (error.response?.status !== 401 || original._retry) {
            return Promise.reject(error);
        }

        // Determine context (super admin or host)
        const isSuperAdmin = original.url?.includes('/api/super-admin') || original.url?.includes('/api/verify-super-token');
        const refreshToken = isSuperAdmin
            ? localStorage.getItem('sa_refresh_token')
            : localStorage.getItem(`refresh_token_${window.__auctionId}`);

        if (!refreshToken) return Promise.reject(error);

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                refreshQueue.push({ resolve, reject });
            }).then((token) => {
                original.headers.Authorization = `Bearer ${token}`;
                return http(original);
            }).catch(Promise.reject);
        }

        original._retry = true;
        isRefreshing = true;

        try {
            const res = await axios.post(`${API_URL}/api/refresh-token`, { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = res.data;

            // Store new tokens
            if (isSuperAdmin) {
                localStorage.setItem('sa_access_token', accessToken);
                localStorage.setItem('sa_refresh_token', newRefreshToken);
            } else {
                localStorage.setItem(`access_token_${window.__auctionId}`, accessToken);
                localStorage.setItem(`refresh_token_${window.__auctionId}`, newRefreshToken);
            }

            processQueue(null, accessToken);
            original.headers.Authorization = `Bearer ${accessToken}`;
            return http(original);
        } catch (refreshError) {
            processQueue(refreshError, null);
            // Refresh failed — clear tokens and let the app handle logout
            if (isSuperAdmin) {
                localStorage.removeItem('sa_access_token');
                localStorage.removeItem('sa_refresh_token');
            } else if (window.__auctionId) {
                localStorage.removeItem(`access_token_${window.__auctionId}`);
                localStorage.removeItem(`refresh_token_${window.__auctionId}`);
            }
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default http;
