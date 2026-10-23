// 떨어진 별의 노래 — 제1장 「비 내리는 관문」 (오픈월드)
//
// 세계: 장소(locations)를 자유롭게 오가며 이야기(events), 탐색, 사냥(전투), 휴식, 상점을 이용한다.
// 이야기 사건: 장면 → 선택지(주사위 판정) → 결과(success / fail, crit / fumble) → next
//   next: 다른 사건 id, 'map'(지도로 돌아감), 'end'(1장 끝 화면)
//   결과에 battle이 있으면 결과를 보여 준 뒤 턴제 전투를 하고, 이기면 win / 지면 lose 결과로 이어진다.
// 모든 결과는 이야기를 끊지 않는다. 결과는 플래그와 수치로 남아 뒤의 문장·난이도·선택지·전투를 바꾼다.
//
// 직업별 문장: { mage: '…', warrior: '…', rogue: '…', bard: '…', _: '기본' }
// 낱말 치환: {name} {cls} {weapon} {item} {fine} {relic} {oath} {amp}, 조사: {item:을} {relic:으로} {name:이여}
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
    fx: { set: ['alerted'] }, log: '정찰병에게 쓰러졌다. 놈의 울음이 무리를 깨웠다.', next: 'map' }
};

// 사냥개의 밤: 남은 사냥개와의 전투
function HOUNDS(enemies) {
  return {
    enemies: enemies, noFlee: true, art: { sky: 'star', bg: 'tomb', fx: ['motes'] },
    intro: '남은 사냥개들이 이빨을 드러내며 달려든다!',
    // 오르덴은 유대와 상관없이 문을 지키러 함께 싸운다. 동료가 많을수록 무리도 많이 남는다 (오르덴 한 명까지는 그대로)
    guests: ['orden'], scale: ['scout', 'hound'], scaleFree: 1,
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

// 옛 수로의 묘실: 가라앉은 기사단장 (사냥터 우두머리, 되풀이해 싸운다)
const CAPTAIN_FIGHT = {
  // 동료 한 명마다 HP +25, 동료가 둘 이상이면 한 라운드에 두 번 움직인다
  enemies: ['captain'], noFlee: true, perPC: { hp: 25 }, extraTurn: 2,
  art: { sky: 'cave', bg: 'aqueduct', fx: ['drip'] },
  intro: '기사단장이 녹슨 장검을 물 밖으로 들어 올렸다. 묘실의 물이 일제히 일렁인다!',
  win: {
    text: [
      '기사단장이 한쪽 무릎을 꿇었다. 투구 속 금빛 불꽃이 잦아들며, 그는 다시 묘실의 물속으로 가라앉았다.',
      '그러나 완전히 꺼지지는 않았다. 맹세는 아직 끝나지 않았다는 듯, 물 밑에서 희미한 빛이 깜박였다. 그대가 쉬고 나면 그는 다시 일어설 것이다.'
    ],
    fx: { set: ['captain_slept'], add: { captain_wins: 1 } }, log: '가라앉은 기사단장을 잠재웠다. 긴 휴식 뒤에 다시 일어난다.', next: 'map' },
  lose: {
    text: ['녹슨 장검이 그대를 묘실 밖으로 내동댕이쳤다. 물살이 그대를 수로 어귀까지 떠밀었다.', '묘실 깊은 곳에서 금빛 불꽃이 다시 그대를 기다린다.'],
    log: '가라앉은 기사단장에게 쓰러졌다.', next: 'map' }
};

// 결계의 방: 잿빛 송곳니와의 결전
const BOSS = {
  enemies: ['alpha'], boss: true, noFlee: true, art: { sky: 'cave', bg: 'barrier' }, field: { cover: true },
  // 오르덴은 결계를 지키러 언제나 함께 싸운다. 동료 한 명마다 HP +28, 동료가 둘 이상이면 한 라운드에 두 번 움직인다
  guests: ['orden'], perPC: { hp: 28 }, extraTurn: 2,
  intro: '결계가 빛난다. 잿빛 송곳니가 낮게 으르렁거린다. 이제 물러설 곳은 없다.',
  mods: [
    { if: { flag: 'alpha_hurt' }, hp: -15, why: '짓눌린 뒷다리 (HP -15)' },
    { if: { flag: 'alpha_burned' }, hp: -10, why: '별빛에 그을린 뒷다리 (HP -10)' },
    { if: { flag: 'burst' }, hp: -20, why: '별빛 폭발 (HP -20)' },
    { if: { flag: 'spear' }, ac: -2, atk: -1, why: '꿰뚫린 어깨 (방어 -2, 명중 -1)' }
  ],
  hesitate: { if: { flag: 'pup_safe' }, p: 0.25, text: '품 안의 새끼가 울자, 잿빛 송곳니가 머뭇거린다.' },
  special: [
    { id: 'unbind', label: '회색 낙인을 부순다', if: { flag: 'mark_seen' }, below: 0.4, mp: 3, stat: '지혜', dc: 16,
      dcMod: [{ if: { flag: 'mark_cracked' }, v: -3, why: '금 간 낙인' }, { if: { flag: 'pup_safe' }, v: -3, why: '새끼의 부름' },
        { if: { flag: 'mark_known' }, v: -2, why: '낙인의 비밀' },
        { if: { party: 'bran' }, v: -2, why: '낙인을 아는 브란' }],
      note: '우두머리 HP가 40% 이하일 때. 성공하면 죽이지 않고 끝낸다',
      outcome: 'freed', failText: '얼음 같은 사슬이 손바닥을 타고 올라왔다. 그대는 억지로 손을 떼어 냈다.', failHp: -5 }
  ],
  win: {
    text: [
      '“아스텔!”',
      '그대가 그 이름을 외치는 순간, {relic}의 별빛이 창날처럼 길게 뻗어 나갔다. 빛의 창이 잿빛 송곳니의 가슴을 꿰뚫었다.',
      '거대한 짐승이 무릎을 꿇었다. 이마의 낙인이 잿가루가 되어 흩어졌고, 짐승은 마지막으로 새끼 쪽을 바라보며 — 조용히 눈을 감았다.'
    ],
    fx: { set: ['alpha_slain'] }, approve: { bran: -1 },
    fxIf: [{ if: { flag: 'pup_safe' }, fx: { items: ['잿빛 새끼'] } }].concat(AFTER_BATTLE),
    log: '결계 안에서 잿빛 송곳니를 쓰러뜨렸다.', next: 'n9' },
  freed: {
    text: [
      '그대는 무기를 내렸다. 그리고 빈손을 펴, 짐승의 이마에 박힌 회색 낙인 위에 얹었다.',
      '얼음 같은 사슬이 손바닥을 타고 올라왔다. 그대는 그것을 별빛으로 한 고리씩 끊어 냈다. 마지막 고리가 끊어지는 순간 — 낙인이 부서지고, 짐승의 핏빛 눈동자가 맑은 호박색으로 돌아왔다.',
      { if: { flag: 'pup_safe' }, t: '그대가 품에 안고 있던 새끼를 내려놓자, 새끼는 비틀거리며 어미에게 달려가 그 다리에 몸을 비볐다.' },
      '잿빛 송곳니는 오랫동안 그대를 바라보았다. 그리고 천천히, 그대의 발치에 머리를 숙였다. 짐승이 몸을 일으킨 자리에는 잿빛 털 한 줌이 떨어져 있었다.'
    ],
    fx: { set: ['alpha_freed'], items: ['잿빛 털 한 줌'], xp: 80 }, fxIf: AFTER_BATTLE, approve: { sena: 2, bran: 2 },
    log: '잿빛 송곳니의 낙인을 부숴 사냥꾼의 사슬에서 해방했다.', next: 'n9' },
  lose: {
    text: [
      { if: { flag: 'with_orden' }, t: '짐승의 송곳니가 그대를 감싸던 오르덴의 가슴 갑주를 물어뜯었다. 천 년을 버텨 온 은빛 갑주에 깊은 균열이 갔다.' },
      '쓰러진 그대를 내려다보던 잿빛 송곳니는, 결계 기둥 하나를 들이받아 무너뜨렸다.',
      { if: { not: 'pup_safe' }, t: '짐승은 새끼의 목덜미를 물고, 무너진 틈으로 뛰쳐나갔다.' },
      { if: { flag: 'pup_safe' }, t: '짐승은 그대의 품에서 새끼를 낚아채듯 물어 올리고, 무너진 틈으로 뛰쳐나갔다.' },
      '빗속으로 사라지는 그 뒷모습을, 그대는 쓰러진 채 바라볼 수밖에 없었다.'
    ],
    fx: { set: ['alpha_fled'] },
    fxIf: [{ if: { flag: 'with_orden' }, fx: { set: ['orden_cracked'] } }].concat(AFTER_BATTLE),
    log: '잿빛 송곳니가 결계를 부수고 새끼와 함께 달아났다.', next: 'n9' }
};

// 검은 소나무 숲: 세나와 함께 거미와 싸운다 (어느 쪽이든 세나는 동료가 된다)
function SENA_FIGHT(surprise, enemies) {
  return {
    enemies: enemies || ['spider', 'spider'], noFlee: true, surprise: surprise ? 'foe' : null,
    art: { sky: 'rain', bg: 'forest', props: ['web'], fx: ['rain'] },
    intro: '거미가 거미줄을 타고 내려온다!',
    win: {
      text: [
        '마지막 거미가 다리를 오그리며 떨어졌다. 여자가 머리카락에 붙은 거미줄을 털어 내며 활시위를 고쳐 맸다.',
        '“세나예요. 마을 등불지기의 손녀.” 그녀가 쏟아진 약초를 주워 담았다. “할머니 눈에 바를 별꽃을 캐러 왔다가 이 꼴이 됐네요.”',
        '세나가 그대를 똑바로 바라보았다. “할머니가 그러더군요. 별 냄새가 나는 사람이 올 거라고. 관문으로 가는 거죠? 숲길이라면 나만큼 아는 사람도 없어요. 같이 가요.”'
      ],
      fx: { xp: 4 }, log: '약초꾼 세나가 동료가 되었다.', next: 'map' },
    lose: {
      text: [
        '거미의 독이 퍼져 무릎이 꺾였다. 흐려지는 시야 속에서, 화살 세 대가 연달아 날아가 거미의 눈을 꿰뚫는 것이 보였다.',
        '정신을 차렸을 때, 젊은 여자가 그대의 상처에 짓이긴 약초를 바르고 있었다. “세나예요. 등불지기의 손녀.” 그녀가 웃었다. “구하러 온 사람을 내가 구했네요.”',
        '“그래도 고마워요. 관문까지 같이 가요. 당신을 혼자 두면 안 될 것 같으니까.”'
      ],
      log: '거미에게 쓰러졌지만 세나가 구해 냈다. 세나가 동료가 되었다.', next: 'map' }
  };
}

// 천 개의 계단 초소: 브란과 함께 사냥개와 싸운다 (어느 쪽이든 브란은 동료가 된다)
function BRAN_FIGHT(surprise) {
  return {
    enemies: ['scout', 'scout'], noFlee: true, surprise: surprise ? 'foe' : null, scale: ['scout'], scaleFree: 1,
    art: { sky: 'rain', bg: 'stairs', fx: ['rain'] },
    intro: '사냥개들이 이빨을 드러내며 달려든다!',
    win: {
      text: [
        '마지막 사냥개가 잿가루가 되어 흩어지자, 사내는 지팡이에 몸을 기댄 채 숨을 몰아쉬었다.',
        '“브란이오. 한때는 회색 사냥꾼의 추종자였지.” 그가 지져진 손등을 내려다보았다. “낙인이 내 뜻을 갉아먹는 게 느껴져서, 불로 지져 냈소. 그 뒤로 개들이 나를 쫓고 있지.”',
        '“그대에게서 별 냄새가 나는군. 사냥꾼이 가장 두려워하는 냄새요.” 브란이 씁쓸하게 웃었다. “낙인에 대해서라면 내가 누구보다 잘 아오. 함께 가겠소. 어차피 혼자서는 오래 못 버틸 테니.”'
      ],
      fx: { xp: 4 }, log: '낙인을 지진 자 브란이 동료가 되었다.', next: 'map' },
    lose: {
      text: [
        '사냥개의 이빨에 쓰러지는 순간, 초소 전체가 불길에 휩싸였다. 사내가 마지막 기름을 쏟아붓고 불을 지른 것이다.',
        '그을린 얼굴로 그대를 끌어낸 사내가 말했다. “브란이오. 한때는 회색 사냥꾼의 추종자였지. 이 손등을 보시오. 낙인을 불로 지져 냈소.”',
        '“빚을 졌으니 갚아야겠지. 그대와 함께 가겠소.”'
      ],
      log: '사냥개에게 쓰러졌지만 브란이 불길로 구해 냈다. 브란이 동료가 되었다.', next: 'map' }
  };
}

// 이끼 곰의 둥지: 늙은 이끼 곰과의 전투 (지면 꽃은 둥지에 남는다 — 다시 찾아갈 수 있다)
function NEST_FIGHT(surprise) {
  return {
    enemies: ['oldbear'], noFlee: true, surprise: surprise ? 'foe' : null, perPC: { hp: 15 },
    art: { sky: 'night', bg: 'forest', fx: ['fog'] },
    intro: '늙은 이끼 곰이 몸을 일으켰다. 빈터 전체가 그 그림자에 덮였다.',
    win: {
      text: [
        '늙은 곰이 무릎을 꿇었다. 그 등에서 이끼가 우수수 떨어져 내렸다.',
        '그대는 은빛 꽃을 꺾었다. 꽃잎이 손바닥 위에서 희미하게 떨렸다.',
        { if: { party: 'sena' }, t: '세나는 쓰러진 곰 곁에 한참 서 있었다. “…미안해.” 그녀가 작게 말했다.' }
      ],
      fx: { items: ['달빛 별꽃'], set: ['moonflower_got'] }, approve: { sena: -1 },
      log: '늙은 이끼 곰을 쓰러뜨리고 달빛 별꽃을 꺾었다.', next: 'map' },
    lose: {
      text: [
        '곰의 앞발이 그대를 빈터 밖으로 날려 보냈다.',
        { if: { party: 'sena' }, t: '정신을 차렸을 때, 세나가 그대를 끌고 숲길까지 나와 있었다. “다음엔… 다른 방법을 찾아요.”' },
        '빈터 한가운데에서, 은빛 꽃은 여전히 곰의 품 안에서 빛나고 있었다.'
      ],
      log: '늙은 이끼 곰에게 쓰러졌다. 꽃은 아직 둥지에 있다.', next: 'map' }
  };
}

// 회색 두건의 은신처: 추종자 우두머리와의 전투 (지면 우두머리는 달아난다 — 다시 찾아갈 수 있다)
function CULT_FIGHT(surprise, burning) {
  return {
    enemies: burning ? ['chief'] : ['chief', 'acolyte', 'acolyte'], noFlee: true, surprise: surprise ? 'foe' : null, perPC: { hp: 12 },
    surf: burning ? { 'foe-front': 'fire', 'foe-back': 'fire' } : null,
    art: { sky: 'cave', bg: 'hall', fx: ['dust'] },
    intro: '“별의 아이로구나.” 우두머리가 웃었다. “사냥꾼께서 기뻐하시겠군.”',
    win: {
      text: [
        '우두머리가 무너지듯 쓰러졌다. 이마의 낙인이 잿가루가 되어 흩어지고, 그 아래에서 늙고 지친 얼굴이 드러났다.',
        '그대는 그의 품에서 회색 장부를 빼냈다. 생각보다 무거웠다. 이름 하나하나가 돌처럼 무거웠다.',
        { if: { party: 'bran' }, t: '브란은 장부를 바로 받지 않았다. 그는 한참 동안 쓰러진 우두머리를 내려다보다가, 그의 눈을 감겨 주었다.' }
      ],
      fx: { items: ['회색 장부'], set: ['ledger_got'] }, approve: { bran: 1 },
      log: '추종자 우두머리를 쓰러뜨리고 회색 장부를 빼앗았다.', next: 'map' },
    lose: {
      text: [
        '낙인의 속삭임이 머릿속을 가득 채웠다. 무릎이 꺾였다.',
        '정신을 차렸을 때, 예배실은 비어 있었다. 우두머리는 장부를 품고 회랑 더 깊은 곳으로 숨었다. 다시 찾아야 한다.'
      ],
      log: '추종자 우두머리에게 쓰러졌다. 그는 장부를 들고 숨었다.', next: 'map' }
  };
}

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
      weapon: '지팡이', item: '낡은 지팡이', fine: '잘 다듬은 지팡이', relic: '별빛 지팡이', oath: '엘레우스의 별지팡이', armor: '여행자의 망토',
      skills: ['runebolt', 'bolt', 'ward', 'frost', 'chain', 'starfire', 'meteor'], row: 'back',
      profs: ['비전', '통찰'],
      blurb: '룬을 읽고 마력을 다루는 학자. 뒷열에서 주문을 쏜다. 마력이 넉넉하고 강한 주문을 쓰지만 몸이 약하다.' },
    { id: 'warrior', name: '전사', key: '힘', hp: 26, mp: 4, hpGain: 7, mpGain: 1, passive: 'might', amp: '투지',
      weapon: '검', item: '낡은 검', fine: '잘 벼린 검', relic: '별빛 검', oath: '엘레우스의 장검', armor: '낡은 사슬 조끼',
      skills: ['smash', 'second', 'riposte', 'warcry', 'surge', 'whirl', 'execute'], row: 'front',
      profs: ['운동', '생존'],
      blurb: '수많은 전장을 건너온 검사. HP와 방어가 가장 높아 앞열에서 오래 버틴다. 기술은 짧은 휴식마다 충전된다.' },
    { id: 'rogue', name: '도적', key: '민첩', hp: 22, mp: 6, hpGain: 5, mpGain: 2, passive: 'shadow', amp: '급소 노리기',
      weapon: '단검', item: '낡은 단검', fine: '잘 벼린 단검', relic: '별빛 단검', oath: '엘레우스의 단검', armor: '가죽 조끼',
      skills: ['stab', 'step', 'smoke', 'mark', 'venom', 'assassin'], row: 'front', sneak: true,
      profs: ['은신', '곡예'],
      blurb: '그림자를 밟고 다니는 떠돌이. 유리하거나 동료가 적을 붙잡고 있을 때 기습 피해를 더하고, 보조 행동으로 숨는다.' },
    { id: 'bard', name: '음유시인', key: '매력', hp: 22, mp: 8, hpGain: 5, mpGain: 2, passive: 'voice', amp: '영감',
      weapon: '류트', item: '낡은 류트', fine: '새 줄을 건 류트', relic: '별빛 류트', oath: '엘레우스의 류트', armor: '가죽 조끼',
      skills: ['mock', 'discord', 'mend', 'lullaby', 'anthem', 'rally', 'starsong', 'finale'], row: 'back',
      profs: ['공연', '기만'],
      blurb: '옛 노래를 기억하는 가객. 노래로 적을 흔들고 동료를 치유한다.' }
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

  // 전투 기술. cost: 'action'(행동, 기본) | 'bonus'(보조 행동)
  // 자원: mp(마력) 또는 uses + per('short' 짧은 휴식마다 / 'long' 긴 휴식마다)
  // kind: attack(한 대상 명중 굴림) / darts(반드시 맞는 화살) / save(적이 내성 굴림, area: one|row|all) / sweep(닿는 적 모두)
  //       pierce(앞열과 그 뒤) / heal(아군 하나) / self / buff(아군 모두) / debuffAll / taunt / surface(열 바닥에 표면)
  // dtype: phys, fire(불), cold(냉기), arcane(마력), radiant(별빛), thunder(천둥), psychic(정신), poison(독)
  combatSkills: {
    // 기술 설명의 {dmg} {heal} {extra} {darts} {turns}는 지금 레벨의 값으로 바뀐다. up: 그 레벨부터 바뀌는 값 (note는 미리 보여 줄 말)
    // 마법사 — 마력. 원소를 엮는다: 얼음은 얼리고, 불은 기름을 터뜨리고, 번개는 젖은 적을 감전시킨다
    runebolt: { cls: 'mage', lv: 1, name: '룬 화살', mp: 0, kind: 'attack', attack: 'spell', stat: '지혜', dmg: '1d8', addStat: true, dtype: 'arcane',
      up: [{ lv: 5, dmg: '2d8', note: '피해 2d8' }],
      desc: '원거리 주문 공격. 비전 {dmg}+지혜. 마력을 쓰지 않는다' },
    bolt: { cls: 'mage', lv: 1, name: '마력 탄', mp: 2, kind: 'darts', darts: 3, dmg: '1d4+1', dtype: 'arcane',
      up: [{ lv: 4, darts: 4, note: '화살 네 발' }],
      desc: '반드시 맞는 마력 화살 {darts}발, 각 비전 {dmg}. 대상이 쓰러지면 남은 화살은 다른 적에게' },
    ward: { cls: 'mage', lv: 2, name: '비전 방패', mp: 1, cost: 'bonus', kind: 'buff', self: true, buff: { ac: 4 }, turns: 2,
      desc: '그대의 다음 차례가 끝날 때까지 방어 +4. 앞열에 선 적에게 몰릴 때 버틴다' },
    frost: { cls: 'mage', lv: 3, name: '서리 사슬', mp: 3, kind: 'attack', attack: 'spell', stat: '지혜', dmg: '2d6', addStat: true, dtype: 'cold', onHit: { stun: 1 }, surface: 'ice',
      up: [{ lv: 6, dmg: '3d6', note: '피해 3d6' }],
      desc: '원거리 주문 공격. 냉기 {dmg}+지혜, 맞으면 1턴 얼어붙는다. 대상이 선 열의 바닥이 얼음으로 덮인다' },
    chain: { cls: 'mage', lv: 4, name: '번개 사슬', mp: 3, kind: 'attack', attack: 'spell', stat: '지혜', dmg: '2d8', addStat: true, dtype: 'lightning', chain: 2, shock: true,
      desc: '원거리 주문 공격. 번개 {dmg}+지혜, 맞으면 다른 적 둘에게 절반씩 튄다. 젖은 적은 감전되어 1턴 얼어붙는다 (물 위의 싸움, 물에 빠진 적)' },
    starfire: { cls: 'mage', lv: 5, name: '별불', mp: 5, kind: 'save', area: 'all', save: '민첩', stat: '지혜', dmg: '3d6', addStat: true, dtype: 'fire', half: true,
      desc: '모든 적에게 불 {dmg}+지혜 (민첩 내성에 성공하면 절반). 기름에 불이 붙는다' },
    meteor: { cls: 'mage', lv: 7, name: '떨어지는 별', mp: 7, kind: 'save', area: 'row', save: '민첩', stat: '지혜', dmg: '4d10', addStat: true, dtype: 'radiant', half: true, onFail: { prone: 1 }, surface: 'fire',
      desc: '대상이 선 열에 별을 떨어뜨린다. 별빛 {dmg}+지혜 (민첩 내성에 성공하면 절반), 실패한 적은 넘어진다. 그 열이 불탄다' },
    // 전사 — 짧은 휴식마다 충전. 앞열에서 버티고, 몰아친다
    smash: { cls: 'warrior', lv: 1, name: '강타', uses: 2, per: 'short', kind: 'attack', weapon: true, extra: '1d8', onHit: { prone: 1 },
      up: [{ lv: 5, extra: '2d8', note: '피해 +2d8' }],
      desc: '무기 피해 +{extra}. 맞으면 넘어뜨린다 (거대한 적 제외)' },
    second: { cls: 'warrior', lv: 1, name: '재정비', cost: 'bonus', uses: 1, per: 'short', kind: 'self', heal: '1d10', healLv: true,
      up: [{ lv: 6, uses: 2, note: '짧은 휴식마다 2번' }],
      desc: 'HP {heal}+레벨 회복' },
    riposte: { cls: 'warrior', lv: 2, name: '반격 자세', cost: 'bonus', uses: 2, per: 'short', kind: 'buff', self: true, buff: { ac: 2, riposte: 1 }, turns: 2,
      desc: '다음 차례가 끝날 때까지 방어 +2. 그대를 노린 근접 공격이 빗나가면 곧바로 받아친다 (라운드마다 한 번)' },
    warcry: { cls: 'warrior', lv: 3, name: '전투 함성', cost: 'bonus', uses: 1, per: 'short', kind: 'buff', buff: { atk: 2, dmg: 2 }, turns: 3,
      desc: '아군 모두 3턴 동안 명중·피해 +2' },
    surge: { cls: 'warrior', lv: 4, name: '몰아치기', cost: 'bonus', uses: 1, per: 'short', kind: 'surge',
      desc: '행동을 쓴 뒤, 보조 행동으로 행동을 하나 더 얻는다 (공격이든 기술이든)' },
    whirl: { cls: 'warrior', lv: 5, name: '회오리 베기', uses: 2, per: 'short', kind: 'sweep', weapon: true,
      desc: '닿는 적 모두에게 무기 공격' },
    execute: { cls: 'warrior', lv: 7, name: '처형', uses: 1, per: 'short', kind: 'attack', weapon: true, extra: '1d8', execute: '3d8',
      desc: '무기 피해 +{extra}. 대상의 HP가 절반 이하면 피해 +3d8 더' },
    // 도적 — 짧은 휴식마다 충전. 숨기·물러서기는 보조 행동으로 할 수 있다. 약점을 드러내고 급소를 노린다
    stab: { cls: 'rogue', lv: 1, name: '급소 찌르기', uses: 2, per: 'short', kind: 'attack', weapon: true, hit: 2, crit: 18, extra: '1d6',
      up: [{ lv: 5, extra: '2d6', note: '피해 +2d6' }],
      desc: '명중 +2, 피해 +{extra}, 18~20 치명타' },
    step: { cls: 'rogue', lv: 2, name: '어둠 속으로', cost: 'bonus', uses: 2, per: 'short', kind: 'step',
      desc: '기회 공격 없이 뒷열로 물러나 반드시 숨는다 (이미 뒷열이면 그 자리에서 숨는다). 숨은 채 공격하면 유리하다' },
    smoke: { cls: 'rogue', lv: 3, name: '연막', uses: 1, per: 'short', kind: 'debuffAll', status: { blind: 2 },
      desc: '2턴 동안 모든 적이 연막에 갇힌다 (적의 공격 불리, 적을 향한 공격 유리)' },
    mark: { cls: 'rogue', lv: 4, name: '약점 노리기', cost: 'bonus', uses: 2, per: 'short', kind: 'mark', turns: 2,
      up: [{ lv: 6, turns: 3, note: '3턴' }],
      desc: '대상의 약점을 드러낸다. {turns}턴 동안 그 적을 향한 아군의 공격이 모두 유리 (그대는 기습 피해를 더한다)' },
    venom: { cls: 'rogue', lv: 5, name: '독칼', uses: 2, per: 'short', kind: 'attack', weapon: true, onHit: { poison: 3 },
      desc: '무기 공격. 맞으면 3턴 동안 매 턴 독 1d6' },
    assassin: { cls: 'rogue', lv: 7, name: '암살', uses: 1, per: 'short', kind: 'attack', weapon: true, extra: '2d6', critAdv: true,
      desc: '무기 피해 +{extra}. 유리한 채로 맞히면 반드시 치명타 (숨기·어둠 속으로·연막·약점 노리기와 함께)' },
    // 음유시인 — 마력. 노래로 적을 흔들고 아군을 일으킨다
    mock: { cls: 'bard', lv: 1, name: '비웃는 노래', mp: 0, kind: 'save', area: 'one', save: '지혜', stat: '매력', dmg: '1d6', addStat: true, dtype: 'psychic', onFail: { weak: 1 },
      up: [{ lv: 5, dmg: '2d6', note: '피해 2d6' }],
      desc: '대상이 지혜 내성에 실패하면 정신 {dmg}+매력, 다음 턴 명중 -2. 마력을 쓰지 않는다' },
    discord: { cls: 'bard', lv: 1, name: '불협화음', mp: 2, kind: 'save', area: 'row', save: '힘', stat: '매력', dmg: '2d6', addStat: true, dtype: 'thunder', half: true, onFail: { push: 1 },
      desc: '대상이 선 열 전체에 천둥 {dmg}+매력 (힘 내성에 성공하면 절반). 실패한 적은 넘어지고, 앞열에 있었다면 뒷열로 밀려난다' },
    mend: { cls: 'bard', lv: 1, name: '치유의 노래', mp: 2, cost: 'bonus', kind: 'heal', heal: '1d8', stat: '매력',
      up: [{ lv: 5, heal: '2d8', note: '회복 2d8' }],
      desc: '아군 하나 HP {heal}+매력 회복. 쓰러진 동료도 일으킨다' },
    lullaby: { cls: 'bard', lv: 2, name: '자장가', mp: 2, kind: 'save', area: 'row', save: '지혜', stat: '매력', onFail: { stun: 1 }, noBoss: true,
      desc: '대상이 선 열의 적이 지혜 내성에 실패하면 1턴 잠든다 (움직이지 못하고, 그 적을 향한 공격이 유리). 우두머리와 정예에게는 듣지 않는다' },
    anthem: { cls: 'bard', lv: 3, name: '전장의 찬가', mp: 2, cost: 'bonus', kind: 'buff', buff: { atk: 2, dmg: 2 }, turns: 3,
      desc: '아군 모두 3턴 동안 명중·피해 +2' },
    rally: { cls: 'bard', lv: 4, name: '용기의 노래', mp: 3, cost: 'bonus', kind: 'rally', heal: '1d4', stat: '매력',
      desc: '아군 모두 HP {heal}+매력 회복, 얼어붙음·명중 감소·속박·중독을 씻어 낸다' },
    starsong: { cls: 'bard', lv: 5, name: '별의 노래', mp: 4, kind: 'save', area: 'all', save: '지혜', stat: '매력', dmg: '2d8', addStat: true, dtype: 'radiant', half: true, partyHeal: '1d8',
      desc: '모든 적에게 별빛 {dmg}+매력 (지혜 내성에 성공하면 절반), 아군 모두 HP 1d8 회복' },
    finale: { cls: 'bard', lv: 7, name: '마지막 노래', mp: 6, kind: 'finale', heal: '1d8', stat: '매력', buff: { atk: 3, dmg: 3 }, turns: 3,
      desc: '쓰러진 아군을 모두 일으키고 (HP {heal}+매력), 아군 모두 3턴 동안 명중·피해 +3' },
    // 오르덴
    pierce: { comp: 'orden', lv: 1, name: '꿰뚫는 창', uses: 2, per: 'short', kind: 'pierce', weapon: true,
      desc: '앞열의 적과 그 뒤 뒷열의 적 하나를 함께 찌른다' },
    taunt: { comp: 'orden', lv: 1, name: '도발의 외침', cost: 'bonus', uses: 1, per: 'short', kind: 'taunt', turns: 2,
      desc: '2턴 동안 적들이 오르덴만 노린다 (닿을 수 있으면)' },
    // 세나
    aimed: { comp: 'sena', lv: 1, name: '조준 사격', uses: 2, per: 'short', kind: 'attack', weapon: true, hit: 2, extra: '1d8',
      desc: '명중 +2, 피해 +1d8' },
    herb: { comp: 'sena', lv: 1, name: '약초 찜질', uses: 2, per: 'short', kind: 'heal', heal: '1d8+3',
      desc: '아군 하나 HP 1d8+3 회복. 쓰러진 동료도 일으킨다' },
    net: { comp: 'sena', lv: 3, name: '그물 화살', uses: 1, per: 'short', kind: 'attack', weapon: true, onHit: { restrain: 2 },
      desc: '맞으면 2턴 동안 속박 (움직이지 못하고, 공격이 불리하고, 받는 공격이 유리)' },
    // 브란
    oil: { comp: 'bran', lv: 1, name: '기름 병', cost: 'bonus', uses: 2, per: 'long', kind: 'surface', surface: 'oil',
      desc: '대상이 선 열의 바닥에 기름을 뿌린다 (미끄러져 넘어지고, 불이 닿으면 폭발한다)' },
    wave: { comp: 'bran', lv: 3, name: '화염 파도', uses: 1, per: 'short', kind: 'save', area: 'row', save: '민첩', dmg: '2d6+3', dtype: 'fire', half: true, surface: 'fire',
      desc: '대상이 선 열 전체에 불 2d6+3 (민첩 내성에 성공하면 절반). 그 열에 불이 붙는다' }
  },

  // 동료. joinIf: 함께하게 되는 조건, locs: 이 장소들에서만 함께 싸운다 (anywhereIf가 맞으면 어디서나)
  // attack: 기본 공격 (hit 명중, dice+dmgB 피해, ranged 원거리, reach 뒷열에서도 적 앞열을 찌른다). 레벨마다 조금씩 강해진다
  // ap: 호감을 담는 카운터 (선택지의 approve로 오르내린다), apName: 호감의 이름, leaveAt: 호감이 이만큼 떨어지면 떠난다
  // profs: 이야기 판정에서 이 기술이면 함께 있을 때 유리 (동료의 도움), perks: 조건이 맞으면 붙는 전투 보너스
  companions: {
    orden: { name: '오르덴', title: '맹세기사', art: 'orden', joinIf: { flag: 'done_n4', min: { bond: 1 } },
      locs: ['gate', 'tomb', 'hall', 'stairs', 'aqueduct'], anywhereIf: { flag: 'orden_joins' },
      awayText: '관문을 멀리 떠날 수 없다. 계단·관문·수로·무덤·회랑에서만 함께 싸운다',
      ap: 'bond', apName: '유대', profs: ['역사', '운동', '위협'],
      perks: [{ if: { flag: 'kairon_kept' }, ac: 1, name: '형제의 반지' }],
      hp: 30, hpGain: 7, ac: 17, init: 0, row: 'front', str: 4, dex: 0, wis: 2,
      attack: { name: '장창', hit: 5, dice: '1d10', dmgB: 3, reach: true },
      skills: ['pierce', 'taunt'], guard: true,
      blurb: '엘레우스의 마지막 맹세기사. 장창이 길어 뒷열에서도 적 앞열을 찌른다. 앞열에 서 있으면 다른 동료를 노린 근접 공격 하나를 라운드마다 불리하게 만든다 (수호).' },
    sena: { name: '세나', title: '약초꾼 궁수', art: 'sena', joinIf: { flag: 'sena_met', not: 'sena_left' },
      ap: 'ap_sena', apName: '호감', profs: ['생존', '의학', '지각'], leaveAt: -5,
      leaveText: '“당신이랑은 더 못 가겠어요.” 세나가 활을 메고 돌아섰다. “할머니한테 돌아갈게요. 찾지 마세요.”',
      perks: [{ if: { flag: 'sena_kept_arrow' }, hit: 1, name: '어머니의 화살촉' }],
      hp: 18, hpGain: 5, ac: 14, init: 3, row: 'back', str: 0, dex: 3, wis: 2,
      attack: { name: '사냥 활', hit: 5, dice: '1d8', dmgB: 3, ranged: true },
      skills: ['aimed', 'herb', 'net'],
      blurb: '등불지기 노파의 손녀. 뒷열에서 활을 쏘고, 약초로 쓰러진 동료를 일으킨다.' },
    bran: { name: '브란', title: '낙인을 지진 자', art: 'bran', joinIf: { flag: 'bran_met', not: 'bran_left' },
      ap: 'ap_bran', apName: '호감', profs: ['비전', '기만', '은신'], leaveAt: -5,
      leaveText: '“사냥꾼이나 그대나, 결국 같은 부류였군.” 브란이 지팡이를 집어 들었다. 그 뒷모습은 금세 안개 속으로 사라졌다.',
      perks: [{ if: { flag: 'ledger_burned' }, hit: 1, name: '풀려난 손' }],
      hp: 16, hpGain: 4, ac: 12, init: 1, row: 'back', str: 0, dex: 1, wis: 3, dc: 3,
      attack: { name: '불씨', hit: 5, dice: '1d10', dmgB: 0, ranged: true, dtype: 'fire', burn: true },
      skills: ['oil', 'wave'],
      blurb: '회색 사냥꾼의 추종자였던 주술사. 불씨를 던지면 맞은 적이 불붙고, 기름 위로 떨어지면 폭발한다.' }
  },

  items: {
    '낡은 지팡이': { kind: '무기', slot: 'weapon', dice: '1d6', bonus: 0, desc: '오랜 여정을 함께한 지팡이' },
    '잘 다듬은 지팡이': { kind: '무기', slot: 'weapon', rar: 'uncommon', dice: '1d6', bonus: 1, price: 45, desc: '단단한 흑단으로 다시 깎은 지팡이' },
    '별빛 지팡이': { kind: '무기', slot: 'weapon', rar: 'legendary', dice: '1d8', bonus: 2, desc: '일곱째 별 아스텔의 마지막 빛' },
    '낡은 검': { kind: '무기', slot: 'weapon', dice: '1d8', bonus: 0, desc: '이가 조금 빠진 낡은 검' },
    '잘 벼린 검': { kind: '무기', slot: 'weapon', rar: 'uncommon', dice: '1d8', bonus: 1, price: 45, desc: '행상인이 숫돌에 갈아 준 검' },
    '별빛 검': { kind: '무기', slot: 'weapon', rar: 'legendary', dice: '1d10', bonus: 2, desc: '일곱째 별 아스텔의 마지막 빛' },
    '낡은 단검': { kind: '무기', slot: 'weapon', dice: '1d6', bonus: 0, crit: 19, desc: '손때 묻은 단검. 19~20 치명타' },
    '잘 벼린 단검': { kind: '무기', slot: 'weapon', rar: 'uncommon', dice: '1d6', bonus: 1, crit: 19, price: 45, desc: '날이 선 단검. 19~20 치명타' },
    '별빛 단검': { kind: '무기', slot: 'weapon', rar: 'legendary', dice: '1d8', bonus: 2, crit: 18, desc: '일곱째 별 아스텔의 마지막 빛. 18~20 치명타' },
    '낡은 류트': { kind: '무기', slot: 'weapon', dice: '1d6', bonus: 0, desc: '줄 하나가 늘어진 낡은 류트. 울림으로 친다' },
    '새 줄을 건 류트': { kind: '무기', slot: 'weapon', rar: 'uncommon', dice: '1d6', bonus: 1, price: 45, desc: '은실 줄을 새로 건 류트' },
    '별빛 류트': { kind: '무기', slot: 'weapon', rar: 'legendary', dice: '1d8', bonus: 2, desc: '일곱째 별 아스텔의 마지막 빛' },
    // 가라앉은 기사단장이 지키던 엘레우스의 무기 (직업마다 하나, 단장에게서만 나온다)
    '엘레우스의 별지팡이': { kind: '무기', slot: 'weapon', rar: 'legendary', dice: '1d8', bonus: 2, fx: { mp: 4 }, desc: '엘레우스 궁정 마법사의 지팡이. 끝에 별 조각이 박혀 있다' },
    '엘레우스의 장검': { kind: '무기', slot: 'weapon', rar: 'legendary', dice: '1d10', bonus: 2, fx: { hp: 6 }, desc: '기사단장이 물속에서도 놓지 않은 장검' },
    '엘레우스의 단검': { kind: '무기', slot: 'weapon', rar: 'legendary', dice: '1d8', bonus: 2, crit: 18, fx: { init: 2 }, desc: '기사단 첩자의 은빛 단검. 18~20 치명타' },
    '엘레우스의 류트': { kind: '무기', slot: 'weapon', rar: 'legendary', dice: '1d8', bonus: 2, fx: { check: 1, save: 1 }, desc: '기사단의 행진곡을 연주하던 궁정 류트' },
    '여행자의 망토': { kind: '방어구', slot: 'armor', ac: 0, desc: '비를 겨우 막는 망토' },
    '가죽 조끼': { kind: '방어구', slot: 'armor', ac: 1, desc: '얇은 가죽 조끼' },
    '낡은 사슬 조끼': { kind: '방어구', slot: 'armor', ac: 2, desc: '군데군데 고리가 빠진 사슬 조끼' },
    '가죽 갑옷': { kind: '방어구', slot: 'armor', ac: 2, price: 40, desc: '기름 먹인 두꺼운 가죽 갑옷' },
    '사슬 갑옷': { kind: '방어구', slot: 'armor', rar: 'uncommon', ac: 3, price: 90, desc: '촘촘한 사슬 갑옷' },
    '엘레우스 기사의 흉갑': { nosell: true, kind: '방어구', slot: 'armor', rar: 'rare', ac: 4, desc: '물에 잠겨서도 녹슬지 않은 은빛 흉갑' },
    '곰가죽 갑옷': { kind: '방어구', slot: 'armor', rar: 'uncommon', ac: 3, fx: { hp: 4 }, desc: '이끼 곰의 두꺼운 가죽을 덧댄 갑옷' },
    // 머리·손·발 (fx는 장신구와 같은 효과를 쓴다)
    '가죽 두건': { kind: '머리', slot: 'head', fx: { hp: 3 }, price: 18, desc: '빗물을 막아 주는 가죽 두건' },
    '철 투구': { kind: '머리', slot: 'head', rar: 'uncommon', ac: 1, price: 70, desc: '행상인이 어디선가 구해 온 둥근 철 투구' },
    '수로 산호 투구': { kind: '머리', slot: 'head', rar: 'rare', ac: 1, fx: { save: 1, resist: ['cold'] }, desc: '수로 바닥의 산호가 엉겨 붙은 투구. 차가운 물을 막는다' },
    '가죽 장갑': { kind: '손', slot: 'hands', fx: { init: 1 }, price: 16, desc: '손에 착 붙는 가죽 장갑' },
    '거미 비단 장갑': { kind: '손', slot: 'hands', rar: 'uncommon', fx: { init: 2 }, desc: '거미줄로 짠 가벼운 장갑' },
    '곰 발톱 건틀릿': { kind: '손', slot: 'hands', rar: 'rare', fx: { hit: 1, dmg: 1 }, desc: '이끼 곰의 발톱을 손등에 박아 넣은 건틀릿' },
    '여행자의 장화': { kind: '발', slot: 'feet', fx: { save: 1 }, price: 16, desc: '진흙 길에도 미끄러지지 않는 장화' },
    '박쥐 날개 장화': { kind: '발', slot: 'feet', rar: 'uncommon', fx: { init: 2 }, desc: '안개 박쥐의 날개 가죽으로 지은 가벼운 장화' },
    // 세트: 같은 세트를 여러 부위 입으면 세트 효과가 더해진다 (sets 참고)
    '늑대가죽 두건': { kind: '머리', slot: 'head', rar: 'set', set: 'wolfhide', fx: { hp: 3, init: 1 }, desc: '안개 비탈 늑대의 가죽으로 지은 두건' },
    '늑대가죽 장갑': { kind: '손', slot: 'hands', rar: 'set', set: 'wolfhide', fx: { dmg: 1 }, desc: '늑대 발톱 자국이 남은 가죽 장갑' },
    '늑대가죽 장화': { kind: '발', slot: 'feet', rar: 'set', set: 'wolfhide', fx: { init: 1, hp: 2 }, desc: '늑대처럼 소리 없이 걷게 해 주는 장화' },
    '맹세기사의 투구': { kind: '머리', slot: 'head', rar: 'set', set: 'oathknight', ac: 1, fx: { hp: 5 }, desc: '물에 잠긴 기사들이 쓰던 은빛 투구. 이마에 일곱 별이 새겨져 있다' },
    '맹세기사의 흉갑': { kind: '방어구', slot: 'armor', rar: 'set', set: 'oathknight', ac: 4, fx: { hp: 4, save: 1 }, desc: '기사단장 바렌의 흉갑. 천 년을 물속에서 버텼다' },
    '맹세기사의 건틀릿': { kind: '손', slot: 'hands', rar: 'set', set: 'oathknight', fx: { hit: 1 }, desc: '사냥개들이 무덤에서 물어 온 은빛 건틀릿. 이빨 자국이 남았다' },
    '맹세기사의 각반': { kind: '발', slot: 'feet', rar: 'set', set: 'oathknight', ac: 1, fx: { init: 1 }, desc: '수로 거머리 떼가 엉겨 붙어 있던 은빛 각반' },
    '맹세기사의 별 인장': { kind: '장신구', slot: 'trinket', rar: 'set', set: 'oathknight', fx: { save: 1, check: 1 }, desc: '추종자들이 기사의 무덤에서 빼앗아 간 맹세의 인장. 그대가 차야 세트에 든다' },
    '은빛 물약': { kind: '물약', use: { hp: 15 }, battle: true, price: 15, desc: 'HP 15 회복' },
    '푸른 물약': { kind: '물약', use: { mp: 8 }, battle: true, price: 20, desc: '마력 8 회복' },
    '기름 병': { kind: '투척', throw: { surface: 'oil' }, battle: true, price: 8, desc: '전투에서 던지면 그 열의 바닥이 기름으로 덮인다. 불이 닿으면 폭발' },
    '불꽃 병': { kind: '투척', rar: 'uncommon', throw: { dmg: '1d6', dtype: 'fire', surface: 'fire' }, battle: true, price: 14, desc: '전투에서 던진다. 맞으면 불 1d6, 그 열에 불이 붙는다' },
    '야영 물자': { kind: '물자', price: 6, desc: '마을 밖의 쉼터(관문의 모닥불)에서 긴 휴식을 할 때 하나를 쓴다' },
    '회색 낙인 조각': { kind: '재료', desc: '사냥개의 목에서 떨어진 낙인 조각. 세 개를 모으면 살펴볼 수 있다' },
    '기사의 반지': { kind: '증표', desc: '물에 잠긴 기사가 끼고 있던 은반지. 오르덴이 알아볼지도 모른다' },
    '잿빛 새끼': { kind: '동료', desc: '어미를 잃은 사냥개 새끼. 이마에 아직 낙인이 없다' },
    '잿빛 털 한 줌': { kind: '장신구', slot: 'trinket', rar: 'legendary', fx: { init: 3, hit: 1, death: true }, desc: '해방된 잿빛 송곳니가 남긴 털. 언젠가 그 울음이 그대를 도울 것이다' },
    // 장신구: 그대나 동료 한 명이 찬다. fx: hp(최대 HP) mp(최대 마력) ac hit dmg fire(불 피해) init save check(이야기 판정) resist[] hide(숨기 유리) death(죽음 내성 유리) smite(무기 공격에 별빛 피해)
    '여행자의 행운 부적': { kind: '장신구', slot: 'trinket', rar: 'uncommon', fx: { check: 1 }, price: 45, desc: '길 떠나는 이의 목에 걸어 주던 은방울' },
    '회색 두건': { kind: '장신구', slot: 'trinket', rar: 'uncommon', fx: { hide: true, init: 1 }, desc: '추종자의 두건. 그림자에 녹아든다' },
    '곰 송곳니 목걸이': { kind: '장신구', slot: 'trinket', rar: 'uncommon', fx: { dmg: 1 }, desc: '이끼 곰의 송곳니를 꿴 목걸이' },
    '이끼 왕관': { nosell: true, kind: '장신구', slot: 'trinket', rar: 'rare', fx: { hp: 8 }, desc: '늙은 이끼 곰의 둥지에서 자란 이끼가 왕관처럼 엉긴 것' },
    '등불지기의 등불': { nosell: true, kind: '장신구', slot: 'trinket', rar: 'rare', fx: { check: 1, save: 1 }, desc: '잿빛 안개 속에서도 꺼지지 않는 등불지기 대대의 불씨' },
    '세나 어머니의 화살촉': { nosell: true, kind: '장신구', slot: 'trinket', rar: 'rare', fx: { hit: 1, init: 1 }, desc: '사냥개 세 마리를 쏜 화살촉. 지켜야 할 사람에게 넘겨준다' },
    '브란의 불씨 반지': { nosell: true, kind: '장신구', slot: 'trinket', rar: 'rare', fx: { fire: 2, resist: ['fire'] }, desc: '회색 장부를 태운 불씨가 깃든 무쇠 반지' },
    '카이론의 반지': { nosell: true, kind: '장신구', slot: 'trinket', rar: 'rare', fx: { ac: 1, save: 1 }, desc: '오르덴의 동생이 끼던 맹세기사의 은반지' },
    '사냥꾼의 휘장': { nosell: true, kind: '장신구', slot: 'trinket', rar: 'rare', fx: { hit: 1, resist: ['psychic'] }, desc: '추종자 우두머리가 지니던 회색 왕관 문양. 속삭임을 막아 준다' },
    '달빛 별꽃': { kind: '약초', desc: '달빛도 없는데 은빛으로 빛나는 꽃. 낙인의 빛이 남긴 상처를 씻는다' },
    '달빛 별꽃의 이슬': { kind: '약초', desc: '꽃을 꺾지 않고 받아 온 달빛 별꽃의 이슬. 낙인의 빛이 남긴 상처를 씻는다' },
    '회색 장부': { kind: '증표', desc: '낙인이 찍힌 모든 이름이 적힌 장부. 브란이 이것을 찾고 있었다' },
    '회색 장부의 마지막 장': { kind: '증표', desc: '사냥꾼이 머무는 곳이 적힌 한 장. 제2장에서 길잡이가 될 것이다' }
  },

  // 적. atk: 명중 보너스, ac: 방어, dmg: 피해 주사위, row: 처음 서는 열 (기본 앞열)
  // ranged: 원거리 공격, fly: 날아다님 (어느 열이든 닿고 바닥 표면을 밟지 않는다), big: 거대함 (넘어뜨리거나 밀 수 없다)
  // pack: 무리 사냥 (함께 싸우는 짐승이 있으면 명중 +2), init: 주도권 보너스, resist/vuln: 피해 종류 저항(절반)/약점(두 배)
  // 기술: p(확률), dmg, hit, ranged, onHit{prone, restrain, poison}, sweep(앞열 모두), debuff(아군 모두 명중 감소), summon
  enemies: {
    wolf: { art: 'wolf', name: '굶주린 늑대', lv: 1, hp: 10, ac: 11, atk: 3, dmg: '1d6+1', xp: 5, gold: [2, 6], pack: true, init: 2,
      drops: [{ item: '늑대가죽 두건', p: 0.07, pity: 22, uniq: true }, { item: '늑대가죽 장갑', p: 0.07, pity: 22, uniq: true }, { item: '늑대가죽 장화', p: 0.07, pity: 22, uniq: true }],
      desc: '비에 젖은 털 사이로 갈비뼈가 드러난 늑대. 무리 지어 사냥한다.' },
    bats: { art: 'bats', name: '안개 박쥐 떼', lv: 1, hp: 8, ac: 13, atk: 4, dmg: '1d4+1', xp: 4, gold: [1, 4], fly: true, init: 3,
      drops: [{ item: '박쥐 날개 장화', p: 0.07, uniq: true }],
      desc: '안개 속에서 날개 소리만 들리는 박쥐 떼. 날아서 뒷열까지 덮친다.' },
    boar: { art: 'boar', name: '진흙 멧돼지', lv: 2, hp: 16, ac: 12, atk: 4, dmg: '1d8+2', xp: 8, gold: [3, 8], str: 4,
      skills: [{ name: '돌진', p: 0.3, dmg: '1d8+2', onHit: { prone: 1 } }],
      drops: [{ item: '은빛 물약', p: 0.15 }, { item: '야영 물자', p: 0.3 }], desc: '진흙을 뒤집어쓴 성난 멧돼지. 돌진에 맞으면 넘어진다.' },
    spider: { art: 'spider', name: '검은 소나무 거미', lv: 2, hp: 14, ac: 12, atk: 4, dmg: '1d6+1', xp: 8, gold: [2, 7], row: 'back', vuln: ['fire'],
      poison: { p: 0.35, turns: 2, dmg: '1d4' },
      skills: [{ name: '거미줄 뿜기', p: 0.4, ranged: true, dmg: '1d2', onHit: { restrain: 2 } }],
      drops: [{ item: '푸른 물약', p: 0.1 }, { item: '거미 비단 장갑', p: 0.08 }], desc: '송아지만 한 검은 거미. 뒤에서 거미줄을 뿜고, 송곳니에서 독이 떨어진다. 불에 약하다.' },
    bear: { art: 'bear', name: '이끼 곰', lv: 3, hp: 28, ac: 12, atk: 5, dmg: '1d10+3', xp: 14, gold: [5, 12], big: true,
      skills: [{ name: '짓누르기', p: 0.25, dmg: '2d8+3', hit: -1, onHit: { prone: 1 } }], drops: [{ item: '은빛 물약', p: 0.25 }, { item: '야영 물자', p: 0.5 }, { item: '곰 송곳니 목걸이', p: 0.15 }, { item: '곰가죽 갑옷', p: 0.06, uniq: true }, { item: '곰 발톱 건틀릿', p: 0.05, uniq: true }],
      desc: '등에 이끼가 자란 거대한 곰. 숲의 주인이다.' },
    scout: { art: 'scout', name: '잿빛 사냥개 정찰병', lv: 2, hp: 14, ac: 13, atk: 4, dmg: '1d6+2', xp: 9, gold: [2, 6], pack: true, init: 3,
      drops: [{ item: '회색 낙인 조각', p: 0.5 }], desc: '목덜미에 회색 표식이 깜박이는 사냥개.' },
    hound: { art: 'hound', name: '잿빛 사냥개', lv: 3, hp: 20, ac: 13, atk: 5, dmg: '1d8+2', xp: 12, gold: [3, 9], pack: true, init: 2,
      drops: [{ item: '회색 낙인 조각', p: 0.4 }, { item: '맹세기사의 건틀릿', p: 0.04, pity: 30, uniq: true }], desc: '회색 사냥꾼에게 묶인 잿빛 사냥개.' },
    leech: { art: 'leech', name: '수로 거머리', lv: 3, hp: 18, ac: 11, atk: 5, dmg: '1d6+2', xp: 11, gold: [2, 6], drain: 0.5, vuln: ['fire'],
      drops: [{ item: '맹세기사의 각반', p: 0.05, pity: 25, uniq: true }],
      desc: '사람 팔뚝만 한 거머리. 문 자리에서 피를 빨아 회복한다.' },
    drowned: { art: 'drowned', name: '물에 잠긴 기사', lv: 5, hp: 44, ac: 15, atk: 6, dmg: '1d10+3', xp: 35, gold: [20, 35], elite: true, big: true, people: true,
      resist: ['cold', 'poison'], vuln: ['radiant'],
      skills: [{ name: '녹슨 대검 휩쓸기', p: 0.3, dmg: '2d8+3', hit: -2, sweep: true }],
      drops: [{ item: '기사의 반지', p: 1, once: 'got_ring' }, { item: '엘레우스 기사의 흉갑', p: 1, once: 'got_cuirass' }, { item: '은빛 물약', p: 0.5 }, { item: '맹세기사의 투구', p: 0.25, pity: 6, uniq: true }, { item: '수로 산호 투구', p: 0.12, uniq: true }],
      desc: '천 년 동안 수로 바닥에 잠들어 있던 기사. 녹슨 투구 속에서 푸른 불꽃이 탄다. 냉기와 독에 강하고, 별빛에 약하다.' },
    acolyte: { art: 'acolyte', name: '회색 사냥꾼의 추종자', people: true, lv: 4, hp: 26, ac: 14, atk: 6, dmg: '1d8+3', xp: 20, gold: [10, 20], row: 'back', ranged: true,
      skills: [{ name: '사냥개 부르기', p: 0.3, summon: 'hound', once: true }],
      drops: [{ item: '회색 낙인 조각', p: 0.6 }, { item: '푸른 물약', p: 0.3 }, { item: '회색 두건', p: 0.12 }, { item: '맹세기사의 별 인장', p: 0.06, pity: 20, uniq: true }],
      desc: '회색 두건을 쓴 사람. 뒷열에서 회색 화살을 쏜다. 손등에 사냥개와 같은 낙인이 있다.' },
    oldbear: { art: 'bear', name: '늙은 이끼 곰', lv: 5, hp: 60, ac: 13, atk: 6, dmg: '2d6+3', xp: 40, gold: [3, 10], elite: true, big: true, multi: 2,
      skills: [{ name: '짓누르기', p: 0.3, dmg: '2d8+4', hit: -1, onHit: { prone: 1 } }],
      drops: [{ item: '이끼 왕관', p: 1, once: 'got_moss_crown' }],
      desc: '등에 숲이 자란 늙은 곰. 달빛 별꽃을 품고 잠든다. 한 번에 두 번 할퀸다.' },
    chief: { art: 'acolyte', name: '추종자 우두머리', people: true, lv: 5, hp: 40, ac: 14, atk: 6, dmg: '1d8+3', xp: 35, gold: [25, 40], elite: true, row: 'back', ranged: true, init: 2,
      skills: [
        { name: '사냥개 부르기', p: 0.35, summon: 'hound', once: true },
        { name: '낙인의 속삭임', p: 0.3, ranged: true, dmg: '2d6', dtype: 'psychic', onHit: { weak: 2 } }
      ],
      drops: [{ item: '사냥꾼의 휘장', p: 1, once: 'got_insignia' }],
      desc: '이마 전체에 낙인이 새겨진 늙은 사내. 회색 장부를 허리에 찼다. 그 속삭임은 마음을 꺾는다.' },
    // 사냥터 우두머리: 옛 수로 묘실의 기사단장. 이기면 긴 휴식을 할 때까지 잠든다 (되풀이해 싸울 수 있다)
    captain: { art: 'captain', name: '가라앉은 기사단장', where: '옛 수로의 묘실', people: true, lv: 7, hp: 160, ac: 16, atk: 9, dmg: '2d8+6', xp: 90, gold: [50, 80], boss: true, big: true, multi: 2, init: 1,
      resist: ['cold', 'poison'], vuln: ['radiant'],
      skills: [
        { name: '녹슨 맹세의 휩쓸기', p: 0.3, dmg: '2d8+5', hit: -2, sweep: true },
        { name: '물의 사슬', p: 0.2, ranged: true, dmg: '1d8', dtype: 'cold', onHit: { restrain: 2 } },
        { name: '가라앉은 맹세', p: 0.15, debuff: { atk: -2, turns: 2 }, text: '기사단장이 물속에서 맹세를 읊는다. 차가운 물이 발목을 붙든다! (2턴 동안 모두 명중 -2)' },
        { name: '가라앉은 자들을 부른다', p: 0.25, summon: 'leech', once: true }
      ],
      drops: [{ item: '맹세기사의 흉갑', p: 0.2, pity: 6, uniq: true }, { item: '{oath}', p: 0.15, pity: 8, uniq: true }, { item: '푸른 물약', p: 0.5 }, { item: '은빛 물약', p: 0.6 }],
      desc: '수로 가장 깊은 묘실을 지키는 엘레우스의 기사단장. 녹슨 투구 속에서 금빛 불꽃이 탄다. 한 번에 두 번 베고, 동료가 둘 이상이면 한 라운드에 두 번 움직인다. 냉기와 독에 강하며 별빛에 약하다.' },
    alpha: { art: 'alpha', name: '잿빛 송곳니', lv: 6, hp: 90, ac: 15, atk: 7, dmg: '2d6+4', xp: 80, gold: [40, 60], boss: true, big: true, init: 3, multi: 2,
      skills: [
        { name: '포효', p: 0.2, debuff: { atk: -2, turns: 2 }, text: '잿빛 송곳니가 포효한다. 다리가 굳는다! (2턴 동안 모두 명중 -2)' },
        { name: '꼬리 휩쓸기', p: 0.25, dmg: '2d6+2', sweep: true, needFront: 2 },
        { name: '돌진', p: 0.25, dmg: '2d8+4', hit: -1, onHit: { prone: 1 }, reach: true }
      ],
      desc: '이마에 회색 왕관 같은 낙인을 단 사냥개 무리의 우두머리. 다른 놈들보다 두 배는 크다. 한 번에 두 번 물고, 돌진은 뒷열까지 닿는다.' }
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
      rest: [{ if: { flag: 'done_n1' }, t: '노파의 오두막에서 쉰다' }, { t: '마을 어귀의 빈 헛간에서 쉰다' }], restFree: true,
      shop: { name: '빗속의 행상인', items: ['은빛 물약', '푸른 물약', '야영 물자', '기름 병', '불꽃 병', '{fine}', '가죽 갑옷', '사슬 갑옷', '가죽 두건', '철 투구', '가죽 장갑', '여행자의 장화', '여행자의 행운 부적'] },
      actions: [
        { label: '등불이 켜진 오두막의 문을 두드린다', event: 'n1', if: { not: 'done_n1' }, star: true },
        { label: '노파의 부탁을 듣는다', event: 'q_wolves_start', if: { flag: 'done_n1', not: 'q_wolves' } },
        { label: '노파에게 늑대 일을 알린다', event: 'q_wolves_end', if: { flag: 'q_wolves', not: 'q_wolves_done', or: [{ min: { kill_wolf: 5 } }, { flag: 'wolves_solved' }] } },
        { label: '노파의 눈에 달빛 별꽃의 이슬을 떨어뜨린다', event: 'crone_cure', if: { flag: 'done_n1', or: [{ item: '달빛 별꽃' }, { item: '달빛 별꽃의 이슬' }] }, star: true },
        { label: '회색 낙인 조각을 맞춰 본다', event: 'study_mark', if: { not: 'mark_known', count: { '회색 낙인 조각': 3 } } }
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
      ambush: 0.2, field: { high: 'both', cover: true },
      explore: ['ex_glint', 'ex_herb'],
      actions: [
        { label: '늑대들의 굴을 찾아간다', event: 'wolves_den', if: { flag: 'q_wolves', not: ['q_wolves_done', 'wolves_solved'] } }
      ],
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
      ambush: 0.3, field: { cover: true },
      explore: ['ex_trap', 'ex_web', 'ex_herb'],
      actions: [
        { label: '거미줄 너머에서 들려오는 비명을 따라간다', event: 'c_sena', if: { not: 'done_c_sena' }, star: true },
        { label: '이끼 곰의 둥지에서 달빛 별꽃을 찾는다 (권장 레벨 4)', event: 'moss_nest', if: { flag: 'q_moonflower', not: 'moonflower_got' }, star: true }
      ],
      links: [{ to: 'village' }, { to: 'slope' }]
    },
    stairs: {
      art: { sky: 'rain', bg: 'stairs', fx: ['rain'] },
      name: '천 개의 계단', x: 190, y: 105, lv: '2~3',
      desc: [
        { if: { not: 'done_n10' }, t: '고대의 거인들이 산을 깎아 만든 천 개의 계단. 이끼 낀 룬 위로 그치지 않는 비가 흐른다.' },
        { if: { flag: 'done_n10' }, t: '고대의 거인들이 산을 깎아 만든 천 개의 계단. 비가 그친 뒤, 이끼 낀 룬이 햇빛 아래 말라 간다.' },
        '잿빛 사냥개들이 계단을 오르내리며 냄새를 맡는다.'
      ],
      onEnter: [{ event: 'n2', if: { not: 'done_n2' } }],
      encounters: [{ w: 3, e: ['scout'] }, { w: 2, e: ['scout', 'scout'] }, { w: 2, e: ['hound'] }, { w: 1, e: ['wolf', 'bats'] }],
      ambush: 0.25, field: { high: 'both' },
      explore: ['ex_rune'],
      actions: [
        { label: '무너진 초소에서 들려오는 사냥개의 울음을 따라간다', event: 'c_bran', if: { flag: 'done_n2', not: 'done_c_bran' }, star: true }
      ],
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
      ambush: 0.25, field: { water: true },
      explore: ['ex_bones', 'ex_coins', 'ex_depths'],
      actions: [
        { label: '가장 깊은 묘실에서 가라앉은 기사단장과 싸운다 (권장 레벨 6 · 되풀이할 수 있다)', event: 'captain_lair', if: { not: 'captain_slept' } }
      ],
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
      rest: '오르덴 곁 모닥불에서 야영한다', restIf: { flag: 'done_n4' },
      actions: [
        { label: '오르덴에게 기사의 반지를 건넨다', event: 'q_ring_end', if: { flag: 'done_n4', item: '기사의 반지' } },
        { label: '회색 낙인 조각을 맞춰 본다', event: 'study_mark', if: { flag: 'done_n4', not: 'mark_known', count: { '회색 낙인 조각': 3 } } }
      ],
      links: [{ to: 'stairs' }, { to: 'aqueduct' }, { to: 'tomb' }]
    },
    tomb: {
      art: [
        { if: { flag: 'done_n5' }, sky: 'star', bg: 'tomb', fx: ['motes'] },
        { sky: 'star', bg: 'tomb', props: ['relic'], fx: ['motes'] }
      ],
      name: '별의 무덤', x: 150, y: 25, lv: '3~4', if: { flag: 'done_n4' }, field: { high: 'pc' },
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
      ambush: 0.3, field: { high: 'foe', cover: true },
      explore: ['ex_corpse', 'ex_rune'],
      actions: [
        { label: '회랑 깊은 곳으로 잿빛 송곳니를 쫓는다 (권장 레벨 5)', event: 'n7', if: { not: 'done_n7' }, star: true },
        { label: '추종자 우두머리의 은신처를 찾는다 (권장 레벨 5)', event: 'cult_den', if: { flag: 'q_ledger', not: ['ledger_got', 'bran_left'] }, star: true }
      ],
      links: [{ to: 'tomb' }]
    }
  },

  // 화면 위에 보이는 지금의 목표 (위에서부터 처음 맞는 것)
  goals: [
    { if: { not: 'done_n3' }, t: '북쪽 울음의 관문으로 가라. 안개 비탈을 지나 천 개의 계단을 오르면 닿는다. 마을의 노파가 무언가 알고 있을지도 모른다.' },
    { if: { not: 'done_n5' }, t: '관문 안, 별의 무덤에서 별이 남긴 것을 찾아라. (권장 레벨 3)' },
    { if: { not: 'done_n7' }, t: '무너지는 회랑 깊은 곳으로 잿빛 송곳니를 쫓아라. 회랑의 사냥개들과 싸우며 힘을 길러라. (권장 레벨 5)' },
    { t: '제1장 완료. 자유롭게 사냥하며 힘을 기를 수 있다. 제2장 「회색 사냥꾼」은 준비 중이다.' }
  ],

  quests: [
    { name: '노파의 부탁', if: { flag: 'q_wolves', not: ['q_wolves_done', 'wolves_solved'] }, t: '굶주린 늑대를 다섯 마리 쫓거나 (지금까지 {#kill_wolf}마리), 안개 비탈의 늑대 굴을 찾아 무리를 떠나보낸다 → 마을의 노파에게' },
    { name: '노파의 부탁', if: { flag: ['q_wolves', 'wolves_solved'], not: 'q_wolves_done' }, t: '늑대들은 비탈을 떠났다 → 마을의 노파에게 알린다' },
    { name: '달빛 별꽃', if: { flag: 'q_moonflower', not: 'crone_cured' }, t: '검은 소나무 숲 가장 깊은 곳, 이끼 곰의 둥지에서 달빛 별꽃을 얻어 노파에게 (세나의 부탁)' },
    { name: '회색 장부', if: { flag: 'q_ledger', not: ['ledger_got', 'bran_left'] }, t: '무너지는 회랑에 숨은 추종자 우두머리에게서 회색 장부를 빼앗는다 (브란의 부탁)' },
    { name: '회색 장부', if: { item: '회색 장부', not: ['ledger_burned', 'ledger_kept', 'bran_left'] }, t: '장부를 손에 넣었다. 브란과 함께 관문에서 야영하면 어떻게 할지 정한다' },
    { name: '가라앉은 맹세', if: { flag: 'found_bones', not: ['q_ring_done', 'got_ring'] }, t: '옛 수로 깊은 곳의 물에 잠긴 기사에게서 반지를 찾는다. 싸우거나, 엘레우스 맹세의 구절로 잠재운다 (권장 레벨 5)' },
    { name: '가라앉은 맹세', if: { item: '기사의 반지' }, t: '기사의 반지를 관문의 오르덴에게 가져간다' },
    { name: '숲의 비명', if: { flag: 'done_n1', not: 'done_c_sena' }, t: '노파의 손녀 세나가 검은 소나무 숲에서 돌아오지 않았다' },
    { name: '초소의 울음', if: { flag: 'done_n2', not: 'done_c_bran' }, t: '천 개의 계단 옆 무너진 초소에서 사냥개들이 누군가를 몰아붙이고 있다' },
    { name: '회색 낙인', if: { not: 'mark_known' }, t: '회색 낙인 조각 {@회색 낙인 조각}/3을 모아 마을이나 관문에서 맞춰 보면 낙인의 비밀을 알 수 있다. 비밀을 알면 결전에서 낙인을 부수기 쉬워진다' },
    { name: '회색 낙인', if: { flag: 'bran_met', not: ['mark_known', 'bran_left', 'done_camp_bran1'] }, t: '낙인을 지져 낸 브란이라면 그 비밀을 알지도 모른다 (관문에서 야영할 때)' }
  ],

  counterNames: { bond: '오르덴과의 유대', ap_sena: '세나의 호감', ap_bran: '브란의 호감' },

  // 세트: 그대가 같은 세트를 n부위 이상 입으면 그 단계의 효과가 모두 더해진다
  sets: {
    wolfhide: { name: '안개 늑대가죽', where: '세 부위 모두 굶주린 늑대가 지닌다 (안개 비탈·검은 소나무 숲·천 개의 계단)',
      pieces: ['늑대가죽 두건', '늑대가죽 장갑', '늑대가죽 장화'],
      bonus: [{ n: 2, fx: { init: 2 } }, { n: 3, fx: { hit: 1, hp: 6 } }] },
    oathknight: { name: '엘레우스 맹세기사', where: '옛 수로와 무너지는 회랑. 흉갑은 가라앉은 기사단장만 지닌다',
      pieces: ['맹세기사의 투구', '맹세기사의 흉갑', '맹세기사의 건틀릿', '맹세기사의 각반', '맹세기사의 별 인장'],
      bonus: [{ n: 2, fx: { hp: 8 } }, { n: 3, fx: { ac: 1, save: 1 } }, { n: 4, fx: { hit: 1, dmg: 1 } }, { n: 5, fx: { dmg: 2, smite: '1d6', death: true, resist: ['psychic'] } }] }
  },
  // 긴 휴식을 하면 꺼지는 플래그 (되풀이해 싸우는 우두머리가 다시 일어난다)
  restClears: ['captain_slept'],

  // 야영지 대화: 쉼터에서 긴 휴식을 하면, 조건이 맞는 첫 이야기가 모닥불 곁에서 시작된다 (한 번씩)
  camp: ['camp_sena2', 'camp_bran2', 'camp_orden2', 'camp_sena1', 'camp_bran1', 'camp_orden1', 'camp_argue'],

  downText: '시야가 붉게 물들고 무릎이 꺾였다. 차가운 돌바닥이 뺨에 닿는 순간 — 품속에서 희미한 별빛이 번져 나와 그대를 감쌌다. 아직은 아니다. 별은 그대를 놓아주지 않았다.',

  // 사냥터에서 쓰러졌을 때: 가장 가까운 쉼터에서 깨어난다
  knockout: {
    text: '눈을 떴을 때, 그대는 {place}에 누워 있었다. 누군가 그대를 끌고 온 것이다.',
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
        '“별 냄새가 나는구나.” 노파가 갈라진 목소리로 말했다. “사흘 전부터 잿빛 사냥개들이 다시 울기 시작했다. 사냥꾼이 돌아온 게야. 그 관문으로 올라간 자는 아무도 내려오지 못했다.”',
        '벽에는 빛바랜 양피지 지도 한 장이 걸려 있고, 기울어진 처마 사이로 빗물이 새어 든다.',
        { if: { not: 'sena_met' }, t: '“내 손녀 세나가 검은 소나무 숲으로 별꽃을 캐러 갔는데, 사흘째 소식이 없구나.” 노파가 혼잣말처럼 중얼거렸다.' },
        { if: { party: 'sena' }, t: '“할머니!” 세나가 노파에게 달려가 안겼다. 노파의 먼 눈이 처음으로 웃었다.' }
      ],
      choices: [
        { id: 1, skill: '설득', insp: 'song', label: '노파 곁에 앉아 관문의 옛이야기를 청한다', stat: '매력', dc: 10, approve: { sena: 1 },
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

        { id: 2, skill: '역사', insp: 'lore', label: '벽에 걸린 낡은 지도를 해독한다', stat: '지혜', dc: 12, approve: { bran: 1 },
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

        { id: 3, skill: '운동', insp: 'mercy', label: '무너져 가는 오두막을 손봐 준다', stat: '힘', dc: 11, approve: { sena: 2 },
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
        { id: 1, insp: 'mercy', label: '부탁을 들어준다', roll: false, approve: { sena: 1 },
          then: { text: ['노파가 고개를 끄덕였다. “조심하거라. 그놈들은 무리로 다닌다.”'], fx: { set: ['q_wolves'] },
            log: '노파의 부탁을 받았다: 안개 비탈의 굶주린 늑대 5마리.', next: 'map' } },
        { id: 2, label: '지금은 어렵다고 말한다', roll: false, approve: { sena: -1 },
          then: { text: ['“그래, 그래. 별의 아이에게는 더 큰 일이 있겠지.” 노파는 다시 불 쪽으로 몸을 돌렸다.'], next: 'map' } }
      ]
    },

    q_wolves_end: {
      art: { sky: 'cave', bg: 'hut', actors: [{ k: 'hero', x: 0.36 }, { k: 'crone', x: 0.62, face: -1 }] },
      title: '노파의 부탁',
      clock: '마지막 마을',
      text: [
        { if: { nor: [{ flag: 'wolves_solved' }] }, t: '늑대 다섯 마리를 쫓았다는 말에, 노파는 한참을 말없이 그대의 손을 쓰다듬었다.' },
        { if: { flag: 'wolves_fed' }, t: '먹을 것을 나눠 주고 늑대들을 떠나보냈다는 말에, 노파는 한참을 웃었다. “별의 아이는 마음도 별 같구나.”' },
        { if: { flag: 'wolves_solved', not: 'wolves_fed' }, t: '늑대 무리가 비탈을 떠났다는 말에, 노파는 한참을 말없이 그대의 손을 쓰다듬었다.' },
        '“고맙구나.” 노파는 마루 밑에서 오래된 가죽 주머니를 꺼냈다.',
        { if: { party: 'sena' }, t: '세나가 할머니의 손을 꼭 잡았다. “이제 우물가에 늑대는 안 올 거예요.”' }
      ],
      choices: [
        { id: 1, label: '주머니를 받는다', roll: false,
          then: {
            text: [
              '주머니 안에는 녹슨 동전 서른 닢과 은빛 병 두 개가 들어 있었다.',
              '“그리고 이건 덤이다. 엘레우스의 기사들은 ‘맹세를 기억하는 자’에게만 문을 연다고 했지. 기억해 두거라.”'
            ],
            fx: { set: ['q_wolves_done', 'lore'], gold: 30, items: ['은빛 물약', '은빛 물약'], xp: 15 },
            fxIf: [{ if: { flag: 'wolves_fed' }, fx: { xp: 5 } }],
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
        { id: 1, skill: '비전', insp: 'lore', label: '낙인의 룬을 읽어 낸다', stat: '지혜', dc: 12, approve: { bran: 1 },
          adv: [{ if: { flag: 'lore' }, why: '노파의 전승' }, { if: { party: 'bran' }, why: '브란의 지식' }],
          note: '성공하면 낙인의 비밀을 안다',
          success: {
            text: [
              '‘묶는 자, 회색 사냥꾼.’',
              '이 낙인은 짐승의 뜻을 빼앗아 사냥꾼의 뜻을 심는 사슬이었다. 사슬이라면 — 끊을 수도 있다.'
            ],
            fx: { set: ['mark_seen', 'mark_known'], drop: ['회색 낙인 조각', '회색 낙인 조각', '회색 낙인 조각'], xp: 10 },
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
        { id: 1, stat: 'class', dc: 13, approve: { bran: -1 },
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

        { id: 2, skill: '은신', insp: 'sly', label: '바위 뒤에 숨어 놈이 지나가기를 기다린다', stat: '민첩', dc: 12, approve: { bran: 1 },
          dis: [{ if: { flag: 'alerted' }, why: '놈이 경계 중' }],
          note: '성공하면 놈의 정체를 살핀다',
          success: {
            text: [
              '그대는 숨을 죽이고 빗소리 속에 몸을 묻었다.',
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

        { id: 4, label: '바람을 등지고 냄새를 숨긴 채 지나간다', stat: '지혜', skill: '생존', dc: 11, insp: 'wild', approve: { sena: 1 },
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

        { id: 2, skill: '공연', insp: 'song', label: '꿈속에서 들은 별의 노래를 소리 내어 부른다', stat: '매력', dc: 13, approve: { sena: 1 },
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

        { id: 3, skill: '곡예', insp: 'brave', label: '창을 든 기사와 겨루어 실력을 증명하겠다고 나선다', stat: '민첩', dc: 14,
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

        { id: 5, label: '엘레우스 왕가의 마지막 사자라고 둘러댄다', stat: '매력', skill: '기만', dc: 15, insp: 'sly', approve: { sena: -1, bran: 1 },
          note: '어렵다. 들키면 기사가 그대를 의심한다',
          success: {
            text: [
              '“나는 엘레우스 왕가의 마지막 사자다. 왕께서 별의 무덤을 살피라 명하셨다.”',
              '오르덴의 금빛 눈이 오래도록 그대를 훑었다. 그리고 — 창끝이 천천히 내려갔다. “엘레우스의 왕가는 그 밤에 끊긴 줄 알았다만… 그 눈빛은 거짓을 말하는 자의 것이 아니로군.” 기사는 문 앞에 모닥불을 피웠다.'
            ],
            fx: { add: { bond: 1 }, unset: ['wary'], xp: 4 },
            log: '왕가의 사자라고 둘러대 오르덴을 믿게 했다.', next: 'map' },
          fail: {
            text: [
              '“엘레우스의 마지막 왕은 그 밤, 내 눈앞에서 쓰러졌다.” 오르덴의 목소리가 얼음처럼 식었다. “그 왕가의 사자라고?”',
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
              '“그대는 내 형제를 물에서 건져 주었다. 이 빚은 창으로 갚겠다.” 그는 갑주 안쪽에서 은빛 병과 푸른 병을 하나씩 꺼내 그대의 손에 쥐여 주었다. “기사단이 마지막까지 아껴 두던 약이다.”'
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
        { id: 1, skill: '비전', insp: 'lore', label: '문턱의 룬을 덫으로 바꿔 무리를 한꺼번에 노린다', stat: '지혜', dc: 13, approve: { bran: 1 },
          dis: [{ if: { flag: 'alerted' }, why: '놈들이 경계 중' }],
          note: '성공하면 남는 놈이 적다',
          success: {
            text: [
              { _: '그대가 {relic:으로} 문턱을 내리치자, 바닥의 룬들이 일제히 뒤집혔다. 천 년 동안 문을 지켜 온 고대의 마법이 마침내 이빨을 드러낸 것이다.',
                bard: '그대가 별빛 류트의 현을 힘껏 튕기자, 그 울림을 따라 바닥의 룬들이 일제히 뒤집혔다. 천 년 동안 문을 지켜 온 고대의 마법이 마침내 이빨을 드러낸 것이다.' },
              '선두의 사냥개 다섯이 룬을 밟는 순간, 별빛 기둥이 솟구쳐 놈들을 집어삼켰다. 그러나 빛을 뚫고 나온 놈들이 달려든다!'
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
            fx: { xp: 8, set: ['alpha_burned'] },
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
              '문턱 앞에 잿빛 시체가 쌓여 갔다. 그러나 남은 놈들이 기사의 창을 피해 그대에게 달려든다!'
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
              '눈을 감고 있던 몇 마리만이 빛 속을 뚫고 달려든다!'
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
              '대부분이 꼬리를 말고 물러났다. 남은 놈들만이 이빨을 드러내며 달려든다!'
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
        { if: { flag: 'alpha_burned' }, t: '별빛에 그을린 뒷다리를 끌면서도, 놈의 기세는 조금도 꺾이지 않았다.' },
        '“결계의 방으로!” 오르덴이 외쳤다. “일곱 기둥 안에 가두면 놈도 빠져나가지 못한다!”',
        '짐승이 도약했다. 그대는 달렸다. 등 뒤로 뜨거운 숨결이 닿을 듯 가까웠고, 오래된 회랑의 천장이 진동에 흔들리며 돌가루를 흩뿌렸다.'
      ],
      choices: [
        { id: 1, stat: 'class', dc: 14, approve: { sena: -1 },
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

        { id: 3, skill: '비전', insp: 'lore', label: '우두머리 이마의 회색 낙인을 노려 별빛을 쏜다', stat: '지혜', dc: 13, approve: { bran: 2 },
          requires: { flag: 'mark_seen' }, reqText: '회색 낙인을 본 적이 있다',
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
        { if: { any: ['alpha_hurt', 'alpha_burned'] }, t: '놈은 다친 뒷다리를 여전히 끌고 있다.' },
        { if: { flag: 'mark_cracked' }, t: '금 간 낙인 아래에서, 놈의 눈빛이 이따금 흔들린다.' },
        { if: { flag: 'hunter_saw' }, t: '어딘가 아주 먼 곳에서, 누군가가 이쪽을 지켜보고 있다는 느낌이 가시지 않는다.' },
        { if: { party: 'sena' }, t: '세나가 무너진 기둥 위로 뛰어올라 시위를 당겼다. “위에서 엄호할게요.”' },
        { if: { party: 'bran' }, t: '브란이 우두머리의 이마를 노려보았다. “저 왕관 같은 낙인은 사냥꾼이 직접 새긴 거요. 끊을 수 있다면, 별빛을 쥔 그대뿐이오.”' },
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

        { id: 3, skill: '곡예', insp: 'mercy', label: '몸을 굴려 피하며 새끼를 어미에게서 떼어 놓는다', stat: '민첩', dc: 12, approve: { sena: 2, bran: 1 },
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
      place: '울음의 관문',
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
        { if: { nor: [{ flag: 'orden_cracked' }, { flag: 'oath_question' }] }, t: '오르덴이 투구를 벗었다. 천 년 만에 햇빛을 받은 그의 얼굴은, 생각보다 훨씬 젊었다.' },
        { if: { flag: 'oath_question', not: 'orden_cracked' }, t: '오르덴이 다시 투구를 벗었다. 천 년 만에 처음으로, 햇빛이 그 얼굴에 닿았다.' },
        '“하늘이… 울음을 그쳤다.” 기사의 목소리가 떨렸다. “아스텔께서 그대를 택하셨다는 뜻이다.”'
      ],
      choices: [
        { id: 1, skill: '비전', insp: 'lore', label: '옅어지는 새벽하늘에 남은 별자리를 읽는다', stat: '지혜', dc: 12,
          note: '성공하면 다음 여정의 길을 안다',
          success: {
            text: [
              '옅어지는 하늘에 여섯 개의 별이 희미하게 남아 있었다. 그리고 그 사이의 빈자리 — 그대의 눈은 그 자리에서 실처럼 가느다란 빛줄기들을 보았다.',
              '아스텔은 완전히 죽은 것이 아니었다. 떨어지던 밤, 그 빛은 여러 조각으로 부서져 대륙 곳곳에 흩어졌다. 그리고 첫 번째 조각이 가리키는 곳은 동쪽 — 회색 사냥꾼의 영토 너머, 침묵의 숲이었다.'
            ],
            fx: { set: ['star_map'], xp: 4 },
            log: '새벽 별자리에서 첫 번째 별 조각이 동쪽 침묵의 숲에 있음을 읽어 냈다.', next: 'n10' },
          fail: {
            text: [
              '해가 너무 빨리 떠올랐다. 별들은 그대가 읽어 내기도 전에 새벽빛 속으로 녹아 사라졌다.',
              '그러나 손에 쥔 {relic:이} 희미하게 떨렸다. 그 떨림은 분명히 한 방향을 가리키고 있었다 — 동쪽.'
            ],
            log: '별자리를 읽지 못했다. 그래도 {relic:이} 동쪽을 가리켰다.', next: 'n10' } },

        { id: 2, skill: '공연', insp: 'mercy', label: '오르덴과 함께 돌이 된 기사들의 넋을 기린다', stat: '매력', dc: 10, approve: { sena: 1 },
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
      place: '울음의 관문',
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
            text: ['— 제1장 「비 내리는 관문」 끝 —', '{name}의 이야기는 제2장 「회색 사냥꾼」으로 이어진다. 그때까지 세상은 열려 있다.'],
            log: '제1장 「비 내리는 관문」을 마쳤다.', next: 'end' } }
      ]
    },

    // ───────────────────────── 동료: 세나 (검은 소나무 숲)
    c_sena: {
      art: { sky: 'rain', bg: 'forest', props: ['web'], actors: [{ k: 'hero', x: 0.22 }, { k: 'sena', x: 0.6, face: -1 }, { k: 'spider', x: 0.83, face: -1 }], fx: ['rain'] },
      title: '거미줄 속의 약초꾼',
      clock: '동료 · 세나',
      text: [
        '검은 소나무 사이로 날카로운 비명이 울렸다.',
        '거대한 거미줄 한가운데, 활을 등에 멘 젊은 여자가 반쯤 감긴 채 버둥거리고 있었다. 허리춤의 약초 바구니에서 은빛 잎사귀가 쏟아져 빗물에 떠내려간다.',
        '“거기 누구 있어요? 움직이지 말고… 위를 봐요!”',
        '머리 위 나뭇가지에서 검은 다리 여덟 개가 천천히 내려오고 있었다. 하나가 아니었다.'
      ],
      choices: [
        { id: 1, skill: '운동', insp: 'brave', label: '거미줄을 맨손으로 찢어 그녀부터 끌어낸다', stat: '힘', dc: 12,
          note: '성공하면 거미가 내려오기 전에 그녀가 활을 쥔다 (적이 기습당한다)',
          success: {
            text: ['끈적한 줄이 손바닥에 들러붙었지만, 그대는 이를 악물고 거미줄을 통째로 뜯어냈다. 여자가 흙바닥에 굴러떨어지며 등의 활을 잡아챘다.', '“고마워요. 이제 내 차례예요!” 내려오던 거미들이 허공에서 멈칫했다.'],
            fx: { set: ['sena_met'], add: { ap_sena: 1 }, xp: 3 }, battle: SENA_FIGHT(true), log: '거미줄을 찢어 약초꾼을 구해 냈다.', next: 'map' },
          fail: {
            text: ['줄은 생각보다 질겼다. 그대의 팔까지 거미줄에 감기는 사이, 거미들이 바닥에 내려앉았다.', '여자가 버둥거리며 한 손을 빼내 활을 쥐었다. “같이 싸워요. 둘이 엉켜 죽을 순 없잖아요!”'],
            fx: { set: ['sena_met'], hp: -2 }, battle: SENA_FIGHT(false), log: '거미줄에 같이 엉켰다 (HP -2).', next: 'map' } },
        { id: 2, skill: '생존', insp: 'wild', label: '거미줄을 받치는 굵은 줄을 찾아 끊어 거미를 떨어뜨린다', stat: '지혜', dc: 12,
          note: '성공하면 거미 한 마리가 떨어져 죽는다',
          success: {
            text: ['그대는 거미줄이 어느 가지에 매달려 있는지 읽었다. 가장 굵은 줄을 끊자, 그물 전체가 출렁이며 내려오던 거미 한 마리를 바닥에 내리꽂았다.', '여자가 풀려난 손으로 활을 당겼다. 남은 한 마리가 성난 소리를 내며 달려든다!'],
            fx: { set: ['sena_met'], xp: 3 }, battle: SENA_FIGHT(true, ['spider']), log: '굵은 줄을 끊어 거미 한 마리를 떨어뜨렸다.', next: 'map' },
          fail: {
            text: ['엉뚱한 줄을 끊었다. 거미줄이 출렁이자 거미들이 오히려 서둘러 내려왔다.'],
            fx: { set: ['sena_met'] }, battle: SENA_FIGHT(false), log: '거미줄을 잘못 건드렸다.', next: 'map' } },
        { id: 3, skill: '은신', insp: 'sly', label: '나무 뒤로 돌아 거미의 등 뒤를 노린다', stat: '민첩', dc: 13,
          note: '성공하면 적이 기습당한다',
          success: {
            text: ['그대는 빗소리에 발소리를 묻고 소나무 뒤로 돌아갔다. 거미들은 버둥거리는 먹잇감만 보고 있었다.'],
            fx: { set: ['sena_met'], xp: 3 }, battle: SENA_FIGHT(true), log: '거미의 등 뒤를 잡았다.', next: 'map' },
          fail: {
            text: ['젖은 솔잎이 발밑에서 미끄러졌다. 거미 한 마리가 그대 쪽으로 몸을 틀었다.'],
            fx: { set: ['sena_met'], hp: -2 }, battle: SENA_FIGHT(false), log: '미끄러져 들켰다 (HP -2).', next: 'map' } }
      ]
    },

    // ───────────────────────── 동료: 브란 (천 개의 계단)
    c_bran: {
      art: { sky: 'rain', bg: 'stairs', actors: [{ k: 'hero', x: 0.2 }, { k: 'bran', x: 0.48, face: -1 }, { k: 'scout', x: 0.7, face: -1 }, { k: 'scout', x: 0.86, face: -1 }], fx: ['rain'] },
      title: '낙인을 지진 자',
      clock: '동료 · 브란',
      text: [
        '계단 옆 무너진 초소에서 사냥개들의 울음이 터져 나왔다.',
        '회색 두건을 쓴 사내 하나가 벽에 등을 붙인 채, 끝이 그을린 지팡이를 휘두르고 있었다. 지팡이 끝에서 튄 불씨가 빗속에서 치익 소리를 내며 꺼진다. 사냥개들이 그를 몰아붙이고 있었다.',
        '두건 아래로 드러난 손등에는 낙인이 없었다. 대신, 낙인이 있던 자리가 시뻘겋게 지져져 있었다.',
        '“사냥꾼의 개들이 배신자를 쫓는 중이오.” 사내가 이를 악물었다. “도와주든 지나가든 마음대로 하시오. 다만 빨리 정해 주면 고맙겠군.”'
      ],
      choices: [
        { id: 1, insp: 'brave', label: '그의 곁으로 뛰어들어 함께 싸운다', roll: false, note: '전투',
          then: {
            text: ['그대는 사내와 등을 맞대고 섰다. “좋소. 불씨가 젖기 전에 끝냅시다.”'],
            fx: { set: ['bran_met'], add: { ap_bran: 1 } }, battle: BRAN_FIGHT(false), log: '회색 두건의 사내 곁에서 싸웠다.', next: 'map' } },
        { id: 2, skill: '통찰', insp: 'mercy', label: '손등의 화상을 살펴, 정말 낙인을 끊은 자인지 가늠한다', stat: '지혜', dc: 12,
          note: '성공하면 그를 믿고 함께 싸운다',
          success: {
            text: ['스스로 지진 화상이었다. 그것도 여러 번. 낙인이 다시 살아날 때마다 불로 지졌으리라.', '“믿겠소.” 그대의 말에 사내의 눈빛이 달라졌다. 지팡이 끝에 다시 불씨가 피어올랐다.'],
            fx: { set: ['bran_met', 'bran_trust'], add: { ap_bran: 2 }, xp: 3 }, battle: BRAN_FIGHT(false), log: '사내의 화상이 스스로 지진 것임을 알아보았다.', next: 'map' },
          fail: {
            text: ['그대가 망설이는 사이, 사냥개 한 마리가 사내의 다리를 물고 늘어졌다.', '“의심은 나중에 하시오!” 사내가 피를 흘리며 외쳤다.'],
            fx: { set: ['bran_met'], add: { ap_bran: -1 } }, battle: BRAN_FIGHT(false), log: '망설이는 사이 사내가 다쳤다.', next: 'map' } },
        { id: 3, skill: '은신', insp: 'sly', label: '초소 지붕으로 돌아 올라가 사냥개들을 위에서 덮친다', stat: '민첩', dc: 13,
          note: '성공하면 적이 기습당한다',
          success: {
            text: ['그대는 무너진 지붕을 타고 올라가, 빗소리에 숨어 사냥개들의 머리 위에 섰다.'],
            fx: { set: ['bran_met'], xp: 3 }, battle: BRAN_FIGHT(true), log: '초소 지붕 위에서 사냥개들을 덮쳤다.', next: 'map' },
          fail: {
            text: ['젖은 기와가 미끄러졌다. 그대는 사냥개들 한가운데로 떨어졌다.'],
            fx: { set: ['bran_met'], hp: -3 }, battle: BRAN_FIGHT(false), log: '지붕에서 떨어졌다 (HP -3).', next: 'map' } }
      ]
    },

    // ───────────────────────── 노파의 부탁: 여러 가지 해결
    wolves_den: {
      art: { sky: 'rain', bg: 'slope', actors: [{ k: 'hero', x: 0.24 }, { k: 'wolf', x: 0.6, face: -1 }, { k: 'pup', x: 0.7, face: -1 }, { k: 'wolf', x: 0.8, face: -1 }], fx: ['fog', 'rain'] },
      title: '늑대 굴',
      clock: '노파의 부탁',
      text: [
        '비탈 아래 바위틈에서 늑대들의 굴을 찾았다. 갈비뼈가 드러난 어미 늑대들이 새끼들 앞을 막아서며 이를 드러냈다.',
        '놈들도 굶주렸을 뿐이다. 잿빛 사냥개들이 숲의 사냥감을 모조리 휩쓸어 간 뒤로, 늑대들에게는 마을의 닭장 말고는 먹을 것이 없었다.',
        { if: { party: 'sena' }, t: '“사냥개들이 숲을 비워 버린 거예요.” 세나가 활을 내렸다. “얘들 잘못만은 아니에요.”' },
        { if: { party: 'bran' }, t: '브란이 지팡이 끝에 불씨를 피웠다. “짐승은 불을 무서워하지. 굴 입구만 태우면 다른 골짜기로 옮겨 갈 거요.”' }
      ],
      choices: [
        { id: 1, insp: 'brave', label: '무리를 쓸어 낸다', roll: false, note: '전투', approve: { sena: -1 },
          then: {
            text: ['그대는 무기를 뽑았다. 어미들이 한꺼번에 달려든다!'],
            battle: {
              enemies: ['wolf', 'wolf', 'wolf'], art: { sky: 'rain', bg: 'slope', fx: ['fog', 'rain'] },
              win: { text: ['마지막 늑대가 쓰러지자, 굴 안의 새끼들이 흩어져 달아났다. 이제 마을로 내려올 늑대는 없다.'], fx: { set: ['wolves_solved'] }, log: '늑대 굴의 무리를 쓸어 냈다.', next: 'map' },
              lose: { text: ['늑대들의 이빨에 쓰러졌다. 정신을 차렸을 때 굴은 비어 있었다. 피 냄새에 놀란 무리가 더 깊은 골짜기로 옮겨 간 것이다.'], fx: { set: ['wolves_solved'] }, log: '늑대들에게 쓰러졌지만, 무리는 비탈을 떠났다.', next: 'map' } },
            next: 'map' } },
        { id: 2, label: '굴 입구에 불을 놓아 다른 골짜기로 몰아낸다', roll: false, approve: { bran: 1 },
          requires: { or: [{ item: '불꽃 병' }, { party: 'bran' }] }, reqText: '불꽃 병 또는 브란',
          note: '싸우지 않고 끝낸다',
          then: {
            text: [
              { if: { party: 'bran' }, t: '브란의 불씨가 마른 덤불에 옮겨붙었다. 비에 젖은 연기가 굴 안으로 낮게 깔려 들어갔다.' },
              { if: { nor: [{ party: 'bran' }] }, t: '그대가 던진 병이 굴 입구에서 깨지며 불길이 솟았다. 비에 젖은 연기가 굴 안으로 낮게 깔려 들어갔다.' },
              '어미들은 새끼의 목덜미를 물고 하나둘 굴을 빠져나왔다. 그리고 불길을 피해, 사냥개의 냄새가 닿지 않는 동쪽 골짜기로 사라졌다.'
            ],
            fx: { set: ['wolves_solved'], xp: 6 },
            fxIf: [{ if: { nor: [{ party: 'bran' }] }, fx: { drop: ['불꽃 병'] } }],
            log: '불을 놓아 늑대 무리를 동쪽 골짜기로 몰아냈다.', next: 'map' } },
        { id: 3, insp: 'mercy', label: '야영 물자를 굴 앞에 풀어 놓고 물러난다', roll: false, approve: { sena: 2 },
          requires: { count: { '야영 물자': 2 } }, reqText: '야영 물자 2',
          note: '싸우지 않고 끝낸다',
          then: {
            text: [
              '그대는 말린 고기와 곡식을 굴 앞에 쏟아 놓고 천천히 물러났다.',
              '어미 하나가 먼저 다가와 냄새를 맡았다. 그리고 새끼들을 불렀다. 굶주림이 가시자, 늑대들은 그대를 한 번 돌아보고는 새끼를 물고 동쪽 골짜기로 떠났다.'
            ],
            fx: { drop: ['야영 물자', '야영 물자'], set: ['wolves_solved', 'wolves_fed'], xp: 8 },
            log: '먹을 것을 나눠 주고 늑대 무리를 떠나보냈다.', next: 'map' } },
        { id: 4, skill: '생존', insp: 'wild', label: '사냥감이 남은 골짜기로 늑대들의 길을 열어 준다', stat: '지혜', dc: 13, approve: { sena: 1 },
          note: '성공하면 싸우지 않고 끝낸다',
          success: {
            text: [
              '그대는 바람과 발자국을 읽었다. 동쪽 골짜기에는 아직 사슴이 남아 있다.',
              '그쪽으로 가는 길목에 사슴의 피 냄새를 묻혀 두자, 어미들은 코를 킁킁거리다가 새끼들을 몰고 떠났다. 마지막 늑대가 고개를 돌려 그대를 오래 바라보았다.'
            ],
            fx: { set: ['wolves_solved'], xp: 8 },
            log: '늑대들에게 사냥감이 남은 골짜기로 가는 길을 열어 주었다.', next: 'map' },
          fail: {
            text: ['늑대들은 그대가 남긴 냄새를 무시했다. 오히려 낯선 냄새에 성난 어미 둘이 달려든다!'],
            battle: {
              enemies: ['wolf', 'wolf'], art: { sky: 'rain', bg: 'slope', fx: ['fog', 'rain'] },
              win: { text: ['두 어미가 쓰러지자, 남은 무리는 새끼를 물고 비탈을 떠났다.'], fx: { set: ['wolves_solved'] }, log: '성난 어미들을 쓰러뜨렸다. 무리는 비탈을 떠났다.', next: 'map' },
              lose: { text: ['정신을 차렸을 때 굴은 비어 있었다. 무리는 더 깊은 골짜기로 옮겨 간 뒤였다.'], fx: { set: ['wolves_solved'] }, log: '늑대에게 쓰러졌지만, 무리는 비탈을 떠났다.', next: 'map' } },
            log: '늑대들의 길을 읽지 못했다.', next: 'map' } }
      ]
    },

    // ───────────────────────── 세나의 부탁: 달빛 별꽃
    moss_nest: {
      art: { sky: 'night', bg: 'forest', actors: [{ k: 'hero', x: 0.22 }, { k: 'bear', x: 0.7, face: -1 }], fx: ['fog', 'motes'] },
      title: '이끼 곰의 둥지',
      clock: '세나의 부탁',
      text: [
        '검은 소나무 숲 가장 깊은 곳, 쓰러진 거목들이 둥지처럼 둘러싼 빈터가 있었다. 그 한가운데에서 달빛도 없는데 은빛으로 빛나는 꽃 한 송이가 피어 있었다.',
        '그리고 그 꽃을 감싸듯 몸을 웅크린 것 — 등에 이끼가 숲처럼 자란, 다른 곰들보다 두 배는 큰 늙은 이끼 곰이었다. 놈의 숨소리에 맞추어 꽃잎이 흔들렸다.',
        { if: { flag: 'dew_known' }, t: '꽃을 꺾을 필요는 없다. 이슬만 받으면, 저 곰도 화낼 이유가 없다.' },
        { if: { party: 'sena' }, t: '세나가 그대의 소매를 잡았다. “저 곰… 사냥개들이 숲을 비운 뒤에도 꽃을 떠나지 않았어요. 지키고 있는 거예요.”' }
      ],
      choices: [
        { id: 1, insp: 'brave', label: '늙은 곰과 싸워 꽃을 얻는다', roll: false, note: '전투 (강하다)',
          then: { text: ['그대가 빈터로 걸어 나가자, 늙은 곰이 천천히 눈을 떴다.'], battle: NEST_FIGHT(false), next: 'map' } },
        { id: 2, skill: '은신', insp: 'sly', label: '곰이 잠든 틈에 숨죽여 꽃에 다가간다', stat: '민첩', dc: 14,
          dcMod: [{ if: { flag: 'dew_known' }, v: -2, why: '이슬만 받으면 된다' }],
          note: '실패하면 곰이 깨어난다',
          success: {
            text: [
              '그대는 숨을 멈추고 거목 사이를 미끄러지듯 지나갔다. 곰의 콧김이 뺨에 닿을 만큼 가까웠다.',
              { if: { flag: 'dew_known' }, t: '은빛 꽃잎 끝에 맺힌 이슬을 작은 병에 받았다. 꽃은 그대로 두었다.' },
              { if: { not: 'dew_known' }, t: '그대는 꽃을 줄기째 꺾어 품에 넣었다. 곰이 잠결에 낮게 으르렁거렸지만, 깨지는 않았다.' }
            ],
            fx: { set: ['moonflower_got'], xp: 10 },
            fxIf: [{ if: { flag: 'dew_known' }, fx: { items: ['달빛 별꽃의 이슬'], set: ['flower_spared'] } }, { if: { not: 'dew_known' }, fx: { items: ['달빛 별꽃'] } }],
            log: '잠든 곰의 둥지에서 달빛 별꽃의 빛을 얻어 왔다.', next: 'map' },
          fail: {
            text: ['마른 가지가 발밑에서 부러졌다. 늙은 곰의 눈이 번쩍 뜨였다!'],
            battle: NEST_FIGHT(false), log: '곰이 깨어났다.', next: 'map' } },
        { id: 3, skill: '생존', insp: 'wild', label: '곰의 숨결에 맞춰 천천히 다가가 짐승을 달랜다', stat: '지혜', dc: 15,
          note: '어렵다. 성공하면 곰이 스스로 길을 비킨다',
          success: {
            text: [
              '그대는 곰의 숨소리에 자신의 숨을 맞췄다. 들이쉬고, 내쉬고. 한 걸음, 또 한 걸음.',
              '늙은 곰이 눈을 떴다. 그러나 이빨을 드러내지 않았다. 놈은 그대를 오래 바라보다가, 천천히 몸을 비켜 꽃을 내보였다. 마치 오래 기다렸다는 듯이.',
              '그대가 이슬을 받는 동안 곰은 다시 눈을 감았다. 빈터를 떠날 때, 곰이 누웠던 자리에서 이끼가 왕관처럼 엉긴 무언가가 반짝였다.'
            ],
            fx: { items: ['달빛 별꽃의 이슬', '이끼 왕관'], set: ['moonflower_got', 'flower_spared', 'got_moss_crown'], xp: 14 }, approve: { sena: 2 },
            log: '늙은 이끼 곰을 달래 달빛 별꽃의 이슬을 받았다. 곰이 이끼 왕관을 남겼다.', next: 'map' },
          fail: {
            text: ['숨이 엇나갔다. 곰의 콧잔등에 주름이 잡히더니, 낮은 포효가 빈터를 흔들었다.'],
            battle: NEST_FIGHT(false), log: '곰을 달래지 못했다.', next: 'map' } },
        { id: 4, insp: 'mercy', label: '야영 물자를 빈터 끝에 풀어 곰을 꽃에서 떼어 놓는다', roll: false, approve: { sena: 1 },
          requires: { count: { '야영 물자': 2 } }, reqText: '야영 물자 2',
          note: '싸우지 않고 끝낸다',
          then: {
            text: [
              '그대는 말린 고기와 꿀을 빈터 끝에 풀어 놓고 물러섰다. 단내를 맡은 늙은 곰이 느릿느릿 몸을 일으켰다.',
              '곰이 먹이에 정신이 팔린 사이, 그대는 꽃 곁으로 다가가 꽃잎 끝의 이슬을 받았다.'
            ],
            fx: { drop: ['야영 물자', '야영 물자'], items: ['달빛 별꽃의 이슬'], set: ['moonflower_got', 'flower_spared'], xp: 10 },
            log: '먹이로 곰을 떼어 놓고 달빛 별꽃의 이슬을 받았다.', next: 'map' } }
      ]
    },

    crone_cure: {
      art: { sky: 'cave', bg: 'hut', actors: [{ k: 'hero', x: 0.34 }, { k: 'crone', x: 0.62, face: -1 }] },
      title: '등불지기의 눈',
      clock: '세나의 부탁',
      text: [
        '노파는 달빛 별꽃의 이슬을 눈꺼풀에 떨어뜨리고, 오랫동안 눈을 감고 있었다.',
        '이윽고 눈을 떴을 때 — 그 탁하던 눈동자에 화로의 불빛이 비쳤다.',
        { if: { party: 'sena' }, t: '“…세나야. 너 머리를 잘랐구나.” 세나가 울음을 터뜨리며 할머니에게 안겼다. 노파의 마른 손이 손녀의 짧은 머리를 오래도록 쓸어내렸다.' },
        { if: { nor: [{ party: 'sena' }] }, t: '노파는 그대의 얼굴을 한참 들여다보았다. “네가 별의 아이로구나. 생각보다 어리구나.”' }
      ],
      choices: [
        { id: 1, insp: 'mercy', label: '노파의 손을 잡는다', roll: false,
          then: {
            text: [
              '노파가 벽장 깊은 곳에서 작은 등불 하나를 꺼냈다. 유리 안에서 꺼지지 않는 불씨가 깜박였다.',
              '“등불지기는 대대로 이걸 지켜 왔단다. 잿빛 안개 속에서도 길을 비춰 주지.” 노파가 등불을 그대의 손에 쥐여 주었다. “이제 네가 가져가거라. 나는 다시 볼 수 있으니.”'
            ],
            fx: { drop: ['달빛 별꽃', '달빛 별꽃의 이슬'], items: ['등불지기의 등불'], set: ['crone_cured'], xp: 20 }, approve: { sena: 2 },
            log: '달빛 별꽃의 이슬로 노파가 눈을 되찾았다. 등불지기의 등불을 받았다.', next: 'map' } }
      ]
    },

    // ───────────────────────── 브란의 부탁: 회색 장부
    cult_den: {
      art: { sky: 'cave', bg: 'hall', actors: [{ k: 'hero', x: 0.22 }, { k: 'acolyte', x: 0.58, face: -1 }, { k: 'acolyte', x: 0.7, face: -1 }, { k: 'acolyte', x: 0.84, face: -1 }], fx: ['dust'] },
      title: '회색 두건의 은신처',
      clock: '브란의 부탁',
      text: [
        '회랑 옆 무너진 예배실. 회색 두건을 쓴 자들이 무릎을 꿇고 앉아, 낮은 목소리로 같은 구절을 되풀이하고 있었다. ‘돌아오라. 사냥꾼의 품은 따뜻하다.’',
        '제단 위에서 한 사람이 일어섰다. 두건 아래로 이마 전체에 낙인이 새겨진 늙은 사내 — 추종자들의 우두머리였다. 그의 허리춤에 두꺼운 회색 장부가 매달려 있다.',
        { if: { party: 'bran' }, t: '브란의 손이 떨렸다. “저자요. 내 손등에 낙인을 찍은 자.”' }
      ],
      choices: [
        { id: 1, insp: 'brave', label: '정면으로 쳐들어간다', roll: false, note: '전투 (우두머리와 추종자 둘)',
          then: { text: ['그대가 예배실 문을 박차고 들어서자, 구절이 뚝 끊겼다.'], battle: CULT_FIGHT(false), next: 'map' } },
        { id: 2, skill: '은신', insp: 'sly', label: '그림자를 따라 제단 뒤로 돌아 기습한다', stat: '민첩', dc: 14,
          note: '성공하면 적이 기습당한다',
          success: { text: ['그대는 기둥의 그림자를 하나씩 건너 제단 뒤에 섰다. 우두머리의 등이 바로 앞에 있었다.'], battle: CULT_FIGHT(true), log: '추종자들의 등 뒤를 잡았다.', next: 'map' },
          fail: { text: ['무너진 돌 하나가 굴러떨어졌다. 남은 두건들이 일제히 그대를 향했다.'], fx: { hp: -3 }, battle: CULT_FIGHT(false), log: '숨어들다 들켰다 (HP -3).', next: 'map' } },
        { id: 3, skill: '기만', insp: 'sly', label: '추종자인 척 구절을 읊으며 장부에 다가간다', stat: '매력', dc: 15,
          adv: [{ if: { party: 'bran' }, why: '브란이 구절을 알려 준다' }],
          note: '성공하면 싸우지 않고 장부를 빼낸다',
          success: {
            text: [
              '그대는 낮게 구절을 읊조리며 무릎 꿇은 이들 사이를 지나갔다. 아무도 고개를 들지 않았다.',
              '우두머리가 장부를 제단에 내려놓고 기도를 올리는 순간, 그대는 장부를 품에 넣고 그림자 속으로 물러났다. 등 뒤에서 구절은 끝없이 이어졌다.'
            ],
            fx: { items: ['회색 장부'], set: ['ledger_got'], xp: 25 }, approve: { bran: 1 },
            log: '추종자인 척 숨어들어 회색 장부를 빼냈다.', next: 'map' },
          fail: {
            text: ['구절 하나를 틀렸다. 우두머리의 눈이 가늘어졌다. “사냥꾼의 품에 그런 말은 없다.”'],
            battle: CULT_FIGHT(false), log: '정체가 들통났다.', next: 'map' } },
        { id: 4, label: '예배실 입구에 불을 놓는다', roll: false, approve: { bran: 2, sena: -1 },
          requires: { or: [{ item: '불꽃 병' }, { party: 'bran' }] }, reqText: '불꽃 병 또는 브란',
          note: '추종자들은 흩어지고, 우두머리만 불길 속에서 맞선다',
          then: {
            text: ['불길이 예배실 입구를 삼켰다. 비명과 함께 두건들이 흩어졌다. 우두머리만이 불길을 뚫고 그대에게 다가왔다. 장부를 품에 꼭 안은 채.'],
            fxIf: [{ if: { nor: [{ party: 'bran' }] }, fx: { drop: ['불꽃 병'] } }],
            battle: CULT_FIGHT(false, true), next: 'map' } }
      ]
    },

    // ───────────────────────── 야영지 대화 (쉼터에서 긴 휴식을 하면)
    camp_sena1: {
      camp: true, art: 'camp', if: { party: 'sena' },
      title: '모닥불 곁에서 · 세나',
      clock: '야영',
      text: [
        '불이 낮게 타올랐다. 세나는 화살촉을 갈다 말고, 한참 동안 불꽃만 바라보고 있었다.',
        '“할머니 눈 말이에요.” 그녀가 입을 열었다. “원래부터 안 보였던 게 아니에요. 몇 해 전, 사냥개들이 처음 마을에 내려왔던 밤에 할머니는 등불을 들고 밖에 나갔다가 회색 빛을 정면으로 봤대요. 그 뒤로 세상이 잿빛 안개처럼 보인대요.”',
        '“진짜 약은 따로 있어요. 달빛 별꽃 — 숲 가장 깊은 곳, 늙은 이끼 곰의 둥지에서만 피는 꽃이요.” 그녀가 쓴웃음을 지었다. “혼자서는 엄두도 못 냈죠.”'
      ],
      choices: [
        { id: 1, insp: 'mercy', label: '함께 둥지로 가자고 약속한다', roll: false, approve: { sena: 2 },
          then: {
            text: ['세나의 눈이 커졌다. “정말요?” 그녀가 서둘러 고개를 숙였다. 불빛 때문인지 귀끝이 붉었다. “…고마워요. 진짜로.”'],
            fx: { set: ['q_moonflower'] }, log: '세나와 이끼 곰의 둥지에서 달빛 별꽃을 찾기로 약속했다.', next: 'map' } },
        { id: 2, skill: '의학', insp: 'lore', label: '할머니의 증상을 자세히 묻는다', stat: '지혜', dc: 12, approve: { sena: 1 },
          note: '성공하면 꽃을 꺾지 않아도 되는 방법을 안다',
          success: {
            text: [
              '그대는 증상을 하나하나 물었다. 회색 빛, 잿빛 안개, 밤마다 심해지는 통증. 낙인의 빛이 남긴 상처라면, 꽃잎이 아니라 꽃잎에 맺힌 이슬로 씻어 낼 수 있다.',
              '“이슬이요?” 세나가 눈을 깜빡였다. “그럼… 꽃을 꺾지 않아도 되겠네요. 곰이 지키는 꽃을.”'
            ],
            fx: { set: ['q_moonflower', 'dew_known'], xp: 4 }, log: '달빛 별꽃은 꺾지 않고 이슬만 받아도 된다는 것을 알아냈다.', next: 'map' },
          fail: {
            text: ['그대의 질문은 끝내 답에 닿지 못했다. 세나가 피곤한 듯 웃었다. “직접 가 보는 수밖에 없어요.”'],
            fx: { set: ['q_moonflower'] }, log: '달빛 별꽃 이야기를 들었다.', next: 'map' } },
        { id: 3, label: '관문의 일이 먼저라고 말한다', roll: false, approve: { sena: -2 },
          then: {
            text: ['“…그렇죠. 별의 아이한테는 더 큰 일이 있으니까.” 세나는 다시 화살촉을 갈기 시작했다. 사각거리는 소리가 오래 이어졌다.', '그래도 잠들기 전, 그녀는 숲 쪽을 한 번 더 돌아보았다.'],
            fx: { set: ['q_moonflower'] }, log: '달빛 별꽃 이야기를 들었지만, 관문이 먼저라고 했다.', next: 'map' } }
      ]
    },

    camp_sena2: {
      camp: true, art: 'camp', if: { party: 'sena', flag: 'crone_cured', min: { ap_sena: 4 } },
      title: '모닥불 곁에서 · 세나',
      clock: '야영',
      text: [
        '세나가 목에 걸린 가죽끈을 만지작거렸다. 끝에 낡은 화살촉 하나가 매달려 있었다.',
        '“엄마 거예요. 사냥개들이 마을에 처음 내려왔던 밤에, 엄마는 이걸로 세 마리를 쐈대요. 네 번째는 못 쐈고요.”',
        '“할머니 눈을 고쳐 줘서 고마워요. 그래서… 이거, 당신이 가져요.” 그녀가 목걸이를 풀어 그대의 손에 쥐여 주었다. “엄마가 그랬대요. 지켜야 할 사람이 생기면 넘겨주라고.”'
      ],
      choices: [
        { id: 1, label: '목걸이를 받는다', roll: false, approve: { sena: 1 },
          then: {
            text: ['세나가 웃었다. 불빛 속에서, 그 웃음은 노파를 닮아 있었다. “이제 당신도 등불지기 집안 사람이에요. 도망 못 가요.”'],
            fx: { items: ['세나 어머니의 화살촉'], set: ['sena_sworn'] }, log: '세나에게서 어머니의 화살촉을 받았다.', next: 'map' } },
        { id: 2, insp: 'mercy', label: '“그건 네가 지녀야 한다”며 다시 목에 걸어 준다', roll: false, approve: { sena: 2 },
          then: {
            text: ['세나는 잠시 멍하니 그대를 보다가, 목걸이를 꼭 쥐었다. “…그럼 이걸로 당신을 지킬게요. 엄마처럼. 네 번째 화살까지.”', '그날 이후 세나의 화살은 한 번도 망설이지 않았다.'],
            fx: { set: ['sena_sworn', 'sena_kept_arrow'] }, log: '세나에게 어머니의 화살촉을 돌려주었다. 세나가 끝까지 지키겠다고 맹세했다. (세나 명중 +1)', next: 'map' } }
      ]
    },

    camp_bran1: {
      camp: true, art: 'camp', if: { party: 'bran' },
      title: '모닥불 곁에서 · 브란',
      clock: '야영',
      text: [
        '브란은 모닥불에서 가장 먼 자리에 앉아, 지져진 손등을 불빛에 비춰 보고 있었다.',
        '“밤이 되면 들린다오.” 그가 그대의 시선을 느끼고 말했다. “지져 냈는데도. 낙인이 있던 자리에서 누군가 속삭이지. 돌아오라고. 사냥꾼의 품은 따뜻하다고.”',
        '“회랑 어딘가에 추종자들의 우두머리가 숨어 있소. 그자가 회색 장부를 가지고 있지. 낙인이 찍힌 모든 이름이 적힌 장부요. 그 장부가 남아 있는 한, 사냥꾼은 우리를 언제든 다시 부를 수 있소.”'
      ],
      choices: [
        { id: 1, label: '장부를 찾아 함께 불태우자고 한다', roll: false, approve: { bran: 2 },
          then: {
            text: ['브란이 그대를 오래 바라보았다. 그리고 처음으로, 비웃음이 섞이지 않은 웃음을 지었다. “…그대는 이상한 사람이군.”'],
            fx: { set: ['q_ledger'] }, log: '브란과 회색 장부를 찾아 불태우기로 했다.', next: 'map' } },
        { id: 2, insp: 'lore', label: '낙인이 어떻게 짐승의 뜻을 빼앗는지 묻는다', roll: false, approve: { bran: 1 },
          note: '회색 낙인의 비밀을 듣는다',
          then: {
            text: [
              '“낙인은 사슬이오. 사냥꾼의 뜻을 짐승의 뜻 위에 덮어씌우지. 하지만 사슬이란 건 — 고리 하나만 끊어도 끝이오.”',
              '브란이 손가락으로 허공에 룬 하나를 그렸다. ‘묶는 자, 회색 사냥꾼.’ 그대는 그 이름을 마음에 새겼다.',
              '“장부 이야기는… 마음이 내키면 들어 주시오.”'
            ],
            fx: { set: ['mark_seen', 'mark_known', 'q_ledger'], xp: 6 }, log: '브란에게서 회색 낙인의 비밀을 들었다. 낙인은 끊을 수 있는 사슬이다.', next: 'map' } },
        { id: 3, skill: '통찰', insp: 'mercy', label: '속삭임에 아직 끌리고 있는지 그의 눈을 살핀다', stat: '지혜', dc: 13,
          success: {
            text: ['그의 눈은 흔들리지 않았다. 속삭임은 들리지만, 그는 대답하지 않는 것이다. 매일 밤, 혼자서.', '“…들켰군.” 브란이 어깨를 으쓱했다. “그래도 누가 봐 주니 조금 낫소.”'],
            fx: { set: ['q_ledger'], xp: 4 }, approve: { bran: 2 }, log: '브란이 매일 밤 홀로 속삭임을 견디고 있음을 알았다.', next: 'map' },
          fail: {
            text: ['그대가 너무 오래 쳐다보았다. 브란이 차갑게 웃었다. “아직 사냥꾼의 개인지 확인하는 거요? 마음대로 하시오.”'],
            fx: { set: ['q_ledger'] }, approve: { bran: -1 }, log: '브란을 의심하는 눈빛을 들켰다.', next: 'map' } },
        { id: 4, label: '“아직도 사냥꾼의 냄새가 난다”고 쏘아붙인다', roll: false, approve: { bran: -2, sena: 1 },
          then: {
            text: ['브란의 얼굴이 굳었다. 그는 아무 말 없이 일어나 어둠 속으로 걸어갔다.', { if: { party: 'sena' }, t: '세나는 아무 말도 하지 않았지만, 그대 쪽으로 조금 더 다가앉았다.' }, '새벽녘에야 돌아온 그가 짧게 말했다. “회랑의 장부. 그래도 그건 불태워야 하오.”'],
            fx: { set: ['q_ledger'] }, log: '브란에게 모진 말을 했다.', next: 'map' } }
      ]
    },

    camp_bran2: {
      camp: true, art: 'camp', if: { party: 'bran', item: '회색 장부' },
      title: '모닥불 곁에서 · 브란',
      clock: '야영',
      text: [
        '브란이 회색 장부를 무릎 위에 펼쳤다. 빽빽한 이름들. 사람, 짐승, 그리고 이름 대신 낙인 문양만 그려진 칸들.',
        '한 장을 넘기던 그의 손가락이 멈췄다. 거기에 브란의 이름이 있었다. 그 아래에, 아직 지워지지 않은 수백 개의 이름이.',
        '“이걸 태우면, 여기 적힌 자들은 사냥꾼의 부름에서 풀려나오. 하지만…” 그가 장부를 덮었다. “사냥꾼이 어디서 무엇을 묶었는지도 함께 사라지지. 그대가 정하시오.”'
      ],
      choices: [
        { id: 1, insp: 'mercy', label: '함께 불태운다', roll: false, approve: { bran: 3, sena: 1 },
          then: {
            text: [
              '장부가 불길 속에서 오그라들었다. 이름 하나가 탈 때마다, 아주 먼 곳 어딘가에서 무언가가 툭 끊어지는 소리가 들리는 것 같았다.',
              '브란이 지져진 손등을 내려다보았다. “…조용하군.” 그의 목소리가 떨렸다. “천 날 만에 처음으로, 조용하오.”',
              '그는 손가락에서 무쇠 반지 하나를 빼어 장부를 태운 불씨에 한 번 담갔다가, 그대에게 내밀었다. “받으시오. 이 불씨가 그대를 지킬 거요.”'
            ],
            fx: { drop: ['회색 장부'], items: ['브란의 불씨 반지'], set: ['ledger_burned'], xp: 20 },
            log: '브란과 함께 회색 장부를 불태웠다. 브란이 속삭임에서 풀려났다. (브란 명중 +1)', next: 'map' } },
        { id: 2, skill: '설득', insp: 'song', label: '사냥꾼을 쫓으려면 그가 머무는 곳이 적힌 장만은 남기자고 한다', stat: '매력', dc: 15,
          success: {
            text: ['브란은 오래 망설였다. “…한 장만 남기시오. 사냥꾼이 머무는 곳이 적힌 장.” 나머지는 불길 속으로 들어갔다.', '그는 반지 하나를 불씨에 담갔다가 그대에게 내밀었다. “그 한 장이 그대를 삼키지 않도록.”'],
            fx: { drop: ['회색 장부'], items: ['회색 장부의 마지막 장', '브란의 불씨 반지'], set: ['ledger_burned', 'ledger_page'], xp: 20 }, approve: { bran: 1 },
            log: '회색 장부를 불태우되, 사냥꾼이 머무는 곳이 적힌 마지막 장은 남겼다.', next: 'map' },
          fail: {
            text: ['“그 말, 사냥꾼도 똑같이 했소.” 브란이 장부를 빼앗아 불 속에 던졌다. 그는 그날 밤 내내 그대 쪽을 보지 않았다.'],
            fx: { drop: ['회색 장부'], set: ['ledger_burned'], xp: 10 }, approve: { bran: -2 },
            log: '장부를 남기자고 했다가 브란의 화를 샀다. 브란이 장부를 불태웠다.', next: 'map' } },
        { id: 3, label: '장부를 지니고 다니며 사냥꾼의 비밀을 읽겠다고 한다', roll: false, approve: { bran: -3 },
          then: {
            text: ['브란이 아무 말 없이 그대를 바라보았다. 그리고 장부를 그대에게 건네고 등을 돌렸다. “…그대 뜻대로.”'],
            fx: { set: ['ledger_kept'] }, log: '회색 장부를 지니기로 했다. 브란이 등을 돌렸다.', next: 'map' } }
      ]
    },

    camp_orden1: {
      camp: true, art: 'camp', if: { party: 'orden', flag: 'done_n5', not: 'done_n9' },
      title: '모닥불 곁에서 · 오르덴',
      clock: '야영',
      text: [
        '오르덴은 모닥불 곁에서도 투구를 벗지 않았다. 천 년 동안 그래 왔듯이.',
        '“돌이 되어 있던 동안, 나는 꿈을 꾸지 않았다.” 그가 불쑥 말했다. “다만 빗소리를 들었지. 천 년 동안 하루도 빠짐없이. 그러다 어느 날, 그 빗소리 사이로 그대의 발소리가 들렸다.”',
        '“하나만 묻겠다. 별께서 그대에게 나처럼 돌이 되어 문을 지키라 하신다면 — 그대는 따르겠는가?”'
      ],
      choices: [
        { id: 1, insp: 'brave', label: '따르겠다. 맹세란 그런 것이다', roll: false, approve: { orden: 1 },
          then: {
            text: ['오르덴이 고개를 끄덕였다. “그 대답을 천 년 전에 들었다면… 아니, 됐다.” 그는 불을 오래 바라보았다.'],
            fx: { set: ['oath_follow'] }, log: '오르덴에게 별의 뜻이라면 따르겠다고 답했다.', next: 'map' } },
        { id: 2, label: '따르지 않겠다. 별이라도 사람에게 그런 것을 요구해서는 안 된다', roll: false, approve: { orden: 1, bran: 1 },
          then: {
            text: ['오르덴은 한참 말이 없었다. “…천 년 전 왕께 그렇게 말한 기사가 한 명 있었다. 카이론. 내 동생이었지.”', '그가 처음으로 투구를 벗었다. 불빛에 드러난 얼굴은 생각보다 훨씬 젊었다. “그 아이가 옳았는지도 모르겠군.”'],
            fx: { set: ['oath_question'] }, log: '오르덴에게 별의 뜻이라도 따르지 않겠다고 답했다. 오르덴이 투구를 벗었다.', next: 'map' } },
        { id: 3, skill: '공연', insp: 'song', label: '대답 대신, 돌이 된 기사들의 노래를 나지막이 부른다', stat: '매력', dc: 12,
          success: {
            text: ['그대의 노래가 불 위로 낮게 퍼졌다. 두 번째 소절에서, 갈라진 목소리 하나가 그 뒤를 따랐다.', '오르덴이 부르고 있었다. 천 년 만에. 노래가 끝났을 때, 기사는 아무 말도 하지 않았다. 할 필요가 없었다.'],
            approve: { orden: 2 }, fx: { xp: 4 }, log: '오르덴과 함께 돌이 된 기사들의 노래를 불렀다.', next: 'map' },
          fail: {
            text: ['노래가 자꾸 엇나갔다. 오르덴이 낮게 웃었다. “그 노래는 천 년 전에도 다들 틀렸다. 괜찮다.”'],
            log: '노래가 엇나갔지만 오르덴이 웃었다.', next: 'map' } }
      ]
    },

    camp_orden2: {
      camp: true, art: 'camp', if: { party: 'orden', flag: 'q_ring_done', min: { bond: 4 } },
      title: '모닥불 곁에서 · 오르덴',
      clock: '야영',
      text: [
        '오르덴이 새끼손가락에서 은반지를 빼어 손바닥 위에 올려놓았다. 카이론의 반지였다.',
        '“형제의 맹세는 형제가 잇는 법이다.” 그가 반지를 그대에게 내밀었다. “카이론은 문 안에 갇혀 있는 것보다 길 위에 있기를 바랐을 것이다. 그대가 지녀라.”'
      ],
      choices: [
        { id: 1, label: '반지를 받는다', roll: false, approve: { orden: 1 },
          then: {
            text: ['반지는 그대의 손가락에 꼭 맞았다. 오르덴이 짧게 웃었다. “역시. 그 녀석도 손가락이 가늘었지.”'],
            fx: { items: ['카이론의 반지'], set: ['kairon_given'] }, log: '오르덴에게서 카이론의 반지를 받았다.', next: 'map' } },
        { id: 2, insp: 'mercy', label: '“그 반지는 그대가 끼고 있어야 한다”며 돌려준다', roll: false, approve: { orden: 2 },
          then: {
            text: ['오르덴은 반지를 다시 끼며 오래 고개를 숙였다. “…그렇다면 이 반지에 걸고, 그대 앞에 서는 모든 것을 막겠다.”'],
            fx: { set: ['kairon_kept'] }, log: '카이론의 반지를 오르덴에게 돌려주었다. (오르덴 방어 +1)', next: 'map' } }
      ]
    },

    camp_argue: {
      camp: true, art: 'camp', if: { party: ['sena', 'bran'], flag: ['done_camp_sena1', 'done_camp_bran1'] },
      title: '모닥불 곁의 다툼',
      clock: '야영',
      text: [
        '그날 밤, 모닥불 너머에서 언성이 높아졌다.',
        '“그 낙인을 찍은 게 당신네들이잖아요!” 세나가 벌떡 일어났다. “우리 엄마 아빠를 물어 죽인 개들한테도 그 낙인이 있었어요!”',
        '브란은 일어서지 않았다. “맞소. 내 손으로 찍은 개도 있었겠지.” 그가 지져진 손등을 불빛에 내보였다. “그래서 이걸 지졌소. 그걸로 다 갚아지진 않겠지만.”',
        '두 사람의 시선이 그대에게 향했다.'
      ],
      choices: [
        { id: 1, label: '세나 편을 든다 — 손등을 지진다고 지워지지 않는 죄도 있다', roll: false, approve: { sena: 2, bran: -2 },
          then: { text: ['세나가 이를 악물고 고개를 끄덕였다. 브란은 아무 말 없이 불씨만 뒤적였다. 그날 밤, 모닥불은 유난히 빨리 사그라들었다.'], log: '모닥불 곁의 다툼에서 세나 편을 들었다.', next: 'map' } },
        { id: 2, label: '브란 편을 든다 — 사슬을 끊고 돌아선 사람을 탓할 수는 없다', roll: false, approve: { bran: 2, sena: -2 },
          then: { text: ['브란이 놀란 듯 그대를 보았다. 세나는 입술을 깨물고 등을 돌려 누웠다. 그날 밤 그녀는 한 번도 돌아눕지 않았다.'], log: '모닥불 곁의 다툼에서 브란 편을 들었다.', next: 'map' } },
        { id: 3, skill: '설득', insp: 'song', label: '두 사람 모두의 원수는 회색 사냥꾼이라고 말한다', stat: '매력', dc: 13,
          success: {
            text: [
              '“세나의 부모를 죽인 것도, 브란의 손에 낙인을 찍게 한 것도 같은 자다.” 그대의 말에 모닥불이 조용해졌다.',
              { if: { nor: [{ flag: 'ledger_burned' }, { flag: 'ledger_kept' }] }, t: '한참 뒤, 세나가 다시 앉았다. “…그 장부, 태울 때 나도 불러요.” 브란이 고개를 끄덕였다. “그러지.”' },
              { if: { any: ['ledger_burned', 'ledger_kept'] }, t: '한참 뒤, 세나가 다시 앉았다. “…사냥꾼 얘기는 내일 마저 해요.” 브란이 짧게 웃었다. “그러지.”' }
            ],
            approve: { sena: 1, bran: 1 }, fx: { xp: 5 }, log: '세나와 브란을 화해시켰다.', next: 'map' },
          fail: {
            text: ['그대의 말은 두 사람 모두에게 변명처럼 들렸다. 세나는 자리를 옮겼고, 브란은 어둠 속으로 걸어갔다.'],
            approve: { sena: -1, bran: -1 }, log: '세나와 브란의 다툼을 말리지 못했다.', next: 'map' } },
        { id: 4, skill: '통찰', insp: 'mercy', label: '말없이 둘 사이에 앉아, 각자의 이야기를 끝까지 듣는다', stat: '지혜', dc: 12,
          success: {
            text: ['그대는 아무 편도 들지 않았다. 다만 들었다. 세나의 부모 이야기를, 브란이 처음 낙인을 받던 날의 이야기를.', '새벽이 올 무렵, 두 사람은 같은 불을 쬐고 있었다. 말은 없었지만, 더는 서로를 노려보지 않았다.'],
            approve: { sena: 1, bran: 1 }, fx: { xp: 5 }, log: '세나와 브란의 이야기를 끝까지 들었다.', next: 'map' },
          fail: {
            text: ['침묵이 너무 길었다. 두 사람은 각자 다른 쪽으로 돌아누웠다.'],
            log: '모닥불 곁의 다툼은 침묵으로 끝났다.', next: 'map' } }
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
        { id: 1, skill: '의학', insp: 'wild', label: '잎맥을 살펴 약초인지 가려낸다', stat: '지혜', dc: 10, adv: [{ if: { party: 'sena' }, why: '세나의 눈' }],
          success: { text: ['별꽃 약초가 맞다. 그대는 잎을 짓이겨 작은 병에 담았다.'], fx: { items: ['은빛 물약'], xp: 2 }, log: '별꽃 약초로 은빛 물약을 만들었다.', next: 'map' },
          fail: { text: ['잎을 씹는 순간 혀가 저려 왔다. 독초였다.'], fx: { hp: -2 }, log: '독초를 씹었다 (HP -2).', next: 'map' } },
        { id: 2, label: '건드리지 않는다', roll: false, then: { text: ['그대는 잎사귀를 그대로 두었다.'], next: 'map' } }
      ]
    },
    ex_trap: {
      title: '버려진 덫', clock: '탐색',
      text: ['낙엽 아래 녹슨 덫이 입을 벌리고 있다. 덫 옆에는 덫사냥꾼의 것으로 보이는 주머니가 떨어져 있다.'],
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
        '녹슨 장갑을 낀 손에 은빛 병 두 개가 아직 온전히 쥐어져 있었다. 그런데 — 약지에는 반지 자국만 남아 있다. 수로 깊은 곳에서 녹슨 갑주가 부딪히는 소리가 들려온다.'
      ],
      choices: [
        { id: 1, insp: 'mercy', label: '짧게 묵념하고 병을 거둔다', roll: false, approve: { sena: 1, orden: 1 },
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
    captain_lair: {
      art: { sky: 'cave', bg: 'aqueduct', actors: [{ k: 'hero', x: 0.26 }, { k: 'captain', x: 0.68, face: -1 }], fx: ['drip'] },
      title: '가라앉은 묘실', clock: '사냥터의 우두머리',
      text: [
        '수로의 가장 깊은 곳, 무너진 아치 아래에 묘실이 잠겨 있다. 물 위로 은빛 갑주의 어깨가 드러나 있다.',
        '엘레우스의 기사단장 바렌. 별의 무덤을 지키러 수로로 내려가 끝내 돌아오지 않았다는 사람. 녹슨 투구 속에서 금빛 불꽃이 그대를 바라본다.',
        { if: { min: { captain_wins: 1 } }, t: '그대가 몇 번을 잠재워도, 그는 다시 일어난다. 맹세기사의 갑주 한 벌을 아직 품고 있다는 듯이.' },
        { if: { party: 'orden' }, t: '오르덴이 창끝을 내렸다. “바렌 단장님… 쉬게 해 드리는 것이 기사의 도리다. 몇 번이 걸리든.”' }
      ],
      choices: [
        { id: 1, insp: 'brave', label: '묘실의 물속으로 걸어 들어가 기사단장과 싸운다', roll: false, note: '전투 (매우 강하다 · 맹세기사의 흉갑과 엘레우스의 무기를 지녔다)',
          then: { text: ['그대가 물을 가르며 다가가자, 기사단장이 천천히 몸을 일으켰다.'], battle: CAPTAIN_FIGHT, next: 'map' } },
        { id: 2, label: '아직은 아니다. 조용히 물러난다', roll: false,
          then: { text: ['그대는 묘실을 등지고 물러났다. 금빛 불꽃이 그대의 등을 오래 지켜보았다.'], next: 'map' } }
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
            battle: { enemies: ['drowned'], perPC: { hp: 12 },
              win: { text: ['기사의 갑주가 무너져 내렸다. 푸른 불꽃이 꺼지기 직전, 그것은 그대를 향해 고개를 숙였다. 마치 — 고맙다는 듯이.'], log: '물에 잠긴 기사를 쉬게 했다.', next: 'map' },
              lose: { text: ['녹슨 대검이 그대를 물속으로 처박았다. 정신을 차렸을 때, 기사는 다시 깊은 곳으로 가라앉은 뒤였다.'], log: '물에 잠긴 기사에게 쓰러졌다.', next: 'map' } },
            next: 'map' } },
        { id: 2, skill: '역사', insp: 'lore', label: '엘레우스 맹세의 구절을 읊어 기사를 잠재운다', stat: '지혜', dc: 14, approve: { orden: 1 },
          requires: { or: [{ flag: 'lore' }, { party: 'orden' }] }, reqText: '엘레우스의 전승 또는 오르덴',
          adv: [{ if: { party: 'orden' }, why: '오르덴이 함께 읊는다' }],
          note: '성공하면 싸우지 않고 반지를 얻는다',
          success: {
            text: [
              '‘별이 떨어진 밤에도 우리는 무릎 꿇지 않으리. 마지막 빛이 꺼질 때까지 이 문을 지키리.’',
              { if: { party: 'orden' }, t: '오르덴의 낮은 목소리가 그대의 목소리에 겹쳤다. 두 목소리가 물 위로 퍼져 나가자, 투구 속 푸른 불꽃이 흔들렸다.' },
              '물에 잠긴 기사가 녹슨 대검을 내렸다. 그는 천천히 무릎을 꿇고, 손가락의 은반지를 빼어 그대의 손바닥 위에 올려놓았다. 그리고 흉갑의 버클을 풀어 그대 앞에 내려놓았다. 더는 지킬 것이 없다는 듯이.',
              '푸른 불꽃이 꺼지고, 기사는 조용히 물속으로 가라앉았다. 천 년 만의 잠이었다.'
            ],
            fx: { set: ['got_ring', 'got_cuirass', 'knight_rest'], items: ['기사의 반지', '엘레우스 기사의 흉갑'], xp: 30 },
            log: '맹세의 구절로 물에 잠긴 기사를 잠재우고 반지를 받았다.', next: 'map' },
          fail: {
            text: ['구절 하나가 물소리에 묻혔다. 투구 속 불꽃이 사납게 타올랐다. 기사가 녹슨 대검을 치켜든다!'],
            battle: { enemies: ['drowned'], perPC: { hp: 12 },
              win: { text: ['기사의 갑주가 무너져 내렸다. 푸른 불꽃이 꺼지기 직전, 그것은 그대를 향해 고개를 숙였다. 마치 고맙다는 듯이.'], log: '물에 잠긴 기사를 쉬게 했다.', next: 'map' },
              lose: { text: ['녹슨 대검이 그대를 물속으로 처박았다. 정신을 차렸을 때, 기사는 다시 깊은 곳으로 가라앉은 뒤였다.'], log: '물에 잠긴 기사에게 쓰러졌다.', next: 'map' } },
            log: '맹세의 구절이 엇나갔다.', next: 'map' } },
        { id: 3, label: '지금은 물러난다', roll: false, then: { text: ['그대는 조용히 물러났다. 기사는 그대를 쫓지 않았다.'], next: 'map' } }
      ]
    },
    ex_corpse: {
      title: '추종자의 시신', clock: '탐색',
      text: ['무너진 기둥 아래 회색 두건을 쓴 시신이 깔려 있다. 손등에 사냥개와 같은 낙인이 있다.'],
      choices: [
        { id: 1, skill: '지각', label: '시신의 소지품을 살핀다', stat: '지혜', dc: 12, approve: { sena: -1, bran: 1 },
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
    { label: '세나', cases: [
        { if: { flag: 'sena_left' }, t: '그대에게 실망해 마을로 돌아갔다' },
        { if: { flag: 'sena_sworn' }, t: '할머니의 눈을 되찾아 준 그대를 끝까지 지키기로 했다' },
        { if: { flag: 'sena_met' }, t: '등불지기의 손녀. 그대와 함께 관문까지 왔다' }
      ], else: '검은 소나무 숲에서 만나지 못했다' },
    { label: '브란', cases: [
        { if: { flag: 'bran_left' }, t: '그대 곁을 떠나 안개 속으로 사라졌다' },
        { if: { flag: 'ledger_burned' }, t: '회색 장부를 불태우고 사냥꾼의 속삭임에서 풀려났다' },
        { if: { flag: 'bran_met' }, t: '낙인을 지져 낸 옛 추종자. 그대와 함께 사냥꾼에 맞선다' }
      ], else: '천 개의 계단 초소에서 만나지 못했다' },
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
    { label: '등불지기', cases: [
        { if: { flag: 'crone_cured' }, t: '달빛 별꽃의 이슬로 눈을 되찾았다' }
      ], else: '잿빛 안개 속에 산다' },
    { label: '회색 장부', cases: [
        { if: { flag: 'ledger_page' }, t: '불태웠지만, 사냥꾼이 머무는 곳이 적힌 마지막 장은 남겼다' },
        { if: { flag: 'ledger_burned' }, t: '브란과 함께 불태웠다. 수백 개의 이름이 사냥꾼의 부름에서 풀려났다' },
        { if: { flag: 'ledger_kept' }, t: '그대가 지니고 있다' },
        { if: { item: '회색 장부' }, t: '손에 넣었지만, 어떻게 할지 아직 정하지 못했다' }
      ], else: '추종자 우두머리의 손에 있다' },
    { label: '가라앉은 맹세', cases: [
        { if: { flag: 'q_ring_done' }, t: '오르덴의 동생 카이론의 반지를 돌려주었다' },
        { if: { item: '기사의 반지' }, t: '반지를 찾았지만, 아직 오르덴에게 돌려주지 않았다' }
      ], else: '수로 깊은 곳의 기사는 아직 잠들어 있다' },
    { label: '별의 흔적', cases: [
        { if: { flag: 'starmark' }, t: '손등에 일곱 갈래 별 모양 화상이 남았다' }
      ], else: '없음' }
  ]
};
