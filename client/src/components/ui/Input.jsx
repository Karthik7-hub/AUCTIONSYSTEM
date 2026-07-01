import React from 'react';

export default function Input({ type = 'text', value, onChange, placeholder, className = '', style, icon: Icon, required, min, label, ...props }) {
    return (
        <div className="input-group" style={style}>
            {label && <label className="input-label">{label}</label>}
            <div className={Icon ? 'search-wrapper' : ''} style={Icon ? { width: '100%' } : null}>
                {Icon && <Icon className="search-icon" />}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    min={min}
                    className={`input-field ${className}`}
                    style={Icon ? { paddingLeft: 'var(--space-12)' } : null}
                    {...props}
                />
            </div>
        </div>
    );
}
