import React, { useState } from 'react';
import { Lock, Tv } from 'lucide-react';

const ADMIN_PASSWORD = "admin123";

export default function Login({ setView }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleAdminLogin = () => {
        if (password === ADMIN_PASSWORD) {
            setView('admin-setup');
        } else {
            setError('Incorrect password');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
                <h1 className="text-4xl font-bold text-center mb-2 text-blue-500">SPL Auction</h1>
                <p className="text-center text-slate-400 mb-8">Tournament Management System</p>

                {/* Admin Login */}
                <div className="mb-8 pb-8 border-b border-slate-700">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Admin Login</label>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            onClick={handleAdminLogin}
                            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold flex items-center transition-colors"
                        >
                            <Lock className="w-4 h-4 mr-2" /> Go
                        </button>
                    </div>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </div>

                {/* Viewer Button */}
                <button
                    onClick={() => setView('viewer')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 py-4 rounded-xl text-xl font-bold flex items-center justify-center transition-transform hover:scale-105 shadow-lg"
                >
                    <Tv className="w-6 h-6 mr-3" />
                    Join as Audience
                </button>
            </div>
        </div>
    );
}