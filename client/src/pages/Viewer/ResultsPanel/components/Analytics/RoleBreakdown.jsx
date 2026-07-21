import React from 'react';
import './RoleBreakdown.css';

export default function RoleBreakdown({ roleBreakdown }) {
    if (!roleBreakdown) return null;

    const roles = Object.keys(roleBreakdown);
    if (roles.length === 0) return null;

    const roleColors = {
        'Batsman': '#3B82F6',
        'Bowler': '#10B981',
        'All Rounder': '#8B5CF6',
        'Wicket Keeper': '#F59E0B',
        'Default': '#6B7280'
    };

    return (
        <div className="role-breakdown-section">
            <h2 className="section-title">Role Distribution</h2>

            <div className="role-breakdown-grid">
                {roles.map(roleName => {
                    const data = roleBreakdown[roleName];
                    const color = roleColors[roleName] || roleColors['Default'];

                    return (
                        <div key={roleName} className="role-card">
                            <div className="role-card__top">
                                <span className="role-card__title">🏏 {roleName}</span>
                                <span className="role-card__count">{data.players} Sold</span>
                            </div>

                            <div className="role-card__main font-mono" style={{ color }}>
                                ₹{data.money}L
                            </div>

                            <div className="role-card__sub font-mono">
                                <span>Avg: ₹{data.average}L</span>
                                <span>{data.percentage}% Purse</span>
                            </div>

                            <div className="role-card__bar-bg">
                                <div
                                    className="role-card__bar-fill"
                                    style={{ width: `${data.percentage}%`, backgroundColor: color }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
