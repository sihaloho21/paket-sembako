import { config } from './config.js';

const isDevelopment = config.nodeEnv === 'development';

export const logger = {
    info: (...args) => {
        if (isDevelopment) {
            console.log('[INFO]', new Date().toISOString(), ...args);
        }
    },
    
    error: (...args) => {
        console.error('[ERROR]', new Date().toISOString(), ...args);
    },
    
    warn: (...args) => {
        console.warn('[WARN]', new Date().toISOString(), ...args);
    },
    
    debug: (...args) => {
        if (isDevelopment) {
            console.log('[DEBUG]', new Date().toISOString(), ...args);
        }
    }
};
