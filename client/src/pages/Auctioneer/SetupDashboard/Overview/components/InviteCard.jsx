import React from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';

export default function InviteCard({ config, showAccessCode, setShowAccessCode }) {
    return (
        <div className="dashboard__card invite-card">
            <h3 className="invite-card__title">Spectator Passcode</h3>
            <div className="invite-card__box">
                <div className="invite-card__left">
                    <Key className="w-4 h-4 text-slate-500" />
                    <span className="font-mono font-bold">
                        {showAccessCode ? config?.accessCode : '••••••'}
                    </span>
                </div>
                <button
                    onClick={() => setShowAccessCode(!showAccessCode)}
                    className="invite-card__toggle-btn"
                >
                    {showAccessCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}
