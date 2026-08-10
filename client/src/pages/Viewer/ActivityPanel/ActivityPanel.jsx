import React from 'react';
import { ListFilter, ChevronDown } from 'lucide-react';
import useActivityPanel from './hooks/useActivityPanel';
import BidHistoryModal from './BidHistoryModal';
import './ActivityPanel.css';

const getContrastColor = (hexColor) => {
    if (!hexColor || hexColor.charAt(0) !== '#') return '#ffffff';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

const SORT_OPTIONS = [
    { value: 'recent', label: 'Recent Purchases', shortLabel: 'Recent' },
    { value: 'oldest', label: 'Oldest Purchases', shortLabel: 'Oldest' },
    { value: 'price-desc', label: 'Price: High to Low', shortLabel: 'Price: High-Low' },
    { value: 'price-asc', label: 'Price: Low to High', shortLabel: 'Price: Low-High' },
    { value: 'name-asc', label: 'Name: A to Z', shortLabel: 'Name: A-Z' }
];

export default function ActivityPanel({ players, teamMap }) {
    const {
        feedSort,
        setFeedSort,
        isSortMenuOpen,
        setIsSortMenuOpen,
        historyPlayer,
        setHistoryPlayer,
        sortedFeedPlayers
    } = useActivityPanel(players);

    const activeSortLabel = SORT_OPTIONS.find(opt => opt.value === feedSort)?.shortLabel || 'Recent';

    return (
        <div className="feed">
            <div className="feed__header">
                <span>Live Feed</span>
                
                {/* Custom Sorting Dropdown */}
                <div className="feed__sort-container">
                    {isSortMenuOpen && (
                        <div 
                            onClick={() => setIsSortMenuOpen(false)} 
                            className="feed__sort-backdrop"
                        />
                    )}
                    <button 
                        onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                        className="feed__sort-btn tr-hover"
                    >
                        <ListFilter className="w-4 h-4" />
                        <span>{activeSortLabel}</span>
                        <ChevronDown className={`w-3.5 h-3.5 feed__sort-icon-chevron ${isSortMenuOpen ? 'feed__sort-icon-chevron--open' : ''}`} />
                    </button>

                    {isSortMenuOpen && (
                        <div className="feed__sort-menu">
                            {SORT_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        setFeedSort(opt.value);
                                        setIsSortMenuOpen(false);
                                    }}
                                    className={`feed__sort-option tr-hover ${feedSort === opt.value ? 'feed__sort-option--active' : ''}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="feed__list">
                {sortedFeedPlayers.map(p => {
                    const team = teamMap.get(p.soldTo);
                    return (
                        <div key={p._id} className="feed__row tr-hover" onClick={() => setHistoryPlayer(p)}>
                            <div className="feed__row-inner">
                                <div className="feed__avatar">{p.name.charAt(0)}</div>
                                <div>
                                    <div className="viewer-team-card-player-name">{p.name}</div>
                                    <div className="feed__player-role">{p.role}</div>
                                </div>
                            </div>
                            <div className="feed__price-col">
                                <div className="feed__badge" style={{ backgroundColor: team?.color || '#555', color: getContrastColor(team?.color) }}>{team?.name}</div>
                                <div className="feed__price">₹{p.soldPrice}L</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {historyPlayer && (
                <BidHistoryModal
                    historyPlayer={historyPlayer}
                    onClose={() => setHistoryPlayer(null)}
                    teamMap={teamMap}
                />
            )}
        </div>
    );
}
