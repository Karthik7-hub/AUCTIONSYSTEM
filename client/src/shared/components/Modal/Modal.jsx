import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './Modal.css';

export default function Modal({ isOpen, onClose, title, children, footer, maxWidth = '36rem', headerGlowIcon: GlowIcon, bannerColor, theme, className }) {
    useEffect(() => {
        if (!isOpen) return;
        
        // Prevent background scrolling
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); }
        window.addEventListener('keydown', handleEsc);
        
        return () => {
            document.body.style.overflow = originalStyle;
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const currentTheme = theme || 'light';

    const modalContent = (
        <div className={`modal-overlay theme-${currentTheme}`} role="dialog" aria-modal="true" onClick={onClose}>
            <div 
                className={`modal-container ${className || ''}`} 
                style={{ '--modal-max-width': maxWidth }}
                onClick={(e) => e.stopPropagation()}
            >
                {bannerColor ? (
                    <div className="modal-team-banner" style={{ borderBottom: '1px solid var(--border)', padding: 'var(--sp-4) var(--sp-6)' }}>
                        <div className="modal-banner-header-content" style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="modal-banner-title-area" style={{ flex: 1 }}>
                                {title}
                            </div>
                            <button 
                                onClick={onClose} 
                                className="modal-close-btn" 
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="modal-header">
                        <h2 className="modal-header-title">
                            {GlowIcon && <GlowIcon className="w-5 h-5 text-blue-500" />}
                            {title}
                        </h2>
                        <button onClick={onClose} className="modal-close-btn" aria-label="Close">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                <div className="modal-body">
                    {children}
                </div>

                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
