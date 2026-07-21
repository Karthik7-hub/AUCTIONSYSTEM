import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Zap } from 'lucide-react';
import { verifyHostPassword, setTokens } from '@services/auth.service';
import Button from '@shared/components/Button';
import Input from '@shared/components/Input';
import './Login.css';

export default function Login({ auctionId, isAuthenticated, setIsAuthenticated, config }) {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        if (isAuthenticated) {
            navigate(`/auction/${config?.slug || auctionId}/setup`, { replace: true });
        }
    }, [isAuthenticated, auctionId, config, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await verifyHostPassword(auctionId, password);
            if (res.data.success) {
                // Store JWT tokens under both slug and MongoDB ObjectId
                setTokens(auctionId, res.data.accessToken, res.data.refreshToken);
                if (config?._id && config._id !== auctionId) {
                    setTokens(config._id, res.data.accessToken, res.data.refreshToken);
                }
                // Set global context for http interceptor
                window.__auctionId = auctionId;
                setIsAuthenticated(true);
                navigate(`/auction/${config?.slug || auctionId}/setup`);
            }
        } catch (err) {
            setError('Invalid Password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="super-login-wrapper theme-light">
            <div className="super-login-card">
                <div className="text-center login-margin-bottom">
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
                        <Button type="button" onClick={() => navigate(`/auction/${config?.slug || auctionId}`)} variant="secondary">
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
