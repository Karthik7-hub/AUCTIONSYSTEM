import React from 'react';
import { Users, UserPlus, Wallet, Trophy, Clock, Crown, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import StatsCard from './components/StatsCard';
import QuickActions from './components/QuickActions';
import './Overview.css';

const getContrastColor = (hexColor) => {
    if (!hexColor || hexColor.charAt(0) !== '#') return '#ffffff';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

export default function Overview({
    data,
    config,
    navigate,
    totalBudget,
    totalSpent,
    remainingPurse,
    avgBid,
    soldCount,
    poolCount,
    unsoldCount,
    highestBidPlayer,
    highestBidTeam,
    recentSoldPlayers,
    copyInviteLink,
    copied,
    isCompleted,
    setActiveTab,
    setSelectedTeam
}) {
    return (
        <div className="animate-fade-in dashboard">
            {/* Summary Metrics Matrix */}
            <div className="dashboard__matrix">
                <StatsCard
                    title="Registered Teams"
                    value={data.teams.length}
                    icon={Users}
                    iconBg="rgba(37, 99, 235, 0.1)"
                    iconColor="#2563eb"
                    subtitle="Teams On-Boarded"
                />
                <StatsCard
                    title="Pool Players"
                    value={data.players.length}
                    icon={UserPlus}
                    iconBg="rgba(22, 163, 74, 0.1)"
                    iconColor="#16a34a"
                    subtitle="Available in Auction"
                />
                <StatsCard
                    title="Allocated Budget"
                    value={`₹${totalBudget}L`}
                    icon={Wallet}
                    iconBg="rgba(147, 51, 234, 0.1)"
                    iconColor="#9333ea"
                    subtitle="Total League Purse"
                />
                <StatsCard
                    title="Total Spent"
                    value={`₹${totalSpent}L`}
                    icon={Trophy}
                    iconBg="rgba(234, 88, 12, 0.1)"
                    iconColor="#ea580c"
                    subtitle="Acquisition Spend"
                />
            </div>

            {/* Main Workspace Grid */}
            <div className="dashboard__workspace">
                {/* Left Column: Quick Launch & Bidding Stats */}
                <div className="dashboard__col-left">
                    <QuickActions
                        isCompleted={isCompleted}
                        navigate={navigate}
                        config={config}
                        copyInviteLink={copyInviteLink}
                        copied={copied}
                        setActiveTab={setActiveTab}
                    />

                    {/* Bidding Statistics Card */}
                    <div className="dashboard__card">
                        <h3 className="dashboard__title">Bidding Overview</h3>
                        <div className="dashboard__stats-list">
                            <div className="dashboard__stats-row">
                                <span className="dashboard__stats-label">Remaining Purse</span>
                                <span className="font-mono dashboard__stats-val" style={{ color: 'var(--success)' }}>₹{remainingPurse}L</span>
                            </div>
                            <div className="dashboard__stats-row">
                                <span className="dashboard__stats-label">Average Player Price</span>
                                <span className="font-mono dashboard__stats-val" style={{ color: 'var(--accent-light)' }}>₹{avgBid.toFixed(1)}L</span>
                            </div>
                            <div className="dashboard__stats-row">
                                <span className="dashboard__stats-label">Sold Players</span>
                                <span className="font-mono dashboard__stats-val" style={{ color: 'var(--text-primary)' }}>
                                    <span style={{ color: 'var(--success)' }}>{soldCount}</span> / {poolCount}
                                </span>
                            </div>
                            <div className="dashboard__stats-row">
                                <span className="dashboard__stats-label">Unsold Players</span>
                                <span className="font-mono dashboard__stats-val" style={{ color: unsoldCount > 0 ? '#ef4444' : 'var(--text-muted)' }}>{unsoldCount}</span>
                            </div>

                            {/* Highest Bid Spotlight Subcard */}
                            <div className="dashboard__highest-card">
                                <div className="dashboard__highest-header">
                                    <Crown className="w-4 h-4 text-yellow-500" />
                                    <span>Highest Bid</span>
                                </div>
                                {highestBidPlayer ? (
                                    <div className="dashboard__highest-content">
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div className="dashboard__highest-player-name">{highestBidPlayer.name}</div>
                                            <div className="dashboard__highest-team-tag">
                                                <span>Bought by {highestBidTeam ? highestBidTeam.name : 'Unassigned'}</span>
                                            </div>
                                        </div>
                                        <div className="font-mono dashboard__highest-price">
                                            ₹{highestBidPlayer.soldPrice}L
                                        </div>
                                    </div>
                                ) : (
                                    <div className="dashboard__highest-empty">No player sales recorded yet</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Column: Team Budget Utilization */}
                <div className="dashboard__col-mid">
                    <div className="dashboard__card">
                        <div className="dashboard__card-header-row">
                            <h3 className="dashboard__title">Team Purse Utilization</h3>
                            <span className="dashboard__subtitle-badge">{data.teams.length} Teams</span>
                        </div>
                        <div className="dashboard__team-list">
                            {data.teams.map(team => {
                                const percentUsed = Math.min(100, Math.round((team.spent / team.budget) * 100)) || 0;
                                const initials = team.logoText || team.name.split(' ').map(n => n[0]).join('').slice(0, 3).toUpperCase();
                                return (
                                    <div key={team._id} onClick={() => setSelectedTeam(team)} className="dashboard__team-row">
                                        <div className="dashboard__team-info">
                                            <div className="dashboard__team-left">
                                                <div
                                                    className="dashboard__team-avatar"
                                                    style={{ backgroundColor: `${team.color}20`, color: team.color, border: `1px solid ${team.color}40` }}
                                                >
                                                    {initials}
                                                </div>
                                                <span className="dashboard__team-name">{team.name}</span>
                                            </div>
                                            <div className="dashboard__team-purse">
                                                <span className="font-mono" style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                                    ₹{team.spent}L / ₹{team.budget}L
                                                </span>
                                                <span
                                                    className="dashboard__team-badge"
                                                    style={{ backgroundColor: `${team.color}18`, color: team.color, border: `1px solid ${team.color}35` }}
                                                >
                                                    {percentUsed}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="dashboard__team-progress-track">
                                            <div
                                                className="dashboard__team-progress-bar"
                                                style={{ width: `${percentUsed}%`, backgroundColor: team.color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            {data.teams.length === 0 && (
                                <div className="dashboard__recent-empty">
                                    <Users className="w-8 h-8 mb-2 opacity-40 text-muted" />
                                    <div>No teams registered yet.</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Go to the "Teams" tab to add team franchises.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Recent Activity Feed */}
                <div className="dashboard__col-right">
                    <div className="dashboard__card">
                        <div className="dashboard__card-header-row">
                            <h3 className="dashboard__title">Recent Activity</h3>
                            <span className="dashboard__subtitle-badge">{recentSoldPlayers.length} Sold</span>
                        </div>
                        {recentSoldPlayers.length === 0 ? (
                            <div className="dashboard__recent-empty">
                                <Clock className="w-8 h-8 mb-2 opacity-40 text-muted" />
                                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>No recent sales</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>
                                    Player purchases made in live console will stream here.
                                </div>
                            </div>
                        ) : (
                            <div className="dashboard__recent-list">
                                {recentSoldPlayers.map(p => {
                                    const team = data.teams.find(t => t._id === p.soldTo);
                                    const contrastColor = getContrastColor(team?.color);
                                    return (
                                        <div key={p._id} className="dashboard__recent-row">
                                            <div className="dashboard__recent-left">
                                                <div
                                                    className="dashboard__recent-avatar"
                                                    style={{ backgroundColor: `${team?.color || 'var(--accent)'}20`, color: team?.color || 'var(--accent)' }}
                                                >
                                                    {p.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="dashboard__recent-details">
                                                    <span className="dashboard__recent-player-name">{p.name}</span>
                                                    <span className="dashboard__recent-player-role">{p.role} • {p.category}</span>
                                                </div>
                                            </div>
                                            <div className="dashboard__recent-right">
                                                <span
                                                    className="dashboard__recent-badge"
                                                    style={{ color: contrastColor, backgroundColor: team?.color || 'var(--accent)' }}
                                                >
                                                    {team?.name || 'Sold'}
                                                </span>
                                                <span className="font-mono dashboard__recent-price">₹{p.soldPrice}L</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
