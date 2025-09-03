// src/pages/start.js
import { logger } from '@/app/log';
import { isCapacitor } from '@/services/capacitor';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { readBP, updateBP } from '@/app/ui';
import { mountCalcSheet, openCalc } from '@/services/calc-sheet';
import { pp_detail } from '@/pages/pp_detail';
import { storeBP } from '@/app/bp';
import { pp_history } from '@/pages/pp_history';

export const start = {
    key: 'index-8723',
    bp_container: '#div-1038',
    bp_id: '#my-bp',
    bp_reading: `<pp-card id="my-bp" sys="118" dia="78" pulse="62"></pp-card>`,
    bp_sys_input: '.pp-row.sys-touch',
    bp_dia_input: '.pp-row.dia-touch',
    bp_pulse_input: '.pp-row.pulse-touch',
    bp_ecg_monitor: '.pp-ecg-wrap.detail-touch',
    bp_scan_input: '#btn-capture-reading',
    bp_add_input: '#btn-add-reading',
    bp_view_input: '#btn-view-reading',

};

$(document).on('page:init', '.page[data-name="index"]', ({ detail: page }) => {
    const { route: { query } } = page;

    initApp();

    logger.info('start page reloaded:', JSON.stringify(query));
});


/**
 * Function initializing app
 */
export function initApp() {
    $(start.bp_container).html(start.bp_reading);

    updateBP(120, 80, 60);
    mountCalcSheet(app);
}

// SYS
$(document).on('click', start.bp_sys_input, (e) => {
    e.preventDefault();

    // Ensure we're working with a Dom7 element
    const $target = $(e.target);
    const $card = $target.closest('pp-card');

    if (!$card.length) return;

    openCalc($card[0], {
        field: 'sys',
        maxDigits: 3,
        title: 'Enter Systolic'
    });
});

// DIA
$(document).on('click', start.bp_dia_input, (e) => {
    e.preventDefault();

    // Ensure we're working with a Dom7 element
    const $target = $(e.target);
    const $card = $target.closest('pp-card');

    if (!$card.length) return;

    openCalc($card[0], {
        field: 'dia',
        maxDigits: 3,
        title: 'Enter Diastolic'
    });
});

// PULSE
$(document).on('click', start.bp_pulse_input, (e) => {
    e.preventDefault();

    // Ensure we're working with a Dom7 element
    const $target = $(e.target);
    const $card = $target.closest('pp-card');

    if (!$card.length) return;

    openCalc($card[0], {
        field: 'pulse',
        maxDigits: 3,
        title: 'Enter Pulse'
    });
});

$(document).on('click', start.bp_ecg_monitor, (e) => {
    e.preventDefault();

    const ecg = readBP();

    app.emit('routePage', { key: pp_detail.key, params: ecg });
});

