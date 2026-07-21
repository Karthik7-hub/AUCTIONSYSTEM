import React from 'react';
import { TrendingUp, Pause, Mic2 } from 'lucide-react';
import PlayerSilhouette from '@shared/components/PlayerSilhouette/PlayerSilhouette';
import './LiveAuctionPanel.css';

export default function LiveAuctionPanel({ liveState, playerMap, teamMap }) {
    const currentPlayer = liveState?.currentPlayerId ? playerMap.get(liveState.currentPlayerId) : null;
    const leadingTeam = liveState?.leadingTeamId ? teamMap.get(liveState.leadingTeamId) : null;

    if (liveState?.status === 'PAUSED') {
        return (
            <div className="live-auction__paused">
                <Pause className="pause-overlay-icon" style={{ opacity: 0.5 }} />
                <h2 className="live-auction__paused-title">Paused</h2>
            </div>
        );
    }

    if ((liveState?.status === 'SOLD' || liveState?.status === 'UNSOLD') && currentPlayer) {
        const isSold = liveState.status === 'SOLD';
        return (
            <div className="live-auction__outcome">
                <div className="live-auction__outcome-glow" style={{ background: isSold ? 'linear-gradient(to bottom, var(--green-600), var(--slate-950))' : 'linear-gradient(to bottom, var(--red-600), var(--slate-950))' }}></div>
                <div className="live-auction__outcome-box">
                    <h2 className="live-auction__outcome-name">{currentPlayer.name}</h2>
                    <div className="live-auction__outcome-meta">
                        <span>{currentPlayer.role}</span>
                    </div>

                    <div className="live-auction__outcome-stamp" style={{ color: isSold ? 'var(--green-500)' : 'var(--red-500)', textShadow: isSold ? '0 0 25px rgba(34, 197, 94, 0.5)' : 'none' }}>
                        {isSold ? 'SOLD' : 'UNSOLD'}
                    </div>

                    {isSold && (
                        <div className="live-auction__outcome-buyer-box">
                            <div className="live-auction__outcome-buyer-label">Acquired By</div>
                            <div className="live-auction__outcome-buyer-name" style={{ color: leadingTeam?.color }}>{leadingTeam?.name}</div>
                            <div className="live-auction__outcome-buyer-price">₹{liveState.currentBid}L</div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (liveState?.status === 'ACTIVE' && currentPlayer) {
        const renderHistory = () => (
            <div className="live-auction__history-section">
                <div className="live-auction__history-title">Round History</div>
                <div className="live-auction__history-list">
                    {liveState.bidHistory && liveState.bidHistory.length > 0 ? (
                        [...liveState.bidHistory].reverse().map((hist, idx, arr) => {
                            const biddingTeam = teamMap.get(hist.leader);
                            const isLast = idx === 0;
                            return (
                                <div key={idx} className="live-auction__history-row">
                                    <div className="live-auction__history-team-info">
                                        {biddingTeam ? (
                                            <>
                                                <div className="live-auction__history-team-dot" style={{ backgroundColor: biddingTeam.color }}></div>
                                                <span className="live-auction__history-team-name">{biddingTeam.name}</span>
                                            </>
                                        ) : (
                                            <span className="live-auction__history-team-name--base">Base Price</span>
                                        )}
                                    </div>
                                    <span className="live-auction__history-bid-val" style={{ color: isLast ? 'var(--success)' : 'var(--text-muted-dark)' }}>
                                        ₹{hist.bid ?? currentPlayer?.basePrice ?? 20}L
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="live-auction__history-empty">
                            No previous bids in this round
                        </div>
                    )}
                </div>
            </div>
        );

        return (
            <div className="live-auction__wrapper">
                {/* 1. DESKTOP VIEW */}
                <div className="live-auction__desktop-view">
                    {/* Left Column: Player Info & History List */}
                    <div className="live-auction__column-left">
                        <div className="live-auction__card-container">
                            <div className="live-auction__card-silhouette-bg">
                                <PlayerSilhouette role={currentPlayer.role} />
                            </div>
                            <div>
                                <span className="live-auction__category-badge">{currentPlayer.category}</span>
                                <h1 className="live-auction__player-title">{currentPlayer.name}</h1>
                                <div className="live-auction__role-subtitle">
                                    <span>{currentPlayer.role}</span>
                                </div>
                            </div>
                            <div className="live-auction__base-row">
                                <div className="live-auction__base-label">Base Price</div>
                                <div className="live-auction__base-val">₹{currentPlayer.basePrice}L</div>
                            </div>
                        </div>
                        {renderHistory()}
                    </div>

                    {/* Right Column: Live Bid Info */}
                    <div className="live-auction__column-right">
                        <div className="live-auction__card-container live-auction__card-container--bid">
                            {leadingTeam && (
                                <div className="live-auction__right-glow-bg" style={{
                                    background: `radial-gradient(circle at center, ${leadingTeam.color}15 0%, transparent 70%)`
                                }}></div>
                            )}
                            <div className="live-auction__indicator-row">
                                <span className="live-auction__indicator-glow">
                                    <span className="live-auction__indicator-ping"></span>
                                    <span className="live-auction__indicator-dot"></span>
                                </span>
                                <span className="live-auction__bids-label">LIVE BIDDING</span>
                            </div>

                            <div className="live-auction__current-bid-row">
                                <span className="live-auction__current-bid-curr">₹</span>
                                {liveState.currentBid}
                                <span className="live-auction__current-bid-unit">L</span>
                            </div>

                            <div className="live-auction__leader-wrapper">
                                {leadingTeam ? (
                                    <div className="live-auction__leader-card">
                                        <div className="live-auction__leader-card-left">
                                            <div className="live-auction__leader-avatar" style={{ backgroundColor: leadingTeam.color }}>
                                                {leadingTeam.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="live-auction__leader-label">Current Leader</div>
                                                <div className="live-auction__leader-name">{leadingTeam.name}</div>
                                            </div>
                                        </div>
                                        <TrendingUp className="text-green-500 w-5 h-5" />
                                    </div>
                                ) : (
                                    <div className="live-auction__status-waiting">
                                        Waiting for bids...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. MOBILE VIEW (UNIFIED GLASS CARD) */}
                <div className="live-auction__mobile-view">
                    <div className="live-auction__unified-card">
                        {leadingTeam && (
                            <div className="live-auction__unified-glow" style={{
                                background: `radial-gradient(circle at bottom right, ${leadingTeam.color}25 0%, transparent 70%)`
                            }}></div>
                        )}
                        {/* Top: Player Info & Silhouette Watermark */}
                        <div className="live-auction__unified-top">
                            <div className="live-auction__unified-info">
                                <span className="live-auction__category-badge">{currentPlayer.category}</span>
                                <h1 className="live-auction__player-title">{currentPlayer.name}</h1>
                                <div className="live-auction__role-subtitle">
                                    <span>{currentPlayer.role}</span>
                                </div>
                            </div>
                            <div className="live-auction__unified-silhouette">
                                <PlayerSilhouette role={currentPlayer.role} />
                            </div>
                        </div>

                        <div className="live-auction__unified-divider"></div>

                        {/* Middle: Pricing Section (Side-by-Side) */}
                        <div className="live-auction__unified-pricing">
                            {/* Left Side: Base Price */}
                            <div className="live-auction__unified-base">
                                <div className="live-auction__base-label">Base Price</div>
                                <div className="live-auction__base-val">₹{currentPlayer.basePrice}L</div>
                            </div>

                            {/* Right Side: Current Bid + Live Badge */}
                            <div className="live-auction__unified-bid">
                                <div className="live-auction__indicator-row">
                                    <span className="live-auction__indicator-glow">
                                        <span className="live-auction__indicator-ping"></span>
                                        <span className="live-auction__indicator-dot"></span>
                                    </span>
                                    <span className="live-auction__bids-label">LIVE BIDDING</span>
                                </div>
                                <div className="live-auction__current-bid-row">
                                    <span className="live-auction__current-bid-curr">₹</span>
                                    {liveState.currentBid}
                                    <span className="live-auction__current-bid-unit">L</span>
                                </div>
                            </div>
                        </div>

                        <div className="live-auction__unified-divider"></div>

                        {/* Bottom: Current Leader Pill */}
                        <div className="live-auction__unified-leader">
                            {leadingTeam ? (
                                <div className="live-auction__leader-card">
                                    <div className="live-auction__leader-card-left">
                                        <div className="live-auction__leader-avatar" style={{ backgroundColor: leadingTeam.color }}>
                                            {leadingTeam.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="live-auction__leader-label">Current Leader</div>
                                            <div className="live-auction__leader-name">{leadingTeam.name}</div>
                                        </div>
                                    </div>
                                    <TrendingUp className="text-green-500 w-4 h-4" />
                                </div>
                            ) : (
                                <div className="live-auction__status-waiting">
                                    Waiting for bids...
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Round History below unified card */}
                    {renderHistory()}
                </div>
            </div>
        );
    }

    return (
        <div className="live-auction__idle">
            <div className="live-auction__idle-icon">
                <Mic2 className="w-10 h-10" />
            </div>
            <h2 className="live-auction__idle-title">Waiting for Auctioneer</h2>
            <p className="live-auction__idle-text">
                The bidding screen will open automatically when the auctioneer activates the next player.
            </p>
        </div>
    );
}
