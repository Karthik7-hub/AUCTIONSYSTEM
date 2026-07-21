const Player = require('../models/Player');
const Team = require('../models/Team');

class AuctionEngine {
    constructor() {
        this.rooms = new Map(); // Keep hot active room state in RAM
        this.writeQueues = new Map(); // Isolated write queues per room to prevent cross-blocking
        this.evictionTimeouts = new Map(); // Timeout handles for room cleanup
    }

    /**
     * Load auction room data from DB on first client connection
     */
    async initializeRoom(auctionId) {
        const idStr = String(auctionId);
        if (this.rooms.has(idStr)) return this.rooms.get(idStr);

        const [teams, players] = await Promise.all([
            Team.find({ auctionId: idStr }).lean(),
            Player.find({ auctionId: idStr }).sort('order').lean()
        ]);

        const state = {
            auctionId: idStr,
            version: 0,
            currentBid: 0,
            leadingTeamId: null,
            currentPlayerId: null,
            status: 'IDLE',
            bidHistory: [],
            // Convert team squads to Set buffers for fast O(1) membership checks
            teams: new Map(teams.map(t => {
                const tObj = { ...t, playerSet: new Set((t.players || []).map(p => p.toString())) };
                return [t._id.toString(), tObj];
            })),
            players: new Map(players.map(p => [p._id.toString(), p])),
            eventLog: [], // Sliding window event stream
            viewerCount: 0,
            lastSavedVersion: 0
        };

        this.rooms.set(idStr, state);
        return state;
    }

    /**
     * Sliding Window Event Logger (Limit to 100 historical logs)
     */
    logEvent(state, type, payload) {
        const event = {
            version: state.version,
            type,
            payload,
            timestamp: Date.now()
        };
        state.eventLog.push(event);
        if (state.eventLog.length > 100) {
            state.eventLog.shift();
        }
        return event;
    }

    /**
     * Reconnect Sync Helper
     */
    getMissedEvents(auctionId, lastVersion) {
        const idStr = String(auctionId);
        const state = this.rooms.get(idStr);
        if (!state) return null;

        const firstEvent = state.eventLog[0];
        // If sliding window is empty or lastVersion has fallen behind the window start
        if (!firstEvent || lastVersion < firstEvent.version - 1) {
            return null; // Require a full snapshot reload
        }

        return state.eventLog.filter(e => e.version > lastVersion);
    }

    /**
     * Viewer Connection Tracking & Eviction Lifecycle
     */
    incrementViewerCount(auctionId) {
        const idStr = String(auctionId);
        const state = this.rooms.get(idStr);
        if (!state) return;
        state.viewerCount += 1;

        // Cancel pending eviction timeout if active client returns
        if (this.evictionTimeouts.has(idStr)) {
            clearTimeout(this.evictionTimeouts.get(idStr));
            this.evictionTimeouts.delete(idStr);
            console.log(`[Eviction] Timer cancelled for room ${idStr}. Connected: ${state.viewerCount}`);
        }
    }

    decrementViewerCount(auctionId) {
        const idStr = String(auctionId);
        const state = this.rooms.get(idStr);
        if (!state) return;
        state.viewerCount = Math.max(0, state.viewerCount - 1);

        if (state.viewerCount === 0) {
            // Evict room after 5 minutes of total inactivity (300,000ms)
            const timeout = setTimeout(() => {
                this.evictRoom(idStr);
            }, 300000);
            this.evictionTimeouts.set(idStr, timeout);
            console.log(`[Eviction] Scheduled eviction for room ${idStr} in 5 minutes.`);
        }
    }

    evictRoom(idStr) {
        console.log(`[Eviction] Evicting idle room ${idStr} from Node memory.`);
        this.rooms.delete(idStr);
        this.writeQueues.delete(idStr);
        this.evictionTimeouts.delete(idStr);
    }

    /**
     * Sync methods for CRUD REST endpoints
     */
    addOrUpdateTeam(auctionId, team) {
        const idStr = String(auctionId);
        const state = this.rooms.get(idStr);
        if (state) {
            const teamObj = team.toObject ? team.toObject() : team;
            teamObj.playerSet = new Set((teamObj.players || []).map(p => p.toString()));
            state.teams.set(teamObj._id.toString(), teamObj);
        }
    }

    deleteTeam(auctionId, teamId, resetPlayerIds) {
        const idStr = String(auctionId);
        const state = this.rooms.get(idStr);
        if (state) {
            state.teams.delete(String(teamId));
            if (resetPlayerIds && resetPlayerIds.length) {
                resetPlayerIds.forEach(pId => {
                    const player = state.players.get(String(pId));
                    if (player) {
                        player.isSold = false;
                        player.soldTo = null;
                        player.soldPrice = 0;
                        player.soldAt = null;
                    }
                });
            }
        }
    }

