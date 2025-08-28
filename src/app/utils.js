// src/app/utils.js
import { logger } from '@/app/log';
import { baseUrl } from '@/app/helpers';

/**
 * Function to get previous return path
 * @param {*} fromIndex 
 * @param {*} options 
 */
export function prevPath(fromIndex = 0, options = {}) {
    const { history } = app.views.main;

    if (fromIndex < 0) fromIndex = 0;
    if (fromIndex > history.length - 1) fromIndex = history.length - 1;

    app.views.main.router.back(history[fromIndex], options);
}

/**
 * Function to get next forwared path
 * @param {*} destination 
 * @param {*} item 
 * @param {*} options 
 */
export function nextPath(destination = '', item = {}, options = {}) {
    const url = (typeof destination !== 'string' || destination.trim() === '')
        ? app.views.main.router.currentRoute
        : baseUrl(destination, null, item);

    app.views.main.router.navigate(url, options);
}

/**
 * Write a value to LocalStorage as JSON string
 * @param {string} key - Storage key
 * @param {any} value - Value to store (will be JSON.stringified)
 */
export function setStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Read a value from LocalStorage as parsed JSON
 * @param {string} key - Storage key
 * @param {any} fallback - Optional fallback if key missing or invalid
 * @returns {any} Parsed value or fallback
 */
export function getStorage(key, fallback = null) {
    const raw = localStorage.getItem(key);
    try {
        return raw !== null ? JSON.parse(raw) : fallback;
    }
    catch (err) {
        logger.warn(`⚠️ LocalStorage parse error for key ${key}:`, err);
        return fallback;
    }
}

/**
 * Remove local storage by key
 * @param {*} key 
 */
export function purgeStorage(key) {
    localStorage.removeItem(key);
}
