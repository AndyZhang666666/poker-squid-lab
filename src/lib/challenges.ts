import {applyEvent,replay,rules,startRound,markUnits,type HandEvent} from './rules.ts';
import {compareSpot} from './spot.ts';
export type Words={zh:string;en:string};
export interface Challenge{id:string;group:Words;prompt:Words;options:{id:string;label:Words}[];answer:string;explanation:Words}
const w=(zh:string,en:string):Words=>({zh,en});
const win=(seat:number,shown=true):HandEvent=>({kind:'win',seat,shown});
const end=(mode:'finite'|'infinite',players:number,events:HandEvent[])=>replay(rules(mode,players),events).at(-1)!;
function numberQuestion(id:string,group:Words,prompt:Words,values:number[],answer:number,unit:string,explanation:Words):Challenge{return {id,group,prompt,options:values.map(v=>({id:String(v),label:w(`${v}${unit}`,`${v}${unit}`)})),answer:String(answer),explanation};}
export function challenges():Challenge[]{
 const g=[w('读懂规则','Read the rules'),w('算清结算','Follow the ledger'),w('看见差异','See the difference')],spot=compareSpot();
 const first=applyEvent(startRound(rules('finite')),win(0)),repeat=applyEvent(first,win(0));
 const infinite=end('infinite',6,[win(0),win(0)]),chop=applyEvent(startRound(rules('infinite')),{kind:'chop'});
 const supply=end('infinite',3,Array.from({length:5},()=>win(0)));
 return [
 numberQuestion('repeat-finite',g[0],w('有限模式：同一个人连续赢下两手有效主池，现在有几个标记？','Finite mode: one player wins two qualifying main pots. How many markers do they hold?'),[1,2,3],repeat.marks[0],'',w('每人最多一个。第二次赢牌不再消耗标记。','One per player. The repeat win consumes no additional marker.')),
 numberQuestion('chop-finite',g[0],w('有限模式刚开始就切池，一共发出几个标记？','A finite round starts with a chopped main pot. How many markers are issued?'),[0,1,2],applyEvent(startRound(rules('finite')),{kind:'chop'}).marks.reduce((a,b)=>a+b,0),'',w('切池没有唯一主池赢家，所以不发标。','There is no sole main-pot winner, so no marker is issued.')),
 numberQuestion('side-pot',g[0],w('只赢了边池，没有赢下主池，能因此获得几个标记？','How many markers does a side-pot-only win earn?'),[0,1,2],applyEvent(startRound(rules('infinite')),{kind:'side-only'}).marks[0],'',w('资格来自主池独赢；边池结果不替代主池资格。','A sole main-pot win qualifies. A side pot does not replace that condition.')),
 numberQuestion('reveal',g[0],w('无限模式首次独赢主池，但没有亮牌，获得几个标记？','A first-time infinite winner does not reveal their cards. How many markers do they receive?'),[0,1,2],applyEvent(startRound(rules('infinite')),win(0,false)).marks[0],'',w('本产品桌规要求首次获标亮牌；未满足资格，不发标，待发数量保留。','This preset requires a first-award reveal. An ineligible win issues no markers and keeps the pending award.')),
 numberQuestion('finite-cost',g[1],w('六人有限鱿鱼，每份 5BB。你最后没有标记，一共支付多少？','Six-player finite squid, 5BB per recipient. As the last unmarked player, how much do you pay?'),[5,25,30],-end('finite',6,[0,1,2,3,4].map(i=>win(i))).settlement!.payouts[5],'BB',w('向其余五人各付 5BB：5 × 5 = 25BB。','Pay each of the other five: 5 × 5 = 25BB.')),
 numberQuestion('first-double',g[1],w('无限模式第一手有效获标，赢家获得几个标记？','How many markers does the first qualifying infinite winner receive?'),[1,2,3],end('infinite',6,[win(0)]).marks[0],'',w('初始待发两个。成功发放后，下次待发恢复为一个。','The pending award starts at two. After issuance it resets to one.')),
 numberQuestion('three-double',g[1],w('无限模式已有两个标记，再拿一个，全部标记按几份基础奖励计价？','You have two infinite markers and earn one more. How many base units is the entire holding worth?'),[3,4,6],markUnits('infinite',infinite.marks[0]),'',w('三个标记全部翻倍：3 × 2 = 6 份，不是仅新增标记翻倍。','All three double: 3 × 2 = 6 units. The multiplier is not limited to the newest marker.')),
 numberQuestion('chop-carry',g[1],w('无限模式第一手切池，标记足够时，下一次有效获标发几个？','The first infinite hand is chopped. With enough supply, what is the next qualifying award?'),[1,2,3],chop.nextAward,'',w('初始待发 2，切池增加 1，所以待发 3；实际发放仍受剩余数量限制。','The pending 2 increases by 1 to 3, subject to remaining supply.')),
 numberQuestion('remaining-cap',g[2],w('只剩一个标记，此时又切池。下一次最多能发几个？','One marker remains and the next pot is chopped. What is the maximum next award?'),[1,2,3],Math.min(1,2),'',w('奖励累积不能制造新标记，最多发剩余的一个。','A carry does not create supply. Only the last remaining marker can be awarded.')),
 numberQuestion('separate-losers',g[2],w('三人无限模式：A 拿完六个标记，B、C 都无标，每份 5BB。B 单独支付多少？','Three-player infinite mode: A holds all six markers; B and C have none, at 5BB per unit. How much does B pay?'),[30,60,120],-supply.settlement!.payouts[1],'BB',w('六个全部翻倍，B 支付 6 × 2 × 5 = 60BB；C 也单独支付同样金额。','All six double. B pays 6 × 2 × 5 = 60BB. C separately pays the same amount.')),
 numberQuestion('finite-delta',g[2],w('首屏限定河牌局面中，有限鱿鱼的跟注相对弃牌价值是多少？','In the authored river spot, what is the finite call-minus-fold value?'),[-3.75,3.75,11.25],spot.rows[1].delta,'BB',w('底池部分 −3.75BB，加上结算差额的期望 7.50BB，合计 ＋3.75BB。','Chip EV −3.75BB plus expected settlement improvement 7.50BB gives +3.75BB.')),
 numberQuestion('infinite-delta',g[2],w('首屏相同河牌局面，改成无限鱿鱼后，跟注相对弃牌价值是多少？','For the same authored river, what is the infinite call-minus-fold value?'),[-3.75,3.75,11.25],spot.rows[2].delta,'BB',w('赢/输结算相差 60BB，乘以 25% 获胜概率为 15BB；再加 −3.75BB，得到 ＋11.25BB。','The win/loss side-ledger swing is 60BB. At 25% that adds 15BB to −3.75BB, producing +11.25BB.')),
 ];
}
