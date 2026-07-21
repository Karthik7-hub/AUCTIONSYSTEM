import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Button from '@shared/components/Button';

export default function SoldButtons({ sellPlayer, unsellPlayer, leadingTeamId }) {
    return (
        <div className="bid-console__outcome-actions">
            <Button
                onClick={sellPlayer}
                disabled={!leadingTeamId}
                variant="success"
                className="btn-lg bid-console__sold-btn"
            >
                <CheckCircle className="w-5 h-5" /> SOLD
            </Button>
            <Button
                onClick={unsellPlayer}
                variant="danger"
                className="btn-lg bid-console__unsold-btn"
            >
                <AlertCircle className="w-5 h-5" /> UNSOLD
            </Button>
        </div>
    );
}
