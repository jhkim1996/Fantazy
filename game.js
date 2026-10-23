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
function tokens(){const c=cls(),h=S.hero||{};return {name:h.name||'떠돌이',cls:c.name,weapon:c.weapon,item:c.item,fine:c.fine,relic:c.relic,oath:c.oath,amp:(S.amp&&S.amp.name)||c.amp}}
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
    flags:{},counters:{},log:[],loc:SC.startLoc,ev:null,pending:null,sel:null,lvl:0,battle:null,notice:null,done:false};
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
function prof(){return Math.floor(S.hero.level/2)}
function heroAC(){return 10+statVal('민첩')+gearAC()+(tfx('hero').ac||0)+bsum('ac')}
function atkStat(){return cls().key}
function weaponHit(extra){return statVal(atkStat())+prof()+(wpn().bonus||0)+(extra||0)+(tfx('hero').hit||0)+bsum('atk')}
function weaponDmgBonus(){return statVal(atkStat())+(wpn().bonus||0)+(tfx('hero').dmg||0)+bsum('dmg')}
function clsSkills(){return cls().skills||[]}
function knownSkills(){return clsSkills().filter(k=>SC.combatSkills[k].lv<=S.hero.level)}
function hasRelic(){return S.items.some(i=>i===cls().relic)}
// 장비의 값어치: 저절로 바꿔 낄 때 견준다
function fxScore(f){if(!f)return 0;return (f.hp||0)/6+(f.mp||0)/5+(f.ac||0)+(f.hit||0)*1.2+(f.dmg||0)+(f.fire||0)*.4+(f.init||0)*.3+(f.save||0)*.5+(f.check||0)*.4+arr(f.resist).length*.4+(f.hide?.4:0)+(f.death?.5:0)+(f.smite?2:0)}
function gearScore(n){const it=SC.items[n];if(!it)return -1;let v=fxScore(it.fx)+(it.ac||0);if(it.slot==='weapon'){const p=parseDice(it.dice);v+=p.n*(p.s+1)/2+(it.bonus||0)*1.5}return v}
function wearable(n,slot){const it=SC.items[n];return !!it&&it.slot===slot}
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
function heroFx(){const f={};if(!S.equip)return f;SLOTS.forEach(([k])=>{const it=SC.items[S.equip[k]];if(it)addFx(f,it.fx)});return addFx(f,setFx())}

// ── 팔기: 마을의 행상인에게. 전설·세트·이야기 물건은 팔지 않는다
function wornCount(n){return SLOTS.filter(([k])=>S.equip[k]===n).length+Object.keys(S.comp||{}).filter(id=>S.comp[id].trinket===n).length}
function sellPrice(n){
  const it=SC.items[n];if(!it||it.nosell||it.rar==='legendary'||it.rar==='set'||n===cls().relic||['증표','재료','약초','동료'].includes(it.kind))return 0;
  return it.price?Math.max(1,Math.floor(it.price/2)):({uncommon:20,rare:45})[it.rar]||4;
}
function sell(n){
  if(!L().shop||rolling)return;const v=sellPrice(n);if(!v||countItem(n)-wornCount(n)<=0)return;
  S.items.splice(S.items.lastIndexOf(n),1);S.gold+=v;S.newItems=S.newItems.filter(x=>x!==n||countItem(x)>0);
  logp(josa(n,'을')+' 팔았다 (금화 +'+v+').');save();render();
}

// ── 장신구와 아이템 등급
const RAR={uncommon:'고급',rare:'희귀',legendary:'전설',set:'세트'},RANK={uncommon:1,rare:2,set:2,legendary:3};
const DTN={fire:'불',cold:'냉기',arcane:'비전',radiant:'별빛',thunder:'천둥',psychic:'정신',poison:'독',phys:'물리'};
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
      S.flags[id+'_left']=true;if(S.comp&&S.comp[id])S.comp[id].trinket=null;
      if(C.leaveText)text.push(C.leaveText);out.push(josa(C.name,'이')+' 일행을 떠났다');logp(josa(C.name,'이')+' 일행을 떠났다.');
    }
  }
}
function campTalk(){if(S.loc==='village')return null;return arr(SC.camp).find(id=>{const e=SC.events[id];return e&&!S.flags['done_'+id]&&ok(e.if)})}

// ── 결과 적용
function applyFx(fx,out){
  if(!fx)return;const h=S.hero;
  if(fx.hpFull){h.hp=h.hpMax;out.push('HP 모두 회복')}
  if(fx.hp){
    if(fx.hp<0&&S.flags.shield&&S.mode==='combat'){delete S.flags.shield;out.push('별빛 방벽이 피해를 막음')}
    else{h.hp=Math.min(h.hpMax,h.hp+fx.hp);out.push('HP '+sign(fx.hp))}
  }
  if(fx.mpFull){h.mp=h.mpMax;out.push('마력 모두 회복')}
  if(fx.mp){h.mp=Math.max(0,Math.min(h.mpMax,h.mp+fx.mp));out.push('마력 '+sign(fx.mp))}
  if(fx.gold){const g=Array.isArray(fx.gold)?rint(fx.gold[0],fx.gold[1]):fx.gold;S.gold=Math.max(0,S.gold+g);out.push('금화 '+sign(g))}
  arr(fx.drop).forEach(i=>{const k=S.items.indexOf(i);if(k>=0){S.items.splice(k,1);out.push('잃음: '+i)}});
  arr(fx.items).forEach(i=>{S.items.push(i);out.push(gotLine(i))});
  markNew(fx.items);
  if(fx.items||fx.drop)autoEquip(fx.items);
  newTrinkets(fx.items);
  if(fx.amp){Object.assign(S.amp,fx.amp);out.push(S.amp.name+' d'+S.amp.die)}
  if(fx.stats)for(const n in fx.stats){const s=S.stats.find(x=>x.n===n);if(s){s.v+=fx.stats[n];out.push(n+' '+sign(fx.stats[n]))}}
  arr(fx.set).forEach(f=>{S.flags[f]=true});
  arr(fx.unset).forEach(f=>{delete S.flags[f]});
  if(fx.add)for(const k in fx.add){S.counters[k]=(S.counters[k]||0)+fx.add[k];const nm=(SC.counterNames||{})[k];if(nm)out.push(nm+' '+sign(fx.add[k]))}
  if(fx.xp){h.xp+=fx.xp;out.push('경험치 '+sign(fx.xp))}
}
// 쓰러져도 이야기는 끝나지 않는다. 경험치가 차면 레벨이 오른다.
function settle(out){
  const h=S.hero;let down=false;
  if(h.hp<=0){h.hp=Math.max(1,Math.ceil(h.hpMax/4));S.counters.falls=(S.counters.falls||0)+1;down=true;out.push('쓰러짐 → 일어남 (HP '+h.hp+')')}
  while(h.xp>=h.xpMax){
    const c=cls(),r=race();
    h.xp-=h.xpMax;h.level++;h.xpMax=xpNeed(h.level);
    h.hpMax+=c.hpGain+((r&&r.hpPerLevel)||0);h.mpMax+=c.mpGain;h.hp=h.hpMax;h.mp=h.mpMax;S.lvl++;
    syncComps(true);
    const mates=Object.keys(S.comp||{}).filter(compKnown);
    out.push('레벨 업! 레벨 '+h.level+' (HP·마력 모두 회복'+(mates.length?', 동료도 함께 성장':'')+')');
    logp('레벨 '+h.level+'에 올랐다.');
    if(h.level===5)out.push('숙련 보너스 +3');
    const qn=n=>'「'+n+'」'+josa(n,'을').slice(n.length);
    clsSkills().filter(k=>SC.combatSkills[k].lv===h.level).forEach(k=>{out.push('새 기술: '+SC.combatSkills[k].name);logp('새 기술 '+qn(SC.combatSkills[k].name)+' 익혔다.')});
    mates.forEach(id=>(COMP(id).skills||[]).filter(k=>SC.combatSkills[k].lv===h.level).forEach(k=>{out.push(COMP(id).name+' 새 기술: '+SC.combatSkills[k].name);logp(josa(COMP(id).name,'이')+' 새 기술 '+qn(SC.combatSkills[k].name)+' 익혔다.')}));
  }
  return down;
}

