import React, { useState, useEffect } from 'react';
import { getAuctionResults } from '@domains/auction/api/auction.service';

import HeroSection from './components/Hero/HeroSection';
import AchievementsGrid from './components/Achievements/AchievementsGrid';
import TopPurchases from './components/Purchases/TopPurchases';
import TeamPerformanceTable from './components/Teams/TeamPerformanceTable';
import SummaryTiles from './components/Summary/SummaryTiles';
import RoleBreakdown from './components/Analytics/RoleBreakdown';
import AuctionRecords from './components/Records/AuctionRecords';
import AuctionTimeline from './components/Timeline/AuctionTimeline';
import ResultsSkeleton from './components/Skeletons/ResultsSkeleton';
import PrintableReport from './components/Export/PrintableReport';

import './ResultsPanel.css';

export default function ResultsPanel({ auctionId, teams = [], players = [], squadMap, teamMap }) {
    const [loading, setLoading] = useState(true);
    const [resultsData, setResultsData] = useState(null);

    useEffect(() => {
        if (!auctionId) return;

        setLoading(true);
        getAuctionResults(auctionId)
            .then(res => {
                setResultsData(res.data);
            })
            .catch(err => {
                console.error('Error loading auction results API, using fallback:', err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [auctionId]);

    if (loading && !resultsData) {
        return <ResultsSkeleton />;
    }

    const heroData = resultsData?.hero;
    const highlightsData = resultsData?.highlights;
    const topPurchasesData = resultsData?.topPurchases;
    const teamPerfData = resultsData?.teamPerformance;
    const summaryData = resultsData?.summary;
    const roleBreakdownData = resultsData?.roleBreakdown;
    const recordsData = resultsData?.records;
    const timelineData = resultsData?.timeline;

    const handlePrintTeam = () => {
        window.print();
    };

    return (
        <div className="results-container theme-dark">
            {/* Priority 1: Hero Celebration Section */}
            <HeroSection hero={heroData} />

            {/* Priority 2: Differentiated Achievement Highlights Grid */}
            <AchievementsGrid highlights={highlightsData} />

            {/* Priority 3: Top Purchases Showcase */}
            <TopPurchases topPurchases={topPurchasesData} teamMap={teamMap} />

            {/* Priority 4: Team Performance & Squad Breakdown */}
            <TeamPerformanceTable
                teams={teamPerfData}
                auctionId={auctionId}
                onPrintTeam={handlePrintTeam}
                squadMap={squadMap}
            />

            {/* Priority 5: Auction Summary 2x2 Metric Tiles */}
            <SummaryTiles summary={summaryData} />

            {/* Priority 6: Role Distribution & Analytics */}
            <RoleBreakdown roleBreakdown={roleBreakdownData} />

            {/* Priority 7: Tournament Records */}
            <AuctionRecords records={recordsData} />

            {/* Priority 8: Auction Timeline & Milestones */}
            <AuctionTimeline timeline={timelineData} />

            {/* Hidden Printable Report — only visible during window.print() */}
            <PrintableReport auctionId={auctionId} />
        </div>
    );
}
