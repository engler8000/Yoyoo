(() => {
 'use strict';
 const app=document.getElementById('minigames-app'),$=id=>document.getElementById(id);
 const make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
 const btn=(text,fn,ghost=false)=>{const b=make('button','btn'+(ghost?' ghost':''),text);b.type='button';b.onclick=fn;return b;};
 const toasts=make('aside','mg-toasts');toasts.setAttribute('aria-label','Spieleinladungen');document.body.append(toasts);
 const boards=new Map(),results=new Set(),returns=new Map(),liveMatches=new Set();
 function allGames(){if(state?.chess_queued)act('chess_unqueue');hiddenMatch=state?.match?.id||null;opened=false;signature='';render();window.scrollTo({top:0,behavior:'instant'});}
 function playerSearch(){hiddenMatch=state?.match?.id||null;opened=true;signature='';render();window.scrollTo({top:0,behavior:'instant'});}
 if(!document.querySelector('link[href^="minigames.css"]')){const l=make('link');l.rel='stylesheet';l.href='minigames.css?v=20261026-layout-5';document.head.append(l);}
 let state,waiting=false,opened=false,selectedGame='tic_tac_toe',hiddenMatch=null,signature='',offset=0,lastUser=null,lastNotice=0,displayKey='';const seen=new Set(),celebrated=new Set();
 function receive(next){
   if(state&&Date.parse(next.server_time)<Date.parse(state.server_time))return;
   const m=next.match;
   if(m){
     if(['invited','lobby','funding','playing','settling','review'].includes(m.status))liveMatches.add(m.id);
     else if(m.status==='finished'&&!liveMatches.has(m.id))hiddenMatch=m.id;
   }
   next.client_received_at=Date.now();state=next;
 }
 function notice(text,actions=[],mid){const box=make('div','mg-toast');box.setAttribute('role','status');if(mid)box.dataset.match=mid;box.append(make('p','',text));actions.forEach(a=>box.append(btn(a.text,a.run,a.ghost)));box.append(btn('Schließen',()=>box.remove(),true));toasts.append(box);if(!actions.length)setTimeout(()=>box.remove(),12000);while(toasts.children.length>3)toasts.firstElementChild.remove();}
 function error(message){if(app){$('mg-error').textContent=message;$('mg-error').hidden=false;}else notice(message);}
 function enter(){if(!app)location.assign(new URL('minigames.html',location.href));}
 async function api(action,data={}){
   const token=await window.YoyooAuth?.accessToken();if(!token)throw Error('Bitte melde dich an.');
   const r=await fetch(window.YOYOO_AUTH.url.replace(/\/$/,'')+'/functions/v1/minigames-api',{method:'POST',headers:{apikey:window.YOYOO_AUTH.publishableKey,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({action,data}),signal:AbortSignal.timeout(20000)});
   const s=await r.json().catch(()=>({}));if(!r.ok)throw Error(s.error||'Die Spielverwaltung ist gerade nicht erreichbar.');return s;
 }
 async function act(action,data={}){if(waiting)return;waiting=true;try{if(app)$('mg-error').hidden=true;if(['bot','invite'].includes(action))data={...(selectedGame==='chess'?window.YoyooChess.options():{game:'tic_tac_toe'}),...data};receive(await api(action,data));update();if(action==='accept')enter();}catch(e){error(e.message);}finally{waiting=false;}}
 function gate(){
   const auth=window.YoyooAuth,u=auth?.user(),ready=!!(u&&auth.discord()&&u.user_metadata?.username?.trim());
   if(!app)return ready;
   const g=$('mg-gate');g.replaceChildren();g.hidden=ready;$('mg-content').hidden=!ready;
   if(!ready)$('mg-connection').textContent=!u?'Anmeldung erforderlich':!auth.discord()?'Discord-Verknüpfung erforderlich':'Benutzername erforderlich';
   if(!u)g.append(make('h2','','Dein Platz in der Arena'),make('p','mg-muted','Erstelle ein Website-Konto oder melde dich an.'),btn('Konto erstellen / anmelden',()=>auth?.open()));
   else if(!auth.discord())g.append(make('h2','','Bitte füge dein Discord hinzu'),make('p','mg-muted','Verbinde Discord mit deinem bestehenden Website-Konto.'),btn('Discord hinzufügen',()=>auth.discordLogin()));
   else if(!ready)g.append(make('h2','','Wie sollen wir dich nennen?'),make('p','mg-muted','Lege zuerst deinen Website-Benutzernamen im Profil fest.'),btn('Benutzernamen festlegen',()=>auth.open()));
   return ready;
 }
 function update(){
   if(!state)return;offset=Date.parse(state.server_time)-Date.now();const m=state.match;
   for(const box of toasts.querySelectorAll('[data-match]'))if(box.dataset.match!==m?.id||m.status!=='invited')box.remove();
   for(const n of state.notifications||[]){if(seen.has(n.id)||n.id<=lastNotice)continue;seen.add(n.id);lastNotice=n.id;try{sessionStorage.setItem('yoyoo-minigames-notice:'+state.me,String(lastNotice));}catch{}if(Date.now()-Date.parse(n.created)>60000)continue;if(m?.id===n.match_id&&m.status==='invited'&&m.guest===state.me)continue;notice(n.message);}
   if(m?.status==='invited'&&m.guest===state.me&&!seen.has(m.id)){seen.add(m.id);notice(m.host_name+' lädt dich zu '+(m.game==='chess'?'Schach':'Tic Tac Toe')+' ein.',[
     {text:'Akzeptieren',run:()=>act('accept',{match_id:m.id})},{text:'Ablehnen',ghost:true,run:()=>act('decline',{match_id:m.id})}],m.id);}
   if(!app){if(m&&['lobby','funding','playing','settling'].includes(m.status))enter();return;}
   if(!gate())return;
   if(m&&m.id!==hiddenMatch&&m.game==='chess')selectedGame='chess';
   const sig=JSON.stringify([m,state.players,state.points_enabled,state.next_play_at,opened,hiddenMatch,selectedGame,state.chess_stats,state.chess_queued]);if(sig!==signature){signature=sig;render();}
   const key=m&&m.id!==hiddenMatch?m.id+':'+m.status:'';if(key!==displayKey){displayKey=key;if(key)requestAnimationFrame(()=>$('mg-match').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));}tick();
 }
 function render(){
   const m=state.match,active=m&&m.id!==hiddenMatch,me=state.me;
   $('mg-hero').hidden=!!active||opened;app.classList.toggle('mg-focused',!!active||opened);
   $('mg-games').hidden=!!active||opened;$('mg-online').hidden=!!active||!opened;$('mg-match').hidden=!active;
   const list=$('mg-online-list');list.replaceChildren();$('mg-online-count').textContent=state.players.length+' Mitglieder online';
   if(selectedGame==='chess')window.YoyooChess.search(list,state,act);else {
   const botRow=make('div','mg-row mg-bot-row'),botPerson=make('div','mg-person'),botText=make('div');botText.append(make('b','','Yoyoo Bot'),make('div','mg-muted','Sehr schwer · 95 % optimale Runden'));botPerson.append(make('span','mg-avatar','YB'),botText);
   const botForm=make('form','mg-bot-controls'),botLabel=make('label','','Dein Einsatz in YY Points'),botStake=make('input');botStake.type='number';botStake.min='0';botStake.max='100000';botStake.step='1';botStake.value='0';botStake.required=true;botStake.id='mg-bot-stake';botLabel.htmlFor=botStake.id;botLabel.append(botStake);
   const startBot=()=>{if(botForm.reportValidity())act('bot',{amount:Number(botStake.value)});};const botButton=btn('Ohne Einsatz starten',startBot);botButton.classList.add('mg-start-game');botStake.oninput=()=>{botButton.textContent=Number(botStake.value)>0?'Mit '+Number(botStake.value).toLocaleString('de-DE')+' YY Points starten':'Ohne Einsatz starten';};botForm.onsubmit=e=>{e.preventDefault();startBot();};botForm.append(botLabel,botButton);botRow.append(botPerson,botForm);list.append(botRow);
   list.append(make('p','mg-muted','Botduell: Sieg = Einsatz zurück plus gleich hoher Gewinn. Niederlage = Einsatz verloren. Unentschieden = Einsatz zurück. 95 % der Runden spielt der Bot optimal; in 5 % sind Fehler möglich. Das ist keine feste Siegquote.'));
   }
   for(const p of state.players){const row=make('div','mg-row'),person=make('div','mg-person');person.append(make('span','mg-avatar',p.name.slice(0,2).toUpperCase()),make('b','',p.name));const paused=Date.parse(p.available_at)>Date.now()+offset;const b=btn(paused?'Spielpause':p.busy?'Im Spiel':'Einladen',()=>act('invite',{user_id:p.id}));b.classList.add('mg-start-game');b.dataset.busy=String(p.busy);b.disabled=p.busy;row.append(person,b);list.append(row);}
   if(!state.players.length)list.append(make('p','mg-muted','Gerade ist niemand verfügbar. Mitglieder erscheinen hier, wenn sie mit Discord und Website-Benutzernamen online sind.'));
   if(!active){tick();return;}const panel=$('mg-match');panel.replaceChildren();panel.classList.remove('mg-result-new','mg-is-win','mg-is-loss','mg-is-draw');
   if(m.status==='invited'){
     panel.append(make('h2','',m.host===me?'Einladung verschickt':'Du wurdest eingeladen'),make('p','mg-muted',m.host_name+' × '+m.guest_name),make('p','',m.host===me?'Warte auf die Antwort. Die Einladung läuft nach 30 Sekunden ab.':'Spielst du eine Runde mit '+m.host_name+'?'),make('p','mg-countdown'));
     if(m.guest===me)panel.append(btn('Akzeptieren',()=>act('accept',{match_id:m.id})),btn('Ablehnen',()=>act('decline',{match_id:m.id}),true));else panel.append(btn('Einladung zurückziehen',()=>act('cancel',{match_id:m.id}),true));return;
   }
   if(m.game==='chess'){if(m.status==='finished'&&!returns.has(m.id))returns.set(m.id,Date.now()+30000);window.YoyooChess.render(panel,state,act,playerSearch);return;}
   const vs=make('div','mg-vs');for(const [id,name,s] of [[m.host,m.host_name,'X'],[m.guest,m.guest_name,'O']]){const p=make('div','mg-player'+(m.status==='playing'&&m.turn===id?' active':''));p.append(make('span','mg-symbol',s),make('b','',name+(id===me?' · Du':'')));vs.append(p);if(id===m.host)vs.append(make('span','mg-muted','VS'));}panel.append(vs);
   if(m.status==='lobby'){
     panel.append(make('h2','mg-status','Euer Einsatz. Eure Entscheidung.'),make('p','mg-muted','Beide bestätigen denselben Einsatz. Bei einem Unentschieden erhält jeder seinen Einsatz zurück. Mit 0 YY Points spielt ihr ohne Einsatz.'));
     const form=make('form','mg-stake'),label=make('label','','YY Points pro Person'),input=make('input');input.type='number';input.min='0';input.max='100000';input.step='1';input.value=m.stake;input.required=true;input.id='mg-stake-input';label.htmlFor=input.id;label.append(input);const propose=make('button','btn ghost','Einsatz vorschlagen');propose.type='submit';form.append(label,propose);form.onsubmit=e=>{e.preventDefault();if(form.reportValidity())act('stake',{match_id:m.id,amount:Number(input.value)});};panel.append(form);
     if(!state.points_enabled)panel.append(make('p','mg-muted','Die Punktebuchung wird noch abschließend geprüft. Aktuell sind Runden ohne Einsatz freigeschaltet.'));
     panel.append(make('p','mg-chip',m.stake.toLocaleString('de-DE')+' YY Points pro Person'),make('p','mg-muted',m.host_name+': '+(m.host_ready?'✓ bestätigt':'wartet')+' · '+m.guest_name+': '+(m.guest_ready?'✓ bestätigt':'wartet')));
     const ready=btn('Einsatz bestätigen & bereit',()=>act('ready',{match_id:m.id,revision:m.revision}));ready.disabled=m.host===me?m.host_ready:m.guest_ready;const actions=make('div','mg-actions');actions.append(ready,btn('Lobby verlassen',()=>act('leave',{match_id:m.id}),true));panel.append(actions);return;
   }
   let text=m.status==='playing'?(m.turn===me?'Du bist am Zug':(m.turn===m.host?m.host_name:m.guest_name)+' ist am Zug'):m.winner?(m.winner===me?'Du hast gewonnen!':(m.winner===m.host?m.host_name:m.guest_name)+' gewinnt!'):m.reason==='draw'?'Unentschieden!':m.reason==='funding_failed'?'Runde nicht gestartet':'Runde beendet';
   const botWon=m.bot&&!m.winner&&['bot_win','forfeit','turn_timeout'].includes(m.reason);
   if(botWon)text='Yoyoo Bot gewinnt!';
   if(m.status==='funding')text=m.bot?'Yoyoo Bot prüft und reserviert deinen Einsatz …':'Yoyoo Bot prüft und reserviert eure Einsätze …';if(m.status==='review')text='Punktebuchung wird geprüft';
   let resultBanner=null;
   if(['settling','finished'].includes(m.status)&&m.reason!=='funding_failed'){
     const outcome=m.winner===me?'win':m.winner||botWon?'loss':'draw';panel.classList.add('mg-is-'+outcome);const resultKey=m.id+':'+outcome;if(!results.has(resultKey)){results.add(resultKey);panel.classList.add('mg-result-new');}
     const banner=make('div','mg-result-banner');banner.append(make('span','mg-result-word',outcome==='win'?'SIEG':outcome==='loss'?'NIEDERLAGE':'UNENTSCHIEDEN'),make('span','mg-result-caption',outcome==='win'?'DIE ARENA GEHÖRT DIR':outcome==='loss'?'DIE NÄCHSTE RUNDE WARTET':'PERFEKT PARIERT'));banner.setAttribute('role','status');resultBanner=banner;
   }
   if(!resultBanner)panel.append(make('h2','mg-status',text));
   if(m.reason==='turn_timeout')panel.append(make('p','mg-muted','Die Zugzeit ist abgelaufen.'));if(m.reason==='forfeit')panel.append(make('p','mg-muted','Die Runde wurde durch Aufgabe entschieden.'));
   if(m.status==='playing'){const timer=make('div','mg-timer');timer.append(make('span'));panel.append(timer,make('p','mg-countdown mg-muted'));}
   if(['playing','settling','finished'].includes(m.status)){
     const board=make('div','mg-board');board.setAttribute('role','group');board.setAttribute('aria-label','Tic-Tac-Toe-Spielfeld');const won=new Set();
     for(const line of [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]])if(m.board[line[0]]!=='.'&&line.every(i=>m.board[i]===m.board[line[0]]))line.forEach(i=>won.add(i));
     const oldBoard=boards.get(m.id);let drops=0;
     [...m.board].forEach((s,i)=>{const fresh=oldBoard&&oldBoard[i]==='.'&&s!=='.';const b=make('button','mg-cell'+(s==='O'?' o':'')+(won.has(i)?' won':'')+(fresh?' mg-drop':''));if(fresh)b.style.setProperty('--drop-delay',(drops++*.5)+'s');b.type='button';b.disabled=s!=='.'||m.status!=='playing'||m.turn!==me;b.setAttribute('aria-label','Zeile '+(Math.floor(i/3)+1)+', Spalte '+(i%3+1)+': '+(s==='.'?'leer':s));
       if(s!=='.'){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');const shape=document.createElementNS(svg.namespaceURI,s==='X'?'path':'circle');if(s==='X')shape.setAttribute('d','M20 20 L80 80 M80 20 L20 80');else{shape.setAttribute('cx','50');shape.setAttribute('cy','50');shape.setAttribute('r','31');}svg.append(shape);b.append(svg);}b.onclick=()=>act('move',{match_id:m.id,cell:i,revision:m.revision});board.append(b);});const stage=make('div','mg-board-stage');stage.append(board);if(resultBanner){stage.classList.add('mg-board-ended');stage.append(resultBanner);}panel.append(stage);
     boards.set(m.id,m.board);
     if(won.size){const cells=[...won];const line=document.createElementNS('http://www.w3.org/2000/svg','svg');line.setAttribute('viewBox','0 0 100 100');line.classList.add('mg-win-line');line.setAttribute('aria-hidden','true');const path=document.createElementNS(line.namespaceURI,'path');const xy=i=>[(i%3)*33.333+16.667,Math.floor(i/3)*33.333+16.667];path.setAttribute('d','M'+xy(cells[0]).join(' ')+' L'+xy(cells[2]).join(' '));line.append(path);board.append(line);}
   }
   panel.append(make('p','mg-chip',m.stake.toLocaleString('de-DE')+' YY Points Einsatz'));
   if(m.status==='settling')panel.append(make('p','mg-muted','Yoyoo Bot bestätigt die Auszahlung beziehungsweise Rückgabe der reservierten Punkte.'));
   if(m.status==='review')panel.append(make('p','mg-error','Eine Buchung wurde nicht eindeutig bestätigt. Die Runde bleibt zur Vermeidung doppelter Buchungen gesperrt. Kontaktiere das Yoyoo-Team mit der Runden-ID: '+m.id));
   if(m.status==='playing')panel.append(btn('Aufgeben',()=>{if(confirm('Wirklich aufgeben? Dein Gegner gewinnt die Runde und bei einem Einsatz auch die reservierten Punkte.'))act('leave',{match_id:m.id});},true));
   if(m.status==='finished'){
     if(m.bot&&m.stake>0&&m.reason!=='funding_failed')panel.append(make('p','mg-bot-accounting',m.winner===me?'+'+m.stake.toLocaleString('de-DE')+' YY Points Gewinn · '+(m.stake*2).toLocaleString('de-DE')+' inklusive Einsatz gutgeschrieben.':m.reason==='draw'?m.stake.toLocaleString('de-DE')+' YY Points Einsatz zurückgegeben.':'−'+m.stake.toLocaleString('de-DE')+' YY Points · Einsatz verloren.'));
     if(!returns.has(m.id))returns.set(m.id,Date.now()+30000);
     panel.append(make('p','mg-return-countdown mg-muted'),btn('Zur Spielersuche',playerSearch));
     if(m.winner===me&&!celebrated.has(m.id)){celebrated.add(m.id);if(!matchMedia('(prefers-reduced-motion: reduce)').matches)for(let i=0;i<28;i++){const p=make('i','mg-confetti');p.style.setProperty('--x',Math.random()*100+'%');p.style.setProperty('--c',['#70f7c7','#b49aff','#ffce75'][i%3]);p.style.setProperty('--r',Math.random()*180+'deg');p.style.animationDelay=Math.random()*.3+'s';panel.append(p);}}
   }
 }
 function tick(){if(!app||!state)return;const pause=Math.max(0,Math.ceil((Date.parse(state.next_play_at||'1970-01-01')-Date.now()-offset)/1000));const cooldown=$('mg-cooldown');if(cooldown){cooldown.hidden=pause===0;cooldown.textContent='Spielpause · Noch '+Math.floor(pause/60)+':'+String(pause%60).padStart(2,'0')+' bis zur nächsten Runde.';}app.querySelectorAll('.mg-start-game').forEach(b=>b.disabled=pause>0||b.dataset.busy==='true');if(!state.match)return;if(state.match.status==='finished'&&state.match.id!==hiddenMatch){const left=Math.max(0,Math.ceil((returns.get(state.match.id)-Date.now())/1000));const back=app.querySelector('.mg-return-countdown');if(back)back.textContent='Zur Spielersuche in '+left+' Sekunden.';if(left===0){playerSearch();return;}}const secs=Math.max(0,Math.ceil((Date.parse(state.match.deadline)-Date.now()-offset)/1000));const n=app.querySelector('.mg-countdown');if(n)n.textContent=secs+' Sekunden verbleibend';const bar=app.querySelector('.mg-timer span');if(bar)bar.style.width=Math.min(100,secs/90*100)+'%';}
 async function poll(){if(waiting)return false;if(!gate()){state=null;signature='';liveMatches.clear();returns.clear();hiddenMatch=null;toasts.replaceChildren();return false;}const uid=window.YoyooAuth.user().id;if(lastUser!==uid){seen.clear();lastUser=uid;hiddenMatch=null;returns.clear();liveMatches.clear();try{lastNotice=Number(sessionStorage.getItem('yoyoo-minigames-notice:'+uid)||0);}catch{lastNotice=0;}}try{receive(await api('snapshot'));update();if(app){$('mg-connection').textContent='Live verbunden';$('mg-error').hidden=true;}return true;}catch(e){if(app){$('mg-connection').textContent='Verbindung unterbrochen';error(e.message);}return false;}}
 (async()=>{
   await window.yoyooAuthReady;
   if(app){
     await import('./chess-ui.mjs?v=20261026-chess-1');
     const chessOpen=$('mg-open-chess');
     if(chessOpen)chessOpen.onclick=()=>{selectedGame='chess';opened=true;render();window.scrollTo({top:0,behavior:'instant'});};
     $('mg-open-game').onclick=()=>{selectedGame='tic_tac_toe';opened=true;render();window.scrollTo({top:0,behavior:'instant'});};
     $('mg-back-games').onclick=allGames;
     const refresh=$('mg-refresh');
     if(refresh)refresh.onclick=async()=>{if(waiting)return;refresh.disabled=true;refresh.textContent='Wird aktualisiert …';$('mg-refresh-status').textContent='';try{const ok=await poll();$('mg-refresh-status').textContent=ok?'Spielerliste aktualisiert.':'Aktualisierung nicht möglich. Bitte erneut versuchen.';}finally{refresh.disabled=false;refresh.textContent='Aktualisieren';}};
   }
   await poll();
   if(app){const code=new URL(location.href).searchParams.get('chess');if(code&&/^[a-f0-9]{48}$/.test(code)){selectedGame='chess';await act('chess_join',{code});}}
   setInterval(poll,5000);setInterval(tick,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll();});
 })();
})();
