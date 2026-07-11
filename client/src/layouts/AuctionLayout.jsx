import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import Login from '@pages/Login/Login';
import SetupDashboard from '@pages/Admin/SetupDashboard';
import AuctioneerControls from '@pages/Admin/AuctioneerControls';
import ViewerScreen from '@pages/Viewer/ViewerScreen';
import { API_URL } from '@config/api';
import { getAuctionInit } from '@services/auction.service';
import { verifyStoredToken, getAccessToken, clearTokens } from '@services/auth.service';

// Auth guard: redirects to login sub-route if not authenticated
function ProtectedRoute({ isAuthenticated, auctionId, children }) {
    if (!isAuthenticated) {
        return <Navigate to={`/auction/${auctionId}/login`} replace />;
    }
    return children;
}

export default function AuctionLayout() {
    const { auctionId } = useParams();
    const navigate = useNavigate();

    const [socket, setSocket] = useState(null);
    const [teamsById, setTeamsById] = useState({});
    const [playersById, setPlayersById] = useState({});
    const [orderedPlayerIds, setOrderedPlayerIds] = useState([]);
    const [liveState, setLiveState] = useState({ currentBid: 0, leadingTeamId: null, currentPlayerId: null, status: 'IDLE' });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [config, setConfig] = useState({ categories: [], roles: [] });
    const [actualId, setActualId] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Memoize the array conversions so children get stable array references and only re-render when needed
    const teams = useMemo(() => Object.values(teamsById), [teamsById]);
    const players = useMemo(() => 
        orderedPlayerIds.map(id => playersById[id]).filter(Boolean), 
        [orderedPlayerIds, playersById]
    );

    const data = useMemo(() => ({ teams, players }), [teams, players]);

    useEffect(() => {
        const newSocket = io(API_URL, { transports: ['websocket'] });
        setSocket(newSocket);

        const loadData = async () => {
            try {
                const res = await getAuctionInit(auctionId);
                const initTeams = res.data.teams || [];
                const initPlayers = res.data.players || [];
                
                // Normalize Teams
                const tMap = {};
                initTeams.forEach(t => { tMap[t._id] = t; });
                setTeamsById(tMap);

                // Normalize Players
                const pMap = {};
                initPlayers.forEach(p => { pMap[p._id] = p; });
                setPlayersById(pMap);
                setOrderedPlayerIds(initPlayers.map(p => p._id));

                if (res.data.liveState) setLiveState(res.data.liveState);
                if (res.data.config) {
                    setConfig(res.data.config);
                    const resolvedId = res.data.config._id;
                    setActualId(resolvedId);
                    newSocket.emit('join_auction', resolvedId);

                    // Set global context for http interceptor
                    window.__auctionId = resolvedId;

                    // If the user navigated by slug, tokens are stored under the slug key.
                    // Migrate them to the ObjectId key so verifyStoredToken can find them.
                    if (auctionId !== resolvedId) {
                        const slugAccessToken = localStorage.getItem(`access_token_${auctionId}`);
                        const slugRefreshToken = localStorage.getItem(`refresh_token_${auctionId}`);
                        if (slugAccessToken) {
                            localStorage.setItem(`access_token_${resolvedId}`, slugAccessToken);
                            localStorage.setItem(`refresh_token_${resolvedId}`, slugRefreshToken);
                        }
                    }

                    // Verify JWT token with server
                    try {
                        await verifyStoredToken(resolvedId);
                        setIsAuthenticated(true);
                    } catch {
                        clearTokens(resolvedId);
                        setIsAuthenticated(false);
                    }
                }
                setNotFound(false);
            } catch (err) {
                console.error('Auction not found:', err);
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();

        // --- GRANULAR EVENT LISTENERS FOR O(1) INCREMENTAL SYNC ---
        newSocket.on('team_updated', ({ team }) => {
            setTeamsById(prev => ({ ...prev, [team._id]: team }));
        });

        newSocket.on('team_deleted', ({ teamId, resetPlayerIds }) => {
            setTeamsById(prev => {
                const copy = { ...prev };
                delete copy[teamId];
                return copy;
            });
            if (resetPlayerIds?.length) {
                setPlayersById(prev => {
                    const copy = { ...prev };
                    resetPlayerIds.forEach(id => {
                        if (copy[id]) {
                            copy[id] = { ...copy[id], isSold: false, soldTo: null, soldPrice: 0 };
                        }
                    });
                    return copy;
                });
            }
        });

        newSocket.on('player_updated', ({ player }) => {
            setPlayersById(prev => ({ ...prev, [player._id]: player }));
            setOrderedPlayerIds(prev => {
                if (prev.includes(player._id)) return prev;
                return [...prev, player._id];
            });
        });

        newSocket.on('player_deleted', ({ playerId, updatedTeam }) => {
            setPlayersById(prev => {
                const copy = { ...prev };
                delete copy[playerId];
                return copy;
            });
            setOrderedPlayerIds(prev => prev.filter(id => id !== playerId));
            if (updatedTeam) {
                setTeamsById(prev => ({ ...prev, [updatedTeam._id]: updatedTeam }));
            }
        });

        newSocket.on('player_sold', ({ player, team }) => {
            setPlayersById(prev => ({ ...prev, [player._id]: player }));
            setTeamsById(prev => ({ ...prev, [team._id]: team }));
        });

        newSocket.on('data_refreshed', ({ teams, players }) => {
            console.log('🔄 Data refreshed via socket stream:', teams, players);
            const tMap = {};
            (teams || []).forEach(t => { tMap[t._id] = t; });
            setTeamsById(tMap);

            const pMap = {};
            (players || []).forEach(p => { pMap[p._id] = p; });
            setPlayersById(pMap);
            setOrderedPlayerIds((players || []).map(p => p._id));
        });

        newSocket.on('auction_state', (state) => setLiveState(state));

        return () => newSocket.disconnect();
    }, [auctionId]);

    // --- SOCKET ROOM RECONNECT GUARD ---
    // Automatically re-join the socket room if the connection drops and reconnects
    useEffect(() => {
        if (!socket || !actualId) return;

        const handleConnect = () => {
            console.log('🔌 Socket connected/reconnected, joining room:', actualId);
            socket.emit('join_auction', actualId);
        };

        if (socket.connected) {
            handleConnect();
        }

        socket.on('connect', handleConnect);
        return () => {
            socket.off('connect', handleConnect);
        };
    }, [socket, actualId]);

    // Still connecting / loading
    if (!socket || isLoading) return (
        <div className="connecting-wrapper">
            <div className="spinner"></div>
            <div>Connecting to Auction Arena...</div>
        </div>
    );

    // Invalid auction ID — redirect to landing and clear URL
    if (notFound) {
        return <Navigate to="/" replace />;
    }

    const targetId = actualId || auctionId;
    const sharedProps = { data, liveState, auctionId: targetId, config };

    return (
        <Routes>
            <Route path="/" element={<ViewerScreen {...sharedProps} isAuthenticated={isAuthenticated} />} />

            <Route path="login" element={<Login auctionId={targetId} setIsAuthenticated={setIsAuthenticated} config={config} />} />

            <Route
                path="setup"
                element={
                    <ProtectedRoute isAuthenticated={isAuthenticated} auctionId={targetId}>
                        <SetupDashboard {...sharedProps} onRefresh={() => socket.emit('data_update', { auctionId: targetId })} />
                    </ProtectedRoute>
                }
            />

            <Route
                path="live"
                element={
                    <ProtectedRoute isAuthenticated={isAuthenticated} auctionId={targetId}>
                        <AuctioneerControls {...sharedProps} socket={socket} />
                    </ProtectedRoute>
                }
            />

            <Route path="*" element={<Navigate to={`/auction/${auctionId}`} replace />} />
        </Routes>
    );
}
