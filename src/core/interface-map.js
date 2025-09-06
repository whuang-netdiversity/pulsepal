// /src/core/interface-map.js
import { updateRepeater } from '@/app/ui';
import { pp_detail } from '@/pages/pp_detail';
import { updateClassification, updateHistory, updateSchedule } from '@/app/ui';
import { pp_history } from '@/pages/pp_history';
import { pp_schedule } from '@/pages/pp_schedule';

export const interfaceMap = {
    [pp_detail.prop.repeater]: (params) => updateRepeater(pp_detail.prop,
        updateClassification(pp_detail.prop.repeater, params), true),
    [pp_history.prop.repeater]: () => updateRepeater(pp_history.prop, updateHistory(), true),
    [pp_schedule.prop.repeater]: () => updateRepeater(pp_schedule.prop, updateSchedule(), true)
    // Add more as needed
};
