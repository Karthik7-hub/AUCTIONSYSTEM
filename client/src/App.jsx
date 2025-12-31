import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Login from './components/Login';
import SetupDashboard from './components/Admin/SetupDashboard';
import AuctioneerControls from './components/Admin/AuctioneerControls';
import ViewerScreen from './components/Viewer/ViewerScreen';

const SOCKET_URL = 'https://spl-auctionsystem-backend.onrender.com';
const socket = io(SOCKET_URL, {
    transports: ['websocket'], // Force websocket for better performance
    reconnection: true,
});

function App() {
    const [view, setView] = useState('login');
    const [data, setData] = useState({ teams: [], players: [] });
    const [liveState, setLiveState] = useState({
        currentBid: 0,
        leadingTeamId: null,
        currentPlayerId: null,
        status: 'IDLE'
    });

    // Fetch fresh data from backend
    const fetchData = async () => {
        try {
            const res = await axios.get(`${SOCKET_URL}/api/init`);
            // Ensure we always have arrays
            setData({
                teams: res.data.teams || [],
                players: res.data.players || []
            });
        } catch (err) {
            console.error("Failed to fetch data", err);
        }
    };

    useEffect(() => {
        // 1. Initial Load
        fetchData();

        // 2. Socket Listeners
        const handleDataUpdate = () => {
            console.log("Data update received, refetching...");
            fetchData();
        };

        const handleAuctionState = (state) => {
            setLiveState(state);
        };

        socket.on('data_update', handleDataUpdate);
        socket.on('auction_state', handleAuctionState);

        // 3. Cleanup to prevent duplicate listeners (The Glitch Fix)
        return () => {
            socket.off('data_update', handleDataUpdate);
            socket.off('auction_state', handleAuctionState);
        };
    }, []);

    if (view === 'login')
        return <Login setView={setView} />;

    if (view === 'admin-setup')
        return <SetupDashboard data={data} setView={setView} />;

    if (view === 'admin-live')
        return <AuctioneerControls data={data} socket={socket} liveState={liveState} setView={setView} />;

    if (view === 'viewer')
        return <ViewerScreen data={data} liveState={liveState} />;

    return <div className="p-10 text-center">Loading Application...</div>;
}

export default App;