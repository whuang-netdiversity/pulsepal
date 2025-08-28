// src/core/route-map.js
import { pp_detail, ppDetailsRoute } from '@/pages/pp_detail';

export const routeMap = {
    [pp_detail.key]: (params) => ppDetailsRoute(params),
    // Add more as needed
};