    addOrUpdatePlayer(auctionId, player) {
        const idStr = String(auctionId);
        const state = this.rooms.get(idStr);
        if (state) {
            const playerObj = player.toObject ? player.toObject() : player;
            state.players.set(playerObj._id.toString(), playerObj);
        }
    }

    deletePlayer(auctionId, playerId, updatedTeam) {
        const idStr = String(auctionId);
        const state = this.rooms.get(idStr);
        if (state) {
            state.players.delete(String(playerId));
            if (updatedTeam) {
                const teamObj = updatedTeam.toObject ? updatedTeam.toObject() : updatedTeam;
                teamObj.playerSet = new Set((teamObj.players || []).map(p => p.toString()));
                state.teams.set(teamObj._id.toString(), teamObj);
            }
        }
    }

    /**
     * Atomic Bidding Mutation
     */
    placeBid(auctionId, teamId, amount) {
        const idStr = String(auctionId);
        const state = this.rooms.get(idStr);
        if (!state || state.status !== 'ACTIVE') throw new Error('Auction not active');
        if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) throw new Error('Bid must be a positive number');
        
        // Concurrency Guard
        if (state.leadingTeamId === null) {
            if (amount < state.currentBid) throw new Error('Bid below base price');
        } else {
            if (amount <= state.currentBid) throw new Error('Bid below current high');
        }

        // Mutation inside live memory state machine (O(1))
        state.bidHistory.push({ bid: state.currentBid, leader: state.leadingTeamId });
        state.currentBid = amount;
        state.leadingTeamId = teamId;
        state.version += 1;

        // Log to sliding window stream
        return this.logEvent(state, 'BID_PLACED', { b: amount, t: teamId, v: state.version });
    }

    /**
     * Sell Player - Dequeue database writes from live thread
     */
    sellPlayer(auctionId) {
        const idStr = String(auctionId);
        const state = this.rooms.get(idStr);
        if (!state || !state.currentPlayerId || !state.leadingTeamId) {
            throw new Error('No active bid transaction');
        }

        const pId = state.currentPlayerId;
        const tId = state.leadingTeamId;
        const price = state.currentBid;
        const soldAt = new Date(); // capture exact moment of sale

        // Update RAM Store immediately (O(1))
        state.status = 'SOLD';
        state.version += 1;

        const player = state.players.get(pId);
        if (player) {
            player.isSold = true;
            player.isUnsold = false;
            player.soldTo = tId;
            player.soldPrice = price;
            player.soldAt = soldAt;
            player.bidHistory = [...state.bidHistory];
        }

        const team = state.teams.get(tId);
        if (team) {
            team.spent = (team.spent || 0) + price;
            if (!team.playerSet.has(pId)) {
                team.playerSet.add(pId);
                team.players.push(pId);
            }
        }

        const currentVersion = state.version;
        const eventDto = this.logEvent(state, 'PLAYER_SOLD', { p: pId, t: tId, b: price, v: currentVersion });

        // Isolated write queue synchronization task
        this.queueWrite(idStr, async () => {
            await Promise.all([
                Player.findByIdAndUpdate(pId, { isSold: true, isUnsold: false, soldTo: tId, soldPrice: price, bidHistory: state.bidHistory, soldAt }),
                Team.findByIdAndUpdate(tId, { $inc: { spent: price }, $push: { players: pId } })
            ]);
            state.lastSavedVersion = currentVersion;
        });

        return eventDto;
    }

    queueWrite(auctionId, task, retries = 3, baseDelay = 1000) {
        const idStr = String(auctionId);
        if (!this.writeQueues.has(idStr)) {
            this.writeQueues.set(idStr, Promise.resolve());
        }
        const queue = this.writeQueues.get(idStr);
        const nextQueue = queue.then(async () => {
            let attempt = 0;
            while (attempt < retries) {
                try {
                    await task();
                    return; // Success
                } catch (err) {
                    attempt++;
                    console.error(`[Write-Queue ${idStr}] Attempt ${attempt} failed:`, err.message);
                    if (attempt >= retries) {
                        throw err; // Permanent failure
                    }
                    await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
                }
            }
        }).catch(err => {
            console.error(`[Write-Queue Chain Failure for ${idStr}] Blocked queue task execution:`, err.message);
        });
        this.writeQueues.set(idStr, nextQueue);
    }

    getRoomSnapshot(auctionId) {
        const idStr = String(auctionId);
        const state = this.rooms.get(idStr);
        if (!state) return null;
        return {
            version: state.version,
            currentBid: state.currentBid,
            leadingTeamId: state.leadingTeamId,
            currentPlayerId: state.currentPlayerId,
            status: state.status,
            bidHistory: state.bidHistory,
            teams: Array.from(state.teams.values()),
            players: Array.from(state.players.values())
        };
    }
}

module.exports = new AuctionEngine();
