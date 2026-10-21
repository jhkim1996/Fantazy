// 떨어진 별의 노래 — 제1장 「비 내리는 관문」 (오픈월드)
//
// 세계: 장소(locations)를 자유롭게 오가며 이야기(events), 탐색, 사냥(전투), 휴식, 상점을 이용한다.
// 이야기 사건: 장면 → 선택지(주사위 판정) → 결과(success / fail, crit / fumble) → next
//   next: 다른 사건 id, 'map'(지도로 돌아감), 'end'(1장 끝 화면)
//   결과에 battle이 있으면 결과를 보여 준 뒤 턴제 전투를 하고, 이기면 win / 지면 lose 결과로 이어진다.
// 모든 결과는 이야기를 끊지 않는다. 결과는 플래그와 수치로 남아 뒤의 문장·난이도·선택지·전투를 바꾼다.
//
// 직업별 문장: { mage: '…', warrior: '…', rogue: '…', bard: '…', _: '기본' }
// 낱말 치환: {name} {cls} {weapon} {item} {fine} {relic} {amp}, 조사: {item:을} {relic:으로} {name:이여}
// 수치 표시: {#kill_wolf} (카운터), {@회색 낙인 조각} (소지 개수)

// 사건이 끝날 때마다 done_<사건 id> 플래그가 자동으로 켜진다.

const AFTER_BATTLE = [
  { if: { or: [{ flag: 'oath' }, { min: { bond: 3 } }] }, fx: { set: ['orden_joins'] } },
  { fx: { unset: ['shield', 'burst'] } }
];

function RELIC(extra) {
  return Object.assign({ items: ['{relic}'], amp: { die: 8, source: '{relic}' }, mpFull: true }, extra);
}

// 천 개의 계단: 들킨 정찰병과의 전투
const SCOUT_FIGHT = {
  enemies: ['scout'],
  win: { text: ['정찰병이 쓰러졌다. 목덜미의 회색 표식이 잿가루로 흩어졌다. 털 무늬가 아니었다 — 누군가 새겨 넣은 낙인이었다.'],
    fx: { set: ['mark_seen'] }, log: '들킨 정찰병과 싸워 이겼다. 목에 박힌 회색 낙인을 보았다.', next: 'map' },
  lose: { text: ['정찰병의 이빨이 그대를 쓰러뜨렸다. 놈은 길게 울부짖고는 안개 속으로 사라졌다.'],
    log: '정찰병에게 쓰러졌다.', next: 'map' }
};

// 사냥개의 밤: 남은 사냥개와의 전투
function HOUNDS(enemies) {
  return {
    enemies: enemies, noFlee: true, art: { sky: 'star', bg: 'tomb', fx: ['motes'] },
    intro: '남은 사냥개들이 이빨을 드러내며 달려든다!',
    ally: { if: { min: { bond: 1 } }, name: '오르덴', atk: 5, dmg: '1d10+2' },
    win: {
      text: [
        '마지막 사냥개가 잿가루가 되어 흩어졌다.',
        '그러나 우두머리는 싸움에 끼어들지 않았다. 잿빛 송곳니는 새끼를 데리고 전당 깊은 곳, 무너지는 회랑으로 천천히 물러났다. 그 붉은 눈이 마지막까지 그대를 놓지 않았다.',
        '오르덴이 창을 고쳐 쥐었다. “놈을 결계의 방에 가둬야 한다. 하지만 서두르지 마라. 저놈은 천 년 묵은 사냥꾼의 개다. 충분히 강해진 뒤에 쫓아라.”'
      ],
      log: '사냥개 무리를 물리쳤다. 우두머리는 무너지는 회랑으로 물러났다.', next: 'map' },
    lose: {
      text: [
        '사냥개들의 이빨이 사방에서 파고들었다. 무릎이 꺾이는 순간, 오르덴의 창이 그대 위로 원을 그리며 놈들을 쓸어 냈다.',
        '정신을 차렸을 때, 사냥개들은 물러가 있었다. 잿빛 송곳니는 새끼를 데리고 무너지는 회랑으로 사라졌다.',
        '“살아 있으면 된다.” 오르덴이 그대를 일으켜 세웠다. “놈을 쫓으려면 더 강해져야 한다.”'
      ],
      log: '사냥개 무리에게 쓰러졌지만 오르덴이 구해 냈다. 우두머리는 무너지는 회랑으로 물러났다.', next: 'map' }
  };
}

// 결계의 방: 잿빛 송곳니와의 결전
const BOSS = {
  enemies: ['alpha'], boss: true, noFlee: true, art: { sky: 'cave', bg: 'barrier' },
  intro: '결계가 빛난다. 잿빛 송곳니가 낮게 으르렁거린다. 이제 물러설 곳은 없다.',
  mods: [
    { if: { flag: 'alpha_hurt' }, hp: -15, why: '짓눌린 뒷다리 (HP -15)' },
    { if: { flag: 'burst' }, hp: -20, why: '별빛 폭발 (HP -20)' },
    { if: { flag: 'spear' }, ac: -2, atk: -1, why: '꿰뚫린 어깨 (방어 -2, 명중 -1)' }
  ],
  hesitate: { if: { flag: 'pup_safe' }, p: 0.25, text: '품 안의 새끼가 울자, 잿빛 송곳니가 머뭇거린다.' },
  ally: { if: { or: [{ flag: 'oath' }, { min: { bond: 2 } }] }, name: '오르덴', atk: 6, dmg: '1d10+3' },
  special: [
    { id: 'unbind', label: '회색 낙인을 부순다', if: { flag: 'mark_seen' }, below: 0.4, mp: 3, stat: '지혜', dc: 16,
      dcMod: [{ if: { flag: 'mark_cracked' }, v: -3, why: '금 간 낙인' }, { if: { flag: 'pup_safe' }, v: -3, why: '새끼의 부름' }],
      note: '우두머리 HP가 40% 이하일 때. 성공하면 죽이지 않고 끝낸다',
      outcome: 'freed', failText: '얼음 같은 사슬이 손바닥을 타고 올라왔다. 그대는 억지로 손을 떼어 냈다.', failHp: -5 }
  ],
  win: {
    text: [
      '“아스텔!”',
      '그대가 그 이름을 외치는 순간, {relic}의 별빛이 창날처럼 길게 뻗어 나갔다. 빛의 창이 잿빛 송곳니의 가슴을 꿰뚫었다.',
      '거대한 짐승이 무릎을 꿇었다. 이마의 낙인이 잿가루가 되어 흩어졌고, 짐승은 마지막으로 새끼 쪽을 바라보며 — 조용히 눈을 감았다.'
    ],
    fx: { set: ['alpha_slain'] },
    fxIf: [{ if: { flag: 'pup_safe' }, fx: { items: ['잿빛 새끼'] } }].concat(AFTER_BATTLE),
    log: '결계 안에서 잿빛 송곳니를 쓰러뜨렸다.', next: 'n9' },
  freed: {
    text: [
      '그대는 무기를 내렸다. 그리고 빈손을 펴, 짐승의 이마에 박힌 회색 낙인 위에 얹었다.',
      '얼음 같은 사슬이 손바닥을 타고 올라왔다. 그대는 그것을 별빛으로 한 고리씩 끊어 냈다. 마지막 고리가 끊어지는 순간 — 낙인이 부서지고, 짐승의 핏빛 눈동자가 맑은 호박색으로 돌아왔다.',
      { if: { flag: 'pup_safe' }, t: '그대가 품에 안고 있던 새끼를 내려놓자, 새끼는 비틀거리며 어미에게 달려가 그 다리에 몸을 비볐다.' },
      '잿빛 송곳니는 오랫동안 그대를 바라보았다. 그리고 천천히, 그대의 발치에 머리를 숙였다. 짐승이 몸을 일으킨 자리에는 잿빛 털 한 줌이 떨어져 있었다.'
    ],
    fx: { set: ['alpha_freed'], items: ['잿빛 털 한 줌'], xp: 80 }, fxIf: AFTER_BATTLE,
    log: '잿빛 송곳니의 낙인을 부숴 사냥꾼의 사슬에서 해방했다.', next: 'n9' },
  lose: {
    text: [
      { if: { or: [{ flag: 'oath' }, { min: { bond: 2 } }] }, t: '짐승의 송곳니가 그대를 감싸던 오르덴의 가슴 갑주를 물어뜯었다. 천 년을 버텨 온 은빛 갑주에 깊은 균열이 갔다.' },
      '쓰러진 그대를 내려다보던 잿빛 송곳니는, 결계 기둥 하나를 들이받아 무너뜨렸다.',
      { if: { not: 'pup_safe' }, t: '짐승은 새끼의 목덜미를 물고, 무너진 틈으로 뛰쳐나갔다.' },
      { if: { flag: 'pup_safe' }, t: '짐승은 그대의 품에서 새끼를 낚아채듯 물어 올리고, 무너진 틈으로 뛰쳐나갔다.' },
      '빗속으로 사라지는 그 뒷모습을, 그대는 쓰러진 채 바라볼 수밖에 없었다.'
    ],
    fx: { set: ['alpha_fled'] },
    fxIf: [{ if: { or: [{ flag: 'oath' }, { min: { bond: 2 } }] }, fx: { set: ['orden_cracked'] } }].concat(AFTER_BATTLE),
    log: '잿빛 송곳니가 결계를 부수고 새끼와 함께 달아났다.', next: 'n9' }
};

