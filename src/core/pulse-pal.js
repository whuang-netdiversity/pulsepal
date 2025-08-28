// src/core/pulse-pal.js
import { interfaceMap } from '@/core/interface-map';
import { routeMap } from '@/core/route-map';
import { pp_detail } from '@/pages/pp_detail';

app.on('routePage', ({ key, params }) => {
    if (typeof routeMap[key] === 'function') {
        routeMap[key](params);
    }
});

app.on('interfacePage', ({ key, params }) => {
    if (typeof interfaceMap[key] === 'function') {
        interfaceMap[key](params);
    }
});

app.on('jsonRepeaterInitialized', ({ id: repeaterId }) => {
    if (repeaterId == pp_detail.prop.repeater) {
        app.emit('interfacePage', { key: pp_detail.prop.repeater, params: window.ecg });
    }
    else {
        app.emit('interfacePage', { key: repeaterId });
    }
});