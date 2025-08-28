// src/components/pp-card.js
class PPCard extends HTMLElement {
    static get observedAttributes() {
        return [
            'sys', 'dia', 'pulse',
            'pulse-row', 'ecg-speed',
            'sys-x', 'sys-y', 'dia-x', 'dia-y', 'pulse-x', 'pulse-y'
        ];
    }

    connectedCallback() { this.render(); }

    attributeChangedCallback(name, _oldVal, newVal) {
        if (!this.isConnected) return;

        // Re-render for structural/timing/position changes
        if ([
            'pulse-row', 'ecg-speed',
            'sys-x', 'sys-y', 'dia-x', 'dia-y', 'pulse-x', 'pulse-y'
        ].includes(name)) {
            this.render();
            return;
        }

        // Live value updates
        if (name === 'sys') this.updateValue('sys', newVal ?? '');
        if (name === 'dia') this.updateValue('dia', newVal ?? '');
        if (name === 'pulse') {
            this.updateValue('pulse', newVal ?? '');
            const wrap = this.querySelector('.pp-ecg-wrap');
            if (wrap && !this.getAttribute('ecg-speed')) {
                wrap.style.setProperty('--pp-ecg-speed', this.speedFromPulse(newVal));
                this.updateMarkerTiming();
            }
        }

        // Re-evaluate colors whenever any vital changed
        if (name === 'sys' || name === 'dia' || name === 'pulse') {
            this.applyBadgeColors();
        }
    }

    // ---- Speed mapping (pulse → sweep) ----
    speedFromPulse(pulseAttr) {
        const bpm = Number(pulseAttr);
        if (!Number.isFinite(bpm) || bpm <= 0) return '2.6s';
        const beatsPerSweep = 2; // higher = slower sweep
        const secondsPerBeat = 60 / bpm;
        const secondsPerSweep = secondsPerBeat * beatsPerSweep;
        const clamped = Math.max(1.5, Math.min(8.0, secondsPerSweep));
        return `${clamped.toFixed(2)}s`;
    }

    parseSeconds(s) {
        if (!s) return 2.6;
        const m = String(s).trim().match(/^([\d.]+)\s*s$/i);
        return m ? Math.max(0.2, Number(m[1])) : 2.6;
    }

    // ---- Timing for marker opacity relative to sweep ----
    updateMarkerTiming() {
        const wrap = this.querySelector('.pp-ecg-wrap');
        if (!wrap) return;
        const durStr = getComputedStyle(wrap).getPropertyValue('--pp-ecg-speed').trim() || '2.6s';
        const dur = this.parseSeconds(durStr);

        const setDelay = (sel, xPct) => {
            const el = this.querySelector(sel);
            if (!el) return;
            const preroll = 0.06; // 6% pre-roll
            let delay = dur * ((xPct / 100) - preroll);
            while (delay < 0) delay += dur;
            el.style.animationDelay = `${delay}s`;
        };

        const sysX = Number(this.getAttribute('sys-x')) || 40;
        const diaX = Number(this.getAttribute('dia-x')) || 78;
        const pulseX = Number(this.getAttribute('pulse-x')) || 20;

        setDelay('.pp-ecg-marker[data-kind="sys"]', sysX);
        setDelay('.pp-ecg-marker[data-kind="dia"]', diaX);
        setDelay('.pp-ecg-marker[data-kind="pulse"]', pulseX);
    }

    // ---- Classification helpers ----
    // BP scheme you asked for:
    // normal (bright green) <120/<80
    // elevated (dark green): 120–129 and <80
    // stage1 (yellow): 130–139 or 80–89
    // stage2 (orange): >=140 or >=90
    // crisis (red): >=180 or >=120
    classifyBP(sys, dia) {
        const s = Number(sys), d = Number(dia);
        if (!Number.isFinite(s) || !Number.isFinite(d)) return 'neutral';

        if (s >= 180 || d >= 120) return 'crisis';
        if (s >= 140 || d >= 90) return 'stage2';
        if (s >= 130 || d > 80) return 'stage1';
        if (s >= 120 && s <= 129 && d <= 80) return 'elevated';

        return 'normal';
    }

    // Pulse: map to same variant names so CSS matches
    // normal: 60–100, stage1 (yellow): 50–59 or 101–120, crisis (red): <50 or >120
    classifyPulse(pulse) {
        const p = Number(pulse);
        if (!Number.isFinite(p)) return 'neutral';
        if (p < 50 || p > 120) return 'crisis';
        if ((p >= 50 && p < 60) || (p > 100 && p <= 120)) return 'stage1';
        return 'normal';
    }

