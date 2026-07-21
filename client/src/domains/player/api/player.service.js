import http from '@shared/services/http';

export const createPlayer = (payload) => {
    return http.post('/api/players', payload);
};

export const bulkImportPlayers = (auctionId, players) => {
    return http.post('/api/players/bulk', { auctionId, players });
};

export const deletePlayer = (id) => {
    return http.delete(`/api/players/${id}`);
};

export const updatePlayer = (id, payload) => {
    return http.put(`/api/players/${id}`, payload);
};
