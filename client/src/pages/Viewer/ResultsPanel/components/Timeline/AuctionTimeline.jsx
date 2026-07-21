import React from 'react';
import './AuctionTimeline.css';

export default function AuctionTimeline({ timeline }) {
    if (!timeline || timeline.length === 0) return null;

    const timelineIcons = ['🏁', '⚡', '🔥', '🏆'];

    return (
        <div className="timeline-section">
            <h2 className="section-title">Auction Milestones</h2>

            <div className="timeline-card">
                <div className="timeline-flow">
                    {timeline.map((item, index) => (
                        <div key={item.id || index} className="timeline-flow-item">
                            <div className="timeline-icon-glow">
                                {timelineIcons[index % timelineIcons.length]}
                            </div>
                            <div className="timeline-content">
                                <div className="timeline-title-row">
                                    <span className="timeline-title">{item.title}</span>
                                    <span className="timeline-time">{item.time}</span>
                                </div>
                                <div className="timeline-detail">{item.detail}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
