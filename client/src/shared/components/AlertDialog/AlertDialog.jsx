import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import Modal from '../Modal';
import Button from '../Button';
import './AlertDialog.css';

export default function AlertDialog({
    isOpen,
    onClose,
    title = 'Notification',
    message = '',
    buttonText = 'Okay',
    type = 'info', // 'info', 'warning', 'success', 'error'
    theme
}) {
    const getThemeConfig = () => {
        switch (type) {
            case 'error':
                return {
                    icon: AlertCircle,
                    colorClass: 'text-red-500',
                    btnColor: 'danger'
                };
            case 'warning':
                return {
                    icon: AlertCircle,
                    colorClass: 'text-yellow-500',
                    btnColor: 'warning'
                };
            case 'success':
                return {
                    icon: CheckCircle2,
                    colorClass: 'text-green-500',
                    btnColor: 'success'
                };
            default:
                return {
                    icon: Info,
                    colorClass: 'text-blue-500',
                    btnColor: 'primary'
                };
        }
    };

    const dialogTheme = getThemeConfig();
    const Icon = dialogTheme.icon;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            theme={theme}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                    <Icon className={`w-5 h-5 ${dialogTheme.colorClass}`} />
                    <span style={{ fontSize: 'var(--text-sub)', fontWeight: 'var(--weight-bold)' }}>{title}</span>
                </div>
            }
            maxWidth="26rem"
        >
            <div style={{ padding: 'var(--sp-2) 0 var(--sp-4) 0' }}>
                <p style={{ fontSize: 'var(--text-secondary)', color: 'var(--text-secondary-dark)', lineHeight: 1.5 }}>
                    {message}
                </p>
                
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    marginTop: 'var(--sp-6)', 
                    borderTop: '1px solid var(--border)', 
                    paddingTop: 'var(--sp-4)' 
                }}>
                    <Button 
                        variant={dialogTheme.btnColor} 
                        onClick={onClose}
                        size="md"
                        style={{ minWidth: '80px' }}
                    >
                        {buttonText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
