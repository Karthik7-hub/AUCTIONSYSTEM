import React, { useState } from 'react';
import { UserPlus, Search, Edit2, Trash2, Check } from 'lucide-react';
import Button from '@shared/components/Button';
import Input from '@shared/components/Input';
import Modal from '@shared/components/Modal';
import Badge from '@shared/components/Badge';
import CustomSelect from '@shared/components/Select/CustomSelect';
import { createPlayer, deletePlayer, updatePlayer } from '@domains/player';
import './Players.css';

export default function Players({
    data,
    config,
    isCompleted,
    onRefresh,
    roles,
    categories,
    showConfirm,
    showAlert,
    theme
}) {
    // Local Filter States
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);

    // Local Form States
    const [newPlayer, setNewPlayer] = useState({
        name: '', role: roles[0] || 'Batsman', category: categories[0] || 'Marquee', basePrice: 20
    });
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSavePlayer = async () => {
        setIsSaving(true);
        const target = editingPlayer || newPlayer;
        if (target.basePrice === undefined || isNaN(Number(target.basePrice)) || Number(target.basePrice) < 0) {
            showAlert("Validation Error", "Base price cannot be negative.", "warning");
            setIsSaving(false);
            return;
        }

        if (editingPlayer) {
            if (!editingPlayer.name) {
                setIsSaving(false);
                return;
            }
            try {
                await updatePlayer(editingPlayer._id, editingPlayer);
                setEditingPlayer(null);
                setIsAddPlayerOpen(false);
                if (onRefresh) onRefresh();
            } catch (error) {
                console.error("Error saving player:", error);
                showAlert("Error", error.response?.data?.error || "Failed to update player.", "error");
            } finally {
                setIsSaving(false);
            }
        } else {
            if (!newPlayer.name) {
                setIsSaving(false);
                return;
            }
            try {
                await createPlayer({ ...newPlayer, auctionId: config._id });
                setNewPlayer({ ...newPlayer, name: '', basePrice: 20 });
                setIsAddPlayerOpen(false);
                if (onRefresh) onRefresh();
            } catch (error) {
                console.error("Error adding player:", error);
                showAlert("Error", error.response?.data?.error || "Failed to add player.", "error");
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleDeletePlayerLocal = async (id) => {
        showConfirm(
            "Delete Player",
            "Are you sure you want to delete this player? This will remove them from the tournament.",
            "danger",
            "Delete Player",
            async () => {
                try {
                    await deletePlayer(id);
                    if (onRefresh) onRefresh();
                } catch (error) {
                    console.error("Error deleting player:", error);
                    showAlert("Error", "Error deleting player", "error");
                }
            }
        );
    };

    const filtered = data.players
        .filter(p => filterCategory === 'All' || p.category === filterCategory)
        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="animate-fade-in players-setup">
            
            {/* LEFT STICKY MANAGEMENT SIDEBAR (Desktop) */}
            <div className="players-setup__sidebar desktop-only">
                {isCompleted ? (
                    <div className="players-setup__sidebar-card players-setup__archive-card">
                        <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        <h3 className="players-setup__archive-title">Tournament Completed</h3>
                        <p className="players-setup__archive-text">
                            This tournament has been completed. Editing has been disabled. Only historical data is available.
                        </p>
                    </div>
                ) : editingPlayer ? (
                    <div className="players-setup__sidebar-card">
                        <h3 className="players-setup__sidebar-title" style={{ color: 'var(--accent-light)' }}>Edit Player</h3>
                        <div className="players-setup__form">
                            <Input label="Full Name" value={editingPlayer.name} onChange={e => setEditingPlayer({ ...editingPlayer, name: e.target.value })} />
                            <Input label="Base Bid (₹ Lakhs)" type="number" className="font-mono" value={editingPlayer.basePrice} onChange={e => setEditingPlayer({ ...editingPlayer, basePrice: Number(e.target.value) })} />

                            <CustomSelect
                                label="Playing Role"
                                options={roles}
                                value={editingPlayer.role}
                                onChange={val => setEditingPlayer({ ...editingPlayer, role: val })}
                            />
                            <CustomSelect
                                label="Set / Category"
                                options={categories}
                                value={editingPlayer.category}
                                onChange={val => setEditingPlayer({ ...editingPlayer, category: val })}
                            />

                            <div className="players-setup__sidebar-grid-btns">
                                <Button onClick={() => setEditingPlayer(null)} variant="secondary">
                                    Cancel
                                </Button>
                                <Button onClick={handleSavePlayer} loading={isSaving} variant="primary">
                                    <Check className="w-4 h-4" /> Save
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="players-setup__sidebar-card">
                        <h3 className="players-setup__sidebar-title">Add Player to Pool</h3>
                        <div className="players-setup__form">
                            <Input label="Full Name" value={newPlayer.name} onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })} placeholder="e.g. Sachin Tendulkar" />
                            <Input label="Base Bid (₹ Lakhs)" type="number" min="0" className="font-mono" value={newPlayer.basePrice} onChange={e => setNewPlayer({ ...newPlayer, basePrice: Number(e.target.value) })} />

                            <CustomSelect
                                label="Playing Role"
                                options={roles}
                                value={newPlayer.role}
                                onChange={val => setNewPlayer({ ...newPlayer, role: val })}
                            />
                            <CustomSelect
                                label="Set / Category"
                                options={categories}
                                value={newPlayer.category}
                                onChange={val => setNewPlayer({ ...newPlayer, category: val })}
                            />

                            <Button onClick={handleSavePlayer} loading={isSaving} variant="primary" className="players-setup__submit-btn">
                                <UserPlus className="w-4 h-4" /> Add Player
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT PRIMARY CONTENT AREA (List + Table) */}
            <div className="players-setup__content">
                <div className="players-setup__content-card">
                    <div className="players-setup__header">
                        <h3 className="players-setup__header-title">Player Pool ({data.players.length})</h3>
                        
                        {/* Mobile Add Trigger */}
                        {!isCompleted && (
                            <Button onClick={() => { setEditingPlayer(null); setIsAddPlayerOpen(true); }} variant="primary" className="mobile-only">
                                <UserPlus className="w-4 h-4" /> Add Player
                            </Button>
                        )}
                    </div>

                    {/* Dynamic Filters Bar */}
                    <div className="players-setup__filters-bar">
                        <div className="players-setup__filters-strip">
                            <button onClick={() => setFilterCategory('All')} className={`filter-btn ${filterCategory === 'All' ? 'filter-btn-active' : ''} players-setup__filter-btn`}>All</button>
                            {categories.map(cat => (
                                <button key={cat} onClick={() => setFilterCategory(cat)} className={`filter-btn ${filterCategory === cat ? 'filter-btn-active' : ''} players-setup__filter-btn`}>{cat}</button>
                            ))}
                        </div>
                        <div className="players-setup__search-wrapper">
                            <Search className="players-setup__search-icon" />
                            <input
                                type="text"
                                placeholder="Search name..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="input-field players-setup__search-input"
                            />
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="empty-table-state">No players found matching filter criteria.</div>
                    ) : (
                        <>
                            {/* DESKTOP TABLE */}
                            <div className="desktop-only players-setup__table-wrapper">
                                <table className="players-setup__table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Role</th>
                                            <th>Category</th>
                                            <th>Base Price</th>
                                            <th>Status</th>
                                            {!isCompleted && <th className="players-setup__action-col">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map(player => (
                                            <tr key={player._id} className="tr-hover" style={editingPlayer?._id === player._id ? { borderLeft: '3px solid var(--accent)' } : null}>
                                                <td style={{ fontWeight: 'bold' }}>{player.name}</td>
                                                <td><Badge>{player.role}</Badge></td>
                                                <td><Badge>{player.category}</Badge></td>
                                                <td className="font-mono" style={{ fontWeight: 'bold' }}>₹{player.basePrice}L</td>
                                                <td>
                                                    {player.isSold ? (
                                                        <Badge variant="success">SOLD</Badge>
                                                    ) : player.isUnsold ? (
                                                        <Badge variant="danger">UNSOLD</Badge>
                                                    ) : (
                                                        <Badge variant="info">OPEN</Badge>
                                                    )}
                                                </td>
                                                {!isCompleted && (
                                                    <td>
                                                        <div className="players-setup__action-group">
                                                            <Button onClick={() => setEditingPlayer(player)} className="btn-icon" variant="secondary" style={{ color: 'var(--accent-light)', padding: 'var(--sp-1)' }} title="Edit Player">
                                                                <Edit2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button onClick={() => handleDeletePlayerLocal(player._id)} className="btn-icon" variant="secondary" style={{ color: 'var(--danger)', padding: 'var(--sp-1)' }} title="Delete Player">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* MOBILE CARDS */}
                            <div className="mobile-only players-setup__mobile-list">
                                {filtered.map(player => (
                                    <div key={player._id} className="players-setup__mobile-card">
                                        <div>
                                            <h4 className="players-setup__mobile-card-title">{player.name}</h4>
                                            <div className="players-setup__mobile-card-badges">
                                                <Badge>{player.role}</Badge>
                                                <Badge>{player.category}</Badge>
                                            </div>
                                        </div>
                                        <div className="players-setup__mobile-card-right">
                                            <div className="players-setup__mobile-card-price-col">
                                                <div className="players-setup__mobile-card-price">₹{player.basePrice}L</div>
                                                <div className="players-setup__mobile-card-status">
                                                    {player.isSold ? (
                                                        <Badge variant="success">SOLD</Badge>
                                                    ) : player.isUnsold ? (
                                                        <Badge variant="danger">UNSOLD</Badge>
                                                    ) : (
                                                        <Badge variant="info">OPEN</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            {!isCompleted && (
                                                <div className="players-setup__mobile-card-actions">
                                                    <Button onClick={() => { setEditingPlayer(player); setIsAddPlayerOpen(true); }} className="btn-icon" variant="secondary" style={{ color: 'var(--accent-light)' }}>
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button onClick={() => handleDeletePlayerLocal(player._id)} className="btn-icon" variant="secondary" style={{ color: 'var(--danger)' }}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* MOBILE BOTTOM SHEET MODAL (Add & Edit) */}
            <Modal
                isOpen={isAddPlayerOpen}
                onClose={() => { setIsAddPlayerOpen(false); setEditingPlayer(null); }}
                title={editingPlayer ? "Edit Player" : "Add Player to Pool"}
                maxWidth="28rem"
                theme={theme}
            >
                <div className="players-setup__modal-content">
                    {editingPlayer ? (
                        <>
                            <Input label="Full Name" value={editingPlayer.name} onChange={e => setEditingPlayer({ ...editingPlayer, name: e.target.value })} />
                            <Input label="Base Bid (₹ Lakhs)" type="number" className="font-mono" value={editingPlayer.basePrice} onChange={e => setEditingPlayer({ ...editingPlayer, basePrice: Number(e.target.value) })} />

                            <div className="players-setup__input-group">
                                <label className="players-setup__input-label">Playing Role</label>
                                <select className="players-setup__input-field" value={editingPlayer.role} onChange={e => setEditingPlayer({ ...editingPlayer, role: e.target.value })}>
                                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="players-setup__input-group">
                                <label className="players-setup__input-label">Set / Category</label>
                                <select className="players-setup__input-field" value={editingPlayer.category} onChange={e => setEditingPlayer({ ...editingPlayer, category: e.target.value })}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <Button 
                                onClick={handleSavePlayer} 
                                loading={isSaving}
                                variant="primary" 
                                className="players-setup__submit-btn"
                            >
                                <Check className="w-4 h-4" /> Save Changes
                            </Button>
                        </>
                    ) : (
                        <>
                            <Input label="Full Name" value={newPlayer.name} onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })} placeholder="e.g. Sachin Tendulkar" />
                            <Input label="Base Bid (₹ Lakhs)" type="number" className="font-mono" value={newPlayer.basePrice} onChange={e => setNewPlayer({ ...newPlayer, basePrice: Number(e.target.value) })} />

                            <div className="players-setup__input-group">
                                <label className="players-setup__input-label">Playing Role</label>
                                <select className="players-setup__input-field" value={newPlayer.role} onChange={e => setNewPlayer({ ...newPlayer, role: e.target.value })}>
                                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="players-setup__input-group">
                                <label className="players-setup__input-label">Set / Category</label>
                                <select className="players-setup__input-field" value={newPlayer.category} onChange={e => setNewPlayer({ ...newPlayer, category: e.target.value })}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <Button 
                                onClick={handleSavePlayer} 
                                loading={isSaving}
                                variant="primary" 
                                className="players-setup__submit-btn"
                            >
                                <UserPlus className="w-4 h-4" /> Add Player
                            </Button>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}
