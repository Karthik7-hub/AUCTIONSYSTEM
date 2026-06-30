import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, footer, maxWidth = '36rem', headerGlowIcon: GlowIcon, bannerColor }) {
    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); }
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-container" style={{ '--modal-max-width': maxWidth }}>
                
                {bannerColor ? (
                    <div className="modal-team-banner" style={{ backgroundColor: bannerColor }}>
                        <button onClick={onClose} className="modal-close-btn" style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', color: '#ffffff' }} aria-label="Close">
                            <X className="w-5 h-5" />
                        </button>
                        <div className="modal-banner-header-content">
                            {title}
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
}
