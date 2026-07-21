import React, { lazy, Suspense } from 'react';
import Loader from '@shared/components/Loader';

const SetupDashboard = lazy(() => import('./SetupDashboard'));

export default function SetupDashboardPage(props) {
    return (
        <Suspense fallback={<Loader message="Opening Tournament Dashboard..." fullScreen />}>
            <SetupDashboard {...props} />
        </Suspense>
    );
}
