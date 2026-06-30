import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Zap } from 'lucide-react';
import { verifySuperAdminPassword } from '@services/auth.service';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';

export default function SuperAdminLogin() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await verifySuperAdminPassword(password);
            if (res.data.success) {
                localStorage.setItem('super_admin_token', 'true');
                navigate('/super-admin/dashboard');
            }
        } catch (err) {
            setError('Access Denied');
        }
    };

    return (
        <div className="super-login-wrapper theme-dark">
            <div className="super-login-card">
                <div className="super-login-border-top"></div>

                <div className="text-center login-margin-bottom">
                    <div className="super-login-logo super-logo-text-red">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
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
                    <Button type="submit" variant="danger" className="btn-w-full" style={{ background: 'linear-gradient(to right, var(--red-600), var(--orange-600))' }}>
                        <Zap className="w-5 h-5" /> Access Dashboard
                    </Button>
                </form>
            </div>
        </div>
    );
}
