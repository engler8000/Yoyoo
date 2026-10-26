import {pieceSVG} from './chess-pieces.mjs';
let active;
export function stopBoardMoves(){active?.();}
const create=(tag,cls,parent)=>{const n=document.createElement(tag);n.className=cls;parent?.append(n);return n;};
const colors={w:'#8affd2',b:'#cfafff'};
export function isHighlight(m){return !!(m.mate||m.promotion||m.piece==='q'&&['q','r'].includes(m.captured));}
export function playBoardMoves(stage,moves,settings){
 stopBoardMoves();if(!stage.isConnected||matchMedia('(prefers-reduced-motion: reduce)').matches||!moves.length)return;
 const layer=create('div','ch-board-action',stage);layer.setAttribute('aria-hidden','true');
 const animations=[],timers=[],hidden=new Set();let stopped=false;
 const cleanup=()=>{if(stopped)return;stopped=true;for(const a of animations)a.cancel();timers.forEach(clearTimeout);for(const n of hidden)n.style.visibility='';layer.remove();skip.remove();if(active===cleanup)active=null;};active=cleanup;
 const skip=create('button','ch-fx-skip',stage);skip.type='button';skip.textContent='Effekte überspringen';skip.onclick=cleanup;
 const later=(fn,delay)=>timers.push(setTimeout(()=>{if(!stopped&&stage.isConnected)fn();else cleanup();},delay));
 const animate=(n,frames,options)=>{const a=n.animate(frames,{fill:'both',...options});animations.push(a);return a;};
 const at=square=>{const cell=stage.querySelector(`[data-square="${square}"]`);if(!cell)return null;const b=cell.getBoundingClientRect(),s=stage.getBoundingClientRect(),scale=s.width/stage.offsetWidth;return {x:(b.left-s.left)/scale,y:(b.top-s.top)/scale,w:b.width/scale,h:b.height/scale};};
 const piece=(kind,color,p,cls='')=>{const n=create('span','ch-fx-piece '+cls,layer);Object.assign(n.style,{left:p.x+'px',top:p.y+'px',width:p.w+'px',height:p.h+'px'});n.append(pieceSVG(kind,color));return n;};
 const hide=square=>{const n=stage.querySelector(`[data-square="${square}"] .ch-piece`);if(n){hidden.add(n);n.style.visibility='hidden';}};
 const svgLine=(a,b,color,cls)=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class',cls);svg.setAttribute('viewBox',`0 0 ${stage.offsetWidth} ${stage.offsetHeight}`);svg.setAttribute('preserveAspectRatio','none');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',`M${a.x+a.w/2} ${a.y+a.h/2} L${b.x+b.w/2} ${b.y+b.h/2}`);path.setAttribute('stroke',color);svg.append(path);layer.append(svg);return svg;};
 const duration=m=>isHighlight(m)?2200:m.captured?1800:550;
 const effects={p:'Klingen-Dash',n:'Schatten-Sprung',b:'Prismenstrahl',r:'Turm-Schockwelle',q:'Sternenklingen',k:'Königs-Konter'};
 const result=stage.querySelector('.ch-result');if(result){hidden.add(result);result.style.visibility='hidden';}
 let total=0;for(const m of moves){hide(m.to);if(m.castle){const rank=m.to[1];hide((m.to[0]==='g'?'f':'d')+rank);}const start=total;later(()=>play(m,duration(m)),start);total+=duration(m)+70;}
 function play(m,d){
   const from=at(m.from),to=at(m.to);if(!from||!to)return;for(const n of layer.querySelectorAll('[data-square]'))if(n.dataset.square===m.from||n.dataset.square===m.to)n.remove();const actor=piece(m.piece,m.color,from),dx=to.x-from.x,dy=to.y-from.y,accent=colors[m.color],impact=d*.45;actor.dataset.square=m.to;
   layer.dataset.effect=m.captured?effects[m.piece]:'Zug';layer.dataset.phase='move';
   let target=m.ep?at(m.to[0]+m.from[1]):to;
   const halves=[];
   if(m.captured&&target){for(const side of [-1,1]){const half=piece(m.captured,m.color==='w'?'b':'w',target,'ch-fx-half');half.style.clipPath=side<0?'polygon(0 0,51% 0,51% 100%,0 100%)':'polygon(49% 0,100% 0,100% 100%,49% 100%)';halves.push({half,side});}}
   const straight=[{transform:'translate(0,0)'},{transform:`translate(${dx}px,${dy}px)`}];
   if(!m.captured){animate(actor,m.piece==='n'?[{transform:'translate(0,0)'},{transform:`translate(${dx*.5}px,${dy*.5-from.h*.65}px) scale(1.12)`,offset:.5},{transform:`translate(${dx}px,${dy}px)`}]:straight,{duration:d,easing:'cubic-bezier(.2,.7,.25,1)'});}
   else{
     const travel=Math.hypot(dx,dy)||1,ox=dx/travel*to.w*.22,oy=dy/travel*to.h*.22;
     const jump=m.piece==='n'?from.h*.9:m.piece==='q'?from.h*.25:0;
     animate(actor,[{transform:'translate(0,0)'},{transform:'translate(0,0)',offset:.18},{transform:`translate(${dx*.5}px,${dy*.5-jump}px) scale(1.12)`,offset:.33},{transform:`translate(${dx+ox}px,${dy+oy}px) rotate(-8deg)`,offset:.47},{transform:`translate(${dx+ox}px,${dy+oy}px)`,offset:.7},{transform:`translate(${dx}px,${dy}px)`}],{duration:d,easing:'cubic-bezier(.2,.7,.2,1)'});
     if(['p','k','q'].includes(m.piece)){
       const knife=create('span','ch-fx-knife',actor);knife.innerHTML='<svg viewBox="0 0 30 100" aria-hidden="true"><path d="M10 65V23L23 3L25 65Z" fill="#e8fff9" stroke="#92d8c5" stroke-width="2"/><path d="M5 66H29V72H5Z" fill="#d9ad55"/><path d="M12 72H22V98H12Z" fill="#352a23"/></svg>';
       animate(knife,[{opacity:0,transform:'translateY(18px) rotate(65deg)'},{opacity:1,transform:'translateY(0) rotate(-25deg)',offset:.2},{opacity:1,transform:'rotate(-25deg)',offset:.35},{opacity:1,transform:'rotate(120deg)',offset:.53},{opacity:0,transform:'rotate(120deg)'}],{duration:d});
     }
     if(m.piece==='n')for(let j=1;j<=3;j++){const shadow=piece(m.piece,m.color,from,'ch-fx-shadow');animate(shadow,[{opacity:0,transform:'translate(0,0)'},{opacity:.35,offset:.25},{opacity:0,transform:`translate(${dx}px,${dy}px)`}],{duration:d*.65,delay:j*55});}
     if(m.piece==='b'){const beam=svgLine(from,to,accent,'ch-fx-beam');animate(beam,[{opacity:0},{opacity:1,offset:.35},{opacity:0}],{duration:d*.65});}
     if(m.piece==='q')for(let j=0;j<4;j++){const star=create('span','ch-fx-star',layer);star.textContent='✦';Object.assign(star.style,{left:to.x+to.w/2+'px',top:to.y+to.h/2+'px',color:accent});const a=j*Math.PI/2;animate(star,[{opacity:0,transform:`translate(${Math.cos(a)*to.w}px,${Math.sin(a)*to.h}px) rotate(0)`},{opacity:1,offset:.2},{opacity:0,transform:'translate(0,0) rotate(220deg)'}],{duration:d*.6,delay:d*.12});}
     const streak=svgLine(from,to,accent,'ch-fx-streak');animate(streak,[{opacity:0},{opacity:.7,offset:.35},{opacity:0}],{duration:d*.7});
     later(()=>{layer.dataset.phase='split';for(const {half,side} of halves)animate(half,[{opacity:1,transform:'translate(0,0) rotate(0)'},{opacity:1,transform:`translate(${side*to.w*.35}px,${-to.h*.13}px) rotate(${side*22}deg)`,offset:.45},{opacity:0,transform:`translate(${side*to.w*.65}px,${to.h*.4}px) rotate(${side*65}deg)`}],{duration:d-impact});
       const arc=create('i','ch-fx-slash',layer);Object.assign(arc.style,{left:to.x-to.w*.1+'px',top:to.y+to.h*.2+'px',width:to.w*1.2+'px',height:to.h*.6+'px',borderColor:accent});animate(arc,[{opacity:0,transform:'scale(.4) rotate(-45deg)'},{opacity:1,offset:.2},{opacity:0,transform:'scale(1.4) rotate(30deg)'}],{duration:450});
       for(let i=0;i<(m.piece==='r'?3:1);i++){const ring=create('i','ch-fx-ring',layer);Object.assign(ring.style,{left:to.x+'px',top:to.y+'px',width:to.w+'px',height:to.h+'px',borderColor:accent});animate(ring,[{opacity:.8,transform:'scale(.3)'},{opacity:0,transform:`scale(${m.piece==='r'?2.7:1.6})`}],{duration:550,delay:i*80});}
       const count=innerWidth<650?8:14;for(let i=0;i<count;i++){const spark=create('i','ch-fx-spark',layer);Object.assign(spark.style,{left:to.x+to.w/2+'px',top:to.y+to.h/2+'px',background:accent});const a=i*2.399;animate(spark,[{opacity:1,transform:'translate(0,0)'},{opacity:0,transform:`translate(${Math.cos(a)*to.w*.85}px,${Math.sin(a)*to.h*.85}px) rotate(180deg)`}],{duration:450+i%3*60});}
     },impact);
   }
   if(m.castle){const rank=m.to[1],rookFrom=at((m.to[0]==='g'?'h':'a')+rank),rookTo=at((m.to[0]==='g'?'f':'d')+rank);if(rookFrom&&rookTo){const rook=piece('r',m.color,rookFrom);animate(rook,[{transform:'translate(0,0)'},{transform:`translate(${rookTo.x-rookFrom.x}px,${rookTo.y-rookFrom.y}px)`}],{duration:d});}}
   if(settings.cinema&&isHighlight(m)){
     stage.dataset.highlight=m.mate?'mate':m.promotion?'promotion':'queen-capture';
     const bounds=stage.getBoundingClientRect();stage.style.transformOrigin=`${(to.x+to.w/2)/bounds.width*100}% ${(to.y+to.h/2)/bounds.height*100}%`;
     animate(stage,[{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(1.12)',filter:'brightness(1.12)',offset:.35},{transform:'scale(1.12)',offset:.65},{transform:'scale(1)',filter:'brightness(1)'}],{duration:d+450,easing:'ease-in-out'});
   }
   if(m.promotion)later(()=>actor.replaceChildren(pieceSVG(m.promotion,m.color)),d*.85);
   later(()=>halves.forEach(({half})=>half.remove()),d);
 }
 later(cleanup,total+500);return cleanup;
}
