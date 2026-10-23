(() => {
  'use strict';
  const KEY = 'yoyoo.cookie-choice.v1';
  let choice;
  try { choice = JSON.parse(localStorage.getItem(KEY)); if (choice?.expires < Date.now()) choice = null; } catch (_) {}
  window.YoyooCookies = { accepted: () => choice?.value === 'accepted' };
  function start() {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    const details = document.getElementById('cookie-details');
    const more = document.getElementById('cookie-more');
    function save(value) {
      choice = {value, expires: Date.now()+180*86400000};
      try { localStorage.setItem(KEY, JSON.stringify(choice)); } catch (_) {}
      document.cookie = 'yoyoo_cookie_choice='+value+'; Max-Age=15552000; Path=/; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');
      if (value !== 'accepted') { try { localStorage.removeItem('yoyoo.auth.v1'); } catch (_) {} }
      window.dispatchEvent(new Event('yoyoo-consent'));
      banner.hidden = true;
    }
    if (!choice) { try { localStorage.removeItem('yoyoo.auth.v1'); } catch (_) {} }
    banner.hidden = !!choice;
    document.getElementById('cookie-accept').addEventListener('click',()=>save('accepted'));
    document.getElementById('cookie-decline').addEventListener('click',()=>save('session-only'));
    more.addEventListener('click',()=>{details.hidden=!details.hidden;more.setAttribute('aria-expanded',String(!details.hidden));});
    document.querySelectorAll('.cookie-settings').forEach(button=>button.addEventListener('click',()=>{banner.hidden=false;details.hidden=false;more.setAttribute('aria-expanded','true');document.getElementById('cookie-accept').focus();}));
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
