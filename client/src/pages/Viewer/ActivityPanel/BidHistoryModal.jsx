import React from 'react';
import Modal from '@shared/components/Modal';
import './BidHistoryModal.css';

export default function BidHistoryModal({ historyPlayer, onClose, teamMap }) {
    if (!historyPlayer) return null;

    return (
        <Modal isOpen={!!historyPlayer} onClose={onClose} title="Bidding History">
            <div className="history-modal">
                <div className="history-modal__header">
                    <div className="history-modal__details">
                        <div className="history-modal__player-name">{historyPlayer.name}</div>
                        <div className="history-modal__player-sub">{historyPlayer.role} • {historyPlayer.category}</div>
                    </div>
                    <div className="history-modal__price-col">
                        <div className="history-modal__price-val">₹{historyPlayer.soldPrice}L</div>
                        <div className="history-modal__price-label">Sold Price</div>
                    </div>
                </div>

                <div className="history-modal__list">
                    {historyPlayer.bidHistory && historyPlayer.bidHistory.length > 0 ? (
                        [...historyPlayer.bidHistory].reverse().map((hist, idx) => {
                            const biddingTeam = teamMap.get(hist.leader);
                            return (
                                <div key={idx} className="history-modal__row">
                                    <div className="history-modal__team-col">
                                        {biddingTeam ? (
                                            <>
                                                <div className="history-modal__team-avatar" style={{ backgroundColor: biddingTeam.color }}>
                                                    {biddingTeam.name.charAt(0)}
                                                </div>
                                                <span className="history-modal__team-name">{biddingTeam.name}</span>
                                            </>
                                        ) : (
                                            <span className="history-modal__base-label">Base Price</span>
                                        )}
                                    </div>
                                    <span className="history-modal__bid-value">₹{hist.bid ?? historyPlayer.basePrice ?? 20}L</span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="history-modal__empty">No bid details saved for this player round.</div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
