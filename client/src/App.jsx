import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AuctionLayout from './components/AuctionLayout';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auction/:auctionId/*" element={<AuctionLayout />} />
            </Routes>
        </Router>
    );
}
export default App;