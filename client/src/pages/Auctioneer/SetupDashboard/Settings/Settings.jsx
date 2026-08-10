import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Plus, X, Upload, Download, Save, FileSpreadsheet, Check } from 'lucide-react';
import Input from '@shared/components/Input';
import Button from '@shared/components/Button';
import CustomSelect from '@shared/components/Select/CustomSelect';
import { updateAuction } from '@domains/auction';
import { bulkImportPlayers } from '@domains/player';
import './Settings.css';

export default function Settings({
    auctionName,
    config,
    data,
    roles = [],
    categories = [],
    theme,
    setTheme,
    onRefresh,
    showAlert,
    showConfirm,
    onLogout
}) {
    // Local Editable Configurations
    const [localRoles, setLocalRoles] = useState(roles);
    const [localCategories, setLocalCategories] = useState(categories);
    const [newRoleText, setNewRoleText] = useState('');
    const [newCategoryText, setNewCategoryText] = useState('');
    const [isSavingConfig, setIsSavingConfig] = useState(false);

    // Import State & File Input Ref
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        setLocalRoles(roles);
    }, [roles]);

    useEffect(() => {
        setLocalCategories(categories);
    }, [categories]);

    // Role Handlers
    const handleAddRole = () => {
        const trimmed = newRoleText.trim();
        if (!trimmed) return;
        if (localRoles.some(r => r.toLowerCase() === trimmed.toLowerCase())) {
            if (showAlert) showAlert("Duplicate Role", `Role "${trimmed}" already exists.`, "warning");
            return;
        }
        setLocalRoles([...localRoles, trimmed]);
        setNewRoleText('');
    };

    const handleRemoveRole = (roleToRemove) => {
        if (localRoles.length <= 1) {
            if (showAlert) showAlert("Action Not Allowed", "You must keep at least one role configured.", "warning");
            return;
        }
        setLocalRoles(localRoles.filter(r => r !== roleToRemove));
    };

    // Category Handlers
    const handleAddCategory = () => {
        const trimmed = newCategoryText.trim();
        if (!trimmed) return;
        if (localCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
            if (showAlert) showAlert("Duplicate Category", `Category "${trimmed}" already exists.`, "warning");
            return;
        }
        setLocalCategories([...localCategories, trimmed]);
        setNewCategoryText('');
    };

    const handleRemoveCategory = (catToRemove) => {
        if (localCategories.length <= 1) {
            if (showAlert) showAlert("Action Not Allowed", "You must keep at least one category configured.", "warning");
            return;
        }
        setLocalCategories(localCategories.filter(c => c !== catToRemove));
    };

    // Save Configurations
    const handleSaveConfigurations = async () => {
        const auctionId = config?._id || config?.id;
        if (!auctionId) return;

        setIsSavingConfig(true);
        try {
            await updateAuction(auctionId, {
                roles: localRoles,
                categories: localCategories
            });
            if (showAlert) showAlert("Success", "Roles and categories updated successfully!", "success");
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error("Error updating auction settings:", err);
            if (showAlert) showAlert("Error", err.response?.data?.error || "Failed to update configurations.", "error");
        } finally {
            setIsSavingConfig(false);
        }
    };

    // Export Players to CSV
    const handleExportPlayersCSV = () => {
        const playersList = data?.players || [];
        if (playersList.length === 0) {
            if (showAlert) showAlert("No Players", "There are no players in the pool to export.", "info");
            return;
        }

        const teamMap = new Map((data?.teams || []).map(t => [t._id, t.name]));
        const headers = ['Name', 'Role', 'Category', 'Base Price (Lakhs)', 'Status', 'Sold To Team', 'Sold Price (Lakhs)'];

        const rows = playersList.map(p => {
            const teamName = p.soldTo ? (teamMap.get(p.soldTo) || p.soldTo) : '';
            const status = p.isSold ? 'SOLD' : (p.isUnsold ? 'UNSOLD' : 'OPEN');
            return [
                `"${(p.name || '').replace(/"/g, '""')}"`,
                `"${(p.role || '').replace(/"/g, '""')}"`,
                `"${(p.category || '').replace(/"/g, '""')}"`,
                p.basePrice || 0,
                status,
                `"${teamName.replace(/"/g, '""')}"`,
                p.isSold ? (p.soldPrice || 0) : 0
            ].join(',');
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `auction_players_${auctionName.replace(/\s+/g, '_')}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Download Sample CSV Template
    const handleDownloadTemplate = () => {
        const headers = ['Name', 'Role', 'Category', 'BasePrice'];
        const sampleRows = [
            ['Virat Kohli', localRoles[0] || 'Batsman', localCategories[0] || 'Marquee', '200'],
            ['Jasprit Bumrah', localRoles[1] || 'Bowler', localCategories[0] || 'Marquee', '200'],
            ['Hardik Pandya', localRoles[2] || 'All Rounder', localCategories[1] || 'Set 1', '150']
        ];

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'sample_players_import_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Parse CSV Helper
    const parseCSVText = (csvText) => {
        const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length <= 1) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('player'));
        const roleIdx = headers.findIndex(h => h.includes('role'));
        const catIdx = headers.findIndex(h => h.includes('cat') || h.includes('set'));
        const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('base'));

        const parsedPlayers = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cells = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
            const clean = cells.map(cell => cell.trim().replace(/^["']|["']$/g, ''));

            const name = nameIdx !== -1 && clean[nameIdx] ? clean[nameIdx] : clean[0];
            const role = roleIdx !== -1 && clean[roleIdx] ? clean[roleIdx] : (clean[1] || localRoles[0] || 'Batsman');
            const category = catIdx !== -1 && clean[catIdx] ? clean[catIdx] : (clean[2] || localCategories[0] || 'Marquee');
            const priceRaw = priceIdx !== -1 && clean[priceIdx] ? clean[priceIdx] : (clean[3] || '20');
            const basePrice = Number(priceRaw.replace(/[^0-9.]/g, '')) || 20;

            if (name && name.trim()) {
                parsedPlayers.push({
                    name: name.trim(),
                    role: role.trim(),
                    category: category.trim(),
                    basePrice
                });
            }
        }
        return parsedPlayers;
    };

    // Handle Upload
    const handleFileSelected = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const auctionId = config?._id || config?.id;
        if (!auctionId) return;

        setIsImporting(true);
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                let parsedPlayers = [];

                if (file.name.endsWith('.json')) {
                    const jsonArr = JSON.parse(text);
                    if (Array.isArray(jsonArr)) {
                        parsedPlayers = jsonArr.map(item => ({
                            name: item.name || item.Name || '',
                            role: item.role || item.Role || localRoles[0] || 'Batsman',
                            category: item.category || item.Category || localCategories[0] || 'Marquee',
                            basePrice: Number(item.basePrice || item.base_price || item.BasePrice || 20)
                        })).filter(p => p.name);
                    }
                } else {
                    parsedPlayers = parseCSVText(text);
                }

                if (parsedPlayers.length === 0) {
                    if (showAlert) showAlert("Invalid File", "No valid player rows found in the uploaded file.", "warning");
                    setIsImporting(false);
                    return;
                }

                const res = await bulkImportPlayers(auctionId, parsedPlayers);
                const importedCount = res.data?.importedCount || parsedPlayers.length;
                const errorCount = res.data?.failedCount || 0;

                // Sync newly introduced roles & categories from imported players
                let updatedRolesList = res.data?.roles;
                if (!updatedRolesList || !Array.isArray(updatedRolesList)) {
                    const roleSet = new Set(localRoles);
                    parsedPlayers.forEach(p => { if (p.role) roleSet.add(p.role); });
                    updatedRolesList = Array.from(roleSet);
                }
                setLocalRoles(updatedRolesList);

                let updatedCatsList = res.data?.categories;
                if (!updatedCatsList || !Array.isArray(updatedCatsList)) {
                    const catSet = new Set(localCategories);
                    parsedPlayers.forEach(p => { if (p.category) catSet.add(p.category); });
                    updatedCatsList = Array.from(catSet);
                }
                setLocalCategories(updatedCatsList);

                let msg = `Successfully imported ${importedCount} player(s).`;
                if (errorCount > 0) {
                    msg += ` (${errorCount} duplicate/invalid rows skipped)`;
                }

                if (showAlert) showAlert("Import Complete", msg, "success");
                if (onRefresh) onRefresh();
            } catch (err) {
                console.error("Error importing file:", err);
                if (showAlert) showAlert("Import Failed", err.response?.data?.error || err.message || "Failed to process player import file.", "error");
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        reader.readAsText(file);
    };

    const isConfigChanged =
        JSON.stringify(localRoles) !== JSON.stringify(roles) ||
        JSON.stringify(localCategories) !== JSON.stringify(categories);

    return (
        <div className="animate-fade-in setup-workspace settings-setup">
            <div className="workspace-column settings-setup__col">
                <div className="workspace-card settings-setup__card">
                    <h3 className="settings-setup__title">Tournament Settings & Config</h3>

                    <div className="form-layout">
                        <Input label="Tournament Name" value={auctionName} readOnly className="settings-setup__input--readonly" />

                        {setTheme && (
                            <CustomSelect
                                label="Theme Mode"
                                options={[
                                    { label: 'Light Mode', value: 'light' },
                                    { label: 'Dark Mode', value: 'dark' }
                                ]}
                                value={theme}
                                onChange={val => {
                                    setTheme(val);
                                    localStorage.setItem('setup_theme_preference', val);
                                }}
                            />
                        )}

                        {/* EDITABLE ROLES */}
                        <div className="input-group">
                            <label className="input-label">Roles Configured ({localRoles.length})</label>
                            <div className="settings-setup__badge-strip">
                                {localRoles.map(r => (
                                    <span key={r} className="settings-setup__editable-chip">
                                        <span className="settings-setup__chip-text">{r}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRole(r)}
                                            className="settings-setup__chip-delete"
                                            title={`Remove role ${r}`}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="settings-setup__add-chip-row">
                                <input
                                    type="text"
                                    placeholder="Add new role (e.g. Keeper)"
                                    value={newRoleText}
                                    onChange={e => setNewRoleText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
                                    className="input-field settings-setup__add-input"
                                />
                                <Button type="button" onClick={handleAddRole} variant="secondary" size="sm">
                                    <Plus className="w-4 h-4" /> Add
                                </Button>
                            </div>
                        </div>

                        {/* EDITABLE SET CATEGORIES */}
                        <div className="input-group">
                            <label className="input-label">Set Categories Configured ({localCategories.length})</label>
                            <div className="settings-setup__badge-strip">
                                {localCategories.map(c => (
                                    <span key={c} className="settings-setup__editable-chip">
                                        <span className="settings-setup__chip-text">{c}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCategory(c)}
                                            className="settings-setup__chip-delete"
                                            title={`Remove category ${c}`}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="settings-setup__add-chip-row">
                                <input
                                    type="text"
                                    placeholder="Add new category (e.g. Set 5)"
                                    value={newCategoryText}
                                    onChange={e => setNewCategoryText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                                    className="input-field settings-setup__add-input"
                                />
                                <Button type="button" onClick={handleAddCategory} variant="secondary" size="sm">
                                    <Plus className="w-4 h-4" /> Add
                                </Button>
                            </div>
                        </div>

                        {/* SAVE CONFIGURATION BUTTON */}
                        {isConfigChanged && (
                            <Button
                                type="button"
                                onClick={handleSaveConfigurations}
                                loading={isSavingConfig}
                                variant="primary"
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                <Save className="w-4 h-4" /> Save Updated Roles & Categories
                            </Button>
                        )}

                        {/* PLAYER DATA IMPORT & EXPORT SECTION */}
                        <div className="settings-setup__section-divider">
                            <h4 style={{ fontSize: 'var(--text-secondary)', fontWeight: 'bold', margin: '0 0 var(--sp-3) 0' }}>
                                Player Data Import & Export
                            </h4>
                            <div className="settings-setup__data-box">
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                    Import players in bulk via CSV/JSON or export the complete player list with bidding results.
                                </div>
                                <div className="settings-setup__data-actions">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelected}
                                        accept=".csv,.json,.txt"
                                        style={{ display: 'none' }}
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        loading={isImporting}
                                        variant="primary"
                                        size="sm"
                                    >
                                        <Upload className="w-4 h-4" /> Import Players (CSV / JSON)
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleExportPlayersCSV}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        <Download className="w-4 h-4" /> Export Player Data (CSV)
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleDownloadTemplate}
                                        variant="secondary"
                                        size="sm"
                                        title="Download CSV template format"
                                    >
                                        <FileSpreadsheet className="w-4 h-4" /> Sample CSV Template
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {onLogout && (
                            <div className="input-group" style={{ marginTop: 'var(--sp-4)', paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--border)' }}>
                                <Button onClick={onLogout} variant="danger" style={{ width: '100%', justifyContent: 'center' }}>
                                    <LogOut className="w-4 h-4" /> Logout of Tournament
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
