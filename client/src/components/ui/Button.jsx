import React from 'react';

export default function Button({ children, variant = 'primary', type = 'button', onClick, className = '', disabled, style, title }) {
    const variantClass = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        success: 'btn-success',
        danger: 'btn-danger',
        disabled: 'btn-disabled'
    }[disabled ? 'disabled' : variant] || 'btn-primary';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`btn ${variantClass} ${className}`}
            style={style}
            title={title}
        >
            {children}
        </button>
    );
}
