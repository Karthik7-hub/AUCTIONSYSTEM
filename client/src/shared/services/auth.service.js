import http from './http';

// --- TOKEN STORAGE KEYS ---
const getAccessKey = (id) => `access_token_${id}`;
const getRefreshKey = (id) => `refresh_token_${id}`;

// Host tokens (scoped to auction)
export const getAccessToken = (auctionId) => localStorage.getItem(getAccessKey(auctionId));
export const getRefreshToken = (auctionId) => localStorage.getItem(getRefreshKey(auctionId));
export const setTokens = (auctionId, accessToken, refreshToken) => {
    localStorage.setItem(getAccessKey(auctionId), accessToken);
    localStorage.setItem(getRefreshKey(auctionId), refreshToken);
};
export const clearTokens = (auctionId) => {
    localStorage.removeItem(getAccessKey(auctionId));
    localStorage.removeItem(getRefreshKey(auctionId));
};

// Super admin tokens (global)
export const getSuperAdminAccessToken = () => localStorage.getItem('sa_access_token');
export const getSuperAdminRefreshToken = () => localStorage.getItem('sa_refresh_token');
export const setSuperAdminTokens = (accessToken, refreshToken) => {
    localStorage.setItem('sa_access_token', accessToken);
    localStorage.setItem('sa_refresh_token', refreshToken);
};
export const clearSuperAdminTokens = () => {
    localStorage.removeItem('sa_access_token');
    localStorage.removeItem('sa_refresh_token');
};

// --- AUTH API CALLS ---
export const verifyHostPassword = (auctionId, password) =>
    http.post('/api/verify-admin', { auctionId, password });

export const verifySuperAdminPassword = (password) =>
    http.post('/api/super-admin/login', { password });

export const refreshAccessToken = (refreshToken) =>
    http.post('/api/refresh-token', { refreshToken });

export const verifyStoredToken = (auctionId) => {
    const token = getAccessToken(auctionId);
    if (!token) return Promise.reject(new Error('No token'));
    return http.get('/api/verify-token', {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const verifyStoredSuperAdminToken = () => {
    const token = getSuperAdminAccessToken();
    if (!token) return Promise.reject(new Error('No token'));
    return http.get('/api/verify-super-token', {
        headers: { Authorization: `Bearer ${token}` }
    });
};
