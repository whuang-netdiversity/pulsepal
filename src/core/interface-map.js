// /src/core/interface-map.js
import { updateRepeater } from '@/app/ui';
import { pp_detail } from '@/pages/pp_detail';
import { updateClassification } from '@/app/ui';

export const interfaceMap = {
    [pp_detail.prop.repeater]: (params) => updateRepeater(pp_detail.prop,
        updateClassification(pp_detail.prop.repeater, params), true)
    // Add more as needed
};
