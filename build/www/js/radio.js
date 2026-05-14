(function () {
    'use strict';

    var RADIO_GUID = 'bonziradio-000';

    /* ── Radio SVG avatar ─────────────────────────────────────────────────── */
    var RADIO_SVG = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 100" width="68" height="100">',
        /* antenna */
        '<line x1="46" y1="2" x2="54" y2="28" stroke="#aaa" stroke-width="2.5" stroke-linecap="round"/>',
        /* body */
        '<rect x="2" y="26" width="64" height="70" rx="8" fill="#1a1a2e" stroke="#4444aa" stroke-width="1.5"/>',
        /* display */
        '<rect x="7" y="31" width="54" height="20" rx="4" fill="#0a1f0f"/>',
        '<text x="34" y="39" text-anchor="middle" fill="#00ff88" font-size="5.5" font-family="monospace" font-weight="bold">BonziRADIO</text>',
        '<text x="34" y="47" text-anchor="middle" fill="#00cc66" font-size="4.5" font-family="monospace">ABS-CBN NEWS</text>',
        /* speaker grille */
        '<rect x="7" y="56" width="36" height="33" rx="3" fill="#0d0d1a" stroke="#333" stroke-width="1"/>',
        /* speaker dots — 4x4 grid */
        '<circle cx="14" cy="63" r="2" fill="#2a2a4a"/>',
        '<circle cx="21" cy="63" r="2" fill="#2a2a4a"/>',
        '<circle cx="28" cy="63" r="2" fill="#2a2a4a"/>',
        '<circle cx="35" cy="63" r="2" fill="#2a2a4a"/>',
        '<circle cx="14" cy="70" r="2" fill="#2a2a4a"/>',
        '<circle cx="21" cy="70" r="2" fill="#2a2a4a"/>',
        '<circle cx="28" cy="70" r="2" fill="#2a2a4a"/>',
        '<circle cx="35" cy="70" r="2" fill="#2a2a4a"/>',
        '<circle cx="14" cy="77" r="2" fill="#2a2a4a"/>',
        '<circle cx="21" cy="77" r="2" fill="#2a2a4a"/>',
        '<circle cx="28" cy="77" r="2" fill="#2a2a4a"/>',
        '<circle cx="35" cy="77" r="2" fill="#2a2a4a"/>',
        '<circle cx="14" cy="84" r="2" fill="#2a2a4a"/>',
        '<circle cx="21" cy="84" r="2" fill="#2a2a4a"/>',
        '<circle cx="28" cy="84" r="2" fill="#2a2a4a"/>',
        '<circle cx="35" cy="84" r="2" fill="#2a2a4a"/>',
        /* power button (red) */
        '<circle cx="52" cy="63" r="7" fill="#cc0000" stroke="#ff4444" stroke-width="1"/>',
        '<text x="52" y="67" text-anchor="middle" fill="#fff" font-size="9" font-family="sans-serif">&#9654;</text>',
        /* volume knob */
        '<circle cx="52" cy="79" r="7" fill="#334" stroke="#556" stroke-width="1"/>',
        '<line x1="52" y1="79" x2="52" y2="73" stroke="#99aaff" stroke-width="1.5" stroke-linecap="round"/>',
        /* tuning dial */
        '<rect x="7" y="92" width="54" height="1.5" rx="1" fill="#334"/>',
        '<circle cx="28" cy="92" r="3" fill="#4466ff"/>',
        '</svg>'
    ].join('');

    /* ── CSS ──────────────────────────────────────────────────────────────── */
    var style = document.createElement('style');
    style.textContent = [
        /* Radio avatar inside the bonzi container */
        '.radio_avatar {',
        '  display:inline-block; cursor:default;',
        '  filter: drop-shadow(0 2px 6px rgba(0,100,255,.4));',
        '}',
        /* Radio player widget (fixed top-right) */
        '#bonziradio_widget {',
        '  position:fixed; top:48px; right:10px; z-index:9990;',
        '  width:220px; background:#0d0d1e;',
        '  border:2px solid #4444aa; border-radius:10px;',
        '  box-shadow:0 0 18px rgba(0,80,255,.35);',
        '  font-family:"Segoe UI",Arial,sans-serif; color:#fff;',
        '  user-select:none;',
        '}',
        '#bonziradio_header {',
        '  background:#1a1a3a; border-radius:8px 8px 0 0;',
        '  padding:7px 10px; display:flex; align-items:center; gap:8px;',
        '  border-bottom:1px solid #333;',
        '}',
        '#bonziradio_logo { font-size:20px; }',
        '#bonziradio_title { font-size:13px; font-weight:700; color:#99aaff; letter-spacing:1px; }',
        '#bonziradio_station { font-size:9px; color:#667; letter-spacing:1px; }',
        '#bonziradio_body { padding:8px 10px 10px; }',
        '#bonziradio_display {',
        '  background:#0a1f0f; border-radius:5px; padding:5px 8px;',
        '  margin-bottom:8px; text-align:center; border:1px solid #1a4a2a;',
        '}',
        '#bonziradio_now {',
        '  font-size:9px; color:#00cc66; letter-spacing:2px; text-transform:uppercase;',
        '}',
        '#bonziradio_song {',
        '  font-size:11px; color:#00ff88; font-weight:700;',
        '  white-space:nowrap; overflow:hidden;',
        '  animation: radio_scroll 8s linear infinite;',
        '}',
        '@keyframes radio_scroll {',
        '  0%,20%  { transform: translateX(0); }',
        '  80%,100%{ transform: translateX(-60%); }',
        '}',
        '#bonziradio_controls {',
        '  display:flex; align-items:center; gap:8px;',
        '}',
        '#bonziradio_play {',
        '  background:#cc0000; border:none; border-radius:50%;',
        '  width:34px; height:34px; cursor:pointer; font-size:14px;',
        '  color:#fff; display:flex; align-items:center; justify-content:center;',
        '  flex-shrink:0; transition:background .15s;',
        '}',
        '#bonziradio_play:hover { background:#ff2200; }',
        '#bonziradio_vol_wrap { flex:1; display:flex; flex-direction:column; gap:3px; }',
        '#bonziradio_vol_label { font-size:9px; color:#667; }',
        '#bonziradio_vol {',
        '  width:100%; accent-color:#4466ff;',
        '  cursor:pointer;',
        '}',
        '#bonziradio_status {',
        '  font-size:9px; color:#667; margin-top:6px; text-align:center;',
        '}',
        '#bonziradio_status.live { color:#00cc66; }',
        '#bonziradio_status.err  { color:#cc4444; }',
        /* Alert flash when flood/tsunami */
        '#bonziradio_widget.radio_alert {',
        '  border-color:#cc0000;',
        '  box-shadow:0 0 22px rgba(255,0,0,.6);',
        '  animation: radio_alert_flash .5s steps(1) infinite;',
        '}',
        '@keyframes radio_alert_flash {',
        '  0%,100%{ border-color:#cc0000; } 50%{ border-color:#ff4400; }',
        '}'
    ].join('\n');
    document.head.appendChild(style);

    /* ── Build widget HTML ─────────────────────────────────────────────────── */
    function buildWidget() {
        if (document.getElementById('bonziradio_widget')) return;
        var el = document.createElement('div');
        el.id = 'bonziradio_widget';
        el.innerHTML = [
            '<div id="bonziradio_header">',
            '  <span id="bonziradio_logo">📻</span>',
            '  <div>',
            '    <div id="bonziradio_title">BonziRADIO</div>',
            '    <div id="bonziradio_station">ABS-CBN NEWS RADIO</div>',
            '  </div>',
            '</div>',
            '<div id="bonziradio_body">',
            '  <div id="bonziradio_display">',
            '    <div id="bonziradio_now">NOW PLAYING</div>',
            '    <div id="bonziradio_song">ABS-CBN News Radio — Live Stream</div>',
            '  </div>',
            '  <div id="bonziradio_controls">',
            '    <button id="bonziradio_play" title="Play / Stop">&#9654;</button>',
            '    <div id="bonziradio_vol_wrap">',
            '      <div id="bonziradio_vol_label">Volume</div>',
            '      <input id="bonziradio_vol" type="range" min="0" max="100" value="70" />',
            '    </div>',
            '  </div>',
            '  <div id="bonziradio_status">Click ▶ to tune in</div>',
            '</div>'
        ].join('');
        document.body.appendChild(el);
        initPlayer();
    }

    /* ── HLS / Audio player ────────────────────────────────────────────────── */
    var audio = null;
    var hls   = null;
    var playing = false;

    var STREAM_URL = 'https://d2xt9lxb22dxne.cloudfront.net/abscbnradio/primary.m3u8';

    function setStatus(msg, cls) {
        var el = document.getElementById('bonziradio_status');
        if (!el) return;
        el.textContent = msg;
        el.className = cls || '';
    }

    function setPlayBtn(isPlaying) {
        var btn = document.getElementById('bonziradio_play');
        if (btn) btn.innerHTML = isPlaying ? '&#9646;&#9646;' : '&#9654;';
    }

    function initPlayer() {
        audio = new Audio();
        audio.volume = 0.7;

        audio.addEventListener('playing', function () {
            playing = true;
            setPlayBtn(true);
            setStatus('● LIVE — ABS-CBN News Radio', 'live');
        });
        audio.addEventListener('waiting', function () {
            setStatus('Buffering…');
        });
        audio.addEventListener('error', function () {
            setStatus('Stream unavailable', 'err');
            playing = false;
            setPlayBtn(false);
        });
        audio.addEventListener('ended', function () {
            playing = false;
            setPlayBtn(false);
            setStatus('Stream ended');
        });

        document.getElementById('bonziradio_vol').addEventListener('input', function () {
            if (audio) audio.volume = parseInt(this.value) / 100;
        });

        document.getElementById('bonziradio_play').addEventListener('click', function () {
            if (playing) {
                stopStream();
            } else {
                startStream();
            }
        });
    }

    function startStream() {
        if (!audio) return;

        /* Try native HLS first (Safari), then HLS.js */
        if (audio.canPlayType('application/vnd.apple.mpegurl')) {
            audio.src = STREAM_URL;
            audio.play().catch(function () { setStatus('Playback blocked by browser', 'err'); });
        } else if (window.Hls && window.Hls.isSupported()) {
            if (hls) { hls.destroy(); }
            hls = new window.Hls({ enableWorker: false });
            hls.loadSource(STREAM_URL);
            hls.attachMedia(audio);
            hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                audio.play().catch(function () { setStatus('Playback blocked by browser', 'err'); });
            });
            hls.on(window.Hls.Events.ERROR, function (e, d) {
                if (d.fatal) setStatus('Stream error', 'err');
            });
        } else {
            /* Fallback: try direct src */
            audio.src = STREAM_URL;
            audio.play().catch(function () { setStatus('HLS not supported in this browser', 'err'); });
        }
        setStatus('Connecting…');
    }

    function stopStream() {
        if (hls) { hls.destroy(); hls = null; }
        if (audio) { audio.pause(); audio.src = ''; }
        playing = false;
        setPlayBtn(false);
        setStatus('Stopped');
    }

    /* ── Patch radio bonzi visual ──────────────────────────────────────────── */
    function patchRadioBonzi() {
        var b = window.bonzis && window.bonzis[RADIO_GUID];
        if (!b || b.$el.find('.radio_avatar').length) return;
        /* hide the sprite canvas, show our SVG */
        b.$el.find('canvas').hide();
        b.$el.append('<div class="radio_avatar">' + RADIO_SVG + '</div>');
    }

    /* ── Alert flash on the widget ────────────────────────────────────────── */
    var alertFlashTimer = null;
    function flashAlert() {
        var w = document.getElementById('bonziradio_widget');
        if (!w) return;
        w.classList.add('radio_alert');
        clearTimeout(alertFlashTimer);
        alertFlashTimer = setTimeout(function () {
            w.classList.remove('radio_alert');
        }, 18000);
    }

    /* ── Socket wiring ────────────────────────────────────────────────────── */
    $(document).ready(function () {
        var patchInterval = setInterval(function () {
            if (!window.socket || !window.bonzis) return;
            clearInterval(patchInterval);

            buildWidget();

            /* When radio bot appears, patch its visual */
            window.socket.on('update', function (data) {
                if (data.guid !== RADIO_GUID) return;
                /* Wait a tick for the bonzi to be created by script.min.js */
                setTimeout(patchRadioBonzi, 300);
            });

            /* Re-patch on every tick in case bonzi resets its canvas */
            setInterval(function () {
                if (window.bonzis && window.bonzis[RADIO_GUID]) {
                    patchRadioBonzi();
                }
            }, 1000);

            /* Flash widget + highlight chatlog on radio bot's talk events */
            window.socket.on('talk', function (data) {
                if (data.guid !== RADIO_GUID) return;
                flashAlert();
                /* Update the marquee display text */
                var song = document.getElementById('bonziradio_song');
                if (song) song.textContent = data.text;
            });

            /* Flash on flood/tsunami */
            window.socket.on('flood',   flashAlert);
            window.socket.on('tsunami', flashAlert);
        }, 50);
    });

})();
