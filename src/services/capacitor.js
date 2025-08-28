import { Capacitor } from '@capacitor/core';

/**
 * Function for native app check
 * @returns
 */
export function isCapacitor() {
    return Capacitor.isNativePlatform();
}

/**
 * Function for native platform check
 * @returns 
 */
export function isPlatform() {
    return Capacitor.getPlatform();
}
