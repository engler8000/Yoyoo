// Local, procedural 3D pieces; WebGL is optional and never changes the match.
export async function playCinema(move,board){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduced)return;
 let THREE;try{THREE=await import('./three.module.min.js');}catch{return;}
 const overlay=document.createElement('div');overlay.className='ch-cinema';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label','Schachmoment');overlay.setAttribute('aria-modal','true');
 const caption=document.createElement('h2');caption.textContent=move.mate?'SCHACHMATT':move.promotion?'DIE KRÖNUNG':move.piece==='n'?'SPRINGERSTURM':'MAGISCHE KLINGE';
 const skip=document.createElement('button');skip.className='btn';skip.textContent='Animation überspringen';overlay.append(caption,skip);document.body.append(overlay);
 let renderer,frame,finished=false;const previous=document.activeElement;
 const stop=()=>{if(finished)return;finished=true;cancelAnimationFrame(frame);scene?.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});renderer?.dispose();overlay.remove();document.removeEventListener('keydown',key);previous?.focus?.();};
 const key=e=>{if(e.key==='Escape')stop();if(e.key==='Tab'){e.preventDefault();skip.focus();}};skip.onclick=stop;document.addEventListener('keydown',key);skip.focus();
 let scene;
 try{
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);overlay.prepend(renderer.domElement);
 scene=new THREE.Scene();scene.background=new THREE.Color('#071b20');scene.fog=new THREE.Fog('#071b20',14,32);
 const camera=new THREE.PerspectiveCamera(46,innerWidth/innerHeight,.1,80);scene.add(new THREE.AmbientLight('#b7c9e9',2));const light=new THREE.DirectionalLight('#b1ffe1',4);light.position.set(2,8,5);scene.add(light);const fill=new THREE.PointLight('#ab75ff',40,20);fill.position.set(-4,5,-3);scene.add(fill);
 const makeMat=(color,metalness=.3)=>new THREE.MeshStandardMaterial({color,metalness,roughness:.28});const white=makeMat('#b9ffe6'),black=makeMat('#8270b9');
 const mesh=(geometry,material,x,y,z,parent=scene)=>{const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);parent.add(o);return o;};
 for(let r=0;r<8;r++)for(let f=0;f<8;f++)mesh(new THREE.BoxGeometry(.98,.16,.98),makeMat((r+f)%2?'#153b3e':'#769c96',.1),f-3.5,-.1,r-3.5);
 function piece(type,color,x,z){const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);const mat=color==='w'?white:black;
   const profile=[[0,0],[.33,0],[.35,.09],[.26,.17],[.2,.22],[.13,.5],[.17,.62],[.12,.72],[0,.74]].map(([a,b])=>new THREE.Vector2(a,b));mesh(new THREE.LatheGeometry(profile,18),mat,0,0,0,group);
   if(type==='p')mesh(new THREE.SphereGeometry(.19,14,10),mat,0,.83,0,group);
   if(type==='r'){mesh(new THREE.CylinderGeometry(.3,.24,.2,12),mat,0,.84,0,group);for(let i=0;i<4;i++)mesh(new THREE.BoxGeometry(.12,.18,.12),mat,Math.cos(i*Math.PI/2)*.22,.99,Math.sin(i*Math.PI/2)*.22,group);}
   if(type==='n'){const head=mesh(new THREE.BoxGeometry(.3,.45,.24),mat,0,.9,-.03,group);head.rotation.x=-.4;mesh(new THREE.BoxGeometry(.24,.18,.4),mat,0,1.06,-.18,group);}
   if(type==='b'){const head=mesh(new THREE.ConeGeometry(.22,.48,16),mat,0,.94,0,group);head.rotation.z=-.15;}
   if(type==='q'){mesh(new THREE.CylinderGeometry(.28,.14,.3,14),mat,0,.94,0,group);for(let i=0;i<5;i++)mesh(new THREE.SphereGeometry(.065,8,6),mat,Math.cos(i*1.257)*.24,1.13,Math.sin(i*1.257)*.24,group);}
   if(type==='k'){mesh(new THREE.BoxGeometry(.11,.43,.11),mat,0,1.03,0,group);mesh(new THREE.BoxGeometry(.36,.1,.11),mat,0,1.12,0,group);}return group;
 }
 const coord=s=>[s.charCodeAt(0)-100.5,8-Number(s[1])-3.5];let mover;
 for(const row of board)for(const p of row){if(!p||p.square===move.to)continue;const [x,z]=coord(p.square);piece(p.type,p.color,x,z);}
 const from=coord(move.from),to=coord(move.to);mover=piece(move.piece,move.color,...from);const victim=move.captured?piece(move.captured,move.color==='w'?'b':'w',...to):null;
 const blade=mesh(new THREE.BoxGeometry(.05,1.5,.13),new THREE.MeshBasicMaterial({color:move.color==='w'?'#72ffcd':'#caa3ff'}),.35,1.1,0,mover);blade.visible=false;
 const spell=mesh(new THREE.IcosahedronGeometry(.25,1),new THREE.MeshBasicMaterial({color:move.color==='w'?'#b8fff1':'#d1a4ff',wireframe:true}),0,1.45,0,mover);spell.visible=false;
 const ring=mesh(new THREE.TorusGeometry(.5,.035,8,40),new THREE.MeshBasicMaterial({color:'#93ffe1',transparent:true,opacity:0}),... [to[0],.3,to[1]]);ring.rotation.x=Math.PI/2;
 const start=performance.now(),duration=move.mate?4300:3400;
 function animate(now){if(finished)return;const t=Math.min(1,(now-start)/duration),progress=Math.min(1,Math.max(0,(t-.18)/.4));const ease=progress*progress*(3-2*progress);mover.position.x=from[0]+(to[0]-from[0])*ease;mover.position.z=from[1]+(to[1]-from[1])*ease;mover.position.y=Math.sin(progress*Math.PI)*(move.piece==='n'?2:1);
   blade.visible=['p','k'].includes(move.piece)&&t>.35&&t<.7;blade.rotation.z=Math.sin((t-.35)*12)*1.5;spell.visible=['q','b'].includes(move.piece)&&t>.3&&t<.75;spell.rotation.y=t*18;spell.rotation.z=t*10;spell.scale.setScalar(.8+Math.sin(t*12)*.4);if(move.piece==='r')mover.rotation.y=Math.sin(progress*Math.PI)*.6;if(victim&&t>.57){const v=Math.max(.001,1-(t-.57)*5);victim.scale.setScalar(v);victim.rotation.y+=.15;}if(t>.53){ring.material.opacity=Math.max(0,1-(t-.53)*3);ring.scale.setScalar(1+(t-.53)*(move.piece==='r'?12:8));}
   const angle=.3+t*2.2,radius= t<.18?14-t*35:t>.8?8+(t-.8)*28:7.8;camera.position.set(to[0]*.4+Math.sin(angle)*radius,5+Math.sin(t*Math.PI)*2,to[1]*.4+Math.cos(angle)*radius);camera.lookAt(to[0]*.6,.4,to[1]*.6);renderer.render(scene,camera);if(t>=1)stop();else frame=requestAnimationFrame(animate);
 }frame=requestAnimationFrame(animate);
 }catch{stop();}
 return stop;
}
