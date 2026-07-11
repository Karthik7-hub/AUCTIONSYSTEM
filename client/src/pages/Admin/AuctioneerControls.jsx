import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Gavel, Play, PlayCircle, Pause, AlertCircle, RefreshCcw,
    X, Menu, ArrowLeft, Users, CheckCircle, RotateCcw, Plus, Minus,
    Shuffle, User, Wallet, Clock, Trophy, ChevronRight, Copy
} from 'lucide-react';
import Button from '@components/ui/Button';
import Modal from '@components/ui/Modal';
import Badge from '@components/ui/Badge';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import AlertDialog from '@components/ui/AlertDialog';
import { getAccessToken } from '@services/auth.service';

export default function AuctioneerControls({ data, socket, liveState, auctionId, config }) {
    const navigate = useNavigate();
    const getToken = () => getAccessToken(auctionId);
    const categories = config?.categories?.length ? config.categories : ['Marquee', 'Set 1', 'Set 2', 'Set 3', 'Set 4'];
    const roles = config?.roles?.length ? config.roles : ['Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper'];

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarTab, setSidebarTab] = useState('queue'); // 'queue', 'unsold', 'sold', 'teams'
    const [increment, setIncrement] = useState(10);
    const [isPending, setIsPending] = useState(false);
    const [customBid, setCustomBid] = useState('');

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

    const categoryOrder = useMemo(() => {
        const presentCats = Object.keys(groupedQueue);
        return categories.filter(c => presentCats.includes(c));
    }, [groupedQueue, categories]);

    // Determine set statuses and active pool
    const setStatusList = useMemo(() => {
        const remainingByCat = {};
        categories.forEach(cat => {
            remainingByCat[cat] = queuePlayers.filter(p => (p.category || 'Uncategorized') === cat);
        });

        let activeSetFound = null;
        const result = {};

        categories.forEach(cat => {
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
    }, [categories, queuePlayers]);

    const copyLink = () => {
        const link = `${window.location.origin}/auction/${config?.slug || auctionId}`;
        navigator.clipboard.writeText(link);
        showAlert("Link Copied", "Spectator link copied to clipboard!", "success");
    };

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

    const placeBid = (teamId) => {
        if (isPending) return;
        const team = data.teams.find(t => t._id === teamId);
        if (!team) return;

        const customBidAmount = parseFloat(customBid);
        const nextBid = (!isNaN(customBidAmount) && customBidAmount > 0)
            ? customBidAmount
            : (liveState.leadingTeamId === null
                ? (currentPlayer?.basePrice || 0)
                : (liveState.currentBid + increment));

        const isFirstBid = liveState.leadingTeamId === null;
        const isBidTooLow = isFirstBid ? nextBid < liveState.currentBid : nextBid <= liveState.currentBid;
        if (isBidTooLow) {
            showAlert("Invalid Bid", `Bid amount must be at least ₹${liveState.currentBid}L!`, "error");
            return;
        }

        if (team.budget - team.spent < nextBid) {
            showAlert("Insufficient Funds", `Insufficient funds! ${team.name} has only ₹${team.budget - team.spent}L left.`, "error");
            return;
        }

        setIsPending(true);
        socket.emit('place_bid', { auctionId, teamId, amount: nextBid, token: getToken() });
        setTimeout(() => setIsPending(false), 250);
        setCustomBid('');
    };

    const startNextPlayer = () => {
        if (queuePlayers.length > 0) {
            startPlayer(queuePlayers[0]);
        } else {
            showAlert("Queue Empty", "No active players left in the queue!", "warning");
        }
    };

    const startRandomMarquee = () => {
        const firstCategoryWithPlayers = categoryOrder[0];
        if (firstCategoryWithPlayers) {
            pickRandomPlayer(firstCategoryWithPlayers);
        } else if (queuePlayers.length > 0) {
            startPlayer(queuePlayers[Math.floor(Math.random() * queuePlayers.length)]);
        } else {
            showAlert("Pool Empty", "No active players left in the pool!", "warning");
        }
    };

    const isCompleted = config?.status === 'completed' || config?.isActive === false;
    const totalBudget = data.teams.reduce((acc, t) => acc + t.budget, 0);
    const totalSpent = data.teams.reduce((acc, t) => acc + t.spent, 0);

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



            {/* MOBILE MENU TOGGLE */}
            <div className="mobile-menu-toggle">
                <Button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="btn-icon"
                    variant="secondary"
                >
                    {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </Button>
            </div>

            {/* 1. SIDEBAR */}
            <div className={`live-sidebar ${isSidebarOpen ? 'live-sidebar-open' : 'live-sidebar-closed'}`}>
                {/* Header */}
                <div className="live-sidebar-header">
                    <Button onClick={() => navigate(`/auction/${config?.slug}/setup`)} variant="secondary" style={{ padding: 'var(--sp-2) var(--sp-4)', fontSize: 'var(--text-xs)' }}>
                        <ArrowLeft className="w-4 h-4" /> Exit
                    </Button>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {sidebarTab === 'teams' ? 'Team Standings' : 'Player Lists'}
                    </div>
                </div>

                {/* 4-Way Tab Switcher */}
                <div className="sidebar-tabs-grid">
                    {[
                        { id: 'queue', icon: Play, label: 'Queue' },
                        { id: 'unsold', icon: AlertCircle, label: 'Unsold' },
                        { id: 'sold', icon: CheckCircle, label: 'Sold' },
                        { id: 'teams', icon: Users, label: 'Teams' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSidebarTab(tab.id)}
                            className={`sidebar-tab-btn ${sidebarTab === tab.id ? 'sidebar-tab-btn-active' : ''}`}
                        >
                            <tab.icon />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Sidebar Content Area */}
                <div className="flex-1 overflow-y-auto" style={{ padding: 'var(--sp-3)' }}>

                    {/* VIEW: PLAYERS (Queue) */}
                    {sidebarTab === 'queue' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                            {queuePlayers.length === 0 && <div className="empty-table-state" style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic' }}>Queue Empty</div>}

                            {categoryOrder.map(category => {
                                const players = groupedQueue[category];
                                if (!players || players.length === 0) return null;

                                const setStatus = setStatusList.statuses[category];

                                return (
                                    <div key={category} className="category-group-row animate-slide-in-left">
                                        <div
                                            className="category-group-side-btn"
                                            style={{
                                                cursor: 'default',
                                                opacity: setStatus === 'locked' ? 0.5 : 1,
                                                backgroundColor: setStatus === 'active' ? '#111111' : 'transparent',
                                                borderRight: 'none',
                                                borderRadius: setStatus === 'active' ? 'var(--radius-lg)' : 0
                                            }}
                                        >
                                            <span className="category-vertical-text" style={{ color: setStatus === 'active' ? '#ffffff' : 'var(--text-muted)', fontWeight: setStatus === 'active' ? '800' : 'normal' }}>
                                                {category} ({players.length})
                                            </span>
                                        </div>

                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                                            {players.map(p => (
                                                <div
                                                    key={p._id}
                                                    className="card"
                                                    style={{
                                                        padding: 'var(--sp-3)',
                                                        cursor: 'default',
                                                        borderRadius: 'var(--radius-xl)',
                                                        minHeight: 'auto',
                                                        opacity: setStatus === 'locked' ? 0.55 : 1,
                                                        border: setStatus === 'active' ? '1px solid var(--accent-border)' : '1px solid var(--border)'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)', color: setStatus === 'locked' ? 'var(--text-muted)' : 'var(--text-primary)' }}>{p.name}</div>
                                                        {setStatus === 'locked' && (
                                                            <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Locked</span>
                                                        )}
                                                        {setStatus === 'active' && (
                                                            <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase' }}>Draw Pool</span>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--sp-1)', fontSize: '10px', fontWeight: 'bold' }}>
                                                        <Badge variant={setStatus === 'locked' ? 'secondary' : 'primary'}>{p.role}</Badge>
                                                        <span className="font-mono" style={{ color: setStatus === 'locked' ? 'var(--text-muted)' : 'var(--text-secondary)' }}>₹{p.basePrice}L</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* VIEW: UNSOLD */}
                    {sidebarTab === 'unsold' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                            {unsoldPlayers.map(p => {
                                const isUnsoldRound = setStatusList.allCompleted;
                                return (
                                    <div
                                        key={p._id}
                                        onClick={isUnsoldRound && !isCompleted ? () => startPlayer(p) : null}
                                        className="card"
                                        style={{
                                            padding: 'var(--sp-3)',
                                            cursor: isUnsoldRound && !isCompleted ? 'pointer' : 'default',
                                            borderRadius: 'var(--radius-xl)',
                                            border: isUnsoldRound ? '1px solid var(--danger-border)' : '1px solid var(--border)',
                                            minHeight: 'auto',
                                            opacity: isUnsoldRound ? 1 : 0.55
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>{p.name}</div>
                                            {!isUnsoldRound && (
                                                <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Locked</span>
                                            )}
                                            {isUnsoldRound && !isCompleted && (
                                                <span style={{ fontSize: '9px', color: 'var(--danger)', fontWeight: 'bold', textTransform: 'uppercase' }}>Recall</span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--sp-1)', fontSize: '10px', fontWeight: 'bold' }}>
                                            <Badge variant={isUnsoldRound ? 'danger' : 'secondary'}>{p.role}</Badge>
                                            <span className="font-mono">₹{p.basePrice}L</span>
                                        </div>
                                    </div>
                                );
                            })}
                            {unsoldPlayers.length === 0 && <div className="empty-table-state" style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic' }}>No Unsold Players</div>}
                        </div>
                    )}

                    {/* VIEW: SOLD */}
                    {sidebarTab === 'sold' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                            {soldPlayers.map(p => (
                                <div key={p._id} className="card" style={{ padding: 'var(--sp-3)', opacity: 0.8, borderRadius: 'var(--radius-xl)', border: '1px solid var(--success-border)', minHeight: 'auto' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>{p.name}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--sp-1)' }}>
                                        <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>{data.teams.find(t => t._id === p.soldTo)?.name}</span>
                                        <Badge variant="success">₹{p.soldPrice}L</Badge>
                                    </div>
                                </div>
                            ))}
                            {soldPlayers.length === 0 && <div className="empty-table-state" style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic' }}>No Players Sold Yet</div>}
                        </div>
                    )}

                    {/* VIEW: TEAMS DETAIL */}
                    {sidebarTab === 'teams' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                            {data.teams.map(team => {
                                const percentUsed = (team.spent / team.budget) * 100;
                                return (
                                    <div key={team._id} className="card" style={{ padding: 'var(--sp-3)', borderRadius: 'var(--radius-xl)', minHeight: 'auto' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>{team.name}</span>
                                            <Badge variant="info">{team.players.length} Players</Badge>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'var(--weight-medium)' }}>
                                                <span>Used: ₹{team.spent}L</span>
                                                <span>Total: ₹{team.budget}L</span>
                                            </div>
                                            <div className="progress-bar-bg" style={{ height: '6px' }}>
                                                <div
                                                    className="progress-bar-fill"
                                                    style={{ width: `${percentUsed}%`, backgroundColor: team.color }}
                                                ></div>
                                            </div>
                                            <div style={{ textAlign: 'right', fontSize: '10px', fontWeight: 'bold', color: 'var(--success)' }}>
                                                Rem: ₹{team.budget - team.spent}L
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

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
                                        <div style={{ width: '3rem', height: '3rem', backgroundColor: 'var(--accent-muted)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifycontent: 'center', color: 'var(--accent)', border: '1px solid var(--accent-border)', flexShrink: 0 }}>
                                            <Clock className="w-6 h-6" style={{ margin: 'auto' }} />
                                        </div>
                                        <div>
                                            <h1 className="brand-title" style={{ fontSize: 'var(--text-card)' }}>Live Auction Control Center</h1>
                                            <p className="brand-subtitle" style={{ margin: 0 }}>Ready to run live bidding operations.</p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--sp-6)' }}>
                                    {/* Bidding Launchpad */}
                                    {!setStatusList.allCompleted ? (
                                        <div className="card" style={{ padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <h3 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold' }}>Current Set: <span style={{ color: 'var(--accent)' }}>{setStatusList.activeSet}</span></h3>
                                                <Badge variant="info">IN PROGRESS</Badge>
                                            </div>
                                            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-secondary)', lineHeight: 1.4 }}>
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
                                                <h3 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold', color: 'var(--danger)' }}>Unsold Round Recall</h3>
                                                <Badge variant="danger">RECALL PHASE</Badge>
                                            </div>
                                            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-secondary)', lineHeight: 1.4 }}>
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
                                                            <Play className="w-4 h-4 text-danger" style={{ color: 'var(--danger)' }} />
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
                                        <h3 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold' }}>Auction Status Summary</h3>
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

                                {/* --- TOP: INFO CARD --- */}
                                <div className="live-player-header-card">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', width: '100%', flex: 1 }}>
                                        <div style={{ width: '3rem', height: '3rem', backgroundColor: 'var(--accent-muted)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', border: '1px solid var(--accent-border)', flexShrink: 0 }}>
                                            <User className="w-6 h-6" style={{ margin: 'auto' }} />
                                        </div>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <h1 style={{ fontSize: 'var(--text-card)', fontWeight: 'var(--weight-black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentPlayer.name}</h1>
                                            <div style={{ display: 'flex', gap: 'var(--sp-2)', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 'var(--sp-0.5)', flexWrap: 'wrap' }}>
                                                <Badge>{currentPlayer.role}</Badge>
                                                <Badge>{currentPlayer.category}</Badge>
                                                <Badge variant="info">Base: ₹{currentPlayer.basePrice}L</Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bid-bubble-wrapper">
                                        <div>
                                            <div style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Current Bid</div>
                                            <div className="font-mono" style={{ fontSize: 'var(--text-card)', fontWeight: 'var(--weight-black)', color: 'var(--success)', lineHeight: 1.1 }}>₹{liveState.currentBid}L</div>
                                        </div>
                                        {liveState.leadingTeamId && (
                                            <div className="leader-info-block">
                                                <div style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Leader</div>
                                                <div style={{ fontWeight: 'bold', fontSize: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                                                    {data.teams.find(t => t._id === liveState.leadingTeamId)?.name}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* --- MIDDLE: BIDDING CONSOLE --- */}
                                <div className="live-console-workspace" style={{ flex: 1, padding: 0 }}>
                                    <div className="live-console-main-box">

                                        {/* Header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)', flexShrink: 0, zIndex: 10 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontWeight: 'bold', fontSize: 'var(--text-secondary)' }}>
                                                <Gavel className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Bidding Paddles
                                            </div>

                                            <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-lg)', padding: '0 var(--sp-2)', backgroundColor: 'var(--bg-elevated)', gap: 'var(--sp-1)', height: '36px', cursor: 'text', userSelect: 'none' }}>
                                                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', pointerEvents: 'none' }}>Custom:</span>
                                                    <input
                                                        type="number"
                                                        value={customBid}
                                                        onChange={e => setCustomBid(e.target.value)}
                                                        placeholder="Next..."
                                                        style={{
                                                            width: '60px',
                                                            border: 'none',
                                                            background: 'transparent',
                                                            color: 'var(--text-primary)',
                                                            fontFamily: 'monospace',
                                                            fontSize: '13px',
                                                            fontWeight: 'bold',
                                                            outline: 'none',
                                                            padding: 0
                                                        }}
                                                    />
                                                    {customBid && (
                                                        <button
                                                            onClick={() => setCustomBid('')}
                                                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: 0 }}
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </label>

                                                {/* Undo Button */}
                                                <Button
                                                    onClick={undoBid}
                                                    disabled={!liveState.leadingTeamId}
                                                    variant="secondary"
                                                    style={{ padding: 'var(--sp-1-5) var(--sp-3)', display: 'flex', alignItems: 'center', gap: 'var(--sp-1)', fontSize: 'var(--text-secondary)', height: '36px' }}
                                                >
                                                    <RotateCcw className="w-4 h-4" /> Undo
                                                </Button>

                                                <div className="console-increment-pill" style={{ height: '36px' }}>
                                                    <button onClick={() => setIncrement(Math.max(1, increment - 5))}><Minus className="w-3 h-3" /></button>
                                                    <span className="console-increment-val">₹{increment}</span>
                                                    <button onClick={() => setIncrement(increment + 5)}><Plus className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Paddles Grid */}
                                        <div className="paddles-grid-container">
                                            <div className="paddles-grid">
                                                {data.teams.map(team => {
                                                    const customBidAmount = parseFloat(customBid);
                                                    const nextBidAmount = (!isNaN(customBidAmount) && customBidAmount > 0)
                                                        ? customBidAmount
                                                        : (liveState.leadingTeamId === null ? currentPlayer.basePrice : liveState.currentBid + increment);
                                                    const canAfford = (team.budget - team.spent) >= nextBidAmount;
                                                    const isLeader = liveState.leadingTeamId === team._id;
                                                    const remaining = team.budget - team.spent;

                                                    return (
                                                        <button
                                                            key={team._id}
                                                            onClick={() => placeBid(team._id)}
                                                            disabled={!canAfford || isLeader || isPending}
                                                            className={`paddle-btn ${isLeader ? 'paddle-leader' : ''}`}
                                                            style={{
                                                                backgroundColor: team.color,
                                                                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.05) 100%)'
                                                            }}
                                                        >
                                                            <div className="paddle-team-name">
                                                                {team.name}
                                                            </div>

                                                            <div className="paddle-bid-bubble">
                                                                {isLeader ? 'HOLDING' : `₹${nextBidAmount}L`}
                                                            </div>

                                                            <div className="paddle-purse">
                                                                <Wallet className="w-3 h-3" /> ₹{remaining}L
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--sp-3)', marginTop: 'var(--sp-3)', paddingTop: 'var(--sp-3)', borderTop: '1px solid var(--border)', flexShrink: 0, zIndex: 10 }}>
                                            <Button
                                                onClick={sellPlayer}
                                                disabled={!liveState.leadingTeamId}
                                                variant="success"
                                                className="btn-lg"
                                                style={{ fontWeight: '900', boxShadow: 'var(--shadow-md)', display: 'flex', justifyContent: 'center', width: '100%' }}
                                            >
                                                <CheckCircle className="w-5 h-5" /> SOLD
                                            </Button>
                                            <Button
                                                onClick={unsellPlayer}
                                                variant="danger"
                                                className="btn-lg"
                                                style={{ fontWeight: '900', display: 'flex', justifyContent: 'center', width: '100%', backgroundColor: 'transparent', color: 'var(--danger)', border: '2px solid var(--danger-border)' }}
                                            >
                                                <AlertCircle className="w-5 h-5" /> UNSOLD
                                            </Button>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- 3. RESULT OVERLAY --- */}
                        <Modal
                            isOpen={(liveState.status === 'SOLD' || liveState.status === 'UNSOLD') && !!currentPlayer}
                            onClose={resetRound}
                            maxWidth="28rem"
                            title={liveState.status === 'SOLD' ? "Player Sold!" : "Player Passed"}
                            footer={
                                <Button onClick={resetRound} variant="primary" className="btn-w-full btn-lg" style={{ padding: undefined }}>
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
