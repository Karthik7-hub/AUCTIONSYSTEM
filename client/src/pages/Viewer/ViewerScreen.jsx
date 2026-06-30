import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
    Trophy, Users, List, Gavel, DollarSign, TrendingUp,
    CheckCircle, Pause, Mic2, LogIn, ChevronRight,
    X, Wallet, UserCheck, Shield, Activity, Target
} from 'lucide-react';
import Button from '@components/ui/Button';
import Badge from '@components/ui/Badge';
import Loader from '@components/ui/Loader';
import Modal from '@components/ui/Modal';

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
        Object.entries(SOUND_URLS).forEach(([key, url]) => {
            audioInstancesRef.current[key] = new Audio(url);
        });
    }, []);

    const unlockAudio = useCallback(() => {
        if (audioUnlockedRef.current) return;

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

    if (!data || !data.players) return (
        <Loader message="Loading Resources..." fullScreen />
    );

    return (
        <div className="viewer-screen theme-dark">

            {/* DESKTOP HEADER */}
            <header className="viewer-header md-block hidden">
                <div className="viewer-header-content">
                    <nav className="viewer-desktop-nav">
                        <NavButton active={activeTab === 'live'} onClick={() => setActiveTab('live')} icon={Gavel} label="Live Auction" isLive={liveState?.status === 'ACTIVE'} />
                        <NavButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={Users} label="Teams" />
                        <NavButton active={activeTab === 'players'} onClick={() => setActiveTab('players')} icon={List} label="Players" />
                        <NavButton active={activeTab === 'sold'} onClick={() => setActiveTab('sold')} icon={DollarSign} label="Feed" />
                    </nav>
                    <Button onClick={() => setView('login')} variant="secondary" style={{ padding: 'var(--space-1.5) var(--space-3)', fontSize: 'var(--text-xs)' }}>
                        Admin Login
                    </Button>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="viewer-main-content">
                <div className="container viewer-main-content-container">

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
                        <div className="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-3 gap-6">
                            {safeTeams.map((team) => {
                                const cleanSquad = squadMap.get(team._id) || [];
                                const realSpent = cleanSquad.reduce((total, p) => total + (p.soldPrice || 0), 0);
                                const realRemaining = team.budget - realSpent;

                                return (
                                    <div
                                        key={team._id}
                                        onClick={() => setSelectedTeam(team)}
                                        onKeyDown={(e) => e.key === 'Enter' && setSelectedTeam(team)}
                                        tabIndex="0"
                                        role="button"
                                        aria-label={`View details for ${team.name}`}
                                        className="card viewer-team-item"
                                        style={{ height: '500px', padding: 0 }}
                                    >
                                        <div className="viewer-team-card-header" style={{ backgroundColor: team.color }}>
                                            <h3 className="viewer-team-card-title">{team.name}</h3>
                                            <div className="viewer-team-card-subtitle">
                                                {cleanSquad.length} Players
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                            <Trophy className="viewer-team-card-trophy-glow" />
                                        </div>

                                        <div className="viewer-team-card-purse-row">
                                            <div className="font-bold" style={{ color: 'var(--text-secondary-dark)' }}>Purse: <span style={{ color: realRemaining < 0 ? 'var(--red-500)' : 'var(--green-500)' }}>₹{realRemaining}L</span></div>
                                            <div className="font-bold" style={{ color: 'var(--text-secondary-dark)' }}>Spent: <span style={{ color: 'var(--blue-500)' }}>₹{realSpent}L</span></div>
                                        </div>

                                        <div className="viewer-team-card-players-list">
                                            {cleanSquad.length === 0 ? (
                                                <div className="viewer-team-card-players-empty">
                                                    <Users className="w-6 h-6 mb-2 opacity-50" />
                                                    Empty Squad
                                                </div>
                                            ) : (
                                                cleanSquad.map(p => (
                                                    <div key={p._id} className="viewer-team-card-player-row">
                                                        <div className="viewer-team-card-player-info">
                                                            <div style={{ color: 'var(--text-secondary-dark)' }}>{ROLE_ICONS[p.role] || ROLE_ICONS['default']}</div>
                                                            <div>
                                                                <div className="viewer-team-card-player-name">{p.name}</div>
                                                                <div className="viewer-team-card-player-role">{p.role}</div>
                                                            </div>
                                                        </div>
                                                        <div className="viewer-team-card-player-price">₹{p.soldPrice}L</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* PLAYERS TAB */}
                    {activeTab === 'players' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                            <div className="viewer-pool-sticky-header">
                                <div className="nav-tabs" style={{ width: '100%' }}>
                                    {['OPEN', 'SOLD', 'UNSOLD', 'ALL'].map(status => (
                                        <button key={status} onClick={() => setViewStatus(status)} className={`nav-tab-btn ${viewStatus === status ? 'nav-tab-btn-active' : ''}`} style={{ flex: 1, justifyContent: 'center' }}>{status}</button>
                                    ))}
                                </div>
                                <div className="filters-strip" style={{ margin: 0, padding: 0 }}>
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`filter-btn ${selectedCategory === cat ? 'filter-btn-active' : ''}`}
                                            style={selectedCategory === cat ? { backgroundColor: 'var(--text-primary-dark)', color: 'var(--slate-950)' } : { backgroundColor: 'transparent', borderColor: 'var(--border-dark)', color: 'var(--text-secondary-dark)' }}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-4 gap-4">
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
                                            <div key={p._id} className="card player-item-card" style={{ padding: 'var(--space-4)' }}>
                                                {p.isSold && <div className="viewer-pool-check-icon"><CheckCircle className="w-4 h-4" /></div>}
                                                <div className="viewer-pool-card-header">
                                                    <span className="viewer-pool-card-header-badge">
                                                        {ROLE_ICONS[p.role] || ROLE_ICONS['default']}
                                                        {p.category} • {p.role}
                                                    </span>
                                                    <h3 className={`viewer-pool-card-title ${p.isUnsold ? 'text-slate-500 line-through' : ''}`}>{p.name}</h3>
                                                </div>
                                                <div className="viewer-pool-card-footer">
                                                    <div>
                                                        {p.isSold ? <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: soldToTeam?.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{soldToTeam?.name}</div>
                                                            : p.isUnsold ? <Badge variant="danger">UNSOLD</Badge>
                                                                : <Badge variant="success" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)', color: 'var(--blue-500)' }}>OPEN</Badge>}
                                                    </div>
                                                    <div className="font-mono" style={{ fontWeight: 'bold', fontSize: p.isSold ? 'var(--text-sm)' : 'var(--text-xs)', color: p.isSold ? 'var(--green-500)' : 'var(--text-muted-dark)' }}>₹{p.isSold ? p.soldPrice : p.basePrice}L</div>
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    )}

                    {/* FEED TAB */}
                    {activeTab === 'sold' && (
                        <div className="card viewer-feed-card">
                            <div className="viewer-feed-header">Live Feed</div>
                            <div className="flex-col">
                                {[...safePlayers].reverse().filter(p => p.isSold).map(p => {
                                    const team = teamMap.get(p.soldTo);
                                    return (
                                        <div key={p._id} className="viewer-feed-row tr-hover">
                                            <div className="viewer-feed-row-inner">
                                                <div className="viewer-feed-avatar">{p.name.charAt(0)}</div>
                                                <div><div className="viewer-team-card-player-name">{p.name}</div><div style={{ fontSize: '10px', color: 'var(--text-muted-dark)' }}>{p.role}</div></div>
                                            </div>
                                            <div className="text-center" style={{ textAlign: 'right' }}>
                                                <div className="viewer-feed-badge-val" style={{ backgroundColor: team?.color || '#555' }}>{team?.name}</div>
                                                <div className="viewer-feed-price">₹{p.soldPrice}L</div>
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
            <div className="viewer-mobile-bottom-nav">
                <MobileNavButton active={activeTab === 'live'} onClick={() => setActiveTab('live')} icon={Gavel} label="Live" isLive={liveState?.status === 'ACTIVE'} />
                <MobileNavButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={Users} label="Teams" />
                <MobileNavButton active={activeTab === 'players'} onClick={() => setActiveTab('players')} icon={List} label="Pool" />
                <MobileNavButton active={activeTab === 'sold'} onClick={() => setActiveTab('sold')} icon={DollarSign} label="Sold" />
                <button onClick={() => setView('login')} className="viewer-mobile-nav-btn">
                    <LogIn className="w-5 h-5" style={{ marginBottom: '2px' }} />
                    <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Admin</span>
                </button>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function TeamDetailModal({ team, squad, onClose }) {
    const realSpent = useMemo(() => squad.reduce((total, p) => total + (p.soldPrice || 0), 0), [squad]);
    const realRemaining = team.budget - realSpent;

    const composition = useMemo(() => {
        const counts = { Batsman: 0, Bowler: 0, 'All Rounder': 0, 'Wicket Keeper': 0 };
        squad.forEach(p => {
            if (counts[p.role] !== undefined) counts[p.role]++;
        });
        return counts;
    }, [squad]);

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            maxWidth="42rem"
            bannerColor={team.color}
            title={
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                        <div className="viewer-modal-avatar-glow">
                            <Trophy className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: '900', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{team.name}</h2>
                            <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', fontSize: 'var(--text-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Team Overview</div>
                        </div>
                    </div>
                </>
            }
        >
            {/* Stats Row */}
            <div className="modal-stats-grid">
                <div className="modal-stat-col">
                    <div className="modal-stat-label">
                        <UserCheck className="w-3 h-3" /> Players
                    </div>
                    <div className="modal-stat-value">{squad.length}</div>
                </div>
                <div className="modal-stat-col">
                    <div className="modal-stat-label">
                        <Wallet className="w-3 h-3" /> Purse Left
                    </div>
                    <div className="modal-stat-value mono" style={{ color: realRemaining < 0 ? 'var(--red-500)' : 'var(--green-500)' }}>
                        {realRemaining}L
                    </div>
                </div>
                <div className="modal-stat-col">
                    <div className="modal-stat-label">
                        <TrendingUp className="w-3 h-3" /> Total Spent
                    </div>
                    <div className="modal-stat-value mono" style={{ color: 'var(--blue-500)' }}>{realSpent}L</div>
                </div>
            </div>

            {/* Composition progress bars */}
            <div className="viewer-modal-bar-counts">
                {Object.entries(composition).map(([role, count]) => {
                    if (count === 0) return null;
                    const colorMap = { 'Batsman': 'var(--blue-500)', 'Bowler': 'var(--green-500)', 'All Rounder': 'var(--purple-650)', 'Wicket Keeper': 'var(--yellow-500)' };
                    return (
                        <div key={role} className="viewer-modal-bar-col">
                            <div className="viewer-modal-bar-label">
                                <span>{role.split(' ')[0]}</span>
                                <span>{count}</span>
                            </div>
                            <div className="progress-bar-bg" style={{ height: '6px' }}>
                                <div className="progress-bar-fill" style={{ width: '100%', backgroundColor: colorMap[role] || 'var(--slate-500)' }}></div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Squad List */}
            <div className="modal-body" style={{ backgroundColor: 'var(--slate-900)', padding: 'var(--space-4) 0' }}>
                <div className="viewer-modal-list-header">Acquired Players</div>
                {squad.length === 0 ? (
                    <div style={{ height: '10rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted-dark)', border: '2px dashed var(--border-dark)', borderRadius: 'var(--radius-xl)', margin: 'var(--space-2)' }}>
                        <Users className="w-8 h-8 mb-2 opacity-50" />
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>No players bought yet</span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '30vh', overflowY: 'auto', padding: '0 var(--space-4)' }}>
                        {squad.map((p, idx) => (
                            <div key={p._id} className="viewer-modal-player-row tr-hover">
                                <div className="viewer-modal-player-row-left">
                                    <div className="viewer-modal-idx">{idx + 1}</div>
                                    <div className="viewer-modal-icon-bg">
                                        {ROLE_ICONS[p.role] || <Users className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <div className="viewer-modal-player-title">{p.name}</div>
                                        <div className="viewer-modal-player-subtitle">{p.category} • {p.role}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: 'var(--green-500)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>₹{p.soldPrice}L</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--slate-950)', borderTop: '1px solid var(--border-dark)', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted-dark)', fontWeight: 'bold', textTransform: 'uppercase', flexShrink: 0 }}>
                {team.budget}L Initial Budget
            </div>
        </Modal>
    );
}

function NavButton({ active, onClick, icon: Icon, label, isLive }) {
    return (
        <button onClick={onClick} className={`nav-tab-btn ${active ? 'nav-tab-btn-active' : ''}`} style={active ? { borderBottomColor: 'var(--blue-500)', borderRadius: 0, padding: '0 var(--space-4)', backgroundColor: 'transparent', boxShadow: 'none' } : { borderRadius: 0, padding: '0 var(--space-4)', backgroundColor: 'transparent', boxShadow: 'none' }}>
            <Icon className={`w-4 h-4 ${isLive ? 'text-red-500 animate-pulse' : ''}`} style={{ marginRight: 'var(--space-2)' }} />
            {label}
            {isLive && <span className="animate-ping" style={{ marginLeft: 'var(--space-2)', width: '6px', height: '6px', backgroundColor: 'var(--red-500)', borderRadius: 'var(--radius-full)' }} />}
        </button>
    );
}

function MobileNavButton({ active, onClick, icon: Icon, label, isLive }) {
    return (
        <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: 'var(--space-1) 0', borderRadius: 'var(--radius-xl)', color: active ? 'var(--blue-500)' : 'var(--text-muted-dark)' }}>
            <div style={{ position: 'relative' }}>
                <Icon className={`w-5 h-5 ${isLive ? 'text-red-500 animate-pulse' : ''}`} style={{ marginBottom: '2px' }} />
                {isLive && <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: 'var(--red-500)', border: '2px solid var(--slate-950)', borderRadius: 'var(--radius-full)' }} />}
            </div>
            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{label}</span>
        </button>
    );
}

function LiveAuctionView({ liveState, playerMap, teamMap }) {
    const currentPlayer = liveState?.currentPlayerId ? playerMap.get(liveState.currentPlayerId) : null;
    const leadingTeam = liveState?.leadingTeamId ? teamMap.get(liveState.leadingTeamId) : null;

    if (liveState?.status === 'PAUSED') {
        return (
            <div className="live-auction-card">
                <Pause className="pause-overlay-icon" style={{ opacity: 0.5 }} />
                <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: '#ffffff' }}>Paused</h2>
            </div>
        );
    }

    if ((liveState?.status === 'SOLD' || liveState?.status === 'UNSOLD') && currentPlayer) {
        const isSold = liveState.status === 'SOLD';
        return (
            <div className="live-auction-card animate-zoom-in" style={{ minHeight: '60vh', padding: 'var(--space-8)' }}>
                <div className="viewer-live-sold-passed-glow" style={{ background: isSold ? 'linear-gradient(to bottom, var(--green-600), var(--slate-950))' : 'linear-gradient(to bottom, var(--red-600), var(--slate-950))' }}></div>
                <div className="viewer-live-sold-passed-box">
                    <h2 className="viewer-live-sold-passed-name">{currentPlayer.name}</h2>
                    <div className="viewer-live-sold-passed-meta">
                        {ROLE_ICONS[currentPlayer.role] || ROLE_ICONS['default']}
                        {currentPlayer.role}
                    </div>

                    <div className="viewer-live-sold-passed-stamp" style={{ color: isSold ? 'var(--green-500)' : 'var(--red-500)', textShadow: isSold ? '0 0 25px rgba(34, 197, 94, 0.5)' : 'none' }}>
                        {isSold ? 'SOLD' : 'UNSOLD'}
                    </div>

                    {isSold && (
                        <div className="viewer-live-sold-buyer-box">
                            <div className="viewer-live-sold-buyer-label">Acquired By</div>
                            <div className="viewer-live-sold-buyer-name" style={{ color: leadingTeam?.color }}>{leadingTeam?.name}</div>
                            <div className="viewer-live-sold-buyer-price">₹{liveState.currentBid}L</div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (liveState?.status === 'ACTIVE' && currentPlayer) {
        return (
            <div className="viewer-live-arena">
                <div className="viewer-live-arena-left">
                    <div className="viewer-live-arena-left-blur-glow"></div>
                    <div className="viewer-live-card-container">
                        <div>
                            <span className="viewer-live-category-badge">{currentPlayer.category}</span>
                            <h1 className="viewer-live-player-title">{currentPlayer.name}</h1>
                            <div className="viewer-live-role-subtitle">
                                {ROLE_ICONS[currentPlayer.role]} {currentPlayer.role}
                            </div>
                        </div>
                        <div className="viewer-live-base-row">
                            <div className="viewer-live-base-label">Base Price</div>
                            <div className="viewer-live-base-val">₹{currentPlayer.basePrice}L</div>
                        </div>
                    </div>
                </div>

                <div className="viewer-live-arena-right">
                    <div className="live-auction-card" style={{ flex: 1, padding: 'var(--space-8)' }}>
                        {leadingTeam && (<div className="viewer-live-right-glow-bg" style={{ background: `radial-gradient(circle at center, ${leadingTeam.color}, transparent 70%)` }}></div>)}

                        <div className="viewer-live-indicator-row">
                            <span className="viewer-live-indicator-glow"><span className="viewer-live-indicator-ping"></span><span className="viewer-live-indicator-dot"></span></span>
                            <span className="viewer-live-bids-label">Live Bidding</span>
                        </div>

                        <div role="status" aria-live="polite" className="viewer-live-current-bid-row">
                            <span className="viewer-live-current-bid-curr">₹</span>{liveState.currentBid}<span className="viewer-live-current-bid-unit">L</span>
                        </div>

                        <div className="viewer-live-leader-wrapper">
                            {leadingTeam ? (
                                <div className="viewer-live-leader-card">
                                    <div className="viewer-live-leader-card-left">
                                        <div className="viewer-live-leader-avatar" style={{ backgroundColor: leadingTeam.color }}>{leadingTeam.name.charAt(0)}</div>
                                        <div>
                                            <div className="viewer-live-leader-label">Current Leader</div>
                                            <div className="viewer-live-leader-name">{leadingTeam.name}</div>
                                        </div>
                                    </div>
                                    <TrendingUp className="text-green-500 w-6 h-6" />
                                </div>
                            ) : (
                                <div className="text-center animate-pulse" style={{ color: 'var(--text-muted-dark)', fontWeight: 'bold', textTransform: 'uppercase' }}>Waiting for bids...</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="live-auction-card">
            <Mic2 className="w-12 h-12" style={{ color: 'var(--text-muted-dark)', marginBottom: 'var(--space-4)' }} />
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: 'var(--text-muted-dark)' }}>Waiting for Auctioneer</h2>
        </div>
    );
}
