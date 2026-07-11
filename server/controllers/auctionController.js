const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const Team = require('../models/Team');
const Player = require('../models/Player');
const AuctionEngine = require('../services/AuctionEngine');

// Create auction
const createAuction = async (req, res) => {
    try {
        const auction = new Auction(req.body);
        await auction.save();
        res.status(201).json(auction);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all auctions
const getAllAuctions = async (req, res) => {
    try {
        const auctions = await Auction.find()
            .sort({ date: -1 })
            .select('name date accessCode isActive status categories roles slug')
            .lean();
        res.json(auctions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update auction
const updateAuction = async (req, res) => {
    try {
        const updated = await Auction.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: "Auction not found" });
        res.json({ success: true, auction: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Init specific auction data (O(1) memory loading after first connection)
const initAuction = async (req, res) => {
    try {
        const { auctionId } = req.params;

        let auction = null;
        // Use strict 24-char hex check — mongoose.isValid() incorrectly accepts any 12-char string as ObjectId
        const isObjectId = /^[a-fA-F0-9]{24}$/.test(auctionId);
        if (isObjectId) {
            auction = await Auction.findById(auctionId).select('name accessCode isActive status categories roles slug').lean();
        } else {
            auction = await Auction.findOne({ slug: auctionId }).select('name accessCode isActive status categories roles slug').lean();
        }

        if (!auction) return res.status(404).json({ error: "Auction not found" });

        const actualId = auction._id.toString();

        // Load room dynamically into memory engine (does db calls only once)
        const state = await AuctionEngine.initializeRoom(actualId);

        res.json({
            teams: Array.from(state.teams.values()),
            players: Array.from(state.players.values()),
            liveState: {
                currentBid: state.currentBid,
                leadingTeamId: state.leadingTeamId,
                currentPlayerId: state.currentPlayerId,
                status: state.status,
                bidHistory: state.bidHistory
            },
            config: auction
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete auction
const deleteAuction = async (req, res) => {
    try {
        const auctionId = req.params.id;
        const auction = await Auction.findById(auctionId);
        if (!auction) return res.status(404).json({ error: "Auction not found" });

        await Auction.findByIdAndDelete(auctionId);
        await Team.deleteMany({ auctionId });
        await Player.deleteMany({ auctionId });

        if (AuctionEngine.rooms.has(auctionId)) {
            AuctionEngine.rooms.delete(auctionId);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createAuction,
    getAllAuctions,
    updateAuction,
    initAuction,
    deleteAuction
};