    applyBadgeColors() {
        const sys = this.getAttribute('sys');
        const dia = this.getAttribute('dia');
        const pulse = this.getAttribute('pulse');

        const bpVariant = this.classifyBP(sys, dia);
        const pVariant = this.classifyPulse(pulse);

        const sysMk = this.querySelector('.pp-ecg-marker[data-kind="sys"]');
        const diaMk = this.querySelector('.pp-ecg-marker[data-kind="dia"]');
        const pulMk = this.querySelector('.pp-ecg-marker[data-kind="pulse"]');

        const variants = ['normal', 'elevated', 'stage1', 'stage2', 'crisis', 'neutral'];
        const setVariant = (el, v) => {
            if (!el) return;
            variants.forEach(k => el.classList.remove(k));
            el.classList.add(v);
        };

        setVariant(sysMk, bpVariant);
        setVariant(diaMk, bpVariant);
        setVariant(pulMk, pVariant);
    }

    // ---- Render ----
    render() {
        const sys = this.getAttribute('sys') ?? '118';
        const dia = this.getAttribute('dia') ?? '78';
        const pulse = this.getAttribute('pulse') ?? '62';
        const showPulse = (this.getAttribute('pulse-row') ?? 'true') !== 'false';
        const ecgSpeed = this.getAttribute('ecg-speed') || this.speedFromPulse(pulse);

        const sysX = Number(this.getAttribute('sys-x')) || 40;
        const sysY = Number(this.getAttribute('sys-y')) || 6;
        const diaX = Number(this.getAttribute('dia-x')) || 78;
        const diaY = Number(this.getAttribute('dia-y')) || 18;
        const pulseX = Number(this.getAttribute('pulse-x')) || 20;
        const pulseY = Number(this.getAttribute('pulse-y')) || 10;

        const ecgStyles = `
        <style>
            .pp-ecg-sweep { margin: 10px 0 8px; }
            .pp-ecg-wrap {
                --pp-ecg-speed: ${ecgSpeed};
                --pp-ecg-cursor-w: 2px;
                position: relative; width: 100%; height: 56px;
                border-radius: 10px; background: #0b0f12;
                border: 1px solid rgba(255,255,255,.05); overflow: hidden;
            }
            .pp-ecg { display:block; width:100%; height:100%; color:#ff3b3b; }

            .pp-ecg .trace-bg {
                fill:none; stroke: rgba(255,59,59,0.20); stroke-width: 2.5;
                stroke-linecap: butt; stroke-linejoin: round; vector-effect: non-scaling-stroke;
            }
            .pp-ecg .trace {
                fill:none; stroke: currentColor; stroke-width: 2.5;
                stroke-linecap: butt; stroke-linejoin: round; vector-effect: non-scaling-stroke;
                stroke-dasharray: 100; stroke-dashoffset: 100;
                animation: pp-ecg-reveal var(--pp-ecg-speed) linear infinite;
                filter: drop-shadow(0 0 6px rgba(255,59,59,.35));
                will-change: stroke-dashoffset;
            }
            .pp-ecg-cursor {
                position:absolute; top:0; bottom:0; left:0;
                width:var(--pp-ecg-cursor-w); background:#ff3b3b;
                box-shadow:0 0 8px rgba(255,59,59,.65);
                transform:translateX(0%); transform-origin:left center;
                animation: pp-ecg-cursor-move var(--pp-ecg-speed) linear infinite;
                will-change: transform;
            }

            /* Marker base (opacity animation unchanged) */
            .pp-ecg-marker {
                position: absolute;
                transform: translate(-50%, 0);
                padding: 2px 8px;
                border-radius: 8px;
                font-weight: 800;
                font-size: 1.0rem;
                line-height: 1.05;
                color: #0b0f12;
                background: #ff3b3b;
                box-shadow: 0 2px 8px rgba(255,59,59,.35);
                border: 1px solid rgba(255,255,255,.14);
                opacity: 0;
                animation: pp-ecg-marker-breathe var(--pp-ecg-speed) linear infinite;
                pointer-events: none; white-space: nowrap;
            }
            .pp-ecg-marker .unit { margin-left: 4px; font-weight: 700; opacity: .9; }

            /* Variants (match these class names in JS) */
            .pp-ecg-marker.normal   { background:#25ff5a; color:#0b0f12; }
            .pp-ecg-marker.elevated { background:#138a42; color:#ffffff; }
            .pp-ecg-marker.stage1   { background:#ffd633; color:#0b0f12; }
            .pp-ecg-marker.stage2   { background:#ff8c1a; color:#ffffff; }
            .pp-ecg-marker.crisis   { background:#e63946; color:#ffffff; }
            .pp-ecg-marker.neutral  { background:#a9b3ba; color:#0b0f12; }

            @keyframes pp-ecg-reveal {
                0%   { stroke-dashoffset: 100; }
                99.9%{ stroke-dashoffset: 0; }
                100% { stroke-dashoffset: 100; }
            }
            @keyframes pp-ecg-cursor-move {
                0%   { transform: translateX(0%); }
                99.9%{ transform: translateX(calc(100% - var(--pp-ecg-cursor-w))); }
                100% { transform: translateX(0%); }
            }
            /* Opacity cycle */
            @keyframes pp-ecg-marker-breathe {
                0%   { opacity: 0; transform: translate(-50%, 0) scale(0.98); }
                6%   { opacity: 0; }
                12%  { opacity: 1; transform: translate(-50%, 0) scale(1.02); }
                60%  { opacity: 0.85; }
                100% { opacity: 0; transform: translate(-50%, 0) scale(0.98); }
            }
        </style>
        `;

        this.innerHTML = `
            ${ecgStyles}
            <div class="card card-rounded pp-bezel-card">

                <!-- User Actions (capture reading) -->
                <div class="pp-capture">
                    <a id="btn-capture-reading" class="button button-fill pp-btn">
                        <i class="f7-icons">camera_fill</i> Scan BP From Camera
                    </a>
                    <!-- Web fallback (desktop / PWA without Camera plugin) -->
                    <input id="input-bp-photo" type="file" accept="image/*" capture="environment" hidden>
                </div>

                <div class="card-content">
                <div class="pp-bezel">
                    <div class="pp-screen">
                    <div class="pp-row sys-touch">
                        <div class="pp-label">
                        <span class="pp-label-main">SYS</span>
                        <span class="pp-label-unit">mmHg</span>
                        </div>
                        <div class="pp-value" data-field="sys">${sys}</div>
                    </div>
                    <div class="pp-row dia-touch">
                        <div class="pp-label">
                        <span class="pp-label-main">DIA</span>
                        <span class="pp-label-unit">mmHg</span>
                        </div>
                        <div class="pp-value" data-field="dia">${dia}</div>
                    </div>
                    ${showPulse ? `
                    <div class="pp-row pulse-touch" data-row="pulse">
                        <div class="pp-label">
                        <span class="pp-label-main">PULSE</span>
                        <span class="pp-label-unit">bpm</span>
                        </div>
                        <div class="pp-value" data-field="pulse">${pulse}</div>
                    </div>` : ``}
                    </div>
                </div>

                <!-- ECG sweep (full card width) -->
                <div class="pp-ecg-sweep">
                    <div class="pp-ecg-wrap detail-touch">
                    <svg class="pp-ecg" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true">
                        <path class="trace-bg"
                        d="M0,26 L10,26 L14,26 L16,20 L18,34 L20,18 L22,26 L35,26 L39,26 L41,12 L44,32 L47,26 L120,26"
                        />
                        <path class="trace" pathLength="100"
                        d="M0,26 L10,26 L14,26 L16,20 L18,34 L20,18 L22,26 L35,26 L39,26 L41,12 L44,32 L47,26 L120,26"
                        />
                    </svg>
                    <div class="pp-ecg-cursor" aria-hidden="true"></div>

                    <!-- Markers -->
                    <div class="pp-ecg-marker" data-kind="sys"   style="left:${sysX}%;   top:${sysY}px;">
                        ${sys}<span class="unit">mmHg</span>
                    </div>
                    <div class="pp-ecg-marker" data-kind="dia"   style="left:${diaX}%;   top:${diaY}px;">
                        ${dia}<span class="unit">mmHg</span>
                    </div>
                    <div class="pp-ecg-marker" data-kind="pulse" style="left:${pulseX}%; top:${pulseY}px;">
                        ${pulse}<span class="unit">bpm</span>
                    </div>
                    </div>
                </div>

                <!-- User Actions (store readings) -->
                <div class="pp-actions">
                    <a id="btn-add-reading" class="button button-fill pp-btn">Add Reading</a>
                    <a id="btn-view-reading" class="button pp-btn pp-btn-secondary">View Readings</a>
                </div>

                </div>
            </div>
        `;

        this.updateMarkerTiming();
        this.applyBadgeColors();
    }

    updateValue(field, value) {
        const el = this.querySelector(`.pp-value[data-field="${field}"]`);
        if (el) el.textContent = value;

        const mk = this.querySelector(`.pp-ecg-marker[data-kind="${field}"]`);
        if (mk) {
            const unit = field === 'pulse' ? 'bpm' : 'mmHg';
            mk.innerHTML = `${value}<span class="unit">${unit}</span>`;
        }
    }
}

customElements.define('pp-card', PPCard);