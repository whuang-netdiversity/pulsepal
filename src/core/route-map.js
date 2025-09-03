// src/core/route-map.js
import { pp_detail, ppDetailsRoute } from '@/pages/pp_detail';
import { pp_history, ppHistoryRoute } from '@/pages/pp_history';

export const routeMap = {
    [pp_detail.key]: (params) => ppDetailsRoute(params),
    [pp_history.key]: () => ppHistoryRoute()
    // Add more as needed
};
