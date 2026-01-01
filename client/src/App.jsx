import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Login from './components/Login';
import SetupDashboard from './components/Admin/SetupDashboard';
import AuctioneerControls from './components/Admin/AuctioneerControls';
import ViewerScreen from './components/Viewer/ViewerScreen';

const SOCKET_URL = 'https://spl-auctionsystem-backend.onrender.com';
const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: true,
});

function App() {
    // 1. CHANGE DEFAULT VIEW TO 'viewer'
    const [view, setView] = useState('viewer');
    const [data, setData] = useState({ teams: [], players: [] });
    const [liveState, setLiveState] = useState({
        currentBid: 0,
        leadingTeamId: null,
        currentPlayerId: null,
        status: 'IDLE'
    });

    const fetchData = async () => {
        try {
            const res = await axios.get(`${SOCKET_URL}/api/init`);
            setData({
                teams: res.data.teams || [],
                players: res.data.players || []
            });
        } catch (err) {
            console.error("Failed to fetch data", err);
        }
    };

    useEffect(() => {
        fetchData();
        const handleDataUpdate = () => {
            console.log("Data update received, refetching...");
            fetchData();
        };
        const handleAuctionState = (state) => {
            setLiveState(state);
        };

        socket.on('data_update', handleDataUpdate);
        socket.on('auction_state', handleAuctionState);

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

    // 2. PASS setView PROP TO VIEWER SCREEN
    if (view === 'viewer')
        return <ViewerScreen data={data} liveState={liveState} setView={setView} />;

    return <div className="p-10 text-center">Loading Application...</div>;
}

export default App;