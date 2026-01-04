import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trophy, ArrowRight, ShieldCheck, Lock } from 'lucide-react';

const API_URL = 'https://spl-auctionsystem-backend.onrender.com';

export default function LandingPage() {
    const navigate = useNavigate();
    const [auctions, setAuctions] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [masterPassword, setMasterPassword] = useState('');

    // Updated State with Defaults
    const [newAuction, setNewAuction] = useState({
        name: '',
        accessCode: '',
        categories: 'Marquee, Set 1, Set 2, Set 3, Set 4',
        roles: 'Batsman, Bowler, All Rounder, Wicket Keeper'
    });

    useEffect(() => {
        axios.get(`${API_URL}/api/auctions`).then(res => setAuctions(res.data));
    }, []);

    const handleCreate = async () => {
        if (masterPassword !== 'superadmin123') return alert("Invalid Master Password");
        if (!newAuction.name || !newAuction.accessCode) return;

        // Process comma-separated strings into Arrays
        const payload = {
            ...newAuction,
            categories: newAuction.categories.split(',').map(s => s.trim()).filter(s => s),
            roles: newAuction.roles.split(',').map(s => s.trim()).filter(s => s)
        };

        try {
            await axios.post(`${API_URL}/api/create-auction`, payload);
            window.location.reload();
        } catch (error) {
            alert("Error creating auction");
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-12">
                    <h1 className="text-3xl font-black flex items-center gap-4">
                        <Trophy className="text-blue-500" /> Tournament Hub
                    </h1>
                    <button onClick={() => setShowCreate(!showCreate)} className="p-3 bg-slate-800 rounded-full border border-slate-700">
                        {showCreate ? <ShieldCheck className="w-5 h-5 text-green-400" /> : <Lock className="w-5 h-5 text-slate-500" />}
                    </button>
                </div>

                {showCreate && (
                    <div className="bg-slate-800/50 p-6 rounded-3xl mb-12 border border-slate-700 grid md:grid-cols-2 gap-4">
                        <input type="password" placeholder="Master Password" className="bg-slate-900 border border-slate-700 p-3 rounded-xl col-span-2" value={masterPassword} onChange={e => setMasterPassword(e.target.value)} />

                        <input placeholder="Tournament Name" className="bg-slate-900 border border-slate-700 p-3 rounded-xl" value={newAuction.name} onChange={e => setNewAuction({ ...newAuction, name: e.target.value })} />
                        <input placeholder="Host Password" className="bg-slate-900 border border-slate-700 p-3 rounded-xl" value={newAuction.accessCode} onChange={e => setNewAuction({ ...newAuction, accessCode: e.target.value })} />

                        <div className="col-span-2">
                            <label className="text-xs text-slate-400 font-bold uppercase ml-1">Categories (Comma separated)</label>
                            <textarea className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl mt-1 h-20" value={newAuction.categories} onChange={e => setNewAuction({ ...newAuction, categories: e.target.value })} />
                        </div>

                        <div className="col-span-2">
                            <label className="text-xs text-slate-400 font-bold uppercase ml-1">Roles (Comma separated)</label>
                            <textarea className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl mt-1 h-20" value={newAuction.roles} onChange={e => setNewAuction({ ...newAuction, roles: e.target.value })} />
                        </div>

                        <button onClick={handleCreate} className="md:col-span-2 bg-blue-600 py-3 rounded-xl font-bold mt-2 hover:bg-blue-700">Create Tournament</button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {auctions.map(auction => (
                        <div key={auction._id} onClick={() => navigate(`/auction/${auction._id}`)} className="bg-slate-800 p-6 rounded-3xl border border-slate-700 cursor-pointer hover:border-blue-500 transition-all">
                            <h3 className="text-xl font-bold">{auction.name}</h3>
                            <div className="text-slate-400 text-sm mt-2 flex items-center gap-2">Enter Arena <ArrowRight className="w-4 h-4" /></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}