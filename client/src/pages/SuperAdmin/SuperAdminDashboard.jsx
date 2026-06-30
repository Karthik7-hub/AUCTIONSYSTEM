import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trash2, ExternalLink, Key, Shield, Plus, LogOut,
    Save, X, Edit2, Power, Layers, Users, Zap, Search,
    Clock, Archive
} from 'lucide-react';
import { getAuctions, createAuction, updateAuction, deleteAuction } from '@services/auction.service';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Modal from '@components/ui/Modal';
import Badge from '@components/ui/Badge';

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
            const res = await getAuctions();
            setAuctions(res.data);
        } catch (err) { console.error(err); }
    };

    // --- FILTER LOGIC ---
    const filteredAuctions = auctions.filter(auction => {
        const statusMatch = activeTab === 'active' ? auction.isActive : !auction.isActive;
        const searchMatch = auction.name.toLowerCase().includes(searchQuery.toLowerCase());
        return statusMatch && searchMatch;
    });

    // --- ACTIONS ---
    const handleDelete = async (id) => {
        if (window.confirm("⚠️ DANGER: This will permanently delete the Tournament, Teams, and Players. Continue?")) {
            await deleteAuction(id);
            fetchAuctions();
        }
    };

    const handleAdminLogin = (auctionId) => {
        localStorage.setItem(`admin_auth_${auctionId}`, 'true');
        navigate(`/auction/${auctionId}`, { state: { autoLogin: true } });
    };

    const toggleStatus = async (auction) => {
        await updateAuction(auction._id, { ...auction, isActive: !auction.isActive });
        fetchAuctions();
    };

    const handleCreate = async () => {
        if (!newAuction.name || !newAuction.accessCode) return;
        const payload = {
            ...newAuction,
            categories: newAuction.categories.split(',').map(s => s.trim()).filter(s => s),
            roles: newAuction.roles.split(',').map(s => s.trim()).filter(s => s)
        };
        await createAuction(payload);
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
        await updateAuction(editingAuction._id, payload);
        setEditingAuction(null);
        fetchAuctions();
    };

    return (
        <div className="super-admin-page theme-dark no-scrollbar">

            {/* --- CREATE MODAL --- */}
            <Modal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                title="Create Tournament"
                headerGlowIcon={Zap}
                maxWidth="42rem"
                footer={
                    <>
                        <Button onClick={() => setShowCreate(false)} variant="secondary">Cancel</Button>
                        <Button onClick={handleCreate} variant="primary">Deploy</Button>
                    </>
                }
            >
                <div className="form-layout">
                    <div className="form-row form-row-2">
                        <Input label="Tournament Name" value={newAuction.name} onChange={e => setNewAuction({ ...newAuction, name: e.target.value })} placeholder="e.g. SPL Season 5" />
                        <Input label="Host Password" className="font-mono" value={newAuction.accessCode} onChange={e => setNewAuction({ ...newAuction, accessCode: e.target.value })} placeholder="Secret123" />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Categories (Comma Separated)</label>
                        <textarea className="input-field" value={newAuction.categories} onChange={e => setNewAuction({ ...newAuction, categories: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Roles (Comma Separated)</label>
                        <textarea className="input-field" value={newAuction.roles} onChange={e => setNewAuction({ ...newAuction, roles: e.target.value })} />
                    </div>
                </div>
            </Modal>

            {/* --- EDIT MODAL --- */}
            {editingAuction && (
                <Modal
                    isOpen={!!editingAuction}
                    onClose={() => setEditingAuction(null)}
                    title="Edit Tournament"
                    headerGlowIcon={Edit2}
                    maxWidth="42rem"
                    footer={
                        <>
                            <Button onClick={() => setEditingAuction(null)} variant="secondary">Cancel</Button>
                            <Button onClick={handleUpdate} variant="primary"><Save className="w-4 h-4" /> Save Changes</Button>
                        </>
                    }
                >
                    <div className="form-layout">
                        <div className="form-row form-row-2">
                            <Input label="Tournament Name" value={editingAuction.name} onChange={e => setEditingAuction({ ...editingAuction, name: e.target.value })} />
                            <Input label="Host Password" className="font-mono" value={editingAuction.accessCode} onChange={e => setEditingAuction({ ...editingAuction, accessCode: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Status</label>
                            <div className="super-edit-modal-btn-row">
                                <Button
                                    onClick={() => setEditingAuction({ ...editingAuction, isActive: true })}
                                    variant={editingAuction.isActive ? 'success' : 'secondary'}
                                >
                                    Active (Live)
                                </Button>
                                <Button
                                    onClick={() => setEditingAuction({ ...editingAuction, isActive: false })}
                                    variant={!editingAuction.isActive ? 'secondary' : 'secondary'}
                                    style={!editingAuction.isActive ? { backgroundColor: 'var(--slate-850)', color: '#ffffff' } : null}
                                >
                                    Completed
                                </Button>
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Categories (Comma Separated)</label>
                            <textarea className="input-field" value={Array.isArray(editingAuction.categories) ? editingAuction.categories.join(', ') : editingAuction.categories} onChange={e => setEditingAuction({ ...editingAuction, categories: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Roles (Comma Separated)</label>
                            <textarea className="input-field" value={Array.isArray(editingAuction.roles) ? editingAuction.roles.join(', ') : editingAuction.roles} onChange={e => setEditingAuction({ ...editingAuction, roles: e.target.value })} />
                        </div>
                    </div>
                </Modal>
            )}

            <div className="container">

                {/* --- HEADER --- */}
                <div className="super-dashboard-header">
                    <div className="super-dashboard-title-row">
                        <div className="super-title-row-icon-bg"><Shield className="w-8 h-8 text-red-500" /></div>
                        <div><h1 className="brand-title">Super Admin</h1><p className="brand-subtitle">Central Command</p></div>
                    </div>
                    <div className="super-header-btn-row">
                        <Button onClick={() => setShowCreate(true)} variant="primary"><Plus className="w-5 h-5" /> New Tournament</Button>
                        <Button onClick={() => { localStorage.removeItem('super_admin_token'); navigate('/'); }} variant="secondary"><LogOut className="w-5 h-5" /></Button>
                    </div>
                </div>

                {/* --- NAVIGATION & SEARCH --- */}
                <div className="super-nav-bar">
                    {/* Tabs */}
                    <div className="nav-tabs">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`nav-tab-btn ${activeTab === 'active' ? 'nav-tab-btn-active' : ''}`}
                        >
                            <Zap className="w-4 h-4" /> Active ({auctions.filter(a => a.isActive).length})
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`nav-tab-btn ${activeTab === 'completed' ? 'nav-tab-btn-active' : ''}`}
                        >
                            <Archive className="w-4 h-4" /> Completed ({auctions.filter(a => !a.isActive).length})
                        </button>
                    </div>

                    {/* Search Bar */}
                    <Input
                        placeholder="Search tournaments..."
                        icon={Search}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* --- AUCTION LIST --- */}
                <div className="super-dashboard-grid">
                    {filteredAuctions.map(auction => (
                        <div key={auction._id} className="super-auction-card">
                            <div className="super-card-header-line">
                                <div className="super-card-title-row">
                                    <Badge
                                        onClick={() => toggleStatus(auction)}
                                        variant={auction.isActive ? 'success' : 'danger'}
                                        title="Click to Toggle Status"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <Power className="w-3 h-3" style={{ marginRight: 'var(--space-1.5)' }} />
                                        {auction.isActive ? 'Live' : 'Completed'}
                                    </Badge>
                                    <h2 className="super-auction-card-title">{auction.name}</h2>
                                </div>
                                <div className="super-card-badge-row">
                                    <div className="super-card-key-badge">
                                        <Key className="w-4 h-4" style={{ color: 'var(--slate-500)' }} />
                                        <span className="font-mono font-bold">{auction.accessCode}</span>
                                    </div>
                                    <div className="md-block hidden"><Layers className="w-4 h-4" /> {auction.categories.length} Cats</div>
                                    <div className="md-block hidden"><Users className="w-4 h-4" /> {auction.roles.length} Roles</div>
                                    <div className="md-block hidden"><Clock className="w-4 h-4" /> {new Date(auction.date).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className="super-auction-actions">
                                <Button onClick={() => setEditingAuction(auction)} variant="secondary"><Edit2 className="w-4 h-4" /> Edit</Button>
                                <Button onClick={() => handleAdminLogin(auction._id)} variant="primary"><ExternalLink className="w-4 h-4" /> Enter</Button>
                                <Button onClick={() => handleDelete(auction._id)} variant="danger"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    ))}

                    {filteredAuctions.length === 0 && (
                        <div className="empty-table-state super-empty-border">
                            {searchQuery ? 'No matching tournaments found.' : activeTab === 'active' ? 'No active tournaments. Create one above.' : 'No completed tournaments found.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
