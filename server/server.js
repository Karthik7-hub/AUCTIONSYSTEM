require('dotenv').config(); // Nodemon watch trigger
const express = require('express');
const cors = require('cors');
const http = require('http');
const compression = require('compression'); // Speed: Gzip
const helmet = require('helmet'); // Security: Headers
const morgan = require('morgan'); // Debugging: Logger
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const registerAuctionSockets = require('./sockets/auctionSocket');

// Import Modular Routes
const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const teamRoutes = require('./routes/teamRoutes');
const playerRoutes = require('./routes/playerRoutes');

const app = express();
const server = http.createServer(app);

// --- MIDDLEWARE ---
app.use(helmet()); // Secure HTTP headers
app.use(compression()); // Compress all responses
app.use(morgan('tiny')); // Log requests to console

// Dynamic CORS configuration based on CLIENT_URL env variable (supports comma-separated list of origins)
const rawOrigins = process.env.CLIENT_URL || '*';
const allowedOrigins = rawOrigins === '*' 
    ? '*' 
    : rawOrigins.split(',').map(origin => origin.trim().replace(/\/$/, ''));

const checkOrigin = (origin, callback) => {
    if (!origin || allowedOrigins === '*' || allowedOrigins.includes(origin) || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
        callback(null, true);
    } else {
        console.warn(`⚠️ CORS blocked request from unauthorized origin: ${origin}`);
        callback(new Error(`CORS Policy Violation: Access from origin ${origin} is blocked.`));
    }
};

app.use(cors({
    origin: allowedOrigins === '*' ? '*' : checkOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// Initialize Socket.io early
const io = new Server(server, { 
    cors: { 
        origin: allowedOrigins === '*' ? '*' : checkOrigin,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        credentials: true
    }, 
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000
});

// Middleware to attach Socket.io instance to request object
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Root & Wake endpoints
app.get("/", (req, res) => res.status(200).send("Server is alive 🚀"));
app.get("/api/wake", (req, res) => res.status(200).send("OK"));

// --- DATABASE CONNECTION ---
connectDB();

// --- API ROUTES ---
app.use(authRoutes);
app.use(auctionRoutes);
app.use(teamRoutes);
app.use(playerRoutes);

// --- SOCKET.IO LOGIC ---
registerAuctionSockets(io);

// Catch-all route handler for undefined API endpoints
app.use((req, res) => res.status(404).json({ error: `Not Found: ${req.originalUrl}` }));

// Global error handler middleware
app.use((err, req, res, next) => {
    console.error("🔥 Server Error:", err.message);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));