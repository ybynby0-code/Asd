/* Vezula Mobile Fly Touch Adapter
 * Append this after the existing Vezula userscript.
 * Boat Physics requires the player to be riding a boat.
 */
(function () {
  "use strict";
  if (window.__vezulaMobileFlyTouchV1) return;
  window.__vezulaMobileFlyTouchV1 = true;

  var rootId = "vezula-fly-touch-pad";
  var held = Object.create(null);
  var retryCount = 0;

  function getPlayer() {
    try {
      var app = document.getElementById("app");
      var pinia = app && app.__vue_app__ && app.__vue_app__.config &&
        app.__vue_app__.config.globalProperties && app.__vue_app__.config.globalProperties.$pinia;
      var state = pinia && pinia._s && pinia._s.get("gameState");
      var player = state && state.gameWorld && state.gameWorld.player;
      return player && player.inputs ? player : null;
    } catch (_) { return null; }
  }

  function applyInputs() {
    var player = getPlayer();
    if (!player) return false;
    var input = player.inputs;
    input.jump = !!held.jump;
    input.crouch = !!held.crouch;
    input.movex = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    input.movey = (held.forward ? 1 : 0) - (held.back ? 1 : 0);
    return true;
  }

  function releaseAll() {
    Object.keys(held).forEach(function (key) { held[key] = false; });
    applyInputs();
    var pad = document.getElementById(rootId);
    if (pad) pad.querySelectorAll("button[data-key]").forEach(function (b) { b.dataset.down = "0"; });
  }

  var css = `
    #${rootId}{position:fixed;right:9px;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);z-index:2147483647;
      width:156px;padding:7px;border:1px solid #64748b88;border-radius:13px;background:#0b1220d9;
      box-shadow:0 4px 18px #0008;display:grid;grid-template-columns:repeat(3,1fr);gap:5px;
      font:700 11px/1 system-ui,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none;}
    #${rootId} button{height:37px;border:1px solid #94a3b866;border-radius:8px;background:#1e293bef;color:#f8fafc;
      font:700 11px system-ui,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;}
    #${rootId} button[data-down="1"]{background:#166534;border-color:#4ade80;color:#dcfce7;}
    #${rootId} .wide{grid-column:span 3;height:29px;font-size:10px;background:#334155;}
    #${rootId} .empty{visibility:hidden;}
    @media(max-height:440px){#${rootId}{transform:scale(.84);transform-origin:bottom right;right:5px;bottom:5px;}}
  `;

  function mount() {
    if (!document.body || document.getElementById(rootId)) return;
    if (!document.getElementById("vezula-fly-touch-style")) {
      var style = document.createElement("style");
      style.id = "vezula-fly-touch-style";
      style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    }
    var pad = document.createElement("div");
    pad.id = rootId;
    pad.setAttribute("aria-label", "Fly touch controls");
    pad.innerHTML =
      '<button class="empty" tabindex="-1"></button>' +
      '<button data-key="jump">▲ 상승</button>' +
      '<button class="empty" tabindex="-1"></button>' +
      '<button data-key="left">◀</button>' +
      '<button data-key="forward">전진</button>' +
      '<button data-key="right">▶</button>' +
      '<button data-key="back">후진</button>' +
      '<button data-key="crouch">▼ 하강</button>' +
      '<button data-stop="1">정지</button>' +
      '<button class="wide" data-info="1">Boat Physics는 보트 탑승 필요</button>';

    pad.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    pad.querySelectorAll("button[data-key]").forEach(function (button) {
      var key = button.getAttribute("data-key");
      function down(e) {
        e.preventDefault(); e.stopPropagation();
        held[key] = true; button.dataset.down = "1";
        try { button.setPointerCapture(e.pointerId); } catch (_) {}
        applyInputs();
      }
      function up(e) {
        e.preventDefault();
        held[key] = false; button.dataset.down = "0";
        applyInputs();
      }
      button.addEventListener("pointerdown", down, {passive:false});
      ["pointerup","pointercancel","lostpointercapture"].forEach(function (name) {
        button.addEventListener(name, up, {passive:false});
      });
    });
    pad.querySelector('[data-stop="1"]').addEventListener("pointerdown", function (e) {
      e.preventDefault(); e.stopPropagation(); releaseAll();
    }, {passive:false});
    document.body.appendChild(pad);
  }

  function boot() {
    mount();
    if (!document.getElementById(rootId) && retryCount++ < 30) setTimeout(boot, 500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
  window.addEventListener("blur", releaseAll);
  document.addEventListener("visibilitychange", function () { if (document.hidden) releaseAll(); });
})();
