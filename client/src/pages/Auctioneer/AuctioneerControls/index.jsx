import React, { lazy, Suspense } from 'react';
import Loader from '@shared/components/Loader';

const AuctioneerControls = lazy(() => import('./AuctioneerControls'));

export default function AuctioneerControlsPage(props) {
    return (
        <Suspense fallback={<Loader message="Initializing Auctioneer Room..." fullScreen />}>
            <AuctioneerControls {...props} />
        </Suspense>
    );
}
