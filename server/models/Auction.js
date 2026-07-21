const mongoose = require('mongoose');

const AuctionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Date, default: Date.now },
    accessCode: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ['draft', 'live', 'completed'], default: 'draft' },

    // NEW FIELDS (With defaults for safety)
    isStrictRandom: {
        type: Boolean,
        default: false
    },
    categories: {
        type: [String],
        default: ['Marquee', 'Set 1', 'Set 2', 'Set 3', 'Set 4']
    },
    roles: {
        type: [String],
        default: ['Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper']
    },
    slug: {
        type: String,
        unique: true
    },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date, default: null }
});

// Function to convert name to URL-friendly slug
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')             // Replace spaces with -
        .replace(/[^\w\-]+/g, '')           // Remove all non-word chars
        .replace(/\-\-+/g, '-');            // Replace multiple - with single -
};

AuctionSchema.pre('save', async function(next) {
    if (!this.isModified('name') && this.slug) {
        return next();
    }

    let baseSlug = slugify(this.name || 'tournament');
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (true) {
        const existing = await this.constructor.findOne({ slug: uniqueSlug, _id: { $ne: this._id } });
        if (!existing) {
            break;
        }
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
    }

    this.slug = uniqueSlug;
    next();
});

AuctionSchema.index({ date: -1 });

module.exports = mongoose.model('Auction', AuctionSchema);