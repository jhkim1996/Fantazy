// 떨어진 별의 노래 — 게임 엔진
// 모드: create(모험가 만들기) → world(지도) ⇄ event(이야기·탐색 사건) ⇄ combat(전술 전투) → end(장 끝)
const $=i=>document.getElementById(i);
const SC=window.SCENARIO;
const KEY='fantazy:'+SC.id;
const CLASSES=SC.classes;
const CLS_IDS=CLASSES.map(c=>c.id);
const STATS=SC.stats.map(s=>s.n);
let S=null,gen=0,rolling=false,ampOn=false,foOn=false,mkRolling=false,cmenu=null,shopOpen=false,fxDelay=0,gearPick=null,bagFilter='all';

function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
function arr(x){return x==null?[]:Array.isArray(x)?x:[x]}
function sign(v){return (v>=0?'+':'')+v}
function copy(o){return JSON.parse(JSON.stringify(o))}
function d(n){return 1+Math.floor(Math.random()*n)}
function rint(a,b){return a+Math.floor(Math.random()*(b-a+1))}
function toTop(){window.scrollTo(0,0)}
function narrow(){return window.matchMedia&&window.matchMedia('(max-width:959.98px)').matches}
function pct(p){return Math.round(p*100)+'%'}

// ── 주사위 식: '2d6+3'
function parseDice(e){const m=/^(\d+)d(\d+)([+-]\d+)?$/.exec(String(e).replace(/\s/g,''));return m?{n:+m[1],s:+m[2],z:+(m[3]||0)}:{n:0,s:0,z:+e||0}}
function rollDice(e,crit){
  const p=parseDice(e),n=p.n*(crit?2:1),dice=[];
  for(let i=0;i<n;i++)dice.push(d(p.s));
  return {total:dice.reduce((a,b)=>a+b,0)+p.z,dice,txt:(n?n+'d'+p.s:'')+(p.z?sign(p.z):'')};
}
// 유리: d20 두 개 중 높은 값, 불리: 낮은 값. 하플링은 1이 나온 주사위를 한 번 더 굴린다.
function modeOf(adv,dis){return adv.length&&!dis.length?'adv':dis.length&&!adv.length?'dis':'normal'}
function rollD20(mode){
  const lucky=!!(race()&&race().lucky),notes=[];
  const one=()=>{let v=d(20);if(v===1&&lucky){const w=d(20);notes.push('행운 1→'+w);v=w}return v};
  const a=one();if(mode==='normal')return {r:a,dice:[a],notes};
  const b=one();return {r:mode==='adv'?Math.max(a,b):Math.min(a,b),dice:[a,b],notes};
}
// 성공 확률: d20(+증폭 주사위) + mod ≥ dc. critOn 이상은 언제나 성공, 1은 언제나 실패.
function chance(mod,dc,mode,ampDie,o){
  o=o||{};const critOn=o.critOn||20;
  const g=v=>{if(!ampDie)return v+mod>=dc?1:0;let k=0;for(let a=1;a<=ampDie;a++)if(v+mod+a>=dc)k++;return k/ampDie};
  const f0=r=>r>=critOn?1:r===1?(o.starC?g(10):0):g(r);
  const f=r=>{if(r===1&&o.lucky){let s=0;for(let q=1;q<=20;q++)s+=f0(q)/20;return s}return f0(r)};
  let p=0;for(let r=1;r<=20;r++)p+=(mode==='adv'?(2*r-1)/400:mode==='dis'?(41-2*r)/400:1/20)*f(r);
  return p;
}

// ── 직업별 문장, 낱말 치환, 조사
function cls(id){id=id||S.cls;return CLASSES.find(c=>c.id===id)||CLASSES[0]}
function race(id){id=id||S.race;return (SC.races||[]).find(r=>r.id===id)||null}
function bg(id){id=id||S.bg;return (SC.backgrounds||[]).find(b=>b.id===id)||null}
function isVariant(v){return !!v&&typeof v==='object'&&!Array.isArray(v)&&('_' in v||CLS_IDS.some(k=>k in v))}
function pick(v){return isVariant(v)?(S.cls in v?v[S.cls]:v._):v}
const JOSA=[['이','가'],['은','는'],['을','를'],['과','와'],['으로','로'],['이었다','였다'],['아','야'],['이여','여'],['이라는','라는'],['이라고','라고']];
function batchim(w){const c=w.charCodeAt(w.length-1);return c>=0xAC00&&c<=0xD7A3?(c-0xAC00)%28:0}
function josa(w,f){
  const p=JOSA.find(x=>x.includes(f));if(!p)return w+f;
  const b=batchim(w);
  if(p[0]==='으로')return w+(b&&b!==8?'으로':'로');
  return w+(b?p[0]:p[1]);
}
function tokens(){const c=cls(),h=S.hero||{};return Object.assign({pup:'새끼'},S.names,{name:h.name||'떠돌이',cls:c.name,weapon:c.weapon,item:c.item,fine:c.fine,relic:c.relic,oath:c.oath,amp:(S.amp&&S.amp.name)||c.amp})}
function countItem(n){return S.items.filter(i=>i===n).length}
function tpl(s){
  if(typeof s!=='string')return s;const T=tokens();
  return s.replace(/\{#(\w+)\}/g,(m,k)=>String(S.counters[k]||0))
    .replace(/\{@([^}]+)\}/g,(m,k)=>String(countItem(k)))
    .replace(/\{(\w+)(?::([^}]+))?\}/g,(m,k,f)=>k in T?(f?josa(T[k],f):T[k]):m);
}
function txt(v){return tpl(pick(v))}
function texts(list){
  const out=[];
  arr(list).forEach(p=>{
    if(p&&typeof p==='object'&&!isVariant(p)&&'t' in p){if(ok(p.if)){const t=txt(p.t);if(t)out.push(t)}}
    else{const t=txt(p);if(t)out.push(t)}
  });
  return out;
}
function fxOf(v){
  const fx=pick(v);if(!fx)return fx;
  const f=Object.assign({},fx);
  if(f.items)f.items=arr(f.items).map(tpl);
  if(f.drop)f.drop=arr(f.drop).map(tpl);
  if(f.amp)f.amp=Object.assign({},f.amp,f.amp.source?{source:tpl(f.amp.source)}:{});
  return f;
}

// ── 조건: {flag, not, any, min, max, item, count, skill, cls, party, or, nor} — 적힌 조건을 모두 만족해야 참
// party: 그 동료가 지금 함께 있다
function ok(c){
  if(!c)return true;
  if(arr(c.flag).some(f=>!S.flags[f]))return false;
  if(arr(c.not).some(f=>S.flags[f]))return false;
  if(c.any&&!arr(c.any).some(f=>S.flags[f]))return false;
  if(c.min)for(const k in c.min)if((S.counters[k]||0)<c.min[k])return false;
  if(c.max)for(const k in c.max)if((S.counters[k]||0)>c.max[k])return false;
  if(arr(c.item).some(i=>!S.items.includes(i)))return false;
  if(c.count)for(const k in c.count)if(countItem(k)<c.count[k])return false;
  if(arr(c.skill).some(i=>!hasSkill(i)))return false;
  if(c.cls&&!arr(c.cls).includes(S.cls))return false;
  if(c.party&&arr(c.party).some(id=>!compHere(id)))return false;
  if(c.or&&!c.or.some(x=>ok(x)))return false;
  if(c.nor&&c.nor.some(x=>ok(x)))return false;
  return true;
}

