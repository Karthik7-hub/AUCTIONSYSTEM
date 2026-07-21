import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import './ResultsPanel.css';

const getContrastColor = (hexColor) => {
    if (!hexColor || hexColor.charAt(0) !== '#') return '#ffffff';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

export default function ResultsPanel({ teams, players, squadMap, teamMap }) {
    const soldPlayersList = useMemo(() => players.filter(p => p.isSold), [players]);
    const unsoldPlayersList = useMemo(() => players.filter(p => p.isUnsold), [players]);
    const soldCount = soldPlayersList.length;
    const unsoldCount = unsoldPlayersList.length;
    const totalSpent = useMemo(() => soldPlayersList.reduce((sum, p) => sum + (p.soldPrice || 0), 0), [soldPlayersList]);

    const spenderTeam = useMemo(() => {
        if (teams.length === 0) return null;
        return [...teams].sort((a, b) => {
            const aSquad = squadMap.get(a._id) || [];
            const bSquad = squadMap.get(b._id) || [];
            const aSpent = aSquad.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
            const bSpent = bSquad.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
            return bSpent - aSpent;
        })[0];
    }, [teams, squadMap]);

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
        if (teams.length === 0) return null;
        return [...teams].sort((a, b) => {
            const aLen = (squadMap.get(a._id) || []).length;
            const bLen = (squadMap.get(b._id) || []).length;
            return bLen - aLen;
        })[0];
    }, [teams, squadMap]);

    const largestSquadCount = useMemo(() => {
        if (!largestSquadTeam) return 0;
        return (squadMap.get(largestSquadTeam._id) || []).length;
    }, [largestSquadTeam, squadMap]);

    const topPurchases = useMemo(() => {
        return [...soldPlayersList].sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0)).slice(0, 5);
    }, [soldPlayersList]);

    return (
        <div className="results animate-fade-in">
            {/* HERO BANNER */}
            <div className="results__banner">
                <div className="results__banner-glow"></div>
                <div className="results__banner-icon">
                    <Trophy className="w-7 h-7" />
                </div>
                <h1 className="results__banner-title">Tournament Completed</h1>
                <p className="results__banner-subtitle">
                    The auction has Concluded. All franchises have finalized their squads.
                </p>
            </div>

            {/* HIGHLIGHTS GRID */}
            <div className="results__grid">
                {/* Highlight 1: Highest Spender */}
                {spenderTeam && (
                    <div className="card results__card" style={{ 
                        border: `1px solid ${spenderTeam.color}25`, 
                        boxShadow: `0 4px 20px ${spenderTeam.color}04` 
                    }}>
                        <div className="results__card-label">Highest Spender</div>
                        <div className="results__card-row">
                            <div className="results__card-avatar" style={{ 
                                backgroundColor: `${spenderTeam.color}08`, 
                                border: `1px solid ${spenderTeam.color}40`, 
                                color: spenderTeam.color
                            }}>
                                {spenderTeam.logoText || spenderTeam.name.split(' ').map(n => n[0]).join('').slice(0, 3).toUpperCase()}
                            </div>
                            <div>
                                <div className="results__card-name">{spenderTeam.name}</div>
                                <div className="results__card-value">₹{spenderSpent}L Spent</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Highlight 2: Most Expensive Player */}
                {mostExpensivePlayer && (
                    <div className="card results__card">
                        <div className="results__card-label">Most Expensive Player</div>
                        <div className="results__card-row">
                            <div className="results__card-avatar" style={{ 
                                backgroundColor: 'rgba(234,179,8,0.04)', 
                                border: '1px solid rgba(234,179,8,0.2)', 
                                color: 'var(--warning)',
                                filter: 'drop-shadow(0 0 10px rgba(234,179,8,0.1))'
                            }}>
                                <Trophy className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="results__card-name">{mostExpensivePlayer.name}</div>
                                <div className="results__card-sub">
                                    <span>Sold to</span>
                                    <span className="results__buyer-badge" style={{
                                        backgroundColor: buyerTeam?.color ? `${buyerTeam.color}18` : 'var(--bg-elevated)',
                                        color: buyerTeam?.color || 'var(--text-muted)',
                                        border: `1px solid ${buyerTeam?.color ? buyerTeam.color + '40' : 'var(--border)'}`
                                    }}>
                                        {buyerTeam?.name}
                                    </span>
                                    <span>for</span>
                                    <span style={{ fontWeight: '800', color: 'var(--warning)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>₹{mostExpensivePlayer.soldPrice}L</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Highlight 3: Largest Squad */}
                {largestSquadTeam && (
                    <div className="card results__card" style={{ 
                        border: `1px solid ${largestSquadTeam.color}25`, 
                        boxShadow: `0 4px 20px ${largestSquadTeam.color}04` 
                    }}>
                        <div className="results__card-label">Largest Squad</div>
                        <div className="results__card-row">
                            <div className="results__card-avatar" style={{ 
                                backgroundColor: `${largestSquadTeam.color}08`, 
                                border: `1px solid ${largestSquadTeam.color}40`, 
                                color: largestSquadTeam.color
                            }}>
                                {largestSquadTeam.logoText || largestSquadTeam.name.split(' ').map(n => n[0]).join('').slice(0, 3).toUpperCase()}
                            </div>
                            <div>
                                <div className="results__card-name">{largestSquadTeam.name}</div>
                                <div className="results__card-value">{largestSquadCount} Players</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* LOWER PORTION: STATISTICS + TOP PURCHASES */}
            <div className="results__details-grid">
                {/* Stats Summary */}
                <div className="card results__stats-box">
                    <h3 className="results__stats-title">Auction Summary</h3>
                    <div className="results__stats-list">
                        <div className="results__stats-row">
                            <span className="results__stats-label">Total Money Spent</span>
                            <span className="font-mono results__stats-val" style={{ color: 'var(--warning)' }}>₹{totalSpent}L</span>
                        </div>
                        <div className="results__stats-row">
                            <span className="results__stats-label">Sold Players Count</span>
                            <span className="font-mono results__stats-val" style={{ color: 'var(--text-primary)' }}>{soldCount} Sold</span>
                        </div>
                        <div className="results__stats-row">
                            <span className="results__stats-label">Unsold Players Count</span>
                            <span className="font-mono results__stats-val" style={{ color: 'var(--text-muted)' }}>{unsoldCount} Unsold</span>
                        </div>
                        <div className="results__stats-row">
                            <span className="results__stats-label">Average Player Value</span>
                            <span className="font-mono results__stats-val" style={{ color: 'var(--accent-light)' }}>₹{soldCount > 0 ? (totalSpent / soldCount).toFixed(1) : 0}L</span>
                        </div>
                    </div>
                </div>

                {/* Top 5 Purchases */}
                <div className="card results__stats-box">
                    <h3 className="results__stats-title">Top Purchases</h3>
                    <div className="results__purchases-list">
                        {topPurchases.map((p, index) => {
                            const team = teamMap.get(p.soldTo);
                            return (
                                <div key={p._id} className="results__purchases-row">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                                        <div className="results__purchases-rank">
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <span className="results__card-name">{p.name}</span>
                                            <div className="results__card-sub" style={{ marginTop: '4px' }}>
                                                <span>Sold to</span>
                                                <span className="results__buyer-badge" style={{
                                                    backgroundColor: team?.color ? `${team.color}18` : 'var(--bg-elevated)',
                                                    color: team?.color || 'var(--text-muted)',
                                                    border: `1px solid ${team?.color ? team.color + '40' : 'var(--border)'}`
                                                }}>
                                                    {team?.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-mono" style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: 'var(--text-secondary)' }}>₹{p.soldPrice}L</span>
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
