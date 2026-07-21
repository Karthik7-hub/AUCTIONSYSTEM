import React from 'react';
import AchievementCard from './AchievementCard';
import './AchievementsGrid.css';

export default function AchievementsGrid({ highlights }) {
    if (!highlights) return null;

    return (
        <div className="achievements-section">
            <h2 className="section-title">Tournament Highlights</h2>
            <div className="achievements-grid">
                {highlights.highestSpender && (
                    <AchievementCard type="highestSpender" data={highlights.highestSpender} />
                )}
                {highlights.mostExpensivePlayer && (
                    <AchievementCard type="mostExpensivePlayer" data={highlights.mostExpensivePlayer} />
                )}
                {highlights.largestSquad && (
                    <AchievementCard type="largestSquad" data={highlights.largestSquad} />
                )}
                {highlights.mostActiveTeam && (
                    <AchievementCard type="mostActiveTeam" data={highlights.mostActiveTeam} />
                )}
            </div>
        </div>
    );
}
