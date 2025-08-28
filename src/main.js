// CSS IMPORTS HERE
import '@/styles/calc-sheet.css';
import '@/styles/components.css';
import '@/styles/overrides.css';
import '@/styles/pp-card.css';

// JS IMPORTS HERE
import { logger } from '@/app/log';
import { getSource } from '@/app/helpers';
import { initApp } from '@/pages/start';
import '@/core/pulse-pal';
import '@/components/pp-card';

import { initRevenueCat } from '@/services/revenuecat';
import { showInterstitialAd } from '@/services/admob';
import { setFeatureMap, simulatePremium } from '@/services/premium';

/**
 * Version loader
 */
async function loadAppVersion() {
    try {
        const data = await getSource('./version.json');
        window.appVersion = data.version;
        logger.info('App] Version loaded:', window.appVersion);
    }
    catch (err) {
        logger.warn('[App] Failed to load version.json:', err);
        window.appVersion = null;
    }
}

/**
 * Fetch configuraiton
 * @returns
 */
async function getConfig() {
    try {
        return getSource('js/json/config.json');
    }
    catch (err) {
        logger.warn('Config load failed:', err);
    }
}

/**
 * Function for initializing app
 */
async function appStart() {
    const appConfig = await getConfig();
    const isPremium = appConfig.simulate_premium ?? false;
    const featureConfig = appConfig.premium_features;

    simulatePremium(isPremium);
    setFeatureMap(featureConfig);

    await showInterstitialAd(appConfig);
    await loadAppVersion();
    
    if (!isPremium) await initRevenueCat(appConfig);

    if (app.initialized === true) {
        initApp();
    }
    else {
        app.on('init', initApp);
    }
}

appStart();
