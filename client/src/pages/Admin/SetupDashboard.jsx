import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, UserPlus, Play, LogOut, Trophy, Trash2, Shield,
    LayoutGrid, Search, Clock, Crown, Wallet,
    ChevronDown, ChevronUp, ChevronRight, Copy, Check, Settings, Edit2, Eye, EyeOff,
    MoreVertical, ArrowRight, TrendingUp, Lock
} from 'lucide-react';
import { createTeam, deleteTeam, updateTeam, createPlayer, deletePlayer, updatePlayer } from '@services/auction.service';
import { clearTokens } from '@services/auth.service';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Modal from '@components/ui/Modal';
import Badge from '@components/ui/Badge';
import Loader from '@components/ui/Loader';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import AlertDialog from '@components/ui/AlertDialog';

const getContrastColor = (hexColor) => {
    if (!hexColor || hexColor.charAt(0) !== '#') return '#ffffff';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

export default function SetupDashboard({ data, auctionId, onRefresh, config }) {
    const navigate = useNavigate();

    // --- 1. DYNAMIC CONFIGURATION ---
    const categories = config?.categories?.length ? config.categories : ['Marquee', 'Set 1', 'Set 2', 'Set 3', 'Set 4'];
    const roles = config?.roles?.length ? config.roles : ['Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper'];

    const [auctionCode, setAuctionCode] = useState('');
    const [auctionName, setAuctionName] = useState('Tournament');
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'teams', 'players', 'settings'
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [copied, setCopied] = useState(false);
    const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
    const [isModalStatsExpanded, setIsModalStatsExpanded] = useState(true);
    const [showAccessCode, setShowAccessCode] = useState(false);
    const [isAddingTeam, setIsAddingTeam] = useState(false);
    const [isAddingPlayer, setIsAddingPlayer] = useState(false);
    const [isEditingSelectedTeam, setIsEditingSelectedTeam] = useState(false);
    const [editTeamData, setEditTeamData] = useState({ name: '', budget: 1000, color: '#3B82F6', logoText: '' });

    const [newTeam, setNewTeam] = useState({ name: '', budget: 1000, color: '#3B82F6', logoText: '' });
    const [newPlayer, setNewPlayer] = useState({
        name: '', role: roles[0] || 'Batsman', category: categories[0] || 'Marquee', basePrice: 20
    });

    const [editingPlayer, setEditingPlayer] = useState(null);
    const [selectedTeam, setSelectedTeam] = useState(null);

    // Custom Modal Dialog State
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', type: 'info', confirmText: 'Confirm', onConfirm: () => {} });
    const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    const showConfirm = (title, message, type, confirmText, onConfirm) => {
        setConfirmDialog({ isOpen: true, title, message, type, confirmText, onConfirm });
    };

    const showAlert = (title, message, type = 'info') => {
        setAlertDialog({ isOpen: true, title, message, type });
    };

    // Syncing config properties cleanly
    useEffect(() => {
        console.log('SetupDashboard config loaded:', config);
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

    const isCompleted = config?.status === 'completed' || config?.isActive === false;
    const totalBudget = data.teams.reduce((acc, t) => acc + t.budget, 0);
    const totalSpent = data.teams.reduce((acc, t) => acc + t.spent, 0);

    // Calculate statistics
    const soldPlayers = useMemo(() => data.players.filter(p => p.isSold), [data.players]);
    const unsoldPlayers = useMemo(() => data.players.filter(p => p.isUnsold), [data.players]);
    const poolCount = data.players.length;
    const soldCount = soldPlayers.length;
    const unsoldCount = unsoldPlayers.length;
    
    const remainingPurse = totalBudget - totalSpent;
    const avgBid = useMemo(() => {
        return soldCount > 0 ? (soldPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0) / soldCount) : 0;
    }, [soldPlayers, soldCount]);
    
    const highestBidPlayer = useMemo(() => {
        if (soldCount === 0) return null;
        return [...soldPlayers].sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0))[0];
    }, [soldPlayers, soldCount]);
    
    const highestBidTeam = useMemo(() => {
        if (!highestBidPlayer) return null;
        return data.teams.find(t => t._id === highestBidPlayer.soldTo);
    }, [highestBidPlayer, data.teams]);

    const recentSoldPlayers = useMemo(() => {
        return [...soldPlayers].sort((a, b) => {
            const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return timeB - timeA;
        }).slice(0, 5);
    }, [soldPlayers]);

    const copyInviteLink = () => {
        const link = `${window.location.origin}/auction/${config.slug || auctionId}`;
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const copyCode = () => {
        navigator.clipboard.writeText(auctionCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // --- ACTIONS ---
    const addTeam = async () => {
        if (!newTeam.name) return;
        setIsAddingTeam(true);
        try {
            await createTeam({ ...newTeam, auctionId });
            setNewTeam({ name: '', budget: 1000, color: '#3B82F6', logoText: '' });
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error("Error adding team:", error);
            showAlert("Error", "Failed to add team.", "error");
        } finally {
            setIsAddingTeam(false);
        }
    };

    const handleDeleteTeam = async (e, id) => {
        e.stopPropagation();
        showConfirm(
            "Delete Team",
            "Are you sure you want to delete this team? This action cannot be undone.",
            "danger",
            "Delete Team",
            async () => {
                try {
                    await deleteTeam(id);
                    if (onRefresh) onRefresh();
                } catch (error) {
                    console.error("Error deleting team:", error);
                    showAlert("Error", "Failed to delete team.", "error");
                }
            }
        );
    };

    const handleSaveTeamEdit = async () => {
        if (!editTeamData.name) return;
        try {
            await updateTeam(selectedTeam._id, editTeamData);
            setSelectedTeam(null);
            setIsEditingSelectedTeam(false);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error("Error saving team edits:", error);
            showAlert("Error", "Failed to update team details.", "error");
        }
    };

    const handleSavePlayer = async () => {
        setIsAddingPlayer(true);
        if (editingPlayer) {
            if (!editingPlayer.name) {
                setIsAddingPlayer(false);
                return;
            }
            try {
                await updatePlayer(editingPlayer._id, editingPlayer);
                setEditingPlayer(null);
                setIsAddPlayerOpen(false);
                if (onRefresh) onRefresh();
            } catch (error) {
                console.error("Error saving player:", error);
                showAlert("Error", "Failed to update player.", "error");
            } finally {
                setIsAddingPlayer(false);
            }
        } else {
            if (!newPlayer.name) {
                setIsAddingPlayer(false);
                return;
            }
            try {
                await createPlayer({ ...newPlayer, auctionId });
                setNewPlayer({ ...newPlayer, name: '', basePrice: 20 });
                setIsAddPlayerOpen(false);
                if (onRefresh) onRefresh();
            } catch (error) {
                console.error("Error adding player:", error);
                showAlert("Error", "Failed to add player.", "error");
            } finally {
                setIsAddingPlayer(false);
            }
        }
    };


    const handleDeletePlayer = async (id) => {
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

    return (
        <div className="admin-setup-page theme-light">
            {isCompleted && (
                <div style={{
                    background: 'linear-gradient(90deg, var(--danger) 0%, #b91c1c 100%)',
                    color: '#ffffff',
                    padding: 'var(--sp-2) var(--sp-4)',
                    fontSize: '11px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--sp-2)',
                    zIndex: 100,
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)'
                }}>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Tournament Completed • Read Only Mode</span>
                </div>
            )}

            {/* --- TEAM DETAIL MODAL --- */}
            {selectedTeam && (() => {
                const squad = selectedTeam.players.map(playerEntry => {
                    const pId = typeof playerEntry === 'object' ? playerEntry._id : playerEntry;
                    return data.players.find(x => x._id === pId);
                }).filter(Boolean);
                
                const realSpent = squad.reduce((total, p) => total + (p.soldPrice || 0), 0);
                const realRemaining = selectedTeam.budget - realSpent;

                const roleCounts = { 'Batsman': 0, 'Bowler': 0, 'All Rounder': 0, 'Wicket Keeper': 0 };
                squad.forEach(p => {
                    if (roleCounts[p.role] !== undefined) {
                        roleCounts[p.role]++;
                    }
                });

                return (
                    <Modal
                        isOpen={!!selectedTeam}
                        onClose={() => { setSelectedTeam(null); setIsEditingSelectedTeam(false); }}
                        maxWidth={isEditingSelectedTeam ? "32rem" : "44rem"}
                        bannerColor={selectedTeam.color}
                        title={
                            isEditingSelectedTeam ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                                    <Edit2 className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                                    <h2 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold', margin: 0 }}>Edit Team Details</h2>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', paddingRight: 'var(--sp-4)' }}>
                                    <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
                                        {/* Avatar Initials Logo */}
                                        {(() => {
                                            const initials = selectedTeam.logoText || selectedTeam.name.split(' ').map(n => n[0]).join('').slice(0, 3).toUpperCase();
                                            return (
                                                <div style={{
                                                    width: '54px',
                                                    height: '54px',
                                                    borderRadius: '50%',
                                                    backgroundColor: `${selectedTeam.color}15`,
                                                    border: `2px solid ${selectedTeam.color}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: '900',
                                                    fontSize: '18px',
                                                    color: selectedTeam.color,
                                                    fontFamily: 'var(--font-mono)',
                                                    flexShrink: 0,
                                                    boxShadow: `0 4px 10px ${selectedTeam.color}20`
                                                }}>
                                                    {initials}
                                                </div>
                                            );
                                        })()}
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>{selectedTeam.name}</h2>
                                                {!isCompleted && (
                                                    <button
                                                        onClick={() => {
                                                            setEditTeamData({
                                                                name: selectedTeam.name,
                                                                budget: selectedTeam.budget,
                                                                color: selectedTeam.color,
                                                                logoText: selectedTeam.logoText || ''
                                                            });
                                                            setIsEditingSelectedTeam(true);
                                                        }}
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0 }}
                                                        title="Edit Team Details"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" style={{ opacity: 0.7 }} />
                                                    </button>
                                                )}
                                            </div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-secondary)', marginTop: '2px' }}>Team Overview</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginTop: '6px' }}>
                                                <span style={{
                                                    backgroundColor: '#f3e8ff',
                                                    color: '#7e22ce',
                                                    padding: '2px 8px',
                                                    borderRadius: 'var(--radius-full)',
                                                    fontSize: '9px',
                                                    fontWeight: 'bold',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '3px'
                                                }}>
                                                    <Crown className="w-2.5 h-2.5" /> Active Team
                                                </span>
                                                <span style={{
                                                    backgroundColor: '#f3f4f6',
                                                    color: '#4b5563',
                                                    padding: '2px 8px',
                                                    borderRadius: 'var(--radius-full)',
                                                    fontSize: '9px',
                                                    fontWeight: 'bold',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '3px'
                                                }}>
                                                    <Clock className="w-2.5 h-2.5" /> Registered Team
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                    >
                        {isEditingSelectedTeam ? (
                            <div className="form-layout" style={{ padding: 'var(--sp-2) 0' }}>
                                <Input 
                                    label="Team Name" 
                                    value={editTeamData.name} 
                                    onChange={e => setEditTeamData({ ...editTeamData, name: e.target.value })} 
                                />
                                <Input 
                                    label="Logo Initials" 
                                    value={editTeamData.logoText} 
                                    onChange={e => setEditTeamData({ ...editTeamData, logoText: e.target.value.toUpperCase().slice(0, 3) })} 
                                    placeholder="e.g. MI"
                                />
                                <Input 
                                    label="Purse (₹ Lakhs)" 
                                    type="number" 
                                    value={editTeamData.budget} 
                                    onChange={e => setEditTeamData({ ...editTeamData, budget: Number(e.target.value) })} 
                                />
                                <div className="input-group">
                                    <label className="input-label">Theme Color</label>
                                    <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                                        <input className="input-field" type="text" value={editTeamData.color} onChange={e => setEditTeamData({ ...editTeamData, color: e.target.value })} style={{ flex: 1 }} />
                                        <input type="color" value={editTeamData.color} onChange={e => setEditTeamData({ ...editTeamData, color: e.target.value })} style={{ width: '3.5rem', height: '2.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '4px', cursor: 'pointer', backgroundColor: 'transparent' }} />
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)', justifyContent: 'flex-end' }}>
                                    <Button onClick={() => setIsEditingSelectedTeam(false)} variant="secondary">Cancel</Button>
                                    <Button onClick={handleSaveTeamEdit} variant="primary">Save Changes</Button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)', padding: 'var(--sp-2) 0' }}>
                                {/* 3-Column Metrics Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-4)' }}>
                                    {/* Card 1: Players */}
                                    {(() => {
                                        const playerPct = Math.round((squad.length / 15) * 100) || 0;
                                        return (
                                            <div style={{
                                                backgroundColor: 'var(--bg-card)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius-xl)',
                                                padding: 'var(--sp-4)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 'var(--sp-2)',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Users className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Players</span>
                                                </div>
                                                <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)' }}>
                                                    {squad.length} / 15
                                                </div>
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Total Players</span>
                                                
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto' }}>
                                                    <div style={{ height: '4px', width: '100%', backgroundColor: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${Math.min(100, playerPct)}%`, backgroundColor: '#3b82f6', borderRadius: 'var(--radius-full)' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '9px', fontWeight: 'bold', color: '#3b82f6' }}>{playerPct}%</div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Card 2: Purse Left */}
                                    <div style={{
                                        backgroundColor: 'var(--bg-card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-xl)',
                                        padding: 'var(--sp-4)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--sp-2)',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Wallet className="w-4 h-4 text-green-600" />
                                            </div>
                                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Purse Left</span>
                                        </div>
                                        <div className="font-mono" style={{ fontSize: '20px', fontWeight: '900', color: '#16a34a' }}>
                                            ₹{realRemaining}L
                                        </div>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Total Budget</span>
                                        
                                        {/* Progress Bar */}
                                        {(() => {
                                            const pursePct = Math.round((realRemaining / selectedTeam.budget) * 100) || 0;
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto' }}>
                                                    <div style={{ height: '4px', width: '100%', backgroundColor: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${Math.min(100, pursePct)}%`, backgroundColor: '#16a34a', borderRadius: 'var(--radius-full)' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '9px', fontWeight: 'bold', color: '#16a34a' }}>{pursePct}%</div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Card 3: Spent */}
                                    <div style={{
                                        backgroundColor: 'var(--bg-card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-xl)',
                                        padding: 'var(--sp-4)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--sp-2)',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(126,34,206,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <TrendingUp className="w-4 h-4 text-purple-600" />
                                            </div>
                                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Spent</span>
                                        </div>
                                        <div className="font-mono" style={{ fontSize: '20px', fontWeight: '900', color: '#7e22ce' }}>
                                            ₹{realSpent}L
                                        </div>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Total Spent</span>
                                        
                                        {(() => {
                                            const spentPct = Math.round((realSpent / selectedTeam.budget) * 100) || 0;
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto' }}>
                                                    <div style={{ height: '4px', width: '100%', backgroundColor: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${Math.min(100, spentPct)}%`, backgroundColor: '#7e22ce', borderRadius: 'var(--radius-full)' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '9px', fontWeight: 'bold', color: '#7e22ce' }}>{spentPct}%</div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Squad Composition */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                                    <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Squad Composition</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--sp-3)' }}>
                                        {/* Role 1: Batsman */}
                                        {(() => {
                                            const limit = 8;
                                            const count = roleCounts['Batsman'] || 0;
                                            return (
                                                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <Trophy className="w-3 h-3 text-blue-600" />
                                                        </div>
                                                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Batsman</span>
                                                    </div>
                                                    <div style={{ height: '3px', width: '100%', backgroundColor: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginTop: '6px' }}>
                                                        <div style={{ height: '100%', width: `${Math.min(100, (count / limit) * 100)}%`, backgroundColor: '#3b82f6' }} />
                                                    </div>
                                                    <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-muted)', marginTop: '2px' }}>{count} / {limit}</div>
                                                </div>
                                            );
                                        })()}

                                        {/* Role 2: Bowler */}
                                        {(() => {
                                            const limit = 8;
                                            const count = roleCounts['Bowler'] || 0;
                                            return (
                                                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <Shield className="w-3 h-3 text-green-600" />
                                                        </div>
                                                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Bowler</span>
                                                    </div>
                                                    <div style={{ height: '3px', width: '100%', backgroundColor: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginTop: '6px' }}>
                                                        <div style={{ height: '100%', width: `${Math.min(100, (count / limit) * 100)}%`, backgroundColor: '#16a34a' }} />
                                                    </div>
                                                    <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-muted)', marginTop: '2px' }}>{count} / {limit}</div>
                                                </div>
                                            );
                                        })()}

                                        {/* Role 3: All Rounder */}
                                        {(() => {
                                            const limit = 8;
                                            const count = roleCounts['All Rounder'] || 0;
                                            return (
                                                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(217,119,6,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <TrendingUp className="w-3 h-3 text-yellow-600" />
                                                        </div>
                                                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-primary)' }}>All Rounder</span>
                                                    </div>
                                                    <div style={{ height: '3px', width: '100%', backgroundColor: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginTop: '6px' }}>
                                                        <div style={{ height: '100%', width: `${Math.min(100, (count / limit) * 100)}%`, backgroundColor: '#ea580c' }} />
                                                    </div>
                                                    <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-muted)', marginTop: '2px' }}>{count} / {limit}</div>
                                                </div>
                                            );
                                        })()}

                                        {/* Role 4: Wicket Keeper */}
                                        {(() => {
                                            const limit = 2;
                                            const count = roleCounts['Wicket Keeper'] || 0;
                                            return (
                                                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(126,34,206,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <Users className="w-3 h-3 text-purple-600" />
                                                        </div>
                                                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Wkt Keeper</span>
                                                    </div>
                                                    <div style={{ height: '3px', width: '100%', backgroundColor: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginTop: '6px' }}>
                                                        <div style={{ height: '100%', width: `${Math.min(100, (count / limit) * 100)}%`, backgroundColor: '#7e22ce' }} />
                                                    </div>
                                                    <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-muted)', marginTop: '2px' }}>{count} / {limit}</div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Acquired Players List */}
                                <div className="modal-squad-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                                    <div className="viewer-modal-list-header" style={{ fontWeight: 'bold', fontSize: 'var(--text-secondary)', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--sp-2)', marginBottom: 'var(--sp-1)' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>Acquired Players ({squad.length})</span>
                                        <button 
                                            onClick={() => setIsModalStatsExpanded(!isModalStatsExpanded)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)', color: 'var(--accent)', fontSize: 'var(--text-micro)', fontWeight: 'bold', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                                        >
                                            {isModalStatsExpanded ? (
                                                <>Hide Stats <ChevronUp className="w-3.5 h-3.5" /></>
                                            ) : (
                                                <>Show Stats <ChevronDown className="w-3.5 h-3.5" /></>
                                            )}
                                        </button>
                                    </div>
                                    
                                    {squad.length === 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '2px dashed var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--sp-8)', textAlign: 'center', gap: 'var(--sp-3)' }}>
                                            {/* Helmet Icon SVG */}
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                                                <path d="M2 10a10 10 0 0 1 20 0v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/>
                                                <path d="M6 14v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4"/>
                                                <path d="M12 2v8"/>
                                            </svg>
                                            <div style={{ fontSize: 'var(--text-secondary)', fontWeight: 'bold', color: 'var(--text-primary)' }}>No players acquired yet.</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Players purchased during the auction will appear here.</div>
                                            <Button onClick={() => { navigate(`/auction/${config?.slug}/live`); setSelectedTeam(null); }} variant="primary" style={{ padding: 'var(--sp-2) var(--sp-4)', fontSize: '11px', marginTop: 'var(--sp-2)' }}>
                                                Go to Auction
                                            </Button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', maxHeight: isModalStatsExpanded ? '280px' : '480px', overflowY: 'auto', transition: 'max-height 0.2s ease-in-out' }}>
                                            {squad.map((p, idx) => (
                                                <div key={p._id} className="card tr-hover" style={{ padding: 'var(--sp-3) var(--sp-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 'var(--radius-xl)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '11px', color: 'var(--text-muted)' }}>
                                                            #{idx + 1}
                                                        </div>
                                                        <div>
                                                            <span style={{ fontWeight: 'bold', fontSize: 'var(--text-secondary)' }}>{p.name}</span>
                                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                                {p.role} • {p.category}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="font-mono" style={{ fontWeight: '900', color: '#16a34a', fontSize: '14px' }}>₹{p.soldPrice}L</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Modal>
                );
            })()}

            {/* --- TOP BRAND BAR & DESKTOP NAVIGATION --- */}
            <div className="setup-header">
                <div className="brand-block">
                    <div className="brand-logo">
                        <Crown className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                    </div>
                    <h1 className="brand-title">{auctionName}</h1>
                </div>

                {/* DESKTOP HEADER NAVIGATION */}
                <div className="setup-header-tabs">
                    {[
                        { id: 'overview', label: 'Overview', icon: LayoutGrid },
                        { id: 'teams', label: 'Teams', icon: Users },
                        { id: 'players', label: 'Players', icon: UserPlus },
                        { id: 'settings', label: 'Settings', icon: Settings }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`setup-header-tab-btn ${activeTab === tab.id ? 'setup-header-tab-btn-active' : ''}`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="setup-header-actions">
                    {!isCompleted && (
                        <Button onClick={() => navigate(`/auction/${config?.slug}/live`)} variant="success" className="desktop-only">
                            <Play className="w-4 h-4" /> Launch Console
                        </Button>
                    )}
                    <Button onClick={() => { clearTokens(auctionId); navigate(`/auction/${config?.slug}`); }} variant="secondary">
                        <LogOut className="w-4 h-4" /> Logout
                    </Button>
                </div>
            </div>

            {/* --- TAB WORKSPACE AREA --- */}
            <div className="container" style={{ paddingTop: 'var(--sp-6)', paddingBottom: 'var(--sp-20)' }}>

                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
                        {/* Summary Metrics Matrix */}
                        <div className="stats-matrix" style={{ margin: 0, padding: 0 }}>
                            <div className="stats-matrix-card">
                                <div className="stats-matrix-label">
                                    <Users className="w-4 h-4 text-blue-600" /> Registered Teams
                                </div>
                                <div className="stats-matrix-value">{data.teams.length}</div>
                            </div>
                            <div className="stats-matrix-card">
                                <div className="stats-matrix-label">
                                    <UserPlus className="w-4 h-4 text-green-600" /> Pool Players
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

                        {/* Split Dashboard widgets */}
                        <div className="setup-workspace" style={{ padding: 0 }}>
                            {/* Left Widget: Quick Launch Controls & Stats */}
                            <div className="workspace-column" style={{ flex: 1.1, display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
                                <div className="workspace-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                                    <h3 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold' }}>Quick Launch Center</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                        Launch the operational console when ready to execute bids, pause rounds, and lock in sales in real-time.
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                                        {isCompleted ? (
                                            <div style={{
                                                padding: 'var(--sp-3)',
                                                backgroundColor: '#fee2e2',
                                                color: '#ef4444',
                                                border: '1px solid #fca5a5',
                                                borderRadius: 'var(--radius-lg)',
                                                textAlign: 'center',
                                                fontSize: 'var(--text-secondary)',
                                                fontWeight: 'bold'
                                            }}>
                                                Tournament Completed
                                            </div>
                                        ) : (
                                            <Button onClick={() => navigate(`/auction/${config?.slug}/live`)} variant="success" style={{ padding: 'var(--sp-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)' }}>
                                                <Play className="w-5 h-5" /> Launch Live Console
                                            </Button>
                                        )}
                                        <Button onClick={copyInviteLink} variant="secondary" style={{ padding: 'var(--sp-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)' }}>
                                            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />} {copied ? 'Share Link Copied!' : 'Copy Tournament Share Link'}
                                        </Button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
                                        <Button onClick={() => setActiveTab('teams')} variant="secondary" style={{ fontSize: 'var(--text-secondary)', padding: 'var(--sp-2)' }}>
                                            Configure Teams
                                        </Button>
                                        <Button onClick={() => setActiveTab('players')} variant="secondary" style={{ fontSize: 'var(--text-secondary)', padding: 'var(--sp-2)' }}>
                                            Configure Players
                                        </Button>
                                    </div>
                                </div>

                                {/* Bidding Statistics */}
                                <div className="workspace-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                                    <h3 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold' }}>Bidding Statistics</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--sp-2)' }}>
                                            <span style={{ fontSize: 'var(--text-secondary)', color: 'var(--text-muted)' }}>Purse Remaining</span>
                                            <span className="font-mono" style={{ fontWeight: 'bold', color: 'var(--success)' }}>₹{remainingPurse}L</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--sp-2)' }}>
                                            <span style={{ fontSize: 'var(--text-secondary)', color: 'var(--text-muted)' }}>Average Player Bid</span>
                                            <span className="font-mono" style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>₹{avgBid.toFixed(1)}L</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--sp-2)' }}>
                                            <span style={{ fontSize: 'var(--text-secondary)', color: 'var(--text-muted)' }}>Sold Players Count</span>
                                            <span className="font-mono" style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{soldCount} / {poolCount}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--sp-2)' }}>
                                            <span style={{ fontSize: 'var(--text-secondary)', color: 'var(--text-muted)' }}>Unsold Players Count</span>
                                            <span className="font-mono" style={{ fontWeight: 'bold', color: 'var(--danger-light)' }}>{unsoldCount}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                                            <span style={{ fontSize: 'var(--text-secondary)', color: 'var(--text-muted)' }}>Highest Bid:</span>
                                            {highestBidPlayer ? (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--sp-2)', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginTop: '2px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 'bold', fontSize: 'var(--text-secondary)' }}>{highestBidPlayer.name}</span>
                                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{highestBidTeam ? highestBidTeam.name : 'Unknown Team'}</span>
                                                    </div>
                                                    <span className="font-mono" style={{ fontWeight: 'bold', color: 'var(--success)' }}>₹{highestBidPlayer.soldPrice}L</span>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: 'var(--text-secondary)', color: 'var(--text-muted)', fontStyle: 'italic' }}>No sales recorded</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Center Widget: Team Budget Utilization */}
                            <div className="workspace-column" style={{ flex: 1.2 }}>
                                <div className="workspace-card">
                                    <h3 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold', marginBottom: 'var(--sp-4)' }}>Team Budget Utilization</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                                        {data.teams.map(team => {
                                            const percentUsed = ((team.spent / team.budget) * 100).toFixed(0);
                                            return (
                                                <div key={team._id} onClick={() => setSelectedTeam(team)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', transition: 'var(--transition-fast)' }} className="tr-hover">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-secondary)' }}>
                                                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{team.name}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                                                            <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>₹{team.spent}L / ₹{team.budget}L</span>
                                                            <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: 'var(--radius-full)', backgroundColor: `${team.color}15`, color: team.color }}>
                                                                {percentUsed}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="progress-bar-bg" style={{ height: '6px', backgroundColor: 'var(--border-strong)' }}>
                                                        <div className="progress-bar-fill" style={{ width: `${Math.min(100, Number(percentUsed))}%`, backgroundColor: team.color }}></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {data.teams.length === 0 && (
                                            <div className="empty-table-state">No teams created. Go to the "Teams" tab to add one.</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Widget: Recent Sold Players */}
                            <div className="workspace-column" style={{ flex: 1.2 }}>
                                <div className="workspace-card">
                                    <h3 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold', marginBottom: 'var(--sp-4)' }}>Recent Sold Players</h3>
                                    {recentSoldPlayers.length === 0 ? (
                                        <div className="empty-table-state" style={{ padding: 'var(--sp-8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '2px dashed var(--border)', borderRadius: 'var(--radius-xl)' }}>
                                            <Clock className="w-8 h-8 mb-2 opacity-40" />
                                            <div>No players sold yet.</div>
                                            <div style={{ fontSize: '10px', marginTop: '2px' }}>Start the live console to make sales.</div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                                            {recentSoldPlayers.map(p => {
                                                const team = data.teams.find(t => t._id === p.soldTo);
                                                return (
                                                    <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--sp-3)', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', gap: 'var(--sp-2)' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                            <span style={{ fontWeight: 'bold', fontSize: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.role} • {p.category}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                                                            <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: 'var(--radius-full)', color: getContrastColor(team?.color), backgroundColor: team?.color || 'var(--accent)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {team?.name || 'Sold'}
                                                            </span>
                                                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: 'var(--text-secondary)', color: 'var(--success)', marginTop: '2px' }}>₹{p.soldPrice}L</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: TEAMS */}
                {activeTab === 'teams' && (
                    <div className="animate-fade-in setup-workspace" style={{ padding: 0 }}>
                        {/* Creator Sidebar Form */}
                        <div className="workspace-column" style={{ flex: 0.8 }}>
                            {isCompleted ? (
                                <div className="workspace-card" style={{ padding: 'var(--sp-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px' }}>
                                    <Trophy className="w-10 h-10 text-green-600" />
                                    <h3 style={{ fontSize: 'var(--text-secondary)', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>Tournament Completed</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: 1.4 }}>
                                        This tournament has been archived. No further auction operations are available.
                                    </p>
                                </div>
                            ) : (
                                <div className="workspace-card">
                                    <h3 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold', marginBottom: 'var(--sp-6)' }}>Create New Team</h3>
                                    <div className="form-layout">
                                        <Input label="Team Title" value={newTeam.name} onChange={e => setNewTeam({ ...newTeam, name: e.target.value })} placeholder="e.g. Mumbai Giants" />
                                        <Input label="Logo Initials" value={newTeam.logoText || ''} onChange={e => setNewTeam({ ...newTeam, logoText: e.target.value.toUpperCase().slice(0, 3) })} placeholder="e.g. MI" />
                                        <Input label="Purse (₹ Lakhs)" type="number" className="font-mono" value={newTeam.budget} onChange={e => setNewTeam({ ...newTeam, budget: Number(e.target.value) })} />

                                        <div className="input-group">
                                            <label className="input-label">Theme Color</label>
                                            <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                                                <input className="input-field" type="text" value={newTeam.color} onChange={e => setNewTeam({ ...newTeam, color: e.target.value })} style={{ flex: 1 }} />
                                                <input type="color" value={newTeam.color} onChange={e => setNewTeam({ ...newTeam, color: e.target.value })} style={{ width: '3.5rem', height: '2.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '4px', cursor: 'pointer', backgroundColor: 'transparent' }} />
                                            </div>
                                        </div>
                                        <Button onClick={addTeam} loading={isAddingTeam} variant="primary" className="btn-w-full" style={{ padding: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
                                            Create Team
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* List Cards Grid */}
                        <div className="workspace-column" style={{ flex: 2 }}>
                            <div className="workspace-card">
                                <h3 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold', marginBottom: 'var(--sp-6)' }}>Registered Teams ({data.teams.length})</h3>
                                <div className="teams-responsive-grid">
                                    {data.teams.map(team => {
                                        const pursePercent = Math.max(0, Math.min(100, Math.round(((team.budget - team.spent) / team.budget) * 100))) || 0;
                                        const spentPercent = Math.max(0, Math.min(100, Math.round((team.spent / team.budget) * 100))) || 0;
                                        const totalSlots = 15;
                                        const filledSlots = Math.min(team.players.length, totalSlots);

                                        return (
                                            <div
                                                key={team._id}
                                                onClick={() => setSelectedTeam(team)}
                                                className="card tr-hover"
                                                style={{ 
                                                    cursor: 'pointer', 
                                                    padding: 'var(--sp-6)', 
                                                    backgroundColor: 'var(--bg-card)', 
                                                    border: `1px solid ${team.color}30`,
                                                    borderRadius: 'var(--radius-2xl)',
                                                    position: 'relative',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 'var(--sp-4)',
                                                    boxShadow: `0 10px 25px -5px ${team.color}20, 0 8px 10px -6px ${team.color}15, 0 0 0 1px ${team.color}10`
                                                }}
                                            >
                                                {/* Header Line */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                                    <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center', minWidth: 0 }}>
                                                        {/* Avatar Initials Logo with soft background matching team color */}
                                                        {(() => {
                                                            const initials = team.logoText || team.name.split(' ').map(n => n[0]).join('').slice(0, 3).toUpperCase();
                                                            return (
                                                                <div style={{
                                                                    width: '44px',
                                                                    height: '44px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: `${team.color}15`, // 15% opacity team color
                                                                    border: `1.5px solid ${team.color}40`,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    flexShrink: 0,
                                                                    fontWeight: '900',
                                                                    fontSize: '14px',
                                                                    color: team.color,
                                                                    fontFamily: 'var(--font-mono)'
                                                                }}>
                                                                    {initials}
                                                                </div>
                                                            );
                                                        })()}
                                                        <div style={{ minWidth: 0 }}>
                                                            <h4 style={{
                                                                fontWeight: '800',
                                                                fontSize: '15px',
                                                                color: 'var(--text-primary)',
                                                                margin: 0,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}>{team.name}</h4>
                                                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '2px', flexWrap: 'nowrap' }}>
                                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>Registered Team</span>
                                                                <span style={{ color: 'var(--text-muted)', opacity: 0.6, fontSize: '10px', flexShrink: 0, margin: '0 5px', display: 'inline-block', lineHeight: 1 }}>•</span>
                                                                <span style={{
                                                                    backgroundColor: '#f3e8ff',
                                                                    color: '#7e22ce',
                                                                    padding: '1px 6px',
                                                                    borderRadius: 'var(--radius-full)',
                                                                    fontSize: '8px',
                                                                    fontWeight: 'bold',
                                                                    whiteSpace: 'nowrap',
                                                                    flexShrink: 0
                                                                }}>Active</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Header Action Buttons */}
                                                    {!isCompleted && (
                                                        <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                                                            <div style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: 'var(--radius-lg)',
                                                                border: '1px solid var(--border)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'var(--text-muted)',
                                                                backgroundColor: 'transparent'
                                                            }}>
                                                                <MoreVertical className="w-4 h-4" />
                                                            </div>
                                                            <Button 
                                                                onClick={(e) => handleDeleteTeam(e, team._id)} 
                                                                className="btn-icon" 
                                                                variant="secondary" 
                                                                style={{ 
                                                                    color: '#ef4444', 
                                                                    padding: 0,
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    backgroundColor: '#fef2f2',
                                                                    border: '1px solid #fee2e2',
                                                                    borderRadius: 'var(--radius-lg)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }} 
                                                                title="Delete Team"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Divided Metrics Grid */}
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                                    padding: 'var(--sp-4) 0 var(--sp-1) 0',
                                                    borderTop: '1px solid var(--border)',
                                                    borderBottom: '1px solid var(--border)',
                                                    margin: 'var(--sp-1) 0',
                                                    alignItems: 'start'
                                                }}>
                                                    {/* Column 1: PURSE LEFT */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1.5)', minWidth: 0, paddingRight: 'var(--sp-2)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1.5)' }}>
                                                            <div style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                <Wallet className="w-3 h-3 text-blue-600" />
                                                            </div>
                                                            <span style={{ fontSize: '8px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Purse Left</span>
                                                        </div>
                                                        <div className="font-mono" style={{ fontSize: '18px', fontWeight: '900', color: '#2563eb', marginTop: '2px', lineHeight: 1 }}>
                                                            ₹{team.budget - team.spent}L
                                                        </div>
                                                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>of ₹{team.budget}L</span>
                                                        
                                                        {/* Semi-circular gauge SVG */}
                                                        <svg width="70" height="42" viewBox="0 0 70 42" style={{ margin: 'var(--sp-2) auto 0 auto', display: 'block', overflow: 'visible' }}>
                                                            <path d="M 8 36 A 27 27 0 0 1 62 36" fill="none" stroke="var(--border)" strokeWidth="5" strokeLinecap="round" />
                                                            <path d="M 8 36 A 27 27 0 0 1 62 36" fill="none" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" strokeDasharray="84.82" strokeDashoffset={84.82 * (1 - pursePercent / 100)} style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }} />
                                                            <text x="35" y="34" textAnchor="middle" style={{ fontSize: '10px', fontWeight: 'bold', fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{pursePercent}%</text>
                                                        </svg>
                                                    </div>

                                                    {/* Column 2: AMOUNT SPENT */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1.5)', borderLeft: '1px solid var(--border)', paddingLeft: 'var(--sp-3)', paddingRight: 'var(--sp-2)', minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1.5)' }}>
                                                            <div style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                <Trophy className="w-3 h-3 text-green-600" />
                                                            </div>
                                                            <span style={{ fontSize: '8px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Amt Spent</span>
                                                        </div>
                                                        <div className="font-mono" style={{ fontSize: '18px', fontWeight: '900', color: '#16a34a', marginTop: '2px', lineHeight: 1 }}>
                                                            ₹{team.spent}L
                                                        </div>
                                                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>of ₹{team.budget}L</span>
                                                        
                                                        {/* Semi-circular gauge SVG */}
                                                        <svg width="70" height="42" viewBox="0 0 70 42" style={{ margin: 'var(--sp-2) auto 0 auto', display: 'block', overflow: 'visible' }}>
                                                            <path d="M 8 36 A 27 27 0 0 1 62 36" fill="none" stroke="var(--border)" strokeWidth="5" strokeLinecap="round" />
                                                            <path d="M 8 36 A 27 27 0 0 1 62 36" fill="none" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" strokeDasharray="84.82" strokeDashoffset={84.82 * (1 - spentPercent / 100)} style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }} />
                                                            <text x="35" y="34" textAnchor="middle" style={{ fontSize: '10px', fontWeight: 'bold', fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{spentPercent}%</text>
                                                        </svg>
                                                    </div>

                                                    {/* Column 3: SQUAD SIZE */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1.5)', borderLeft: '1px solid var(--border)', paddingLeft: 'var(--sp-3)', minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1.5)' }}>
                                                            <div style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: 'rgba(234,179,8,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                <Users className="w-3 h-3 text-yellow-600" />
                                                            </div>
                                                            <span style={{ fontSize: '8px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Squad Size</span>
                                                        </div>
                                                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#ea580c', marginTop: '2px', lineHeight: 1 }}>
                                                            {team.players.length}
                                                        </div>
                                                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>of 15 Players</span>
                                                        
                                                        {/* 10-wide top row, 5-wide bottom row dot matrix indicator */}
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 6px)', gap: '4px', marginTop: '16px', justifyContent: 'start' }}>
                                                            {Array.from({ length: 15 }).map((_, i) => (
                                                                <span
                                                                    key={i}
                                                                    style={{
                                                                        width: '6px',
                                                                        height: '6px',
                                                                        borderRadius: '50%',
                                                                        backgroundColor: i < team.players.length ? '#ea580c' : '#e5e7eb'
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer Info & View Squad Link */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Clock className="w-3.5 h-3.5" style={{ opacity: 0.7 }} />
                                                        <span>Registered Team</span>
                                                    </div>
                                                    <span style={{ fontWeight: 'bold', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                        View Team <ArrowRight className="w-3.5 h-3.5" />
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {data.teams.length === 0 && (
                                        <div className="empty-table-state" style={{ width: '100%', gridColumn: '1/-1' }}>
                                            No teams registered yet. Use the creation form to introduce one.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: PLAYER POOL */}
                {activeTab === 'players' && (
                    <div className="animate-fade-in setup-player-pool-layout">
                        
                        {/* LEFT STICKY MANAGEMENT SIDEBAR */}
                        <div className="player-pool-sidebar desktop-only">
                            {isCompleted ? (
                                <div className="workspace-card sticky-sidebar" style={{ padding: 'var(--sp-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                                    <Trophy className="w-10 h-10 text-green-600" />
                                    <h3 style={{ fontSize: 'var(--text-secondary)', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>Tournament Completed</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: 1.4 }}>
                                        This tournament has been completed. Editing has been disabled. Only historical data is available.
                                    </p>
                                </div>
                            ) : editingPlayer ? (
                                <div className="workspace-card sticky-sidebar">
                                    <h3 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold', marginBottom: 'var(--sp-6)', color: 'var(--accent-light)' }}>Edit Player</h3>
                                    <div className="form-layout">
                                        <Input label="Full Name" value={editingPlayer.name} onChange={e => setEditingPlayer({ ...editingPlayer, name: e.target.value })} />
                                        <Input label="Base Bid (₹ Lakhs)" type="number" className="font-mono" value={editingPlayer.basePrice} onChange={e => setEditingPlayer({ ...editingPlayer, basePrice: Number(e.target.value) })} />

                                        <div className="input-group">
                                            <label className="input-label">Playing Role</label>
                                            <select className="input-field" value={editingPlayer.role} onChange={e => setEditingPlayer({ ...editingPlayer, role: e.target.value })}>
                                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Set / Category</label>
                                            <select className="input-field" value={editingPlayer.category} onChange={e => setEditingPlayer({ ...editingPlayer, category: e.target.value })}>
                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
                                            <Button onClick={() => setEditingPlayer(null)} variant="secondary" style={{ padding: 'var(--sp-3)' }}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleSavePlayer} loading={isAddingPlayer} variant="primary" style={{ padding: 'var(--sp-3)' }}>
                                                <Check className="w-4 h-4" /> Save
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="workspace-card sticky-sidebar">
                                    <h3 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold', marginBottom: 'var(--sp-6)' }}>Add Player to Pool</h3>
                                    <div className="form-layout">
                                        <Input label="Full Name" value={newPlayer.name} onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })} placeholder="e.g. Sachin Tendulkar" />
                                        <Input label="Base Bid (₹ Lakhs)" type="number" className="font-mono" value={newPlayer.basePrice} onChange={e => setNewPlayer({ ...newPlayer, basePrice: Number(e.target.value) })} />

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

                                        <Button onClick={handleSavePlayer} loading={isAddingPlayer} variant="primary" className="btn-w-full" style={{ padding: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
                                            <UserPlus className="w-4 h-4" /> Add Player
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT PRIMARY CONTENT AREA (List + Table) */}
                        <div className="player-pool-primary-content">
                            <div className="workspace-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-6)', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
                                    <h3 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold' }}>Player Pool ({data.players.length})</h3>
                                    
                                    {/* Mobile Add Trigger (opens bottom sheet modal) */}
                                    {!isCompleted && (
                                        <Button onClick={() => { setEditingPlayer(null); setIsAddPlayerOpen(true); }} variant="primary" className="mobile-only">
                                            <UserPlus className="w-4 h-4" /> Add Player
                                        </Button>
                                    )}
                                </div>

                                {/* Dynamic Filters Bar */}
                                <div className="setup-player-sticky-filters" style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 'var(--sp-4)',
                                    flexWrap: 'wrap',
                                    position: 'sticky',
                                    top: '59px',
                                    backgroundColor: 'var(--bg-card)',
                                    zIndex: 10,
                                    padding: 'var(--sp-2) var(--sp-6)',
                                    margin: 'calc(-1 * var(--sp-2)) calc(-1 * var(--sp-6)) var(--sp-4)',
                                    borderBottom: '1px solid var(--border)'
                                }}>
                                    <div className="filters-strip" style={{ margin: 0, display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap', flex: 1 }}>
                                        <button onClick={() => setFilterCategory('All')} className={`filter-btn ${filterCategory === 'All' ? 'filter-btn-active' : ''}`} style={{ fontSize: '10px' }}>All</button>
                                        {categories.map(cat => (
                                            <button key={cat} onClick={() => setFilterCategory(cat)} className={`filter-btn ${filterCategory === cat ? 'filter-btn-active' : ''}`} style={{ fontSize: '10px' }}>{cat}</button>
                                        ))}
                                    </div>
                                    <div style={{ minWidth: '240px', position: 'relative' }}>
                                        <Search className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        <input
                                            type="text"
                                            placeholder="Search name..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="input-field"
                                            style={{ paddingLeft: '36px', height: '2.25rem', fontSize: 'var(--text-secondary)', width: '100%', borderRadius: 'var(--radius-lg)' }}
                                        />
                                    </div>
                                </div>

                                {(() => {
                                    const filtered = data.players
                                        .filter(p => filterCategory === 'All' || p.category === filterCategory)
                                        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

                                    if (filtered.length === 0) {
                                        return <div className="empty-table-state">No players found matching filter criteria.</div>;
                                    }

                                    return (
                                        <>
                                            {/* DESKTOP TABLE */}
                                            <div className="table-wrapper desktop-only" style={{ maxHeight: '480px', overflowY: 'auto' }}>
                                                <table className="table">
                                                     <thead>
                                                         <tr>
                                                             <th>Name</th>
                                                             <th>Role</th>
                                                             <th>Category</th>
                                                             <th>Base Price</th>
                                                             <th>Status</th>
                                                             {!isCompleted && <th style={{ width: '90px', textAlign: 'right' }}>Actions</th>}
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
                                                                         <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'flex-end' }}>
                                                                             <Button onClick={() => setEditingPlayer(player)} className="btn-icon" variant="secondary" style={{ color: 'var(--accent-light)', padding: 'var(--sp-1)' }} title="Edit Player">
                                                                                 <Edit2 className="w-4 h-4" />
                                                                             </Button>
                                                                             <Button onClick={() => handleDeletePlayer(player._id)} className="btn-icon" variant="secondary" style={{ color: 'var(--danger)', padding: 'var(--sp-1)' }} title="Delete Player">
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
                                            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', maxHeight: '480px', overflowY: 'auto', paddingRight: 'var(--sp-1)' }}>
                                                {filtered.map(player => (
                                                    <div key={player._id} className="card player-mobile-card" style={{ padding: 'var(--sp-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                                                        <div>
                                                            <h4 style={{ fontWeight: 'bold', fontSize: 'var(--text-secondary)', marginBottom: '4px' }}>{player.name}</h4>
                                                            <div style={{ display: 'flex', gap: 'var(--sp-2)', fontSize: '10px' }}>
                                                                <Badge>{player.role}</Badge>
                                                                <Badge>{player.category}</Badge>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div className="font-mono" style={{ fontWeight: 'bold', fontSize: 'var(--text-secondary)' }}>₹{player.basePrice}L</div>
                                                                <div style={{ marginTop: '2px' }}>
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
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                                                                    <Button onClick={() => { setEditingPlayer(player); setIsAddPlayerOpen(true); }} className="btn-icon" variant="secondary" style={{ color: 'var(--accent-light)' }}>
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button onClick={() => handleDeletePlayer(player._id)} className="btn-icon" variant="secondary" style={{ color: 'var(--danger)' }}>
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* MOBILE BOTTOM SHEET MODAL (Add & Edit) */}
                        <Modal
                            isOpen={isAddPlayerOpen}
                            onClose={() => { setIsAddPlayerOpen(false); setEditingPlayer(null); }}
                            title={editingPlayer ? "Edit Player" : "Add Player to Pool"}
                            maxWidth="28rem"
                        >
                            <div className="form-layout" style={{ padding: 'var(--sp-2) 0' }}>
                                {editingPlayer ? (
                                    <>
                                        <Input label="Full Name" value={editingPlayer.name} onChange={e => setEditingPlayer({ ...editingPlayer, name: e.target.value })} />
                                        <Input label="Base Bid (₹ Lakhs)" type="number" className="font-mono" value={editingPlayer.basePrice} onChange={e => setEditingPlayer({ ...editingPlayer, basePrice: Number(e.target.value) })} />

                                        <div className="input-group">
                                            <label className="input-label">Playing Role</label>
                                            <select className="input-field" value={editingPlayer.role} onChange={e => setEditingPlayer({ ...editingPlayer, role: e.target.value })}>
                                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Set / Category</label>
                                            <select className="input-field" value={editingPlayer.category} onChange={e => setEditingPlayer({ ...editingPlayer, category: e.target.value })}>
                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>

                                        <Button 
                                            onClick={handleSavePlayer} 
                                            loading={isAddingPlayer}
                                            variant="primary" 
                                            className="btn-w-full" 
                                            style={{ padding: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}
                                        >
                                            <Check className="w-4 h-4" /> Save Changes
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Input label="Full Name" value={newPlayer.name} onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })} placeholder="e.g. Sachin Tendulkar" />
                                        <Input label="Base Bid (₹ Lakhs)" type="number" className="font-mono" value={newPlayer.basePrice} onChange={e => setNewPlayer({ ...newPlayer, basePrice: Number(e.target.value) })} />

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

                                        <Button 
                                            onClick={handleSavePlayer} 
                                            loading={isAddingPlayer}
                                            variant="primary" 
                                            className="btn-w-full" 
                                            style={{ padding: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}
                                        >
                                            <UserPlus className="w-4 h-4" /> Add Player
                                        </Button>
                                    </>
                                )}
                            </div>
                        </Modal>
                    </div>
                )}

                {/* TAB 4: SETTINGS */}
                {activeTab === 'settings' && (
                    <div className="animate-fade-in setup-workspace" style={{ padding: 0 }}>
                        <div className="workspace-column" style={{ flex: 1.5 }}>
                            <div className="workspace-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
                                <h3 style={{ fontSize: 'var(--text-sub)', fontWeight: 'bold' }}>Tournament Settings</h3>

                                <div className="form-layout">
                                    <Input label="Tournament Name" value={auctionName} readOnly style={{ opacity: 0.8 }} />
                                    
                                    <div className="input-group">
                                        <label className="input-label">Access Code (Read-Only)</label>
                                        <div style={{ position: 'relative', width: '100%' }}>
                                            <input
                                                type={showAccessCode ? 'text' : 'password'}
                                                value={auctionCode}
                                                readOnly
                                                className="input-field font-mono"
                                                style={{ opacity: 0.8, paddingRight: '2.5rem' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowAccessCode(!showAccessCode)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '12px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: 0
                                                }}
                                                title={showAccessCode ? 'Hide access code' : 'Show access code'}
                                            >
                                                {showAccessCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Roles Configured ({roles.length})</label>
                                        <div className="filters-strip" style={{ margin: 0 }}>
                                            {roles.map(r => <span key={r} className="badge" style={{ textTransform: 'none' }}>{r}</span>)}
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Set Categories Configured ({categories.length})</label>
                                        <div className="filters-strip" style={{ margin: 0 }}>
                                            {categories.map(c => <span key={c} className="badge" style={{ textTransform: 'none' }}>{c}</span>)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* === MOBILE BOTTOM NAVIGATION BAR === */}
            <div className="setup-mobile-bottom-nav">
                {[
                    { id: 'overview', label: 'Overview', icon: LayoutGrid },
                    { id: 'teams', label: 'Teams', icon: Users },
                    { id: 'players', label: 'Players', icon: UserPlus },
                    { id: 'settings', label: 'Settings', icon: Settings }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`setup-mobile-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                    >
                        <tab.icon className="w-5 h-5" style={{ marginBottom: '2px' }} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Custom Modal Confirmation Dialog */}
            <ConfirmDialog 
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                type={confirmDialog.type}
            />

            {/* Custom Modal Notification Alert */}
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
