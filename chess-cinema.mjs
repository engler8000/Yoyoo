import {createPieceFactory} from './chess-models.mjs';
// Local, procedural 3D pieces; WebGL is optional and never changes the match.
let activeStop;
export async function playCinema(move,board){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduced)return;
 let THREE;try{THREE=await import('./three.module.min.js');}catch{return;}activeStop?.();
 const overlay=document.createElement('div');overlay.className='ch-cinema';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label','Schachmoment');overlay.setAttribute('aria-modal','true');
 const caption=document.createElement('h2');caption.textContent=move.mate?'SCHACHMATT':move.promotion?'DIE KRÖNUNG':move.captured?({p:'BAUER · KLINGEN-DASH',n:'SPRINGER · SCHATTENSCHNITT',b:'LÄUFER · LICHTSCHNITT',r:'TURM · DONNERSCHLAG',q:'DAME · ARKANE KLINGE',k:'KÖNIG · LETZTER SCHNITT'}[move.piece]):'DIE ARENA BEBT';
 const skip=document.createElement('button');skip.className='btn';skip.textContent='Animation überspringen';overlay.append(caption,skip);document.body.append(overlay);
 const flash=document.createElement('div');flash.className='ch-cinema-flash';flash.setAttribute('aria-hidden','true');overlay.prepend(flash);
 let renderer,frame,finished=false;const previous=document.activeElement;
 const stop=()=>{if(finished)return;finished=true;cancelAnimationFrame(frame);scene?.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});renderer?.dispose();overlay.remove();document.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visibility);if(activeStop===stop)activeStop=null;previous?.focus?.();};
 const key=e=>{if(e.key==='Escape')stop();if(e.key==='Tab'){e.preventDefault();skip.focus();}};skip.onclick=stop;document.addEventListener('keydown',key);skip.focus();
 const visibility=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',visibility);activeStop=stop;
 let scene;
 try{
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.localClippingEnabled=true;renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<650?1.25:1.5));renderer.setSize(innerWidth,innerHeight);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;overlay.prepend(renderer.domElement);
 scene=new THREE.Scene();scene.background=new THREE.Color('#071b20');scene.fog=new THREE.Fog('#071b20',14,32);
 const camera=new THREE.PerspectiveCamera(46,innerWidth/innerHeight,.1,80);scene.add(new THREE.AmbientLight('#b7c9e9',2));const light=new THREE.DirectionalLight('#b1ffe1',4);light.position.set(2,8,5);scene.add(light);const fill=new THREE.PointLight('#ab75ff',40,20);fill.position.set(-4,5,-3);scene.add(fill);
 const makeMat=(color,metalness=.3)=>new THREE.MeshStandardMaterial({color,metalness,roughness:.28});const white=makeMat('#b9ffe6'),black=makeMat('#8270b9');
 const mesh=(geometry,material,x,y,z,parent=scene)=>{const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);parent.add(o);return o;};
 for(let r=0;r<8;r++)for(let f=0;f<8;f++)mesh(new THREE.BoxGeometry(.98,.16,.98),makeMat((r+f)%2?'#153b3e':'#769c96',.1),f-3.5,-.1,r-3.5);
 const piece=createPieceFactory(THREE,scene,mesh);
 const coord=s=>[s.charCodeAt(0)-100.5,8-Number(s[1])-3.5];let mover;
 for(const row of board)for(const p of row){if(!p||p.square===move.to)continue;const [x,z]=coord(p.square);piece(p.type,p.color,x,z);}
 const from=coord(move.from),to=coord(move.to),direction=new THREE.Vector3(to[0]-from[0],0,to[1]-from[1]).normalize(),side=new THREE.Vector3(direction.z,0,-direction.x),victimAt=new THREE.Vector3(to[0],0,move.ep?from[1]:to[1]);
 mover=piece(move.piece,move.color,...from);mover.rotation.y=Math.atan2(-direction.x,-direction.z);const victim=move.captured?piece(move.captured,move.color==='w'?'b':'w',victimAt.x,victimAt.z):null;
 const halves=[];
 if(victim)for(const sign of [-1,1]){const half=victim.clone(true),normal=side.clone().multiplyScalar(sign),plane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,victimAt);half.visible=false;
   half.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.clippingPlanes=[plane];o.material.side=THREE.DoubleSide;o.material.transparent=true;}});
   const capShape=new THREE.Shape();const outline=[[.33,0],[.35,.09],[.26,.17],[.2,.22],[.13,.5],[.17,.62],[.12,.72],[-.12,.72],[-.17,.62],[-.13,.5],[-.2,.22],[-.26,.17],[-.35,.09],[-.33,0]];outline.forEach(([x,y],i)=>i?capShape.lineTo(x,y):capShape.moveTo(x,y));capShape.closePath();
   const cap=mesh(new THREE.ShapeGeometry(capShape),new THREE.MeshStandardMaterial({color:'#ffe6ae',emissive:'#a05510',emissiveIntensity:1.3,side:THREE.DoubleSide,transparent:true}),0,0,0,half);cap.rotation.y=Math.atan2(direction.x,direction.z)+Math.PI/2;
   scene.add(half);halves.push({object:half,normal,plane,sign});}
 const accent=move.color==='w'?'#72ffcd':'#caa3ff',blade=new THREE.Group();blade.position.set(.31,.52,-.22);mover.add(blade);
 mesh(new THREE.CylinderGeometry(.055,.065,.3,8),makeMat('#15212a'),0,.05,0,blade);mesh(new THREE.BoxGeometry(.25,.065,.1),makeMat('#d6ad56'),0,.23,0,blade);
 const knife=new THREE.Shape();knife.moveTo(-.055,.24);knife.lineTo(.12,.24);knife.lineTo(.11,.87);knife.lineTo(-.04,1.12);knife.closePath();mesh(new THREE.ExtrudeGeometry(knife,{depth:.045,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:1}),new THREE.MeshStandardMaterial({color:'#e4f7ff',metalness:.95,roughness:.13,emissive:accent,emissiveIntensity:.4}),0,0,0,blade);blade.visible=false;
 const spell=mesh(new THREE.IcosahedronGeometry(.25,1),new THREE.MeshBasicMaterial({color:move.color==='w'?'#b8fff1':'#d1a4ff',wireframe:true}),0,1.45,0,mover);spell.visible=false;
 const ring=mesh(new THREE.TorusGeometry(.5,.035,8,40),new THREE.MeshBasicMaterial({color:'#93ffe1',transparent:true,opacity:0}),... [to[0],.3,to[1]]);ring.rotation.x=Math.PI/2;
 const additive=(color,opacity=0)=>new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
 const slash=mesh(new THREE.TorusGeometry(.9,.035,6,50,Math.PI*1.7),additive('#e4ffef'),victimAt.x,.7,victimAt.z);slash.rotation.set(.3,Math.atan2(direction.x,direction.z),-.55);
 const trail=mesh(new THREE.ConeGeometry(.24,1,6),additive(accent),0,.5,0);trail.rotation.set(Math.PI/2,0,Math.atan2(direction.x,direction.z));
 const impactLight=new THREE.PointLight('#b5fff0',0,9);impactLight.position.copy(victimAt);impactLight.position.y=1.2;scene.add(impactLight);
 const count=innerWidth<650?44:76,positions=new Float32Array(count*3),velocities=[];for(let i=0;i<count;i++){positions.set([victimAt.x,.65,victimAt.z],i*3);const a=i*2.39996;velocities.push(new THREE.Vector3(Math.cos(a)*(1+i%5*.3),1.2+(i%7)*.23,Math.sin(a)*(1+i%4*.4)));}
 const particlesGeo=new THREE.BufferGeometry();particlesGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));const particlesMat=new THREE.PointsMaterial({color:'#ffe6ad',size:.055,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});scene.add(new THREE.Points(particlesGeo,particlesMat));
 let promoted;if(move.promotion){promoted=piece(move.promotion,move.color,...to);promoted.visible=false;}
 const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>v*v*(3-2*v),start=performance.now(),duration=move.mate?4800:move.captured?4200:3800;
 function animate(now){if(finished)return;const t=clamp((now-start)/duration),dash=clamp((t-.2)/.18),impact=.38,after=clamp((t-impact)/.3),cut=t>=impact,pass=[to[0]+direction.x*(move.captured?.9:0),to[1]+direction.z*(move.captured?.9:0)];overlay.dataset.phase=t<.2?'draw':t<impact?'dash':t<.78?'split':'return';
   let progress=t<.2?0:t<impact?dash*dash*dash:1;const back=smooth(clamp((t-.72)/.18));mover.position.set(from[0]+(pass[0]-from[0])*progress+(to[0]-pass[0])*back,move.piece==='n'?Math.sin(clamp((t-.2)/.24)*Math.PI)*1.8:Math.sin(dash*Math.PI)*.12,from[1]+(pass[1]-from[1])*progress+(to[1]-pass[1])*back);mover.rotation.z=t>.2&&t<impact?-.18:0;
   blade.visible=t>.06&&t<.88;const draw=clamp((t-.06)/.1);blade.scale.setScalar(draw);blade.rotation.z=t<.2?1.8-2.6*draw:t<.44?-.8+3.1*clamp((t-.29)/.15):2.3;blade.rotation.x=-.45;
   spell.visible=['q','b'].includes(move.piece)&&t>.08&&t<.55;spell.rotation.y=t*30;spell.rotation.z=t*17;spell.scale.setScalar(.8+Math.sin(t*12)*.4);
   if(victim){victim.visible=!cut;for(const h of halves){const p=h.object;p.visible=cut;p.position.copy(victimAt).addScaledVector(side,h.sign*(.07+after*1.25)).addScaledVector(direction,after*.35);p.position.y=after*1.25-after*after*.8;p.rotation.set(after*h.sign*.9,after*h.sign*.75,after*h.sign*1.1);h.plane.setFromNormalAndCoplanarPoint(h.normal.clone().applyQuaternion(p.quaternion),p.position);p.traverse(o=>{if(o.isMesh)o.material.opacity=1-clamp((t-.78)/.2);});}}
   trail.position.copy(mover.position).addScaledVector(direction,-1);trail.scale.set(1,2.5,1);trail.material.opacity=t>.21&&t<.43?Math.sin(clamp((t-.2)/.23)*Math.PI)*.65:0;
   slash.material.opacity=cut?Math.max(0,1-(t-impact)*5):0;slash.scale.setScalar(1+after*.8);slash.rotation.z=-.55+after*.8;
   ring.material.opacity=cut?Math.max(0,.9-(t-impact)*2):0;ring.scale.setScalar(1+after*(move.piece==='r'?10:7));impactLight.intensity=cut?Math.max(0,32-(t-impact)*120):0;flash.style.opacity=String(cut?Math.max(0,.58-(t-impact)*12):0);
   if(cut){const p=(t-impact)*duration/1000;particlesMat.opacity=Math.max(0,1-p/1.7);for(let i=0;i<count;i++){const v=velocities[i];positions[i*3]=victimAt.x+v.x*p;positions[i*3+1]=.65+v.y*p-2*p*p;positions[i*3+2]=victimAt.z+v.z*p;}particlesGeo.attributes.position.needsUpdate=true;}
   if(promoted&&t>.55){promoted.visible=true;promoted.scale.setScalar(smooth(clamp((t-.55)/.2)));mover.visible=false;}
   const zoom=t<.2?smooth(t/.2):t>.78?1-smooth((t-.78)/.22):1,portrait=innerWidth<650,radius=(portrait?17:13)*(1-zoom)+(portrait?7:4.2)*zoom,angle=Math.atan2(direction.x,direction.z)+.7+(t<impact?t*.6:.23+(t-impact)*1.6),focus=new THREE.Vector3(from[0],0,from[1]).lerp(victimAt,smooth(clamp(t/.3))),shake=cut?Math.max(0,.13-(t-impact)*.9):0;
   camera.position.set(focus.x+Math.sin(angle)*radius+Math.sin(now*.14)*shake,8*(1-zoom)+2.5*zoom+Math.cos(now*.12)*shake,focus.z+Math.cos(angle)*radius);camera.lookAt(focus.x,.48,focus.z);renderer.render(scene,camera);if(t>=1)stop();else frame=requestAnimationFrame(animate);
 }frame=requestAnimationFrame(animate);
 }catch{stop();}
 return stop;
}
