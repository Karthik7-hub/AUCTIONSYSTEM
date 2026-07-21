# Auction System 🏏

A real-time player auction platform built for cricket leagues. Supports live bidding, team management, viewer screens, and PDF export of results — all in a single monorepo.

---

## ✨ Features

- **Live Auction** — Real-time bidding with Socket.IO, bid timers, and instant state sync across all connected clients
- **Auctioneer Controls** — Start/pause/hammer players, manage bids, override prices
- **Viewer Screen** — Read-only live view for audience — shows current player, teams, sold/unsold feed
- **Team Management** — Budget tracking, squad overview, player breakdown by role and set
- **Results Panel** — Full tournament results with team performance stats and PDF export
- **Admin Setup** — Configure auction, add teams and players, set budgets and categories

---

## 🗂️ Project Structure

```
AUCTION_SYSTEM/
├── client/          # React + Vite frontend
├── server/          # Node.js + Express + Socket.IO backend
├── start.js         # Runs both client & server together
└── DEPLOYMENT.md    # Production hosting guide
```

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React, Vite, Vanilla CSS |
| Backend | Node.js, Express, Socket.IO |
| Database | MongoDB (Mongoose) |
| Auth | JWT (access + refresh tokens) |
| Real-time | Socket.IO |

---

## 🚀 Local Development

### 1. Install dependencies

```bash
# From root
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### 2. Configure environment

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/auction
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
SUPER_ADMIN_PASSWORD=your_admin_password
CLIENT_URL=http://localhost:5173
```

### 3. Run the app

**Option A — Both together (one terminal):**
```bash
npm start
```

**Option B — Separately (two terminals):**
```bash
# Terminal 1 — Backend (with auto-restart via nodemon)
npm run server

# Terminal 2 — Frontend (Vite dev server)
npm run client
```

The client runs on `http://localhost:5173` and connects to the server at `http://localhost:5000`.

---

## 🌐 Production Deployment

For deploying the client and server to separate hosts (Vercel, Render, Railway, etc.), see the detailed **[DEPLOYMENT.md](./DEPLOYMENT.md)** guide.

---

## 📄 License

ISC
