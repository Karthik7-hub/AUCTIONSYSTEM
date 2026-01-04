import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import Login from './Login';
import SetupDashboard from './Admin/SetupDashboard';
import AuctioneerControls from './Admin/AuctioneerControls';
import ViewerScreen from './Viewer/ViewerScreen';

const API_URL = 'https://spl-auctionsystem-backend.onrender.com';

export default function AuctionLayout() {
    const { auctionId } = useParams();
    const [socket, setSocket] = useState(null);
    const [view, setView] = useState('viewer');
    const [data, setData] = useState({ teams: [], players: [] });
    const [liveState, setLiveState] = useState({ currentBid: 0, leadingTeamId: null, currentPlayerId: null, status: 'IDLE' });
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // NEW STATE: Holds dynamic categories and roles
    const [config, setConfig] = useState({ categories: [], roles: [] });

    useEffect(() => {
        const newSocket = io(API_URL, { transports: ['websocket'] });
        setSocket(newSocket);
        newSocket.emit('join_auction', auctionId);

        const loadData = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/init/${auctionId}`);
                setData({ teams: res.data.teams, players: res.data.players });
                if (res.data.liveState) setLiveState(res.data.liveState);

                // SAVE CONFIG FROM BACKEND
                if (res.data.config) setConfig(res.data.config);

            } catch (err) { console.error(err); }
        };
        loadData();

        newSocket.on('data_update', loadData);
        newSocket.on('auction_state', (state) => setLiveState(state));

        const storedAuth = localStorage.getItem(`admin_auth_${auctionId}`);
        if (storedAuth === 'true') setIsAuthenticated(true);

        return () => newSocket.disconnect();
    }, [auctionId]);

    if (!socket) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Connecting...</div>;

    if (view === 'login') return <Login auctionId={auctionId} setView={setView} apiUrl={API_URL} />;

    if (view === 'admin-setup') {
        if (!isAuthenticated) return setView('login');
        // PASS CONFIG
        return <SetupDashboard data={data} setView={setView} auctionId={auctionId} onRefresh={() => socket.emit('data_update')} config={config} />;
    }

    if (view === 'admin-live') {
        if (!isAuthenticated) return setView('login');
        // PASS CONFIG
        return <AuctioneerControls data={data} socket={socket} liveState={liveState} setView={setView} auctionId={auctionId} config={config} />;
    }

    // PASS CONFIG
    return <ViewerScreen data={data} liveState={liveState} setView={setView} config={config} />;
}