// Application router — all route definitions live here.
// Pages are lazy-loaded by route so each becomes its own split chunk.
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '@pages/Landing';
import SuperAdminLogin from '@pages/SuperAdmin/Login';
import SuperAdminDashboard from '@pages/SuperAdmin/Dashboard';
import AuctionLayout from '@layouts/AuctionLayout';

export default function AppRouter() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />

            {/* Super Admin */}
            <Route path="/super-admin" element={<SuperAdminLogin />} />
            <Route
                path="/super-admin/dashboard"
                element={<SuperAdminDashboard />}
            />

            {/* Tournament Room (all nested routes handled inside AuctionLayout) */}
            <Route path="/auction/:auctionId/*" element={<AuctionLayout />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
