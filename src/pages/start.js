// src/pages/start.js
import Tesseract from 'tesseract.js';

import { readBP, updateBP } from '@/app/ui';
import { mountCalcSheet, openCalc } from '@/services/calc-sheet';
import { pp_detail } from '@/pages/pp_detail';

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

$(document).on('click', start.bp_scan_input, async (e) => {
    e.preventDefault();

    const scan = $('<input type="file" accept="image/*" capture="environment">');
    scan.css({ position:'fixed', top:0, left:0, opacity:'0.001', width:'1px', height:'1px', zIndex:9999 });
    $('body').append(scan);

    $(scan).on('change', (ev) => {
        const f = ev.target.files?.[0];
        if (f) console.log('Selected file:', f.name);
        scan.remove();
    });

    if (scan[0].showPicker) scan[0].showPicker(); else scan[0].click();


    // Your debug confirms click fired:
    alert('clicked');
    thoriumapi.logEvent(1, 'Direct scan fired!');
});

$(document).on('click', start.bp_add_input, (e) => {
    e.preventDefault();

    alert('clicked');
    thoriumapi.logEvent(1, 'Direct add fired!');
});

$(document).on('click', start.bp_view_input, (e) => {
    e.preventDefault();

    alert('clicked');
    thoriumapi.logEvent(1, 'Direct view fired!');

});
