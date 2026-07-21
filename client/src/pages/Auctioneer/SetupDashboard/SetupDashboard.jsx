import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Users, UserPlus, Settings, Play, LogOut, Lock, Sun, Moon } from 'lucide-react';
import { createTeam, deleteTeam, updateTeam } from '@domains/team';
import { clearTokens } from '@services/auth.service';
import Button from '@shared/components/Button';
import ConfirmDialog from '@shared/components/ConfirmDialog';
import AlertDialog from '@shared/components/AlertDialog';

import Overview from './Overview';
import Teams from './Teams';
import Players from './Players';
import SettingsTab from './Settings';
import './SetupDashboard.css';

export default function SetupDashboard({ data, auctionId, onRefresh, config, onLogout }) {
    const navigate = useNavigate();

    const [theme, setTheme] = useState(() => localStorage.getItem('setup_theme_preference') || 'light');

    // --- 1. DYNAMIC CONFIGURATION ---
    const categories = config?.categories?.length ? config.categories : ['Marquee', 'Set 1', 'Set 2', 'Set 3', 'Set 4'];
    const roles = config?.roles?.length ? config.roles : ['Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper'];

    const [auctionCode, setAuctionCode] = useState('');
    const [auctionName, setAuctionName] = useState('Tournament');
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'teams', 'players', 'settings'
    const [copied, setCopied] = useState(false);

    // Teams Form Local-to-Parent State
    const [isAddingTeam, setIsAddingTeam] = useState(false);
    const [newTeam, setNewTeam] = useState({ name: '', budget: 1000, color: '#3B82F6', logoText: '' });
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [isEditingSelectedTeam, setIsEditingSelectedTeam] = useState(false);
    const [editTeamData, setEditTeamData] = useState({ name: '', budget: 1000, color: '#3B82F6', logoText: '' });

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
        if (config) {
            setAuctionCode(config.accessCode || '');
            setAuctionName(config.name || 'Tournament');
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
        const slugOrId = config?.slug || auctionId;
        const link = `${window.location.origin}/auction/${slugOrId}`;
        
        const setCopySuccess = () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(link)
                .then(setCopySuccess)
                .catch(() => fallbackCopy(link, setCopySuccess));
        } else {
            fallbackCopy(link, setCopySuccess);
        }
    };

    const fallbackCopy = (text, onSuccess) => {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.position = "fixed";
            textArea.style.opacity = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
                onSuccess();
            }
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
    };

    // --- TEAMS ACTIONS ---
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

    return (
        <div className={`admin-setup-page theme-${theme}`}>
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

            {/* --- TOP BRAND BAR & DESKTOP NAVIGATION --- */}
            <div className="setup-header">
                <div className="brand-block">
                    <div className="brand-logo">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
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
                        <Button onClick={() => navigate(`/auction/${config?.slug}/live`)} variant="success">
                            <Play className="w-4 h-4" /> Launch
                        </Button>
                    )}
                </div>
            </div>

            {/* --- TAB WORKSPACE AREA --- */}
            <div className="container" style={{ paddingTop: 'var(--sp-6)', paddingBottom: 'var(--sp-20)' }}>
                {activeTab === 'overview' && (
                    <Overview
                        data={data}
                        config={config}
                        navigate={navigate}
                        totalBudget={totalBudget}
                        totalSpent={totalSpent}
                        remainingPurse={remainingPurse}
                        avgBid={avgBid}
                        soldCount={soldCount}
                        poolCount={poolCount}
                        unsoldCount={unsoldCount}
                        highestBidPlayer={highestBidPlayer}
                        highestBidTeam={highestBidTeam}
                        recentSoldPlayers={recentSoldPlayers}
                        copyInviteLink={copyInviteLink}
                        copied={copied}
                        isCompleted={isCompleted}
                        setActiveTab={setActiveTab}
                        setSelectedTeam={setSelectedTeam}
                    />
                )}

                {activeTab === 'teams' && (
                    <Teams
                        data={data}
                        config={config}
                        theme={theme}
                        isCompleted={isCompleted}
                        navigate={navigate}
                        addTeam={addTeam}
                        isAddingTeam={isAddingTeam}
                        newTeam={newTeam}
                        setNewTeam={setNewTeam}
                        handleDeleteTeam={handleDeleteTeam}
                        handleSaveTeamEdit={handleSaveTeamEdit}
                        editTeamData={editTeamData}
                        setEditTeamData={setEditTeamData}
                        isEditingSelectedTeam={isEditingSelectedTeam}
                        setIsEditingSelectedTeam={setIsEditingSelectedTeam}
                        selectedTeam={selectedTeam}
                        setSelectedTeam={setSelectedTeam}
                        showConfirm={showConfirm}
                        showAlert={showAlert}
                    />
                )}

                {activeTab === 'players' && (
                    <Players
                        data={data}
                        config={config}
                        theme={theme}
                        isCompleted={isCompleted}
                        onRefresh={onRefresh}
                        roles={roles}
                        categories={categories}
                        showConfirm={showConfirm}
                        showAlert={showAlert}
                    />
                )}

                {activeTab === 'settings' && (
                    <SettingsTab
                        auctionName={auctionName}
                        auctionCode={auctionCode}
                        roles={roles}
                        categories={categories}
                        theme={theme}
                        setTheme={setTheme}
                        onLogout={onLogout || (() => { clearTokens(auctionId); navigate(`/auction/${config?.slug || auctionId}`); })}
                    />
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
                theme={theme}
            />

            {/* Custom Modal Notification Alert */}
            <AlertDialog 
                isOpen={alertDialog.isOpen}
                onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
                title={alertDialog.title}
                message={alertDialog.message}
                type={alertDialog.type}
                theme={theme}
            />
        </div>
    );
}
