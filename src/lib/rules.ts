export const RULE_VERSION='squid-rules-v1-2026-11-07';
export type Mode='finite'|'infinite';
export interface Rules {version:typeof RULE_VERSION;mode:Mode;players:number;unit:number}
export type HandEvent={kind:'win';seat:number;shown:boolean}|{kind:'chop'|'side-only'};
export interface Transfer {from:number;to:number;bb:number}
export interface Settlement {payouts:number[];transfers:Transfer[]}
export interface Round {rules:Rules;marks:number[];remaining:number;nextAward:number;hands:number;ended:boolean;reason:'last-unmarked'|'supply'|null;settlement:Settlement|null}
export function rules(mode:Mode,players=6,unit=5):Rules{
 if(!['finite','infinite'].includes(mode)||!Number.isInteger(players)||players<3||players>9||!Number.isFinite(unit)||unit<0||unit>100||Math.abs(unit*100-Math.round(unit*100))>1e-8)throw Error('Invalid rule settings');
 return {version:RULE_VERSION,mode,players,unit};
}
export function validEvent(event:unknown,players:number):event is HandEvent{
 if(!event||typeof event!=='object')return false;const e=event as HandEvent;
 return e.kind==='chop'||e.kind==='side-only'||(e.kind==='win'&&Number.isInteger(e.seat)&&e.seat>=0&&e.seat<players&&typeof e.shown==='boolean');
}
export function markUnits(mode:Mode,count:number){return count*(mode==='infinite'&&count>=3?2:1);}
export function settle(r:Rules,marks:number[]):Settlement{
 const cents=Array(r.players).fill(0) as number[],transfers:Transfer[]=[];
 marks.forEach((count,from)=>{if(count)return;marks.forEach((holding,to)=>{if(!holding)return;const amount=Math.round(r.unit*100)*markUnits(r.mode,holding);cents[from]-=amount;cents[to]+=amount;transfers.push({from,to,bb:amount/100});});});
 return {payouts:cents.map(value=>value/100),transfers};
}
export function startRound(r:Rules):Round{
 const checked=rules(r.mode,r.players,r.unit);if(r.version!==RULE_VERSION)throw Error('Unsupported rules');
 return {rules:checked,marks:Array(r.players).fill(0),remaining:r.mode==='finite'?r.players-1:r.players+3,nextAward:r.mode==='finite'?1:2,hands:0,ended:false,reason:null,settlement:null};
}
/** Pure transition. Main-pot qualification is explicit; a side-pot event never implies a main-pot winner. */
export function applyEvent(previous:Round,event:HandEvent):Round{
 if(!validEvent(event,previous.rules.players))throw Error('Invalid hand event');
 if(previous.ended)return previous;
 const s={...previous,marks:[...previous.marks],hands:previous.hands+1};
 if(event.kind==='chop'&&s.rules.mode==='infinite')s.nextAward=Math.min(s.remaining,s.nextAward+1);
 if(event.kind==='win'){
  const has=s.marks[event.seat]>0;
  const qualified=(has||event.shown)&&(s.rules.mode==='infinite'||!has);
  if(qualified){const awarded=Math.min(s.remaining,s.nextAward);s.marks[event.seat]+=awarded;s.remaining-=awarded;s.nextAward=1;}
 }
 const missing=s.marks.filter(count=>count===0).length;
 if(missing===1||s.remaining===0){s.ended=true;s.reason=missing===1?'last-unmarked':'supply';s.settlement=settle(s.rules,s.marks);}
 return s;
}
export function replay(r:Rules,events:HandEvent[]):Round[]{
 if(events.length>1000)throw Error('At most 1000 events');
 const states=[startRound(r)];for(const event of events)states.push(applyEvent(states[states.length-1],event));return states;
}
export const POSITIONS=['UTG','HJ','CO','BTN','SB','BB'];
export const PREFIX:HandEvent[]=[0,1,2,3,1,0].map(seat=>({kind:'win',seat,shown:true}));
export function seatName(index:number,players:number){return players===6?POSITIONS[index]:String.fromCharCode(65+index);}
