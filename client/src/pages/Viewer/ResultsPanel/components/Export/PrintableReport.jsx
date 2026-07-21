import React, { useState, useEffect } from 'react';
import { getAuctionPDFData } from '@domains/auction/api/auction.service';
import './PrintableReport.css';

const getContrastColor = (hexColor) => {
    if (!hexColor || hexColor.charAt(0) !== '#') return '#ffffff';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

const getTeamInitials = (name, logoText) => {
    if (logoText && logoText.trim()) return logoText.trim();
    if (!name) return '';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return words.map(w => w[0]).join('').toUpperCase().slice(0, 3);
};

export default function PrintableReport({ auctionId, pdfData: propPdfData }) {
    const [pdfData, setPdfData] = useState(propPdfData || null);

    useEffect(() => {
        if (propPdfData) {
            setPdfData(propPdfData);
            return;
        }
        if (!auctionId) return;

        getAuctionPDFData(auctionId)
            .then(res => {
                setPdfData(res.data);
            })
            .catch(err => {
                console.error('Error fetching PDF data:', err);
            });
    }, [auctionId, propPdfData]);

    const teams = pdfData?.teams || [];

    if (!teams.length) return null;

    return (
        <div id="printable-pdf-document" className="printable-report">
            {teams.map((team, tIdx) => (
                <div key={team._id || tIdx} className="pdf-team-block">
                    {/* Team Header */}
                    <div className="pdf-team-header">
                        <div
                            className="pdf-team-badge"
                            style={{
                                backgroundColor: team.color || '#3B82F6',
                                color: getContrastColor(team.color)
                            }}
                        >
                            {getTeamInitials(team.name, team.logoText)}
                        </div>
                        <div className="pdf-team-info">
                            <div className="pdf-team-name">{team.name}</div>
                            <div className="pdf-team-meta">
                                {team.players?.length || 0} Players &nbsp;•&nbsp; ₹{team.spent}L Spent &nbsp;•&nbsp; ₹{team.remaining}L Rem
                            </div>
                        </div>
                    </div>

                    {/* Players Table (In Order of Purchase) */}
                    {team.players && team.players.length > 0 ? (
                        <table className="pdf-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Player</th>
                                    <th>Role</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {team.players.map((p, idx) => (
                                    <tr key={p._id || idx}>
                                        <td>#{idx + 1}</td>
                                        <td className="pdf-player-name">{p.name}</td>
                                        <td>{p.role}</td>
                                        <td className="pdf-price">₹{p.soldPrice}L</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="pdf-empty">No players.</p>
                    )}
                </div>
            ))}
        </div>
    );
}