// Speak → live transcript in an F7 Sheet → Stop → parse → updateBP(sys, dia, pulse)
$(document).on('click', start.bp_scan_input, async (e) => {
    e.preventDefault();

    if (!isCapacitor()) {
        app.dialog.alert('Run the native app (iOS/Android) for speech capture.');
        return;
    }

    // ---- permissions ----
    try {
        const perm = await (SpeechRecognition.checkPermissions?.() ??
                            SpeechRecognition.hasPermission());
        const granted =
            perm?.speechRecognition === 'granted' ||
            perm?.microphone === 'granted' ||
            perm?.permission === true;

        if (!granted) {
            const req = await (SpeechRecognition.requestPermissions?.() ??
                               SpeechRecognition.requestPermission());
            const ok =
                req?.speechRecognition === 'granted' ||
                req?.microphone === 'granted' ||
                req?.permission === true;
            if (!ok) {
                app.dialog.alert('Microphone/Speech permission denied.');
                return;
            }
        }
    }
    catch (err) {
        console.error('Permission check failed:', err);
        app.dialog.alert('Permission check failed: ' + (err?.message || err));
        return;
    }

    // ---- minimal inline parser ----
    const numberFromWords = (phrase) => {
        const t = String(phrase || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
        const m = t.match(/\b(\d{2,3})\b/);
        if (m) return parseInt(m[1], 10);
        const SMALL = { zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9,
            ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16,
            seventeen:17, eighteen:18, nineteen:19 };
        const TENS  = { twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90 };
        const DIG   = { zero:0, oh:0, o:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9 };

        const toks = t.split(/\s+/).filter(Boolean);
        let acc = 0, val = 0, seen = false;
        for (const w of toks) {
            if (SMALL[w] != null) { acc += SMALL[w]; seen = true; continue; }
            if (TENS[w]  != null) { acc += TENS[w];  seen = true; continue; }
            if (w === 'hundred')  { if (acc === 0) acc = 1; acc *= 100; seen = true; continue; }
            if (seen) break;
        }
        val += acc;
        if (val >= 30 && val <= 300) return val;

        const digs = toks.map(x => DIG[x]).filter(n => n != null);
        if (digs.length >= 2 && digs.length <= 3) {
            const n = parseInt(digs.join(''), 10);
            if (n >= 30 && n <= 300) return n;
        }
        return null;
    };

    const parseSpeechToBP = (text) => {
        const t = String(text || '').toLowerCase().replace(/[^a-z0-9\s/]/g, ' ').replace(/\s+/g, ' ').trim();

        const m1 = t.match(/(\d{2,3})\s*(?:over|by|slash|\/)\s*(\d{2,3})(?:.*?(?:pulse|heart|rate)\s*(\d{2,3}))?/);
        if (m1) return { sys: +m1[1], dia: +m1[2], pulse: m1[3] ? +m1[3] : null };

        const lsys = t.match(/(?:sys|systolic)\s*(\d{2,3})/);
        const ldia = t.match(/(?:dia|diastolic)\s*(\d{2,3})/);
        const lpul = t.match(/(?:pulse|heart|rate)\s*(\d{2,3})/);
        if (lsys && ldia) return { sys: +lsys[1], dia: +ldia[1], pulse: lpul ? +lpul[1] : null };

        const parts = t.split(/\b(?:over|by|slash|\/)\b/);
        if (parts.length >= 2) {
            const sys = numberFromWords(parts[0]);
            const dia = numberFromWords(parts[1]);
            let pulse = null;
            const tail = parts.slice(2).join(' ');
            const mp = tail.match(/(?:pulse|heart|rate)\s+([a-z0-9 -]+)/);
            if (mp) pulse = numberFromWords(mp[1]);
            if (sys && dia) return { sys, dia, pulse };
        }

        const nums = (t.match(/\d{2,3}/g) || []).map(n => +n);
        if (nums.length >= 2) return { sys: nums[0], dia: nums[1], pulse: nums[2] ?? null };

        return { sys: null, dia: null, pulse: null };
    };

    const clampBP = (sys, dia, pulse) => {
        if (sys != null && dia != null && dia > sys) { const tmp = sys; sys = dia; dia = tmp; }
        if (sys != null && (sys < 70 || sys > 250)) sys = null;
        if (dia != null && (dia < 30 || dia > 150)) dia = null;
        if (pulse != null && (pulse < 30 || pulse > 200)) pulse = null;
        return { sys, dia, pulse };
    };

    // ---- F7 Sheet (create once, reuse) ----
    if (!window.__ppSRSheet) {
        window.__ppSRSheet = app.sheet.create({
            swipeToClose: false,
            backdrop: true,
            content: `
            <div class="sheet-modal sheet-modal-inset" id="pp-sr-sheet">
                <div class="toolbar">
                    <div class="toolbar-inner justify-content-between">
                        <div class="left">
                            <i class="icon f7-icons">mic</i>
                            <span class="ml-1">Listening…</span>
                        </div>
                        <div class="right">
                            <a class="link sheet-close">Close</a>
                        </div>
                    </div>
                </div>
                <div class="sheet-modal-inner">
                    <div class="block">
                        <p class="text-color-gray">Speak e.g. “120 over 80, pulse 65”.</p>
                        <div class="card">
                            <div class="card-content card-content-padding">
                                <div class="text-medium">Transcript</div>
                                <div id="pp-sr-live" style="min-height:24px">(waiting…)</div>
                            </div>
                        </div>
                        <div class="margin-top">
                            <a id="pp-sr-stop" class="button button-fill button-large">
                                <i class="icon f7-icons">stop_fill</i>
                                <span class="ml-1">Stop</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>`
        });
    }

    const sheet = window.__ppSRSheet;
    sheet.open();

    const $live = $('#pp-sr-live');
    const $stop = $('#pp-sr-stop');

    let lastHeard = '';
    let stopped = false;

    const partialSub = await SpeechRecognition.addListener('partialResults', (d) => {
        if (d?.matches?.length) {
            lastHeard = d.matches[0] || lastHeard;
            $live.text(lastHeard || '(listening…)');
        }
    });

    const stateSub = await SpeechRecognition.addListener('listeningState', (d) => {
        console.log('[speech] state:', d?.status);
    });

    const cleanup = async () => {
        try {
            await partialSub?.remove?.();
        }
        catch {}
        try {
            await stateSub?.remove?.();
        }
        catch {}
        try {
            sheet.close();
        }
        catch {}
    };

    const finalize = () => {
        if (!lastHeard) {
            app.dialog.alert('No speech detected. Try again.');
            return;
        }
        const p = parseSpeechToBP(lastHeard);
        const c = clampBP(p.sys, p.dia, p.pulse);

        // Update the PP card with any values we got
        if (c.sys != null && c.dia != null && c.pulse != null) {
            updateBP(c.sys, c.dia, c.pulse);
            app.toast?.show?.({ text: `Updated: ${c.sys}/${c.dia} • ${c.pulse} bpm`, closeTimeout: 1800 }) ||
            app.dialog.alert(`Updated: ${c.sys}/${c.dia} • ${c.pulse} bpm`);
        }
        else if (c.sys != null && c.dia != null) {
            updateBP(c.sys, c.dia, (readBP()?.pulse) || 60);
            app.toast?.show?.({ text: `Updated: ${c.sys}/${c.dia}`, closeTimeout: 1800 }) ||
            app.dialog.alert(`Updated: ${c.sys}/${c.dia}`);
        }
        else {
            app.dialog.alert(`Heard: ${lastHeard}\n→ Could not parse a BP reading`);
        }
    };

    const timer = setTimeout(async () => {
        if (stopped) return;
        stopped = true;
        try {
            await SpeechRecognition.stop(); 
        }
        catch {}
        await cleanup();
        finalize();
    }, 8000);

    $stop.off('click').on('click', async () => {
        if (stopped) return;
        stopped = true;
        clearTimeout(timer);
        try {
            await SpeechRecognition.stop();
        }
        catch {}
        await cleanup();
        finalize();
    });

    sheet.on('sheetClose', async () => {
        if (stopped) return;
        stopped = true;
        clearTimeout(timer);
        try {
            await SpeechRecognition.stop();
        }
        catch {}
        await cleanup();
        finalize();
    });

    try {
        await SpeechRecognition.start({
            language: 'en-US',
            maxResults: 5,
            partialResults: true,
            popup: true
        });
    }
    catch (err) {
        clearTimeout(timer);
        await cleanup();
        console.error('Speech start failed:', err);
        app.dialog.alert('Speech start failed: ' + (err?.message || err));
    }
});

$(document).on('click', start.bp_add_input, (e) => {
    e.preventDefault();

    const ecg = readBP();
    storeBP(ecg);

    app.dialog.alert('The BP reading has been saved.');
});

$(document).on('click', start.bp_view_input, (e) => {
    e.preventDefault();

    app.emit('routePage', { key: pp_history.key });
});
