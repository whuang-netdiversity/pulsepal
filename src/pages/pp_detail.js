// src/pages/pp_detail.js
import { logger } from '@/app/log';
import { prevPath, nextPath } from '@/app/utils';
import { updateHealthBadgeAndRiskFrom } from '@/app/ui';

export const pp_detail = {
    key: 'detail-3774',
    path: '/pp_detail/',
    title: '#title-o-1082',
    back_button: '#o-1080',
    prop: {
        message: '#div-1181',
        repeater: 'repeater-1259',
        repeater_container: '#div-1246'
    },
    sys_reading: '#h1-1108',
    dia_reading: '#h1-1113',
    pulse_reading: '#h1-1116',
    bread_crumb: 1
};

window.ecg = {};

$(document).on('page:init', '.page[data-name="pp_detail"]', ({ detail: page }) => {
    const { route: { query } } = page;
    ecg = JSON.parse(query.data);

    $(pp_detail.title).text('Pulse Pal Detail');
    $(pp_detail.sys_reading).text(ecg.sys);
    $(pp_detail.dia_reading).text(ecg.dia);
    $(pp_detail.pulse_reading).text(ecg.pulse);
    updateHealthBadgeAndRiskFrom(ecg);

    $(pp_detail.back_button).removeClass('back');
    logger.info('pp detail page reloaded:', JSON.stringify(query));
});

/**
 * Handler for back link
 */
$(document).on('click', pp_detail.back_button, (e) => {
    e.preventDefault();

    prevPath(pp_detail.bread_crumb);
    logger.success('back to start');
});

/**
 * Function displaying pp detail
 * @param {object} item 
 */
export function ppDetailsRoute(item) { nextPath(pp_detail.path, { data: item }); }
