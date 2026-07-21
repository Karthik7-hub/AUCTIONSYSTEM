import React, { useState } from 'react';
import { Gavel, RotateCcw, Minus, Plus } from 'lucide-react';
import Button from '@shared/components/Button';
import CustomBidInput from './components/CustomBidInput';
import BidButtons from './components/BidButtons';
import SoldButtons from './components/SoldButtons';
import './BidConsole.css';

export default function BidConsole({
    teams,
    liveState,
    currentPlayer,
    placeBid,
    undoBid,
    sellPlayer,
    unsellPlayer,
    isPending,
    showAlert
}) {
    const [increment, setIncrement] = useState(10);
    const [customBid, setCustomBid] = useState('');

    const handlePlaceBid = (teamId) => {
        const team = teams.find(t => t._id === teamId);
        if (!team) return;

        const customBidAmount = parseFloat(customBid);
        const nextBid = (!isNaN(customBidAmount) && customBidAmount > 0)
            ? customBidAmount
            : (liveState.leadingTeamId === null
                ? (currentPlayer?.basePrice || 0)
                : (liveState.currentBid + increment));

        const isFirstBid = liveState.leadingTeamId === null;
        const isBidTooLow = isFirstBid ? nextBid < liveState.currentBid : nextBid <= liveState.currentBid;
        if (isBidTooLow) {
            showAlert("Invalid Bid", `Bid amount must be at least ₹${liveState.currentBid}L!`, "error");
            return;
        }

        if (team.budget - team.spent < nextBid) {
            showAlert("Insufficient Funds", `Insufficient funds! ${team.name} has only ₹${team.budget - team.spent}L left.`, "error");
            return;
        }

        placeBid(teamId, nextBid);
        setCustomBid('');
    };

    return (
        <div className="bid-console">
            <div className="bid-console__inner">

                {/* Header */}
                <div className="bid-console__header">
                    <div className="bid-console__title">
                        <Gavel className="w-4 h-4 bid-console__title-icon" /> Bidding Paddles
                    </div>

                    <div className="bid-console__actions">
                        <CustomBidInput customBid={customBid} setCustomBid={setCustomBid} />

                        {/* Undo Button */}
                        <Button
                            onClick={undoBid}
                            disabled={!liveState.leadingTeamId}
                            variant="secondary"
                            className="bid-console__undo-btn"
                        >
                            <RotateCcw className="w-4 h-4" /> Undo
                        </Button>

                        <div className="bid-console__increment-pill">
                            <button 
                                onClick={() => setIncrement(Math.max(1, increment - 5))}
                                className="bid-console__increment-button"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="bid-console__increment-value">₹{increment}</span>
                            <button 
                                onClick={() => setIncrement(increment + 5)}
                                className="bid-console__increment-button"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Paddles Grid */}
                <BidButtons
                    teams={teams}
                    customBid={customBid}
                    liveState={liveState}
                    currentPlayer={currentPlayer}
                    increment={increment}
                    placeBid={handlePlaceBid}
                    isPending={isPending}
                />

                {/* Footer Actions */}
                <SoldButtons
                    sellPlayer={sellPlayer}
                    unsellPlayer={unsellPlayer}
                    leadingTeamId={liveState.leadingTeamId}
                />

            </div>
        </div>
    );
}
