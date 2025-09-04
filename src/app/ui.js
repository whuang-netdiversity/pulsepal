// src/app/ui.js
import { logger } from '@/app/log';
import { start } from '@/pages/start';
import { classifyBP, BP_COLORS, uiForCategory, BP_MODE } from '@/app/bp';
import { loadBP } from '@/app/bp';

/**
 * Function to update contents in a repeater
 * @param {*} page 
 * @param {*} contents 
 * @param {*} feature_allowed
 * @param {*} postRender
 */
export function updateRepeater(page, contents = [], feature_allowed = false, postRender = null) {
    thoriumapi.repeaters.clear(page.repeater);
    contents.forEach(content => thoriumapi.repeaters.appendItem(page.repeater, content));

    if (feature_allowed && contents.length > 0) {
        $(page.message).hide();
        $(page.repeater_container).show();
    }
    else if (feature_allowed && contents.length === 0) {
        $(page.message).show();
        $(page.repeater_container).hide();
    }
    else {
        $(page.message).text(page.unlock);
        $(page.message).show();
        $(page.repeater_container).hide();
    }

    // Run optional post-render hook
    if (typeof postRender === 'function') {
        postRender({ page, contents });
    }

    logger.warn(`${page.repeater} updated items: `, contents.length);
};

/**
 * Reads sys/dia/pulse directly from a <pp-card> element.
 * @param {HTMLElement|string} target Either a pp-card element or a selector
 * @returns {{ sys:number, dia:number, pulse:number|null }|null}
 */
export function readBP(target = 'pp-card') {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return null;

    const getVal = (field) => {
        const raw = el.getAttribute(field) || 
                    el.querySelector(`.pp-value[data-field="${field}"]`)?.textContent;
        const num = Number(raw);
        return Number.isFinite(num) ? num : null;
    };

    const sys   = getVal('sys');
    const dia   = getVal('dia');
    const pulse = getVal('pulse');

    if (sys !== null && dia !== null) {
        return { sys, dia, pulse };
    }
    return null;
}

/**
 * Update a <pp-card>’s readings using Dom7 when available.
 * Pass -1 to any param to ignore that field.
 *
 * @param {number|string} sys
 * @param {number|string} dia
 * @param {number|string} pulse
 * @param {string|Element=} target CSS selector or element; defaults to start.bp_id
 */
export function updateBP(sys, dia, pulse, target = start.bp_id) {
    const $$ = window.Dom7 || window.$$; // Framework7/Thorium usually exposes this

    const shouldUpdate = (val) => val !== -1 && val != null;

    // Helper for Dom7 collections
    const setAttrsDom7 = ($els) => {
        if (!$els || $els.length === 0) return;
        if (shouldUpdate(sys)) $els.attr('sys', String(sys));
        if (shouldUpdate(dia)) $els.attr('dia', String(dia));
        if (shouldUpdate(pulse)) $els.attr('pulse', String(pulse));
    };

    if ($$) {
        const $els = typeof target === 'string' ? $$(target) : $$(target);
        setAttrsDom7($els);
        return;
    }

    // Native fallback
    const el = typeof target === 'string'
        ? document.querySelector(target)
        : target;

    if (!el) return;
    if (shouldUpdate(sys)) el.setAttribute('sys', String(sys));
    if (shouldUpdate(dia)) el.setAttribute('dia', String(dia));
    if (shouldUpdate(pulse)) el.setAttribute('pulse', String(pulse));
}

/**
 * Function to enrich classification content
 * @param {*} repeater
 * @param {*} reading 
 * @returns 
 */
