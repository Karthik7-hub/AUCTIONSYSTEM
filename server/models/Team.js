const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
    auctionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
    name: { type: String, required: true },
    budget: { type: Number, required: true, min: [0, 'Budget cannot be negative'] },
    spent: { type: Number, default: 0 },
    color: String,
    logoText: { type: String, default: '' },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }]
});

TeamSchema.index({ auctionId: 1 });

module.exports = mongoose.model('Team', TeamSchema);