const { verifySocketToken } = require('../middleware/auth');
const AuctionEngine = require('../services/AuctionEngine');
const Player = require('../models/Player');
const Team = require('../models/Team');

const registerAuctionSockets = (io) => {
    io.on('connection', (socket) => {

        socket.on('join_auction', async (auctionId) => {
            if (!auctionId) return;
            const idStr = String(auctionId);
            socket.join(idStr);
            const state = await AuctionEngine.initializeRoom(idStr);
            
            // Increment room viewers tracking count
            AuctionEngine.incrementViewerCount(idStr);

            socket.emit('auction_state', {
                currentBid: state.currentBid,
                leadingTeamId: state.leadingTeamId,
                currentPlayerId: state.currentPlayerId,
                status: state.status,
                bidHistory: state.bidHistory
            });
        });

        // Reconnect synchronization event loop sync
        socket.on('sync_request', ({ auctionId, lastVersion }) => {
            if (!auctionId || typeof lastVersion !== 'number') return;
            const idStr = String(auctionId);
            const missed = AuctionEngine.getMissedEvents(idStr, lastVersion);
            if (missed) {
                socket.emit('sync_response', { type: 'DELTA', events: missed });
            } else {
                socket.emit('sync_response', { type: 'FULL', snapshot: AuctionEngine.getRoomSnapshot(idStr) });
            }
        });

        // Connection teardown hook
        socket.on('disconnecting', () => {
            const rooms = Array.from(socket.rooms);
            rooms.forEach(room => {
                const roomStr = String(room);
                if (AuctionEngine.rooms.has(roomStr)) {
                    AuctionEngine.decrementViewerCount(roomStr);
                }
            });
        });

        // --- ADMIN SOCKET EVENTS (JWT protected) ---

        socket.on('start_player', async ({ auctionId, playerId, basePrice, token }) => {
            if (!auctionId || !playerId || !token || !verifySocketToken(token)) return;
            const idStr = String(auctionId);
            const state = await AuctionEngine.initializeRoom(idStr);
            const cachedPlayer = state.players.get(playerId);
            const actualBasePrice = cachedPlayer ? cachedPlayer.basePrice : (basePrice || 20);
            state.currentBid = actualBasePrice;
            state.leadingTeamId = null;
            state.currentPlayerId = playerId;
            state.status = 'ACTIVE';
            state.bidHistory = [];
            state.version += 1;
            io.to(idStr).emit('auction_state', {
                currentBid: state.currentBid,
                leadingTeamId: state.leadingTeamId,
                currentPlayerId: state.currentPlayerId,
                status: state.status,
                bidHistory: state.bidHistory
            });
        });

        socket.on('place_bid', async ({ auctionId, teamId, amount, token }) => {
            if (!auctionId || !teamId || typeof amount !== 'number' || !token) return;
            if (!verifySocketToken(token)) return;

            const idStr = String(auctionId);
            try {
                const state = await AuctionEngine.initializeRoom(idStr);
                AuctionEngine.placeBid(idStr, teamId, amount);
                io.to(idStr).emit('auction_state', {
                    currentBid: state.currentBid,
                    leadingTeamId: state.leadingTeamId,
                    currentPlayerId: state.currentPlayerId,
                    status: state.status,
                    bidHistory: state.bidHistory
                });
            } catch (err) {
                socket.emit('error', err.message);
            }
        });

        socket.on('undo_bid', async ({ auctionId, token }) => {
            if (!auctionId || !token || !verifySocketToken(token)) return;
            const idStr = String(auctionId);
            const state = await AuctionEngine.initializeRoom(idStr);
            if (state.bidHistory.length > 0) {
                const prev = state.bidHistory.pop();
                state.currentBid = prev.bid;
                state.leadingTeamId = prev.leader;
                state.version += 1;
                io.to(idStr).emit('auction_state', {
                    currentBid: state.currentBid,
                    leadingTeamId: state.leadingTeamId,
                    currentPlayerId: state.currentPlayerId,
                    status: state.status,
                    bidHistory: state.bidHistory
                });
            }
        });

        socket.on('toggle_pause', async ({ auctionId, token }) => {
            if (!auctionId || !token || !verifySocketToken(token)) return;
            const idStr = String(auctionId);
            const state = await AuctionEngine.initializeRoom(idStr);
            state.status = state.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
            state.version += 1;
            io.to(idStr).emit('auction_state', {
                currentBid: state.currentBid,
                leadingTeamId: state.leadingTeamId,
                currentPlayerId: state.currentPlayerId,
                status: state.status,
                bidHistory: state.bidHistory
            });
        });

        socket.on('sell_player', async ({ auctionId, token }) => {
            if (!auctionId || !token || !verifySocketToken(token)) return;
            const idStr = String(auctionId);
            try {
                const state = await AuctionEngine.initializeRoom(idStr);
                const currentPlayerId = state.currentPlayerId;
                const leadingTeamId = state.leadingTeamId;

                AuctionEngine.sellPlayer(idStr);

                // Broadcast updated live state
                io.to(idStr).emit('auction_state', {
                    currentBid: state.currentBid,
                    leadingTeamId: state.leadingTeamId,
                    currentPlayerId: state.currentPlayerId,
                    status: state.status,
                    bidHistory: state.bidHistory
                });

                // Broadcast updated player and team documents populated from the engine state cache
                io.to(idStr).emit('player_sold', { 
                    player: state.players.get(currentPlayerId), 
                    team: state.teams.get(leadingTeamId) 
                });
            } catch (err) {
                console.error("❌ Error selling player:", err);
            }
        });

        socket.on('unsell_player', async ({ auctionId, token }) => {
            if (!auctionId || !token || !verifySocketToken(token)) return;
            const idStr = String(auctionId);
            const state = await AuctionEngine.initializeRoom(idStr);
            if (state.currentPlayerId) {
                state.status = 'UNSOLD';
                state.version += 1;
                io.to(idStr).emit('auction_state', {
                    currentBid: state.currentBid,
                    leadingTeamId: state.leadingTeamId,
                    currentPlayerId: state.currentPlayerId,
                    status: state.status,
                    bidHistory: state.bidHistory
                });
                try {
                    const updatedPlayer = await Player.findByIdAndUpdate(
                        state.currentPlayerId, 
                        { isSold: false, isUnsold: true, soldTo: null, soldPrice: 0, bidHistory: [] }, 
                        { new: true }
                    ).lean();

                    // Sync changes back to engine cache
                    AuctionEngine.addOrUpdatePlayer(idStr, updatedPlayer);

                    io.to(idStr).emit('player_updated', { player: updatedPlayer });
                } catch (err) {
                    console.error("❌ Error unselling player:", err);
                }
            }
        });

        socket.on('reset_round', async ({ auctionId, token }) => {
            if (!auctionId || !token || !verifySocketToken(token)) return;
            const idStr = String(auctionId);
            const state = await AuctionEngine.initializeRoom(idStr);
            Object.assign(state, { currentBid: 0, leadingTeamId: null, currentPlayerId: null, status: 'IDLE', bidHistory: [] });
            state.version += 1;
            io.to(idStr).emit('auction_state', {
                currentBid: state.currentBid,
                leadingTeamId: state.leadingTeamId,
                currentPlayerId: state.currentPlayerId,
                status: state.status,
                bidHistory: state.bidHistory
            });
        });

        // Forced DB refresh to keep clients in sync when a player or team is modified
        socket.on('data_update', async ({ auctionId, token }) => {
            if (!auctionId || !token || !verifySocketToken(token)) return;
            const idStr = String(auctionId);
            try {
                const [teams, players] = await Promise.all([
                    Team.find({ auctionId: idStr }).lean(),
                    Player.find({ auctionId: idStr }).sort({ order: 1 }).lean()
                ]);

                // Sync engine cache
                const state = await AuctionEngine.initializeRoom(idStr);
                if (state) {
                    state.teams.clear();
                    state.players.clear();
                    teams.forEach(t => {
                        t.playerSet = new Set((t.players || []).map(p => p.toString()));
                        state.teams.set(t._id.toString(), t);
                    });
                    players.forEach(p => {
                        state.players.set(p._id.toString(), p);
                    });
                }

                io.to(idStr).emit('data_refreshed', { teams, players });
            } catch (err) {
                console.error("❌ Error in data_update socket event:", err);
            }
        });
    });
};

module.exports = registerAuctionSockets;
