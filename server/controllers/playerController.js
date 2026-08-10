const mongoose = require('mongoose');
const Player = require('../models/Player');
const Team = require('../models/Team');
const Auction = require('../models/Auction');
const AuctionEngine = require('../services/AuctionEngine');

const createPlayer = async (req, res) => {
    try {
        let { auctionId } = req.body;
        const isValid = mongoose.Types.ObjectId.isValid(auctionId);
        let auctionObj = null;
        if (!isValid) {
            auctionObj = await Auction.findOne({ slug: auctionId });
            if (!auctionObj) return res.status(404).json({ error: "Auction not found" });
            auctionId = auctionObj._id;
        } else {
            auctionObj = await Auction.findById(auctionId);
            if (!auctionObj) return res.status(404).json({ error: "Auction not found" });
        }

        const basePriceNum = Number(req.body.basePrice);
        if (req.body.basePrice === undefined || isNaN(basePriceNum) || basePriceNum < 0) {
            return res.status(400).json({ error: "Base price cannot be negative" });
        }

        // Align casing or add role/category to config
        const role = String(req.body.role || '').trim();
        const category = String(req.body.category || '').trim();

        let updatedCategories = [...(auctionObj.categories || [])];
        let updatedRoles = [...(auctionObj.roles || [])];
        let changed = false;

        const matchedRole = updatedRoles.find(r => r.toLowerCase() === role.toLowerCase());
        let finalRole = role;
        if (matchedRole) {
            finalRole = matchedRole;
        } else if (role) {
            updatedRoles.push(role);
            finalRole = role;
            changed = true;
        }

        const matchedCat = updatedCategories.find(c => c.toLowerCase() === category.toLowerCase());
        let finalCategory = category;
        if (matchedCat) {
            finalCategory = matchedCat;
        } else if (category) {
            updatedCategories.push(category);
            finalCategory = category;
            changed = true;
        }

        if (changed) {
            auctionObj.categories = updatedCategories;
            auctionObj.roles = updatedRoles;
            await auctionObj.save();
        }

        const count = await Player.countDocuments({ auctionId });
        const player = new Player({ 
            ...req.body, 
            role: finalRole,
            category: finalCategory,
            basePrice: basePriceNum, 
            auctionId, 
            order: count 
        });
        await player.save();

        // Sync into RAM engine cache
        AuctionEngine.addOrUpdatePlayer(auctionId, player);

        req.io.to(auctionId.toString()).emit('player_updated', { player });
        res.status(201).json(player);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const bulkCreatePlayers = async (req, res) => {
    try {
        let { auctionId, players } = req.body;
        if (!auctionId || !Array.isArray(players)) {
            return res.status(400).json({ error: "Invalid payload. 'auctionId' and 'players' array are required." });
        }

        const isValid = mongoose.Types.ObjectId.isValid(auctionId);
        let auctionObj = null;
        if (!isValid) {
            auctionObj = await Auction.findOne({ slug: auctionId });
            if (!auctionObj) return res.status(404).json({ error: "Auction not found" });
            auctionId = auctionObj._id;
        } else {
            auctionObj = await Auction.findById(auctionId);
            if (!auctionObj) return res.status(404).json({ error: "Auction not found" });
        }

        const currentCount = await Player.countDocuments({ auctionId });
        const existingPlayers = await Player.find({ auctionId }).select('name').lean();
        const existingNames = new Set(existingPlayers.map(p => p.name.trim().toLowerCase()));

        let updatedCategories = [...(auctionObj.categories || [])];
        let updatedRoles = [...(auctionObj.roles || [])];
        let changed = false;

        const validDocs = [];
        const errors = [];
        let orderOffset = 0;

        players.forEach((item, index) => {
            const rowNumber = index + 1;
            const name = item.name ? String(item.name).trim() : '';
            const role = item.role ? String(item.role).trim() : '';
            const category = item.category ? String(item.category).trim() : '';
            const basePrice = Number(item.basePrice);

            if (!name) {
                errors.push({ row: rowNumber, error: "Missing player name" });
                return;
            }
            if (!role) {
                errors.push({ row: rowNumber, error: "Missing role" });
                return;
            }
            if (!category) {
                errors.push({ row: rowNumber, error: "Missing category" });
                return;
            }
            if (isNaN(basePrice) || basePrice < 0) {
                errors.push({ row: rowNumber, error: "Invalid or missing base price" });
                return;
            }

            if (existingNames.has(name.toLowerCase())) {
                errors.push({ row: rowNumber, error: `Duplicate player name: "${name}"` });
                return;
            }

            existingNames.add(name.toLowerCase());

            // Case-insensitive matching & dynamic config sync
            const matchedRole = updatedRoles.find(r => r.toLowerCase() === role.toLowerCase());
            let finalRole = role;
            if (matchedRole) {
                finalRole = matchedRole;
            } else {
                updatedRoles.push(role);
                finalRole = role;
                changed = true;
            }

            const matchedCat = updatedCategories.find(c => c.toLowerCase() === category.toLowerCase());
            let finalCategory = category;
            if (matchedCat) {
                finalCategory = matchedCat;
            } else {
                updatedCategories.push(category);
                finalCategory = category;
                changed = true;
            }

            validDocs.push({
                auctionId,
                name,
                role: finalRole,
                category: finalCategory,
                basePrice,
                order: currentCount + orderOffset++,
                isSold: false,
                isUnsold: false,
                soldTo: null,
                soldPrice: 0,
                bidHistory: []
            });
        });

        if (changed) {
            auctionObj.categories = updatedCategories;
            auctionObj.roles = updatedRoles;
            await auctionObj.save();
        }

        let createdPlayers = [];
        if (validDocs.length > 0) {
            createdPlayers = await Player.insertMany(validDocs);
            createdPlayers.forEach(p => AuctionEngine.addOrUpdatePlayer(auctionId, p));
            req.io.to(auctionId.toString()).emit('data_update', { auctionId: auctionId.toString() });
        }

        res.json({
            success: true,
            importedCount: createdPlayers.length,
            failedCount: errors.length,
            errors,
            players: createdPlayers,
            roles: auctionObj.roles,
            categories: auctionObj.categories
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updatePlayer = async (req, res) => {
    try {
        if (req.body.basePrice !== undefined) {
            const basePriceNum = Number(req.body.basePrice);
            if (isNaN(basePriceNum) || basePriceNum < 0) {
                return res.status(400).json({ error: "Base price cannot be negative" });
            }
            req.body.basePrice = basePriceNum;
        }

        const playerToUpdate = await Player.findById(req.params.id);
        if (!playerToUpdate) return res.status(404).json({ error: "Player not found" });

        const auctionObj = await Auction.findById(playerToUpdate.auctionId);
        if (auctionObj) {
            let changed = false;
            let updatedCategories = [...(auctionObj.categories || [])];
            let updatedRoles = [...(auctionObj.roles || [])];

            if (req.body.role !== undefined) {
                const role = String(req.body.role || '').trim();
                const matchedRole = updatedRoles.find(r => r.toLowerCase() === role.toLowerCase());
                if (matchedRole) {
                    req.body.role = matchedRole;
                } else if (role) {
                    updatedRoles.push(role);
                    req.body.role = role;
                    changed = true;
                }
            }

            if (req.body.category !== undefined) {
                const category = String(req.body.category || '').trim();
                const matchedCat = updatedCategories.find(c => c.toLowerCase() === category.toLowerCase());
                if (matchedCat) {
                    req.body.category = matchedCat;
                } else if (category) {
                    updatedCategories.push(category);
                    req.body.category = category;
                    changed = true;
                }
            }

            if (changed) {
                auctionObj.categories = updatedCategories;
                auctionObj.roles = updatedRoles;
                await auctionObj.save();
            }
        }

        const player = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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
    bulkCreatePlayers,
    updatePlayer,
    deletePlayer
};
