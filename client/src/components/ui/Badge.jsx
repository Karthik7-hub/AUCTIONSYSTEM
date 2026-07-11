import React from 'react';

function Badge({ children, variant = 'default', className = '', style, onClick, title }) {
    const variantClass = {
        default: 'badge',
        success: 'badge badge-success',
        danger: 'badge badge-danger',
        warning: 'badge badge-warning',
        info: 'badge badge-info'
    }[variant] || 'badge';

    return (
        <span
            className={`${variantClass} ${className}`}
            style={style}
            onClick={onClick}
            title={title}
        >
            {children}
        </span>
    );
}

export default React.memo(Badge);
