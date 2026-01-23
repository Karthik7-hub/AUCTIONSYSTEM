import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
    Trophy, Users, List, Gavel, DollarSign, TrendingUp,
    CheckCircle, Pause, Mic2, LogIn, ChevronRight,
    X, Wallet, UserCheck, Shield, Activity, Target
} from 'lucide-react';

// --- ASSETS & CONSTANTS ---
const SOUND_URLS = {
    sold: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
    kaChing: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
    bid: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
};

const ROLE_ICONS = {
    'Batsman': <Target className="w-3 h-3" />,
    'Bowler': <Activity className="w-3 h-3" />,
    'All Rounder': <Shield className="w-3 h-3" />,
    'Wicket Keeper': <UserCheck className="w-3 h-3" />,
    'default': <Users className="w-3 h-3" />
};

export default function ViewerScreen({ data, liveState, setView, config }) {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState('live');
    const [viewStatus, setViewStatus] = useState('OPEN');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedTeam, setSelectedTeam] = useState(null);

    // --- REFS (State Tracking) ---
    const prevStatusRef = useRef(liveState?.status);
    const prevBidRef = useRef(liveState?.currentBid);
    const lastCelebrationRef = useRef(0);
    const audioUnlockedRef = useRef(false);
    const audioInstancesRef = useRef({});

    // --- ⚡ PERFORMANCE: MEMOIZED LOOKUPS (O(1) Access) ---
    // Instead of .find() every render, we build maps once when data changes.

    const safePlayers = useMemo(() => data?.players || [], [data?.players]);
    const safeTeams = useMemo(() => data?.teams || [], [data?.teams]);

    const playerMap = useMemo(() =>
        new Map(safePlayers.map(p => [p._id, p])),
        [safePlayers]);

    const teamMap = useMemo(() =>
        new Map(safeTeams.map(t => [t._id, t])),
        [safeTeams]);

    // Pre-calculate squads to avoid filtering on every render
    const squadMap = useMemo(() => {
        const map = new Map();
        safeTeams.forEach(team => {
            const squad = (team.players || []).map(entry => {
                const id = typeof entry === 'object' ? entry._id : entry;
                return playerMap.get(id);
            }).filter(Boolean);
            map.set(team._id, squad);
        });
        return map;
    }, [safeTeams, playerMap]);

    const categories = useMemo(() => {
        if (config?.categories?.length) return ['All', ...config.categories];
        if (safePlayers.length === 0) return ['All'];
        const cats = new Set(safePlayers.map(p => p.category || 'Uncategorized'));
        return ['All', ...cats];
    }, [safePlayers, config]);

    // --- 🔊 AUDIO ENGINE (Mobile Safe) ---
    useEffect(() => {
        // Initialize Audio Objects
        Object.entries(SOUND_URLS).forEach(([key, url]) => {
            audioInstancesRef.current[key] = new Audio(url);
        });
    }, []);

    const unlockAudio = useCallback(() => {
        if (audioUnlockedRef.current) return;

        // Play and immediately pause all sounds to unlock AudioContext on mobile
        Object.values(audioInstancesRef.current).forEach(audio => {
            audio.volume = 0;
            audio.play().catch(() => { });
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 0.5; // Reset volume
        });
        audioUnlockedRef.current = true;
    }, []);

    // Unlock on first interaction
    useEffect(() => {
        const handleInteraction = () => unlockAudio();
        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);
        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
    }, [unlockAudio]);

    const playSound = useCallback((type) => {
        const sound = audioInstancesRef.current[type];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.warn('Audio blocked:', e));
        }
    }, []);

    // --- EFFECTS & ANIMATION ---
    const triggerCelebration = useCallback(() => {
        // Throttle confetti to prevent frame drops on low-end devices
        const now = Date.now();
        if (now - lastCelebrationRef.current < 2000) return;
        lastCelebrationRef.current = now;

        playSound('kaChing');
        setTimeout(() => playSound('sold'), 300);

        const duration = 3000;
        const end = Date.now() + duration;
        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#22c55e', '#eab308', '#ffffff'] });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#22c55e', '#eab308', '#ffffff'] });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }, [playSound]);

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
    }, [liveState, playSound, triggerCelebration]);

    // --- RENDER HELPERS ---
    if (!data || !data.players) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 mr-3"></div>
            Loading Resources...
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col relative pb-24 md:pb-0">

            {/* DESKTOP HEADER */}
            <header className="hidden md:block bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center px-6 h-16">
                    <nav className="flex gap-8 h-full">
                        <NavButton active={activeTab === 'live'} onClick={() => setActiveTab('live')} icon={Gavel} label="Live Auction" isLive={liveState?.status === 'ACTIVE'} />
                        <NavButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={Users} label="Teams" />
                        <NavButton active={activeTab === 'players'} onClick={() => setActiveTab('players')} icon={List} label="Players" />
                        <NavButton active={activeTab === 'sold'} onClick={() => setActiveTab('sold')} icon={DollarSign} label="Feed" />
                    </nav>
                    <button onClick={() => setView('login')} className="text-xs font-bold text-slate-500 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        Admin Login
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto min-h-full">

                    {/* LIVE TAB */}
                    {activeTab === 'live' && (
                        <LiveAuctionView
                            liveState={liveState}
                            playerMap={playerMap}
                            teamMap={teamMap}
                        />
                    )}

                    {/* TEAMS TAB */}
                    {activeTab === 'teams' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {safeTeams.map((team) => {
                                const cleanSquad = squadMap.get(team._id) || [];
                                const realSpent = cleanSquad.reduce((total, p) => total + (p.soldPrice || 0), 0);
                                const realRemaining = team.budget - realSpent;

                                return (
                                    <div
                                        key={team._id}
                                        onClick={() => setSelectedTeam(team)}
                                        onKeyDown={(e) => e.key === 'Enter' && setSelectedTeam(team)}
                                        tabIndex="0" // ♿ Accessibility: Keyboard Focus
                                        role="button"
                                        aria-label={`View details for ${team.name}`}
                                        className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col h-[500px] cursor-pointer hover:border-slate-600 hover:scale-[1.01] transition-all duration-300 group focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <div className="p-5 relative shrink-0 transition-colors" style={{ backgroundColor: team.color }}>
                                            <h3 className="text-2xl font-black text-white drop-shadow-md relative z-10">{team.name}</h3>
                                            <div className="text-white/80 text-xs font-bold uppercase mt-1 relative z-10 flex items-center gap-1">
                                                {cleanSquad.length} Players
                                                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                                            </div>
                                            <Trophy className="absolute -right-4 -top-4 w-24 h-24 text-white opacity-20 rotate-12" />
                                        </div>

                                        <div className="p-3 bg-slate-950/30 border-b border-slate-800 flex justify-between items-center text-sm shrink-0">
                                            <div className="font-bold text-slate-400">Purse: <span className={realRemaining < 0 ? "text-red-500" : "text-green-400"}>₹{realRemaining}L</span></div>
                                            <div className="font-bold text-slate-400">Spent: <span className="text-blue-400">₹{realSpent}L</span></div>
                                        </div>

                                        <div className="p-4 flex-1 bg-slate-900 overflow-y-auto pointer-events-none">
                                            {cleanSquad.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs border-2 border-dashed border-slate-800 rounded-xl">
                                                    <Users className="w-6 h-6 mb-2 opacity-50" />
                                                    Empty Squad
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {cleanSquad.map(p => (
                                                        <div key={p._id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-slate-500">{ROLE_ICONS[p.role] || ROLE_ICONS['default']}</div>
                                                                <div>
                                                                    <div className="font-bold text-slate-200 text-sm">{p.name}</div>
                                                                    <div className="text-[10px] text-slate-500 uppercase font-bold">{p.role}</div>
                                                                </div>
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
                                        const soldToTeam = p.isSold ? teamMap.get(p.soldTo) : null;
                                        return (
                                            <div key={p._id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-slate-600 transition-all relative group">
                                                {p.isSold && <div className="absolute top-3 right-3 text-green-500"><CheckCircle className="w-4 h-4" /></div>}
                                                <div className="mb-3">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                                        {ROLE_ICONS[p.role] || ROLE_ICONS['default']}
                                                        {p.category} • {p.role}
                                                    </span>
                                                    <h3 className={`text-base font-bold leading-tight mt-1 ${p.isUnsold ? 'text-slate-500 line-through' : 'text-white'}`}>{p.name}</h3>
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
                                    const team = teamMap.get(p.soldTo);
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
            </main>

            {/* --- TEAM DETAIL MODAL POPUP --- */}
            {selectedTeam && (
                <TeamDetailModal
                    team={selectedTeam}
                    squad={squadMap.get(selectedTeam._id) || []}
                    onClose={() => setSelectedTeam(null)}
                />
            )}

            {/* === MOBILE BOTTOM NAV === */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 z-50 flex justify-around p-2 pb-6 safe-area-bottom">
                <MobileNavButton active={activeTab === 'live'} onClick={() => setActiveTab('live')} icon={Gavel} label="Live" isLive={liveState?.status === 'ACTIVE'} />
                <MobileNavButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={Users} label="Teams" />
                <MobileNavButton active={activeTab === 'players'} onClick={() => setActiveTab('players')} icon={List} label="Pool" />
                <MobileNavButton active={activeTab === 'sold'} onClick={() => setActiveTab('sold')} icon={DollarSign} label="Sold" />
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

function TeamDetailModal({ team, squad, onClose }) {
    const realSpent = useMemo(() => squad.reduce((total, p) => total + (p.soldPrice || 0), 0), [squad]);
    const realRemaining = team.budget - realSpent;

    // Composition Calculation
    const composition = useMemo(() => {
        const counts = { Batsman: 0, Bowler: 0, 'All Rounder': 0, 'Wicket Keeper': 0 };
        squad.forEach(p => {
            if (counts[p.role] !== undefined) counts[p.role]++;
        });
        return counts;
    }, [squad]);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); }
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            {/* Modal Content */}
            <div className="relative bg-slate-900 w-full max-w-2xl max-h-[85vh] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="relative p-6 shrink-0" style={{ backgroundColor: team.color }}>
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors" aria-label="Close Modal">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                            <Trophy className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 id="modal-title" className="text-3xl font-black text-white drop-shadow-md">{team.name}</h2>
                            <div className="text-white/80 font-bold text-sm uppercase tracking-wider">Team Overview</div>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 divide-x divide-slate-800 bg-slate-950 border-b border-slate-800 shrink-0">
                    <div className="p-4 text-center">
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                            <UserCheck className="w-3 h-3" /> Players
                        </div>
                        <div className="text-2xl font-black text-white">{squad.length}</div>
                    </div>
                    <div className="p-4 text-center">
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                            <Wallet className="w-3 h-3" /> Purse Left
                        </div>
                        <div className={`text-2xl font-black font-mono ${realRemaining < 0 ? 'text-red-500' : 'text-green-400'}`}>
                            {realRemaining}L
                        </div>
                    </div>
                    <div className="p-4 text-center">
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Total Spent
                        </div>
                        <div className="text-2xl font-black font-mono text-blue-400">{realSpent}L</div>
                    </div>
                </div>

                {/* 📊 VISUAL COMPOSITION BAR */}
                <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex gap-2">
                    {Object.entries(composition).map(([role, count]) => {
                        if (count === 0) return null;
                        const colorMap = { 'Batsman': 'bg-blue-500', 'Bowler': 'bg-green-500', 'All Rounder': 'bg-purple-500', 'Wicket Keeper': 'bg-yellow-500' };
                        return (
                            <div key={role} className="flex-1 flex flex-col gap-1">
                                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                                    <span>{role.split(' ')[0]}</span>
                                    <span>{count}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${colorMap[role] || 'bg-slate-500'}`} style={{ width: '100%' }}></div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Squad List */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-900">
                    <div className="text-slate-400 font-bold text-xs uppercase mb-3 px-2">Acquired Players</div>
                    {squad.length === 0 ? (
                        <div className="h-40 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl m-2">
                            <Users className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-sm font-bold">No players bought yet</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {squad.map((p, idx) => (
                                <div key={p._id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-800/50 hover:bg-slate-800 hover:border-slate-700 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="text-slate-500 font-mono text-xs font-bold w-4">{idx + 1}</div>
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                                            {ROLE_ICONS[p.role] || <Users className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="text-white font-bold text-sm">{p.name}</div>
                                            <div className="text-slate-500 text-[10px] uppercase font-bold">{p.category} • {p.role}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-green-400 font-mono font-bold">₹{p.soldPrice}L</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500 font-bold uppercase shrink-0">
                    {team.budget}L Initial Budget
                </div>
            </div>
        </div>
    );
}

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

function LiveAuctionView({ liveState, playerMap, teamMap }) {
    const currentPlayer = liveState?.currentPlayerId ? playerMap.get(liveState.currentPlayerId) : null;
    const leadingTeam = liveState?.leadingTeamId ? teamMap.get(liveState.leadingTeamId) : null;

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
                    <div className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-8 flex items-center justify-center gap-2">
                        {ROLE_ICONS[currentPlayer.role] || ROLE_ICONS['default']}
                        {currentPlayer.role}
                    </div>

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
                            <div className="text-xl font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                {ROLE_ICONS[currentPlayer.role]} {currentPlayer.role}
                            </div>
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

                        {/* ARIA Live Region for accessibility announcements of bid changes */}
                        <div role="status" aria-live="polite" className="relative z-10 text-7xl md:text-9xl font-black font-mono text-white drop-shadow-2xl mb-8 flex items-baseline">
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