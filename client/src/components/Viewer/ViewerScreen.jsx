import React, { useState, useEffect, useMemo } from 'react';
// Added 'LogIn' to imports
import { Trophy, Users, List, Gavel, DollarSign, TrendingUp, Shield, CheckCircle, AlertCircle, Clock, Filter, Grid, Sparkles, Zap, Mic2, LogIn } from 'lucide-react';

// Added setView to props
export default function ViewerScreen({ data, liveState, setView }) {
    const [activeTab, setActiveTab] = useState('live');
    const [viewStatus, setViewStatus] = useState('OPEN');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // --- DATA HELPERS ---
    const safePlayers = data?.players || [];
    const safeTeams = data?.teams || [];

    const categories = useMemo(() => {
        if (safePlayers.length === 0) return ['All'];
        const cats = new Set(safePlayers.map(p => p.category || 'Uncategorized'));
        return ['All', ...cats];
    }, [safePlayers]);

    const getCleanSquad = (team) => {
        if (!team.players) return [];
        const uniqueMap = new Map();
        team.players.forEach(entry => {
            let player = null;
            if (typeof entry === 'object' && entry !== null) player = entry;
            else if (typeof entry === 'string') player = safePlayers.find(p => p._id === entry);
            if (player && player._id) uniqueMap.set(player._id, player);
        });
        return Array.from(uniqueMap.values());
    };

    if (!data || !data.players) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 mr-3"></div>
            Loading Auction Data...
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col pb-24 md:pb-0">

            {/* DESKTOP NAV */}
            <div className="hidden md:block bg-slate-800/90 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-center gap-8 relative">
                    <NavButton active={activeTab === 'live'} onClick={() => setActiveTab('live')} icon={Gavel} label="Live Auction" isLive={liveState?.status === 'ACTIVE'} />
                    <NavButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={Users} label="Teams & Stats" />
                    <NavButton active={activeTab === 'players'} onClick={() => setActiveTab('players')} icon={List} label="Player Pool" />
                    <NavButton active={activeTab === 'sold'} onClick={() => setActiveTab('sold')} icon={DollarSign} label="Sold Feed" />

                    {/* Desktop Login Button (Right Aligned) */}
                    <div className="absolute right-0 top-0 h-full flex items-center pr-4">
                        <button
                            onClick={() => setView('login')}
                            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors bg-slate-700/50 hover:bg-blue-600 px-3 py-1.5 rounded-lg"
                        >
                            <LogIn className="w-4 h-4" /> Admin
                        </button>
                    </div>
                </div>
            </div>

            {/* MOBILE NAV (Bottom) */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-50 flex justify-around p-2 pb-5 safe-area-bottom shadow-2xl">
                <MobileNavButton active={activeTab === 'live'} onClick={() => setActiveTab('live')} icon={Gavel} label="Live" isLive={liveState?.status === 'ACTIVE'} />
                <MobileNavButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={Users} label="Teams" />
                <MobileNavButton active={activeTab === 'players'} onClick={() => setActiveTab('players')} icon={List} label="Players" />
                <MobileNavButton active={activeTab === 'sold'} onClick={() => setActiveTab('sold')} icon={DollarSign} label="Sold" />

                {/* Mobile Login Button */}
                <button onClick={() => setView('login')} className="flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all active:scale-95 text-slate-600 hover:text-white">
                    <LogIn className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold">Login</span>
                </button>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto">

                    {/* === LIVE TAB === */}
                    {activeTab === 'live' && <LiveAuctionView data={data} liveState={liveState} />}

                    {/* === TEAMS TAB === */}
                    {activeTab === 'teams' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {safeTeams.map((team) => {
                                const cleanSquad = getCleanSquad(team);
                                return (
                                    <div key={team._id} className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-xl flex flex-col">
                                        <div className="p-5 relative" style={{ backgroundColor: team.color }}>
                                            <h3 className="text-2xl font-bold text-white drop-shadow-md relative z-10">{team.name}</h3>
                                            <div className="flex items-center text-white/90 text-sm mt-1 relative z-10 font-medium">
                                                <Users className="w-4 h-4 mr-1" /> {cleanSquad.length} Players
                                            </div>
                                            <Trophy className="absolute -right-4 -top-4 w-24 h-24 text-white opacity-20 rotate-12" />
                                        </div>
                                        <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                                            <div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Purse Left</div>
                                                <div className="text-xl font-bold text-green-400">₹{team.budget - team.spent} L</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Spent</div>
                                                <div className="text-xl font-bold text-red-400">₹{team.spent} L</div>
                                            </div>
                                        </div>
                                        <div className="p-4 flex-1 bg-slate-800/50">
                                            <div className="text-xs text-slate-500 uppercase font-bold mb-3">Squad List</div>
                                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                                {cleanSquad.length === 0 ? (
                                                    <p className="text-slate-600 text-sm italic text-center py-4">No players yet.</p>
                                                ) : (
                                                    cleanSquad.map(p => (
                                                        <div key={p._id} className="flex justify-between items-center bg-slate-700/30 p-2.5 rounded-lg border border-slate-700/50">
                                                            <div>
                                                                <div className="font-bold text-slate-200 text-sm">{p.name}</div>
                                                                <div className="text-[10px] text-slate-400 uppercase">{p.role}</div>
                                                            </div>
                                                            <div className="font-mono text-green-400 text-xs bg-green-900/20 px-2 py-1 rounded">₹{p.soldPrice}L</div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* === PLAYER POOL TAB === */}
                    {activeTab === 'players' && (
                        <div className="space-y-6">
                            <div className="sticky top-[-1rem] md:static z-40 bg-slate-900/95 backdrop-blur-md py-3 -mx-4 px-4 border-b border-slate-800 md:border-none md:p-0 md:mx-0 md:bg-transparent">
                                <div className="grid grid-cols-4 gap-2 md:flex md:w-auto">
                                    <FilterButton label="Open" active={viewStatus === 'OPEN'} onClick={() => setViewStatus('OPEN')} colorClass="bg-blue-600 text-white" />
                                    <FilterButton label="Sold" active={viewStatus === 'SOLD'} onClick={() => setViewStatus('SOLD')} colorClass="bg-green-600 text-white" />
                                    <FilterButton label="Unsold" active={viewStatus === 'UNSOLD'} onClick={() => setViewStatus('UNSOLD')} colorClass="bg-red-600 text-white" />
                                    <FilterButton label="All" active={viewStatus === 'ALL'} onClick={() => setViewStatus('ALL')} colorClass="bg-slate-700 text-white" />
                                </div>
                                {categories.length > 1 && (
                                    <div className="flex overflow-x-auto gap-2 mt-3 pb-1 no-scrollbar md:hidden">
                                        {categories.map(cat => (
                                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1 text-xs rounded-full border whitespace-nowrap ${selectedCategory === cat ? 'bg-slate-700 text-white border-slate-600' : 'text-slate-500 border-slate-800'}`}>
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="hidden md:flex flex-wrap gap-2">
                                <span className="text-slate-500 text-sm font-bold py-1.5 mr-2">Category:</span>
                                {categories.map(cat => (
                                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${selectedCategory === cat ? 'bg-white text-slate-900 border-white' : 'text-slate-400 border-slate-700 hover:border-slate-500'}`}>
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                                            <div key={p._id} className={`relative p-5 rounded-2xl border transition-all ${p.isSold ? 'bg-slate-800 border-slate-700' : p.isUnsold ? 'bg-red-900/5 border-red-900/20' : 'bg-slate-800 border-slate-700'}`}>
                                                {p.isSold && <div className="absolute top-4 right-4 text-green-500"><CheckCircle className="w-6 h-6" /></div>}
                                                <div className="flex gap-2 mb-3">
                                                    <span className="px-2 py-1 bg-slate-900 rounded-md text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.role}</span>
                                                    <span className="px-2 py-1 bg-slate-900/50 rounded-md text-[10px] text-slate-500 font-medium truncate max-w-[100px]">{p.category}</span>
                                                </div>
                                                <h3 className={`text-xl font-bold mb-4 leading-tight ${p.isUnsold ? 'text-slate-600 line-through' : 'text-white'}`}>{p.name}</h3>
                                                <div className="pt-4 border-t border-slate-700/50 flex justify-between items-end">
                                                    <div>
                                                        {p.isSold ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-slate-500 uppercase font-bold">Sold To</span>
                                                                <span className="text-sm font-bold" style={{ color: soldToTeam?.color || '#fff' }}>{soldToTeam?.name || 'Unknown'}</span>
                                                            </div>
                                                        ) : p.isUnsold ? (
                                                            <div className="text-red-500/50 text-xs font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> UNSOLD</div>
                                                        ) : (
                                                            <div className="text-blue-400 text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> OPEN</div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] text-slate-500 uppercase font-bold">{p.isSold ? 'Sold Price' : 'Base Price'}</div>
                                                        <div className={`text-lg font-mono font-bold ${p.isSold ? 'text-green-400' : 'text-yellow-500'}`}>₹{p.isSold ? p.soldPrice : p.basePrice}L</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* === SOLD FEED TAB === */}
                    {activeTab === 'sold' && (
                        <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-xl border border-slate-700">
                            <div className="p-4 bg-slate-900/50 border-b border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider">Live Transfer Feed</div>
                            <div className="divide-y divide-slate-700">
                                {[...safePlayers].reverse().filter(p => p.isSold).map(p => {
                                    const team = safeTeams.find(t => t._id === p.soldTo);
                                    return (
                                        <div key={p._id} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold">{p.name.charAt(0)}</div>
                                                <div>
                                                    <div className="font-bold text-slate-200">{p.name}</div>
                                                    <div className="text-xs text-slate-500">{p.role}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-bold mb-1 px-2 py-0.5 rounded text-white inline-block" style={{ backgroundColor: team?.color || '#555' }}>{team?.name || 'Unknown'}</div>
                                                <div className="text-green-400 font-mono font-bold">₹{p.soldPrice}L</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// === HELPER COMPONENTS ===
function FilterButton({ label, active, onClick, colorClass }) {
    return (
        <button onClick={onClick} className={`rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all transform active:scale-95 ${active ? `${colorClass} shadow-lg ring-1 ring-white/20` : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'}`}>
            {label}
        </button>
    );
}

function NavButton({ active, onClick, icon: Icon, label, isLive }) {
    return (
        <button onClick={onClick} className={`flex items-center px-4 py-4 border-b-2 font-bold transition-all ${active ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            <Icon className={`w-5 h-5 mr-2 ${isLive ? 'text-red-500 animate-pulse' : ''}`} />
            {label}
            {isLive && <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
        </button>
    );
}

function MobileNavButton({ active, onClick, icon: Icon, label, isLive }) {
    return (
        <button onClick={onClick} className={`flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all active:scale-95 ${active ? 'text-blue-400 bg-slate-800' : 'text-slate-500'}`}>
            <div className="relative">
                <Icon className={`w-6 h-6 mb-1 ${isLive ? 'text-red-500 animate-pulse' : ''}`} />
                {isLive && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-slate-800 rounded-full" />}
            </div>
            <span className="text-[10px] font-bold">{label}</span>
        </button>
    );
}

// === LIVE AUCTION VIEW (Unchanged from your snippet but required for context) ===
function LiveAuctionView({ data, liveState }) {
    // ... [Copy the LiveAuctionView function from your original code here, or use the one in previous answers] ...
    const currentPlayer = liveState?.currentPlayerId ? data.players.find(p => p._id === liveState.currentPlayerId) : null;
    const leadingTeam = liveState?.leadingTeamId ? data.teams.find(t => t._id === liveState.leadingTeamId) : null;

    if ((liveState?.status === 'SOLD' || liveState?.status === 'UNSOLD') && currentPlayer) {
        const isSold = liveState.status === 'SOLD';
        return (
            <div className="relative flex flex-col items-center justify-center min-h-[70vh] w-full overflow-hidden rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl">
                <div className={`absolute inset-0 opacity-20 ${isSold ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500 via-slate-900 to-slate-900' : 'bg-slate-900'}`}></div>
                <div className="relative z-10 flex flex-col items-center text-center p-8 animate-in zoom-in duration-500">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">{currentPlayer.name}</h2>
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-sm md:text-base mb-8">{currentPlayer.role}</span>
                    <div className="relative mb-10">
                        <div className={`text-[4rem] md:text-[8rem] font-black leading-none transform -rotate-6 border-8 px-8 py-2 rounded-xl border-double shadow-2xl backdrop-blur-sm ${isSold ? 'text-yellow-400 border-yellow-500 bg-yellow-900/20 shadow-yellow-500/20' : 'text-red-500 border-red-600 bg-red-900/20'}`}>
                            {isSold ? 'SOLD' : 'UNSOLD'}
                        </div>
                    </div>
                    {isSold ? (
                        <div className="bg-slate-800/80 backdrop-blur-md p-6 md:p-10 rounded-3xl border border-slate-600 shadow-2xl flex flex-col gap-4 min-w-[300px]">
                            <div>
                                <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Purchased By</div>
                                <div className="text-2xl md:text-4xl font-black text-white px-4 py-2 rounded-lg shadow-inner" style={{ backgroundColor: leadingTeam?.color }}>{leadingTeam?.name}</div>
                            </div>
                            <div className="h-px bg-slate-600 w-full"></div>
                            <div>
                                <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Final Price</div>
                                <div className="text-4xl md:text-6xl font-mono font-bold text-green-400 drop-shadow-lg">₹{liveState.currentBid}L</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-500 text-xl font-medium bg-slate-800/50 px-8 py-4 rounded-full border border-slate-700">Pass to next round</div>
                    )}
                </div>
            </div>
        );
    }

    if (liveState?.status === 'ACTIVE' && currentPlayer) {
        return (
            <div className="flex flex-col lg:flex-row gap-4 h-full min-h-[70vh]">
                <div className="w-full lg:w-5/12 relative group perspective">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-[2.5rem] transform translate-y-2 translate-x-2 blur-xl"></div>
                    <div className="relative h-full bg-slate-800 rounded-[2rem] overflow-hidden border border-slate-600 shadow-2xl flex flex-col">
                        <div className="absolute top-0 w-full h-40 bg-gradient-to-b from-slate-700 to-transparent opacity-50"></div>
                        <div className="relative z-10 p-8 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex gap-2 mb-4">
                                    <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/30">{currentPlayer.category}</span>
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.9] mb-4 drop-shadow-xl tracking-tight">
                                    {currentPlayer.name.split(' ').map((word, i) => (<span key={i} className="block">{word}</span>))}
                                </h1>
                                <div className="text-2xl font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">{currentPlayer.role}</div>
                            </div>
                            <div className="mt-auto">
                                <div className="text-slate-400 text-sm font-bold uppercase mb-1">Base Price</div>
                                <div className="text-4xl font-mono font-bold text-white">₹{currentPlayer.basePrice}L</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-full lg:w-7/12 flex flex-col gap-4">
                    <div className={`relative flex-1 rounded-[2rem] p-8 md:p-12 flex flex-col items-center justify-center shadow-2xl border transition-colors duration-500 overflow-hidden ${leadingTeam ? 'bg-slate-900 border-slate-700' : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700'}`}>
                        {leadingTeam && (<div className="absolute inset-0 opacity-20 transition-colors duration-700" style={{ background: `radial-gradient(circle at center, ${leadingTeam.color}, transparent 70%)` }}></div>)}
                        <div className="relative z-10 flex items-center gap-3 mb-8">
                            <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
                            <span className="text-red-500 font-bold uppercase tracking-[0.2em] text-sm">Live Bidding</span>
                        </div>
                        <div className="relative z-10 text-[6rem] md:text-[10rem] font-black font-mono leading-none tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-8">
                            <span className="text-4xl md:text-6xl text-slate-500 mr-2">₹</span>{liveState.currentBid}<span className="text-2xl md:text-4xl text-slate-500 ml-2">L</span>
                        </div>
                        <div className="relative z-10 w-full max-w-lg">
                            {leadingTeam ? (
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-bottom-4 duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl shadow-lg flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: leadingTeam.color }}>{leadingTeam.name.charAt(0)}</div>
                                        <div>
                                            <div className="text-slate-300 text-xs font-bold uppercase">Current Leader</div>
                                            <div className="text-2xl font-bold text-white truncate max-w-[150px] md:max-w-none">{leadingTeam.name}</div>
                                        </div>
                                    </div>
                                    <TrendingUp className="text-green-400 w-8 h-8" />
                                </div>
                            ) : (
                                <div className="text-center p-6 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 font-bold uppercase tracking-wider animate-pulse">Waiting for Opening Bid</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-[60vh] relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[500px] h-[500px] border border-slate-800 rounded-full animate-[ping_3s_linear_infinite] opacity-20"></div>
                <div className="w-[300px] h-[300px] border border-slate-700 rounded-full animate-[ping_3s_linear_infinite_1s] opacity-30 absolute"></div>
            </div>
            <div className="relative z-10 bg-slate-800 p-8 rounded-full shadow-2xl border border-slate-700 mb-8"><Mic2 className="w-16 h-16 text-blue-500 animate-pulse" /></div>
            <h2 className="relative z-10 text-3xl md:text-5xl font-black text-white tracking-tight mb-2">Auction Floor</h2>
            <div className="relative z-10 flex items-center gap-2 text-blue-400 font-mono text-sm bg-blue-900/20 px-4 py-2 rounded-full border border-blue-500/20">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                WAITING FOR AUCTIONEER
            </div>
        </div>
    );
}