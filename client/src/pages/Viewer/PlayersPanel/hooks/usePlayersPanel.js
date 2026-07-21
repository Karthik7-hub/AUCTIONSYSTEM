import { useState, useMemo } from 'react';

export default function usePlayersPanel(players, config) {
    const [viewStatus, setViewStatus] = useState('OPEN');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const categoriesList = useMemo(() => {
        if (config?.categories?.length) return ['All', ...config.categories];
        if (players.length === 0) return ['All'];
        const cats = new Set(players.map(p => p.category || 'Uncategorized'));
        return ['All', ...cats];
    }, [players, config]);

    const filteredPlayers = useMemo(() => {
        return players
            .filter(p => {
                if (viewStatus === 'OPEN') return !p.isSold && !p.isUnsold;
                if (viewStatus === 'SOLD') return p.isSold;
                if (viewStatus === 'UNSOLD') return p.isUnsold;
                return true;
            })
            .filter(p => selectedCategory === 'All' || p.category === selectedCategory);
    }, [players, viewStatus, selectedCategory]);

    return {
        viewStatus,
        setViewStatus,
        selectedCategory,
        setSelectedCategory,
        categoriesList,
        filteredPlayers
    };
}
