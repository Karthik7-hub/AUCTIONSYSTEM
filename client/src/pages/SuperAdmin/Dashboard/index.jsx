import React, { lazy, Suspense } from 'react';
import Loader from '@shared/components/Loader';

const Dashboard = lazy(() => import('./Dashboard'));

export default function SuperAdminDashboard() {
    return (
        <Suspense fallback={<Loader message="Loading Administration Console..." fullScreen />}>
            <Dashboard />
        </Suspense>
    );
}
