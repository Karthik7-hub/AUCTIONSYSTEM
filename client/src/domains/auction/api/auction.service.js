import http from '@shared/services/http';

export const getAuctions = () => {
    return http.get('/api/auctions');
};

export const getArchivedAuctions = () => {
    return http.get('/api/auctions/archived');
};

export const createAuction = (payload) => {
    return http.post('/api/create-auction', payload);
};

export const updateAuction = (id, payload) => {
    return http.put(`/api/auctions/${id}`, payload);
};

export const archiveAuction = (id) => {
    return http.patch(`/api/auctions/${id}/archive`);
};

export const restoreAuction = (id) => {
    return http.patch(`/api/auctions/${id}/restore`);
};

export const deleteAuction = (id) => {
    return http.delete(`/api/auctions/${id}`);
};

export const getAuctionInit = (auctionId) => {
    return http.get(`/api/init/${auctionId}?t=${Date.now()}`);
};