window.SCENARIO = {
  id: 'fallen-star-ch1-world',
  title: '떨어진 별의 노래',
  chapterTitle: '제1장 · 비 내리는 관문',
  start: 'prologue',
  startLoc: 'village',
  startGold: 20,
  endArt: { sky: 'dawn', bg: 'mountains', actors: [{ k: 'hero', x: 0.5 }] },

  creation: {
    intro: [
      '천 년 동안 비가 그치지 않는 관문 아래로, 떨어진 별이 한 사람을 부르고 있다.',
      '그 사람이 어떤 힘을 타고났는지, 어떤 길을 걸어왔는지, 어떤 이름으로 불리는지 — 주사위와 그대가 정한다.'
    ],
    rerolls: 2,
    names: ['떠돌이', '카엘', '세린', '로웬', '하란', '미르', '엘리스', '다린', '유나', '테오']
  },

  hero: { level: 1, xp: 0 },

  // 기술과 그 기술이 쓰는 능력치. 숙련이면 숙련 보너스(+2, 레벨 5부터 +3)를 더하고, 두 곳에서 숙련이면 전문(두 배)
  skillList: {
    '운동': '힘', '곡예': '민첩', '손재주': '민첩', '은신': '민첩',
    '비전': '지혜', '역사': '지혜', '지각': '지혜', '통찰': '지혜', '생존': '지혜', '의학': '지혜',
    '설득': '매력', '기만': '매력', '위협': '매력', '공연': '매력'
  },
  pointBuy: { points: 20, min: 8, max: 15, cost: { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 } },
  races: [
    { id: 'human', name: '인간', bonus: { 지혜: 1, 민첩: 1, 힘: 1, 매력: 1 }, trait: '어디서든 적응한다. 모든 능력치 점수 +1.' },
    { id: 'elf', name: '엘프', bonus: { 민첩: 2, 지혜: 1 }, skills: ['지각'], trait: '예리한 감각. 민첩 +2, 지혜 +1, 지각 숙련.' },
    { id: 'dwarf', name: '드워프', bonus: { 힘: 2, 지혜: 1 }, hpPerLevel: 1, poisonResist: true, trait: '단단한 몸. 힘 +2, 지혜 +1, 레벨마다 HP +1, 독 피해 절반.' },
    { id: 'halfling', name: '하플링', bonus: { 민첩: 2, 매력: 1 }, lucky: true, trait: '타고난 행운. 민첩 +2, 매력 +1, d20에서 1이 나오면 한 번 다시 굴린다.' }
  ],
  // 배경: 숙련 기술 둘, 그리고 영감을 얻는 행동. 선택지의 insp 꼬리표가 배경과 맞으면 영감 +1
  backgrounds: [
    { id: 'soldier', name: '군인', skills: ['운동', '위협'], insp: 'brave', inspText: '정면으로 맞서거나 누군가를 지킬 때', items: ['은빛 물약'], blurb: '전장에서 살아 돌아온 사람.' },
    { id: 'sage', name: '학자', skills: ['비전', '역사'], insp: 'lore', inspText: '옛 지식과 룬을 파고들 때', items: ['푸른 물약'], blurb: '먼지 쌓인 서고에서 별의 기록을 읽던 사람.' },
    { id: 'minstrel', name: '떠돌이 악사', skills: ['공연', '설득'], insp: 'song', inspText: '노래와 이야기로 마음을 움직일 때', gold: 15, blurb: '마을에서 마을로 노래를 팔던 사람.' },
    { id: 'urchin', name: '부랑아', skills: ['손재주', '은신'], insp: 'sly', inspText: '몰래, 재빠르게, 남의 눈을 피할 때', gold: 10, blurb: '뒷골목에서 혼자 자란 사람.' },
    { id: 'pilgrim', name: '순례자', skills: ['통찰', '의학'], insp: 'mercy', inspText: '자비를 베풀거나 죽은 이를 기릴 때', items: ['은빛 물약'], blurb: '성지를 떠돌며 병자를 돌보던 사람.' },
    { id: 'hunter', name: '사냥꾼', skills: ['생존', '지각'], insp: 'wild', inspText: '짐승을 읽고 자연의 흐름을 따를 때', items: ['은빛 물약'], blurb: '숲에서 짐승의 발자국을 읽던 사람.' }
  ],
  inspMax: 4,
  // 레벨 L → L+1 에 필요한 경험치
  xpTable: [12, 24, 40, 60, 84, 112, 144, 180, 220, 264],
  stats: [{ n: '지혜' }, { n: '민첩' }, { n: '힘' }, { n: '매력' }],

  classes: [
    { id: 'mage', name: '마법사', key: '지혜', hp: 20, mp: 10, hpGain: 4, mpGain: 3, passive: 'eye', amp: '마력 증폭',
      weapon: '지팡이', item: '낡은 지팡이', fine: '잘 다듬은 지팡이', relic: '별빛 지팡이', armor: '여행자의 망토',
      skills: ['bolt', 'frost', 'starfire'],
      profs: ['비전', '통찰'],
      blurb: '룬을 읽고 마력을 다루는 학자. 마력이 넉넉하고 강한 주문을 쓰지만 몸이 약하다.' },
    { id: 'warrior', name: '전사', key: '힘', hp: 26, mp: 4, hpGain: 7, mpGain: 1, passive: 'might', amp: '투지',
      weapon: '검', item: '낡은 검', fine: '잘 벼린 검', relic: '별빛 검', armor: '낡은 사슬 조끼',
      skills: ['smash', 'warcry', 'whirl'],
      profs: ['운동', '생존'],
      blurb: '수많은 전장을 건너온 검사. HP와 방어가 가장 높아 앞에서 오래 버틴다.' },
    { id: 'rogue', name: '도적', key: '민첩', hp: 22, mp: 6, hpGain: 5, mpGain: 2, passive: 'shadow', amp: '급소 노리기',
      weapon: '단검', item: '낡은 단검', fine: '잘 벼린 단검', relic: '별빛 단검', armor: '가죽 조끼',
      skills: ['stab', 'smoke', 'venom'],
      profs: ['은신', '곡예'],
      blurb: '그림자를 밟고 다니는 떠돌이. 치명타가 잘 터지고 도망에 능하다.' },
    { id: 'bard', name: '음유시인', key: '매력', hp: 22, mp: 8, hpGain: 5, mpGain: 2, passive: 'voice', amp: '영감',
      weapon: '류트', item: '낡은 류트', fine: '새 줄을 건 류트', relic: '별빛 류트', armor: '가죽 조끼',
      skills: ['discord', 'mend', 'anthem', 'starsong'],
      profs: ['공연', '기만'],
      blurb: '옛 노래를 기억하는 가객. 노래로 적을 흔들고 스스로를 치유한다.' }
  ],

  // 이야기 판정용 재능 (레벨 업 때 능력치 대신 고를 수 있다)
  talents: ['A', 'B', 'C'],
  skillDefs: {
    amp: { name: '증폭', kind: '이야기' },
    eye: { name: '학자의 눈', kind: '패시브', desc: '지혜 +2 (수치에 포함)' },
    might: { name: '전장의 근력', kind: '패시브', desc: '힘 +2 (수치에 포함)' },
    shadow: { name: '그림자 걸음', kind: '패시브', desc: '민첩 +2 (수치에 포함)' },
    voice: { name: '별의 목소리', kind: '패시브', desc: '매력 +2 (수치에 포함)' },
    A: { name: '예지의 눈', kind: '재능', desc: '이야기 판정에서 마력 1을 써 d20을 두 번 굴려 높은 값을 쓴다' },
    B: { name: '집중', kind: '재능', desc: '{amp} 비용이 마력 1로 줄어든다' },
    C: { name: '행운의 별', kind: '재능', desc: '이야기 판정의 d20에서 1이 나오면 10으로 바꾼다' }
  },

  // 전투 기술. act: attack(한 대상) / aoe(모든 적) / heal / buff / debuffAll
  combatSkills: {
    bolt: { cls: 'mage', lv: 1, name: '마력 탄', mp: 2, act: 'attack', stat: '지혜', hit: 2, dmg: '2d6', addStat: true,
      desc: '명중 +2, 피해 2d6+지혜' },
    frost: { cls: 'mage', lv: 3, name: '서리 사슬', mp: 3, act: 'attack', stat: '지혜', dmg: '1d8', addStat: true, onHit: { stun: 1 },
      desc: '피해 1d8+지혜. 맞으면 적이 1턴 얼어붙는다' },
    starfire: { cls: 'mage', lv: 5, name: '별불', mp: 5, act: 'aoe', stat: '지혜', dmg: '3d6', addStat: true, auto: true,
      desc: '모든 적에게 피해 3d6+지혜 (반드시 맞는다)' },
    smash: { cls: 'warrior', lv: 1, name: '강타', mp: 1, act: 'attack', weapon: true, extra: '1d8',
      desc: '무기 피해 +1d8' },
    warcry: { cls: 'warrior', lv: 3, name: '전투 함성', mp: 2, act: 'buff', buff: { atk: 2, dmg: 2, ac: 2 }, turns: 3,
      desc: '3턴 동안 명중·피해·방어 +2' },
    whirl: { cls: 'warrior', lv: 5, name: '회오리 베기', mp: 3, act: 'aoe', weapon: true,
      desc: '모든 적에게 무기 공격' },
    stab: { cls: 'rogue', lv: 1, name: '급소 찌르기', mp: 2, act: 'attack', weapon: true, hit: 2, crit: 18, extra: '1d6',
      desc: '명중 +2, 피해 +1d6, 18~20에 치명타' },
    smoke: { cls: 'rogue', lv: 3, name: '연막', mp: 2, act: 'debuffAll', status: { blind: 2 },
      desc: '2턴 동안 모든 적의 공격이 불리해진다 (d20 두 번 중 낮은 값)' },
    venom: { cls: 'rogue', lv: 5, name: '독칼', mp: 3, act: 'attack', weapon: true, onHit: { poison: 3 },
      desc: '무기 공격. 맞으면 3턴 동안 매 턴 1d6 독 피해' },
    discord: { cls: 'bard', lv: 1, name: '불협화음', mp: 2, act: 'attack', stat: '매력', dmg: '2d6', addStat: true, onHit: { weak: 2 },
      desc: '피해 2d6+매력. 맞으면 2턴 동안 적 명중 -2' },
    mend: { cls: 'bard', lv: 1, name: '치유의 노래', mp: 2, act: 'heal', dmg: '2d6', stat: '매력', addStat: true,
      desc: 'HP 2d6+매력 회복' },
    anthem: { cls: 'bard', lv: 3, name: '전장의 찬가', mp: 2, act: 'buff', buff: { atk: 2, dmg: 2 }, turns: 3,
      desc: '3턴 동안 명중·피해 +2' },
    starsong: { cls: 'bard', lv: 5, name: '별의 노래', mp: 4, act: 'aoe', stat: '매력', dmg: '2d8', addStat: true, auto: true, heal: '1d8',
      desc: '모든 적에게 피해 2d8+매력 (반드시 맞는다), HP 1d8 회복' }
  },

  items: {
    '낡은 지팡이': { kind: '무기', slot: 'weapon', dice: '1d6', bonus: 0, desc: '오랜 여정을 함께한 지팡이' },
    '잘 다듬은 지팡이': { kind: '무기', slot: 'weapon', dice: '1d6', bonus: 1, price: 45, desc: '단단한 흑단으로 다시 깎은 지팡이' },
    '별빛 지팡이': { kind: '무기', slot: 'weapon', dice: '1d8', bonus: 2, desc: '일곱째 별 아스텔의 마지막 빛' },
    '낡은 검': { kind: '무기', slot: 'weapon', dice: '1d8', bonus: 0, desc: '이가 조금 빠진 낡은 검' },
    '잘 벼린 검': { kind: '무기', slot: 'weapon', dice: '1d8', bonus: 1, price: 45, desc: '행상인이 숫돌에 갈아 준 검' },
    '별빛 검': { kind: '무기', slot: 'weapon', dice: '1d10', bonus: 2, desc: '일곱째 별 아스텔의 마지막 빛' },
    '낡은 단검': { kind: '무기', slot: 'weapon', dice: '1d6', bonus: 0, crit: 19, desc: '손때 묻은 단검. 19~20 치명타' },
    '잘 벼린 단검': { kind: '무기', slot: 'weapon', dice: '1d6', bonus: 1, crit: 19, price: 45, desc: '날이 선 단검. 19~20 치명타' },
    '별빛 단검': { kind: '무기', slot: 'weapon', dice: '1d8', bonus: 2, crit: 18, desc: '일곱째 별 아스텔의 마지막 빛. 18~20 치명타' },
    '낡은 류트': { kind: '무기', slot: 'weapon', dice: '1d6', bonus: 0, desc: '줄 하나가 늘어진 낡은 류트. 울림으로 친다' },
    '새 줄을 건 류트': { kind: '무기', slot: 'weapon', dice: '1d6', bonus: 1, price: 45, desc: '은실 줄을 새로 건 류트' },
    '별빛 류트': { kind: '무기', slot: 'weapon', dice: '1d8', bonus: 2, desc: '일곱째 별 아스텔의 마지막 빛' },
    '여행자의 망토': { kind: '방어구', slot: 'armor', ac: 0, desc: '비를 겨우 막는 망토' },
    '가죽 조끼': { kind: '방어구', slot: 'armor', ac: 1, desc: '얇은 가죽 조끼' },
    '낡은 사슬 조끼': { kind: '방어구', slot: 'armor', ac: 2, desc: '군데군데 고리가 빠진 사슬 조끼' },
    '가죽 갑옷': { kind: '방어구', slot: 'armor', ac: 2, price: 40, desc: '기름 먹인 두꺼운 가죽 갑옷' },
    '사슬 갑옷': { kind: '방어구', slot: 'armor', ac: 3, price: 90, desc: '촘촘한 사슬 갑옷' },
    '엘레우스 기사의 흉갑': { kind: '방어구', slot: 'armor', ac: 4, desc: '물에 잠겨서도 녹슬지 않은 은빛 흉갑' },
    '은빛 물약': { kind: '물약', use: { hp: 15 }, battle: true, price: 15, desc: 'HP 15 회복' },
    '푸른 물약': { kind: '물약', use: { mp: 8 }, battle: true, price: 20, desc: '마력 8 회복' },
    '회색 낙인 조각': { kind: '재료', desc: '사냥개의 목에서 떨어진 낙인 조각. 세 개를 모으면 살펴볼 수 있다' },
    '기사의 반지': { kind: '증표', desc: '물에 잠긴 기사가 끼고 있던 은반지. 오르덴이 알아볼지도 모른다' },
    '잿빛 새끼': { kind: '동료', desc: '어미를 잃은 사냥개 새끼. 이마에 아직 낙인이 없다' },
    '잿빛 털 한 줌': { kind: '증표', desc: '해방된 잿빛 송곳니가 남긴 털. 언젠가 그 울음이 그대를 도울 것이다' }
  },

  // 적. atk: 명중 보너스, ac: 방어, dmg: 피해 주사위
  enemies: {
    wolf: { art: 'wolf', name: '굶주린 늑대', lv: 1, hp: 10, ac: 11, atk: 3, dmg: '1d6+1', xp: 5, gold: [2, 6],
      desc: '비에 젖은 털 사이로 갈비뼈가 드러난 늑대.' },
    bats: { art: 'bats', name: '안개 박쥐 떼', lv: 1, hp: 8, ac: 13, atk: 4, dmg: '1d4+1', xp: 4, gold: [1, 4],
      desc: '안개 속에서 날개 소리만 들리는 박쥐 떼.' },
    boar: { art: 'boar', name: '진흙 멧돼지', lv: 2, hp: 16, ac: 12, atk: 4, dmg: '1d8+2', xp: 8, gold: [3, 8],
      drops: [{ item: '은빛 물약', p: 0.15 }], desc: '진흙을 뒤집어쓴 성난 멧돼지.' },
    spider: { art: 'spider', name: '검은 소나무 거미', lv: 2, hp: 14, ac: 12, atk: 4, dmg: '1d6+1', xp: 8, gold: [2, 7],
      poison: { p: 0.35, turns: 2, dmg: '1d4' }, drops: [{ item: '푸른 물약', p: 0.1 }],
      desc: '송아지만 한 검은 거미. 송곳니에서 독이 떨어진다.' },
    bear: { art: 'bear', name: '이끼 곰', lv: 3, hp: 28, ac: 12, atk: 5, dmg: '1d10+3', xp: 14, gold: [5, 12],
      skills: [{ name: '짓누르기', p: 0.25, dmg: '2d8+3', hit: -1 }], drops: [{ item: '은빛 물약', p: 0.25 }],
      desc: '등에 이끼가 자란 거대한 곰. 숲의 주인이다.' },
    scout: { art: 'scout', name: '잿빛 사냥개 정찰병', lv: 2, hp: 14, ac: 13, atk: 4, dmg: '1d6+2', xp: 9, gold: [2, 6],
      drops: [{ item: '회색 낙인 조각', p: 0.5 }], desc: '목덜미에 회색 표식이 깜박이는 사냥개.' },
    hound: { art: 'hound', name: '잿빛 사냥개', lv: 3, hp: 20, ac: 13, atk: 5, dmg: '1d8+2', xp: 12, gold: [3, 9],
      drops: [{ item: '회색 낙인 조각', p: 0.4 }], desc: '회색 사냥꾼에게 묶인 잿빛 사냥개.' },
    leech: { art: 'leech', name: '수로 거머리', lv: 3, hp: 18, ac: 11, atk: 5, dmg: '1d6+2', xp: 11, gold: [2, 6], drain: 0.5,
      desc: '사람 팔뚝만 한 거머리. 문 자리에서 피를 빨아 회복한다.' },
    drowned: { art: 'drowned', name: '물에 잠긴 기사', lv: 5, hp: 44, ac: 15, atk: 6, dmg: '1d10+3', xp: 35, gold: [20, 35], elite: true,
      skills: [{ name: '녹슨 대검 내려치기', p: 0.3, dmg: '2d10+3', hit: -2 }],
      drops: [{ item: '기사의 반지', p: 1, once: 'got_ring' }, { item: '엘레우스 기사의 흉갑', p: 1, once: 'got_cuirass' }, { item: '은빛 물약', p: 0.5 }],
      desc: '천 년 동안 수로 바닥에 잠들어 있던 기사. 녹슨 투구 속에서 푸른 불꽃이 탄다.' },
    acolyte: { art: 'acolyte', name: '회색 사냥꾼의 추종자', lv: 4, hp: 26, ac: 14, atk: 6, dmg: '1d8+3', xp: 20, gold: [10, 20],
      skills: [{ name: '사냥개 부르기', p: 0.3, summon: 'hound', once: true }],
      drops: [{ item: '회색 낙인 조각', p: 0.6 }, { item: '푸른 물약', p: 0.3 }],
      desc: '회색 두건을 쓴 사람. 손등에 사냥개와 같은 낙인이 있다.' },
    alpha: { art: 'alpha', name: '잿빛 송곳니', lv: 6, hp: 90, ac: 15, atk: 7, dmg: '2d6+4', xp: 80, gold: [40, 60], boss: true,
      skills: [
        { name: '포효', p: 0.22, debuff: { atk: -2, turns: 2 }, text: '잿빛 송곳니가 포효한다. 다리가 굳는다! (2턴 동안 명중 -2)' },
        { name: '돌진', p: 0.25, dmg: '2d8+4', hit: -1 }
      ],
      desc: '이마에 회색 왕관 같은 낙인을 단 사냥개 무리의 우두머리. 다른 놈들보다 두 배는 크다.' }
  },

  // ── 세계 지도. x, y는 지도 위 위치 (0~320, 0~240)
  locations: {
    village: {
      art: { sky: 'rain', bg: 'village', fx: ['rain', 'fog'] },
      name: '마지막 마을', x: 60, y: 205, lv: '안전',
      desc: [
        '관문 아래 마지막 마을. 지붕은 내려앉았고, 우물에는 검은 빗물이 고였다.',
        { if: { not: 'done_n1' }, t: '언덕 끝 오두막 한 채에만 등불이 켜져 있다.' },
        { if: { flag: 'done_n1' }, t: '등불지기 노파가 불가에서 그대를 기다린다.' },
        '마을 어귀에는 빗속의 행상인이 낡은 수레를 세워 두었다.',
        { if: { flag: 'done_n10' }, t: '천 년 만에 비가 그친 지붕 위로 햇살이 내려앉았다.' }
      ],
      rest: '노파의 오두막에서 쉰다',
      shop: { name: '빗속의 행상인', items: ['은빛 물약', '푸른 물약', '{fine}', '가죽 갑옷', '사슬 갑옷'] },
      actions: [
        { label: '등불이 켜진 오두막의 문을 두드린다', event: 'n1', if: { not: 'done_n1' }, star: true },
        { label: '노파의 부탁을 듣는다', event: 'q_wolves_start', if: { flag: 'done_n1', not: 'q_wolves' } },
        { label: '노파에게 늑대 사냥을 알린다', event: 'q_wolves_end', if: { flag: 'q_wolves', not: 'q_wolves_done', min: { kill_wolf: 5 } } },
        { label: '회색 낙인 조각을 맞춰 본다', event: 'study_mark', if: { not: 'mark_seen', count: { '회색 낙인 조각': 3 } } }
      ],
      links: [{ to: 'slope' }, { to: 'forest' }]
    },
    slope: {
      art: { sky: 'rain', bg: 'slope', fx: ['fog', 'rain'] },
      name: '안개 비탈', x: 140, y: 160, lv: '1~2',
      desc: [
        '마을과 계단 사이, 안개가 강물처럼 흐르는 비탈. 굶주린 늑대들의 울음이 끊이지 않는다.',
        { if: { flag: 'shortcut' }, t: '서쪽 절벽 아래, 덩굴에 가려진 옛 수로의 입구가 보인다.' }
      ],
      encounters: [{ w: 4, e: ['wolf'] }, { w: 2, e: ['wolf', 'wolf'] }, { w: 3, e: ['bats'] }, { w: 1, e: ['boar'] }],
      ambush: 0.2,
      explore: ['ex_glint', 'ex_herb'],
      links: [{ to: 'village' }, { to: 'forest' }, { to: 'stairs' }, { to: 'aqueduct' }]
    },
    forest: {
      art: { sky: 'rain', bg: 'forest', fx: ['rain', 'fog'] },
      name: '검은 소나무 숲', x: 50, y: 110, lv: '2~3',
      desc: [
        '빛이 들지 않는 검은 소나무 숲. 거미줄이 빗물에 무겁게 늘어지고, 이끼 곰의 발자국이 깊다.',
        '비탈보다 훨씬 위험하다.'
      ],
      encounters: [{ w: 3, e: ['spider'] }, { w: 2, e: ['boar'] }, { w: 2, e: ['bear'] }, { w: 1, e: ['spider', 'spider'] }, { w: 1, e: ['wolf', 'wolf'] }],
      ambush: 0.3,
      explore: ['ex_trap', 'ex_web', 'ex_herb'],
      links: [{ to: 'village' }, { to: 'slope' }]
    },
    stairs: {
      art: { sky: 'rain', bg: 'stairs', fx: ['rain'] },
      name: '천 개의 계단', x: 190, y: 105, lv: '2~3',
      desc: [
        '고대의 거인들이 산을 깎아 만든 천 개의 계단. 이끼 낀 룬 위로 그치지 않는 비가 흐른다.',
        '잿빛 사냥개들이 계단을 오르내리며 냄새를 맡는다.'
      ],
      onEnter: [{ event: 'n2', if: { not: 'done_n2' } }],
      encounters: [{ w: 3, e: ['scout'] }, { w: 2, e: ['scout', 'scout'] }, { w: 2, e: ['hound'] }, { w: 1, e: ['wolf', 'bats'] }],
      ambush: 0.25,
      explore: ['ex_rune'],
      links: [{ to: 'slope' }, { to: 'gate' }]
    },
    aqueduct: {
      art: { sky: 'cave', bg: 'aqueduct', fx: ['drip'] },
      name: '옛 수로', x: 270, y: 150, lv: '3~5', if: { flag: 'shortcut' },
      desc: [
        '천 년 전 기사들이 물을 길어 나르던 수로. 무릎까지 차는 물속에서 무언가가 미끄러진다.',
        { if: { not: 'got_ring' }, t: '깊은 곳에서 녹슨 갑주가 부딪히는 소리가 들린다.' }
      ],
      encounters: [{ w: 4, e: ['leech'] }, { w: 2, e: ['leech', 'leech'] }, { w: 1, e: ['drowned'] }],
      ambush: 0.25,
      explore: ['ex_bones', 'ex_coins', 'ex_depths'],
      links: [{ to: 'slope' }, { to: 'gate' }]
    },
    gate: {
      art: [
        { if: { flag: 'done_n10' }, sky: 'dawn', bg: 'gate', props: ['campfire'], actors: [{ k: 'orden', x: 0.62 }] },
        { if: { flag: 'done_n4' }, sky: 'rain', bg: 'gate', props: ['campfire'], actors: [{ k: 'orden', x: 0.62 }], fx: ['rain'] },
        { sky: 'rain', bg: 'gate', actors: [{ k: 'statue', x: 0.5 }], fx: ['rain'] }
      ],
      name: '울음의 관문', x: 215, y: 50, lv: '안전',
      desc: [
        '산 하나를 통째로 깎아 세운 거대한 돌문. 그 앞으로 부서진 기사 석상들이 줄지어 서 있다.',
        { if: { flag: 'done_n4', not: 'done_n10' }, t: '깨어난 오르덴이 문 앞에 모닥불을 피웠다. 여기서는 쉬어 갈 수 있다.' },
        { if: { flag: 'done_n10' }, t: '비가 그친 관문 위로 별이 뜬다. 모닥불 곁에 오르덴의 창이 기대어 있다.' }
      ],
      onEnter: [{ event: 'n3', if: { not: 'done_n3' } }],
      rest: '오르덴 곁 모닥불에서 쉰다', restIf: { flag: 'done_n4' },
      actions: [
        { label: '오르덴에게 기사의 반지를 건넨다', event: 'q_ring_end', if: { flag: 'done_n4', item: '기사의 반지' } },
        { label: '회색 낙인 조각을 맞춰 본다', event: 'study_mark', if: { flag: 'done_n4', not: 'mark_seen', count: { '회색 낙인 조각': 3 } } }
      ],
      links: [{ to: 'stairs' }, { to: 'aqueduct' }, { to: 'tomb' }]
    },
    tomb: {
      art: [
        { if: { flag: 'done_n5' }, sky: 'star', bg: 'tomb', fx: ['motes'] },
        { sky: 'star', bg: 'tomb', props: ['relic'], fx: ['motes'] }
      ],
      name: '별의 무덤', x: 150, y: 25, lv: '3~4', if: { flag: 'done_n4' },
      desc: [
        '비가 내리지 않는 거대한 원형 전당. 그 중심에 깨진 수정관이 하늘을 향해 열려 있다.',
        { if: { flag: 'done_n5' }, t: '수정관은 비었다. 별빛의 잔향만이 공기 속에 떠돈다.' }
      ],
      actions: [
        { label: '수정관으로 다가간다', event: 'n5', if: { not: 'done_n5' }, star: true }
      ],
      links: [{ to: 'gate' }, { to: 'hall' }]
    },
    hall: {
      art: { sky: 'cave', bg: 'hall', fx: ['dust'] },
      name: '무너지는 회랑', x: 275, y: 25, lv: '4~6', if: { flag: 'done_n6' },
      desc: [
        '천장이 진동할 때마다 돌가루가 쏟아지는 회랑. 사냥개들과 회색 두건의 추종자들이 어둠 속을 서성인다.',
        { if: { not: 'done_n8' }, t: '가장 깊은 곳, 결계의 방 쪽에서 잿빛 송곳니의 숨소리가 들린다.' }
      ],
      encounters: [{ w: 3, e: ['hound'] }, { w: 2, e: ['hound', 'hound'] }, { w: 2, e: ['acolyte'] }, { w: 1, e: ['acolyte', 'hound'] }],
      ambush: 0.3,
      explore: ['ex_corpse', 'ex_rune'],
      actions: [
        { label: '회랑 깊은 곳으로 잿빛 송곳니를 쫓는다 (권장 레벨 5)', event: 'n7', if: { not: 'done_n7' }, star: true }
      ],
      links: [{ to: 'tomb' }]
    }
  },

  // 화면 위에 보이는 지금의 목표 (위에서부터 처음 맞는 것)
  goals: [
    { if: { not: 'done_n3' }, t: '북쪽의 울음의 관문으로 가라. 안개 비탈을 지나 천 개의 계단을 오르면 닿는다. 마을의 노파가 무언가 알고 있을지도 모른다.' },
    { if: { not: 'done_n5' }, t: '관문 안, 별의 무덤에서 별이 남긴 것을 찾아라. (권장 레벨 3)' },
    { if: { not: 'done_n7' }, t: '무너지는 회랑 깊은 곳으로 잿빛 송곳니를 쫓아라. 회랑의 사냥개들과 싸우며 힘을 길러라. (권장 레벨 5)' },
    { t: '제1장 완료. 자유롭게 사냥하며 힘을 기를 수 있다. 제2장 「잿빛 사냥꾼」은 준비 중이다.' }
  ],

  quests: [
    { name: '노파의 부탁', if: { flag: 'q_wolves', not: 'q_wolves_done' }, t: '안개 비탈의 굶주린 늑대 {#kill_wolf}/5 처치 → 마을의 노파에게' },
    { name: '가라앉은 맹세', if: { flag: 'found_bones', not: 'q_ring_done' }, t: '옛 수로 깊은 곳의 물에 잠긴 기사에게서 반지를 찾아 관문의 오르덴에게 (권장 레벨 5)' },
    { name: '회색 낙인', if: { not: 'mark_seen' }, t: '회색 낙인 조각 {@회색 낙인 조각}/3을 모아 마을이나 관문에서 맞춰 보면 낙인의 비밀을 알 수 있다' }
  ],

  counterNames: { bond: '오르덴과의 유대' },

  downText: '시야가 붉게 물들고 무릎이 꺾였다. 차가운 돌바닥이 뺨에 닿는 순간 — 품속에서 희미한 별빛이 번져 나와 그대를 감쌌다. 아직은 아니다. 별은 그대를 놓아주지 않았다.',

  // 사냥터에서 쓰러졌을 때: 가장 가까운 쉼터에서 깨어난다
  knockout: {
    text: '눈을 떴을 때, 그대는 {place}에 누워 있었다. 누군가 그대를 끌고 온 것이다. 주머니가 조금 가벼워졌다.',
    gate: { if: { flag: 'done_n4' }, locs: ['gate', 'tomb', 'hall', 'aqueduct', 'stairs'] }
  },

  events: {

    // ───────────────────────── 서장 (모험가 만들기 직후)
    prologue: {
      art: { sky: 'night', bg: 'mountains', props: ['stars7', 'fallingstar'], fx: ['stars'] },
      title: '서장 · 일곱째 별',
      clock: '이야기의 시작',
      text: [
        '태초의 하늘에는 일곱 개의 별이 있었다.',
        '별들은 노래하였고, 그 노래가 바다를 가르고 산맥을 일으켰다. 옛사람들은 그 노래의 조각을 ‘룬’이라 부르며 돌에 새겨 오래도록 기억하였다.',
        '천 년 전, 별들의 전쟁이 하늘을 불태우던 밤. 일곱째 별 아스텔이 노래를 멈추고 땅으로 떨어졌다.',
        '고대 엘레우스의 왕들은 별이 떨어진 자리에 산만 한 관문을 세워 그것을 봉인하였고, 마지막 맹세기사들은 스스로 돌이 되어 그 문을 지켰다.',
        '그날 이후, 관문에는 비가 그친 적이 없다. 하늘이 잃어버린 별을 위해 우는 것이라고, 사람들은 말한다.',
        '그리고 지금 — {name:이라는} 이름의 {cls} 하나가 그 빗속으로 걸어 들어간다.',
        '매일 밤 꿈속에서, 떨어진 별이 그대를 부르기 때문이다.'
      ],
      choices: [
        { id: 1, label: '빗속으로 걸어 들어간다', roll: false,
          then: {
            text: [
              '그대는 {item:을} 고쳐 쥐었다. 북쪽 하늘에는 별 대신 끝없는 비구름이 걸려 있었다.',
              '관문 아래 마지막 마을에 닿았을 때, 해는 이미 기울고 있었다. 여기서부터는 그대가 길을 고른다.'
            ],
            log: '떨어진 별의 부름을 따라 마지막 마을에 닿았다.', next: 'map' } }
      ]
    },

    // ───────────────────────── 마지막 등불 (마을)
    n1: {
      art: { sky: 'cave', bg: 'hut', actors: [{ k: 'hero', x: 0.36 }, { k: 'crone', x: 0.62, face: -1 }] },
      title: '마지막 등불',
      clock: '등불지기 노파',
      text: [
        '언덕 끝 오두막의 문을 열자, 불가에 앉은 눈먼 노파가 천천히 그대 쪽으로 고개를 돌렸다.',
        '“별 냄새가 나는구나.” 노파가 갈라진 목소리로 말했다. “사흘 전부터 잿빛 사냥개들이 울었다. 사냥꾼이 돌아온 게야. 그 관문으로 올라간 자는 아무도 내려오지 못했다.”',
        '벽에는 빛바랜 양피지 지도 한 장이 걸려 있고, 기울어진 처마 사이로 빗물이 새어 든다.'
      ],
      choices: [
        { id: 1, skill: '설득', insp: 'song', label: '노파 곁에 앉아 관문의 옛이야기를 청한다', stat: '매력', dc: 10,
          note: '성공하면 옛 전승과 선물을 얻는다',
          success: {
            text: [
              '그대가 젖은 망토를 벗고 불가에 공손히 앉자, 노파의 굳은 얼굴이 조금 풀렸다.',
              '“엘레우스의 기사들은 ‘맹세를 기억하는 자’에게만 문을 연다고 했지. 내 할머니의 할머니가 들려주던 이야기란다.” 노파는 품에서 작은 은빛 병 하나를 꺼내 그대의 손에 쥐여 주었다. “살아서 돌아오너라, 별의 아이야.”'
            ],
            fx: { set: ['lore'], items: ['은빛 물약'], xp: 3 },
            log: '등불지기 노파에게서 엘레우스의 전승과 은빛 물약을 얻었다.', next: 'map' },
          fail: {
            text: [
              '노파는 고개를 저을 뿐이었다. “말해 봐야 소용없다. 돌아가거라.”',
              '그녀는 다시 불 쪽으로 몸을 돌렸다. 그래도 문을 나서는 그대의 등 뒤로, 낮은 기도 소리가 오래도록 따라왔다.'
            ],
            log: '노파는 입을 닫았다.', next: 'map' } },

        { id: 2, skill: '역사', insp: 'lore', label: '벽에 걸린 낡은 지도를 해독한다', stat: '지혜', dc: 12,
          note: '성공하면 숨겨진 길을 찾는다',
          success: {
            text: [
              '번진 잉크 아래에서, 그대의 눈은 지워진 선 하나를 찾아냈다.',
              '안개 비탈 서쪽 절벽을 따라 관문까지 이어지는 옛 수로 — 천 년 전 기사들이 물을 길어 나르던 비밀 통로였다. 그대는 그 길을 마음속에 새겼다.'
            ],
            fx: { set: ['shortcut'], xp: 3 },
            log: '낡은 지도에서 옛 수로를 찾아냈다. (지도에 옛 수로가 나타났다)', next: 'map' },
          fail: {
            text: [
              '글자들은 빗물에 녹아내린 듯 흐릿했고, 해독은 밤이 깊도록 끝나지 않았다.',
              '그사이 먼 산등성이에서 늑대 울음 같은 소리가 길게 이어졌다. 하나, 둘, 그리고 수십. 사냥개들이 무언가의 냄새를 맡은 것이다.'
            ],
            fx: { set: ['alerted'] },
            log: '지도 해독에 매달리다 밤이 깊었다. 사냥개들이 울기 시작했다.', next: 'map' } },

        { id: 3, skill: '운동', insp: 'mercy', label: '무너져 가는 오두막을 손봐 준다', stat: '힘', dc: 11,
          note: '성공하면 노파의 마음을 얻는다',
          success: {
            text: [
              '그대는 말없이 젖은 장작을 패고, 기울어진 처마 기둥을 어깨로 받쳐 다시 세웠다. 빗물이 새던 지붕이 조용해지자, 노파가 처음으로 웃었다.',
              '그날 밤 불가에서, 노파는 옛이야기를 들려주었다. “엘레우스의 기사들은 ‘맹세를 기억하는 자’에게만 문을 연다고 했지.” 그리고 작은 은빛 병 하나를 그대의 손에 쥐여 주었다.'
            ],
            fx: { set: ['lore'], items: ['은빛 물약'], xp: 3 },
            log: '노파의 오두막을 고쳐 주고 엘레우스의 전승과 은빛 물약을 얻었다.', next: 'map' },
          fail: {
            text: [
              '기둥을 받치는 순간, 젖은 나무가 미끄러지며 그대의 손등을 찧었다. 처마는 결국 반쯤 무너져 내렸다.',
              '노파는 혀를 찼지만, 그래도 불가 한쪽을 내주었다.'
            ],
            fx: { hp: -2 },
            log: '오두막을 고치다 손을 다쳤다 (HP -2).', next: 'map' } }
      ]
    },

    q_wolves_start: {
      art: { sky: 'cave', bg: 'hut', actors: [{ k: 'hero', x: 0.36 }, { k: 'crone', x: 0.62, face: -1 }] },
      title: '노파의 부탁',
      clock: '마지막 마을',
      text: [
        '“늑대들이 굶주려 마을까지 내려온다.” 노파가 마른 손으로 불씨를 뒤적였다. “우물가도, 닭장도 성한 곳이 없어.”',
        '“안개 비탈의 늑대 다섯만 쫓아 주면… 이 늙은이가 가진 것을 내주마.”'
      ],
      choices: [
        { id: 1, insp: 'mercy', label: '부탁을 들어준다', roll: false,
          then: { text: ['노파가 고개를 끄덕였다. “조심하거라. 그놈들은 무리로 다닌다.”'], fx: { set: ['q_wolves'] },
            log: '노파의 부탁을 받았다: 안개 비탈의 굶주린 늑대 5마리.', next: 'map' } },
        { id: 2, label: '지금은 어렵다고 말한다', roll: false,
          then: { text: ['“그래, 그래. 별의 아이에게는 더 큰 일이 있겠지.” 노파는 다시 불 쪽으로 몸을 돌렸다.'], next: 'map' } }
      ]
    },

    q_wolves_end: {
      art: { sky: 'cave', bg: 'hut', actors: [{ k: 'hero', x: 0.36 }, { k: 'crone', x: 0.62, face: -1 }] },
      title: '노파의 부탁',
      clock: '마지막 마을',
      text: [
        '늑대 다섯 마리를 쫓았다는 말에, 노파는 한참을 말없이 그대의 손을 쓰다듬었다.',
        '“고맙구나.” 노파는 마루 밑에서 오래된 가죽 주머니를 꺼냈다.'
      ],
      choices: [
        { id: 1, label: '주머니를 받는다', roll: false,
          then: {
            text: [
              '주머니 안에는 녹슨 동전 몇 닢과 은빛 병 두 개가 들어 있었다.',
              '“그리고 이건 덤이다. 엘레우스의 기사들은 ‘맹세를 기억하는 자’에게만 문을 연다고 했지. 기억해 두거라.”'
            ],
            fx: { set: ['q_wolves_done', 'lore'], gold: 30, items: ['은빛 물약', '은빛 물약'], xp: 15 },
            log: '노파의 부탁을 마쳤다. 금화 30과 은빛 물약 둘, 엘레우스의 전승을 얻었다.', next: 'map' } }
      ]
    },

    study_mark: {
      title: '회색 낙인',
      clock: '낙인 조각 세 개',
      text: [
        '세 조각을 맞추자 하나의 문양이 되었다. 왕관을 쓴 사냥개 — 그리고 그 아래, 낯선 룬으로 새겨진 이름 하나.'
      ],
      choices: [
        { id: 1, skill: '비전', insp: 'lore', label: '낙인의 룬을 읽어 낸다', stat: '지혜', dc: 12,
          adv: [{ if: { flag: 'lore' }, why: '노파의 전승' }],
          note: '성공하면 낙인의 비밀을 안다',
          success: {
            text: [
              '‘묶는 자, 회색 사냥꾼.’',
              '이 낙인은 짐승의 뜻을 빼앗아 사냥꾼의 뜻을 심는 사슬이었다. 사슬이라면 — 끊을 수도 있다.'
            ],
            fx: { set: ['mark_seen'], drop: ['회색 낙인 조각', '회색 낙인 조각', '회색 낙인 조각'], xp: 10 },
            log: '회색 낙인의 비밀을 알아냈다. 낙인은 끊을 수 있는 사슬이다.', next: 'map' },
          fail: {
            text: ['룬을 읽으려는 순간, 조각 하나가 재가 되어 부서졌다. 조각을 더 모아야 한다.'],
            fx: { drop: ['회색 낙인 조각'] },
            log: '낙인 조각 하나가 부서졌다.', next: 'map' } }
      ]
    },

    // ───────────────────────── 천 개의 계단 (처음 도착하면)
    n2: {
      art: { sky: 'rain', bg: 'stairs', actors: [{ k: 'scout', x: 0.64 }], fx: ['rain', 'fog'] },
      title: '천 개의 계단',
      clock: '사냥개 정찰병',
      text: [
        '관문으로 오르는 천 개의 계단은 고대의 거인들이 산을 깎아 만들었다고 전해진다. 계단마다 이끼 낀 룬이 희미하게 빛나고, 그 위로 그치지 않는 비가 흘러내린다.',
        '오백 번째 계단쯤에서 그대는 걸음을 멈췄다. 안개 너머, 잿빛 털의 짐승 한 마리가 코를 땅에 박은 채 냄새를 맡고 있었다. 송아지만 한 몸집에, 목덜미에서는 회색 표식이 불길하게 깜박인다.',
        { if: { not: 'alerted' }, t: '사냥개의 정찰병이다. 놈은 아직 그대를 보지 못했다.' },
        { if: { flag: 'alerted' }, t: '사냥개의 정찰병이다. 놈은 이미 귀를 곤두세우고 있다.' }
      ],
      choices: [
        { id: 1, stat: 'class', dc: 13,
          label: {
            mage: '마력 탄을 날려 정찰병을 단숨에 쓰러뜨린다',
            warrior: '안개를 뚫고 달려들어 정찰병을 단칼에 베어 넘긴다',
            rogue: '단검을 던져 정찰병의 목을 노린다',
            bard: '낮은 자장가로 정찰병을 홀려 잠재운다'
          },
          note: '실패하면 놈이 울어 무리를 부른다',
          success: {
            text: [
              { mage: '지팡이 끝에서 푸른 빛줄기가 빗줄기를 꿰뚫었다. 짐승은 울음 한 번 내지 못하고 계단 아래로 굴러떨어졌다.',
                warrior: '그대는 빗물을 튀기며 단숨에 거리를 좁혔다. 검이 한 번 번뜩였고, 짐승은 울음 한 번 내지 못하고 계단 아래로 굴러떨어졌다.',
                rogue: '단검이 빗줄기 사이를 소리 없이 날아가 짐승의 목에 꽂혔다. 짐승은 울음 한 번 내지 못하고 계단 아래로 굴러떨어졌다.',
                bard: '그대가 낮게 흥얼거리자 짐승의 귀가 축 늘어졌다. 오래된 자장가였다. 놈은 비틀거리다 이끼 낀 계단 위에 몸을 웅크리고 잠들어 버렸다.' },
              { _: '놈이 쓰러진 자리에서, 목덜미의 회색 표식이 잿가루가 되어 흩어졌다. 그것은 털 무늬가 아니었다. 누군가가 새겨 넣은 낙인이었다.',
                bard: '잠든 놈에게 다가가 보니, 목덜미의 회색 표식은 털 무늬가 아니었다. 누군가가 새겨 넣은 낙인이었다. 그대는 놈이 깨기 전에 조용히 그 곁을 지나쳤다.' }
            ],
            fx: { set: ['mark_seen'], xp: 4 },
            log: '사냥개 정찰병을 소리 없이 제압했다. 목에 박힌 회색 낙인을 보았다.', next: 'map' },
          fail: {
            text: [
              { mage: '빛줄기는 빗나가 돌계단을 깨뜨렸다.',
                warrior: '젖은 계단에서 발이 미끄러졌고, 검은 허공만 갈랐다.',
                rogue: '빗물에 손이 미끄러졌다. 단검은 짐승의 귀를 스치고 바위에 튕겨 나갔다.',
                bard: '노래는 빗소리에 묻혀 버렸다.' },
              '짐승이 고개를 쳐들었고 — 길고 날카로운 울음이 산 전체에 메아리쳤다. 놈은 그대의 팔을 한 번 물어뜯고는 안개 속으로 사라졌다.'
            ],
            fx: { hp: -3, set: ['alerted'] },
            log: '정찰병을 놓쳤다. 놈의 울음이 무리를 깨웠다 (HP -3).', next: 'map' } },

        { id: 2, skill: '은신', insp: 'sly', label: '바위 뒤에 숨어 놈이 지나가기를 기다린다', stat: '민첩', dc: 12,
          dis: [{ if: { flag: 'alerted' }, why: '놈이 경계 중' }],
          note: '성공하면 놈의 정체를 살핀다',
          success: {
            text: [
              '그대는 숨을 죽이고 빗소리 속에 몸을 녹였다.',
              '짐승이 바로 곁을 스쳐 지나갈 때, 그대는 보았다. 놈의 목덜미에 박힌 회색 표식은 털 무늬가 아니었다. 사람의 손으로 새긴 낙인 — 이 짐승들은 누군가에게 ‘묶여’ 있다.'
            ],
            fx: { set: ['mark_seen'], xp: 3 },
            log: '숨어서 정찰병을 지나 보냈다. 놈의 목에 박힌 회색 낙인을 보았다.', next: 'map' },
          fail: {
            text: [
              '발밑의 자갈 하나가 계단 아래로 굴러 내려갔다. 짐승의 붉은 눈이 그대를 향했다.',
              '숨을 곳은 없다. 싸워야 한다.'
            ],
            fx: { set: ['alerted'] },
            battle: SCOUT_FIGHT,
            log: '숨어 있다 들켰다.', next: 'map' } },

        { id: 3, insp: 'brave', label: '정면으로 맞서 싸운다', roll: false, note: '전투',
          then: {
            text: ['그대는 숨을 고르고 계단 위로 걸어 나갔다. 짐승이 낮게 으르렁거리며 돌아섰다.'],
            battle: {
              enemies: ['scout'],
              win: { text: ['정찰병이 쓰러졌다. 목덜미의 회색 표식이 잿가루로 흩어졌다. 털 무늬가 아니었다 — 누군가 새겨 넣은 낙인이었다.'],
                fx: { set: ['mark_seen'] }, log: '정찰병과 싸워 이겼다. 목에 박힌 회색 낙인을 보았다.', next: 'map' },
              lose: { text: ['정찰병의 이빨이 그대를 쓰러뜨렸다. 놈은 길게 울부짖고는 안개 속으로 사라졌다. 멀리서 대답하는 울음들이 들려온다.'],
                fx: { set: ['alerted'] }, log: '정찰병에게 쓰러졌다. 놈의 울음이 무리를 깨웠다.', next: 'map' } },
            next: 'map' } },

        { id: 4, label: '바람을 등지고 냄새를 숨긴 채 지나간다', stat: '지혜', skill: '생존', dc: 11, insp: 'wild',
          note: '성공하면 놈의 정체를 살핀다',
          success: {
            text: [
              '그대는 젖은 이끼를 손에 문질러 몸의 냄새를 덮고, 바람이 등 뒤에서 불어오는 쪽으로 한 계단씩 비켜 올랐다.',
              '짐승은 코를 킁킁거렸지만 끝내 고개를 돌리지 않았다. 바로 곁을 지나칠 때, 그대는 놈의 목덜미에 박힌 회색 표식을 똑똑히 보았다. 털 무늬가 아니다. 누군가 새겨 넣은 낙인이다.'
            ],
            fx: { set: ['mark_seen'], xp: 3 },
            log: '바람을 읽어 정찰병 곁을 지나쳤다. 목에 박힌 회색 낙인을 보았다.', next: 'map' },
          fail: {
            text: ['바람이 갑자기 방향을 바꿨다. 짐승의 코가 그대를 향했다.'],
            battle: SCOUT_FIGHT,
            log: '바람이 바뀌었다. 정찰병이 냄새를 맡았다.', next: 'map' } }
      ]
    },

    // ───────────────────────── 울음의 관문 (처음 도착하면)
    n3: {
      art: { sky: 'rain', bg: 'gate', actors: [{ k: 'hero', x: 0.3 }, { k: 'statue', x: 0.55 }], fx: ['rain'] },
      title: '울음의 관문',
      clock: '관문을 깨운다',
      text: [
        '마침내, 관문이 모습을 드러냈다.',
        '성벽이라기보다 산 하나를 통째로 깎아 세운 듯한 거대한 돌문이었다. 그 앞으로 창을 든 기사 석상들이 줄지어 서 있었지만, 대부분은 부서지고 이끼에 뒤덮였다. 오직 문 바로 앞의 한 기사만이 온전한 모습으로 고개를 숙이고 있었다.',
        '문 한가운데에는 일곱 개의 별을 새긴 원이 있었고, 그 가장자리를 따라 고대 엘레우스의 룬이 빽빽하게 둘러져 있었다. 일곱째 별의 자리만이 텅 비어 있다.',
        '빗물이 룬의 홈을 따라 흘러내린다. 마치 문 자체가 울고 있는 것처럼.',
        { if: { flag: 'alerted' }, t: '저 아래 계단에서, 사냥개들의 울음소리가 점점 가까워지고 있다. 서둘러야 한다.' }
      ],
      choices: [
        { id: 1, skill: '비전', insp: 'lore', label: '문에 새겨진 룬을 해독한다', stat: '지혜', dc: 13,
          adv: [{ if: { flag: 'lore' }, why: '노파의 전승' }],
          note: '성공하면 문지기가 그대를 믿는다',
          success: {
            text: [
              '룬은 글자가 아니라 노래였다. 그대의 입술이 저절로 그 뜻을 읊조렸다.',
              '‘맹세를 기억하는 자여, 일곱째 별의 부름을 받은 자여. 문은 그대를 위하여 울음을 멈추리라.’',
              '마지막 구절을 읽는 순간 — 문 앞의 석상 기사가 천천히 고개를 들었다. 돌의 눈꺼풀 아래에서, 금빛 눈동자가 그대를 바라보았다.'
            ],
            fx: { add: { bond: 1 }, xp: 4 },
            log: '관문의 룬을 해독했다. 문 앞의 석상 기사가 눈을 떴다.', next: 'n4' },
          fail: {
            text: [
              '룬 하나를 잘못 읽은 순간, 문 전체가 핏빛으로 타올랐다. 반발한 마력이 그대를 계단 아래로 내동댕이쳤다.',
              '그리고 그 진동에 — 문 앞의 석상 기사가 천천히 고개를 들었다. 돌의 눈꺼풀 아래에서, 금빛 눈동자가 차갑게 그대를 내려다보았다.'
            ],
            fx: { hp: -3, set: ['wary'] },
            log: '룬 해독에 실패해 반발을 맞았다 (HP -3). 석상 기사가 경계하며 깨어났다.', next: 'n4' } },

        { id: 2, skill: '공연', insp: 'song', label: '꿈속에서 들은 별의 노래를 소리 내어 부른다', stat: '매력', dc: 13,
          note: '어렵다. 성공하면 기사의 마음을 크게 움직인다',
          success: {
            text: [
              '그대는 꿈속에서 수없이 들었던 그 선율을 기억해 냈다. 낮고 오래된 노래가 빗소리 위로 퍼져 나가자, 룬이 하나씩 금빛으로 깨어났다.',
              '노래가 끝났을 때, 석상 기사는 이미 무릎을 꿇고 있었다. 돌가루가 흘러내리는 그의 뺨 위로, 빗물인지 눈물인지 모를 것이 흘렀다.',
              '“그 노래를… 다시 듣게 될 줄은 몰랐다.” 천 년 묵은 목소리가 떨렸다.'
            ],
            fx: { add: { bond: 2 }, xp: 5 },
            log: '별의 노래를 불러 석상 기사를 깨웠다. 기사가 무릎을 꿇었다.', next: 'n4' },
          fail: {
            text: [
              '목소리가 갈라지고 선율이 엇나갔다. 룬들이 불협화음처럼 어지럽게 깜박이다가, 그대를 향해 날카로운 빛을 쏘아 보냈다.',
              '정적 속에서, 석상 기사가 고개를 들었다. “감히 그 노래를 더럽히는 자가 누구냐.”'
            ],
            fx: { hp: -2, set: ['wary'] },
            log: '노래가 엇나갔다. 석상 기사가 노하여 깨어났다 (HP -2).', next: 'n4' } },

        { id: 3, stat: 'class', dc: 11,
          label: {
            mage: '별 문양의 빈자리에 마력을 흘려 넣는다',
            warrior: '거대한 돌문을 어깨로 밀어붙인다',
            rogue: '문틈에 숨겨진 옛 장치를 찾아 연다',
            bard: '부서진 석상들 앞에서 옛 기사들의 이름을 부른다'
          },
          note: '증폭 권장',
          success: {
            text: [
              { mage: '그대의 마력이 빈자리를 채우자, 일곱 개의 별이 차례로 빛을 발했다. 거대한 문이 산 전체를 울리며 낮게 진동했다.',
                warrior: '그대는 어깨를 돌문에 붙이고 온몸으로 밀었다. 천 년 동안 움직인 적 없던 돌이 비명처럼 갈리는 소리를 내며 한 뼘, 또 한 뼘 밀려났다. 산 전체가 낮게 진동했다.',
                rogue: '룬 사이에 교묘하게 숨겨진 홈 하나가 그대의 손끝에 걸렸다. 그 안의 오래된 톱니를 돌리자, 문 깊은 곳에서 무언가가 철컥 맞물리는 소리가 났다. 산 전체가 낮게 진동했다.',
                bard: '그대는 부서진 석상들 앞을 천천히 걸으며, 옛 노래에 나오는 기사들의 이름을 하나하나 불렀다. 이름이 빗속으로 퍼져 나갈 때마다, 룬들이 대답하듯 희미하게 빛났다.' },
              { mage: '그 진동에, 문 앞의 석상 기사가 고개를 들었다. “별의 마력이다… 그것을 어디서 얻었느냐.”',
                warrior: '그 진동에, 문 앞의 석상 기사가 고개를 들었다. “천 년 동안 그 문을 힘으로 민 자는 없었다.”',
                rogue: '그 소리에, 문 앞의 석상 기사가 고개를 들었다. “문지기를 깨우는 장치를 아는 자라… 예사로운 도둑은 아니로군.”',
                bard: '마지막 이름에, 문 앞의 석상 기사가 고개를 들었다. “…그것은 내 형제들의 이름이다. 누가 아직 그 이름을 기억하는가.”' }
            ],
            fx: { xp: 4 },
            log: '관문을 깨웠다. 문 앞의 석상 기사가 눈을 떴다.', next: 'n4' },
          fail: {
            text: [
              { mage: '문은 마른 땅이 물을 빨아들이듯 그대의 마력을 삼켜 버렸다. 현기증과 함께 무릎이 꺾였다.',
                warrior: '돌문은 꿈쩍도 하지 않았다. 대신 어깨에서 무언가 뚝 하는 소리가 났고, 그대는 이를 악문 채 무릎을 꿇었다.',
                rogue: '톱니를 돌리는 순간, 녹슨 바늘 하나가 튀어나와 손가락을 찔렀다. 천 년 묵은 함정이었다.',
                bard: '이름 하나가 혀끝에서 엉켰다. 틀린 이름이 빗속에 울리자, 룬들이 성난 듯 붉게 깜박이며 그대를 후려쳤다.' },
              '그리고 — 석상 기사가 천천히 고개를 들었다. 금빛 눈동자가 차갑게 그대를 내려다보았다. “무엇을 하러 왔느냐.”'
            ],
            fx: { mage: { mp: -3, set: ['wary'] }, _: { hp: -3, set: ['wary'] } },
            log: { mage: '관문이 마력을 삼켰다 (마력 -3). 석상 기사가 경계하며 깨어났다.',
                   _: '관문을 깨우다 다쳤다 (HP -3). 석상 기사가 경계하며 깨어났다.' },
            next: 'n4' } }
      ]
    },

    n4: {
      art: { sky: 'rain', bg: 'gate', actors: [{ k: 'hero', x: 0.32 }, { k: 'orden', x: 0.6, face: -1 }], fx: ['rain'] },
      title: '돌의 기사',
      clock: '문지기 오르덴',
      text: [
        '석상의 표면에서 돌비늘이 우수수 떨어져 내렸다. 그 아래에서 드러난 것은 은빛 갑주를 두른 거구의 기사였다. 녹슨 장창이 그의 손에서 천 년 묵은 빗물을 털어 냈다.',
        '“나는 엘레우스의 마지막 맹세기사, 오르덴. 천 년 동안 이 문을 지켜 왔다. 그대의 이름은?”',
        '“{name}.” 그대가 답하자, 기사는 그 이름을 입속으로 천천히 되뇌었다.',
        { if: { not: 'wary', min: { bond: 1 } }, t: '“그대에게서 별의 냄새가 난다. 내가 기다려 온 자가… 그대인가?”' },
        { if: { flag: 'wary' }, t: '그의 창끝이 그대의 목을 겨누었다. “증명하라. 그대가 사냥꾼의 하수인이 아니라는 것을.”' },
        { if: { not: 'wary', max: { bond: 0 } }, t: '그는 창을 세운 채 그대를 오래 바라보았다. 그 눈빛에는 경계도 환영도 없었다. 다만 천 년의 피로가 있을 뿐이었다.' }
      ],
      choices: [
        { id: 1, skill: '설득', insp: 'song', label: '꿈속의 별이 그대를 불렀다고 털어놓는다', stat: '매력', dc: 11,
          adv: [{ if: { min: { bond: 1 } }, why: '이미 그대를 믿음' }],
          dis: [{ if: { flag: 'wary' }, why: '기사가 경계 중' }],
          note: '성공하면 오르덴의 신뢰를 얻는다',
          success: {
            text: [
              '그대는 매일 밤의 꿈을 이야기했다. 불타는 하늘과 떨어지는 별, 그리고 그대를 부르던 목소리를.',
              '오르덴은 오래 침묵하다가 창을 거두었다. “아스텔께서… 아직 노래하고 계셨군.” 그의 금빛 눈에 처음으로 온기가 돌았다.',
              '기사는 문 앞에 모닥불을 피웠다. “지칠 때면 여기로 오라. 문 안쪽, 별의 무덤으로 가는 길도 열어 두겠다.”'
            ],
            fx: { add: { bond: 1 }, unset: ['wary'], xp: 4 },
            log: '꿈 이야기를 들려주어 오르덴의 신뢰를 얻었다. 별의 무덤으로 가는 길이 열렸다.', next: 'map' },
          fail: {
            text: [
              '오르덴은 고개를 저었다. “꿈은 누구나 꾼다. 사냥꾼의 개들도 꿈을 꾸지.”',
              '그러나 그는 창을 거두고 길을 비켜섰다. “그래도 들어가라. 별께서 그대를 거부하신다면, 그때 내가 그대를 베겠다.” 기사는 문 앞에 모닥불을 피우고 그 곁에 앉았다.'
            ],
            log: '오르덴은 믿지 않았지만 별의 무덤으로 가는 길을 내주었다.', next: 'map' } },

        { id: 2, skill: '역사', insp: 'lore', label: '엘레우스의 고어로 맹세의 구절을 읊는다', stat: '지혜', dc: 14,
          bonus: [{ if: { flag: 'lore' }, v: 3, why: '노파의 전승' }],
          note: '어렵다. 성공하면 오르덴이 충성을 맹세한다',
          success: {
            text: [
              '‘별이 떨어진 밤에도 우리는 무릎 꿇지 않으리. 마지막 빛이 꺼질 때까지 이 문을 지키리.’',
              '그대가 읊은 것은 천 년 전, 기사들이 돌이 되기 직전에 마지막으로 외친 맹세였다.',
              '오르덴의 장창이 바닥을 내리찍었다. 그리고 그는 — 한쪽 무릎을 꿇었다. “그 맹세를 아는 자에게 나의 창을 바친다. 이제부터 이 오르덴은 그대의 방패다.”'
            ],
            fx: { add: { bond: 2 }, set: ['oath'], unset: ['wary'], xp: 6 },
            log: '엘레우스의 맹세를 읊었다. 오르덴이 충성을 맹세했다. 별의 무덤으로 가는 길이 열렸다.', next: 'map' },
          fail: {
            text: [
              '고어 한 마디가 혀끝에서 뒤엉켰다. 오르덴의 장창이 땅을 내리찍었고, 그 충격파가 그대를 문기둥에 처박았다.',
              '“맹세를 흉내 내는 자는 많았다.” 쓰러진 그대를 내려다보던 그는, 그러나 잠시 망설였다. “…그래도 그 구절을 입에 올린 자는 천 년 만에 처음이로군. 들어가라.”'
            ],
            fx: { hp: -4 },
            log: '맹세의 구절을 틀렸다 (HP -4). 그래도 오르덴은 길을 열었다.', next: 'map' } },

        { id: 3, skill: '곡예', insp: 'brave', label: '창을 든 기사에게 겨루어 실력을 증명하겠다고 맞선다', stat: '민첩', dc: 14,
          note: '어렵다. 성공하면 오르덴이 동행을 맹세한다',
          success: {
            text: [
              { _: '오르덴의 장창이 세 번 허공을 갈랐고, 그대는 세 번 모두 빗줄기 사이로 몸을 빼냈다. 네 번째 찌르기가 오기 전, 그대의 {weapon} 끝이 그의 투구 앞에서 멈췄다.',
                bard: '오르덴의 장창이 세 번 허공을 갈랐고, 그대는 세 번 모두 빗줄기 사이로 몸을 빼냈다. 네 번째 찌르기가 오기 전, 그대가 휘두른 류트의 목이 그의 투구 앞에서 멈췄다.' },
              '기사는 낮게 웃었다. 천 년 만의 웃음이었다. “좋다. 그 발이라면 사냥개에게서도 살아남겠군. 나의 창을 그대와 나누겠다.”'
            ],
            fx: { add: { bond: 2 }, set: ['oath'], unset: ['wary'], xp: 6 },
            log: '오르덴과 겨루어 실력을 증명했다. 오르덴이 동행을 맹세했다.', next: 'map' },
          fail: {
            text: [
              '첫 번째 찌르기는 피했다. 두 번째는 — 피하지 못했다. 창대가 옆구리를 후려쳤고, 그대는 빗물 웅덩이에 처박혔다.',
              '“용기는 있군.” 오르덴이 손을 내밀었다. “용기만으로는 별을 지킬 수 없지만… 용기 없이는 아무것도 지킬 수 없지.”'
            ],
            fx: { hp: -5, add: { bond: 1 }, unset: ['wary'] },
            log: '오르덴에게 맞서다 창대에 맞았다 (HP -5). 그래도 기사는 손을 내밀었다.', next: 'map' } },

        { id: 4, skill: '운동', insp: 'brave', label: '기사의 창대를 맨손으로 붙잡고 힘을 겨루자고 청한다', stat: '힘', dc: 14,
          note: '어렵다. 성공하면 오르덴이 동행을 맹세한다',
          success: {
            text: [
              '그대가 손을 내밀자, 오르덴은 잠시 망설이다 창대를 내밀었다. 그대는 그것을 맨손으로 움켜쥐었다. 천 년 묵은 돌의 팔과 살아 있는 팔이 빗속에서 맞섰다.',
              '창대가 부르르 떨렸다. 그리고 — 한 치, 기사 쪽으로 밀려났다. 오르덴이 먼저 손을 풀었다. “하하… 이 오르덴을 밀어낸 자는 엘레우스의 왕 이후 처음이다. 나의 창을 그대와 나누겠다.”'
            ],
            fx: { add: { bond: 2 }, set: ['oath'], unset: ['wary'], xp: 6 },
            log: '오르덴과 힘을 겨루어 이겼다. 오르덴이 동행을 맹세했다.', next: 'map' },
          fail: {
            text: [
              '창대를 붙잡는 순간, 바위를 미는 것 같은 힘이 그대를 덮쳤다. 오르덴이 창을 한 번 비틀자, 그대의 몸은 허공을 돌아 돌바닥에 내리꽂혔다.',
              '“무모하군.” 기사가 창을 거두며 말했다. “그러나 맨손으로 내 창을 붙잡은 자는 오랜만이다. 일어나라.”'
            ],
            fx: { hp: -5, add: { bond: 1 }, unset: ['wary'] },
            log: '오르덴과 힘을 겨루다 내던져졌다 (HP -5). 그래도 기사는 그대를 인정했다.', next: 'map' } },

        { id: 5, label: '엘레우스 왕가의 마지막 사자라고 둘러댄다', stat: '매력', skill: '기만', dc: 15, insp: 'sly',
          note: '어렵다. 들키면 기사가 그대를 의심한다',
          success: {
            text: [
              '“나는 엘레우스 왕가의 마지막 사자다. 왕께서 별의 무덤을 살피라 명하셨다.”',
              '오르덴의 금빛 눈이 오래도록 그대를 훑었다. 그리고 — 창끝이 천천히 내려갔다. “왕가는 천 년 전에 끊겼다고 들었다만… 그 눈빛은 거짓을 말하는 자의 것이 아니로군.” 기사는 문 앞에 모닥불을 피웠다.'
            ],
            fx: { add: { bond: 1 }, unset: ['wary'], xp: 4 },
            log: '왕가의 사자라고 둘러대 오르덴을 믿게 했다.', next: 'map' },
          fail: {
            text: [
              '“엘레우스의 마지막 왕은 내 눈앞에서 돌이 되었다.” 오르덴의 목소리가 얼음처럼 식었다. “그 왕가의 사자라고?”',
              '기사는 길을 비켜섰지만 그대에게서 눈을 떼지 않았다. 문 앞에 모닥불을 피우면서도, 창은 손에서 놓지 않았다.'
            ],
            fx: { set: ['wary', 'lied'] },
            log: '거짓말이 들통났다. 오르덴이 그대를 의심한다.', next: 'map' } }
      ]
    },

    q_ring_end: {
      art: { sky: 'rain', bg: 'gate', props: ['campfire'], actors: [{ k: 'hero', x: 0.3 }, { k: 'orden', x: 0.64, face: -1 }], fx: ['rain'] },
      title: '가라앉은 맹세',
      clock: '울음의 관문',
      text: [
        '그대가 은반지를 내밀자, 오르덴의 손이 멈췄다.',
        '“카이론…” 기사는 반지 안쪽에 새겨진 이름을 손끝으로 쓸었다. “내 동생이다. 사냥꾼의 개들이 처음 몰려온 밤, 수로를 지키러 내려갔다가 돌아오지 못했지.”'
      ],
      choices: [
        { id: 1, insp: 'mercy', label: '반지를 오르덴에게 돌려준다', roll: false,
          then: {
            text: [
              '오르덴은 반지를 자신의 새끼손가락에 끼웠다. 한참 동안 아무 말도 하지 않던 그가, 이윽고 그대를 바라보았다.',
              '“그대는 내 형제를 물에서 건져 주었다. 이 빚은 창으로 갚겠다.”'
            ],
            fx: { set: ['q_ring_done'], drop: ['기사의 반지'], add: { bond: 1 }, items: ['은빛 물약', '푸른 물약'], xp: 25 },
            log: '오르덴에게 동생 카이론의 반지를 돌려주었다.', next: 'map' } }
      ]
    },

    // ───────────────────────── 별의 무덤
    n5: {
      art: { sky: 'star', bg: 'tomb', props: ['relic'], actors: [{ k: 'hero', x: 0.3 }], fx: ['motes'] },
      title: '별의 무덤',
      clock: '{relic:을} 손에 넣는다',
      text: [
        '문 안쪽에는 비가 내리지 않았다.',
        { mage: '천 년 동안 바깥의 빗소리만을 들어 온 거대한 원형 전당. 그 중심에서, 깨진 수정관 하나가 하늘을 향해 열려 있었다. 그 안에 누워 있는 것은 별의 시체가 아니라 — 지팡이 하나였다. 은빛 나무를 따라 푸른 별빛이 심장 박동처럼 고동치고 있었다.',
          warrior: '천 년 동안 바깥의 빗소리만을 들어 온 거대한 원형 전당. 그 중심에서, 깨진 수정관 하나가 하늘을 향해 열려 있었다. 그 안에 누워 있는 것은 별의 시체가 아니라 — 검 한 자루였다. 은빛 칼날을 따라 푸른 별빛이 심장 박동처럼 고동치고 있었다.',
          rogue: '천 년 동안 바깥의 빗소리만을 들어 온 거대한 원형 전당. 그 중심에서, 깨진 수정관 하나가 하늘을 향해 열려 있었다. 그 안에 누워 있는 것은 별의 시체가 아니라 — 단검 한 자루였다. 가느다란 은빛 칼날을 따라 푸른 별빛이 심장 박동처럼 고동치고 있었다.',
          bard: '천 년 동안 바깥의 빗소리만을 들어 온 거대한 원형 전당. 그 중심에서, 깨진 수정관 하나가 하늘을 향해 열려 있었다. 그 안에 누워 있는 것은 별의 시체가 아니라 — 류트 하나였다. 일곱 줄의 은빛 현을 따라 푸른 별빛이 심장 박동처럼 고동치고 있었다.' },
        '별빛은 그것을 쥘 자의 손에 꼭 맞는 모양으로 빚어져 있었다. 마치 오래전부터 그대를 기다려 온 것처럼.',
        { if: { min: { bond: 1 } }, t: '“아스텔께서 남기신 마지막 빛이다.” 뒤따라온 오르덴이 속삭였다. “천 년 동안, 누구의 손도 허락하지 않았지.”' },
        { if: { max: { bond: 0 } }, t: '뒤따라온 오르덴은 문가에 멀찍이 선 채, 창을 쥐고 그대를 지켜볼 뿐이었다.' },
        '그대가 한 걸음 다가서자, 수정관 둘레의 공기가 일렁이며 빛의 장막이 솟아올랐다. 별이 그대를 시험하려는 것이다.'
      ],
      choices: [
        { id: 1, stat: 'class', dc: 12,
          label: {
            mage: '장막에 새겨진 별의 문장을 읽으며 손을 뻗는다',
            warrior: '타오르는 빛의 장막을 견디며 정면으로 걸어 들어간다',
            rogue: '일렁이는 장막의 틈을 찾아 몸을 밀어 넣는다',
            bard: '꿈속의 노래로 별의 시험에 응답한다'
          },
          note: '실패해도 {relic:은} 얻지만 상처가 남는다',
          success: {
            text: [
              { mage: '빛의 문장은 하나의 기억이었다. 그것을 읽어 내려가는 동안, 그대는 보았다.',
                warrior: '살갗이 타는 듯한 빛 속을, 그대는 한 걸음도 물러서지 않고 걸었다. 그리고 그 한가운데서, 그대는 보았다.',
                rogue: '장막은 빈틈없어 보였지만, 별빛이 숨을 고르는 찰나의 틈이 있었다. 그 틈으로 미끄러져 들어간 순간, 그대는 보았다.',
                bard: '그대가 꿈속의 노래를 부르자, 장막이 같은 선율로 화답했다. 두 노래가 하나로 겹쳐지는 순간, 그대는 보았다.' },
              '불타는 하늘, 서로를 찢는 여섯 별, 그리고 홀로 노래를 멈춘 채 떨어져 내리는 일곱째 별을. 떨어지는 그 별은 — 그대를 바라보며 웃고 있었다.',
              '손끝이 {relic}에 닿자, 별빛이 혈관을 따라 흘러들었다. 지친 몸에 새로운 힘이 차오른다.'
            ],
            fx: RELIC({ hp: 10, xp: 4 }),
            log: '별의 시험을 통과해 {relic:을} 얻었다.', next: 'n6' },
          fail: {
            text: [
              '장막이 그대를 불태웠다. 비명을 삼키며 버티는 동안, 손등에 일곱 갈래로 갈라진 별 모양의 화상이 새겨졌다.',
              '그럼에도 {relic:은} 스스로 그대의 손안으로 날아들었다. 별은 그대를 거부하지 않았다. 다만 — 흔적을 남겼을 뿐이다.'
            ],
            fx: RELIC({ hp: -4, set: ['starmark'] }),
            log: '별의 시험에서 화상을 입었다 (HP -4). 그래도 {relic:이} 그대를 택했다.', next: 'n6' } },

        { id: 2, skill: '공연', insp: 'song', label: '오르덴과 함께 옛 의식을 올린다', stat: '매력', dc: 9,
          requires: { min: { bond: 1 } }, reqText: '오르덴의 신뢰',
          note: '쉬움. 성공하면 크게 회복한다',
          success: {
            text: [
              '오르덴이 장창을 바닥에 세우고 낮은 목소리로 기도문을 읊었다. 그대가 그 뒤를 이어 부르자, 빛의 장막이 꽃잎처럼 한 겹씩 열렸다.',
              '{relic:을} 쥐는 순간, 따스한 빛이 전당을 가득 메웠다. 오르덴의 갑주에 슬어 있던 녹마저 조금씩 벗겨져 나갔다.'
            ],
            fx: RELIC({ hpFull: true, add: { bond: 1 }, xp: 4 }),
            log: '오르덴과 의식을 올려 {relic:을} 얻었다. 모두 회복했다.', next: 'n6' },
          fail: {
            text: [
              '의식은 길었다. 너무 길었다. 마지막 구절을 읊을 즈음 장막은 열렸지만 — 열린 문 너머로 울음소리가 밀려들었다.',
              '전당에서 새어 나간 별빛을, 사냥개들이 본 것이다.'
            ],
            fx: RELIC({ set: ['alerted'] }),
            log: '의식 끝에 {relic:을} 얻었지만, 새어 나간 빛을 사냥개들이 보았다.', next: 'n6' } },

        { id: 3, skill: '비전', label: '{item:을} 제물로 수정관에 바친다', stat: '지혜', dc: 9,
          note: '쉬움',
          success: {
            text: [
              '그대는 오랜 여정을 함께한 {item:을} 수정관 위에 눕혔다. 별빛이 낡은 {weapon:을} 감싸 안더니, 이윽고 두 {weapon:이} 하나로 녹아들었다.',
              '손에 쥔 새 {weapon}에서, 그대가 걸어온 모든 길의 기억이 느껴졌다.'
            ],
            fx: RELIC({ drop: ['{item}'], hp: 6, xp: 4 }),
            log: '{item:을} 바쳐 {relic:을} 얻었다.', next: 'n6' },
          fail: {
            text: [
              '{item:은} 별빛에 닿자마자 재가 되어 흩어졌다.',
              '장막은 걷혔고 {relic:은} 그대의 것이 되었지만, 오랜 벗을 잃은 허전함은 쉽게 가시지 않았다.'
            ],
            fx: RELIC({ drop: ['{item}'] }),
            log: '{item:이} 재가 되었다. {relic:을} 얻었다.', next: 'n6' } }
      ]
    },

    // ───────────────────────── 사냥개의 밤 (유물을 얻은 직후)
    n6: {
      art: { sky: 'star', bg: 'tomb', actors: [{ k: 'orden', x: 0.12 }, { k: 'hero', x: 0.24 }, { k: 'hound', x: 0.52 }, { k: 'hound', x: 0.64 }, { k: 'pup', x: 0.74 }, { k: 'alpha', x: 0.87 }], fx: ['motes'] },
      title: '사냥개의 밤',
      clock: '밀려드는 사냥개 무리',
      text: [
        '그때, 문밖에서 뿔피리 소리가 울렸다.',
        '낮고 길게, 뼛속을 긁는 소리. 오르덴의 얼굴이 굳었다. “사냥꾼의 뿔피리다… 천 년 전 그 밤에도 저 소리를 들었지.”',
        '열린 문틈으로 잿빛 그림자들이 쏟아져 들어왔다. 다섯, 여섯 — 아니, 그 이상. 그리고 그 뒤로, 다른 놈들보다 두 배는 큰 짐승 하나가 느릿느릿 계단을 오르고 있었다. 이마에 회색 왕관 같은 낙인을 단 무리의 우두머리, 잿빛 송곳니.',
        '그 곁에서, 아직 털도 다 자라지 않은 새끼 한 마리가 비틀거리며 어미를 따르고 있었다.',
        { if: { flag: 'alerted' }, t: '놈들은 이미 그대의 냄새를 알고 있었다. 포위는 빠르고, 정확했다.' },
        { if: { flag: 'oath' }, t: '오르덴이 그대 앞으로 나서며 장창을 겨누었다. “내 등 뒤에 서라.”' }
      ],
      choices: [
        { id: 1, skill: '비전', insp: 'lore', label: '문턱의 룬을 덫으로 바꿔 무리를 한꺼번에 노린다', stat: '지혜', dc: 13,
          dis: [{ if: { flag: 'alerted' }, why: '놈들이 경계 중' }],
          note: '성공하면 남는 놈이 적다',
          success: {
            text: [
              { _: '그대가 {relic:으로} 문턱을 내리치자, 바닥의 룬들이 일제히 뒤집혔다. 천 년 동안 문을 지켜 온 고대의 마법이 마침내 이빨을 드러낸 것이다.',
                bard: '그대가 별빛 류트의 현을 힘껏 튕기자, 그 울림을 따라 바닥의 룬들이 일제히 뒤집혔다. 천 년 동안 문을 지켜 온 고대의 마법이 마침내 이빨을 드러낸 것이다.' },
              '선두의 사냥개 다섯이 룬을 밟는 순간, 별빛 기둥이 솟구쳐 놈들을 집어삼켰다. 그러나 한 마리가 빛을 뚫고 달려든다!'
            ],
            fx: { xp: 5 }, battle: HOUNDS(['hound']),
            log: '룬 덫으로 사냥개 다섯 마리를 잿가루로 만들었다.', next: 'map' },
          crit: {
            text: [
              { _: '그대가 {relic:으로} 문턱을 내리치자, 관문 전체의 룬이 일제히 뒤집혔다. 천 년 동안 잠들어 있던 고대의 마법이 포효하듯 깨어났다.',
                bard: '그대가 별빛 류트의 현을 힘껏 튕기자, 관문 전체의 룬이 일제히 뒤집혔다. 천 년 동안 잠들어 있던 고대의 마법이 포효하듯 깨어났다.' },
              '계단을 뒤덮은 별빛 기둥들이 사냥개 무리를 통째로 집어삼켰다. 마지막 빛 기둥 하나가, 물러서던 우두머리의 뒷다리까지 태우고 지나갔다.',
              '잿빛 송곳니는 새끼를 데리고 전당 깊은 곳, 무너지는 회랑으로 물러났다. 오르덴이 창을 고쳐 쥐었다. “놈을 결계의 방에 가둬야 한다. 서두르지 말고, 충분히 강해진 뒤에 쫓아라.”'
            ],
            fx: { xp: 8, set: ['alpha_hurt'] },
            log: '룬 덫이 대성공했다. 무리를 쓸어버리고 우두머리의 다리까지 태웠다.', next: 'map' },
          fail: {
            text: [
              '룬 몇 개가 제대로 뒤집히지 않았다. 덫은 두 마리만을 삼켰고, 나머지는 빛의 틈을 비집고 달려들었다.'
            ],
            fx: { hp: -4 }, battle: HOUNDS(['hound', 'hound']),
            log: '룬 덫이 반만 작동했다 (HP -4).', next: 'map' } },

        { id: 2, skill: '운동', insp: 'brave', label: '오르덴과 등을 맞대고 좁은 문턱을 지킨다', stat: '힘', dc: 12,
          bonus: [{ if: { min: { bond: 2 } }, v: 3, why: '오르덴과의 호흡' }],
          note: '오르덴과의 유대가 깊을수록 쉽다',
          success: {
            text: [
              { mage: '오르덴의 장창이 앞을 쓸면, 그대의 마력 탄이 그 빈틈을 메웠다.',
                warrior: '오르덴의 장창이 앞을 쓸면, 그대의 검이 그 빈틈을 메웠다.',
                rogue: '오르덴의 장창이 앞을 쓸면, 그대의 단검이 그 빈틈을 파고들었다.',
                bard: '오르덴의 장창이 앞을 쓸면, 그대의 노래가 기사의 팔에 힘을 실었다.' },
              '문턱 앞에 잿빛 시체가 쌓여 갔다. 그러나 마지막 한 마리가 기사의 창을 피해 그대에게 달려든다!'
            ],
            fx: { add: { bond: 1 }, xp: 4 }, battle: HOUNDS(['hound']),
            log: '오르덴과 등을 맞대고 문턱을 지켰다.', next: 'map' },
          fail: {
            text: [
              '사냥개 한 마리가 오르덴의 창을 피해 그대의 목을 노리고 뛰어올랐다. 겨우 팔로 막아 냈지만, 이빨이 뼈에 닿는 감각이 생생했다. 문턱이 뚫렸다!'
            ],
            fx: { hp: -5 }, battle: HOUNDS(['hound', 'hound']),
            log: '문턱이 뚫렸다 (HP -5).', next: 'map' } },

        { id: 3, label: '{relic:을} 높이 들어 별빛 섬광을 터뜨린다', stat: 'class', dc: 12,
          note: '증폭 권장',
          success: {
            text: [
              '{relic}에서 작은 태양이 피어났다. 어둠에 길든 사냥개들의 눈이 하얗게 타들어 갔고, 놈들은 서로를 물어뜯으며 계단 아래로 굴러떨어졌다.',
              '눈을 감고 있던 한 마리만이 빛 속을 뚫고 달려든다!'
            ],
            fx: { xp: 4 }, battle: HOUNDS(['hound']),
            log: '별빛 섬광으로 사냥개 무리를 흩어 버렸다.', next: 'map' },
          fail: {
            text: [
              '빛은 터졌지만 너무 짧았다. 눈을 감고 있던 놈들이, 섬광이 사그라지자마자 달려들었다.'
            ],
            fx: { mp: -1 }, battle: HOUNDS(['hound', 'hound']),
            log: '섬광이 짧았다 (마력 -1).', next: 'map' } },

        { id: 4, label: '사냥꾼의 뿔피리보다 큰 포효로 무리를 주춤하게 만든다', stat: '매력', skill: '위협', dc: 13, insp: 'brave',
          note: '성공하면 남는 놈이 적다',
          success: {
            text: [
              '그대는 문턱 위에 서서, 산이 울리도록 포효했다. 앞장서던 사냥개들이 귀를 젖히며 주춤했다. 낙인의 명령보다 오래된 것 — 짐승의 두려움이 놈들을 붙잡은 것이다.',
              '대부분이 꼬리를 말고 물러났다. 단 한 마리만이 이빨을 드러내며 달려든다!'
            ],
            fx: { xp: 4 }, battle: HOUNDS(['hound']),
            log: '포효로 사냥개 무리를 물러서게 했다.', next: 'map' },
          fail: {
            text: ['포효는 뿔피리 소리에 묻혀 버렸다. 사냥개들은 오히려 그대를 향해 이를 드러냈다.'],
            battle: HOUNDS(['hound', 'hound']),
            log: '포효가 먹히지 않았다.', next: 'map' } }
      ]
    },

    // ───────────────────────── 무너지는 회랑 (우두머리 추격)
    n7: {
      art: { sky: 'cave', bg: 'hall', actors: [{ k: 'hero', x: 0.24 }, { k: 'pup', x: 0.6 }, { k: 'alpha', x: 0.78 }], fx: ['dust'] },
      title: '무너지는 회랑',
      clock: '우두머리를 결계의 방으로 몰아넣는다',
      text: [
        '회랑 가장 깊은 곳에서, 뜨거운 숨소리가 들려왔다.',
        '잿빛 송곳니는 그대를 기다리고 있었다. 놈이 몸을 일으키자 천 년 된 돌바닥이 쩍쩍 갈라졌다. 새끼가 어미의 다리 사이에서 고개를 내밀었다.',
        { if: { flag: 'alpha_hurt' }, t: '별빛에 그을린 뒷다리를 끌면서도, 놈의 기세는 조금도 꺾이지 않았다.' },
        '“결계의 방으로!” 오르덴이 외쳤다. “일곱 기둥 안에 가두면 놈도 빠져나가지 못한다!”',
        '짐승이 도약했다. 그대는 달렸다. 등 뒤로 뜨거운 숨결이 닿을 듯 가까웠고, 오래된 회랑의 천장이 진동에 흔들리며 돌가루를 흩뿌렸다.'
      ],
      choices: [
        { id: 1, stat: 'class', dc: 14,
          label: {
            mage: '천장의 이음매에 마력을 꽂아 석재를 무너뜨린다',
            warrior: '기울어진 기둥을 들이받아 석재를 무너뜨린다',
            rogue: '천장의 약한 이음매에 단검을 던져 석재를 무너뜨린다',
            bard: '날카로운 고음을 내질러 금 간 천장을 울린다'
          },
          note: '성공하면 우두머리가 크게 다친다 (결전에서 HP -15)',
          success: {
            text: [
              { mage: '그대는 돌아서며 천장의 이음매에 마력을 꽂아 넣었다.',
                warrior: '그대는 돌아서며 기울어진 기둥에 온몸을 부딪쳤다.',
                rogue: '그대는 돌아서며 천장의 가장 약한 이음매를 향해 단검을 던졌다.',
                bard: '그대는 돌아서며 회랑이 울리도록 날카로운 고음을 내질렀다. 금 간 천장이 그 소리에 맞춰 떨렸다.' },
              '집채만 한 석재가 굉음과 함께 무너져 내렸고, 잿빛 송곳니의 뒷다리가 그 아래 깔렸다. 짐승이 처음으로 고통의 울음을 내질렀다.',
              '그러나 놈은 돌을 박차고 다시 일어섰다 — 절뚝이며. 그대는 그 틈에 결계의 방으로 뛰어들었고, 분노한 짐승이 곧장 뒤따라 들어왔다.'
            ],
            fx: { set: ['alpha_hurt'], xp: 4 },
            log: '무너진 석재가 우두머리의 다리를 짓눌렀다.', next: 'n8' },
          fail: {
            text: [
              '석재는 한 박자 늦게 떨어졌다. 우두머리는 가볍게 몸을 비틀어 피했고, 그 반동 그대로 그대에게 달려들었다.',
              '송곳니가 허벅지를 깊이 파고들었다. 오르덴이 창대로 놈의 머리를 후려치고서야 겨우 이빨이 풀렸고, 두 사람은 뒤엉킨 채 결계의 방 안으로 굴러 들어갔다. 짐승도 뒤따라 뛰어들었다.'
            ],
            fx: { hp: -6 },
            log: '석재 낙하에 실패해 우두머리에게 물렸다 (HP -6).', next: 'n8' } },

        { id: 2, skill: '곡예', insp: 'wild', label: '회랑을 전력으로 달려 결계의 방까지 유인한다', stat: '민첩', dc: 12,
          note: '실패하면 HP 피해',
          success: {
            text: [
              '그대는 바람처럼 달렸다. 무너지는 아치 아래를, 쓰러진 석상들 사이를, 그리고 마침내 일곱 개의 룬 기둥이 둘러선 원형의 방 안으로.',
              '놈이 그대를 쫓아 방에 뛰어든 순간, 오르덴이 뒤따라 들어오며 기둥의 룬을 창으로 내리쳤다.'
            ],
            fx: { xp: 3 },
            log: '우두머리를 결계의 방까지 유인했다.', next: 'n8' },
          fail: {
            text: [
              '모퉁이를 도는 순간 발이 미끄러졌다. 날카로운 발톱이 등을 할퀴었고, 그대는 결계의 방 안으로 나뒹굴었다.',
              '다행히 — 놈도 그대를 따라 방 안으로 뛰어들었다. 오르덴이 뒤따라 들어오며 기둥의 룬을 내리쳤다.'
            ],
            fx: { hp: -6 },
            log: '유인하다 발톱에 긁혔다 (HP -6). 그래도 놈은 따라 들어왔다.', next: 'n8' } },

        { id: 3, skill: '비전', insp: 'lore', label: '우두머리 이마의 회색 낙인을 노려 별빛을 쏜다', stat: '지혜', dc: 13,
          requires: { flag: 'mark_seen' }, reqText: '회색 낙인의 비밀',
          note: '성공하면 결전에서 낙인을 부수기 쉬워진다',
          success: {
            text: [
              '그대는 낙인의 비밀을 떠올렸다. 이 짐승은 스스로 싸우는 것이 아니다. 누군가에게 묶여 있다.',
              '{relic}에서 뻗어 나간 빛줄기가 우두머리의 이마를 정확히 꿰뚫었다. 회색 왕관에 금이 갔다. 짐승은 비틀거리며 고개를 흔들었고, 그 붉은 눈에 아주 잠깐 — 혼란 같은 것이 스쳐 지나갔다.',
              '그 틈에 그대는 결계의 방으로 뛰어들었고, 놈은 홀린 듯 그대를 따라 들어왔다.'
            ],
            fx: { set: ['mark_cracked'], xp: 5 },
            log: '우두머리의 낙인에 금을 냈다. 놈의 눈빛이 흔들렸다.', next: 'n8' },
          fail: {
            text: [
              '빛줄기가 낙인에 닿는 순간, 회색 빛이 거꾸로 흘러들어 그대의 팔을 타고 올라왔다.',
              '얼음 같은 목소리가 머릿속에 울렸다. ‘……누구냐.’ 그대는 비명을 지르며 빛을 끊어 냈다. 정신을 차렸을 때, 그대는 오르덴의 손에 끌려 결계의 방 안으로 들어와 있었다.'
            ],
            fx: { hp: -6, set: ['hunter_saw'] },
            log: '낙인을 건드렸다가 사냥꾼의 목소리를 들었다 (HP -6).', next: 'n8' } }
      ]
    },

    // ───────────────────────── 닫힌 결계 → 결전
    n8: {
      art: { sky: 'cave', bg: 'barrier', actors: [{ k: 'orden', x: 0.13 }, { k: 'hero', x: 0.26 }, { k: 'pup', x: 0.6 }, { k: 'alpha', x: 0.77 }] },
      title: '닫힌 결계',
      clock: '결전 직전의 한 수',
      text: [
        '일곱 개의 룬 기둥이 동시에 빛났다.',
        '결계가 닫혔다. 우두머리와 새끼 한 마리가 그 안에 갇혔다. 잿빛 송곳니가 낮게 으르렁거리며 그대를 노려보았고, 새끼는 어미의 다리 사이에 몸을 숨긴 채 떨고 있었다.',
        '오르덴이 창을 들고 그대 곁에 섰다. “여기서 끝내야 한다. 놈을 놓치면, 사냥꾼은 별이 깨어났다는 것을 알게 된다.”',
        { if: { flag: 'alpha_hurt' }, t: '놈의 뒷다리에서는 여전히 피가 흐르고 있다.' },
        { if: { flag: 'mark_cracked' }, t: '금 간 낙인 아래에서, 놈의 눈빛이 이따금 흔들린다.' },
        { if: { flag: 'hunter_saw' }, t: '어딘가 아주 먼 곳에서, 누군가가 이쪽을 지켜보고 있다는 느낌이 가시지 않는다.' },
        '싸움이 시작되기 전, 단 한 수를 둘 시간이 있다.'
      ],
      choices: [
        { id: 1, label: '{relic}의 별빛을 남김없이 끌어올려 먼저 터뜨린다', stat: 'class', dc: 14,
          note: '성공하면 결전에서 우두머리 HP -20',
          success: {
            text: [
              '그대는 {relic}에 담긴 별빛을 남김없이 끌어올렸다. 결계 안이 한낮처럼 밝아졌고, 빛의 파도가 잿빛 송곳니를 정면으로 덮쳤다.',
              '짐승의 털이 타들어 가는 냄새가 났다. 그러나 놈은 쓰러지지 않았다. 잿빛 송곳니가 머리를 낮추고 — 달려든다!'
            ],
            fx: { set: ['burst'], xp: 3 }, battle: BOSS,
            log: '별빛을 터뜨려 우두머리에게 큰 상처를 냈다.', next: 'n9' },
          fail: {
            text: [
              '빛은 터졌지만, 우두머리는 그 빛을 정면으로 뚫고 돌진해 왔다. 거대한 몸이 그대를 룬 기둥에 처박았다.',
              '숨이 멎는 충격. 입안에 피 맛이 번졌다. 그리고 — 싸움이 시작되었다.'
            ],
            fx: { hp: -6 }, battle: BOSS,
            log: '전력을 쏟았지만 우두머리가 빛을 뚫고 덮쳤다 (HP -6).', next: 'n9' } },

        { id: 2, skill: '설득', adv: [{ if: { flag: 'oath' }, why: '맹세한 기사' }], label: '문지기에게 투창을 부탁한다', stat: '매력', dc: 8,
          requires: { min: { bond: 1 } }, reqText: '오르덴의 신뢰',
          note: '쉬움. 성공하면 결전에서 우두머리 방어 -2, 명중 -1',
          success: {
            text: [
              '“오르덴, 지금!”',
              '기사의 장창이 천 년의 무게를 싣고 날아갔다. 창은 우두머리의 어깨를 꿰뚫었고, 짐승은 한쪽 앞발을 제대로 딛지 못했다. 오르덴이 창을 뽑아 들며 그대 곁으로 돌아왔다.'
            ],
            fx: { set: ['spear'], xp: 3 }, battle: BOSS,
            log: '오르덴의 투창이 우두머리의 어깨를 꿰뚫었다.', next: 'n9' },
          fail: {
            text: [
              '장창은 우두머리의 등을 스치고 결계 벽에 튕겨 나갔다. 무기를 잃은 오르덴에게 짐승이 달려들자, 그대는 생각할 틈도 없이 그 앞으로 몸을 던졌다.',
              '송곳니가 그대의 어깨를 물고 흔들었다. 오르덴이 맨손으로 놈의 턱을 벌려 그대를 끌어냈다. “어리석은…” 그의 목소리가 떨렸다. “…고맙다.”'
            ],
            fx: { hp: -6, add: { bond: 1 } }, battle: BOSS,
            log: '투창이 빗나갔다. 오르덴을 감싸다 물렸다 (HP -6).', next: 'n9' } },

        { id: 3, skill: '곡예', insp: 'mercy', label: '몸을 굴려 피하며 새끼를 어미에게서 떼어 놓는다', stat: '민첩', dc: 12,
          note: '성공하면 결전에서 우두머리가 이따금 머뭇거리고, 낙인을 부수기 쉬워진다',
          success: {
            text: [
              '그대는 우두머리의 발톱 아래로 몸을 굴려, 새끼를 품에 안고 반대편으로 빠져나왔다. 새끼는 버둥거렸지만 물지는 않았다.',
              '그 순간, 우두머리가 멈칫했다. 낙인의 명령과 어미의 본능 사이에서 — 놈이 처음으로 망설였다.'
            ],
            fx: { set: ['pup_safe'], xp: 3 }, battle: BOSS,
            log: '새끼를 어미에게서 떼어 품에 안았다. 우두머리가 망설였다.', next: 'n9' },
          fail: {
            text: [
              '새끼에게 손을 뻗는 순간, 어미의 분노가 폭발했다. 거대한 앞발이 그대를 후려쳐 결계 벽까지 날려 보냈다.'
            ],
            fx: { hp: -6 }, battle: BOSS,
            log: '새끼에게 다가가다 우두머리의 분노를 샀다 (HP -6).', next: 'n9' } },

        { id: 4, skill: '비전', label: '룬 기둥의 힘을 빌려 별빛 방벽을 세운다', stat: '지혜', dc: 12,
          note: '성공하면 결전에서 첫 피해를 한 번 막는다',
          success: {
            text: [
              '그대가 기둥에 손을 얹자, 일곱 기둥의 룬이 그대의 손길에 화답했다. 반투명한 별빛 방벽이 그대 앞에 펼쳐졌다.',
              '룬 기둥에서 흘러든 힘이 마력을 조금 채워 주었다.'
            ],
            fx: { set: ['shield'], mp: 3, xp: 3 }, battle: BOSS,
            log: '룬 기둥의 힘으로 별빛 방벽을 세웠다.', next: 'n9' },
          fail: {
            text: [
              '방벽은 반쯤 세워지다가 유리처럼 깨졌다. 흩어지는 빛의 파편 사이로 우두머리의 발톱이 날아들었다.'
            ],
            fx: { hp: -4 }, battle: BOSS,
            log: '방벽이 깨졌다 (HP -4).', next: 'n9' } }
      ]
    },

    // ───────────────────────── 비가 멎은 새벽
    n9: {
      art: { sky: 'dawn', bg: 'gate', actors: [{ k: 'hero', x: 0.4 }, { k: 'orden', x: 0.58, face: -1 }] },
      title: '비가 멎은 새벽',
      clock: '1장 에필로그',
      text: [
        '결계의 빛이 하나둘 스러지고, 전당에 고요가 내려앉았다.',
        { if: { flag: 'alpha_slain' }, t: '잿빛 송곳니가 쓰러진 자리에는 회색 잿가루만이 소복이 쌓여 있었다. 사냥꾼의 낙인이 남긴 것은 그것뿐이었다.' },
        { if: { flag: 'alpha_slain', item: '잿빛 새끼' }, t: '품 안에서 새끼가 어미의 잿가루를 향해 작게 울었다. 그대는 그 작은 몸을 더 꼭 끌어안았다. 이 아이의 이마에는 — 아직 낙인이 없다.' },
        { if: { flag: 'alpha_slain', not: 'pup_safe' }, t: '남겨진 새끼는 어미의 잿가루에 코를 묻고 한참을 낑낑거리다가, 무너진 결계 틈으로 빠져나가 빗속으로 사라졌다. 그 작은 발자국이 어디로 향할지, 그대는 알 수 없었다.' },
        { if: { flag: 'alpha_freed' }, t: '해방된 잿빛 송곳니는 새끼를 데리고 문턱까지 걸어 나갔다. 그리고 한 번 뒤를 돌아보더니, 산 전체가 울리도록 길게 울었다. 사냥꾼의 뿔피리와는 전혀 다른 — 자유로운 울음이었다.' },
        { if: { flag: 'alpha_fled' }, t: '무너진 결계 틈으로 찬 바람이 불어 들었다. 잿빛 송곳니는 사라졌다. 놈은 살아남았고, 이제 그대의 냄새를 안다.' },
        '그때, 그대는 깨달았다. 무언가가 사라졌다는 것을.',
        '빗소리였다. 천 년 동안 단 한 번도 그친 적 없던 그 소리가 — 멎어 있었다.',
        '문밖으로 나서자 구름이 갈라지고 있었다. 그 틈으로, 천 년 만에 처음으로 관문 위에 새벽빛이 쏟아져 내렸다. 젖은 돌계단이 금빛으로 타올랐고, 부서진 기사 석상들의 얼굴 위로 마지막 빗물이 눈물처럼 흘러내렸다.',
        { if: { flag: 'orden_cracked' }, t: '오르덴은 균열 간 가슴 갑주를 손으로 누른 채, 말없이 하늘을 올려다보았다.' },
        { if: { not: 'orden_cracked' }, t: '오르덴이 투구를 벗었다. 천 년 만에 햇빛을 받은 그의 얼굴은, 생각보다 훨씬 젊었다.' },
        '“하늘이… 울음을 그쳤다.” 기사의 목소리가 떨렸다. “아스텔께서 그대를 택하셨다는 뜻이다.”'
      ],
      choices: [
        { id: 1, skill: '비전', insp: 'lore', label: '옅어지는 새벽하늘에 남은 별자리를 읽는다', stat: '지혜', dc: 12,
          note: '성공하면 다음 여정의 길을 안다',
          success: {
            text: [
              '옅어지는 하늘에 여섯 개의 별이 희미하게 남아 있었다. 그리고 그 사이의 빈자리 — 그대의 눈은 그 자리에서 실처럼 가느다란 빛줄기들을 보았다.',
              '아스텔은 완전히 죽은 것이 아니었다. 떨어지던 밤, 그 빛은 여러 조각으로 부서져 대륙 곳곳에 흩어졌다. 그리고 첫 번째 조각이 가리키는 곳은 동쪽 — 잿빛 사냥꾼의 영토 너머, 침묵의 숲이었다.'
            ],
            fx: { set: ['star_map'], xp: 4 },
            log: '새벽 별자리에서 첫 번째 별 조각이 동쪽 침묵의 숲에 있음을 읽어 냈다.', next: 'n10' },
          fail: {
            text: [
              '해가 너무 빨리 떠올랐다. 별들은 그대가 읽어 내기도 전에 새벽빛 속으로 녹아 사라졌다.',
              '그러나 손에 쥔 {relic:이} 희미하게 떨렸다. 그 떨림은 분명히 한 방향을 가리키고 있었다 — 동쪽.'
            ],
            log: '별자리를 읽지 못했다. 그래도 {relic:이} 동쪽을 가리켰다.', next: 'n10' } },

        { id: 2, skill: '공연', insp: 'mercy', label: '오르덴과 함께 돌이 된 기사들의 넋을 기린다', stat: '매력', dc: 10,
          note: '성공하면 오르덴과의 유대가 깊어진다. 어느 쪽이든 쉬어 간다',
          success: {
            text: [
              '그대와 오르덴은 부서진 석상들 사이를 천천히 걸으며 하나하나의 이름을 불렀다. 천 년이 지났어도, 오르덴은 그 이름들을 모두 기억하고 있었다.',
              '마지막 석상 앞에서 기사는 오래도록 무릎을 꿇고 있었다. 다시 일어선 그의 금빛 눈에는 결의가 서려 있었다. “그들의 맹세는 끝나지 않았다. 내가 이어 가겠다.”'
            ],
            fx: { add: { bond: 1 }, hpFull: true, xp: 4 },
            fxIf: [{ if: { min: { bond: 3 } }, fx: { set: ['orden_joins'] } }],
            log: '오르덴과 함께 쓰러진 기사들의 넋을 기렸다.', next: 'n10' },
          fail: {
            text: [
              '그대는 그 자리에 어울리는 말을 끝내 찾지 못했다. 오르덴은 홀로 석상들 사이를 걸었고, 그대는 멀찍이서 그 등을 지켜볼 뿐이었다.',
              '그래도 돌아온 기사는 그대의 어깨를 한 번 두드렸다. 말 없는 위로가, 지친 몸을 조금 데워 주었다.'
            ],
            fx: { hp: 8 },
            log: '말을 고르지 못했다. 오르덴은 홀로 동료들을 애도했다.', next: 'n10' } }
      ]
    },

    n10: {
      art: { sky: 'night', bg: 'mountains', props: ['stars6'], actors: [{ k: 'hero', x: 0.5 }], fx: ['stars'] },
      title: '사냥꾼의 뿔피리',
      clock: '1장 에필로그',
      text: [
        '그날 밤, 그대는 관문 꼭대기에 앉아 천 년 만에 갠 하늘을 올려다보았다. 여섯 개의 별, 그리고 그 사이의 빈자리. 그 빈자리는 이제, 그대의 손에 쥐어진 {relic} 속에서 조용히 빛나고 있었다.',
        { if: { flag: 'starmark' }, t: '손등의 일곱 갈래 화상이, {relic}의 빛에 맞추어 희미하게 욱신거렸다.' },
        '그때였다.',
        '아주 먼 동쪽에서, 뿔피리 소리가 울렸다. 낮고 길게, 뼛속을 긁는 소리. 그리고 이번에는 — 바람이 그 소리에 목소리를 실어 날랐다.',
        { if: { any: ['alpha_fled', 'hunter_saw'] }, t: '‘찾았다, 별의 아이야. 네 냄새를, 네 목소리를, 네 손끝의 빛을 기억하마. 천 년을 기다렸으니, 조금 더 기다리는 것쯤이야.’' },
        { if: { not: ['alpha_fled', 'hunter_saw'] }, t: '‘누가 나의 개를 빼앗았느냐. ……상관없다. 별빛은 어둠 속에 숨을 수 없는 법. 곧 만나게 되겠지.’' },
        { if: { flag: 'orden_joins' }, t: '오르덴이 장창을 들고 일어섰다. “가자, {name:이여}. 사냥꾼이 오기 전에 우리가 먼저 간다. 어디로 가든 나의 창이 그대 앞에 있을 것이다.” 천 년 동안 문을 지켜 온 기사가, 처음으로 문밖을 향해 걸음을 내디뎠다.' },
        { if: { not: 'orden_joins' }, t: '오르덴은 문 앞에 남았다. “나는 이 문을 떠날 수 없다. 별께서 잠드셨던 자리를 누군가는 지켜야 하니.” 그는 장창으로 땅을 한 번 내리찍었다. “그러나 기억하라, {name:이여}. 그대가 돌아오는 날까지, 이 문은 언제나 그대를 향해 열려 있을 것이다.”' },
        { if: { item: '잿빛 새끼' }, t: '그대의 발치에서, 잿빛 새끼가 동쪽을 향해 작게 으르렁거렸다.' },
        { if: { flag: 'alpha_freed' }, t: '어딘가 먼 산등성이에서, 자유로운 울음 하나가 뿔피리 소리에 맞서듯 길게 울려 퍼졌다.' },
        { if: { flag: 'star_map' }, t: '동쪽, 침묵의 숲. 첫 번째 별의 조각이 그곳에서 그대를 기다린다.' },
        '떨어진 별의 노래는, 이제 막 첫 소절을 지났을 뿐이다.'
      ],
      choices: [
        { id: 1, label: '1장을 마친다', roll: false,
          then: {
            text: ['— 제1장 「비 내리는 관문」 끝 —', '{name}의 이야기는 제2장 「잿빛 사냥꾼」으로 이어진다. 그때까지 세상은 열려 있다.'],
            log: '제1장 「비 내리는 관문」을 마쳤다.', next: 'end' } }
      ]
    },

    // ───────────────────────── 탐색 사건 (반복)
    ex_glint: {
      title: '바위 틈의 반짝임', clock: '탐색',
      text: ['젖은 바위 틈 사이로 무언가가 반짝인다. 손을 넣기엔 틈이 좁고 미끄럽다.'],
      choices: [
        { id: 1, skill: '손재주', insp: 'sly', label: '손을 밀어 넣어 꺼낸다', stat: '민첩', dc: 11,
          success: { text: ['손끝에 차가운 동전 몇 닢이 걸려 나왔다. 오래전 누군가 숨겨 둔 것이다.'], fx: { gold: [6, 14] }, log: '바위 틈에서 동전을 찾았다.', next: 'map' },
          fail: { text: ['손이 미끄러지며 날카로운 돌에 베였다. 반짝이던 것은 깨진 유리 조각이었다.'], fx: { hp: -2 }, log: '바위 틈에 손을 베였다 (HP -2).', next: 'map' } },
        { id: 2, label: '그냥 지나친다', roll: false,
          then: { text: ['그대는 바위 틈을 뒤로하고 걸음을 옮겼다.'], next: 'map' } }
      ]
    },
    ex_herb: {
      title: '빗속의 약초', clock: '탐색',
      text: ['바위 그늘에 은빛 잎사귀가 돋아 있다. 상처에 좋다는 별꽃 약초 같기도 하고, 독초 같기도 하다.'],
      choices: [
        { id: 1, skill: '의학', insp: 'wild', label: '잎맥을 살펴 약초인지 가려낸다', stat: '지혜', dc: 10,
          success: { text: ['별꽃 약초가 맞다. 그대는 잎을 짓이겨 작은 병에 담았다.'], fx: { items: ['은빛 물약'], xp: 2 }, log: '별꽃 약초로 은빛 물약을 만들었다.', next: 'map' },
          fail: { text: ['잎을 씹는 순간 혀가 저려 왔다. 독초였다.'], fx: { hp: -2 }, log: '독초를 씹었다 (HP -2).', next: 'map' } },
        { id: 2, label: '건드리지 않는다', roll: false, then: { text: ['그대는 잎사귀를 그대로 두었다.'], next: 'map' } }
      ]
    },
    ex_trap: {
      title: '버려진 덫', clock: '탐색',
      text: ['낙엽 아래 녹슨 덫이 입을 벌리고 있다. 덫 옆에는 사냥꾼의 것으로 보이는 주머니가 떨어져 있다.'],
      choices: [
        { id: 1, skill: '손재주', insp: 'sly', label: '덫을 피해 주머니를 집는다', stat: '민첩', dc: 12,
          success: { text: ['그대는 덫의 이빨 사이로 손을 뻗어 주머니를 낚아챘다.'], fx: { gold: [8, 16], xp: 3 }, log: '버려진 덫 옆에서 주머니를 주웠다.', next: 'map' },
          fail: { text: ['덫이 철컥 닫히며 발목을 물었다. 겨우 빼냈지만 피가 흐른다.'], fx: { hp: -4 }, log: '덫에 발목을 물렸다 (HP -4).', next: 'map' } },
        { id: 2, skill: '운동', label: '덫을 힘으로 비틀어 연다', stat: '힘', dc: 12,
          success: { text: ['녹슨 스프링이 끊어지며 덫이 활짝 열렸다. 주머니와 함께 덫에 걸려 있던 오래된 병도 하나 건졌다.'], fx: { gold: [8, 16], items: ['은빛 물약'], xp: 3 }, log: '덫을 부수고 주머니와 물약을 얻었다.', next: 'map' },
          fail: { text: ['덫이 튕겨 오르며 손등을 할퀴었다.'], fx: { hp: -3 }, log: '덫에 손을 다쳤다 (HP -3).', next: 'map' } }
      ]
    },
    ex_web: {
      art: { sky: 'rain', bg: 'forest', props: ['web'], fx: ['rain'] },
      title: '거미줄에 걸린 배낭', clock: '탐색',
      text: ['나무 사이에 거대한 거미줄이 쳐져 있고, 그 한가운데 누군가의 배낭이 매달려 있다. 줄이 미세하게 떨린다.'],
      choices: [
        { id: 1, skill: '운동', label: '거미줄을 찢고 배낭을 끌어내린다', stat: '힘', dc: 12,
          success: { text: ['거미줄이 찢어지며 배낭이 떨어졌다. 안에는 푸른 병 하나와 동전이 들어 있었다.'], fx: { items: ['푸른 물약'], gold: [5, 12], xp: 3 }, log: '거미줄에서 배낭을 끌어내렸다.', next: 'map' },
          fail: { text: ['거미줄이 끈적하게 팔에 감겼다. 그리고 — 머리 위에서 무언가가 내려온다!'],
            battle: { enemies: ['spider'],
              win: { text: ['거미가 다리를 오그리며 쓰러졌다. 그대는 거미줄을 걷어 내고 배낭을 챙겼다.'], fx: { items: ['푸른 물약'], gold: [5, 12] }, log: '거미를 물리치고 배낭을 챙겼다.', next: 'map' },
              lose: { text: ['거미의 독이 온몸에 퍼졌다. 정신을 차렸을 때, 배낭은 이미 사라지고 없었다.'], log: '거미에게 쓰러졌다.', next: 'map' } },
            log: '거미줄에 걸렸다.', next: 'map' } },
        { id: 2, skill: '손재주', insp: 'sly', label: '줄을 하나씩 조심스럽게 끊는다', stat: '민첩', dc: 13,
          success: { text: ['떨림이 전해지지 않도록 줄을 하나씩 끊었다. 거미는 끝내 눈치채지 못했다.'], fx: { items: ['푸른 물약'], gold: [5, 12], xp: 3 }, log: '거미 몰래 배낭을 챙겼다.', next: 'map' },
          fail: { text: ['줄 하나가 튕기며 떨림이 퍼졌다. 머리 위에서 무언가가 내려온다!'],
            battle: { enemies: ['spider'],
              win: { text: ['거미가 쓰러졌다. 그대는 배낭을 챙겼다.'], fx: { items: ['푸른 물약'], gold: [5, 12] }, log: '거미를 물리치고 배낭을 챙겼다.', next: 'map' },
              lose: { text: ['거미의 독이 퍼졌다. 정신을 차렸을 때, 배낭은 사라지고 없었다.'], log: '거미에게 쓰러졌다.', next: 'map' } },
            log: '거미가 눈치챘다.', next: 'map' } },
        { id: 3, label: '건드리지 않고 지나간다', roll: false, then: { text: ['그대는 떨리는 거미줄에서 눈을 떼지 않은 채 뒷걸음질 쳤다.'], next: 'map' } }
      ]
    },
    ex_rune: {
      title: '이끼 낀 룬', clock: '탐색',
      text: ['돌계단 한쪽에 이끼에 덮인 룬이 희미하게 빛난다. 별의 노래 한 소절이 새겨진 것 같다.'],
      choices: [
        { id: 1, skill: '비전', insp: 'lore', label: '룬을 읽어 그 힘을 받아들인다', stat: '지혜', dc: 13,
          success: { text: ['룬의 노래가 그대의 숨결에 스며들었다. 마력이 차오른다.'], fx: { mp: 5, xp: 4 }, log: '룬의 힘으로 마력을 채웠다.', next: 'map' },
          fail: { text: ['룬이 낯선 손길을 거부하며 불꽃을 튀겼다.'], fx: { hp: -3 }, log: '룬이 그대를 거부했다 (HP -3).', next: 'map' } },
        { id: 2, label: '그냥 지나친다', roll: false, then: { text: ['그대는 룬을 지나쳤다.'], next: 'map' } }
      ]
    },
    ex_bones: {
      art: { sky: 'cave', bg: 'aqueduct', props: ['bones'], fx: ['drip'] },
      title: '쓰러진 기사', clock: '탐색', if: { not: 'found_bones' },
      text: [
        '무릎까지 차는 물길을 따라가다, 그대는 오래전 이곳에서 쓰러진 기사의 유골과 마주쳤다.',
        '녹슨 장갑을 낀 손에 은빛 병 두 개가 아직 온전히 쥐어져 있었다. 그런데 — 다른 손가락에는 반지 자국만 남아 있다. 수로 깊은 곳에서 녹슨 갑주가 부딪히는 소리가 들려온다.'
      ],
      choices: [
        { id: 1, insp: 'mercy', label: '짧게 묵념하고 병을 거둔다', roll: false,
          then: { text: ['그대는 기사의 유골 앞에 잠시 고개를 숙였다. 반지는 어디로 간 것일까.'], fx: { set: ['found_bones'], items: ['은빛 물약', '은빛 물약'] },
            log: '옛 수로에서 쓰러진 기사의 유골을 찾았다. 반지가 사라져 있었다.', next: 'map' } }
      ]
    },
    ex_coins: {
      title: '물속의 옛 동전', clock: '탐색',
      text: ['탁한 물 아래에서 옛 엘레우스의 동전들이 희미하게 빛난다. 그 사이로 무언가가 미끄러지듯 지나간다.'],
      choices: [
        { id: 1, skill: '손재주', insp: 'sly', label: '재빨리 손을 넣어 건져 올린다', stat: '민첩', dc: 12,
          success: { text: ['그대는 거머리가 돌아오기 전에 동전을 한 움큼 건져 올렸다.'], fx: { gold: [12, 22], xp: 3 }, log: '물속에서 옛 동전을 건졌다.', next: 'map' },
          fail: { text: ['손을 넣는 순간 무언가가 팔뚝에 달라붙었다. 떼어 냈을 때는 피가 흐르고 있었다.'], fx: { hp: -4 }, log: '거머리에게 물렸다 (HP -4).', next: 'map' } },
        { id: 2, label: '그냥 지나친다', roll: false, then: { text: ['그대는 동전을 물속에 그대로 두었다.'], next: 'map' } }
      ]
    },
    ex_depths: {
      art: { sky: 'cave', bg: 'aqueduct', actors: [{ k: 'drowned', x: 0.66, face: -1 }], fx: ['drip'] },
      title: '수로의 깊은 곳', clock: '탐색', if: { flag: 'found_bones', not: 'got_ring' },
      text: [
        '물이 가슴까지 차오르는 수로의 가장 깊은 곳. 녹슨 갑주가 부딪히는 소리가 바로 앞에서 들린다.',
        '물속에서 투구 하나가 천천히 떠올랐다. 그 안에서 푸른 불꽃이 탄다. 손가락에 낀 은반지가 물빛에 번득였다.'
      ],
      choices: [
        { id: 1, insp: 'brave', label: '물에 잠긴 기사와 싸운다 (권장 레벨 5)', roll: false, note: '전투',
          then: {
            text: ['기사가 녹슨 대검을 물 밖으로 끌어 올렸다. 천 년의 침묵을 깨는 소리였다.'],
            battle: { enemies: ['drowned'],
              win: { text: ['기사의 갑주가 무너져 내렸다. 푸른 불꽃이 꺼지기 직전, 그것은 그대를 향해 고개를 숙였다. 마치 — 고맙다는 듯이.'], log: '물에 잠긴 기사를 쉬게 했다.', next: 'map' },
              lose: { text: ['녹슨 대검이 그대를 물속으로 처박았다. 정신을 차렸을 때, 기사는 다시 깊은 곳으로 가라앉은 뒤였다.'], log: '물에 잠긴 기사에게 쓰러졌다.', next: 'map' } },
            next: 'map' } },
        { id: 2, label: '지금은 물러난다', roll: false, then: { text: ['그대는 조용히 물러났다. 기사는 그대를 쫓지 않았다.'], next: 'map' } }
      ]
    },
    ex_corpse: {
      title: '추종자의 시신', clock: '탐색',
      text: ['무너진 기둥 아래 회색 두건을 쓴 시신이 깔려 있다. 손등에 사냥개와 같은 낙인이 있다.'],
      choices: [
        { id: 1, skill: '지각', label: '시신의 소지품을 살핀다', stat: '지혜', dc: 12,
          success: { text: ['두건 속주머니에서 낙인 조각과 금화 몇 닢이 나왔다.'], fx: { items: ['회색 낙인 조각'], gold: [8, 16], xp: 3 }, log: '추종자의 시신에서 낙인 조각을 찾았다.', next: 'map' },
          fail: { text: ['시신에 손을 대는 순간, 낙인이 회색 빛을 뿜으며 손끝을 태웠다.'], fx: { hp: -3 }, log: '낙인이 손끝을 태웠다 (HP -3).', next: 'map' } },
        { id: 2, label: '그냥 지나친다', roll: false, then: { text: ['그대는 시신을 지나쳤다.'], next: 'map' } }
      ]
    }
  },

  // 1장 끝 화면에 보여 줄 기록
  summary: [
    { label: '오르덴', cases: [
        { if: { flag: ['orden_joins', 'orden_cracked'] }, t: '갑주에 균열을 안은 채 그대와 동행한다' },
        { if: { flag: 'orden_joins' }, t: '맹세를 지켜 그대와 동행한다' },
        { if: { min: { bond: 1 } }, t: '그대를 믿지만, 관문을 지키기 위해 남았다' }
      ], else: '관문을 지키는 문지기로 남았다' },
    { label: '잿빛 송곳니', cases: [
        { if: { flag: 'alpha_slain' }, t: '쓰러뜨렸다' },
        { if: { flag: 'alpha_freed' }, t: '낙인에서 해방되어 야생으로 돌아갔다' },
        { if: { flag: 'alpha_fled' }, t: '달아났다. 사냥꾼에게 그대의 냄새를 전할 것이다' }
      ] },
    { label: '새끼', cases: [
        { if: { item: '잿빛 새끼' }, t: '그대의 곁에 남았다' },
        { if: { flag: 'alpha_slain' }, t: '홀로 빗속으로 사라졌다' },
        { if: { any: ['alpha_freed', 'alpha_fled'] }, t: '어미와 함께 떠났다' }
      ] },
    { label: '별의 조각', cases: [
        { if: { flag: 'star_map' }, t: '첫 조각이 동쪽 침묵의 숲에 있음을 안다' }
      ], else: '{relic:이} 동쪽을 가리킨다' },
    { label: '회색 사냥꾼', cases: [
        { if: { any: ['alpha_fled', 'hunter_saw'] }, t: '그대의 존재를 알아챘다' }
      ], else: '아직 그대의 정체를 모른다' },
    { label: '가라앉은 맹세', cases: [
        { if: { flag: 'q_ring_done' }, t: '오르덴의 동생 카이론의 반지를 돌려주었다' }
      ], else: '수로 깊은 곳의 기사는 아직 잠들어 있다' },
    { label: '별의 흔적', cases: [
        { if: { flag: 'starmark' }, t: '손등에 일곱 갈래 별 모양 화상이 남았다' }
      ], else: '없음' }
  ]
};
