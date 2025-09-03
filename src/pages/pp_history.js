// src/pages/pp_history.js
import { logger } from '@/app/log';
import { loadBP, updateBP } from '@/app/bp';
import { prevPath, nextPath } from '@/app/utils';

export const pp_history = {
    key: 'history-3982',
    path: '/pp_history/',
    title: '#title-o-1295',
    back_button: '#o-1293',
    action: '#right-o-1296',
    prop: {
        message: '#div-1303',
        repeater: 'repeater-1302',
        repeater_container: '#div-1301'
    },
    share_button: '<a id="pp-share" class="link icon-only">\
        <i class="f7-icons">square_arrow_up</i>\
    </a>',
    pp_share: '#pp-share',
    bread_crumb: 1
};

$(document).on('page:init', '.page[data-name="pp_history"]', ({ detail: page }) => {
    const { route: { query } } = page;

    $(pp_history.title).text('Pulse Pal History');
    $(pp_history.action).html(pp_history.share_button);

    $(pp_history.back_button).removeClass('back');
    logger.info('pp history page loaded:', JSON.stringify(query));
});

$(document).on('click', pp_history.pp_share, async (e) => {
    e.preventDefault();

    const html = `
        <div class="list no-hairlines no-hairlines-between">
            <ul>
                <li class="item-content item-input">
                    <div class="item-inner">
                        <div class="item-title item-label">Start</div>
                        <div class="item-input-wrap"><input id="pp-start" type="date" /></div>
                    </div>
                </li>
                <li class="item-content item-input">
                    <div class="item-inner">
                        <div class="item-title item-label">End</div>
                        <div class="item-input-wrap"><input id="pp-end" type="date" /></div>
                    </div>
                </li>
            </ul>
        </div>
    `;

    app.dialog.create({
        title: 'Date Range',
        content: html,
        buttons: [
            {
                text: 'Cancel',
                close: true
            },
            {
                text: 'OK',
                bold: true,
                close: true,
                onClick: async () => {
                    try {
                        const s = $('#pp-start').val();
                        const e2 = $('#pp-end').val();

                        const toStart = s => {
                            if (!s) return null;
                            const [y, m, d] = s.split('-').map(n => parseInt(n, 10));
                            return new Date(y, m - 1, d, 0, 0, 0, 0); // local 00:00
                        };

                        const toEnd = s => {
                            if (!s) return null;
                            const [y, m, d] = s.split('-').map(n => parseInt(n, 10));
                            return new Date(y, m - 1, d, 23, 59, 59, 999); // local 23:59:59.999
                        };                        let startAt = s ? toStart(s) : null;

                        let endAt   = e2 ? toEnd(e2) : null;
                        if (!startAt && endAt) startAt = toStart(e2);
                        if (!endAt && startAt) endAt   = toEnd(s);
                        if (startAt && endAt && startAt > endAt) { alert('start must be before end'); return; }

                        const readings = (loadBP() || [])
                            .filter(r => r?.date && r?.ecg)
                            .filter(r => {
                                const d = new Date(r.date);
                                if (startAt && d < startAt) return false;
                                if (endAt && d > endAt) return false;
                                return true;
                            });

                        if (!readings.length) { alert('no readings in range'); return; }

                        const E = (v) => {
                            const t = String(v ?? '');
                            if (/[",\r\n]/.test(t)) {
                                return `"${t.replace(/"/g, '""')}"`;
                            }
                            return t;
                        };

                        const lines = [['date','sys','dia','pulse'].map(E).join(',')];
                        readings.forEach(r => {
                            const { sys, dia, pulse } = r.ecg;
                            lines.push([r.date, sys, dia, pulse].map(E).join(','));
                        });
                        const csv = '\uFEFF' + lines.join('\r\n');
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });

                        const fmt = d => d ? d.toISOString().slice(0,10) : 'all';
                        const filename = `pulsepal-history-${fmt(startAt)}_${fmt(endAt)}.csv`;
                        const file = new File([blob], filename, { type: 'text/csv' });

                        const title = 'pulse pal — bp history';
                        const text  = `${title} (${fmt(startAt)} to ${fmt(endAt)})`;

                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                            await navigator.share({ title, text, files: [file] });
                            return;
                        }

                        if (window.isSecureContext && navigator.share) {
                            await navigator.share({ title, text });
                            return;
                        }

                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = filename;
                        a.click();
                        URL.revokeObjectURL(url);
                    }
                    catch (err) {
                        if (err?.name !== 'AbortError') logger.warn('share failed:', err);         
                    }
                }
            }
        ]
    }).open();

/*    
    try {
        if (!navigator.share) {
            alert('navigator.share not supported (need HTTPS or newer iOS).');
            return;
        }

        // try file share first (iOS 16+/modern browsers)
        const blob = new Blob(['Hello from Pulse Pal 👋'], { type: 'text/plain' });
        const file = new File([blob], 'webshare-test.txt', { type: 'text/plain' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: 'Web Share Test',
                text: 'Sharing a tiny file via Web Share.',
                files: [file]
            });
            return;
        }

        // fallback: text-only share
        await navigator.share({
            title: 'Web Share Test',
            text: 'Web Share is working (text-only).'
        });
    }
    catch (err) {
        // user cancel is normal; ignore
        if (err?.name !== 'AbortError') console.warn('Web Share error:', err);
    }
*/
});

app.on(`lineChange[#${pp_history.prop.repeater}]`, (event, repeater, rowindex, item) => {
    const { dataindex: index } = item;

    app.dialog.confirm('This will remove the selected reading. Continue?', 'Confirm Remove', () => {
        updateBP(pp_history.prop, index);
    });
});

/**
 * Handler for back link
 */
$(document).on('click', pp_history.back_button, (e) => {
    e.preventDefault();

    prevPath(pp_history.bread_crumb);
    logger.success('back to start');
});

/**
 * Function displaying pp history
 */
export function ppHistoryRoute() { nextPath(pp_history.path); }
