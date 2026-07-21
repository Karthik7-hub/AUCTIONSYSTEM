import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Zap } from 'lucide-react';
import { verifySuperAdminPassword, setSuperAdminTokens } from '@services/auth.service';
import Button from '@shared/components/Button';
import Input from '@shared/components/Input';
import './Login.css';

export default function Login() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await verifySuperAdminPassword(password);
            if (res.data.success) {
                // Store JWT tokens — NOT a boolean flag
                setSuperAdminTokens(res.data.accessToken, res.data.refreshToken);
                navigate('/super-admin/dashboard');
            }
        } catch (err) {
            setError('Access Denied');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="super-login-wrapper theme-dark">
            <div className="super-login-card">
                <div className="text-center login-margin-bottom">
                    <h1 className="super-login-title">Super Admin</h1>
                    <p className="super-login-subtitle">Platform Control Center</p>
                </div>

                <form onSubmit={handleLogin} className="form-layout">
                    <Input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Master Key"
                        icon={Lock}
                        required
                    />
                    {error && <p className="form-error-msg">{error}</p>}
                    <Button type="submit" variant="danger" className="btn-w-full" disabled={isLoading}>
                        <Zap className="w-5 h-5" /> {isLoading ? 'Verifying...' : 'Access Dashboard'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
