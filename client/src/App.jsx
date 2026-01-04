import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AuctionLayout from './components/AuctionLayout';
import SuperAdminLogin from './components/SuperAdmin/SuperAdminLogin'; // Import
import SuperAdminDashboard from './components/SuperAdmin/SuperAdminDashboard'; // Import

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
            </Routes>
        </Router>
    );
}

export default App;