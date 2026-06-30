import React, { useState } from 'react';
import axios from 'axios';
import { ArrowLeft, Lock, Trophy, Zap } from 'lucide-react';

export default function Login({ auctionId, setView, apiUrl }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await axios.post(`${apiUrl}/api/verify-admin`, { auctionId, password });
            if (res.data.success) {
                localStorage.setItem(`admin_auth_${auctionId}`, 'true');
                setView('admin-setup');
            }
        } catch (err) { setError('Invalid Password'); }
        finally { setIsLoading(false); }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
                <div className="text-center mb-8">
                    <Trophy className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white">Host Access</h1>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 p-3 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500" placeholder="Enter Host Password" />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}
                    <button disabled={isLoading} className="w-full bg-blue-600 py-3 rounded-xl text-white font-bold hover:bg-blue-700 transition-all flex justify-center gap-2">
                        <Zap className="w-5 h-5" /> {isLoading ? "Verifying..." : "Login"}
                    </button>
                </form>
                <button onClick={() => setView('viewer')} className="mt-6 w-full text-slate-400 text-sm flex items-center justify-center gap-2 hover:text-white"><ArrowLeft className="w-4 h-4" /> Back to Viewer</button>
            </div>
        </div>
    );
}