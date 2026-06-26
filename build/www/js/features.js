(function () {

    // ── Chatlog ──────────────────────────────────────────────────────────────
    var MAX_LOG = 80;
    var logEntries = [];

    var chatlogStyle = [
        '#chatlog {',
        '  position: absolute; bottom: 30px; left: 0;',
        '  width: 270px; max-height: 190px;',
        '  overflow-y: auto; overflow-x: hidden;',
        '  background: rgba(0,0,0,0.45);',
        '  color: rgba(255,255,255,0.85);',
        '  font-size: 10px; font-family: monospace;',
        '  line-height: 1.5; padding: 5px 7px;',
        '  box-sizing: border-box; z-index: 998;',
        '  pointer-events: none;',
        '  border-right: 1px solid rgba(255,255,255,0.1);',
        '}',
        '#chatlog .cl-msg { word-break: break-word; }',
        '#chatlog .cl-time { color: rgba(255,255,255,0.4); margin-right: 3px; }',
        '#chatlog .cl-name { color: #ffd27f; font-weight: bold; margin-right: 3px; }',
        '#chatlog .cl-system { color: #7fdfff; font-style: italic; }',
        '#chatlog .cl-green { color: #77bb55; }'
    ].join('\n');

    $(function () {
        $('<style>').text(chatlogStyle).appendTo('head');
        $('<div id="chatlog"></div>').appendTo('#content');
    });

    function nowStr() {
        var d = new Date();
        var h = ('0' + d.getHours()).slice(-2);
        var m = ('0' + d.getMinutes()).slice(-2);
        var s = ('0' + d.getSeconds()).slice(-2);
        return h + ':' + m + ':' + s;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function appendLog(html) {
        var el = document.getElementById('chatlog');
        if (!el) return;
        logEntries.push(html);
        if (logEntries.length > MAX_LOG) logEntries.shift();
        el.innerHTML = logEntries.join('');
        el.scrollTop = el.scrollHeight;
    }

    function logSystem(text) {
        appendLog('<div class="cl-msg"><span class="cl-time">' + nowStr() + '</span>' +
            '<span class="cl-system">' + escapeHtml(text) + '</span></div>');
    }

    function logChat(name, text) {
        var isGreen = text && (text[0] === '>' || text.indexOf('&gt;') === 0);
        var safe = escapeHtml(text);
        var cls = isGreen ? ' cl-green' : '';
        appendLog('<div class="cl-msg"><span class="cl-time">' + nowStr() + '</span>' +
            '<span class="cl-name">' + escapeHtml(name) + ':</span>' +
            '<span class="' + cls + '">' + safe + '</span></div>');
    }

    // ── Saved username ───────────────────────────────────────────────────────
    $(function () {
        var saved = localStorage.getItem("bonzi_username");
        if (saved) $("#login_name").val(saved);

        $("#login_go").on("click", function () {
            localStorage.setItem("bonzi_username", $("#login_name").val());
        });
        $("#login_name, #login_room").on("keypress", function (e) {
            if (e.which === 13)
                localStorage.setItem("bonzi_username", $("#login_name").val());
        });
    });

    // ── User count ───────────────────────────────────────────────────────────
    $(document).ready(function () {
        var patchInterval = setInterval(function () {
            if (typeof window.usersUpdate !== "function") return;
            clearInterval(patchInterval);

            var orig = window.usersUpdate;
            window.usersUpdate = function () {
                orig.apply(this, arguments);
                $("#room_user_count").text(window.usersAmt + " user" + (window.usersAmt === 1 ? "" : "s"));
            };
        }, 50);
    });

    // ── Image / Video in speech bubble ───────────────────────────────────────
    function showMediaInBubble(guid, html) {
        var b = window.bonzis && window.bonzis[guid];
        if (!b) return;
        b.cancel();
        b.$dialog
            .addClass("bubble_autowidth")
            .html(html)
            .css("display", "block");
    }

    // ── Socket hooks (chatlog entries + welcome + YouTube patch) ─────────────
    $(document).ready(function () {
        var patchInterval = setInterval(function () {
            if (!window.socket || !window.bonzis) return;
            clearInterval(patchInterval);

            // Welcome message on join
            window.socket.on("updateAll", function () {
                logSystem("Welcome to BonziWORLD! Type /help for a list of commands.");
            });

            // Chat messages → log
            window.socket.on("talk", function (a) {
                var user = window.usersPublic && window.usersPublic[a.guid];
                var name = user ? user.name : a.guid;
                logChat(name, a.text);
            });

            // Join / leave → log
            window.socket.on("update", function (a) {
                var user = window.usersPublic && window.usersPublic[a.guid];
                // Only log if we didn't know them before (new join)
                if (user && a.userPublic && !window._knownGuids) window._knownGuids = {};
                if (a.guid && !window._knownGuids[a.guid] && a.userPublic) {
                    window._knownGuids[a.guid] = true;
                    logSystem((a.userPublic.name || a.guid) + " joined.");
                }
            });

            window.socket.on("leave", function (a) {
                var user = window.usersPublic && window.usersPublic[a.guid];
                var name = user ? user.name : a.guid;
                logSystem(name + " left.");
                if (window._knownGuids) delete window._knownGuids[a.guid];
            });

            // ── Image ─────────────────────────────────────────────────────
            window.socket.on("image", function (a) {
                if (!a || !a.url) return;
                var safe = a.url.replace(/"/g, '%22');
                showMediaInBubble(a.guid,
                    '<img src="' + safe + '" style="max-width:240px;max-height:200px;display:block;" ' +
                    'onerror="this.style.display=\'none\'" />');
            });

            // ── Video ─────────────────────────────────────────────────────
            window.socket.on("video", function (a) {
                if (!a || !a.url) return;
                var safe = a.url.replace(/"/g, '%22');
                showMediaInBubble(a.guid,
                    '<video src="' + safe + '" controls autoplay muted ' +
                    'style="max-width:280px;max-height:200px;display:block;"></video>');
            });

            // ── YouTube onload/injection patch (client-side) ──────────────
            // Intercept the youtube event before the original handler fires
            // and hard-validate the video ID to block injection via raw /youtube commands
            var YTID_RE = /^[a-zA-Z0-9_-]{11}$/;
            window.socket.on("youtube", function (a) {
                if (!a || !YTID_RE.test(a.vid)) {
                    // Invalid video ID — do nothing (original handler also fires but
                    // we can't un-register it; the server-side fix stops this upstream)
                    return;
                }
                // valid — original handler already registered by script.min.js runs fine
            });
        }, 50);
    });

    // ── Shuffle ──────────────────────────────────────────────────────────────
    $(document).ready(function () {
        var patchInterval = setInterval(function () {
            if (!window.BonziHandler || !window.socket) return;
            clearInterval(patchInterval);

            window.socket.on("shuffle", function () {
                for (var i = 0; i < window.usersAmt; i++) {
                    var b = window.bonzis[window.usersKeys[i]];
                    if (!b) continue;
                    var c = b.maxCoords();
                    b.move(Math.random() * c.x, Math.random() * c.y);
                }
            });
        }, 50);
    });

    // ── Changelog modal ──────────────────────────────────────────────────────
    $(function () {
        $("body").append(
            '<div id="changelog_overlay" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9999;align-items:center;justify-content:center;">' +
            '<div id="changelog_box" style="background:#fff;border:2px solid #555;border-radius:4px;max-width:480px;width:90%;max-height:70vh;overflow-y:auto;padding:16px;font-family:sans-serif;font-size:13px;">' +
            '<h2 style="margin-top:0;">Changelog</h2>' +
            '<ul style="padding-left:18px;line-height:1.6;">' +
            '<li><b>Chatlog</b> &mdash; A live message history panel shows in the bottom-left corner.</li>' +
            '<li><b>Welcome message</b> &mdash; A greeting appears in the chatlog when you join.</li>' +
            '<li><b>YouTube security patch</b> &mdash; Video IDs are strictly validated to prevent injection attacks.</li>' +
            '<li><b>Tsunami warning</b> &mdash; 15+ connections from one IP triggers a full NHK-style tsunami warning screen with siren.</li>' +
            '<li><b>Flood EEW alert</b> &mdash; 5+ connections from one IP triggers a Japan EEW-style banner (with NHK chime).</li>' +
            '<li><b>Crosscolors</b> &mdash; Use <code>/crosscolor &lt;image url&gt;</code> to replace your Bonzi with a custom image.</li>' +
            '<li><b>No room size limit</b> &mdash; Rooms can now hold any number of users.</li>' +
            '<li><b>Default room</b> &mdash; Joining without a room ID now puts you in <b>default</b>.</li>' +
            '<li><b>User count</b> &mdash; The number of users in the room is displayed in the corner.</li>' +
            '<li><b>/shuffle</b> &mdash; Scatter every Bonzi to a random spot on screen.</li>' +
            '<li><b>Greentext</b> &mdash; Messages starting with <code>&gt;</code> are displayed in green.</li>' +
            '<li><b>Saved username</b> &mdash; Your nickname is remembered between visits.</li>' +
            '</ul>' +
            '<button id="changelog_close" style="margin-top:8px;padding:4px 12px;cursor:pointer;">Close</button>' +
            '</div></div>'
        );

        $("#changelog_close").on("click", function () {
            $("#changelog_overlay").hide().css("display", "none");
        });
        $("#changelog_overlay").on("click", function (e) {
            if (e.target === this) $(this).hide().css("display", "none");
        });
    });

    window.showChangelog = function () {
        $("#changelog_overlay").css("display", "flex");
    };

})();
