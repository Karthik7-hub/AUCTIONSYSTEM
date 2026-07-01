import React from 'react';

export default function Button({ children, variant = 'primary', type = 'button', onClick, className = '', disabled, style, title, loading }) {
    const isCurrentlyDisabled = disabled || loading;

    const variantClass = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        success: 'btn-success',
        danger: 'btn-danger',
        disabled: 'btn-disabled'
    }[isCurrentlyDisabled ? 'disabled' : variant] || 'btn-primary';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isCurrentlyDisabled}
            className={`btn ${variantClass} ${className}`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                ...style
            }}
            title={title}
        >
            {loading && (
                <span style={{
                    display: 'inline-block',
                    width: '1em',
                    height: '1em',
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                    flexShrink: 0
                }}></span>
            )}
            {children}
        </button>
    );
}
