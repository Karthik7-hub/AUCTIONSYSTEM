import React from 'react';

export default function StatsCard({ title, value, icon: Icon, iconBg = 'var(--accent-muted)', iconColor = 'var(--accent)', subtitle }) {
    return (
        <div className="dashboard__matrix-card">
            <div className="dashboard__matrix-header">
                <div className="dashboard__matrix-icon-wrapper" style={{ backgroundColor: iconBg, color: iconColor }}>
                    <Icon className="w-5 h-5" style={{ color: iconColor }} />
                </div>
                <span className="dashboard__matrix-label">{title}</span>
            </div>
            <div className="dashboard__matrix-value">{value}</div>
            {subtitle && (
                <div className="dashboard__matrix-subtitle">{subtitle}</div>
            )}
        </div>
    );
}
