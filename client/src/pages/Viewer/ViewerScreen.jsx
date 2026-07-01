import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
    Trophy, Users, List, Gavel, DollarSign, TrendingUp,
    CheckCircle, Pause, Mic2, LogIn, ChevronRight, ChevronDown, ChevronUp,
    X, Wallet, UserCheck, Shield, Activity, Target, ListFilter
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

const getContrastColor = (hexColor) => {
    if (!hexColor || hexColor.charAt(0) !== '#') return '#ffffff';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

export default function ViewerScreen({ data, liveState, setView, config }) {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState('live');
    const [viewStatus, setViewStatus] = useState('OPEN');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [feedSort, setFeedSort] = useState('recent');
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

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
    const isCompleted = config?.status === 'completed' || config?.isActive === false;

    // Calculate Completed Statistics
    const soldPlayersList = useMemo(() => safePlayers.filter(p => p.isSold), [safePlayers]);
    const unsoldPlayersList = useMemo(() => safePlayers.filter(p => p.isUnsold), [safePlayers]);
    const soldCount = soldPlayersList.length;
    const unsoldCount = unsoldPlayersList.length;
    const totalSpent = useMemo(() => soldPlayersList.reduce((sum, p) => sum + (p.soldPrice || 0), 0), [soldPlayersList]);

    const sortedFeedPlayers = useMemo(() => {
        const soldPlayers = safePlayers.filter(p => p.isSold);
        if (feedSort === 'recent') {
            return [...soldPlayers].reverse();
        }
        if (feedSort === 'oldest') {
            return [...soldPlayers];
        }
        if (feedSort === 'price-desc') {
            return [...soldPlayers].sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0));
        }
        if (feedSort === 'price-asc') {
            return [...soldPlayers].sort((a, b) => (a.soldPrice || 0) - (b.soldPrice || 0));
        }
        if (feedSort === 'name-asc') {
            return [...soldPlayers].sort((a, b) => a.name.localeCompare(b.name));
        }
        return soldPlayers;
    }, [safePlayers, feedSort]);

    const spenderTeam = useMemo(() => {
        if (safeTeams.length === 0) return null;
        return [...safeTeams].sort((a, b) => {
            const aSquad = squadMap.get(a._id) || [];
            const bSquad = squadMap.get(b._id) || [];
            const aSpent = aSquad.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
            const bSpent = bSquad.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
            return bSpent - aSpent;
        })[0];
    }, [safeTeams, squadMap]);

    const spenderSpent = useMemo(() => {
        if (!spenderTeam) return 0;
        return (squadMap.get(spenderTeam._id) || []).reduce((sum, p) => sum + (p.soldPrice || 0), 0);
    }, [spenderTeam, squadMap]);

    const mostExpensivePlayer = useMemo(() => {
        if (soldPlayersList.length === 0) return null;
        return [...soldPlayersList].sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0))[0];
    }, [soldPlayersList]);

    const buyerTeam = useMemo(() => {
        if (!mostExpensivePlayer) return null;
        return teamMap.get(mostExpensivePlayer.soldTo);
    }, [mostExpensivePlayer, teamMap]);

    const largestSquadTeam = useMemo(() => {
        if (safeTeams.length === 0) return null;
        return [...safeTeams].sort((a, b) => {
            const aLen = (squadMap.get(a._id) || []).length;
            const bLen = (squadMap.get(b._id) || []).length;
            return bLen - aLen;
        })[0];
    }, [safeTeams, squadMap]);

    const largestSquadCount = useMemo(() => {
        if (!largestSquadTeam) return 0;
        return (squadMap.get(largestSquadTeam._id) || []).length;
    }, [largestSquadTeam, squadMap]);

    const topPurchases = useMemo(() => {
        return [...soldPlayersList].sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0)).slice(0, 5);
    }, [soldPlayersList]);
    return (
        <div className="viewer-screen theme-dark">

            {/* DESKTOP HEADER */}
            <header className="viewer-header md-block hidden">
                <div className="viewer-header-content">
                    <nav className="viewer-desktop-nav">
                        <NavButton 
                            active={activeTab === 'live'} 
                            onClick={() => setActiveTab('live')} 
                            icon={isCompleted ? Trophy : Gavel} 
                            label={isCompleted ? "Tournament Results" : "Live Auction"} 
                            isLive={!isCompleted && liveState?.status === 'ACTIVE'} 
                        />
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
                        isCompleted ? (
                            <TournamentResultsView
                                safeTeams={safeTeams}
                                safePlayers={safePlayers}
                                squadMap={squadMap}
                                teamMap={teamMap}
                                spenderTeam={spenderTeam}
                                spenderSpent={spenderSpent}
                                mostExpensivePlayer={mostExpensivePlayer}
                                buyerTeam={buyerTeam}
                                largestSquadTeam={largestSquadTeam}
                                largestSquadCount={largestSquadCount}
                                topPurchases={topPurchases}
                                soldCount={soldCount}
                                unsoldCount={unsoldCount}
                                totalSpent={totalSpent}
                            />
                        ) : (
                            <LiveAuctionView
                                liveState={liveState}
                                playerMap={playerMap}
                                teamMap={teamMap}
                            />
                        )
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
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
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {(() => {
                                const filtered = safePlayers
                                    .filter(p => {
                                        if (viewStatus === 'OPEN') return !p.isSold && !p.isUnsold;
                                        if (viewStatus === 'SOLD') return p.isSold;
                                        if (viewStatus === 'UNSOLD') return p.isUnsold;
                                        return true;
                                    })
                                    .filter(p => selectedCategory === 'All' || p.category === selectedCategory);

                                if (filtered.length === 0) {
                                    return (
                                        <div className="landing-empty-container" style={{ gridColumn: 'unset' }}>
                                            <div className="landing-empty-icon-bg">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <h3 className="landing-empty-title">
                                                {viewStatus === 'OPEN' ? 'No Open Players' : viewStatus === 'SOLD' ? 'No Sold Players' : 'No Unsold Players'}
                                            </h3>
                                            <p className="landing-empty-subtitle">
                                                {viewStatus === 'OPEN'
                                                    ? 'All players have been sold or marked unsold. Switch to "ALL" to see everyone.'
                                                    : `No players match the current filter.`}
                                            </p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-4 gap-4">
                                        {filtered.map(p => {
                                            const soldToTeam = p.isSold ? teamMap.get(p.soldTo) : null;
                                            return (
                                                <div key={p._id} className="card player-item-card">
                                                    {p.isSold && <div className="viewer-pool-check-icon"><CheckCircle className="w-4 h-4" /></div>}
                                                    <div className="viewer-pool-card-header">
                                                        <span className="viewer-pool-card-header-badge">
                                                            {ROLE_ICONS[p.role] || ROLE_ICONS['default']}
                                                            {p.category} • {p.role}
                                                        </span>
                                                        <h3 className={`viewer-pool-card-title ${p.isUnsold ? 'text-muted line-through' : ''}`}>{p.name}</h3>
                                                    </div>
                                                    <div className="viewer-pool-card-footer">
                                                        <div>
                                                            {p.isSold ? (
                                                                <span style={{
                                                                    backgroundColor: soldToTeam?.color || 'var(--bg-elevated)',
                                                                    color: getContrastColor(soldToTeam?.color),
                                                                    padding: '2px 8px',
                                                                    borderRadius: 'var(--radius-full)',
                                                                    fontSize: '10px',
                                                                    fontWeight: 'bold',
                                                                    textTransform: 'uppercase',
                                                                    display: 'inline-block',
                                                                    maxWidth: '120px',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    border: '1px solid var(--border-strong)'
                                                                }}>
                                                                    {soldToTeam?.name}
                                                                </span>
                                                            ) : p.isUnsold ? (
                                                                <Badge variant="danger">UNSOLD</Badge>
                                                            ) : (
                                                                <Badge variant="info">OPEN</Badge>
                                                            )}
                                                        </div>
                                                        <div className="font-mono" style={{ fontWeight: 'bold', fontSize: 'var(--text-secondary)', color: p.isSold ? 'var(--success)' : 'var(--text-muted)' }}>
                                                            ₹{p.isSold ? p.soldPrice : p.basePrice}L
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* FEED TAB */}
                    {activeTab === 'sold' && (
                        <div className="card viewer-feed-card">
                            <div className="viewer-feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                                <span>Live Feed</span>
                                
                                {/* Custom Sorting Dropdown */}
                                <div style={{ position: 'relative', textTransform: 'none', letterSpacing: 'normal' }}>
                                    {isSortMenuOpen && (
                                        <div 
                                            onClick={() => setIsSortMenuOpen(false)} 
                                            style={{ position: 'fixed', inset: 0, zIndex: 90, cursor: 'default' }}
                                        />
                                    )}
                                    <button 
                                        onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--sp-2)',
                                            padding: 'var(--sp-1.5) var(--sp-3)',
                                            borderRadius: 'var(--radius-lg)',
                                            backgroundColor: 'var(--bg-elevated)',
                                            border: '1px solid var(--border)',
                                            color: 'var(--text-secondary)',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            transition: 'var(--transition-fast)',
                                            cursor: 'pointer',
                                            zIndex: 91,
                                            position: 'relative'
                                        }}
                                        className="tr-hover"
                                    >
                                        <ListFilter className="w-4 h-4" />
                                        <span>
                                            {feedSort === 'recent' && 'Recent'}
                                            {feedSort === 'oldest' && 'Oldest'}
                                            {feedSort === 'price-desc' && 'Price: High-Low'}
                                            {feedSort === 'price-asc' && 'Price: Low-High'}
                                            {feedSort === 'name-asc' && 'Name: A-Z'}
                                        </span>
                                        <ChevronDown className="w-3.5 h-3.5" style={{ opacity: 0.7 }} />
                                    </button>

                                    {isSortMenuOpen && (
                                        <div style={{
                                            position: 'absolute',
                                            right: 0,
                                            top: 'calc(100% + var(--sp-2))',
                                            backgroundColor: 'var(--bg-elevated)',
                                            border: '1px solid var(--border-strong)',
                                            borderRadius: 'var(--radius-xl)',
                                            boxShadow: 'var(--shadow-lg)',
                                            padding: 'var(--sp-1.5)',
                                            zIndex: 95,
                                            minWidth: '180px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1px'
                                        }}>
                                            {[
                                                { value: 'recent', label: 'Recent Purchases' },
                                                { value: 'oldest', label: 'Oldest Purchases' },
                                                { value: 'price-desc', label: 'Price: High to Low' },
                                                { value: 'price-asc', label: 'Price: Low to High' },
                                                { value: 'name-asc', label: 'Name: A to Z' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => {
                                                        setFeedSort(opt.value);
                                                        setIsSortMenuOpen(false);
                                                    }}
                                                    style={{
                                                        padding: 'var(--sp-2) var(--sp-3)',
                                                        borderRadius: 'var(--radius-md)',
                                                        fontSize: '11px',
                                                        textAlign: 'left',
                                                        color: feedSort === opt.value ? 'var(--accent-light)' : 'var(--text-secondary)',
                                                        backgroundColor: feedSort === opt.value ? 'var(--bg-active)' : 'transparent',
                                                        fontWeight: feedSort === opt.value ? 'bold' : 'normal',
                                                        width: '100%',
                                                        cursor: 'pointer'
                                                    }}
                                                    className="tr-hover"
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-col">
                                {sortedFeedPlayers.map(p => {
                                    const team = teamMap.get(p.soldTo);
                                    return (
                                        <div key={p._id} className="viewer-feed-row tr-hover">
                                            <div className="viewer-feed-row-inner">
                                                <div className="viewer-feed-avatar">{p.name.charAt(0)}</div>
                                                <div><div className="viewer-team-card-player-name">{p.name}</div><div style={{ fontSize: '10px', color: 'var(--text-muted-dark)' }}>{p.role}</div></div>
                                            </div>
                                            <div className="text-center" style={{ textAlign: 'right' }}>
                                                <div className="viewer-feed-badge-val" style={{ backgroundColor: team?.color || '#555', color: getContrastColor(team?.color) }}>{team?.name}</div>
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
                <MobileNavButton 
                    active={activeTab === 'live'} 
                    onClick={() => setActiveTab('live')} 
                    icon={isCompleted ? Trophy : Gavel} 
                    label={isCompleted ? "Results" : "Live"} 
                    isLive={!isCompleted && liveState?.status === 'ACTIVE'} 
                />
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
    const [isStatsExpanded, setIsStatsExpanded] = useState(true);

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
            maxWidth="32rem"
            bannerColor={team.color}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                    <div style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 'var(--text-card)', fontWeight: 'var(--weight-black)', margin: 0, color: 'var(--text-primary)' }}>{team.name}</h2>
                        <div style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: 'var(--text-micro)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Team Overview</div>
                    </div>
                </div>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', padding: 'var(--sp-2) 0' }}>
                
                {/* Collapsible Top Stats Section */}
                {isStatsExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }} className="animate-fade-in">
                        {/* Stats Row */}
                        <div className="modal-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-2)', textAlign: 'center', padding: '0 var(--sp-2)' }}>
                            <div className="stats-matrix-card" style={{ padding: 'var(--sp-1-5) var(--sp-2)', borderRadius: 'var(--radius-md)' }}>
                                <div className="stats-matrix-label" style={{ fontSize: '9px', justifyContent: 'center' }}>Players</div>
                                <div className="stats-matrix-value" style={{ fontSize: 'var(--text-secondary)', marginTop: '1px', fontWeight: 'bold' }}>{squad.length}</div>
                            </div>
                            <div className="stats-matrix-card" style={{ padding: 'var(--sp-1-5) var(--sp-2)', borderRadius: 'var(--radius-md)' }}>
                                <div className="stats-matrix-label" style={{ fontSize: '9px', justifyContent: 'center' }}>Purse Left</div>
                                <div className="stats-matrix-value font-mono" style={{ fontSize: 'var(--text-secondary)', marginTop: '1px', color: realRemaining < 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 'bold' }}>
                                    ₹{realRemaining}L
                                </div>
                            </div>
                            <div className="stats-matrix-card" style={{ padding: 'var(--sp-1-5) var(--sp-2)', borderRadius: 'var(--radius-md)' }}>
                                <div className="stats-matrix-label" style={{ fontSize: '9px', justifyContent: 'center' }}>Spent</div>
                                <div className="stats-matrix-value font-mono" style={{ fontSize: 'var(--text-secondary)', marginTop: '1px', color: 'var(--accent-light)', fontWeight: 'bold' }}>₹{realSpent}L</div>
                            </div>
                        </div>

                        {/* Composition progress bars */}
                        <div className="viewer-modal-bar-counts" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--sp-3)', padding: '0 var(--sp-2)' }}>
                            {Object.entries(composition).map(([role, count]) => {
                                const colorMap = { 'Batsman': 'var(--blue-500)', 'Bowler': 'var(--green-500)', 'All Rounder': 'var(--purple-500)', 'Wicket Keeper': 'var(--yellow-500)' };
                                const limitMap = { 'Batsman': 8, 'Bowler': 8, 'All Rounder': 8, 'Wicket Keeper': 2 };
                                const limit = limitMap[role] || 8;
                                return (
                                    <div key={role} className="viewer-modal-bar-col" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-micro)', fontWeight: 'bold' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{role}</span>
                                            <span>{count} / {limit}</span>
                                        </div>
                                        <div className="progress-bar-bg" style={{ height: '4px' }}>
                                            <div className="progress-bar-fill" style={{ width: `${Math.min(100, (count / limit) * 100)}%`, backgroundColor: colorMap[role] || 'var(--slate-500)' }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Squad List */}
                <div className="modal-squad-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                    <div className="viewer-modal-list-header" style={{ padding: '0 var(--sp-2)', fontWeight: 'bold', fontSize: 'var(--text-secondary)', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--sp-2)', marginBottom: 'var(--sp-1)' }}>
                        <span>Acquired Players ({squad.length})</span>
                        <button 
                            onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)', color: 'var(--accent)', fontSize: 'var(--text-micro)', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            {isStatsExpanded ? (
                                <>Hide Stats <ChevronUp className="w-3.5 h-3.5" /></>
                            ) : (
                                <>Show Stats <ChevronDown className="w-3.5 h-3.5" /></>
                            )}
                        </button>
                    </div>
                    {squad.length === 0 ? (
                        <div style={{ height: '8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '2px dashed var(--border)', borderRadius: 'var(--radius-xl)', margin: '0 var(--sp-2)', padding: 'var(--sp-4)', textAlign: 'center' }}>
                            <Users className="w-6 h-6 mb-2 opacity-50" />
                            <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'bold', color: 'var(--text-primary)' }}>No players acquired yet.</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Players purchased during the auction will appear here.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', maxHeight: isStatsExpanded ? '380px' : '580px', overflowY: 'auto', padding: '0 var(--sp-2)', transition: 'max-height 0.2s ease-in-out' }}>
                            {squad.map((p, idx) => (
                                <div key={p._id} className="card tr-hover" style={{ padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: '4px', minHeight: 'auto', borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-muted)', fontSize: 'var(--text-caption)', minWidth: '1.5rem' }}>#{idx + 1}</span>
                                            <span style={{ fontWeight: 'bold', fontSize: 'var(--text-secondary)' }}>{p.name}</span>
                                        </div>
                                        <span className="font-mono" style={{ fontWeight: 'bold', color: 'var(--success)', fontSize: 'var(--text-secondary)' }}>₹{p.soldPrice}L</span>
                                    </div>
                                    <div style={{ paddingLeft: '2.25rem', fontSize: '10px', color: 'var(--text-muted)' }}>
                                        {p.role} • {p.category}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

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
        <div className="live-idle-wrapper">
            <div className="live-idle-icon">
                <Mic2 className="w-10 h-10" style={{ color: 'var(--accent)' }} />
            </div>
            <h2 style={{ fontSize: 'var(--text-card)', fontWeight: 'var(--weight-black)', color: 'var(--text-primary)' }}>Waiting for Auctioneer</h2>
            <p style={{ fontSize: 'var(--text-secondary)', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '320px', lineHeight: 1.4, margin: '0 auto' }}>
                The bidding screen will open automatically when the auctioneer activates the next player.
            </p>
        </div>
    );
}

function TournamentResultsView({ safeTeams, safePlayers, squadMap, teamMap, spenderTeam, spenderSpent, mostExpensivePlayer, buyerTeam, largestSquadTeam, largestSquadCount, topPurchases, soldCount, unsoldCount, totalSpent }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)', width: '100%', paddingBottom: 'var(--sp-8)' }} className="animate-fade-in">
            {/* HERO BANNER */}
            <div className="card" style={{
                position: 'relative',
                overflow: 'hidden',
                padding: 'var(--sp-8) var(--sp-6)',
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-2xl)',
                boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(234,179,8,0.1) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }}></div>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '4.5rem', height: '4.5rem', borderRadius: '50%', backgroundColor: 'rgba(234,179,8,0.1)', border: '2px solid var(--warning)', marginBottom: 'var(--sp-4)', color: 'var(--warning)' }}>
                    <Trophy className="w-8 h-8 animate-bounce" />
                </div>
                <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: '900', color: '#ffffff', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Tournament Completed</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-secondary)', marginTop: '6px', fontWeight: '500' }}>
                    The auction has Concluded. All franchises have finalized their squads.
                </p>
            </div>

            {/* HIGHLIGHTS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--sp-4)' }}>
                {/* Highlight 1: Highest Spender */}
                {spenderTeam && (
                    <div className="card" style={{ padding: 'var(--sp-6)', position: 'relative', overflow: 'hidden', border: `1px solid ${spenderTeam.color}30`, boxShadow: `0 4px 20px ${spenderTeam.color}08` }}>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Highest Spender</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: `${spenderTeam.color}15`, border: `2px solid ${spenderTeam.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: spenderTeam.color }}>
                                {spenderTeam.logoText || spenderTeam.name.split(' ').map(n => n[0]).join('').slice(0, 3).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: 'var(--text-secondary)' }}>{spenderTeam.name}</div>
                                <div style={{ fontSize: 'var(--text-secondary)', fontWeight: '900', color: 'var(--text-primary)', marginTop: '2px' }}>₹{spenderSpent}L Spent</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Highlight 2: Most Expensive Player */}
                {mostExpensivePlayer && (
                    <div className="card" style={{ padding: 'var(--sp-6)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Expensive Player</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(234,179,8,0.1)', border: '2px solid var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                                <Trophy className="w-5 h-5" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: 'var(--text-secondary)' }}>{mostExpensivePlayer.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: 'var(--sp-1.5)', flexWrap: 'wrap' }}>
                                    <span>Sold to</span>
                                    <span style={{
                                        backgroundColor: buyerTeam?.color || 'var(--bg-elevated)',
                                        color: getContrastColor(buyerTeam?.color),
                                        padding: '1px 8px',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '9px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        display: 'inline-block',
                                        border: '1px solid var(--border-strong)'
                                    }}>
                                        {buyerTeam?.name}
                                    </span>
                                    <span>for</span>
                                    <span style={{ fontWeight: '950', color: 'var(--success)', fontSize: '12px' }}>₹{mostExpensivePlayer.soldPrice}L</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Highlight 3: Largest Squad */}
                {largestSquadTeam && (
                    <div className="card" style={{ padding: 'var(--sp-6)', position: 'relative', overflow: 'hidden', border: `1px solid ${largestSquadTeam.color}30` }}>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Largest Squad</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: `${largestSquadTeam.color}15`, border: `2px solid ${largestSquadTeam.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: largestSquadTeam.color }}>
                                {largestSquadTeam.logoText || largestSquadTeam.name.split(' ').map(n => n[0]).join('').slice(0, 3).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: 'var(--text-secondary)' }}>{largestSquadTeam.name}</div>
                                <div style={{ fontSize: 'var(--text-secondary)', fontWeight: '900', color: 'var(--text-primary)', marginTop: '2px' }}>{largestSquadCount} Players</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* LOWER PORTION: STATISTICS + TOP PURCHASES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--sp-6)' }}>
                {/* Stats Summary */}
                <div className="card" style={{ padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                    <h3 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold', margin: 0 }}>Auction Summary</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--sp-2)' }}>
                            <span style={{ fontSize: 'var(--text-secondary)', color: 'var(--text-muted)' }}>Total Money Spent</span>
                            <span className="font-mono" style={{ fontWeight: 'bold', color: 'var(--success)' }}>₹{totalSpent}L</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--sp-2)' }}>
                            <span style={{ fontSize: 'var(--text-secondary)', color: 'var(--text-muted)' }}>Sold Players Count</span>
                            <span className="font-mono" style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{soldCount} Sold</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--sp-2)' }}>
                            <span style={{ fontSize: 'var(--text-secondary)', color: 'var(--text-muted)' }}>Unsold Players Count</span>
                            <span className="font-mono" style={{ fontWeight: 'bold', color: 'var(--danger-light)' }}>{unsoldCount} Unsold</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 'var(--sp-1)' }}>
                            <span style={{ fontSize: 'var(--text-secondary)', color: 'var(--text-muted)' }}>Average Player Value</span>
                            <span className="font-mono" style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>₹{soldCount > 0 ? (totalSpent / soldCount).toFixed(1) : 0}L</span>
                        </div>
                    </div>
                </div>

                {/* Top 5 Purchases */}
                <div className="card" style={{ padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                    <h3 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold', margin: 0 }}>Top Purchases</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2.5)' }}>
                        {topPurchases.map((p, index) => {
                            const team = teamMap.get(p.soldTo);
                            return (
                                <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: index < topPurchases.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: 'var(--sp-2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '10px', color: 'var(--text-muted)' }}>
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: 'bold', fontSize: 'var(--text-secondary)' }}>{p.name}</span>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: 'var(--sp-1.5)' }}>
                                                <span>Sold to</span>
                                                <span style={{
                                                    backgroundColor: team?.color || 'var(--bg-elevated)',
                                                    color: getContrastColor(team?.color),
                                                    padding: '1px 6px',
                                                    borderRadius: 'var(--radius-full)',
                                                    fontSize: '9px',
                                                    fontWeight: 'bold',
                                                    textTransform: 'uppercase',
                                                    display: 'inline-block',
                                                    border: '1px solid var(--border-strong)'
                                                }}>
                                                    {team?.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-mono" style={{ fontWeight: '900', color: 'var(--success)' }}>₹{p.soldPrice}L</span>
                                </div>
                            );
                        })}
                        {topPurchases.length === 0 && (
                            <div className="empty-table-state" style={{ padding: 'var(--sp-4)' }}>No players sold yet.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
