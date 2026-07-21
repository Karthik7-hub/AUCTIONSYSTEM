import { useMemo } from 'react';

export default function useTeamsPanel(teams, players, squadMap) {
    const calculatedTeams = useMemo(() => {
        return teams.map(team => {
            const squad = squadMap.get(team._id) || [];
            const spent = squad.reduce((total, p) => total + (p.soldPrice || 0), 0);
            const remaining = team.budget - spent;
            return {
                ...team,
                squad,
                spent,
                remaining
            };
        });
    }, [teams, squadMap]);

    return {
        calculatedTeams
    };
}
