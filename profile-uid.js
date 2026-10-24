(() => {
  const profile = document.getElementById('account-profile');
  if (!profile) return;
  const panel = document.createElement('section');
  panel.className = 'profile-uid-panel';
  panel.innerHTML = '<p><strong>Aktuell angemeldet mit:</strong> <span id="profile-login-method"></span></p><p><strong>Konto erstellt mit:</strong> <span id="profile-signup-method"></span></p><h3>Deine CODM-UID</h3><p id="profile-uid-hint"></p><p id="profile-uid-current"></p><button type="button" class="btn" id="profile-uid-discord" hidden>Bitte füge noch Discord hinzu</button><form id="profile-uid-form" hidden><label for="profile-uid-value">Bitte füge deine UID hier ein</label><input id="profile-uid-value" type="text" inputmode="numeric" pattern="[0-9]{19}" minlength="19" maxlength="19" required autocomplete="off" placeholder="Deine 19-stellige CODM-UID"><p>Dein Discord-Benutzername und deine UID sind nach dem Speichern für alle in der UID-Liste sichtbar.</p><button type="submit" class="btn" id="profile-uid-save">UID speichern</button><button type="button" class="btn ghost" id="profile-uid-delete" hidden>UID entfernen</button></form><p id="profile-uid-status" role="status" aria-live="polite"></p>';
  profile.insertBefore(panel, document.getElementById('account-logout'));
  const $ = id => document.getElementById(id);
  let entry = null, generation = 0, busy = false;
  const message = text => { $('profile-uid-status').textContent = text; };
  async function api(route, body) {
    const auth = window.YoyooAuth, user = auth.user();
    if (!user) throw new Error('Bitte melde dich zuerst an.');
    const token = await auth.accessToken(), config = window.YOYOO_AUTH;
    const response = await fetch(config.url + '/rest/v1/' + route, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {apikey:config.publishableKey, Authorization:'Bearer ' + token, 'Content-Type':'application/json'},
      body: body === undefined ? undefined : JSON.stringify(body), signal:AbortSignal.timeout(15000)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (data?.code === '23505') throw new Error('Diese UID ist bereits eingetragen.');
      if (data?.message?.includes('DISCORD_LOGIN_REQUIRED')) throw new Error('Bitte melde dich zuerst mit Discord an.');
      throw new Error('Deine UID konnte nicht geladen oder gespeichert werden. Bitte versuche es erneut.');
    }
    return data;
  }
  function render() {
    const auth = window.YoyooAuth, user = auth.user();
    panel.hidden = !user;
    if (!user) return;
    $('profile-login-method').textContent = auth.loginMethod();
    $('profile-signup-method').textContent = user.app_metadata?.provider === 'discord' ? 'Discord' : user.app_metadata?.provider === 'email' ? 'E-Mail' : 'Nicht verfügbar';
    $('profile-uid-current').textContent = entry ? 'Deine öffentliche UID: ' + entry.uid : 'Du hast noch keine UID veröffentlicht.';
    $('profile-uid-discord').hidden = auth.canPublish();
    $('profile-uid-discord').textContent = auth.discord() ? 'Mit Discord anmelden' : 'Bitte füge noch Discord hinzu';
    $('profile-uid-form').hidden = !auth.canPublish();
    $('profile-uid-hint').textContent = !auth.discord() ? 'Bitte füge noch Discord hinzu, um deine UID zu veröffentlichen.' : !auth.canPublish() ? 'Melde dich mit Discord an, um deine UID zu bearbeiten.' : 'Discord verbunden: ' + auth.discordName() + '. Hier kannst du deine UID veröffentlichen oder bearbeiten.';
    $('profile-uid-delete').hidden = !entry;
    if (document.activeElement !== $('profile-uid-value')) $('profile-uid-value').value = entry?.uid || '';
  }
  async function load() {
    const current = ++generation, user = window.YoyooAuth.user();
    entry = null; render(); message('');
    if (!user) return;
    message('Deine UID wird geladen …');
    try {
      const rows = await api('yoyoo_uids?select=uid&user_id=eq.' + encodeURIComponent(user.id) + '&limit=1');
      if (current !== generation) return;
      entry = rows[0] || null; render(); message('');
    } catch (error) { if (current === generation) message(error.message); }
  }
  $('profile-uid-discord').addEventListener('click', () => window.YoyooAuth.discordLogin());
  async function change(remove) {
    if (busy) return;
    const uid = $('profile-uid-value').value.trim();
    if (!remove && !/^[0-9]{19}$/.test(uid)) { message('Bitte gib deine UID mit 19 Ziffern ein.'); return; }
    busy = true;
    $('profile-uid-save').disabled = $('profile-uid-delete').disabled = true;
    try {
      await api(remove ? 'rpc/yoyoo_delete_uid' : 'rpc/yoyoo_save_uid', remove ? {} : {new_uid:uid});
      window.dispatchEvent(new Event('yoyoo-uid-changed'));
    } catch(error) { message(error.message); }
    finally { busy=false; $('profile-uid-save').disabled = $('profile-uid-delete').disabled = false; }
  }
  $('profile-uid-form').addEventListener('submit', event => {event.preventDefault(); change(false);});
  $('profile-uid-delete').addEventListener('click', () => change(true));
  window.addEventListener('yoyoo-auth-changed', load);
  window.addEventListener('yoyoo-uid-changed', load);
  window.yoyooAuthReady.then(load);
})();
