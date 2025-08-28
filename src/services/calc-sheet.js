// Pulse Pal — integer keypad sheet (Framework7)
// Mount with:   mountCalcSheet(app)
// Open with:    openCalc(target, { field: 'sys'|'dia'|'pulse', initial?: number,
// maxDigits?: number, title?: string })
//
// Behavior:
//  - Digits (0–9) build an integer up to maxDigits (default 3)
//  - Clear resets entry to 0
//  - SYS/DIA/PULSE: apply current entry to that field (keeps sheet open + highlights active field)
//  - Apply: apply to the current active field and CLOSE the sheet
//
// Requires:
//  - global $ = Dom7
//  - global app = Framework7 instance
//  - updateBP(sys, dia, pulse, target) util (uses -1 to "ignore" a field)

import { logger } from '@/app/log';
import { updateBP } from '@/app/ui';

let mounted = false;

const state = {
    ppCardEl: null,      // <pp-card> target element
    activeField: 'sys',  // 'sys' | 'dia' | 'pulse'
    valueStr: '0',       // current typed number as string
    maxDigits: 3
};

// ---------------- helpers ----------------

/**
 * Set display
 * @param {*} str 
 */
function setDisplay(str) {
    state.valueStr = (str || '0').replace(/[^\d]/g, '');
    if (state.valueStr === '') state.valueStr = '0';
    $('#ppkp-val').text(state.valueStr);
}

/**
 * Append digits
 * @param {*} d 
 * @returns 
 */
function appendDigit(d) {
    if (!/^\d$/.test(d)) return; // allow 0–9
    if (state.valueStr === '0') {
        state.valueStr = d; // replace leading 0
    }
    else {
        state.valueStr = (state.valueStr + d);
    }
    setDisplay(state.valueStr.slice(0, state.maxDigits));
}

/**
 * Default clear
 */
function clearEntry() { setDisplay('0'); }

/**
 * Default init * 
 * @returns 
 */
function toInt() {
    const n = parseInt(state.valueStr, 10);
    return Number.isFinite(n) ? n : 0;
}

/**
 * Set the active field
 * @param {*} f 
 */
function setActiveField(f) {
    state.activeField = (f === 'dia' || f === 'pulse') ? f : 'sys';
    $('.ppkp-field').removeClass('button-active');
    $(`.ppkp-field[data-field="${state.activeField}"]`).addClass('button-active');
}

/**
 * Apply value to field
 * @param {*} field 
 * @param {*} closeAfter 
 * @returns 
 */
function applyToField(field, closeAfter) {
    if (!state.ppCardEl) return;
    const n = toInt();

    // Build -1 mask for updateBP
    let s = -1, d = -1, p = -1;
    if (field === 'sys') s = n;
    if (field === 'dia') d = n;
    if (field === 'pulse') p = n;

    try {
        updateBP(s, d, p, state.ppCardEl);
    }
    catch (err) { logger.error(err); }

    // Mirror attributes on <pp-card> too
    if (field === 'sys') state.ppCardEl.setAttribute('sys', String(n));
    if (field === 'dia') state.ppCardEl.setAttribute('dia', String(n));
    if (field === 'pulse') state.ppCardEl.setAttribute('pulse', String(n));

    if (closeAfter) app.sheet.close('#pp-calc-sheet');
}

/**
 * Read field value
 * @param {*} el
 * @param {*} field
 * @returns 
 */
function readFieldValue(el, field) {
    if (!el) return 0;
    const raw = el.getAttribute(field);
    const v = parseInt(raw, 10);
    return Number.isFinite(v) ? v : 0;
}

/**
 * Handle key press
 * @param {*} k 
 * @returns 
 */
function handleKey(k) {
    switch (k) {
        case 'C':
            clearEntry();
            return;
        case 'APPLY':
            applyToField(state.activeField, true);
            return;
        case 'SYS':
            applyToField('sys', false);
            setActiveField('sys');
            return;
        case 'DIA':
            applyToField('dia', false);
            setActiveField('dia');
            return;
        case 'PULSE':
            applyToField('pulse', false);
            setActiveField('pulse');
            return;
        default:
            appendDigit(k); // digits 0–9
    }
}

/**
 * Always resolve to a <pp-card> root
 * @param {*} input 
 * @returns 
 */
function resolveCardEl(input) {
    if (!input) return document.querySelector('pp-card');
    let el = (typeof input === 'string') ? document.querySelector(input) : input;
    if (!el) return document.querySelector('pp-card');
    if (el.tagName !== 'PP-CARD') el = el.closest('pp-card');
    return el || document.querySelector('pp-card');
}