// ── 저장
function freshMake(){
  const buy={};STATS.forEach(n=>buy[n]=SC.pointBuy?SC.pointBuy.min:10);
  return {step:1,method:'roll',rolls:[],assign:{},sel:null,rerolls:(SC.creation&&SC.creation.rerolls)||0,buy,race:null,cls:null,bg:null,name:''};
}
function fresh(){
  return {mode:'create',mk:freshMake(),cls:null,race:null,bg:null,hero:null,stats:[],amp:null,skills:[],items:[],equip:{},gold:0,
    insp:0,opt:{karmic:true,autoComp:false,autoGear:true},failStreak:0,pity:{},newItems:[],reroll:null,comp:{},rows:{},ch:{},rest:{short:2},
    flags:{},counters:{},log:[],pets:[],loc:SC.startLoc,ev:null,pending:null,sel:null,lvl:0,battle:null,notice:null,done:false};
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function restore(){
  try{
    const s=JSON.parse(localStorage.getItem(KEY));if(!s||!s.mode)return null;
    if(s.mode==='create'&&s.mk&&s.mk.buy)return s;
    if(s.hero&&SC.locations[s.loc]&&(s.mode!=='event'||SC.events[s.ev])){
      // 예전 저장: 전술 전투 이전의 전투. 이야기 전투는 새 방식으로 처음부터 다시 싸우고, 사냥은 지도로 돌린다
      if(s.mode==='combat'&&!(s.battle&&s.battle.units)){
        const ob=s.battle;s.battle=null;
        if(ob&&ob.kind==='story'&&ob.def&&s.ev&&SC.events[s.ev]){s.mode='event';s.pending={text:['이전 버전에서 저장된 전투다. 새로운 전투 방식으로 처음부터 다시 싸운다.'],fx:[],key:'auto',label:'전투',next:'map',battle:ob.def}}
        else s.mode='world';
      }
      if(s.insp==null)s.insp=0;if(s.failStreak==null)s.failStreak=0;if(!s.equip)s.equip={};
      s.opt=Object.assign({karmic:true,autoComp:false,autoGear:true},s.opt);if(!s.pity)s.pity={};if(!s.newItems)s.newItems=[];
      if(!s.rest)s.rest={short:2};if(!s.comp)s.comp={};if(!s.rows)s.rows={};if(!s.ch)s.ch={};
      return s;
    }
  }catch(e){}
  return null;
}
function logp(t){S.log.push(t);if(S.log.length>200)S.log.splice(0,S.log.length-200)}

// ── 영웅 수치
function hasSkill(id){return S.skills.includes(id)}
function statVal(n){const s=S.stats.find(x=>x.n===n);return s?s.v:0}
function ampCost(){return hasSkill('B')?1:S.amp.cost}
function xpNeed(L){const t=SC.xpTable;return t[L-1]!=null?t[L-1]:t[t.length-1]+(L-t.length)*30}
function profBonus(){return 2+Math.floor((S.hero.level-1)/4)}
// 숙련 출처 수: 직업·배경·종족. 둘 이상이면 전문(숙련 보너스 두 배)
function profCount(sk){
  let n=0;if(arr(cls().profs).includes(sk))n++;
  const b=bg();if(b&&b.skills.includes(sk))n++;
  const r=race();if(r&&arr(r.skills).includes(sk))n++;
  return Math.min(n,2);
}
function skillMod(sk){return statVal(SC.skillList[sk])+profCount(sk)*profBonus()}
// 장비 부위: 무기 · 머리 · 몸 · 손 · 발 · 장신구 (장신구는 동료에게 건넬 수도 있다)
const SLOTS=[['weapon','무기'],['head','머리'],['armor','몸'],['hands','손'],['feet','발'],['trinket','장신구']];
function slotName(k){const s=SLOTS.find(x=>x[0]===k);return s?s[1]:k}
function wpn(){return SC.items[S.equip.weapon]||{dice:'1d4',bonus:0}}
function gearAC(){return SLOTS.reduce((a,[k])=>k==='weapon'?a:a+((SC.items[S.equip[k]]||{}).ac||0),0)}
function heroAC(){return 10+statVal('민첩')+gearAC()+(tfx('hero').ac||0)+bsum('ac')}
function atkStat(){return cls().key}
function weaponHit(extra){return statVal(atkStat())+profBonus()+(wpn().bonus||0)+(extra||0)+(tfx('hero').hit||0)+bsum('atk')}
function weaponDmgBonus(){return statVal(atkStat())+(wpn().bonus||0)+(tfx('hero').dmg||0)+bsum('dmg')}
// ── 전문화: 레벨 8에 직업마다 두 갈래 중 하나를 고른다. 고른 갈래의 기술과 타고난 힘(passive)이 더해진다
const SPEC_LV=8;
function maxLv(){return SC.maxLevel||99}
function specsOf(c){return ((SC.specs||{})[(c||cls()).id])||[]}
function spec(){return S.spec?specsOf().find(x=>x.id===S.spec)||null:null}
function specP(k){const s=spec();return s&&s.passive?s.passive[k]:undefined}
function specDue(){return !!(S.hero&&S.hero.level>=SPEC_LV&&!S.spec&&specsOf().length)}
function heroP(u,k){return u&&u.kind==='hero'?specP(k):undefined}
// ── 잿불의 대군주: 계약을 맺으면 그대가 대군주가 된다. 능력치·장비·기술·소환수·겉모습이 모두 바뀐다 (쉬운 길)
function lordOn(){return !!(S&&S.flags&&S.flags.ember_lord&&SC.lord)}
// 같은 면의 주사위를 더한다: 3d10 + 2d10 = 5d10 (면이 다르면 더하지 않는다)
function diceAdd(a,b){const x=parseDice(a),y=parseDice(b);if(!x.n)return a;if(y.n&&y.s!==x.s)return a;return (x.n+y.n)+'d'+x.s+(x.z+y.z?sign(x.z+y.z):'')}
function clsSkills(){const s=spec();return (cls().skills||[]).concat(s?s.skills:[]).concat((S.learned||[]).filter(k=>SC.combatSkills[k]&&SC.combatSkills[k].cls===S.cls)).map((k,i)=>[k,i]).sort((a,b)=>SC.combatSkills[a[0]].lv-SC.combatSkills[b[0]].lv||a[1]-b[1]).map(x=>x[0])}
function knownSkills(){return clsSkills().filter(k=>SC.combatSkills[k].lv<=S.hero.level)}
function hasRelic(){return S.items.some(i=>i===cls().relic)}
// 장비의 값어치: 저절로 바꿔 낄 때 견준다
function fxScore(f){if(!f)return 0;return (f.hp||0)/6+(f.mp||0)/5+(f.ac||0)+(f.hit||0)*1.2+(f.dmg||0)+(f.fire||0)*.4+(f.init||0)*.3+(f.save||0)*.5+(f.check||0)*.4+arr(f.resist).length*.4+(f.hide?.4:0)+(f.death?.5:0)+(f.smite?2:0)+(f.sumHp||0)*8+(f.sumDmg||0)+(f.sumHit||0)+(f.sumAc||0)*.8+(f.sumCap||0)*4+(f.sumCost||0)*1.5+(f.sumRevive?3:0)}
function gearScore(n){const it=SC.items[n];if(!it)return -1;let v=fxScore(it.fx)+(it.ac||0);if(it.slot==='weapon'){const p=parseDice(it.dice);v+=p.n*(p.s+1)/2+(it.bonus||0)*1.5}return v}
function wearable(n,slot){const it=SC.items[n];return !!it&&it.slot===slot&&clsOK(it)}
// 직업 전용 물건 (cls): 그 직업만 끼고, 그 직업일 때만 떨어진다
function clsOK(it){return !it||!it.cls||it.cls===S.cls}
// 세트 효과를 받고 있는 부위는 저절로 바꾸지 않는다
function setLocked(n){const it=SC.items[n];return !!(it&&it.set&&setCount(it.set)>=2)}
// 장비를 바꾸면 최대 HP·마력이 바뀔 수 있다. 지금 값도 같이 움직인다
function regear(fn){
  const h=S.hero,a=heroFx();fn();if(!h)return;
  const b=heroFx(),dh=(b.hp||0)-(a.hp||0),dm=(b.mp||0)-(a.mp||0);
  if(dh){h.hpMax+=dh;h.hp=Math.max(1,Math.min(h.hpMax,h.hp+dh))}
  if(dm){h.mpMax+=dm;h.mp=Math.max(0,Math.min(h.mpMax,h.mp+dm))}
}
// 더는 없는 장비는 벗고, 새로 얻은 장비(names)는 빈 부위에 낀다.
// 지금 것보다 좋으면 바꿔 끼지만, '좋은 장비 저절로 끼기'를 껐거나 세트 효과를 받는 중이면 그대로 둔다
function autoEquip(names){
  regear(()=>SLOTS.forEach(([k])=>{const n=S.equip[k];if(n&&(!S.items.includes(n)||!wearable(n,k)))S.equip[k]=null}));
  arr(names).forEach(n=>{
    const it=SC.items[n];if(!it||!it.slot||it.slot==='trinket'||!S.items.includes(n))return;
    const cur=S.equip[it.slot];if(cur===n)return;
    if(!cur||(S.opt.autoGear!==false&&!setLocked(cur)&&gearScore(n)>gearScore(cur)))regear(()=>{S.equip[it.slot]=n});
  });
}
function equipGear(n){
  const it=SC.items[n];if(!it||!it.slot||!S.items.includes(n)||rolling)return;
  if(it.slot==='trinket'){equipTrinket(n,'hero');return}
  regear(()=>{S.equip[it.slot]=n});
  logp(josa(n,'을')+' '+(it.slot==='weapon'?'손에 쥐었다':'착용했다')+'.');gearPick=null;save();render();
}
function unequipSlot(slot){
  const n=S.equip[slot];if(!n||rolling)return;
  if(slot==='trinket'){unequipTrinket(n,'hero');return}
  regear(()=>{S.equip[slot]=null});logp(josa(n,'을')+' 벗었다.');save();render();
}
// 예전 저장: 부위가 바뀐 장비(장신구였던 거미 비단 장갑 등)는 벗겨서 맞는 부위에 다시 낀다
function fixGear(){
  if(!S.hero)return;
  const moved=SLOTS.map(([k])=>S.equip[k]).filter(n=>n&&SC.items[n]&&!wearable(n,SLOTS.find(x=>S.equip[x[0]]===n)[0]));
  autoEquip(moved);
  for(const id in (S.comp||{})){const t=S.comp[id].trinket;if(t&&!wearable(t,'trinket'))S.comp[id].trinket=null}
}
// 새로 얻은 장신구: 그대의 자리가 비어 있으면 가장 귀한 것을 찬다 (일부러 벗은 것은 다시 채우지 않는다)
function newTrinkets(names){
  if(S.equip.trinket)return;let best=null;
  arr(names).forEach(n=>{const it=SC.items[n];if(it&&it.slot==='trinket'&&spareOf(n)>0&&(!best||(RANK[it.rar]||0)>(RANK[SC.items[best].rar]||0)))best=n});
  if(best)setTrinket('hero',best);
}
// 새로 얻은 장비는 소지품 탭에서 '새것'으로 표시한다
function markNew(names){arr(names).forEach(n=>{const it=SC.items[n];if(it&&it.slot&&!S.newItems.includes(n))S.newItems.push(n)})}
// 얻었다는 줄: 세트 부위면 몇 부위를 모았는지 붙인다
function gotLine(n){const it=SC.items[n],st=it&&it.set&&SC.sets[it.set];return '획득: '+n+(st?' ('+st.name+' '+st.pieces.filter(x=>countItem(x)>0).length+'/'+st.pieces.length+')':'')}

// ── 세트
function setCount(id){const st=(SC.sets||{})[id];return st?st.pieces.filter(n=>SLOTS.some(([k])=>S.equip[k]===n)).length:0}
function addFx(a,f){if(!f)return a;for(const k in f){const v=f[k];if(k==='resist')a.resist=[...new Set((a.resist||[]).concat(v))];else if(typeof v==='number')a[k]=(a[k]||0)+v;else a[k]=v}return a}
function setFx(){const f={};for(const id in (SC.sets||{})){const n=setCount(id);SC.sets[id].bonus.forEach(b=>{if(n>=b.n)addFx(f,b.fx)})}return f}
// 그대가 입고 찬 모든 장비 + 세트 효과
function gearFx(){const f={};if(!S.equip)return f;SLOTS.forEach(([k])=>{const it=SC.items[S.equip[k]];if(it)addFx(f,it.fx)});return addFx(f,setFx())}
// 장비 + 세트 + 전문화의 타고난 힘
function heroFx(){const s=spec();return addFx(addFx(gearFx(),s&&s.fx),lordOn()?SC.lord.fx:null)}

// ── 팔기: 마을의 행상인에게. 전설·세트·이야기 물건은 팔지 않는다
function wornCount(n){return SLOTS.filter(([k])=>S.equip[k]===n).length+Object.keys(S.comp||{}).filter(id=>S.comp[id].trinket===n).length}
function sellPrice(n){
  const it=SC.items[n];if(!it||it.nosell||it.rar==='legendary'||it.rar==='set'||n===cls().relic||['증표','재료','약초','동료'].includes(it.kind))return 0;
  return it.price?Math.max(1,Math.floor(it.price/2)):({uncommon:20,rare:45})[it.rar]||4;
}
function junkList(){
  const out=[];
  [...new Set(S.items)].forEach(n=>{const it=SC.items[n];if(!it||!it.slot||it.slot==='trinket'||!sellPrice(n))return;const cur=S.equip[it.slot];if(!cur||cur===n||gearScore(n)>gearScore(cur))return;for(let i=countItem(n)-wornCount(n);i>0;i--)out.push(n)});
  return out;
}
function sellJunk(){
  if(!L().shop||rolling)return;const js=junkList();if(!js.length)return;
  let g=0;js.forEach(n=>{g+=sellPrice(n);S.items.splice(S.items.lastIndexOf(n),1)});S.gold+=g;S.newItems=S.newItems.filter(x=>countItem(x)>0);
  logp('덜 좋은 장비 '+js.length+'개를 팔았다 (금화 +'+g+').');save();render();
}
function sell(n){
  if(!L().shop||rolling)return;const v=sellPrice(n);if(!v||countItem(n)-wornCount(n)<=0)return;
  S.items.splice(S.items.lastIndexOf(n),1);S.gold+=v;S.newItems=S.newItems.filter(x=>x!==n||countItem(x)>0);
  logp(josa(n,'을')+' 팔았다 (금화 +'+v+').');save();render();
}

// ── 장신구와 아이템 등급
const RAR={uncommon:'고급',rare:'희귀',legendary:'전설',set:'세트'},RANK={uncommon:1,rare:2,set:2,legendary:3};
const DTN={fire:'불',cold:'냉기',arcane:'비전',radiant:'별빛',thunder:'천둥',lightning:'번개',psychic:'정신',poison:'독',phys:'물리'};
function trinketOn(who){return who==='hero'?S.equip.trinket||null:(S.comp&&S.comp[who]&&S.comp[who].trinket)||null}
// 그대는 모든 장비와 세트 효과, 동료는 찬 장신구 하나
function tfx(who){if(who==='hero')return heroFx();const n=trinketOn(who),it=n&&SC.items[n];return (it&&it.fx)||{}}
function wearers(n){const w=[];if(S.equip.trinket===n)w.push('hero');for(const id in (S.comp||{}))if(S.comp[id].trinket===n)w.push(id);return w}
function wearer(n){return wearers(n)[0]||null}
function spareOf(n){return countItem(n)-wearers(n).length}   // 아무도 차지 않은 개수
function whoName(who){return who==='hero'?'그대':COMP(who).name}
function trinketText(fx){
  const p=[];if(fx.hp)p.push('최대 HP +'+fx.hp);if(fx.mp)p.push('최대 마력 +'+fx.mp);if(fx.ac)p.push('방어 +'+fx.ac);if(fx.hit)p.push('명중 +'+fx.hit);if(fx.dmg)p.push('피해 +'+fx.dmg);
  if(fx.fire)p.push('불 피해 +'+fx.fire);if(fx.init)p.push('주도권 +'+fx.init);if(fx.save)p.push('내성 +'+fx.save);if(fx.check)p.push('이야기 판정 +'+fx.check);
  if(fx.resist)p.push(fx.resist.map(d=>DTN[d]).join('·')+' 저항');if(fx.hide)p.push('숨기 유리');if(fx.death)p.push('죽음 내성 유리');if(fx.smite)p.push('무기 공격에 별빛 '+fx.smite);
  if(fx.sumHp)p.push('소환수 HP +'+Math.round(fx.sumHp*100)+'%');if(fx.sumDmg)p.push('소환수 피해 +'+fx.sumDmg);if(fx.sumHit)p.push('소환수 명중 +'+fx.sumHit);if(fx.sumAc)p.push('소환수 방어 +'+fx.sumAc);
  if(fx.sumCap)p.push('소환수 하나 더 부림');if(fx.sumCost)p.push('부르기 마력 -'+fx.sumCost);if(fx.sumRevive)p.push('소환수가 처음 쓰러지면 HP 절반으로 다시 일어선다');
  return p.join(', ');
}
// 장신구를 바꿔 찬다. 최대 HP가 바뀌면 지금 HP도 같이 움직인다
function setTrinket(who,n){
  if(who==='hero'){regear(()=>{S.equip.trinket=n});return}
  S.comp[who].trinket=n;syncComps();
}
function equipTrinket(n,who){
  if(trinketOn(who)===n)return;
  if(spareOf(n)<=0){const prev=wearers(n).find(w=>w!==who);if(prev)setTrinket(prev,null)}   // 남는 것이 없으면 다른 이에게서 옮긴다
  setTrinket(who,n);logp(josa(whoName(who),'이')+' '+josa(n,'을')+' 찼다.');gearPick=null;save();render();
}
function unequipTrinket(n,who){who=who||wearer(n);if(!who)return;setTrinket(who,null);gearPick=null;save();render()}
function rarName(n){const it=SC.items[n]||{};return el('b',it.rar?'rar-'+it.rar:null,n)}

// ── 동료의 호감: 함께 있는 동료만 그대의 선택에 반응한다
function apVal(id){return S.counters[COMP(id).ap]||0}
function apTier(v){return v<=-3?{n:'냉담',hit:-1}:v>=6?{n:'깊은 신뢰',hit:1,ac:1}:v>=3?{n:'호의',hit:1}:{n:'보통'}}
// 동료의 전투 보너스: 호감 단계 + 개인 보상(perks) + 장신구
function compMod(id,k){let v=(apTier(apVal(id))[k]||0)+(tfx(id)[k]||0);arr(COMP(id).perks).forEach(p=>{if(ok(p.if))v+=p[k]||0});return v}
function approve(map,out){
  if(!map)return;
  for(const id in map){
    const C=(SC.companions||{})[id];if(!C||!map[id]||!compHere(id))continue;
    S.counters[C.ap]=(S.counters[C.ap]||0)+map[id];
    out.push(((SC.counterNames||{})[C.ap]||C.name+' '+(C.apName||'호감'))+' '+sign(map[id]));
  }
}
// 호감이 바닥나면 떠난다
function checkLeave(out,text){
  for(const id in (SC.companions||{})){
    const C=SC.companions[id];if(C.leaveAt==null||!compKnown(id))continue;
    if((S.counters[C.ap]||0)<=C.leaveAt){
      if(C.leaveText)text.push(C.leaveText);setCompState(id,'left',out);
    }
  }
}
function campTalk(){if(L().noCamp)return null;return arr(SC.camp).find(id=>{const e=SC.events[id];return e&&!S.flags['done_'+id]&&ok(e.if)})}

// ── 결과 적용
function applyFx(fx,out){
  if(!fx)return;const h=S.hero;
  if(fx.hpFull){h.hp=h.hpMax;out.push('HP 모두 회복')}
  if(fx.partyFull){syncComps();party().forEach(id=>{S.comp[id].hp=S.comp[id].hpMax});out.push('동료들도 모두 회복')}
  if(fx.hp){
    if(fx.hp<0&&S.flags.shield&&S.mode==='combat'){delete S.flags.shield;out.push('별빛 방벽이 피해를 막음')}
    else{h.hp=Math.min(h.hpMax,h.hp+fx.hp);out.push('HP '+sign(fx.hp))}
  }
  if(fx.mpFull){h.mp=h.mpMax;out.push('마력 모두 회복')}
  if(fx.mp){h.mp=Math.max(0,Math.min(h.mpMax,h.mp+fx.mp));out.push('마력 '+sign(fx.mp))}
  if(fx.gold){const g=Array.isArray(fx.gold)?rint(fx.gold[0],fx.gold[1]):fx.gold;S.gold=Math.max(0,S.gold+g);out.push('금화 '+sign(g))}
  arr(fx.drop).forEach(i=>{const k=S.items.indexOf(i);if(k>=0){S.items.splice(k,1);out.push('잃음: '+i)}});
  arr(fx.items).forEach(i=>{S.items.push(i);out.push(gotLine(i))});
  if(fx.lord&&!lordOn())becomeLord(out);
  // 이야기 속 계약으로 기술을 익힌다
  arr(fx.learn).forEach(k=>{if(!SC.combatSkills[k]||(S.learned||[]).includes(k))return;S.learned=(S.learned||[]).concat(k);out.push('새 기술: '+SC.combatSkills[k].name);logp('「'+SC.combatSkills[k].name+'」을 익혔다.')});
  markNew(fx.items);
  if(fx.items||fx.drop)autoEquip(fx.items);
  newTrinkets(fx.items);
  if(fx.amp){Object.assign(S.amp,fx.amp);out.push(S.amp.name+' d'+S.amp.die)}
  if(fx.stats)for(const n in fx.stats){const s=S.stats.find(x=>x.n===n);if(s){s.v+=fx.stats[n];out.push(n+' '+sign(fx.stats[n]))}}
  arr(fx.set).forEach(f=>{S.flags[f]=true});
  arr(fx.unset).forEach(f=>{delete S.flags[f]});
  if(fx.add)for(const k in fx.add){S.counters[k]=(S.counters[k]||0)+fx.add[k];const nm=(SC.counterNames||{})[k];if(nm)out.push(nm+' '+sign(fx.add[k]))}
  if(fx.xp){h.xp+=fx.xp;out.push('경험치 '+sign(fx.xp))}
  if(fx.goto&&SC.locations[fx.goto])S.loc=fx.goto;   // 이야기가 그대를 다른 곳으로 데려간다
  if(fx.names)S.names=Object.assign({},S.names,fx.names);   // 이야기 속에서 붙인 이름 ({pup} 등)
  if(fx.comp)for(const id in fx.comp)setCompState(id,fx.comp[id],out);   // 동료의 처지가 바뀐다 (함께·헤어짐·떠남·적·쓰러짐)
}
// 쓰러져도 이야기는 끝나지 않는다. 경험치가 차면 레벨이 오른다.
function settle(out){
  const h=S.hero;let down=false;
  bindPages(out);
  if(h.hp<=0){h.hp=Math.max(1,Math.ceil(h.hpMax/4));S.counters.falls=(S.counters.falls||0)+1;down=true;out.push('쓰러짐 → 일어남 (HP '+h.hp+')')}
  while(h.level<maxLv()&&h.xp>=h.xpMax){
    const c=cls(),r=race();
    h.xp-=h.xpMax;h.level++;h.xpMax=xpNeed(h.level);
    h.hpMax+=c.hpGain+((r&&r.hpPerLevel)||0);h.mpMax+=c.mpGain;h.hp=h.hpMax;h.mp=h.mpMax;S.lvl++;
    syncComps(true);
    const mates=Object.keys(S.comp||{}).filter(compKnown);
    out.push('레벨 업! 레벨 '+h.level+' (HP·마력 모두 회복'+(mates.length?', 동료도 함께 성장':'')+')');
    logp('레벨 '+h.level+'에 올랐다.');
    if(profBonus()>2+Math.floor((h.level-2)/4))out.push('숙련 보너스 +'+profBonus()+' (공격·주문·판정)');
    const qn=n=>'「'+n+'」'+josa(n,'을').slice(n.length);
    clsSkills().filter(k=>SC.combatSkills[k].lv===h.level).forEach(k=>{out.push('새 기술: '+SC.combatSkills[k].name);logp('새 기술 '+qn(SC.combatSkills[k].name)+' 익혔다.')});
    clsSkills().forEach(k=>arr(SC.combatSkills[k].up).filter(x=>x.lv===h.level).forEach(x=>{out.push('기술 강화: '+SC.combatSkills[k].name+' — '+x.note);logp(SC.combatSkills[k].name+' 강화: '+x.note+'.')}));
    mates.forEach(id=>(COMP(id).skills||[]).filter(k=>SC.combatSkills[k].lv===h.level).forEach(k=>{out.push(COMP(id).name+' 새 기술: '+SC.combatSkills[k].name);logp(josa(COMP(id).name,'이')+' 새 기술 '+qn(SC.combatSkills[k].name)+' 익혔다.')}));
    if(h.level===SPEC_LV&&!S.spec&&specsOf().length)out.push('전문화를 고를 수 있다! ('+specsOf().map(x=>x.name).join(' / ')+')');
    if(h.level>=maxLv())out.push('최고 레벨에 이르렀다');
  }
  if(h.level>=maxLv())h.xp=Math.min(h.xp,h.xpMax);
  return down;
}

function lvChoices(){
  if(specDue())return specsOf().map(x=>({id:'spec:'+x.id,name:x.name,desc:x.desc+' · 타고난 힘 「'+x.passive.name+'」: '+x.passive.desc+' · 기술: '+x.skills.map(k=>SC.combatSkills[k].name+'(Lv'+SC.combatSkills[k].lv+')').join(', ')}));
  return STATS.map(n=>({id:'stat:'+n,name:n+' +1',desc:'지금 '+sign(statVal(n))+(n===atkStat()?' · 공격에 쓰는 능력치':n==='민첩'?' · 방어에 더해진다':'')}))
    .concat(SC.talents.filter(t=>!hasSkill(t)).map(t=>({id:t,name:SC.skillDefs[t].name,desc:'[재능] '+tpl(SC.skillDefs[t].desc)})));
}
function pickLevel(id){
  if(id.startsWith('spec:')){
    if(!specDue())return;const sp=specsOf().find(x=>x.id===id.slice(5));if(!sp)return;
    regear(()=>{S.spec=sp.id});
    logp('전문화: 「'+sp.name+'」 — '+sp.passive.name+'.');
    sp.skills.filter(k=>SC.combatSkills[k].lv<=S.hero.level).forEach(k=>logp('새 기술 「'+SC.combatSkills[k].name+'」'+josa(SC.combatSkills[k].name,'을').slice(SC.combatSkills[k].name.length)+' 익혔다.'));
    save();render();return;
  }
  if(S.lvl<=0)return;
  if(id.startsWith('stat:')){const n=id.slice(5),s=S.stats.find(x=>x.n===n);s.v++;s.note=(s.note?s.note+' · ':'')+'레벨 '+S.hero.level+' +1';logp('레벨 '+S.hero.level+': '+n+' +1')}
  else{S.skills.push(id);logp('레벨 '+S.hero.level+': 재능 「'+SC.skillDefs[id].name+'」')}
  S.lvl--;save();render();
}
function needLevel(){return S.lvl>0||specDue()}

// ── 모험가 만들기: 능력치 → 종족 → 직업 → 배경 → 이름
function roll4d6(){const dice=[d(6),d(6),d(6),d(6)];const drop=dice.indexOf(Math.min.apply(null,dice));return {dice,drop,score:dice.reduce((a,b)=>a+b,0)-dice[drop]}}
function scoreMod(s){return Math.floor((s-10)/2)}
function mkStatFor(i){const a=S.mk.assign;return Object.keys(a).find(n=>a[n]===i)}
function mkAutoSel(){const mk=S.mk;let best=null;mk.rolls.forEach((r,i)=>{if(mkStatFor(i)==null&&(best==null||r.score>mk.rolls[best].score))best=i});return best}
function buySpent(){return STATS.reduce((a,n)=>a+SC.pointBuy.cost[S.mk.buy[n]],0)}
function mkStatsDone(){return S.mk.method==='buy'?buySpent()<=SC.pointBuy.points:STATS.every(n=>S.mk.assign[n]!=null)}
function mkScore(n,raceId){
  const mk=S.mk;let v;
  if(mk.method==='buy')v=mk.buy[n];else{const i=mk.assign[n];if(i==null)return null;v=mk.rolls[i].score}
  const r=race(raceId===undefined?mk.race:raceId);
  return v+((r&&r.bonus[n])||0);
}
function mkFinal(n,c,raceId){const v=mkScore(n,raceId);return (v==null?0:scoreMod(v))+(c&&c.key===n?2:0)}
function mkRoll(){
  const mk=S.mk;if(mkRolling)return;
  if(mk.rolls.length){if(mk.rerolls<=0)return;mk.rerolls--}
  mkRolling=true;mk.assign={};mk.sel=null;
  const t0=performance.now();
  (function tick(){
    if(performance.now()-t0<600){mk.rolls=STATS.map(roll4d6);renderMake();setTimeout(tick,70);return}
    mk.rolls=STATS.map(roll4d6);mk.sel=mkAutoSel();mkRolling=false;save();renderMake();
  })();
}
function mkAssign(n){
  const mk=S.mk;
  if(mk.sel!=null){mk.assign[n]=mk.sel;mk.sel=mkAutoSel()}
  else if(mk.assign[n]!=null){mk.sel=mk.assign[n];delete mk.assign[n]}
  save();renderMake();
}
const MK_STEPS=['능력치','종족','직업','배경','이름'];
function renderMake(){
  const mk=S.mk,box=$('make');box.innerHTML='';
  const steps=el('div','steps');
  MK_STEPS.forEach((t,i)=>steps.appendChild(el('span',i+1===mk.step?'on':i+1<mk.step?'done':'',(i+1)+' '+t)));
  box.appendChild(steps);
  const card=el('div','card mk-body');box.appendChild(card);
  [makeStats,makeRace,makeClass,makeBg,makeName][mk.step-1](card);
  if(window.Art)Art.scene(artSpec());
}
function mkNav(card,back,nextLabel,canNext,onNext){
  const nav=el('div','nav');
  if(back){const b=el('button',null,'← '+MK_STEPS[S.mk.step-2]);b.onclick=()=>{S.mk.step--;save();renderMake()};nav.appendChild(b)}
  const n=el('button','go',nextLabel);n.disabled=!canNext;n.onclick=onNext||(()=>{S.mk.step++;save();renderMake();toTop()});nav.appendChild(n);
  card.appendChild(nav);
}
function makeStats(card){
  const mk=S.mk;
  card.appendChild(el('div','mk-title','능력치 정하기'));
  const tg=el('div','seg');
  [['roll','주사위 굴림'],['buy','포인트 구매']].forEach(([m,l])=>{const b=el('button',mk.method===m?'on':'',l);b.disabled=mkRolling;b.onclick=()=>{mk.method=m;save();renderMake()};tg.appendChild(b)});
  card.appendChild(tg);
  card.appendChild(el('div','sub','직업의 대표 능력치가 공격과 기술의 명중·피해를 정하고, 민첩은 모든 직업의 방어에 더해집니다. 점수 10~11이 보정 +0이고, 2점마다 1씩 오르내립니다.'));
  if(mk.method==='buy'){
    const pb=SC.pointBuy,left=pb.points-buySpent();
    card.appendChild(el('div','sub','점수를 8~15 사이에서 사세요. 높은 점수일수록 비쌉니다. 남은 포인트: '+left+' / '+pb.points));
    const grid=el('div','buy');
    STATS.forEach(n=>{
      const v=mk.buy[n],row=el('div','buyrow');
      row.appendChild(el('span',null,n));
      const mi=el('button',null,'−');mi.disabled=v<=pb.min;mi.setAttribute('aria-label',n+' 내리기');mi.onclick=()=>{mk.buy[n]--;save();renderMake()};
      const pl=el('button',null,'+');const nextCost=v<pb.max?pb.cost[v+1]-pb.cost[v]:99;pl.disabled=v>=pb.max||nextCost>left;pl.setAttribute('aria-label',n+' 올리기');pl.onclick=()=>{mk.buy[n]++;save();renderMake()};
      row.appendChild(mi);row.appendChild(el('b',null,v+' ('+sign(scoreMod(v))+')'));row.appendChild(pl);
      grid.appendChild(row);
    });
    card.appendChild(grid);
    mkNav(card,false,'다음: 종족 →',mkStatsDone());
    return;
  }
  card.appendChild(el('div','sub','주사위 네 개(4d6)를 굴려 가장 낮은 눈 하나를 버린 합이 점수가 됩니다. 네 번 굴려 나온 점수를 네 능력치에 하나씩 넣으세요.'));
  if(!mk.rolls.length){const b=el('button','big','주사위 굴리기 (4d6 × 4)');b.onclick=mkRoll;card.appendChild(b);return}
  const rolls=el('div','rolls');
  mk.rolls.forEach((r,i)=>{
    const used=mkStatFor(i)!=null;
    const b=el('button','roll'+(mk.sel===i?' on':'')+(used?' used':''));
    b.appendChild(el('b',null,String(r.score)));
    const dl=el('small');r.dice.forEach((v,j)=>{if(j)dl.appendChild(document.createTextNode(' '));dl.appendChild(j===r.drop?el('s',null,String(v)):document.createTextNode(String(v)))});
    b.appendChild(dl);
    b.appendChild(el('small',null,used?'→ '+mkStatFor(i):sign(scoreMod(r.score))));
    b.disabled=mkRolling||used;
    b.setAttribute('aria-label',r.score+'점'+(used?', '+mkStatFor(i)+'에 넣음':''));
    b.onclick=()=>{mk.sel=i;renderMake()};
    rolls.appendChild(b);
  });
  card.appendChild(rolls);
  card.appendChild(el('div','sub',mkRolling?'굴리는 중…':mk.sel!=null?mk.rolls[mk.sel].score+'점을 넣을 능력치를 고르세요':mkStatsDone()?'배정을 마쳤습니다. 능력치를 누르면 다시 뺄 수 있습니다.':'넣을 점수를 고르세요'));
  const grid=el('div','mkstats');
  STATS.forEach(n=>{
    const i=mk.assign[n],b=el('button','mkstat');
    b.appendChild(el('span',null,n));
    b.appendChild(el('b',null,i==null?'—':mk.rolls[i].score+' ('+sign(scoreMod(mk.rolls[i].score))+')'));
    b.disabled=mkRolling||(mk.sel==null&&i==null);
    b.onclick=()=>mkAssign(n);
    grid.appendChild(b);
  });
  card.appendChild(grid);
  const r=el('div','row');
  const rr=el('button',null,'다시 굴리기 ('+mk.rerolls+'번 남음)');rr.disabled=mkRolling||mk.rerolls<=0;rr.onclick=mkRoll;r.appendChild(rr);
  const rs=el('button',null,'배정 초기화');rs.disabled=mkRolling||!Object.keys(mk.assign).length;rs.onclick=()=>{mk.assign={};mk.sel=mkAutoSel();save();renderMake()};r.appendChild(rs);
  card.appendChild(r);
  mkNav(card,false,'다음: 종족 →',!mkRolling&&mkStatsDone());
}
function previewLine(raceId,c){return '→ '+STATS.map(n=>n+' '+sign(mkFinal(n,c,raceId))).join(' / ')}
function makeRace(card){
  const mk=S.mk;
  card.appendChild(el('div','mk-title','종족 고르기'));
  card.appendChild(el('div','sub','종족은 능력치 점수에 보너스를 주고, 저마다의 특성이 있습니다.'));
  const list=el('div');
  SC.races.forEach(r=>{
    const b=el('button','opt'+(mk.race===r.id?' on':''));
    b.appendChild(el('span','cls-name',r.name));
    b.appendChild(el('small',null,r.trait));
    b.appendChild(el('small',null,'점수 보너스: '+Object.keys(r.bonus).map(n=>n+' +'+r.bonus[n]).join(', ')));
    b.appendChild(el('small',null,previewLine(r.id,null)));
    b.onclick=()=>{mk.race=r.id;save();renderMake()};
    list.appendChild(b);
  });
  card.appendChild(list);
  mkNav(card,true,'다음: 직업 →',!!mk.race);
}
function makeClass(card){
  const mk=S.mk;
  card.appendChild(el('div','mk-title','직업 고르기'));
  card.appendChild(el('div','sub','직업은 대표 능력치에 +2를 더하고, HP·마력과 전투 기술, 숙련 기술 둘, 처음 쥐는 무기를 정합니다.'));
  const list=el('div');
  CLASSES.forEach(c=>{
    const b=el('button','opt'+(mk.cls===c.id?' on':''));
    b.appendChild(el('span','cls-name',c.name+' · '+c.key));
    if(c.role)b.appendChild(el('small','role',c.role));
    b.appendChild(el('small',null,c.blurb));
    b.appendChild(el('small',null,'HP '+c.hp+' (+'+c.hpGain+'/레벨) · 마력 '+c.mp+' (+'+c.mpGain+'/레벨) · '+c.item+' '+SC.items[c.item].dice+' · '+c.armor+' (방어 +'+SC.items[c.armor].ac+')'));
    if(mk.cls===c.id)b.appendChild(el('small',null,'숙련: '+c.profs.join(', ')+' · 전투 기술: '+c.skills.filter(k=>SC.combatSkills[k].lv<SPEC_LV).map(k=>SC.combatSkills[k].name+'(Lv'+SC.combatSkills[k].lv+')').join(', ')+(specsOf(c).length?' · 레벨 '+SPEC_LV+' 전문화: '+specsOf(c).map(x=>x.name).join(' / '):'')));
    b.appendChild(el('small',null,previewLine(mk.race,c)));
    b.onclick=()=>{mk.cls=c.id;save();renderMake()};
    list.appendChild(b);
  });
  card.appendChild(list);
  mkNav(card,true,'다음: 배경 →',!!mk.cls);
}
function makeBg(card){
  const mk=S.mk,c=cls(mk.cls),r=race(mk.race);
  card.appendChild(el('div','mk-title','배경 고르기'));
  card.appendChild(el('div','sub','배경은 숙련 기술 둘을 주고, 그 배경다운 선택을 할 때마다 영감을 얻게 합니다. 영감으로 실패한 판정을 다시 굴릴 수 있습니다. 직업·종족과 겹치는 숙련은 전문(보너스 두 배)이 됩니다.'));
  const list=el('div');
  SC.backgrounds.forEach(b=>{
    const bt=el('button','opt'+(mk.bg===b.id?' on':''));
    bt.appendChild(el('span','cls-name',b.name));
    bt.appendChild(el('small',null,b.blurb));
    const sk=b.skills.map(s=>s+(c.profs.includes(s)||(r&&arr(r.skills).includes(s))?'(전문)':''));
    bt.appendChild(el('small',null,'숙련: '+sk.join(', ')+' · 영감: '+b.inspText));
    const start=[].concat(arr(b.items)).concat(b.gold?['금화 '+b.gold]:[]);
    if(start.length)bt.appendChild(el('small',null,'시작 소지품: '+start.join(', ')));
    bt.onclick=()=>{mk.bg=b.id;save();renderMake()};
    list.appendChild(bt);
  });
  card.appendChild(list);
  mkNav(card,true,'다음: 이름 →',!!mk.bg);
}
function makeName(card){
  const mk=S.mk,c=cls(mk.cls),r=race(mk.race),b=bg(mk.bg);
  card.appendChild(el('div','mk-title','이름 정하기'));
  card.appendChild(el('div','sub','별이 그대를 부를 이름입니다. 비워 두면 ‘떠돌이’로 불립니다.'));
  const inp=el('input');inp.type='text';inp.id='heroname';inp.maxLength=12;inp.placeholder='떠돌이';inp.value=mk.name;inp.autocomplete='off';
  inp.setAttribute('aria-label','이름');card.appendChild(inp);
  const names=(SC.creation&&SC.creation.names)||[];
  const rw=el('div','row');
  const nb=el('button',null,'이름 주사위 (d'+names.length+')');nb.disabled=!names.length;
  nb.onclick=()=>{mk.name=names[d(names.length)-1];inp.value=mk.name;save();upd()};
  rw.appendChild(nb);card.appendChild(rw);
  const sheet=el('div','sheet');card.appendChild(sheet);
  function upd(){
    sheet.innerHTML='';
    const nm=(mk.name||'').trim()||'떠돌이';
    const t=el('div','hudtop');t.appendChild(el('b',null,nm));t.appendChild(el('span','sub',r.name+' '+c.name+' · '+b.name));sheet.appendChild(t);
    sheet.appendChild(el('div','sub','HP '+(c.hp+((r.hpPerLevel)||0))+' · 마력 '+c.mp+' · '+c.item+' · '+c.armor));
    const st=el('div','stats');
    STATS.forEach(n=>{const dv=el('div','stat');dv.appendChild(el('span','sub',n));dv.appendChild(el('b',null,sign(mkFinal(n,c))));st.appendChild(dv)});
    sheet.appendChild(st);
    const profs=[...new Set(c.profs.concat(b.skills).concat(arr(r.skills)))];
    sheet.appendChild(el('div','sub','숙련 기술: '+profs.join(', ')));
    sheet.appendChild(el('div','sub','영감을 얻는 때: '+b.inspText));
  }
  inp.oninput=()=>{mk.name=inp.value;save();upd()};
  upd();
  mkNav(card,true,'모험을 시작한다',true,startAdventure);
}
function startAdventure(){
  const mk=S.mk,c=cls(mk.cls),r=race(mk.race),b=bg(mk.bg);if(!mkStatsDone()||!c||!r||!b)return;
  const name=(mk.name||'').trim().slice(0,12)||'떠돌이';
  S.cls=c.id;S.race=r.id;S.bg=b.id;
  const hp=c.hp+(r.hpPerLevel||0);
  S.hero=Object.assign(copy(SC.hero),{name,cls:c.name,hp,hpMax:hp,mp:c.mp,mpMax:c.mp,xpMax:xpNeed(1)});
  S.stats=STATS.map(n=>{
    const sc=mkScore(n),m=scoreMod(sc),k=n===c.key?2:0;
    return {n,v:m+k,note:'점수 '+sc+' ('+sign(m)+')'+(k?', '+SC.skillDefs[c.passive].name+' +2':'')};
  });
  S.amp={die:4,cost:2,source:c.item,name:c.amp};
  S.skills=['amp',c.passive];S.items=[c.item,c.armor,'은빛 물약','야영 물자','야영 물자'].concat(arr(b.items));S.gold=(SC.startGold||0)+(b.gold||0);
  S.insp=1;S.opt={karmic:true,autoComp:false,autoGear:true};S.failStreak=0;S.pity={};S.newItems=[];S.comp={};S.rows={};S.ch={};S.rest={short:2};S.equip={};
  autoEquip(S.items);
  S.loc=SC.startLoc;S.log=[];
  logp(name+' ('+r.name+' '+c.name+', '+b.name+') · '+S.stats.map(s=>s.n+' '+sign(s.v)).join(' '));
  startEvent(SC.start);
}

// ── 세계
// ── 장과 지역: 장이 시작되면 ch2 같은 플래그가 켜진다. 장소는 지역(region)에 속하고, 지도는 지금 지역만 그린다
function chapterNo(){let n=1;arr(SC.chapters).forEach(c=>{if(c.n>n&&S.flags['ch'+c.n])n=c.n});return n}
function CH(n){n=n||chapterNo();return arr(SC.chapters).find(c=>c.n===n)||{n,title:'',summary:[]}}
function regionOf(id){return (SC.locations[id]&&SC.locations[id].region)||'west'}
function regionName(r){return ((SC.regions||{})[r]||{}).name||''}
function L(){return SC.locations[S.loc]}
function visible(id){const l=SC.locations[id];return !!l&&(!l.if||ok(l.if))}
function linksOf(id){return SC.locations[id].links.filter(k=>visible(k.to)&&(!k.if||ok(k.if)))}
function goalText(){const g=SC.goals.find(x=>!x.if||ok(x.if));return g?tpl(g.t):''}
function storyAt(id){const l=SC.locations[id];return arr(l.actions).some(a=>a.star&&ok(a.if))||arr(l.onEnter).some(e=>ok(e.if))}
function canRest(){const l=L();return !!l.rest&&(!l.restIf||ok(l.restIf))}
// 쉼터의 이름: 문자열이거나, 조건이 맞는 첫 { if, t }
function restText(l){const r=arr(l.rest).map(x=>typeof x==='string'?{t:x}:x).find(x=>ok(x.if));return r?tpl(r.t):''}
function notice(t){S.notice=t;save();render()}

function travel(to){
  if(!linksOf(S.loc).some(k=>k.to===to))return;
  S.loc=to;S.notice=null;shopOpen=false;
  const l=L();
  const oe=arr(l.onEnter).find(e=>ok(e.if));
  if(oe){startEvent(oe.event);return}
  if(l.encounters&&Math.random()<(l.ambush||0)){startRandomBattle(true);return}
  S.mode='world';save();render();toTop();
}
function explore(){
  const l=L();S.notice=null;
  const pool=arr(l.explore).filter(id=>{const e=SC.events[id];return e&&(!e.if||ok(e.if))});
  const fightP=l.encounters?(pool.length?0.4:1):0;
  if(Math.random()<fightP){startRandomBattle(false);return}
  if(pool.length){startEvent(pool[rint(0,pool.length-1)]);return}
  notice('주변을 샅샅이 살폈지만 아무것도 찾지 못했다.');
}
// 긴 휴식: 쉼터에서. 마을은 공짜, 그 밖의 쉼터는 야영 물자 하나 (없으면 절반만 회복)
function longRest(){
  const l=L(),h=S.hero,free=!!l.restFree,has=countItem('야영 물자')>0,full=free||has;
  if(!free&&has)S.items.splice(S.items.indexOf('야영 물자'),1);
  syncComps();
  const fill=(v,mx)=>full?mx:Math.max(v,Math.ceil(mx/2));
  h.hp=fill(h.hp,h.hpMax);h.mp=fill(h.mp,h.mpMax);
  for(const id in S.comp)S.comp[id].hp=fill(S.comp[id].hp,S.comp[id].hpMax);
  pets().forEach(p=>{p.hp=fill(p.hp,p.hpMax)});
  if(lordOn()&&SC.lord.returns&&!pets().some(p=>p.id===SC.lord.returns)&&(S.learned||[]).includes(SC.lord.returnsBy)){const x=sumStats(SC.lord.returns,abOf(SC.lord.returnsBy));S.pets.push({id:SC.lord.returns,sk:SC.lord.returnsBy,hp:x.hp,hpMax:x.hp});logp(SUMT(SC.lord.returns).name+'이 잿불 속에서 다시 일어나 그대 곁에 무릎을 꿇었다.')}
  S.rest={short:2};recharge('long');arr(SC.restClears).forEach(f=>{delete S.flags[f]});
  logp(l.name+'에서 '+(full?'':'빈속으로 ')+'긴 휴식을 했다.');
  const msg=restText(l)+' — '+(full?'밤이 지나고, 모두 HP와 마력을 되찾았다.':'먹을 것이 없어 잠을 설쳤다. 절반만 회복했다.')+(!free&&has?' (야영 물자 -1)':'')+' 짧은 휴식과 기술이 모두 충전되었다.';
  // 모닥불 곁에서 동료가 이야기를 꺼낸다
  const talk=campTalk();
  if(talk){startEvent(talk);S.notice=msg;save();render();return}
  notice(msg);
}
// 쉬어서 되찾을 것이 있는가: 다친 이, 쓴 짧은 휴식 기술, (마법사) 마력
function restNeeded(){
  const h=S.hero,used=c=>Object.keys(c||{}).some(k=>{const ab=SC.combatSkills[k];return ab&&ab.per==='short'});
  return h.hp<h.hpMax||((S.cls==='mage'||S.cls==='summoner')&&h.mp<h.mpMax)||used(S.ch)||party().some(id=>S.comp[id].hp<S.comp[id].hpMax||used(S.comp[id].ch))||pets().some(p=>p.hp<p.hpMax);
}
// 짧은 휴식: 어디서나, 긴 휴식 사이에 두 번. HP 절반 회복, 짧은 휴식 기술 충전
function shortRest(){
  if(!S.rest||S.rest.short<=0||!restNeeded())return;
  S.rest.short--;syncComps();
  const h=S.hero,song=S.cls==='bard'?d(6):0,add=(v,mx)=>Math.min(mx,v+Math.ceil(mx/2)+song);
  h.hp=add(h.hp,h.hpMax);
  for(const id in S.comp)S.comp[id].hp=add(S.comp[id].hp,S.comp[id].hpMax);
  pets().forEach(p=>{p.hp=add(p.hp,p.hpMax)});
  let mp=0;if(S.cls==='mage'||S.cls==='summoner'){const was=h.mp;h.mp=Math.min(h.mpMax,h.mp+Math.ceil(h.mpMax/2));mp=h.mp-was}
  recharge('short');
  logp('짧은 휴식을 했다.');
  notice('잠시 숨을 골랐다. HP를 절반만큼 회복하고, 짧은 휴식마다 쓰는 기술이 충전되었다.'+(song?' (휴식의 노래 +'+song+')':'')+(mp?' 비전 회복으로 마력 +'+mp+'.':'')+' 남은 짧은 휴식: '+S.rest.short+'번');
}
function buy(name){
  const it=SC.items[name];if(!it||!it.price||S.gold<it.price)return;
  S.gold-=it.price;S.items.push(name);markNew([name]);autoEquip([name]);newTrinkets([name]);
  logp(josa(name,'을')+' 샀다 (금화 -'+it.price+').');
  save();render();
}
// 지도에서 물약을 쓴다. who: 동료 id (없으면 그대)
// ── 기술서: 낱장을 모두 모으면 저절로 한 권이 되고, 읽으면 기술을 영영 익힌다
function pageBook(n){return Object.values(SC.books||{}).find(b=>b.pages.includes(n))}
function bookLearned(b){return (S.learned||[]).includes(b.learn)}
function hasGot(n){if(countItem(n)>0)return true;const bk=pageBook(n);return !!(bk&&(countItem(bk.name)>0||bookLearned(bk)))}
function bindPages(out){
  Object.values(SC.books||{}).forEach(b=>{
    if(countItem(b.name)>0||bookLearned(b)||!b.pages.every(n=>countItem(n)>0))return;
    b.pages.forEach(n=>S.items.splice(S.items.indexOf(n),1));S.items.push(b.name);markNew([b.name]);if(!S.newItems.includes(b.name))S.newItems.push(b.name);
    const t='낱장이 모두 모여 「'+b.name+'」이 되었다! 소지품에서 읽으면 「'+SC.combatSkills[b.learn].name+'」을 익힌다';if(out)out.push(t);logp(t+'.');
  });
}
function readBook(name){
  const it=SC.items[name];if(!it||!it.learn||rolling||countItem(name)<=0)return;
  const sk=SC.combatSkills[it.learn];
  if(!clsOK(it)){S.notice=CLS_N(it.cls)+'만 읽을 수 있는 책이다.';render();return}
  if(S.hero.level<(it.lvReq||1)){S.notice='아직은 이 책의 문장이 그대에게 열리지 않는다 (레벨 '+it.lvReq+' 필요).';render();return}
  S.items.splice(S.items.indexOf(name),1);S.learned=(S.learned||[]).concat(it.learn);
  logp('「'+name+'」을 읽고 「'+sk.name+'」을 익혔다.');S.notice='「'+sk.name+'」을 익혔다! 전투의 기술 목록에 더해졌다.';save();render();
}
function becomeLord(out){
  const Lo=SC.lord,h=S.hero;if(!Lo||!h)return;
  regear(()=>{S.flags.ember_lord=true});
  for(const n in Lo.stats){const st=S.stats.find(x=>x.n===n);if(st){st.v+=Lo.stats[n];st.note=(st.note?st.note+' · ':'')+'대군주 +'+Lo.stats[n]}}
  h.cls=Lo.title;
  arr(Lo.items).forEach(n=>{const it=SC.items[n];S.items.push(n);markNew([n]);if(it&&it.slot&&it.slot!=='trinket')regear(()=>{S.equip[it.slot]=n})});
  // 아즈라칸이 그대의 권속으로 곁에 선다 (영구 소환수)
  if(Lo.returns&&!pets().some(p=>p.id===Lo.returns)){const x=sumStats(Lo.returns,null);S.pets=pets().concat({id:Lo.returns,sk:Lo.returnsBy,hp:x.hp,hpMax:x.hp})}
  h.hp=h.hpMax;h.mp=h.mpMax;
  out.push('그대는 '+Lo.title+'가 되었다 — 능력치 +, '+trinketText(Lo.fx));
  logp('잿불의 대군주가 되었다.');
}
function CLS_N(id){const c=SC.classes.find(x=>x.id===id);return c?c.name:id}
function useItem(name,who){
  const it=SC.items[name];if(!it||!it.use||rolling)return;
  const k=S.items.indexOf(name);if(k<0)return;S.items.splice(k,1);
  if(who&&S.comp[who]){const c=S.comp[who],was=c.hp;c.hp=Math.min(c.hpMax,c.hp+(it.use.hp||0));logp(COMP(who).name+'에게 '+name+' (HP +'+(c.hp-was)+')');save();render();return}
  const out=[];applyFx(it.use,out);
  logp(name+' 사용 ('+out.join(', ')+')');save();render();
}

// ── 이야기·탐색 사건
function ev(){return SC.events[S.ev]}
function startEvent(id){
  const E=SC.events[id];if(E.chapter&&!S.flags['ch'+E.chapter]){S.flags['ch'+E.chapter]=true;logp('제'+E.chapter+'장 「'+CH(E.chapter).title+'」을 시작했다.')}
  S.mode='event';S.ev=id;S.pending=null;S.sel=null;S.reroll=null;S.notice=null;
  S.sceneText=texts(SC.events[id].text);
  save();render();toTop();
}
function statOf(c){return c.stat==='class'?cls().key:pick(c.stat)}
function calc(c){
  let mod=statVal(statOf(c)),dc=c.dc;const why=[];
  if(c.stat==='class'){mod+=profBonus();why.push('직업 숙련 +'+profBonus())}
  else if(c.skill){const n=profCount(c.skill);if(n){mod+=n*profBonus();why.push((n>1?'전문 +':'숙련 +')+n*profBonus())}}
  const tc=tfx('hero').check;if(tc){mod+=tc;why.push('장비 '+sign(tc))}
  arr(c.bonus).forEach(b=>{if(ok(b.if)){mod+=b.v;why.push(b.why+' '+sign(b.v))}});
  arr(c.dcMod).forEach(b=>{if(ok(b.if)){dc+=b.v;why.push(b.why+' DC '+sign(b.v))}});
  const adv=arr(c.adv).filter(a=>ok(a.if)).map(a=>a.why),dis=arr(c.dis).filter(a=>ok(a.if)).map(a=>a.why);
  // 그 기술에 능한 동료가 곁에 있으면 돕는다
  if(c.skill)party().forEach(id=>{if(arr(COMP(id).profs).includes(c.skill))adv.push(COMP(id).name+'의 도움')});
  if(S.opt&&S.opt.karmic&&(S.failStreak||0)>=2)adv.push('업보 주사위');
  return {mod,dc,why,adv,dis};
}
function storyChance(k,useAmp,useFo){
  const adv=k.adv.slice();if(useFo)adv.push('예지의 눈');
  return chance(k.mod,k.dc,modeOf(adv,k.dis),useAmp?S.amp.die:0,{lucky:race()&&race().lucky,starC:hasSkill('C')});
}
function inspMatch(c){const b=bg();return !!(c.insp&&b&&b.insp===c.insp)}
function applyOutcome(oc,meta){
  const text=texts(oc.text),out=[];
  if(meta.roll&&meta.roll.cost)out.push('마력 -'+meta.roll.cost+' (사용)');
  if(meta.roll&&meta.roll.rerolled)out.push('영감 사용');
  applyFx(fxOf(oc.fx),out);
  arr(oc.fxIf).filter(e=>ok(e.if)).forEach(e=>applyFx(fxOf(e.fx),out));   // 조건은 모두 먼저 따진다
  syncComps().forEach(id=>{out.push('동료 합류: '+COMP(id).name);logp(josa(COMP(id).name,'이')+' 동료가 되었다.')});
  approve(meta.approve,out);approve(oc.approve,out);
  checkLeave(out,text);
  if(meta.key==='crit'&&!meta.ownCrit){S.hero.xp+=2;out.push('대성공 보너스 경험치 +2')}
  if(meta.extra)out.unshift.apply(out,meta.extra);
  if(meta.insp)out.push(meta.insp);
  const down=settle(out);
  const log=txt(oc.log);
  if(log)logp((meta.key==='crit'?'[대성공] ':meta.key==='fumble'?'[대실패] ':'')+log);
  S.pending=Object.assign({text,fx:out,down,next:oc.next||'map',battle:oc.battle||null},meta);
}
function resolve(c,rl){
  let key,oc;
  if(!rl){key='auto';oc=c.then}
  else if(rl.nat20){key='crit';oc=c.crit||c.success}
  else if(rl.nat1){key='fumble';oc=c.fumble||c.fail}
  else{key=rl.success?'success':'fail';oc=c[key]}
  const first=!S.flags['done_'+S.ev];
  S.flags['done_'+S.ev]=true;
  if(rl)S.failStreak=rl.success?0:(S.failStreak||0)+1;
  let insp=null;
  if(inspMatch(c)&&S.insp<(SC.inspMax||4)){S.insp++;insp='영감 +1 ('+bg().name+'다운 선택)'}
  S.notice=null;
  applyOutcome(oc,{choiceId:c.id,label:txt(c.label),key,roll:rl,ownCrit:!!c.crit,insp,approve:first?c.approve:null});
  save();render();
  const rw=$('reswrap');if(rw.scrollIntoView)rw.scrollIntoView({behavior:'smooth',block:'start'});
}
function advance(){
  const p=S.pending;if(!p)return;
  S.pending=null;S.sel=null;
  if(p.battle){startBattle(p.battle,'story');return}
  goNext(p.next);
}
function goNext(next){
  if(!next||next==='map'){S.mode='world';S.ev=null;save();render();toTop();return}
  if(next==='end'){S.mode='end';S.ev=null;S.done=true;S.ended=chapterNo();save();render();toTop();return}
  startEvent(next);
}

// ── 동료
function COMP(id){return SC.companions[id]}
// 동료의 처지: party(함께 다닌다) · bench(쉼터에서 기다린다) · parted(헤어졌다) · left(호감이 바닥나 떠났다) · hostile(적이 되었다) · dead(쓰러졌다) · unmet
// 떠남·적·쓰러짐·헤어짐은 <id>_left 같은 플래그로 남아 이야기의 조건에 그대로 쓰인다
const CSTATES=['dead','hostile','left','parted'];
const CSTATE_N={party:'함께 다닌다',bench:'쉼터에서 기다린다',parted:'헤어졌다',left:'그대 곁을 떠났다',hostile:'그대와 적이 되었다',dead:'쓰러졌다'};
function compState(id){
  for(const k of CSTATES)if(S.flags[id+'_'+k])return k;
  if(!S.hero||!(ok(COMP(id).joinIf)||S.flags[id+'_joined']))return 'unmet';
  return S.flags[id+'_bench']?'bench':'party';
}
function compKnown(id){const st=compState(id);return st==='party'||st==='bench'}   // 일행에 속한다 (따라오든 쉼터에서 기다리든)
// 지금 이 장소에서 함께 다니는가 (오르덴은 관문 근처에서만, 쉼터에 남긴 동료는 빠진다)
function compHere(id){const c=COMP(id);return compState(id)==='party'&&(!c.locs||c.locs.includes(S.loc)||ok(c.anywhereIf))}
// 처지를 바꾼다 (이야기의 fx.comp, 일행 고르기, 호감이 바닥날 때)
function setCompState(id,st,out){
  const C=COMP(id),was=compState(id);if(!C||was===st)return;
  ['bench','gone'].concat(CSTATES).forEach(k=>delete S.flags[id+'_'+k]);
  if(st!=='party')S.flags[id+'_'+st]=true;
  if(CSTATES.includes(st))S.flags[id+'_gone']=true;   // 헤어짐·떠남·적·쓰러짐을 한데 묶은 플래그 (이야기 조건용)
  if(st==='party'){
    S.flags[id+'_joined']=true;
    // 떠났던 동료가 돌아오면 호감을 떠나기 직전보다 조금 위로 되돌린다 (곧바로 다시 떠나지 않게)
    if(C.leaveAt!=null&&(S.counters[C.ap]||0)<=C.leaveAt+2)S.counters[C.ap]=C.leaveAt+3;
    syncComps();
  }else if(st!=='bench'&&S.comp&&S.comp[id])S.comp[id].trinket=null;   // 떠나는 동료는 찬 장신구를 돌려준다
  const N=C.name,msg={party:josa(N,'이')+(was==='bench'?' 다시 따라나선다':' 일행이 되었다'),bench:josa(N,'이')+' 쉼터에 남았다',parted:josa(N,'과')+' 헤어졌다',left:josa(N,'이')+' 일행을 떠났다',hostile:josa(N,'이')+' 그대의 적이 되었다',dead:josa(N,'이')+' 쓰러졌다'}[st];
  if(out)out.push(msg);logp(msg+'.');
}
function party(){return Object.keys(SC.companions||{}).filter(compHere)}
function compMaxHp(id){const c=COMP(id);return c.hp+c.hpGain*(S.hero.level-1)+(tfx(id).hp||0)}
// 동료 기록을 레벨에 맞춘다. full이면 모두 회복. 새로 합류한 동료 id를 돌려준다
function syncComps(full){
  S.comp=S.comp||{};const fresh=[];syncPets();if(full)pets().forEach(p=>{p.hp=p.hpMax});
  Object.keys(SC.companions||{}).forEach(id=>{
    if(!compKnown(id))return;
    const mx=compMaxHp(id);let r=S.comp[id];
    if(!r){r=S.comp[id]={hp:mx,hpMax:mx,ch:{}};fresh.push(id)}
    if(r.hpMax!==mx){r.hp=Math.max(1,r.hp+mx-r.hpMax);r.hpMax=mx}
    if(full)r.hp=mx;
  });
  return fresh;
}
function rowPref(id){S.rows=S.rows||{};return S.rows[id]||(id==='hero'?cls().row:COMP(id).row)||'front'}
// 기술 사용 횟수 (uses가 있는 기술만). 짧은 휴식은 per:'short'를, 긴 휴식은 모두를 채운다
function chOf(u){return u.kind==='hero'?(S.ch=S.ch||{}):S.comp[u.id].ch}
function usesLeft(u,k){const ab=abOf(k);if(!ab.uses)return Infinity;const c=chOf(u);return c[k]==null?ab.uses:c[k]}
function recharge(per){const f=c=>{for(const k in c){const ab=SC.combatSkills[k];if(!ab||per==='long'||ab.per==='short')delete c[k]}};f(S.ch=S.ch||{});for(const id in (S.comp||{}))f(S.comp[id].ch)}
function abCost(ab){if(typeof ab==='string')ab=abOf(ab);return (ab.cost==='bonus'?'보조 행동':'행동')+(ab.mp?' · 마력 '+ab.mp:ab.mp===0?' · 마력 없음':'')+(ab.uses?' · '+(ab.per==='long'?'긴':'짧은')+' 휴식마다 '+ab.uses+'번':'')}

// ── 전투
// 주도권 순서대로 한 명씩 움직인다. 한 턴 = 행동 1 + 보조 행동 1 + 이동 1. 반응(기회 공격·수호)은 라운드마다 한 번.
// 위치는 열로 단순화한다: 양쪽 모두 앞열·뒷열. 근접 공격은 앞열에서 하고, 대상 쪽 앞열에 서 있는 자가 있으면 앞열만 노릴 수 있다.
// 열마다 바닥 표면(기름·물·불·얼음)이 깔린다. 불이 기름에 닿으면 폭발하고, 젖은 몸에 냉기가 닿으면 얼어붙는다.
const ROWN={front:'앞열',back:'뒷열'};
const SURF={oil:{n:'기름',r:5},water:{n:'물',r:4},fire:{n:'불',r:3},ice:{n:'얼음',r:3}};
const ZONES=['pc-front','pc-back','foe-front','foe-back'];
const ST_N={stun:'얼어붙음',poison:'중독',weak:'명중 -2',blind:'연막',burn:'불붙음',prone:'넘어짐',restrain:'속박',wet:'젖음',taunt:'도발당함',insp:'격려',mark:'약점 노출'};

function afx(o){if(window.Art)Art.fx(Object.assign({delay:fxDelay},o))}
function logB(t,k){const B=S.battle;B.log.push({t,k:k||'',r:B.round});if(B.log.length>80)B.log.splice(0,B.log.length-80)}
function U(uid){const id=String(uid).replace('*','');return S.battle.units.find(u=>u.uid===id)}
function R(u){return u.kind==='hero'?S.hero:u.kind==='comp'?S.comp[u.id]:u}
function up(u){return R(u).hp>0}
function pcs(){return S.battle.units.filter(u=>u.side==='pc'&&!u.gone)}
function foes(){return S.battle.units.filter(u=>u.side==='foe')}
function alive(){return foes().filter(up)}
function upPCs(){return pcs().filter(up)}
function other(side){return side==='pc'?'foe':'pc'}
function zk(u){return u.side+'-'+u.row}
function surfOf(u){const s=S.battle.surf[zk(u)];return s?s.t:null}
function standing(side,row){return S.battle.units.filter(u=>u.side===side&&up(u)&&(!row||u.row===row))}
function frontWall(side){return standing(side,'front').some(u=>!u.hid)}
function curU(){const B=S.battle;return B&&B.turn>=0&&B.turn<B.order.length?U(B.order[B.turn]):null}
function myTurn(){const B=S.battle,u=curU();return !!(B&&!B.over&&u&&u.side==='pc'&&up(u))}
function E_(u){return SC.enemies[u.id]}
function big(u){return u.side==='foe'&&!!E_(u).big}
function nm(u){return u.name}
function lk(u){return u.side==='pc'?'me':'foe'}   // 기록 색: 아군이 한 일 / 적이 한 일
function hk(u){return u.side==='pc'?'foe':'me'}   // 그 대상이 당한 일

// ── 수치
function bsumU(u,k){return ((u&&u.buffs)||[]).reduce((a,b)=>a+(b[k]||0),0)}
function bsum(k){const B=S.battle;return B&&B.units?bsumU(U('hero'),k):0}
// 버프 한 줄: 명중 +2 피해 +2 방어 +1 · 반격 · 피해 절반 …
function buffText(b){return ['atk','dmg','ac'].filter(k=>b[k]).map(k=>({atk:'명중',dmg:'피해',ac:'방어'})[k]+' '+sign(b[k])).concat(b.riposte?['반격']:[],b.halve?['받는 피해 절반']:[],b.adv?['공격 유리']:[],b.blur?['노리는 공격 불리']:[],b.undying?['쓰러지지 않음']:[]).join(', ')}
function buffWith(u,k){return ((u&&u.buffs)||[]).find(b=>b[k])}
function addBuff(p,name,buff,turns){p.buffs=(p.buffs||[]).filter(b=>b.name!==name);p.buffs.push(Object.assign({t:turns,name},buff))}
// 전문화의 타고난 힘: 북돋우는 노래가 더 오래 (전쟁 가인), 회복이 더 크게 (별의 성가대), 원소 주문이 더 세게 (폭풍 술사)
function bTurns(u,ab,t){return (t!=null?t:ab.turns)+(!ab.self?(heroP(u,'buffTurns')||0):0)}
function healPlus(u){return heroP(u,'healLv')?Math.floor(S.hero.level/2):0}
function elemAdd(u,dt){return ['fire','cold','lightning'].includes(dt)?(heroP(u,'elemDmg')||0):0}
function rageAdd(){const r=specP('rage'),h=S.hero;return r&&h&&h.hp<=h.hpMax/2?r:0}
function lvB(){return Math.floor((S.hero.level-1)/2)}
function ufx(u){return u.side==='pc'?tfx(u.kind==='hero'?'hero':u.id):{}}
// 성기사의 오라: 그대가 서 있는 동안 동료의 방어가 오른다 (빛의 수호자는 더)
function auraAC(){const B=S.battle,h=B&&B.units&&U('hero');return h&&up(h)?(cls().aura||0)+(specP('aura')||0):0}
function acOf(u){return u.kind==='hero'?heroAC():(u.kind==='comp'?COMP(u.id).ac+compMod(u.id,'ac')+auraAC():u.ac)+bsumU(u,'ac')}
function saveMod(u,stat){
  if(u.kind==='hero')return statVal(stat)+(tfx('hero').save||0);
  if(u.kind==='comp'){const c=COMP(u.id);return (({힘:c.str,민첩:c.dex,지혜:c.wis})[stat]||0)+(tfx(u.id).save||0)}
  if(u.kind==='summon')return Math.floor(u.lv/2)+(u.big&&stat==='힘'?2:0);
  const E=E_(u);return Math.floor(u.lv/2)+((E.saves&&E.saves[stat])||0)+(E.big&&stat==='힘'?2:0);
}
function iniMod(u){return u.kind==='summon'?Math.floor(u.lv/4):u.kind==='hero'?statVal('민첩')+(tfx('hero').init||0):u.kind==='comp'?COMP(u.id).init+(tfx(u.id).init||0):(E_(u).init!=null?E_(u).init:Math.floor(u.lv/2))}
function spellHit(sk){return statVal(sk.stat||atkStat())+profBonus()+(sk.hit||0)+(tfx('hero').hit||0)+bsum('atk')}
function spellDC(u,ab){return 8+profBonus()+(u.kind==='hero'?statVal(ab.stat||atkStat()):(COMP(u.id).dc||2))}
function d20(u,mode){if(u.kind==='hero')return rollD20(mode);const a=d(20);if(mode==='normal')return {r:a,dice:[a],notes:[]};const b=d(20);return {r:mode==='adv'?Math.max(a,b):Math.min(a,b),dice:[a,b],notes:[]}}
// 공격 정보: 이름·명중·원거리·치명 범위·피해 종류·피해 굴림
function profile(u,ab){
  const wk=u.st&&u.st.weak?2:0;   // 기가 꺾이면 명중 -2
  if(u.kind==='hero'){
    if(ab&&ab.attack==='spell'){const st=ab.stat||atkStat(),add=(ab.addStat?statVal(st):0)+elemAdd(u,ab.dtype)+resonAdd(u);
      return {name:ab.name,hit:spellHit(ab)-wk,ranged:true,crit:(ab.crit||20)-(specP('spellCrit')||0),dtype:ab.dtype||'arcane',spell:true,critAdv:!!ab.critAdv,dice:ab.dmg+sign(add+bsum('dmg')),dmg:c=>rollDice(ab.dmg,c).total+add+bsum('dmg')}}
    const w=wpn(),thrown=S.cls==='rogue'&&u.row==='back',sm=tfx('hero').smite,rg=rageAdd();   // 도적은 뒷열에서 단검을 던진다. sm: 세트의 별빛 피해, rg: 광전사의 피의 갈증
    return {name:ab?ab.name:thrown?'단검 던지기':'공격',hit:weaponHit(ab&&ab.hit)-wk,ranged:thrown,crit:Math.min(w.crit||20,(ab&&ab.crit)||20)-(specP('weapCrit')||0),dtype:(ab&&ab.dtype)||'phys',weapon:true,critAdv:!!(ab&&ab.critAdv),execute:ab&&ab.execute,
      dice:w.dice+sign(weaponDmgBonus()+rg)+(ab&&ab.extra?'+'+ab.extra:'')+(sm?'+'+sm:''),dmg:c=>rollDice(w.dice,c).total+weaponDmgBonus()+rg+(ab&&ab.extra?rollDice(ab.extra,c).total:0)+(sm?rollDice(sm,c).total:0)};
  }
  if(u.kind==='summon'){const A=u.atk,b=u.dmgB+bsumU(u,'dmg');
    return {name:ab?ab.name:A.name,hit:u.hit+bsumU(u,'atk')-wk,ranged:!!A.ranged,reach:!!A.reach,crit:20,dtype:A.dtype||'phys',weapon:true,dice:A.dice+sign(b),dmg:c=>rollDice(A.dice,c).total+b}}
  const A=COMP(u.id).attack,b=A.dmgB+lvB()+bsumU(u,'dmg')+compMod(u.id,'dmg')+(A.dtype==='fire'?tfx(u.id).fire||0:0);
  return {name:ab?ab.name:A.name,hit:A.hit+lvB()+((ab&&ab.hit)||0)+bsumU(u,'atk')+compMod(u.id,'hit')-wk,ranged:!!A.ranged,reach:!!A.reach,crit:(ab&&ab.crit)||20,dtype:A.dtype||'phys',burn:!!A.burn,weapon:true,
    dice:A.dice+sign(b)+(ab&&ab.extra?'+'+ab.extra:''),dmg:c=>rollDice(A.dice,c).total+b+(ab&&ab.extra?rollDice(ab.extra,c).total:0)};
}
function foeProfile(e,sk){
  const E=E_(e),pack=!!E.pack&&alive().some(o=>o!==e&&E_(o).pack);
  return {name:sk?sk.name:'공격',hit:e.atk+((sk&&sk.hit)||0)-(e.st.weak?2:0)+bsumU(e,'atk')+(pack?2:0),ranged:!!(sk?sk.ranged:E.ranged),reach:!!(sk&&sk.reach),crit:20,dtype:(sk&&sk.dtype)||E.dtype||'phys',
    dmg:c=>rollDice((sk&&sk.dmg)||e.dmg,c).total};
}
// 근접으로 닿는가: 공격자는 앞열에 서야 하고(창은 뒷열에서도 적 앞열까지), 대상 쪽 앞열에 서 있는 자가 있으면 앞열만 노린다
function canMelee(a,t,reach){
  if(!up(t)||t.hid||t.side===a.side)return false;
  if(a.fly||(a.side==='foe'&&reach))return true;   // 날짐승과 돌진은 어느 열이든 닿는다
  if(a.row!=='front'&&!reach)return false;
  if(t.row==='front'||t.fly)return true;
  return a.row==='front'&&!frontWall(t.side);
}
function reachDown(a,t,P){return P.ranged||a.fly||P.reach||(a.row==='front'&&(t.row==='front'||!frontWall(t.side)))}
function canHit(a,t,P){return P.ranged?(up(t)&&!t.hid&&t.side!==a.side):canMelee(a,t,P.reach)}
function atkMode(a,t,P,extra,extraAdv){
  const adv=[],dis=[];
  if(a.hid)adv.push('숨어서 기습');
  const ba=buffWith(a,'adv'),bl=buffWith(t,'blur');if(ba)adv.push(ba.name);if(bl)dis.push(bl.name+'(잔상)');
  arr(extraAdv).forEach(x=>adv.push(x));
  if(t.st.stun)adv.push('얼어붙은 대상');
  if(t.st.restrain)adv.push('속박된 대상');
  if(t.st.blind)adv.push('연막 속의 대상');
  if(t.st.mark)adv.push('약점이 드러난 대상');
  if(t.st.prone){if(P.ranged)dis.push('넘어진 대상(원거리)');else adv.push('넘어진 대상')}
  if(a.st.poison)dis.push('중독');
  if(a.st.blind)dis.push('연막');
  if(a.st.prone)dis.push('넘어진 채');
  if(a.st.restrain)dis.push('속박');
  if(t.dodge)dis.push('회피 중인 대상');
  if(P.ranged&&!a.fly&&a.row==='front'&&frontWall(other(a.side)))dis.push('적과 맞붙은 채 원거리');
  arr(extra).forEach(x=>dis.push(x));
  return {mode:modeOf(adv,dis),adv,dis};
}
function heightMod(a,t,P){return !P.ranged?0:a.high&&!t.high?2:!a.high&&t.high?-2:0}
function hitP(a,t,P){return chance(P.hit+heightMod(a,t,P),acOf(t),atkMode(a,t,P).mode,0,{critOn:P.crit,lucky:a.kind==='hero'&&!!(race()&&race().lucky)})}
function failP(t,stat,dc){return Math.max(0,Math.min(1,(dc-1-saveMod(t,stat))/20))}

// ── 피해·회복·상태
function mult(t,dt){
  let m=1;const why=[];
  if(t.side==='foe'){const E=E_(t);if(arr(E.vuln).includes(dt)){m*=2;why.push('약점')}if(arr(E.resist).includes(dt)){m/=2;why.push('저항')}}
  if(dt==='fire'&&t.st.wet){m/=2;why.push('젖음')}
  if(dt==='poison'&&t.kind==='hero'&&race()&&race().poisonResist){m/=2;why.push('드워프')}
  if(t.side==='pc'&&arr(ufx(t).resist).includes(dt)){m/=2;why.push(t.kind==='hero'?'장비':'장신구')}
  if(t.side==='pc'&&buffWith(t,'halve')){m/=2;why.push(buffWith(t,'halve').name)}
  return {m,why};
}
// 피해를 준다. 쓰러진 아군을 때리면 죽음 내성 실패가 쌓인다. 실제로 준 피해를 돌려준다
function hurt(t,raw,dt,o){
  o=o||{};dt=dt||'phys';const r=R(t);
  if(t.side==='pc'&&r.hp<=0){
    if(t.out)return 0;
    t.saves.f+=o.crit?2:1;t.stable=false;logB(josa(nm(t),'이')+' 쓰러진 채 공격받았다 — 죽음 내성 실패 '+Math.min(3,t.saves.f)+'/3','foe');afx({type:'text',target:t.uid,text:'죽음 내성 실패',color:'#ff9a8a',delay:fxDelay+260});checkOut(t);return 0;
  }
  if(t.kind==='hero'&&S.flags.shield){delete S.flags.shield;logB('별빛 방벽이 피해를 막아 냈다!','sys');afx({type:'text',target:t.uid,text:'방벽!',color:'#9fc8ff',delay:fxDelay+260});return 0}
  const {m,why}=mult(t,dt);let dm=Math.max(1,Math.floor(raw*m));
  // 꺾이지 않는 의지: HP가 1 아래로 내려가지 않는다
  if(t.side==='pc'&&buffWith(t,'undying')&&dm>=r.hp){dm=Math.max(0,r.hp-1);logB(josa(nm(t),'은')+' 쓰러지지 않는다!','me');afx({type:'text',target:t.uid,text:'버틴다!',color:'#f0c75e',delay:fxDelay+300})}
  r.hp=Math.max(0,r.hp-dm);t.lastWhy=why;
  afx({type:'hit',target:t.uid,val:dm,crit:o.crit,delay:fxDelay+(o.d==null?260:o.d)});
  if(r.hp===0)drop(t);
  else if(dt==='cold'&&t.st.wet&&!big(t)&&!t.st.stun&&!freezeImmune(t)){t.st.stun=1;logB(nm(t)+'의 젖은 몸이 얼어붙었다!','sys');afx({type:'text',target:t.uid,text:'얼어붙음',color:'#9fd3ff',delay:fxDelay+460})}
  return dm;
}
function wtxt(dm,t){return dm+(t.lastWhy&&t.lastWhy.length?'('+t.lastWhy.join('·')+')':'')}
function drop(t){
  if(t.kind==='summon'&&heroFx().sumRevive&&!t.revived){t.revived=true;t.hp=Math.ceil(t.hpMax/2);logB(josa(nm(t),'이')+' 별빛을 다시 엮어 일어섰다! (HP '+t.hp+')','me');afx({type:'heal',target:t.uid,val:t.hp,delay:fxDelay+400});return}
  if(t.kind==='summon'){t.gone=true;delete t.hid;t.st={};t.buffs=[];logB(josa(nm(t),'이')+' 별빛으로 흩어졌다','foe');summonBurst(t);return}
  if(t.side==='foe'){if(!t.dead){t.dead=true;delete t.hid;S.counters['kill_'+t.id]=(S.counters['kill_'+t.id]||0)+1}return}
  t.saves={s:0,f:0};t.stable=false;delete t.hid;t.st={};t.buffs=[];t.high=false;
  logB(josa(nm(t),'이')+' 쓰러졌다! 차례마다 죽음 내성을 굴린다','foe');
}
function checkOut(t){if(t.saves.f>=3&&!t.out){t.out=true;logB(josa(nm(t),'은')+' 의식을 잃었다. 이 전투에서는 일어나지 못한다','foe')}}
function heal(t,v){
  const r=R(t);if(t.out)return 0;
  const was=r.hp;r.hp=Math.min(r.hpMax,r.hp+Math.max(0,v));
  if(was<=0&&r.hp>0){t.saves={s:0,f:0};t.stable=false;t.st={prone:1};logB(josa(nm(t),'이')+' 다시 일어났다! (넘어진 채)','me')}
  if(r.hp>was)afx({type:'heal',target:t.uid,val:r.hp-was,delay:fxDelay+200});
  return r.hp-was;
}
// 얼어붙음: 다음 차례를 쉰다. 한 라운드에 두 번 움직이는 우두머리는 다음 두 차례(한 라운드 몫)를 쉰다.
// 정예·우두머리는 얼음에서 풀린 뒤 한 라운드 동안 다시 얼지 않는다 (번개·서리로 계속 묶어 둘 수는 없다)
function freezeImmune(t){if(t.side!=='foe')return false;const E=E_(t);return !!((E.boss||E.elite)&&t.thawR!=null&&S.battle.round<=t.thawR+1)}
function applyOn(t,o){
  if(!o||!up(t))return;
  if(o.stun&&freezeImmune(t)){o=Object.assign({},o);delete o.stun;logB(josa(nm(t),'이')+' 얼음을 떨쳐 냈다 (막 풀려나 한 라운드 동안 다시 얼지 않는다)','sys');afx({type:'text',target:t.uid,text:'얼지 않음',color:'#c8ccd4',delay:fxDelay+460})}
  const say=(k,txt,col)=>{logB(josa(nm(t),'이')+' '+txt,hk(t));afx({type:'text',target:t.uid,text:ST_N[k],color:col,delay:fxDelay+460})};
  const tooBig=()=>{logB(josa(nm(t),'은')+' 너무 거대해 꿈쩍도 하지 않는다','sys');return true};
  if(o.stun){const k=S.battle.order.includes(t.uid+'*')?2:1;t.st.stun=Math.max(t.st.stun||0,o.stun*k);say('stun','얼어붙었다!','#9fd3ff')}
  if(o.poison){t.st.poison={t:o.poison,dmg:o.pdmg||'1d6'};say('poison','중독되었다!','#9be37a')}
  if(o.weak){t.st.weak=Math.max(t.st.weak||0,o.weak);say('weak','기가 꺾였다 (명중 -2)','#f0c75e')}
  if(o.restrain){t.st.restrain=Math.max(t.st.restrain||0,o.restrain);say('restrain','속박되었다!','#e8e2d2')}
  if(o.burn&&!t.st.wet){t.st.burn=Math.max(t.st.burn||0,o.burn);say('burn','불붙었다!','#ffa95e')}
  if(o.push){if(big(t))tooBig();else{if(t.row==='front'){t.row='back';t.high=false;logB(josa(nm(t),'이')+' 뒷열로 밀려났다',hk(t));surfHit(t)}if(up(t)){t.st.prone=1;say('prone','넘어졌다!','#e8e2d2')}}}
  else if(o.prone){if(big(t))tooBig();else{t.st.prone=1;say('prone','넘어졌다!','#e8e2d2')}}
}

// ── 바닥 표면
function zoneUnits(z){const [s,r]=z.split('-');return S.battle.units.filter(u=>u.side===s&&u.row===r&&up(u))}
function zoneName(z){const [s,r]=z.split('-');return (s==='pc'?'아군 ':'적 ')+ROWN[r]}
function fireLife(){return S.battle.field.rain?1:3}
function setSurf(z,t){
  const B=S.battle,cur=B.surf[z]&&B.surf[z].t,zn=zoneName(z),deep=B.surf[z]&&B.surf[z].r>=90;
  if(t==='fire'){
    if(cur==='water'){if(!deep)delete B.surf[z];logB(zn+' — 물이 끓어 증기가 피어올랐다'+(deep?'':' (물이 사라졌다)'),'sys');return}
    if(cur==='ice'){B.surf[z]={t:'water',r:3};logB(zn+' — 얼음이 녹아 물웅덩이가 되었다','sys');return}
    if(cur==='oil')explode(z);else logB(zn+'에 불이 붙었다'+(B.field.rain?' (비 때문에 오래가지 않는다)':''),'sys');
    B.surf[z]={t:'fire',r:fireLife()};return;
  }
  if(t==='ice'){
    if(cur==='fire'){B.surf[z]={t:'water',r:3};logB(zn+' — 불이 꺼지고 물웅덩이가 남았다','sys');return}
    B.surf[z]={t:'ice',r:3};logB(zn+' 바닥이 얼어붙었다','sys');return;
  }
  if(t==='oil'){
    if(cur==='fire'){explode(z);B.surf[z]={t:'fire',r:fireLife()};return}
    B.surf[z]={t:'oil',r:SURF.oil.r};logB(zn+' 바닥이 기름으로 덮였다','sys');return;
  }
  B.surf[z]={t,r:SURF[t].r};
}
function explode(z){
  logB(zoneName(z)+' — 기름에 불이 붙어 폭발했다!','sys');
  afx({type:'boom',zone:z,delay:fxDelay+200});
  zoneUnits(z).forEach(u=>{const dm=hurt(u,rollDice('2d6').total,'fire',{d:340});if(dm)logB(nm(u)+' — 폭발에 휘말려 불 피해 '+wtxt(dm,u),hk(u))});
}
// 불이 스친 열: 기름이면 불이 붙고, 얼음이면 녹는다
function fireTouch(z){const s=S.battle.surf[z];if(s&&(s.t==='oil'||s.t==='ice'))setSurf(z,'fire')}
// 표면 위에서 차례를 시작하거나 그 열로 들어설 때
function surfHit(u){
  const s=surfOf(u);if(!s||u.fly||!up(u))return;
  if(s==='water'){u.st.wet=2;if(u.st.burn){delete u.st.burn;logB(nm(u)+' — 물에 불이 꺼졌다','sys')}return}
  if(s==='fire'){const dm=hurt(u,rollDice('1d6').total,'fire');if(dm)logB(nm(u)+' — 불길 속에서 '+wtxt(dm,u)+' 피해',hk(u));return}
  if((s==='oil'||s==='ice')&&!big(u)&&!u.st.prone){
    const dc=s==='oil'?10:12,r=d(20)+saveMod(u,'민첩');
    if(r<dc){u.st.prone=1;logB(josa(nm(u),'이')+' '+(s==='oil'?'기름':'얼음')+'에 미끄러져 넘어졌다 (민첩 '+r+' vs '+dc+')',hk(u));afx({type:'text',target:u.uid,text:'미끄러짐',color:'#e8e2d2'})}
  }
}

// ── 전투 시작
function mkFoe(id,i){const E=SC.enemies[id];return {uid:'e'+i,side:'foe',kind:'foe',id,art:E.art||'wolf',name:E.name,lv:E.lv,hp:E.hp,hpMax:E.hp,ac:E.ac,atk:E.atk,dmg:E.dmg,row:E.row||'front',fly:!!E.fly,st:{},buffs:[],used:{},react:true}}
function nameList(ids){
  const c={};ids.forEach(i=>{const n=SC.enemies[i].name;c[n]=(c[n]||0)+1});
  const unit=n=>Object.values(SC.enemies).some(E=>E.name===n&&E.people)?'명':'마리';
  return Object.keys(c).map(n=>n+(c[n]>1?' '+c[n]+unit(n):'')).join(', ');
}
function startBattle(def,kind,ambush){
  def=copy(def);syncComps();
  if(kind==='story')def.noFlee=true;   // 이야기 전투에서는 도망칠 수 없다
  const la=pickArt(L().art)||{},ba=pickArt(def.art);
  const field=Object.assign({high:null,cover:false,water:false},L().field,def.field);
  field.rain=arr((ba||la).fx).includes('rain');
  const pids=party(),ids=def.enemies.slice();
  // 이야기 속에서 그 자리에 있는 동료는 함께 싸운다 (오르덴은 관문 안에서 유대와 상관없이 짐승을 막는다)
  const guests=arr(def.guests).concat(arr(def.guestsIf).filter(g=>ok(g.if)).map(g=>g.id));
  guests.forEach(id=>{if(pids.includes(id)||!SC.companions[id]||['hostile','dead'].includes(compState(id)))return;if(!compKnown(id)){const mx=compMaxHp(id);S.comp[id]=Object.assign(S.comp[id]||{ch:{}},{hp:mx,hpMax:mx})}pids.push(id)});
  if(def.scale){const n=Math.max(0,pids.length-(def.scaleFree||0));for(let i=0;i<n&&ids.length<5;i++)ids.push(def.scale[i%def.scale.length])}
  const units=[{uid:'hero',side:'pc',kind:'hero',id:'hero',name:S.hero.name,art:'hero',row:rowPref('hero')}];
  pids.forEach(id=>units.push({uid:id,side:'pc',kind:'comp',id,name:COMP(id).name,art:COMP(id).art,row:rowPref(id)}));
  // 영구 소환수도 처음부터 함께 나선다 (남은 HP 그대로)
  const petU=[];S.battle={units};pets().forEach(p=>{const u=summonUnit(p.id,p.sk&&SC.combatSkills[p.sk]?abOf(p.sk):null,{sk:p.sk,hp:p.hp,hpMax:p.hpMax,fixed:p.fixed,dmgB:p.dmgB});units.push(u);petU.push(u)});
  const sumN=S.battle.sumN||0;
  const en=ids.map(mkFoe);
  const cnt={},seen={};en.forEach(e=>cnt[e.name]=(cnt[e.name]||0)+1);
  en.forEach(e=>{if(cnt[e.name]>1){seen[e.name]=(seen[e.name]||0)+1;e.name+=' '+'ABCDE'[seen[e.name]-1]}});
  // 동료가 많을수록 우두머리·정예도 단단해진다
  const mods=[];
  if(def.perPC&&pids.length)en.forEach(e=>{const E=SC.enemies[e.id];if(E.boss||E.elite){e.hp+=def.perPC.hp*pids.length;e.hpMax=e.hp;mods.push('동료가 '+pids.length+'명이라 '+josa(e.name,'이')+' 더 단단하다 (HP +'+def.perPC.hp*pids.length+')')}});
  if(def.perPC&&petU.length)en.forEach(e=>{const E=SC.enemies[e.id];if(E.boss||E.elite){const add=Math.round(def.perPC.hp/2)*petU.length;e.hp+=add;e.hpMax=e.hp;mods.push('소환수가 '+petU.length+'마리라 '+josa(e.name,'이')+' 더 버틴다 (HP +'+add+')')}});
  if(def.drawn)mods.push('여럿이 다니니 적도 '+def.drawn+(ids.slice(-def.drawn).some(i=>SC.enemies[i].people)?'명':'마리')+' 더 몰려왔다 (쓰러뜨리면 그만큼 경험치도 많다)');
  arr(def.mods).forEach(m=>{if(ok(m.if)){en.forEach(e=>{if(m.hp)e.hp=Math.max(1,e.hp+m.hp);if(m.ac)e.ac+=m.ac;if(m.atk)e.atk+=m.atk});mods.push(m.why)}});
  units.push(...en);
  units.forEach(u=>{if(u.side==='pc'){u.st={};u.buffs=[];u.saves={s:0,f:0};u.high=false;u.react=true}u.ini=d(20)+iniMod(u)});
  const ord=units.map(u=>({uid:u.uid,ini:u.ini,pc:u.side==='pc'?1:0}));
  // 두 번째 차례(*)는 움직이기만 한다 — 상태와 표면 피해는 첫 차례에만 흐른다
  if(def.extraTurn&&pids.length>=def.extraTurn)en.filter(e=>SC.enemies[e.id].boss).forEach(e=>ord.push({uid:e.uid+'*',ini:e.ini-10,pc:0}));
  ord.sort((a,b)=>b.ini-a.ini||b.pc-a.pc);
  const B=S.battle={def,kind,units,sumN,order:ord.map(o=>o.uid),turn:-1,round:1,log:[],target:en[0].uid,surf:{},field,nE:en.length,
    surprise:ambush?'pc':def.surprise||null,over:null,res:null,last:null,tr:null};
  if(field.water){ZONES.forEach(z=>B.surf[z]={t:'water',r:99});units.forEach(u=>{if(!u.fly)u.st.wet=2})}
  for(const z in (def.surf||{}))B.surf[z]={t:def.surf[z],r:def.surf[z]==='fire'?fireLife():SURF[def.surf[z]].r};
  S.mode='combat';S.notice=null;cmenu=null;fxDelay=0;
  logB(def.intro?tpl(def.intro):(ambush?'매복이다! ':'')+josa(nameList(ids),'이')+' 나타났다!','sys');
  if(pids.length)logB('함께 싸운다: '+pids.map(id=>COMP(id).name).join(', '),'sys');
  if(petU.length)logB('곁의 소환수: '+petU.map(u=>nm(u)+' (HP '+u.hp+'/'+u.hpMax+')').join(', '),'sys');
  petU.forEach(summonArrive);
  mods.forEach(m=>logB('▸ '+m,'sys'));
  if(S.flags.shield)logB('별빛 방벽이 그대를 감싸고 있다. (첫 피해를 막는다)','sys');
  if(B.surprise==='foe')logB('적이 기습당했다! 첫 라운드에 적은 움직이지 못한다','sys');
  if(B.surprise==='pc')logB('기습당했다! 첫 라운드에 아군은 움직이지 못한다','foe');
  if(field.water)logB('무릎까지 물이 차 있다. 모두 젖는다 (불 피해 절반, 냉기에 얼어붙음)','sys');
  logB('주도권: '+B.order.map(id=>nm(U(id))).join(' → '),'sys');
  runTurns();
  save();render();toTop();
}
function startRandomBattle(ambush){
  const pool=L().encounters.filter(x=>!x.if||ok(x.if));
  let r=Math.random()*pool.reduce((a,b)=>a+b.w,0),g=pool[0];
  for(const x of pool){r-=x.w;if(r<0){g=x;break}}
  // 동료와 함께 다니면 적도 더 몰려온다
  const ids=g.e.slice(),n=party().length+Math.floor(petCapN()/2),extra=n?n+(n>=2&&Math.random()<0.25?1:0):0;
  const singles=pool.filter(x=>x.e.length===1&&!SC.enemies[x.e[0]].elite&&!arr(SC.enemies[x.e[0]].skills).some(k=>k.summon)).map(x=>x.e[0]);
  const base=ids.length;
  for(let i=0;i<extra&&ids.length<5&&singles.length;i++)ids.push(singles[rint(0,singles.length-1)]);
  startBattle({enemies:ids,perPC:{hp:12},drawn:ids.length-base},'random',ambush);
}

// ── 차례 진행
function startTurn(u){
  const B=S.battle;
  B.tr={act:1,bonus:1,move:1,sneak:false,dis:false};
  u.react=true;u.dodge=false;
  if(B.round===1&&B.surprise===u.side){logB(josa(nm(u),'은')+' 기습당해 움직이지 못한다','sys');afx({type:'text',target:u.uid,text:'기습당함',color:'#c8ccd4'});return false}
  if(u.st.prone&&!u.st.stun){delete u.st.prone;B.tr.move=0;logB(josa(nm(u),'이')+' 몸을 일으켰다 (이동을 썼다)','sys')}
  surfHit(u);
  if(up(u)&&u.st.burn){const dm=hurt(u,rollDice('1d4').total,'fire');if(dm)logB(nm(u)+' — 불붙은 몸에서 불 피해 '+wtxt(dm,u),hk(u));if(--u.st.burn<=0)delete u.st.burn}
  if(u.kind==='hero'&&lordOn()&&up(u)&&S.hero.hp<S.hero.hpMax){const v=heal(u,Math.ceil(S.hero.hpMax*SC.lord.regen));if(v)logB(nm(u)+' — 대군주의 잿불이 몸을 되살린다 (HP +'+v+')','me')}
  if(up(u)&&u.st.poison){const p=u.st.poison,dm=hurt(u,rollDice(p.dmg).total,'poison');if(dm)logB(nm(u)+' — 독 피해 '+wtxt(dm,u),hk(u));if(--p.t<=0)delete u.st.poison}
  if(!up(u))return false;
  if(u.st.stun){if(--u.st.stun<=0){delete u.st.stun;u.thawR=B.round}logB(josa(nm(u),'은')+' 얼어붙어 움직이지 못한다','sys');afx({type:'text',target:u.uid,text:'얼어붙음',color:'#9fd3ff'});return false}
  if(u.st.restrain){B.tr.move=0;if(--u.st.restrain<=0)delete u.st.restrain}
  if(u.st.prone)B.tr.move=0;
  return true;
}
function deathSave(u){
  if(u.out||u.stable)return;
  const r=ufx(u).death?Math.max(d(20),d(20)):d(20);
  if(r===20){R(u).hp=1;u.saves={s:0,f:0};u.st={prone:1};logB(nm(u)+' — 죽음 내성 20! 스스로 일어났다 (HP 1)','me');afx({type:'heal',target:u.uid,val:1,delay:fxDelay});return}
  if(r===1)u.saves.f+=2;else if(r>=10)u.saves.s++;else u.saves.f++;
  logB(nm(u)+' — 죽음 내성 d20('+r+') '+(r>=10?'성공':'실패')+' · 성공 '+Math.min(3,u.saves.s)+'/3 · 실패 '+Math.min(3,u.saves.f)+'/3',r>=10?'sys':'foe');
  if(u.saves.s>=3){u.stable=true;logB(josa(nm(u),'은')+' 숨이 고르게 돌아왔다 (안정). 누군가 일으켜 주어야 한다','sys')}
  checkOut(u);
}
function autoFor(u){return (u.kind==='comp'&&!!(S.opt&&S.opt.autoComp))||!!(S.battle&&S.battle.autoAll)}
// 다음 차례로 넘긴다. 적과 자동 동료의 차례는 바로 처리하고, 플레이어가 고를 아군 차례에서 멈춘다
function runTurns(){
  const B=S.battle;let guard=0;
  // 방금 차례를 마친 아군의 지속 효과가 한 턴 줄어든다
  const prev=curU();if(prev&&prev.side==='pc')endTurnFx(prev);
  while(!B.over){
    if(++guard>3000){logB('싸움이 끝없이 이어지다 모두 지쳐 쓰러졌다…','foe');loseBattle();return}
    B.turn++;
    if(B.turn>=B.order.length){endRound();B.turn=0}
    const id=B.order[B.turn],u=U(id);if(!u)continue;
    if(u.side==='foe'){
      if(!up(u))continue;
      if(String(id).endsWith('*')){
        if(u.st.stun){if(--u.st.stun<=0){delete u.st.stun;u.thawR=B.round}logB(josa(nm(u),'은')+' 얼어붙어 움직이지 못한다','sys')}
        else{B.tr={act:1,bonus:1,move:u.st.prone||u.st.restrain?0:1};if(!checkEnd())foeTurn(u)}
      }else{if(startTurn(u)&&!checkEnd())foeTurn(u);endTurnFx(u)}
      fxDelay+=520;if(checkEnd())return;continue;
    }
    if(u.gone)continue;
    if(u.kind==='summon'){if(up(u)&&startTurn(u)&&!checkEnd())summonTurn(u);endTurnFx(u);fxDelay+=380;if(checkEnd())return;continue}
    if(!up(u)){if(!u.out&&!u.stable){deathSave(u);fxDelay+=300}if(checkEnd())return;continue}
    const can=startTurn(u);
    if(checkEnd())return;
    if(!can){endTurnFx(u);fxDelay+=260;continue}
    if(autoFor(u)){aiTurn(u);endTurnFx(u);fxDelay+=420;if(checkEnd())return;continue}
    autoTarget(u);cmenu=null;
    return;
  }
}
// 차례를 마칠 때: 명중 감소·연막·도발과 버프가 한 턴 줄어든다 (걸린 쪽의 차례로 센다)
function endTurnFx(u){
  ['weak','blind','taunt','mark'].forEach(k=>{if(u.st[k]&&--u.st[k]<=0){delete u.st[k];if(k==='taunt')delete u.st.tauntBy;if(k==='mark')delete u.st.markD}});
  u.buffs=(u.buffs||[]).filter(b=>--b.t>0);
}
function checkEnd(){const B=S.battle;if(B.over)return true;if(!alive().length){winBattle();return true}if(!upPCs().length){loseBattle();return true}return false}
function endRound(){
  const B=S.battle;
  B.units.forEach(u=>{if(u.st.wet&&surfOf(u)!=='water'&&--u.st.wet<=0)delete u.st.wet});
  for(const z in B.surf){const s=B.surf[z];if(s.r<90&&--s.r<=0){delete B.surf[z];if(B.field.water)B.surf[z]={t:'water',r:99};logB(zoneName(z)+' — '+SURF[s.t].n+(s.t==='fire'?'이 꺼졌다':'이 사라졌다'),'sys')}}
  B.round++;
}

// ── 적의 차례
function foeTurn(e){
  const B=S.battle,E=E_(e),def=B.def;
  if(E.boss&&def.hesitate&&ok(def.hesitate.if)&&Math.random()<def.hesitate.p){logB(def.hesitate.text,'sys');afx({type:'text',target:e.uid,text:'머뭇거림',color:'#f0c75e'});return}
  let sk=null;
  for(const s of arr(E.skills)){
    if(s.once&&e.used[s.name])continue;
    if(s.needFront&&standing('pc','front').length<s.needFront)continue;
    if(s.summon&&alive().length>=5)continue;   // 전장에 적이 다섯을 넘지 않는다
    if(Math.random()<s.p){sk=s;break}
  }
  if(sk&&sk.summon){
    e.used[sk.name]=true;
    const ne=mkFoe(sk.summon,B.nE++);ne.name+=' (불려 옴)';ne.ini=e.ini-1;B.units.push(ne);B.order.splice(B.turn+1,0,ne.uid);
    logB(nm(e)+' — '+sk.name+'! '+josa(ne.name,'이')+' 나타났다.','foe');afx({type:'text',target:e.uid,text:sk.name,color:'#c8ccd4'});return;
  }
  if(sk&&sk.debuff){
    upPCs().forEach(p=>{p.buffs.push({atk:sk.debuff.atk,t:sk.debuff.turns,name:sk.name,neg:true});afx({type:'text',target:p.uid,text:'명중 '+sk.debuff.atk,color:'#ff9a8a',delay:fxDelay+200})});
    logB(sk.text||(nm(e)+' — '+sk.name+'!'),'foe');return;
  }
  const ranged=!!(sk?sk.ranged:E.ranged);
  // 근접하는 적은 앞열로 나선다. 원거리 적은 고지대에 오른다
  if(!ranged&&!e.fly&&!(sk&&sk.reach)&&e.row==='back'&&B.tr.move){e.row='front';B.tr.move=0;logB(josa(nm(e),'이')+' 앞열로 나섰다','foe');surfHit(e);if(!up(e))return}
  if(ranged&&!e.high&&e.row==='back'&&B.tr.move&&canClimb('foe')&&highCount('foe')<2){e.high=true;B.tr.move=0;logB(josa(nm(e),'이')+' 높은 곳으로 올라갔다','foe')}
  if(sk&&sk.sweep){
    const ts=upPCs().filter(t=>canMelee(e,t,false));
    if(ts.length){logB(nm(e)+' — '+sk.name+'!','foe');ts.forEach(t=>{foeAttack(e,t,sk);fxDelay+=200});return}
    sk=null;
  }
  let P=foeProfile(e,sk),cands=upPCs().filter(t=>canHit(e,t,P));
  if(!cands.length&&sk){sk=null;P=foeProfile(e,null);cands=upPCs().filter(t=>canHit(e,t,P))}
  if(!cands.length){
    const hidden=upPCs().filter(t=>t.hid);
    if(hidden.length){
      const t=hidden[rint(0,hidden.length-1)],nat=d(20),r=nat+Math.floor(e.lv/2)+1;
      if(nat===20||r>=t.hid){logB(nm(e)+' — 숨어 있던 '+josa(nm(t),'을')+' 찾아냈다! (지각 '+r+' vs 은신 '+t.hid+')','foe');delete t.hid;afx({type:'text',target:t.uid,text:'들킴',color:'#ff9a8a'})}
      else logB(nm(e)+' — 숨은 상대를 찾지 못했다 (지각 '+r+')','sys');
      return;
    }
    logB(josa(nm(e),'은')+' 닿는 상대가 없어 으르렁거린다','sys');return;
  }
  const tb=e.st.taunt&&U(e.st.tauntBy);
  if(tb&&cands.includes(tb))cands=[tb];
  // 가끔은 쓰러진 자를 끝장내려 든다 (죽음 내성 실패가 쌓인다)
  else{const downs=pcs().filter(t=>!up(t)&&!t.out&&reachDown(e,t,P));if(downs.length&&!sk&&Math.random()<0.2){foeAttack(e,downs[rint(0,downs.length-1)],null);return}}
  // 여러 번 무는 짐승은 기본 공격을 거듭한다
  const times=sk?1:(E.multi||1);
  for(let i=0;i<times;i++){
    const live=cands.filter(up);if(!live.length||!up(e))break;
    const t=Math.random()<0.6?live.slice().sort((a,b)=>R(a).hp/R(a).hpMax-R(b).hp/R(b).hpMax)[0]:live[rint(0,live.length-1)];
    if(i)fxDelay+=360;
    foeAttack(e,t,sk);
  }
}
function foeAttack(e,t,sk){
  if(!up(e))return;   // 받아치기에 쓰러졌으면 휩쓸기를 마저 하지 못한다
  const E=E_(e),P=foeProfile(e,sk),extra=[];
  // 오르덴의 수호: 앞열에 선 오르덴이 다른 아군을 노린 근접 공격을 막아선다 (라운드마다 한 번)
  const g=!P.ranged&&pcs().find(u=>guards(u)&&u!==t&&up(u)&&u.row==='front'&&u.react&&!u.st.stun&&!u.st.prone);
  if(g){g.react=false;extra.push(nm(g)+'의 수호');afx({type:'text',target:g.uid,text:'수호',color:'#8fb6ff',delay:fxDelay+100})}
  const r=attack(e,t,P,{extraDis:extra});
  // 반격 자세: 근접 공격이 빗나가면 곧바로 받아친다 (라운드마다 한 번)
  if(!r.hit&&!P.ranged&&t.side==='pc'&&up(t)&&up(e)&&bsumU(t,'riposte')>0&&t.riposteR!==S.battle.round&&!t.st.stun){
    t.riposteR=S.battle.round;fxDelay+=200;logB(nm(t)+' — 받아친다!','me');afx({type:'text',target:t.uid,text:'반격',color:'#f0c75e',delay:fxDelay});
    attack(t,e,profile(t,null));
  }
  if(!r.hit)return;
  if(E.drain&&r.dm){const v=Math.max(1,Math.floor(r.dm*E.drain));e.hp=Math.min(e.hpMax,e.hp+v);logB(josa(nm(e),'이')+' 피를 빨아 HP '+v+' 회복','foe')}
  if(E.poison&&up(t)&&Math.random()<E.poison.p)applyOn(t,{poison:E.poison.turns,pdmg:E.poison.dmg});
  if(sk&&sk.onHit)applyOn(t,sk.onHit);
}
// 공격 한 번: d20 + 명중 ≥ 방어. 1은 언제나 빗나가고, 치명 범위는 언제나 맞는다(피해 주사위 두 배)
function attack(a,t,P,o){
  o=o||{};const B=S.battle;
  const m=atkMode(a,t,P,o.extraDis,o.extraAdv),hm=heightMod(a,t,P),rr=d20(a,m.mode),r=rr.r;
  let bonus=P.hit+hm,ins=0;
  if(a.st.insp){ins=d(6);bonus+=ins;delete a.st.insp}
  const tot=r+bonus,ac=acOf(t),hit=r!==1&&(r>=P.crit||tot>=ac),wasDown=t.side==='pc'&&!up(t);
  const crit=hit&&(r>=P.crit||(P.critAdv&&m.mode==='adv'));   // 암살: 유리한 채로 맞히면 치명타
  if(P.spell||P.ranged)afx({type:'cast',from:a.uid,to:t.uid,color:P.dtype==='fire'?'#ffa95e':P.dtype==='cold'?'#bfe6ff':P.spell?'#9fc8ff':'#e8e2d2'});
  else afx({type:'lunge',who:a.uid,dir:a.side==='pc'?1:-1});
  const dt=(rr.dice.length>1?'d20['+rr.dice.join(', ')+'] '+(m.mode==='adv'?'유리':'불리')+'→'+r:'d20('+r+')')+(rr.notes.length?' ('+rr.notes.join(', ')+')':'')+' '+sign(P.hit)+(hm?' 고지대 '+sign(hm):'')+(ins?' 격려 +'+ins:'')+' = '+tot+' vs 방어 '+ac;
  const why=m.mode!=='normal'?' ['+(m.mode==='adv'?'유리: '+m.adv.join(', '):'불리: '+m.dis.join(', '))+']':'';
  if(a.hid)delete a.hid;
  if(a.side==='pc')B.last={r,dice:rr.dice,txt:P.name+' '+dt+(hit?(crit?' → 치명타!':' → 명중'):' → 빗나감')+why};
  if(!hit){logB(nm(a)+'의 '+P.name+' — '+nm(t)+'에게 빗나갔다'+(a.side==='foe'?' ('+tot+' vs 방어 '+ac+')':''),lk(a));afx({type:'miss',target:t.uid,delay:fxDelay+260});return {hit:false}}
  let v=P.dmg(crit),sn='';
  if(o.sneak){const sv=rollDice((Math.ceil(S.hero.level/2)+(specP('sneakDice')||0))+'d6',crit).total;v+=sv;sn=' (기습 +'+sv+')'}
  if(a.side==='pc'&&t.st.mark&&t.st.markD){const md=rollDice(t.st.markD,crit).total;v+=md;sn+=' (표식 +'+md+')'}
  // 복수의 불꽃: HP가 절반 이하인 적에게 무기 피해를 더한다
  if(a.kind==='hero'&&P.weapon&&t.side==='foe'&&specP('finisher')&&t.hp<=t.hpMax/2){const fv=rollDice(specP('finisher'),crit).total;v+=fv;sn+=' (복수 +'+fv+')'}
  if(P.execute&&t.hp<=t.hpMax/2){const ex=rollDice(P.execute,crit).total;v+=ex;sn+=' (처형 +'+ex+')'}
  const dm=hurt(t,v,P.dtype,{crit});
  if(wasDown)return {hit:true,dm:0,crit};
  if(a.side==='pc')B.last.txt+=' · 피해 '+dm+sn;
  logB(nm(a)+'의 '+P.name+' — '+nm(t)+'에게 '+(crit?'치명타! ':'')+(dm?wtxt(dm,t)+' 피해'+sn:'피해 없음')+(t.side==='foe'&&!up(t)?' · 쓰러뜨렸다!':''),lk(a));
  return {hit:true,dm,crit};
}

// ── 소환수: 소환사가 부르는 아군. 자기 차례에 알아서 싸우고(그대가 고른 적을 먼저 노린다), 쓰러지면 흩어진다.
// 한 번에 부릴 수 있는 수를 넘기면 가장 먼저 부른 것이 자리를 내준다. 전투가 끝나면 모두 돌아간다.
const LORD_T={};
function SUMT(id){
  const T=(SC.summons||{})[id];if(!T||!lordOn())return T;
  const L=SC.lord.summons[id];if(!L)return T;
  if(!LORD_T[id])LORD_T[id]=Object.assign({},T,{name:L.name||T.name,art:L.art||T.art,atk:Object.assign({},T.atk,{name:L.atk||T.atk.name,dtype:'fire'}),
    breath:T.breath?Object.assign({},T.breath,{dtype:'fire',name:L.breath||T.breath.name,burn:T.breath.burn||2}):undefined,burn:true,desc:T.desc+' — 대군주의 권속: 모든 공격이 불이고, 맞은 적은 불붙는다'});
  return LORD_T[id];
}
function summons(){const B=S.battle;return B&&B.units?B.units.filter(u=>u.kind==='summon'&&!u.gone):[]}
function sumCap(){const L=S.hero.level;return 2+(L>=6?1:0)+(L>=12?1:0)+(specP('sumCap')||0)+(heroFx().sumCap||0)}
// 자리를 차지하는 소환수 (별의 사도처럼 따로 오는 것은 빼고)
function capSummons(){return summons().filter(x=>!SUMT(x.id).noCap)}
function guards(u){return u.kind==='comp'?!!COMP(u.id).guard:u.kind==='summon'?!!u.guard:!!specP('guard')}
function resonAdd(u){return u&&u.kind==='hero'&&specP('resonance')?Math.min(4,summons().length)*specP('resonance'):0}
// 지금 레벨에서 그 소환수가 어떤 모습으로 오는지 (전투 밖에서도 셈한다)
function sumStats(id,ab){
  const T=SUMT(id),L=S.hero?S.hero.level:1,W=S.stats&&S.stats.length?statVal('지혜'):2,G=S.hero?heroFx():{};
  const hp=Math.round((T.hp+T.hpLv*L+W*2)*(1+(specP('sumHp')||0)+(G.sumHp||0)+((ab&&ab.hpMul)||0)));
  return {hp,ac:T.ac+Math.floor(L/4)+(G.sumAc||0),hit:profBonus()+W+(T.hit||0)+(G.sumHit||0),dmgB:W+Math.floor(L/3)+(specP('sumDmg')||0)+(G.sumDmg||0)+((ab&&ab.dmgAdd)||0),L};
}
function sumText(id,ab){const T=SUMT(id),x=S.hero?sumStats(id,ab):null;return T.name+(x?' (HP '+x.hp+' · 방어 '+x.ac+' · '+T.atk.name+' 명중 +'+x.hit+' 피해 '+T.atk.dice+'+'+x.dmgB+(T.multi?' ×'+T.multi:'')+')':'')+' — '+T.desc}
// 전투 속 소환수 하나 (o: sk 부른 기술, hp·hpMax 이어받은 HP, fixed 융합처럼 HP가 정해진 것, dmgB)
function summonUnit(id,ab,o){
  o=o||{};const B=S.battle,T=SUMT(id),x=sumStats(id,ab);
  const n=(B.sumN=(B.sumN||0)+1),same=B.units.filter(u=>u.kind==='summon'&&u.id===id).length;
  return {uid:'s'+n,side:'pc',kind:'summon',id,sk:o.sk||null,fixed:!!o.fixed,art:T.art,name:T.name+(same?' '+'ABCDEFGHIJ'[Math.min(9,same)]:''),row:T.row,fly:!!T.fly,big:!!T.big,guard:!!T.guard,multi:T.multi||1,
    hp:o.hp!=null?o.hp:x.hp,hpMax:o.hpMax!=null?o.hpMax:x.hp,ac:x.ac,hit:x.hit,dmgB:Math.max(x.dmgB,o.dmgB||0),atk:T.atk,lv:x.L,st:{},buffs:[],saves:{s:0,f:0},react:true,high:false};
}
function addSummon(id,ab,o){
  o=o||{};const B=S.battle,T=SUMT(id),noScale=o.noScale;
  if(T.noCap)summons().filter(x=>x.id===id).forEach(x=>{x.gone=true;x.noBurst=true});   // 따로 오는 소환수는 하나만
  else while(capSummons().length>=sumCap()){const old=capSummons()[0];old.gone=true;logB(josa(nm(old),'이')+' 자리를 내주고 별빛으로 돌아갔다','sys')}
  const u=summonUnit(id,ab,o);
  B.units.push(u);B.order.splice(B.turn+1,0,u.uid);
  afx({type:'heal',target:u.uid,val:u.hp,delay:fxDelay+200});
  summonArrive(u);
  // 동료가 늘면 우두머리가 단단해지듯, 소환수 하나마다 동료 반 몫만큼 (perPC의 절반)
  const pp=!noScale&&B.def&&B.def.perPC;if(pp)alive().filter(e=>E_(e).boss||E_(e).elite).forEach(e=>{const add=Math.round(pp.hp/2);e.hp+=add;e.hpMax+=add;logB(josa(nm(e),'이')+' 소환수를 보고 버틴다 (HP +'+add+')','sys')});
  return u;
}
// 나타날 때의 위압 (대군주): 적이 내성에 실패하면 겁에 질린다
function summonArrive(u){
  const T=SUMT(u.id),a=T.arrive;if(!a||!S.battle)return;
  const dc=spellDC(U('hero'),{stat:'지혜'}),hit=[];
  afx({type:'text',target:u.uid,text:a.name,color:'#ff9a4a'});
  alive().forEach(x=>{if(d(20)+saveMod(x,a.save)<dc){applyOn(x,a.onFail);hit.push(nm(x))}});
  logB(nm(u)+'의 '+a.name+' (내성 DC '+dc+') — '+(hit.length?hit.join(', ')+' 겁에 질렸다':'아무도 굴하지 않았다'),'me');
}
// 소환수의 한 번 공격: 고른 대상이 닿으면 그것을, 아니면 가장 약한 적을
function summonStrike(s,t){
  if(!up(s)||s.st.stun)return null;
  const P=profile(s,null);if(!P.ranged&&!s.fly&&s.row==='back'&&!s.st.restrain)s.row='front';
  const x=t&&up(t)&&canHit(s,t,P)?t:bestFoe(s,P);if(!x)return null;
  const r=attack(s,x,P);if(r.hit)summonHit(s,x);fxDelay+=220;return r;
}
function summonHit(s,x){
  const T=SUMT(s.id);if(!up(x))return;
  if(T.trip&&!big(x)&&d(20)+saveMod(x,'힘')<spellDC(U('hero'),{stat:'지혜'})){x.st.prone=1;logB(josa(nm(x),'이')+' 넘어졌다!','me');afx({type:'text',target:x.uid,text:'넘어짐',color:'#e8e2d2',delay:fxDelay+460})}
  if(T.burn)applyOn(x,{burn:2});
}
function summonTurn(u){
  const B=S.battle,T=SUMT(u.id);B.tr={act:1,bonus:1,move:1,sneak:false,dis:false};
  if(!alive().length)return;
  // 비룡의 숨결: 몇 라운드마다 모든 적에게
  if(T.breath&&B.round>=(u.breathR||0)){
    u.breathR=B.round+T.breath.every;const dc=spellDC(U('hero'),{stat:'지혜'}),parts=[];
    const bn=T.breath.name||'별빛 숨결',fire=T.breath.dtype==='fire';
    afx({type:'text',target:u.uid,text:bn,color:fire?'#ff9a4a':'#ffe6a0'});
    alive().forEach((x,i)=>{const base=rollDice(T.breath.dmg).total+statVal('지혜'),okS=d(20)+saveMod(x,T.breath.save)>=dc,v=okS?Math.floor(base/2):base;afx({type:'cast',from:u.uid,to:x.uid,color:fire?'#ff8a3c':'#ffe6a0'});const dm=hurt(x,v,T.breath.dtype,{d:300+i*90});parts.push(nm(x)+' '+(okS?'(내성 성공) ':'')+wtxt(dm,x)+(up(x)?'':' 쓰러짐'));if(!okS&&T.breath.burn)applyOn(x,{burn:T.breath.burn})});
    if(fire)[...new Set(alive().map(zk))].forEach(fireTouch);
    logB(nm(u)+'의 '+bn+' (내성 DC '+dc+') — '+parts.join(' · '),'me');return;
  }
  const t=tgtU();
  for(let i=0;i<(u.multi||1)&&up(u)&&alive().length;i++)summonStrike(u,t&&t.side==='foe'?t:null);
  // 별의 사도: 날개의 빛이 아군 모두를 치유한다
  if(T.heal&&up(u)){const parts=[];upPCs().forEach(p=>{const v=heal(p,rollDice(T.heal).total+statVal('지혜'));if(v)parts.push(nm(p)+' +'+v)});if(parts.length)logB(nm(u)+'의 빛의 날개 — '+parts.join(', '),'me')}
}
// 별의 계약자: 흩어지는 소환수가 적 앞열에 별빛을 터뜨린다
function summonBurst(t){
  const bd=specP('burst');if(!bd||t.noBurst)return;
  const tg=alive().filter(x=>x.row==='front').length?alive().filter(x=>x.row==='front'):alive();if(!tg.length)return;
  const parts=[];tg.forEach(x=>{const dm=hurt(x,rollDice(bd).total+statVal('지혜'),'radiant');parts.push(nm(x)+' '+wtxt(dm,x))});
  logB(nm(t)+' — 흩어지며 별빛이 터졌다: '+parts.join(', '),'me');
}

// ── 영구 소환수: 싸움이 끝나도 남은 HP 그대로 곁에 남고, 전투 밖에서도 부른다. 다음 싸움에 처음부터 함께 나선다
function pets(){return S.pets||(S.pets=[])}
function petCapN(){return pets().filter(p=>!SUMT(p.id).noCap).length}
function petStats(p){const x=sumStats(p.id,p.sk&&SC.combatSkills[p.sk]?abOf(p.sk):null);if(p.fixed)x.dmgB=Math.max(x.dmgB,p.dmgB||0);return x}
// 레벨·지혜·장비가 바뀌면 소환수도 따라 자란다 (HP 비율은 그대로)
function syncPets(){
  if(!S.hero)return;if(S.cls!=='summoner'){S.pets=[];return}
  pets().forEach(p=>{if(p.fixed)return;const mx=petStats(p).hp;if(p.hpMax!==mx){p.hp=Math.max(1,Math.min(mx,Math.round(p.hp*mx/(p.hpMax||mx))));p.hpMax=mx}});
}
// 싸움이 끝날 때: 살아남은 소환수가 영구 소환수로 남는다 (먼저 부른 것이 앞에)
function keepPets(){
  if(S.cls!=='summoner'||!S.battle)return;
  summons().filter(u=>up(u)&&SUMT(u.id).oneBattle).forEach(u=>logp(josa(SUMT(u.id).name,'이')+' 싸움을 마치고 심연으로 돌아갔다.'));
  S.pets=summons().filter(u=>up(u)&&!SUMT(u.id).oneBattle).map(u=>{const p={id:u.id,sk:u.sk,hp:u.hp,hpMax:u.hpMax};if(u.fixed){p.fixed=true;p.dmgB=u.dmgB}return p});
}
// 전투 밖에서 부를 수 없는 까닭 (없으면 null)
function outWhy(k){
  const ab=abOf(k);if(!ab||ab.lv>S.hero.level)return '아직 모른다';
  if(ab.mp&&S.hero.mp<ab.mp)return '마력 부족';
  if(ab.uses&&usesLeft({kind:'hero'},k)<=0)return '다 썼다 (휴식으로 충전)';
  if(ab.kind==='fuse'&&petCapN()<2)return '합칠 소환수가 둘 이상 있어야 한다';
  if(ab.hpCost&&S.hero.hp<=bloodCost(ab))return '피가 모자란다 (HP '+(bloodCost(ab)+1)+' 이상)';
  return null;
}
function summonOutside(k){
  const ab=abOf(k);if(rolling||S.mode!=='world'||outWhy(k))return;
  if(ab.mp)S.hero.mp-=ab.mp;if(ab.uses){const c=chOf({kind:'hero'});c[k]=usesLeft({kind:'hero'},k)-1}
  if(ab.hpCost){const c=bloodCost(ab);S.hero.hp=Math.max(1,S.hero.hp-c);logp('피의 대가로 HP '+c+'을 바쳤다.')}
  const made=[],left=[];
  if(ab.kind==='fuse'){
    const ms=pets().filter(p=>!SUMT(p.id).noCap),sum=ms.reduce((a,p)=>a+p.hp,0),dB=Math.max(...ms.map(p=>petStats(p).dmgB)),x=sumStats(ab.into,ab),mx=Math.max(x.hp,Math.round(sum*(ab.hpMul2||2)));
    ms.forEach(p=>left.push(SUMT(p.id).name));S.pets=pets().filter(p=>SUMT(p.id).noCap);
    S.pets.push({id:ab.into,sk:k,hp:mx,hpMax:mx,fixed:true,dmgB:Math.max(x.dmgB,dB+2)});made.push([SUMT(ab.into).name,mx]);
  }else arr(ab.summon).forEach(id=>{
    const T=SUMT(id);
    if(T.noCap)S.pets=pets().filter(p=>p.id!==id);
    else while(petCapN()>=sumCap()){const i=pets().findIndex(p=>!SUMT(p.id).noCap);left.push(SUMT(pets()[i].id).name);S.pets.splice(i,1)}
    const x=sumStats(id,ab);S.pets.push({id,sk:k,hp:x.hp,hpMax:x.hp});made.push([T.name,x.hp]);
  });
  const names=made.map(x=>x[0]).join(', '),hps=made.map(x=>x[0]+' HP '+x[1]).join(', ');
  const t=ab.kind==='fuse'?josa(left.join(', '),'이')+' 하나로 합쳐져 '+josa(names,'이')+' 되었다 ('+hps+')':josa(names,'을')+' 불렀다 ('+hps+')'+(left.length?' — '+josa(left.join(', '),'은')+' 자리를 내주고 돌아갔다':'');
  logp(t+'.');S.notice=t+'. 다음 싸움에서 처음부터 함께 나선다.';save();render();
}
function dismissPet(i){const p=pets()[i];if(!p||rolling)return;S.pets.splice(i,1);logp(SUMT(p.id).name+'을 돌려보냈다.');save();render()}

// ── 아군의 행동
// 지금 레벨의 기술: up에 적힌 레벨에 이르면 그 값으로 바뀐다 (lv는 처음 익히는 레벨 그대로)
function abOf(k){
  const ab=SC.combatSkills[k];if(!ab||!S.hero)return ab;
  const cost=ab.kind==='summon'&&ab.mp?heroFx().sumCost||0:0;   // 부르기 마력을 깎는 장비 (별지기의 예복)
  const lo=lordOn()&&ab.cls===S.cls?SC.lord.skills[k]:null;      // 대군주가 되면 기술도 바뀐다
  if(!ab.up&&!cost&&!lo)return ab;
  const r=Object.assign({},ab);arr(ab.up).forEach(x=>{if(S.hero.level>=x.lv)for(const f in x)if(f!=='lv'&&f!=='note')r[f]=x[f]});
  if(cost)r.mp=Math.max(1,r.mp-cost);
  if(lo){
    if(lo.name)r.name=lo.name;if(lo.dtype)r.dtype=lo.dtype;
    if(lo.dice&&r.dmg)r.dmg=diceAdd(r.dmg,lo.dice);if(lo.heal&&r.heal)r.heal=diceAdd(r.heal,lo.heal);if(lo.extra)r.extra=r.extra?diceAdd(r.extra,lo.extra):lo.extra;
    if(lo.times)r.times=(r.times||1)+lo.times;if(lo.mp&&r.mp)r.mp=Math.max(1,r.mp-lo.mp);if(lo.uses&&r.uses)r.uses+=lo.uses;if(lo.hpMul)r.hpMul=(r.hpMul||0)+lo.hpMul;if(lo.dmgAdd)r.dmgAdd=(r.dmgAdd||0)+lo.dmgAdd;
  }
  return r;
}
// 설명: 지금 값으로 채우고, 아직 오지 않은 강화를 덧붙인다
function abDesc(k){
  const ab=abOf(k),base=SC.combatSkills[k];
  let t=ab.desc.replace(/\{(dmg|heal|extra|darts|turns|chain|hits|execute|markD)\}/g,(m,f)=>ab[f]==null?m:f==='turns'&&S.hero&&!ab.comp?String(bTurns({kind:'hero'},ab)):String(ab[f]))
    .replace(/\{pdmg\}/g,()=>(ab.onHit||ab.onFail||{}).pdmg||'1d6').replace(/\{times\}/g,()=>String(ab.times||1))
    .replace(/\{sum\}/g,()=>[...new Set(arr(ab.summon).concat(ab.into?[ab.into]:[]))].map(id=>sumText(id,ab)).join(' / '));
  const next=arr(base.up).filter(x=>!S.hero||S.hero.level<x.lv);
  if(next.length)t+=' · '+next.map(x=>'레벨 '+x.lv+'부터 '+x.note).join(', ');
  return t;
}
function costKey(ab){return ab.cost==='bonus'?'bonus':'act'}
function unitSkills(u){
  if(u.kind==='hero')return knownSkills();
  return (COMP(u.id).skills||[]).filter(k=>abOf(k).lv<=S.hero.level);
}
// 쓸 수 없는 이유 (쓸 수 있으면 null)
function bloodCost(ab){return Math.floor(S.hero.hpMax*(ab.hpCost||0))}
function resWhy(u,k){
  const ab=abOf(k),B=S.battle;
  if(ab.hpCost&&u.kind==='hero'&&S.hero.hp<=bloodCost(ab))return '피가 모자란다 (HP '+(bloodCost(ab)+1)+' 이상)';
  if(!B.tr[costKey(ab)])return (ab.cost==='bonus'?'보조 행동':'행동')+'을 이미 썼다';
  if(ab.mp&&S.hero.mp<ab.mp)return '마력 부족';
  if(ab.uses&&usesLeft(u,k)<=0)return '다 썼다 (휴식으로 충전)';
  return null;
}
function sneakOK(a,t,P){
  if(a.kind!=='hero'||!cls().sneak||!P.weapon||S.battle.tr.sneak||!t)return false;
  const m=atkMode(a,t,P).mode;if(m==='dis')return false;
  return m==='adv'||(t.row==='front'&&pcs().some(p=>p!==a&&up(p)&&p.row==='front'));
}
function rogue(u){return u.kind==='hero'&&S.cls==='rogue'}
function canClimb(side){const h=S.battle.field.high;return h==='both'||h===side}
function highCount(side){return S.battle.units.filter(x=>x.side===side&&x.high&&up(x)).length}
// 앞열에서 물러날 때 기회 공격을 할 수 있는 적 (물러서기를 했으면 없음)
function oaFoes(u){
  if(S.battle.tr.dis||u.row!=='front')return [];
  return alive().filter(e=>e.row==='front'&&!E_(e).ranged&&e.react&&!e.st.stun&&!e.st.prone&&!e.st.restrain).slice(0,2);
}
function moveOpts(u){
  const B=S.battle,o=[];if(!B.tr.move||u.st.restrain||u.st.prone)return o;
  const oa=oaFoes(u).length;
  if(u.row==='front')o.push({id:'back',label:'뒷열로 물러난다',small:oa?'기회 공격 '+oa+'번을 받는다':'안전하게 물러난다'});
  else o.push({id:'front',label:'앞열로 나선다',small:'근접 공격을 할 수 있다'});
  if(!u.high&&canClimb('pc')&&highCount('pc')<2)o.push({id:'up',label:'고지대에 오른다',small:'뒷열 · 원거리 명중 +2, 낮은 곳의 원거리 공격 -2'+(u.row==='front'&&oa?' · 기회 공격 '+oa+'번':'')});
  if(u.high)o.push({id:'down',label:'고지대에서 내려온다',small:'뒷열에 그대로'});
  return o;
}
function moveTo(u,dest){
  const B=S.battle;
  if(dest!=='front'&&u.row==='front')oaFoes(u).forEach(e=>{if(!up(u))return;e.react=false;logB(nm(e)+' — 물러서는 '+josa(nm(u),'을')+' 노린 기회 공격!','foe');foeAttack(e,u,null);fxDelay+=300});
  if(!up(u))return;
  if(dest==='up'){u.row='back';u.high=true;logB(josa(nm(u),'이')+' 고지대에 올랐다 (원거리 명중 +2)','me')}
  else if(dest==='down'){u.high=false;logB(josa(nm(u),'이')+' 고지대에서 내려왔다','me');return}
  else{u.row=dest;u.high=false;logB(josa(nm(u),'이')+' '+josa(ROWN[dest],'으로')+(dest==='front'?' 나섰다':' 물러났다'),'me')}
  if(dest==='front'&&u.hid){delete u.hid;logB(josa(nm(u),'이')+' 모습을 드러냈다','sys')}
  surfHit(u);
}
function hpPotions(){return [...new Set(S.items.filter(n=>SC.items[n]&&SC.items[n].use&&SC.items[n].use.hp))]}
function shoveMod(u){return u.kind==='hero'?skillMod('운동'):COMP(u.id).str+2}
function foeStr(t){const E=E_(t);return E.str!=null?E.str:Math.floor(t.lv/2)+1}
function shoveP(u,t){const a=shoveMod(u),b=foeStr(t);let p=0;for(let x=1;x<=20;x++)for(let y=1;y<=20;y++)if(x+a>y+b)p++;return p/400}
function hideMod(u){return u.kind==='hero'?skillMod('은신'):COMP(u.id).dex+2}
function hideDC(){return 10+Math.max(0,...alive().map(e=>Math.floor(e.lv/2)+1))}
function throwHit(u){return (u.kind==='hero'?statVal('민첩')+profBonus():COMP(u.id).dex+2+lvB())-(u.st.weak?2:0)}
function rockP(u){const s=u.kind==='hero'?statVal('힘'):COMP(u.id).str;return {name:'돌 던지기',hit:(u.kind==='hero'?s+profBonus():s+2+lvB())-(u.st.weak?2:0),ranged:true,crit:20,dtype:'phys',dice:'1d4'+sign(Math.max(0,s)),dmg:c=>rollDice('1d4',c).total+Math.max(0,s)}}
function fleeInfo(){return {bonus:statVal('민첩')+(S.cls==='rogue'?3:0),dc:10+Math.max(...alive().map(e=>e.lv))}}
function bossU(){return foes().find(e=>E_(e).boss)||foes()[0]}
function specialOf(id){return arr(S.battle.def.special).find(x=>x.id===id)}
function specialReady(sp){const b=bossU();return ok(sp.if)&&up(b)&&b.hp<=b.hpMax*(sp.below||1)&&S.hero.mp>=(sp.mp||0)}
function spStat(sp){return sp.stat==='class'?cls().key:sp.stat}
function specialDC(sp){let dc=sp.dc;const why=[];arr(sp.dcMod).forEach(m=>{if(ok(m.if)){dc+=m.v;why.push(m.why+' '+sign(m.v))}});return {dc,why}}
function tgtU(){const t=U(S.battle.target);return t&&t.side==='foe'?t:null}
// 지금 고른 대상이 이 아군의 기본 공격에 닿지 않으면 닿는 대상으로 바꾼다
function autoTarget(u){
  const B=S.battle,P=profile(u,null),t=tgtU();
  if(t&&canHit(u,t,P))return;
  const c=alive().filter(x=>canHit(u,x,P));
  const v=c.length?c.sort((a,b)=>a.hp-b.hp)[0]:alive().find(x=>!x.hid);
  if(v)B.target=v.uid;
}
// 행동이 가능한지: {ok, roll(주사위를 굴리는지), why}
function canDo(u,kind,arg,au){
  const B=S.battle,t=tgtU(),no=why=>({ok:false,why});
  if(!myTurn()||rolling||curU()!==u)return no('차례가 아니다');
  const tok=x=>x&&up(x)&&!x.hid;
  if(kind==='attack'){if(!B.tr.act)return no('행동을 이미 썼다');const P=profile(u,null);return t&&canHit(u,t,P)?{ok:true,roll:true}:no(P.ranged?'대상이 없다':'닿지 않음 · 앞열로 나서거나 앞열의 적을 고른다')}
  if(kind==='skill'){
    const ab=abOf(arg),w=resWhy(u,arg);if(w)return no(w);
    if(ab.kind==='attack'||ab.kind==='pierce'){const P=profile(u,ab);return t&&canHit(u,t,P)?{ok:true,roll:true}:no('대상에 닿지 않는다')}
    if(ab.kind==='sweep')return alive().some(x=>canMelee(u,x,false))?{ok:true,roll:true}:no('닿는 적이 없다');
    if(ab.kind==='volley')return alive().some(x=>!x.hid)?{ok:true,roll:true}:no('대상이 없다');
    if(ab.kind==='command')return !summons().length?no('부린 소환수가 없다'):tok(t)?{ok:true,roll:true}:no('대상을 고른다');
    if(ab.kind==='bond'||ab.kind==='sacrifice')return summons().length?{ok:true,roll:ab.kind==='sacrifice'}:no('부린 소환수가 없다');
    if(ab.kind==='summon')return {ok:true};
    if(ab.kind==='fuse')return capSummons().length>=2?{ok:true}:no('합칠 소환수가 둘 이상 있어야 한다');
    if(ab.kind==='save'&&ab.area==='all')return {ok:true,roll:true};
    if(ab.kind==='save'||ab.kind==='surface'||ab.kind==='darts')return tok(t)?{ok:true,roll:ab.kind==='save'}:no('대상을 고른다');
    if(ab.kind==='heal'){if(!au)return pcs().some(p=>!p.out&&R(p).hp<R(p).hpMax)?{ok:true,pick:true}:no('다친 아군이 없다');const a=U(au);return a&&!a.out&&R(a).hp<R(a).hpMax?{ok:true}:no('회복할 수 없다')}
    if(ab.kind==='self')return R(u).hp<R(u).hpMax?{ok:true}:no('HP가 가득하다');
    if(ab.kind==='surge')return B.tr.act?no('행동을 먼저 쓴다'):{ok:true};
    if(ab.kind==='step'){if(u.st.restrain)return no('속박되어 움직일 수 없다');if(u.hid)return no('이미 숨어 있다');return {ok:true}}
    if(ab.kind==='mark')return tok(t)?{ok:true}:no('대상을 고른다');
    if(ab.kind==='rally')return upPCs().some(p=>R(p).hp<R(p).hpMax||['stun','weak','restrain','poison'].some(x=>p.st[x]))?{ok:true}:no('도울 이가 없다');
    return {ok:true};
  }
  if(kind==='shove'){if(!B.tr.act)return no('행동을 이미 썼다');if(!t||!canMelee(u,t,false))return no('앞열에서, 닿는 적에게만');if(big(t))return no('너무 거대하다');return {ok:true,roll:true}}
  if(kind==='hide'){const c=rogue(u)?'bonus':'act';if(!B.tr[c])return no((c==='bonus'?'보조 행동':'행동')+'을 이미 썼다');if(u.hid)return no('이미 숨어 있다');if(u.row!=='back')return no('뒷열에서만 숨을 수 있다');return {ok:true,roll:true}}
  if(kind==='help'){if(!B.tr.act)return no('행동을 이미 썼다');if(!au)return pcs().some(p=>!up(p)&&!p.out)?{ok:true,pick:true}:no('쓰러진 동료가 없다');const a=U(au);return a&&!up(a)&&!a.out?{ok:true}:no('일으킬 수 없다')}
  if(kind==='dodge')return B.tr.act?{ok:true}:no('행동을 이미 썼다');
  if(kind==='drink'){if(!B.tr.bonus)return no('보조 행동을 이미 썼다');if(!S.items.includes(arg))return no('없다');const it=SC.items[arg].use;if(it.mp&&u.kind!=='hero')return no('마력이 없다');if(!it.mp&&R(u).hp>=R(u).hpMax)return no('HP가 가득하다');return {ok:true}}
  if(kind==='give'){if(!B.tr.act)return no('행동을 이미 썼다');if(!S.items.includes(arg))return no('없다');const can=a=>a&&a!==u&&!a.out&&R(a).hp<R(a).hpMax;if(!au)return pcs().some(can)?{ok:true,pick:true}:no('다친 동료가 없다');return can(U(au))?{ok:true}:no('줄 수 없다')}
  if(kind==='throw'){if(!B.tr.act)return no('행동을 이미 썼다');if(arg!=='돌'&&!S.items.includes(arg))return no('없다');return tok(t)?{ok:true,roll:arg!=='기름 병'}:no('대상을 고른다')}
  if(kind==='move')return moveOpts(u).some(o=>o.id===arg)?{ok:true}:no('움직일 수 없다');
  if(kind==='dis')return rogue(u)&&B.tr.bonus&&!B.tr.dis?{ok:true}:no('쓸 수 없다');
  if(kind==='flee'){if(u.kind!=='hero'||!B.tr.act)return no('그대의 행동으로만');return B.def.noFlee?no('도망칠 수 없다'):{ok:true,roll:true}}
  if(kind==='special'){if(u.kind!=='hero'||!B.tr.act)return no('그대의 행동으로만');const sp=specialOf(arg);return sp&&specialReady(sp)?{ok:true,roll:true}:no('아직 때가 아니다')}
  return no('?');
}
function pcAct(kind,arg,au){
  const u=curU();if(!u)return;
  const c=canDo(u,kind,arg,au);if(!c.ok)return;
  if(c.pick){cmenu={pick:kind,arg};renderCombat();return}
  cmenu=null;
  const g=gen;
  const go=()=>{
    if(g!==gen)return;
    rolling=false;fxDelay=0;S.battle.last=null;
    doIt(u,kind,arg,au);
    if(!checkEnd()&&(!up(u)||spent()))runTurns();
    save();render();
  };
  if(c.roll){rolling=true;renderCombat();animateDie('cshape','cnum',go)}else go();
}
function spent(){const t=S.battle.tr;return !t.act&&!t.bonus&&!t.move}
function endTurn(){if(!myTurn()||rolling)return;cmenu=null;fxDelay=0;runTurns();save();render()}
// 끝까지 자동 (사냥에서만): 그대와 동료 모두 알아서 싸워 전투를 끝낸다
function autoAll(){const B=S.battle;if(!B||B.over||B.kind!=='random'||!myTurn()||rolling)return;B.autoAll=true;autoNow()}
function autoNow(){const u=curU();if(!myTurn()||rolling)return;cmenu=null;fxDelay=0;S.battle.last=null;aiTurn(u);if(!checkEnd())runTurns();save();render()}
function doIt(u,kind,arg,au){
  const B=S.battle,t=tgtU(),h=S.hero;
  if(kind==='attack'){B.tr.act=0;const P=profile(u,null),sn=sneakOK(u,t,P),r=attack(u,t,P,{sneak:sn});if(r.hit){if(sn)B.tr.sneak=true;if(P.burn)applyOn(t,{burn:2})}if(P.dtype==='fire')fireTouch(zk(t));return}
  if(kind==='skill'){useAb(u,arg,t,au);return}
  if(kind==='shove'){
    B.tr.act=0;delete u.hid;const rr=d20(u,'normal'),a=rr.r+shoveMod(u),b=d(20)+foeStr(t);
    afx({type:'lunge',who:u.uid,dir:1});
    B.last={r:rr.r,dice:rr.dice,txt:'밀치기 d20('+rr.r+') '+sign(shoveMod(u))+' = '+a+' vs '+nm(t)+' '+b+(a>b?' → 성공':' → 실패')};
    if(a>b){logB(nm(u)+' — '+josa(nm(t),'을')+' 밀쳐 냈다! ('+a+' vs '+b+')','me');applyOn(t,{push:1})}
    else{logB(nm(u)+' — '+josa(nm(t),'을')+' 밀치지 못했다 ('+a+' vs '+b+')','me');afx({type:'miss',target:t.uid,delay:260})}
    return;
  }
  if(kind==='hide'){
    B.tr[rogue(u)?'bonus':'act']=0;const mode=B.field.cover||ufx(u).hide?'adv':'normal',rr=d20(u,mode),tot=rr.r+hideMod(u),dc=hideDC();
    B.last={r:rr.r,dice:rr.dice,txt:'숨기 '+(rr.dice.length>1?'d20['+rr.dice.join(', ')+'] 유리→'+rr.r:'d20('+rr.r+')')+' '+sign(hideMod(u))+' = '+tot+' vs '+dc+(tot>=dc?' → 숨었다':' → 들켰다')};
    if(tot>=dc){u.hid=tot;logB(josa(nm(u),'이')+' 숨었다. 적이 노릴 수 없고, 다음 공격이 유리하다','me');afx({type:'text',target:u.uid,text:'숨음',color:'#c8ccd4'})}
    else logB(nm(u)+' — 숨으려 했지만 들켰다','me');
    return;
  }
  if(kind==='help'){B.tr.act=0;const a=U(au);R(a).hp=1;a.saves={s:0,f:0};a.stable=false;a.st={prone:1};logB(nm(u)+' — '+josa(nm(a),'을')+' 일으켜 세웠다 (HP 1)','me');afx({type:'heal',target:a.uid,val:1});return}
  if(kind==='dodge'){B.tr.act=0;u.dodge=true;if(u.kind==='hero')h.mp=Math.min(h.mpMax,h.mp+1);logB(josa(nm(u),'이')+' 회피 자세를 취했다 (받는 공격 불리'+(u.kind==='hero'?', 마력 +1':'')+')','me');afx({type:'text',target:u.uid,text:'회피',color:'#8fb6ff'});return}
  if(kind==='drink'||kind==='give'){
    B.tr[kind==='drink'?'bonus':'act']=0;const a=kind==='drink'?u:U(au),it=SC.items[arg];S.items.splice(S.items.indexOf(arg),1);
    const parts=[];if(it.use.hp)parts.push('HP +'+heal(a,it.use.hp));
    if(it.use.mp&&a.kind==='hero'){const was=h.mp;h.mp=Math.min(h.mpMax,h.mp+it.use.mp);parts.push('마력 +'+(h.mp-was));afx({type:'text',target:a.uid,text:'마력 +'+(h.mp-was),color:'#8fb6ff',delay:200})}
    logB(nm(u)+' — '+josa(arg,'을')+(kind==='drink'?' 마셨다':' '+nm(a)+'에게 먹였다')+' ('+parts.join(', ')+')','me');return;
  }
  if(kind==='throw'){
    B.tr.act=0;
    if(arg==='돌'){attack(u,t,rockP(u));return}
    const th=SC.items[arg].throw;S.items.splice(S.items.indexOf(arg),1);
    if(th.dmg)attack(u,t,{name:arg+' 던지기',hit:throwHit(u),ranged:true,crit:20,dtype:th.dtype,dmg:c=>rollDice(th.dmg,c).total});
    else{delete u.hid;afx({type:'cast',from:u.uid,to:t.uid,color:'#8a7a5a'});logB(nm(u)+' — '+josa(arg,'을')+' '+nm(t)+' 쪽으로 던졌다','me');B.last={r:null,txt:josa(arg,'을')+' 던졌다'}}
    if(th.surface)setSurf(zk(t),th.surface);
    return;
  }
  if(kind==='move'){B.tr.move=0;moveTo(u,arg);return}
  if(kind==='dis'){B.tr.bonus=0;B.tr.dis=true;logB(josa(nm(u),'이')+' 물러설 틈을 노린다 (이번 차례에 기회 공격을 받지 않는다)','me');return}
  if(kind==='flee'){
    B.tr.act=0;const {bonus,dc}=fleeInfo(),rr=rollD20('normal'),r=rr.r,tot=r+bonus,okF=r!==1&&(r===20||tot>=dc);
    B.last={r,txt:'도망 d20('+r+') '+sign(bonus)+' = '+tot+' vs '+dc+(okF?' → 성공':' → 실패')};
    if(okF){B.over='fled';B.res={title:'도망쳤다',lines:['모두 무사히 빠져나왔다.']};logB('도망쳤다!','sys')}
    else{logB('도망치지 못했다!','sys');afx({type:'text',target:'hero',text:'도망 실패',color:'#c8ccd4'})}
    return;
  }
  if(kind==='special'){
    B.tr.act=0;const sp=specialOf(arg),{dc}=specialDC(sp),rr=rollD20('normal'),r=rr.r,bonus=statVal(spStat(sp))+profBonus(),tot=r+bonus,b=bossU();
    h.mp-=sp.mp||0;
    const okS=r!==1&&(r===20||tot>=dc);
    B.last={r,txt:sp.label+' d20('+r+') '+sign(bonus)+' = '+tot+' vs DC '+dc+(okS?' → 성공!':' → 실패')};
    afx({type:'cast',from:'hero',to:b.uid,color:'#e6ebf2'});
    if(okS){B.over=sp.outcome;B.res={title:sp.label+' — 성공!',lines:[]};logB(sp.label+' — 성공했다!','me');afx({type:'text',target:b.uid,text:sp.fxText||'낙인이 부서진다',color:'#ffffff',delay:300})}
    else{logB(sp.label+' — '+sp.failText,'foe');if(sp.failHp){const dm=hurt(u,-sp.failHp,'psychic');if(dm)logB('HP -'+dm,'foe')}}
  }
}
function useAb(u,k,t,au){
  const B=S.battle,ab=abOf(k),h=S.hero,lab=nm(u)+'의 '+ab.name;
  B.tr[costKey(ab)]=0;
  if(ab.mp)h.mp-=ab.mp;
  if(ab.uses){const c=chOf(u);c[k]=usesLeft(u,k)-1}
  const fx_=(x,txt,col)=>afx({type:'text',target:x.uid,text:txt,color:col||'#f0c75e'});
  // 적을 겨누는 기술은 숨은 자리를 드러낸다 (명중 굴림 공격은 attack()이 유리를 준 뒤 드러낸다)
  if(['darts','save','surface','debuffAll','taunt','mark'].includes(ab.kind))delete u.hid;
  // 감전: 젖은 적은 번개에 얼어붙는다
  const shock=x=>{if(ab.shock&&up(x)&&x.st.wet){logB(josa(nm(x),'이')+' 감전되었다!','me');applyOn(x,{stun:1})}};
  if(ab.kind==='attack'){
    // hits: 여러 번 휘두른다 (광란·칼날 폭풍). spread면 닿는 적들에게 돌아가며, 아니면 같은 대상을 (쓰러지면 닿는 다른 적을)
    const P=profile(u,ab),n=ab.hits||1,done=[];let tg=t,tot=0,lastR=null;
    for(let i=0;i<n;i++){
      if(i){
        const cands=alive().filter(x=>canHit(u,x,P));if(!cands.length)break;
        tg=ab.spread?(cands.find(x=>!done.includes(x))||cands[i%cands.length]):(up(tg)&&canHit(u,tg,P)?tg:cands[0]);
        fxDelay+=240;
      }
      done.push(tg);
      const sn=sneakOK(u,tg,P),r=attack(u,tg,P,{sneak:sn});lastR=r;
      if(r.hit){if(sn)B.tr.sneak=true;tot+=r.dm||0;applyOn(tg,ab.onHit);if(ab.surface)setSurf(zk(tg),ab.surface);shock(tg)}
      // 번개 사슬: 맞힌 피해의 절반이 다른 적에게 튄다
      if(r.hit&&ab.chain){
        const half=Math.max(1,Math.floor((r.dm||0)/2)),hops=[],from=tg;
        alive().filter(x=>x!==from&&!x.hid).slice(0,ab.chain).forEach((x,j)=>{fxDelay+=180;afx({type:'cast',from:from.uid,to:x.uid,color:'#cfe3ff'});const dm=hurt(x,half,ab.dtype,{d:300+j*120});hops.push(nm(x)+' '+wtxt(dm,x)+(up(x)?'':' 쓰러짐'));shock(x)});
        if(hops.length){logB('번개가 튄다 — '+hops.join(', '),'me');B.last.txt+=' · 튐 '+hops.length+'명'}
      }
      if(P.dtype==='fire')fireTouch(zk(tg));
      if(!up(u))break;
    }
    if(n>1&&B.last)B.last.txt=ab.name+' '+done.length+'번 · '+B.last.txt;
    // 피의 일격: 준 피해의 일부만큼 되찾는다
    if(ab.drain&&tot&&up(u)){const v=heal(u,Math.max(1,Math.floor(tot*ab.drain)));if(v)logB(nm(u)+' — 피를 되찾았다 (HP +'+v+')','me')}
    // 그림자 일격: 맞히면 다시 숨는다 (뒷열에서만)
    if(ab.rehide&&lastR&&lastR.hit&&up(u)&&u.row==='back'){u.hid=true;fx_(u,'숨음','#c8ccd4');logB(josa(nm(u),'이')+' 다시 그림자 속으로 사라졌다','me')}
    return;
  }
  // 모든 적을 한 번씩 (화살비·그림자 습격). adv면 모두 유리하게, 기습 피해는 첫 적에게만
  if(ab.kind==='volley'){
    const P=profile(u,ab),tg=alive().filter(x=>!x.hid),hero_=u.kind==='hero';   // 열과 상관없이 닿는다
    tg.forEach((x,i)=>{
      if(!up(x))return;if(i)fxDelay+=200;
      const sn=i===0&&hero_&&cls().sneak&&!B.tr.sneak&&(ab.adv||sneakOK(u,x,P));
      const r=attack(u,x,P,{sneak:sn,extraAdv:ab.adv?[ab.name]:null});
      if(r.hit){if(sn)B.tr.sneak=true;applyOn(x,ab.onHit)}
    });
    if(B.last)B.last.txt=ab.name+' '+tg.length+'명 · '+B.last.txt;
    if(P.dtype==='fire')[...new Set(tg.map(zk))].forEach(fireTouch);
    return;
  }
  // 소환: 부르고, 자리가 모자라면 가장 먼저 부른 것을 돌려보낸다
  if(ab.kind==='summon'){
    if(ab.hpCost){const c=bloodCost(ab);h.hp=Math.max(1,h.hp-c);logB(nm(u)+' — 피의 대가 (HP -'+c+')','foe');afx({type:'hit',target:u.uid,val:c,delay:fxDelay+100})}
    const made=arr(ab.summon).map(id=>addSummon(id,ab,{sk:k}));
    if(ab.buff)summons().forEach(x=>addBuff(x,ab.name,ab.buff,ab.turns));
    fx_(u,ab.name,'#9fc8ff');B.last={r:null,txt:ab.name+' — '+made.map(nm).join(', ')+' 나타났다'};
    logB(lab+'! '+made.map(x=>nm(x)+' (HP '+x.hp+')').join(', ')+' — 소환수 '+capSummons().length+'/'+sumCap(),'me');return;
  }
  // 별의 융합: 자리를 차지한 소환수를 모두 하나의 거수로 합친다 (남은 HP를 모아 더 크게)
  if(ab.kind==='fuse'){
    const ss=capSummons(),hpSum=ss.reduce((a,x)=>a+x.hp,0),dB=Math.max(...ss.map(x=>x.dmgB)),names=ss.map(nm);
    ss.forEach(x=>{x.gone=true;x.noBurst=true});
    const c=addSummon(ab.into,ab,{noScale:true,sk:k,fixed:true});c.hp=c.hpMax=Math.max(c.hp,Math.round(hpSum*(ab.hpMul2||2)));c.dmgB=Math.max(c.dmgB,dB+2);
    fx_(u,ab.name,'#ffe6a0');B.last={r:null,txt:ab.name+' — '+names.join('·')+' → '+nm(c)+' (HP '+c.hp+')'};
    logB(lab+'! '+names.join(', ')+'이 하나로 합쳐져 '+josa(nm(c),'이')+' 되었다 (HP '+c.hp+')','me');return;
  }
  // 명령: 부린 소환수 모두가 곧바로 대상을 공격한다 (times번)
  if(ab.kind==='command'){
    if(ab.buff)summons().forEach(x=>addBuff(x,ab.name,ab.buff,ab.turns));
    logB(lab+'! 소환수들이 '+josa(nm(t),'을')+' 덮친다','me');fx_(u,ab.name,'#9fc8ff');
    for(let i=0;i<(ab.times||1);i++)summons().forEach(x=>{for(let j=0;j<(x.multi||1);j++)summonStrike(x,t)});
    if(B.last&&ab.times>1)B.last.txt=ab.name+' ×'+ab.times+' · '+B.last.txt;
    return;
  }
  // 영혼 잇기: 소환수 모두 회복하고 북돋운다
  if(ab.kind==='bond'){
    const parts=[];summons().forEach(x=>{const v=heal(x,rollDice(ab.heal).total+statVal(ab.stat||'지혜'));if(ab.buff)addBuff(x,ab.name,ab.buff,ab.turns);fx_(x,ab.name,'#9fc8ff');parts.push(nm(x)+(v?' HP +'+v:''))});
    B.last={r:null,txt:ab.name+' — '+parts.join(', ')};logB(lab+' — '+parts.join(', ')+(ab.buff?' · '+ab.turns+'턴 동안 '+buffText(ab.buff):''),'me');return;
  }
  // 별의 제물: 소환수를 모두 터뜨린다. 하나마다 모든 적에게 별빛
  if(ab.kind==='sacrifice'){
    const ss=summons(),dc=spellDC(u,ab),tot={};
    ss.forEach((x,j)=>{x.noBurst=true;x.gone=true;afx({type:'text',target:x.uid,text:'별빛',color:'#ffe6a0'});
      alive().forEach(y=>{const base=rollDice(ab.dmg).total+statVal(ab.stat||'지혜'),okS=d(20)+saveMod(y,'민첩')>=dc,dm=hurt(y,okS?Math.floor(base/2):base,'radiant',{d:300+j*120});tot[nm(y)]=(tot[nm(y)]||0)+dm})});
    const parts=Object.entries(tot).map(([k,v])=>k+' '+v);
    B.last={r:null,txt:ab.name+' — 소환수 '+ss.length+' · '+parts.join(', ')};logB(lab+'! 소환수 '+ss.length+'이 별빛으로 터졌다 — '+parts.join(' · '),'me');return;
  }
  if(ab.kind==='darts'){
    const hits=[];afx({type:'cast',from:u.uid,to:t.uid,color:'#9fc8ff'});
    const db=u.kind==='hero'?bsum('dmg'):bsumU(u,'dmg');
    for(let i=0;i<ab.darts;i++){const x=up(t)?t:alive().find(y=>!y.hid);if(!x)break;const dm=hurt(x,rollDice(ab.dmg).total+(i?0:db),ab.dtype,{d:260+i*120});hits.push(nm(x)+' '+wtxt(dm,x))}
    B.last={r:null,txt:ab.name+' — '+hits.join(', ')};logB(lab+' — '+hits.join(', ')+(t&&!up(t)?' · 쓰러뜨렸다!':''),'me');return;
  }
  if(ab.kind==='save'){
    const tg=ab.area==='all'?alive():ab.area==='row'?zoneUnits(zk(t)):[t];
    const dc=spellDC(u,ab),base=ab.dmg?rollDice(ab.dmg).total+(u.kind==='hero'?(ab.addStat?statVal(ab.stat):0)+bsum('dmg'):bsumU(u,'dmg'))+(ab.dtype==='fire'?ufx(u).fire||0:0)+elemAdd(u,ab.dtype)+resonAdd(u):0,parts=[];
    tg.forEach((x,i)=>{
      // 자장가처럼 우두머리·정예에게는 듣지 않는 노래 (bossOnFail이 있으면 대신 그 효과)
      const bossy=ab.noBoss&&(E_(x).boss||E_(x).elite),onF=bossy?ab.bossOnFail:ab.onFail;
      if(bossy&&!ab.bossOnFail){parts.push(nm(x)+' 듣지 않는다');afx({type:'miss',target:x.uid,delay:fxDelay+300});return}
      const sv=d(20)+saveMod(x,ab.save),okS=sv>=dc;
      if(!ab.dmg){afx({type:'cast',from:u.uid,to:x.uid,color:'#c9b8ff'});parts.push(nm(x)+(okS?' 내성 성공':' 내성 실패'));if(!okS)applyOn(x,onF);else afx({type:'miss',target:x.uid,delay:fxDelay+300});return}
      const v=okS?(ab.half?Math.floor(base/2):0):base;
      afx({type:'cast',from:u.uid,to:x.uid,color:ab.dtype==='fire'?'#ffa95e':ab.dtype==='radiant'?'#ffe6a0':ab.dtype==='thunder'?'#d8c8ff':'#f0a8ff'});
      if(v>0){const dm=hurt(x,v,ab.dtype,{d:300+i*90});parts.push(nm(x)+' '+(okS?'(내성 성공) ':'')+wtxt(dm,x)+(up(x)?'':' 쓰러짐'))}
      else{parts.push(nm(x)+' 내성 성공');afx({type:'miss',target:x.uid,delay:fxDelay+300})}
      if(!okS)applyOn(x,onF);
      shock(x);
    });
    if(ab.surface&&t)setSurf(zk(t),ab.surface);
    if(ab.command&&t&&up(t)){logB('소환수들이 '+josa(nm(t),'을')+' 덮친다','me');summons().forEach(x=>summonStrike(x,t))}
    if(ab.dtype==='fire')[...new Set(tg.map(zk))].forEach(fireTouch);
    if(ab.partyHeal)pcs().filter(p=>!p.out).forEach(p=>{const v=heal(p,rollDice(ab.partyHeal).total+healPlus(u));if(v)parts.push(nm(p)+' HP +'+v)});
    if(ab.partyBuff){const tt=bTurns(u,ab,ab.pbTurns);upPCs().forEach(p=>{addBuff(p,ab.name,ab.partyBuff,tt);fx_(p,ab.name)});parts.push('아군 '+tt+'턴 동안 '+buffText(ab.partyBuff))}
    B.last={r:null,txt:ab.name+' — 내성 DC '+dc+(ab.dmg?' · 피해 '+base:'')};
    logB(lab+' — '+parts.join(' · '),'me');return;
  }
  if(ab.kind==='sweep'){const P=profile(u,ab);alive().filter(x=>canMelee(u,x,false)).forEach(x=>{attack(u,x,P);fxDelay+=220});return}
  if(ab.kind==='pierce'){
    const P=profile(u,ab);attack(u,t,P);
    const back=t.row==='front'?alive().find(x=>x.row==='back'&&!x.hid):null;
    if(back){fxDelay+=260;attack(u,back,P)}return;
  }
  if(ab.kind==='heal'){
    const a=U(au),v=heal(a,rollDice(ab.heal).total+(u.kind==='hero'&&ab.stat?statVal(ab.stat):0)+healPlus(u));
    B.last={r:null,txt:ab.name+' → '+nm(a)+' HP +'+v};logB(lab+' — '+nm(a)+' HP +'+v,'me');return;
  }
  if(ab.kind==='self'){const v=heal(u,rollDice(ab.heal).total+(ab.healLv?h.level:0));B.last={r:null,txt:ab.name+' → HP +'+v};logB(lab+' — HP +'+v,'me');return}
  if(ab.kind==='buff'){const tt=bTurns(u,ab);(ab.self?[u]:upPCs()).forEach(p=>{addBuff(p,ab.name,ab.buff,tt);fx_(p,ab.name)});B.last={r:null,txt:ab.name+' — '+abDesc(k)};logB(lab+'! '+abDesc(k),'me');return}
  if(ab.kind==='debuffAll'){alive().forEach(e=>{for(const s in ab.status)e.st[s]=Math.max(e.st[s]||0,ab.status[s]);fx_(e,ab.name,'#c8ccd4')});B.last={r:null,txt:ab.name+' — '+abDesc(k)};logB(lab+'! '+abDesc(k),'me');return}
  // 몰아치기: 행동을 하나 더
  if(ab.kind==='surge'){B.tr.act=1;fx_(u,ab.name);B.last={r:null,txt:ab.name+' — 행동을 하나 더 얻었다'};logB(lab+'! 숨 돌릴 틈 없이 몰아친다 (행동 +1)','me');return}
  // 어둠 속으로: 기회 공격 없이 뒷열로, 반드시 숨는다
  if(ab.kind==='step'){
    if(u.row==='front'){u.row='back';u.high=false;logB(josa(nm(u),'이')+' 그림자를 밟고 뒷열로 물러났다','me');surfHit(u)}
    if(up(u)){u.hid=true;fx_(u,'숨음','#c8ccd4');logB(josa(nm(u),'이')+' 그림자 속으로 사라졌다','me')}
    B.last={r:null,txt:ab.name+' — 숨었다 (다음 공격 유리)'};return;
  }
  // 약점 노리기: 그 적을 향한 공격이 모두 유리
  if(ab.kind==='mark'){t.st.mark=Math.max(t.st.mark||0,ab.turns);if(ab.markD)t.st.markD=ab.markD;fx_(t,'약점 노출','#ffb38a');B.last={r:null,txt:ab.name+' → '+nm(t)+' ('+ab.turns+'턴 동안 공격 유리)'};logB(lab+' — '+josa(nm(t),'의')+' 약점이 드러났다! ('+ab.turns+'턴)','me');return}
  // 용기의 노래: 모두 조금 회복하고, 나쁜 상태를 씻는다
  if(ab.kind==='rally'){
    const add=(u.kind==='hero'&&ab.stat?statVal(ab.stat):0)+healPlus(u),parts=[];
    upPCs().forEach(p=>{const v=heal(p,rollDice(ab.heal).total+add),cl=['stun','weak','restrain','poison'].filter(x=>p.st[x]);cl.forEach(x=>delete p.st[x]);if(v||cl.length)parts.push(nm(p)+(v?' HP +'+v:'')+(cl.length?' ('+cl.map(x=>ST_N[x]).join('·')+' 풀림)':''))});
    if(ab.buff){const tt=bTurns(u,ab);upPCs().forEach(p=>{addBuff(p,ab.name,ab.buff,tt);fx_(p,ab.name)});parts.push('모두 '+tt+'턴 동안 '+buffText(ab.buff))}
    B.last={r:null,txt:ab.name+' — '+(parts.join(', ')||'모두 멀쩡하다')};logB(lab+' — '+(parts.join(', ')||'모두 멀쩡하다'),'me');return;
  }
  // 마지막 노래: 쓰러진 아군을 모두 일으키고 모두를 북돋운다
  if(ab.kind==='finale'){
    const add=(ab.stat?statVal(ab.stat):0)+healPlus(u),ups=[],tt=bTurns(u,ab);
    pcs().filter(p=>!up(p)&&!p.out).forEach(p=>{const v=heal(p,rollDice(ab.heal).total+add);if(v)ups.push(nm(p)+' HP '+v)});
    upPCs().forEach(p=>{addBuff(p,ab.name,ab.buff,tt);fx_(p,ab.name)});
    const txt=(ups.length?'일어났다: '+ups.join(', ')+' · ':'')+'모두 '+tt+'턴 동안 '+buffText(ab.buff);
    B.last={r:null,txt:ab.name+' — '+txt};logB(lab+'! '+txt,'me');return;
  }
  if(ab.kind==='taunt'){alive().forEach(e=>{e.st.taunt=ab.turns;e.st.tauntBy=u.uid;fx_(e,'도발당함','#ff9a8a')});if(ab.selfBuff)addBuff(u,ab.name,ab.selfBuff,ab.turns);B.last={r:null,txt:ab.name};logB(lab+'! 적들이 '+josa(nm(u),'을')+' 노려본다','me');return}
  if(ab.kind==='surface'){afx({type:'cast',from:u.uid,to:t.uid,color:'#8a7a5a'});logB(lab+' — '+zoneName(zk(t))+' 쪽으로 던졌다','me');setSurf(zk(t),ab.surface);B.last={r:null,txt:ab.name+' → '+zoneName(zk(t))};return}
}

// ── 알아서 싸우기 (자동 동료, '자동' 단추)
function bestFoe(u,P){const c=alive().filter(t=>canHit(u,t,P));return c.length?c.sort((a,b)=>a.hp-b.hp)[0]:null}
function aiTurn(u){
  const B=S.battle,r=R(u),sk=unitSkills(u),can=k=>!resWhy(u,k),dead=()=>B.over||!up(u)||checkEnd();
  const setT=x=>{if(x)B.target=x.uid};
  // 1) 쓰러진 동료를 살린다
  const downed=pcs().find(p=>p!==u&&!up(p)&&!p.out);
  if(downed){
    const hk_=sk.find(k=>abOf(k).kind==='heal'&&can(k)),fin=sk.find(k=>abOf(k).kind==='finale'&&can(k));
    if(fin&&(pcs().filter(p=>!up(p)&&!p.out).length>=2||!hk_))useAb(u,fin);
    else if(hk_)useAb(u,hk_,null,downed.uid);
    else if(B.tr.act&&hpPotions().length)doIt(u,'give',hpPotions()[0],downed.uid);
    else if(B.tr.act)doIt(u,'help',null,downed.uid);
    if(dead())return;
  }
  // 2) 위급하면 스스로 회복하고, 크게 다친 동료를 돌본다
  if(r.hp<r.hpMax*0.35){const s=sk.find(k=>abOf(k).kind==='self'&&can(k));if(s)useAb(u,s,null,null);else if(B.tr.bonus&&hpPotions().length)doIt(u,'drink',hpPotions()[0])}
  const weak=upPCs().filter(p=>R(p).hp<R(p).hpMax*0.4).sort((a,b)=>R(a).hp/R(a).hpMax-R(b).hp/R(b).hpMax)[0];
  if(weak){const s=sk.find(k=>abOf(k).kind==='heal'&&can(k));if(s)useAb(u,s,null,weak.uid)}
  if(dead())return;
  // 3) 보조 행동: 도발, 함성·찬가, 기름
  const n=alive().length;
  const has=nmB=>(u.buffs||[]).some(b=>b.name===nmB),reachMe=u.row==='front'||!frontWall('pc')||alive().some(e=>e.fly||E_(e).ranged);
  sk.slice().reverse().forEach(k=>{const ab=abOf(k);if(B.over||!can(k)||ab.cost!=='bonus')return;   // 높은 레벨 기술부터 살핀다
    if(ab.kind==='taunt'&&n>=2&&u.row==='front'&&r.hp>r.hpMax*0.5&&!alive().some(e=>e.st.taunt))useAb(u,k);
    else if(ab.kind==='buff'&&ab.buff.riposte){if(u.row==='front'&&alive().some(e=>!E_(e).ranged)&&!has(ab.name)&&!sk.some(x=>abOf(x).kind==='surge'&&can(x)))useAb(u,k)}   // 몰아치기를 쓸 수 있으면 보조 행동을 아낀다
    else if(ab.kind==='summon'&&arr(ab.summon).some(id=>SUMT(id).noCap)){if(alive().length&&!summons().some(x=>arr(ab.summon).includes(x.id)))useAb(u,k)}   // 별의 사도
    else if(ab.kind==='command'){const x=tgtU()&&up(tgtU())?tgtU():alive().find(y=>!y.hid);if(x&&summons().length>=1){setT(x);useAb(u,k,x)}}
    else if(ab.kind==='bond'){const ss=summons();if(ss.some(x=>x.hp<x.hpMax*0.6)||(ss.length>=2&&!ss.some(x=>(x.buffs||[]).some(b=>b.name===ab.name))))useAb(u,k)}
    else if(ab.kind==='buff'&&ab.self&&ab.buff.dmg&&!ab.buff.undying){if(B.tr.act&&!has(ab.name)&&(n>=3||alive().some(e=>E_(e).boss||E_(e).elite)))useAb(u,k)}   // 별의 화신: 큰 싸움을 시작할 때
    else if(ab.kind==='buff'&&!ab.self&&ab.buff.halve){if(!has(ab.name)&&(upPCs().some(p=>R(p).hp<R(p).hpMax*0.5)||alive().some(e=>E_(e).boss)))useAb(u,k)}   // 성역: 위급하거나 우두머리 앞에서
    else if(ab.kind==='buff'&&ab.buff.adv){if(B.tr.act&&!has(ab.name)&&alive().some(x=>!x.hid))useAb(u,k)}   // 별의 눈: 공격하기 직전에
    else if(ab.kind==='buff'&&ab.self){if(reachMe&&r.hp<r.hpMax*(ab.buff.undying?0.45:0.6)&&!has(ab.name))useAb(u,k)}
    else if(ab.kind==='buff'&&upPCs().length+n>=4&&!has(ab.name)&&!(n<=2&&sk.some(x=>abOf(x).kind==='surge'&&can(x))))useAb(u,k);
    else if(ab.kind==='mark'&&B.tr.act){const x=bestFoe(u,profile(u,null))||alive().find(y=>!y.hid);if(x&&!x.st.mark&&(ab.markD||atkMode(u,x,profile(u,null)).mode!=='adv')){setT(x);useAb(u,k,x)}}   // 죽음의 표식은 피해도 더하니 유리해도 쓴다
    else if(ab.kind==='step'){if((u.row==='front'&&r.hp<r.hpMax*0.45)||(u.row==='back'&&!u.hid&&B.tr.act))useAb(u,k)}
    else if(ab.kind==='rally'){const hurtN=upPCs().filter(p=>R(p).hp<R(p).hpMax*0.6).length;if(hurtN>=2||upPCs().some(p=>['stun','weak','restrain','poison'].some(x=>p.st[x]))||(ab.buff&&!has(ab.name)&&upPCs().length+n>=4&&upPCs().some(p=>R(p).hp<R(p).hpMax)))useAb(u,k)}
    else if(ab.kind==='surface'&&B.tr.act){const rows=['front','back'].map(rw=>({z:'foe-'+rw,c:standing('foe',rw).length})).filter(x=>x.c>=2&&!(B.surf[x.z]&&B.surf[x.z].t==='oil'));
      if(rows.length){const x=zoneUnits(rows[0].z)[0];setT(x);useAb(u,k,x)}}
  });
  if(dead())return;
  // 4) 자리: 근접형은 앞열로, 원거리형은 뒷열로
  const P0=profile(u,null);
  if(B.tr.move&&!P0.ranged&&!P0.reach&&u.row==='back'&&!u.st.restrain&&!(u.kind==='hero'&&cls().row==='back'))doIt(u,'move','front');
  else if(B.tr.move&&P0.ranged&&u.row==='front'&&frontWall('foe')&&!oaFoes(u).length&&u.kind!=='hero')doIt(u,'move','back');
  if(dead())return;
  // 5) 행동: 가장 좋은 공격을 고른다. 몰아치기가 있으면 한 번 더
  act();
  // 방금 부른 소환수에게도 곧바로 명령한다
  const cmd=sk.find(k=>abOf(k).kind==='command'&&can(k));
  if(cmd&&!dead()&&summons().length&&alive().length){const x=tgtU()&&up(tgtU())?tgtU():alive().find(y=>!y.hid);if(x){setT(x);useAb(u,cmd,x)}}
  const sg=sk.find(k=>abOf(k).kind==='surge'&&can(k));
  if(sg&&!dead()&&alive().length){useAb(u,sg);act()}
  function act(){
  if(B.tr.act&&!dead()){
    const opts=[];const P=profile(u,null),bt=bestFoe(u,P);
    if(bt)opts.push({s:1,go:()=>{setT(bt);doIt(u,'attack')}});
    // 불을 다루면 기름이 깔린 열을 노린다
    const oilT=P.dtype==='fire'&&alive().find(x=>canHit(u,x,P)&&surfOf(x)==='oil');
    if(oilT)opts.push({s:5,go:()=>{setT(oilT);doIt(u,'attack')}});
    sk.forEach(k=>{const ab=abOf(k);if(!can(k)||ab.cost==='bonus')return;
      if(ab.kind==='attack'){
        const Q=profile(u,ab);let x=bestFoe(u,Q),sc=ab.mp===0?1.4:ab.uses?3:2.2;
        // 주문: 기대 피해(명중 확률 × 평균 피해 × 약점·저항)가 큰 대상과 주문을 고른다. 얼릴 수 있으면 덤
        if(ab.attack==='spell'){
          const ev=y=>hitP(u,y,Q)*(avgDice(ab.dmg)+(ab.addStat?statVal(ab.stat):0))*mult(y,ab.dtype).m;
          const cands=alive().filter(y=>canHit(u,y,Q)).sort((a,b)=>ev(b)-ev(a));
          if(cands.length){x=cands[0];const fr=!x.st.stun&&!freezeImmune(x);sc=ev(x)/5+(ab.onHit&&ab.onHit.stun&&fr?1.2:0)+(ab.shock&&x.st.wet&&fr?1.2:0)-(ab.mp||0)*0.05}
        }
        if(ab.weapon&&ab.mp&&x)sc=1+(ab.extra?avgDice(ab.extra):0)*(ab.hits||1)*mult(x,ab.dtype||'phys').m/5-ab.mp*0.1+(ab.onHit&&ab.onHit.push&&x.row==='front'&&!big(x)?0.6:0);
        if(ab.execute){const lo=alive().find(y=>canHit(u,y,Q)&&y.hp<=y.hpMax/2);if(lo){x=lo;sc=5}else sc=1.5}
        if(ab.critAdv&&x)sc=atkMode(u,x,Q).mode==='adv'?5:2;
        if(ab.hits>1)sc+=ab.spread?0.8*Math.min(ab.hits,n):0.9*ab.hits;
        if(ab.drain&&r.hp<r.hpMax*0.6)sc+=1.5;
        if(ab.chain)sc+=0.8*Math.min(ab.chain,n-1)+alive().filter(y=>y.st.wet).length*0.3;
        if(x)opts.push({s:sc,go:()=>{setT(x);useAb(u,k,x)}});
      }
      else if(ab.kind==='darts'){const x=alive().find(y=>!y.hid);if(x)opts.push({s:2.4,go:()=>{setT(x);useAb(u,k,x)}})}
      else if(ab.kind==='save'){
        // 내성 기술의 값어치: 기대 피해(내성 성공 몫을 덜고, 약점·저항을 따져) + 넘어뜨리기·묶기·재우기 덤
        const per=ab.dmg?(avgDice(ab.dmg)+(u.kind==='hero'&&ab.addStat?statVal(ab.stat):0)+elemAdd(u,ab.dtype))*(ab.half?0.75:0.55):0;
        const sev=tg=>tg.reduce((a,y)=>a+per*mult(y,ab.dtype).m+(ab.onFail&&(ab.onFail.stun||ab.onFail.restrain||ab.onFail.prone)&&!big(y)?2.5:0),0)/5-(ab.mp||0)*0.05+(ab.partyHeal&&upPCs().some(p=>R(p).hp<R(p).hpMax*0.6)?1.5:0)+(ab.partyBuff?1:0);
        if(ab.area==='all'){
          const tg=alive().filter(y=>!y.hid),awake=tg.filter(y=>!y.st.stun),sleepy=awake.filter(y=>!(ab.noBoss&&(E_(y).boss||E_(y).elite))).length;
          if(n>=2||(ab.dmg&&per>=20))opts.push({s:ab.dmg?sev(tg):1.4*awake.length+(ab.onFail&&ab.onFail.stun?0.8*sleepy:0),go:()=>useAb(u,k,null)});
        }
        else if(ab.area==='row'){
          const fit=z=>zoneUnits(z).filter(y=>!y.hid&&!(ab.noBoss&&(E_(y).boss||E_(y).elite)));
          const z=['front','back'].map(rw=>'foe-'+rw).sort((a,b)=>fit(b).length-fit(a).length)[0],c=fit(z).length,big_=ab.dmg&&avgDice(ab.dmg)>=15;
          if(c>=2||(c>=1&&big_)){const x=fit(z)[0];opts.push({s:ab.dmg?Math.max((big_?3:1.6)*c,sev(fit(z))):1.6*c,go:()=>{setT(x);useAb(u,k,x)}})}
        }
        else{const x=alive().filter(y=>!y.hid).sort((a,b)=>a.hp-b.hp)[0];if(x)opts.push({s:(ab.dmg?Math.max(1.3,sev([x])+0.6):1.3)+(ab.command?summons().length*1.3:0),go:()=>{setT(x);useAb(u,k,x)}})}
      }
      else if(ab.kind==='sweep'){const c=alive().filter(x=>canMelee(u,x,false)).length;if(c>=2)opts.push({s:1.6*c,go:()=>useAb(u,k)})}
      else if(ab.kind==='pierce'){const x=bestFoe(u,profile(u,ab));if(x)opts.push({s:x.row==='front'&&alive().some(y=>y.row==='back')?4:2.5,go:()=>{setT(x);useAb(u,k,x)}})}
      else if(ab.kind==='debuffAll'&&n>=3)opts.push({s:3,go:()=>useAb(u,k)});
      else if(ab.kind==='summon'){
        if(arr(ab.summon).some(id=>SUMT(id).noCap)){
          const big_=alive().some(e=>E_(e).boss||E_(e).elite)||n>=4;
          if(ab.hpCost&&(!big_||S.hero.hp<bloodCost(ab)*2))return;   // 대군주: 큰 싸움에서, 피가 넉넉할 때만
          if(!summons().some(x=>arr(ab.summon).includes(x.id)))opts.push({k,s:ab.hpCost?12:9,go:()=>useAb(u,k)});return}   // 별의 사도: 없으면 먼저
        const rk=arr(ab.summon).reduce((a,id)=>a+(SUMT(id).rank||1),0),ss=capSummons(),room=sumCap()-ss.length,minR=ss.length?Math.min(...ss.map(x=>SUMT(x.id).rank||1)):0;
        const dup=arr(ab.summon).filter(id=>ss.some(x=>x.id===id)).length;   // 같은 소환수만 거듭 부르지 않게
        const sc=(room>=arr(ab.summon).length?4+rk:room>0?3+rk*0.5:(rk>minR+1?2+rk*0.3:0))-(room>0?dup*1.5:dup*3);if(sc>0)opts.push({k,s:sc-(ab.mp||0)*0.02,go:()=>useAb(u,k)});
      }
      else if(ab.kind==='fuse'){const c=capSummons().length,boss=alive().some(e=>E_(e).boss||E_(e).elite);if(c>=3||(c>=2&&boss))opts.push({s:2.6*c+(boss?2:0),go:()=>useAb(u,k)})}
      else if(ab.kind==='sacrifice'){const c=summons().length;if(c>=2&&n>=2)opts.push({s:1.5*c+n*0.5,go:()=>useAb(u,k)})}
      else if(ab.kind==='volley'){const c=alive().filter(x=>!x.hid).length;if(c>=2)opts.push({s:1.7*c+(ab.adv?1:0),go:()=>useAb(u,k)})}
      else if(ab.kind==='rally'){const hurtN=upPCs().filter(p=>R(p).hp<R(p).hpMax*0.6).length;if(hurtN>=2)opts.push({s:2+hurtN*1.5,go:()=>useAb(u,k)})}
      else if(ab.kind==='finale'&&n>=3&&!has(ab.name))opts.push({s:2.6,go:()=>useAb(u,k)});
    });
    if(opts.length){opts.sort((a,b)=>b.s-a.s);opts[0].go()}
    else if(!bt&&!P0.ranged&&B.tr.act){const x=alive().find(y=>!y.hid);if(x){setT(x);doIt(u,'throw','돌')}else doIt(u,'dodge')}
  }
  }
}

// ── 전투 끝
function winBattle(){
  const B=S.battle,h=S.hero,out=[],got=[];let xp=0,gold=0,weakXp=false;
  pcs().forEach(p=>{if(R(p).hp<=0){R(p).hp=1;out.push(nm(p)+' HP 1로 일어남')}});
  foes().forEach(e=>{
    const E=E_(e);
    let x=E.xp;if(e.lv<=h.level-3){x=Math.max(1,Math.floor(x/2));weakXp=true}
    xp+=x;gold+=rint(E.gold[0],E.gold[1]);
    // uniq: 이미 가진 것은 다시 나오지 않는다. pity: 그만큼 못 얻으면 다음에는 반드시 나온다
    arr(E.drops).forEach(dr=>{
      const item=tpl(dr.item);if((dr.if&&!ok(dr.if))||!SC.items[item]||!clsOK(SC.items[item])||(dr.once&&S.flags[dr.once])||(dr.uniq&&(hasGot(item)||got.includes(item))))return;
      let hit=Math.random()<dr.p;
      if(!hit&&dr.pity){S.pity[item]=(S.pity[item]||0)+1;if(S.pity[item]>=dr.pity)hit=true}
      if(hit){got.push(item);delete S.pity[item];if(dr.once)S.flags[dr.once]=true}
    });
  });
  // 경험치는 일행이 함께 얻는다: 동료는 그대와 같은 레벨로 함께 오르므로 나누지 않는다
  h.xp+=xp;S.gold+=gold;got.forEach(i=>S.items.push(i));if(got.length){markNew(got);autoEquip(got);newTrinkets(got)}
  out.unshift('경험치 +'+xp+(weakXp?' (약한 적은 절반)':''),'금화 +'+gold);got.forEach(i=>out.push(gotLine(i)));
  settle(out);
  B.over='win';B.res={title:'승리!',lines:out};
  logB('승리!','sys');
  if(B.kind==='random')logp(nameList(foes().map(e=>e.id))+' 처치 (경험치 +'+xp+', 금화 +'+gold+(got.length?', '+got.join(', '):'')+')');
}
function loseBattle(){
  const B=S.battle;B.over='lose';
  B.res={title:'패배…',lines:[B.kind==='story'?'모두 쓰러졌지만, 이야기는 계속된다.':'모두 쓰러졌다…']};
  logB('모두 쓰러졌다…','foe');
}
function knockout(){
  const h=S.hero,k=SC.knockout||{};
  const toGate=k.gate&&ok(k.gate.if)&&k.gate.locs.includes(S.loc);
  const rg=(SC.regions||{})[regionOf(S.loc)];
  const dest=rg&&rg.wake?(ok(rg.wakeIf)?rg.wake:rg.wakeElse||SC.startLoc):toGate?'gate':SC.startLoc;
  S.loc=dest;h.hp=Math.ceil(h.hpMax/2);h.mp=Math.ceil(h.mpMax/2);
  for(const id in (S.comp||{}))S.comp[id].hp=Math.max(S.comp[id].hp,Math.ceil(S.comp[id].hpMax/2));
  const lost=Math.floor(S.gold*0.25);S.gold-=lost;
  S.counters.falls=(S.counters.falls||0)+1;
  S.notice=tpl((k.text||'{place}에서 깨어났다.').replace('{place}',SC.locations[dest].name))+(lost?' 주머니가 조금 가벼워졌다. (금화 -'+lost+')':'');
  logp('사냥터에서 쓰러져 '+SC.locations[dest].name+'에서 깨어났다.');
}
function endBattle(){
  const B=S.battle;if(!B||!B.over)return;
  keepPets();
  for(const id in (S.comp||{}))if(S.comp[id].hp<=0)S.comp[id].hp=1;
  S.battle=null;cmenu=null;
  if(B.kind==='story'){
    const key=B.over,def=B.def;
    const oc=def[key]||(key==='win'?def.win:def.lose);
    const h=S.hero;
    if(key==='lose'){h.hp=Math.max(1,Math.ceil(h.hpMax/4));S.counters.falls=(S.counters.falls||0)+1}
    else if(h.hp<=0)h.hp=1;
    S.mode='event';
    // 결과 문장에서 누가 함께 싸웠는지 알 수 있도록 (with_오르덴 등) 잠시 켠다
    const fought=B.units.filter(p=>p.kind==='comp').map(p=>'with_'+p.id);fought.forEach(f=>S.flags[f]=true);
    applyOutcome(oc,{label:nameList(def.enemies),key:key==='lose'||key==='fled'?'fail':'success',battleEnd:key,extra:key==='win'?B.res.lines:null});
    fought.forEach(f=>delete S.flags[f]);
    save();render();toTop();return;
  }
  if(B.over==='lose')knockout();
  else if(S.hero.hp<=0)S.hero.hp=1;
  S.mode='world';save();render();toTop();
}

function animateDie(shapeId,numId,done){
  const t0=performance.now();
  (function tick(){
    const t=performance.now()-t0,sh=$(shapeId),nm=$(numId);
    if(t<(UI.fast?140:500)){if(sh)sh.style.transform='rotate('+(t*.9)+'deg) scale('+(1+.08*Math.sin(t/60))+')';if(nm)nm.textContent=d(20);setTimeout(tick,50);return}
    if(sh)sh.style.transform='';done();
  })();
}
function dieSvg(gid,tid,num){
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  svg.setAttribute('width','84');svg.setAttribute('height','84');svg.setAttribute('viewBox','0 0 140 140');
  svg.innerHTML='<g id="'+gid+'"><polygon points="70,10 122,40 122,100 70,130 18,100 18,40" fill="var(--acc-bg)" stroke="var(--acc-line)" stroke-width="2" stroke-linejoin="round"/><path d="M70,10 L18,100 M70,10 L122,100 M18,40 L122,40 M18,100 L122,100 M70,130 L18,40 M70,130 L122,40" stroke="var(--acc-line)" stroke-width="1" fill="none" opacity=".6"/></g><text id="'+tid+'" x="70" y="82" text-anchor="middle" font-size="36" font-weight="500" fill="var(--acc-text)"></text>';
  svg.querySelector('text').textContent=num==null?'?':String(num);
  return svg;
}

// ── 그림
function pickArt(a){if(!a)return null;if(Array.isArray(a))return a.find(x=>!x.if||ok(x.if))||null;return a}
function artSpec(){
  const m=S.mode;
  if(m==='create'){const c=S.mk&&S.mk.cls;return {sky:'dusk',bg:'mountains',fx:['rain'],actors:c?[{k:'hero',x:.5,cls:c}]:[]}}
  if(m==='end')return CH(S.ended||1).endArt||SC.endArt||{sky:'dawn',bg:'mountains'};
  const loc=pickArt(L().art)||{sky:'rain',bg:'mountains'};
  if(m==='combat'){const b=pickArt(S.battle.def.art)||{sky:loc.sky,bg:loc.bg,fx:loc.fx};return {sky:b.sky,bg:b.bg,fx:b.fx,props:b.props,battle:true}}
  if(m==='event')return ev().art==='camp'?campArt():pickArt(ev().art)||loc;
  return loc;
}
// 야영지: 그대와 지금 함께 있는 동료들이 불가에 둘러앉는다
function campArt(){
  const xs=[.6,.72,.84],act=[{k:'hero',x:.3}].concat(party().map((id,i)=>({k:COMP(id).art,x:xs[i],face:-1})));
  return {sky:'night',bg:'gate',props:['campfire'],fx:['stars'],actors:act};
}
function artInfo(){
  const B=S.mode==='combat'&&S.battle&&S.battle.units?S.battle:null;let bat=null;
  if(B){const cu=curU();bat={over:!!B.over,surf:B.surf,field:B.field,units:B.units.filter(u=>!u.gone).map(u=>({id:u.uid,side:u.side,row:u.row,k:u.art,high:!!u.high,hid:!!u.hid,prone:!!u.st.prone,down:!up(u),cur:cu===u&&!B.over,target:B.target===u.uid}))}}
  return {cls:S.cls||(S.mk&&S.mk.cls),relic:S.items?hasRelicSafe():false,lord:lordOn(),battle:bat};
}
function hasRelicSafe(){try{return !!S.cls&&hasRelic()}catch(e){return false}}

// ── 그리기
function bar(color,v,max){const b=el('div','bar'),i=el('i');i.style.background=color;i.style.width=Math.max(0,Math.min(100,100*v/max))+'%';b.appendChild(i);return b}
function render(){
  const m=S.mode;
  document.body.classList.toggle('combat',m==='combat');
  document.body.classList.toggle('solo',m==='create');
  document.body.classList.toggle('world',m==='world');
  document.body.classList.toggle('scene-min',m==='world'&&wtab!=='explore');   // 다른 탭에서는 장면을 접어 내용이 바로 보이게
  $('foot').hidden=m!=='end';
  $('make').hidden=m!=='create';
  $('hud').hidden=m==='create'||m==='combat';
  $('cside').hidden=m!=='combat';
  $('world').hidden=m!=='world';
  $('event').hidden=m!=='event';
  $('combat').hidden=m!=='combat';
  $('endwrap').hidden=m!=='end';
  $('logwrap').hidden=m!=='end';
  $('freedice').hidden=!(m==='world'&&wtab==='settings');
  $('lvwrap').hidden=m==='create'||m==='combat'||!needLevel();
  const nt=$('notice');nt.hidden=!S.notice||!(m==='world'||(m==='event'&&ev()&&ev().camp&&!S.pending));nt.textContent=S.notice||'';
  $('saga').textContent=SC.title+' · 제'+chapterNo()+'장 · '+CH().title;
  const sc=$('scene');sc.innerHTML='';
  const para=list=>list.forEach(t=>sc.appendChild(el('p',null,t)));
  if(window.Art)Art.scene(artSpec());
  if(m==='create'){
    $('stitle').textContent='모험가 만들기';para((SC.creation&&SC.creation.intro)||[]);
    $('clock').textContent=MK_STEPS.join(' → ');renderMake();return;
  }
  if(m!=='combat')syncPets();   // 장비·레벨이 바뀌면 곁의 소환수도 따라 자란다
  renderHud();if(needLevel())renderLevelup();
  if(m==='world'){
    const l=L();$('stitle').textContent=l.name;para(texts(l.desc));
    $('clock').textContent='목표: '+goalText();renderWorld();
  }else if(m==='event'){
    const e=ev();$('stitle').textContent=tpl(e.title);para(S.sceneText||texts(e.text));
    $('clock').textContent=tpl(e.clock||'')+(e.clock?' · ':'')+(e.place||L().name);
    renderChoices();renderMods();updateRollBtn();renderResult();
  }else if(m==='combat'){
    const B=S.battle;$('stitle').textContent='전투';
    // 적의 묘사는 첫 라운드에만 — 그 뒤로는 장면 카드를 짧게 두어 행동판이 위로 올라오게 한다
    const seen={};if(B.round<=1)foes().forEach(e=>{const ds=SC.enemies[e.id].desc;if(ds&&!seen[e.id]){seen[e.id]=1;sc.appendChild(el('p',null,ds))}});
    const f=B.field,fl=[];if(f.high)fl.push('고지대');if(f.cover)fl.push('엄폐물 (숨기 유리)');if(f.water)fl.push('물');if(f.rain)fl.push('비 (불이 빨리 꺼짐)');
    $('clock').textContent=L().name+' · 라운드 '+B.round+(fl.length?' · 지형: '+fl.join(', '):'')+' · 그림을 눌러 대상을 고를 수 있다';renderCombat();
  }else if(m==='end'){
    const n=S.ended||1,nx=CH(n+1),has=arr(SC.chapters).some(c=>c.n===n+1);
    $('stitle').textContent='제'+n+'장 「'+CH(n).title+'」 끝';
    para(['그대의 선택과 주사위가 새긴 이야기는 이렇게 기록되었다.',has?'이 기록은 제'+(n+1)+'장 「'+nx.title+'」으로 그대로 이어진다. 곧바로 떠나도 되고, 지금 있는 곳에서 사냥하며 힘을 더 길러도 된다.':'이 기록은 다음 장으로 그대로 이어진다. 그때까지 세상은 열려 있다 — 계속 사냥하며 힘을 기를 수 있다.']);
    $('endh').textContent=(n+1)+'장으로 이어지는 기록';
    const nb=$('nextch');nb.hidden=!has||!!S.flags['ch'+(n+1)];nb.textContent='제'+(n+1)+'장 「'+nx.title+'」 시작 →';
    $('clock').textContent='';renderSummary();
  }
  if(m==='end'){const lg=$('log');lg.innerHTML='';S.log.slice(-25).reverse().forEach(t=>lg.appendChild(el('li',null,t)))}
}

// 상태: 좁은 화면에서는 맨 위의 요약 띠, 넓은 화면에서는 오른쪽에 붙는 상태판
function renderHud(){
  const h=S.hero,box=$('hud');box.innerHTML='';
  const r=race(),b=bg(),max=SC.inspMax||4;
  const t=el('div','who');t.appendChild(el('b',null,h.name));t.appendChild(el('span','mini',(r?r.name+' ':'')+h.cls+(b?' · '+b.name:'')));
  t.appendChild(el('span','mini lv','레벨 '+h.level+' · 금화 '+S.gold));box.appendChild(t);
  const g=el('div','meters');
  [['HP',h.hp,h.hpMax,'var(--hp)'],['마력',h.mp,h.mpMax,'var(--mp)'],['경험치',h.xp,h.xpMax,'var(--xp)']].forEach(([n,v,mx,col])=>{
    const d1=el('div'),l=el('div','ml');if(n==='경험치')d1.title='일행이 함께 얻는다. 레벨이 오르면 동료도 같이 오른다';l.appendChild(el('span',null,n));l.appendChild(el('span',null,v+'/'+mx));d1.appendChild(l);d1.appendChild(bar(col,v,mx));g.appendChild(d1);
  });
  box.appendChild(g);
  const meta=el('div','mini hudmeta');
  const ins=el('span','insp','영감 '+'✦'.repeat(S.insp||0)+'·'.repeat(Math.max(0,max-(S.insp||0))));ins.title='배경다운 선택을 하면 쌓이고, 실패한 판정을 다시 굴릴 때 쓴다';meta.appendChild(ins);
  meta.appendChild(document.createTextNode(' · 짧은 휴식 '+((S.rest&&S.rest.short)||0)+'/2 · 야영 물자 '+countItem('야영 물자')));
  // 지도에서는 HP·마력이 모자라면 물약을 바로 마실 수 있다
  if(S.mode==='world')[['hp',h.hp<h.hpMax],['mp',h.mp<h.mpMax]].forEach(([k,need])=>{
    if(!need)return;const n=[...new Set(S.items)].find(x=>{const it=SC.items[x];return it&&it.use&&it.use[k]});if(!n)return;
    const b=el('button','qbtn',n+' ×'+countItem(n));b.title=n+'을 마신다 ('+SC.items[n].desc+')';b.onclick=()=>useItem(n);meta.appendChild(b);
  });
  box.appendChild(meta);
  const pt=party();
  if(pt.length||pets().length){
    const pm=el('div','pmini');
    pets().forEach(p=>{const d1=el('div','pet'),l=el('div','ml');l.appendChild(el('span',null,SUMT(p.id).name));l.appendChild(el('span',null,p.hp+'/'+p.hpMax));d1.appendChild(l);d1.appendChild(bar('#8fb6ff',p.hp,p.hpMax));d1.title='소환수 '+SUMT(p.id).name;pm.appendChild(d1)});
    pt.forEach(id=>{
      const c=S.comp[id],v=apVal(id),tr=apTier(v),d1=el('div'),l=el('div','ml'),nmS=el('span',null,COMP(id).name);
      if(v>=3||v<=-3){const ap=el('span','ap '+(v>=3?'up':'down'),' '+(v>=6?'♥♥':v>=3?'♥':'✕'));ap.title=tr.n;nmS.appendChild(ap)}
      l.appendChild(nmS);l.appendChild(el('span',null,c.hp+'/'+c.hpMax));d1.appendChild(l);d1.appendChild(bar('var(--hp)',c.hp,c.hpMax));
      d1.title=COMP(id).name+' — '+(COMP(id).apName||'호감')+' '+sign(v)+' · '+tr.n;pm.appendChild(d1);
    });
    box.appendChild(pm);
  }
  const ws=el('div','hudsec wide-only');ws.appendChild(statsBlock());box.appendChild(ws);
  const qs=questBlock();if(qs){const q=el('div','hudsec wide-only');q.appendChild(el('h3',null,'퀘스트'));q.appendChild(qs);box.appendChild(q)}
}
function statsBlock(){
  const d0=el('div'),st=el('div','stats');
  S.stats.forEach(s=>{const dv=el('div','stat');if(s.note)dv.title=s.note;dv.appendChild(el('span','sub',s.n));dv.appendChild(el('b',null,sign(s.v)));st.appendChild(dv)});
  d0.appendChild(st);
  const w=wpn(),sm=tfx('hero').smite;d0.appendChild(el('div','mini atkline','공격 명중 '+sign(weaponHit())+' · 피해 '+w.dice+sign(weaponDmgBonus())+(sm?'+'+sm:'')+(w.crit?' ('+w.crit+'~20 치명타)':'')+' · 방어 '+heroAC()+' · 숙련 +'+profBonus()+' (공격·주문·판정)'));
  return d0;
}
function questBlock(){
  const qs=arr(SC.quests).filter(x=>ok(x.if));if(!qs.length)return null;
  const q=el('div');
  qs.forEach(x=>{const d1=el('div','qrow');d1.appendChild(el('b',null,x.name+' '));d1.appendChild(el('span','sub',tpl(x.t)));q.appendChild(d1)});
  return q;
}

function renderLevelup(){
  const box=$('lvopts');box.innerHTML='';
  const hd=$('lvwrap').querySelector('h2');if(hd)hd.textContent=specDue()?'레벨 '+SPEC_LV+' — 전문화를 고르세요 (한 번 고르면 바꿀 수 없다)':'레벨 업! 하나를 고르세요';
  lvChoices().forEach(o=>{
    const b=el('button','opt');b.appendChild(el('b',null,o.name));b.appendChild(el('small',null,o.desc));
    b.disabled=rolling;b.onclick=()=>pickLevel(o.id);box.appendChild(b);
  });
}

function actBtn(box,label,small,fn,opts){
  opts=opts||{};
  const b=el('button','opt'+(opts.star?' star':''));
  b.appendChild(el('b',null,(opts.star?'★ ':'')+label));if(small)b.appendChild(el('small',null,small));
  b.disabled=!!opts.disabled;b.onclick=fn;box.appendChild(b);return b;
}
// 탐험 화면은 탭으로 나눈다: 지금 할 일과 지도가 먼저, 나머지는 한 번 눌러서 본다
// 좁은 화면에서는 아래에 붙는 탭 막대(아이콘 + 이름), 넓은 화면에서는 위에 붙는 탭
const ICO={
  explore:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  party:'<circle cx="9" cy="8" r="3"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.6 14.2c2.4.2 4.1 1.9 4.7 4.8"/>',
  bag:'<path d="M5.5 8h13l-1.2 12H6.7z"/><path d="M9 8V6.5a3 3 0 016 0V8"/>',
  abil:'<path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.8L12 16.5l-5.1 2.8 1.1-5.8-4.3-4 5.8-.7z"/>',
  journal:'<path d="M6 4h8.5A2.5 2.5 0 0117 6.5V20H8.5A2.5 2.5 0 016 17.5z"/><path d="M6 17.5A2.5 2.5 0 018.5 15H17"/><path d="M9.5 8h4.5M9.5 11h3"/>',
  settings:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'
};
const WTABS=[['explore','탐험'],['party','일행'],['bag','소지품'],['abil','능력'],['journal','일지'],['settings','설정']];
let wtab=(()=>{try{let t=localStorage.getItem(KEY+':tab');if(t==='log')t='journal';return WTABS.some(x=>x[0]===t)?t:'explore'}catch(e){return 'explore'}})();
function setTab(t){if(wtab==='bag'&&t!=='bag'){S.newItems=[];gearPick=null;save()}const ch=wtab!==t;wtab=t;try{localStorage.setItem(KEY+':tab',t)}catch(e){}render();if(ch)toTop()}
// 화면 설정은 모험과 따로, 이 기기에 남긴다 (새로 시작해도 그대로)
const UI=(()=>{try{return JSON.parse(localStorage.getItem(KEY+':ui'))||{}}catch(e){return {}}})();
function saveUI(){try{localStorage.setItem(KEY+':ui',JSON.stringify(UI))}catch(e){}applyUI()}
function applyUI(){const r=document.documentElement;if(UI.theme==='light'||UI.theme==='dark')r.dataset.theme=UI.theme;else delete r.dataset.theme;document.body.classList.toggle('bigtext',!!UI.big)}
function campHint(id){return arr(SC.camp).some(t=>!S.flags['done_'+t]&&ok(SC.events[t].if)&&(!id||arr(SC.events[t].if.party).includes(id)))}
function renderWorld(){
  const box=$('world');box.innerHTML='';
  const tb=el('div','tabs wtabs');tb.setAttribute('role','tablist');tb.setAttribute('aria-label','탐험 화면');
  const badge=id=>{
    if(id==='party'){const n=party().length;return campHint()?['✦','star']:n?[String(n),'']:null}
    if(id==='bag')return wtab!=='bag'&&S.newItems.length?['새 '+S.newItems.length,'new']:null;
    if(id==='abil')return needLevel()?['!','new']:null;
    if(id==='journal'){const q=arr(SC.quests).filter(x=>ok(x.if)).length;return q?[String(q),'']:null}
    return null;
  };
  WTABS.forEach(([id,n],i)=>{
    const b=el('button',wtab===id?'on':'');b.setAttribute('role','tab');b.setAttribute('aria-selected',String(wtab===id));b.title=n+' ('+(i+1)+')';
    const ic=document.createElementNS('http://www.w3.org/2000/svg','svg');ic.setAttribute('viewBox','0 0 24 24');ic.setAttribute('class','ico');ic.setAttribute('aria-hidden','true');ic.innerHTML=ICO[id];b.appendChild(ic);
    b.appendChild(el('span','tl',n));
    const bd=badge(id);if(bd)b.appendChild(el('span','cnt'+(bd[1]?' '+bd[1]:''),bd[0]));
    b.onclick=()=>setTab(id);tb.appendChild(b);
  });
  box.appendChild(tb);
  const pane=el('div','pane');box.appendChild(pane);
  ({explore:paneExplore,party:renderParty,bag:paneBag,abil:paneAbil,journal:paneJournal,settings:paneSettings})[wtab](pane);
}
function paneExplore(box){
  const l=L(),xg=el('div','xgrid');box.appendChild(xg);
  const s1=el('section');xg.appendChild(s1);
  s1.appendChild(el('h2',null,'할 수 있는 일'));
  const acts=el('div','card');s1.appendChild(acts);
  arr(l.actions).filter(a=>ok(a.if)).forEach(a=>actBtn(acts,a.label,null,()=>startEvent(a.event),{star:a.star}));
  if(S.cls==='summoner'){const cap=sumCap();actBtn(acts,'소환수 부르기 ('+petCapN()+'/'+cap+')',pets().length?'곁에 '+pets().map(p=>SUMT(p.id).name).join(', ')+' — 일행 탭에서 부르고 돌려보낸다':'전투 밖에서 미리 불러 두면 싸움이 시작될 때부터 함께 나선다',()=>setTab('party'))}
  if(l.encounters)actBtn(acts,'사냥한다','전투를 벌여 경험치와 금화를 얻는다 · 이곳의 적 레벨 '+l.lv+(party().length?' · 동료와 함께라 적도 더 몰려온다':''),()=>{S.notice=null;startRandomBattle(false)});
  if(l.encounters||arr(l.explore).length)actBtn(acts,'탐색한다','무언가를 찾아내거나, 무언가와 마주친다',explore);
  if(canRest()){const sup=countItem('야영 물자');actBtn(acts,'긴 휴식 — '+restText(l),(l.restFree?'모두 회복 · 짧은 휴식과 기술 충전':sup?'야영 물자 1 (보유 '+sup+') · 모두 회복 · 짧은 휴식과 기술 충전':'야영 물자가 없다 — 절반만 회복')+(campTalk()?' · ✦ 모닥불 곁에서 동료가 할 말이 있다':''),longRest)}
  const sr=(S.rest&&S.rest.short)||0,need=restNeeded();
  actBtn(acts,'짧은 휴식 ('+sr+'/2)',(sr>0&&!need?'지금은 쉴 필요가 없다 · ':'')+'HP 절반 회복 · 짧은 휴식 기술 충전'+(S.cls==='mage'||S.cls==='summoner'?' · 마력 절반 회복':'')+(S.cls==='bard'?' · 휴식의 노래 +1d6':'')+' · 긴 휴식으로 다시 채운다',shortRest,{disabled:sr<=0||!need});
  if(l.shop)actBtn(acts,(shopOpen?'▾ ':'▸ ')+l.shop.name,'물약과 장비를 판다 · 금화 '+S.gold,()=>{shopOpen=!shopOpen;render()});
  if(l.shop&&shopOpen){
    const sh=el('div');sh.style.marginTop='6px';acts.appendChild(sh);
    l.shop.items.map(tpl).forEach(n=>{
      const it=SC.items[n];if(!it)return;
      const owned=it.slot&&S.items.includes(n);
      const row=el('div','item'),info=el('div');
      info.appendChild(rarName(n));info.appendChild(el('span','sub',' ['+kindName(n)+'] '+itemInfo(n)));
      if(it.slot&&it.slot!=='trinket'&&!owned){const ch=el('div','dls');deltaChips(ch,gearDelta(n));info.appendChild(ch)}
      if(!it.slot&&countItem(n))info.appendChild(el('span','mini',' (가진 것 '+countItem(n)+')'));
      row.appendChild(info);
      const b=el('button',null,owned?'보유':'금화 '+it.price);b.disabled=owned||S.gold<it.price;b.onclick=()=>buy(n);row.appendChild(b);
      sh.appendChild(row);
    });
  }
  if(!acts.children.length)acts.appendChild(el('div','sub','이곳에서는 할 일이 없다. 다른 곳으로 이동하자.'));

  const s2=el('section');xg.appendChild(s2);
  s2.appendChild(el('h2',null,'지도 · 이동'+(regionName(regionOf(S.loc))?' — '+regionName(regionOf(S.loc)):'')));
  const mc=el('div','card');s2.appendChild(mc);
  mc.appendChild(mapSvg());
  const tl=el('div');tl.style.marginTop='8px';mc.appendChild(tl);
  linksOf(S.loc).forEach(k=>{
    const t=SC.locations[k.to];
    const far_=regionOf(k.to)!==regionOf(S.loc);
    actBtn(tl,'→ '+t.name+(far_?' ('+regionName(regionOf(k.to))+')':''),(t.lv==='안전'?'안전':'레벨 '+t.lv)+(far_?' · 다른 지역으로 넘어간다':'')+(storyAt(k.to)?' · ★ 이야기가 기다린다':''),()=>travel(k.to),{star:storyAt(k.to)});
  });

  const qn=arr(SC.quests).filter(x=>ok(x.if)).length;
  if(qn){const s3=el('section','narrow-only');xg.appendChild(s3);const qb=el('button','opt qlink');qb.appendChild(el('b',null,'퀘스트 '+qn+'개'));qb.appendChild(el('small',null,'일지에서 보기'));qb.onclick=()=>setTab('journal');s3.appendChild(qb)}
}
// 바꿔 끼면 무엇이 달라지는지: 잠깐 바꿔 낀 셈 치고 계산한 뒤 되돌린다
function avgDice(e){const p=parseDice(e);return p.n*(p.s+1)/2+p.z}
function gearSnap(){
  const f=heroFx(),w=wpn();
  return [['방어',gearAC()+(f.ac||0)],['명중',(w.bonus||0)+(f.hit||0)],['피해',avgDice(w.dice)+(w.bonus||0)+(f.dmg||0)+(f.smite?avgDice(f.smite):0)],
    ['HP',f.hp||0],['마력',f.mp||0],['주도권',f.init||0],['내성',f.save||0],['판정',f.check||0]];
}
function gearDelta(n,slot){
  slot=slot||SC.items[n].slot;const was=S.equip[slot],a=gearSnap();S.equip[slot]=n;const b=gearSnap();S.equip[slot]=was;
  return a.map((x,i)=>[x[0],Math.round((b[i][1]-x[1])*10)/10]).filter(x=>x[1]);
}
function deltaChips(box,ds){
  if(!ds.length){box.appendChild(el('span','dl','변화 없음'));return}
  ds.forEach(([k,v])=>box.appendChild(el('span','dl '+(v>0?'up':'down'),(v>0?'▲ ':'▼ ')+k+' '+(v>0?'+':'−')+Math.abs(v))));
}
function shortInfo(n){const it=SC.items[n]||{},p=[];if(it.slot==='weapon')p.push(it.dice+(it.bonus?'+'+it.bonus:''));if(it.ac)p.push('방어 +'+it.ac);const t=trinketText(it.fx||{});if(t)p.push(t);return p.join(' · ')||'효과 없음'}
// 어디서 얻는가: 그 물건을 떨어뜨리는 적과 그 적이 나오는 곳 (못 얻을수록 보장까지 남은 횟수가 준다)
function dropSources(n){
  const out=[];
  for(const id in SC.enemies){
    const E=SC.enemies[id],dr=arr(E.drops).find(x=>tpl(x.item)===n);if(!dr)continue;
    const locs=Object.keys(SC.locations).filter(l=>arr(SC.locations[l].encounters).some(x=>x.e.includes(id))).map(l=>SC.locations[l].name);
    out.push(E.name+' ('+(locs.length?locs.join('·'):E.where||'?')+') · '+Math.round(dr.p*100)+'%'+(dr.pity?' · 보장까지 '+Math.max(1,dr.pity-(S.pity[n]||0))+'번':''));
  }
  return out;
}
function bagFor(k){return [...new Set(S.items)].filter(n=>wearable(n,k)&&n!==S.equip[k])}
function paneBag(box){
  const h=S.hero,known=Object.keys(S.comp||{}).filter(compKnown),shop=!!L().shop,isNew=n=>S.newItems.includes(n);
  // ── 장비 부위: 누르면 그 부위에 낄 것을 고른다
  box.appendChild(el('h2',null,'장비 — 부위를 눌러 바꿔 끼기'));
  const eq=el('div','card');box.appendChild(eq);
  const f=heroFx(),tot=trinketText(gearFx());
  const sum=el('div','gearsum');
  [['방어',heroAC()],['명중',sign(weaponHit())],['피해',wpn().dice+sign(weaponDmgBonus())+(f.smite?'+'+f.smite:'')]].forEach(([k,v])=>{const c=el('div');c.appendChild(el('span','sub',k));c.appendChild(el('b',null,String(v)));sum.appendChild(c)});
  eq.appendChild(sum);
  if(tot)eq.appendChild(el('div','mini gearfx','장비 효과: '+tot));
  const grid=el('div','slots');eq.appendChild(grid);
  SLOTS.forEach(([k,lab])=>{
    const n=S.equip[k],cand=bagFor(k),b=el('button','slotbtn'+(gearPick===k?' on':'')+(n?'':' empty'));
    const top=el('span','sl',lab);if(cand.length)top.appendChild(el('span','cnt'+(cand.some(isNew)?' new':''),cand.some(isNew)?' 새것':' '+cand.length));b.appendChild(top);
    if(n){b.appendChild(rarName(n));b.appendChild(el('small',null,shortInfo(n)))}else b.appendChild(el('small',null,'비어 있음'));
    b.setAttribute('aria-expanded',String(gearPick===k));b.onclick=()=>{gearPick=gearPick===k?null:k;render()};
    grid.appendChild(b);
  });
  if(gearPick){
    const k=gearPick,pk=el('div','picker'),cur=S.equip[k];eq.appendChild(pk);
    pk.appendChild(el('div','sub',slotName(k)+' — '+(cur?'지금 '+cur:'비어 있다')));
    if(cur){const r=el('div','item'),info=el('div');info.appendChild(el('b',null,'벗는다'));const ch=el('div','dls');deltaChips(ch,gearDelta(null,k));info.appendChild(ch);r.appendChild(info);
      const b=el('button',null,'벗기');b.onclick=()=>unequipSlot(k);r.appendChild(b);pk.appendChild(r)}
    const cand=bagFor(k).sort((x,y)=>gearScore(y)-gearScore(x));
    cand.forEach(n=>{
      const it=SC.items[n],r=el('div','item'),info=el('div');
      info.appendChild(rarName(n));if(isNew(n))info.appendChild(el('span','newtag','새것'));
      info.appendChild(el('div','mini',shortInfo(n)+(it.set?' · '+SC.sets[it.set].name+' 세트':'')));
      const ws=it.slot==='trinket'?wearers(n).filter(x=>x!=='hero'):[];if(ws.length&&spareOf(n)<=0)info.appendChild(el('div','mini',ws.map(whoName).join('·')+'에게서 가져온다'));
      const ch=el('div','dls');deltaChips(ch,gearDelta(n,k));info.appendChild(ch);r.appendChild(info);
      const b=el('button','go',it.slot==='weapon'?'쥐기':'착용');b.onclick=()=>equipGear(n);r.appendChild(b);pk.appendChild(r);
    });
    if(!cand.length)pk.appendChild(el('div','sub','가방에 이 부위에 낄 것이 없다.'+(k!=='weapon'&&k!=='trinket'?' 마을의 행상인이나 사냥에서 구할 수 있다.':'')));
  }

  // ── 소지품
  box.appendChild(el('h2',null,'소지품 · 금화 '+S.gold+(shop?' · 행상인에게 팔 수 있다':'')));
  const inv=el('div','card');box.appendChild(inv);
  const FILT=[['all','전체'],['gear','장비'],['use','물약·투척'],['etc','기타']];
  const grp=n=>{const it=SC.items[n]||{};return it.slot?'gear':it.use||it.throw?'use':'etc'};
  const fs=el('div','filters');FILT.forEach(([k,n])=>{const b=el('button',bagFilter===k?'on':'',n);b.onclick=()=>{bagFilter=k;render()};fs.appendChild(b)});inv.appendChild(fs);
  // 행상인 앞에서는 지금 낀 것보다 못한 장비를 한 번에 판다 (세트·전설·이야기 물건·장신구는 빼고)
  if(shop){const js=junkList();if(js.length){const g=js.reduce((a,n)=>a+sellPrice(n),0),jb=el('button','sellb junk','덜 좋은 장비 모두 팔기 — '+js.length+'개 · 금화 '+g);jb.title=[...new Set(js)].join(', ');jb.onclick=sellJunk;inv.appendChild(jb)}}
  // 그대가 입고 찬 것은 빼고 센다 (장신구는 동료가 찬 것도 보여 준다 — 돌려받거나 옮길 수 있게)
  const counts={};S.items.forEach(n=>counts[n]=(counts[n]||0)+1);
  SLOTS.forEach(([k])=>{const n=S.equip[k];if(n&&counts[n]&&--counts[n]<=0)delete counts[n]});
  const SL=SLOTS.map(x=>x[0]),order=n=>{const it=SC.items[n]||{};return (it.slot?SL.indexOf(it.slot):it.use?10:it.throw?11:12)*10-(RANK[it.rar]||0)};
  const names=Object.keys(counts).filter(n=>bagFilter==='all'||grp(n)===bagFilter).sort((a,b)=>order(a)-order(b));
  names.forEach(n=>{
    const it=SC.items[n]||{},row=el('div','item'),info=el('div');
    info.appendChild(rarName(n));if(counts[n]>1)info.appendChild(document.createTextNode(' ×'+counts[n]));if(isNew(n))info.appendChild(el('span','newtag','새것'));
    const ws=it.slot==='trinket'?wearers(n).filter(x=>x!=='hero'):[];
    info.appendChild(el('span','sub',' ['+kindName(n)+(ws.length?' · '+ws.map(whoName).join('·')+' 착용':'')+'] '+itemInfo(n)));
    if(it.slot&&it.slot!=='trinket'){const ch=el('div','dls');deltaChips(ch,gearDelta(n));info.appendChild(ch)}
    row.appendChild(info);
    const bx=el('div','row acts2');
    if(it.use){
      const b=el('button',null,known.length&&it.use.hp?'그대':'사용');b.disabled=(it.use.hp&&h.hp>=h.hpMax&&!it.use.mp)||(it.use.mp&&h.mp>=h.mpMax&&!it.use.hp);b.onclick=()=>useItem(n);bx.appendChild(b);
      if(it.use.hp)known.forEach(id=>{const c=S.comp[id],b2=el('button',null,COMP(id).name);b2.disabled=c.hp>=c.hpMax;b2.onclick=()=>useItem(n,id);bx.appendChild(b2)});
    }
    if(it.slot&&it.slot!=='trinket'&&clsOK(it)){const b=el('button','go',it.slot==='weapon'?'쥐기':'착용');b.onclick=()=>equipGear(n);bx.appendChild(b)}
    if(it.learn){const b=el('button','go','읽기');b.disabled=!clsOK(it)||S.hero.level<(it.lvReq||1);b.title=it.lvReq?'레벨 '+it.lvReq+'부터':'';b.onclick=()=>readBook(n);bx.appendChild(b)}
    // 장신구: 누구에게 채울지 고른다
    if(it.slot==='trinket'){
      ['hero'].concat(it.cls?[]:known).forEach(who=>{const b2=el('button',null,whoName(who));b2.disabled=trinketOn(who)===n;b2.title=whoName(who)+'에게 채운다';b2.onclick=()=>equipTrinket(n,who);bx.appendChild(b2)});
      if(ws.length){const b3=el('button',null,'벗기');b3.onclick=()=>unequipTrinket(n,ws[0]);bx.appendChild(b3)}
    }
    const sp=sellPrice(n);
    if(shop&&sp&&countItem(n)-wornCount(n)>0){const b=el('button','sellb','팔기 '+sp);b.title='금화 '+sp+'에 판다';b.onclick=()=>sell(n);bx.appendChild(b)}
    if(bx.children.length)row.appendChild(bx);
    inv.appendChild(row);
  });
  if(!names.length)inv.appendChild(el('div','sub',bagFilter==='all'?'가진 것이 없다.':'이 종류는 가진 것이 없다.'));
  // 그대가 찬 장신구를 동료에게 넘기기
  const tn=S.equip.trinket;
  if(tn&&known.length){const row=el('div','item'),info=el('div');info.appendChild(el('span','sub','그대가 찬 장신구 '));info.appendChild(rarName(tn));info.appendChild(el('span','sub',' — 동료에게 넘기기'));row.appendChild(info);
    const bx=el('div','row acts2');known.forEach(id=>{const b2=el('button',null,COMP(id).name);b2.onclick=()=>equipTrinket(tn,id);bx.appendChild(b2)});row.appendChild(bx);inv.appendChild(row)}

  // ── 세트: 모은 부위, 입은 부위, 단계별 효과, 못 모은 부위를 어디서 얻는지
  box.appendChild(el('h2',null,'세트 — 모으는 장비'));
  for(const id in (SC.sets||{})){
    const st=SC.sets[id],worn=setCount(id),have=st.pieces.filter(n=>countItem(n)>0).length;
    if(st.cls&&st.cls!==S.cls)continue;   // 다른 직업의 전용 세트는 보이지 않는다
    const dt=el('details','card setcard');if(have)dt.open=true;box.appendChild(dt);
    const sm=el('summary');sm.appendChild(el('b','rar-set',st.name));sm.appendChild(el('span','mini',' 입은 부위 '+worn+'/'+st.pieces.length+' · 모은 부위 '+have+'/'+st.pieces.length));dt.appendChild(sm);
    st.pieces.forEach(n=>{
      const it=SC.items[n],on=SLOTS.some(([k])=>S.equip[k]===n),got=countItem(n)>0,r=el('div','piece'+(on?' on':got?' got':''));
      r.appendChild(el('span','pm',on?'●':got?'◎':'○'));
      const info=el('div');const nm=el('b',got?'rar-set':'',n);info.appendChild(nm);info.appendChild(el('span','mini',' '+slotName(it.slot)+(on?' · 입었다':got?' · 가지고 있다':'')));
      if(!got)dropSources(n).forEach(t=>info.appendChild(el('div','mini',t)));
      r.appendChild(info);
      if(got&&!on){const b=el('button',null,'착용');b.onclick=()=>equipGear(n);r.appendChild(b)}
      dt.appendChild(r);
    });
    const bl=el('div','tiers');
    st.bonus.forEach(b=>bl.appendChild(el('div','tier'+(worn>=b.n?' on':''),b.n+'부위 — '+trinketText(b.fx))));
    dt.appendChild(bl);
    if(st.where)dt.appendChild(el('div','mini',st.where));
  }
  // ── 기술서: 낱장 모으기 (그 직업일 때만)
  const books=Object.values(SC.books||{}).filter(b=>clsOK(SC.items[b.name]));
  if(books.length){
    box.appendChild(el('h2',null,'기술서 — 낱장을 모두 모으면 한 권이 된다'));
    books.forEach(b=>{
      const it=SC.items[b.name],learned=bookLearned(b),bound=countItem(b.name)>0,have=b.pages.filter(n=>countItem(n)>0).length,sk=SC.combatSkills[b.learn];
      const dt=el('details','card setcard');dt.open=bound||(have>0&&!learned);box.appendChild(dt);
      const sm=el('summary');sm.appendChild(el('b','rar-legendary',b.name));sm.appendChild(el('span','mini',learned?' · 익혔다':bound?' · 다 모았다 — 읽을 수 있다':' · 낱장 '+have+'/'+b.pages.length));dt.appendChild(sm);
      dt.appendChild(el('div','sub','「'+sk.name+'」 — '+abDesc(b.learn)+(it.lvReq?' · 레벨 '+it.lvReq+'부터 읽을 수 있다':'')));
      if(bound){const r=el('div','item'),info=el('div');info.appendChild(rarName(b.name));r.appendChild(info);const rb=el('button','go','읽고 익히기');rb.disabled=S.hero.level<(it.lvReq||1);rb.onclick=()=>readBook(b.name);r.appendChild(rb);dt.appendChild(r)}
      if(!learned&&!bound)b.pages.forEach(n=>{
        const got=countItem(n)>0,r=el('div','piece'+(got?' got':''));r.appendChild(el('span','pm',got?'◎':'○'));
        const info=el('div');info.appendChild(el('b',got?'rar-legendary':'',n));if(!got)dropSources(n).forEach(t=>info.appendChild(el('div','mini',t)));r.appendChild(info);dt.appendChild(r);
      });
      if(b.where)dt.appendChild(el('div','mini',b.where));
    });
  }

}
function abl(box,name,cost,desc,off){
  const d1=el('div','abl'+(off?' off':''));d1.appendChild(el('b',null,name));if(cost)d1.appendChild(el('span','cost',cost));
  d1.appendChild(el('div','sub',desc));box.appendChild(d1);
}
function paneAbil(box){
  const h=S.hero;
  const s0=el('section','narrow-only');box.appendChild(s0);s0.appendChild(el('h2',null,'능력치'));const c0=el('div','card');c0.appendChild(statsBlock());s0.appendChild(c0);

  box.appendChild(el('h2',null,'전투 기술'));
  const sk=el('div','card');box.appendChild(sk);
  clsSkills().forEach(k=>{
    const s=abOf(k),known=s.lv<=h.level;
    abl(sk,(known?'':'Lv '+s.lv+' · ')+s.name,abCost(s)+(s.uses&&known?' · 남은 '+usesLeft({kind:'hero'},k):'')+((S.learned||[]).includes(k)?' · 기술서':''),abDesc(k),!known);
  });
  // 전문화: 고르기 전에는 두 갈래를 모두 보여 주고, 고른 뒤에는 타고난 힘을 보여 준다
  if(specsOf().length){
    const cur=spec();
    box.appendChild(el('h2',null,cur?'전문화 — '+cur.name:'전문화 (레벨 '+SPEC_LV+'에 하나를 고른다)'));
    const spc=el('div','card');box.appendChild(spc);
    if(cur){spc.appendChild(el('div','sub',cur.desc));abl(spc,cur.passive.name,'타고난 힘',cur.passive.desc)}
    else specsOf().forEach(x=>{
      const g=el('div','specbox');spc.appendChild(g);
      g.appendChild(el('b',null,x.name));g.appendChild(el('div','sub',x.desc));
      abl(g,x.passive.name,'타고난 힘',x.passive.desc,true);
      x.skills.forEach(k=>{const s=abOf(k);abl(g,'Lv '+s.lv+' · '+s.name,abCost(s),abDesc(k),true)});
    });
    if(h.level>=maxLv())spc.appendChild(el('div','sub','최고 레벨 '+maxLv()+'에 이르렀다.'));
  }

  // 잿불의 대군주가 되었다면: 무엇이 바뀌었는지
  if(lordOn()){
    const Lo=SC.lord;box.appendChild(el('h2',null,Lo.title));const lc=el('div','card lordcard');box.appendChild(lc);
    abl(lc,'대군주의 몸','계약',trinketText(Lo.fx));
    abl(lc,'잿불의 피','계약','능력치 '+Object.entries(Lo.stats).map(([n,v])=>n+' +'+v).join(', ')+' · 그대의 차례마다 최대 HP의 '+Math.round(Lo.regen*100)+'%를 되찾는다');
    abl(lc,'지옥불 권속','계약','모든 소환수가 불의 권속으로 다시 태어난다 — 공격이 불이 되고, 맞은 적은 불붙는다. 기술도 대군주의 것으로 바뀐다');
    if(Lo.returns)abl(lc,SUMT(Lo.returns).name,'권속','쓰러져도 긴 휴식을 하면 다시 일어나 곁에 선다');
  }
  box.appendChild(el('h2',null,'재능과 출신'));
  const tc=el('div','card');box.appendChild(tc);
  S.skills.forEach(id=>{
    const s=SC.skillDefs[id];if(!s)return;
    abl(tc,id==='amp'?S.amp.name:s.name,s.kind,id==='amp'?'마력 '+ampCost()+'. 이야기 판정에 d'+S.amp.die+' 추가 ('+S.amp.source+')':tpl(s.desc));
  });
  const r=race();if(r)abl(tc,r.name,'종족',r.trait);
  const b=bg();if(b)abl(tc,b.name,'배경','숙련 '+b.skills.join(', ')+' · 영감: '+b.inspText);

  box.appendChild(el('h2',null,'기술 판정'));
  const skc=el('div','card');box.appendChild(skc);
  skc.appendChild(el('div','sub','d20 + 능력치 + 숙련(●, 전문 ●●) 보너스. 이야기 선택지의 [기술] 판정에 쓰인다.'));
  const sg=el('div','skills');
  Object.keys(SC.skillList).forEach(sk2=>{
    const n=profCount(sk2),row=el('div','skrow'+(n?' prof':''));
    row.appendChild(el('span',null,sk2+' '+'●'.repeat(n)));row.appendChild(el('span','mini',SC.skillList[sk2]));row.appendChild(el('b',null,sign(skillMod(sk2))));
    sg.appendChild(row);
  });
  skc.appendChild(sg);
}
// 일지: 지금 목표, 퀘스트, 동료의 처지, 지나온 기록
function paneJournal(box){
  box.appendChild(el('h2',null,'지금 목표'));
  const gc=el('div','card');box.appendChild(gc);gc.appendChild(el('div',null,goalText()));
  gc.appendChild(el('div','sub','제'+chapterNo()+'장 「'+CH().title+'」 · '+L().name));
  const qs=questBlock();
  box.appendChild(el('h2',null,'퀘스트'));
  const qc=el('div','card');box.appendChild(qc);qc.appendChild(qs||el('div','sub','지금 맡은 부탁이 없다.'));
  const met=Object.keys(SC.companions||{}).filter(id=>compState(id)!=='unmet');
  if(met.length){
    box.appendChild(el('h2',null,'동료'));
    const cc=el('div','card');box.appendChild(cc);
    met.forEach(id=>{const st=compState(id),d1=el('div','qrow');d1.appendChild(el('b',null,COMP(id).name+' '));d1.appendChild(el('span','sub',CSTATE_N[st]+(st==='party'||st==='bench'?' · '+(COMP(id).apName||'호감')+' '+sign(apVal(id)):'')));cc.appendChild(d1)});
  }
  box.appendChild(el('h2',null,'진행 기록 (최근 40)'));
  const lc=el('div','card');box.appendChild(lc);
  const ul=el('ul','journal');S.log.slice(-40).reverse().forEach(t=>ul.appendChild(el('li',null,t)));lc.appendChild(ul);
  if(!ul.children.length)lc.appendChild(el('div','sub','아직 기록이 없다.'));
}
// 설정: 놀이 방식, 화면, 단축키, 자유 주사위, 처음부터 다시
function paneSettings(box){
  const tog=(card,id,on,label,fn)=>{const lb=el('label','sub setrow'),cb=el('input');cb.type='checkbox';cb.id=id;cb.checked=on;cb.onchange=()=>fn(cb.checked);lb.appendChild(cb);lb.appendChild(document.createTextNode(' '+label));card.appendChild(lb);return cb};
  box.appendChild(el('h2',null,'놀이'));
  const so=el('div','card');box.appendChild(so);
  tog(so,'karmic',!!S.opt.karmic,'업보 주사위 — 이야기 판정에서 두 번 연달아 실패하면 다음 판정이 유리해진다',v=>{S.opt.karmic=v;save()});
  tog(so,'autocomp',!!S.opt.autoComp,'동료 자동 전투 — 동료의 차례를 알아서 진행한다 (그대의 차례만 고른다)',v=>{S.opt.autoComp=v;save()});
  tog(so,'autogear',S.opt.autoGear!==false,'좋은 장비 저절로 끼기 — 새로 얻은 장비가 지금 것보다 좋으면 바꿔 낀다 (빈 부위는 늘 채운다, 세트 효과를 받는 부위는 그대로 둔다)',v=>{S.opt.autoGear=v;save()});
  box.appendChild(el('h2',null,'화면 (이 기기에 남는다)'));
  const sc=el('div','card');box.appendChild(sc);
  sc.appendChild(el('div','sub','테마'));const sg=el('div','seg themeseg');
  [['auto','기기 설정대로'],['light','밝게'],['dark','어둡게']].forEach(([k,n])=>{const b=el('button',(UI.theme||'auto')===k?'on':'',n);b.onclick=()=>{UI.theme=k;saveUI();render()};sg.appendChild(b)});sc.appendChild(sg);
  tog(sc,'bigtext',!!UI.big,'글자 크게 — 이야기와 버튼 글자를 키운다',v=>{UI.big=v;saveUI()});
  tog(sc,'fastdice',!!UI.fast,'빠른 주사위 — 주사위 굴리는 연출을 짧게 한다',v=>{UI.fast=v;saveUI()});
  sc.appendChild(el('div','kbd','단축키 — 탐험: 1~6 탭 · 이야기: 숫자로 선택지, Enter로 굴리기·계속 · 전투: 숫자로 행동, E 턴 끝, A 끝까지 자동(사냥), Enter 계속'));
  box.appendChild(el('h2',null,'저장'));
  const sv=el('div','card');box.appendChild(sv);
  sv.appendChild(el('div','sub','모험은 고를 때마다 이 브라우저에 저절로 저장된다. 다른 기기로는 옮겨지지 않는다.'));
  const rb=el('button','danger','처음부터 다시');rb.id='restart2';rb.onclick=()=>restartGame(rb);sv.appendChild(rb);
}
// 동료와 전투 시작 위치
// 소환수: 지금 곁에 있는 영구 소환수와, 전투 밖에서 부르기
function petsPane(box){
  if(S.cls!=='summoner')return;
  const cap=sumCap(),ks=clsSkills().filter(k=>{const a=abOf(k);return a.lv<=S.hero.level&&(a.kind==='summon'||a.kind==='fuse')});
  box.appendChild(el('h2',null,'소환수 '+petCapN()+'/'+cap+' — 전투 밖에서도 부르고, 싸움이 끝나도 곁에 남는다'));
  const c=el('div','card');box.appendChild(c);
  if(!pets().length)c.appendChild(el('div','sub','곁에 소환수가 없다. 아래에서 부르면 다음 싸움부터 처음부터 함께 나선다.'));
  pets().forEach((p,i)=>{
    const T=SUMT(p.id),x=petStats(p),r=el('div','item pet'),info=el('div');
    info.appendChild(el('b',null,T.name));info.appendChild(el('span','mini',' HP '+p.hp+'/'+p.hpMax+' · 방어 '+x.ac+' · '+T.atk.name+' 명중 +'+x.hit+' 피해 '+T.atk.dice+'+'+x.dmgB+(T.multi?' ×'+T.multi:'')+(T.noCap?' · 자리를 차지하지 않는다':'')+(T.oneBattle?' · 다음 싸움이 끝나면 돌아간다':'')));
    info.appendChild(bar('#8fb6ff',p.hp,p.hpMax));r.appendChild(info);
    const b=el('button',null,'돌려보내기');b.onclick=()=>dismissPet(i);r.appendChild(b);c.appendChild(r);
  });
  if(ks.length){
    c.appendChild(el('div','sub petcall','부르기 — 마력 '+S.hero.mp+'/'+S.hero.mpMax+(petCapN()>=cap?' · 자리가 차 있어 가장 먼저 부른 것이 돌아간다':'')));
    ks.forEach(k=>{
      const a=abOf(k),w=outWhy(k),ids=arr(a.summon).concat(a.into?[a.into]:[]);
      const what=ids.map(id=>{const x=sumStats(id,a);return SUMT(id).name+(a.kind==='fuse'?'':' HP '+x.hp)}).join(', ');
      const one=ids.some(id=>SUMT(id).oneBattle);
      actBtn(c,a.name,(a.mp?'마력 '+a.mp:'')+(a.uses?(a.mp?' · ':'')+(a.per==='long'?'긴':'짧은')+' 휴식마다 '+a.uses+'번 (남은 '+usesLeft({kind:'hero'},k)+')':'')+(a.hpCost?' · 피의 대가 HP '+bloodCost(a):'')+' · '+(a.kind==='fuse'?'곁의 소환수를 모두 합쳐 '+what+'로 (HP 두 배)':what)+(one?' · 다음 싸움 한 번만 함께한다':'')+(w?' · '+w:''),()=>summonOutside(k),{disabled:!!w,star:!!a.hpCost});
    });
  }
}
function renderParty(box){
  petsPane(box);
  const ids=Object.keys(SC.companions||{}).filter(compKnown);
  box.appendChild(el('h2',null,'진형'));
  const fc=el('div','card');box.appendChild(fc);
  fc.appendChild(el('div','sub','전투 시작 위치 — 근접 공격은 앞열에서만 한다. 앞열에 누가 서 있는 한, 적의 근접 공격은 뒷열에 닿지 않는다.'));
  const rowSeg=id=>{const sg=el('div','seg');['front','back'].forEach(r=>{const b=el('button',rowPref(id)===r?'on':'',ROWN[r]);b.onclick=()=>{S.rows[id]=r;save();render()};sg.appendChild(b)});return sg};
  ['hero'].concat(ids).forEach(id=>{const fr=el('div','formrow'),nb=el('div');nb.appendChild(el('b',null,id==='hero'?S.hero.name:COMP(id).name));if(id!=='hero'&&!compHere(id))nb.appendChild(el('span','mini',compState(id)==='bench'?' 쉼터에서 기다린다':' 떨어져 있다'));fr.appendChild(nb);fr.appendChild(rowSeg(id));fc.appendChild(fr)});

  box.appendChild(el('h2',null,'동료'));
  if(!ids.length)box.appendChild(el('div','card sub','아직 함께하는 동료가 없다. 숲과 계단에서 누군가를 만날지도 모른다.'));
  ids.forEach(id=>{
    const C=COMP(id),r=S.comp[id],here=compHere(id),d1=el('div','card comp');
    const t=el('div','hudtop'),nb=el('div');nb.appendChild(el('b',null,C.name));nb.appendChild(el('span','mini',' · '+C.title+' · 레벨 '+S.hero.level));t.appendChild(nb);t.appendChild(el('span','mini',here?'함께 있다':compState(id)==='bench'?'쉼터에서 기다린다':'지금은 떨어져 있다'));d1.appendChild(t);
    if(r){d1.appendChild(bar('var(--hp)',r.hp,r.hpMax));d1.appendChild(el('div','mini','HP '+r.hp+'/'+r.hpMax+' · 방어 '+(C.ac+compMod(id,'ac'))+' · '+C.attack.name+' 명중 '+sign(C.attack.hit+lvB()+compMod(id,'hit'))+' 피해 '+C.attack.dice+sign(C.attack.dmgB+lvB()+compMod(id,'dmg')+(C.attack.dtype==='fire'?tfx(id).fire||0:0))+(C.attack.ranged?' (원거리)':C.attack.reach?' (긴 창)':'')))}
    // 호감
    const v=apVal(id),tr=apTier(v),ef=[];if(tr.hit)ef.push('명중 '+sign(tr.hit));if(tr.ac)ef.push('방어 +'+tr.ac);
    const apl=el('div','mini');apl.appendChild(el('span','ap '+(v>=3?'up':v<=-3?'down':''),(C.apName||'호감')+' '+sign(v)+' · '+tr.n));apl.appendChild(document.createTextNode((ef.length?' ('+ef.join(', ')+')':'')+(C.leaveAt!=null&&v<=C.leaveAt+2?' · 이대로라면 떠날지도 모른다':'')));d1.appendChild(apl);
    const pk=arr(C.perks).filter(p=>ok(p.if));if(pk.length)d1.appendChild(el('div','mini','보상: '+pk.map(p=>p.name+' ('+['hit','ac','dmg'].filter(k=>p[k]).map(k=>({hit:'명중',ac:'방어',dmg:'피해'})[k]+' +'+p[k]).join(', ')+')').join(', ')));
    const tn=trinketOn(id);if(tn){const tl=el('div','mini','장신구: ');tl.appendChild(rarName(tn));tl.appendChild(document.createTextNode(' — '+trinketText(SC.items[tn].fx)));d1.appendChild(tl)}
    if(campHint(id))d1.appendChild(el('div','sub','✦ 쉼터에서 긴 휴식을 하면 할 말이 있는 것 같다'));
    // 데려갈지, 쉼터에 남길지, 헤어질지
    const st=compState(id),ctl=el('div','row compctl');
    ctl.appendChild(el('span','chip '+(st==='party'?'up':''),CSTATE_N[st]));
    if(S.mode==='world'){
      const atRest=canRest(),bb=el('button',null,st==='bench'?'데려가기':'쉼터에 남기기');
      bb.disabled=!atRest;bb.title=atRest?'':'쉴 수 있는 곳에서만 일행을 바꿀 수 있다';
      bb.onclick=()=>{setCompState(id,st==='bench'?'party':'bench');save();render()};ctl.appendChild(bb);
      if(SC.events['part_'+id]){const pb=el('button',null,'작별하기');pb.onclick=()=>startEvent('part_'+id);ctl.appendChild(pb)}
      if(!atRest)ctl.appendChild(el('span','mini','쉼터에서 일행을 바꿀 수 있다'));
    }
    d1.appendChild(ctl);
    if(!here&&C.awayText)d1.appendChild(el('div','sub',C.awayText));
    // 자세한 이야기와 기술은 접어 둔다
    const dt=el('details');dt.appendChild(el('summary',null,'이야기 · 도와주는 판정 · 기술'));
    dt.appendChild(el('div','sub',C.blurb));
    dt.appendChild(el('div','sub','도와주는 판정: '+arr(C.profs).join(', ')));
    (C.skills||[]).forEach(k=>{const ab=abOf(k),kn=ab.lv<=S.hero.level;const x=el('div','sub');if(!kn)x.style.opacity='.6';x.textContent='· '+ab.name+' ['+abCost(ab)+(ab.uses&&kn&&r?', 남은 '+usesLeft({kind:'comp',id},k):'')+'] '+abDesc(k)+(kn?'':' · 레벨 '+ab.lv);dt.appendChild(x)});
    d1.appendChild(dt);
    box.appendChild(d1);
  });
  // 헤어지거나 떠나거나 적이 되거나 쓰러진 동료: 어디서 다시 만날 수 있는지
  Object.keys(SC.companions||{}).forEach(id=>{const st=compState(id);if(!CSTATES.includes(st))return;const C=COMP(id),g=el('div','card comp gone');
    const t=el('div','hudtop');t.appendChild(el('b',null,C.name));t.appendChild(el('span','chip '+(st==='hostile'||st==='dead'?'down':''),CSTATE_N[st]));g.appendChild(t);
    if(C.gone&&C.gone[st])g.appendChild(el('div','sub',tpl(C.gone[st])));box.appendChild(g)});
  box.appendChild(el('div','sub','동료는 그대와 같은 레벨로 함께 자란다 — 경험치는 일행이 나누지 않고 함께 얻고, 레벨이 오르면 동료의 HP·명중·피해도 오르고 새 기술을 익힌다. 동료는 마력 대신 휴식마다 충전되는 기술을 쓴다.')).style.marginTop='8px';
  box.appendChild(el('div','sub','동료는 곁에 있을 때 그대의 선택에 반응한다. 호감이 높으면 더 잘 싸우고, 바닥나면 떠난다. 동료가 능한 기술의 이야기 판정은 곁에 있으면 유리하다.')).style.marginTop='4px';
}
// 등급 + 종류 (+ 종류와 이름이 다른 부위: 방어구 · 몸)
function kindName(n){const it=SC.items[n]||{},k=it.kind||'소지품';return (it.rar?RAR[it.rar]+' ':'')+k+(it.slot&&slotName(it.slot)!==k&&it.slot!=='trinket'?' · '+slotName(it.slot):'')+(it.cls?' · '+CLS_N(it.cls)+' 전용':'')}
function itemInfo(n){
  const it=SC.items[n]||{},p=[];
  if(it.slot==='weapon')p.push(it.dice+(it.bonus?' +'+it.bonus:'')+(it.crit&&!/치명타/.test(it.desc||'')?' · '+it.crit+'~20 치명타':''));
  if(it.ac)p.push('방어 +'+it.ac);
  const t=trinketText(it.fx||{});if(t)p.push(t);
  if(it.desc)p.push(it.desc);
  return p.join(' · ');
}
function mapSvg(){
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 320 240');svg.setAttribute('class','map');svg.setAttribute('role','img');svg.setAttribute('aria-label','지도');
  const here=regionOf(S.loc),ids=Object.keys(SC.locations).filter(id=>visible(id)&&regionOf(id)===here);
  const adj=linksOf(S.loc).map(k=>k.to);
  const drawn={};
  ids.forEach(a=>linksOf(a).forEach(k=>{
    if(regionOf(k.to)!==here)return;   // 다른 지역으로 가는 길은 지도 가장자리 표시로 대신한다
    const key=[a,k.to].sort().join('|');if(drawn[key])return;drawn[key]=1;
    const A=SC.locations[a],B=SC.locations[k.to],ln=document.createElementNS(ns,'line');
    ln.setAttribute('x1',A.x);ln.setAttribute('y1',A.y);ln.setAttribute('x2',B.x);ln.setAttribute('y2',B.y);ln.setAttribute('class','link');svg.appendChild(ln);
  }));
  ids.forEach(id=>{
    const l=SC.locations[id],g=document.createElementNS(ns,'g'),isAdj=adj.includes(id);
    if(isAdj){g.setAttribute('class','adj');g.addEventListener('click',()=>travel(id))}
    const c=document.createElementNS(ns,'circle');c.setAttribute('cx',l.x);c.setAttribute('cy',l.y);c.setAttribute('r',id===S.loc?9:7);
    c.setAttribute('class','node'+(id===S.loc?' here':isAdj?' adj':''));g.appendChild(c);
    const t=document.createElementNS(ns,'text');t.setAttribute('x',l.x);t.setAttribute('y',l.y+(l.y>200?-14:20));t.setAttribute('text-anchor','middle');t.textContent=l.name;g.appendChild(t);
    const lv=document.createElementNS(ns,'text');lv.setAttribute('x',l.x);lv.setAttribute('y',l.y+(l.y>200?-26:31));lv.setAttribute('text-anchor','middle');lv.setAttribute('class','lv');lv.textContent=l.lv==='안전'?'안전':'Lv '+l.lv;g.appendChild(lv);
    if(storyAt(id)){const s=document.createElementNS(ns,'text');s.setAttribute('x',l.x+11);s.setAttribute('y',l.y-6);s.setAttribute('class','starmark');s.textContent='★';g.appendChild(s)}
    const out=linksOf(id).filter(k=>regionOf(k.to)!==here);
    if(out.length){const ex=document.createElementNS(ns,'text');ex.setAttribute('x',l.x);ex.setAttribute('y',l.y+(l.y>190?-24:43));ex.setAttribute('text-anchor','middle');ex.setAttribute('class','exit');ex.textContent='⇢ '+out.map(k=>regionName(regionOf(k.to))).join(', ');g.appendChild(ex)}
    svg.appendChild(g);
  });
  return svg;
}

function stTags(u){
  const t=[],st=u.st||{};
  if(st.stun)t.push('얼어붙음');if(st.poison)t.push('독 '+st.poison.t);if(st.weak)t.push('명중 -2');if(st.blind)t.push('연막');if(st.burn)t.push('불붙음');
  if(st.prone)t.push('넘어짐');if(st.restrain)t.push('속박');if(st.wet)t.push('젖음');if(st.taunt)t.push('도발당함');if(st.mark)t.push('약점 노출');
  if(u.hid)t.push('숨음');if(u.high)t.push('고지대');if(u.dodge)t.push('회피');
  (u.buffs||[]).forEach(b=>t.push(b.name+' '+buffText(b)+' ('+b.t+')'));
  return t;
}
function zoneHead(label,z){
  const s=S.battle.surf[z],side=z.split('-')[0],d0=el('div','zone');
  d0.appendChild(el('b',null,label));
  if(s)d0.appendChild(el('span','surf '+s.t,SURF[s.t].n+(s.r<90?' · '+s.r+'라운드':'')));
  if(z.endsWith('back')&&canClimb(side))d0.appendChild(el('span','surf high','고지대'));
  return d0;
}
function foeCard(e,u){
  const B=S.battle,P=u?profile(u,null):null,b=el('button','foe'+(B.target===e.uid&&up(e)?' on':'')+(up(e)?'':' dead'));
  const t=el('div','hudtop');t.appendChild(el('b',null,e.name));
  let info='Lv '+e.lv+' · 방어 '+acOf(e);
  if(up(e)&&u&&!B.over)info+=canHit(u,e,P)?' · 명중 '+pct(hitP(u,e,P)):' · 닿지 않음';
  t.appendChild(el('span','mini',info));b.appendChild(t);
  b.appendChild(bar('var(--foe)',e.hp,e.hpMax));
  const ln=el('div','mini','HP '+e.hp+'/'+e.hpMax+(up(e)?'':' · 쓰러짐'));
  const tags=up(e)?stTags(e):[];if(tags.length)ln.appendChild(el('span','tag',' · '+tags.join(' · ')));
  b.appendChild(ln);
  b.disabled=!up(e)||!!B.over||rolling;
  b.onclick=()=>{B.target=e.uid;save();renderCombat()};
  return b;
}
function pcCard(p){
  const B=S.battle,r=R(p),c=el('div','foe pc'+(curU()===p&&!B.over?' on':'')+(up(p)?'':' down'));
  const t=el('div','hudtop');t.appendChild(el('b',null,(curU()===p&&!B.over?'▶ ':'')+p.name));
  t.appendChild(el('span','mini',(p.kind==='summon'?'소환수 · ':'')+'방어 '+acOf(p)+(p.kind==='hero'?' · 마력 '+S.hero.mp+'/'+S.hero.mpMax+(S.cls==='summoner'?' · 소환수 '+summons().length+'/'+sumCap():''):'')));c.appendChild(t);
  c.appendChild(bar('var(--hp)',r.hp,r.hpMax));
  let s='HP '+r.hp+'/'+r.hpMax;
  if(!up(p))s+=p.out?' · 의식 잃음':p.stable?' · 쓰러짐 (안정)':' · 쓰러짐 — 죽음 내성 성공 '+'●'.repeat(p.saves.s)+'○'.repeat(Math.max(0,3-p.saves.s))+' 실패 '+'●'.repeat(Math.min(3,p.saves.f))+'○'.repeat(Math.max(0,3-p.saves.f));
  const ln=el('div','mini',s);const tags=up(p)?stTags(p):[];if(tags.length)ln.appendChild(el('span','tag',' · '+tags.join(' · ')));
  c.appendChild(ln);
  return c;
}
function renderCombat(){
  const B=S.battle,box=$('combat'),side=$('cside');box.innerHTML='';side.innerHTML='';
  const u=curU(),mine=myTurn();
  // 주도권 순서
  const ib=el('div','initbar');
  B.order.forEach((id,i)=>{const x=U(id);if(!x||(x.side==='foe'&&!up(x))||x.out)return;
    ib.appendChild(el('span','ini s-'+x.side+(i===B.turn&&!B.over?' cur':'')+(up(x)?'':' down'),x.name.replace(' (불려 옴)','')))});
  box.appendChild(ib);
  // 적과 아군, 열마다 — 좁은 화면에서는 행동판 아래, 넓은 화면에서는 오른쪽에 놓인다
  side.appendChild(el('h2',null,'적'+(alive().length>1?' — 눌러서 대상 고르기':'')));
  ['front','back'].forEach(row=>{
    const z='foe-'+row,list=foes().filter(e=>e.row===row);if(!list.length&&!B.surf[z])return;
    side.appendChild(zoneHead('적 '+ROWN[row],z));
    const g=el('div','foes two');list.forEach(e=>g.appendChild(foeCard(e,mine?u:null)));side.appendChild(g);
  });
  side.appendChild(el('h2',null,'아군'));
  ['front','back'].forEach(row=>{
    const z='pc-'+row,list=pcs().filter(p=>p.row===row);if(!list.length&&!B.surf[z])return;
    side.appendChild(zoneHead('아군 '+ROWN[row],z));
    const g=el('div','foes two');list.forEach(p=>g.appendChild(pcCard(p)));side.appendChild(g);
  });

  box.appendChild(el('h2',null,B.over?'전투 끝':mine?josa(u.name,'의')+' 차례 · 라운드 '+B.round:'라운드 '+B.round));
  const card=el('div','card');box.appendChild(card);
  const dr=el('div','row');card.appendChild(dr);
  const dw=el('div','die');dw.style.width='92px';dw.style.height='92px';dw.appendChild(dieSvg('cshape','cnum',B.last&&B.last.r));dr.appendChild(dw);
  const cc=el('div');cc.style.flex='1';cc.style.minWidth='160px';
  const t=tgtU();
  cc.appendChild(el('div','sub',B.over?'전투가 끝났다':rolling?'굴리는 중…':mine?ROWN[u.row]+(u.high?' (고지대)':'')+(t&&up(t)?' · 대상: '+t.name:''):''));
  cc.appendChild(el('div',null,B.last?B.last.txt:'행동을 고르면 주사위를 굴린다'));
  if(mine&&t&&up(t)){const am=atkMode(u,t,profile(u,null));if(am.mode!=='normal')cc.appendChild(el('div','sub',(am.mode==='adv'?'유리: '+am.adv.join(', '):'불리: '+am.dis.join(', '))+' — d20 두 개를 굴린다'))}
  dr.appendChild(cc);

  if(B.over){
    const r=el('div','result '+(B.over==='lose'?'bad':B.over==='fled'?'neu':'ok'));r.style.marginTop='10px';
    r.appendChild(el('b',null,B.res.title));
    if(B.res.lines.length){const cs=el('div','chips');B.res.lines.forEach(l=>cs.appendChild(chipEl(l)));r.appendChild(cs)}
    card.appendChild(r);
    const nb=el('button','next','계속 →');nb.onclick=endBattle;card.appendChild(nb);
    // 사냥을 이겼으면 같은 곳에서 곧바로 한 번 더 (노가다를 덜 번거롭게)
    if(B.kind==='random'&&B.over==='win'&&L().encounters){const h=S.hero,hb=el('button','huntb','한 번 더 사냥 →'+(h.hp<h.hpMax*0.4?' (HP '+h.hp+'/'+h.hpMax+')':''));hb.id='huntagain';hb.onclick=()=>{endBattle();if(S.mode==='world'){S.notice=null;startRandomBattle(false)}};card.appendChild(hb)}
  }else if(mine){
    const tr=B.tr,pp=el('div','pips');
    [['act','행동'],['bonus','보조 행동'],['move','이동']].forEach(([k,n])=>pp.appendChild(el('span',tr[k]?'on':'',(tr[k]?'● ':'○ ')+n)));
    card.appendChild(pp);
    const grid=el('div','acts');card.appendChild(grid);
    const add=(label,small,fn,c,cl,to)=>{const b=el('button',cl||'');b.appendChild(el('b',null,label));if(small)b.appendChild(el('small',null,small));b.disabled=!(c.ok||c.pick)||rolling;b.onclick=fn;(to||grid).appendChild(b);return b};
    const tog=m=>()=>{cmenu=cmenu===m?null:m;renderCombat()};
    const P=profile(u,null);let c=canDo(u,'attack');
    add(P.name,c.ok?'행동 · 명중 '+pct(hitP(u,t,P))+' · '+P.dice:c.why,()=>pcAct('attack'),c);
    const ks=unitSkills(u);
    add((cmenu==='skill'?'▾ ':'')+'기술',!ks.length?'없음':u.kind==='hero'&&ks.some(k=>abOf(k).mp)?'마력 '+S.hero.mp+'/'+S.hero.mpMax:ks.length+'개',tog('skill'),{ok:ks.length>0},cmenu==='skill'?'on':'');
    const mo=moveOpts(u);
    add((cmenu==='move'?'▾ ':'')+'이동',mo.length?'지금 '+ROWN[u.row]+(u.high?' · 고지대':''):tr.move?'움직일 수 없다':'이동을 썼다',tog('move'),{ok:mo.length>0},cmenu==='move'?'on':'');
    const its=[...new Set(S.items.filter(n=>SC.items[n]&&SC.items[n].battle))];
    add((cmenu==='item'?'▾ ':'')+'물품·던지기',its.length?its.length+'종':'돌 던지기',tog('item'),{ok:true},cmenu==='item'?'on':'');
    c=canDo(u,'shove');add('밀치기',c.ok?'행동 · 성공 '+pct(shoveP(u,t))+' · 뒷열로 밀고 넘어뜨림':c.why,()=>pcAct('shove'),c);
    c=canDo(u,'hide');const hAdv=B.field.cover||ufx(u).hide;add('숨기',c.ok?(rogue(u)?'보조':'행동')+' · 성공 '+pct(chance(hideMod(u),hideDC(),hAdv?'adv':'normal',0,{}))+(hAdv?' (유리)':''):c.why,()=>pcAct('hide'),c);
    if(pcs().some(p=>!up(p)&&!p.out)){c=canDo(u,'help');add('돕기',c.ok||c.pick?'행동 · 쓰러진 동료를 HP 1로':c.why,()=>pcAct('help'),c)}
    c=canDo(u,'dodge');add('회피',c.ok?'행동 · 받는 공격 불리'+(u.kind==='hero'?', 마력 +1':''):c.why,()=>pcAct('dodge'),c);
    if(rogue(u)){c=canDo(u,'dis');add('물러서기',c.ok?'보조 · 기회 공격 없이 물러남':'쓸 수 없다',()=>pcAct('dis'),c)}
    if(u.kind==='hero'){const fi=fleeInfo();c=canDo(u,'flee');add('도망',c.ok?'행동 · 민첩 '+sign(fi.bonus)+' vs '+fi.dc+' · '+pct(chance(fi.bonus,fi.dc,'normal',0,{})):c.why,()=>pcAct('flee'),c)}
    if(u.kind==='hero')arr(B.def.special).filter(sp=>ok(sp.if)).forEach(sp=>{
      const {dc,why}=specialDC(sp),bonus=statVal(spStat(sp))+profBonus();c=canDo(u,'special',sp.id);
      add('✦ '+sp.label,spStat(sp)+' '+sign(bonus)+' vs DC '+dc+(why.length?' ('+why.join(', ')+')':'')+' · 성공 '+pct(chance(bonus,dc,'normal',0,{lucky:race()&&race().lucky}))+' · 마력 '+sp.mp+' · '+sp.note,()=>pcAct('special',sp.id),c,'wide');
    });
    // 차례를 넘기는 두 버튼은 늘 같은 자리(행동판 맨 아래)에 둔다
    const fin=el('div','acts fin');card.appendChild(fin);
    add('자동','이 차례는 알아서 싸운다',autoNow,{ok:true},'',fin);
    add('턴 끝 →',spent()?'':'남은 행동을 버린다',endTurn,{ok:true},'go',fin);
    if(B.kind==='random'){fin.classList.add('three');add('끝까지 자동','사냥을 알아서 끝낸다',autoAll,{ok:true},'autoall',fin)}
    card.appendChild(el('div','kbd','단축키 — 숫자: 행동·메뉴 고르기 · E: 턴 끝 · '+(B.kind==='random'?'A: 끝까지 자동 · ':'')+'Esc: 메뉴 닫기'));
    const sub=el('div');sub.style.marginTop='8px';
    if(cmenu==='skill')ks.forEach(k=>{
      const ab=abOf(k),c=canDo(u,'skill',k);let s=abDesc(k)+' · '+abCost(ab)+(ab.uses?' (남은 '+usesLeft(u,k)+')':'');
      if(t&&up(t)){
        if(ab.kind==='attack'||ab.kind==='pierce'){const Q=profile(u,ab);s+=canHit(u,t,Q)?' · 명중 '+pct(hitP(u,t,Q)):''}
        else if(ab.kind==='save'&&ab.area!=='all')s+=' · '+(ab.area==='row'?zoneName(zk(t))+' '+zoneUnits(zk(t)).length+'명 · ':'')+'내성 실패 '+pct(failP(t,ab.save,spellDC(u,ab)));
        else if(ab.kind==='surface')s+=' · '+zoneName(zk(t));
        else if(ab.kind==='mark')s+=' · 대상: '+t.name;
      }
      if(!(c.ok||c.pick))s=c.why+' · '+s;
      actBtn(sub,ab.name,s,()=>pcAct('skill',k),{disabled:!(c.ok||c.pick)||rolling});
    });
    if(cmenu==='move')mo.forEach(o=>actBtn(sub,o.label,o.small,()=>pcAct('move',o.id),{disabled:rolling}));
    if(cmenu==='item'){
      its.forEach(n=>{
        const it=SC.items[n],cnt=' ×'+countItem(n);
        if(it.use){
          const c1=canDo(u,'drink',n);actBtn(sub,n+cnt+' — 마신다',(c1.ok?'보조 행동 · ':c1.why+' · ')+it.desc,()=>pcAct('drink',n),{disabled:!c1.ok||rolling});
          if(it.use.hp&&pcs().length>1){const c2=canDo(u,'give',n);actBtn(sub,n+' — 동료에게 먹인다',(c2.ok||c2.pick?'행동 · ':c2.why+' · ')+'쓰러진 동료도 일으킨다',()=>pcAct('give',n),{disabled:!(c2.ok||c2.pick)||rolling})}
        }else if(it.throw){const c3=canDo(u,'throw',n);actBtn(sub,n+cnt+' — 던진다',(c3.ok?'행동 · '+(t?zoneName(zk(t))+' · ':''):c3.why+' · ')+it.desc,()=>pcAct('throw',n),{disabled:!c3.ok||rolling})}
      });
      const c4=canDo(u,'throw','돌'),RP=rockP(u);actBtn(sub,'돌 던지기',(c4.ok?'행동 · 명중 '+pct(hitP(u,t,RP))+' · ':c4.why+' · ')+'원거리 '+RP.dice,()=>pcAct('throw','돌'),{disabled:!c4.ok||rolling});
    }
    if(cmenu&&cmenu.pick){
      sub.appendChild(el('div','sub','누구에게?'));
      pcs().forEach(p=>{const c=canDo(u,cmenu.pick,cmenu.arg,p.uid);if(!c.ok)return;actBtn(sub,p.name,'HP '+R(p).hp+'/'+R(p).hpMax+(up(p)?'':' · 쓰러짐'),()=>pcAct(cmenu.pick,cmenu.arg,p.uid),{disabled:rolling})});
      actBtn(sub,'취소',null,()=>{cmenu=null;renderCombat()});
    }
    if(sub.children.length)card.insertBefore(sub,fin);
  }

  side.appendChild(el('h2',null,'전투 기록'));
  const lc=el('div','card');side.appendChild(lc);
  const ul=el('ul','clog');lc.appendChild(ul);
  B.log.slice(-14).reverse().forEach(x=>ul.appendChild(el('li',x.k+(x.r<B.round-1?' old':''),x.t)));
  if(window.Art)Art.redraw();
}

// 결과 꼬리표: 영감·호감은 색으로, 얻은 물건은 등급 색으로
function chipEl(f){
  const m=/^획득: (.+?)(?: \(.+\))?$/.exec(f),it=m&&SC.items[m[1]];
  return el('span','chip'+(/^영감/.test(f)?' gold':/(호감|유대) \+/.test(f)?' up':/(호감|유대) -|떠났다/.test(f)?' down':it&&it.rar?' loot rar-'+it.rar:''),f);
}
// ── 사건 화면 (선택지 · 판정 · 결과)
function choiceInfo(c){
  const note=txt(c.note);
  if(c.roll===false)return '판정 없음'+(note?' / '+note:'')+(inspMatch(c)?' · ✦ 영감':'');
  const k=calc(c),mode=modeOf(k.adv,k.dis);
  const tag=c.stat==='class'?'[직업] ':c.skill?'['+c.skill+'] ':'';
  let s=tag+statOf(c)+' '+sign(k.mod)+' vs DC '+k.dc+' · 성공 '+pct(storyChance(k,false,false));
  if(k.why.length)s+=' ('+k.why.join(', ')+')';
  if(mode==='adv')s+=' · 유리: '+k.adv.join(', ');else if(mode==='dis')s+=' · 불리: '+k.dis.join(', ');
  if(inspMatch(c))s+=' · ✦ 영감';
  if(note)s+=' / '+note;
  return s;
}
// 서로 정반대인 조건(X와 nor:[X])의 짝 가운데 잠긴 쪽은 아예 보이지 않는다 (그 상황에 없는 선택지)
function choiceHidden(n,c){
  if(!c.requires||ok(c.requires))return false;const J=JSON.stringify;
  return n.choices.some(d=>d!==c&&d.requires&&((d.requires.nor&&d.requires.nor.length===1&&J(d.requires.nor[0])===J(c.requires))||(c.requires.nor&&c.requires.nor.length===1&&J(c.requires.nor[0])===J(d.requires))));
}
function choiceNo(n,c){return n.choices.filter(d=>!choiceHidden(n,d)).indexOf(c)+1}
function renderChoices(){
  const n=ev(),box=$('choices'),p=S.pending||S.reroll;box.innerHTML='';
  n.choices.forEach(c=>{
    if(choiceHidden(n,c))return;
    const locked=c.requires&&!ok(c.requires);
    const b=el('button','opt'+((p?p.choiceId:S.sel)===c.id?' on':''));
    b.appendChild(document.createTextNode(choiceNo(n,c)+'. '+txt(c.label)));
    let info=choiceInfo(c);
    if(locked)info='[잠김] 필요: '+(txt(c.reqText)||'조건 미달')+' / '+info;
    b.appendChild(el('small',null,info));
    b.disabled=!!p||locked||rolling||needLevel();
    b.onclick=()=>{if(c.roll===false){resolve(c,null);return}S.sel=c.id;save();renderChoices();renderMods();updateRollBtn();if(narrow())$('rollwrap').scrollIntoView({block:'nearest',behavior:'smooth'})};
    box.appendChild(b);
  });
  $('rollwrap').style.display=n.choices.some(c=>c.roll!==false)?'':'none';
  $('playwrap').style.display=S.pending&&S.pending.battleEnd?'none':'';
}
function renderMods(){
  const m=$('mods'),pr=S.pending&&S.pending.roll,lock=!!S.pending||!!S.reroll||rolling,mp=S.hero.mp;m.innerHTML='';
  if(!pr){if(ampOn&&mp<ampCost())ampOn=false;if(foOn&&mp<(ampOn?ampCost():0)+1)foOn=false}
  const a=el('label','sub'),ac=el('input');ac.type='checkbox';ac.id='ampchk';
  ac.checked=pr?!!pr.amp:ampOn;ac.disabled=lock||mp<ampCost();
  ac.onchange=()=>{ampOn=ac.checked;if(ampOn&&foOn&&ampCost()+1>S.hero.mp)foOn=false;renderMods();updateRollBtn()};
  a.appendChild(ac);a.appendChild(document.createTextNode(' '+S.amp.name+' (마력 '+ampCost()+', d'+S.amp.die+' 추가)'));m.appendChild(a);
  if(hasSkill('A')){
    const f=el('label','sub'),fc=el('input');fc.type='checkbox';fc.id='fochk';
    fc.checked=pr?!!pr.fo:foOn;fc.disabled=lock||mp<1;
    fc.onchange=()=>{foOn=fc.checked;if(foOn&&ampOn&&ampCost()+1>S.hero.mp)ampOn=false;renderMods();updateRollBtn()};
    f.appendChild(fc);f.appendChild(document.createTextNode(' 예지의 눈 (마력 1, 유리)'));m.appendChild(f);
  }
}
function selChoice(){const c=ev().choices.find(x=>x.id===S.sel);return c&&c.roll!==false&&!(c.requires&&!ok(c.requires))?c:null}
function updateRollBtn(){
  const c=selChoice();
  $('die').disabled=!(c&&!needLevel()&&!S.pending&&!S.reroll&&!rolling);
  let h=S.pending?'결과를 확인하고 넘어가세요':S.reroll?'실패했다. 영감을 쓸지 고르세요':needLevel()?'먼저 레벨 업 보상을 고르세요':!c?'선택지를 고르고 주사위를 누르세요':'주사위를 눌러 굴리세요';
  if(c&&!S.pending&&!S.reroll){
    const k=calc(c),adv=k.adv.slice();if(foOn)adv.push('예지의 눈');
    const mode=modeOf(adv,k.dis);
    h+=' · 성공 확률 '+pct(storyChance(k,ampOn,foOn))+(mode==='adv'?' · 유리 (d20 두 개 중 높은 값)':mode==='dis'?' · 불리 (d20 두 개 중 낮은 값)':'');
  }
  $('hint').textContent=h;
}
function calcText(r){
  const dt=r.dice&&r.dice.length>1?'d20['+r.dice.join(', ')+'] '+(r.mode==='adv'?'유리':'불리')+'→'+r.r:'d20 '+r.r;
  return (r.rerolled?'(영감: '+r.rerolled+' → 다시) ':'')+dt+(r.notes&&r.notes.length?' ('+r.notes.join(', ')+')':'')+(r.lucky?' (행운의 별)':'')+' '+sign(r.mod)+(r.amp?' + d'+r.ampDie+'('+r.ampRoll+')':'')+' = '+r.total+' vs DC '+r.dc;
}
function renderResult(){
  const p=S.pending,w=$('reswrap'),rb=$('resbox');rb.innerHTML='';
  if(S.reroll){
    const rr=S.reroll.roll;w.style.display='';$('num').textContent=rr.r;$('calc').textContent=calcText(rr);
    const head=el('div','result bad');head.appendChild(el('b',null,rr.nat1?'대실패…':'실패'));
    head.appendChild(el('div','sub',calcText(rr)));rb.appendChild(head);
    const card=el('div','card');card.style.marginTop='8px';
    card.appendChild(el('div',null,'영감 '+'✦'.repeat(S.insp)+' — 영감 하나를 써서 d20을 다시 굴릴 수 있다.'));
    const row=el('div','nav');row.style.marginTop='8px';
    const a=el('button',null,'결과를 받아들인다');a.onclick=acceptFail;a.disabled=rolling;
    const b=el('button','go','✦ 영감으로 다시 굴리기');b.onclick=rerollInsp;b.disabled=rolling;
    row.appendChild(a);row.appendChild(b);card.appendChild(row);rb.appendChild(card);
    return;
  }
  if(!p){w.style.display='none';if(!rolling){$('calc').textContent='';$('num').textContent='?'}return}
  w.style.display='';
  if(p.roll){$('num').textContent=p.roll.r;$('calc').textContent=calcText(p.roll)}
  const good=p.key==='crit'||p.key==='success';
  const head=el('div','result '+(p.key==='auto'?'neu':good?'ok':'bad'));
  const title=p.battleEnd?(p.battleEnd==='win'?'승리!':p.battleEnd==='lose'?'패배…':p.battleEnd==='fled'?'도망쳤다':'성공!'):
    p.key==='auto'?p.label:p.key==='crit'?'대성공!':p.key==='fumble'?'대실패…':good?'성공':'실패';
  head.appendChild(el('b',null,title));
  if(p.roll){const n=ev(),c=n.choices.find(x=>x.id===p.choiceId);head.appendChild(el('div','sub',(c?choiceNo(n,c):p.choiceId)+'번 '+p.label+' · '+calcText(p.roll)))}
  else if(p.battleEnd)head.appendChild(el('div','sub','전투: '+p.label));
  rb.appendChild(head);
  const story=el('div','card prose story');p.text.forEach(t=>story.appendChild(el('p',null,t)));rb.appendChild(story);
  if(p.down)rb.appendChild(el('div','downbox',SC.downText));
  if(p.fx.length){const cs=el('div','chips');p.fx.forEach(f=>cs.appendChild(chipEl(f)));rb.appendChild(cs)}
  const label=p.battle?'전투 시작 →':p.next==='end'?'기록 보기 →':!p.next||p.next==='map'?'지도로 →':'다음 장면으로 →';
  const b=el('button','next',label);b.onclick=advance;rb.appendChild(b);
}
function doRoll(){
  if($('die').disabled)return;
  const c=selChoice(),k=calc(c);
  const useAmp=ampOn&&S.hero.mp>=ampCost();
  const useFo=foOn&&hasSkill('A')&&S.hero.mp>=(useAmp?ampCost():0)+1;
  const adv=k.adv.slice();if(useFo)adv.push('예지의 눈');
  const mode=modeOf(adv,k.dis);
  rolling=true;renderChoices();renderMods();updateRollBtn();
  const g=gen;
  animateDie('shape','num',()=>{
    if(g!==gen)return;   // 굴리는 사이 처음부터 다시 시작했다
    const rr=rollD20(mode);
    let r=rr.r,lucky=false;
    if(r===1&&hasSkill('C')){r=10;lucky=true}
    const ampRoll=useAmp?d(S.amp.die):0;
    const total=r+k.mod+ampRoll;
    const nat20=rr.r===20,nat1=rr.r===1&&!lucky;
    const success=nat20||(!nat1&&total>=k.dc);
    const cost=(useAmp?ampCost():0)+(useFo?1:0);
    S.hero.mp-=cost;
    rolling=false;ampOn=false;foOn=false;
    const rl={dice:rr.dice,notes:rr.notes,mode,r,lucky,mod:k.mod,amp:useAmp,ampRoll,ampDie:S.amp.die,fo:useFo,total,dc:k.dc,nat20,nat1,success,cost};
    if(!success&&(S.insp||0)>0){S.reroll={choiceId:c.id,roll:rl};save();render();return}
    resolve(c,rl);
  });
}
function rerollInsp(){
  const rr=S.reroll;if(!rr||S.insp<=0||rolling)return;
  const c=ev().choices.find(x=>x.id===rr.choiceId),old=rr.roll;
  S.insp--;rolling=true;renderResult();
  const g=gen;
  animateDie('shape','num',()=>{
    if(g!==gen)return;
    const x=rollD20(old.mode);let r=x.r,lucky=false;
    if(r===1&&hasSkill('C')){r=10;lucky=true}
    const total=r+old.mod+old.ampRoll,nat20=x.r===20,nat1=x.r===1&&!lucky;
    const rl=Object.assign({},old,{dice:x.dice,notes:x.notes,r,lucky,total,nat20,nat1,success:nat20||(!nat1&&total>=old.dc),rerolled:old.r});
    S.reroll=null;rolling=false;
    logp('영감을 써서 다시 굴렸다.');
    resolve(c,rl);
  });
}
function acceptFail(){const rr=S.reroll;if(!rr||rolling)return;const c=ev().choices.find(x=>x.id===rr.choiceId);S.reroll=null;resolve(c,rr.roll)}
$('die').onclick=doRoll;

// ── 1장 끝
function summaryRows(){
  const h=S.hero,rows=[],r=race(),b=bg();
  rows.push([h.name,'레벨 '+h.level+' '+(r?r.name+' ':'')+h.cls+(b?' · '+b.name:'')+' · HP '+h.hp+'/'+h.hpMax+' · 마력 '+h.mp+'/'+h.mpMax+' · 금화 '+S.gold]);
  rows.push(['능력치',S.stats.map(s=>s.n+' '+sign(s.v)).join(' · ')]);
  rows.push(['장비',SLOTS.map(([k])=>S.equip[k]).filter(Boolean).join(', ')||'없음']);
  rows.push(['재능',S.skills.filter(id=>SC.talents.includes(id)).map(id=>SC.skillDefs[id].name).join(', ')||'없음']);
  if(spec())rows.push(['전문화',spec().name+' (「'+spec().passive.name+'」)']);
  (CH(S.ended||chapterNo()).summary||SC.summary||[]).forEach(x=>{const hit=x.cases.find(c=>ok(c.if));rows.push([x.label,tpl(hit?hit.t:(x.else||'-'))])});
  for(const k in (SC.counterNames||{}))rows.push([SC.counterNames[k],String(S.counters[k]||0)]);
  const kills=Object.keys(S.counters).filter(k=>k.startsWith('kill_')).reduce((a,k)=>a+S.counters[k],0);
  rows.push(['쓰러뜨린 적',String(kills)]);
  rows.push(['쓰러진 횟수',(S.counters.falls||0)+'번']);
  return rows;
}
function renderSummary(){
  const box=$('summary');box.innerHTML='';
  summaryRows().forEach(([k,v])=>{const dv=el('div','sumrow');dv.appendChild(el('b',null,k));dv.appendChild(el('span',null,v));box.appendChild(dv)});
}
$('copy').onclick=()=>{
  const t=SC.title+' · 제'+(S.ended||chapterNo())+'장 · '+CH(S.ended||chapterNo()).title+'\n'+summaryRows().map(r=>r[0]+': '+r[1]).join('\n')+'\n\n'+S.log.map(x=>'- '+x).join('\n');
  const done=m=>{$('copied').textContent=m;setTimeout(()=>{$('copied').textContent=''},2000)};
  // 클립보드가 막힌 환경에서는 기록을 펼쳐 직접 복사하게 한다
  const manual=()=>{const b=$('copybox');b.value=t;b.hidden=false;b.focus();b.select();done('아래 글을 길게 눌러 복사하세요')};
  try{navigator.clipboard.writeText(t).then(()=>done('복사됨'),manual)}catch(e){manual()}
};
$('goon').onclick=()=>{S.mode='world';S.loc=CH(S.ended||1).after||S.loc;save();render();toTop()};
$('nextch').onclick=()=>{const c=CH((S.ended||1)+1);if(!c.start)return;S.loc=CH(S.ended||1).after||S.loc;startEvent(c.start)};

// ── 처음부터 (두 번 눌러 확인)
let armed=0;
// 처음부터 다시: 3초 안에 한 번 더 눌러야 지운다
function restartGame(b){
  if(Date.now()-armed>3000){armed=Date.now();b.textContent='정말 처음부터? 저장이 지워진다 — 한 번 더 누르세요';b.classList.add('armed');setTimeout(()=>{if(Date.now()-armed>=3000){b.textContent='처음부터 다시';b.classList.remove('armed')}},3000);return}
  armed=0;b.textContent='처음부터 다시';b.classList.remove('armed');
  resetTo('full');
}
// 다시 시작의 세 갈래 (리세마라):
//  roll — 종족·직업·배경·이름은 그대로, 능력치만 새로 굴린다 (만들기 첫 단계로)
//  same — 같은 모험가(같은 능력치)로 곧바로 새 모험
//  full — 모두 지우고 처음부터
function resetTo(kind){
  const old=S&&S.mk?copy(S.mk):null,opt=S&&S.opt?copy(S.opt):null;
  try{localStorage.removeItem(KEY)}catch(e){}
  gen++;rolling=false;mkRolling=false;
  S=fresh();ampOn=foOn=false;cmenu=null;shopOpen=false;gearPick=null;wtab='explore';try{localStorage.removeItem(KEY+':tab')}catch(e){}
  if(old&&kind!=='full'){
    ['method','buy','race','cls','bg','name'].forEach(k=>{if(old[k]!=null)S.mk[k]=copy(old[k])});
    if(kind==='same'&&old.rolls){S.mk.rolls=old.rolls;S.mk.assign=old.assign;S.mk.rerolls=old.rerolls}
    if(kind==='same'&&mkStatsDone()&&cls(S.mk.cls)&&race(S.mk.race)&&bg(S.mk.bg)){startAdventure();if(opt)S.opt=opt}
    else{S.mk.step=1;if(opt)S.opt=opt}
  }
  menuClose();save();render();toTop();
}
// 다시 시작 메뉴: 어느 화면에서든 오른쪽 아래 단추로 연다
let menuArmed=null;
function menuOpen(){
  const pop=$('menupop'),fab=$('menufab'),inGame=!!(S&&S.hero),mk=S&&S.mk,canSame=inGame&&mk&&cls(mk.cls)&&race(mk.race)&&bg(mk.bg);
  pop.innerHTML='';menuArmed=null;
  pop.appendChild(el('h3',null,'다시 시작'+(inGame?' — 지금 모험은 지워진다':'')));
  const item=(id,label,small,kind)=>{
    const b=el('button','opt');b.id=id;b.setAttribute('role','menuitem');b.appendChild(el('b',null,label));const sm=el('small',null,small);b.appendChild(sm);
    b.onclick=()=>{
      if(inGame&&menuArmed!==id){menuArmed=id;[...pop.querySelectorAll('.opt')].forEach(x=>x.classList.remove('armed'));b.classList.add('armed');sm.textContent='정말? 한 번 더 누르면 지금 모험이 지워지고 다시 시작한다';return}
      resetTo(kind);
    };
    pop.appendChild(b);
  };
  item('rr-roll','새 능력치로 다시 (리세마라)',(mk&&mk.cls?'종족·직업·배경·이름은 그대로, ':'')+'능력치를 처음부터 새로 굴린다','roll');
  if(canSame)item('rr-same','같은 모험가로 다시','지금 능력치 그대로 곧바로 새 모험을 시작한다','same');
  item('rr-full','완전히 처음부터','모든 선택을 지우고 모험가 만들기부터','full');
  const c=el('button','opt','닫기');c.onclick=menuClose;pop.appendChild(c);
  pop.hidden=false;fab.setAttribute('aria-expanded','true');
}
function menuClose(){const pop=$('menupop'),fab=$('menufab');if(pop)pop.hidden=true;if(fab)fab.setAttribute('aria-expanded','false');menuArmed=null}
$('menufab').onclick=e=>{e.stopPropagation();$('menupop').hidden?menuOpen():menuClose()};
document.addEventListener('click',e=>{const pop=$('menupop');if(!pop.hidden&&!pop.contains(e.target)&&e.target!==$('menufab'))menuClose()});
$('restart').onclick=()=>restartGame($('restart'));

// ── 자유 주사위
let ftype=20,fhist=[];
[4,6,8,10,12,20].forEach(n=>{const b=el('button',n===20?'on':'','d'+n);b.dataset.n=n;b.onclick=()=>{ftype=n;document.querySelectorAll('#ftypes button').forEach(x=>x.classList.toggle('on',+x.dataset.n===n))};$('ftypes').appendChild(b)});
$('froll').onclick=()=>{const r=d(ftype);$('fres').textContent='d'+ftype+' = '+r;fhist.unshift('d'+ftype+':'+r);fhist=fhist.slice(0,8);$('fhist').textContent='최근: '+fhist.join(' / ')};
$('freset').onclick=()=>{fhist=[];ftype=20;$('fres').textContent='';$('fhist').textContent='';document.querySelectorAll('#ftypes button').forEach(x=>x.classList.toggle('on',+x.dataset.n===20))};

// ── 단축키: 숫자로 선택지·행동, Enter로 굴리기·계속 (글자를 입력하는 중에는 쓰지 않는다)
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('menupop').hidden){menuClose();e.preventDefault();return}
  if(e.ctrlKey||e.metaKey||e.altKey||/^(INPUT|TEXTAREA|SELECT)$/.test((e.target&&e.target.tagName)||'')||rolling)return;
  const vis=sel=>[...document.querySelectorAll(sel)].filter(b=>!b.disabled&&b.offsetParent!==null);
  const n=/^[1-9]$/.test(e.key)?+e.key:0;let b=null;
  if(S.mode==='event'){
    if(n)b=vis('#choices button')[n-1];
    else if(e.key==='Enter')b=vis('#resbox .next')[0]||(!$('die').disabled&&$('die').offsetParent?$('die'):null);
  }else if(S.mode==='combat'){
    if(n)b=vis('#combat .sub .opt').length?vis('#combat .sub .opt')[n-1]:vis('#combat .acts button')[n-1];
    else if(e.key==='Enter')b=vis('#combat .next')[0];
    else if(e.key==='e'||e.key==='E')b=vis('#combat .acts.fin .go')[0];
    else if(e.key==='a'||e.key==='A')b=vis('#combat .acts.fin .autoall')[0];
    else if(e.key==='Escape'&&cmenu){cmenu=null;renderCombat();e.preventDefault();return}
  }else if(S.mode==='world'&&n&&n<=WTABS.length){setTab(WTABS[n-1][0]);e.preventDefault();return}
  if(b){e.preventDefault();b.click()}
});

// ── 시작
S=restore()||fresh();
applyUI();
if(S.hero){fixGear();syncComps()}
if(S.mode==='combat'&&S.battle&&!S.battle.over&&!myTurn()){runTurns();save()}
if(window.Art){
  Art.mount($('art'),artInfo);
  Art.onPick(id=>{const B=S.battle;if(S.mode!=='combat'||!B||B.over||rolling)return;const u=U(id);if(u&&u.side==='foe'&&up(u)){B.target=id;save();renderCombat();Art.redraw()}});
}
render();
