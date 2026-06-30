import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Trash2, ExternalLink, Key, Shield, Plus, LogOut,
    Save, X, Edit2, Power, Layers, Users, Zap, Search,
    CheckCircle, Clock, Archive
} from 'lucide-react';

const API_URL = 'https://auctionsystem-backend.onrender.com';

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const [auctions, setAuctions] = useState([]);

    // --- UI STATES ---
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
    const [searchQuery, setSearchQuery] = useState('');

    // --- MODAL STATES ---
    const [showCreate, setShowCreate] = useState(false);
    const [editingAuction, setEditingAuction] = useState(null);

    // --- FORM STATES ---
    const [newAuction, setNewAuction] = useState({
        name: '', accessCode: '', categories: 'Marquee, Set 1, Set 2', roles: 'Batsman, Bowler'
    });

    useEffect(() => {
        if (!localStorage.getItem('super_admin_token')) navigate('/super-admin');
        fetchAuctions();
    }, [navigate]);

    const fetchAuctions = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/auctions`);
            setAuctions(res.data);
        } catch (err) { console.error(err); }
    };

    // --- FILTER LOGIC ---
    const filteredAuctions = auctions.filter(auction => {
        // 1. Filter by Tab
        const statusMatch = activeTab === 'active' ? auction.isActive : !auction.isActive;
        // 2. Filter by Search
        const searchMatch = auction.name.toLowerCase().includes(searchQuery.toLowerCase());

        return statusMatch && searchMatch;
    });

    // --- ACTIONS ---
    const handleDelete = async (id) => {
        if (window.confirm("⚠️ DANGER: This will permanently delete the Tournament, Teams, and Players. Continue?")) {
            await axios.delete(`${API_URL}/api/auctions/${id}`);
            fetchAuctions();
        }
    };

    const handleAdminLogin = (auctionId) => {
        localStorage.setItem(`admin_auth_${auctionId}`, 'true');
        navigate(`/auction/${auctionId}`, { state: { autoLogin: true } });
    };

    const toggleStatus = async (auction) => {
        await axios.put(`${API_URL}/api/auctions/${auction._id}`, { isActive: !auction.isActive });
        fetchAuctions();
    };

    const handleCreate = async () => {
        if (!newAuction.name || !newAuction.accessCode) return;
        const payload = {
            ...newAuction,
            categories: newAuction.categories.split(',').map(s => s.trim()).filter(s => s),
            roles: newAuction.roles.split(',').map(s => s.trim()).filter(s => s)
        };
        await axios.post(`${API_URL}/api/create-auction`, payload);
        setShowCreate(false);
        setNewAuction({ name: '', accessCode: '', categories: 'Marquee, Set 1, Set 2', roles: 'Batsman, Bowler' });
        fetchAuctions();
    };

    const handleUpdate = async () => {
        if (!editingAuction) return;
        const payload = {
            name: editingAuction.name,
            accessCode: editingAuction.accessCode,
            isActive: editingAuction.isActive,
            categories: Array.isArray(editingAuction.categories)
                ? editingAuction.categories
                : editingAuction.categories.split(',').map(s => s.trim()).filter(s => s),
            roles: Array.isArray(editingAuction.roles)
                ? editingAuction.roles
                : editingAuction.roles.split(',').map(s => s.trim()).filter(s => s)
        };
        await axios.put(`${API_URL}/api/auctions/${editingAuction._id}`, payload);
        setEditingAuction(null);
        fetchAuctions();
    };

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans p-4 md:p-8 lg:p-12 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

            {/* --- CREATE MODAL --- */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Zap className="w-5 h-5 text-blue-500" /> Create Tournament
                            </h2>
                            <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6 [&::-webkit-scrollbar]:hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tournament Name</label>
                                    <input className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl mt-1 focus:border-blue-500 outline-none" value={newAuction.name} onChange={e => setNewAuction({ ...newAuction, name: e.target.value })} placeholder="e.g. SPL Season 5" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Host Password</label>
                                    <input className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl mt-1 focus:border-blue-500 outline-none font-mono" value={newAuction.accessCode} onChange={e => setNewAuction({ ...newAuction, accessCode: e.target.value })} placeholder="Secret123" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Categories (Comma Separated)</label>
                                <textarea className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl mt-1 h-20 text-sm font-mono focus:border-blue-500 outline-none" value={newAuction.categories} onChange={e => setNewAuction({ ...newAuction, categories: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Roles (Comma Separated)</label>
                                <textarea className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl mt-1 h-20 text-sm font-mono focus:border-blue-500 outline-none" value={newAuction.roles} onChange={e => setNewAuction({ ...newAuction, roles: e.target.value })} />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
                            <button onClick={() => setShowCreate(false)} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-900 transition-colors">Cancel</button>
                            <button onClick={handleCreate} className="px-8 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2">Deploy</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- EDIT MODAL --- */}
            {editingAuction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-blue-500" /> Edit Tournament
                            </h2>
                            <button onClick={() => setEditingAuction(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6 [&::-webkit-scrollbar]:hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tournament Name</label>
                                    <input className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl mt-1 focus:border-blue-500 outline-none" value={editingAuction.name} onChange={e => setEditingAuction({ ...editingAuction, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Host Password</label>
                                    <input className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl mt-1 focus:border-blue-500 outline-none font-mono" value={editingAuction.accessCode} onChange={e => setEditingAuction({ ...editingAuction, accessCode: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Status</label>
                                <div className="flex gap-4">
                                    <button onClick={() => setEditingAuction({ ...editingAuction, isActive: true })} className={`flex-1 py-3 rounded-xl font-bold border transition-all ${editingAuction.isActive ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>Active (Live)</button>
                                    <button onClick={() => setEditingAuction({ ...editingAuction, isActive: false })} className={`flex-1 py-3 rounded-xl font-bold border transition-all ${!editingAuction.isActive ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>Completed</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Categories (Comma Separated)</label>
                                <textarea className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl mt-1 h-24 text-sm font-mono focus:border-blue-500 outline-none" value={Array.isArray(editingAuction.categories) ? editingAuction.categories.join(', ') : editingAuction.categories} onChange={e => setEditingAuction({ ...editingAuction, categories: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Roles (Comma Separated)</label>
                                <textarea className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl mt-1 h-24 text-sm font-mono focus:border-blue-500 outline-none" value={Array.isArray(editingAuction.roles) ? editingAuction.roles.join(', ') : editingAuction.roles} onChange={e => setEditingAuction({ ...editingAuction, roles: e.target.value })} />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
                            <button onClick={() => setEditingAuction(null)} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-900 transition-colors">Cancel</button>
                            <button onClick={handleUpdate} className="px-8 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">

                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20"><Shield className="w-8 h-8 text-red-500" /></div>
                        <div><h1 className="text-3xl font-black">Super Admin</h1><p className="text-slate-500 text-sm">Central Command</p></div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"><Plus className="w-5 h-5" /> New Tournament</button>
                        <button onClick={() => { localStorage.removeItem('super_admin_token'); navigate('/'); }} className="bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors border border-slate-800"><LogOut className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* --- NAVIGATION & SEARCH --- */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    {/* Tabs */}
                    <div className="bg-slate-900 p-1.5 rounded-xl inline-flex">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'active' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-400'}`}
                        >
                            <Zap className="w-4 h-4" /> Active ({auctions.filter(a => a.isActive).length})
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'completed' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-400'}`}
                        >
                            <Archive className="w-4 h-4" /> Completed ({auctions.filter(a => !a.isActive).length})
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                        <input
                            placeholder="Search tournaments..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* --- AUCTION LIST --- */}
                <div className="grid gap-4">
                    {filteredAuctions.map(auction => (
                        <div key={auction._id} className="group bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-slate-700 transition-all hover:shadow-xl hover:shadow-blue-900/10">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <button
                                        onClick={() => toggleStatus(auction)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border flex items-center gap-2 transition-all hover:scale-105 ${auction.isActive ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                                        title="Click to Toggle Status"
                                    >
                                        <Power className="w-3 h-3" />
                                        {auction.isActive ? 'Live' : 'Completed'}
                                    </button>
                                    <h2 className="text-xl font-bold text-white tracking-tight">{auction.name}</h2>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mt-3">
                                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                                        <Key className="w-4 h-4 text-slate-500" />
                                        <span className="font-mono font-bold text-white tracking-wider">{auction.accessCode}</span>
                                    </div>
                                    <div className="hidden md:flex items-center gap-1"><Layers className="w-4 h-4" /> {auction.categories.length} Cats</div>
                                    <div className="hidden md:flex items-center gap-1"><Users className="w-4 h-4" /> {auction.roles.length} Roles</div>
                                    <div className="hidden md:flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(auction.date).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button onClick={() => setEditingAuction(auction)} className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95"><Edit2 className="w-4 h-4" /> Edit</button>
                                <button onClick={() => handleAdminLogin(auction._id)} className="flex-1 md:flex-none bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-blue-600/30 transition-all active:scale-95"><ExternalLink className="w-4 h-4" /> Enter</button>
                                <button onClick={() => handleDelete(auction._id)} className="flex-1 md:flex-none bg-red-900/10 hover:bg-red-900/20 text-red-500 px-4 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-red-900/30 transition-all active:scale-95"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}

                    {filteredAuctions.length === 0 && (
                        <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl">
                            {searchQuery ? 'No matching tournaments found.' : activeTab === 'active' ? 'No active tournaments. Create one above.' : 'No completed tournaments found.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}