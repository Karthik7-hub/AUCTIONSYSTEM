import http from './http';

// Auctions CRUD & Init
export const getAuctions = () => {
    return http.get('/api/auctions');
};

export const createAuction = (payload) => {
    return http.post('/api/create-auction', payload);
};

export const updateAuction = (id, payload) => {
    return http.put(`/api/auctions/${id}`, payload);
};

export const deleteAuction = (id) => {
    return http.delete(`/api/auctions/${id}`);
};

export const getAuctionInit = (auctionId) => {
    return http.get(`/api/init/${auctionId}`);
};

// Teams CRUD
export const createTeam = (payload) => {
    return http.post('/api/teams', payload);
};

export const deleteTeam = (id) => {
    return http.delete(`/api/teams/${id}`);
};

// Players CRUD
export const createPlayer = (payload) => {
    return http.post('/api/players', payload);
};

export const deletePlayer = (id) => {
    return http.delete(`/api/players/${id}`);
};
