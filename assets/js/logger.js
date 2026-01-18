/**
 * Logger Utility
 * Provides conditional logging based on environment
 * Only logs in development mode
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logger = {
    log(...args) {
        if (isDevelopment) {
            console.log(...args);
        }
    },
    
    warn(...args) {
        if (isDevelopment) {
            console.warn(...args);
        }
    },
    
    error(...args) {
        // Always log errors, even in production
        console.error(...args);
    },
    
    info(...args) {
        if (isDevelopment) {
            console.info(...args);
        }
    }
};
