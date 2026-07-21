import React from 'react';
import './SummaryTiles.css';

export default function SummaryTiles({ summary }) {
    if (!summary) return null;

    const { totalSpent, soldCount, unsoldCount, avgValue } = summary;

    return (
        <div className="summary-section">
            <h2 className="section-title">Summary</h2>
            <div className="summary-big-grid">
                <div className="summary-big-tile">
                    <span className="big-val gold font-mono">₹{totalSpent}L</span>
                    <span className="small-lbl">Total Spent</span>
                </div>

                <div className="summary-big-tile">
                    <span className="big-val font-mono">{soldCount}</span>
                    <span className="small-lbl">Players Sold</span>
                </div>

                <div className="summary-big-tile">
                    <span className="big-val gray font-mono">{unsoldCount}</span>
                    <span className="small-lbl">Unsold</span>
                </div>

                <div className="summary-big-tile">
                    <span className="big-val blue font-mono">₹{avgValue}L</span>
                    <span className="small-lbl">Avg Price</span>
                </div>
            </div>
        </div>
    );
}
