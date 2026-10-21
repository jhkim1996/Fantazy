// 떨어진 별의 노래 — 게임 엔진
// 모드: create(모험가 만들기) → world(지도) ⇄ event(이야기·탐색 사건) ⇄ combat(턴제 전투) → end(장 끝)
const $=i=>document.getElementById(i);
const SC=window.SCENARIO;
const KEY='fantazy:'+SC.id;
const CLASSES=SC.classes;
const CLS_IDS=CLASSES.map(c=>c.id);
const STATS=SC.stats.map(s=>s.n);
let S=null,rolling=false,ampOn=false,foOn=false,mkRolling=false,cmenu=null,shopOpen=false,fxDelay=0;

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
function tokens(){const c=cls(),h=S.hero||{};return {name:h.name||'떠돌이',cls:c.name,weapon:c.weapon,item:c.item,fine:c.fine,relic:c.relic,amp:(S.amp&&S.amp.name)||c.amp}}
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

// ── 조건: {flag, not, any, min, max, item, count, skill, cls, or, nor} — 적힌 조건을 모두 만족해야 참
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
    insp:0,opt:{karmic:true},failStreak:0,reroll:null,
    flags:{},counters:{},log:[],loc:SC.startLoc,ev:null,pending:null,sel:null,lvl:0,battle:null,notice:null,done:false};
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function restore(){
  try{
    const s=JSON.parse(localStorage.getItem(KEY));if(!s||!s.mode)return null;
    if(s.mode==='create'&&s.mk&&s.mk.buy)return s;
    if(s.hero&&SC.locations[s.loc]&&(s.mode!=='event'||SC.events[s.ev])&&(s.mode!=='combat'||s.battle)){if(!s.opt)s.opt={karmic:true};return s}
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
function wpn(){return SC.items[S.equip.weapon]||{dice:'1d4',bonus:0}}
function arm(){return SC.items[S.equip.armor]||{ac:0}}
function bsum(k){const B=S.battle;return B?B.pb.reduce((a,b)=>a+(b[k]||0),0):0}
function prof(){return Math.floor(S.hero.level/2)}
function heroAC(){return 10+statVal('민첩')+(arm().ac||0)+bsum('ac')}
function atkStat(){return cls().key}
function weaponHit(extra){return statVal(atkStat())+prof()+(wpn().bonus||0)+(extra||0)+bsum('atk')}
function weaponDmgBonus(){return statVal(atkStat())+(wpn().bonus||0)+bsum('dmg')}
function clsSkills(){return cls().skills||[]}
function knownSkills(){return clsSkills().filter(k=>SC.combatSkills[k].lv<=S.hero.level)}
function hasRelic(){return S.items.some(i=>i===cls().relic)}
function itemScore(it){if(!it)return -1;if(it.slot==='weapon'){const p=parseDice(it.dice);return p.n*(p.s+1)/2+(it.bonus||0)*1.5}return it.ac||0}
function autoEquip(){
  ['weapon','armor'].forEach(slot=>{
    let best=S.items.includes(S.equip[slot])?S.equip[slot]:null;
    S.items.forEach(n=>{const it=SC.items[n];if(it&&it.slot===slot&&itemScore(it)>itemScore(SC.items[best]))best=n});
    S.equip[slot]=best;
  });
}

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
  arr(fx.items).forEach(i=>{S.items.push(i);out.push('획득: '+i)});
  if(fx.items||fx.drop)autoEquip();
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
  if(h.hp<=0){h.hp=Math.max(1,Math.ceil(h.hpMax/4));S.counters.falls=(S.counters.falls||0)+1;down=true;out.push('쓰러짐 → HP '+h.hp+'로 일어남')}
  while(h.xp>=h.xpMax){
    const c=cls(),r=race();
    h.xp-=h.xpMax;h.level++;h.xpMax=xpNeed(h.level);
    h.hpMax+=c.hpGain+((r&&r.hpPerLevel)||0);h.mpMax+=c.mpGain;h.hp=h.hpMax;h.mp=h.mpMax;S.lvl++;
    out.push('레벨 업! 레벨 '+h.level+' (HP·마력 모두 회복)');
    logp('레벨 '+h.level+'이 되었다.');
    if(h.level===5)out.push('숙련 보너스 +3');
    clsSkills().filter(k=>SC.combatSkills[k].lv===h.level).forEach(k=>{out.push('새 기술: '+SC.combatSkills[k].name);logp('새 기술 「'+SC.combatSkills[k].name+'」을 익혔다.')});
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
  S.skills=['amp',c.passive];S.items=[c.item,c.armor,'은빛 물약'].concat(arr(b.items));S.gold=(SC.startGold||0)+(b.gold||0);
  S.insp=1;S.opt={karmic:true};S.failStreak=0;
  autoEquip();
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
function rest(){
  const h=S.hero;h.hp=h.hpMax;h.mp=h.mpMax;
  logp(L().name+'에서 쉬었다.');
  notice(tpl(L().rest)+' — 밤이 지나고, HP와 마력이 모두 회복되었다.');
}
function buy(name){
  const it=SC.items[name];if(!it||!it.price||S.gold<it.price)return;
  S.gold-=it.price;S.items.push(name);autoEquip();
  logp(josa(name,'을')+' 샀다 (금화 -'+it.price+').');
  save();render();
}
function useItem(name){
  const it=SC.items[name];if(!it||!it.use||rolling)return;
  const k=S.items.indexOf(name);if(k<0)return;S.items.splice(k,1);
  const out=[],before=S.hero.hp;applyFx(it.use,out);
  if(S.mode==='combat'){logB(name+' 사용 — '+out.join(', '),'me');if(S.hero.hp>before)afx({type:'heal',target:'hero',val:S.hero.hp-before});else afx({type:'text',target:'hero',text:name,color:'#8fb6ff'});return}
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
  arr(c.bonus).forEach(b=>{if(ok(b.if)){mod+=b.v;why.push(b.why+' '+sign(b.v))}});
  arr(c.dcMod).forEach(b=>{if(ok(b.if)){dc+=b.v;why.push(b.why+' DC '+sign(b.v))}});
  const adv=arr(c.adv).filter(a=>ok(a.if)).map(a=>a.why),dis=arr(c.dis).filter(a=>ok(a.if)).map(a=>a.why);
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
  arr(oc.fxIf).forEach(e=>{if(ok(e.if))applyFx(fxOf(e.fx),out)});
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
  S.flags['done_'+S.ev]=true;
  if(rl)S.failStreak=rl.success?0:(S.failStreak||0)+1;
  let insp=null;
  if(inspMatch(c)&&S.insp<(SC.inspMax||4)){S.insp++;insp='영감 +1 ('+bg().name+'다운 선택)'}
  applyOutcome(oc,{choiceId:c.id,label:txt(c.label),key,roll:rl,ownCrit:!!c.crit,insp});
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

// ── 전투
function afx(o){if(window.Art)Art.fx(Object.assign({delay:fxDelay},o))}
function mkEnemy(id){const E=SC.enemies[id];return {id,art:E.art||'wolf',name:E.name,lv:E.lv,hp:E.hp,hpMax:E.hp,ac:E.ac,atk:E.atk,dmg:E.dmg,st:{},used:{}}}
function logB(t,k){const B=S.battle;B.log.push({t,k:k||'',r:B.round});if(B.log.length>60)B.log.splice(0,B.log.length-60)}
function alive(){return S.battle.enemies.filter(e=>e.hp>0)}
function eid(e){return 'e'+S.battle.enemies.indexOf(e)}
function target(){
  const B=S.battle;let e=B.enemies[B.target];
  if(!e||e.hp<=0){B.target=B.enemies.findIndex(x=>x.hp>0);e=B.enemies[B.target]}
  return e;
}
function nameList(ids){
  const c={};ids.forEach(i=>{const n=SC.enemies[i].name;c[n]=(c[n]||0)+1});
  return Object.keys(c).map(n=>n+(c[n]>1?' '+c[n]+'마리':'')).join(', ');
}
function startBattle(def,kind,ambush){
  def=copy(def);
  const en=def.enemies.map(mkEnemy);
  const cnt={},seen={};en.forEach(e=>cnt[e.name]=(cnt[e.name]||0)+1);
  en.forEach(e=>{if(cnt[e.name]>1){seen[e.name]=(seen[e.name]||0)+1;e.name+=' '+'ABCDE'[seen[e.name]-1]}});
  const mods=[];
  arr(def.mods).forEach(m=>{if(ok(m.if)){en.forEach(e=>{if(m.hp)e.hp=Math.max(1,e.hp+m.hp);if(m.ac)e.ac+=m.ac;if(m.atk)e.atk+=m.atk});mods.push(m.why)}});
  const ally=def.ally&&ok(def.ally.if)?{name:def.ally.name,atk:def.ally.atk,dmg:def.ally.dmg}:null;
  S.battle={def,kind,enemies:en,round:1,log:[],target:0,pb:[],ps:{},ally,over:null,res:null,last:null};
  S.mode='combat';S.notice=null;cmenu=null;fxDelay=0;
  logB(def.intro?tpl(def.intro):(ambush?'매복이다! ':'')+josa(nameList(def.enemies),'이')+' 나타났다!','sys');
  mods.forEach(m=>logB('▸ '+m,'sys'));
  if(ally)logB(josa(ally.name,'이')+' 그대 곁에서 함께 싸운다.','sys');
  if(S.flags.shield)logB('별빛 방벽이 그대를 감싸고 있다. (첫 피해를 막는다)','sys');
  save();render();toTop();
  if(ambush){logB('적이 먼저 움직인다!','sys');fxDelay=300;enemyTurn();if(S.hero.hp<=0)loseBattle();else endRound();save();render()}
}
function startRandomBattle(ambush){
  const pool=L().encounters.filter(x=>!x.if||ok(x.if));
  let r=Math.random()*pool.reduce((a,b)=>a+b.w,0),g=pool[0];
  for(const x of pool){r-=x.w;if(r<0){g=x;break}}
  startBattle({enemies:g.e},'random',ambush);
}
function hurt(e,dmg){
  e.hp=Math.max(0,e.hp-dmg);
  if(e.hp===0&&!e.dead){e.dead=true;S.counters['kill_'+e.id]=(S.counters['kill_'+e.id]||0)+1}
}
function heal(v){const h=S.hero;const before=h.hp;h.hp=Math.min(h.hpMax,h.hp+v);return h.hp-before}
function onHit(e,sk){
  const o=sk&&sk.onHit;if(!o||e.hp<=0)return;
  if(o.stun){e.st.stun=o.stun;logB(josa(e.name,'이')+' 얼어붙었다! (그대의 공격이 유리)','me');afx({type:'text',target:eid(e),text:'얼어붙음',color:'#9fd3ff',delay:fxDelay+380})}
  if(o.poison){e.st.poison={t:o.poison,dmg:'1d6'};logB(josa(e.name,'이')+' 독에 중독되었다!','me');afx({type:'text',target:eid(e),text:'중독',color:'#9be37a',delay:fxDelay+380})}
  if(o.weak){e.st.weak=o.weak;logB(e.name+'의 명중이 떨어졌다! (-2)','me');afx({type:'text',target:eid(e),text:'명중 -2',color:'#f0c75e',delay:fxDelay+380})}
}
// 그대의 공격이 유리/불리해지는 상황: 얼어붙거나 연막 속인 적은 유리, 중독되면 불리
function atkMode(e){
  const adv=[],dis=[];
  if(e&&e.st.stun)adv.push('얼어붙은 적');if(e&&e.st.blind)adv.push('연막 속의 적');
  if(S.battle.ps.poison)dis.push('중독');
  return {mode:modeOf(adv,dis),adv,dis};
}
function hitChance(e,hb,critOn){return chance(hb,e.ac,atkMode(e).mode,0,{critOn,lucky:race()&&race().lucky})}
// 명중 판정: d20 + 보너스 ≥ 방어. 1은 언제나 빗나가고, 치명 범위는 언제나 맞는다(피해 주사위 두 배).
function attackRoll(e,hb,critOn,name,dmgFn,vis){
  const B=S.battle,id=eid(e),m=atkMode(e),rr=rollD20(m.mode),r=rr.r,tot=r+hb,crit=r>=critOn,hit=r!==1&&(crit||tot>=e.ac);
  if(vis&&vis.spell)afx({type:'cast',from:'hero',to:id,color:vis.color});else afx({type:'lunge',who:'hero',dir:1});
  const dtxt=rr.dice.length>1?'d20['+rr.dice.join(', ')+'] '+(m.mode==='adv'?'유리':'불리')+'→'+r:'d20('+r+')';
  const base=dtxt+(rr.notes.length?' ('+rr.notes.join(', ')+')':'')+' '+sign(hb)+' = '+tot+' vs 방어 '+e.ac;
  if(!hit){B.last={r,dice:rr.dice,txt:base+' → 빗나감'};logB(name+' — '+e.name+'에게 빗나갔다','me');afx({type:'miss',target:id,delay:fxDelay+260});return}
  const dm=Math.max(1,dmgFn(crit));
  hurt(e,dm);
  B.last={r,dice:rr.dice,txt:base+' → '+(crit?'치명타! ':'명중! ')+'피해 '+dm};
  logB(name+' — '+e.name+'에게 '+(crit?'치명타! ':'')+dm+' 피해'+(e.hp<=0?' · 쓰러뜨렸다!':''),'me');
  afx({type:'hit',target:id,val:dm,crit,delay:fxDelay+260});
  return true;
}
function weaponAttack(e,sk){
  const w=wpn(),name=sk?sk.name:'공격';
  const critOn=Math.min(w.crit||20,(sk&&sk.crit)||20);
  const hit=attackRoll(e,weaponHit(sk&&sk.hit),critOn,name,crit=>{
    let v=rollDice(w.dice,crit).total+weaponDmgBonus();
    if(sk&&sk.extra)v+=rollDice(sk.extra,crit).total;
    return v;
  });
  if(hit)onHit(e,sk);
}
const SPELL_COLOR={지혜:'#9fc8ff',매력:'#f0a8ff'};
function spellHit(sk){return statVal(sk.stat||atkStat())+prof()+(sk.hit||0)+bsum('atk')}
function spellAttack(e,sk){
  const st=sk.stat||atkStat(),add=sk.addStat?statVal(st):0,id=eid(e);
  if(sk.auto){
    const r=rollDice(sk.dmg);const dm=Math.max(1,r.total+add+bsum('dmg'));hurt(e,dm);
    S.battle.last={r:null,txt:sk.name+' '+r.txt+'('+r.dice.join('+')+')'+sign(add)+' = '+dm};
    logB(sk.name+' — '+e.name+'에게 '+dm+' 피해'+(e.hp<=0?' · 쓰러뜨렸다!':''),'me');
    afx({type:'cast',from:'hero',to:id,color:SPELL_COLOR[st]});afx({type:'hit',target:id,val:dm,delay:fxDelay+260});
    onHit(e,sk);return;
  }
  if(attackRoll(e,spellHit(sk),sk.crit||20,sk.name,crit=>rollDice(sk.dmg,crit).total+add+bsum('dmg'),{spell:true,color:SPELL_COLOR[st]}))onHit(e,sk);
}

function canAct(kind,arg){
  const B=S.battle;if(!B||B.over||rolling)return false;
  if(kind==='skill'){const sk=SC.combatSkills[arg];return !!sk&&S.hero.mp>=sk.mp}
  if(kind==='item')return S.items.includes(arg);
  if(kind==='flee')return !B.def.noFlee;
  if(kind==='special'){const sp=specialOf(arg);return !!sp&&specialReady(sp)}
  return true;
}
function specialOf(id){return arr(S.battle.def.special).find(x=>x.id===id)}
function specialReady(sp){const b=S.battle.enemies[0];return ok(sp.if)&&b.hp>0&&b.hp<=b.hpMax*(sp.below||1)&&S.hero.mp>=(sp.mp||0)}
function specialDC(sp){let dc=sp.dc;const why=[];arr(sp.dcMod).forEach(m=>{if(ok(m.if)){dc+=m.v;why.push(m.why+' '+sign(m.v))}});return {dc,why}}

function act(kind,arg){
  if(!canAct(kind,arg))return;
  const rollsDie=kind==='attack'||kind==='flee'||kind==='special'||(kind==='skill'&&/attack|aoe/.test(SC.combatSkills[arg].act)&&!SC.combatSkills[arg].auto);
  cmenu=null;
  const go=()=>{
    rolling=false;fxDelay=0;
    const B=S.battle;B.last=null;
    playerAct(kind,arg);
    if(!B.over&&!alive().length)winBattle();
    fxDelay=420;
    if(!B.over&&B.ally)allyAct();
    if(!B.over&&!alive().length)winBattle();
    fxDelay=B.ally?860:520;
    if(!B.over)enemyTurn();
    if(!B.over&&S.hero.hp<=0)loseBattle();
    if(!B.over)endRound();
    save();render();
  };
  if(!rollsDie){go();return}
  rolling=true;renderCombat();
  animateDie('cshape','cnum',go);
}
function playerAct(kind,arg){
  const B=S.battle,h=S.hero;
  if(kind==='attack'){weaponAttack(target(),null);return}
  if(kind==='skill'){
    const sk=SC.combatSkills[arg];h.mp-=sk.mp;
    if(sk.act==='attack'){if(sk.weapon)weaponAttack(target(),sk);else spellAttack(target(),sk)}
    else if(sk.act==='aoe'){alive().forEach(e=>{if(sk.weapon)weaponAttack(e,sk);else spellAttack(e,sk)});if(sk.heal){const v=heal(rollDice(sk.heal).total);logB(sk.name+' — HP '+v+' 회복','me');afx({type:'heal',target:'hero',val:v,delay:450})}}
    else if(sk.act==='heal'){const r=rollDice(sk.dmg),add=sk.addStat?statVal(sk.stat):0,v=heal(r.total+add);B.last={r:null,txt:sk.name+' '+r.txt+'('+r.dice.join('+')+')'+sign(add)+' → HP +'+v};logB(sk.name+' — HP '+v+' 회복','me');afx({type:'heal',target:'hero',val:v})}
    else if(sk.act==='buff'){B.pb.push(Object.assign({t:sk.turns,name:sk.name},sk.buff));B.last={r:null,txt:sk.name+' — '+sk.desc};logB(sk.name+'! '+sk.desc,'me');afx({type:'text',target:'hero',text:sk.name,color:'#f0c75e'})}
    else if(sk.act==='debuffAll'){alive().forEach(e=>{Object.assign(e.st,sk.status);afx({type:'text',target:eid(e),text:sk.name,color:'#c8ccd4'})});B.last={r:null,txt:sk.name+' — '+sk.desc};logB(sk.name+'! '+sk.desc,'me')}
    return;
  }
  if(kind==='item'){useItem(arg);return}
  if(kind==='guard'){B.ps.guard=true;h.mp=Math.min(h.mpMax,h.mp+1);B.last={r:null,txt:'방어 — 이번 턴 받는 피해 절반, 마력 +1'};logB('방어 자세를 취했다. (피해 절반, 마력 +1)','me');afx({type:'text',target:'hero',text:'방어',color:'#8fb6ff'});return}
  if(kind==='flee'){
    const rr=rollD20('normal'),r=rr.r,bonus=statVal('민첩')+(S.cls==='rogue'?3:0),dc=10+Math.max.apply(null,alive().map(e=>e.lv)),tot=r+bonus;
    const okF=r!==1&&(r===20||tot>=dc);
    B.last={r,txt:'도망 d20('+r+') '+sign(bonus)+' = '+tot+' vs '+dc+(okF?' → 성공':' → 실패')};
    if(okF){B.over='fled';B.res={title:'도망쳤다',lines:['무사히 빠져나왔다.']};logB('도망쳤다!','sys')}
    else{logB('도망치지 못했다!','sys');afx({type:'text',target:'hero',text:'도망 실패',color:'#c8ccd4'})}
    return;
  }
  if(kind==='special'){
    const sp=specialOf(arg),{dc}=specialDC(sp),rr=rollD20('normal'),r=rr.r,bonus=statVal(sp.stat)+profBonus(),tot=r+bonus;
    h.mp-=sp.mp||0;
    const okS=r!==1&&(r===20||tot>=dc);
    B.last={r,txt:sp.label+' d20('+r+') '+sign(bonus)+' = '+tot+' vs DC '+dc+(okS?' → 성공!':' → 실패')};
    afx({type:'cast',from:'hero',to:'e0',color:'#e6ebf2'});
    if(okS){B.over=sp.outcome;B.res={title:sp.label+' — 성공!',lines:[]};logB(sp.label+' — 성공했다!','me');afx({type:'text',target:'e0',text:'낙인이 부서진다',color:'#ffffff',delay:300})}
    else{logB(sp.label+' — '+sp.failText,'foe');if(sp.failHp){h.hp=Math.max(0,h.hp+sp.failHp);logB('HP '+sp.failHp,'foe');afx({type:'hit',target:'hero',val:-sp.failHp,delay:300})}}
  }
}
function allyAct(){
  const B=S.battle,a=B.ally,e=target();if(!e)return;
  const id=eid(e),r=d(20),crit=r===20,hit=r!==1&&(crit||r+a.atk>=e.ac);
  afx({type:'lunge',who:'ally',dir:1});
  if(!hit){logB(a.name+'의 공격 — 빗나갔다','sys');afx({type:'miss',target:id,delay:fxDelay+260});return}
  const dm=Math.max(1,rollDice(a.dmg,crit).total);hurt(e,dm);
  logB(a.name+'의 공격 — '+e.name+'에게 '+(crit?'치명타! ':'')+dm+' 피해'+(e.hp<=0?' · 쓰러뜨렸다!':''),'sys');
  afx({type:'hit',target:id,val:dm,crit,delay:fxDelay+260});
}
function enemyTurn(){
  const B=S.battle,def=B.def;
  alive().slice().forEach(e=>{
    if(B.over||S.hero.hp<=0)return;
    const E=SC.enemies[e.id],id=eid(e);
    if(e.st.poison){
      const p=rollDice(e.st.poison.dmg).total;hurt(e,p);
      logB(e.name+' — 독 피해 '+p+(e.hp<=0?' · 쓰러졌다!':''),'me');afx({type:'hit',target:id,val:p});fxDelay+=250;
      if(--e.st.poison.t<=0)delete e.st.poison;
      if(e.hp<=0)return;
    }
    if(e.st.stun>0){e.st.stun--;if(!e.st.stun)delete e.st.stun;logB(josa(e.name,'은')+' 얼어붙어 움직이지 못한다.','sys');afx({type:'text',target:id,text:'얼어붙음',color:'#9fd3ff'});fxDelay+=300;return}
    if(E.boss&&def.hesitate&&ok(def.hesitate.if)&&Math.random()<def.hesitate.p){logB(def.hesitate.text,'sys');afx({type:'text',target:id,text:'머뭇거림',color:'#f0c75e'});fxDelay+=300;return}
    let sk=null;
    for(const s of arr(E.skills)){if(s.once&&e.used[s.name])continue;if(Math.random()<s.p){sk=s;break}}
    if(sk&&sk.summon){
      e.used[sk.name]=true;const ne=mkEnemy(sk.summon);ne.name+=' (불려 옴)';B.enemies.push(ne);
      logB(e.name+' — '+sk.name+'! '+josa(ne.name,'이')+' 나타났다.','foe');afx({type:'text',target:id,text:sk.name,color:'#c8ccd4'});fxDelay+=350;return;
    }
    if(sk&&sk.debuff){
      B.pb.push({atk:sk.debuff.atk,t:sk.debuff.turns,name:sk.name,neg:true});
      logB(sk.text||(e.name+' — '+sk.name+'!'),'foe');afx({type:'text',target:'hero',text:sk.name+'! 명중 '+sk.debuff.atk,color:'#ff9a8a'});fxDelay+=400;return;
    }
    enemyAttack(e,E,sk);
    fxDelay+=520;
  });
  if(!alive().length&&!B.over)winBattle();
}
function enemyAttack(e,E,sk){
  const B=S.battle,h=S.hero,id=eid(e);
  const hm=((sk&&sk.hit)||0)-(e.st.weak?2:0);
  let r=d(20);if(e.st.blind)r=Math.min(r,d(20));
  const tot=r+e.atk+hm,ac=heroAC(),crit=r===20,hit=r!==1&&(crit||tot>=ac);
  const nm=sk?e.name+'의 '+sk.name:e.name+'의 공격';
  afx({type:'lunge',who:id,dir:-1});
  if(!hit){logB(nm+' — 빗나갔다 ('+tot+' vs 방어 '+ac+')','foe');afx({type:'miss',target:'hero',delay:fxDelay+260});return}
  if(S.flags.shield){delete S.flags.shield;logB(nm+' — 별빛 방벽이 막아 냈다!','sys');afx({type:'text',target:'hero',text:'방벽!',color:'#9fc8ff',delay:fxDelay+260});return}
  let dm=Math.max(1,rollDice((sk&&sk.dmg)||e.dmg,crit).total);
  if(B.ps.guard)dm=Math.ceil(dm/2);
  h.hp=Math.max(0,h.hp-dm);
  logB(nm+' — '+(crit?'치명타! ':'')+'그대에게 '+dm+' 피해'+(B.ps.guard?' (방어로 절반)':''),'foe');
  afx({type:'hit',target:'hero',val:dm,crit,delay:fxDelay+260});
  if(E.drain){const v=Math.max(1,Math.floor(dm*E.drain));e.hp=Math.min(e.hpMax,e.hp+v);logB(josa(e.name,'이')+' 피를 빨아 HP '+v+' 회복','foe')}
  if(E.poison&&Math.random()<E.poison.p){B.ps.poison={t:E.poison.turns,dmg:E.poison.dmg};logB('독에 중독되었다! ('+E.poison.turns+'턴, 공격 불리)','foe');afx({type:'text',target:'hero',text:'중독',color:'#9be37a',delay:fxDelay+500})}
}
function endRound(){
  const B=S.battle,h=S.hero;
  if(B.ps.poison){
    let p=rollDice(B.ps.poison.dmg).total;if(race()&&race().poisonResist)p=Math.ceil(p/2);
    h.hp=Math.max(0,h.hp-p);logB('독 피해 '+p+(race()&&race().poisonResist?' (드워프: 절반)':''),'foe');afx({type:'hit',target:'hero',val:p});
    if(--B.ps.poison.t<=0)delete B.ps.poison;
    if(h.hp<=0){loseBattle();return}
  }
  B.ps.guard=false;
  B.pb.forEach(b=>b.t--);B.pb=B.pb.filter(b=>b.t>0);
  alive().forEach(e=>{['weak','blind'].forEach(k=>{if(e.st[k]){e.st[k]--;if(!e.st[k])delete e.st[k]}})});
  B.round++;
}
function winBattle(){
  const B=S.battle,h=S.hero,out=[],got=[];let xp=0,gold=0;
  B.enemies.forEach(e=>{
    const E=SC.enemies[e.id];
    let x=E.xp;if(e.lv<=h.level-3)x=Math.max(1,Math.floor(x/2));
    xp+=x;gold+=rint(E.gold[0],E.gold[1]);
    arr(E.drops).forEach(dr=>{if(dr.once&&S.flags[dr.once])return;if(Math.random()<dr.p){got.push(dr.item);if(dr.once)S.flags[dr.once]=true}});
  });
  h.xp+=xp;S.gold+=gold;got.forEach(i=>S.items.push(i));if(got.length)autoEquip();
  out.push('경험치 +'+xp,'금화 +'+gold);got.forEach(i=>out.push('획득: '+i));
  settle(out);
  B.over='win';B.res={title:'승리!',lines:out};
  logB('승리!','sys');
  if(B.kind==='random')logp(nameList(B.def.enemies)+' 처치 (경험치 +'+xp+', 금화 +'+gold+(got.length?', '+got.join(', '):'')+')');
}
function loseBattle(){
  const B=S.battle;B.over='lose';
  B.res={title:'패배…',lines:[B.kind==='story'?'쓰러졌지만, 이야기는 계속된다.':'그대는 쓰러졌다…']};
  logB('그대는 쓰러졌다…','foe');
}
function knockout(){
  const h=S.hero,k=SC.knockout||{};
  const toGate=k.gate&&ok(k.gate.if)&&k.gate.locs.includes(S.loc);
  const dest=toGate?'gate':SC.startLoc;
  S.loc=dest;h.hp=Math.ceil(h.hpMax/2);h.mp=Math.ceil(h.mpMax/2);
  const lost=Math.floor(S.gold*0.25);S.gold-=lost;
  S.counters.falls=(S.counters.falls||0)+1;
  S.notice=tpl((k.text||'{place}에서 깨어났다.').replace('{place}',SC.locations[dest].name))+(lost?' (금화 -'+lost+')':'');
  logp('사냥터에서 쓰러져 '+SC.locations[dest].name+'에서 깨어났다.');
}
function endBattle(){
  const B=S.battle;if(!B||!B.over)return;
  S.battle=null;cmenu=null;
  if(B.kind==='story'){
    const key=B.over,def=B.def;
    const oc=def[key]||(key==='win'?def.win:def.lose);
    if(key==='lose'||key==='fled'){const h=S.hero;h.hp=Math.max(1,Math.ceil(h.hpMax/4));S.counters.falls=(S.counters.falls||0)+1}
    S.mode='event';
    applyOutcome(oc,{label:nameList(def.enemies),key:key==='lose'||key==='fled'?'fail':'success',battleEnd:key,extra:key==='win'?B.res.lines:null});
    save();render();toTop();return;
  }
  if(B.over==='lose')knockout();
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
  if(m==='event')return pickArt(ev().art)||loc;
  return loc;
}
function artInfo(){return {cls:S.cls||(S.mk&&S.mk.cls),relic:S.items?hasRelicSafe():false,battle:S.mode==='combat'?S.battle:null,heroHp:S.hero?S.hero.hp:1}}
function hasRelicSafe(){try{return !!S.cls&&hasRelic()}catch(e){return false}}

// ── 그리기
function bar(color,v,max){const b=el('div','bar'),i=el('i');i.style.background=color;i.style.width=Math.max(0,Math.min(100,100*v/max))+'%';b.appendChild(i);return b}
function render(){
  const m=S.mode;
  document.body.classList.toggle('combat',m==='combat');
  $('make').hidden=m!=='create';
  $('hud').hidden=m==='create';
  $('world').hidden=m!=='world';
  $('event').hidden=m!=='event';
  $('combat').hidden=m!=='combat';
  $('endwrap').hidden=m!=='end';
  $('logwrap').hidden=m!=='world'&&m!=='end';
  $('freedice').hidden=m!=='world';
  $('lvwrap').hidden=m==='create'||m==='combat'||!needLevel();
  const nt=$('notice');nt.hidden=!S.notice||m!=='world';nt.textContent=S.notice||'';
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
    $('clock').textContent=tpl(e.clock||'')+(e.clock?' · ':'')+L().name;
    renderChoices();renderMods();updateRollBtn();renderResult();
  }else if(m==='combat'){
    const B=S.battle;$('stitle').textContent='전투';
    const seen={};B.enemies.forEach(e=>{const ds=SC.enemies[e.id].desc;if(ds&&!seen[e.id]){seen[e.id]=1;sc.appendChild(el('p',null,ds))}});
    $('clock').textContent=L().name+' · 라운드 '+B.round+' · 그림의 적을 눌러 대상을 고를 수 있다';renderCombat();
  }else if(m==='end'){
    $('stitle').textContent='제1장 끝';
    para(['그대의 선택과 주사위가 새긴 이야기는 이렇게 기록되었다.','이 기록은 제2장으로 그대로 이어진다. 그때까지 세상은 열려 있다 — 계속 사냥하며 힘을 기를 수 있다.']);
    $('clock').textContent='';renderSummary();
  }
  if(m==='world'||m==='end'){const lg=$('log');lg.innerHTML='';S.log.slice(-25).reverse().forEach(t=>lg.appendChild(el('li',null,t)))}
}

function renderHud(){
  const h=S.hero,box=$('hud');box.innerHTML='';
  box.appendChild(el('h2',null,'상태'));
  const c=el('div','card');box.appendChild(c);
  const r=race(),b=bg();
  const t=el('div','hudtop');t.appendChild(el('b',null,h.name+' ('+(r?r.name+' ':'')+h.cls+(b?' · '+b.name:'')+')'));t.appendChild(el('span','mini','레벨 '+h.level+' · 금화 '+S.gold));c.appendChild(t);
  const g=el('div','hudnums');
  [['HP',h.hp,h.hpMax,'var(--hp)'],['마력',h.mp,h.mpMax,'var(--mp)'],['경험치',h.xp,h.xpMax,'var(--xp)']].forEach(([n,v,mx,col])=>{
    const d1=el('div');d1.appendChild(el('div','mini',n+' '+v+'/'+mx));d1.appendChild(bar(col,v,mx));g.appendChild(d1);
  });
  c.appendChild(g);
  const w=wpn(),max=SC.inspMax||4;
  const line=el('div','mini');
  line.appendChild(document.createTextNode('공격 명중 '+sign(weaponHit())+' · 피해 '+w.dice+sign(weaponDmgBonus())+(w.crit?' ('+w.crit+'~20 치명타)':'')+' · 방어 '+heroAC()+' · 숙련 +'+profBonus()+' · '));
  const ins=el('span','insp','영감 '+'✦'.repeat(S.insp||0)+'·'.repeat(Math.max(0,max-(S.insp||0))));ins.title='배경다운 선택을 하면 쌓이고, 실패한 판정을 다시 굴릴 때 쓴다';line.appendChild(ins);
  c.appendChild(line);
  const st=el('div','stats');
  S.stats.forEach(s=>{const dv=el('div','stat');if(s.note)dv.title=s.note;dv.appendChild(el('span','sub',s.n));dv.appendChild(el('b',null,sign(s.v)));st.appendChild(dv)});
  c.appendChild(st);
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
function renderWorld(){
  const box=$('world'),l=L(),h=S.hero;box.innerHTML='';
  box.appendChild(el('h2',null,'할 수 있는 일'));
  const acts=el('div','card');box.appendChild(acts);
  arr(l.actions).filter(a=>ok(a.if)).forEach(a=>actBtn(acts,a.label,null,()=>startEvent(a.event),{star:a.star}));
  if(l.encounters)actBtn(acts,'사냥한다','전투를 벌여 경험치와 금화를 얻는다 · 이곳의 적 레벨 '+l.lv,()=>{S.notice=null;startRandomBattle(false)});
  if(l.encounters||arr(l.explore).length)actBtn(acts,'탐색한다','무언가를 찾아내거나, 무언가와 마주친다',explore);
  if(canRest())actBtn(acts,tpl(l.rest),'HP·마력 모두 회복',rest,{disabled:h.hp>=h.hpMax&&h.mp>=h.mpMax});
  if(l.shop)actBtn(acts,(shopOpen?'▾ ':'▸ ')+l.shop.name,'물약과 장비를 판다 · 금화 '+S.gold,()=>{shopOpen=!shopOpen;render()});
  if(l.shop&&shopOpen){
    const sh=el('div');sh.style.marginTop='6px';acts.appendChild(sh);
    l.shop.items.map(tpl).forEach(n=>{
      const it=SC.items[n];if(!it)return;
      const owned=it.slot&&S.items.includes(n);
      const row=el('div','item'),info=el('div');
      info.appendChild(el('b',null,n+' '));info.appendChild(el('span','sub','['+it.kind+'] '+itemInfo(n)));
      row.appendChild(info);
      const b=el('button',null,owned?'보유':'금화 '+it.price);b.disabled=owned||S.gold<it.price;b.onclick=()=>buy(n);row.appendChild(b);
      sh.appendChild(row);
    });
  }
  if(!acts.children.length)acts.appendChild(el('div','sub','이곳에서는 할 일이 없다. 다른 곳으로 이동하자.'));

  box.appendChild(el('h2',null,'지도'));
  const mc=el('div','card');box.appendChild(mc);
  mc.appendChild(mapSvg());
  const tl=el('div');tl.style.marginTop='8px';mc.appendChild(tl);
  linksOf(S.loc).forEach(k=>{
    const t=SC.locations[k.to];
    actBtn(tl,'→ '+t.name,'레벨 '+t.lv+(storyAt(k.to)?' · ★ 이야기가 기다린다':''),()=>travel(k.to),{star:storyAt(k.to)});
  });

  box.appendChild(el('h2',null,'퀘스트'));
  const q=el('div','card');box.appendChild(q);
  const gl=el('div');gl.appendChild(el('b',null,'★ '));gl.appendChild(document.createTextNode(goalText()));q.appendChild(gl);
  arr(SC.quests).filter(x=>ok(x.if)).forEach(x=>{const d1=el('div');d1.style.marginTop='6px';d1.appendChild(el('b',null,x.name+' '));d1.appendChild(el('span','sub',tpl(x.t)));q.appendChild(d1)});

  box.appendChild(el('h2',null,'기술 판정'));
  const skc=el('div','card');box.appendChild(skc);
  skc.appendChild(el('div','sub','d20 + 능력치 + 숙련(●, 전문 ●●) 보너스. 이야기 선택지의 [기술] 판정에 쓰인다.'));
  const sg=el('div','skills');
  Object.keys(SC.skillList).forEach(sk=>{
    const n=profCount(sk),row=el('div','skrow'+(n?' prof':''));
    row.appendChild(el('span',null,sk+' '+'●'.repeat(n)));row.appendChild(el('span','mini',SC.skillList[sk]));row.appendChild(el('b',null,sign(skillMod(sk))));
    sg.appendChild(row);
  });
  skc.appendChild(sg);

  box.appendChild(el('h2',null,'장비와 소지품'));
  const inv=el('div','card');box.appendChild(inv);
  ['weapon','armor'].forEach(slot=>{const n=S.equip[slot];if(!n)return;const d1=el('div');d1.appendChild(el('b',null,(slot==='weapon'?'무기: ':'방어구: ')+n+' '));d1.appendChild(el('span','sub',itemInfo(n)));inv.appendChild(d1)});
  const counts={};S.items.forEach(n=>{if(n!==S.equip.weapon&&n!==S.equip.armor)counts[n]=(counts[n]||0)+1});
  Object.keys(counts).forEach(n=>{
    const it=SC.items[n]||{};
    const row=el('div','item'),info=el('div');
    info.appendChild(el('b',null,n+(counts[n]>1?' ×'+counts[n]:'')+' '));info.appendChild(el('span','sub','['+(it.kind||'소지품')+'] '+itemInfo(n)));row.appendChild(info);
    if(it.use){const b=el('button',null,'사용');b.disabled=(it.use.hp&&h.hp>=h.hpMax&&!it.use.mp)||(it.use.mp&&h.mp>=h.mpMax&&!it.use.hp);b.onclick=()=>useItem(n);row.appendChild(b)}
    inv.appendChild(row);
  });

  box.appendChild(el('h2',null,'전투 기술과 재능'));
  const sk=el('div','card');box.appendChild(sk);
  clsSkills().forEach(k=>{
    const s=SC.combatSkills[k],known=s.lv<=h.level;
    const d1=el('div');if(!known)d1.style.opacity='.5';
    d1.appendChild(el('b',null,s.name+' '));d1.appendChild(el('span','sub','[전투 · 마력 '+s.mp+'] '+s.desc+(known?'':' · 레벨 '+s.lv+'에 익힌다')));sk.appendChild(d1);
  });
  S.skills.forEach(id=>{
    const s=SC.skillDefs[id];if(!s)return;
    const d1=el('div');
    const name=id==='amp'?S.amp.name:s.name;
    const desc=id==='amp'?'마력 '+ampCost()+'. 이야기 판정에 d'+S.amp.die+' 추가 ('+S.amp.source+')':tpl(s.desc);
    d1.appendChild(el('b',null,name+' '));d1.appendChild(el('span','sub','['+s.kind+'] '+desc));sk.appendChild(d1);
  });
  const r=race();if(r){const d1=el('div');d1.appendChild(el('b',null,r.name+' '));d1.appendChild(el('span','sub','[종족] '+r.trait));sk.appendChild(d1)}
  const b=bg();if(b){const d1=el('div');d1.appendChild(el('b',null,b.name+' '));d1.appendChild(el('span','sub','[배경] 숙련 '+b.skills.join(', ')+' · 영감: '+b.inspText));sk.appendChild(d1)}

  box.appendChild(el('h2',null,'설정'));
  const so=el('div','card');box.appendChild(so);
  const lb=el('label','sub'),cb=el('input');cb.type='checkbox';cb.id='karmic';cb.checked=!!(S.opt&&S.opt.karmic);
  cb.onchange=()=>{S.opt.karmic=cb.checked;save()};
  lb.appendChild(cb);lb.appendChild(document.createTextNode(' 업보 주사위 — 이야기 판정에서 두 번 연달아 실패하면 다음 판정이 유리해진다'));so.appendChild(lb);
}
function itemInfo(n){
  const it=SC.items[n]||{};
  if(it.slot==='weapon')return it.dice+(it.bonus?' +'+it.bonus:'')+(it.crit?' · '+it.crit+'~20 치명타':'')+(it.desc?' · '+it.desc:'');
  if(it.slot==='armor')return '방어 +'+it.ac+(it.desc?' · '+it.desc:'');
  return it.desc||'';
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
    const lv=document.createElementNS(ns,'text');lv.setAttribute('x',l.x);lv.setAttribute('y',l.y+(l.y>200?-26:31));lv.setAttribute('text-anchor','middle');lv.setAttribute('class','lv');lv.textContent='Lv '+l.lv;g.appendChild(lv);
    if(storyAt(id)){const s=document.createElementNS(ns,'text');s.setAttribute('x',l.x+11);s.setAttribute('y',l.y-6);s.setAttribute('class','starmark');s.textContent='★';g.appendChild(s)}
    svg.appendChild(g);
  });
  return svg;
}

function renderCombat(){
  const B=S.battle,box=$('combat'),h=S.hero;box.innerHTML='';
  box.appendChild(el('h2',null,'적'+(alive().length>1?' — 눌러서 대상 고르기':'')));
  const foes=el('div','foes');box.appendChild(foes);
  B.enemies.forEach((e,i)=>{
    const b=el('button','foe'+(i===B.target&&e.hp>0?' on':'')+(e.hp<=0?' dead':''));
    const t=el('div','hudtop');t.appendChild(el('b',null,e.name));t.appendChild(el('span','mini','Lv '+e.lv+' · 방어 '+e.ac+(e.hp>0&&!B.over?' · 명중 '+pct(hitChance(e,weaponHit(),wpn().crit||20)):'')));b.appendChild(t);
    b.appendChild(bar('var(--foe)',e.hp,e.hpMax));
    const st=[];if(e.st.stun)st.push('얼어붙음 (공격 유리)');if(e.st.poison)st.push('독 '+e.st.poison.t);if(e.st.weak)st.push('명중 -2');if(e.st.blind)st.push('연막 (공격 유리)');
    const ln=el('div','mini','HP '+e.hp+'/'+e.hpMax+(e.hp<=0?' · 쓰러짐':''));if(st.length)ln.appendChild(el('span','tag',' · '+st.join(' · ')));
    if(i===B.target&&e.hp>0&&alive().length>1)ln.appendChild(el('span','tag',' · 대상'));
    b.appendChild(ln);
    b.disabled=e.hp<=0||!!B.over||rolling;
    b.onclick=()=>{B.target=i;save();renderCombat()};
    foes.appendChild(b);
  });
  const info=[];
  if(B.ally)info.push('함께 싸움: '+B.ally.name+' (명중 '+sign(B.ally.atk)+', 피해 '+B.ally.dmg+')');
  const me=[];B.pb.forEach(b=>me.push(b.name+' '+['atk','dmg','ac'].filter(k=>b[k]).map(k=>({atk:'명중',dmg:'피해',ac:'방어'})[k]+sign(b[k])).join(' ')+' ('+b.t+'턴)'));
  if(B.ps.poison)me.push('중독 '+B.ps.poison.t+'턴 (공격 불리)');if(S.flags.shield)me.push('별빛 방벽');
  if(me.length)info.push('그대: '+me.join(' · '));
  if(info.length){const ic=el('div','sub',info.join('  ·  '));ic.style.marginTop='8px';box.appendChild(ic)}

  box.appendChild(el('h2',null,'행동'));
  const card=el('div','card');box.appendChild(card);
  const dr=el('div','row');card.appendChild(dr);
  const dw=el('div','die');dw.style.width='92px';dw.style.height='92px';dw.appendChild(dieSvg('cshape','cnum',B.last&&B.last.r));dr.appendChild(dw);
  const cc=el('div');cc.style.flex='1';cc.style.minWidth='160px';
  const tg=target();
  cc.appendChild(el('div','sub',B.over?'전투가 끝났다':rolling?'굴리는 중…':'라운드 '+B.round+' · 그대의 차례'+(tg?' · 대상: '+tg.name:'')));
  cc.appendChild(el('div',null,B.last?B.last.txt:'행동을 고르면 주사위를 굴린다'));
  const am=tg&&!B.over?atkMode(tg):null;
  if(am&&am.mode!=='normal')cc.appendChild(el('div','sub',(am.mode==='adv'?'유리: '+am.adv.join(', '):'불리: '+am.dis.join(', '))+' — d20 두 개를 굴린다'));
  dr.appendChild(cc);

  if(B.over){
    const r=el('div','result '+(B.over==='lose'?'bad':B.over==='fled'?'neu':'ok'));r.style.marginTop='10px';
    r.appendChild(el('b',null,B.res.title));
    if(B.res.lines.length){const cs=el('div','chips');B.res.lines.forEach(l=>cs.appendChild(el('span','chip',l)));r.appendChild(cs)}
    card.appendChild(r);
    const nb=el('button','next','계속 →');nb.onclick=endBattle;card.appendChild(nb);
  }else{
    const grid=el('div','acts');grid.style.marginTop='10px';card.appendChild(grid);
    const add=(label,small,fn,dis,cl)=>{const b=el('button',cl||'');b.appendChild(el('b',null,label));if(small)b.appendChild(el('small',null,small));b.disabled=!!dis||rolling;b.onclick=fn;grid.appendChild(b);return b};
    const w=wpn();
    add('공격','명중 '+(tg?pct(hitChance(tg,weaponHit(),w.crit||20)):'-')+' · '+w.dice+sign(weaponDmgBonus()),()=>act('attack'));
    const ks=knownSkills();
    add((cmenu==='skill'?'▾ ':'')+'기술',ks.length?'마력 '+h.mp+'/'+h.mpMax:'없음',()=>{cmenu=cmenu==='skill'?null:'skill';renderCombat()},!ks.length,cmenu==='skill'?'on':'');
    const its=[...new Set(S.items.filter(n=>SC.items[n]&&SC.items[n].battle))];
    add((cmenu==='item'?'▾ ':'')+'물품',its.length?its.length+'종':'없음',()=>{cmenu=cmenu==='item'?null:'item';renderCombat()},!its.length,cmenu==='item'?'on':'');
    add('방어','피해 절반 · 마력 +1',()=>act('guard'));
    add('도망',B.def.noFlee?'도망칠 수 없다':'민첩 판정',()=>act('flee'),!!B.def.noFlee);
    arr(B.def.special).filter(sp=>ok(sp.if)).forEach(sp=>{
      const {dc,why}=specialDC(sp),bonus=statVal(sp.stat)+profBonus();
      add('✦ '+sp.label,sp.stat+' '+sign(bonus)+' vs DC '+dc+(why.length?' ('+why.join(', ')+')':'')+' · 성공 '+pct(chance(bonus,dc,'normal',0,{lucky:race()&&race().lucky}))+' · 마력 '+sp.mp+' · '+sp.note,()=>act('special',sp.id),!specialReady(sp),'wide');
    });
    if(cmenu==='skill'){
      const sub=el('div');sub.style.marginTop='8px';card.appendChild(sub);
      ks.forEach(k=>{
        const s=SC.combatSkills[k];let ch='';
        if(tg&&s.act==='attack')ch=' · 명중 '+pct(hitChance(tg,s.weapon?weaponHit(s.hit):spellHit(s),Math.min(s.weapon?(w.crit||20):20,s.crit||20)));
        if(s.auto)ch=' · 반드시 맞음';
        actBtn(sub,s.name+' (마력 '+s.mp+')',s.desc+ch,()=>act('skill',k),{disabled:h.mp<s.mp||rolling});
      });
    }
    if(cmenu==='item'){
      const sub=el('div');sub.style.marginTop='8px';card.appendChild(sub);
      its.forEach(n=>actBtn(sub,n+' ×'+countItem(n),SC.items[n].desc,()=>act('item',n),{disabled:rolling}));
    }
  }

  box.appendChild(el('h2',null,'전투 기록'));
  const lc=el('div','card');box.appendChild(lc);
  const ul=el('ul','clog');lc.appendChild(ul);
  B.log.slice(-12).reverse().forEach(x=>{const li=el('li',x.k+(x.r<B.round-1?' old':''),x.t);ul.appendChild(li)});
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
    p.key==='auto'?p.label:p.key==='crit'?'대성공! 성공':p.key==='fumble'?'대실패… 실패':good?'성공':'실패';
  head.appendChild(el('b',null,title));
  if(p.roll)head.appendChild(el('div','sub',p.choiceId+'번 '+p.label+' · '+calcText(p.roll)));
  else if(p.battleEnd)head.appendChild(el('div','sub','전투: '+p.label));
  rb.appendChild(head);
  const story=el('div','card prose story');p.text.forEach(t=>story.appendChild(el('p',null,t)));rb.appendChild(story);
  if(p.down)rb.appendChild(el('div','down',SC.downText));
  if(p.fx.length){const cs=el('div','chips');p.fx.forEach(f=>cs.appendChild(el('span','chip'+(/^영감/.test(f)?' gold':''),f)));rb.appendChild(cs)}
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
  animateDie('shape','num',()=>{
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
  animateDie('shape','num',()=>{
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
  rows.push(['장비',[S.equip.weapon,S.equip.armor].filter(Boolean).join(', ')]);
  rows.push(['재능',S.skills.filter(id=>SC.talents.includes(id)).map(id=>SC.skillDefs[id].name).join(', ')||'없음']);
  (SC.summary||[]).forEach(x=>{const hit=x.cases.find(c=>ok(c.if));rows.push([x.label,tpl(hit?hit.t:(x.else||'-'))])});
  for(const k in (SC.counterNames||{}))rows.push([SC.counterNames[k],String(S.counters[k]||0)]);
  const kills=Object.keys(S.counters).filter(k=>k.startsWith('kill_')).reduce((a,k)=>a+S.counters[k],0);
  rows.push(['쓰러뜨린 적',kills+'마리']);
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
  S=fresh();ampOn=foOn=false;cmenu=null;shopOpen=false;save();render();toTop();
};

// ── 자유 주사위
let ftype=20,fhist=[];
[4,6,8,10,12,20].forEach(n=>{const b=el('button',n===20?'on':'','d'+n);b.dataset.n=n;b.onclick=()=>{ftype=n;document.querySelectorAll('#ftypes button').forEach(x=>x.classList.toggle('on',+x.dataset.n===n))};$('ftypes').appendChild(b)});
$('froll').onclick=()=>{const r=d(ftype);$('fres').textContent='d'+ftype+' = '+r;fhist.unshift('d'+ftype+':'+r);fhist=fhist.slice(0,8);$('fhist').textContent='최근: '+fhist.join(' / ')};
$('freset').onclick=()=>{fhist=[];ftype=20;$('fres').textContent='';$('fhist').textContent='';document.querySelectorAll('#ftypes button').forEach(x=>x.classList.toggle('on',+x.dataset.n===20))};

// ── 시작
S=restore()||fresh();
if(window.Art){
  Art.mount($('art'),artInfo);
  Art.onPick(i=>{const B=S.battle;if(S.mode==='combat'&&B&&!B.over&&!rolling&&B.enemies[i]&&B.enemies[i].hp>0){B.target=i;save();renderCombat()}});
}
render();
