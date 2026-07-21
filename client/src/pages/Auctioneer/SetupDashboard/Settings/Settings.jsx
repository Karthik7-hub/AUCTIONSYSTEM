import React, { useState } from 'react';
import { Eye, EyeOff, LogOut } from 'lucide-react';
import Input from '@shared/components/Input';
import Button from '@shared/components/Button';
import CustomSelect from '@shared/components/Select/CustomSelect';
import './Settings.css';

export default function Settings({
    auctionName,
    auctionCode,
    roles,
    categories,
    theme,
    setTheme,
    onLogout
}) {
    const [showAccessCode, setShowAccessCode] = useState(false);

    return (
        <div className="animate-fade-in setup-workspace settings-setup">
            <div className="workspace-column settings-setup__col">
                <div className="workspace-card settings-setup__card">
                    <h3 className="settings-setup__title">Tournament Settings</h3>

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

                        <div className="input-group">
                            <label className="input-label">Access Code (Read-Only)</label>
                            <div className="settings-setup__access-wrapper">
                                <input
                                    type={showAccessCode ? 'text' : 'password'}
                                    value={auctionCode}
                                    readOnly
                                    className="input-field font-mono settings-setup__access-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowAccessCode(!showAccessCode)}
                                    className="settings-setup__toggle-btn"
                                    title={showAccessCode ? 'Hide access code' : 'Show access code'}
                                >
                                    {showAccessCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Roles Configured ({roles.length})</label>
                            <div className="filters-strip settings-setup__badge-strip">
                                {roles.map(r => <span key={r} className="badge settings-setup__badge">{r}</span>)}
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Set Categories Configured ({categories.length})</label>
                            <div className="filters-strip settings-setup__badge-strip">
                                {categories.map(c => <span key={c} className="badge settings-setup__badge">{c}</span>)}
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
