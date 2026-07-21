import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trash2, ExternalLink, Key, Shield, Plus, LogOut,
    Save, Edit2, Power, Layers, Users, Zap, Search,
    Clock, Archive, RotateCcw, Upload, Download, FileSpreadsheet,
    AlertTriangle, CheckCircle, Eye, Settings, Gavel
} from 'lucide-react';
import {
    getAuctions, getArchivedAuctions, createAuction,
    updateAuction, archiveAuction, restoreAuction, deleteAuction,
    getAuctionInit
} from '@domains/auction';
import { bulkImportPlayers } from '@domains/player';
import { bulkImportTeams } from '@domains/team';
import { verifyStoredSuperAdminToken, clearSuperAdminTokens, verifyHostPassword, setTokens } from '@services/auth.service';
import Button from '@shared/components/Button';
import Input from '@shared/components/Input';
import Modal from '@shared/components/Modal';
import Badge from '@shared/components/Badge';
import ConfirmDialog from '@shared/components/ConfirmDialog';
import AlertDialog from '@shared/components/AlertDialog';
import './Dashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();
    const [auctions, setAuctions] = useState([]);
    const [archivedAuctions, setArchivedAuctions] = useState([]);

    // --- UI STATES ---
    const [activeTab, setActiveTab] = useState('active'); // 'active', 'completed', or 'archived'
    const [searchQuery, setSearchQuery] = useState('');

    // --- MODAL STATES ---
    const [showCreate, setShowCreate] = useState(false);
    const [editingAuction, setEditingAuction] = useState(null);

    // --- CSV IMPORT MODAL STATE ---
    const [csvModal, setCsvModal] = useState({
        isOpen: false,
        auction: null,
        type: 'players', // 'players' or 'teams'
        fileName: '',
        parsedRows: [],
        validationErrors: [],
        importSummary: null,
        isUploading: false
    });

    // --- FORM STATES ---
    const [newAuction, setNewAuction] = useState({
        name: '', accessCode: '', isStrictRandom: false, categories: 'Marquee, Set 1, Set 2, Set 3, Set 4', roles: 'Batsman, Bowler, All Rounder, Wicket Keeper'
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
        verifyStoredSuperAdminToken()
            .then(() => fetchAuctions())
            .catch(() => {
                clearSuperAdminTokens();
                navigate('/super-admin');
            });
    }, [navigate]);

    const fetchAuctions = async () => {
        try {
            const [activeRes, archivedRes] = await Promise.all([
                getAuctions(),
                getArchivedAuctions()
            ]);
            setAuctions(activeRes.data);
            setArchivedAuctions(archivedRes.data);
        } catch (err) { console.error("Error fetching auctions:", err); }
    };

    // --- FILTER LOGIC ---
    const getFilteredAuctions = () => {
        const query = searchQuery.toLowerCase();
        if (activeTab === 'archived') {
            return archivedAuctions.filter(a => a.name.toLowerCase().includes(query));
        }
        if (activeTab === 'completed') {
            return auctions.filter(a => (a.status === 'completed' || a.isActive === false) && a.name.toLowerCase().includes(query));
        }
        // Active
        return auctions.filter(a => a.status !== 'completed' && a.isActive !== false && a.name.toLowerCase().includes(query));
    };

    const filteredAuctions = getFilteredAuctions();

    // --- ACTIONS ---
    const handleArchive = (auction) => {
        showConfirm(
            "Archive Tournament",
            `Move "${auction.name}" to archive? It can be restored later or permanently deleted from the Archived tab.`,
            "warning",
            "Archive Tournament",
            async () => {
                try {
                    await archiveAuction(auction._id);
                    fetchAuctions();
                } catch (err) {
                    console.error("Error archiving tournament:", err);
                    showAlert("Error", "Failed to archive tournament.", "error");
                }
            }
        );
    };

    const handleRestore = (auction) => {
        showConfirm(
            "Restore Tournament",
            `Restore "${auction.name}" back to active tournaments?`,
            "info",
            "Restore",
            async () => {
                try {
                    await restoreAuction(auction._id);
                    fetchAuctions();
                } catch (err) {
                    console.error("Error restoring tournament:", err);
                    showAlert("Error", "Failed to restore tournament.", "error");
                }
            }
        );
    };

    const handlePermanentDelete = (auctionId) => {
        showConfirm(
            "Permanently Delete Tournament",
            "⚠️ PERMANENT DELETE: This will destroy the Tournament, Teams, and Players completely. This action CANNOT be undone.",
            "danger",
            "Delete Permanently",
            async () => {
                try {
                    await deleteAuction(auctionId);
                    fetchAuctions();
                } catch (err) {
                    console.error("Error deleting tournament:", err);
                    showAlert("Error", err.response?.data?.error || "Failed to delete tournament.", "error");
                }
            }
        );
    };

    const handleNavigateAuction = async (auction, route) => {
        const identifier = auction.slug || auction._id;
        if (route === 'viewer') {
            navigate(`/auction/${identifier}`);
            return;
        }

        try {
            const res = await verifyHostPassword(auction._id, auction.accessCode);
            if (res.data?.accessToken) {
                setTokens(auction._id, res.data.accessToken, res.data.refreshToken);
                setTokens(identifier, res.data.accessToken, res.data.refreshToken);
            }
            navigate(`/auction/${identifier}/${route}`);
        } catch (err) {
            console.error("Auto login failed, navigating directly:", err);
            navigate(`/auction/${identifier}/${route}`);
        }
    };

    const toggleStatus = async (auction) => {
        let nextStatus = 'live';
        let nextIsActive = true;
        
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
            isStrictRandom: newAuction.isStrictRandom || false,
            categories: newAuction.categories.split(',').map(s => s.trim()).filter(s => s),
            roles: newAuction.roles.split(',').map(s => s.trim()).filter(s => s)
        };
        await createAuction(payload);
        setShowCreate(false);
        setNewAuction({ name: '', accessCode: '', isStrictRandom: false, categories: 'Marquee, Set 1, Set 2, Set 3, Set 4', roles: 'Batsman, Bowler, All Rounder, Wicket Keeper' });
        fetchAuctions();
    };

    const handleUpdate = async () => {
        if (!editingAuction) return;
        const payload = {
            name: editingAuction.name,
            accessCode: editingAuction.accessCode,
            isActive: editingAuction.isActive,
            status: editingAuction.status || 'live',
            isStrictRandom: editingAuction.isStrictRandom || false,
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

    // --- CSV HELPER FUNCTIONS ---
    const downloadSampleCSV = (type) => {
        let content = '';
        let fileName = '';

        if (type === 'players') {
            content = "Name,Role,Category,Base Price\nPlayer 1,Batsman,Marquee,100\nPlayer 2,Bowler,Set 1,50\nPlayer 3,All Rounder,Set 1,50\nPlayer 4,Wicket Keeper,Set 2,20";
            fileName = "players_sample_template.csv";
        } else {
            content = "Team Name,Budget,Color,Logo Text\nTeam Alpha,10000,#3B82F6,TA\nTeam Beta,10000,#10B981,TB\nTeam Gamma,10000,#EF4444,TG";
            fileName = "teams_sample_template.csv";
        }

        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const openImportModal = (auction, type) => {
        setCsvModal({
            isOpen: true,
            auction,
            type,
            fileName: '',
            parsedRows: [],
            validationErrors: [],
            importSummary: null,
            isUploading: false
        });
    };

    const handleCSVFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            parseAndValidateCSV(text, csvModal.type);
        };
        reader.readAsText(file);
        setCsvModal(prev => ({ ...prev, fileName: file.name }));
    };

    const parseAndValidateCSV = (text, type) => {
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
            setCsvModal(prev => ({
                ...prev,
                parsedRows: [],
                validationErrors: [{ row: 1, error: "CSV file must contain a header row and at least 1 data row." }],
                importSummary: null
            }));
            return;
        }

        const parseCSVLine = (line) => {
            const res = [];
            let curr = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const c = line[i];
                if (c === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                        curr += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (c === ',' && !inQuotes) {
                    res.push(curr.trim());
                    curr = '';
                } else {
                    curr += c;
                }
            }
            res.push(curr.trim());
            return res.map(val => {
                let v = val.trim();
                if (v.startsWith('"') && v.endsWith('"')) {
                    v = v.slice(1, -1).trim();
                }
                return v;
            });
        };

        const rawHeaderLine = parseCSVLine(lines[0]);
        const rows = [];
        const errors = [];
        const seenNames = new Set();

        const getColValue = (rowMap, patterns) => {
            const keys = Object.keys(rowMap);
            for (const pattern of patterns) {
                const found = keys.find(k => pattern.test(k.trim()));
                if (found !== undefined) return rowMap[found];
            }
            return '';
        };

        for (let i = 1; i < lines.length; i++) {
            const rowNumber = i + 1;
            const values = parseCSVLine(lines[i]);
            if (values.every(v => v === '')) continue;

            const rowMap = {};
            rawHeaderLine.forEach((h, idx) => {
                rowMap[h.trim()] = values[idx] !== undefined ? values[idx] : '';
            });

            if (type === 'players') {
                const name = getColValue(rowMap, [/^name$/i, /player\s*name/i, /name/i]);
                const role = getColValue(rowMap, [/^role$/i, /role/i]);
                const category = getColValue(rowMap, [/^category$/i, /^cat$/i, /category/i]);
                const priceStr = getColValue(rowMap, [/^base\s*price$/i, /^baseprice$/i, /^base$/i, /^price$/i]);
                const basePrice = Number(priceStr);

                let rowError = null;
                if (!name) rowError = "Missing Player Name";
                else if (!role) rowError = "Missing Role";
                else if (!category) rowError = "Missing Category";
                else if (priceStr === '' || isNaN(basePrice) || basePrice < 0) rowError = "Invalid or Missing Base Price";
                else if (seenNames.has(name.toLowerCase())) rowError = `Duplicate Player Name: "${name}"`;

                if (rowError) {
                    errors.push({ row: rowNumber, error: rowError, name });
                } else {
                    seenNames.add(name.toLowerCase());
                    rows.push({ rowNumber, name, role, category, basePrice });
                }
            } else {
                // Teams
                const name = getColValue(rowMap, [/^team\s*name$/i, /^team$/i, /^name$/i]);
                const budgetStr = getColValue(rowMap, [/^budget$/i, /^initial\s*budget$/i]);
                const colorStr = getColValue(rowMap, [/^color$/i, /^hex$/i, /^team\s*color$/i]);
                const logoTextStr = getColValue(rowMap, [/^logo\s*text$/i, /^logo$/i, /^initials$/i]);
                const budget = Number(budgetStr);
                const color = colorStr && colorStr.trim() ? colorStr.trim() : '#3B82F6';
                const logoText = logoTextStr && logoTextStr.trim() ? logoTextStr.trim() : '';

                let rowError = null;
                if (!name) rowError = "Missing Team Name";
                else if (budgetStr === '' || isNaN(budget) || budget <= 0) rowError = "Invalid or Missing Budget";
                else if (seenNames.has(name.toLowerCase())) rowError = `Duplicate Team Name: "${name}"`;

                if (rowError) {
                    errors.push({ row: rowNumber, error: rowError, name });
                } else {
                    seenNames.add(name.toLowerCase());
                    rows.push({ rowNumber, name, budget, color, logoText });
                }
            }
        }

        setCsvModal(prev => ({
            ...prev,
            parsedRows: rows,
            validationErrors: errors,
            importSummary: null
        }));
    };

    const executeBulkImport = async () => {
        if (!csvModal.auction || csvModal.parsedRows.length === 0) return;
        setCsvModal(prev => ({ ...prev, isUploading: true }));

        const auctionId = csvModal.auction.slug || csvModal.auction._id;
        try {
            let res;
            if (csvModal.type === 'players') {
                res = await bulkImportPlayers(auctionId, csvModal.parsedRows);
            } else {
                res = await bulkImportTeams(auctionId, csvModal.parsedRows);
            }

            const data = res.data;
            setCsvModal(prev => ({
                ...prev,
                isUploading: false,
                importSummary: {
                    importedCount: data.importedCount,
                    failedCount: data.failedCount + prev.validationErrors.length,
                    errors: [...prev.validationErrors, ...(data.errors || [])]
                }
            }));
            fetchAuctions();
        } catch (err) {
            console.error("Bulk import failed:", err);
            setCsvModal(prev => ({ ...prev, isUploading: false }));
            showAlert("Import Failed", err.response?.data?.error || "Failed to process import.", "error");
        }
    };

    // --- CSV EXPORT FUNCTIONS ---
    const handleExportPlayers = async (auction) => {
        try {
            const res = await getAuctionInit(auction.slug || auction._id);
            const players = res.data.players || [];
            const teams = res.data.teams || [];
            const teamMap = {};
            teams.forEach(t => { teamMap[t._id] = t.name; });

            const headers = ["Name", "Role", "Category", "Base Price", "Sold Status", "Sold Price", "Sold To"];
            const rows = players.map(p => [
                `"${(p.name || '').replace(/"/g, '""')}"`,
                `"${(p.role || '').replace(/"/g, '""')}"`,
                `"${(p.category || '').replace(/"/g, '""')}"`,
                p.basePrice || 0,
                p.isSold ? 'Sold' : (p.isUnsold ? 'Unsold' : 'Available'),
                p.soldPrice || 0,
                `"${p.soldTo ? (teamMap[p.soldTo] || 'Unknown') : ''}"`
            ]);

            const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `players_${auction.slug || auction._id}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Export players failed:", err);
            showAlert("Error", "Failed to export players.", "error");
        }
    };

    const handleExportTeams = async (auction) => {
        try {
            const res = await getAuctionInit(auction.slug || auction._id);
            const teams = res.data.teams || [];
            const players = res.data.players || [];

            const headers = ["Team Name", "Budget", "Color", "Logo Text", "Remaining Budget", "Players Purchased"];
            const rows = teams.map(t => {
                const purchasedCount = players.filter(p => (p.soldTo?._id || p.soldTo) === t._id).length;
                const remainingBudget = Math.max(0, (t.budget || 0) - (t.spent || 0));
                return [
                    `"${(t.name || '').replace(/"/g, '""')}"`,
                    t.budget || 0,
                    `"${t.color || '#3B82F6'}"`,
                    `"${(t.logoText || '').replace(/"/g, '""')}"`,
                    remainingBudget,
                    purchasedCount
                ];
            });

            const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `teams_${auction.slug || auction._id}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Export teams failed:", err);
            showAlert("Error", "Failed to export teams.", "error");
        }
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
                    <div className="input-group">
                        <div className="toggle-group">
                            <div className="toggle-control">
                                <input
                                    type="checkbox"
                                    id="create_strict_random"
                                    className="toggle-checkbox"
                                    checked={newAuction.isStrictRandom || false}
                                    onChange={e => setNewAuction({ ...newAuction, isStrictRandom: e.target.checked })}
                                />
                                <label htmlFor="create_strict_random" className="toggle-switch"></label>
                            </div>
                            <label htmlFor="create_strict_random" className="toggle-label">
                                Strict Random Picking (Auctioneer cannot pick specific players in live queue)
                            </label>
                        </div>
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
                        <div className="input-group">
                            <div className="toggle-group">
                                <div className="toggle-control">
                                    <input
                                        type="checkbox"
                                        id="edit_strict_random"
                                        className="toggle-checkbox"
                                        checked={editingAuction.isStrictRandom || false}
                                        onChange={e => setEditingAuction({ ...editingAuction, isStrictRandom: e.target.checked })}
                                    />
                                    <label htmlFor="edit_strict_random" className="toggle-switch"></label>
                                </div>
                                <label htmlFor="edit_strict_random" className="toggle-label">
                                    Strict Random Picking (Auctioneer cannot pick specific players in live queue)
                                </label>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* --- CSV IMPORT MODAL --- */}
            {csvModal.isOpen && (
                <Modal
                    isOpen={csvModal.isOpen}
                    onClose={() => setCsvModal(prev => ({ ...prev, isOpen: false }))}
                    title={`Bulk Import ${csvModal.type === 'players' ? 'Players' : 'Teams'} — ${csvModal.auction?.name}`}
                    headerGlowIcon={FileSpreadsheet}
                    maxWidth="48rem"
                    footer={
                        csvModal.importSummary ? (
                            <Button onClick={() => setCsvModal(prev => ({ ...prev, isOpen: false }))} variant="primary">Close</Button>
                        ) : (
                            <>
                                <Button onClick={() => setCsvModal(prev => ({ ...prev, isOpen: false }))} variant="secondary">Cancel</Button>
                                <Button
                                    onClick={executeBulkImport}
                                    variant="primary"
                                    disabled={csvModal.parsedRows.length === 0 || csvModal.isUploading}
                                >
                                    {csvModal.isUploading ? 'Importing...' : `Import ${csvModal.parsedRows.length} Valid Rows`}
                                </Button>
                            </>
                        )
                    }
                >
                    <div className="csv-modal-content">
                        {/* Top Template Action Bar */}
                        <div className="csv-actions-top">
                            <div>
                                <p style={{ margin: 0, fontWeight: 'bold' }}>Need a template?</p>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {csvModal.type === 'players' ? 'Columns: Name, Role, Category, Base Price' : 'Columns: Team Name, Budget'}
                                </p>
                            </div>
                            <Button onClick={() => downloadSampleCSV(csvModal.type)} variant="secondary" style={{ fontSize: '0.85rem' }}>
                                <Download className="w-4 h-4" /> Download Sample CSV
                            </Button>
                        </div>

                        {!csvModal.importSummary && (
                            <>
                                {/* Dropzone */}
                                <label className="csv-dropzone">
                                    <Upload className="w-8 h-8 text-blue-400" style={{ margin: '0 auto var(--sp-2)' }} />
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>
                                        {csvModal.fileName ? `Selected: ${csvModal.fileName}` : 'Click or Drag CSV File Here'}
                                    </p>
                                    <p style={{ margin: 'var(--sp-1) 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Supports .csv files
                                    </p>
                                    <input type="file" accept=".csv" onChange={handleCSVFileChange} style={{ display: 'none' }} />
                                </label>

                                {/* Row Errors Box if any */}
                                {csvModal.validationErrors.length > 0 && (
                                    <div className="csv-errors-list">
                                        <p style={{ margin: '0 0 var(--sp-1)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <AlertTriangle className="w-4 h-4" /> {csvModal.validationErrors.length} Row Validation Errors (Skipped):
                                        </p>
                                        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                            {csvModal.validationErrors.map((err, idx) => (
                                                <li key={idx}>Row {err.row}: {err.error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Parsed Rows Preview Table */}
                                {csvModal.parsedRows.length > 0 && (
                                    <div>
                                        <p style={{ margin: '0 0 var(--sp-2)', fontWeight: 'bold', color: 'var(--success)' }}>
                                            ✓ Previewing {csvModal.parsedRows.length} Valid Rows Ready for Import:
                                        </p>
                                        <div className="csv-preview-table-wrapper">
                                            <table className="csv-preview-table">
                                                <thead>
                                                    {csvModal.type === 'players' ? (
                                                        <tr>
                                                            <th>Row #</th>
                                                            <th>Name</th>
                                                            <th>Role</th>
                                                            <th>Category</th>
                                                            <th>Base Price</th>
                                                        </tr>
                                                    ) : (
                                                        <tr>
                                                            <th>Row #</th>
                                                            <th>Team Name</th>
                                                            <th>Budget</th>
                                                            <th>Color</th>
                                                            <th>Logo Text</th>
                                                        </tr>
                                                    )}
                                                </thead>
                                                <tbody>
                                                    {csvModal.parsedRows.map((row, idx) => (
                                                        <tr key={idx}>
                                                            <td>{row.rowNumber}</td>
                                                            <td>{row.name}</td>
                                                            {csvModal.type === 'players' ? (
                                                                <>
                                                                    <td>{row.role}</td>
                                                                    <td>{row.category}</td>
                                                                    <td>{row.basePrice}</td>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <td>{row.budget}</td>
                                                                    <td>
                                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                                            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: row.color || '#3B82F6' }}></span>
                                                                            {row.color}
                                                                        </span>
                                                                    </td>
                                                                    <td>{row.logoText || '-'}</td>
                                                                </>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Import Summary Results View */}
                        {csvModal.importSummary && (
                            <div className="csv-summary-box">
                                <h3 style={{ margin: '0 0 var(--sp-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircle className="w-5 h-5" /> Import Results Summary
                                </h3>
                                <p style={{ margin: '0 0 var(--sp-1)', fontSize: '1rem', fontWeight: 'bold' }}>
                                    ✓ {csvModal.importSummary.importedCount} {csvModal.type === 'players' ? 'Players' : 'Teams'} Successfully Imported
                                </p>
                                {csvModal.importSummary.failedCount > 0 && (
                                    <p style={{ margin: 0, color: 'var(--danger)' }}>
                                        ✗ {csvModal.importSummary.failedCount} Failed / Skipped Rows
                                    </p>
                                )}
                            </div>
                        )}
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
                            <Zap className="w-4 h-4" /> Active ({auctions.filter(a => a.isActive !== false && a.status !== 'completed').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`nav-tab-btn ${activeTab === 'completed' ? 'nav-tab-btn-active' : ''}`}
                        >
                            <CheckCircle className="w-4 h-4" /> Completed ({auctions.filter(a => a.isActive === false || a.status === 'completed').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('archived')}
                            className={`nav-tab-btn ${activeTab === 'archived' ? 'nav-tab-btn-active' : ''}`}
                        >
                            <Archive className="w-4 h-4" /> Archived ({archivedAuctions.length})
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
                                    {activeTab !== 'archived' ? (
                                        (() => {
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
                                        })()
                                    ) : (
                                        <Badge variant="secondary"><Archive className="w-3 h-3" style={{ marginRight: 'var(--space-1.5)' }} /> Archived</Badge>
                                    )}
                                    <h2 className="super-auction-card-title">{auction.name}</h2>
                                </div>
                                <div className="super-card-badge-row">
                                    <div className="super-card-key-badge">
                                        <Key className="w-4 h-4" style={{ color: 'var(--slate-500)' }} />
                                        <span className="font-mono font-bold">{auction.accessCode}</span>
                                    </div>
                                    <div className="md-block hidden"><Layers className="w-4 h-4" /> {auction.categories?.length || 0} Cats</div>
                                    <div className="md-block hidden"><Users className="w-4 h-4" /> {auction.roles?.length || 0} Roles</div>
                                    <div className="md-block hidden"><Clock className="w-4 h-4" /> {new Date(auction.date).toLocaleDateString()}</div>
                                </div>

                                {/* CSV Actions Bar for Active / Completed Auctions */}
                                {activeTab !== 'archived' && (
                                    <div className="super-auction-csv-row">
                                        <Button onClick={() => openImportModal(auction, 'players')} variant="secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                                            <Upload className="w-3 h-3" /> + Players CSV
                                        </Button>
                                        <Button onClick={() => openImportModal(auction, 'teams')} variant="secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                                            <Upload className="w-3 h-3" /> + Teams CSV
                                        </Button>
                                        <Button onClick={() => handleExportPlayers(auction)} variant="secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                                            <Download className="w-3 h-3" /> Export Players
                                        </Button>
                                        <Button onClick={() => handleExportTeams(auction)} variant="secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                                            <Download className="w-3 h-3" /> Export Teams
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Card Main Actions */}
                            <div className="super-auction-actions">
                                {activeTab !== 'archived' ? (
                                    <>
                                        <Button onClick={() => handleNavigateAuction(auction, 'viewer')} variant="secondary" title="View Public Arena">
                                            <Eye className="w-4 h-4" /> Viewer
                                        </Button>
                                        <Button onClick={() => handleNavigateAuction(auction, 'setup')} variant="secondary" title="Host Setup Dashboard">
                                            <Settings className="w-4 h-4" /> Setup
                                        </Button>
                                        <Button onClick={() => handleNavigateAuction(auction, 'live')} variant="primary" title="Auctioneer Bidding Console">
                                            <Gavel className="w-4 h-4" /> Auctioneer
                                        </Button>
                                        <Button onClick={() => setEditingAuction(auction)} variant="secondary" title="Edit Config">
                                            <Edit2 className="w-4 h-4" /> Edit
                                        </Button>
                                        <Button onClick={() => handleArchive(auction)} variant="secondary" title="Archive Tournament">
                                            <Archive className="w-4 h-4" /> Archive
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button onClick={() => handleRestore(auction)} variant="primary"><RotateCcw className="w-4 h-4" /> Restore</Button>
                                        <Button onClick={() => handlePermanentDelete(auction._id)} variant="danger"><Trash2 className="w-4 h-4" /> Delete</Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    {filteredAuctions.length === 0 && (
                        <div className="empty-table-state super-empty-border">
                            {searchQuery
                                ? 'No matching tournaments found.'
                                : activeTab === 'active'
                                    ? 'No active tournaments found. Create one above.'
                                    : activeTab === 'completed'
                                        ? 'No completed tournaments found.'
                                        : 'No archived tournaments found.'}
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
