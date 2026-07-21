const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const Team = require('../models/Team');
const Player = require('../models/Player');

/**
 * GET /api/auctions/:id/results
 * Returns aggregated end-of-auction statistics for the results screen.
 */
const getAuctionResults = async (req, res) => {
    try {
        const { id } = req.params;

        // Resolve auction by _id or slug
        const isObjectId = /^[a-fA-F0-9]{24}$/.test(id);
        const auctionQuery = isObjectId ? { _id: id } : { slug: id };

        const auction = await Auction.findOne(auctionQuery).lean();
        if (!auction) {
            return res.status(404).json({ error: 'Auction not found' });
        }

        const auctionIdStr = auction._id.toString();

        // Fetch all teams and players for this auction
        const teams = await Team.find({ auctionId: auctionIdStr }).lean();
        const players = await Player.find({ auctionId: auctionIdStr }).lean();

        // Create quick lookup maps
        const teamMap = new Map(teams.map(t => [t._id.toString(), t]));

        const soldPlayers = players.filter(p => p.isSold);
        const unsoldPlayers = players.filter(p => p.isUnsold);
        const totalSpent = soldPlayers.reduce((acc, p) => acc + (p.soldPrice || 0), 0);
        const soldCount = soldPlayers.length;
        const unsoldCount = unsoldPlayers.length;
        const avgValue = soldCount > 0 ? Math.round(totalSpent / soldCount) : 0;

        // --- HIGHLIGHTS ---
        // 1. Highest Spender Team
        let highestSpender = null;
        if (teams.length > 0) {
            const sortedBySpent = [...teams].sort((a, b) => (b.spent || 0) - (a.spent || 0));
            const topSpender = sortedBySpent[0];
            highestSpender = {
                teamId: topSpender._id,
                name: topSpender.name,
                color: topSpender.color || '#3B82F6',
                logoText: topSpender.logoText,
                spent: topSpender.spent || 0,
                budget: topSpender.budget || 0,
                utilization: topSpender.budget ? Math.round(((topSpender.spent || 0) / topSpender.budget) * 100) : 0
            };
        }

        // 2. Most Expensive Player
        let mostExpensivePlayer = null;
        if (soldPlayers.length > 0) {
            const sortedByPrice = [...soldPlayers].sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0));
            const topPlayer = sortedByPrice[0];
            const buyerTeam = teamMap.get(topPlayer.soldTo?.toString());
            mostExpensivePlayer = {
                playerId: topPlayer._id,
                name: topPlayer.name,
                role: topPlayer.role,
                price: topPlayer.soldPrice,
                teamName: buyerTeam?.name || 'Unknown',
                teamColor: buyerTeam?.color || '#3B82F6'
            };
        }

        // 3. Largest Squad Team
        let largestSquad = null;
        if (teams.length > 0) {
            const sortedBySquad = [...teams].sort((a, b) => (b.players?.length || 0) - (a.players?.length || 0));
            const topSquadTeam = sortedBySquad[0];
            largestSquad = {
                teamId: topSquadTeam._id,
                name: topSquadTeam.name,
                color: topSquadTeam.color || '#8B5CF6',
                logoText: topSquadTeam.logoText,
                squadCount: topSquadTeam.players?.length || 0
            };
        }

        // 4. Most Active Team
        let mostActiveTeam = null;
        if (teams.length > 0) {
            const sortedByCount = [...teams].sort((a, b) => (b.players?.length || 0) - (a.players?.length || 0));
            const activeTeam = sortedByCount[0];
            mostActiveTeam = {
                name: activeTeam.name,
                color: activeTeam.color || '#10B981',
                playersBought: activeTeam.players?.length || 0
            };
        }

        // --- TOP PURCHASES (Top 10) ---
        const topPurchases = [...soldPlayers]
            .sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0))
            .slice(0, 10)
            .map((p, idx) => {
                const team = teamMap.get(p.soldTo?.toString());
                return {
                    _id: p._id,
                    rank: idx + 1,
                    name: p.name,
                    role: p.role,
                    basePrice: p.basePrice || 0,
                    soldPrice: p.soldPrice || 0,
                    teamName: team?.name || 'Unassigned',
                    teamColor: team?.color || '#3B82F6',
                    teamLogoText: team?.logoText || ''
                };
            });

        // --- TEAM PERFORMANCE ---
        const teamPerformance = teams.map(t => {
            const squadCount = t.players?.length || 0;
            const spent = t.spent || 0;
            const budget = t.budget || 0;
            const remaining = Math.max(0, budget - spent);
            const utilization = budget > 0 ? Math.round((spent / budget) * 100) : 0;
            const avgSpend = squadCount > 0 ? Math.round(spent / squadCount) : 0;

            return {
                _id: t._id,
                name: t.name,
                color: t.color || '#3B82F6',
                logoText: t.logoText || '',
                budget,
                spent,
                remaining,
                squadCount,
                utilization,
                avgSpend
            };
        });

        // --- ROLE BREAKDOWN ---
        const defaultRoles = auction.roles?.length ? auction.roles : ['Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper'];
        const roleBreakdown = {};

        defaultRoles.forEach(role => {
            const rolePlayers = soldPlayers.filter(p => p.role?.toLowerCase() === role.toLowerCase());
            const roleMoney = rolePlayers.reduce((acc, p) => acc + (p.soldPrice || 0), 0);
            const roleCount = rolePlayers.length;
            const roleAvg = roleCount > 0 ? Math.round(roleMoney / roleCount) : 0;
            const rolePct = totalSpent > 0 ? Math.round((roleMoney / totalSpent) * 100) : 0;

            roleBreakdown[role] = {
                players: roleCount,
                money: roleMoney,
                average: roleAvg,
                percentage: rolePct
            };
        });

        // --- RECORDS ---
        const records = {
            highestBid: mostExpensivePlayer?.price || 0,
            highestSpenderAmount: highestSpender?.spent || 0,
            largestSquadSize: largestSquad?.squadCount || 0,
            averagePlayerPrice: avgValue,
            unsoldPercentage: players.length > 0 ? Math.round((unsoldCount / players.length) * 100) : 0
        };

        // --- TIMELINE ---
        const timeline = [
            { id: 1, title: 'Auction Initiated', detail: `${teams.length} Franchises Registered`, time: 'Phase 1' },
            { id: 2, title: 'Bidding Commenced', detail: `${players.length} Total Players in Pool`, time: 'Phase 2' },
            { id: 3, title: 'Highest Sale Recorded', detail: mostExpensivePlayer ? `${mostExpensivePlayer.name} (₹${mostExpensivePlayer.price}L)` : 'N/A', time: 'Peak' },
            { id: 4, title: 'Auction Finalized', detail: `${soldCount} Players Finalized Across ${teams.length} Teams`, time: 'Concluded' }
        ];

        res.json({
            hero: {
                title: auction.name || 'Tournament Auction',
                status: auction.status || 'completed',
                totalPlayers: soldCount,
                totalSpent,
                totalTeams: teams.length,
                unsoldCount,
                avgValue
            },
            highlights: {
                highestSpender,
                mostExpensivePlayer,
                largestSquad,
                mostActiveTeam
            },
            summary: {
                totalSpent,
                soldCount,
                unsoldCount,
                avgValue
            },
            topPurchases,
            teamPerformance,
            roleBreakdown,
            records,
            timeline
        });
    } catch (err) {
        console.error('Error fetching auction results:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/auctions/:id/team-summary
 */
const getTeamSummary = async (req, res) => {
    try {
        const { id } = req.params;
        const isObjectId = /^[a-fA-F0-9]{24}$/.test(id);
        const auctionQuery = isObjectId ? { _id: id } : { slug: id };

        const auction = await Auction.findOne(auctionQuery).lean();
        if (!auction) return res.status(404).json({ error: 'Auction not found' });

        const teams = await Team.find({ auctionId: auction._id.toString() }).lean();
        res.json(teams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/auctions/:id/team/:teamId
 */
const getTeamDetail = async (req, res) => {
    try {
        const { id, teamId } = req.params;
        const team = await Team.findById(teamId).lean();
        if (!team) return res.status(404).json({ error: 'Team not found' });

        // Fetch players that were sold to this team
        const squadPlayers = await Player.find({
            soldTo: team._id.toString(),
            isSold: true
        }).lean();

        // Group players by role
        const groupedByRole = {};
        squadPlayers.forEach(p => {
            const role = p.role || 'Unspecified';
            if (!groupedByRole[role]) groupedByRole[role] = [];
            groupedByRole[role].push({
                _id: p._id,
                name: p.name,
                role: p.role,
                basePrice: p.basePrice || 0,
                soldPrice: p.soldPrice || 0
            });
        });

        res.json({
            team,
            squad: squadPlayers,
            groupedByRole
        });
    } catch (err) {
        console.error('getTeamDetail error:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/auctions/:id/pdf-data
 * Returns all teams with their full player squads for PDF export.
 * Kept separate to avoid bloating the main results response.
 */
const getPDFData = async (req, res) => {
    try {
        const { id } = req.params;
        const isObjectId = /^[a-fA-F0-9]{24}$/.test(id);
        const auctionQuery = isObjectId ? { _id: id } : { slug: id };

        const auction = await Auction.findOne(auctionQuery).lean();
        if (!auction) return res.status(404).json({ error: 'Auction not found' });

        const teams = await Team.find({ auctionId: auction._id.toString() }).lean();

        const teamsWithSquads = await Promise.all(
            teams.map(async (t) => {
                const players = await Player.find({
                    soldTo: t._id.toString(),
                    isSold: true
                }).select('name role basePrice soldPrice category order soldAt').lean();

                // Sort by actual sale time if available, otherwise fall back to price descending
                players.sort((a, b) => {
                    if (a.soldAt && b.soldAt) return new Date(a.soldAt) - new Date(b.soldAt);
                    return (b.soldPrice || 0) - (a.soldPrice || 0);
                });

                return {
                    _id: t._id,
                    name: t.name,
                    color: t.color || '#3B82F6',
                    logoText: t.logoText || '',
                    budget: t.budget || 0,
                    spent: t.spent || 0,
                    remaining: Math.max(0, (t.budget || 0) - (t.spent || 0)),
                    players
                };
            })
        );

        res.json({ teams: teamsWithSquads });
    } catch (err) {
        console.error('getPDFData error:', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAuctionResults,
    getTeamSummary,
    getTeamDetail,
    getPDFData
};

