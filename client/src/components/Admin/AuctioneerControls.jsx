import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Clock, AlertCircle, CheckCircle, Play,
    Gavel, User, Menu, X, Plus, Minus, Trophy, RefreshCcw,
    Users, Wallet, Shuffle, RotateCcw, Pause, PlayCircle, Share2
} from 'lucide-react';

export default function AuctioneerControls({ data, socket, liveState, setView, auctionId, config }) {

    // --- 1. DYNAMIC CATEGORY ORDER ---
    // Uses the custom categories from the Tournament Config
    // Fallback to default if config isn't loaded yet
    const categoryOrder = config?.categories?.length
        ? config.categories
        : ['Marquee', 'Set 1', 'Set 2', 'Set 3', 'Set 4'];

    const [increment, setIncrement] = useState(10);
    const [sidebarTab, setSidebarTab] = useState('queue');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isPending, setIsPending] = useState(false); // Prevents rapid-fire clicks

    // --- SAFETY CHECKS ---
    if (!data || !liveState) return <div className="h-screen flex items-center justify-center text-slate-500 font-bold animate-pulse">Loading Console...</div>;

    // --- AUTO-INCREMENT LOGIC ---
    useEffect(() => {
        if (!liveState) return;
        setIsPending(false); // Unlock buttons when state updates

        const bid = liveState.currentBid;
        let newIncrement = 10;

        if (bid >= 1000) {
            newIncrement = 100;
        } else if (bid >= 500) {
            newIncrement = 50;
        } else if (bid >= 300) {
            newIncrement = 20;
        } else if (bid >= 100) {
            newIncrement = 10;
        } else {
            newIncrement = 10;
        }

        setIncrement(newIncrement);
    }, [liveState.currentBid]);

    // --- DERIVED LISTS ---
    const queuePlayers = data.players.filter(p => !p.isSold && !p.isUnsold);
    const unsoldPlayers = data.players.filter(p => p.isUnsold);
    const soldPlayers = data.players.filter(p => p.isSold);

    // Group Queue Players dynamically based on their category
    const groupedQueue = queuePlayers.reduce((acc, player) => {
        const cat = player.category || 'Uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(player);
        return acc;
    }, {});

    const currentPlayer = liveState.currentPlayerId
        ? data.players.find(p => p._id === liveState.currentPlayerId)
        : null;

    // --- ACTIONS ---
    const undoBid = () => socket.emit('undo_bid', { auctionId });
    const togglePause = () => socket.emit('toggle_pause', { auctionId });

    const copyLink = () => {
        // Copies the current URL (e.g. yoursite.com/auction/123/admin-live)
        // Adjust logic if you want to share the VIEWER link instead (remove /admin-live)
        const viewerUrl = window.location.href.replace('/admin-live', '');
        navigator.clipboard.writeText(viewerUrl);
        alert("Tournament Link Copied!");
    };

    const startPlayer = (player) => {
        socket.emit('start_player', { auctionId, playerId: player._id, basePrice: player.basePrice });
        setIsSidebarOpen(false);
    };

    const pickRandomPlayer = (category) => {
        const playersInSet = groupedQueue[category];
        if (!playersInSet || playersInSet.length === 0) return;
        const randomIndex = Math.floor(Math.random() * playersInSet.length);
        startPlayer(playersInSet[randomIndex]);
    };

    const resetRound = () => {
        socket.emit('reset_round', { auctionId });
    };

    const sellPlayer = () => socket.emit('sell_player', { auctionId });
    const unsellPlayer = () => socket.emit('unsell_player', { auctionId });

    const placeBid = (teamId) => {
        if (isPending) return;

        const team = data.teams.find(t => t._id === teamId);
        if (!team) return;

        // Prevent self-bidding
        if (liveState.leadingTeamId === teamId) return;

        const nextBid = liveState.leadingTeamId === null
            ? (currentPlayer?.basePrice || 0)
            : (liveState.currentBid + increment);

        if (team.budget - team.spent < nextBid) {
            alert(`Insufficient funds! ${team.name} has only ₹${team.budget - team.spent}L left.`);
            return;
        }

        setIsPending(true);
        socket.emit('place_bid', { auctionId, teamId, amount: nextBid });
        // Unlock after 1s just in case server lags
        setTimeout(() => setIsPending(false), 1000);
    };

    // --- RENDER ---
    return (
        <div className="flex h-screen bg-slate-100 font-sans overflow-hidden relative">

            {/* PAUSE OVERLAY */}
            {liveState.status === 'PAUSED' && (
                <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
                    <Pause className="w-16 h-16 text-yellow-500 mb-4 animate-pulse" />
                    <h2 className="text-4xl font-black tracking-tight">AUCTION PAUSED</h2>
                    <button onClick={togglePause} className="mt-6 bg-white text-slate-900 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-yellow-400 transition-colors shadow-lg active:scale-95">
                        <PlayCircle className="w-5 h-5" /> Resume Auction
                    </button>
                </div>
            )}

            {/* HEADER ACTIONS (Absolute Top Right) */}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
                <button onClick={copyLink} className="p-2 bg-white rounded-full shadow-md text-slate-600 hover:text-blue-600 active:scale-95 transition-transform" title="Copy Invite Link">
                    <Share2 className="w-5 h-5" />
                </button>
                {liveState.status !== 'IDLE' && (
                    <button onClick={togglePause} className="p-2 bg-white rounded-full shadow-md text-slate-600 hover:text-yellow-600 active:scale-95 transition-transform" title="Pause/Resume">
                        {liveState.status === 'PAUSED' ? <PlayCircle className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </button>
                )}
            </div>

            {/* MOBILE MENU TOGGLE */}
            <div className="md:hidden absolute top-4 left-4 z-50">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 bg-white shadow-md rounded-lg text-slate-700 border border-slate-200 active:scale-95 transition-transform"
                >
                    {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* 1. SIDEBAR */}
            <div className={`
        fixed inset-y-0 left-0 z-40 w-96 bg-white border-r border-slate-200 flex flex-col shadow-2xl transition-transform duration-300 ease-out
        md:relative md:translate-x-0 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                {/* Header */}
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center mt-14 md:mt-0">
                    <button onClick={() => setView('admin-setup')} className="text-sm text-slate-600 hover:text-blue-600 flex items-center font-bold transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Exit
                    </button>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {sidebarTab === 'teams' ? 'Team Standings' : 'Player Lists'}
                    </div>
                </div>

                {/* 4-Way Tab Switcher */}
                <div className="grid grid-cols-4 border-b border-slate-200 bg-white p-1 gap-1">
                    {[
                        { id: 'queue', icon: Play, label: 'Run' },
                        { id: 'unsold', icon: AlertCircle, label: 'Pass' },
                        { id: 'sold', icon: CheckCircle, label: 'Sold' },
                        { id: 'teams', icon: Users, label: 'Teams' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSidebarTab(tab.id)}
                            className={`flex flex-col items-center justify-center py-2 rounded-md transition-all ${sidebarTab === tab.id
                                ? 'bg-slate-100 text-blue-600 shadow-sm'
                                : 'text-slate-400 hover:bg-slate-50'
                                }`}
                        >
                            <tab.icon className="w-4 h-4 mb-0.5" />
                            <span className="text-[9px] font-bold uppercase">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Sidebar Content Area */}
                <div className="flex-1 overflow-y-auto p-3 bg-slate-50/30 space-y-4">

                    {/* VIEW: PLAYERS (Queue) */}
                    {sidebarTab === 'queue' && (
                        <>
                            {queuePlayers.length === 0 && <div className="p-8 text-center text-slate-400 text-xs italic">Queue Empty</div>}

                            {/* DYNAMIC CATEGORY LOOP */}
                            {categoryOrder.map(category => {
                                const players = groupedQueue[category];
                                if (!players || players.length === 0) return null;

                                return (
                                    <div key={category} className="flex gap-2 animate-in slide-in-from-left-2 duration-300">
                                        <button
                                            onClick={() => pickRandomPlayer(category)}
                                            className="w-8 shrink-0 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex flex-col items-center justify-center gap-2 shadow-md transition-colors active:scale-95"
                                            title={`Pick Random from ${category}`}
                                        >
                                            <Shuffle className="w-4 h-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest [writing-mode:vertical-rl] rotate-180 whitespace-nowrap py-2">
                                                {category} ({players.length})
                                            </span>
                                        </button>

                                        <div className="flex-1 space-y-2">
                                            {players.map(p => (
                                                <div key={p._id} onClick={() => startPlayer(p)} className="group p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-blue-500 hover:shadow-md transition-all relative overflow-hidden active:scale-[0.98]">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    <div className="font-bold text-slate-700 text-sm">{p.name}</div>
                                                    <div className="flex justify-between mt-1 text-[10px] font-medium text-slate-500">
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded">{p.role}</span>
                                                        <span className="font-mono text-slate-400">₹{p.basePrice}L</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {/* VIEW: UNSOLD */}
                    {sidebarTab === 'unsold' && (
                        <div className="space-y-3">
                            {/* Button to pick random unsold player */}
                            {unsoldPlayers.length > 0 && (
                                <button
                                    onClick={() => {
                                        const randomIndex = Math.floor(Math.random() * unsoldPlayers.length);
                                        startPlayer(unsoldPlayers[randomIndex]);
                                    }}
                                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                                >
                                    <Shuffle className="w-4 h-4" /> Pick Random Unsold
                                </button>
                            )}

                            {unsoldPlayers.map(p => (
                                <div key={p._id} onClick={() => startPlayer(p)} className="p-3 bg-white border border-red-200 rounded-xl cursor-pointer hover:border-red-500 active:scale-[0.98]">
                                    <div className="font-bold text-slate-700 text-sm">{p.name}</div>
                                    <span className="text-[10px] text-red-500 font-bold block mt-1">Tap to Re-Auction</span>
                                </div>
                            ))}
                            {unsoldPlayers.length === 0 && <div className="p-8 text-center text-slate-400 text-xs italic">No Unsold Players</div>}
                        </div>
                    )}

                    {/* VIEW: SOLD */}
                    {sidebarTab === 'sold' && soldPlayers.map(p => (
                        <div key={p._id} className="p-3 bg-white border border-green-200 rounded-xl opacity-80">
                            <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-[10px] text-slate-500 uppercase">{data.teams.find(t => t._id === p.soldTo)?.name}</span>
                                <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">₹{p.soldPrice}L</span>
                            </div>
                        </div>
                    ))}

                    {/* VIEW: TEAMS DETAIL */}
                    {sidebarTab === 'teams' && data.teams.map(team => {
                        const percentUsed = (team.spent / team.budget) * 100;
                        return (
                            <div key={team._id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-slate-800 text-sm">{team.name}</span>
                                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">{team.players.length} Players</span>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                                        <span>Used: ₹{team.spent}L</span>
                                        <span>Total: ₹{team.budget}L</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${percentUsed}%`, backgroundColor: team.color }}
                                        ></div>
                                    </div>
                                    <div className="text-right text-[10px] font-bold text-green-600">
                                        Rem: ₹{team.budget - team.spent}L
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* 2. MAIN CONTENT */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 relative w-full">

                {/* IDLE SCREEN */}
                {!currentPlayer && (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 ring-4 ring-slate-50">
                            <Clock className="w-8 h-8 text-slate-300" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-600">Ready</h2>
                        <p className="text-slate-400 text-sm mt-2">Pick a player or use the randomizer button.</p>
                    </div>
                )}

                {/* ACTIVE AUCTION SCREEN */}
                {currentPlayer && (
                    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-3 md:p-4 overflow-hidden">

                        {/* --- TOP: INFO CARD --- */}
                        <div className="shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200 p-3 md:p-4 mb-3 flex flex-col md:flex-row items-center gap-4 relative overflow-hidden mt-12 md:mt-0">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse"></div>

                            <div className="flex items-center gap-3 w-full md:w-auto flex-1">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0 shadow-inner border border-blue-100">
                                    <User className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-lg md:text-2xl font-extrabold text-slate-800 truncate">{currentPlayer.name}</h1>
                                    <div className="flex gap-2 text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-600">{currentPlayer.role}</span>
                                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-600">{currentPlayer.category}</span>
                                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">Base: ₹{currentPlayer.basePrice}L</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 bg-slate-50 px-5 py-2 rounded-xl border border-slate-100 w-full md:w-auto shadow-inner">
                                <div>
                                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Current Bid</div>
                                    <div className="text-3xl font-mono font-black text-blue-600 tracking-tighter">₹{liveState.currentBid}L</div>
                                </div>
                                {liveState.leadingTeamId && (
                                    <div className="text-right border-l pl-4 border-slate-200">
                                        <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Leader</div>
                                        <div className="font-bold text-slate-800 truncate max-w-[120px] text-sm md:text-base">
                                            {data.teams.find(t => t._id === liveState.leadingTeamId)?.name}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- MIDDLE: BIDDING CONSOLE --- */}
                        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col min-h-0 overflow-hidden relative">

                            {/* Header */}
                            <div className="flex justify-between items-center mb-4 shrink-0 z-10">
                                <div className="flex items-center gap-2 font-bold text-slate-700 text-sm md:text-base">
                                    <Gavel className="w-4 h-4 text-slate-400" /> Bidding Paddles
                                </div>

                                <div className="flex gap-2">
                                    {/* Undo Button */}
                                    <button
                                        onClick={undoBid}
                                        disabled={!liveState.leadingTeamId}
                                        className="flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-200 disabled:opacity-50 transition-colors active:scale-95"
                                    >
                                        <RotateCcw className="w-4 h-4" /> Undo
                                    </button>

                                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                                        <button onClick={() => setIncrement(Math.max(1, increment - 5))} className="p-1.5 hover:bg-white rounded-md text-slate-500 active:scale-90 transition-transform"><Minus className="w-3 h-3" /></button>
                                        <span className="px-2 font-mono font-bold text-sm w-12 text-center text-slate-700">₹{increment}</span>
                                        <button onClick={() => setIncrement(increment + 5)} className="p-1.5 hover:bg-white rounded-md text-slate-500 active:scale-90 transition-transform"><Plus className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            </div>

                            {/* Grid Wrapper */}
                            <div className="flex-1 overflow-y-auto flex flex-col justify-center w-full px-2">
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 w-full max-w-6xl mx-auto align-middle p-2">
                                    {data.teams.map(team => {
                                        const nextBidAmount = liveState.leadingTeamId === null ? currentPlayer.basePrice : liveState.currentBid + increment;
                                        const canAfford = (team.budget - team.spent) >= nextBidAmount;
                                        const isLeader = liveState.leadingTeamId === team._id;
                                        const remaining = team.budget - team.spent;

                                        return (
                                            <button
                                                key={team._id}
                                                onClick={() => placeBid(team._id)}
                                                // DISABLED IF: 
                                                // 1. Cannot afford
                                                // 2. Already leading (Prevent Holding click)
                                                // 3. System is pending previous click (Prevent Double click)
                                                disabled={!canAfford || isLeader || isPending}
                                                className={`
                          aspect-square
                          relative flex flex-col justify-center items-center text-center p-3 rounded-2xl transition-all duration-200 ease-out
                          border border-white/20 shadow-md
                          ${(canAfford && !isLeader && !isPending)
                                                        ? 'active:scale-95 cursor-pointer hover:shadow-xl hover:scale-105 hover:z-20'
                                                        : 'opacity-50 grayscale cursor-not-allowed'}
                          ${isLeader ? 'ring-4 ring-offset-2 ring-yellow-400 z-10 scale-[1.05] shadow-2xl' : ''}
                        `}
                                                style={{
                                                    backgroundColor: team.color,
                                                    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.05) 100%)'
                                                }}
                                            >
                                                <div className="font-black text-sm md:text-xl text-white leading-tight drop-shadow-md w-full break-words mb-3 px-1">
                                                    {team.name}
                                                </div>

                                                <div className={`
                          w-full max-w-[80%] py-1.5 rounded-lg font-mono font-bold text-xs md:text-lg shadow-lg border-b-2 transition-colors
                          ${isLeader ? 'bg-yellow-300 text-yellow-900 border-yellow-500 animate-pulse' : 'bg-white/95 text-slate-900 border-white/50'}
                        `}>
                                                    {isLeader ? 'HOLDING' : `₹${nextBidAmount}L`}
                                                </div>

                                                <div className="absolute bottom-3 text-[9px] md:text-[10px] font-bold text-white/90 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                                                    <Wallet className="w-3 h-3" /> ₹{remaining}L
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100 shrink-0 z-10 bg-white">
                                <button
                                    onClick={sellPlayer}
                                    disabled={!liveState.leadingTeamId}
                                    className={`
                    py-3 rounded-xl font-black text-base md:text-lg shadow-md flex items-center justify-center gap-2 text-white transition-all active:scale-95
                    ${liveState.leadingTeamId ? 'bg-green-600 hover:bg-green-700 hover:shadow-green-500/30' : 'bg-slate-300 cursor-not-allowed'}
                  `}
                                >
                                    <CheckCircle className="w-5 h-5" /> SOLD
                                </button>
                                <button
                                    onClick={unsellPlayer}
                                    className="bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 py-3 rounded-xl font-black text-base md:text-lg shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                                >
                                    <AlertCircle className="w-5 h-5" /> UNSOLD
                                </button>
                            </div>

                        </div>
                    </div>
                )}

                {/* --- 3. RESULT OVERLAY --- */}
                {(liveState.status === 'SOLD' || liveState.status === 'UNSOLD') && currentPlayer && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 text-center border border-slate-200 max-w-sm w-full animate-in zoom-in-95 duration-300 relative overflow-hidden">

                            {liveState.status === 'SOLD' ? (
                                <>
                                    <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                        <Trophy className="w-8 h-8 text-green-600 animate-bounce" />
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-1">{currentPlayer.name} Sold!</h2>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-6 mt-3 shadow-inner">
                                        <div className="text-xs text-slate-400 font-bold uppercase">Buyer</div>
                                        <div className="text-lg font-bold text-slate-900">{data.teams.find(t => t._id === liveState.leadingTeamId)?.name}</div>
                                        <div className="text-2xl font-mono font-black text-green-600 mt-1">₹{liveState.currentBid}L</div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                        <AlertCircle className="w-8 h-8 text-red-600" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800 mb-2">Unsold</h2>
                                    <p className="text-slate-500 mb-6 text-sm">Player passed to next round.</p>
                                </>
                            )}

                            <button
                                onClick={resetRound}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg"
                            >
                                <RefreshCcw className="w-4 h-4" /> Next Player
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}