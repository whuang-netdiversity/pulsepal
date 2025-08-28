// src/app/log.js
/**
 * Logging utility for styled console output
 * Supports info, success, warn, and error messages with optional context labels
 */
export const logger = {
    /**
     * Logs an informational message with a blue background.
     * @param {string} [context=''] - Optional context label (e.g., 'PAGE LOADED').
     * @param {*} data - Optional data (object, value)
     */
    info(context = '', data = null) {
        console.log(
            `%c[INFO-100] ${context}`,
            'color: white; background: #007acc; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
            ...(data !== null ? [data] : [])
        );
    },

    /**
     * Logs a success message with a green background.
     * @param {string} [context=''] - Optional context label (e.g., 'FETCH OK').
     * @param {*} data - Optional data (object, value)
     */
    success(context = '', data = null) {
        console.log(
            `%c[SUCCESS-200] ${context}`,
            'color: white; background: #28a745; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
            ...(data !== null ? [data] : [])
        );
    },

    /**
     * Logs a warning message with a yellow background.
     * @param {string} [context=''] - Optional context label (e.g., 'CACHE MISS').
     * @param {*} data - Optional data (object, value)
     */
    warn(context = '', data = null) {
        console.warn(
            `%c[WARN-300] ${context}`,
            'color: black; background: #ffc107; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
            ...(data !== null ? [data] : [])
        );
    },

    /**
     * Logs an error message with a red background.
     * @param {string} [context=''] - Optional context label (e.g., 'DB FAIL').
     * @param {*} data - Optional data (object, value)
     */
    error(context = '', data = null) {
        console.error(
            `%c[ERROR-400] ${context}`, 
            'color: white; background: #dc3545; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
            ...(data !== null ? [data] : [])
        );
    }
};
