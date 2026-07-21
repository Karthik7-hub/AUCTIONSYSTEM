import React from 'react';
import { Wallet } from 'lucide-react';

export default function BidButtons({ teams, customBid, liveState, currentPlayer, increment, placeBid, isPending }) {
    return (
        <div className="bid-console__paddles-container">
            <div className="bid-console__paddles-grid">
                {teams.map(team => {
                    const customBidAmount = parseFloat(customBid);
                    const nextBidAmount = (!isNaN(customBidAmount) && customBidAmount > 0)
                        ? customBidAmount
                        : (liveState.leadingTeamId === null ? (currentPlayer?.basePrice || 0) : liveState.currentBid + increment);
                    
                    const canAfford = (team.budget - team.spent) >= nextBidAmount;
                    const isLeader = liveState.leadingTeamId === team._id;
                    const remaining = team.budget - team.spent;

                    return (
                        <button
                            key={team._id}
                            onClick={() => placeBid(team._id)}
                            disabled={!canAfford || isLeader || isPending}
                            className={`bid-console__paddle-btn ${isLeader ? 'bid-console__paddle-btn--leader' : ''}`}
                            style={{
                                backgroundColor: team.color
                            }}
                        >
                            <div className="bid-console__paddle-team-name">
                                {team.name}
                            </div>

                            <div className="bid-console__paddle-bid-bubble">
                                {isLeader ? 'HOLDING' : `₹${nextBidAmount}L`}
                            </div>

                            <div className="bid-console__paddle-purse">
                                <Wallet className="w-3 h-3 bid-console__paddle-purse-icon" /> ₹{remaining}L
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
