(function () {
    'use strict';

    /*
     * Lipsync for BonziWORLD
     * Phoneme frames : 344 – 350  (7 frames, mouth positions)
     * Shrug  frames  : 351 – 356  (6 frames, used during shrug animation)
     * NOT applied to crosscolor (URL-based) bonzis.
     *
     * Frame guide (approximate mouth shapes):
     *   344 – rest / silence
     *   345 – general consonants (d, g, k, l, n, r, t)
     *   346 – mid-open vowel  (e)
     *   347 – wide-open vowel (a, i, y)
     *   348 – rounded lips    (o, u)
     *   349 – teeth / fricative (f, s, v, z, th)
     *   350 – bilabial stop   (b, m, p, w)
     */

    var F = {
        rest:     344,
        cons:     345,
        midvowel: 346,
        widevowel:347,
        round:    348,
        teeth:    349,
        bilabial: 350
    };

    var SHRUG_START = 351;
    var SHRUG_END   = 356;

    /* ── Map a single character to a lipsync frame ───────────────────── */
    function charToFrame(ch) {
        ch = ch.toLowerCase();
        if ('bmpw'.indexOf(ch)  >= 0) return F.bilabial;
        if ('fsvz'.indexOf(ch)  >= 0) return F.teeth;
        if ('ao'.indexOf(ch)    >= 0) return F.widevowel;
        if ('iu'.indexOf(ch)    >= 0) return F.round;
        if ('e'.indexOf(ch)     >= 0) return F.midvowel;
        if (/[\s.,!?;:\-]/.test(ch)) return F.rest;
        return F.cons;
    }

    /* ── Convert a text string to a sequence of lipsync frames ──────── */
    function textToFrames(text) {
        var out = [];
        for (var i = 0; i < text.length; i++) {
            out.push(charToFrame(text[i]));
        }
        return out;
    }

    /* ── Guard: is this color a crosscolor URL? ──────────────────────── */
    function isCrossColor(color) {
        return typeof color === 'string' &&
               (color.indexOf('http://') === 0 || color.indexOf('https://') === 0);
    }

    /*
     * Find the EaselJS Sprite object on a bonzi.
     * The minified code renames properties, so we probe for the object
     * that has both gotoAndStop and currentFrame (EaselJS Sprite interface).
     */
    function getBonziSprite(b) {
        if (!b) return null;
        for (var key in b) {
            try {
                var v = b[key];
                if (v && typeof v === 'object' &&
                    typeof v.gotoAndStop === 'function' &&
                    typeof v.gotoAndPlay === 'function' &&
                    'currentFrame' in v) {
                    return v;
                }
            } catch (e) { /* skip non-enumerable */ }
        }
        return null;
    }

    /* ── Per-guid lipsync state ───────────────────────────────────────── */
    var active = {};   /* guid -> { frames, idx, advTimer, killTimer } */
    var tickerOn = false;

    function ensureTicker() {
        if (tickerOn || typeof createjs === 'undefined') return;
        tickerOn = true;
        createjs.Ticker.on('tick', function () {
            for (var guid in active) {
                var b = window.bonzis && window.bonzis[guid];
                if (!b) { stopLipsync(guid); continue; }
                if (isCrossColor(b.color)) { stopLipsync(guid); continue; }
                var sp = getBonziSprite(b);
                if (!sp) continue;
                var st = active[guid];
                if (st) {
                    try { sp.gotoAndStop(st.frames[st.idx]); } catch (e) {}
                }
            }
        });
    }

    function startLipsync(guid, frames, msPerFrame, totalMs) {
        stopLipsync(guid);
        ensureTicker();

        var st = { frames: frames, idx: 0, advTimer: null, killTimer: null };
        active[guid] = st;

        /* Advance through phoneme frames */
        st.advTimer = setInterval(function () {
            var s = active[guid];
            if (!s) return;
            s.idx = (s.idx + 1) % s.frames.length;
        }, msPerFrame);

        /* Stop after the estimated speech duration */
        st.killTimer = setTimeout(function () {
            stopLipsync(guid);
        }, totalMs + 300);
    }

    function stopLipsync(guid) {
        var st = active[guid];
        if (!st) return;
        clearInterval(st.advTimer);
        clearTimeout(st.killTimer);
        delete active[guid];

        var b = window.bonzis && window.bonzis[guid];
        if (b && !isCrossColor(b.color)) {
            var sp = getBonziSprite(b);
            if (sp) {
                try { sp.gotoAndPlay('idle'); } catch (e) {}
            }
        }
    }

    /* ── Preload new color sprite sheets not in script.min.js ───────────
     * yellow and pink need to be in BonziHandler.spriteSheets so the
     * engine can hand them to any bonzi that spawns with those colors.
     * We wait for BonziHandler to exist, then inject the sheets.
     * ─────────────────────────────────────────────────────────────────── */
    function preloadExtraColors() {
        var NEW_COLORS = ['yellow', 'pink'];
        var ready = setInterval(function () {
            if (!window.BonziHandler || !window.BonziData) return;
            clearInterval(ready);
            NEW_COLORS.forEach(function (c) {
                if (window.BonziHandler.spriteSheets[c]) return;
                var d = {
                    images: ['./img/bonzi/' + c + '.png'],
                    frames: window.BonziData.sprite.frames,
                    animations: window.BonziData.sprite.animations
                };
                window.BonziHandler.spriteSheets[c] = new createjs.SpriteSheet(d);
            });
        }, 50);
    }

    /* ── Socket wiring ───────────────────────────────────────────────── */
    $(document).ready(function () {
        preloadExtraColors();

        var patchInterval = setInterval(function () {
            if (!window.socket || !window.bonzis) return;
            clearInterval(patchInterval);

            window.socket.on('talk', function (data) {
                if (!data || !data.guid || !data.text) return;

                /* Stop any current lipsync immediately so the engine's idle-event
                   handler can find a valid currentAnimation and display the message */
                stopLipsync(data.guid);

                /* Brief delay so the bonzi begins its speech sequence first */
                setTimeout(function () {
                    var b = window.bonzis && window.bonzis[data.guid];
                    if (!b) return;
                    if (isCrossColor(b.color)) return;

                    /*
                     * Estimate speech duration.
                     * espeak "speed" is roughly words-per-minute.
                     * Average word ≈ 5 chars → ms per char = 12000 / speed.
                     */
                    var speed     = (b.userPublic && b.userPublic.speed) || 175;
                    var msPerChar = Math.max(35, 12000 / speed);
                    var frames    = textToFrames(data.text);
                    var totalMs   = Math.min(frames.length * msPerChar, 45000);

                    startLipsync(data.guid, frames, msPerChar, totalMs);
                }, 150);
            });

            /* Clean up when a user leaves */
            window.socket.on('leave', function (data) {
                if (data && data.guid) stopLipsync(data.guid);
            });
        }, 50);
    });

})();