function lvChoices(){
  return STATS.map(n=>({id:'stat:'+n,name:n+' +1',desc:'지금 '+sign(statVal(n))+(n===atkStat()?' · 공격에 쓰는 능력치':n==='민첩'?' · 방어에 더해진다':'')}))
    .concat(SC.talents.filter(t=>!hasSkill(t)).map(t=>({id:t,name:SC.skillDefs[t].name,desc:'[재능] '+tpl(SC.skillDefs[t].desc)})));
}
function pickLevel(id){
  if(S.lvl<=0)return;
  if(id.startsWith('stat:')){const n=id.slice(5),s=S.stats.find(x=>x.n===n);s.v++;logp('레벨 '+S.hero.level+': '+n+' +1')}
  else{S.skills.push(id);logp('레벨 '+S.hero.level+': 재능 「'+SC.skillDefs[id].name+'」')}
  S.lvl--;save();render();
}
function needLevel(){return S.lvl>0}

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
    b.appendChild(el('small',null,c.blurb));
    b.appendChild(el('small',null,'HP '+c.hp+' (+'+c.hpGain+'/레벨) · 마력 '+c.mp+' (+'+c.mpGain+'/레벨) · '+c.item+' '+SC.items[c.item].dice+' · '+c.armor+' (방어 +'+SC.items[c.armor].ac+')'));
    b.appendChild(el('small',null,'숙련: '+c.profs.join(', ')+' · 전투 기술: '+c.skills.map(k=>SC.combatSkills[k].name+'(Lv'+SC.combatSkills[k].lv+')').join(', ')));
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
  S.rest={short:2};recharge('long');arr(SC.restClears).forEach(f=>{delete S.flags[f]});
  logp(l.name+'에서 '+(full?'':'빈속으로 ')+'긴 휴식을 했다.');
  const msg=restText(l)+' — '+(full?'밤이 지나고, 모두 HP와 마력을 되찾았다.':'먹을 것이 없어 잠을 설쳤다. 절반만 회복했다.')+(!free&&has?' (야영 물자 -1)':'')+' 짧은 휴식과 기술이 모두 충전되었다.';
  // 모닥불 곁에서 동료가 이야기를 꺼낸다
  const talk=campTalk();
  if(talk){startEvent(talk);S.notice=msg;save();render();return}
  notice(msg);
}
// 짧은 휴식: 어디서나, 긴 휴식 사이에 두 번. HP 절반 회복, 짧은 휴식 기술 충전
function shortRest(){
  if(!S.rest||S.rest.short<=0)return;
  S.rest.short--;syncComps();
  const h=S.hero,song=S.cls==='bard'?d(6):0,add=(v,mx)=>Math.min(mx,v+Math.ceil(mx/2)+song);
  h.hp=add(h.hp,h.hpMax);
  for(const id in S.comp)S.comp[id].hp=add(S.comp[id].hp,S.comp[id].hpMax);
  let mp=0;if(S.cls==='mage'){const was=h.mp;h.mp=Math.min(h.mpMax,h.mp+Math.ceil(h.mpMax/2));mp=h.mp-was}
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
  if(next==='end'){S.mode='end';S.ev=null;S.done=true;save();render();toTop();return}
  startEvent(next);
}

