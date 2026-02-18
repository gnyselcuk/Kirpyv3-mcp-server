/**
 * Security event logger
 * Logs authentication attempts, rate limit violations, and security events
 */

import winston from 'winston';
import * as path from 'path';
import { config } from '../core/config.js';

export function createSecurityLogger() {
    const logDir = path.join(process.cwd(), 'logs');
    
    return winston.createLogger({
        level: config.NODE_ENV === 'production' ? 'info' : 'debug',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        transports: [
            // Security events log
            new winston.transports.File({ 
                filename: path.join(logDir, 'security.log'),
                level: 'warn'
            }),
            // Audit trail (all events)
            new winston.transports.File({ 
                filename: path.join(logDir, 'audit.log')
            }),
            // Console output in development
            ...(config.NODE_ENV === 'development' 
                ? [new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                })]
                : []
            )
        ]
    });
}
