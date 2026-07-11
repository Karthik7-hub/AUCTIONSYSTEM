const mongoose = require('mongoose');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Auction = require('../models/Auction');
const AuctionEngine = require('../services/AuctionEngine');

const createTeam = async (req, res) => {
    try {
        let { auctionId } = req.body;
        const isValid = mongoose.Types.ObjectId.isValid(auctionId);
        if (!isValid) {
            const auction = await Auction.findOne({ slug: auctionId }).select('_id').lean();
            if (!auction) return res.status(404).json({ error: "Auction not found" });
            auctionId = auction._id;
        }

        const team = new Team({ ...req.body, auctionId });
        await team.save();

        // Sync into RAM engine cache
        AuctionEngine.addOrUpdateTeam(auctionId, team);

        req.io.to(auctionId.toString()).emit('team_updated', { team });
        res.status(201).json(team);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateTeam = async (req, res) => {
    try {
        const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!team) return res.status(404).json({ error: "Team not found" });

        // Sync into RAM engine cache
        AuctionEngine.addOrUpdateTeam(team.auctionId, team);

        req.io.to(team.auctionId.toString()).emit('team_updated', { team });
        res.json(team);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) return res.status(404).json({ error: "Team not found" });

        const auctionId = team.auctionId.toString();
        // Fetch IDs of players owned by this team to reset their status on the client
        const resetPlayers = await Player.find({ soldTo: req.params.id }).select('_id').lean();
        const resetPlayerIds = resetPlayers.map(p => p._id.toString());

        await Team.findByIdAndDelete(req.params.id);
        // Reset players owned by this team in DB
        await Player.updateMany({ soldTo: req.params.id }, { isSold: false, soldTo: null, soldPrice: 0 });

        // Sync deletion and player resets into RAM engine cache
        AuctionEngine.deleteTeam(auctionId, req.params.id, resetPlayerIds);

        req.io.to(auctionId).emit('team_deleted', { teamId: req.params.id, resetPlayerIds });
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createTeam,
    updateTeam,
    deleteTeam
};
