// Consumer-friendly BP classification + shared UI config

export const BP_MODE = { STRICT: 'strict', CONSUMER: 'consumer' };

export const BP_COLORS = {
    'Normal':    '#00b478',
    'Elevated':  '#00785a',
    'Stage 1':   '#ffc000',
    'Stage 2':   '#ff8c00',
    'Emergency': '#e64646'
};

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
            return { badgeText: 'Stage 1 Hypertension', badgeStyle: { background: BP_COLORS['Stage 1'], color: '#0b0f12' },
                risk: 'Slightly elevated — monitor closely.' };
        case 'Stage 2':
            return { badgeText: 'Stage 2 Hypertension', badgeStyle: { background: BP_COLORS['Stage 2'], color: '#fff' },
                risk: 'High — discuss management with your physician.' };
        case 'Emergency':
            return { badgeText: 'Hypertensive Crisis', badgeStyle: { background: BP_COLORS['Emergency'], color: '#fff' },
                risk: 'Seek medical attention now.' };
        default:
            return { badgeText: '—', badgeStyle: { background: '#a9b3ba', color: '#fff' }, risk: '' };
    }
}
