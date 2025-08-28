// src/app/helpers.js
/**
 * Extracts form data as a JSON object
 * @param {HTMLFormElement} form
 * @returns {object}
 */
export const getForm = (form) => {
    const json = {};
    const elements = form.elements;

    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (!el.name) continue;

        if (el.type === 'checkbox') {
            json[el.name] = el.checked; // ✅ this is the fix
        }
        else if (el.type === 'radio') {
            if (el.checked) {
                json[el.name] = el.value;
            }
            // Do nothing if not checked (avoids overwriting with undefined)
        }        
        else {
            json[el.name] = el.value;
        }
    }

    return json;
};

/**
 * Sorts an array of objects by a specified key
 * @param {string} key
 * @param {Array<object>} data
 * @returns {Array<object>}
 */
export const sortBy = (key, data) => {
    return data.sort((a, b) => {
        if (a[key] < b[key]) return -1;
        if (a[key] > b[key]) return 1;
        return 0;
    });
};

/**
 * Generates a random number between a minimum and maximum value (inclusive).
 * @private
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

/**
 * Generates a random decimal string of a specified length
 * @param {number} size
 * @returns {string}
 */
export const numGen = (size) => Array.from({ length: size }, () => random(0, 9).toString(10)).join('');

/**
 * Generates a random hexadecimal string of a specified length
 * @param {number} size
 * @returns {string}
 */
export const hexGen = (size) => Array.from({ length: size }, () => random(0, 15).toString(16)).join('');

/**
 * Constructs a URL with optional query parameters and an API key
 * @param {string} base
 * @param {string|null} key
 * @param {object|null} props
 * @returns {string}
 */
export const baseUrl = (base, key = null, props = null) => {
    let query = key === null ? base : base + '?' + 'api_key=' + encodeURIComponent(key);
    let cnt = key === null ? 0 : 1;

    if (props && typeof props === 'object') {
        for (const prop in props) {
            const token = cnt === 0 ? '?' : '&';
            let value = props[prop];

            // Convert objects to JSON, null/undefined to empty string, others to string
            if (value && typeof value === 'object') {
                value = JSON.stringify(value);
            }
            else if (value == null) {
                value = '';
            }

            query += token + encodeURIComponent(prop) + '=' + encodeURIComponent(value);
            cnt++;
        }
    }

    return query;
};

/**
 * Fetches JSON data from a given URL
 * @param {string} path
 * @returns {Promise<object>}
 */
export const getSource = async (path) => {
    const resp = await fetch(path);
    return resp.json();
};

/**
 * Returns a serialized object
 * @param {object} data 
 * @returns {object}
 */
export const serialize = (data) => {
    return JSON.parse(JSON.stringify(data));
};

/**
 * Returns a hashtable from a collection
 * @param {Array} collection 
 * @param {string} idKey 
 * @returns {object}
 */
export const getLookup = (collection, idKey = 'id') => {
    return Object.fromEntries(
        collection.map(item => [item[idKey], item])
    );
};

export const getLocalISODateOffset = (offset = 0) => {
    const base = new Date();
    base.setDate(base.getDate() + offset);
    return getLocalISODate(base);
};

export const getLocalISODate = (date = new Date()) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - tzOffset);
    return localDate.toISOString().slice(0, 10);
};

export const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getLocalTimestamp = (date = new Date()) => {
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }); // e.g., "Aug 19, 2025, 6:42 PM"
};
