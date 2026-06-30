import React, { useState, useEffect, useMemo } from 'react';
import {
    Gavel, Play, PlayCircle, Pause, AlertCircle, RefreshCcw,
    X, Menu, ArrowLeft, Users, CheckCircle, RotateCcw, Plus, Minus,
    Shuffle, User, Wallet
} from 'lucide-react';
import Button from '@components/ui/Button';
import Modal from '@components/ui/Modal';
import Badge from '@components/ui/Badge';

export default function AuctioneerControls({ data, socket, liveState, setView, auctionId, config }) {
    const categories = config?.categories?.length ? config.categories : ['Marquee', 'Set 1', 'Set 2', 'Set 3', 'Set 4'];
    const roles = config?.roles?.length ? config.roles : ['Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper'];

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarTab, setSidebarTab] = useState('queue'); // 'queue', 'unsold', 'sold', 'teams'
    const [increment, setIncrement] = useState(10);
    const [isPending, setIsPending] = useState(false);

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

    const copyLink = () => {
        const link = `${window.location.origin}/auction/${auctionId}`;
        navigator.clipboard.writeText(link);
        alert("Spectator link copied to clipboard!");
    };

    const startPlayer = (player) => {
        setIsSidebarOpen(false);
        socket.emit('start_player', { auctionId, playerId: player._id });
    };

    const pickRandomPlayer = (category) => {
        const pool = groupedQueue[category];
        if (pool && pool.length > 0) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            startPlayer(pool[randomIndex]);
        }
    };

    const sellPlayer = () => {
        if (window.confirm(`Sell ${currentPlayer?.name} for ₹${liveState.currentBid}L?`)) {
            socket.emit('sell_player', { auctionId });
        }
    };

    const unsellPlayer = () => {
        if (window.confirm(`Mark ${currentPlayer?.name} as UNSOLD?`)) {
            socket.emit('unsell_player', { auctionId });
        }
    };

    const resetRound = () => {
        socket.emit('reset_round', { auctionId });
    };

    const togglePause = () => {
        socket.emit('toggle_pause', { auctionId });
    };

    const undoBid = () => {
        socket.emit('undo_bid', { auctionId });
    };

    const placeBid = (teamId) => {
        if (isPending) return;
        const team = data.teams.find(t => t._id === teamId);
        if (!team) return;

        const nextBid = liveState.leadingTeamId === null
            ? (currentPlayer?.basePrice || 0)
            : (liveState.currentBid + increment);

        if (team.budget - team.spent < nextBid) {
            alert(`Insufficient funds! ${team.name} has only ₹${team.budget - team.spent}L left.`);
            return;
        }

        setIsPending(true);
        socket.emit('place_bid', { auctionId, teamId, amount: nextBid });
        setTimeout(() => setIsPending(false), 1000);
    };

    return (
        <div className="admin-live-page theme-light">

            {/* PAUSE OVERLAY */}
            {liveState.status === 'PAUSED' && (
                <div className="pause-overlay animate-fade-in">
                    <Pause className="pause-overlay-icon" />
                    <h2>AUCTION PAUSED</h2>
                    <Button onClick={togglePause} variant="secondary" style={{ marginTop: 'var(--space-6)' }}>
                        <PlayCircle className="w-5 h-5" /> Resume Auction
                    </Button>
                </div>
            )}

            {/* HEADER ACTIONS (Absolute Top Right) */}
            <div className="live-header-actions">
                <Button onClick={copyLink} className="btn-icon" variant="secondary" title="Copy Invite Link">
                    <RefreshCcw className="w-5 h-5" />
                </Button>
                {liveState.status !== 'IDLE' && (
                    <Button onClick={togglePause} className="btn-icon" variant="secondary" title="Pause/Resume">
                        {liveState.status === 'PAUSED' ? <PlayCircle className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </Button>
                )}
            </div>

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
                    <Button onClick={() => setView('admin-setup')} variant="secondary" style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)' }}>
                        <ArrowLeft className="w-4 h-4" /> Exit
                    </Button>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {sidebarTab === 'teams' ? 'Team Standings' : 'Player Lists'}
                    </div>
                </div>

                {/* 4-Way Tab Switcher */}
                <div className="sidebar-tabs-grid">
                    {[
                        { id: 'queue', icon: Play, label: 'Run' },
                        { id: 'unsold', icon: AlertCircle, label: 'Pass' },
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
                <div className="flex-1 overflow-y-auto" style={{ padding: 'var(--space-3)', backgroundColor: 'var(--slate-50)' }}>

                    {/* VIEW: PLAYERS (Queue) */}
                    {sidebarTab === 'queue' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            {queuePlayers.length === 0 && <div className="empty-table-state" style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic' }}>Queue Empty</div>}

                            {categoryOrder.map(category => {
                                const players = groupedQueue[category];
                                if (!players || players.length === 0) return null;

                                return (
                                    <div key={category} className="category-group-row animate-slide-in-left">
                                        <button
                                            onClick={() => pickRandomPlayer(category)}
                                            className="category-group-side-btn"
                                            title={`Pick Random from ${category}`}
                                        >
                                            <Shuffle className="w-4 h-4" />
                                            <span className="category-vertical-text">
                                                {category} ({players.length})
                                            </span>
                                        </button>

                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                            {players.map(p => (
                                                <div key={p._id} onClick={() => startPlayer(p)} className="card" style={{ padding: 'var(--space-3)', cursor: 'pointer', borderRadius: 'var(--radius-xl)', minHeight: 'auto' }}>
                                                    <div style={{ fontWeight: 'bold', color: 'var(--slate-700)', fontSize: 'var(--text-sm)' }}>{p.name}</div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-1)', fontSize: '10px', fontWeight: 'bold', color: 'var(--slate-500)' }}>
                                                        <Badge>{p.role}</Badge>
                                                        <span className="font-mono" style={{ color: 'var(--slate-400)' }}>₹{p.basePrice}L</span>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            {unsoldPlayers.length > 0 && (
                                <Button
                                    onClick={() => {
                                        const randomIndex = Math.floor(Math.random() * unsoldPlayers.length);
                                        startPlayer(unsoldPlayers[randomIndex]);
                                    }}
                                    variant="danger"
                                    className="btn-w-full"
                                    style={{ padding: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
                                >
                                    <Shuffle className="w-4 h-4" /> Pick Random Unsold
                                </Button>
                            )}

                            {unsoldPlayers.map(p => (
                                <div key={p._id} onClick={() => startPlayer(p)} className="card" style={{ padding: 'var(--space-3)', cursor: 'pointer', borderRadius: 'var(--radius-xl)', border: '1px solid var(--red-200)', minHeight: 'auto' }}>
                                    <div style={{ fontWeight: 'bold', color: 'var(--slate-700)', fontSize: 'var(--text-sm)' }}>{p.name}</div>
                                    <span style={{ fontSize: '10px', color: 'var(--red-500)', fontWeight: 'bold', display: 'block', marginTop: 'var(--space-1)' }}>Tap to Re-Auction</span>
                                </div>
                            ))}
                            {unsoldPlayers.length === 0 && <div className="empty-table-state" style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic' }}>No Unsold Players</div>}
                        </div>
                    )}

                    {/* VIEW: SOLD */}
                    {sidebarTab === 'sold' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            {soldPlayers.map(p => (
                                <div key={p._id} className="card" style={{ padding: 'var(--space-3)', opacity: 0.8, borderRadius: 'var(--radius-xl)', border: '1px solid var(--green-200)', minHeight: 'auto' }}>
                                    <div style={{ fontWeight: 'bold', color: 'var(--slate-800)', fontSize: 'var(--text-sm)' }}>{p.name}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-1)' }}>
                                        <span style={{ fontSize: '10px', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 'bold' }}>{data.teams.find(t => t._id === p.soldTo)?.name}</span>
                                        <Badge variant="success">₹{p.soldPrice}L</Badge>
                                    </div>
                                </div>
                            ))}
                            {soldPlayers.length === 0 && <div className="empty-table-state" style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic' }}>No Players Sold Yet</div>}
                        </div>
                    )}

                    {/* VIEW: TEAMS DETAIL */}
                    {sidebarTab === 'teams' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            {data.teams.map(team => {
                                const percentUsed = (team.spent / team.budget) * 100;
                                return (
                                    <div key={team._id} className="card" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)', minHeight: 'auto' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                                            <span style={{ fontWeight: 'bold', color: 'var(--slate-800)', fontSize: 'var(--text-sm)' }}>{team.name}</span>
                                            <Badge variant="info">{team.players.length} Players</Badge>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--slate-500)', fontWeight: 'var(--weight-medium)' }}>
                                                <span>Used: ₹{team.spent}L</span>
                                                <span>Total: ₹{team.budget}L</span>
                                            </div>
                                            <div className="progress-bar-bg" style={{ height: '6px', backgroundColor: 'var(--slate-100)' }}>
                                                <div
                                                    className="progress-bar-fill"
                                                    style={{ width: `${percentUsed}%`, backgroundColor: team.color }}
                                                ></div>
                                            </div>
                                            <div style={{ textAlign: 'right', fontSize: '10px', fontWeight: 'bold', color: 'var(--green-600)' }}>
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
            <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full" style={{ backgroundColor: 'var(--slate-100)' }}>

                {/* IDLE SCREEN */}
                {!currentPlayer && (
                    <div className="idle-console-wrapper animate-zoom-in">
                        <div className="idle-console-circle">
                            <Clock className="w-8 h-8" style={{ color: 'var(--slate-300)' }} />
                        </div>
                        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: 'var(--slate-600)' }}>Ready</h2>
                        <p style={{ color: 'var(--slate-400)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>Pick a player or use the randomizer button.</p>
                    </div>
                )}

                {/* ACTIVE AUCTION SCREEN */}
                {currentPlayer && (
                    <div className="live-console-workspace">

                        {/* --- TOP: INFO CARD --- */}
                        <div className="live-player-header-card">
                            <div className="live-player-header-card-glow"></div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', width: '100%', flex: 1 }}>
                                <div style={{ width: '3rem', height: '3rem', backgroundColor: 'var(--blue-55)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-600)', border: '1px solid rgba(59, 130, 246, 0.2)', flexShrink: 0 }}>
                                    <User className="w-6 h-6" />
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-black)', color: 'var(--slate-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentPlayer.name}</h1>
                                    <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 'var(--space-0.5)', flexWrap: 'wrap' }}>
                                        <Badge>{currentPlayer.role}</Badge>
                                        <Badge>{currentPlayer.category}</Badge>
                                        <Badge variant="info">Base: ₹{currentPlayer.basePrice}L</Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="bid-bubble-wrapper">
                                <div>
                                    <div style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--slate-400)', letterSpacing: '0.05em' }}>Current Bid</div>
                                    <div className="font-mono" style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-black)', color: 'var(--blue-600)', lineHeight: 1.1 }}>₹{liveState.currentBid}L</div>
                                </div>
                                {liveState.leadingTeamId && (
                                    <div className="leader-info-block">
                                        <div style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--slate-400)', letterSpacing: '0.05em' }}>Leader</div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--slate-800)', fontSize: 'var(--text-base)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexShrink: 0, zIndex: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 'bold', color: 'var(--slate-700)', fontSize: 'var(--text-base)' }}>
                                        <Gavel className="w-4 h-4" style={{ color: 'var(--slate-400)' }} /> Bidding Paddles
                                    </div>

                                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                        {/* Undo Button */}
                                        <Button
                                            onClick={undoBid}
                                            disabled={!liveState.leadingTeamId}
                                            variant="secondary"
                                            style={{ padding: 'var(--space-1.5) var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-sm)' }}
                                        >
                                            <RotateCcw className="w-4 h-4" /> Undo
                                        </Button>

                                        <div className="console-increment-pill">
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
                                            const nextBidAmount = liveState.leadingTeamId === null ? currentPlayer.basePrice : liveState.currentBid + increment;
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
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--slate-100)', flexShrink: 0, zIndex: 10, backgroundColor: '#ffffff' }}>
                                    <Button
                                        onClick={sellPlayer}
                                        disabled={!liveState.leadingTeamId}
                                        variant="success"
                                        style={{ padding: 'var(--space-3)', fontWeight: '900', fontSize: 'var(--text-lg)', boxShadow: 'var(--shadow-md)', display: 'flex', justifyContent: 'center', width: '100%' }}
                                    >
                                        <CheckCircle className="w-5 h-5" /> SOLD
                                    </Button>
                                    <Button
                                        onClick={unsellPlayer}
                                        variant="danger"
                                        style={{ padding: 'var(--space-3)', fontWeight: '900', fontSize: 'var(--text-lg)', boxShadow: 'var(--shadow-md)', display: 'flex', justifyContent: 'center', width: '100%', backgroundColor: '#ffffff', color: 'var(--red-600)', border: '2px solid rgba(239, 68, 68, 0.2)' }}
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
                    maxWidth="24rem"
                    title={liveState.status === 'SOLD' ? "Player Sold!" : "Player Passed"}
                    footer={
                        <Button onClick={resetRound} variant="primary" className="btn-w-full" style={{ padding: 'var(--space-3)' }}>
                            <RefreshCcw className="w-4 h-4" /> Next Player
                        </Button>
                    }
                >
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {liveState.status === 'SOLD' ? (
                            <>
                                <div style={{ margin: '0 auto var(--space-4) auto', backgroundColor: 'var(--green-50)', width: '4rem', height: '4rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                    <Trophy className="w-8 h-8 text-green-600 animate-bounce" />
                                </div>
                                <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-black)', color: 'var(--slate-800)', marginBottom: 'var(--space-1)' }}>{currentPlayer?.name} Sold!</h2>
                                <div style={{ width: '100%', backgroundColor: 'var(--slate-50)', padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--slate-100)', marginBottom: 'var(--space-6)', marginTop: 'var(--space-3)', boxShadow: 'var(--shadow-inner)' }}>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--slate-400)', fontWeight: 'bold', textTransform: 'uppercase' }}>Buyer</div>
                                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--slate-900)' }}>{data.teams.find(t => t._id === liveState.leadingTeamId)?.name}</div>
                                    <div style={{ fontSize: 'var(--text-2xl)', fontFamily: 'var(--font-mono)', fontWeight: 'var(--weight-black)', color: 'var(--green-600)', marginTop: 'var(--space-1)' }}>₹{liveState.currentBid}L</div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ margin: '0 auto var(--space-4) auto', backgroundColor: 'var(--red-50)', width: '4rem', height: '4rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    <AlertCircle className="w-8 h-8 text-red-600" />
                                </div>
                                <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-black)', color: 'var(--slate-800)', marginBottom: 'var(--space-2)' }}>Unsold</h2>
                                <p style={{ color: 'var(--slate-500)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>Player passed to next round.</p>
                            </>
                        )}
                    </div>
                </Modal>

            </div>
        </div>
    );
}
