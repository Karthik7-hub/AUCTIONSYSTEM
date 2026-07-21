import React from 'react';
import { Flame, TrendingUp, Users, Target } from 'lucide-react';
import './AuctionRecords.css';

export default function AuctionRecords({ records }) {
    if (!records) return null;

    const items = [
        {
            icon: Flame,
            color: 'red',
            title: 'Highest Bid',
            value: `₹${records.highestBid}L`,
            sub: 'Single player peak price'
        },
        {
            icon: TrendingUp,
            color: 'gold',
            title: 'Highest Spender',
            value: `₹${records.highestSpenderAmount}L`,
            sub: 'Maximum franchise spend'
        },
        {
            icon: Users,
            color: 'purple',
            title: 'Max Squad Size',
            value: `${records.largestSquadSize} Players`,
            sub: 'Largest roster assembled'
        },
        {
            icon: Target,
            color: 'green',
            title: 'Unsold Ratio',
            value: `${records.unsoldPercentage}%`,
            sub: 'Players remaining unsold'
        }
    ];

    return (
        <div className="records-section">
            <h2 className="section-title">Tournament Records</h2>

            <div className="records-grid">
                {items.map((item, idx) => (
                    <div key={idx} className="record-tile">
                        <div className={`record-icon ${item.color}`}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <div className="record-content">
                            <span className="record-title">{item.title}</span>
                            <span className={`record-val font-mono ${item.color}`}>{item.value}</span>
                            <span className="record-sub">{item.sub}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
