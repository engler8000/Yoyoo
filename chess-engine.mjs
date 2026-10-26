// Yoyoo chess: deterministic rules are shared; only the server chooses bot moves.
import {Chess} from './chess-rules.mjs';
export {Chess};
export const START='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
export const LEVELS={easy:{label:'Leicht',depth:1,nodes:120,cap:0,bonus:0},medium:{label:'Mittel',depth:2,nodes:1800,cap:100,bonus:.25},hard:{label:'Schwer',depth:3,nodes:6500,cap:250,bonus:.5},ultra:{label:'Ultraschwer',depth:5,nodes:22000,cap:500,bonus:1}};
const value={p:100,n:320,b:335,r:500,q:900,k:20000};
export function position(m){const c=new Chess();for(const san of m.chess.moves||[])c.move(san);return c;}
export function repetitionCount(c){const history=c.history({verbose:true});const keys=[START.split(' ').slice(0,4).join(' '),...history.map(m=>m.after.split(' ').slice(0,4).join(' '))];return keys.filter(k=>k===c.fen().split(' ').slice(0,4).join(' ')).length;}
// Claimable draws are separate from automatic fivefold / 75-move draws.
export function outcome(c){if(c.isCheckmate())return c.turn()==='w'?'black':'white';if(c.isStalemate()||c.isInsufficientMaterial()||Number(c.fen().split(' ')[4])>=150||repetitionCount(c)>=5)return 'draw';return null;}
export function canClaim(c){return c.isThreefoldRepetition()||c.isDrawByFiftyMoves();}
function evaluate(c){let score=0;for(let i=0;i<128;i++){if(i&0x88){i+=7;continue;}const p=c._board[i];if(!p)continue;const f=i&7,r=7-(i>>4),advance=p.color==='w'?r:7-r;const center=7-(Math.abs(f-3.5)+Math.abs(r-3.5));score+=(p.color==='w'?1:-1)*(value[p.type]+(p.type==='p'?advance*8+center*3:p.type==='k'?-center*4:center*10));}return score*(c.turn()==='w'?1:-1);}
export function chooseMove(c,level='medium',random=Math.random){const config=LEVELS[level]||LEVELS.medium;const legal=c.moves({verbose:true});if(!legal.length)return null;if(level==='easy'&&random()<.55)return legal[Math.floor(random()*legal.length)].san;
 let nodes=0,stopped=false;const table=new Map();
 const order=m=> (m.captured?10*value[m.captured]-value[m.piece]:0)+(m.promotion?800:0)+(m.san?.includes('+')?40:0);
 // Internal move API is pinned to chess.js 1.4.0 and covered by search-state tests.
 function search(depth,alpha,beta,ply){if(++nodes>config.nodes){stopped=true;return evaluate(c);}const moves=c._moves();if(!moves.length)return c.isCheck()?-100000+ply:0;
   if(depth<=0)return evaluate(c);const key=c.fen()+':'+depth,old=table.get(key);if(old!==undefined)return old;
   let best=-Infinity,cut=false;moves.sort((a,b)=>order(b)-order(a));for(const m of moves){c._makeMove(m);const v=-search(depth-1,-beta,-alpha,ply+1);c._undoMove();best=Math.max(best,v);alpha=Math.max(alpha,v);if(alpha>=beta||stopped){cut=true;break;}}if(!cut)table.set(key,best);return best;
 }
 let best=legal[0].san;
 for(let depth=1;depth<=config.depth;depth++){let score=-Infinity,pick=best;const candidates=[...legal].sort((a,b)=>(b.san===best?1:0)-(a.san===best?1:0)||order(b)-order(a));for(const m of candidates){c.move(m);const s=-search(depth-1,-Infinity,-score,1);c.undo();if(stopped)break;if(s>score){score=s;pick=m.san;}}if(stopped)break;best=pick;if(score>90000)break;}
 return best;
}
export function moveInfo(c,m){return {from:m.from,to:m.to,piece:m.piece,color:m.color,captured:m.captured||null,promotion:m.promotion||null,san:m.san,check:c.isCheck(),mate:c.isCheckmate(),castle:m.flags.includes('k')||m.flags.includes('q'),ep:m.flags.includes('e')};}
