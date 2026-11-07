import {runEquity} from './poker/equity.ts';
import {PREFIX,applyEvent,replay,rules,type Mode} from './rules.ts';
export const SPOT_VERSION='river-last-two-v1';
export const SPOT_CARDS={hero:['Th','Tc'],board:['2c','3d','7h','9s','Jc'],opponent:{type:'range' as const,text:'QQ:75%, 88:25%'},samples:1000,seed:20261107,method:'auto' as const};
const equity=runEquity(SPOT_CARDS);
if(equity.tie!==0)throw Error('The authored last-two exercise requires a tie-free range');
export function compareSpot(pot=30,call=15,unit=5){
 if(!Number.isFinite(pot)||!Number.isFinite(call)||pot<call||call<=0||pot>1000)throw Error('The pot includes the opponent bet and must be at least the call');
 rules('finite',6,unit);
 const chip=equity.win*pot-equity.loss*call;
 const rows=([{mode:'plain',foldSide:0,winSide:0,loseSide:0,marks:[0,0,0,0,0,0]}] as {mode:'plain'|Mode;foldSide:number;winSide:number;loseSide:number;marks:number[]}[]);
 for(const mode of ['finite','infinite'] as const){
  const history=replay(rules(mode,6,unit),PREFIX),before=history[history.length-1];
  const win=applyEvent(before,{kind:'win',seat:5,shown:true}),lose=applyEvent(before,{kind:'win',seat:4,shown:true});
  rows.push({mode,foldSide:lose.settlement!.payouts[5],loseSide:lose.settlement!.payouts[5],winSide:win.settlement!.payouts[5],marks:before.marks});
 }
 return {version:SPOT_VERSION,pot,call,unit,equity,rows:rows.map(row=>{const swing=row.winSide-row.loseSide;return {...row,swing,chip,extra:equity.win*swing,delta:chip+equity.win*swing,threshold:call/(pot+call+swing)};})};
}
