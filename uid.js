(() => {
  const $=id=>document.getElementById(id), config=window.YOYOO_AUTH;
  let mine=null, rows=[], saving=false, loaded=false, generation=0, adding=false;
  const status=(s)=>{$('uid-status').textContent=s;};
  const normalizeSearch=value=>String(value??'').normalize('NFKD').toLocaleLowerCase('de').replace(/\p{M}/gu,'').replace(/ß/g,'ss').replace(/[^\p{L}\p{N}]/gu,'');
  async function api(route,body) {
    const token=await window.YoyooAuth.accessToken();
    const response=await fetch(config.url+'/rest/v1/'+route,{method:body===undefined?'GET':'POST',headers:{apikey:config.publishableKey,...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
    const data=await response.json().catch(()=>null);
    if(!response.ok) {
      if(data?.code==='23505') throw new Error('Diese UID ist bereits eingetragen.');
      if(data?.message?.includes('DISCORD_LOGIN_REQUIRED')) throw new Error('Bitte melde dich für den Eintrag mit Discord an.');
      if(data?.message?.includes('UID_INVALID')) throw new Error('Bitte gib eine UID mit 19 Ziffern ein.');
      if(response.status===404 || data?.code==='PGRST202' || data?.code==='42P01' || data?.code==='PGRST205') throw new Error('Die gemeinsame UID-Liste ist noch nicht eingerichtet. Das Supabase-Setup aus UID-EINRICHTEN.md fehlt.');
      throw new Error('Die UID-Liste ist derzeit nicht erreichbar. Bitte versuche es erneut.');
    }
    return data;
  }
  function state() {
    const auth=window.YoyooAuth, user=auth.user();
    mine=rows.find(r=>r.user_id===user?.id)||null;
    if(mine||!auth.canPublish()) adding=false;
    $('uid-notice').hidden=!loaded||!!mine||adding;
    $('uid-notice-text').textContent=user?'Du hast noch keine UID veröffentlicht.':'Füge deine CODM-UID zur Liste hinzu.';
    $('uid-panel').hidden=!loaded||!!mine||!adding;
    $('uid-invite').hidden=!loaded||!!mine;
    $('uid-edit').hidden=!loaded||!mine;
    $('uid-login').hidden=!!user;
    $('uid-discord').hidden=!user||auth.canPublish();
    $('uid-discord').textContent=auth.discord()?'Mit Discord anmelden':'Discord mit meinem Konto verbinden';
    $('uid-form').hidden=!loaded||!auth.canPublish();
    $('uid-name').textContent=auth.discordName();
    if(document.activeElement!==$('uid-value')) $('uid-value').value=mine?.uid||'';
    $('uid-delete').hidden=!mine;
    $('uid-requirement').textContent=!user?'Zum Hinzufügen brauchst du ein Konto und eine Discord-Anmeldung.':!auth.canPublish()?(auth.discord() ? 'Bitte melde dich mit Discord an, um deine UID zu bearbeiten.' : 'Du bist per E-Mail angemeldet. Bitte füge noch Discord hinzu. Dein bestehendes Konto bleibt erhalten.'):'Bitte füge deine UID hier ein. Dein Discord-Benutzername wird automatisch übernommen und zusammen mit deiner UID öffentlich angezeigt.';
  }
  function render() {
    const query=normalizeSearch($('uid-search').value);
    const visibleRows=rows.filter(row=>normalizeSearch(row.discord_name).includes(query));
    const body=$('uid-rows');body.replaceChildren();
    for(const row of visibleRows) {
      const tr=document.createElement('tr');
      const nameCell=document.createElement('td');
      if(typeof row.discord_id==='string' && /^[1-9][0-9]{0,19}$/.test(row.discord_id)) {
        const profileLink=document.createElement('a');
        profileLink.href='https://discord.com/users/'+row.discord_id;
        profileLink.className='uid-discord-profile';
        profileLink.textContent=row.discord_name;
        profileLink.title='Discord-Profil von '+row.discord_name+' öffnen';
        nameCell.append(profileLink);
      } else {
        nameCell.textContent=row.discord_name;
      }
      const uidCell=document.createElement('td');
      uidCell.textContent=row.uid;
      tr.append(nameCell,uidCell);
      body.append(tr);
    }
    $('uid-empty').hidden=visibleRows.length>0||!loaded;
    $('uid-empty').textContent=rows.length===0?'Noch keine UIDs eingetragen.':'Keine passenden Discord-Benutzernamen gefunden.';
    $('uid-count').textContent=loaded?(query?visibleRows.length+' von '+rows.length+' Einträgen':rows.length+' Einträge'):'';state();
  }
  async function load() {
    const current=++generation;
    try {
      const data=await api('yoyoo_uids?select=user_id,discord_id,discord_name,uid,updated_at&order=updated_at.desc&limit=1000');
      if(current!==generation)return;
      if(!Array.isArray(data))throw new Error('Ungültige Antwort der UID-Liste.');
      rows=data;loaded=true;render();status('');
    }catch(e){if(current===generation)status(e.message);}
  }
  $('uid-add').addEventListener('click',()=>{
    if(!loaded||mine)return;
    const auth=window.YoyooAuth;
    if(!auth.user()){auth.open();return;}
    if(!auth.canPublish()){auth.discordLogin();return;}
    adding=true;state();$('uid-value').focus();
  });
  $('uid-cancel').addEventListener('click',()=>{
    adding=false;state();$('uid-add').focus();
  });
  $('uid-login').addEventListener('click',()=>window.YoyooAuth.open());
  $('uid-discord').addEventListener('click',()=>window.YoyooAuth.discordLogin());
  $('uid-form').addEventListener('submit',async event=>{
    event.preventDefault();if(saving)return;
    const uid=$('uid-value').value.trim();
    if(!/^[0-9]{19}$/.test(uid)){status('Die CODM-UID muss aus 19 Ziffern bestehen.');return;}
    if(!window.YoyooAuth.canPublish()){status('Bitte melde dich zuerst mit Discord an.');return;}
    saving=true;$('uid-save').disabled=true;
    try{await api('rpc/yoyoo_save_uid',{new_uid:uid});window.dispatchEvent(new Event('yoyoo-uid-changed'));await load();if(loaded&&mine)status('Deine UID ist jetzt in der Liste.');}catch(e){status(e.message);}finally{saving=false;$('uid-save').disabled=false;}
  });
  $('uid-delete').addEventListener('click',async()=>{
    if(saving)return;saving=true;$('uid-delete').disabled=true;
    try{await api('rpc/yoyoo_delete_uid',{});window.dispatchEvent(new Event('yoyoo-uid-changed'));await load();}catch(e){status(e.message);}finally{saving=false;$('uid-delete').disabled=false;}
  });
  $('uid-search').addEventListener('input',render);
  $('uid-reload').addEventListener('click',load);
  window.addEventListener('yoyoo-uid-changed',load);
  window.addEventListener('yoyoo-auth-changed',()=>{adding=false;state();load();});
  window.yoyooAuthReady.then(()=>{state();load();});
})();
