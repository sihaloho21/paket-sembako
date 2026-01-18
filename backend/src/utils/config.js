import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET,
    adminUsername: process.env.ADMIN_USERNAME,
    adminPassword: process.env.ADMIN_PASSWORD,
    sheetdbApiUrl: process.env.SHEETDB_API_URL,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    cacheDuration: parseInt(process.env.CACHE_DURATION) || 300,
    
    // Validate required environment variables
    validate() {
        const required = [
            'JWT_SECRET',
            'ADMIN_USERNAME',
            'ADMIN_PASSWORD',
            'SHEETDB_API_URL'
        ];
        
        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }
};
