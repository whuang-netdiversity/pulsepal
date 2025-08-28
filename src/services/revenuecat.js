import { logger } from '@/app/log';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { isCapacitor, isPlatform } from '@/services/capacitor';

let revenuecatInitialized = false;

/**
 * Function to restore purchases
 * @param {*} productId 
 * @returns 
 */
export async function restorePurchases(productId = 'full_version_unlock') {
    if (!isCapacitor()) return false;

    try {
        const { customerInfo } = await Purchases.restorePurchases();

        logger.info('[Restore] customerInfo:', customerInfo);
        logger.info('[Restore] Active entitlements:', customerInfo.entitlements.active);

        const entitlement = customerInfo.entitlements.active[productId];
        const isActive = entitlement?.isActive === true;

        if (isActive) {
            alert('✅ Premium restored!');
        }
        else {
            alert('🚫 No active entitlement found after restore.');
        }

        return isActive;
    }
    catch (err) {
        logger.error('[RevenueCat] Restore failed:', {
            code: err.code,
            message: err.message,
            err
        });
        
        alert('Restore Error: ' + err.message);
        return false;
    }
}

/**
 * Function to purchase premium via RevenueCat default offering
 * @param {*} productId 
 * @returns {Promise<boolean>}
 */
export async function purchasePremium(productId = 'full_version_unlock') {
    if (!isCapacitor()) return false;

    try {
        await Purchases.invalidateCustomerInfoCache();
        const offerings = await Purchases.getOfferings({ forceUpdate: true });

        if (!offerings?.current) {
            logger.warn('[RC] No current offering available.');
            return;
        }

        const packages = offerings.current?.availablePackages;

        if (!packages?.length) {
            logger.warn('[RC] No packages available in current offering.');
            return;
        }

        const pkg = packages.find(p => p.product.identifier === productId);

        if (!pkg) {
            logger.warn(`[RC] Package with product ID "${productId}" not found.`);
            return;
        }

        const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
        const entitlement = customerInfo.entitlements.active[productId];

        if (entitlement) {
            alert('✅ Premium unlocked!');
            return true;
        }
        else {
            alert('🚫 Purchase completed, but entitlement not active.');
            return false;
        }
    }
    catch (err) {
        logger.error('[RevenueCat] Purchase failed:', {
            code: err.code,
            message: err.message,
            err
        });
        
        alert(`🚫 RevenueCat Error: ${err.message}`);
        return false;
    }
}

/**
 * Initialize revenue cat
 * @param {*} config 
 * @returns 
 */
export async function initRevenueCat(config) {
    if (!isCapacitor()) return false;

    const platform = isPlatform();
    const apiKey = config.revenuecat[platform];

    if (!apiKey) {
        logger.warn(`[RC] Missing API key for ${platform}`);
        return;
    }

    try {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        await Purchases.configure({ apiKey });

        revenuecatInitialized = true;
        await Purchases.syncPurchases();

        logger.info('[RC] RevenueCat configured');
    } 
    catch (err) {
        logger.error('[RC] Failed to configure RevenueCat:', err);
    }
}

/**
 * Check if revenuecat ready
 * @returns 
 */
export function isRevenueCatReady() {
    return revenuecatInitialized;
}
