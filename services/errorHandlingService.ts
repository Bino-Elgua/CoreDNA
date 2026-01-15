/**
 * Error Handling Service
 * Provides consistent error handling across the app
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
    code: string;
    message: string;
    severity: ErrorSeverity;
    context?: any;
    timestamp: number;
}

class ErrorHandlingService {
    private errorLog: AppError[] = [];
    private maxLogSize = 100;
    private errorListeners: ((error: AppError) => void)[] = [];

    /**
     * Log an error
     */
    logError(
        code: string,
        message: string,
        severity: ErrorSeverity = 'error',
        context?: any
    ): AppError {
        const error: AppError = {
            code,
            message,
            severity,
            context,
            timestamp: Date.now(),
        };

        this.errorLog.push(error);
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize);
        }

        // Notify listeners
        this.errorListeners.forEach(listener => listener(error));

        // Log to console based on severity
        this.logToConsole(error);

        // Persist critical errors
        if (severity === 'critical') {
            this.persistError(error);
        }

        return error;
    }

    /**
     * Specific error types
     */

    logNetworkError(message: string, context?: any): AppError {
        return this.logError('NETWORK_ERROR', message, 'error', context);
    }

    logValidationError(message: string, context?: any): AppError {
        return this.logError('VALIDATION_ERROR', message, 'warning', context);
    }

    logSyncError(message: string, context?: any): AppError {
        return this.logError('SYNC_ERROR', message, 'error', context);
    }

    logQuotaError(message: string, context?: any): AppError {
        return this.logError('QUOTA_ERROR', message, 'critical', context);
    }

    logAuthError(message: string, context?: any): AppError {
        return this.logError('AUTH_ERROR', message, 'error', context);
    }

    logAPIError(message: string, statusCode?: number, context?: any): AppError {
        return this.logError('API_ERROR', message, 'error', {
            statusCode,
            ...context,
        });
    }

    /**
     * Get user-friendly error message
     */
    getUserFriendlyMessage(error: AppError | Error | string): string {
        if (typeof error === 'string') {
            return error;
        }

        if (error instanceof Error) {
            return error.message;
        }

        const appError = error as AppError;

        // Map error codes to user messages
        const messages: { [key: string]: string } = {
            NETWORK_ERROR: 'Connection failed. Check your internet and try again.',
            VALIDATION_ERROR: 'Invalid input. Please check your data.',
            SYNC_ERROR: 'Failed to sync data. Changes saved locally and will sync when online.',
            QUOTA_ERROR: 'Storage full. Delete old portfolios to continue.',
            AUTH_ERROR: 'Authentication failed. Please sign in again.',
            API_ERROR: 'API error. Please try again.',
        };

        return messages[appError.code] || appError.message;
    }

    /**
     * Subscribe to errors
     */
    onError(callback: (error: AppError) => void) {
        this.errorListeners.push(callback);
        return () => {
            this.errorListeners = this.errorListeners.filter(cb => cb !== callback);
        };
    }

    /**
     * Get error history
     */
    getErrorHistory(limit: number = 10): AppError[] {
        return this.errorLog.slice(-limit);
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
    }

    /**
     * Log to console with formatting
     */
    private logToConsole(error: AppError) {
        const style = this.getConsoleStyle(error.severity);
        const message = `[${error.code}] ${error.message}`;

        if (error.context) {
            console.log(`%c${message}`, style, error.context);
        } else {
            console.log(`%c${message}`, style);
        }
    }

    private getConsoleStyle(severity: ErrorSeverity): string {
        const styles: { [key: string]: string } = {
            info: 'color: blue; font-weight: bold;',
            warning: 'color: orange; font-weight: bold;',
            error: 'color: red; font-weight: bold;',
            critical: 'color: red; background: yellow; font-weight: bold;',
        };
        return styles[severity] || '';
    }

    /**
     * Persist critical errors for debugging
     */
    private persistError(error: AppError) {
        try {
            const stored = localStorage.getItem('_critical_errors') || '[]';
            const errors = JSON.parse(stored);
            errors.push(error);
            // Keep only last 20 critical errors
            if (errors.length > 20) {
                errors.shift();
            }
            localStorage.setItem('_critical_errors', JSON.stringify(errors));
        } catch (e) {
            console.error('[ErrorService] Failed to persist error:', e);
        }
    }

    /**
     * Get critical errors (for debugging/support)
     */
    getCriticalErrors(): AppError[] {
        try {
            const stored = localStorage.getItem('_critical_errors') || '[]';
            return JSON.parse(stored);
        } catch (e) {
            return [];
        }
    }

    /**
     * Handle unhandled promise rejection
     */
    handleUnhandledRejection(reason: any) {
        this.logError(
            'UNHANDLED_REJECTION',
            reason instanceof Error ? reason.message : String(reason),
            'critical',
            { reason }
        );
    }

    /**
     * Handle uncaught errors
     */
    handleUncaughtError(error: any) {
        this.logError(
            'UNCAUGHT_ERROR',
            error instanceof Error ? error.message : String(error),
            'critical',
            { error }
        );
    }
}

export const errorHandler = new ErrorHandlingService();

// Setup global error handlers
if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', event => {
        errorHandler.handleUnhandledRejection(event.reason);
    });

    window.addEventListener('error', event => {
        errorHandler.handleUncaughtError(event.error);
    });
}
