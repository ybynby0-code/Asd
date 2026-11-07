/* Minebuns Mobile Loader
 * Run once on MineFun.io after the game page is open.
 * Loads the original Minebuns build from the author's Gist, then adds a
 * touch-friendly floating menu and category tabs without replacing modules.
 */
(() => {
  'use strict';
  const SOURCE = 'https://gist.githubusercontent.com/ybynby0-code/cbb41d290149a96abebba3108e021b55/raw/097331f392237bdab0407bedbdcf467f979ddd36/Hi9';
  const ID = 'minebuns-mobile-ui';
  if (window.__minebunsMobileStarting || document.getElementById(ID)) return;
  window.__minebunsMobileStarting = true;

  const waitFor = (test, timeout = 20000) => new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(() => {
      try {
        const value = test();
        if (value) { clearInterval(timer); resolve(value); }
        else if (Date.now() - start > timeout) { clearInterval(timer); reject(new Error('Minebuns 초기화 시간 초과')); }
      } catch (_) {}
    }, 250);
  });

  const installMobileUI = async () => {
    const app = await waitFor(() => window.minebuns && window.minebuns.moduleManager);
    const guiModule = app.moduleManager.modules && app.moduleManager.modules.ClickGUI;
    if (!guiModule) throw new Error('ClickGUI 모듈을 찾을 수 없습니다.');

    const style = document.createElement('style');
    style.id = ID;
    style.textContent = `
      #mb-mobile-launch{position:fixed;z-index:2147483646;right:14px;top:14px;min-width:62px;height:48px;padding:0 15px;border:1px solid #6ee7b7;border-radius:14px;background:#101b27;color:#d1fae5;font:800 14px system-ui;box-shadow:0 5px 22px #0008;touch-action:manipulation}
      #mb-mobile-tabs{position:fixed;z-index:2147483645;left:8px;right:8px;top:70px;display:none;gap:5px;overflow-x:auto;padding:7px;border:1px solid #ffffff22;border-radius:13px;background:#101820ee;backdrop-filter:blur(12px)}
      #mb-mobile-tabs button{flex:1 0 auto;min-width:58px;padding:10px 8px;border:0;border-radius:9px;background:#263442;color:#e5e7eb;font:700 12px system-ui}
      #mb-mobile-tabs button.active{background:#10b981;color:#06251c}
      .gui-panel.mb-mobile-hidden{display:none!important}
      @media(max-width:700px){
        .gui-panel{position:fixed!important;left:8px!important;right:8px!important;top:120px!important;bottom:8px!important;width:auto!important;max-width:none!important;max-height:none!important;overflow:auto!important;box-sizing:border-box!important;z-index:2147483644!important}
        .gui-panel .gui-button{min-height:42px!important;touch-action:manipulation}
      }`;
    document.head.appendChild(style);

    const launch = document.createElement('button');
    launch.id = 'mb-mobile-launch';
    launch.type = 'button';
    launch.textContent = 'MENU';
    launch.setAttribute('aria-label', 'Minebuns 메뉴 열기');
    const tabs = document.createElement('div');
    tabs.id = 'mb-mobile-tabs';
    const names = ['Combat','Movement','Visual','Misc','Menus'];
    const labels = ['전투','이동','시각','기타','메뉴'];
    const panels = () => Array.from(document.querySelectorAll('.gui-panel'));
    let active = 0;
    let opened = false;

    const showCategory = index => {
      active = index;
      const all = panels();
      all.forEach((p, i) => p.classList.toggle('mb-mobile-hidden', i !== index));
      Array.from(tabs.children).forEach((b, i) => b.classList.toggle('active', i === index));
    };
    names.forEach((name, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = labels[i]; b.dataset.category = name;
      b.addEventListener('click', () => showCategory(i));
      tabs.appendChild(b);
    });

    const openMenu = () => {
      if (typeof guiModule.enable === 'function') guiModule.enable();
      else if (typeof guiModule.toggle === 'function') guiModule.toggle();
      opened = true;
      tabs.style.display = 'flex';
      launch.textContent = 'CLOSE';
      setTimeout(() => showCategory(active), 80);
    };
    const closeMenu = () => {
      const original = guiModule.onDisable;
      if (typeof original === 'function') {
        guiModule.onDisable = function () { return original.call(this, false); };
        try { if (typeof guiModule.disable === 'function') guiModule.disable(); }
        finally { guiModule.onDisable = original; }
      } else if (typeof guiModule.disable === 'function') guiModule.disable();
      panels().forEach(p => p.classList.add('mb-mobile-hidden'));
      tabs.style.display = 'none';
      opened = false;
      launch.textContent = 'MENU';
    };
    launch.addEventListener('click', () => opened ? closeMenu() : openMenu());
    document.body.append(launch, tabs);
    window.addEventListener('resize', () => { if (opened) showCategory(active); });
    window.__minebunsMobileUI = { open: openMenu, close: closeMenu, showCategory };
  };

  const start = async () => {
    try {
      if (!window.minebuns) {
        const script = document.createElement('script');
        script.src = SOURCE;
        script.async = true;
        script.onload = () => installMobileUI().catch(err => alert('Minebuns 모바일 메뉴 오류: ' + err.message));
        script.onerror = () => alert('원본 Minebuns 스크립트를 불러오지 못했습니다. Gist 접근 또는 브라우저 차단 여부를 확인해 주세요.');
        document.head.appendChild(script);
      } else {
        await installMobileUI();
      }
    } catch (err) {
      alert('Minebuns 모바일 메뉴 오류: ' + err.message);
    } finally {
      window.__minebunsMobileStarting = false;
    }
  };
  start();
})();