import React from 'react';
import { X } from 'lucide-react';

export default function CustomBidInput({ customBid, setCustomBid }) {
    return (
        <label className="custom-bid-input">
            <span className="custom-bid-input__label">Custom:</span>
            <input
                type="number"
                value={customBid}
                onChange={e => setCustomBid(e.target.value)}
                placeholder="Next..."
                className="custom-bid-input__field"
            />
            {customBid && (
                <button
                    onClick={() => setCustomBid('')}
                    className="custom-bid-input__clear"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </label>
    );
}
