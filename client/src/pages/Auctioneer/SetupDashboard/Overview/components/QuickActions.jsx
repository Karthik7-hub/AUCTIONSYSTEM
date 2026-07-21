import React from 'react';
import { Play, Check, Copy, Users, UserPlus, Zap } from 'lucide-react';
import Button from '@shared/components/Button';

export default function QuickActions({ isCompleted, navigate, config, copyInviteLink, copied, setActiveTab }) {
    return (
        <div className="dashboard__card dashboard__quick-actions">
            <div className="dashboard__quick-header">
                <div>
                    <h3 className="dashboard__quick-title">Quick Launch Center</h3>
                    <p className="dashboard__quick-desc">
                        Manage your live auction session or copy tournament access links.
                    </p>
                </div>
                <div className="dashboard__status-pill">
                    <Zap className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                    <span>{isCompleted ? 'Archived' : 'Ready'}</span>
                </div>
            </div>

            <div className="dashboard__quick-group">
                {isCompleted ? (
                    <div className="dashboard__quick-alert">
                        Tournament Completed
                    </div>
                ) : (
                    <Button 
                        onClick={() => navigate(`/auction/${config?.slug}/live`)} 
                        variant="success" 
                        className="dashboard__quick-btn dashboard__quick-btn--hero"
                    >
                        <Play className="w-5 h-5 fill-current" /> Launch Live Console
                    </Button>
                )}
                <Button 
                    onClick={copyInviteLink} 
                    variant="secondary" 
                    className="dashboard__quick-btn"
                >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Tournament Share Link'}</span>
                </Button>
            </div>

            <div className="dashboard__quick-grid">
                <button 
                    onClick={() => setActiveTab('teams')} 
                    className="dashboard__quick-tab-card"
                >
                    <Users className="w-4 h-4 text-accent" />
                    <span>Configure Teams</span>
                </button>
                <button 
                    onClick={() => setActiveTab('players')} 
                    className="dashboard__quick-tab-card"
                >
                    <UserPlus className="w-4 h-4 text-green-600" />
                    <span>Configure Players</span>
                </button>
            </div>
        </div>
    );
}
