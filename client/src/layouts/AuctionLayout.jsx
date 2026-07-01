import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import Login from '@pages/Login/Login';
import SetupDashboard from '@pages/Admin/SetupDashboard';
import AuctioneerControls from '@pages/Admin/AuctioneerControls';
import ViewerScreen from '@pages/Viewer/ViewerScreen';
import { API_URL } from '@config/api';
import { getAuctionInit } from '@services/auction.service';

export default function AuctionLayout() {
    const { auctionId } = useParams();
    const location = useLocation();
    const [socket, setSocket] = useState(null);
    const [view, setView] = useState('viewer');
    const [data, setData] = useState({ teams: [], players: [] });
    const [liveState, setLiveState] = useState({ currentBid: 0, leadingTeamId: null, currentPlayerId: null, status: 'IDLE' });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [config, setConfig] = useState({ categories: [], roles: [] });
    const [actualId, setActualId] = useState(null);

    useEffect(() => {
        const newSocket = io(API_URL, { transports: ['websocket'] });
        setSocket(newSocket);

        const loadData = async () => {
            try {
                const res = await getAuctionInit(auctionId);
                setData({ teams: res.data.teams, players: res.data.players });
                if (res.data.liveState) setLiveState(res.data.liveState);
                if (res.data.config) {
                    setConfig(res.data.config);
                    setActualId(res.data.config._id);
                    newSocket.emit('join_auction', res.data.config._id);
                    
                    // Auth Check against normalized ID
                    const idAuth = localStorage.getItem(`admin_auth_${res.data.config._id}`);
                    if (idAuth === 'true') {
                        setIsAuthenticated(true);
                    }
                }
            } catch (err) { console.error(err); }
        };
        loadData();

        newSocket.on('data_update', loadData);
        newSocket.on('auction_state', (state) => setLiveState(state));

        // --- AUTH CHECK ---
        const urlAuth = localStorage.getItem(`admin_auth_${auctionId}`);
        if (urlAuth === 'true') {
            setIsAuthenticated(true);
            if (location.state?.autoLogin) {
                setView('admin-setup');
            }
        }

        return () => newSocket.disconnect();
    }, [auctionId, location.state]);

    if (!socket) return (
        <div className="connecting-wrapper">
            <div className="spinner"></div>
            <div>Connecting to Auction Arena...</div>
        </div>
    );

    const targetAuctionId = actualId || auctionId;

    if (view === 'login') {
        return <Login auctionId={targetAuctionId} setView={setView} setIsAuthenticated={setIsAuthenticated} />;
    }

    if (view === 'admin-setup') {
        if (!isAuthenticated) return setView('login');
        return <SetupDashboard data={data} setView={setView} auctionId={targetAuctionId} onRefresh={() => socket.emit('data_update')} config={config} />;
    }

    if (view === 'admin-live') {
        if (!isAuthenticated) return setView('login');
        return <AuctioneerControls data={data} socket={socket} liveState={liveState} setView={setView} auctionId={targetAuctionId} config={config} />;
    }

    return <ViewerScreen data={data} liveState={liveState} setView={setView} auctionId={targetAuctionId} config={config} />;
}
