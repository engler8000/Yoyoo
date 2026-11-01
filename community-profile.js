(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const paths = {
    user:'M20 21v-2a7 7 0 0 0-14 0v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    home:'m3 10 9-7 9 7 M5 9v12h5v-7h4v7h5V9',
    clan:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-4-4',
    uid:'M4 5h16v14H4z M8 9h2 M8 13h2 M14 9h3 M14 13h3',
    events:'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16 M8 14h2 M14 14h2',
    bewerbung:'M14 3H5v18h14V8z M14 3v5h5 M8 12h8 M8 16h5',
    regeln:'M12 3 3 7v6c0 4 9 8 9 8s9-4 9-8V7z m-4 9 3 3 5-6',
    impressum:'M12 8h.01 M12 12v5 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    minigames:'M7 7h10a4 4 0 0 1 4 4l1 6a2 2 0 0 1-3 2l-4-3H9l-4 3a2 2 0 0 1-3-2l1-6a4 4 0 0 1 4-4 M7 10v5 M4.5 12.5h5 M16 11h.01 M19 14h.01',
    mail:'M3 5h18v14H3z m0 0 9 8 9-8',
    settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',
    save:'M4 3h13l4 4v14H3V3z M7 3v6h9V3 M7 21v-7h10v7',
    logout:'M9 4H4v16h5 M10 12h11 m-4-4 4 4-4 4',
    trash:'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
    discord:'M8 5 5 6 2 17l5 3 2-3h6l2 3 5-3-3-11-3-1-1 2H9z M8 12h.01 M16 12h.01'
  };
  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('aria-hidden','true'); svg.classList.add('community-icon');
    const path = document.createElementNS(svg.namespaceURI,'path'); path.setAttribute('d',paths[name] || paths.user); svg.append(path); return svg;
  }
  document.querySelectorAll('header.nav nav a').forEach(a => {
    const key = a.getAttribute('href')?.split('.')[0];
    if (paths[key === 'index' ? 'home' : key]) a.prepend(icon(key === 'index' ? 'home' : key));
  });
  const nav = $('account-open');
  nav.removeAttribute('aria-haspopup'); nav.removeAttribute('aria-controls');
  if (location.pathname.endsWith('/profil.html')) nav.setAttribute('aria-current','page');
  // Auf dem Handy bleibt zunächst nur eine kompakte Menüzeile sichtbar.
  const navigation = document.querySelector('header.nav nav');
  const menu = navigation.querySelector('ul');
  const menuPanel = document.createElement('div'); menuPanel.className = 'mobile-menu-panel';
  const menuClip = document.createElement('div'); menuClip.className = 'mobile-menu-clip';
  menu.before(menuPanel); menuPanel.append(menuClip); menuClip.append(menu);
  const phone = window.matchMedia('(max-width: 680px)');
  const toggle = document.createElement('button');
  toggle.type = 'button'; toggle.className = 'mobile-menu-toggle';
  menu.id = 'community-navigation';
  toggle.setAttribute('aria-controls', menu.id);
  const current = navigation.querySelector('[aria-current="page"]');
  const menuLabel = document.createElement('span');
  menuLabel.textContent = 'Menü';
  const pageLabel = document.createElement('span'); pageLabel.className = 'mobile-menu-current';
  pageLabel.textContent = current === nav ? 'Mein Profil' : current?.textContent.trim() || 'Yoyoo Community';
  const arrow = document.createElementNS('http://www.w3.org/2000/svg','svg');
  arrow.setAttribute('viewBox','0 0 24 24'); arrow.setAttribute('aria-hidden','true'); arrow.classList.add('mobile-menu-arrow');
  const chevron = document.createElementNS(arrow.namespaceURI,'path'); chevron.setAttribute('d','m6 9 6 6 6-6'); arrow.append(chevron);
  toggle.append(menuLabel,pageLabel,arrow); navigation.prepend(toggle);
  function setMenu(open) {
    const expanded = phone.matches && open;
    navigation.classList.toggle('mobile-menu-expanded',expanded);
    toggle.setAttribute('aria-expanded',String(expanded));
    toggle.setAttribute('aria-label',expanded ? 'Navigation einklappen' : 'Navigation ausklappen');
    menu.inert = phone.matches && !expanded;
  }
  toggle.addEventListener('click',()=>setMenu(!navigation.classList.contains('mobile-menu-expanded')));
  navigation.addEventListener('keydown',event=>{
    if(event.key==='Escape' && phone.matches && navigation.classList.contains('mobile-menu-expanded')) {
      setMenu(false); toggle.focus();
    }
  });
  menu.addEventListener('click',event=>{if(event.target.closest('a,button') && phone.matches)setMenu(false);});
  phone.addEventListener('change',()=>setMenu(false));
  navigation.classList.add('mobile-menu-ready'); setMenu(false);
  let avatar = '', avatarUser = '', loadId = 0, editing = false;
  const safeImage = value => typeof value === 'string' && value.length <= 100000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
  function paintAvatar(el) {
    el.replaceChildren();
    if (safeImage(avatar)) { const img = document.createElement('img'); img.src=avatar; img.alt=''; el.append(img); }
    else el.append(icon('user'));
  }
  function render() {
    const user = window.YoyooAuth.user();
    nav.replaceChildren();
    const face = document.createElement('span'); face.className='nav-avatar'; paintAvatar(face);
    const name = document.createElement('span'); name.className='nav-profile-name'; name.textContent=user?.user_metadata?.username || (user ? 'Mein Profil' : 'Profil');
    nav.append(face,name);
    if ($('profile-avatar-preview')) paintAvatar($('profile-avatar-preview'));
    if ($('profile-avatar-remove')) $('profile-avatar-remove').disabled=editing || !avatar;
    if ($('profile-session')) $('profile-session').textContent=user ? 'Du bist mit ' + window.YoyooAuth.loginMethod() + ' angemeldet.' : '';
  }
  async function imageApi(method='GET', image, expectedUser) {
    const auth=window.YoyooAuth, user=auth.user();
    if (!user || (expectedUser && user.id !== expectedUser)) throw new Error('Bitte melde dich erneut an.');
    const token=await auth.accessToken();
    if (auth.user()?.id !== user.id) throw new Error('Deine Anmeldung hat sich geändert.');
    const response=await fetch(window.YOYOO_AUTH.url+'/rest/v1/yoyoo_profile_images?'+(method==='POST'?'on_conflict=user_id':'user_id=eq.'+encodeURIComponent(user.id)+'&select=image_data'), {
      method, headers:{apikey:window.YOYOO_AUTH.publishableKey,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},
      body:method==='POST'?JSON.stringify({user_id:user.id,image_data:image}):undefined, signal:AbortSignal.timeout(20000)
    });
    if (!response.ok) throw new Error('Dein Profilbild konnte nicht '+(method==='GET'?'geladen':'gespeichert')+' werden. Bitte versuche es erneut.');
    return method==='GET'?response.json():null;
  }
  async function loadAvatar() {
    const user=window.YoyooAuth.user(), current=++loadId;
    if (avatarUser !== user?.id) { avatar=''; avatarUser=user?.id || ''; }
    render();
    if (!user || editing) return;
    try { const rows=await imageApi(); if(current===loadId && window.YoyooAuth.user()?.id===user.id) { avatar=safeImage(rows[0]?.image_data)?rows[0].image_data:''; render(); } }
    catch(error) { if(current===loadId && $('profile-avatar-status')) $('profile-avatar-status').textContent=error.message; }
  }
  if ($('profile-start')) {
    document.body.classList.add('community-profile-page');
    const main=document.querySelector('main');
    main.replaceChildren();
    const shell=document.createElement('section'); shell.className='profile-shell wrap';
    const heading=document.createElement('div'); heading.className='profile-heading';
    heading.innerHTML='<h1>Dein Community-Profil</h1><p>Verwalte hier dein Konto, deine Verknüpfungen und deine CODM-UID.</p>';
    heading.prepend(icon('user')); main.append(shell); shell.append(heading);
    const dialog=$('account-dialog'); shell.append(dialog); dialog.classList.add('profile-inline'); dialog.setAttribute('open','');
    $('account-close').hidden=true; $('account-title').hidden=true;
    const profile=$('account-profile');
    const card=(title,subtitle,type)=>{const el=document.createElement('section'); el.className='community-card'; const h=document.createElement('header'); h.className='community-card-heading'; h.append(icon(type)); const copy=document.createElement('div'); const t=document.createElement('h2'); t.textContent=title; const p=document.createElement('p');p.textContent=subtitle;copy.append(t,p);h.append(copy);el.append(h);return el;};
    const account=card('Konto & Profil','Deine grundlegenden Kontodaten.','user');
    const avatarPanel=document.createElement('div'); avatarPanel.className='profile-avatar-editor';
    avatarPanel.innerHTML='<span class="profile-avatar-preview" id="profile-avatar-preview" role="img" aria-label="Dein Profilbild"></span><div><label for="profile-avatar-file">Dein Profilbild</label><p>JPG, PNG oder WebP · bis 10 MB · mittig quadratisch zugeschnitten</p><input type="file" id="profile-avatar-file" accept="image/jpeg,image/png,image/webp"><button type="button" class="btn ghost" id="profile-avatar-remove">Bild entfernen</button><p id="profile-avatar-status" role="status" aria-live="polite"></p></div>';
    account.append(avatarPanel,$('account-username-form'));
    const connections=document.createElement('div'); connections.className='profile-connections';
    const mail=card('E-Mail','Deine E-Mail-Anmeldung.','mail');mail.append($('account-email-display').parentElement,$('account-email-link'),$('account-email-add'));
    const discord=card('Discord','Deine Verbindung zur Community.','discord');discord.append($('account-discord-status'),$('account-discord-link'));
    connections.append(mail,discord);
    const uid=document.querySelector('.profile-uid-panel'); uid.classList.add('community-card'); const uidTitle=uid.querySelector('h3');uidTitle.prepend(icon('minigames'));
    const actions=card('Kontoaktionen','Verwalte dein Konto und deine Sitzung.','settings');
    const row=document.createElement('div');row.className='profile-action-row';const remove=document.createElement('div');remove.append($('account-delete'),$('account-delete-note'));
    const info=document.createElement('p');info.id='profile-session';row.append($('account-logout'),remove,info);actions.append(row);
    const greeting=$('account-greeting'); greeting.hidden=true;
    profile.replaceChildren(greeting,account,connections,uid,actions);
    [['#account-username-form button','save'],['#profile-uid-save','save'],['#profile-uid-delete','trash'],['#account-delete','trash'],['#account-logout','logout'],['#account-email-link','mail']].forEach(([sel,type])=>document.querySelector(sel)?.prepend(icon(type)));
    async function changeImage(image,userId) {
      await imageApi(image===null?'DELETE':'POST',image,userId);
      if(window.YoyooAuth.user()?.id!==userId) return;
      avatar=image || ''; avatarUser=userId; render();
      $('profile-avatar-status').textContent=image?'Dein Profilbild wurde gespeichert.':'Dein Profilbild wurde entfernt.';
      try { localStorage.setItem('yoyoo-avatar-changed',String(Date.now())); localStorage.removeItem('yoyoo-avatar-changed'); } catch (_) {}
    }
    async function edit(action) {
      if(editing) return; editing=true; ++loadId;
      $('profile-avatar-file').disabled=$('profile-avatar-remove').disabled=true;
      $('profile-avatar-status').textContent='Dein Profilbild wird gespeichert …';
      const userId=window.YoyooAuth.user()?.id;
      try { if(!userId) throw new Error('Bitte melde dich zuerst an.'); await action(userId); }
      catch(error){$('profile-avatar-status').textContent=error.message;}
      finally{editing=false;$('profile-avatar-file').disabled=false;$('profile-avatar-file').value='';render();}
    }
    $('profile-avatar-file').addEventListener('change',event=>{
      const file=event.target.files[0];if(!file)return;
      edit(async userId=>{
        if(!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Bitte wähle ein JPG-, PNG- oder WebP-Bild.');
        if(file.size>10*1024*1024) throw new Error('Das Bild darf höchstens 10 MB groß sein.');
        const url=URL.createObjectURL(file), img=new Image();
        try { img.src=url; await img.decode();
          const canvas=document.createElement('canvas');canvas.width=canvas.height=192;
          const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,192,192);
          const side=Math.min(img.naturalWidth,img.naturalHeight);
          context.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,0,0,192,192);
          const data=canvas.toDataURL('image/jpeg',.82);if(data.length>100000)throw new Error('Bitte wähle ein kleineres Bild.');
          await changeImage(data,userId);
        } catch(error) { if(error.name==='EncodingError')throw new Error('Das Bild konnte nicht gelesen werden. Bitte wähle eine andere Datei.');throw error; }
        finally{URL.revokeObjectURL(url);}
      });
    });
    $('profile-avatar-remove').addEventListener('click',()=>edit(userId=>changeImage(null,userId)));
  }
  window.addEventListener('yoyoo-auth-changed',loadAvatar);
  window.addEventListener('storage',event=>{if(event.key==='yoyoo-avatar-changed'&&event.newValue)loadAvatar();});
  window.yoyooAuthReady.then(loadAvatar);
})();
