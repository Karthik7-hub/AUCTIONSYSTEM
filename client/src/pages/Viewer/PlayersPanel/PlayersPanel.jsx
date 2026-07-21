import React from 'react';
import { Users, CheckCircle } from 'lucide-react';
import Badge from '@shared/components/Badge';
import PlayerSilhouette from '@shared/components/PlayerSilhouette/PlayerSilhouette';
import usePlayersPanel from './hooks/usePlayersPanel';
import './PlayersPanel.css';

const getContrastColor = (hexColor) => {
    if (!hexColor || hexColor.charAt(0) !== '#') return '#ffffff';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

export default function PlayersPanel({ players, config, teamMap }) {
    const {
        viewStatus,
        setViewStatus,
        selectedCategory,
        setSelectedCategory,
        categoriesList,
        filteredPlayers
    } = usePlayersPanel(players, config);

    return (
        <div className="players">
            <div className="viewer-pool-sticky-header">
                <div className="nav-tabs players__tabs">
                    {['OPEN', 'SOLD', 'UNSOLD', 'ALL'].map(status => (
                        <button key={status} onClick={() => setViewStatus(status)} className={`nav-tab-btn ${viewStatus === status ? 'nav-tab-btn-active' : ''} players__tab-btn`}>{status}</button>
                    ))}
                </div>
                <div className="filters-strip players__filters">
                    {categoriesList.map(cat => (
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

            {filteredPlayers.length === 0 ? (
                <div className="landing-empty-container players__empty-card">
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
            ) : (
                <div className="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-4 gap-4">
                    {filteredPlayers.map(p => {
                        const soldToTeam = p.isSold ? teamMap.get(p.soldTo) : null;
                        return (
                            <div key={p._id} className={`card player-item-card ${p.isSold ? 'player-item-card--sold' : p.isUnsold ? 'player-item-card--unsold' : ''}`}>
                                {/* Nike / EA FC Style Minimalist Silhouette Watermark */}
                                <div className="player-card__silhouette-wrapper">
                                    <PlayerSilhouette role={p.role} />
                                </div>
                                {p.isSold && (
                                    <div className="viewer-pool-check-icon">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                    </div>
                                )}
                                <div className="viewer-pool-card-header">
                                    <div className="viewer-pool-card-header-badge">
                                        <span>{p.category} • {p.role}</span>
                                    </div>
                                    <h3 className={`viewer-pool-card-title ${(!p.isSold && p.isUnsold) ? 'text-muted' : ''}`}>{p.name}</h3>
                                </div>
                                <div className="viewer-pool-card-footer">
                                    <div>
                                        {p.isSold ? (
                                            <span className="players__buyer-badge" style={{
                                                backgroundColor: soldToTeam?.color || 'var(--bg-elevated)',
                                                color: getContrastColor(soldToTeam?.color)
                                            }}>
                                                {soldToTeam?.name}
                                            </span>
                                        ) : p.isUnsold ? (
                                            <Badge variant="danger">UNSOLD</Badge>
                                        ) : (
                                            <Badge variant="info">OPEN</Badge>
                                        )}
                                    </div>
                                    <div className="viewer-pool-card-price" style={{ color: p.isSold ? 'var(--success)' : 'var(--text-primary)' }}>
                                        ₹{p.isSold ? p.soldPrice : p.basePrice}L
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
