import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trash2, ExternalLink, Key, Shield, Plus, LogOut,
    Save, X, Edit2, Power, Layers, Users, Zap, Search,
    Clock, Archive
} from 'lucide-react';
import { getAuctions, createAuction, updateAuction, deleteAuction } from '@services/auction.service';
import { verifyStoredSuperAdminToken, clearSuperAdminTokens } from '@services/auth.service';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Modal from '@components/ui/Modal';
import Badge from '@components/ui/Badge';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import AlertDialog from '@components/ui/AlertDialog';

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
        name: '', accessCode: '', categories: 'Marquee, Set 1, Set 2, Set 3, Set 4', roles: 'Batsman, Bowler, All Rounder, Wicket Keeper'
    });

    // Custom Modal Dialog State
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', type: 'info', confirmText: 'Confirm', onConfirm: () => {} });
    const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    const showConfirm = (title, message, type, confirmText, onConfirm) => {
        setConfirmDialog({ isOpen: true, title, message, type, confirmText, onConfirm });
    };

    const showAlert = (title, message, type = 'info') => {
        setAlertDialog({ isOpen: true, title, message, type });
    };

    useEffect(() => {
        // Verify JWT with server — not trusting localStorage boolean
        verifyStoredSuperAdminToken()
            .then(() => fetchAuctions())
            .catch(() => {
                clearSuperAdminTokens();
                navigate('/super-admin');
            });
    }, [navigate]);

    const fetchAuctions = async () => {
        try {
            const res = await getAuctions();
            setAuctions(res.data);
        } catch (err) { console.error(err); }
    };

    // --- FILTER LOGIC ---
    const filteredAuctions = auctions.filter(auction => {
        const isAuctionCompleted = auction.status === 'completed' || auction.isActive === false;
        const statusMatch = activeTab === 'active' ? !isAuctionCompleted : isAuctionCompleted;
        const searchMatch = auction.name.toLowerCase().includes(searchQuery.toLowerCase());
        return statusMatch && searchMatch;
    });

    // --- ACTIONS ---
    const handleDelete = (id) => {
        showConfirm(
            "Delete Tournament",
            "⚠️ DANGER: This will permanently delete the Tournament, Teams, and Players. Are you sure you want to continue?",
            "danger",
            "Delete Tournament",
            async () => {
                try {
                    await deleteAuction(id);
                    fetchAuctions();
                } catch (err) {
                    console.error("Error deleting tournament:", err);
                    showAlert("Error", "Failed to delete tournament.", "error");
                }
            }
        );
    };

    const handleAdminLogin = (auction) => {
        const identifier = auction.slug || auction._id;
        localStorage.setItem(`admin_auth_${auction._id}`, 'true');
        localStorage.setItem(`admin_auth_${identifier}`, 'true');
        navigate(`/auction/${identifier}`, { state: { autoLogin: true } });
    };

    const toggleStatus = async (auction) => {
        let nextStatus = 'live';
        let nextIsActive = true;
        
        // Cycle status: draft -> live -> completed -> draft
        const currentStatus = auction.status || (auction.isActive ? 'live' : 'completed');
        if (currentStatus === 'draft') {
            nextStatus = 'live';
            nextIsActive = true;
        } else if (currentStatus === 'live') {
            nextStatus = 'completed';
            nextIsActive = false;
        } else {
            nextStatus = 'draft';
            nextIsActive = true;
        }

        await updateAuction(auction._id, { ...auction, status: nextStatus, isActive: nextIsActive });
        fetchAuctions();
    };

    const handleCreate = async () => {
        if (!newAuction.name || !newAuction.accessCode) return;
        const payload = {
            ...newAuction,
            status: 'draft',
            isActive: true,
            categories: newAuction.categories.split(',').map(s => s.trim()).filter(s => s),
            roles: newAuction.roles.split(',').map(s => s.trim()).filter(s => s)
        };
        await createAuction(payload);
        setShowCreate(false);
        setNewAuction({ name: '', accessCode: '', categories: 'Marquee, Set 1, Set 2, Set 3, Set 4', roles: 'Batsman, Bowler, All Rounder, Wicket Keeper' });
        fetchAuctions();
    };

    const handleUpdate = async () => {
        if (!editingAuction) return;
        const payload = {
            name: editingAuction.name,
            accessCode: editingAuction.accessCode,
            isActive: editingAuction.isActive,
            status: editingAuction.status || 'live',
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
                        <textarea className="input-field" value={newAuction.categories} onChange={e => setNewAuction({ ...newAuction, categories: e.target.value })} placeholder="e.g. Marquee, Set 1, Set 2, Set 3, Set 4" />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Roles (Comma Separated)</label>
                        <textarea className="input-field" value={newAuction.roles} onChange={e => setNewAuction({ ...newAuction, roles: e.target.value })} placeholder="e.g. Batsman, Bowler, All Rounder, Wicket Keeper" />
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
                            <div className="super-edit-modal-btn-row" style={{ display: 'flex', gap: '8px' }}>
                                <Button
                                    onClick={() => setEditingAuction({ ...editingAuction, status: 'draft', isActive: true })}
                                    variant={(editingAuction.status === 'draft' || (!editingAuction.status && editingAuction.isActive)) ? 'info' : 'secondary'}
                                    style={(editingAuction.status === 'draft') ? { backgroundColor: 'var(--blue-600)', color: '#ffffff' } : null}
                                >
                                    Draft
                                </Button>
                                <Button
                                    onClick={() => setEditingAuction({ ...editingAuction, status: 'live', isActive: true })}
                                    variant={(editingAuction.status === 'live') ? 'success' : 'secondary'}
                                >
                                    Live
                                </Button>
                                <Button
                                    onClick={() => setEditingAuction({ ...editingAuction, status: 'completed', isActive: false })}
                                    variant={(editingAuction.status === 'completed' || (!editingAuction.status && !editingAuction.isActive)) ? 'danger' : 'secondary'}
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
                        <Button onClick={() => { clearSuperAdminTokens(); navigate('/'); }} variant="secondary"><LogOut className="w-5 h-5" /></Button>
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
                                    {(() => {
                                        const currentStatus = auction.status || (auction.isActive ? 'live' : 'completed');
                                        const variant = currentStatus === 'draft' ? 'info' : (currentStatus === 'completed' ? 'danger' : 'success');
                                        const label = currentStatus === 'draft' ? 'Draft' : (currentStatus === 'completed' ? 'Completed' : 'Live');
                                        return (
                                            <Badge
                                                onClick={() => toggleStatus(auction)}
                                                variant={variant}
                                                title="Click to Cycle Status (Draft → Live → Completed)"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <Power className="w-3 h-3" style={{ marginRight: 'var(--space-1.5)' }} />
                                                {label}
                                            </Badge>
                                        );
                                    })()}
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
                                <Button onClick={() => handleAdminLogin(auction)} variant="primary"><ExternalLink className="w-4 h-4" /> Enter</Button>
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

            {/* Custom Dialog Modals */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                type={confirmDialog.type}
            />

            <AlertDialog
                isOpen={alertDialog.isOpen}
                onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
                title={alertDialog.title}
                message={alertDialog.message}
                type={alertDialog.type}
            />
        </div>
    );
}
