import React, { useState, useEffect } from 'react';
import { toastService, ToastMessage } from '../services/toastService';

/**
 * Toast Container Component
 * Renders toast notifications from the global toastService
 * Place this once in your app root (App.tsx or main layout)
 */

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Map<string, ToastMessage>>(new Map());

  useEffect(() => {
    // Subscribe to toast service notifications
    const unsubscribe = toastService.subscribe((toast: ToastMessage) => {
      setToasts(prev => new Map(prev).set(toast.id, toast));
    });

    return unsubscribe;
  }, []);

  const dismiss = (id: string) => {
    toastService.dismiss(id);
    setToasts(prev => {
      const updated = new Map(prev);
      updated.delete(id);
      return updated;
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/30',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-800 dark:text-green-300',
          icon: 'text-green-500',
          close: 'text-green-400 hover:text-green-600 dark:text-green-500 dark:hover:text-green-300',
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/30',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-300',
          icon: 'text-red-500',
          close: 'text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/30',
          border: 'border-amber-200 dark:border-amber-800',
          text: 'text-amber-800 dark:text-amber-300',
          icon: 'text-amber-500',
          close: 'text-amber-400 hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-300',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/30',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-300',
          icon: 'text-blue-500',
          close: 'text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300',
        };
    }
  };

  if (toasts.size === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm space-y-2">
      {Array.from(toasts.values()).map(toast => {
        const colors = getColors(toast.type);
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-lg border ${colors.bg} ${colors.border} ${colors.text} shadow-lg animate-in fade-in slide-in-from-right-4 transition-all`}
            role="alert"
            aria-live="assertive"
          >
            {/* Icon */}
            <div className={`flex-shrink-0 ${colors.icon} mt-0.5`}>
              {getIcon(toast.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug">{toast.message}</p>
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action?.onClick();
                    dismiss(toast.id);
                  }}
                  className="text-xs font-semibold mt-2 underline hover:opacity-75 transition-opacity"
                >
                  {toast.action.label}
                </button>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => dismiss(toast.id)}
              className={`flex-shrink-0 ${colors.close} transition-colors p-1`}
              aria-label="Close notification"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
