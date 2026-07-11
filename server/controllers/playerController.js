const mongoose = require('mongoose');
const Player = require('../models/Player');
const Team = require('../models/Team');
const Auction = require('../models/Auction');
const AuctionEngine = require('../services/AuctionEngine');

const createPlayer = async (req, res) => {
    try {
        let { auctionId } = req.body;
        const isValid = mongoose.Types.ObjectId.isValid(auctionId);
        if (!isValid) {
            const auction = await Auction.findOne({ slug: auctionId }).select('_id').lean();
            if (!auction) return res.status(404).json({ error: "Auction not found" });
            auctionId = auction._id;
        }

        const count = await Player.countDocuments({ auctionId });
        const player = new Player({ ...req.body, auctionId, order: count });
        await player.save();

        // Sync into RAM engine cache
        AuctionEngine.addOrUpdatePlayer(auctionId, player);

        req.io.to(auctionId.toString()).emit('player_updated', { player });
        res.status(201).json(player);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updatePlayer = async (req, res) => {
    try {
        const player = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!player) return res.status(404).json({ error: "Player not found" });

        // Sync into RAM engine cache
        AuctionEngine.addOrUpdatePlayer(player.auctionId, player);

        req.io.to(player.auctionId.toString()).emit('player_updated', { player });
        res.json(player);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deletePlayer = async (req, res) => {
    try {
        const player = await Player.findById(req.params.id);
        if (!player) return res.status(404).json({ error: "Player not found" });

        const auctionId = player.auctionId.toString();
        let updatedTeam = null;

        if (player.isSold && player.soldTo) {
            // Refund team spent budget in database
            updatedTeam = await Team.findByIdAndUpdate(
                player.soldTo,
                { 
                    $pull: { players: player._id }, 
                    $inc: { spent: -player.soldPrice } 
                },
                { new: true }
            );
        }
        
        // Reset state if player currently active in bidding
        if (AuctionEngine.rooms.has(auctionId)) {
            const state = AuctionEngine.rooms.get(auctionId);
            if (state && String(state.currentPlayerId) === String(req.params.id)) {
                Object.assign(state, { currentBid: 0, leadingTeamId: null, currentPlayerId: null, status: 'IDLE', bidHistory: [] });
                req.io.to(auctionId).emit('auction_state', {
                    currentBid: state.currentBid,
                    leadingTeamId: state.leadingTeamId,
                    currentPlayerId: state.currentPlayerId,
                    status: state.status
                });
            }
        }

        await Player.findByIdAndDelete(req.params.id);

        // Sync deletion and team budget refund into RAM engine cache
        AuctionEngine.deletePlayer(auctionId, req.params.id, updatedTeam);

        req.io.to(auctionId).emit('player_deleted', { playerId: req.params.id, updatedTeam });
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createPlayer,
    updatePlayer,
    deletePlayer
};
