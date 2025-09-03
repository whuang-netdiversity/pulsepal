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
    logger.success('clicked');

    try {
        // 1) Prompt for date range (inline)
        const range = await new Promise((resolve) => {
            const html = `
                <div class="list no-hairlines no-hairlines-between">
                    <ul>
                        <li class="item-content item-input">
                            <div class="item-inner">
                                <div class="item-title item-label">Start date</div>
                                <div class="item-input-wrap">
                                    <input id="pp-start" type="date" />
                                </div>
                            </div>
                        </li>
                        <li class="item-content item-input">
                            <div class="item-inner">
                                <div class="item-title item-label">End date</div>
                                <div class="item-input-wrap">
                                    <input id="pp-end" type="date" />
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            `;
            app.dialog.create({
                title: 'Select Date Range',
                content: html,
                buttons: [
                    { text: 'Cancel', close: true, onClick: () => resolve(null) },
                    { text: 'OK', bold: true, close: true, onClick: () => {
                        const s = $('#pp-start').val();
                        const e = $('#pp-end').val();
                        resolve({ start: s || null, end: e || null });
                    } }
                ]
            }).open();
        });
        if (!range) return;

        // 2) Normalize dates (inclusive); mirror single-sided input to same day
        const toStart = d => { if (!d) return null; const x = new Date(d); x.setHours(0,0,0,0); return x; };
        const toEnd   = d => { if (!d) return null; const x = new Date(d); x.setHours(23,59,59,999); return x; };
        let startAt = range.start ? toStart(range.start) : null;
        let endAt   = range.end   ? toEnd(range.end)     : null;
        if (!startAt && endAt) startAt = toStart(endAt);
        if (!endAt && startAt) endAt   = toEnd(startAt);
        if (startAt && endAt && startAt > endAt) {
            logger.warn('Start date must be before end date');
            return;
        }

        // 3) Build CSV (RFC 4180 escaping + UTF-8 BOM + CRLF)
        const E = v => {
            const s = String(v ?? '');
            return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const fmtDate = d => d ? d.toISOString().slice(0,10) : 'all';
        const filename = `pulsepal-history-${fmtDate(startAt)}_${fmtDate(endAt)}.csv`;

        const lines = [];
        lines.push(['date','sys','dia','pulse'].map(E).join(','));

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
                lines.push([r.date, sys, dia, pulse].map(E).join(','));
            });

        if (lines.length === 1) {
            logger.info('No readings in that range');
            return;
        }

        const csv = '\uFEFF' + lines.join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });

        // 4) Try system share SHEET with FILE (preferred)
        const file = new File([blob], filename, { type: 'text/csv' });
        const title = 'Pulse Pal — BP History';
        const textSummary = `${title} (${fmtDate(startAt)} to ${fmtDate(endAt)})`;

        if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
            try {
                await navigator.share({ title, text: textSummary, files: [file] });
                logger.success('Shared via system share sheet.');
                return;
            }
            catch (err) {
                // If user cancels share, just exit silently
                if (err && err.name === 'AbortError') return;
                logger.warn('File share failed, attempting text share…', err);
            }
        }

        // 5) Fallback: text-only share (no file) if available
        if (navigator.share) {
            try {
                await navigator.share({ title, text: textSummary });
                logger.success('Shared summary text via system share sheet.');
                return;
            }
            catch (err) {
                if (err && err.name === 'AbortError') return;
                logger.warn('Text share failed, falling back to download…', err);
            }
        }

        // 6) Last resort: download the CSV
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        logger.success(`Downloaded ${filename}`);
    }
    catch (err) {
        logger.error('Share/export failed', err);
    }
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
