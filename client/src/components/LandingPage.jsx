import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trophy, ArrowRight, Calendar, Users, Shield, Zap, Archive, History } from 'lucide-react';

const API_URL = 'https://spl-auctionsystem-backend.onrender.com';

export default function LandingPage() {
    const navigate = useNavigate();
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State for Tabs
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'

    useEffect(() => {
        axios.get(`${API_URL}/api/auctions`)
            .then(res => {
                // Store ALL auctions, we will filter them in the render
                setAuctions(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // Filter Logic
    const filteredAuctions = auctions.filter(auction => {
        if (activeTab === 'active') return auction.isActive;
        if (activeTab === 'completed') return !auction.isActive;
        return true;
    });

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col relative overflow-hidden">

            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
            </div>

            {/* Main Content */}
            <div className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-12 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-xl shadow-blue-500/20">
                            <Trophy className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-white">Tournament Hub</h1>
                            <p className="text-slate-400 font-medium mt-1">Select an arena to enter</p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="bg-slate-900 p-1.5 rounded-xl flex shadow-lg border border-slate-800">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'active' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Zap className={`w-4 h-4 ${activeTab === 'active' ? 'fill-current' : ''}`} />
                            Live Events
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'completed' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <History className="w-4 h-4" />
                            Past Results
                        </button>
                    </div>
                </div>

                {/* Auction Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-64 text-slate-500 animate-pulse font-bold">
                        Loading Tournaments...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAuctions.map(auction => (
                            <div
                                key={auction._id}
                                onClick={() => navigate(`/auction/${auction._id}`)}
                                className={`group border rounded-3xl p-6 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl relative overflow-hidden flex flex-col h-full
                                    ${auction.isActive
                                        ? 'bg-slate-900 border-slate-800 hover:border-blue-500/50 hover:shadow-blue-900/20'
                                        : 'bg-slate-950 border-slate-900 hover:border-slate-800 opacity-75 hover:opacity-100'
                                    }`}
                            >
                                {/* Card Hover Gradient */}
                                <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity ${auction.isActive ? 'from-blue-600/5 to-transparent' : 'from-slate-700/10 to-transparent'}`}></div>

                                <div className="relative z-10 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl ${auction.isActive ? 'bg-slate-800' : 'bg-slate-900'}`}>
                                            {auction.isActive
                                                ? <Trophy className="w-6 h-6 text-yellow-500" />
                                                : <Archive className="w-6 h-6 text-slate-600" />
                                            }
                                        </div>
                                        {auction.isActive ? (
                                            <span className="bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/20 animate-pulse">
                                                LIVE NOW
                                            </span>
                                        ) : (
                                            <span className="bg-slate-800 text-slate-500 text-xs font-bold px-3 py-1 rounded-full border border-slate-700">
                                                COMPLETED
                                            </span>
                                        )}
                                    </div>

                                    <h3 className={`text-2xl font-bold mb-2 transition-colors ${auction.isActive ? 'text-white group-hover:text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                        {auction.name}
                                    </h3>

                                    <div className="space-y-3 mb-6 flex-1">
                                        <div className="flex items-center text-slate-500 text-sm">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            {new Date(auction.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                        </div>
                                        <div className="flex items-center text-slate-500 text-sm">
                                            <Users className="w-4 h-4 mr-2" />
                                            {auction.isActive ? "Spectator Access Open" : "View Results & Stats"}
                                        </div>
                                    </div>

                                    <div className={`flex items-center font-bold text-sm group-hover:translate-x-2 transition-transform ${auction.isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                                        {auction.isActive ? "Enter Arena" : "View Archive"} <ArrowRight className="w-4 h-4 ml-2" />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredAuctions.length === 0 && (
                            <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                                <div className="bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    {activeTab === 'active' ? <Trophy className="w-8 h-8 text-slate-700" /> : <History className="w-8 h-8 text-slate-700" />}
                                </div>
                                <h3 className="text-xl font-bold text-slate-500">
                                    {activeTab === 'active' ? "No Live Tournaments" : "No Past Tournaments Found"}
                                </h3>
                                <p className="text-slate-600 mt-2 text-sm">
                                    {activeTab === 'active' ? "Check back later for upcoming events." : "History will appear here once events conclude."}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="w-full border-t border-slate-900/50 bg-slate-950/80 backdrop-blur-md p-6 relative z-10 mt-auto">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
                    <p>© 2026 SPL Auction Platform. All rights reserved.</p>
                    <button
                        onClick={() => navigate('/super-admin')}
                        className="flex items-center gap-2 hover:text-slate-400 transition-colors group"
                    >
                        <Shield className="w-3 h-3 group-hover:text-blue-500 transition-colors" />
                        <span className="font-bold">Authorized Access Only</span>
                    </button>
                </div>
            </div>

        </div>
    );
}