// ── 동료
function COMP(id){return SC.companions[id]}
function compKnown(id){return !!S.hero&&ok(COMP(id).joinIf)}
// 지금 이 장소에서 함께 다니는가 (오르덴은 관문 근처에서만)
function compHere(id){const c=COMP(id);return compKnown(id)&&(!c.locs||c.locs.includes(S.loc)||ok(c.anywhereIf))}
function party(){return Object.keys(SC.companions||{}).filter(compHere)}
function compMaxHp(id){const c=COMP(id);return c.hp+c.hpGain*(S.hero.level-1)+(tfx(id).hp||0)}
// 동료 기록을 레벨에 맞춘다. full이면 모두 회복. 새로 합류한 동료 id를 돌려준다
function syncComps(full){
  S.comp=S.comp||{};const fresh=[];
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
function usesLeft(u,k){const ab=SC.combatSkills[k];if(!ab.uses)return Infinity;const c=chOf(u);return c[k]==null?ab.uses:c[k]}
function recharge(per){const f=c=>{for(const k in c){const ab=SC.combatSkills[k];if(!ab||per==='long'||ab.per==='short')delete c[k]}};f(S.ch=S.ch||{});for(const id in (S.comp||{}))f(S.comp[id].ch)}
function abCost(ab){return (ab.cost==='bonus'?'보조 행동':'행동')+(ab.mp?' · 마력 '+ab.mp:ab.mp===0?' · 마력 없음':'')+(ab.uses?' · '+(ab.per==='long'?'긴':'짧은')+' 휴식마다 '+ab.uses+'번':'')}

// ── 전투
// 주도권 순서대로 한 명씩 움직인다. 한 턴 = 행동 1 + 보조 행동 1 + 이동 1. 반응(기회 공격·수호)은 라운드마다 한 번.
// 위치는 열로 단순화한다: 양쪽 모두 앞열·뒷열. 근접 공격은 앞열에서 하고, 대상 쪽 앞열에 서 있는 자가 있으면 앞열만 노릴 수 있다.
// 열마다 바닥 표면(기름·물·불·얼음)이 깔린다. 불이 기름에 닿으면 폭발하고, 젖은 몸에 냉기가 닿으면 얼어붙는다.
const ROWN={front:'앞열',back:'뒷열'};
const SURF={oil:{n:'기름',r:5},water:{n:'물',r:4},fire:{n:'불',r:3},ice:{n:'얼음',r:3}};
const ZONES=['pc-front','pc-back','foe-front','foe-back'];
const ST_N={stun:'얼어붙음',poison:'중독',weak:'명중 -2',blind:'연막',burn:'불붙음',prone:'넘어짐',restrain:'속박',wet:'젖음',taunt:'도발당함',insp:'격려'};

function afx(o){if(window.Art)Art.fx(Object.assign({delay:fxDelay},o))}
function logB(t,k){const B=S.battle;B.log.push({t,k:k||'',r:B.round});if(B.log.length>80)B.log.splice(0,B.log.length-80)}
function U(uid){const id=String(uid).replace('*','');return S.battle.units.find(u=>u.uid===id)}
function R(u){return u.kind==='hero'?S.hero:u.kind==='comp'?S.comp[u.id]:u}
function up(u){return R(u).hp>0}
function pcs(){return S.battle.units.filter(u=>u.side==='pc')}
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
function lvB(){return Math.floor((S.hero.level-1)/2)}
function ufx(u){return u.side==='pc'?tfx(u.kind==='hero'?'hero':u.id):{}}
function acOf(u){return u.kind==='hero'?heroAC():(u.kind==='comp'?COMP(u.id).ac+compMod(u.id,'ac'):u.ac)+bsumU(u,'ac')}
function saveMod(u,stat){
  if(u.kind==='hero')return statVal(stat)+(tfx('hero').save||0);
  if(u.kind==='comp'){const c=COMP(u.id);return (({힘:c.str,민첩:c.dex,지혜:c.wis})[stat]||0)+(tfx(u.id).save||0)}
  const E=E_(u);return Math.floor(u.lv/2)+((E.saves&&E.saves[stat])||0)+(E.big&&stat==='힘'?2:0);
}
function iniMod(u){return u.kind==='hero'?statVal('민첩')+(tfx('hero').init||0):u.kind==='comp'?COMP(u.id).init+(tfx(u.id).init||0):(E_(u).init!=null?E_(u).init:Math.floor(u.lv/2))}
function spellHit(sk){return statVal(sk.stat||atkStat())+prof()+(sk.hit||0)+(tfx('hero').hit||0)+bsum('atk')}
function spellDC(u,ab){return 8+profBonus()+(u.kind==='hero'?statVal(ab.stat||atkStat()):(COMP(u.id).dc||2))}
function d20(u,mode){if(u.kind==='hero')return rollD20(mode);const a=d(20);if(mode==='normal')return {r:a,dice:[a],notes:[]};const b=d(20);return {r:mode==='adv'?Math.max(a,b):Math.min(a,b),dice:[a,b],notes:[]}}
// 공격 정보: 이름·명중·원거리·치명 범위·피해 종류·피해 굴림
function profile(u,ab){
  const wk=u.st&&u.st.weak?2:0;   // 기가 꺾이면 명중 -2
  if(u.kind==='hero'){
    if(ab&&ab.attack==='spell'){const st=ab.stat||atkStat(),add=ab.addStat?statVal(st):0;
      return {name:ab.name,hit:spellHit(ab)-wk,ranged:true,crit:ab.crit||20,dtype:ab.dtype||'arcane',spell:true,dice:ab.dmg+sign(add+bsum('dmg')),dmg:c=>rollDice(ab.dmg,c).total+add+bsum('dmg')}}
    const w=wpn(),thrown=S.cls==='rogue'&&u.row==='back',sm=tfx('hero').smite;   // 도적은 뒷열에서 단검을 던진다. sm: 세트의 별빛 피해
    return {name:ab?ab.name:thrown?'단검 던지기':'공격',hit:weaponHit(ab&&ab.hit)-wk,ranged:thrown,crit:Math.min(w.crit||20,(ab&&ab.crit)||20),dtype:'phys',weapon:true,
      dice:w.dice+sign(weaponDmgBonus())+(ab&&ab.extra?'+'+ab.extra:'')+(sm?'+'+sm:''),dmg:c=>rollDice(w.dice,c).total+weaponDmgBonus()+(ab&&ab.extra?rollDice(ab.extra,c).total:0)+(sm?rollDice(sm,c).total:0)};
  }
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
function atkMode(a,t,P,extra){
  const adv=[],dis=[];
  if(a.hid)adv.push('숨어서 기습');
  if(t.st.stun)adv.push('얼어붙은 대상');
  if(t.st.restrain)adv.push('속박된 대상');
  if(t.st.blind)adv.push('연막 속의 대상');
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
  const {m,why}=mult(t,dt),dm=Math.max(1,Math.floor(raw*m));
  r.hp=Math.max(0,r.hp-dm);t.lastWhy=why;
  afx({type:'hit',target:t.uid,val:dm,crit:o.crit,delay:fxDelay+(o.d==null?260:o.d)});
  if(r.hp===0)drop(t);
  else if(dt==='cold'&&t.st.wet&&!big(t)&&!t.st.stun){t.st.stun=1;logB(nm(t)+'의 젖은 몸이 얼어붙었다!','sys');afx({type:'text',target:t.uid,text:'얼어붙음',color:'#9fd3ff',delay:fxDelay+460})}
  return dm;
}
function wtxt(dm,t){return dm+(t.lastWhy&&t.lastWhy.length?'('+t.lastWhy.join('·')+')':'')}
function drop(t){
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
function applyOn(t,o){
  if(!o||!up(t))return;
  const say=(k,txt,col)=>{logB(josa(nm(t),'이')+' '+txt,hk(t));afx({type:'text',target:t.uid,text:ST_N[k],color:col,delay:fxDelay+460})};
  const tooBig=()=>{logB(josa(nm(t),'은')+' 너무 거대해 꿈쩍도 하지 않는다','sys');return true};
  if(o.stun){t.st.stun=Math.max(t.st.stun||0,o.stun);say('stun','얼어붙었다!','#9fd3ff')}
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
  arr(def.guests).forEach(id=>{if(pids.includes(id)||!SC.companions[id])return;if(!compKnown(id)){const mx=compMaxHp(id);S.comp[id]=Object.assign(S.comp[id]||{ch:{}},{hp:mx,hpMax:mx})}pids.push(id)});
  if(def.scale){const n=Math.max(0,pids.length-(def.scaleFree||0));for(let i=0;i<n&&ids.length<5;i++)ids.push(def.scale[i%def.scale.length])}
  const units=[{uid:'hero',side:'pc',kind:'hero',id:'hero',name:S.hero.name,art:'hero',row:rowPref('hero')}];
  pids.forEach(id=>units.push({uid:id,side:'pc',kind:'comp',id,name:COMP(id).name,art:COMP(id).art,row:rowPref(id)}));
  const en=ids.map(mkFoe);
  const cnt={},seen={};en.forEach(e=>cnt[e.name]=(cnt[e.name]||0)+1);
  en.forEach(e=>{if(cnt[e.name]>1){seen[e.name]=(seen[e.name]||0)+1;e.name+=' '+'ABCDE'[seen[e.name]-1]}});
  // 동료가 많을수록 우두머리·정예도 단단해진다
  if(def.perPC&&pids.length)en.forEach(e=>{const E=SC.enemies[e.id];if(E.boss||E.elite){e.hp+=def.perPC.hp*pids.length;e.hpMax=e.hp}});
  const mods=[];
  arr(def.mods).forEach(m=>{if(ok(m.if)){en.forEach(e=>{if(m.hp)e.hp=Math.max(1,e.hp+m.hp);if(m.ac)e.ac+=m.ac;if(m.atk)e.atk+=m.atk});mods.push(m.why)}});
  units.push(...en);
  units.forEach(u=>{if(u.side==='pc'){u.st={};u.buffs=[];u.saves={s:0,f:0};u.high=false;u.react=true}u.ini=d(20)+iniMod(u)});
  const ord=units.map(u=>({uid:u.uid,ini:u.ini,pc:u.side==='pc'?1:0}));
  // 두 번째 차례(*)는 움직이기만 한다 — 상태와 표면 피해는 첫 차례에만 흐른다
  if(def.extraTurn&&pids.length>=def.extraTurn)en.filter(e=>SC.enemies[e.id].boss).forEach(e=>ord.push({uid:e.uid+'*',ini:e.ini-10,pc:0}));
  ord.sort((a,b)=>b.ini-a.ini||b.pc-a.pc);
  const B=S.battle={def,kind,units,order:ord.map(o=>o.uid),turn:-1,round:1,log:[],target:en[0].uid,surf:{},field,nE:en.length,
    surprise:ambush?'pc':def.surprise||null,over:null,res:null,last:null,tr:null};
  if(field.water){ZONES.forEach(z=>B.surf[z]={t:'water',r:99});units.forEach(u=>{if(!u.fly)u.st.wet=2})}
  for(const z in (def.surf||{}))B.surf[z]={t:def.surf[z],r:def.surf[z]==='fire'?fireLife():SURF[def.surf[z]].r};
  S.mode='combat';S.notice=null;cmenu=null;fxDelay=0;
  logB(def.intro?tpl(def.intro):(ambush?'매복이다! ':'')+josa(nameList(ids),'이')+' 나타났다!','sys');
  if(pids.length)logB('함께 싸운다: '+pids.map(id=>COMP(id).name).join(', '),'sys');
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
  const ids=g.e.slice(),n=party().length,extra=n?n+(n>=2&&Math.random()<0.25?1:0):0;
  const singles=pool.filter(x=>x.e.length===1&&!SC.enemies[x.e[0]].elite&&!arr(SC.enemies[x.e[0]].skills).some(k=>k.summon)).map(x=>x.e[0]);
  for(let i=0;i<extra&&ids.length<5&&singles.length;i++)ids.push(singles[rint(0,singles.length-1)]);
  startBattle({enemies:ids,perPC:{hp:12}},'random',ambush);
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
  if(up(u)&&u.st.poison){const p=u.st.poison,dm=hurt(u,rollDice(p.dmg).total,'poison');if(dm)logB(nm(u)+' — 독 피해 '+wtxt(dm,u),hk(u));if(--p.t<=0)delete u.st.poison}
  if(!up(u))return false;
  if(u.st.stun){if(--u.st.stun<=0)delete u.st.stun;logB(josa(nm(u),'은')+' 얼어붙어 움직이지 못한다','sys');afx({type:'text',target:u.uid,text:'얼어붙음',color:'#9fd3ff'});return false}
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
function autoFor(u){return u.kind==='comp'&&!!(S.opt&&S.opt.autoComp)}
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
        if(u.st.stun)logB(josa(nm(u),'은')+' 얼어붙어 움직이지 못한다','sys');
        else{B.tr={act:1,bonus:1,move:u.st.prone||u.st.restrain?0:1};if(!checkEnd())foeTurn(u)}
      }else{if(startTurn(u)&&!checkEnd())foeTurn(u);endTurnFx(u)}
      fxDelay+=520;if(checkEnd())return;continue;
    }
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
  ['weak','blind','taunt'].forEach(k=>{if(u.st[k]&&--u.st[k]<=0){delete u.st[k];if(k==='taunt')delete u.st.tauntBy}});
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
  const E=E_(e),P=foeProfile(e,sk),extra=[];
  // 오르덴의 수호: 앞열에 선 오르덴이 다른 아군을 노린 근접 공격을 막아선다 (라운드마다 한 번)
  const g=!P.ranged&&pcs().find(u=>u.kind==='comp'&&COMP(u.id).guard&&u!==t&&up(u)&&u.row==='front'&&u.react&&!u.st.stun&&!u.st.prone);
  if(g){g.react=false;extra.push(nm(g)+'의 수호');afx({type:'text',target:g.uid,text:'수호',color:'#8fb6ff',delay:fxDelay+100})}
  const r=attack(e,t,P,{extraDis:extra});
  if(!r.hit)return;
  if(E.drain&&r.dm){const v=Math.max(1,Math.floor(r.dm*E.drain));e.hp=Math.min(e.hpMax,e.hp+v);logB(josa(nm(e),'이')+' 피를 빨아 HP '+v+' 회복','foe')}
  if(E.poison&&up(t)&&Math.random()<E.poison.p)applyOn(t,{poison:E.poison.turns,pdmg:E.poison.dmg});
  if(sk&&sk.onHit)applyOn(t,sk.onHit);
}
// 공격 한 번: d20 + 명중 ≥ 방어. 1은 언제나 빗나가고, 치명 범위는 언제나 맞는다(피해 주사위 두 배)
function attack(a,t,P,o){
  o=o||{};const B=S.battle;
  const m=atkMode(a,t,P,o.extraDis),hm=heightMod(a,t,P),rr=d20(a,m.mode),r=rr.r;
  let bonus=P.hit+hm,ins=0;
  if(a.st.insp){ins=d(6);bonus+=ins;delete a.st.insp}
  const tot=r+bonus,ac=acOf(t),crit=r>=P.crit,hit=r!==1&&(crit||tot>=ac),wasDown=t.side==='pc'&&!up(t);
  if(P.spell||P.ranged)afx({type:'cast',from:a.uid,to:t.uid,color:P.dtype==='fire'?'#ffa95e':P.dtype==='cold'?'#bfe6ff':P.spell?'#9fc8ff':'#e8e2d2'});
  else afx({type:'lunge',who:a.uid,dir:a.side==='pc'?1:-1});
  const dt=(rr.dice.length>1?'d20['+rr.dice.join(', ')+'] '+(m.mode==='adv'?'유리':'불리')+'→'+r:'d20('+r+')')+(rr.notes.length?' ('+rr.notes.join(', ')+')':'')+' '+sign(P.hit)+(hm?' 고지대 '+sign(hm):'')+(ins?' 격려 +'+ins:'')+' = '+tot+' vs 방어 '+ac;
  const why=m.mode!=='normal'?' ['+(m.mode==='adv'?'유리: '+m.adv.join(', '):'불리: '+m.dis.join(', '))+']':'';
  if(a.hid)delete a.hid;
  if(a.side==='pc')B.last={r,dice:rr.dice,txt:P.name+' '+dt+(hit?(crit?' → 치명타!':' → 명중'):' → 빗나감')+why};
  if(!hit){logB(nm(a)+'의 '+P.name+' — '+nm(t)+'에게 빗나갔다'+(a.side==='foe'?' ('+tot+' vs 방어 '+ac+')':''),lk(a));afx({type:'miss',target:t.uid,delay:fxDelay+260});return {hit:false}}
  let v=P.dmg(crit),sn='';
  if(o.sneak){const sv=rollDice(Math.ceil(S.hero.level/2)+'d6',crit).total;v+=sv;sn=' (기습 +'+sv+')'}
  const dm=hurt(t,v,P.dtype,{crit});
  if(wasDown)return {hit:true,dm:0,crit};
  if(a.side==='pc')B.last.txt+=' · 피해 '+dm+sn;
  logB(nm(a)+'의 '+P.name+' — '+nm(t)+'에게 '+(crit?'치명타! ':'')+(dm?wtxt(dm,t)+' 피해'+sn:'피해 없음')+(t.side==='foe'&&!up(t)?' · 쓰러뜨렸다!':''),lk(a));
  return {hit:true,dm,crit};
}

// ── 아군의 행동
function abOf(k){return SC.combatSkills[k]}
function costKey(ab){return ab.cost==='bonus'?'bonus':'act'}
function unitSkills(u){
  if(u.kind==='hero')return knownSkills();
  return (COMP(u.id).skills||[]).filter(k=>abOf(k).lv<=S.hero.level);
}
// 쓸 수 없는 이유 (쓸 수 있으면 null)
function resWhy(u,k){
  const ab=abOf(k),B=S.battle;
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
function throwHit(u){return (u.kind==='hero'?statVal('민첩')+prof():COMP(u.id).dex+2+lvB())-(u.st.weak?2:0)}
function rockP(u){const s=u.kind==='hero'?statVal('힘'):COMP(u.id).str;return {name:'돌 던지기',hit:(u.kind==='hero'?s+prof():s+2+lvB())-(u.st.weak?2:0),ranged:true,crit:20,dtype:'phys',dice:'1d4'+sign(Math.max(0,s)),dmg:c=>rollDice('1d4',c).total+Math.max(0,s)}}
function fleeInfo(){return {bonus:statVal('민첩')+(S.cls==='rogue'?3:0),dc:10+Math.max(...alive().map(e=>e.lv))}}
function bossU(){return foes().find(e=>E_(e).boss)||foes()[0]}
function specialOf(id){return arr(S.battle.def.special).find(x=>x.id===id)}
function specialReady(sp){const b=bossU();return ok(sp.if)&&up(b)&&b.hp<=b.hpMax*(sp.below||1)&&S.hero.mp>=(sp.mp||0)}
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
    if(ab.kind==='save'&&ab.area==='all')return {ok:true,roll:true};
    if(ab.kind==='save'||ab.kind==='surface'||ab.kind==='darts')return tok(t)?{ok:true,roll:ab.kind==='save'}:no('대상을 고른다');
    if(ab.kind==='heal'){if(!au)return pcs().some(p=>!p.out&&R(p).hp<R(p).hpMax)?{ok:true,pick:true}:no('다친 아군이 없다');const a=U(au);return a&&!a.out&&R(a).hp<R(a).hpMax?{ok:true}:no('회복할 수 없다')}
    if(ab.kind==='self')return R(u).hp<R(u).hpMax?{ok:true}:no('HP가 가득하다');
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
    B.tr.act=0;const sp=specialOf(arg),{dc}=specialDC(sp),rr=rollD20('normal'),r=rr.r,bonus=statVal(sp.stat)+profBonus(),tot=r+bonus,b=bossU();
    h.mp-=sp.mp||0;
    const okS=r!==1&&(r===20||tot>=dc);
    B.last={r,txt:sp.label+' d20('+r+') '+sign(bonus)+' = '+tot+' vs DC '+dc+(okS?' → 성공!':' → 실패')};
    afx({type:'cast',from:'hero',to:b.uid,color:'#e6ebf2'});
    if(okS){B.over=sp.outcome;B.res={title:sp.label+' — 성공!',lines:[]};logB(sp.label+' — 성공했다!','me');afx({type:'text',target:b.uid,text:'낙인이 부서진다',color:'#ffffff',delay:300})}
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
  if(['darts','save','surface','debuffAll','taunt'].includes(ab.kind))delete u.hid;
  if(ab.kind==='attack'){
    const P=profile(u,ab),sn=sneakOK(u,t,P),r=attack(u,t,P,{sneak:sn});
    if(r.hit){if(sn)B.tr.sneak=true;applyOn(t,ab.onHit);if(ab.surface)setSurf(zk(t),ab.surface)}
    if(P.dtype==='fire')fireTouch(zk(t));return;
  }
  if(ab.kind==='darts'){
    const hits=[];afx({type:'cast',from:u.uid,to:t.uid,color:'#9fc8ff'});
    const db=u.kind==='hero'?bsum('dmg'):bsumU(u,'dmg');
    for(let i=0;i<ab.darts;i++){const x=up(t)?t:alive().find(y=>!y.hid);if(!x)break;const dm=hurt(x,rollDice(ab.dmg).total+(i?0:db),ab.dtype,{d:260+i*120});hits.push(nm(x)+' '+wtxt(dm,x))}
    B.last={r:null,txt:ab.name+' — '+hits.join(', ')};logB(lab+' — '+hits.join(', ')+(t&&!up(t)?' · 쓰러뜨렸다!':''),'me');return;
  }
  if(ab.kind==='save'){
    const tg=ab.area==='all'?alive():ab.area==='row'?zoneUnits(zk(t)):[t];
    const dc=spellDC(u,ab),base=rollDice(ab.dmg).total+(u.kind==='hero'?(ab.addStat?statVal(ab.stat):0)+bsum('dmg'):bsumU(u,'dmg'))+(ab.dtype==='fire'?ufx(u).fire||0:0),parts=[];
    tg.forEach((x,i)=>{
      const sv=d(20)+saveMod(x,ab.save),okS=sv>=dc,v=okS?(ab.half?Math.floor(base/2):0):base;
      afx({type:'cast',from:u.uid,to:x.uid,color:ab.dtype==='fire'?'#ffa95e':ab.dtype==='radiant'?'#ffe6a0':ab.dtype==='thunder'?'#d8c8ff':'#f0a8ff'});
      if(v>0){const dm=hurt(x,v,ab.dtype,{d:300+i*90});parts.push(nm(x)+' '+(okS?'(내성 성공) ':'')+wtxt(dm,x)+(up(x)?'':' 쓰러짐'))}
      else{parts.push(nm(x)+' 내성 성공');afx({type:'miss',target:x.uid,delay:fxDelay+300})}
      if(!okS)applyOn(x,ab.onFail);
    });
    if(ab.surface&&t)setSurf(zk(t),ab.surface);
    if(ab.dtype==='fire')[...new Set(tg.map(zk))].forEach(fireTouch);
    if(ab.partyHeal)pcs().filter(p=>!p.out).forEach(p=>{const v=heal(p,rollDice(ab.partyHeal).total);if(v)parts.push(nm(p)+' HP +'+v)});
    B.last={r:null,txt:ab.name+' — 내성 DC '+dc+' · 피해 '+base};
    logB(lab+' — '+parts.join(' · '),'me');return;
  }
  if(ab.kind==='sweep'){const P=profile(u,ab);alive().filter(x=>canMelee(u,x,false)).forEach(x=>{attack(u,x,P);fxDelay+=220});return}
  if(ab.kind==='pierce'){
    const P=profile(u,ab);attack(u,t,P);
    const back=t.row==='front'?alive().find(x=>x.row==='back'&&!x.hid):null;
    if(back){fxDelay+=260;attack(u,back,P)}return;
  }
  if(ab.kind==='heal'){
    const a=U(au),v=heal(a,rollDice(ab.heal).total+(u.kind==='hero'&&ab.stat?statVal(ab.stat):0));
    B.last={r:null,txt:ab.name+' → '+nm(a)+' HP +'+v};logB(lab+' — '+nm(a)+' HP +'+v,'me');return;
  }
  if(ab.kind==='self'){const v=heal(u,rollDice(ab.heal).total+(ab.healLv?h.level:0));B.last={r:null,txt:ab.name+' → HP +'+v};logB(lab+' — HP +'+v,'me');return}
  if(ab.kind==='buff'){upPCs().forEach(p=>{p.buffs.push(Object.assign({t:ab.turns,name:ab.name},ab.buff));fx_(p,ab.name)});B.last={r:null,txt:ab.name+' — '+ab.desc};logB(lab+'! '+ab.desc,'me');return}
  if(ab.kind==='debuffAll'){alive().forEach(e=>{for(const s in ab.status)e.st[s]=Math.max(e.st[s]||0,ab.status[s]);fx_(e,ab.name,'#c8ccd4')});B.last={r:null,txt:ab.name+' — '+ab.desc};logB(lab+'! '+ab.desc,'me');return}
  if(ab.kind==='taunt'){alive().forEach(e=>{e.st.taunt=ab.turns;e.st.tauntBy=u.uid;fx_(e,'도발당함','#ff9a8a')});B.last={r:null,txt:ab.name};logB(lab+'! 적들이 '+josa(nm(u),'을')+' 노려본다','me');return}
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
    const hk_=sk.find(k=>abOf(k).kind==='heal'&&can(k));
    if(hk_)useAb(u,hk_,null,downed.uid);
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
  sk.forEach(k=>{const ab=abOf(k);if(B.over||!can(k)||ab.cost!=='bonus')return;
    if(ab.kind==='taunt'&&n>=2&&u.row==='front'&&r.hp>r.hpMax*0.5&&!alive().some(e=>e.st.taunt))useAb(u,k);
    else if(ab.kind==='buff'&&upPCs().length+n>=4&&!(u.buffs||[]).some(b=>!b.neg))useAb(u,k);
    else if(ab.kind==='surface'&&B.tr.act){const rows=['front','back'].map(rw=>({z:'foe-'+rw,c:standing('foe',rw).length})).filter(x=>x.c>=2&&!(B.surf[x.z]&&B.surf[x.z].t==='oil'));
      if(rows.length){const x=zoneUnits(rows[0].z)[0];setT(x);useAb(u,k,x)}}
  });
  if(dead())return;
  // 4) 자리: 근접형은 앞열로, 원거리형은 뒷열로
  const P0=profile(u,null);
  if(B.tr.move&&!P0.ranged&&!P0.reach&&u.row==='back'&&!u.st.restrain&&!(u.kind==='hero'&&cls().row==='back'))doIt(u,'move','front');
  else if(B.tr.move&&P0.ranged&&u.row==='front'&&frontWall('foe')&&!oaFoes(u).length&&u.kind!=='hero')doIt(u,'move','back');
  if(dead())return;
  // 5) 행동: 가장 좋은 공격을 고른다
  if(B.tr.act){
    const opts=[];const P=profile(u,null),bt=bestFoe(u,P);
    if(bt)opts.push({s:1,go:()=>{setT(bt);doIt(u,'attack')}});
    // 불을 다루면 기름이 깔린 열을 노린다
    const oilT=P.dtype==='fire'&&alive().find(x=>canHit(u,x,P)&&surfOf(x)==='oil');
    if(oilT)opts.push({s:5,go:()=>{setT(oilT);doIt(u,'attack')}});
    sk.forEach(k=>{const ab=abOf(k);if(!can(k)||ab.cost==='bonus')return;
      if(ab.kind==='attack'){const Q=profile(u,ab),x=bestFoe(u,Q);if(x)opts.push({s:ab.mp===0?1.4:ab.uses?3:2.2,go:()=>{setT(x);useAb(u,k,x)}})}
      else if(ab.kind==='darts'){const x=alive().find(y=>!y.hid);if(x)opts.push({s:2.4,go:()=>{setT(x);useAb(u,k,x)}})}
      else if(ab.kind==='save'){
        if(ab.area==='all'){if(n>=2)opts.push({s:1.4*n,go:()=>useAb(u,k,null)})}
        else if(ab.area==='row'){const z=['front','back'].map(rw=>'foe-'+rw).sort((a,b)=>zoneUnits(b).length-zoneUnits(a).length)[0],c=zoneUnits(z).length;if(c>=2){const x=zoneUnits(z)[0];opts.push({s:1.6*c,go:()=>{setT(x);useAb(u,k,x)}})}}
        else{const x=alive().filter(y=>!y.hid).sort((a,b)=>a.hp-b.hp)[0];if(x)opts.push({s:1.3,go:()=>{setT(x);useAb(u,k,x)}})}
      }
      else if(ab.kind==='sweep'){const c=alive().filter(x=>canMelee(u,x,false)).length;if(c>=2)opts.push({s:1.6*c,go:()=>useAb(u,k)})}
      else if(ab.kind==='pierce'){const x=bestFoe(u,profile(u,ab));if(x)opts.push({s:x.row==='front'&&alive().some(y=>y.row==='back')?4:2.5,go:()=>{setT(x);useAb(u,k,x)}})}
      else if(ab.kind==='debuffAll'&&n>=3)opts.push({s:3,go:()=>useAb(u,k)});
    });
    if(opts.length){opts.sort((a,b)=>b.s-a.s);opts[0].go()}
    else if(!bt&&!P0.ranged&&B.tr.act){const x=alive().find(y=>!y.hid);if(x){setT(x);doIt(u,'throw','돌')}else doIt(u,'dodge')}
  }
}

// ── 전투 끝
function winBattle(){
  const B=S.battle,h=S.hero,out=[],got=[];let xp=0,gold=0;
  pcs().forEach(p=>{if(R(p).hp<=0){R(p).hp=1;out.push(nm(p)+' HP 1로 일어남')}});
  foes().forEach(e=>{
    const E=E_(e);
    let x=E.xp;if(e.lv<=h.level-3)x=Math.max(1,Math.floor(x/2));
    xp+=x;gold+=rint(E.gold[0],E.gold[1]);
    // uniq: 이미 가진 것은 다시 나오지 않는다. pity: 그만큼 못 얻으면 다음에는 반드시 나온다
    arr(E.drops).forEach(dr=>{
      const item=tpl(dr.item);if(!SC.items[item]||(dr.once&&S.flags[dr.once])||(dr.uniq&&(countItem(item)>0||got.includes(item))))return;
      let hit=Math.random()<dr.p;
      if(!hit&&dr.pity){S.pity[item]=(S.pity[item]||0)+1;if(S.pity[item]>=dr.pity)hit=true}
      if(hit){got.push(item);delete S.pity[item];if(dr.once)S.flags[dr.once]=true}
    });
  });
  // 경험치는 파티가 나눠 갖는다 (동료는 그대의 레벨을 따라 자란다)
  const n=pcs().length;if(n>1)xp=Math.max(1,Math.round(xp/n));
  h.xp+=xp;S.gold+=gold;got.forEach(i=>S.items.push(i));if(got.length){markNew(got);autoEquip(got);newTrinkets(got)}
  out.unshift('경험치 +'+xp+(n>1?' ('+n+'명이 나눔)':''),'금화 +'+gold);got.forEach(i=>out.push(gotLine(i)));
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
  const dest=toGate?'gate':SC.startLoc;
  S.loc=dest;h.hp=Math.ceil(h.hpMax/2);h.mp=Math.ceil(h.mpMax/2);
  for(const id in (S.comp||{}))S.comp[id].hp=Math.max(S.comp[id].hp,Math.ceil(S.comp[id].hpMax/2));
  const lost=Math.floor(S.gold*0.25);S.gold-=lost;
  S.counters.falls=(S.counters.falls||0)+1;
  S.notice=tpl((k.text||'{place}에서 깨어났다.').replace('{place}',SC.locations[dest].name))+(lost?' 주머니가 조금 가벼워졌다. (금화 -'+lost+')':'');
  logp('사냥터에서 쓰러져 '+SC.locations[dest].name+'에서 깨어났다.');
}
function endBattle(){
  const B=S.battle;if(!B||!B.over)return;
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
    if(t<500){if(sh)sh.style.transform='rotate('+(t*.9)+'deg) scale('+(1+.08*Math.sin(t/60))+')';if(nm)nm.textContent=d(20);setTimeout(tick,50);return}
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
  if(m==='end')return SC.endArt||{sky:'dawn',bg:'mountains'};
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
  if(B){const cu=curU();bat={over:!!B.over,surf:B.surf,field:B.field,units:B.units.map(u=>({id:u.uid,side:u.side,row:u.row,k:u.art,high:!!u.high,hid:!!u.hid,prone:!!u.st.prone,down:!up(u),cur:cu===u&&!B.over,target:B.target===u.uid}))}}
  return {cls:S.cls||(S.mk&&S.mk.cls),relic:S.items?hasRelicSafe():false,battle:bat};
}
function hasRelicSafe(){try{return !!S.cls&&hasRelic()}catch(e){return false}}

// ── 그리기
function bar(color,v,max){const b=el('div','bar'),i=el('i');i.style.background=color;i.style.width=Math.max(0,Math.min(100,100*v/max))+'%';b.appendChild(i);return b}
function render(){
  const m=S.mode;
  document.body.classList.toggle('combat',m==='combat');
  document.body.classList.toggle('solo',m==='create');
  $('make').hidden=m!=='create';
  $('hud').hidden=m==='create'||m==='combat';
  $('cside').hidden=m!=='combat';
  $('world').hidden=m!=='world';
  $('event').hidden=m!=='event';
  $('combat').hidden=m!=='combat';
  $('endwrap').hidden=m!=='end';
  $('logwrap').hidden=m!=='end';
  $('freedice').hidden=!(m==='world'&&wtab==='log');
  $('lvwrap').hidden=m==='create'||m==='combat'||!needLevel();
  const nt=$('notice');nt.hidden=!S.notice||!(m==='world'||(m==='event'&&ev()&&ev().camp&&!S.pending));nt.textContent=S.notice||'';
  $('saga').textContent=SC.title+' · '+SC.chapterTitle;
  const sc=$('scene');sc.innerHTML='';
  const para=list=>list.forEach(t=>sc.appendChild(el('p',null,t)));
  if(window.Art)Art.scene(artSpec());
  if(m==='create'){
    $('stitle').textContent='모험가 만들기';para((SC.creation&&SC.creation.intro)||[]);
    $('clock').textContent=MK_STEPS.join(' → ');renderMake();return;
  }
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
    $('stitle').textContent='제1장 끝';
    para(['그대의 선택과 주사위가 새긴 이야기는 이렇게 기록되었다.','이 기록은 제2장으로 그대로 이어진다. 그때까지 세상은 열려 있다 — 계속 사냥하며 힘을 기를 수 있다.']);
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
    const d1=el('div'),l=el('div','ml');l.appendChild(el('span',null,n));l.appendChild(el('span',null,v+'/'+mx));d1.appendChild(l);d1.appendChild(bar(col,v,mx));g.appendChild(d1);
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
  if(pt.length){
    const pm=el('div','pmini');
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
  const w=wpn(),sm=tfx('hero').smite;d0.appendChild(el('div','mini atkline','공격 명중 '+sign(weaponHit())+' · 피해 '+w.dice+sign(weaponDmgBonus())+(sm?'+'+sm:'')+(w.crit?' ('+w.crit+'~20 치명타)':'')+' · 방어 '+heroAC()+' · 숙련 +'+profBonus()));
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
const WTABS=[['explore','탐험'],['party','동료'],['bag','소지품'],['abil','능력'],['log','기록']];
let wtab=(()=>{try{const t=localStorage.getItem(KEY+':tab');return WTABS.some(x=>x[0]===t)?t:'explore'}catch(e){return 'explore'}})();
function setTab(t){if(wtab==='bag'&&t!=='bag'){S.newItems=[];gearPick=null;save()}wtab=t;try{localStorage.setItem(KEY+':tab',t)}catch(e){}render()}
function campHint(id){return arr(SC.camp).some(t=>!S.flags['done_'+t]&&ok(SC.events[t].if)&&(!id||arr(SC.events[t].if.party).includes(id)))}
function renderWorld(){
  const box=$('world');box.innerHTML='';
  const tb=el('div','tabs');tb.setAttribute('role','tablist');
  WTABS.forEach(([id,n])=>{
    const b=el('button',wtab===id?'on':'',n);b.setAttribute('role','tab');b.setAttribute('aria-selected',String(wtab===id));
    if(id==='party'&&party().length)b.appendChild(el('span','cnt',String(party().length)));
    if(id==='party'&&campHint())b.appendChild(el('span','cnt star','✦'));
    if(id==='bag'&&wtab!=='bag'&&S.newItems.length)b.appendChild(el('span','cnt new','새것 '+S.newItems.length));
    b.onclick=()=>setTab(id);tb.appendChild(b);
  });
  box.appendChild(tb);
  const pane=el('div','pane');box.appendChild(pane);
  ({explore:paneExplore,party:renderParty,bag:paneBag,abil:paneAbil,log:paneLog})[wtab](pane);
}
function paneExplore(box){
  const l=L(),xg=el('div','xgrid');box.appendChild(xg);
  const s1=el('section');xg.appendChild(s1);
  s1.appendChild(el('h2',null,'할 수 있는 일'));
  const acts=el('div','card');s1.appendChild(acts);
  arr(l.actions).filter(a=>ok(a.if)).forEach(a=>actBtn(acts,a.label,null,()=>startEvent(a.event),{star:a.star}));
  if(l.encounters)actBtn(acts,'사냥한다','전투를 벌여 경험치와 금화를 얻는다 · 이곳의 적 레벨 '+l.lv,()=>{S.notice=null;startRandomBattle(false)});
  if(l.encounters||arr(l.explore).length)actBtn(acts,'탐색한다','무언가를 찾아내거나, 무언가와 마주친다',explore);
  if(canRest()){const sup=countItem('야영 물자');actBtn(acts,'긴 휴식 — '+restText(l),(l.restFree?'모두 회복 · 짧은 휴식과 기술 충전':sup?'야영 물자 1 (보유 '+sup+') · 모두 회복 · 짧은 휴식과 기술 충전':'야영 물자가 없다 — 절반만 회복')+(campTalk()?' · ✦ 모닥불 곁에서 동료가 할 말이 있다':''),longRest)}
  const sr=(S.rest&&S.rest.short)||0;
  actBtn(acts,'짧은 휴식 ('+sr+'/2)','HP 절반 회복 · 짧은 휴식 기술 충전'+(S.cls==='mage'?' · 마력 절반 회복':'')+(S.cls==='bard'?' · 휴식의 노래 +1d6':'')+' · 긴 휴식으로 다시 채운다',shortRest,{disabled:sr<=0});
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
  s2.appendChild(el('h2',null,'지도 · 이동'));
  const mc=el('div','card');s2.appendChild(mc);
  mc.appendChild(mapSvg());
  const tl=el('div');tl.style.marginTop='8px';mc.appendChild(tl);
  linksOf(S.loc).forEach(k=>{
    const t=SC.locations[k.to];
    actBtn(tl,'→ '+t.name,(t.lv==='안전'?'안전':'레벨 '+t.lv)+(storyAt(k.to)?' · ★ 이야기가 기다린다':''),()=>travel(k.to),{star:storyAt(k.to)});
  });

  const qs=questBlock();
  if(qs){const s3=el('section','narrow-only');xg.appendChild(s3);s3.appendChild(el('h2',null,'퀘스트'));const q=el('div','card');q.appendChild(qs);s3.appendChild(q)}
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
  const f=heroFx(),tot=trinketText(f);
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

  // ── 세트: 모은 부위, 입은 부위, 단계별 효과, 못 모은 부위를 어디서 얻는지
  box.appendChild(el('h2',null,'세트'));
  for(const id in (SC.sets||{})){
    const st=SC.sets[id],worn=setCount(id),have=st.pieces.filter(n=>countItem(n)>0).length;
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

  // ── 소지품
  box.appendChild(el('h2',null,'소지품 · 금화 '+S.gold+(shop?' · 행상인에게 팔 수 있다':'')));
  const inv=el('div','card');box.appendChild(inv);
  const FILT=[['all','전체'],['gear','장비'],['use','물약·투척'],['etc','기타']];
  const grp=n=>{const it=SC.items[n]||{};return it.slot?'gear':it.use||it.throw?'use':'etc'};
  const fs=el('div','filters');FILT.forEach(([k,n])=>{const b=el('button',bagFilter===k?'on':'',n);b.onclick=()=>{bagFilter=k;render()};fs.appendChild(b)});inv.appendChild(fs);
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
    if(it.slot&&it.slot!=='trinket'){const b=el('button','go',it.slot==='weapon'?'쥐기':'착용');b.onclick=()=>equipGear(n);bx.appendChild(b)}
    // 장신구: 누구에게 채울지 고른다
    if(it.slot==='trinket'){
      ['hero'].concat(known).forEach(who=>{const b2=el('button',null,whoName(who));b2.disabled=trinketOn(who)===n;b2.title=whoName(who)+'에게 채운다';b2.onclick=()=>equipTrinket(n,who);bx.appendChild(b2)});
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
    const s=SC.combatSkills[k],known=s.lv<=h.level;
    abl(sk,s.name,abCost(s)+(s.uses&&known?' · 남은 '+usesLeft({kind:'hero'},k):''),s.desc+(known?'':' · 레벨 '+s.lv+'에 익힌다'),!known);
  });

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
function paneLog(box){
  box.appendChild(el('h2',null,'진행 기록 (최근)'));
  const lc=el('div','card');box.appendChild(lc);
  const ul=el('ul');S.log.slice(-25).reverse().forEach(t=>ul.appendChild(el('li',null,t)));lc.appendChild(ul);
  if(!ul.children.length)lc.appendChild(el('div','sub','아직 기록이 없다.'));
  box.appendChild(el('h2',null,'설정'));
  const so=el('div','card');box.appendChild(so);
  const lb=el('label','sub setrow'),cb=el('input');cb.type='checkbox';cb.id='karmic';cb.checked=!!(S.opt&&S.opt.karmic);
  cb.onchange=()=>{S.opt.karmic=cb.checked;save()};
  lb.appendChild(cb);lb.appendChild(document.createTextNode(' 업보 주사위 — 이야기 판정에서 두 번 연달아 실패하면 다음 판정이 유리해진다'));so.appendChild(lb);
  const la=el('label','sub setrow'),ca=el('input');ca.type='checkbox';ca.id='autocomp';ca.checked=!!S.opt.autoComp;
  ca.onchange=()=>{S.opt.autoComp=ca.checked;save()};
  la.appendChild(ca);la.appendChild(document.createTextNode(' 동료 자동 전투 — 동료의 차례를 알아서 진행한다 (그대의 차례만 고른다)'));so.appendChild(la);
  const lg=el('label','sub setrow'),cg=el('input');cg.type='checkbox';cg.id='autogear';cg.checked=S.opt.autoGear!==false;
  cg.onchange=()=>{S.opt.autoGear=cg.checked;save()};
  lg.appendChild(cg);lg.appendChild(document.createTextNode(' 좋은 장비 저절로 끼기 — 새로 얻은 장비가 지금 것보다 좋으면 바꿔 낀다 (빈 부위는 늘 채운다, 세트 효과를 받는 부위는 그대로 둔다)'));so.appendChild(lg);
  so.appendChild(el('div','kbd','단축키 — 지도: 1~5 탭 · 이야기: 숫자로 선택지, Enter로 굴리기·계속 · 전투: 숫자로 행동, E 턴 끝, Enter 계속'));
}
// 동료와 전투 시작 위치
function renderParty(box){
  const ids=Object.keys(SC.companions||{}).filter(compKnown);
  box.appendChild(el('h2',null,'진형'));
  const fc=el('div','card');box.appendChild(fc);
  fc.appendChild(el('div','sub','전투 시작 위치 — 근접 공격은 앞열에서만 한다. 앞열에 누가 서 있는 한, 적의 근접 공격은 뒷열에 닿지 않는다.'));
  const rowSeg=id=>{const sg=el('div','seg');['front','back'].forEach(r=>{const b=el('button',rowPref(id)===r?'on':'',ROWN[r]);b.onclick=()=>{S.rows[id]=r;save();render()};sg.appendChild(b)});return sg};
  ['hero'].concat(ids).forEach(id=>{const fr=el('div','formrow'),nb=el('div');nb.appendChild(el('b',null,id==='hero'?S.hero.name:COMP(id).name));if(id!=='hero'&&!compHere(id))nb.appendChild(el('span','mini',' 떨어져 있다'));fr.appendChild(nb);fr.appendChild(rowSeg(id));fc.appendChild(fr)});

  box.appendChild(el('h2',null,'동료'));
  if(!ids.length)box.appendChild(el('div','card sub','아직 함께하는 동료가 없다. 숲과 계단에서 누군가를 만날지도 모른다.'));
  ids.forEach(id=>{
    const C=COMP(id),r=S.comp[id],here=compHere(id),d1=el('div','card comp');
    const t=el('div','hudtop'),nb=el('div');nb.appendChild(el('b',null,C.name));nb.appendChild(el('span','mini',' · '+C.title));t.appendChild(nb);t.appendChild(el('span','mini',here?'함께 있다':'지금은 떨어져 있다'));d1.appendChild(t);
    if(r){d1.appendChild(bar('var(--hp)',r.hp,r.hpMax));d1.appendChild(el('div','mini','HP '+r.hp+'/'+r.hpMax+' · 방어 '+(C.ac+compMod(id,'ac'))+' · '+C.attack.name+' 명중 '+sign(C.attack.hit+lvB()+compMod(id,'hit'))+' 피해 '+C.attack.dice+sign(C.attack.dmgB+lvB()+compMod(id,'dmg')+(C.attack.dtype==='fire'?tfx(id).fire||0:0))+(C.attack.ranged?' (원거리)':C.attack.reach?' (긴 창)':'')))}
    // 호감
    const v=apVal(id),tr=apTier(v),ef=[];if(tr.hit)ef.push('명중 '+sign(tr.hit));if(tr.ac)ef.push('방어 +'+tr.ac);
    const apl=el('div','mini');apl.appendChild(el('span','ap '+(v>=3?'up':v<=-3?'down':''),(C.apName||'호감')+' '+sign(v)+' · '+tr.n));apl.appendChild(document.createTextNode((ef.length?' ('+ef.join(', ')+')':'')+(C.leaveAt!=null&&v<=C.leaveAt+2?' · 이대로라면 떠날지도 모른다':'')));d1.appendChild(apl);
    const pk=arr(C.perks).filter(p=>ok(p.if));if(pk.length)d1.appendChild(el('div','mini','보상: '+pk.map(p=>p.name+' ('+['hit','ac','dmg'].filter(k=>p[k]).map(k=>({hit:'명중',ac:'방어',dmg:'피해'})[k]+' +'+p[k]).join(', ')+')').join(', ')));
    const tn=trinketOn(id);if(tn){const tl=el('div','mini','장신구: ');tl.appendChild(rarName(tn));tl.appendChild(document.createTextNode(' — '+trinketText(SC.items[tn].fx)));d1.appendChild(tl)}
    if(campHint(id))d1.appendChild(el('div','sub','✦ 쉼터에서 긴 휴식을 하면 할 말이 있는 것 같다'));
    if(!here&&C.awayText)d1.appendChild(el('div','sub',C.awayText));
    // 자세한 이야기와 기술은 접어 둔다
    const dt=el('details');dt.appendChild(el('summary',null,'이야기 · 도와주는 판정 · 기술'));
    dt.appendChild(el('div','sub',C.blurb));
    dt.appendChild(el('div','sub','도와주는 판정: '+arr(C.profs).join(', ')));
    (C.skills||[]).forEach(k=>{const ab=SC.combatSkills[k],kn=ab.lv<=S.hero.level;const x=el('div','sub');if(!kn)x.style.opacity='.6';x.textContent='· '+ab.name+' ['+abCost(ab)+(ab.uses&&kn&&r?', 남은 '+usesLeft({kind:'comp',id},k):'')+'] '+ab.desc+(kn?'':' · 레벨 '+ab.lv);dt.appendChild(x)});
    d1.appendChild(dt);
    box.appendChild(d1);
  });
  Object.keys(SC.companions||{}).filter(id=>S.flags[id+'_left']).forEach(id=>box.appendChild(el('div','sub',COMP(id).name+' — 그대 곁을 떠났다')));
  box.appendChild(el('div','sub','동료는 곁에 있을 때 그대의 선택에 반응한다. 호감이 높으면 더 잘 싸우고, 바닥나면 떠난다. 동료가 능한 기술의 이야기 판정은 곁에 있으면 유리하다.')).style.marginTop='8px';
}
// 등급 + 종류 (+ 종류와 이름이 다른 부위: 방어구 · 몸)
function kindName(n){const it=SC.items[n]||{},k=it.kind||'소지품';return (it.rar?RAR[it.rar]+' ':'')+k+(it.slot&&slotName(it.slot)!==k&&it.slot!=='trinket'?' · '+slotName(it.slot):'')}
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
  const ids=Object.keys(SC.locations).filter(visible);
  const adj=linksOf(S.loc).map(k=>k.to);
  const drawn={};
  ids.forEach(a=>linksOf(a).forEach(k=>{
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
    svg.appendChild(g);
  });
  return svg;
}

function stTags(u){
  const t=[],st=u.st||{};
  if(st.stun)t.push('얼어붙음');if(st.poison)t.push('독 '+st.poison.t);if(st.weak)t.push('명중 -2');if(st.blind)t.push('연막');if(st.burn)t.push('불붙음');
  if(st.prone)t.push('넘어짐');if(st.restrain)t.push('속박');if(st.wet)t.push('젖음');if(st.taunt)t.push('도발당함');
  if(u.hid)t.push('숨음');if(u.high)t.push('고지대');if(u.dodge)t.push('회피');
  (u.buffs||[]).forEach(b=>t.push(b.name+' '+['atk','dmg','ac'].filter(k=>b[k]).map(k=>({atk:'명중',dmg:'피해',ac:'방어'})[k]+sign(b[k])).join(' ')+' ('+b.t+')'));
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
  t.appendChild(el('span','mini','방어 '+acOf(p)+(p.kind==='hero'?' · 마력 '+S.hero.mp+'/'+S.hero.mpMax:'')));c.appendChild(t);
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
      const {dc,why}=specialDC(sp),bonus=statVal(sp.stat)+profBonus();c=canDo(u,'special',sp.id);
      add('✦ '+sp.label,sp.stat+' '+sign(bonus)+' vs DC '+dc+(why.length?' ('+why.join(', ')+')':'')+' · 성공 '+pct(chance(bonus,dc,'normal',0,{lucky:race()&&race().lucky}))+' · 마력 '+sp.mp+' · '+sp.note,()=>pcAct('special',sp.id),c,'wide');
    });
    // 차례를 넘기는 두 버튼은 늘 같은 자리(행동판 맨 아래)에 둔다
    const fin=el('div','acts fin');card.appendChild(fin);
    add('자동','이 차례는 알아서 싸운다',autoNow,{ok:true},'',fin);
    add('턴 끝 →',spent()?'':'남은 행동을 버린다',endTurn,{ok:true},'go',fin);
    card.appendChild(el('div','kbd','단축키 — 숫자: 행동·메뉴 고르기 · E: 턴 끝 · Esc: 메뉴 닫기'));
    const sub=el('div');sub.style.marginTop='8px';
    if(cmenu==='skill')ks.forEach(k=>{
      const ab=abOf(k),c=canDo(u,'skill',k);let s=ab.desc+' · '+abCost(ab)+(ab.uses?' (남은 '+usesLeft(u,k)+')':'');
      if(t&&up(t)){
        if(ab.kind==='attack'||ab.kind==='pierce'){const Q=profile(u,ab);s+=canHit(u,t,Q)?' · 명중 '+pct(hitP(u,t,Q)):''}
        else if(ab.kind==='save'&&ab.area!=='all')s+=' · '+(ab.area==='row'?zoneName(zk(t))+' '+zoneUnits(zk(t)).length+'명 · ':'')+'내성 실패 '+pct(failP(t,ab.save,spellDC(u,ab)));
        else if(ab.kind==='surface')s+=' · '+zoneName(zk(t));
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
function renderChoices(){
  const n=ev(),box=$('choices'),p=S.pending||S.reroll;box.innerHTML='';
  n.choices.forEach(c=>{
    const locked=c.requires&&!ok(c.requires);
    const b=el('button','opt'+((p?p.choiceId:S.sel)===c.id?' on':''));
    b.appendChild(document.createTextNode(c.id+'. '+txt(c.label)));
    let info=choiceInfo(c);
    if(locked)info='[잠김] 필요: '+(txt(c.reqText)||'조건 미달')+' / '+info;
    b.appendChild(el('small',null,info));
    b.disabled=!!p||locked||rolling||needLevel();
    b.onclick=()=>{if(c.roll===false){resolve(c,null);return}S.sel=c.id;save();renderChoices();renderMods();updateRollBtn()};
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
  if(p.roll)head.appendChild(el('div','sub',p.choiceId+'번 '+p.label+' · '+calcText(p.roll)));
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
  (SC.summary||[]).forEach(x=>{const hit=x.cases.find(c=>ok(c.if));rows.push([x.label,tpl(hit?hit.t:(x.else||'-'))])});
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
  const t=SC.title+' · '+SC.chapterTitle+'\n'+summaryRows().map(r=>r[0]+': '+r[1]).join('\n')+'\n\n'+S.log.map(x=>'- '+x).join('\n');
  const done=m=>{$('copied').textContent=m;setTimeout(()=>{$('copied').textContent=''},2000)};
  // 클립보드가 막힌 환경에서는 기록을 펼쳐 직접 복사하게 한다
  const manual=()=>{const b=$('copybox');b.value=t;b.hidden=false;b.focus();b.select();done('아래 글을 길게 눌러 복사하세요')};
  try{navigator.clipboard.writeText(t).then(()=>done('복사됨'),manual)}catch(e){manual()}
};
$('goon').onclick=()=>{S.mode='world';S.loc='gate';save();render();toTop()};

// ── 처음부터 (두 번 눌러 확인)
let armed=0;
$('restart').onclick=()=>{
  const b=$('restart');
  if(Date.now()-armed>3000){armed=Date.now();b.textContent='정말 처음부터? 한 번 더 누르세요';setTimeout(()=>{if(Date.now()-armed>=3000)b.textContent='처음부터 다시'},3000);return}
  armed=0;b.textContent='처음부터 다시';
  try{localStorage.removeItem(KEY)}catch(e){}
  gen++;rolling=false;mkRolling=false;
  S=fresh();ampOn=foOn=false;cmenu=null;shopOpen=false;wtab='explore';try{localStorage.removeItem(KEY+':tab')}catch(e){}save();render();toTop();
};

// ── 자유 주사위
let ftype=20,fhist=[];
[4,6,8,10,12,20].forEach(n=>{const b=el('button',n===20?'on':'','d'+n);b.dataset.n=n;b.onclick=()=>{ftype=n;document.querySelectorAll('#ftypes button').forEach(x=>x.classList.toggle('on',+x.dataset.n===n))};$('ftypes').appendChild(b)});
$('froll').onclick=()=>{const r=d(ftype);$('fres').textContent='d'+ftype+' = '+r;fhist.unshift('d'+ftype+':'+r);fhist=fhist.slice(0,8);$('fhist').textContent='최근: '+fhist.join(' / ')};
$('freset').onclick=()=>{fhist=[];ftype=20;$('fres').textContent='';$('fhist').textContent='';document.querySelectorAll('#ftypes button').forEach(x=>x.classList.toggle('on',+x.dataset.n===20))};

// ── 단축키: 숫자로 선택지·행동, Enter로 굴리기·계속 (글자를 입력하는 중에는 쓰지 않는다)
document.addEventListener('keydown',e=>{
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
    else if(e.key==='Escape'&&cmenu){cmenu=null;renderCombat();e.preventDefault();return}
  }else if(S.mode==='world'&&n&&n<=WTABS.length){setTab(WTABS[n-1][0]);e.preventDefault();return}
  if(b){e.preventDefault();b.click()}
});

// ── 시작
S=restore()||fresh();
if(S.hero){fixGear();syncComps()}
if(S.mode==='combat'&&S.battle&&!S.battle.over&&!myTurn()){runTurns();save()}
if(window.Art){
  Art.mount($('art'),artInfo);
  Art.onPick(id=>{const B=S.battle;if(S.mode!=='combat'||!B||B.over||rolling)return;const u=U(id);if(u&&u.side==='foe'&&up(u)){B.target=id;save();renderCombat();Art.redraw()}});
}
render();
