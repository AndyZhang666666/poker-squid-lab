import {seededRandom} from './poker/cards.ts';
import {applyEvent,rules,startRound,type HandEvent,type Mode} from './rules.ts';
export interface SimulationInput {players:number;unit:number;weights:number[];seed:number;trials:number;chopRate:number}
export interface SeatStats {unmarked:number;mean:number;interval:[number,number];distribution:[number,number][]}
export interface ModeStats {completed:number;unfinished:number;meanHands:number;seats:SeatStats[]}
export interface SimulationResult {version:1;input:SimulationInput;finite:ModeStats;infinite:ModeStats}
export function validateSimulation(input:SimulationInput){
 rules('finite',input.players,input.unit);
 if(!Array.isArray(input.weights)||input.weights.length!==input.players||!input.weights.every(w=>Number.isFinite(w)&&w>=1&&w<=100)||!Number.isInteger(input.seed)||input.seed<0||input.seed>0xffffffff||!Number.isInteger(input.trials)||input.trials<1||input.trials>20000||!Number.isFinite(input.chopRate)||input.chopRate<0||input.chopRate>.5)throw Error('Invalid simulation settings');
 return input;
}
export function wilson(success:number,total:number):[number,number]{if(!total)return [0,1];const z=1.959964,p=success/total,d=1+z*z/total,center=(p+z*z/(2*total))/d,half=z*Math.sqrt(p*(1-p)/total+z*z/(4*total*total))/d;return [Math.max(0,center-half),Math.min(1,center+half)];}
/** Paired outcomes: both rules see exactly the same winner/chop sequence per trial. No adaptive poker strategy. */
export function simulate(input:SimulationInput,progress?:(done:number)=>void):SimulationResult{
 validateSimulation(input);const random=seededRandom(input.seed),sum=input.weights.reduce((a,b)=>a+b,0);
 const stats=()=>({completed:0,unfinished:0,hands:0,unmarked:Array(input.players).fill(0),totals:Array(input.players).fill(0),hist:Array.from({length:input.players},()=>new Map<number,number>())});
 const out={finite:stats(),infinite:stats()};
 for(let trial=0;trial<input.trials;trial++){
  const rounds={finite:startRound(rules('finite',input.players,input.unit)),infinite:startRound(rules('infinite',input.players,input.unit))};
  for(let hand=0;hand<1000&&!(rounds.finite.ended&&rounds.infinite.ended);hand++){
   let event:HandEvent;if(random()<input.chopRate)event={kind:'chop'};else{let value=random()*sum,seat=input.players-1;for(let i=0;i<input.players;i++){value-=input.weights[i];if(value<0){seat=i;break;}}event={kind:'win',seat,shown:true};}
   for(const mode of ['finite','infinite'] as const)rounds[mode]=applyEvent(rounds[mode],event);
  }
  for(const mode of ['finite','infinite'] as const){const r=rounds[mode],s=out[mode];if(!r.ended){s.unfinished++;continue;}s.completed++;s.hands+=r.hands;r.marks.forEach((mark,i)=>{if(!mark)s.unmarked[i]++;const cents=Math.round(r.settlement!.payouts[i]*100);s.totals[i]+=cents;s.hist[i].set(cents,(s.hist[i].get(cents)||0)+1);});}
  if((trial+1)%100===0||trial===input.trials-1)progress?.(trial+1);
 }
 const summary=(mode:Mode):ModeStats=>{const s=out[mode];return {completed:s.completed,unfinished:s.unfinished,meanHands:s.completed?s.hands/s.completed:0,seats:s.unmarked.map((n,i)=>({unmarked:n,mean:s.completed?s.totals[i]/100/s.completed:0,interval:wilson(n,s.completed),distribution:[...s.hist[i]].sort((a,b)=>a[0]-b[0]).map(([c,n])=>[c/100,n])}))};};
 return {version:1,input:structuredClone(input),finite:summary('finite'),infinite:summary('infinite')};
}
