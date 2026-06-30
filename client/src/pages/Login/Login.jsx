import React, { useState } from 'react';
import { ArrowLeft, Lock, Trophy, Zap } from 'lucide-react';
import { verifyHostPassword } from '@services/auth.service';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';

export default function Login({ auctionId, setView }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await verifyHostPassword(auctionId, password);
            if (res.data.success) {
                localStorage.setItem(`admin_auth_${auctionId}`, 'true');
                setView('admin-setup');
            }
        } catch (err) { setError('Invalid Password'); }
        finally { setIsLoading(false); }
    };

    return (
        <div className="super-login-wrapper theme-dark">
            <div className="super-login-card">
                <div className="super-login-border-top"></div>
                <div className="text-center login-margin-bottom">
                    <div className="super-login-logo login-logo-container">
                        <Trophy className="w-8 h-8" />
                    </div>
                    <h1 className="super-login-title">Host Access</h1>
                    <p className="super-login-subtitle">Enter password to manage tournament</p>
                </div>
                <form onSubmit={handleLogin} className="form-layout">
                    <Input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Host Password"
                        icon={Lock}
                        required
                    />
                    {error && <p className="form-error-msg">{error}</p>}
                    <div className="login-btn-row">
                        <Button type="button" onClick={() => setView('viewer')} variant="secondary">
                            <ArrowLeft className="w-5 h-5" /> Back
                        </Button>
                        <Button type="submit" disabled={isLoading} variant="primary">
                            <Zap className="w-5 h-5" /> {isLoading ? 'Verifying...' : 'Access Console'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
