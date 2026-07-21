import React, { lazy, Suspense } from 'react';
import Loader from '@shared/components/Loader';

const ViewerScreen = lazy(() => import('./ViewerScreen'));

export default function ViewerScreenPage(props) {
    return (
        <Suspense fallback={<Loader message="Entering Tournament Arena..." fullScreen />}>
            <ViewerScreen {...props} />
        </Suspense>
    );
}
