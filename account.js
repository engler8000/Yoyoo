(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const dialog = $('account-dialog');
  const config = window.YOYOO_AUTH || {};
  let email = '', token = '', busy = false, resendAt = 0;
  const SESSION_KEY = 'yoyoo.auth.v1';
  function updateHomeGreeting(user) {
    const greeting = $('home-greeting');
    if (!greeting) return;
    const username = user?.user_metadata?.username?.trim();
    greeting.hidden = !username;
    if (!username) { greeting.textContent = ''; return; }
    const hour = new Date().getHours();
    const salutation = hour >= 5 && hour < 11 ? 'Guten Morgen' : hour >= 11 && hour < 14 ? 'Guten Mittag' : hour >= 14 && hour < 18 ? 'Guten Nachmittag' : 'Guten Abend';
    greeting.textContent = salutation + ', ' + username + '!';
  }
  setInterval(() => updateHomeGreeting(session?.user), 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateHomeGreeting(session?.user); });

  let session = null, refreshTimer, refreshing;
  const consent = () => window.YoyooCookies?.accepted() === true;
  function persist() {
    const saved = session ? JSON.stringify(session) : null;
    try { if (saved) sessionStorage.setItem(SESSION_KEY, saved); else sessionStorage.removeItem(SESSION_KEY); }
    catch (_) { status('Dein Browser verhindert das Speichern. Die Anmeldung bleibt nur bis zum Seitenwechsel erhalten.', true); }
    try { if (consent() && saved) localStorage.setItem(SESSION_KEY, saved); else localStorage.removeItem(SESSION_KEY); }
    catch (_) { status('Dein Browser verhindert das dauerhafte Speichern. Die Anmeldung bleibt nur in diesem Tab erhalten.', true); }
  }
  function reset() {
    if ($('profile-start')) $('profile-start').textContent = 'Account erstellen / anmelden';
    if ($('home-signup')) $('home-signup').hidden = false;
    clearTimeout(refreshTimer); session = null; token = '';
    updateHomeGreeting(null); notify();
    try { localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); } catch (_) {}
    $('account-profile').hidden = true; $('account-entry').hidden = false;
    $('account-code-form').hidden = true; $('account-code').value = '';
    $('account-username').value = ''; $('account-open').textContent = 'Profil';
  }
  function useSession(data) {
    if (!data.access_token || !data.refresh_token || !data.user?.id) throw new Error('Bitte melde dich erneut an.');
    session = { access_token: data.access_token, refresh_token: data.refresh_token,
      expires_at: data.expires_at || Math.floor(Date.now()/1000) + (data.expires_in || 3600), user: data.user };
    token = session.access_token; persist(); profile(session.user); notify();
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => refresh().catch(() => status('Die Sitzung konnte nicht erneuert werden. Bitte prüfe deine Verbindung.', true)), Math.max(1000, session.expires_at*1000-Date.now()-60000));
  }
  async function refresh() {
    if (refreshing) return refreshing;
    const action = async () => {
      // Mehrere Tabs erneuern dieselbe Sitzung nacheinander.
      if (consent()) { try { const saved = JSON.parse(localStorage.getItem(SESSION_KEY)); if (saved?.refresh_token) session = saved; } catch (_) {} }
      if (!session) return;
      try { useSession(await request('token?grant_type=refresh_token', {refresh_token: session.refresh_token})); }
      catch(error) { if (error.authInvalid) { reset(); status('Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.', true); } throw error; }
    };
    refreshing = (navigator.locks ? navigator.locks.request('yoyoo-auth-refresh', action) : action()).finally(() => { refreshing = null; });
    return refreshing;
  }
  async function restore() {
    try {
      let tabSaved = null, persistentSaved = null;
      try { tabSaved = JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch (_) {}
      if (consent()) { try { persistentSaved = JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (_) {} }
      const saved = persistentSaved?.refresh_token ? persistentSaved : tabSaved;
      if (!saved?.refresh_token || !saved?.access_token) return;
      session = saved; token = saved.access_token;
      if (saved.expires_at*1000 < Date.now()+60000) await refresh();
      else { const user = await request('user', undefined, token); useSession({...saved, user}); }
    } catch(error) {
      if (error.authInvalid) reset();
      status('Deine gespeicherte Anmeldung konnte nicht bestätigt werden. Prüfe deine Verbindung oder melde dich erneut an.', true);
    }
  }
  window.addEventListener('yoyoo-consent', () => { persist(); });
  window.addEventListener('storage', event => { if (event.key === SESSION_KEY) { if (!event.newValue) reset(); else restore(); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && session && session.expires_at*1000 < Date.now()+60000) refresh().catch(()=>{}); });
  const status = (message, error = false) => {
    $('account-status').textContent = message;
    $('account-status').classList.toggle('error', error);
  };
  function configured() {
    if (!/^https:\/\/[^/]+\/?$/.test(config.url || '') || !config.publishableKey) {
      throw new Error('Die E-Mail-Anmeldung ist noch nicht eingerichtet. Bitte versuche es später erneut.');
    }
  }
  async function request(path, body, accessToken, method) {
    configured();
    const response = await fetch(config.url.replace(/\/$/, '') + '/auth/v1/' + path, {
      method: method || (body === undefined ? 'GET' : 'POST'),
      headers: { apikey: config.publishableKey, 'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 || (path.startsWith('token?') && response.status === 400)) { const error = new Error('Bitte melde dich erneut an.'); error.authInvalid = true; throw error; }
      if (response.status === 429) throw new Error('Zu viele Anfragen. Bitte warte etwas und versuche es erneut.');
      if (path === 'verify') throw new Error('Der Code ist ungültig oder abgelaufen. Prüfe ihn oder fordere einen neuen an.');
      throw new Error('Die Anmeldung konnte nicht abgeschlossen werden. Bitte versuche es später erneut.');
    }
    return data;
  }
  async function run(action) {
    if (busy) return;
    busy = true;
    dialog.querySelectorAll('button:not(#account-close), input').forEach(el => el.disabled = true);
    try { await action(); } catch (error) {
      status(error.name === 'TypeError' || error.name === 'TimeoutError' ? 'Verbindung fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es erneut.' : error.message, true);
    } finally {
      busy = false;
      dialog.querySelectorAll('button, input').forEach(el => el.disabled = false);
    }
  }
  function profile(user) {
    if ($('profile-start')) $('profile-start').textContent = 'Mein Profil öffnen';
    if ($('home-signup')) $('home-signup').hidden = true;
    updateHomeGreeting(user);
    $('account-entry').hidden = true;
    $('account-code-form').hidden = true;
    $('account-profile').hidden = false;
    $('account-email-display').textContent = user.email;
    $('account-open').textContent = 'Mein Profil';
    $('account-username').value = user.user_metadata?.username || '';
    $('account-greeting').textContent = user.user_metadata?.username ? 'Hallo, ' + user.user_metadata.username + '!' : 'Willkommen in deinem Profil!';
    const identity = discordIdentity();
    $('account-discord-status').textContent = identity ? 'Discord verbunden: ' + discordName(identity) : 'Discord noch nicht verbunden.';
    $('account-discord-link').textContent = identity ? 'Mit Discord anmelden' : 'Discord mit deinem Konto verbinden';
  }
  function discordIdentity() { return session?.user?.identities?.find(i => i.provider === 'discord'); }
  function discordName(identity) { const d=identity?.identity_data || {}; return d.preferred_username || d.name || d.full_name || 'Discord-Mitglied'; }
  function oauthSession() {
    try { const payload=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); return !!discordIdentity() && payload.amr?.some(a=>a.method==='oauth'); } catch { return false; }
  }
  function loginMethod() {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      const methods = (payload.amr || []).filter(a => a.method !== 'token_refresh').sort((a,b) => b.timestamp - a.timestamp);
      if (methods[0]?.method === 'oauth' && discordIdentity()) return 'Discord';
      if (methods.some(a => ['otp','email/signup','magiclink','password'].includes(a.method))) return 'E-Mail';
    } catch {}
    return 'Nicht verfügbar';
  }
  function notify() { window.dispatchEvent(new Event('yoyoo-auth-changed')); }
  let oauthClient;
  async function client() {
    configured();
    if (!oauthClient) {
      if (!window.supabase) throw new Error('Die Discord-Anmeldung konnte nicht geladen werden. Bitte lade die Seite neu.');
      oauthClient=window.supabase.createClient(config.url,config.publishableKey,{auth:{flowType:'pkce',autoRefreshToken:false,persistSession:false,detectSessionInUrl:false,storage:sessionStorage,storageKey:'yoyoo-discord-pkce'}});
    }
    return oauthClient;
  }
  async function discordLogin() {
    if (!/^https?:$/.test(location.protocol)) throw new Error('Discord-Anmeldung benötigt eine Website-Adresse (http oder https). Bitte öffne die lokale Vorschau.');
    const c=await client();
    const redirectTo=new URL('uid.html',location.href).href;
    let result;
    if (session && !discordIdentity()) {
      if(session.expires_at*1000<Date.now()+60000) await refresh();
      const restored=await c.auth.setSession({access_token:token,refresh_token:session.refresh_token});
      if(restored.error) throw new Error('Bitte melde dich erneut an.');
      if(restored.data.session) useSession(restored.data.session);
      sessionStorage.setItem('yoyoo-discord-link-user',session.user.id);
      result=await c.auth.linkIdentity({provider:'discord',options:{redirectTo,skipBrowserRedirect:true}});
    } else {
      sessionStorage.removeItem('yoyoo-discord-link-user');
      result=await c.auth.signInWithOAuth({provider:'discord',options:{redirectTo,skipBrowserRedirect:true}});
    }
    if(result.error || !result.data?.url) throw new Error('Discord-Anmeldung nicht verfügbar. Der Discord-Anbieter und die Kontoverknüpfung müssen in Supabase aktiviert sein.');
    location.assign(result.data.url);
  }
  async function callback() {
    const url=new URL(location.href);
    if(!url.searchParams.has('code')&&!url.searchParams.has('error')) return false;
    const safeAuthDetail=value=>String(value||'').replace(/https?:\/\/\S+/gi,'[Link entfernt]').replace(/\b(code|access_token|refresh_token|state|verifier|code_verifier)=\S+/gi,'$1=[entfernt]').replace(/\s+/g,' ').trim().slice(0,180);
    const code=url.searchParams.get('code'), providerError=url.searchParams.get('error'), providerDescription=url.searchParams.get('error_description');
    for(const key of ['code','error','error_code','error_description']) url.searchParams.delete(key);
    history.replaceState({},'',url);
    dialog.showModal();
    if(providerError) {
      const details=[providerError,providerDescription].map(safeAuthDetail).filter(Boolean).join(': ');
      throw new Error('Discord-Anmeldung fehlgeschlagen ('+details+'). Bitte starte sie erneut.');
    }
    const c=await client(); const {data,error}=await c.auth.exchangeCodeForSession(code);
    if(error) {
      const details=[error.code,error.message].map(safeAuthDetail).filter(Boolean).join(': ');
      throw new Error('Discord-Rückmeldung konnte nicht bestätigt werden'+(details?' ('+details+')':'')+'. Bitte starte die Anmeldung auf derselben Website erneut.');
    }
    if(!data?.session) throw new Error('Discord hat keine aktive Sitzung zurückgegeben. Bitte starte die Anmeldung erneut.');
    const expected=sessionStorage.getItem('yoyoo-discord-link-user'); sessionStorage.removeItem('yoyoo-discord-link-user');
    if(expected&&data.session.user.id!==expected) throw new Error('Discord wurde nicht mit dem ursprünglichen Konto verbunden. Bitte melde dich erneut per E-Mail an.');
    useSession(data.session); status('Du bist mit Discord angemeldet.'); return true;
  }
  window.YoyooAuth={ loginMethod, user:()=>session?.user || null, discord:discordIdentity, discordName:()=>discordName(discordIdentity()), canPublish:oauthSession,
    open:()=>dialog.showModal(), discordLogin:()=>{dialog.showModal();return run(discordLogin);},
    accessToken:async()=>{if(session&&session.expires_at*1000<Date.now()+60000) await refresh();return token;}
  };
  $('account-discord-login').addEventListener('click',()=>run(discordLogin));
  $('account-discord-link').addEventListener('click',()=>run(discordLogin));
  async function sendCode() {
    if (Date.now() < resendAt) throw new Error('Bitte warte noch ' + Math.ceil((resendAt - Date.now()) / 1000) + ' Sekunden, bevor du einen neuen Code anforderst.');
    await request('otp', { email, create_user: true });
    resendAt = Date.now() + 60000;
    $('account-entry').hidden = true;
    $('account-code-form').hidden = false;
    $('account-code').value = '';
    status('Code angefordert für ' + email + '. Er kann einige Minuten unterwegs sein. Keine E-Mail erhalten? Schau bitte auch in deinem Spam-Ordner nach.');
  }
  $('account-open').addEventListener('click', () => dialog.showModal());
  $('account-close').addEventListener('click', () => dialog.close());
  $('account-email-form').addEventListener('submit', event => {
    event.preventDefault();
    email = $('account-email').value.trim();
    run(async () => { await sendCode(); }).then(() => { if (!$('account-code-form').hidden) $('account-code').focus(); });
  });
  $('account-code-form').addEventListener('submit', event => {
    event.preventDefault();
    run(async () => {
      const data = await request('verify', { email, token: $('account-code').value.trim(), type: 'email' });
      if (!data.access_token || !data.user?.email_confirmed_at) throw new Error('Die E-Mail-Adresse konnte nicht bestätigt werden.');
      useSession(data);
      status('E-Mail bestätigt. Du bist jetzt angemeldet!');
    });
  });
  $('account-resend').addEventListener('click', () => run(sendCode));
  $('account-change').addEventListener('click', () => {
    $('account-entry').hidden = false;
    $('account-code-form').hidden = true;
    $('account-code').value = '';
    status('');
    $('account-email').focus();
  });
  $('account-username-form').addEventListener('submit', event => {
    event.preventDefault();
    const username = $('account-username').value.trim();
    if (!/^[\p{L}\p{N}_ .-]{3,24}$/u.test(username)) { status('Bitte wähle 3 bis 24 Zeichen: Buchstaben, Zahlen, Leerzeichen, Punkt, Unterstrich oder Bindestrich.', true); return; }
    run(async () => {
      if (!session) throw new Error('Bitte melde dich zuerst an.');
      if (session.expires_at*1000 < Date.now()+60000) await refresh();
      const user = await request('user', {data: {username}}, token, 'PUT');
      session.user = user; persist(); profile(user); status('Dein Benutzername wurde gespeichert.');
    });
  });
  $('account-logout').addEventListener('click', () => run(async () => {
    let failed = false;
    try { await request('logout', {}, token); } catch (_) { failed = true; }
    finally { reset(); status(failed ? 'Lokal abgemeldet. Die serverseitige Abmeldung war wegen eines Verbindungsfehlers nicht möglich.' : 'Du bist abgemeldet. Die gespeicherte Anmeldung wurde entfernt.'); }
  }));
  window.yoyooAuthReady = (async()=>{try{if(!await callback()) await restore();}catch(error){status(error.message,true);}})().finally(() => {
    if ($('home-signup')) $('home-signup').hidden = !$('account-profile').hidden;
    if ($('profile-start')) dialog.showModal();
  });
  if ($('profile-start')) $('profile-start').addEventListener('click', () => dialog.showModal());
})();
