import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './CustomSelect.css';

export default function CustomSelect({
    label,
    options = [],
    value,
    onChange,
    placeholder = 'Select option...',
    className = ''
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Format options if passed as strings or objects { label, value }
    const formattedOptions = options.map(opt => 
        typeof opt === 'object' ? opt : { label: opt, value: opt }
    );

    const selectedOption = formattedOptions.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`custom-select-group ${className}`} ref={containerRef}>
            {label && <label className="custom-select-label">{label}</label>}
            <div className="custom-select-rel">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`custom-select-btn ${isOpen ? 'custom-select-btn--open' : ''}`}
                >
                    <span className="custom-select-val">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown className={`custom-select-chevron ${isOpen ? 'custom-select-chevron--rotate' : ''}`} />
                </button>

                {isOpen && (
                    <div className="custom-select-menu">
                        {formattedOptions.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`custom-select-item ${opt.value === value ? 'custom-select-item--active' : ''}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
