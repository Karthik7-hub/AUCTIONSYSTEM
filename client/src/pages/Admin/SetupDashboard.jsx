import React, { useState, useEffect } from 'react';
import {
    Users, UserPlus, Play, LogOut, Trophy, Trash2, Filter,
    LayoutGrid, List, Search, X, User, CheckCircle, AlertCircle,
    Clock, Crown, Layers, Wallet, ChevronRight
} from 'lucide-react';
import { createTeam, deleteTeam, createPlayer, deletePlayer } from '@services/auction.service';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Modal from '@components/ui/Modal';
import Badge from '@components/ui/Badge';
import Loader from '@components/ui/Loader';

export default function SetupDashboard({ data, setView, auctionId, onRefresh, config }) {

    // --- 1. DYNAMIC CONFIGURATION ---
    const categories = config?.categories?.length ? config.categories : ['Marquee', 'Set 1', 'Set 2', 'Set 3', 'Set 4'];
    const roles = config?.roles?.length ? config.roles : ['Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper'];

    const [auctionCode, setAuctionCode] = useState('');
    const [auctionName, setAuctionName] = useState('Tournament');
    const [activeTab, setActiveTab] = useState('players');
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const [newTeam, setNewTeam] = useState({ name: '', budget: 1000, color: '#3B82F6' });
    const [newPlayer, setNewPlayer] = useState({
        name: '', role: roles[0] || 'Batsman', category: categories[0] || 'Marquee', basePrice: 20
    });

    const [selectedTeam, setSelectedTeam] = useState(null);

    // Syncing config properties cleanly
    useEffect(() => {
        if (config) {
            setAuctionCode(config.accessCode || '');
            setAuctionName(config.name || 'Tournament');
            setNewPlayer(prev => ({
                ...prev,
                role: config.roles?.[0] || 'Batsman',
                category: config.categories?.[0] || 'Marquee'
            }));
        }
    }, [config]);

    const totalBudget = data.teams.reduce((acc, t) => acc + t.budget, 0);
    const totalSpent = data.teams.reduce((acc, t) => acc + t.spent, 0);

    // --- ACTIONS ---
    const addTeam = async () => {
        if (!newTeam.name) return;
        try {
            await createTeam({ ...newTeam, auctionId });
            setNewTeam({ name: '', budget: 1000, color: '#3B82F6' });
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error("Error adding team:", error);
            alert("Failed to add team.");
        }
    };

    const handleDeleteTeam = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Delete this team?')) {
            try {
                await deleteTeam(id);
                if (onRefresh) onRefresh();
            } catch (error) {
                console.error("Error deleting team:", error);
            }
        }
    };

    const addPlayer = async () => {
        if (!newPlayer.name) return;
        try {
            await createPlayer({ ...newPlayer, auctionId });
            setNewPlayer({ ...newPlayer, name: '', basePrice: 20 });
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error("Error adding player:", error);
            alert("Failed to add player.");
        }
    };

    const handleDeletePlayer = async (id) => {
        if (window.confirm('Are you sure you want to delete this player?')) {
            try {
                await deletePlayer(id);
                if (onRefresh) onRefresh();
            } catch (error) {
                console.error("Error deleting player:", error);
                alert("Error deleting player");
            }
        }
    };

    return (
        <div className="admin-setup-page theme-light">

            {/* --- TEAM DETAIL MODAL --- */}
            {selectedTeam && (
                <Modal
                    isOpen={!!selectedTeam}
                    onClose={() => setSelectedTeam(null)}
                    maxWidth="42rem"
                    bannerColor={selectedTeam.color}
                    title={
                        <>
                            <div>
                                <h2 style={{ fontSize: 'var(--text-4xl)', fontWeight: 'var(--weight-black)', letterSpacing: '-0.025em', color: '#ffffff' }}>{selectedTeam.name}</h2>
                                <div className="modal-banner-badge-row">
                                    <span>Purse: ₹{selectedTeam.budget}L</span>
                                    <span>Spent: ₹{selectedTeam.spent}L</span>
                                </div>
                            </div>
                        </>
                    }
                >
                    <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                        <h3 className="input-label" style={{ marginBottom: 'var(--space-3)' }}>Signed Players ({selectedTeam.players.length})</h3>
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Player Name</th>
                                        <th>Role</th>
                                        <th>Category</th>
                                        <th style={{ textAlign: 'right' }}>Price Paid</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedTeam.players.map(playerEntry => {
                                        const pId = typeof playerEntry === 'object' ? playerEntry._id : playerEntry;
                                        const player = data.players.find(x => x._id === pId);
                                        if (!player) return null;
                                        return (
                                            <tr key={player._id}>
                                                <td style={{ fontWeight: 'bold' }}>{player.name}</td>
                                                <td><Badge>{player.role}</Badge></td>
                                                <td><Badge>{player.category}</Badge></td>
                                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--green-600)' }} className="font-mono">₹{player.soldPrice}L</td>
                                            </tr>
                                        );
                                    })}
                                    {selectedTeam.players.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="empty-table-state">No players bought yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Modal>
            )}

            {/* --- TOP BRAND BAR --- */}
            <div className="setup-header">
                <div className="brand-block">
                    <div className="brand-logo">
                        <Crown className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="brand-title">{auctionName}</h1>
                        <p className="brand-subtitle">Console Setup • Invite Code: <span className="invite-badge">{auctionCode}</span></p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <Button onClick={() => setView('admin-live')} variant="success">
                        <Play className="w-5 h-5" /> Launch Live Console
                    </Button>
                    <Button onClick={() => { localStorage.removeItem(`admin_auth_${auctionId}`); setView('viewer'); }} variant="secondary">
                        <LogOut className="w-5 h-5" /> Logout Setup
                    </Button>
                </div>
            </div>

            {/* --- SUMMARY STATS MATRIX --- */}
            <div className="stats-matrix">
                <div className="stats-matrix-card">
                    <div className="stats-matrix-label">
                        <Users className="w-4 h-4 text-blue-600" /> Total Registered Teams
                    </div>
                    <div className="stats-matrix-value">{data.teams.length}</div>
                </div>
                <div className="stats-matrix-card">
                    <div className="stats-matrix-label">
                        <UserPlus className="w-4 h-4 text-green-600" /> Total Pool Players
                    </div>
                    <div className="stats-matrix-value">{data.players.length}</div>
                </div>
                <div className="stats-matrix-card">
                    <div className="stats-matrix-label">
                        <Wallet className="w-4 h-4 text-purple-600" /> Allocated Budget
                    </div>
                    <div className="stats-matrix-value">₹{totalBudget}L</div>
                </div>
                <div className="stats-matrix-card">
                    <div className="stats-matrix-label">
                        <Trophy className="w-4 h-4 text-yellow-600" /> Total Spent
                    </div>
                    <div className="stats-matrix-value">₹{totalSpent}L</div>
                </div>
            </div>

            {/* --- DOUBLE DIVISION WORKSPACE --- */}
            <div className="setup-workspace">

                {/* DIVISION A: TEAMS MANAGER */}
                <div className="workspace-column" style={{ flex: 1 }}>
                    <div className="workspace-card">
                        <h2 className="workspace-card-title">
                            <Users className="w-5 h-5" /> Teams Administration
                        </h2>

                        {/* Fast Creator Form */}
                        <div className="form-layout" style={{ marginBottom: 'var(--space-6)' }}>
                            <div className="form-row form-row-2">
                                <Input label="Team Title" value={newTeam.name} onChange={e => setNewTeam({ ...newTeam, name: e.target.value })} placeholder="e.g. Mumbai Giants" />
                                <Input label="Purse (₹ Lakhs)" type="number" className="font-mono" value={newTeam.budget} onChange={e => setNewTeam({ ...newTeam, budget: Number(e.target.value) })} />
                            </div>
                            <div className="form-row form-row-2">
                                <div className="input-group">
                                    <label className="input-label">Theme Color</label>
                                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                        <input className="input-field" type="text" value={newTeam.color} onChange={e => setNewTeam({ ...newTeam, color: e.target.value })} style={{ flex: 1 }} />
                                        <input type="color" value={newTeam.color} onChange={e => setNewTeam({ ...newTeam, color: e.target.value })} style={{ width: '3rem', height: '2.5rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-1)', cursor: 'pointer', backgroundColor: '#ffffff' }} />
                                    </div>
                                </div>
                                <div className="input-group" style={{ justifyContent: 'flex-end' }}>
                                    <Button onClick={addTeam} variant="primary" className="btn-w-full" style={{ padding: 'var(--space-3)' }}>
                                        Create Team
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* List grid */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            {data.teams.map(team => (
                                <div
                                    key={team._id}
                                    onClick={() => setSelectedTeam(team)}
                                    className="card team-setup-item tr-hover"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="team-setup-color-bar" style={{ backgroundColor: team.color }}></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 'bold', color: 'var(--slate-800)', fontSize: 'var(--text-base)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>
                                            <Button onClick={(e) => handleDeleteTeam(e, team._id)} className="btn-icon" variant="secondary" style={{ color: 'var(--red-600)', padding: 'var(--space-1)' }} title="Delete Team"><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-secondary-light)', marginTop: 'var(--space-2)' }}>
                                            <span>Purse: <strong>₹{team.budget}L</strong></span>
                                            <span>Spent: <strong>₹{team.spent}L</strong></span>
                                            <span>Players: <strong>{team.players.length}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {data.teams.length === 0 && (
                                <div className="empty-table-state" style={{ border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-8)' }}>
                                    No Teams created yet. Introduce one above.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* DIVISION B: PLAYER POOL MANAGER */}
                <div className="workspace-column" style={{ flex: 1.3 }}>
                    <div className="workspace-card">
                        <h2 className="workspace-card-title">
                            <UserPlus className="w-5 h-5" /> Player Pool Administration
                        </h2>

                        {/* Fast Creator Form */}
                        <div className="form-layout" style={{ marginBottom: 'var(--space-6)' }}>
                            <div className="form-row form-row-2">
                                <Input label="Full Name" value={newPlayer.name} onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })} placeholder="e.g. Sachin Tendulkar" />
                                <Input label="Base Bid (₹ Lakhs)" type="number" className="font-mono" value={newPlayer.basePrice} onChange={e => setNewPlayer({ ...newPlayer, basePrice: Number(e.target.value) })} />
                            </div>
                            <div className="form-row form-row-2">
                                <div className="input-group">
                                    <label className="input-label">Playing Role</label>
                                    <select className="input-field" value={newPlayer.role} onChange={e => setNewPlayer({ ...newPlayer, role: e.target.value })}>
                                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Set / Category</label>
                                    <select className="input-field" value={newPlayer.category} onChange={e => setNewPlayer({ ...newPlayer, category: e.target.value })}>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                                <Button onClick={addPlayer} variant="primary" style={{ padding: 'var(--space-2.5) var(--space-6)' }}><UserPlus className="w-4 h-4" /> Add Player</Button>
                            </div>
                        </div>

                        {/* Dynamic Filters Bar */}
                        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                            <div className="filters-strip" style={{ margin: 0, flex: 1 }}>
                                <Button onClick={() => setFilterCategory('All')} variant={filterCategory === 'All' ? 'primary' : 'secondary'} style={{ padding: 'var(--space-1.5) var(--space-3)', fontSize: '10px' }}><Filter className="w-3 h-3" /> All</Button>
                                {categories.map(cat => (
                                    <Button key={cat} onClick={() => setFilterCategory(cat)} variant={filterCategory === cat ? 'primary' : 'secondary'} style={{ padding: 'var(--space-1.5) var(--space-3)', fontSize: '10px' }}>{cat}</Button>
                                ))}
                            </div>
                            <div style={{ minWidth: '180px' }}>
                                <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} icon={Search} className="input-field" style={{ height: '2.25rem', fontSize: 'var(--text-xs)', display: 'block' }} />
                            </div>
                        </div>

                        {/* Pool list */}
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Role</th>
                                        <th>Base Price</th>
                                        <th>Status</th>
                                        <th style={{ width: '40px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.players
                                        .filter(p => filterCategory === 'All' || p.category === filterCategory)
                                        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map(player => (
                                            <tr key={player._id} className="tr-hover">
                                                <td style={{ fontWeight: 'bold', color: 'var(--slate-850)' }}>{player.name}</td>
                                                <td><Badge>{player.role}</Badge></td>
                                                <td className="font-mono" style={{ fontWeight: 'bold' }}>₹{player.basePrice}L</td>
                                                <td>
                                                    {player.isSold ? (
                                                        <Badge variant="success" style={{ display: 'flex', width: 'fit-content', gap: 'var(--space-1)', alignItems: 'center' }}>
                                                            <CheckCircle className="w-3.5 h-3.5" /> SOLD
                                                        </Badge>
                                                    ) : player.isUnsold ? (
                                                        <Badge variant="danger" style={{ display: 'flex', width: 'fit-content', gap: 'var(--space-1)', alignItems: 'center' }}>
                                                            <AlertCircle className="w-3.5 h-3.5" /> UNSOLD
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="info" style={{ display: 'flex', width: 'fit-content', gap: 'var(--space-1)', alignItems: 'center' }}>
                                                            OPEN
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    <Button onClick={() => handleDeletePlayer(player._id)} className="btn-icon" variant="secondary" style={{ color: 'var(--red-600)', padding: 'var(--space-1)' }} title="Delete Player"><Trash2 className="w-4 h-4" /></Button>
                                                </td>
                                            </tr>
                                        ))}
                                    {data.players.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="empty-table-state">No players added to the pool yet. Add one above.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
