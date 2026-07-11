import React from 'react';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger' // 'danger', 'info', 'success', 'warning'
}) {
    const getTheme = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: AlertTriangle,
                    colorClass: 'text-red-500',
                    btnColor: 'danger',
                    glowColor: 'rgba(239, 68, 68, 0.15)'
                };
            case 'warning':
                return {
                    icon: AlertTriangle,
                    colorClass: 'text-yellow-500',
                    btnColor: 'warning',
                    glowColor: 'rgba(234, 179, 8, 0.15)'
                };
            case 'success':
                return {
                    icon: CheckCircle2,
                    colorClass: 'text-green-500',
                    btnColor: 'success',
                    glowColor: 'rgba(34, 197, 94, 0.15)'
                };
            default:
                return {
                    icon: Info,
                    colorClass: 'text-blue-500',
                    btnColor: 'primary',
                    glowColor: 'rgba(59, 130, 246, 0.15)'
                };
        }
    };

    const theme = getTheme();
    const Icon = theme.icon;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                    <Icon className={`w-5 h-5 ${theme.colorClass}`} />
                    <span style={{ fontSize: 'var(--text-sub)', fontWeight: 'var(--weight-bold)' }}>{title}</span>
                </div>
            }
            maxWidth="28rem"
        >
            <div style={{ padding: 'var(--sp-2) 0 var(--sp-4) 0' }}>
                <p style={{ fontSize: 'var(--text-secondary)', color: 'var(--text-secondary-dark)', lineHeight: 1.5 }}>
                    {message}
                </p>
                
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: 'var(--sp-3)', 
                    marginTop: 'var(--sp-6)', 
                    borderTop: '1px solid var(--border)', 
                    paddingTop: 'var(--sp-4)' 
                }}>
                    <Button 
                        variant="secondary" 
                        onClick={onClose}
                        size="md"
                    >
                        {cancelText}
                    </Button>
                    <Button 
                        variant={theme.btnColor} 
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        size="md"
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
