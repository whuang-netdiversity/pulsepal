// src/app/bp.js
import { setStorage, getStorage } from '@/app/utils';
import { getLocalTimestamp } from '@/app/helpers';
export const BP_MODE = { STRICT: 'strict', CONSUMER: 'consumer' };

export const BP_COLORS = {
    'Normal':    '#00b478',
    'Elevated':  '#00785a',
    'Stage 1':   '#ffc000',
    'Stage 2':   '#ff8c00',
    'Emergency': '#e64646'
};

const key = 'pp_history';

/**
 * Returns BP classification
 * @param {*} sys 
 * @param {*} dia 
 * @param {*} mode 
 * @returns 
 */
export function classifyBP(sys, dia, mode = BP_MODE.CONSUMER) {
    const s = Number(sys), d = Number(dia);
    if (!Number.isFinite(s) || !Number.isFinite(d)) return 'Normal';

    if (s >= 180 || d >= 120) return 'Emergency';
    if (s >= 140 || d >= 90)  return 'Stage 2';

    if (mode === BP_MODE.STRICT) {
        if ((s >= 130 && s <= 139) || (d >= 80 && d <= 89)) return 'Stage 1';
        if ((s >= 120 && s <= 129) && d < 80) return 'Elevated';
        if (s < 120 && d < 80) return 'Normal';
        return 'Normal';
    }

    // CONSUMER: move 120/80 out of Stage 1 and into Elevated
    if ((s >= 130 && s <= 139) || (d >= 81 && d <= 89)) return 'Stage 1';
    if ((s >= 120 && s <= 129) || d === 80) return 'Elevated';
    if (s < 120 && d < 80) return 'Normal';
    return 'Normal';
}

/**
 * Maps classifyBP() result string -> integer level
 * Higher = more severe
 * 0 = Normal
 * 1 = Elevated
 * 2 = Stage 1
 * 3 = Stage 2
 * 4 = Emergency
 * @param {*} classification 
 * @returns 
 */
function levelFromClassification(classification) {
    switch (classification) {
        case 'Normal':     return 0;
        case 'Elevated':   return 1;
        case 'Stage 1':    return 2;
        case 'Stage 2':    return 3;
        case 'Emergency':  return 4;
        default:           return -1; // unknown / unexpected
    }
}

/**
 * Category decorators
 * @param {*} category 
 * @returns 
 */
export function uiForCategory(category) {
    switch (category) {
        case 'Normal':
            return { badgeText: 'Normal', badgeStyle: { background: BP_COLORS['Normal'], color: '#fff' },
                risk: 'Within normal range.' };
        case 'Elevated':
            return { badgeText: 'Elevated', badgeStyle: { background: BP_COLORS['Elevated'], color: '#fff' },
                risk: 'Borderline — keep an eye on it.' };
        case 'Stage 1':
            return { badgeText: 'Stage 1 Hypertension',
                badgeStyle: { background: BP_COLORS['Stage 1'], color: '#0b0f12' },
                risk: 'Slightly elevated — monitor closely.' };
        case 'Stage 2':
            return { badgeText: 'Stage 2 Hypertension',
                badgeStyle: { background: BP_COLORS['Stage 2'], color: '#fff' },
                risk: 'High — discuss management with your physician.' };
        case 'Emergency':
            return { badgeText: 'Hypertensive Crisis',
                badgeStyle: { background: BP_COLORS['Emergency'], color: '#fff' },
                risk: 'Seek medical attention now.' };
        default:
            return { badgeText: '—', badgeStyle: { background: '#a9b3ba', color: '#fff' }, risk: '' };
    }
}

/**
 * BP Reading store
 * @param {*} ecg 
 * @returns 
 */
export function storeBP(ecg) {
    const list = loadBP() || [];
    if (!Array.isArray(list)) return;

    const ts = getLocalTimestamp();
    const rec = {
        date: ts,
        class: levelFromClassification(classifyBP(ecg.sys, ecg.dia)),
        ecg: ecg
    };

    // Find any record with the exact same timestamp
    const idx = list.findIndex(r => r?.date === ts);

    if (idx !== -1) {
        // Replace the existing record at that timestamp
        list[idx] = rec;
    }
    else {
        // Otherwise, insert as newest
        list.unshift(rec);
    }

    setStorage(key, list);
    return true;
}

/**
 * BP reading loader
 * @returns 
 */
export function loadBP() {
    return getStorage(key) || [];
}

/**
 * Update BP reactivity
 * @param {*} prop 
 * @param {*} index 
 * @returns 
 */
export function updateBP(prop, index) {
    const list = loadBP();

    if (typeof index !== 'number' || index < 0 || index >= list.length) return list;

    const updated = list.filter((_, i) => i !== index);
    setStorage(key, updated);

    app.emit('interfacePage', { key: prop.repeater });
}

/**
 * Export function to CSV
 * @param {*} start 
 * @param {*} end 
 * @returns 
 */
export function exportHistoryCSV(start, end) {
    const startAt = toStartOfDay(start);
    const endAt = toEndOfDay(end);

    const rows = ['date,sys,dia,pulse'];

    (loadBP() || [])
        .filter(r => r?.date && r?.ecg)
        .filter(r => {
            const d = new Date(r.date);
            if (startAt && d < startAt) return false;
            if (endAt && d > endAt) return false;
            return true;
        })
        .forEach(r => {
            const { sys, dia, pulse } = r.ecg;
            rows.push(`${r.date},${sys},${dia},${pulse}`);
        });

    return rows.join('\n');
}

/**
 * Helper
 * @param {*} d 
 * @returns 
 */
function toStartOfDay(d) {
    if (!d) return null;
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

/**
 * Helper
 * @param {*} d 
 * @returns 
 */
function toEndOfDay(d) {
    if (!d) return null;
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
}
