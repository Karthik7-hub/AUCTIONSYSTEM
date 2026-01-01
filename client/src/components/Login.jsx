import React, { useState } from 'react';
import { ArrowLeft, Lock, Trophy, Zap } from 'lucide-react';

export default function Login({ setView }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        // --- AUTH LOGIC HERE ---
        // Simple example check. Replace with your actual auth logic.
        if (password === 'admin123') {
            setView('admin-setup');
        } else {
            setError('Invalid Access Code');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">

            {/* Main Card */}
            <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl p-8 md:p-10 relative overflow-hidden">

                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10"></div>

                {/* Content */}
                <div className="relative z-10">

                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg mb-6">
                            <Trophy className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Admin Access</h1>
                        <p className="text-slate-400 text-sm">Enter security credentials to manage the auction</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Access Code</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-lg"
                                    placeholder="••••••••"
                                    autoFocus
                                />
                            </div>
                            {error && <p className="text-red-500 text-xs mt-2 ml-1 font-bold animate-pulse">{error}</p>}
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"
                        >
                            <Zap className="w-5 h-5 fill-current" /> Initialize Console
                        </button>
                    </form>

                    {/* Back to Home Button */}
                    <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
                        <button
                            onClick={() => setView('viewer')}
                            className="inline-flex items-center text-slate-400 hover:text-white transition-colors text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Viewer Screen
                        </button>
                    </div>

                </div>
            </div>

            <p className="text-slate-600 text-xs mt-8 font-mono">SPL Auction System v2.0</p>
        </div>
    );
}