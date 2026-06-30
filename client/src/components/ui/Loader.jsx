import React from 'react';

export default function Loader({ message = 'Loading...', fullScreen = false }) {
    if (fullScreen) {
        return (
            <div className="connecting-wrapper">
                <div className="spinner"></div>
                <div>{message}</div>
            </div>
        );
    }

    return (
        <div className="flex-center animate-pulse" style={{ padding: 'var(--space-8)', color: 'var(--text-muted-dark)', fontWeight: 'bold' }}>
            <div className="spinner" style={{ marginRight: 'var(--space-2)', width: '1.5rem', height: '1.5rem', borderWidth: '2px' }}></div>
            {message}
        </div>
    );
}
