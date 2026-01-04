import React, { useState, useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
    Trophy, Users, List, Gavel, DollarSign, TrendingUp,
    CheckCircle, AlertCircle, Clock, Pause, Mic2, LogIn,
    Filter, ChevronRight, Music
} from 'lucide-react';

// --- SOUND ASSETS ---
const SOUNDS = {
    sold: new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'),
    kaChing: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
    bid: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
};

export default function ViewerScreen({ data, liveState, setView, config }) {
    const [activeTab, setActiveTab] = useState('live');
    const [viewStatus, setViewStatus] = useState('OPEN');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Animation Refs
    const prevStatusRef = useRef(liveState?.status);
    const prevBidRef = useRef(liveState?.currentBid);

    // --- EFFECTS ---
    useEffect(() => {
        const currentStatus = liveState?.status;
        const currentBid = liveState?.currentBid;

        if (currentStatus === 'SOLD' && prevStatusRef.current !== 'SOLD') {
            triggerCelebration();
        }
        if (currentStatus === 'ACTIVE' && currentBid > prevBidRef.current && prevBidRef.current > 0) {
            playSound('bid');
        }

        prevStatusRef.current = currentStatus;
        prevBidRef.current = currentBid;
    }, [liveState]);

    const triggerCelebration = () => {
        playSound('kaChing');
        setTimeout(() => playSound('sold'), 300);

        const duration = 3000;
        const end = Date.now() + duration;
        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#22c55e', '#eab308', '#ffffff'] });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#22c55e', '#eab308', '#ffffff'] });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    };

    const playSound = (type) => {
        try {
            const sound = SOUNDS[type];
            if (sound) {
                sound.currentTime = 0;
                sound.volume = 0.5;
                sound.play().catch(e => { });
            }
        } catch (e) { console.error(e); }
    };

    // --- DATA HELPERS ---
    const safePlayers = data?.players || [];
    const safeTeams = data?.teams || [];

    const categories = useMemo(() => {
        if (config?.categories?.length) return ['All', ...config.categories];
        if (safePlayers.length === 0) return ['All'];
        const cats = new Set(safePlayers.map(p => p.category || 'Uncategorized'));
        return ['All', ...cats];
    }, [safePlayers, config]);

    const getCleanSquad = (team) => {
        if (!team || !team.players) return [];
        const uniqueMap = new Map();

        team.players.forEach(entry => {
            let player = null;
            if (entry && typeof entry === 'object' && entry._id) {
                player = entry;
            } else if (typeof entry === 'string') {
                player = safePlayers.find(p => p._id === entry);
            }
            if (player && player._id) {
                uniqueMap.set(player._id, player);
            }
        });

        return Array.from(uniqueMap.values());
    };

    if (!data || !data.players) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 mr-3"></div>
            Loading...
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col relative pb-24 md:pb-0">

            {/* DESKTOP HEADER */}
            <div className="hidden md:block bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center px-6 h-16">
                    <div className="flex gap-8 h-full">
                        <NavButton active={activeTab === 'live'} onClick={() => setActiveTab('live')} icon={Gavel} label="Live Auction" isLive={liveState?.status === 'ACTIVE'} />
                        <NavButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={Users} label="Teams" />
                        <NavButton active={activeTab === 'players'} onClick={() => setActiveTab('players')} icon={List} label="Players" />
                        <NavButton active={activeTab === 'sold'} onClick={() => setActiveTab('sold')} icon={DollarSign} label="Feed" />
                    </div>
                    <button onClick={() => setView('login')} className="text-xs font-bold text-slate-500 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                        Admin
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto min-h-full">

                    {/* LIVE TAB */}
                    {activeTab === 'live' && <LiveAuctionView data={data} liveState={liveState} />}

                    {/* TEAMS TAB */}
                    {activeTab === 'teams' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {safeTeams.map((team) => {
                                const cleanSquad = getCleanSquad(team);
                                // DYNAMIC SPENT CALCULATION
                                const realSpent = cleanSquad.reduce((total, p) => total + (p.soldPrice || 0), 0);
                                const realRemaining = team.budget - realSpent;

                                return (
                                    <div key={team._id} className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col h-[500px]">
                                        <div className="p-5 relative shrink-0" style={{ backgroundColor: team.color }}>
                                            <h3 className="text-2xl font-black text-white drop-shadow-md relative z-10">{team.name}</h3>
                                            <div className="text-white/80 text-xs font-bold uppercase mt-1 relative z-10">{cleanSquad.length} Players</div>
                                            <Trophy className="absolute -right-4 -top-4 w-24 h-24 text-white opacity-20 rotate-12" />
                                        </div>
                                        <div className="p-3 bg-slate-950/30 border-b border-slate-800 flex justify-between items-center text-sm shrink-0">
                                            <div className="font-bold text-slate-400">Purse Left: <span className={realRemaining < 0 ? "text-red-500" : "text-green-400"}>₹{realRemaining}L</span></div>
                                            <div className="font-bold text-slate-400">Spent: <span className="text-blue-400">₹{realSpent}L</span></div>
                                        </div>

                                        <div className="p-4 flex-1 bg-slate-900 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-transparent">
                                            {cleanSquad.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs border-2 border-dashed border-slate-800 rounded-xl">
                                                    <Users className="w-6 h-6 mb-2 opacity-50" />
                                                    No players purchased yet.
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {cleanSquad.map(p => (
                                                        <div key={p._id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors">
                                                            <div>
                                                                <div className="font-bold text-slate-200 text-sm">{p.name}</div>
                                                                <div className="text-[10px] text-slate-500 uppercase font-bold">{p.role}</div>
                                                            </div>
                                                            <div className="font-mono text-green-400 text-xs font-bold bg-green-900/20 px-2 py-1 rounded">₹{p.soldPrice}L</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* PLAYERS TAB */}
                    {activeTab === 'players' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-slate-900/50 p-2 rounded-2xl border border-slate-800 backdrop-blur-sm sticky top-0 z-30">
                                <div className="flex gap-1 bg-slate-900 p-1 rounded-xl w-full md:w-auto">
                                    {['OPEN', 'SOLD', 'UNSOLD', 'ALL'].map(status => (
                                        <button key={status} onClick={() => setViewStatus(status)} className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${viewStatus === status ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{status}</button>
                                    ))}
                                </div>
                                <div className="w-full md:w-auto overflow-x-auto pb-1 no-scrollbar">
                                    <div className="flex gap-2">
                                        {categories.map(cat => (
                                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 text-[10px] font-bold rounded-full whitespace-nowrap border transition-all ${selectedCategory === cat ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-500 border-slate-700'}`}>{cat}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {safePlayers
                                    .filter(p => {
                                        if (viewStatus === 'OPEN') return !p.isSold && !p.isUnsold;
                                        if (viewStatus === 'SOLD') return p.isSold;
                                        if (viewStatus === 'UNSOLD') return p.isUnsold;
                                        return true;
                                    })
                                    .filter(p => selectedCategory === 'All' || p.category === selectedCategory)
                                    .map(p => {
                                        const soldToTeam = p.isSold ? safeTeams.find(t => t._id === p.soldTo) : null;
                                        return (
                                            <div key={p._id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-slate-600 transition-all relative group">
                                                {p.isSold && <div className="absolute top-3 right-3 text-green-500"><CheckCircle className="w-4 h-4" /></div>}
                                                <div className="mb-3">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{p.category} • {p.role}</span>
                                                    <h3 className={`text-base font-bold leading-tight ${p.isUnsold ? 'text-slate-500 line-through' : 'text-white'}`}>{p.name}</h3>
                                                </div>
                                                <div className="pt-3 border-t border-slate-800 flex justify-between items-end">
                                                    <div>
                                                        {p.isSold ? <div className="text-xs font-bold text-white truncate max-w-[100px]" style={{ color: soldToTeam?.color }}>{soldToTeam?.name}</div>
                                                            : p.isUnsold ? <div className="text-red-500 text-[10px] font-bold bg-red-500/10 px-2 py-0.5 rounded">UNSOLD</div>
                                                                : <div className="text-blue-400 text-[10px] font-bold bg-blue-500/10 px-2 py-0.5 rounded">OPEN</div>}
                                                    </div>
                                                    <div className={`font-mono font-bold ${p.isSold ? 'text-green-400 text-sm' : 'text-slate-500 text-xs'}`}>₹{p.isSold ? p.soldPrice : p.basePrice}L</div>
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    )}

                    {/* FEED TAB */}
                    {activeTab === 'sold' && (
                        <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 max-w-3xl mx-auto">
                            <div className="p-4 border-b border-slate-800 font-bold text-sm text-slate-400">Live Feed</div>
                            <div className="divide-y divide-slate-800">
                                {[...safePlayers].reverse().filter(p => p.isSold).map(p => {
                                    const team = safeTeams.find(t => t._id === p.soldTo);
                                    return (
                                        <div key={p._id} className="p-4 flex justify-between items-center hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">{p.name.charAt(0)}</div>
                                                <div><div className="font-bold text-sm text-slate-200">{p.name}</div><div className="text-[10px] text-slate-500">{p.role}</div></div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold px-2 py-0.5 rounded text-white inline-block mb-0.5" style={{ backgroundColor: team?.color || '#555' }}>{team?.name}</div>
                                                <div className="text-green-400 font-mono font-bold text-sm">₹{p.soldPrice}L</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* === MOBILE BOTTOM NAV (With Admin Button) === */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 z-50 flex justify-around p-2 pb-6 safe-area-bottom">
                <MobileNavButton active={activeTab === 'live'} onClick={() => setActiveTab('live')} icon={Gavel} label="Live" isLive={liveState?.status === 'ACTIVE'} />
                <MobileNavButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={Users} label="Teams" />
                <MobileNavButton active={activeTab === 'players'} onClick={() => setActiveTab('players')} icon={List} label="Pool" />
                <MobileNavButton active={activeTab === 'sold'} onClick={() => setActiveTab('sold')} icon={DollarSign} label="Sold" />

                {/* --- HOST LOGIN BUTTON --- */}
                <button onClick={() => setView('login')} className="flex flex-col items-center justify-center w-full py-1 rounded-xl transition-all active:scale-95 text-slate-500 hover:text-white">
                    <div className="relative">
                        <LogIn className="w-5 h-5 mb-0.5" />
                    </div>
                    <span className="text-[10px] font-bold">Admin</span>
                </button>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function NavButton({ active, onClick, icon: Icon, label, isLive }) {
    return (
        <button onClick={onClick} className={`flex items-center px-4 h-full border-b-2 font-bold transition-all text-sm ${active ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            <Icon className={`w-4 h-4 mr-2 ${isLive ? 'text-red-500 animate-pulse' : ''}`} />
            {label}
            {isLive && <span className="ml-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />}
        </button>
    );
}

function MobileNavButton({ active, onClick, icon: Icon, label, isLive }) {
    return (
        <button onClick={onClick} className={`flex flex-col items-center justify-center w-full py-1 rounded-xl transition-all active:scale-95 ${active ? 'text-blue-400' : 'text-slate-500'}`}>
            <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isLive ? 'text-red-500 animate-pulse' : ''}`} />
                {isLive && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 border-2 border-slate-950 rounded-full" />}
            </div>
            <span className="text-[10px] font-bold">{label}</span>
        </button>
    );
}

function LiveAuctionView({ data, liveState }) {
    const currentPlayer = liveState?.currentPlayerId ? data.players.find(p => p._id === liveState.currentPlayerId) : null;
    const leadingTeam = liveState?.leadingTeamId ? data.teams.find(t => t._id === liveState.leadingTeamId) : null;

    if (liveState?.status === 'PAUSED') {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] bg-slate-900/50 rounded-3xl border border-slate-800">
                <Pause className="w-16 h-16 text-yellow-500 mb-4 opacity-50" />
                <h2 className="text-2xl font-bold text-white">Paused</h2>
            </div>
        );
    }

    if ((liveState?.status === 'SOLD' || liveState?.status === 'UNSOLD') && currentPlayer) {
        const isSold = liveState.status === 'SOLD';
        return (
            <div className="relative flex flex-col items-center justify-center min-h-[60vh] w-full overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl animate-in zoom-in duration-300">
                <div className={`absolute inset-0 opacity-20 ${isSold ? 'bg-gradient-to-b from-green-600 to-slate-950' : 'bg-gradient-to-b from-red-600 to-slate-950'}`}></div>
                <div className="relative z-10 text-center">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-2 drop-shadow-2xl">{currentPlayer.name}</h2>
                    <div className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-8">{currentPlayer.role}</div>

                    <div className={`text-6xl md:text-9xl font-black transform -rotate-6 ${isSold ? 'text-green-500 drop-shadow-[0_0_25px_rgba(34,197,94,0.5)]' : 'text-red-500'}`}>
                        {isSold ? 'SOLD' : 'UNSOLD'}
                    </div>

                    {isSold && (
                        <div className="mt-12 bg-slate-950/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 inline-block min-w-[300px] shadow-2xl">
                            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-2">Acquired By</div>
                            <div className="text-2xl font-black text-white mb-2" style={{ color: leadingTeam?.color }}>{leadingTeam?.name}</div>
                            <div className="text-4xl font-mono font-bold text-green-400">₹{liveState.currentBid}L</div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (liveState?.status === 'ACTIVE' && currentPlayer) {
        return (
            <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[60vh] items-stretch">
                <div className="lg:w-1/3 relative group">
                    <div className="absolute inset-0 bg-blue-500/10 rounded-[2rem] blur-2xl"></div>
                    <div className="relative h-full bg-slate-900 rounded-[2rem] border border-slate-800 p-8 flex flex-col justify-between shadow-2xl">
                        <div>
                            <span className="inline-block px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-blue-500/30">{currentPlayer.category}</span>
                            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2">{currentPlayer.name}</h1>
                            <div className="text-xl font-bold text-slate-500 uppercase tracking-widest">{currentPlayer.role}</div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-slate-800">
                            <div className="text-slate-500 text-xs font-bold uppercase mb-1">Base Price</div>
                            <div className="text-4xl font-mono font-bold text-white">₹{currentPlayer.basePrice}L</div>
                        </div>
                    </div>
                </div>

                <div className="lg:w-2/3 flex flex-col gap-4">
                    <div className={`relative flex-1 rounded-[2rem] p-8 flex flex-col items-center justify-center shadow-2xl border transition-all duration-300 ${leadingTeam ? 'bg-slate-900 border-slate-700' : 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800'}`}>
                        {leadingTeam && (<div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at center, ${leadingTeam.color}, transparent 70%)` }}></div>)}

                        <div className="relative z-10 flex items-center gap-2 mb-8">
                            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
                            <span className="text-red-500 font-bold uppercase tracking-[0.2em] text-xs">Live Bidding</span>
                        </div>

                        <div className="relative z-10 text-7xl md:text-9xl font-black font-mono text-white drop-shadow-2xl mb-8 flex items-baseline">
                            <span className="text-4xl text-slate-600 mr-2">₹</span>{liveState.currentBid}<span className="text-2xl text-slate-600 ml-2">L</span>
                        </div>

                        <div className="relative z-10 w-full max-w-md">
                            {leadingTeam ? (
                                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg" style={{ backgroundColor: leadingTeam.color }}>{leadingTeam.name.charAt(0)}</div>
                                        <div>
                                            <div className="text-slate-500 text-[10px] font-bold uppercase">Current Leader</div>
                                            <div className="text-xl font-bold text-white">{leadingTeam.name}</div>
                                        </div>
                                    </div>
                                    <TrendingUp className="text-green-500 w-6 h-6" />
                                </div>
                            ) : (
                                <div className="text-center text-slate-600 text-sm font-bold uppercase animate-pulse">Waiting for bids...</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-[50vh] bg-slate-900 rounded-[2.5rem] border border-slate-800">
            <Mic2 className="w-12 h-12 text-slate-700 mb-4" />
            <h2 className="text-2xl font-bold text-slate-500">Waiting for Auctioneer</h2>
        </div>
    );
}