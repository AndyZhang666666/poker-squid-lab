import {RULE_VERSION,validEvent,rules,type HandEvent,type Mode} from './rules.ts';
import {compareSpot} from './spot.ts';
import {simulate,validateSimulation,type SimulationResult} from './simulation.ts';
import {challenges} from './challenges.ts';
export const STORE='squid-lab-session-v1';
export interface Attempt{id:string;question:string;choice:string;at:string}
export interface LabState {version:1;rulesVersion:typeof RULE_VERSION;spot:{pot:number;call:number;unit:number;guess:'call'|'fold'|null;revealed:boolean};sandbox:{players:number;unit:number;mode:Mode;events:HandEvent[];cursor:number;weights:number[];seed:number;chopRate:number};attempts:Attempt[];simulation:SimulationResult|null}
export function freshState():LabState{return {version:1,rulesVersion:RULE_VERSION,spot:{pot:30,call:15,unit:5,guess:null,revealed:false},sandbox:{players:6,unit:5,mode:'finite',events:[],cursor:0,weights:[1,1,1,1,1,1],seed:20261107,chopRate:0},attempts:[],simulation:null};}
export function simulationInput(s:LabState['sandbox']){return {players:s.players,unit:s.unit,weights:[...s.weights],seed:s.seed,chopRate:s.chopRate,trials:5000};}
export function isFreshResult(s:LabState){return !!s.simulation&&JSON.stringify(s.simulation.input)===JSON.stringify(simulationInput(s.sandbox));}
export function decodeSession(raw:string):LabState|null{
 if(new TextEncoder().encode(raw).byteLength>4000000)return null;
 try{const s=JSON.parse(raw) as LabState;
  if(!s||s.version!==1||s.rulesVersion!==RULE_VERSION||!s.spot||!s.sandbox||!Array.isArray(s.attempts)||s.attempts.length>200)return null;
  const p=s.spot,b=s.sandbox;compareSpot(p.pot,p.call,p.unit);
  if(![null,'call','fold'].includes(p.guess)||typeof p.revealed!=='boolean')return null;
  rules(b.mode,b.players,b.unit);validateSimulation(simulationInput(b));
  if(!Array.isArray(b.events)||b.events.length>1000||!b.events.every(e=>validEvent(e,b.players))||!Number.isInteger(b.cursor)||b.cursor<0||b.cursor>b.events.length)return null;
  const qs=challenges(),ids=new Set<string>();
  for(const a of s.attempts){const q=qs.find(q=>q.id===a.question);if(!a||typeof a.id!=='string'||a.id.length>100||!a.id||ids.has(a.id)||!q||!q.options.some(o=>o.id===a.choice)||typeof a.at!=='string'||a.at.length>40||!Number.isFinite(Date.parse(a.at)))return null;ids.add(a.id);}
  let simulation:SimulationResult|null=null;
  if(s.simulation!==null){if(s.simulation.version!==1)return null;validateSimulation(s.simulation.input);simulation=simulate(s.simulation.input);if(JSON.stringify(s.simulation)!==JSON.stringify(simulation))return null;}
  return {version:1,rulesVersion:RULE_VERSION,spot:{pot:p.pot,call:p.call,unit:p.unit,guess:p.guess,revealed:p.revealed},sandbox:{players:b.players,unit:b.unit,mode:b.mode,events:b.events.map(e=>e.kind==='win'?{kind:e.kind,seat:e.seat,shown:e.shown}:{kind:e.kind}),cursor:b.cursor,weights:[...b.weights],seed:b.seed,chopRate:b.chopRate},attempts:s.attempts.map(a=>({id:a.id,question:a.question,choice:a.choice,at:a.at})),simulation};
 }catch{return null;}
}
export function mergeSession(current:LabState,incoming:LabState):LabState{return {...incoming,attempts:[...new Map([...current.attempts,...incoming.attempts].map(a=>[a.id,a])).values()].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)).slice(-200)};}
export function recordAnswer(s:LabState,a:Attempt):LabState{return s.attempts.some(x=>x.id===a.id)?s:{...s,attempts:[...s.attempts,a].slice(-200)};}
export function downloadJSON(name:string,value:unknown){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
