import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Users, UserPlus, Play, LogOut, Trophy, Trash2, Filter,
    LayoutGrid, List, Search, X, User, CheckCircle, AlertCircle,
    Clock, Crown, Layers, Wallet, ChevronRight
} from 'lucide-react';

// --- CONFIGURATION ---
// Changed from localhost to your Render Backend URL
const API_BASE_URL = 'https://spl-auctionsystem-backend.onrender.com';

const CATEGORIES = ['Marquee', 'Set 1', 'Set 2', 'Set 3', 'Set 4'];
const ROLES = ['Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper'];

export default function SetupDashboard({ data, setView }) {
    const [auctionCode, setAuctionCode] = useState('');
    const [activeTab, setActiveTab] = useState('players');
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTeam, setSelectedTeam] = useState(null);

    // Form States
    const [newTeam, setNewTeam] = useState({ name: '', budget: 1000, color: '#3B82F6' });
    const [newPlayer, setNewPlayer] = useState({ name: '', role: 'Batsman', category: 'Set 1', basePrice: 20 });

    useEffect(() => {
        setAuctionCode(Math.random().toString(36).substring(2, 8).toUpperCase());
    }, []);

    const totalBudget = data.teams.reduce((acc, t) => acc + t.budget, 0);
    const totalSpent = data.teams.reduce((acc, t) => acc + t.spent, 0);

    // --- ACTIONS ---
    const addTeam = async () => {
        if (!newTeam.name) return;
        try {
            // Updated to use Render URL
            await axios.post(`${API_BASE_URL}/api/teams`, newTeam);
            setNewTeam({ name: '', budget: 1000, color: '#3B82F6' });
            // Ideally trigger a data refresh here
            window.location.reload();
        } catch (error) {
            console.error("Error adding team:", error);
            alert("Failed to add team. Check console.");
        }
    };

    const deleteTeam = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Delete this team?')) {
            try {
                // Updated to use Render URL
                await axios.delete(`${API_BASE_URL}/api/teams/${id}`);
                window.location.reload();
            } catch (error) {
                console.error("Error deleting team:", error);
            }
        }
    };

    const addPlayer = async () => {
        if (!newPlayer.name) return;
        try {
            // Updated to use Render URL
            await axios.post(`${API_BASE_URL}/api/players`, newPlayer);
            setNewPlayer({ ...newPlayer, name: '', basePrice: 20 });
            window.location.reload();
        } catch (error) {
            console.error("Error adding player:", error);
            alert("Failed to add player. Check console.");
        }
    };

    const deletePlayer = async (id) => {
        if (window.confirm('Are you sure you want to delete this player?')) {
            try {
                // Updated to use Render URL
                await axios.delete(`${API_BASE_URL}/api/players/${id}`);
                window.location.reload();
            } catch (error) {
                console.error("Error deleting player:", error);
                alert("Error deleting player");
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative pb-20">

            {/* --- TEAM DETAIL MODAL --- */}
            {selectedTeam && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-6 text-white flex justify-between items-start relative overflow-hidden" style={{ backgroundColor: selectedTeam.color }}>
                            <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4">
                                <Trophy className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-4xl font-black tracking-tight">{selectedTeam.name}</h2>
                                <div className="flex gap-4 mt-2 opacity-90 text-sm font-medium bg-white/20 inline-flex px-3 py-1 rounded-lg backdrop-blur-md">
                                    <span>Purse Left: ₹{selectedTeam.budget - selectedTeam.spent}L</span>
                                    <span>•</span>
                                    <span>Spent: ₹{selectedTeam.spent}L</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTeam(null)} className="relative z-10 bg-black/20 hover:bg-black/40 p-2 rounded-full transition-colors">
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Squad List ({selectedTeam.players.length})
                                </h3>
                            </div>
                            <div className="space-y-2">
                                {selectedTeam.players.length === 0 ? (
                                    <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                                        <Users className="w-12 h-12 mx-auto mb-2 opacity-20" /> No players purchased yet.
                                    </div>
                                ) : (
                                    data.players.filter(p => p.soldTo === selectedTeam._id).map(player => (
                                        <div key={player._id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-slate-100 p-2.5 rounded-full text-slate-600 font-bold text-sm">
                                                    {player.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{player.name}</div>
                                                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                                        {player.category === 'Marquee' && <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                                        {player.role}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="font-mono font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                                                ₹{player.soldPrice}L
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TOP NAVBAR */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-slate-800 leading-none tracking-tight">SPL Admin</h1>
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tournament Setup</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex gap-8 text-sm">
                            <div className="text-right">
                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Purse</span>
                                <span className="font-bold text-slate-700 font-mono text-lg">₹{totalBudget}L</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Spent</span>
                                <span className="font-bold text-green-600 font-mono text-lg">₹{totalSpent}L</span>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200 text-sm font-mono font-bold text-slate-600 tracking-widest">
                                {auctionCode}
                            </div>
                            <button onClick={() => setView('login')} className="text-red-500 hover:bg-red-50 p-2.5 rounded-full transition-colors border border-transparent hover:border-red-100">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: FORMS & ACTIONS */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Start Button */}
                    <button
                        onClick={() => setView('admin-live')}
                        disabled={data.teams.length < 2 || data.players.length === 0}
                        className="group w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        <div className="bg-white/20 p-2 rounded-full"><Play className="fill-current w-4 h-4" /></div>
                        {data.teams.length < 2 ? "Add Teams to Start" : "Launch Auction Console"}
                    </button>

                    {/* Add Team Card */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                        <h2 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Users className="w-4 h-4" /></div>
                            Add New Team
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Team Name</label>
                                <input value={newTeam.name} onChange={e => setNewTeam({ ...newTeam, name: e.target.value })} className="w-full mt-1 border border-slate-200 bg-slate-50 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" placeholder="e.g. Royal Strikers" />
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Budget (L)</label>
                                    <div className="relative">
                                        <Wallet className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                                        <input type="number" value={newTeam.budget} onChange={e => setNewTeam({ ...newTeam, budget: Number(e.target.value) })} className="w-full mt-1 border border-slate-200 bg-slate-50 p-3 pl-10 rounded-xl outline-none font-mono font-bold" />
                                    </div>
                                </div>
                                <div className="w-16">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Color</label>
                                    <input type="color" value={newTeam.color} onChange={e => setNewTeam({ ...newTeam, color: e.target.value })} className="w-full mt-1 h-[46px] border-none rounded-xl cursor-pointer bg-transparent" />
                                </div>
                            </div>
                            <button onClick={addTeam} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/20 active:scale-95">Create Team</button>
                        </div>
                    </div>

                    {/* Add Player Card */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                        <h2 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                            <div className="bg-green-100 p-2 rounded-lg text-green-600"><UserPlus className="w-4 h-4" /></div>
                            Register Player
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                                <input value={newPlayer.name} onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })} className="w-full mt-1 border border-slate-200 bg-slate-50 p-3 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-slate-700" placeholder="e.g. Virat Kohli" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Role</label>
                                    <select value={newPlayer.role} onChange={e => setNewPlayer({ ...newPlayer, role: e.target.value })} className="w-full mt-1 border border-slate-200 bg-slate-50 p-3 rounded-xl outline-none text-sm font-medium text-slate-600 appearance-none">
                                        {ROLES.map(r => <option key={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Base Price</label>
                                    <input type="number" value={newPlayer.basePrice} onChange={e => setNewPlayer({ ...newPlayer, basePrice: Number(e.target.value) })} className="w-full mt-1 border border-slate-200 bg-slate-50 p-3 rounded-xl outline-none font-mono font-bold" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Category</label>
                                <select value={newPlayer.category} onChange={e => setNewPlayer({ ...newPlayer, category: e.target.value })} className="w-full mt-1 border border-slate-200 bg-slate-50 p-3 rounded-xl outline-none text-sm font-medium text-slate-600">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <button onClick={addPlayer} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-green-500/20 active:scale-95">Add to Pool</button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: REGISTRY & STATS */}
                <div className="lg:col-span-8 flex flex-col h-[calc(100vh-8rem)]">

                    {/* Segmented Tab Control */}
                    <div className="bg-slate-200/50 p-1.5 rounded-xl inline-flex w-full mb-6 gap-1">
                        <button
                            onClick={() => setActiveTab('players')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'players' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <List className="w-4 h-4" /> Player Registry <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs ml-1">{data.players.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('teams')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'teams' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <LayoutGrid className="w-4 h-4" /> Team Overview <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs ml-1">{data.teams.length}</span>
                        </button>
                    </div>

                    {activeTab === 'players' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                                <div className="relative w-full sm:w-64">
                                    <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                                    <input placeholder="Search players..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors" />
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                                    <button onClick={() => setFilterCategory('All')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${filterCategory === 'All' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>All</button>
                                    {CATEGORIES.map(cat => (
                                        <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${filterCategory === cat ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-4 pl-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Player Name</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role & Category</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Base Price</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right pr-6">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.players
                                            .filter(p => (filterCategory === 'All' || p.category === filterCategory))
                                            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map(player => (
                                                <tr key={player._id} className="hover:bg-slate-50/80 group transition-colors">
                                                    <td className="p-4 pl-6">
                                                        <div className="font-bold text-slate-700 text-sm">{player.name}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex gap-2">
                                                            <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md text-[10px] font-bold uppercase">{player.role}</span>
                                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${player.category === 'Marquee' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-white text-slate-400 border-slate-200'
                                                                }`}>
                                                                {player.category}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-mono text-sm font-bold text-slate-500">₹{player.basePrice}L</td>
                                                    <td className="p-4">
                                                        {player.isSold ? (
                                                            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-green-100">
                                                                <CheckCircle className="w-3 h-3" /> SOLD @ ₹{player.soldPrice}L
                                                            </span>
                                                        ) : player.isUnsold ? (
                                                            <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-red-100">
                                                                <AlertCircle className="w-3 h-3" /> UNSOLD
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg text-xs font-bold">
                                                                <Clock className="w-3 h-3" /> AVAILABLE
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 pr-6 text-right">
                                                        <button onClick={() => deletePlayer(player._id)} className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        {data.players.length === 0 && (
                                            <tr><td colSpan="5" className="p-12 text-center text-slate-400 italic">No players added to the pool yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'teams' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pb-4">
                            {data.teams.map(team => {
                                const percentSpent = Math.min((team.spent / team.budget) * 100, 100);
                                return (
                                    <div key={team._id} onClick={() => setSelectedTeam(team)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all relative overflow-hidden group cursor-pointer">
                                        <button onClick={(e) => deleteTeam(e, team._id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white p-2 rounded-full shadow-sm"><Trash2 className="w-4 h-4" /></button>

                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg transform group-hover:scale-105 transition-transform" style={{ backgroundColor: team.color }}>
                                                {team.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800 leading-tight">{team.name}</h3>
                                                <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                                                    <Users className="w-3.5 h-3.5" /> {team.players.length} Players Acquired
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                                <span>Spent: ₹{team.spent}L</span>
                                                <span>Total: ₹{team.budget}L</span>
                                            </div>
                                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                                                <div className="h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${percentSpent}%`, backgroundColor: team.color }}>
                                                    <div className="absolute top-0 right-0 h-full w-2 bg-white/30"></div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mt-3">
                                                <span className="text-xs font-bold text-slate-600">Remaining</span>
                                                <span className="text-sm font-mono font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">₹{team.budget - team.spent}L</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-end text-xs font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            View Squad Details <ChevronRight className="w-3 h-3 ml-1" />
                                        </div>
                                    </div>
                                );
                            })}
                            {data.teams.length === 0 && <div className="col-span-2 py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">No teams created. Add one from the left panel.</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}