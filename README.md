# Auction System 🚀

This repository is set up as a monorepo containing both the client (frontend) and server (backend) codebases.

## 🛠️ Local Development

To run the entire system locally:

1. Install dependencies in the root:
   ```bash
   npm install
   ```
2. Install dependencies in the client and server subdirectories:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```
3. Create a `.env` file in the `server` directory (see [server/.env.example](file:///c:/Users/vkart/Music/WORK/Projects_fullstack/AUCTION_SYSTEM/server/.env.example) for required variables).
4. Run both frontend and backend in parallel from the root:
   ```bash
   npm start
   ```

---

## 🌐 Production Deployment (Separate Hosting)

If you plan to host the frontend (client) and backend (server) separately, please refer to the detailed [DEPLOYMENT.md](file:///c:/Users/vkart/Music/WORK/Projects_fullstack/AUCTION_SYSTEM/DEPLOYMENT.md) guide.