export function updateClassification(repeater, reading) {
    const items = thoriumapi.repeaters.getAllItems(repeater) || [];
    const ecg = normalizeReading(reading) || sniffReadingFromRoute() || null;
    if (!ecg) return items;

    // Consumer-friendly rule: 120/80 -> Elevated
    const category = classifyBP(ecg.sys, ecg.dia, BP_MODE.CONSUMER);

    return items.map((it, idx) => {
        const raw = String(it.info_disp || '').trim();

        if (idx === 0) {
            return { ...it, info_disp: `<strong>${raw}</strong>`, info: '' };
        }

        const key = pickKey(raw);
        const isMatch = key && key === category;

        let enrichedDisp = raw;
        if (key) {
            const color = BP_COLORS[key] || '#999';
            const swatch = `<span class="pp-swatch" aria-hidden="true" style="background:${color}"></span>`;
            enrichedDisp = swatch + raw.replace(/^([A-Za-z]+(?:\s\d)?)/, '<strong>$1</strong>');
        }

        return {
            ...it,
            info_disp: enrichedDisp,
            info: isMatch ? '👈 <span class="pp-you-badge">YOU</span>' : ''
        };
    });

    /**
     * Helper normalize
     * @param {*} r 
     * @returns 
     */
    function normalizeReading(r) {
        if (!r) return null;
        if (typeof r === 'string') {
            try { r = JSON.parse(r); }
            catch { return null; }
        }
        const sys   = Number(r.sys ?? r.SYS ?? r.systolic);
        const dia   = Number(r.dia ?? r.DIA ?? r.diastolic);
        const pulse = Number(r.pulse ?? r.PULSE ?? r.hr ?? r.heartRate);
        if (Number.isFinite(sys) && Number.isFinite(dia)) return { sys, dia, pulse };
        return null;
    }

    /**
     * Helper readings
     * @returns 
     */
    function sniffReadingFromRoute() {
        try {
            const q = (window?.app?.views?.main?.router?.currentRoute?.query)
                   || (window?.f7router?.currentRoute?.query) || {};
            if (q.data) return normalizeReading(q.data);
        }
        catch {}
        try {
            const sp = new URLSearchParams(location.search);
            const data = sp.get('data');
            if (data) return normalizeReading(data);
        }
        catch {}
        return null;
    }

    /**
     * Get the key
     * @param {*} label 
     * @returns 
     */
    function pickKey(label) {
        if (label.startsWith('Normal')) return 'Normal';
        if (label.startsWith('Elevated')) return 'Elevated';
        if (label.startsWith('Stage 1')) return 'Stage 1';
        if (label.startsWith('Stage 2')) return 'Stage 2';
        if (label.startsWith('Emergency') || label.startsWith('Crisis')) return 'Emergency';
        return null;
    }
}

/**
 * Update health badges
 * @param {*} ecg 
 * @returns 
 */
export function updateHealthBadgeAndRiskFrom(ecg) {
    if (!ecg) return;
    const $badge = $('#span-1127');
    const $risk  = $('#h3-1138');
    if (!$badge.length) return;

    const category = classifyBP(ecg.sys, ecg.dia, BP_MODE.CONSUMER);
    const { badgeText, badgeStyle, risk } = uiForCategory(category);

    $badge
        .removeAttr('class')
        .addClass('badge')
        .text(badgeText)
        .css(badgeStyle)
        .attr('aria-label', `Health classification: ${badgeText}`);

    if ($risk.length) $risk.text(risk);
}

/**
 * History content enrichment
 * @returns 
 */
export function updateHistory() {
    const rows = (loadBP() || [])
        .filter(r => r?.date && r?.ecg);

    // oldest → newest for trend computation
    rows.sort((a, b) => new Date(a.date) - new Date(b.date));

    let prevClass = null;
    const decoratedAsc = rows.map(r => {
        const curr = Number(r.class);
        let trend = '⚪'; // neutral by default

        if (Number.isFinite(curr) && Number.isFinite(prevClass)) {
            if (curr > prevClass) trend = '📈';
            else if (curr < prevClass) trend = '📉';
            else trend = '➖';
        }

        if (Number.isFinite(curr)) prevClass = curr;

        return {
            date: r.date.replace(/ at /, '/').trim(),
            disp: `${r.ecg.sys}/${r.ecg.dia} • ${r.ecg.pulse} bpm ${trend}`
        };
    });

    // newest → oldest for display
    return decoratedAsc.reverse();
}
