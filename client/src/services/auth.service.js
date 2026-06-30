import http from './http';

export const verifyHostPassword = (auctionId, password) => {
    return http.post('/api/verify-admin', { auctionId, password });
};

export const verifySuperAdminPassword = (password) => {
    return http.post('/api/super-admin/login', { password });
};
