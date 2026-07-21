import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Play, PlayCircle, Pause, AlertCircle, RefreshCcw,
    X, Menu, ArrowLeft, Users, CheckCircle,
    Shuffle, User, Wallet, Clock, Trophy
} from 'lucide-react';
import Button from '@shared/components/Button';
import Modal from '@shared/components/Modal';
import Badge from '@shared/components/Badge';
import ConfirmDialog from '@shared/components/ConfirmDialog';
import AlertDialog from '@shared/components/AlertDialog';
import { getAccessToken } from '@services/auth.service';

import CurrentPlayer from './CurrentPlayer';
import BidConsole from './BidConsole';
import ControlsSidebar from './ControlsSidebar';
import './AuctioneerControls.css';

export default function AuctioneerControls({ data, socket, liveState, auctionId, config }) {
    const navigate = useNavigate();
    const getToken = () => getAccessToken(auctionId);
    const categories = config?.categories?.length ? config.categories : ['Marquee', 'Set 1', 'Set 2', 'Set 3', 'Set 4'];

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarTab, setSidebarTab] = useState('queue'); // 'queue', 'unsold', 'sold', 'teams'
    const [isPending, setIsPending] = useState(false);

    // Custom Modal Dialog State
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', type: 'info', confirmText: 'Confirm', onConfirm: () => { } });
    const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    const showConfirm = (title, message, type, confirmText, onConfirm) => {
        setConfirmDialog({ isOpen: true, title, message, type, confirmText, onConfirm });
    };

    const showAlert = (title, message, type = 'info') => {
        setAlertDialog({ isOpen: true, title, message, type });
    };

    const currentPlayer = liveState?.currentPlayerId ? data.players.find(p => p._id === liveState.currentPlayerId) : null;
    const soldPlayers = data.players.filter(p => p.isSold);
    const unsoldPlayers = data.players.filter(p => p.isUnsold);
    const queuePlayers = data.players.filter(p => !p.isSold && !p.isUnsold && p._id !== liveState.currentPlayerId);

    // Group players for structured sidebar display
    const groupedQueue = useMemo(() => {
        const groups = {};
        queuePlayers.forEach(p => {
            const cat = p.category || 'Uncategorized';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(p);
        });
        return groups;
    }, [queuePlayers]);

    // Only dynamic categories present in the queue, ordered by the super admin's config categories
    const allCategories = useMemo(() => {
        const presentCats = Object.keys(groupedQueue);
        
        const ordered = [];
        categories.forEach(configCat => {
            const matched = presentCats.find(pc => pc.toLowerCase() === configCat.toLowerCase());
            if (matched) {
                ordered.push(matched);
            }
        });
        
        presentCats.forEach(pc => {
            if (!ordered.includes(pc)) {
                ordered.push(pc);
            }
        });
        
        return ordered;
    }, [categories, groupedQueue]);

    const categoryOrder = allCategories;

    // Determine set statuses and active pool
    const setStatusList = useMemo(() => {
        const remainingByCat = {};
        allCategories.forEach(cat => {
            remainingByCat[cat] = queuePlayers.filter(
                p => (p.category || 'Uncategorized').toLowerCase() === cat.toLowerCase()
            );
        });

        let activeSetFound = null;
        const result = {};

        allCategories.forEach(cat => {
            const count = remainingByCat[cat]?.length || 0;
            if (count > 0 && !activeSetFound) {
                activeSetFound = cat;
                result[cat] = 'active';
            } else if (count > 0) {
                result[cat] = 'locked';
            } else {
                result[cat] = 'completed';
            }
        });

        return {
            remainingByCat,
            activeSet: activeSetFound,
            statuses: result,
            allCompleted: !activeSetFound && queuePlayers.length === 0
        };
    }, [allCategories, queuePlayers]);

    const startPlayer = (player) => {
        setIsSidebarOpen(false);
        socket.emit('start_player', { auctionId, playerId: player._id, token: getToken() });
    };

    const drawNextRandomPlayer = () => {
        const activeSet = setStatusList.activeSet;
        if (!activeSet) {
            showAlert("Completed", "All normal sets are complete! Please pick players manually from the Unsold list.", "info");
            return;
        }
        const pool = setStatusList.remainingByCat[activeSet] || [];
        if (pool.length > 0) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            startPlayer(pool[randomIndex]);
        } else {
            showAlert("No Players", "No players left in the active set!", "warning");
        }
    };

    const sellPlayer = () => {
        const biddingTeam = data.teams.find(t => t._id === liveState.leadingTeamId);
        showConfirm(
            "Sell Player",
            `Are you sure you want to sell ${currentPlayer?.name} to ${biddingTeam?.name || 'highest bidder'} for ₹${liveState.currentBid}L?`,
            "success",
            "Confirm Sale",
            () => socket.emit('sell_player', { auctionId, token: getToken() })
        );
    };

    const unsellPlayer = () => {
        showConfirm(
            "Mark Unsold",
            `Are you sure you want to mark ${currentPlayer?.name} as UNSOLD?`,
            "warning",
            "Mark Unsold",
            () => socket.emit('unsell_player', { auctionId, token: getToken() })
        );
    };

    const resetRound = () => {
        socket.emit('reset_round', { auctionId, token: getToken() });
    };

    const togglePause = () => {
        socket.emit('toggle_pause', { auctionId, token: getToken() });
    };

    const undoBid = () => {
        socket.emit('undo_bid', { auctionId, token: getToken() });
    };

    const placeBid = (teamId, nextBid) => {
        if (isPending) return;
        setIsPending(true);
        socket.emit('place_bid', { auctionId, teamId, amount: nextBid, token: getToken() });
        setTimeout(() => setIsPending(false), 250);
    };

    const isCompleted = config?.status === 'completed' || config?.isActive === false;

    return (
        <div className="admin-live-page theme-light">

            {/* PAUSE OVERLAY */}
            {liveState.status === 'PAUSED' && (
                <div className="pause-overlay animate-fade-in">
                    <Pause className="pause-overlay-icon" />
                    <h2>AUCTION PAUSED</h2>
                    <Button onClick={togglePause} variant="secondary" style={{ marginTop: 'var(--sp-6)' }}>
                        <PlayCircle className="w-5 h-5" /> Resume Auction
                    </Button>
                </div>
            )}

            {/* SIDEBAR BACKDROP */}
            {isSidebarOpen && (
                <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* MENU TOGGLE */}
            {!isSidebarOpen && (
                <div className="admin-live-page__menu-toggle animate-fade-in">
                    <Button
                        onClick={() => setIsSidebarOpen(true)}
                        className="btn-icon"
                        variant="secondary"
                    >
                        <Menu className="w-5 h-5" />
                    </Button>
                </div>
            )}

            {/* 1. SIDEBAR */}
            <ControlsSidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                sidebarTab={sidebarTab}
                setSidebarTab={setSidebarTab}
                queuePlayers={queuePlayers}
                categoryOrder={categoryOrder}
                groupedQueue={groupedQueue}
                setStatusList={setStatusList}
                unsoldPlayers={unsoldPlayers}
                soldPlayers={soldPlayers}
                teams={data.teams}
                isCompleted={isCompleted}
                startPlayer={startPlayer}
                navigate={navigate}
                config={config}
            />

            {/* 2. MAIN CONTENT */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
                {isCompleted ? (
                    <div className="live-console-workspace" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 'var(--sp-8)' }}>
                        <div style={{ width: '4.5rem', height: '4.5rem', backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', border: '2px solid #22c55e', marginBottom: 'var(--sp-4)' }}>
                            <Trophy className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 style={{ fontSize: 'var(--text-card)', fontWeight: 'var(--weight-black)', color: 'var(--text-primary)', marginBottom: 'var(--sp-2)' }}>Tournament Completed</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-secondary)', maxWidth: '360px', lineHeight: 1.6, margin: '0 auto var(--sp-6)' }}>
                            Auction has officially ended.<br />All players have been processed.<br />This session is now read-only.
                        </p>
                        <Button onClick={() => navigate(`/auction/${config?.slug}/setup`)} variant="secondary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* IDLE SCREEN (Mission Control Dashboard) */}
                        {!currentPlayer && (
                            <div className="live-console-workspace">
                                <div className="live-player-header-card">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                                        <div style={{ width: '3rem', height: '3rem', backgroundColor: 'var(--accent-muted)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', border: '1px solid var(--accent-border)', flexShrink: 0 }}>
                                            <Clock className="w-6 h-6" style={{ margin: 'auto' }} />
                                        </div>
                                        <div>
                                            <h1 className="brand-title" style={{ fontSize: 'var(--text-card)', margin: 0 }}>Live Auction Control Center</h1>
                                            <p className="brand-subtitle" style={{ margin: 0, fontSize: 'var(--text-secondary)' }}>Ready to run live bidding operations.</p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--sp-6)' }}>
                                    {/* Bidding Launchpad */}
                                    {!setStatusList.allCompleted ? (
                                        <div className="card" style={{ padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <h3 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold', margin: 0 }}>Current Set: <span style={{ color: 'var(--accent)' }}>{setStatusList.activeSet}</span></h3>
                                                <Badge variant="info">IN PROGRESS</Badge>
                                            </div>
                                            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                                                The active set must be fully processed before moving to the next. Remaining sets are locked to ensure fairness.
                                            </p>
                                            <div style={{ padding: 'var(--sp-3)', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', fontSize: 'var(--text-secondary)', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Set Players Left:</span>
                                                <span style={{ color: 'var(--accent)' }}>{setStatusList.remainingByCat[setStatusList.activeSet]?.length || 0}</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginTop: 'auto' }}>
                                                <Button
                                                    onClick={drawNextRandomPlayer}
                                                    variant="primary"
                                                    style={{ padding: 'var(--sp-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)', fontSize: '15px', fontWeight: 'bold' }}
                                                >
                                                    <Shuffle className="w-5 h-5" /> Draw Next Random Player
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="card" style={{ padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <h3 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold', color: 'var(--danger)', margin: 0 }}>Unsold Round Recall</h3>
                                                <Badge variant="danger">RECALL PHASE</Badge>
                                            </div>
                                            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                                                Click any player in the pool below to recall them into active live bidding. No randomization is applied during recall.
                                            </p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-xl)', padding: 'var(--sp-2)', backgroundColor: 'var(--bg-elevated)' }}>
                                                {unsoldPlayers.map(p => (
                                                    <div
                                                        key={p._id}
                                                        onClick={() => startPlayer(p)}
                                                        className="tr-hover"
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: 'var(--sp-3) var(--sp-4)',
                                                            cursor: 'pointer',
                                                            borderRadius: 'var(--radius-lg)',
                                                            border: '1px solid var(--border)',
                                                            backgroundColor: 'var(--bg-surface)',
                                                            gap: 'var(--sp-3)',
                                                            transition: 'var(--transition-fast)'
                                                        }}
                                                    >
                                                        <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontWeight: '700', fontSize: 'var(--text-secondary)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                                            <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', marginTop: '2px' }}>{p.role} • ₹{p.basePrice}L</div>
                                                        </div>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            backgroundColor: 'var(--danger-muted)',
                                                            border: '1px solid var(--danger-border)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0
                                                        }}>
                                                            <Play className="w-4 h-4" style={{ color: 'var(--danger)' }} />
                                                        </div>
                                                    </div>
                                                ))}
                                                {unsoldPlayers.length === 0 && (
                                                    <div style={{ textAlign: 'center', padding: 'var(--sp-5)', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 'var(--text-secondary)' }}>
                                                        No unsold players remaining to recall.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Telemetry */}
                                    <div className="card" style={{ padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                                        <h3 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold', margin: 0 }}>Auction Status Summary</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--sp-4)' }}>
                                            <div className="stats-matrix-card" style={{ padding: 'var(--sp-3)' }}>
                                                <div className="stats-matrix-label" style={{ fontSize: '10px' }}>Teams</div>
                                                <div className="stats-matrix-value" style={{ fontSize: 'var(--text-card)' }}>{data.teams.length}</div>
                                            </div>
                                            <div className="stats-matrix-card" style={{ padding: 'var(--sp-3)' }}>
                                                <div className="stats-matrix-label" style={{ fontSize: '10px' }}>Sold</div>
                                                <div className="stats-matrix-value" style={{ fontSize: 'var(--text-card)', color: 'var(--success)' }}>{soldPlayers.length}</div>
                                            </div>
                                            <div className="stats-matrix-card" style={{ padding: 'var(--sp-3)' }}>
                                                <div className="stats-matrix-label" style={{ fontSize: '10px' }}>Unsold</div>
                                                <div className="stats-matrix-value" style={{ fontSize: 'var(--text-card)', color: 'var(--danger)' }}>{unsoldPlayers.length}</div>
                                            </div>
                                            <div className="stats-matrix-card" style={{ padding: 'var(--sp-3)' }}>
                                                <div className="stats-matrix-label" style={{ fontSize: '10px' }}>Pool Left</div>
                                                <div className="stats-matrix-value" style={{ fontSize: 'var(--text-card)' }}>{queuePlayers.length}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ACTIVE AUCTION SCREEN */}
                        {currentPlayer && (
                            <div className="live-console-workspace">
                                <CurrentPlayer
                                    currentPlayer={currentPlayer}
                                    liveState={liveState}
                                    teams={data.teams}
                                />
                                <BidConsole
                                    teams={data.teams}
                                    liveState={liveState}
                                    currentPlayer={currentPlayer}
                                    placeBid={placeBid}
                                    undoBid={undoBid}
                                    sellPlayer={sellPlayer}
                                    unsellPlayer={unsellPlayer}
                                    isPending={isPending}
                                    showAlert={showAlert}
                                />
                            </div>
                        )}

                        {/* RESULT OVERLAY */}
                        <Modal
                            isOpen={(liveState.status === 'SOLD' || liveState.status === 'UNSOLD') && !!currentPlayer}
                            onClose={resetRound}
                            maxWidth="28rem"
                            title={liveState.status === 'SOLD' ? "Player Sold!" : "Player Passed"}
                            footer={
                                <Button onClick={resetRound} variant="primary" className="btn-w-full btn-lg" style={{ padding: 'var(--sp-3)' }}>
                                    <RefreshCcw className="w-5 h-5" /> Next Player
                                </Button>
                            }
                        >
                            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {liveState.status === 'SOLD' ? (
                                    <>
                                        <div style={{ margin: '0 auto var(--sp-4) auto', backgroundColor: 'var(--success-muted)', width: '4rem', height: '4rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--success-border)' }}>
                                            <Trophy className="w-8 h-8 text-success animate-bounce" />
                                        </div>
                                        <h2 style={{ fontSize: 'var(--text-card)', fontWeight: 'var(--weight-black)', marginBottom: 'var(--sp-1)' }}>{currentPlayer?.name} Sold!</h2>
                                        <div style={{ width: '100%', backgroundColor: 'var(--bg-elevated)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', marginBottom: 'var(--sp-6)', marginTop: 'var(--sp-3)' }}>
                                            <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Buyer</div>
                                            <div style={{ fontSize: 'var(--text-secondary)', fontWeight: 'bold' }}>{data.teams.find(t => t._id === liveState.leadingTeamId)?.name}</div>
                                            <div style={{ fontSize: 'var(--text-card)', fontFamily: 'var(--font-mono)', fontWeight: 'var(--weight-black)', color: 'var(--success)', marginTop: 'var(--sp-1)' }}>₹{liveState.currentBid}L</div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ margin: '0 auto var(--sp-4) auto', backgroundColor: 'var(--danger-muted)', width: '4rem', height: '4rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--danger-border)' }}>
                                            <AlertCircle className="w-8 h-8 text-danger" />
                                        </div>
                                        <h2 style={{ fontSize: 'var(--text-card)', fontWeight: 'var(--weight-black)', marginBottom: 'var(--sp-2)' }}>Unsold</h2>
                                        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--sp-6)', fontSize: 'var(--text-secondary)' }}>Player passed to next round.</p>
                                    </>
                                )}
                            </div>
                        </Modal>
                    </>
                )}
            </div>

            {/* Custom Modal Confirmation Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                type={confirmDialog.type}
            />

            {/* Custom Modal Notification Alert */}
            <AlertDialog
                isOpen={alertDialog.isOpen}
                onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
                title={alertDialog.title}
                message={alertDialog.message}
                type={alertDialog.type}
            />
        </div>
    );
}