/**
 * Mount the calculator
 * @returns 
 */
export function mountCalcSheet() {
    if (mounted && document.querySelector('#pp-calc-sheet')) return;
    mounted = true;

    const html = `
    <div class="sheet-modal" id="pp-calc-sheet">
        <div class="toolbar">
        <div class="toolbar-inner">
            <div class="left">
            <span class="text-color-gray" id="ppkp-title">Enter Reading</span>
            </div>
            <div class="right">
            <a class="link sheet-close" id="ppkp-done">Close</a>
            </div>
        </div>
        </div>
        <div class="sheet-modal-inner">
        <div class="block no-padding">
            <div class="ppkp-display" id="ppkp-display">
            <span id="ppkp-val">0</span>
            </div>

            <!-- 4-column keypad -->
            <div class="ppkp-keypad grid">
            <!-- Row 1 -->
            <a class="button button-outline ppk" data-k="1">1</a>
            <a class="button button-outline ppk" data-k="2">2</a>
            <a class="button button-outline ppk" data-k="3">3</a>
            <a class="button button-fill color-blue ppk ppk-right" data-k="C">Clear</a>

            <!-- Row 2 -->
            <a class="button button-outline ppk" data-k="4">4</a>
            <a class="button button-outline ppk" data-k="5">5</a>
            <a class="button button-outline ppk" data-k="6">6</a>
            <a class="button button-outline ppk ppk-right ppkp-field" data-k="SYS" data-field="sys">SYS</a>

            <!-- Row 3 -->
            <a class="button button-outline ppk" data-k="7">7</a>
            <a class="button button-outline ppk" data-k="8">8</a>
            <a class="button button-outline ppk" data-k="9">9</a>
            <a class="button button-outline ppk ppk-right ppkp-field" data-k="DIA" data-field="dia">DIA</a>

            <!-- Row 4 -->
            <a class="button button-outline ppk" data-k="0">0</a>
            <a class="button button-fill color-green ppk ppk-apply" data-k="APPLY">Apply</a>
            <a class="button button-outline ppk ppk-right ppkp-field" data-k="PULSE" data-field="pulse">PULSE</a>
            </div>
        </div>
        </div>
    </div>`.trim();

    $(document.body).append(html);

    // Click handlers
    $(document).on('click', '#pp-calc-sheet .ppk', function (e) {
        e.preventDefault();
        const k = $(this).attr('data-k');
        handleKey(k);
    });

    // Close (no implicit apply)
    $(document).on('click', '#ppkp-done', function (e) {
        e.preventDefault();
        app.sheet.close('#pp-calc-sheet');
    });

    // Enter = APPLY
    $(document).on('keydown', '#pp-calc-sheet', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleKey('APPLY');
        }
    });

    // Defaults
    setDisplay('0');
    setActiveField('sys');
}

/**
 * Modal sheet for displaying calculator
 * @param {*} target 
 * @param {*} opts 
 * @returns 
 */
export function openCalc(target, opts = {}) {
    if (!mounted) mountCalcSheet();

    const el = resolveCardEl(target);
    if (!el) {
        console.warn('[pp-calc-sheet] openCalc: ppCardEl not found');
        return;
    }

    state.ppCardEl = el;
    state.maxDigits = Number.isFinite(opts.maxDigits) ? Math.max(1, opts.maxDigits) : 3;

    const field = (opts.field === 'dia' || opts.field === 'pulse') ? opts.field : 'sys';
    setActiveField(field);

    const title = opts.title || (field === 'sys' ? 'Enter Systolic'
        : field === 'dia' ? 'Enter Diastolic'
            : 'Enter Pulse');
    $('#ppkp-title').text(title);

    // Initial value from arg or card attribute
    const init = Number.isFinite(opts.initial) ? opts.initial : readFieldValue(el, field);
    setDisplay(String(init));

    // ---- IMPORTANT: Height guards so it never gets cut off ----
    const sheetEl = document.querySelector('#pp-calc-sheet');
    if (sheetEl) {
        sheetEl.style.height = 'auto';
        sheetEl.style.maxHeight = '75vh';
        const inner = sheetEl.querySelector('.sheet-modal-inner');
        if (inner) {
            inner.style.maxHeight = 'calc(75vh - var(--f7-toolbar-height, 44px))';
            inner.style.overflowY = 'auto';
            inner.style.paddingBottom = 'calc(12px + env(safe-area-inset-bottom))';
        }
    }

    app.sheet.open('#pp-calc-sheet');
}
