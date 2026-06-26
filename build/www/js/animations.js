(function () {
    'use strict';

    /* ── Per-guid animation state ─────────────────────────────────────────── */
    var dvdStates  = {};
    var rageStates = {};
    var flyStates  = {};

    /* ── Helpers ──────────────────────────────────────────────────────────── */
    function getB(guid) {
        return window.bonzis && window.bonzis[guid];
    }

    /* ════════════════════════════════════════════════════════════════════════
       DVD BOUNCE
    ════════════════════════════════════════════════════════════════════════ */
    function startDVD(guid) {
        stopDVD(guid);
        var b = getB(guid);
        if (!b) return;

        var speed = 4 + Math.random() * 3;
        var angle = Math.random() * Math.PI * 2;
        var st = {
            x:  b.x,
            y:  b.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            interval: null
        };

        st.interval = setInterval(function () {
            var b = getB(guid);
            if (!b) { stopDVD(guid); return; }
            var c = b.maxCoords();

            st.x += st.vx;
            st.y += st.vy;

            if (st.x <= 0)   { st.x = 0;   st.vx =  Math.abs(st.vx); }
            if (st.x >= c.x) { st.x = c.x; st.vx = -Math.abs(st.vx); }
            if (st.y <= 0)   { st.y = 0;   st.vy =  Math.abs(st.vy); }
            if (st.y >= c.y) { st.y = c.y; st.vy = -Math.abs(st.vy); }

            b.move(st.x, st.y);
        }, 16);

        dvdStates[guid] = st;
    }

    function stopDVD(guid) {
        var st = dvdStates[guid];
        if (!st) return;
        clearInterval(st.interval);
        delete dvdStates[guid];
    }

    /* ════════════════════════════════════════════════════════════════════════
       RAGE
    ════════════════════════════════════════════════════════════════════════ */
    function startRage(guid) {
        stopRage(guid);
        var b = getB(guid);
        if (!b) return;

        var st = {
            origX: b.x,
            origY: b.y,
            interval: null
        };

        st.interval = setInterval(function () {
            var b = getB(guid);
            if (!b) { stopRage(guid); return; }
            var dx = (Math.random() - 0.5) * 24;
            var dy = (Math.random() - 0.5) * 24;
            b.move(st.origX + dx, st.origY + dy);
        }, 40);

        rageStates[guid] = st;
    }

    function stopRage(guid) {
        var st = rageStates[guid];
        if (!st) return;
        clearInterval(st.interval);
        var b = getB(guid);
        if (b) b.move(st.origX, st.origY);
        delete rageStates[guid];
    }

    /* ════════════════════════════════════════════════════════════════════════
       FLY
    ════════════════════════════════════════════════════════════════════════ */
    function startFly(guid) {
        stopFly(guid);
        var b = getB(guid);
        if (!b) return;

        var st = {
            x:    b.x,
            y:    b.y,
            tick: 0,
            interval: null
        };

        st.interval = setInterval(function () {
            var b = getB(guid);
            if (!b) { stopFly(guid); return; }
            var c = b.maxCoords();

            st.tick++;
            st.y -= 1.4;
            st.x += Math.sin(st.tick * 0.05) * 1.2;

            if (st.x < 0)   st.x = 0;
            if (st.x > c.x) st.x = c.x;

            if (st.y < -80) {
                st.y  = c.y + 40;
                st.x  = Math.random() * c.x;
                st.tick = 0;
            }

            b.move(st.x, st.y);
        }, 16);

        flyStates[guid] = st;
    }

    function stopFly(guid) {
        var st = flyStates[guid];
        if (!st) return;
        clearInterval(st.interval);
        delete flyStates[guid];
    }

    /* ════════════════════════════════════════════════════════════════════════
       NUKE / EXPLOSION
       Flings the bonzi off screen with physics + spin rotation.
    ════════════════════════════════════════════════════════════════════════ */
    var explodeStyle = [
        '@keyframes bonzi-boom {',
        '  0%   { transform:scale(0);   opacity:1; }',
        '  60%  { transform:scale(2.5); opacity:0.8; }',
        '  100% { transform:scale(4);   opacity:0; }',
        '}',
        '.bonzi-explosion {',
        '  position:fixed; pointer-events:none; z-index:99999;',
        '  width:80px; height:80px; margin-left:-40px; margin-top:-40px;',
        '  border-radius:50%;',
        '  background:radial-gradient(circle, #fff 0%, #ff9900 40%, #ff2200 70%, transparent 100%);',
        '  animation: bonzi-boom 0.7s ease-out forwards;',
        '}'
    ].join('\n');
    $('<style>').text(explodeStyle).appendTo('head');

    function explodeBonzi(guid) {
        var b = getB(guid);
        if (!b) return;

        /* Explosion burst at current screen position */
        var rect = b.$element[0].getBoundingClientRect();
        var cx = rect.left + rect.width  / 2;
        var cy = rect.top  + rect.height / 2;

        var burst = document.createElement('div');
        burst.className = 'bonzi-explosion';
        burst.style.left = cx + 'px';
        burst.style.top  = cy + 'px';
        document.body.appendChild(burst);
        setTimeout(function () { if (burst.parentNode) burst.remove(); }, 800);

        /* Sound */
        var sfx = new Audio('./explosion.mp3');
        sfx.volume = 0.6;
        sfx.play().catch(function () {});

        /* Physics — fling off screen with rotation */
        var vx    = (Math.random() * 12 + 6) * (Math.random() > 0.5 ? 1 : -1);
        var vy    = -(Math.random() * 15 + 10);
        var x     = b.x;
        var y     = b.y;
        var angle = 0;
        var spin  = (Math.random() * 12 + 8) * (vx > 0 ? 1 : -1); /* deg/frame */
        var frame = 0;

        var interval = setInterval(function () {
            b = getB(guid);
            if (!b) { clearInterval(interval); return; }

            vy    += 1.8; /* gravity */
            x     += vx;
            y     += vy;
            angle += spin;
            frame++;

            /* Bypass move() clamping — write directly to CSS with rotation */
            b.$element.css({
                marginLeft: x,
                marginTop:  y,
                transform:  'rotate(' + angle + 'deg)'
            });

            if (frame > 130) clearInterval(interval);
        }, 33);
    }

    /* ── Socket wiring ────────────────────────────────────────────────────── */
    $(document).ready(function () {
        var patchInterval = setInterval(function () {
            if (!window.socket || !window.bonzis) return;
            clearInterval(patchInterval);

            window.socket.on('dvdbounce', function (a) {
                if (a && a.guid) startDVD(a.guid);
            });

            window.socket.on('stopdvd', function (a) {
                if (a && a.guid) stopDVD(a.guid);
            });

            window.socket.on('rage', function (a) {
                if (a && a.guid) startRage(a.guid);
            });

            window.socket.on('stoprage', function (a) {
                if (a && a.guid) stopRage(a.guid);
            });

            window.socket.on('fly', function (a) {
                if (a && a.guid) startFly(a.guid);
            });

            window.socket.on('nuke', function (a) {
                if (a && a.guid) explodeBonzi(a.guid);
            });

            /* Clean up on leave */
            window.socket.on('leave', function (a) {
                if (!a || !a.guid) return;
                stopDVD(a.guid);
                stopRage(a.guid);
                stopFly(a.guid);
            });
        }, 50);
    });

})();
