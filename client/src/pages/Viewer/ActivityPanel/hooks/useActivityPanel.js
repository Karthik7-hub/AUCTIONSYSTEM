import { useState, useMemo } from 'react';

export default function useActivityPanel(players) {
    const [feedSort, setFeedSort] = useState('recent');
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [historyPlayer, setHistoryPlayer] = useState(null);

    const sortedFeedPlayers = useMemo(() => {
        const soldPlayers = players.filter(p => p.isSold);

        const getSoldTime = (p) => {
            if (p.soldAt) return new Date(p.soldAt).getTime();
            if (p.updatedAt) return new Date(p.updatedAt).getTime();
            return 0;
        };

        if (feedSort === 'recent') {
            return [...soldPlayers].sort((a, b) => getSoldTime(b) - getSoldTime(a));
        }
        if (feedSort === 'oldest') {
            return [...soldPlayers].sort((a, b) => getSoldTime(a) - getSoldTime(b));
        }
        if (feedSort === 'price-desc') {
            return [...soldPlayers].sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0));
        }
        if (feedSort === 'price-asc') {
            return [...soldPlayers].sort((a, b) => (a.soldPrice || 0) - (b.soldPrice || 0));
        }
        if (feedSort === 'name-asc') {
            return [...soldPlayers].sort((a, b) => a.name.localeCompare(b.name));
        }
        return soldPlayers;
    }, [players, feedSort]);

    return {
        feedSort,
        setFeedSort,
        isSortMenuOpen,
        setIsSortMenuOpen,
        historyPlayer,
        setHistoryPlayer,
        sortedFeedPlayers
    };
}
