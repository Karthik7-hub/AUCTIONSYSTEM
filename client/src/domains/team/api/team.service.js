import http from '@shared/services/http';

export const createTeam = (payload) => {
    return http.post('/api/teams', payload);
};

export const bulkImportTeams = (auctionId, teams) => {
    return http.post('/api/teams/bulk', { auctionId, teams });
};

export const deleteTeam = (id) => {
    return http.delete(`/api/teams/${id}`);
};

export const updateTeam = (id, payload) => {
    return http.put(`/api/teams/${id}`, payload);
};
