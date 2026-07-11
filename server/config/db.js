const mongoose = require('mongoose');

const connectDB = () => {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/auction_system';
    mongoose.connect(mongoURI)
        .then(() => console.log("✅ DB Connected"))
        .catch(err => console.error("❌ DB Error:", err));
};

module.exports = connectDB;

