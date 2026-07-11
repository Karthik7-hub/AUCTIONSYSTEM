import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowRight, Calendar, Users, Shield, Zap, Archive, History } from 'lucide-react';
import { getAuctions } from '@services/auction.service';
import Loader from '@components/ui/Loader';

export default function LandingPage() {
    const navigate = useNavigate();
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State for Tabs
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'

    useEffect(() => {
        getAuctions()
            .then(res => {
                setAuctions(res.data);
                const hasActive = res.data.some(a => a.status !== 'completed' && a.status !== 'draft' && a.isActive !== false);
                if (!hasActive) {
                    setActiveTab('completed');
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // Filter Logic
    const filteredAuctions = auctions.filter(auction => {
        // Completely hide draft tournaments from landing page visibility
        if (auction.status === 'draft') return false;

        const isCompleted = auction.status === 'completed' || auction.isActive === false;
        if (activeTab === 'active') return !isCompleted;
        if (activeTab === 'completed') return isCompleted;
        return true;
    });

    return (
        <div className="landing-page theme-dark">
            {/* Background Decoration */}
            <div className="landing-glow-1"></div>
            <div className="landing-glow-2"></div>

            {/* Main Content */}
            <div className="container flex-1 relative z-10">
                {/* Header */}
                <div className="landing-header">
                    <div className="brand-wrapper">
                        <div className="brand-icon-bg">
                            <Trophy className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="brand-title">Tournament Hub</h1>
                            <p className="brand-subtitle">Select an arena to enter</p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="nav-tabs">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`nav-tab-btn ${activeTab === 'active' ? 'nav-tab-btn-active' : ''}`}
                        >
                            <Zap className="w-4 h-4" />
                            Live Events
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`nav-tab-btn ${activeTab === 'completed' ? 'nav-tab-btn-active' : ''}`}
                        >
                            <History className="w-4 h-4" />
                            Past Results
                        </button>
                    </div>
                </div>

                {/* Auction Grid */}
                {loading ? (
                    <Loader message="Loading Tournaments..." />
                ) : (
                    <div className="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-3 gap-6">
                        {filteredAuctions.map(auction => {
                            const isLive = auction.status !== 'completed' && auction.isActive !== false;
                            return (
                                <div
                                    key={auction._id}
                                    onClick={() => navigate(`/auction/${auction.slug || auction._id}`)}
                                    className={`card tournament-card ${isLive ? 'card-active' : 'card-inactive'}`}
                                >
                                    <div className="card-body">
                                        <div className="card-header">
                                            <div className="card-header-icon">
                                                {isLive
                                                    ? <Trophy className="w-6 h-6 text-yellow-500" />
                                                    : <Archive className="w-6 h-6" />
                                                }
                                            </div>
                                            {isLive ? (
                                                <span className="tournament-badge tournament-badge-live animate-pulse">
                                                    LIVE NOW
                                                </span>
                                            ) : (
                                                <span className="tournament-badge tournament-badge-completed">
                                                    COMPLETED
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="tournament-card-title">
                                            {auction.name}
                                        </h3>

                                        <div className="tournament-meta flex-1">
                                            <div className="tournament-meta-item">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(auction.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                            </div>
                                            <div className="tournament-meta-item">
                                                <Users className="w-4 h-4" />
                                                {isLive ? "Spectator Access Open" : "View Results & Stats"}
                                            </div>
                                        </div>

                                        <div className="card-footer">
                                            <div className={`landing-card-link ${isLive ? 'landing-card-link-active' : 'landing-card-link-completed'}`}>
                                                {isLive ? "Enter Arena" : "View Archive"} <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredAuctions.length === 0 && (
                            <div className="landing-empty-container">
                                <div className="landing-empty-icon-bg">
                                    {activeTab === 'active' ? <Trophy className="w-8 h-8" /> : <History className="w-8 h-8" />}
                                </div>
                                <h3 className="landing-empty-title">
                                    {activeTab === 'active' ? "No Live Tournaments" : "No Past Tournaments Found"}
                                </h3>
                                <p className="landing-empty-subtitle">
                                    {activeTab === 'active' ? "Check back later for upcoming events." : "History will appear here once events conclude."}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="landing-footer-bar">
                <div className="landing-footer-container">
                    <p>© 2026 Auction Platform. All rights reserved.</p>
                    <button
                        onClick={() => navigate('/super-admin')}
                        className="landing-admin-access-btn"
                    >
                        <Shield className="w-3 h-3" />
                        <span>Authorized Access Only</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
