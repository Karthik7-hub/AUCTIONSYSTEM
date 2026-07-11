import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '@pages/Landing/LandingPage';
import AuctionLayout from '@layouts/AuctionLayout';
import SuperAdminLogin from '@pages/SuperAdmin/SuperAdminLogin';
import SuperAdminDashboard from '@pages/SuperAdmin/SuperAdminDashboard';

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Landing */}
                <Route path="/" element={<LandingPage />} />

                {/* Super Admin Routes */}
                <Route path="/super-admin" element={<SuperAdminLogin />} />
                <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />

                {/* Specific Tournament Room */}
                <Route path="/auction/:auctionId/*" element={<AuctionLayout />} />

                {/* Catch-all: redirect any unmatched path (e.g. /auction, /random) to landing */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;