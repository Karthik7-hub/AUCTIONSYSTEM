import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Lock, Zap } from 'lucide-react';

const API_URL = 'https://spl-auctionsystem-backend.onrender.com';

export default function SuperAdminLogin() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/api/super-admin/login`, { password });
            if (res.data.success) {
                // Set a global super admin token
                localStorage.setItem('super_admin_token', 'true');
                navigate('/super-admin/dashboard');
            }
        } catch (err) {
            setError('Access Denied');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
            <div className="w-full max-w-md bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>

                <div className="text-center mb-8">
                    <div className="bg-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
                        <ShieldCheck className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black">Super Admin</h1>
                    <p className="text-slate-500 text-sm">Platform Control Center</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-12 p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-red-500 transition-colors"
                            placeholder="Master Key"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}
                    <button className="w-full bg-gradient-to-r from-red-600 to-orange-600 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-red-500/20 transition-all active:scale-95 flex justify-center gap-2">
                        <Zap className="w-5 h-5" /> Access Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
}