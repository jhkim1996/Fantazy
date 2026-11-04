// 떨어진 별의 노래 — 제2장 「회색 사냥꾼」 (동쪽 변경)
//
// 1장 데이터(window.SCENARIO)에 지역·장소·사건·적·아이템·목표·퀘스트를 덧붙인다. 전체 구상은 SAGA.md.
// 1장이 남긴 기록이 이 장을 바꾼다:
//   orden_joins(오르덴 동행) · sena/bran(동료) · ledger_burned/ledger_page/ledger_kept(장부)
//   alpha_freed/alpha_fled/alpha_slain · 잿빛 새끼 · crone_cured(등불지기의 등불) · star_map/starmark · hunter_saw
// 이 장이 남기는 기록 (3장으로):
//   anchor_broken/ford_freed · ford_burned · tobin_saved · brita_saved · rine_freed/rine_slain/rine_lost
//   shard1 · irvan_named · irvan_offer_refused/asked/wavered · vask_down/vask_won/vask_doubt · hunter_mark · pup_named
(function (SC) {
  // 동료가 그 자리에 있는가: 함께 다니거나, 헤어졌어도 그 일 때문에 달려오는 경우 (어머니를 구하러 오는 세나, 누이를 구하러 오는 브란)
  const SENA_AT = { or: [{ party: 'sena' }, { flag: 'sena_parted' }, { flag: 'sena_left' }, { flag: 'sena_bench' }] };
  const BRAN_AT = { or: [{ party: 'bran' }, { flag: 'bran_parted' }, { flag: 'bran_left' }, { flag: 'bran_bench' }] };
  // 그림자가 브란을 부른다: 그가 곁에 있고, 호감이 낮거나 그대가 장부를 지니고 있을 때
  const BRAN_CALLED = { party: 'bran', or: [{ max: { ap_bran: 2 } }, { flag: 'ledger_kept' }] };
  const SENA_COMES = [{ id: 'sena', if: { any: ['sena_parted', 'sena_left', 'sena_bench'] } }];
  const BRAN_COMES = [{ id: 'bran', if: { any: ['bran_parted', 'bran_left', 'bran_bench'] } }];

  // ───────────────────────── 장과 지역
  SC.chapters.push({
    n: 2, title: '회색 사냥꾼', start: 'c2_start', after: 'ford',
    endArt: { sky: 'dawn', bg: 'ford', actors: [{ k: 'hero', x: 0.5 }] },
    summary: [
      { label: '회색 여울', cases: [
          { if: { flag: ['anchor_broken', 'ford_defended'] }, t: '닻돌이 부서지고, 사냥의 밤을 함께 버텨 낸 마을 사람들이 낙인에서 깨어났다' },
          { if: { flag: 'anchor_broken' }, t: '닻돌이 부서져 마을 사람들이 깨어났지만, 사냥의 밤에 집 몇 채를 잃었다' },
          { if: { flag: 'ford_burned' }, t: '닻돌은 그대로다. 사냥의 밤에 마을 절반이 불탔다' }
        ], else: '닻돌은 그대로다. 사람들은 여전히 말없이 일한다' },
      { label: '토빈', cases: [
          { if: { flag: 'tobin_mother' }, t: '어머니와 함께 깨어난 마을에서 산다' },
          { if: { flag: 'tobin_saved' }, t: '고개에서 구해 낸 소년. 회색 여울에 산다' }
        ], else: '순찰병에게 끌려갔다' },
      { label: '브리타', cases: [
          { if: { flag: 'brita_saved', party: 'bran' }, t: '브란의 누이. 낙인에서 풀려나 브란과 다시 만났다' },
          { if: { flag: 'brita_saved' }, t: '채석장에서 풀려났다. 오빠 브란의 소식을 묻는다' }
        ], else: '채석장에서 여전히 돌을 나른다' },
      { label: '리네 (세나의 어머니)', cases: [
          { if: { flag: 'rine_freed' }, t: '낙인에서 풀려나 딸과 다시 만났다' },
          { if: { flag: 'rine_slain' }, t: '회색 눈의 추적자로 쓰러졌다' },
          { if: { flag: 'rine_lost' }, t: '사냥꾼의 품으로 달아났다. 아직 낙인에 묶여 있다' }
        ], else: '만나지 못했다' },
      { label: '사냥 대장 바스크', cases: [
          { if: { flag: ['vask_down', 'vask_doubt'] }, t: '쓰러뜨렸다. 사냥꾼이 그를 돌아보지도 않는 것을 보고, 그의 믿음이 흔들렸다' },
          { if: { flag: 'vask_down' }, t: '산장에서 쓰러뜨렸다. 쓰러지며 뿔피리를 불었다' },
          { if: { flag: 'vask_won' }, t: '그대를 쓰러뜨리고 뿔피리를 불었다. 아직 사냥꾼을 섬긴다' }
        ], else: '-' },
      { label: '첫 번째 조각', cases: [
          { if: { flag: ['shard1', 'stag_blessed'] }, t: '고요의 조각. 흰 사슴 엘른이 그대를 인정했다' },
          { if: { flag: 'shard1' }, t: '고요의 조각을 손에 넣었다' }
        ], else: '-' },
      { label: '회색 사냥꾼', cases: [
          { if: { flag: 'irvan_offer_asked' }, t: '이르반. 엘레우스의 사냥꾼장. 그가 왜 세상을 묶으려 하는지 들었다' },
          { if: { flag: 'irvan_offer_wavered' }, t: '이르반. 그의 손을 뿌리치지 못했다' },
          { if: { flag: 'irvan_offer_refused' }, t: '이르반. 그의 손을 뿌리쳤다' }
        ], else: '이르반이라는 이름을 알았다' },
      { label: '사냥꾼의 낙인', cases: [
          { if: { flag: 'hunter_mark' }, t: '그림자가 손등에 회색 자국을 남겼다. 아직 아무 소리도 들리지 않는다' }
        ], else: '없음' },
      { label: '새끼', cases: [
          { if: { flag: 'pup_named' }, t: '{pup}. 그대 곁에서 자라 길을 찾는다' },
          { if: { item: '잿빛 새끼' }, t: '그대 곁에서 자란다' }
        ], else: '-' },
      { label: '오르덴', cases: [
          { if: { flag: 'orden_dead' }, t: '그대의 손에 쓰러졌다' },
          { if: { flag: ['orden_parted', 'orden_oath_broken'] }, t: '그대와 맞선 끝에 맹세를 내려놓고 관문으로 돌아갔다' },
          { if: { flag: 'orden_parted' }, t: '그대와 헤어져 관문을 지킨다' },
          { if: { flag: 'orden_joins', not: 'orden_gone' }, t: '맹세를 지켜 그대와 함께 동쪽까지 왔다' }
        ], else: '관문을 지키는 문지기로 남았다' },
      { label: '세나', cases: [
          { if: { flag: 'sena_dead' }, t: '그대의 손에 쓰러졌다' },
          { if: { flag: 'sena_hostile' }, t: '그대를 원망한다. 어디선가 그대를 겨누고 있을지 모른다' },
          { if: { flag: ['sena_left', 'rine_slain'] }, t: '어머니를 묻고 그대 곁을 떠났다' },
          { if: { flag: 'sena_left' }, t: '그대 곁을 떠나 있다' },
          { if: { flag: 'sena_parted' }, t: '그대와 헤어져 지낸다' },
          { if: { flag: 'sena_met' }, t: '그대와 함께한다' }
        ], else: '만나지 못했다' },
      { label: '브란', cases: [
          { if: { flag: 'bran_dead' }, t: '그대의 손에 쓰러졌다' },
          { if: { flag: ['bran_hostile', 'bran_turned'] }, t: '사냥꾼의 부름에 답해 그림자 쪽으로 걸어갔다' },
          { if: { flag: 'bran_hostile' }, t: '사냥꾼의 낙인에 다시 묶여 있다' },
          { if: { flag: 'bran_left' }, t: '그대 곁을 떠나 있다' },
          { if: { flag: 'bran_parted' }, t: '고향 회색 여울에서 지낸다' },
          { if: { flag: 'bran_met' }, t: '그대와 함께한다' }
        ], else: '만나지 못했다' },
      { label: '다음 길', cases: [], else: '두 번째 조각은 거울 호수 아래, 잠긴 왕도 아우렐리아에 있다' }
    ]
  });
  Object.assign(SC.regions, { east: { name: '동쪽 변경', wake: 'ford', wakeIf: { flag: 'done_c2_ford' }, wakeElse: 'gate' } });

  // 1장의 마지막 목표 대신: 2장으로 가는 안내 → 2장 목표 → 2장을 마친 뒤
  SC.goals.splice(SC.goals.length - 1, 1,
    { if: { not: 'ch2' }, t: '제1장 완료. 울음의 관문에서 동쪽 고개를 넘으면 제2장 「회색 사냥꾼」이 시작된다. 그 전에 자유롭게 사냥하며 힘을 길러도 된다.' },
    { if: { not: 'done_c2_ford' }, t: '잿빛 고개를 넘어 물레방아가 도는 마을, 회색 여울로 가라.' },
    { if: { not: ['grove_found', 'shard1'] }, t: '첫 번째 별의 조각은 침묵의 숲 가장 깊은 곳, 고요의 못에 있다. 숲에서 못으로 가는 길을 찾아라. (권장 레벨 6)' },
    { if: { not: 'shard1' }, t: '고요의 못에서 별의 조각을 찾아라. 흰 사슴이 못을 지킨다. (권장 레벨 7)' },
    { if: { not: 'done_c2_night' }, t: '조각의 빛이 사냥꾼의 눈에 띄었다. 회색 여울로 돌아가라.' },
    { if: { not: 'done_c2_end' }, t: '북쪽 사냥꾼의 산장으로 쳐들어가 사냥 대장 바스크를 쓰러뜨려라. (권장 레벨 8)' },
    { t: '제2장 완료. 두 번째 조각은 잠긴 왕도 아우렐리아에 있다. 제3장 「잠긴 왕도」는 준비 중이다 — 그때까지 동쪽 변경에서 사냥하며 힘을 기를 수 있다.' }
  );

  SC.quests.push(
    { name: '닻돌', if: { flag: 'done_c2_ford', not: 'anchor_broken' }, t: '회색 여울 사람들의 낙인은 낙인 채석장의 닻돌에 묶여 있다. 닻돌을 부수면 사람들이 깨어난다 (권장 레벨 6)' },
    { name: '고요의 못', if: { flag: 'done_c2_ford', not: ['grove_found', 'shard1'] }, t: '침묵의 숲에서 고요의 못으로 가는 길을 찾는다. 숲을 탐색하거나, 길을 비춰 줄 무언가가 있으면 좋다' },
    { name: '누이 브리타', if: { flag: 'brita_known', not: 'brita_saved' }, t: '브란의 누이 브리타가 낙인 채석장에서 돌을 나른다. 닻돌을 부수면 풀려난다' },
    { name: '회색 열병', if: { flag: 'q_fever', not: 'fever_cured' }, t: '여울의 아이들이 회색 열병을 앓는다. 침묵의 숲의 재 이끼 {@재 이끼}/3을 가져와 세나와 함께 약을 달인다' },
    { name: '대장장이의 부탁', if: { flag: 'q_osk', not: 'osk_done' }, t: '대장장이 오스크가 낙인석 조각 {@낙인석 조각}/3을 구한다. 채석장의 낙인공과 파수꾼이 지니고 있다' },
    { name: '회색 눈의 추적자', if: { flag: 'rine_seen', not: ['rine_freed', 'rine_slain', 'rine_lost'] }, t: '사냥의 밤, 세나의 어머니가 쓰던 깃털과 같은 화살이 날아왔다. 산장에 그 추적자가 있다' }
  );

  // 2장 야영 대화를 먼저 꺼낸다 (회색 여울의 '고요한 물' 여관에서)
  SC.camp.unshift('camp2_orden', 'camp2_sena', 'camp2_bran2', 'camp2_bran', 'camp2_pup');

  // ───────────────────────── 아이템
  Object.assign(SC.items, {
    '고요의 조각': { kind: '별의 조각', nosell: true, desc: '아스텔의 빛 한 조각. 손에 쥐면 세상의 소리가 한 박자 늦게 들린다' },
    '재 이끼': { kind: '재료', desc: '재가 쌓인 그늘에서 자라는 잿빛 이끼. 회색 열병을 다스린다' },
    '낙인석 조각': { kind: '재료', desc: '닻돌에서 떨어져 나온 회색 돌조각. 아직 미지근하다' },
    '여울 장화': { kind: '발', slot: 'feet', rar: 'uncommon', fx: { init: 1, save: 1 }, price: 60, desc: '여울 대장간의 징을 박은 장화. 물살에도 미끄러지지 않는다' },
    '사냥꾼의 가죽 장갑': { kind: '손', slot: 'hands', rar: 'uncommon', fx: { hit: 1 }, desc: '순찰병의 활 장갑. 손가락 끝이 닳아 반들거린다' },
    '재빛 가죽 갑옷': { kind: '방어구', slot: 'armor', rar: 'rare', ac: 3, fx: { init: 1, hide: true }, nosell: true, desc: '바스크의 사냥 갑옷. 재를 먹여 그림자에 녹아든다' },
    '사냥 대장의 뿔': { kind: '장신구', slot: 'trinket', rar: 'rare', fx: { init: 2, save: 1 }, nosell: true, desc: '바스크가 목에 걸던 짧은 뿔. 불면 사냥개들이 귀를 세운다' },
    '오스크의 강철 투구': { kind: '머리', slot: 'head', rar: 'rare', ac: 1, fx: { hp: 6, save: 1 }, nosell: true, desc: '낙인석을 녹여 섞은 강철로 두드린 투구. 속삭임이 스며들지 못한다' },
    '여울의 부적': { kind: '장신구', slot: 'trinket', rar: 'uncommon', fx: { check: 1, resist: ['psychic'] }, nosell: true, desc: '열병에서 깨어난 아이들이 엮어 준 갈대 부적' },
    '흰 사슴의 뿔 조각': { kind: '장신구', slot: 'trinket', rar: 'rare', fx: { hp: 6, init: 1 }, nosell: true, desc: '엘른이 스스로 내려놓은 뿔 끝. 고요한 숲의 냄새가 난다' },
    '깨진 뿔피리': { kind: '장신구', slot: 'trinket', rar: 'legendary', fx: { save: 2, resist: ['psychic'], death: true }, nosell: true, desc: '사냥꾼의 그림자가 깃들어 있던 뿔피리의 조각. 다시는 울리지 않는다' }
  });
  SC.items['회색 장부'].desc += '. 이름을 부르면 그 사람을 낙인에서 깨울 수 있을지도 모른다';

  // ───────────────────────── 적 (레벨 5~9)
  Object.assign(SC.enemies, {
    brandwolf: { art: 'brandwolf', name: '낙인 늑대', lv: 4, hp: 18, ac: 12, atk: 5, dmg: '1d8+2', xp: 9, gold: [2, 6], pack: true, init: 2,
      drops: [{ item: '은빛 물약', p: 0.08 }],
      desc: '목덜미에 회색 낙인이 박힌 늑대. 눈동자가 재처럼 희다. 무리 지어 사냥한다.' },
    patrol: { art: 'hunter', name: '회색 순찰병', people: true, lv: 5, hp: 26, ac: 14, atk: 6, dmg: '1d8+3', xp: 16, gold: [6, 14], row: 'back', ranged: true, init: 1,
      skills: [{ name: '회색 그물', p: 0.2, ranged: true, dmg: '1d4', onHit: { restrain: 1 } }],
      drops: [{ item: '은빛 물약', p: 0.2 }, { item: '사냥꾼의 가죽 장갑', p: 0.06, uniq: true }],
      desc: '사냥꾼의 변경을 도는 순찰병. 목에 낙인이 있고, 회색 깃의 화살을 쓴다.' },
    hawk: { art: 'hawk', name: '회색 매', lv: 5, hp: 16, ac: 15, atk: 6, dmg: '1d6+3', xp: 12, gold: [0, 3], fly: true, init: 4,
      skills: [{ name: '눈 쪼기', p: 0.3, dmg: '1d6+3', onHit: { weak: 1 } }],
      desc: '사냥꾼의 매. 날아서 어느 열이든 덮치고, 눈을 쪼아 겨냥을 흐린다.' },
    moths: { art: 'moths', name: '소리 먹는 나방 떼', lv: 5, hp: 20, ac: 12, atk: 5, dmg: '1d6+2', xp: 12, gold: [0, 2], fly: true, init: 2,
      skills: [{ name: '고요 가루', p: 0.3, dmg: '1d6', dtype: 'psychic', onHit: { weak: 1 } }],
      drops: [{ item: '재 이끼', p: 0.2 }],
      desc: '침묵의 숲의 나방 떼. 날갯짓 소리조차 먹어 치운다. 가루를 마시면 손끝이 굳는다.' },
    brandbear: { art: 'brandbear', name: '낙인 곰', lv: 6, hp: 44, ac: 13, atk: 7, dmg: '2d8+3', xp: 30, gold: [4, 10], big: true,
      skills: [{ name: '짓누르기', p: 0.25, dmg: '2d8+4', hit: -1, onHit: { prone: 1 } }],
      drops: [{ item: '야영 물자', p: 0.4 }, { item: '은빛 물약', p: 0.25 }],
      desc: '이마에 회색 낙인이 박힌 곰. 사냥꾼의 명령대로만 움직인다.' },
    mason: { art: 'acolyte', name: '낙인공', people: true, lv: 6, hp: 30, ac: 13, atk: 6, dmg: '1d8+3', xp: 24, gold: [8, 16], row: 'back', ranged: true,
      skills: [{ name: '회색 낙인 찍기', p: 0.3, ranged: true, dmg: '1d8', dtype: 'psychic', onHit: { weak: 2 } }],
      drops: [{ item: '낙인석 조각', p: 0.5 }, { item: '푸른 물약', p: 0.2 }],
      desc: '닻돌에 룬을 새기는 석공. 회색 빛을 손끝에 모아 낙인을 찍는다.' },
    golem: { art: 'statue', name: '닻돌 파수꾼', lv: 7, hp: 70, ac: 16, atk: 7, dmg: '2d8+4', xp: 60, gold: [0, 0], big: true, elite: true,
      resist: ['poison', 'psychic', 'cold'], vuln: ['thunder', 'lightning'],
      skills: [{ name: '돌주먹', p: 0.3, dmg: '2d8+4', hit: -1, onHit: { prone: 1 } }],
      drops: [{ item: '낙인석 조각', p: 1 }, { item: '낙인석 조각', p: 0.5 }],
      desc: '닻돌에서 깎아 낸 돌기사. 천둥과 번개에 금이 간다.' },
    stag: { art: 'stag', name: '흰 사슴 엘른', lv: 7, hp: 70, ac: 15, atk: 7, dmg: '2d6+3', xp: 50, gold: [0, 0], big: true, elite: true, init: 4,
      resist: ['radiant', 'psychic'],
      skills: [{ name: '뿔 들이받기', p: 0.3, dmg: '2d8+3', onHit: { prone: 1 } }],
      desc: '고요의 못을 지키는 흰 사슴. 발굽 소리조차 나지 않는다. 아스텔의 마지막 사자.' },
    tracker: { art: 'rine', name: '회색 눈의 추적자', people: true, lv: 7, hp: 48, ac: 15, atk: 7, dmg: '1d10+3', xp: 45, gold: [5, 15], row: 'back', ranged: true, elite: true, init: 3,
      skills: [{ name: '회색 화살', p: 0.3, ranged: true, dmg: '2d6+3', onHit: { restrain: 1 } }],
      desc: '회색 깃의 화살을 쓰는 여인. 눈동자가 재처럼 희다. 화살 깃의 매듭이 세나의 것과 똑같다.' },
    vask: { art: 'vask', name: '사냥 대장 바스크', people: true, lv: 8, hp: 120, ac: 16, atk: 8, dmg: '1d10+5', xp: 150, gold: [60, 90], boss: true, multi: 2, init: 2,
      skills: [
        { name: '사냥개를 부른다', p: 0.3, summon: 'brandwolf', once: true },
        { name: '회색 뿔피리', p: 0.2, debuff: { atk: -2, turns: 2 }, text: '바스크가 짧은 뿔을 분다. 낙인의 울림이 귓속을 긁는다! (2턴 동안 모두 명중 -2)' },
        { name: '창 던지기', p: 0.25, ranged: true, reach: true, dmg: '2d8+4' }
      ],
      drops: [{ item: '재빛 가죽 갑옷', p: 1, once: 'got_ash_armor' }, { item: '사냥 대장의 뿔', p: 1, once: 'got_vask_horn' }],
      desc: '사냥꾼의 변경을 다스리는 사냥 대장. 낙인이 없는 몇 안 되는 수하 — 스스로 사냥꾼을 따른다. 한 번에 두 번 찌른다.' },
    // 맞서게 된 동료 (2장의 세기)
    foe_bran2: { art: 'bran', name: '낙인 찍힌 브란', people: true, lv: 7, hp: 52, ac: 13, atk: 7, dmg: '1d10+3', dtype: 'fire', xp: 50, gold: [0, 0], row: 'back', ranged: true, elite: true, init: 1,
      skills: [{ name: '화염 파도', p: 0.3, dmg: '2d6+3', dtype: 'fire', sweep: true }, { name: '불씨 폭발', p: 0.25, ranged: true, dmg: '2d8', dtype: 'fire', onHit: { burn: 2 } }],
      desc: '목덜미에 새 낙인이 박힌 브란. 지진 손등 위로 회색 빛이 기어오른다. 불씨에 망설임이 없다.' },
    foe_sena2: { art: 'sena', name: '세나', people: true, lv: 7, hp: 48, ac: 15, atk: 8, dmg: '1d8+4', xp: 50, gold: [0, 0], row: 'back', ranged: true, elite: true, init: 3,
      skills: [{ name: '조준 사격', p: 0.3, ranged: true, dmg: '2d8+4' }, { name: '그물 화살', p: 0.2, ranged: true, dmg: '1d8', onHit: { restrain: 2 } }],
      desc: '활시위를 그대에게 겨눈 세나. 눈이 붉게 젖어 있다. 백발백중이다.' },
    foe_orden: { art: 'orden', name: '오르덴', people: true, lv: 8, hp: 92, ac: 17, atk: 8, dmg: '1d10+4', xp: 80, gold: [0, 0], elite: true, init: 0,
      skills: [{ name: '꿰뚫는 창', p: 0.3, reach: true, dmg: '2d10+4' }, { name: '맹세의 일격', p: 0.2, dmg: '2d8+4', onHit: { prone: 1 } }],
      desc: '장창을 그대에게 겨눈 맹세기사. 천 년의 맹세가 그 창끝에 실려 있다.' },
    shade: { art: 'shade', name: '사냥꾼의 그림자', lv: 9, hp: 130, ac: 16, atk: 9, dmg: '2d8+5', xp: 200, gold: [0, 0], boss: true, multi: 2, init: 3,
      resist: ['psychic', 'poison', 'cold'], vuln: ['radiant'],
      skills: [
        { name: '묶는 화살', p: 0.25, ranged: true, dmg: '2d6+3', onHit: { restrain: 2 } },
        { name: '회색 낙인', p: 0.2, debuff: { atk: -2, turns: 2 }, text: '그림자가 손을 뻗는다. 회색 빛이 모두의 손등을 스친다! (2턴 동안 모두 명중 -2)' },
        { name: '그림자 사냥개', p: 0.25, summon: 'brandwolf', once: true }
      ],
      desc: '뿔피리를 타고 건너온 회색 사냥꾼의 뜻. 사슴뿔 같은 그림자 관을 썼다. 별빛에 약하다.' }
  });

  // ───────────────────────── 이야기 전투
  const PATROL_FIGHT = {
    enemies: ['patrol', 'brandwolf', 'brandwolf'], noFlee: true, art: { sky: 'dusk', bg: 'slope', fx: ['ash'] },
    intro: '순찰병이 활을 들어 올렸다. 낙인 늑대들이 소년의 냄새를 따라 돌아선다!',
    win: {
      text: ['마지막 늑대가 쓰러지자, 순찰병은 뿔피리를 떨어뜨린 채 재 속으로 달아났다.', '바위 뒤에서 소년이 고개를 내밀었다. “…고마워요. 저는 토빈이에요.”'],
      fx: { set: ['tobin_saved'] }, log: '고개에서 순찰병을 물리치고 소년 토빈을 구했다.', next: 'map' },
    lose: {
      text: ['그대가 쓰러진 사이, 순찰병은 소년의 목덜미를 잡아 끌고 갔다. “사냥꾼께 바칠 이름이 하나 늘었군.”', '정신을 차렸을 때 고개에는 재만 내리고 있었다. 소년의 작은 발자국이 동쪽 마을로 이어져 있었다.'],
      fx: { set: ['tobin_taken'] }, log: '순찰병에게 쓰러졌다. 소년이 끌려갔다.', next: 'map' }
  };

  const ANCHOR_FIGHT = (alone) => ({
    enemies: alone ? ['golem'] : ['golem', 'mason'], noFlee: true, perPC: { hp: 15 }, art: { sky: 'dusk', bg: 'quarry', props: ['anchor'], fx: ['ash'] }, guestsIf: BRAN_COMES,
    intro: '닻돌이 웅웅 울었다. 돌에서 깎아 낸 파수꾼이 몸을 일으킨다!',
    win: {
      text: [
        '파수꾼이 무너지며 닻돌에 기대어 쓰러졌다. 그 무게에, 금이 간 닻돌이 둘로 쪼개졌다.',
        '회색 빛이 연기처럼 빠져나가 하늘로 흩어졌다. 채석장 곳곳에서, 돌을 나르던 사람들이 하나둘 손을 멈추고 자기 손을 내려다보았다.',
        { if: BRAN_AT, t: '돌을 진 여자 하나가 짐을 떨어뜨렸다. “…브란?” 브란이 달려가 그녀를 붙잡았다. “브리타.” 그 이름을 부르는 목소리가 갈라졌다.' },
        { if: { nor: [BRAN_AT], not: ['bran_dead', 'bran_hostile'] }, t: '돌을 나르던 여자 하나가 다가와 그대의 손을 잡았다. “브리타예요. 오빠가… 브란이라는 사람이 살아 있다면, 전해 주세요. 나는 괜찮다고.”' },
        { if: { flag: 'bran_dead' }, t: '돌을 나르던 여자 하나가 그대의 손을 잡았다. “브리타예요. 혹시… 브란이라는 사람을 본 적 있어요? 우리 오빠예요.” 그대는 대답할 수 없었다.' },
        { if: { flag: 'bran_hostile' }, t: '돌을 나르던 여자 하나가 그대에게 다가왔다. “브리타예요. 오빠가 사냥꾼 쪽에 있다는 소문을 들었어요.” 그녀가 그대의 눈을 들여다보았다. “…혹시, 만나면 데려와 줘요.”' }
      ],
      fx: { set: ['anchor_broken', 'ford_freed', 'brita_saved'], xp: 40 }, approve: { bran: 2, sena: 1 },
      log: '닻돌을 부숴 회색 여울 사람들을 낙인에서 깨웠다.', next: 'map' },
    lose: {
      text: ['돌주먹이 그대를 채석장 아래로 내던졌다. 닻돌은 여전히 웅웅 울고 있었다.', '그대를 끌어올린 것은 돌을 나르던 사람들이었다. 텅 빈 눈으로, 그러나 그대를 해치지 않고.'],
      log: '닻돌 파수꾼에게 쓰러졌다. 닻돌은 아직 서 있다.', next: 'map' }
  });

  const STAG_FIGHT = {
    enemies: ['stag'], noFlee: true, perPC: { hp: 12 }, art: { sky: 'night', bg: 'grove', fx: ['motes'] },
    intro: '흰 사슴이 고개를 숙였다. 뿔 끝에 별빛이 맺힌다. 소리 없는 싸움이 시작된다.',
    win: {
      text: [
        '엘른이 무릎을 꿇었다. 그러나 쓰러지지는 않았다. 사슴은 그대를 오래 바라보다가, 천천히 못가에서 비켜섰다.',
        '못 한가운데에서 조각 하나가 떠올랐다. 그것은 빛이라기보다 — 빛과 빛 사이의 고요처럼 보였다.'
      ],
      fx: { set: ['shard1', 'irvan_named', 'stag_hurt'], items: ['고요의 조각'], amp: { die: 10 }, mpFull: true, xp: 30 }, approve: { sena: -1 },
      log: '흰 사슴 엘른과 싸워 힘을 증명하고 첫 번째 조각을 얻었다.', next: 'c2_voice' },
    lose: {
      text: [
        '사슴의 뿔이 그대를 못가에 눕혔다. 그러나 엘른은 그대를 해치지 않았다. 사슴은 그대의 이마에 코끝을 대었다가, 숲 속으로 사라졌다.',
        '못 한가운데에서 조각 하나가 떠올라, 그대의 손바닥 위로 천천히 내려앉았다. 힘이 아니라 — 다른 무언가를 본 모양이었다.'
      ],
      fx: { set: ['shard1', 'irvan_named'], items: ['고요의 조각'], amp: { die: 10 }, mpFull: true },
      log: '흰 사슴에게 쓰러졌지만, 사슴은 그대에게 조각을 내주었다.', next: 'c2_voice' }
  };

  const NIGHT_FIGHT = (mods) => ({
    enemies: ['patrol', 'patrol', 'brandwolf'], noFlee: true, art: { sky: 'night', bg: 'ford', fx: ['ash'] },
    scale: ['brandwolf', 'hawk'], scaleFree: 1,
    intro: '횃불이 여울을 건너온다. 사냥꾼의 순찰대가 마을을 덮쳤다!',
    mods: mods || [],
    win: {
      text: [
        '마지막 순찰병이 여울물에 쓰러졌다. 남은 자들은 횃불을 버리고 북쪽 어둠 속으로 달아났다.',
        { if: { flag: 'anchor_broken' }, t: '깨어난 마을 사람들이 물레방아 아래 모여 그대를 바라보았다. 누군가 박수를 쳤고, 곧 모두가 따라 쳤다. 이 마을에서 처음 나는 소리였다.' },
        '쓰러진 순찰병의 품에서 지도 한 장이 나왔다. 북쪽 산등성이, 사냥꾼의 산장.',
        '그리고 그대는 보았다. 다리 기둥에 박힌 화살 하나. 회색 깃 — 그러나 깃을 묶은 매듭이 낯익었다.',
        { if: { party: 'sena' }, t: '세나가 그 화살을 뽑아 들고 굳어 버렸다. “이 매듭… 엄마 거예요. 엄마만 이렇게 묶었어요.”' }
      ],
      fx: { set: ['ford_defended', 'lodge_known', 'rine_seen'], xp: 30 },
      log: '사냥의 밤을 막아 냈다. 사냥꾼의 산장 위치를 알아냈다.', next: 'map' },
    lose: {
      text: [
        '그대가 쓰러진 사이 횃불이 지붕을 넘어갔다. 마을 절반이 불탄 새벽, 순찰대는 물러갔다.',
        '잿더미 속에서 지도 한 장과, 회색 깃의 화살 하나를 주웠다. 깃을 묶은 매듭이 낯익었다.',
        { if: { party: 'sena' }, t: '세나가 화살을 보고 하얗게 질렸다. “이 매듭… 엄마 거예요.”' }
      ],
      fx: { set: ['ford_burned', 'lodge_known', 'rine_seen'] },
      log: '사냥의 밤에 쓰러졌다. 마을 절반이 불탔다. 산장의 위치는 알아냈다.', next: 'map' }
  });

  const TRACKER_FIGHT = {
    enemies: ['tracker'], noFlee: true, perPC: { hp: 12 }, art: { sky: 'night', bg: 'lodge', fx: ['ash'] }, guestsIf: SENA_COMES,
    intro: '회색 눈의 추적자가 시위를 당겼다. 화살촉이 그대가 아니라 — 세나를 겨눈다.',
    special: [
      { id: 'arrow', label: '어머니의 화살촉으로 낙인을 끊는다', if: { or: [{ item: '세나 어머니의 화살촉' }, { flag: 'sena_sworn' }] }, below: 0.5, mp: 2, stat: 'class', dc: 15,
        dcMod: [{ if: { flag: 'anchor_broken' }, v: -3, why: '닻돌이 부서졌다' }, { if: SENA_AT, v: -3, why: '딸의 목소리' }, { if: { flag: 'mark_known' }, v: -2, why: '낙인의 비밀' }],
        note: '추적자 HP가 절반 이하일 때. 성공하면 죽이지 않고 끝낸다', fxText: '낙인이 끊어진다',
        outcome: 'freed', failText: '화살촉이 회색 빛에 튕겨 나갔다. 추적자의 눈이 다시 하얗게 굳는다.', failHp: -4 }
    ],
    win: {
      text: [
        '추적자가 쓰러졌다. 회색 눈이 천천히 감겼다.',
        { if: SENA_AT, t: '세나가 그 곁에 무릎을 꿇었다. 활을 떨어뜨린 손이 떨렸다. “…엄마.” 대답은 없었다.' },
        { if: { nor: [SENA_AT] }, t: '그녀의 화살통에는 매듭이 똑같은 화살이 한가득 들어 있었다. 그대는 그것을 세나에게 어떻게 전해야 할지 알 수 없었다.' }
      ],
      fx: { set: ['rine_slain'] }, approve: { sena: -3 },
      log: '회색 눈의 추적자를 쓰러뜨렸다.', next: 'c2_sena_grief' },
    freed: {
      text: [
        '화살촉이 낙인을 꿰뚫었다. 회색 빛이 금이 간 유리처럼 흩어졌고, 추적자의 눈에 서서히 색이 돌아왔다. 초록빛 — 세나와 똑같은.',
        { if: SENA_AT, t: '“…세나?” 여인이 활을 떨어뜨렸다. “세나, 너 많이 컸구나.” 세나는 대답 대신 어머니에게 달려가 안겼다. 둘 다 아무 말도 하지 않았다. 할 필요가 없었다.' },
        { if: { nor: [SENA_AT] }, t: '“…여기가 어디죠.” 여인이 그대의 손에 쥔 화살촉을 보았다. “그건… 내 딸에게 준 건데.” 그녀의 이름은 리네였다.' },
        { if: { any: ['sena_parted', 'sena_bench'] }, t: '세나가 어머니의 손을 꼭 쥔 채 그대를 보았다. “엄마는 마을로 보낼게요. 나는… 다시 같이 갈래요.”' },
        { if: { flag: 'sena_left' }, t: '세나가 어머니를 부축하며 그대를 돌아보았다. “…고마워요. 진심이에요.” 그러나 그녀는 어머니와 함께 산을 내려갈 것이다.' },
        '리네가 산장 안쪽을 가리켰다. “바스크는 트로피 전당에 있어요. 그리고 뿔피리 — 절대 불게 해서는 안 돼요.”'
      ],
      fx: { set: ['rine_freed'], xp: 45 }, approve: { sena: 4 }, fxIf: [{ if: { any: ['sena_parted', 'sena_bench'] }, fx: { comp: { sena: 'party' } } }],
      log: '세나의 어머니 리네의 낙인을 끊었다.', next: 'c2_vask' },
    lose: {
      text: ['화살이 그대를 바닥에 꿰어 놓았다. 추적자는 그대를 내려다보다가, 활을 거두고 산장 안으로 사라졌다.'],
      fx: { set: ['rine_lost'], hp: 6 }, log: '추적자에게 쓰러졌다. 그녀는 산장 안으로 사라졌다.', next: 'c2_vask' }
  };

  const BRAN2_FIGHT = {
    enemies: ['foe_bran2', 'mason'], noFlee: true, art: { sky: 'dusk', bg: 'quarry', props: ['anchor'], fx: ['ash'] },
    intro: '브란이 지팡이를 들었다. 그 눈에 그대를 알아보는 빛이 없다.',
    win: { text: ['브란이 무릎을 꿇었다. 지팡이 끝의 불씨가 꺼졌다. 목덜미의 새 낙인이 맥박처럼 깜박였다.'], log: '낙인 찍힌 브란을 쓰러뜨렸다.', next: 'c2_bran_judge' },
    lose: { text: ['불길이 그대를 채석장 비탈 아래로 밀어냈다. 브란은 그대를 내려다보다가, 그렐의 손짓에 등을 돌렸다.'],
      fx: { set: ['bran_confronted'] }, log: '낙인 찍힌 브란에게 쓰러졌다.', next: 'map' }
  };
  const SENA2_FIGHT = (next) => ({
    enemies: ['foe_sena2'], noFlee: true, perPC: { hp: 10 }, art: { sky: 'night', bg: 'lodge', fx: ['ash'] },
    intro: '세나가 시위를 당겼다. 화살촉이 그대의 심장을 겨눈다.',
    win: { text: ['세나의 활이 부러졌다. 그녀는 무릎을 꿇은 채 그대를 노려보았다. 울음을 삼키는 소리가 났다.'], log: '세나를 쓰러뜨렸다.', next: next === 'grief' ? 'c2_sena_judge' : 'c2_sena_judge2' },
    lose: { text: ['화살이 그대를 땅에 꿰어 놓았다. 세나는 그대를 내려다보다가, 활을 거두고 어둠 속으로 사라졌다.'],
      fx: { comp: { sena: 'hostile' } }, log: '세나에게 쓰러졌다. 그녀는 그대를 원망하며 떠났다.', next: next === 'grief' ? 'c2_vask' : 'c2_lodge' }
  });
  const ORDEN_FIGHT = {
    enemies: ['foe_orden'], noFlee: true, perPC: { hp: 15 }, art: { sky: 'dawn', bg: 'lodge', fx: ['ash'] },
    intro: '오르덴이 장창을 비껴 들었다. “맹세에 따라.”',
    win: { text: ['장창이 땅에 떨어졌다. 오르덴이 한쪽 무릎을 꿇었다. 갑주의 틈으로 숨이 거칠게 새어 나왔다.'], log: '오르덴을 쓰러뜨렸다.', next: 'c2_orden_judge' },
    lose: { text: ['장창의 자루가 그대를 땅에 눕혔다. 오르덴은 그대를 내려다보았다. “…그대를 죽이는 것은 맹세가 아니다.” 그는 창을 거두고 서쪽으로 걸어갔다.'],
      fx: { comp: { orden: 'parted' }, set: ['orden_oath_broken'] }, log: '오르덴에게 쓰러졌다. 그는 관문으로 돌아갔다.', next: 'c2_after' }
  };

  const VASK_FIGHT = {
    enemies: ['vask'], noFlee: true, perPC: { hp: 25 }, extraTurn: 2, art: { sky: 'night', bg: 'lodge', props: ['trophies'] },
    scale: ['patrol', 'brandwolf'], scaleFree: 1,
    intro: '바스크가 사냥 창을 비껴 들었다. “사냥감이 제 발로 들어오다니. 사냥꾼께서 기뻐하시겠군.”',
    mods: [
      { if: { flag: 'rine_freed' }, ac: -1, why: '리네가 바스크의 버릇을 알려 준다 (방어 -1)' },
      { if: { flag: 'ford_defended' }, hp: -15, why: '사냥의 밤에 입은 상처 (HP -15)' },
      { if: { flag: 'lodge_ambush' }, hp: -10, why: '뒤를 잡혔다 (HP -10)' }
    ],
    win: {
      text: [
        '바스크가 무릎을 꿇었다. 사냥 창이 손에서 미끄러졌다. 그는 피 묻은 입으로 웃더니, 허리에 찬 커다란 뿔피리를 입에 가져갔다.',
        '“너는 사냥꾼을 모른다, 별의 아이야. 그분은… 이미 여기 계신다.”'
      ],
      fx: { set: ['vask_down'] }, log: '사냥 대장 바스크를 쓰러뜨렸다. 그가 뿔피리를 불었다.', next: 'c2_horn' },
    lose: {
      text: [
        '바스크의 창이 그대를 트로피 벽에 꿰어 놓았다. 그는 천천히 다가와, 허리에 찬 커다란 뿔피리를 들어 올렸다.',
        '“사냥꾼께서 직접 보고 싶어 하실 거다.”'
      ],
      fx: { set: ['vask_won'], hp: 10 }, log: '바스크에게 쓰러졌다. 그가 뿔피리를 불었다.', next: 'c2_horn' }
  };

  const SHADOW_FIGHT = {
    enemies: ['shade'], noFlee: true, boss: true, perPC: { hp: 20 }, extraTurn: 2, art: { sky: 'night', bg: 'lodge', props: ['trophies'] },
    scale: ['brandwolf'], scaleFree: 2,
    intro: '뿔피리 소리가 트로피 전당을 가득 메웠다. 그 소리 속에서, 사슴뿔 관을 쓴 회색 그림자가 걸어 나온다.',
    mods: [
      { if: { flag: 'alpha_freed' }, atk: -1, why: '먼 산에서 자유로운 울음이 들린다 — 그림자의 사냥개들이 귀를 접는다 (명중 -1)' },
      { if: { flag: 'stag_blessed' }, hp: -20, why: '엘른의 축복이 그림자를 갉아먹는다 (HP -20)' }
    ],
    special: [
      { id: 'still', label: '고요의 조각으로 뿔피리를 깬다', if: { flag: 'shard1' }, below: 0.5, mp: 3, stat: 'class', dc: 16,
        dcMod: [{ if: { flag: 'rine_freed' }, v: -2, why: '리네가 뿔피리의 약점을 안다' }, { if: { flag: 'anchor_broken' }, v: -2, why: '닻돌이 부서졌다' },
          { if: { flag: 'stag_blessed' }, v: -2, why: '흰 사슴의 축복' }, { if: { item: '잿빛 털 한 줌' }, v: -2, why: '자유로운 짐승의 털' }],
        note: '그림자 HP가 절반 이하일 때. 성공하면 뿔피리를 깨뜨려 끝낸다', fxText: '뿔피리가 갈라진다',
        outcome: 'broken', failText: '조각이 손 안에서 차갑게 식었다. 뿔피리 소리가 다시 커진다.', failHp: -5 }
    ],
    win: {
      text: [
        '그림자가 흩어졌다. 그러나 뿔피리는 여전히 바닥에서 낮게 울고 있었다. 그대는 그것을 발로 밟아 부쉈다.',
        '흩어지던 회색 연기가 마지막으로 한데 모여, 사람의 얼굴 모양을 빚었다.'
      ],
      fx: { set: ['shade_down'], xp: 80 }, log: '사냥꾼의 그림자를 흩어 버렸다.', next: 'c2_end' },
    broken: {
      text: [
        '그대가 조각을 뿔피리에 갖다 대자, 세상의 소리가 한 박자 늦게 들렸다. 그리고 그 한 박자의 고요 속에서 — 뿔피리가 소리 없이 갈라졌다.',
        '그림자가 비명도 없이 무너졌다. 깨진 뿔피리 조각 하나가 그대의 발치로 굴러왔다.',
        '흩어지던 회색 연기가 마지막으로 한데 모여, 사람의 얼굴 모양을 빚었다.'
      ],
      fx: { set: ['shade_down', 'horn_broken'], items: ['깨진 뿔피리'], xp: 100 }, approve: { bran: 2 },
      log: '고요의 조각으로 사냥꾼의 뿔피리를 깨뜨렸다.', next: 'c2_end' },
    lose: {
      text: [
        '그림자의 손이 그대의 손등에 닿았다. 얼음 같은 회색 빛이 살갗 아래로 파고들었다 — 그리고 멈췄다. 품 안의 조각이 그것을 막아선 것이다.',
        '그림자가 웃었다. “아직은 아니로군.” 뿔피리 소리가 잦아들며 그림자도 흩어졌다. 손등에는 회색 자국 하나가 남았다.'
      ],
      fx: { set: ['shade_won', 'hunter_mark'], hp: 10 }, log: '그림자에게 쓰러졌다. 손등에 회색 자국이 남았다.', next: 'c2_end' }
  };

  const SHADOW_BRAN_FIGHT = Object.assign({}, SHADOW_FIGHT, {
    enemies: ['shade', 'foe_bran2'], scaleFree: 3,
    intro: '브란이 그림자 곁에 섰다. 목덜미에 회색 낙인이 다시 피어올랐다. 그림자의 사냥개들이 연기 속에서 튀어나온다.',
    win: Object.assign({}, SHADOW_FIGHT.win, { next: 'c2_bran_judge_horn' }),
    broken: Object.assign({}, SHADOW_FIGHT.broken, { next: 'c2_bran_judge_horn' }),
    lose: Object.assign({}, SHADOW_FIGHT.lose, { text: SHADOW_FIGHT.lose.text.concat(['그림자가 흩어질 때, 브란도 함께 연기 속으로 사라졌다.']), fx: { set: ['shade_won', 'hunter_mark'], hp: 10 } })
  });

  // ───────────────────────── 사건
  Object.assign(SC.events, {
    // 1장의 관문에서 동쪽으로 (장을 시작한다)
    c2_start: {
      chapter: 2,
      art: { sky: 'dawn', bg: 'gate', actors: [{ k: 'hero', x: 0.42 }, { k: 'orden', x: 0.6, face: -1 }] },
      title: '제2장 · 동쪽으로',
      clock: '회색 사냥꾼',
      place: '울음의 관문',
      text: [
        '비가 그친 지 며칠. 관문의 돌계단은 햇빛 아래 하얗게 말라 갔다.',
        '그러나 동쪽 하늘은 맑지 않았다. 고개 너머로 회색 구름이 낮게 깔려 있었고, 바람이 불 때마다 눈송이 같은 것이 날아왔다. 손바닥에 받아 보니 — 재였다.',
        { if: { flag: 'star_map' }, t: '첫 번째 조각은 동쪽, 침묵의 숲에 있다. 새벽 별자리가 그렇게 말했다.' },
        { if: { not: 'star_map' }, t: '{relic:이} 동쪽을 가리키며 희미하게 떨렸다.' },
        { if: { party: 'orden', flag: 'orden_joins' }, t: '오르덴이 장창을 어깨에 걸쳤다. “천 년 동안 이 문 안쪽만 보았다. 바깥은 어떤지 보고 싶군.”' },
        { if: { nor: [{ party: 'orden', flag: 'orden_joins' }], not: ['orden_parted', 'orden_dead'] }, t: '오르덴은 문 앞에 남았다. “조각을 찾거든 돌아와 들려다오. 나는 여기서 기다리겠다.” 그는 장창으로 땅을 한 번 내리찍었다.' },
        { if: { flag: 'orden_parted' }, t: '오르덴은 문 앞에서 그대를 배웅했다. 헤어질 때 한 말 그대로, 문은 그대를 향해 열려 있었다.' },
        { if: { any: ['sena_parted', 'sena_left'] }, t: '세나는 마을에 남아 있다. 떠나기 전, 그녀의 오두막 쪽을 한 번 돌아보았다.' },
        { if: { flag: 'bran_parted' }, t: '브란은 먼저 동쪽으로 떠났다. 고향으로 간다고 했었다.' },
        { if: { flag: 'bran_hostile' }, t: '고개 너머 어딘가에, 그대를 저주하며 사냥개들과 사라진 회색 두건의 사내가 있다.' },
        { if: { party: 'sena' }, t: '세나가 활시위를 새로 갈아 끼웠다. “할머니가 그랬어요. 재가 내리는 곳에는 가지 말라고.” 그러고는 씩 웃었다. “그러니까 가 봐야죠.”' },
        { if: { party: 'bran' }, t: '브란은 재가 날아오는 쪽을 오래 바라보았다. “저 고개 너머가 내 고향이오.” 그는 더 말하지 않았다.' },
        { if: { item: '잿빛 새끼' }, t: '그대의 발치에서 새끼가 재 냄새를 맡더니, 귀를 바짝 세웠다. 처음 만났을 때보다 한 뼘은 자라 있었다.' }
      ],
      choices: [
        { id: 1, label: '동쪽 고개로 걸음을 옮긴다', roll: false,
          then: {
            text: ['그대는 관문을 등지고 동쪽으로 걸었다. 반나절이 지나자 발밑의 돌이 잿빛으로 바뀌었다. 사냥꾼의 땅이었다.'],
            fx: { goto: 'pass' }, log: '울음의 관문을 떠나 동쪽 변경으로 향했다.', next: 'c2_pass' } }
      ]
    },

    // ───────────────────────── 잿빛 고개
    c2_pass: {
      place: '잿빛 고개',
      art: { sky: 'dusk', bg: 'slope', actors: [{ k: 'hero', x: 0.22 }, { k: 'boy', x: 0.42 }, { k: 'brandwolf', x: 0.7, face: -1 }, { k: 'hunter', x: 0.86, face: -1 }], fx: ['ash'] },
      title: '재가 내리는 고개',
      clock: '동쪽 변경',
      text: [
        '고개에는 소리 없이 재가 내렸다. 발자국마다 회색 먼지가 피어올랐다.',
        '그때, 바위 사이에서 누군가 굴러떨어졌다. 열 살 남짓한 소년이었다. 목덜미에 회색 자국이 반쯤 새겨져 있었다 — 다 찍히지 않은 낙인.',
        '“살려 주세요…!” 소년의 등 뒤로 늑대들의 흰 눈이 번득였다. 그 뒤에서 회색 망토의 순찰병이 활을 들고 천천히 걸어 나왔다.',
        '“낙인이 덜 찍힌 놈 하나가 도망쳤을 뿐이다, 나그네. 비켜라. 사냥꾼의 일이다.”',
        { if: { any: ['alpha_fled', 'hunter_saw'] }, t: '순찰병의 눈이 그대의 {relic}에 머물렀다. 그의 입꼬리가 올라갔다. “…아니, 운이 좋군. 둘 다 데려가면 되겠어.”' }
      ],
      choices: [
        { id: 1, insp: 'brave', label: '소년을 등 뒤로 숨기고 순찰병과 맞선다', roll: false, approve: { sena: 1, bran: 1 },
          then: { text: ['그대는 소년 앞을 막아섰다. 순찰병이 혀를 차며 시위를 당겼다.'], battle: PATROL_FIGHT, next: 'map' } },
        { id: 2, skill: '은신', insp: 'sly', label: '소년을 안고 바위틈으로 숨어든다', stat: '민첩', dc: 13,
          adv: [{ if: { item: '잿빛 새끼' }, why: '새끼가 늑대들의 냄새를 흐린다' }],
          note: '실패하면 들킨다',
          success: {
            text: ['그대는 소년의 입을 막고 바위틈에 몸을 밀어 넣었다. 늑대들의 코가 바로 옆을 지나갔다. 재가 그대들의 냄새를 덮었다.', '순찰병은 한참 두리번거리다가 고개 너머로 사라졌다. 소년이 떨리는 목소리로 속삭였다. “…저는 토빈이에요.”'],
            fx: { set: ['tobin_saved'], xp: 10 }, log: '소년을 데리고 바위틈에 숨어 순찰병을 따돌렸다.', next: 'map' },
          fail: { text: ['발밑의 돌이 굴러떨어졌다. 늑대들이 일제히 고개를 돌렸다!'], battle: PATROL_FIGHT, log: '숨는 데 실패했다.', next: 'map' } },
        { id: 3, skill: '기만', insp: 'sly', label: '사냥꾼의 사람인 척 소년을 넘겨받는다', stat: '매력', dc: 14,
          adv: [{ if: { party: 'bran' }, why: '브란이 추종자의 말투와 표식을 안다' }],
          dcMod: [{ if: { item: '회색 두건' }, v: -2, why: '추종자의 두건' }],
          note: '성공하면 싸우지 않고, 순찰대의 암호를 알아낸다',
          success: {
            text: [
              '“사냥꾼께서 이 아이를 직접 보시겠다고 했다. 내가 데려간다.” 그대의 목소리는 놀랄 만큼 차분했다.',
              { if: { party: 'bran' }, t: '브란이 손등의 지진 자국을 순찰병에게 보였다. 순찰병은 그것을 낙인으로 착각한 듯, 고개를 숙였다.' },
              '순찰병이 투덜거리며 늑대들을 물렸다. “잿빛 바람이 불면 문이 열린다. 산장 문지기에게 그렇게 말해.” 그것이 암호였다.'
            ],
            fx: { set: ['tobin_saved', 'ash_word'], xp: 12 }, log: '사냥꾼의 사람인 척 소년을 넘겨받고, 순찰대의 암호를 알아냈다.', next: 'map' },
          fail: { text: ['순찰병이 눈을 가늘게 떴다. “사냥꾼의 사람이라면 낙인이 있어야지.” 늑대들이 으르렁거렸다.'], battle: PATROL_FIGHT, log: '속임수가 들통났다.', next: 'map' } },
        { id: 4, insp: 'wild', label: '잿빛 털 한 줌을 꺼내 늑대들에게 보인다', roll: false, requires: { item: '잿빛 털 한 줌' }, reqText: '잿빛 털 한 줌',
          note: '해방된 우두머리의 냄새',
          then: {
            text: [
              '그대가 잿빛 털을 바람에 날리자, 낙인 늑대들이 일제히 멈춰 섰다. 우두머리의 냄새 — 낙인 없이 자유로운 냄새였다.',
              '늑대들이 귀를 접고 뒷걸음질 쳤다. 순찰병이 아무리 소리쳐도 다시 다가오지 않았다. 혼자 남은 순찰병은 욕설을 내뱉고 고개 너머로 달아났다.',
              '소년이 그대의 소매를 붙잡았다. “…저는 토빈이에요. 회색 여울에서 왔어요.”'
            ],
            fx: { set: ['tobin_saved'], xp: 12 }, approve: { sena: 1 }, log: '자유로운 우두머리의 냄새로 낙인 늑대들을 물렸다.', next: 'map' } }
      ]
    },

    // ───────────────────────── 회색 여울
    c2_ford: {
      art: { sky: 'dusk', bg: 'ford', actors: [{ k: 'hero', x: 0.2 }, { k: 'villager', x: 0.5, face: -1 }, { k: 'villager', x: 0.64, face: -1 }, { k: 'smith', x: 0.8, face: -1 }], fx: ['ash'] },
      title: '회색 여울',
      clock: '낙인의 마을',
      text: [
        '물레방아가 도는 마을이었다. 그러나 마을은 조용했다. 너무 조용했다.',
        '사람들은 일하고 있었다. 물을 긷고, 돌가루를 체에 거르고, 물레방아 아래에서 회색 돌을 갈았다. 말 한마디 없이, 눈도 마주치지 않고. 모두의 목덜미에 회색 낙인이 있었다.',
        { if: { flag: 'tobin_saved' }, t: '토빈이 한 여인에게 달려갔다. “엄마!” 여인은 아이를 내려다보았지만, 그 눈에는 아무것도 비치지 않았다. 아이가 울음을 터뜨렸다.' },
        { if: { flag: 'tobin_taken' }, t: '물레방아 옆의 여인 하나가 고개 쪽을 바라보고 서 있었다. 무언가를 기다리는 것처럼. 그대는 그녀가 누구를 기다리는지 알 것 같았다.' },
        { if: { flag: 'ledger_burned' }, t: '그런데 몇몇은 달랐다. 대장간의 사내, 우물가의 노인 — 그들의 낙인은 색이 바래 있었고, 그대를 보는 눈에는 빛이 있었다. 회색 장부가 불탄 밤, 그들의 이름도 함께 탄 것이다.' },
        '대장간에서 망치 소리가 울렸다. 이 마을에서 유일하게 나는 소리였다. 망치를 든 사내가 그대를 보더니 손을 멈추었다. “…낙인이 없는 사람이군. 오랜만이오.”',
        { if: { party: 'bran' }, t: '브란이 걸음을 멈췄다. 그의 얼굴에서 핏기가 가셨다. “…여기가 내 고향이오. 회색 여울.”' }
      ],
      choices: [
        { id: 1, skill: '설득', insp: 'song', label: '대장장이와 이야기를 나눈다', stat: '매력', dc: 11,
          adv: [{ if: { flag: 'ledger_burned' }, why: '장부가 불탄 덕에 깨어 있는 사람' }],
          note: '성공하면 이 마을의 비밀을 듣는다',
          success: {
            text: [
              '대장장이의 이름은 오스크였다. 그는 망치를 내려놓고, 뜨거운 쇳물에 덴 손등을 보여 주었다. 낙인이 있던 자리였다. “쇳물에 데면 낙인이 흐려지오. 아픔이 사람을 깨우는 거지.”',
              '“사람들의 낙인은 채석장의 닻돌에 묶여 있소. 낙인공들이 그 돌에 이름을 새기면, 이 마을 사람 하나가 또 잠드오. 닻돌을 부수면 — 모두 깨어날 거요.”',
              '오스크가 그대의 손을 덥석 잡았다. “부탁이 하나 더 있소. 닻돌 조각을 구해 오면, 속삭임이 스며들지 못하는 강철을 두드려 주겠소.”'
            ],
            fx: { set: ['anchor_known', 'q_osk'], xp: 8 }, log: '대장장이 오스크에게서 닻돌 이야기를 들었다.', next: 'map' },
          fail: {
            text: ['오스크는 그대를 오래 쳐다보다가, 다시 망치를 들었다. “…채석장. 닻돌.” 그 두 마디뿐이었다.', '망치 소리가 다시 울렸다. 대장장이의 눈은 무언가를 두려워하고 있었다.'],
            fx: { set: ['anchor_known'] }, log: '대장장이에게서 겨우 두 마디를 들었다. 채석장, 닻돌.', next: 'map' } },
        { id: 2, skill: '통찰', insp: 'mercy', label: '토빈의 어머니 곁에 앉아 낙인을 살핀다', stat: '지혜', dc: 12, requires: { flag: 'tobin_saved' }, reqText: '토빈을 구했다',
          adv: [{ if: { party: 'sena' }, why: '세나가 낙인의 병을 안다' }],
          note: '성공하면 낙인이 어디에 묶였는지 안다',
          success: {
            text: ['여인의 낙인은 맥박처럼 희미하게 고동쳤다. 그리고 그 고동은 — 북서쪽, 채석장 쪽에서 오는 무언가와 박자가 맞았다.', '“엄마는 돌아올 수 있어요?” 토빈이 물었다. 그대는 고개를 끄덕였다. 그 약속을 지켜야 했다.'],
            fx: { set: ['anchor_known'], xp: 8 }, approve: { sena: 1 }, log: '낙인이 채석장 쪽에 묶여 있음을 알아냈다.', next: 'map' },
          fail: {
            text: ['낙인은 그대가 손을 대자 차갑게 식었다. 여인이 몸을 떨었다. 토빈이 그대의 손을 밀어냈다.', '대장장이가 멀리서 말했다. “닻돌을 부수기 전엔 소용없소.”'],
            fx: { set: ['anchor_known'] }, log: '낙인을 살피다 여인을 아프게 했다. 대장장이가 닻돌을 말했다.', next: 'map' } },
        { id: 3, label: '회색 장부를 펼쳐 토빈 어머니의 이름을 부른다', roll: false, requires: { item: '회색 장부' }, reqText: '회색 장부',
          approve: { bran: -2, sena: 1 },
          then: {
            text: [
              '장부에는 이 마을 사람들의 이름이 빽빽했다. 그대는 손가락으로 줄을 따라 내려가 ‘마렌의 아내, 하나’라는 줄을 찾았다.',
              '“하나.” 그대가 그 이름을 부르자, 여인의 눈동자가 떨렸다. 낙인이 연기처럼 흐려졌다. “…토빈?” 아이가 어머니의 품으로 뛰어들었다.',
              { if: { party: 'bran' }, t: '브란은 그 장면을 보지 않았다. “사냥꾼도 그렇게 이름을 불렀소.” 그가 낮게 말했다. “이름을 쥔 자가 사람을 깨우기도 하고, 재우기도 하지.”' },
              '대장장이가 다가와 장부를 노려보았다. “그 책이 이 마을을 잠재웠소. 다른 사람들은… 닻돌을 부숴서 깨워 주시오.”'
            ],
            fx: { set: ['anchor_known', 'tobin_mother'], xp: 8 }, log: '회색 장부로 토빈의 어머니 하나의 이름을 불러 깨웠다.', next: 'map' } },
        { id: 4, label: '브란과 함께 그의 옛집으로 간다', roll: false, requires: { party: 'bran' }, reqText: '브란',
          approve: { bran: 2 },
          then: {
            text: [
              '물레방아 뒤편, 지붕이 내려앉은 집 한 채. 브란은 문턱 앞에서 오래 서 있다가 안으로 들어갔다.',
              '벽에는 아이 둘의 키를 잰 칼자국이 남아 있었다. 하나는 한참 높고, 하나는 낮았다. 낮은 쪽 옆에 서툰 글씨로 ‘브리타’라고 새겨져 있었다.',
              '“누이요. 내가 추종자가 되어 떠났을 때, 열두 살이었소.” 브란이 칼자국을 손끝으로 쓸었다. “사냥꾼은 나를 데려가는 대신 이 마을을 남겨 두겠다고 했지. 거짓말이었소.”',
              '이웃집 노인이 문가에서 말했다. 낙인이 바랜 노인이었다. “브리타는 채석장에 있소. 돌을 나르지.”'
            ],
            fx: { set: ['anchor_known', 'brita_known'], xp: 8 }, log: '브란의 옛집에서 누이 브리타가 채석장에 있다는 것을 들었다.', next: 'map' } }
      ]
    },

    // ───────────────────────── 낙인 채석장
    c2_quarry: {
      art: { sky: 'dusk', bg: 'quarry', props: ['anchor'], actors: [{ k: 'hero', x: 0.16 }, { k: 'villager', x: 0.32 }, { k: 'acolyte', x: 0.68, face: -1 }, { k: 'statue', x: 0.84, face: -1 }], fx: ['ash'] },
      title: '닻돌',
      clock: '낙인 채석장',
      text: [
        '채석장 한가운데에 회색 돌기둥 하나가 서 있었다. 사람 키의 세 배. 표면에는 이름이 빼곡히 새겨져 있었고, 그 이름들이 맥박처럼 희미하게 빛났다.',
        '돌을 나르는 사람들이 그 둘레를 돌고 있었다. 짐이 무거워 휘청거려도, 아무도 소리를 내지 않았다.',
        '닻돌 아래에서 낙인공 그렐이 끌을 두드리고 있었다. 끌이 한 번 내려칠 때마다 새 이름 하나가 빛났다. 그 곁에는 돌에서 깎아 낸 거대한 파수꾼이 서 있었다.',
        { if: { flag: 'brita_known' }, t: '짐꾼들 가운데, 짧게 깎은 머리의 여자 하나가 보였다. 칼자국 옆의 서툰 글씨가 떠올랐다. 브리타.' },
        { if: { party: 'bran' }, t: '브란이 이를 악물었다. “그렐… 저자가 내 손등에도 낙인을 새겼소.”' }
      ],
      choices: [
        { id: 1, insp: 'brave', label: '파수꾼과 낙인공을 쓰러뜨리고 닻돌을 부순다', roll: false, note: '전투 (파수꾼은 천둥과 번개에 약하다)',
          then: { text: ['그대가 걸어 나가자 그렐이 끌을 멈췄다. 파수꾼의 눈에 회색 빛이 켜졌다.'], battle: ANCHOR_FIGHT(false), next: 'map' } },
        { id: 2, skill: '비전', insp: 'lore', label: '닻돌의 룬을 거꾸로 읽어 금을 낸다', stat: '지혜', dc: 15,
          dcMod: [{ if: { flag: 'mark_known' }, v: -2, why: '낙인의 비밀' }, { if: { party: 'bran' }, v: -2, why: '낙인을 아는 브란' }, { if: { flag: 'shard1' }, v: -2, why: '고요의 조각' }],
          note: '성공하면 닻돌에 금이 가고, 파수꾼 혼자 남는다',
          success: {
            text: ['그대는 이름들 사이에 숨은 룬을 찾아, 그것을 거꾸로 읊었다. 닻돌 표면에 머리카락 같은 금이 번졌다.', '그렐이 비명을 지르며 끌을 떨어뜨리고 달아났다. 남은 것은 파수꾼뿐이었다.'],
            battle: ANCHOR_FIGHT(true), log: '닻돌의 룬을 거꾸로 읽어 금을 냈다. 낙인공이 달아났다.', next: 'map' },
          fail: { text: ['룬이 그대의 혀끝에서 뒤엉켰다. 닻돌이 웅웅 울었고, 그렐이 그대를 가리켰다. “잡아라!”'], fx: { hp: -4 }, battle: ANCHOR_FIGHT(false), log: '룬을 읽다 들켰다 (HP -4).', next: 'map' } },
        { id: 3, skill: '기만', insp: 'sly', label: '브란이 옛 추종자인 척 그렐에게 다가간다', stat: '매력', dc: 13, requires: { party: 'bran' }, reqText: '브란',
          adv: [{ if: { item: '회색 두건' }, why: '추종자의 두건' }],
          note: '성공하면 그렐을 사로잡고, 파수꾼 혼자 남는다',
          success: {
            text: ['브란이 두건을 깊게 눌러쓰고 그렐에게 다가갔다. “사냥꾼께서 닻돌을 살피라 하셨소.” 그렐이 고개를 숙이는 순간, 브란의 손이 그의 목덜미를 움켜쥐었다.', '“기억하나, 그렐? 열네 살 소년의 손등.” 그렐의 얼굴이 하얗게 질렸다. 파수꾼이 주인을 지키려 몸을 일으켰다.'],
            fx: { set: ['grell_caught'] }, approve: { bran: 2 }, battle: ANCHOR_FIGHT(true), log: '브란이 낙인공 그렐을 사로잡았다.', next: 'map' },
          fail: { text: ['그렐이 브란의 손등을 보았다. 지져 낸 자국. “배신자로군!” 파수꾼이 깨어났다.'], battle: ANCHOR_FIGHT(false), log: '그렐이 브란을 알아보았다.', next: 'map' } }
      ]
    },

    // ───────────────────────── 침묵의 숲
    c2_woods: {
      art: { sky: 'night', bg: 'forest', actors: [{ k: 'hero', x: 0.25 }, { k: 'stag', x: 0.8, face: -1 }], fx: ['motes', 'fog'] },
      title: '침묵의 숲',
      clock: '첫 번째 조각',
      text: [
        '숲에 들어서자 소리가 사라졌다.',
        '발밑의 낙엽이 부서지는데도 아무 소리가 나지 않았다. 바람이 나뭇가지를 흔드는데도. 그대가 입을 열어 무언가를 말했지만 — 그 말은 입술을 떠나자마자 사라졌다.',
        '나무 사이로 흰 그림자 하나가 스쳐 지나갔다. 사슴이었다. 뿔 끝에 별빛 같은 것이 맺혀 있었다. 사슴은 그대를 한 번 돌아보더니 숲 깊은 곳으로 사라졌다.',
        '첫 번째 조각은 이 숲 어딘가에 있다. 그러나 소리가 없는 숲에서는 방향도 없었다. 같은 나무를 세 번째 지나쳤을 때, 그대는 길을 잃었다는 것을 알았다.'
      ],
      choices: [
        { id: 1, label: '등불지기의 등불을 밝힌다', roll: false, requires: { item: '등불지기의 등불' }, reqText: '등불지기의 등불',
          then: {
            text: ['노파의 등불에 불을 붙이자, 불꽃이 바람도 없는데 한쪽으로 기울었다. 숲 깊은 곳을 향해. 등불지기 대대의 불씨는 별을 알아보았다.', '그대는 기울어진 불꽃을 따라 걸었다. 이윽고 나무들 사이로 별빛이 고인 물웅덩이가 보였다.'],
            fx: { set: ['grove_found'], xp: 10 }, approve: { sena: 1 }, log: '등불지기의 등불이 고요의 못으로 가는 길을 비췄다.', next: 'map' } },
        { id: 2, label: '{pup}의 코를 믿는다', roll: false, requires: { item: '잿빛 새끼' }, reqText: '잿빛 새끼',
          then: {
            text: ['새끼가 땅에 코를 박고 킁킁거리더니, 갑자기 달리기 시작했다. 흰 사슴의 냄새였다. 소리는 없어도 냄새는 남는다.', '그대는 새끼를 따라 달렸다. 새끼가 멈춘 곳은 별빛이 고인 물웅덩이 앞이었다. 새끼가 그대를 돌아보며 꼬리를 흔들었다. 소리 없이.'],
            fx: { set: ['grove_found', 'pup_tracked'], xp: 10 }, log: '새끼가 흰 사슴의 냄새를 따라 고요의 못을 찾아냈다.', next: 'map' } },
        { id: 3, skill: '비전', insp: 'lore', label: '{relic}의 떨림이 커지는 쪽으로 걷는다', stat: '지혜', dc: 12,
          adv: [{ if: { flag: 'starmark' }, why: '손등의 별 화상이 욱신거린다' }, { if: { flag: 'star_map' }, why: '새벽 별자리를 읽었다' }],
          note: '실패하면 숲을 더 헤매야 한다 (탐색)',
          success: {
            text: ['{relic:이} 떨렸다. 걸음을 옮길 때마다 떨림이 커지거나 작아졌다. 그대는 그 떨림을 노래처럼 따라갔다.', '떨림이 가장 커진 곳에서 나무들이 갈라졌다. 별빛이 고인 물웅덩이가 있었다.'],
            fx: { set: ['grove_found'], xp: 10 }, log: '유물의 떨림을 따라 고요의 못을 찾아냈다.', next: 'map' },
          fail: { text: ['떨림은 사방에서 오는 것 같았다. 그대는 결국 숲 가장자리로 되돌아 나왔다. 숲을 더 돌아다녀야 길이 보일 것이다.'], fx: { set: ['woods_lost'] }, log: '숲에서 길을 잃었다. 탐색을 더 해야 한다.', next: 'map' } },
        { id: 4, skill: '생존', insp: 'wild', label: '흰 사슴의 발자국을 쫓는다', stat: '지혜', dc: 14,
          adv: [{ if: { party: 'sena' }, why: '세나가 짐승의 길을 안다' }],
          note: '실패하면 숲을 더 헤매야 한다 (탐색)',
          success: {
            text: ['소리가 없는 숲에도 자국은 남는다. 이끼 위의 얕은 발굽 자국, 꺾이지 않고 휘어진 고사리. 사슴은 아무것도 부수지 않고 지나갔다.', '그 자국이 끝나는 곳에 별빛이 고인 물웅덩이가 있었다.'],
            fx: { set: ['grove_found'], xp: 10 }, log: '흰 사슴의 발자국을 따라 고요의 못을 찾아냈다.', next: 'map' },
          fail: { text: ['발자국은 어느 순간 끊겨 있었다. 사슴이 날아오르기라도 한 것처럼. 숲을 더 돌아다녀야 길이 보일 것이다.'], fx: { set: ['woods_lost'] }, log: '사슴의 자취를 놓쳤다. 탐색을 더 해야 한다.', next: 'map' } }
      ]
    },

    // ───────────────────────── 고요의 못
    c2_grove: {
      art: { sky: 'night', bg: 'grove', actors: [{ k: 'hero', x: 0.24 }, { k: 'stag', x: 0.7, face: -1 }], fx: ['motes'] },
      title: '고요의 못',
      clock: '첫 번째 조각',
      text: [
        '흰 나무들이 둥글게 둘러선 빈터. 그 한가운데에 거울처럼 잔잔한 못이 있었다. 하늘에는 구름이 끼어 있는데, 못에는 별이 비쳤다. 일곱 개. 그리고 그 하나가 — 물속에서 빛나고 있었다.',
        '못가에 흰 사슴이 서 있었다. 엘른. 그 이름이 어떻게 떠올랐는지 그대도 알 수 없었다. 사슴의 눈은 오래된 별처럼 깊었다.',
        '사슴이 고개를 숙였다. 뿔 끝의 별빛이 그대를 겨누었다. 위협이 아니라 — 질문이었다. 그대는 무엇으로 이 고요에 들어오려 하는가.',
        { if: { party: 'bran' }, t: '브란이 손등을 감쌌다. “…속삭임이 들리지 않소. 이 숲에서는.” 그의 목소리는 사라졌지만, 입 모양은 읽을 수 있었다.' }
      ],
      choices: [
        { id: 1, skill: '공연', insp: 'song', label: '소리 없는 노래를 부른다 — 꿈속에서 들은 그 노래를', stat: '매력', dc: 15,
          adv: [{ if: { cls: 'bard' }, why: '노래를 아는 자' }],
          dcMod: [{ if: { flag: 'starmark' }, v: -2, why: '별의 화상' }],
          note: '성공하면 사슴이 그대를 인정한다',
          success: {
            text: [
              '그대는 입을 열었다. 소리는 나지 않았다. 그러나 그대는 노래를 멈추지 않았다. 꿈속에서 매일 밤 들었던, 일곱째 별의 노래를.',
              '사슴이 고개를 들었다. 그리고 못의 수면에 — 그대의 노래가 물결로 번져 나갔다. 소리 대신 빛으로.',
              '엘른이 그대 앞에 무릎을 꿇었다. 사슴이 일어난 자리에, 스스로 떨어뜨린 뿔 끝 한 조각이 남아 있었다. 못 한가운데에서 조각 하나가 떠올라 그대의 손에 내려앉았다.'
            ],
            fx: { set: ['shard1', 'irvan_named', 'stag_blessed'], items: ['고요의 조각', '흰 사슴의 뿔 조각'], amp: { die: 10 }, hpFull: true, mpFull: true, xp: 40 },
            approve: { sena: 2, bran: 1 }, log: '소리 없는 노래로 흰 사슴의 인정을 받고 첫 번째 조각을 얻었다.', next: 'c2_voice' },
          fail: {
            text: ['노래는 그대의 가슴에서조차 엇나갔다. 사슴이 고개를 저었다. 그리고 — 뿔을 낮추었다.'],
            battle: STAG_FIGHT, log: '노래가 엇나갔다. 흰 사슴이 시험을 시작했다.', next: 'c2_voice' } },
        { id: 2, skill: '통찰', insp: 'mercy', label: '숨조차 멈추고, 고요가 되어 다가간다', stat: '지혜', dc: 14,
          adv: [{ if: { flag: 'oath_question' }, why: '고르는 자의 마음' }],
          note: '성공하면 사슴이 길을 비킨다',
          success: {
            text: [
              '그대는 아무것도 하지 않았다. 원하지도, 두려워하지도 않았다. 숨이 멎을 만큼의 고요 속에서 한 걸음씩 못으로 걸어 들어갔다.',
              '물이 무릎까지 차올랐다. 그러나 수면에는 물결 하나 일지 않았다. 사슴이 천천히 비켜섰다. 물속의 별이 그대의 손바닥으로 떠올랐다.'
            ],
            fx: { set: ['shard1', 'irvan_named', 'stag_blessed'], items: ['고요의 조각'], amp: { die: 10 }, hpFull: true, mpFull: true, xp: 36 },
            approve: { sena: 1 }, log: '고요가 되어 못에 들어가 첫 번째 조각을 얻었다.', next: 'c2_voice' },
          fail: {
            text: ['못에 발을 디딘 순간, 그대는 조각을 원했다. 너무 간절히. 수면이 크게 일렁였다. 사슴이 뿔을 낮추었다.'],
            battle: STAG_FIGHT, log: '조각을 원하는 마음이 고요를 깼다. 흰 사슴이 시험을 시작했다.', next: 'c2_voice' } },
        { id: 3, skill: '비전', insp: 'lore', label: '{relic:을} 못에 담가 조각을 부른다', stat: '지혜', dc: 12,
          note: '쉬움. 그러나 사슴은 그대를 시험하려 할 것이다',
          success: {
            text: ['{relic:을} 물에 담그자, 물속의 별이 그것을 향해 헤엄치듯 떠올랐다. 두 빛이 닿는 순간, 조각은 그대의 손에 쥐어져 있었다.', '엘른은 그대를 오래 바라보았다. 꾸짖지도, 인정하지도 않는 눈이었다. 사슴은 소리 없이 숲으로 사라졌다.'],
            fx: { set: ['shard1', 'irvan_named'], items: ['고요의 조각'], amp: { die: 10 }, mpFull: true, xp: 30 }, log: '유물로 물속의 조각을 불러 첫 번째 조각을 얻었다.', next: 'c2_voice' },
          fail: { text: ['물속의 별이 {relic}의 빛을 피해 깊이 가라앉았다. 사슴이 뿔을 낮추었다.'], battle: STAG_FIGHT, log: '조각이 가라앉았다. 흰 사슴이 시험을 시작했다.', next: 'c2_voice' } },
        { id: 4, insp: 'brave', label: '사슴과 겨뤄 힘을 증명한다', roll: false, note: '전투 (흰 사슴은 강하다)', approve: { sena: -1 },
          then: { text: ['그대가 {weapon:을} 들자, 사슴이 앞발로 땅을 긁었다. 소리는 나지 않았다.'], battle: STAG_FIGHT, next: 'c2_voice' } }
      ]
    },

    // 조각을 쥐면 별이 말한다
    c2_voice: {
      place: '고요의 못',
      art: { sky: 'star', bg: 'grove', props: ['stars6'], actors: [{ k: 'hero', x: 0.5 }], fx: ['motes', 'stars'] },
      title: '별의 목소리',
      clock: '첫 번째 조각',
      text: [
        '조각을 쥔 손바닥이 차가웠다. 아니 — 차가운 것이 아니라 고요했다. 세상의 소리가 한 박자 늦게 들렸다.',
        '그리고 그 한 박자의 틈에서, 꿈에서만 듣던 목소리가 처음으로 깨어 있는 그대에게 말을 걸었다.',
        '‘별의 아이야. 나를 찾아와 주었구나.’',
        '‘나는 노래와 노래 사이의 쉼이었다. 쉼이 있어야 노래는 숨을 쉬고, 숨을 쉬어야 무엇을 부를지 고를 수 있다. 다섯째 별이 모든 소절을 하나로 맺으려 했을 때, 나는 노래를 멈추고 떨어졌다. 고를 수 없는 노래는 사슬일 뿐이니까.’',
        '‘내가 부서질 때, 조각 하나가 한 사냥꾼의 손에 떨어졌다. 그는 쉼을 비틀어 잠으로 만들었다. 생명의 뜻을 잠재우고 그 위에 자기 뜻을 덮는 법을 — 너희는 그것을 낙인이라 부르지.’',
        '‘그의 이름은 이르반. 엘레우스 왕의 사냥꾼장. 그는 내 조각을 가슴에 품고 천 년을 살았다. 그리고 지금, 너를 찾고 있다.’',
        '목소리가 잦아들었다. 숲에 소리가 돌아왔다. 처음 들린 것은 그대 자신의 숨소리였다.'
      ],
      choices: [
        { id: 1, label: '조각을 품에 넣고 회색 여울로 돌아간다', roll: false,
          then: {
            text: ['숲을 나서자 동쪽 산등성이에서 뿔피리 소리가 울렸다. 조각의 빛을, 누군가 보았다.'],
            fx: { goto: 'woods' }, log: '아스텔의 목소리에게서 회색 사냥꾼의 이름 — 이르반 — 을 들었다.', next: 'map' } }
      ]
    },

    // ───────────────────────── 사냥의 밤 (조각을 얻고 회색 여울로 돌아오면)
    c2_night: {
      art: { sky: 'night', bg: 'ford', actors: [{ k: 'hero', x: 0.3 }, { k: 'villager', x: 0.15 }, { k: 'hunter', x: 0.72, face: -1 }, { k: 'brandwolf', x: 0.86, face: -1 }], fx: ['ash'] },
      title: '사냥의 밤',
      clock: '회색 여울',
      text: [
        '그날 밤, 여울 건너편 언덕에 횃불이 하나둘 켜졌다. 열, 스물. 낙인 늑대들의 흰 눈이 그 사이에서 번득였다.',
        '“조각을 내놓아라, 별의 아이!” 언덕에서 누군가 외쳤다. “그러면 이 마을은 계속 잠들어 있을 수 있다. 아무도 다치지 않고.”',
        { if: { flag: 'anchor_broken' }, t: '깨어난 마을 사람들이 대장간 앞에 모였다. 손에는 쇠스랑과 망치가 들려 있었다. 오스크가 그대에게 고개를 끄덕였다. “이번엔 우리도 싸우겠소.”' },
        { if: { not: 'anchor_broken' }, t: '마을 사람들은 횃불을 보고도 움직이지 않았다. 낙인이 그들을 잠재우고 있었다. 지킬 수 있는 것은 그대뿐이었다.' },
        { if: { flag: 'tobin_saved' }, t: '토빈이 그대의 망토 자락을 붙잡았다. 손이 떨리고 있었다.' }
      ],
      choices: [
        { id: 1, insp: 'brave', label: '여울 다리에서 막아선다', roll: false,
          then: { text: ['그대는 다리 한가운데 섰다. 횃불이 여울을 건너오기 시작했다.'], battle: NIGHT_FIGHT(), next: 'map' } },
        { id: 2, skill: '위협', insp: 'brave', label: '깨어난 마을 사람들을 이끌고 언덕을 친다', stat: '매력', dc: 12, requires: { flag: 'anchor_broken' }, reqText: '닻돌을 부쉈다',
          note: '성공하면 마을 사람들이 순찰대를 흩트린다',
          success: {
            text: ['“여울은 이제 깨어 있다!” 그대의 외침에 쇠스랑과 망치가 함께 올라갔다. 언덕의 순찰병들이 당황해 횃불을 떨어뜨렸다.', '흩어진 순찰대 가운데 몇 명만이 그대에게 달려들었다.'],
            battle: NIGHT_FIGHT([{ if: {}, hp: -12, why: '마을 사람들에게 흩어졌다 (HP -12)' }]), log: '깨어난 마을 사람들을 이끌고 순찰대를 흩트렸다.', next: 'map' },
          fail: { text: ['사람들은 아직 싸움이 무서웠다. 쇠스랑을 쥔 손들이 떨렸다. 결국 그대가 앞에 나설 수밖에 없었다.'], battle: NIGHT_FIGHT(), log: '마을 사람들은 아직 싸울 수 없었다.', next: 'map' } },
        { id: 3, skill: '지각', insp: 'lore', label: '물레방아 수문을 열어 여울을 넘치게 한다', stat: '지혜', dc: 13,
          adv: [{ if: { flag: 'anchor_known' }, why: '대장장이가 수문을 알려 주었다' }],
          note: '성공하면 강을 건너는 적이 줄고, 물 위에서 싸운다',
          success: {
            text: ['그대는 물레방아 위로 뛰어올라 수문 빗장을 걷어찼다. 불어난 물이 여울을 덮쳤다. 다리를 건너던 늑대들이 물살에 휩쓸려 떠내려갔다.', '물이 무릎까지 차오른 다리 위에서, 살아남은 순찰병들이 그대를 노려보았다.'],
            battle: Object.assign(NIGHT_FIGHT([{ if: {}, hp: -8, why: '물살에 휩쓸렸다 (HP -8)' }]), { field: { water: true }, scaleFree: 2 }),
            log: '수문을 열어 여울을 넘치게 했다.', next: 'map' },
          fail: { text: ['수문 빗장은 녹이 슬어 꿈쩍도 하지 않았다. 횃불이 다리 앞까지 왔다.'], battle: NIGHT_FIGHT(), log: '수문을 열지 못했다.', next: 'map' } }
      ]
    },

    // ───────────────────────── 사냥꾼의 산장
    c2_lodge: {
      art: { sky: 'night', bg: 'lodge', actors: [{ k: 'hero', x: 0.2 }, { k: 'rine', x: 0.68, face: -1 }], fx: ['ash'] },
      title: '사냥꾼의 산장',
      clock: '회색 눈의 추적자',
      text: [
        '북쪽 산등성이, 통나무로 지은 거대한 산장. 처마 밑에는 사슴뿔과 곰 머리, 그리고 — 사람의 것으로 보이는 해골들이 줄지어 걸려 있었다.',
        '산장 문 앞, 장작더미 위에 여인 하나가 앉아 있었다. 회색 망토, 회색 깃의 화살. 그녀가 고개를 들자 재처럼 흰 눈동자가 그대를 보았다.',
        '“사냥 대장께서 기다리신다.” 목소리에 아무 감정이 없었다. 그녀가 시위에 화살을 걸었다. 화살 깃의 매듭이 — 낯익었다.',
        { if: { any: ['sena_parted', 'sena_left', 'sena_bench'], not: 'done_c2_sena_foe' }, t: '그때 산장 아래 숲에서 낯익은 발소리가 올라왔다. 세나였다. 숨이 턱에 닿아 있었다. “엄마 소식을 들었어요. 이번엔… 나도 가요.”' },
        { if: SENA_AT, t: '세나의 활이 떨렸다. “…엄마.” 여인은 대답하지 않았다. 화살촉이 천천히 세나를 향했다.' },
        { if: { nor: [SENA_AT] }, t: '세나가 목에 걸고 있던 화살촉과 똑같은 모양의 화살촉이었다.' }
      ],
      choices: [
        { id: 1, skill: '설득', insp: 'mercy', label: '세나와 함께 그녀의 이름을 부른다', stat: '매력', dc: 15, requires: SENA_AT, reqText: '세나',
          dcMod: [{ if: { flag: 'anchor_broken' }, v: -3, why: '닻돌이 부서졌다' }, { if: { flag: 'sena_sworn' }, v: -2, why: '네 번째 화살의 맹세' }, { if: { item: '세나 어머니의 화살촉' }, v: -2, why: '어머니의 화살촉' }],
          note: '성공하면 싸우지 않고 낙인을 흔든다',
          success: {
            text: [
              '“리네.” 그대가 부르고, 세나가 따라 불렀다. “엄마. 리네. 나야, 세나.”',
              '화살촉이 흔들렸다. 흰 눈동자에 초록빛이 한 점 번졌다. 여인이 비명을 지르며 활을 떨어뜨렸다. 목덜미의 낙인이 금 간 유리처럼 갈라졌다.',
              '“세나…?” 여인이 딸의 얼굴을 손으로 더듬었다. “너 많이 컸구나.” 세나는 대답 대신 어머니를 끌어안았다.',
              '리네가 떨리는 손으로 산장을 가리켰다. “바스크는 트로피 전당에 있어요. 그리고 뿔피리 — 절대 불게 해서는 안 돼요.”'
            ],
            fx: { set: ['rine_freed'], xp: 50 }, approve: { sena: 4 }, fxIf: [{ if: { any: ['sena_parted', 'sena_bench'] }, fx: { comp: { sena: 'party' } } }],
            log: '세나와 함께 이름을 불러 리네의 낙인을 끊었다.', next: 'c2_vask' },
          fail: {
            text: ['이름은 닿지 않았다. 흰 눈동자는 끝내 흔들리지 않았다. 화살이 시위를 떠났다.'],
            battle: TRACKER_FIGHT, log: '이름이 닿지 않았다. 추적자가 활을 쏘았다.', next: 'c2_vask' } },
        { id: 2, insp: 'brave', label: '활을 쏘기 전에 덮친다', roll: false, note: '전투 (추적자 HP가 절반 이하일 때 어머니의 화살촉으로 낙인을 끊을 수 있다)',
          then: { text: ['그대가 몸을 날렸다. 여인의 화살이 그대의 뺨을 스쳤다.'], battle: TRACKER_FIGHT, next: 'c2_vask' } },
        { id: 3, skill: '은신', insp: 'sly', label: '그녀를 지나쳐 산장 뒤편으로 숨어든다', stat: '민첩', dc: 14,
          adv: [{ if: { flag: 'ash_word' }, why: '순찰대의 암호' }, { if: { flag: 'ledger_page' }, why: '장부의 마지막 장에 적힌 뒷길' }],
          note: '성공하면 바스크의 뒤를 잡지만, 그녀는 놓친다',
          success: {
            text: ['그대는 장작더미 그림자를 따라 산장 뒤편으로 돌았다. 여인은 그대가 사라진 쪽을 보지 않았다. 문틈으로, 트로피 전당의 불빛이 새어 나왔다.', '돌아보았을 때 장작더미 위의 여인은 사라지고 없었다.'],
            fx: { set: ['rine_lost', 'lodge_ambush'], xp: 20 }, approve: { sena: -2 }, log: '추적자를 지나쳐 바스크의 뒤를 잡았다. 그녀는 사라졌다.', next: 'c2_vask' },
          fail: { text: ['장작이 무너지는 소리. 흰 눈동자가 그대를 정확히 찾아냈다.'], battle: TRACKER_FIGHT, log: '숨어들다 들켰다.', next: 'c2_vask' } }
      ]
    },

    c2_vask: {
      place: '사냥꾼의 산장',
      art: { sky: 'night', bg: 'lodge', props: ['trophies'], actors: [{ k: 'hero', x: 0.22 }, { k: 'vask', x: 0.7, face: -1 }] },
      title: '트로피 전당',
      clock: '사냥 대장 바스크',
      text: [
        '전당의 벽은 사냥감으로 가득했다. 곰, 사슴, 늑대 — 그리고 회색 낙인이 찍힌 갑옷들. 사냥꾼에게 맞섰던 자들의 것이었다.',
        '난롯가에 사내 하나가 서 있었다. 회색 털가죽 망토, 손에는 긴 사냥 창. 그의 목에는 낙인이 없었다.',
        '“사냥 대장 바스크다.” 사내가 웃었다. “나는 낙인이 필요 없지. 스스로 사냥꾼을 따르니까. 그분이 세상을 묶으면, 다시는 아무도 굶지 않고 아무도 싸우지 않아. 그게 그렇게 나쁜가?”',
        { if: { flag: 'rine_freed' }, t: '리네가 그대 곁에 섰다. “거짓말이에요. 저자는 사냥이 좋아서 따르는 거예요.”' },
        { if: { flag: 'lodge_ambush' }, t: '바스크는 아직 그대를 보지 못했다. 등 뒤가 비어 있었다.' },
        '바스크의 허리에 커다란 뿔피리가 매달려 있었다. 회색 빛이 그 안에서 맥박처럼 고동쳤다.'
      ],
      choices: [
        { id: 1, insp: 'brave', label: '창을 든 사냥 대장과 맞선다', roll: false, note: '전투 (강하다)',
          then: { text: ['바스크가 창을 비껴 들었다. 트로피들의 빈 눈이 그대를 내려다보았다.'], battle: VASK_FIGHT, next: 'c2_horn' } },
        { id: 2, skill: '설득', insp: 'song', label: '“굶지 않는 세상”이 사슬 위에 세워질 수 있는지 묻는다', stat: '매력', dc: 16,
          adv: [{ if: { flag: 'ford_defended' }, why: '깨어난 마을이 함께 싸웠다' }],
          note: '성공하면 바스크가 흔들려 약해진 채 싸운다',
          success: {
            text: ['“회색 여울 사람들이 굶지 않는 건 맞소. 대신 웃지도, 울지도 않지. 당신 사냥꾼의 세상에선 당신도 그렇게 될 거요.”', '바스크의 창끝이 처음으로 흔들렸다. “…그분은 나만은 남겨 두겠다고 하셨다.” 그 말을 하는 그의 목소리에는 확신이 없었다.'],
            fx: { set: ['vask_doubt'], xp: 20 }, battle: Object.assign({}, VASK_FIGHT, { mods: VASK_FIGHT.mods.concat([{ if: {}, atk: -1, hp: -15, why: '흔들리는 사냥 대장 (명중 -1, HP -15)' }]) }),
            log: '바스크에게 사슬 위의 세상을 물었다. 그가 흔들렸다.', next: 'c2_horn' },
          fail: { text: ['바스크가 코웃음을 쳤다. “별의 아이도 결국 말뿐이군.”'], battle: VASK_FIGHT, log: '바스크는 흔들리지 않았다.', next: 'c2_horn' } }
      ]
    },

    c2_horn: {
      place: '사냥꾼의 산장',
      art: { sky: 'night', bg: 'lodge', props: ['trophies'], actors: [{ k: 'hero', x: 0.24 }, { k: 'shade', x: 0.68, face: -1 }] },
      title: '뿔피리의 그림자',
      clock: '회색 사냥꾼',
      text: [
        '뿔피리 소리는 낮고 길었다. 1장의 그 밤, 관문 꼭대기에서 들었던 바로 그 소리였다.',
        '난롯불이 회색으로 바뀌었다. 트로피들의 빈 눈구멍에서 회색 연기가 흘러나와 전당 한가운데로 모였다. 연기는 사람의 모양을 빚었다. 키가 크고, 머리에 사슴뿔 같은 그림자 관을 쓴.',
        '“찾았다, 별의 아이야.” 목소리는 전당 전체에서 들려왔다. “내 대장을 쓰러뜨리고, 내 마을을 깨우고, 내 조각의 형제를 품었구나.”',
        { if: { flag: 'vask_down' }, t: '쓰러진 바스크가 그림자를 올려다보았다. “사냥꾼이시여…” 그림자는 그를 보지도 않았다.' },
        '“그 조각을 내게 다오. 그러면 이 세상의 울음을 끝내 주마. 다시는 아무도 잃지 않는 세상을.”',
        { if: BRAN_CALLED, t: '그림자가 브란을 보았다. “브란. 내 손등의 아이야. 장부가 탔어도, 지져 내도, 너는 내 것이다. 돌아오너라. 춥지 않게 해 주마.” 브란의 발이 한 걸음, 그림자 쪽으로 움직였다.' },
        '대답하기도 전에, 그림자가 활을 들었다. 사냥은 이미 시작되었다.',
        '그대의 품에서 고요의 조각이 차갑게 빛났다. 그 고요가 그대와 동료들의 상처를 잠재우고, 숨을 가라앉힌다.'
      ],
      choices: [
        { id: 1, label: '조각을 쥐고 그림자와 맞선다', roll: false, note: '전투 (그림자 HP가 절반 이하일 때 조각으로 뿔피리를 깰 수 있다)', requires: { nor: [BRAN_CALLED] },
          then: { text: ['그림자의 사냥개들이 연기 속에서 튀어나왔다.'], fx: { hpFull: true, mpFull: true, partyFull: true }, battle: SHADOW_FIGHT, next: 'c2_end' } },
        { id: 2, skill: '설득', insp: 'mercy', label: '“브란, 대답하지 마!” 그의 이름을 부른다', stat: '매력', dc: 14, requires: BRAN_CALLED, reqText: '그림자가 브란을 부를 때',
          dcMod: [{ if: { flag: 'brita_saved' }, v: -3, why: '누이 브리타가 풀려났다' }, { if: { flag: 'ledger_burned' }, v: -2, why: '장부를 함께 불태웠다' }, { if: { flag: 'ledger_kept' }, v: 2, why: '그대가 장부를 지니고 있다' }],
          note: '실패하면 브란이 그림자 쪽으로 넘어간다',
          success: {
            text: ['브란의 걸음이 멈췄다. 그는 손등을 움켜쥐고, 이를 악물고, 그림자에게서 눈을 돌려 그대를 보았다. “…대답 안 했소. 천 날 동안 한 번도.”', '그가 지팡이 끝에 불씨를 피웠다. 이번에는 그림자를 향해.'],
            fx: { hpFull: true, mpFull: true, partyFull: true, xp: 20 }, approve: { bran: 3 }, battle: SHADOW_FIGHT, log: '그림자의 부름에서 브란을 붙잡았다.', next: 'c2_end' },
          fail: {
            text: ['브란이 그대를 돌아보았다. 그 눈에 미안함 같은 것이 스쳤다. 그리고 그는 그림자 곁으로 걸어갔다. 목덜미에 회색 빛이 다시 피어올랐다.'],
            fx: { hpFull: true, mpFull: true, partyFull: true, comp: { bran: 'hostile' }, set: ['bran_turned'] }, battle: SHADOW_BRAN_FIGHT, log: '브란이 그림자의 부름에 답했다.', next: 'c2_end' } },
        { id: 3, insp: 'brave', label: '그림자에게 가려는 브란을 힘으로라도 붙잡는다', roll: false, requires: BRAN_CALLED, reqText: '그림자가 브란을 부를 때', approve: { bran: -1 },
          note: '전투 (브란이 그림자 편에 선다)',
          then: { text: ['그대가 브란의 팔을 잡자, 그는 불씨로 그대를 밀쳐 냈다. “놓으시오!” 그의 목덜미에 회색 빛이 피어올랐다.'],
            fx: { hpFull: true, mpFull: true, partyFull: true, comp: { bran: 'hostile' }, set: ['bran_turned'] }, battle: SHADOW_BRAN_FIGHT, next: 'c2_end' } },
        { id: 4, label: '가게 둔다', roll: false, requires: BRAN_CALLED, reqText: '그림자가 브란을 부를 때', approve: { sena: -1 },
          then: { text: ['그대는 손을 뻗지 않았다. 브란은 그림자 곁을 지나 연기 속으로 걸어 들어갔다. 돌아보지 않았다.', '그림자가 웃었다. “하나 돌아왔군.” 사냥개들이 그대에게 달려들었다.'],
            fx: { hpFull: true, mpFull: true, partyFull: true, comp: { bran: 'hostile' }, set: ['bran_turned'] }, battle: SHADOW_FIGHT, log: '브란이 그림자에게 걸어가도록 두었다.', next: 'c2_end' } }
      ]
    },

    // ───────────────────────── 제2장 에필로그
    c2_end: {
      place: '사냥꾼의 산장',
      art: { sky: 'dawn', bg: 'lodge', actors: [{ k: 'hero', x: 0.4 }], fx: ['ash'] },
      title: '이르반',
      clock: '2장 에필로그',
      text: [
        '흩어지던 회색 연기가 마지막으로 한데 모여, 사람의 얼굴을 빚었다. 늙지도 젊지도 않은 얼굴. 눈만이 천 년만큼 지쳐 있었다.',
        '“나는 이르반이다.” 얼굴이 말했다. “엘레우스 왕의 사냥꾼장이었지. 별이 떨어지던 밤, 왕은 나에게 떨어지는 빛을 붙잡아 오라 명했다. 나는 붙잡았다. 그리고 돌아왔을 때, 내 집은 별들의 불에 타 없어져 있었다. 아내도, 딸도.”',
        '“그날 나는 알았다. 세상이 제멋대로 고르게 두면, 언제나 누군가는 잃는다는 것을. 그러니 묶어야 한다. 모두를. 다시는 아무도 잃지 않도록.”',
        '“별의 아이야, 너는 고르는 자라더구나. 그렇다면 골라라. 내 손을 잡고 이 세상의 울음을 끝낼지, 끝없이 잃으며 노래할지.”',
        { if: { party: 'orden' }, t: '오르덴이 그대 앞을 막아섰다. 투구 속 금빛 눈이 떨리고 있었다. “…이르반. 우리는 같은 날 같은 맹세를 했다. 왕의 문을 지키겠다고.” 그림자의 얼굴이 처음으로 흔들렸다. “오르덴. 아직도 그 낡은 문을 지키나.”' },
        { if: { flag: 'vask_doubt' }, t: '쓰러진 바스크가 그림자를 올려다보며 중얼거렸다. “…나만은 남겨 두겠다고 하셨잖습니까.” 그림자는 대답하지 않았다.' }
      ],
      choices: [
        { id: 1, insp: 'brave', label: '“사슬 위에 세운 평화는 평화가 아니다.” 손을 뿌리친다', roll: false, approve: { sena: 1, bran: 2 },
          then: {
            text: [
              '그림자의 얼굴이 일그러졌다. “그 말을 하던 기사가 있었지. 카이론이라고.” 웃음 같은 소리. “그도 물에 잠겼다.”',
              '연기가 흩어졌다. 마지막 목소리가 바람에 실려 왔다. “두 번째 조각은 내 옛 주인의 도시에 있다. 거울 호수 아래. 거기서 다시 보자.”'
            ],
            fx: { set: ['irvan_offer_refused'], xp: 20 }, log: '회색 사냥꾼 이르반의 손을 뿌리쳤다.', next: 'c2_after' } },
        { id: 2, skill: '통찰', insp: 'mercy', label: '그의 아내와 딸의 이름을 묻는다', stat: '지혜', dc: 14,
          note: '성공하면 그의 마음 깊은 곳을 엿본다',
          success: {
            text: [
              '그림자가 멈췄다. 천 년 동안 아무도 묻지 않은 질문이었던 것처럼.',
              '“…엘다. 그리고 미레.” 얼굴이 흐려졌다. “미레는 별을 좋아했다. 떨어지는 별을 보러 가자고 조르던 아이였지.” 목소리가 갈라졌다. “그 아이가 본 마지막 것이 별이었다.”',
              '연기가 흩어지기 전, 그것은 아주 작게 말했다. “…다음엔 묻지 마라.” 바람이 마지막 말을 실어 왔다. “두 번째 조각은 거울 호수 아래, 왕의 도시에 있다.”'
            ],
            fx: { set: ['irvan_offer_asked'], xp: 25 }, approve: { sena: 2 }, log: '이르반에게 그가 잃은 이들의 이름을 물었다. 엘다와 미레.', next: 'c2_after' },
          fail: {
            text: ['“그 이름들은 네 입에 담을 것이 아니다.” 그림자가 차갑게 흩어졌다.', '바람이 마지막 말을 실어 왔다. “두 번째 조각은 거울 호수 아래에 있다. 먼저 가 있으마.”'],
            fx: { set: ['irvan_offer_refused'] }, log: '이르반에게 이름을 물었지만 대답을 듣지 못했다.', next: 'c2_after' } },
        { id: 3, label: '아무 말도 하지 못한다', roll: false, approve: { bran: -2 },
          then: {
            text: [
              '그대는 대답하지 못했다. 다시는 아무도 잃지 않는 세상 — 그 말이, 생각보다 오래 귓가에 남았다.',
              '그림자가 미소 지었다. “그래, 망설여라. 망설이는 동안은 아직 늦지 않았으니.” 연기가 흩어졌다. “거울 호수 아래에서 기다리마.”',
              { if: { party: 'bran' }, t: '브란이 그대를 오래 바라보았다. 그 눈에는 걱정이 있었다.' }
            ],
            fx: { set: ['irvan_offer_wavered'] }, log: '이르반의 제안에 대답하지 못했다.', next: 'c2_orden_oath' } }
      ]
    },

    c2_after: {
      place: '회색 여울',
      art: [
        { if: { flag: 'anchor_broken' }, sky: 'dawn', bg: 'ford', actors: [{ k: 'hero', x: 0.3 }, { k: 'villager', x: 0.5 }, { k: 'boy', x: 0.6 }, { k: 'smith', x: 0.74 }] },
        { sky: 'dawn', bg: 'ford', actors: [{ k: 'hero', x: 0.4 }], fx: ['ash'] }
      ],
      title: '재가 그친 아침',
      clock: '2장 에필로그',
      text: [
        '산장을 내려왔을 때, 동쪽 하늘의 재가 그쳐 있었다.',
        { if: { flag: 'anchor_broken' }, t: '회색 여울에는 소리가 돌아와 있었다. 물레방아 소리, 아이들의 고함, 대장간 망치 소리. 누군가 노래를 흥얼거렸다. 아주 오래 잊고 있던 노래였다.' },
        { if: { not: 'anchor_broken' }, t: '회색 여울은 여전히 조용했다. 닻돌이 서 있는 한, 사람들은 깨어나지 못한다. 그대는 그 침묵을 등 뒤에 두고 떠날 수 없다는 것을 알았다.' },
        { if: { flag: 'tobin_mother' }, t: '토빈이 어머니의 손을 잡고 그대에게 손을 흔들었다.' },
        { if: { flag: 'rine_freed', or: SENA_AT.or }, t: '세나와 리네는 물레방아 둔덕에 나란히 앉아 있었다. 리네가 딸의 머리를 땋아 주고 있었다. 세나는 그대를 보더니 쑥스럽게 웃었다.' },
        { if: { flag: ['rine_slain', 'sena_left'] }, t: '세나는 어머니를 마을 뒤 언덕에 묻었다. 그리고 그대에게 아무 말 없이 서쪽으로 떠났다.' },
        { if: { flag: ['brita_saved', 'bran_hostile'] }, t: '브리타는 물레방아 둔덕에 혼자 앉아 북쪽을 보고 있었다. 오빠는 돌아오지 않았다.' },
        { if: { flag: 'orden_dead' }, t: '여울가에 오르덴의 장창을 꽂아 두었다. 천 년을 지킨 기사의 무덤으로는 너무 작은 표식이었다.' },
        { if: { flag: 'brita_saved', or: BRAN_AT.or }, t: '브란은 옛집 지붕에 올라가 내려앉은 서까래를 고치고 있었다. 아래에서 브리타가 못을 건네주었다. 남매는 서로 아무 말도 하지 않았지만, 망치 소리가 박자를 맞추고 있었다.' },
        { if: { party: 'orden' }, t: '오르덴은 여울가에 서서 북쪽을 바라보았다. “거울 호수… 왕의 도시가 가라앉았다는 소문을 천 년 전에 들었다. 믿지 않았지.” 그가 장창을 고쳐 쥐었다. “이르반과 나는 같은 맹세를 했다. 그 맹세가 어디서 어긋났는지, 그 도시에 답이 있을 것이다.”' },
        { if: { flag: 'hunter_mark' }, t: '손등의 회색 자국이 이따금 서늘했다. 아직은 아무 소리도 들리지 않는다. 아직은.' },
        '품 안의 고요의 조각과 {relic:이} 같은 박자로 떨렸다. 북쪽을 가리키며. 거울 호수, 잠긴 왕도 아우렐리아.',
        '떨어진 별의 노래는 두 번째 소절을 지났다.'
      ],
      choices: [
        { id: 1, label: '2장을 마친다', roll: false,
          then: {
            text: ['— 제2장 「회색 사냥꾼」 끝 —', '{name}의 이야기는 제3장 「잠긴 왕도」로 이어진다. 그때까지 동쪽 변경은 열려 있다.'],
            fx: { goto: 'ford' }, log: '제2장 「회색 사냥꾼」을 마쳤다.', next: 'end' } }
      ]
    },

    // ───────────────────────── 동료와 맞서는 길
    // 채석장: 다시 낙인에 묶인 브란 (1장에서 그와 맞섰거나 그를 살려 보냈다면)
    c2_bran_foe: {
      art: { sky: 'dusk', bg: 'quarry', props: ['anchor'], actors: [{ k: 'hero', x: 0.2 }, { k: 'bran', x: 0.56, face: -1 }, { k: 'acolyte', x: 0.74, face: -1 }], fx: ['ash'] },
      title: '닻돌의 문지기', clock: '브란',
      text: [
        '닻돌로 내려가는 길목에 회색 두건의 사내가 서 있었다. 지팡이, 그을린 두건 — 브란이었다.',
        '그러나 그의 목덜미에는 새 낙인이 박혀 있었다. 지져 낸 손등 위로 회색 빛이 기어올라 와 있었다. 그대를 보는 눈에 알아보는 빛이 없었다.',
        '낙인공 그렐이 그 뒤에서 웃었다. “돌아온 개는 더 잘 짖지. 저자가 너를 기억하나 보자.”',
        { if: { flag: 'brita_known' }, t: '짐꾼들 가운데, 짧게 깎은 머리의 여자 하나가 걸음을 멈추고 브란을 보았다. 브리타였다.' }
      ],
      choices: [
        { id: 1, insp: 'brave', label: '맞선다', roll: false, note: '전투 (브란과 낙인공)',
          then: { text: ['브란이 지팡이를 들었다. 불씨가 그대를 향해 피어올랐다.'], fx: { set: ['bran_confronted'] }, battle: BRAN2_FIGHT, next: 'map' } },
        { id: 2, skill: '설득', insp: 'mercy', label: '“브란. 저기 브리타가 있다.” 누이의 이름을 부른다', stat: '매력', dc: 15,
          dcMod: [{ if: { flag: 'brita_known' }, v: -3, why: '브리타가 지켜보고 있다' }],
          note: '성공하면 낙인이 흔들려 그가 물러선다',
          success: {
            text: [
              '“브리타.” 그 이름이 채석장에 울리자, 브란의 지팡이가 멈췄다. 회색 눈동자가 떨렸다. 그가 천천히 고개를 돌려 짐꾼들 쪽을 보았다.',
              '“…브리타?” 목덜미의 낙인이 금 간 유리처럼 갈라졌다. 브란이 무릎을 꿇었다. 그렐이 욕설을 퍼부으며 닻돌 뒤로 달아났다.',
              '“그대인가.” 브란이 그대를 올려다보았다. “살려 준 걸 후회하게 될 거라고 했지. …틀렸군.” 그는 일어서지 않았다. “닻돌을 부숴 주시오. 그 아이를 위해.”'
            ],
            fx: { comp: { bran: 'parted' }, set: ['bran_confronted', 'brita_known'], xp: 30 }, approve: { bran: 3 }, log: '누이의 이름으로 브란의 낙인을 흔들었다. 그는 물러섰다.', next: 'map' },
          fail: { text: ['브란은 그 이름을 듣지 못한 것 같았다. 아니 — 들었지만, 낙인이 그 소리를 삼켰다. 불씨가 날아왔다.'], fx: { set: ['bran_confronted'] }, battle: BRAN2_FIGHT, log: '이름이 닿지 않았다. 브란이 불씨를 던졌다.', next: 'map' } },
        { id: 3, label: '일단 물러난다', roll: false, note: '채석장 밖으로 (다시 오면 그가 길을 막는다)',
          then: { text: ['그대는 채석장 비탈을 되짚어 올라갔다. 브란은 쫓아오지 않았다. 문지기처럼, 그 자리에 서 있었다.'], fx: { goto: 'ford' }, log: '채석장에서 물러났다. 낙인 찍힌 브란이 길을 막고 있다.', next: 'map' } }
      ]
    },
    c2_bran_judge: {
      place: '낙인 채석장',
      art: { sky: 'dusk', bg: 'quarry', props: ['anchor'], actors: [{ k: 'hero', x: 0.36 }, { k: 'bran', x: 0.6, face: -1, s: 0.9 }], fx: ['ash'] },
      title: '쓰러진 브란', clock: '브란',
      text: ['브란이 쓰러진 채 숨을 몰아쉬었다. 목덜미의 낙인이 깜박였다. 그의 눈은 여전히 그대를 알아보지 못했다.'],
      choices: [
        { id: 1, skill: '의학', insp: 'mercy', label: '그의 지팡이 불씨로 낙인을 다시 지져 준다', stat: '지혜', dc: 13,
          adv: [{ if: { flag: 'mark_known' }, why: '낙인의 비밀' }],
          note: '성공하면 그가 깨어난다',
          success: {
            text: ['그대는 꺼져 가는 불씨를 그의 목덜미에 댔다. 살 타는 냄새. 브란이 비명을 질렀다 — 그리고 그 비명 끝에, 그의 목소리가 돌아왔다. “…이 짓을 두 번이나 하게 되다니.”', '그가 그대를 보았다. 알아보는 눈이었다. “빚이 또 늘었군.” 그는 비틀거리며 일어나 짐꾼들 쪽으로 걸어갔다. 누이를 찾아.'],
            fx: { comp: { bran: 'parted' }, set: ['brita_known'], xp: 30 }, approve: { bran: 3 }, log: '브란의 낙인을 다시 지져 깨웠다. 그는 누이에게 갔다.', next: 'map' },
          fail: { text: ['불씨가 손끝에서 꺼졌다. 브란이 그대의 손을 뿌리치고 비틀거리며 달아났다. 북쪽으로 — 사냥꾼의 산장 쪽으로.'], log: '낙인을 지지지 못했다. 브란이 달아났다.', next: 'map' } },
        { id: 2, insp: 'brave', label: '끝을 낸다', roll: false, approve: { sena: -2 },
          then: { text: ['그대는 칼을 내렸다. 브란의 눈이 마지막 순간, 아주 잠깐 맑아졌다. 그가 무언가를 말하려 했다. 그러나 소리가 되지 못했다.'], fx: { comp: { bran: 'dead' } }, log: '낙인 찍힌 브란을 쓰러뜨렸다.', next: 'map' } },
        { id: 3, label: '그대로 두고 떠난다', roll: false,
          then: { text: ['그대가 돌아서자 브란은 비틀거리며 일어나 북쪽으로 사라졌다. 낙인은 그를 다시 부를 것이다.'], log: '쓰러진 브란을 두고 떠났다. 그는 사냥꾼에게 돌아갔다.', next: 'map' } }
      ]
    },
    c2_bran_judge_horn: {
      place: '사냥꾼의 산장',
      art: { sky: 'night', bg: 'lodge', props: ['trophies'], actors: [{ k: 'hero', x: 0.36 }, { k: 'bran', x: 0.6, face: -1, s: 0.9 }] },
      title: '연기 속의 브란', clock: '브란',
      text: ['그림자가 흩어진 자리에 브란이 쓰러져 있었다. 목덜미의 낙인은 그림자와 함께 흐려지고 있었지만, 아직 꺼지지 않았다.', '“…추웠소.” 브란이 중얼거렸다. “그자의 품이 따뜻할 줄 알았는데.”'],
      choices: [
        { id: 1, skill: '설득', insp: 'mercy', label: '손을 내밀어 다시 일으킨다', stat: '매력', dc: 12,
          dcMod: [{ if: { flag: 'brita_saved' }, v: -2, why: '누이가 기다린다' }],
          success: {
            text: ['브란이 그대의 손을 오래 보다가 잡았다. “…다시는 대답하지 않겠소. 이번엔 정말로.” 목덜미의 낙인이 재가 되어 흩어졌다.'],
            fx: { comp: { bran: 'party' } }, log: '그림자의 부름에서 돌아온 브란을 다시 일으켰다.', next: 'c2_end' },
          fail: { text: ['브란은 그대의 손을 잡지 않았다. “나는 그대 곁에 있을 자격이 없소.” 그는 혼자 일어나 산장을 떠났다. 회색 여울 쪽으로.'],
            fx: { comp: { bran: 'parted' } }, log: '브란은 그대의 손을 잡지 않고 떠났다.', next: 'c2_end' } },
        { id: 2, insp: 'brave', label: '배신의 대가를 치르게 한다', roll: false, approve: { sena: -2 },
          then: { text: ['브란은 눈을 감았다. “그래, 그게 맞겠지.” 칼이 내려왔다.'], fx: { comp: { bran: 'dead' } }, log: '그림자 편에 섰던 브란을 쓰러뜨렸다.', next: 'c2_end' } },
        { id: 3, label: '그대로 둔다', roll: false,
          then: { text: ['그대가 돌아서자, 브란은 사냥꾼의 연기가 사라진 쪽으로 기어가듯 걸어갔다. 낙인은 아직 그를 놓지 않았다.'], log: '쓰러진 브란을 두고 돌아섰다. 그는 사냥꾼을 따라갔다.', next: 'c2_end' } }
      ]
    },

    // 산장: 어머니를 잃은 세나 (그대가 리네를 쓰러뜨렸을 때)
    c2_sena_grief: {
      place: '사냥꾼의 산장',
      art: { sky: 'night', bg: 'lodge', actors: [{ k: 'hero', x: 0.3 }, { k: 'sena', x: 0.62, face: -1 }], fx: ['ash'] },
      title: '네 번째 화살', clock: '세나',
      text: [
        { if: SENA_AT, t: '세나가 어머니의 손을 놓았다. 그리고 천천히 일어나, 활에 화살을 걸었다. 화살촉이 그대를 향했다.' },
        { if: SENA_AT, t: '“엄마는… 낙인에 묶여 있었을 뿐이에요.” 목소리가 떨렸다. “다른 방법이 있었잖아요. 있었잖아요!”' },
        { if: { nor: [SENA_AT] }, t: '그대는 추적자의 눈을 감겨 주고 산장 안으로 걸어 들어갔다.' }
      ],
      choices: [
        { id: 1, skill: '설득', insp: 'mercy', label: '“그분을 풀어 드릴 수 없었다. 미안하다.”', stat: '매력', dc: 13, requires: SENA_AT, reqText: '세나',
          dcMod: [{ if: { min: { ap_sena: 6 } }, v: -4, why: '깊은 믿음' }, { if: { min: { ap_sena: 3 } }, v: -2, why: '호감' }, { if: { max: { ap_sena: 0 } }, v: 3, why: '쌓인 원망' }],
          note: '성공하면 세나가 곁에 남는다',
          success: {
            text: ['화살촉이 내려갔다. 세나가 무너지듯 주저앉아 울었다. 오래. 그대는 그 곁을 떠나지 않았다.', '“…알아요. 알지만.” 그녀가 소매로 눈을 문질렀다. “끝까지 가요. 엄마를 이렇게 만든 자한테.”'],
            fx: { comp: { sena: 'party' } }, log: '어머니를 잃은 세나가 그래도 곁에 남았다.', next: 'c2_vask' },
          fail: {
            text: ['세나는 활을 내렸지만, 그대를 보지 않았다. “…엄마를 묻어 줄게요. 따라오지 마요.”', '그녀는 어머니를 등에 업고 산을 내려갔다.'],
            fx: { comp: { sena: 'left' } }, log: '세나가 어머니를 업고 떠났다.', next: 'c2_vask' } },
        { id: 2, insp: 'brave', label: '활을 내리라고 경고한다', roll: false, requires: SENA_AT, reqText: '세나', approve: { sena: -2 },
          note: '전투 (세나와 싸운다)',
          then: { text: ['“쏘지 마라, 세나.” 그 말이 끝나기도 전에 화살이 날아왔다.'], fx: { comp: { sena: 'hostile' } }, battle: SENA2_FIGHT('grief'), next: 'c2_vask' } },
        { id: 3, label: '무기를 내려놓고 그녀가 떠나도록 둔다', roll: false, requires: SENA_AT, reqText: '세나',
          then: { text: ['그대는 무기를 내려놓았다. 세나는 화살촉을 한참 그대에게 겨누고 있다가, 시위를 풀었다.', '“…다시는 보지 말아요.” 그녀는 어머니를 업고 어둠 속으로 사라졌다.'],
            fx: { comp: { sena: 'left' } }, log: '세나가 그대를 두고 떠났다.', next: 'c2_vask' } },
        { id: 4, label: '산장 안으로', roll: false, requires: { nor: [SENA_AT] }, reqText: '-',
          then: { text: ['전당 쪽에서 난롯불 소리가 들렸다.'], next: 'c2_vask' } }
      ]
    },
    c2_sena_judge: {
      place: '사냥꾼의 산장',
      art: { sky: 'night', bg: 'lodge', actors: [{ k: 'hero', x: 0.36 }, { k: 'sena', x: 0.6, face: -1, s: 0.9 }], fx: ['ash'] },
      title: '부러진 활', clock: '세나',
      text: ['세나가 부러진 활을 끌어안고 앉아 있었다. 그 곁에 어머니가 누워 있었다.'],
      choices: [
        { id: 1, insp: 'mercy', label: '그녀를 두고 산장 안으로 들어간다', roll: false,
          then: { text: ['돌아보지 않으려 했지만, 문턱에서 한 번 돌아보았다. 세나는 어머니의 머리를 쓰다듬고 있었다. 그대를 보지 않았다.'], log: '쓰러진 세나를 두고 산장으로 들어갔다. 그녀는 그대를 잊지 않을 것이다.', next: 'c2_vask' } },
        { id: 2, insp: 'brave', label: '끝을 낸다. 등 뒤의 화살을 남겨 둘 수 없다', roll: false,
          then: { text: ['세나는 눈을 감지 않았다. 그대가 칼을 내릴 때까지, 그 초록빛 눈은 그대를 보고 있었다.'], fx: { comp: { sena: 'dead' } }, log: '세나를 쓰러뜨렸다.', next: 'c2_vask' } }
      ]
    },
    // 산장: 그대를 원망하는 세나가 어머니를 구하러 와 있다
    c2_sena_foe: {
      place: '사냥꾼의 산장',
      art: { sky: 'night', bg: 'lodge', actors: [{ k: 'hero', x: 0.22 }, { k: 'sena', x: 0.5, face: -1 }, { k: 'rine', x: 0.8, face: -1 }], fx: ['ash'] },
      title: '산장 아래의 세나', clock: '세나',
      text: [
        '산장으로 오르는 길목, 바위 위에서 누군가 활을 겨누고 있었다. 세나였다.',
        '“엄마가 저 안에 있다는 거 알아요.” 그녀의 목소리가 차가웠다. “내가 구해요. 당신은 끼어들지 마요.”',
        '산장 문 앞에서 회색 눈의 여인이 고개를 들었다. 두 사람 사이에, 그대가 서 있었다.'
      ],
      choices: [
        { id: 1, skill: '설득', insp: 'mercy', label: '“혼자서는 못 한다. 함께 구하자.”', stat: '매력', dc: 16,
          dcMod: [{ if: { flag: 'crone_cured' }, v: -2, why: '노파의 눈을 고쳐 주었다' }, { if: { flag: 'anchor_broken' }, v: -2, why: '회색 여울을 깨웠다' }],
          success: {
            text: ['세나의 활이 흔들렸다. “…엄마를 위해서예요. 당신을 위해서가 아니라.” 그녀가 바위에서 내려와 그대 곁에 섰다. 한 걸음 떨어져서.'],
            fx: { comp: { sena: 'left' }, xp: 20 }, log: '세나와 휴전하고 함께 어머니를 구하러 갔다.', next: 'c2_lodge' },
          fail: { text: ['“당신 말은 이제 안 믿어요.” 화살이 그대의 발치에 꽂혔다. 경고였다. 다음은 경고가 아닐 것이다.'], battle: SENA2_FIGHT('foe'), log: '세나는 그대를 믿지 않았다.', next: 'c2_lodge' } },
        { id: 2, insp: 'brave', label: '비키지 않는다', roll: false, note: '전투 (세나와 싸운다)',
          then: { text: ['세나가 시위를 당겼다. “그럼 당신부터예요.”'], battle: SENA2_FIGHT('foe'), next: 'c2_lodge' } },
        { id: 3, label: '그녀가 먼저 가도록 길을 비킨다', roll: false,
          then: {
            text: ['그대가 물러서자 세나가 바위에서 뛰어내려 산장으로 달렸다. “엄마!” 회색 눈의 여인이 활을 들었다 — 그리고 쏘지 않았다. 대신 몸을 돌려 산장 뒤편 숲으로 달아났다. 세나가 그 뒤를 쫓았다.', '둘 다 돌아오지 않았다. 산장의 문은 열려 있었다.'],
            fx: { set: ['rine_lost', 'lodge_ambush'] }, log: '세나가 어머니를 쫓아 숲으로 사라졌다.', next: 'c2_vask' } }
      ]
    },
    c2_sena_judge2: {
      place: '사냥꾼의 산장',
      art: { sky: 'night', bg: 'lodge', actors: [{ k: 'hero', x: 0.36 }, { k: 'sena', x: 0.6, face: -1, s: 0.9 }], fx: ['ash'] },
      title: '부러진 활', clock: '세나',
      text: ['세나가 부러진 활을 쥔 채 그대를 노려보았다. “…엄마는 내가 구한다고 했잖아요.”'],
      choices: [
        { id: 1, insp: 'mercy', label: '“그래서 함께 가자는 거다.” 손을 내민다', roll: false,
          then: { text: ['세나는 그대의 손을 보지 않았다. 혼자 일어나, 부러진 활을 버리고 칼을 뽑았다. “…엄마를 구하고 나면, 그다음은 당신이에요.” 그러나 그녀는 그대 뒤를 따라왔다.'],
            fx: { comp: { sena: 'left' } }, log: '쓰러뜨린 세나가 칼을 들고 그대 뒤를 따라왔다.', next: 'c2_lodge' } },
        { id: 2, insp: 'brave', label: '끝을 낸다', roll: false,
          then: { text: ['세나의 초록빛 눈이 마지막까지 산장 문을 보고 있었다. 어머니가 있는 쪽을.'], fx: { comp: { sena: 'dead' } }, log: '세나를 쓰러뜨렸다.', next: 'c2_lodge' } }
      ]
    },

    // 에필로그: 이르반에게 망설인 그대에게 오르덴이 창을 겨눈다
    c2_orden_oath: {
      place: '사냥꾼의 산장',
      art: { sky: 'dawn', bg: 'lodge', actors: [{ k: 'hero', x: 0.32 }, { k: 'orden', x: 0.62, face: -1 }], fx: ['ash'] },
      title: '맹세의 창끝', clock: '오르덴',
      text: [
        { if: { party: 'orden' }, t: '연기가 걷히자 오르덴이 그대를 돌아보았다. 장창 끝이 그대를 향해 있었다.' },
        { if: { party: 'orden' }, t: '“그대는 대답하지 않았다.” 기사의 목소리가 낮았다. “천 년 전, 이르반도 왕 앞에서 대답하지 않았다. 그리고 나는 그를 문밖에 두었다.” 창끝이 떨렸다. “말하라, {name:이여}. 그대는 그의 손을 잡을 것인가?”' },
        { if: { nor: [{ party: 'orden' }] }, t: '연기가 걷힌 산장에 새벽빛이 들었다. 그대의 망설임을 본 사람은 없었다.' }
      ],
      choices: [
        { id: 1, skill: '설득', insp: 'song', label: '“망설였을 뿐이다. 그의 손을 잡지는 않는다.”', stat: '매력', dc: 13, requires: { party: 'orden' }, reqText: '오르덴',
          dcMod: [{ if: { min: { bond: 5 } }, v: -3, why: '깊은 유대' }, { if: { flag: 'oath_question' }, v: -2, why: '맹세를 묻던 밤' }],
          success: {
            text: ['오르덴의 창끝이 천천히 내려갔다. “…망설임은 죄가 아니다. 망설임 끝에 무엇을 고르느냐가 죄지.” 그가 투구를 벗었다. “그 고름을 끝까지 지켜보겠다.”'],
            approve: { orden: 1 }, log: '오르덴에게 이르반의 손은 잡지 않겠다고 답했다.', next: 'c2_after' },
          fail: {
            text: ['오르덴은 창을 거두었지만, 그대에게서 눈을 떼지 않았다. “말은 이르반도 잘했다.” 그가 돌아섰다. “나는 관문으로 돌아가겠다. 그대가 무엇을 고르는지는 — 그 문 앞에서 보겠다.”'],
            fx: { comp: { orden: 'parted' } }, log: '오르덴이 그대를 믿지 못하고 관문으로 돌아갔다.', next: 'c2_after' } },
        { id: 2, insp: 'brave', label: '“내가 무엇을 고르든, 그대가 정할 일이 아니다.” 창끝을 쳐낸다', roll: false, requires: { party: 'orden' }, reqText: '오르덴', approve: { orden: -3 },
          note: '전투 (오르덴과 싸운다)',
          then: { text: ['오르덴이 한 걸음 물러나 창을 비껴 들었다. “그렇다면 맹세에 따라.”'], fx: { comp: { orden: 'hostile' } }, battle: ORDEN_FIGHT, next: 'c2_after' } },
        { id: 3, label: '“가라, 오르덴. 그대의 문으로.”', roll: false, requires: { party: 'orden' }, reqText: '오르덴',
          then: { text: ['오르덴은 오래 그대를 보았다. “…그대가 이르반이 되지 않기를.” 그는 서쪽으로 걸어갔다. 천 년 동안 지켜 온 문을 향해.'], fx: { comp: { orden: 'parted' } }, log: '오르덴을 관문으로 돌려보냈다.', next: 'c2_after' } },
        { id: 4, label: '산을 내려간다', roll: false, requires: { nor: [{ party: 'orden' }] }, reqText: '-',
          then: { text: ['그대는 아무에게도 망설임을 들키지 않은 채 산을 내려갔다.'], next: 'c2_after' } }
      ]
    },
    c2_orden_judge: {
      place: '사냥꾼의 산장',
      art: { sky: 'dawn', bg: 'lodge', actors: [{ k: 'hero', x: 0.36 }, { k: 'orden', x: 0.6, face: -1, s: 0.9 }], fx: ['ash'] },
      title: '무릎 꿇은 기사', clock: '오르덴',
      text: ['오르덴이 한쪽 무릎을 꿇고 있었다. 장창은 그대의 발치에 있었다.', '“천 년 동안 무릎 꿇은 적이 없다.” 그가 투구 속에서 웃었다. “별께서 그대를 고르신 이유를 알 것 같군.”'],
      choices: [
        { id: 1, insp: 'mercy', label: '장창을 돌려주고 보낸다', roll: false,
          then: { text: ['오르덴은 장창을 받아 들고 일어섰다. “내 맹세는 여기서 끝났다. 남은 것은 문뿐이다.” 그는 서쪽으로 걸어갔다. 한 번도 돌아보지 않았다.'],
            fx: { comp: { orden: 'parted' }, set: ['orden_oath_broken'] }, log: '쓰러뜨린 오르덴에게 장창을 돌려주고 보냈다. 그는 관문으로 돌아갔다.', next: 'c2_after' } },
        { id: 2, insp: 'brave', label: '끝을 낸다', roll: false, approve: { sena: -2, bran: -2 },
          then: { text: ['오르덴은 투구를 벗었다. 천 년 만에 햇빛을 받은 얼굴이 그대를 올려다보았다. “카이론에게 전하마. 그대 같은 자가 있었다고.”', '새벽빛 속에서, 마지막 맹세기사가 눈을 감았다.'], fx: { comp: { orden: 'dead' } }, log: '마지막 맹세기사 오르덴을 쓰러뜨렸다.', next: 'c2_after' } }
      ]
    },

    // ───────────────────────── 곁가지: 회색 열병 (세나), 대장장이의 부탁
    c2_fever_start: {
      art: { sky: 'dusk', bg: 'ford', actors: [{ k: 'hero', x: 0.3 }, { k: 'sena', x: 0.48 }, { k: 'boy', x: 0.66, face: -1 }] },
      title: '회색 열병', clock: '세나의 부탁',
      text: [
        '물레방아 옆 헛간에 아이들이 누워 있었다. 다섯. 모두 목덜미의 낙인 둘레가 잿빛으로 부어 있었고, 숨을 쉴 때마다 쇳소리가 났다.',
        '세나가 아이 하나의 이마를 짚어 보았다. “회색 열병이에요. 낙인을 처음 찍힌 아이들이 앓아요. 할머니한테 들었어요.” 그녀가 입술을 깨물었다. “재 이끼가 있으면 열을 내릴 수 있어요. 침묵의 숲 그늘에서 자라요. 세 줌이면 돼요.”'
      ],
      choices: [
        { id: 1, label: '재 이끼를 구해 오겠다고 약속한다', roll: false, approve: { sena: 2 },
          then: { text: ['세나가 그대의 손을 꼭 쥐었다. “고마워요. 정말로.”'], fx: { set: ['q_fever'] }, log: '세나와 회색 열병을 앓는 아이들을 돕기로 했다.', next: 'map' } },
        { id: 2, label: '조각이 먼저라고 말한다', roll: false, approve: { sena: -1 },
          then: { text: ['세나는 고개를 끄덕였지만, 아이들 곁을 떠나지 못했다. “…알았어요. 그래도 이끼가 보이면 챙겨 줘요.”'], fx: { set: ['q_fever'] }, log: '조각이 먼저라고 했지만, 이끼가 보이면 챙기기로 했다.', next: 'map' } }
      ]
    },
    c2_fever_end: {
      art: { sky: 'dawn', bg: 'ford', actors: [{ k: 'hero', x: 0.3 }, { k: 'sena', x: 0.48 }, { k: 'boy', x: 0.66, face: -1 }] },
      title: '회색 열병', clock: '세나의 부탁',
      text: ['세나가 재 이끼를 빻아 끓는 물에 넣었다. 헛간 가득 쌉싸름한 냄새가 퍼졌다.', '밤새 아이들의 이마에 젖은 천을 얹고, 약을 한 숟갈씩 떠 넣었다.'],
      choices: [
        { id: 1, skill: '의학', insp: 'mercy', label: '세나와 함께 밤새 아이들을 돌본다', stat: '지혜', dc: 11,
          adv: [{ if: { party: 'sena' }, why: '세나가 약을 안다' }],
          success: {
            text: ['새벽녘, 아이들의 숨소리가 고르게 돌아왔다. 부어 있던 낙인 둘레가 가라앉았다. 한 아이가 눈을 뜨고 세나를 보며 웃었다.', '며칠 뒤, 아이들이 갈대로 엮은 부적 하나를 그대에게 내밀었다. 서툴지만 단단한 매듭이었다.'],
            fx: { drop: ['재 이끼', '재 이끼', '재 이끼'], items: ['여울의 부적'], set: ['fever_cured'], xp: 30 }, approve: { sena: 2 }, log: '회색 열병을 앓던 아이들을 살렸다. 아이들이 부적을 엮어 주었다.', next: 'map' },
          fail: {
            text: ['한 아이의 열이 끝내 내리지 않아 밤새 애가 탔다. 그러나 새벽이 오기 전, 그 아이도 기침을 멈추었다. 세나가 그대 어깨에 기대어 잠들었다.', '며칠 뒤, 아이들이 갈대로 엮은 부적 하나를 그대에게 내밀었다.'],
            fx: { drop: ['재 이끼', '재 이끼', '재 이끼'], items: ['여울의 부적'], set: ['fever_cured'], xp: 20 }, approve: { sena: 1 }, log: '힘겨운 밤 끝에 아이들을 살렸다. 아이들이 부적을 엮어 주었다.', next: 'map' } }
      ]
    },
    c2_osk: {
      art: { sky: 'dusk', bg: 'ford', actors: [{ k: 'hero', x: 0.3 }, { k: 'smith', x: 0.62, face: -1 }] },
      title: '대장장이의 부탁', clock: '오스크',
      text: ['오스크가 낙인석 조각을 하나씩 쇳물에 녹였다. 회색 빛이 쇳물 위에서 몸부림치다 사라졌다.', '“속삭임은 이 돌에서 나오오. 그러니 이 돌을 녹여 섞은 쇠는 속삭임을 막지.” 그가 망치를 들었다. 밤새 망치 소리가 이어졌다.'],
      choices: [
        { id: 1, label: '투구를 받는다', roll: false,
          then: { text: ['새벽, 오스크가 투구 하나를 그대에게 건넸다. 아직 따뜻했다. “당신 머리에 맞을 거요. 닻돌보다 단단하지.”'],
            fx: { drop: ['낙인석 조각', '낙인석 조각', '낙인석 조각'], items: ['오스크의 강철 투구'], set: ['osk_done'], xp: 20 }, log: '대장장이 오스크가 낙인석을 섞은 강철 투구를 두드려 주었다.', next: 'map' } }
      ]
    },

    // ───────────────────────── 야영 대화 (회색 여울의 여관)
    camp2_bran: {
      camp: true, art: 'camp', if: { party: 'bran', flag: 'brita_known', not: 'anchor_broken' },
      title: '모닥불 곁에서 · 브란', clock: '고요한 물 여관',
      text: [
        '브란은 여관 창가에 앉아 채석장 쪽 하늘을 보고 있었다. 회색 빛이 구름에 비쳐 희미하게 고동쳤다.',
        '“나는 열네 살에 사냥꾼을 따라갔소.” 그가 불쑥 말했다. “마을이 굶고 있었지. 사냥꾼의 사람이 와서 말했소. 한 명만 따라오면 마을을 지켜 주겠다고. 나는 그 한 명이 되었소.”',
        '“그 대가로 마을 전부가 낙인을 받았소. 브리타까지.” 그가 지진 손등을 움켜쥐었다. “내가 무엇을 지켰는지 모르겠소.”'
      ],
      choices: [
        { id: 1, insp: 'mercy', label: '“열네 살 아이가 짊어질 무게가 아니었다.”', roll: false, approve: { bran: 2 },
          then: { text: ['브란이 고개를 들었다. 오래 그대를 보다가, 짧게 웃었다. “…그대는 정말 이상한 사람이군.” 그날 밤 그는 처음으로 창가를 떠나 잠자리에 들었다.'], log: '브란에게 그 무게는 아이의 것이 아니었다고 말했다.', next: 'map' } },
        { id: 2, insp: 'brave', label: '“그러니 이번엔 제대로 지키자. 닻돌을 부수러 가자.”', roll: false, approve: { bran: 1, sena: 1 },
          then: { text: ['브란이 지팡이를 움켜쥐고 일어섰다. “내일 아침이오. 그렐에게 열네 살 소년의 손등을 돌려줄 거요.”'], log: '브란과 닻돌을 부수기로 했다.', next: 'map' } },
        { id: 3, label: '아무 말 없이 그의 곁에 앉는다', roll: false, approve: { bran: 1 },
          then: { text: ['둘은 말없이 회색 빛을 보았다. 밤이 깊어 그 빛이 흐려질 때까지.'], log: '말없이 브란 곁을 지켰다.', next: 'map' } }
      ]
    },
    camp2_bran2: {
      camp: true, art: 'camp', if: { party: 'bran', flag: 'brita_saved' },
      title: '모닥불 곁에서 · 브란', clock: '고요한 물 여관',
      text: [
        '브리타가 여관 부엌에서 국을 끓여 왔다. 브란은 그릇을 받아 들고 한참 내려다보기만 했다.',
        '“속삭임이 말이오.” 브리타가 자리를 뜬 뒤 그가 말했다. “장부를 태운 뒤로 조용해졌다고 했지만… 닻돌 앞에서 다시 들렸소. 아주 멀리서. 사냥꾼의 목소리가 아니었소.”',
        '“더 오래되고, 더 높은 곳의 목소리. ‘맺어라. 하나로 맺어라.’ 그렇게 말했소.” 브란이 그릇을 내려놓았다. “사냥꾼에게도 주인이 있는 것 같소.”'
      ],
      choices: [
        { id: 1, skill: '비전', insp: 'lore', label: '그 목소리가 별의 것일 수도 있다고 말한다', stat: '지혜', dc: 13,
          success: {
            text: ['그대는 아스텔의 목소리가 한 말을 떠올렸다. 다섯째 별이 모든 소절을 하나로 맺으려 했다는 것을.', '“맺음의 별…” 브란이 중얼거렸다. 손등의 지진 자국이 불빛 아래서 하얗게 보였다. “그렇다면 내가 천 날 동안 들은 건 별의 목소리였군.” 그는 웃지 않았다.'],
            fx: { set: ['kadel_hint'], xp: 10 }, approve: { bran: 1 }, log: '브란이 듣는 속삭임이 다섯째 별의 것일지도 모른다고 짐작했다.', next: 'map' },
          fail: { text: ['그대는 아무것도 짐작하지 못했다. 브란이 어깨를 으쓱했다. “상관없소. 누구의 목소리든 대답하지 않으면 그만이오.”'], log: '브란이 들은 목소리의 정체를 짐작하지 못했다.', next: 'map' } },
        { id: 2, insp: 'mercy', label: '브리타의 국을 같이 먹자고 한다', roll: false, approve: { bran: 2 },
          then: { text: ['브란이 그릇을 들어 한 숟갈 떴다. 그리고 한동안 아무 말도 하지 못했다. “…어머니 맛이 나오.”'], log: '브란과 브리타의 국을 나눠 먹었다.', next: 'map' } }
      ]
    },
    camp2_sena: {
      camp: true, art: 'camp', if: { party: 'sena', flag: 'rine_seen', not: ['rine_freed', 'rine_slain', 'rine_lost'] },
      title: '모닥불 곁에서 · 세나', clock: '고요한 물 여관',
      text: [
        '세나는 회색 깃의 화살을 무릎에 올려놓고 매듭만 만지작거렸다.',
        '“엄마는 사냥개들이 처음 마을에 내려왔던 밤에 사라졌어요. 세 마리를 쏘고, 네 번째는 못 쐈대요.” 그녀의 목소리가 떨렸다. “다들 죽었다고 했어요. 시신은 못 찾았지만.”',
        '“이 매듭은 엄마가 나한테만 가르쳐 준 거예요. 바람에 깃이 안 풀리게.” 세나가 그대를 보았다. “엄마가 살아 있다면… 사냥꾼의 화살을 쏘고 있다면… 나는 어떻게 해야 해요?”'
      ],
      choices: [
        { id: 1, insp: 'mercy', label: '“함께 데려오자. 낙인은 끊을 수 있다.”', roll: false, approve: { sena: 2 },
          then: { text: ['세나가 화살을 꼭 쥐었다. “…네.” 그리고 처음으로 울었다. 소리 없이, 오래.'], fx: { set: ['sena_hope'] }, log: '세나에게 어머니를 함께 데려오자고 했다.', next: 'map' } },
        { id: 2, insp: 'brave', label: '“그분이 쏘는 화살은 내가 받아 내겠다.”', roll: false, approve: { sena: 1 },
          then: { text: ['세나가 그대를 한참 보다가, 눈물을 훔치며 웃었다. “…바보. 엄마는 백발백중이에요.”'], log: '세나에게 어머니의 화살은 자신이 받아 내겠다고 했다.', next: 'map' } },
        { id: 3, label: '“각오해 둬. 그분은 이미 다른 사람일지도 모른다.”', roll: false, approve: { sena: -1 },
          then: { text: ['세나가 고개를 숙였다. “…알아요. 알지만.” 그날 밤 그녀는 화살을 품에 안고 잠들었다.'], log: '세나에게 최악을 각오하라고 했다.', next: 'map' } }
      ]
    },
    camp2_orden: {
      camp: true, art: 'camp', if: { party: 'orden', flag: 'irvan_named', not: 'done_c2_end' },
      title: '모닥불 곁에서 · 오르덴', clock: '고요한 물 여관',
      text: [
        '오르덴은 그대가 들려준 이름을 몇 번이고 되뇌었다. 이르반.',
        '“그 이름을 안다.” 마침내 그가 말했다. “왕의 사냥꾼장. 맹세기사가 아니었지만, 우리와 같은 날 같은 제단에서 맹세했다. 왕의 문을 지키겠다고.”',
        '“별이 떨어지던 밤, 왕은 그에게 빛을 쫓으라 명했고 우리에게는 문을 닫으라 명했다. 그가 돌아왔을 때 문은 이미 닫혀 있었다.” 기사가 장창을 쥔 손에 힘을 주었다. “우리가 그를 문밖에 두었다. 그의 가족이 불에 탈 때.”'
      ],
      choices: [
        { id: 1, insp: 'mercy', label: '“그것이 그대의 죄는 아니다. 왕의 명령이었다.”', roll: false, approve: { orden: 1 },
          then: { text: ['오르덴이 고개를 저었다. “명령을 따른 것도 죄가 될 수 있다. 카이론이 그렇게 말했지.” 그러나 그의 어깨가 조금 내려앉았다.'], log: '오르덴에게 그것은 왕의 명령이었다고 말했다.', next: 'map' } },
        { id: 2, skill: '역사', insp: 'lore', label: '그날 밤 왕의 명령이 정확히 무엇이었는지 묻는다', stat: '지혜', dc: 13,
          success: {
            text: ['오르덴이 오래 기억을 더듬었다. “…왕은 ‘빛을 쫓으라’고 하지 않았다. ‘빛을 붙잡아 왕에게 바치라’고 했다. 이르반은 왕을 위해 별을 붙잡은 것이다.”', '“그렇다면 그 조각을 원한 것은 처음부터 왕이었다.” 기사의 목소리가 낮아졌다. “거울 호수 아래의 도시에 그 답이 있을 것이다.”'],
            fx: { set: ['aurel_suspect'], xp: 10 }, approve: { orden: 1 }, log: '오르덴에게서 왕이 별의 빛을 원했다는 것을 들었다.', next: 'map' },
          fail: { text: ['오르덴은 끝내 기억해 내지 못했다. “천 년이다. 많은 것이 돌 속에서 흐려졌다.”'], log: '오르덴은 그날 밤의 명령을 기억해 내지 못했다.', next: 'map' } }
      ]
    },
    camp2_pup: {
      camp: true, art: 'camp', if: { item: '잿빛 새끼', not: 'pup_named', flag: 'done_c2_ford' },
      title: '모닥불 곁에서 · 새끼', clock: '고요한 물 여관',
      text: [
        '잿빛 새끼는 이제 새끼라고 부르기 어려울 만큼 자랐다. 그대의 무릎을 베고 누워 모닥불을 보는 눈이 호박색으로 빛났다. 이마에는 여전히 낙인이 없었다.',
        '여관 주인의 딸이 다가와 물었다. “이 아이 이름이 뭐예요?” 그대는 대답하지 못했다. 이름을 지어 준 적이 없었다.'
      ],
      choices: [
        { id: 1, label: '“재.” 재 속에서 자란 아이니까', roll: false,
          then: { text: ['“재.” 그대가 부르자 귀가 쫑긋 섰다. 꼬리가 바닥을 두 번 쳤다. 마음에 드는 모양이었다.'], fx: { set: ['pup_named'], names: { pup: '재' } }, log: '새끼에게 ‘재’라는 이름을 지어 주었다.', next: 'map' } },
        { id: 2, label: '“새벽.” 비가 그친 새벽에 만났으니까', roll: false,
          then: { text: ['“새벽.” 새끼가 고개를 갸웃하더니, 그대의 손등을 핥았다.'], fx: { set: ['pup_named'], names: { pup: '새벽' } }, log: '새끼에게 ‘새벽’이라는 이름을 지어 주었다.', next: 'map' } },
        { id: 3, label: '“아스텔.” 별의 이름을 빌려', roll: false,
          then: { text: ['그 이름을 부르는 순간, 품 안의 {relic:이} 희미하게 떨렸다. 새끼가 짧게 짖었다. 소리가 별빛처럼 맑았다.'], fx: { set: ['pup_named', 'pup_star'], names: { pup: '아스텔' } }, log: '새끼에게 별의 이름 ‘아스텔’을 지어 주었다.', next: 'map' } }
      ]
    },

    // ───────────────────────── 탐색 (동쪽 변경)
    ex2_cairn: {
      title: '돌무덤의 공물', clock: '탐색',
      text: ['고갯마루에 돌무덤 하나. 재에 덮인 공물들 — 마른 꽃, 나무 별, 아이 신발 한 짝. 낙인을 받기 전, 누군가 이곳에 무언가를 빌었다.'],
      choices: [
        { id: 1, skill: '역사', insp: 'lore', label: '돌에 새겨진 글씨를 읽는다', stat: '지혜', dc: 11,
          success: { text: ['‘사냥꾼이 오지 않게 하소서. 오더라도 아이들만은.’ 그대는 돌무덤에 작은 돌 하나를 얹었다. 이상하게 마음이 가벼워졌다.'], fx: { mp: 4, xp: 4 }, log: '고갯마루 돌무덤의 기도를 읽었다 (마력 +4).', next: 'map' },
          fail: { text: ['글씨는 재에 지워져 읽을 수 없었다.'], next: 'map' } },
        { id: 2, label: '공물 사이의 동전을 챙긴다', roll: false, approve: { sena: -1 },
          then: { text: ['동전 몇 닢이 손에 쥐어졌다. 바람이 돌무덤 쪽에서 차갑게 불어왔다.'], fx: { gold: [8, 15] }, log: '돌무덤의 공물 사이에서 동전을 챙겼다.', next: 'map' } }
      ]
    },
    ex2_snare: {
      title: '사냥꾼의 올무', clock: '탐색',
      text: ['바위 틈의 올무에 회색 여우 한 마리가 걸려 있었다. 발목에서 피가 흐르는데도 여우는 울지 않았다. 목에 낙인이 반쯤 찍혀 있었다.'],
      choices: [
        { id: 1, skill: '손재주', insp: 'mercy', label: '올무를 풀어 준다', stat: '민첩', dc: 11,
          success: { text: ['올무가 풀리자 여우가 비틀거리며 바위 뒤로 사라졌다. 잠시 뒤, 바위 위에 무언가 반짝이는 것이 놓여 있었다. 누군가 떨어뜨린 은빛 병이었다.'], fx: { items: ['은빛 물약'], xp: 4 }, approve: { sena: 1 }, log: '올무에 걸린 여우를 풀어 주었다. 여우가 사라진 자리에 물약이 있었다.', next: 'map' },
          fail: { text: ['여우가 겁에 질려 그대의 손을 물었다. 그래도 올무는 풀렸다.'], fx: { hp: -3 }, approve: { sena: 1 }, log: '여우를 풀어 주다 물렸다 (HP -3).', next: 'map' } },
        { id: 2, label: '올무 줄을 걷어 간다', roll: false,
          then: { text: ['그대는 올무 줄을 감아 챙겼다. 여우는 그대를 보지 않았다.'], fx: { gold: [3, 6] }, log: '올무 줄을 걷어 팔았다.', next: 'map' } }
      ]
    },
    ex2_moss: {
      title: '재 이끼', clock: '탐색', if: { flag: 'q_fever', not: 'fever_cured' },
      text: ['쓰러진 나무 그늘, 재가 두껍게 쌓인 곳에 잿빛 이끼가 융단처럼 자라 있었다.'],
      choices: [
        { id: 1, skill: '생존', insp: 'wild', label: '뿌리째 다치지 않게 걷어 낸다', stat: '지혜', dc: 11,
          adv: [{ if: { party: 'sena' }, why: '세나가 약초를 안다' }],
          success: { text: ['그대는 이끼를 두 줌 걷어 냈다. 쌉싸름한 냄새가 났다.'], fx: { items: ['재 이끼', '재 이끼'], xp: 3 }, log: '재 이끼 두 줌을 모았다.', next: 'map' },
          fail: { text: ['이끼가 손 안에서 바스러졌다. 겨우 한 줌을 건졌다.'], fx: { items: ['재 이끼'] }, log: '재 이끼 한 줌을 모았다.', next: 'map' } }
      ]
    },
    ex2_shrine: {
      title: '무너진 별 사당', clock: '탐색',
      text: ['흰 나무 사이에 작은 돌 사당이 무너져 있었다. 지붕 위의 일곱 별 장식 가운데 하나만 깨져 있었다.'],
      choices: [
        { id: 1, skill: '비전', insp: 'lore', label: '사당에 남은 별빛을 모은다', stat: '지혜', dc: 12,
          success: { text: ['깨진 별 장식의 자리에서 희미한 빛이 그대의 손으로 흘러들었다. 피로가 씻겨 나갔다.'], fx: { hp: 12, mp: 6, xp: 4 }, log: '무너진 별 사당에서 별빛을 받았다 (HP +12, 마력 +6).', next: 'map' },
          fail: { text: ['빛은 그대의 손가락 사이로 흩어졌다.'], next: 'map' } },
        { id: 2, label: '깨진 별 장식을 바로 세워 둔다', roll: false,
          then: { text: ['그대는 깨진 조각을 맞춰 제자리에 올려 두었다. 숲이 아주 잠깐, 숨을 쉬는 것 같았다.'], fx: { xp: 3 }, approve: { sena: 1 }, log: '무너진 별 사당의 장식을 바로 세웠다.', next: 'map' } }
      ]
    },
    ex2_path: {
      title: '휘어진 고사리', clock: '탐색', if: { not: ['grove_found', 'shard1'] },
      text: ['숲을 헤매다 고사리 한 무더기가 꺾이지 않고 휘어진 자리를 발견했다. 무언가가 아무것도 부수지 않고 지나간 자국이었다.'],
      choices: [
        { id: 1, skill: '생존', insp: 'wild', label: '휘어진 자국을 따라간다', stat: '지혜', dc: 11,
          adv: [{ if: { party: 'sena' }, why: '세나가 짐승의 길을 안다' }, { if: { item: '잿빛 새끼' }, why: '{pup}의 코' }],
          success: { text: ['자국은 흰 나무들이 둥글게 둘러선 빈터로 이어졌다. 그 한가운데, 별빛이 고인 물웅덩이.'], fx: { set: ['grove_found'], xp: 8 }, log: '휘어진 고사리를 따라 고요의 못을 찾아냈다.', next: 'map' },
          fail: { text: ['자국은 어느새 다시 사라졌다. 그래도 방향은 알 것 같다. 조금 더 헤매 보자.'], next: 'map' } }
      ]
    },
    ex2_chips: {
      title: '낙인석 부스러기', clock: '탐색', if: { flag: 'q_osk', not: 'osk_done' },
      text: ['채석장 비탈 아래, 깎다 버린 회색 돌 부스러기가 무더기로 쌓여 있었다. 아직 미지근한 조각들이 섞여 있다.'],
      choices: [
        { id: 1, skill: '운동', insp: 'brave', label: '무더기를 헤쳐 쓸 만한 조각을 고른다', stat: '힘', dc: 12,
          success: { text: ['손이 회색 가루투성이가 되었지만, 미지근한 조각 하나를 건졌다.'], fx: { items: ['낙인석 조각'], xp: 3 }, log: '낙인석 조각 하나를 건졌다.', next: 'map' },
          fail: { text: ['무더기가 무너지며 그대를 덮쳤다. 쓸 만한 조각은 없었다.'], fx: { hp: -3 }, log: '돌무더기에 깔렸다 (HP -3).', next: 'map' } }
      ]
    },
    ex2_trophy: {
      title: '처마 밑의 전리품', clock: '탐색',
      text: ['산장 별채 처마 밑에 사냥 전리품이 걸려 있었다. 가죽, 뿔, 그리고 순찰병들이 빼앗은 듯한 작은 주머니들.'],
      choices: [
        { id: 1, skill: '은신', insp: 'sly', label: '들키지 않게 주머니를 걷어 온다', stat: '민첩', dc: 13,
          success: { text: ['그대는 그림자를 타고 처마 밑을 지나며 주머니 두 개를 챙겼다. 금화와, 빼앗긴 이름이 수놓인 손수건.'], fx: { gold: [15, 30], xp: 4 }, log: '산장 처마 밑에서 빼앗긴 주머니를 되찾았다.', next: 'map' },
          fail: { text: ['처마의 뿔이 떨어지며 요란한 소리를 냈다. 사냥개들이 짖기 시작했다!'], fx: { set: ['alerted2'] }, log: '전리품을 건드리다 들켰다.', next: 'map' } }
      ]
    }
  });

  // ───────────────────────── 장소 (동쪽 변경)
  Object.assign(SC.locations, {
    pass: {
      region: 'east', art: { sky: 'dusk', bg: 'slope', fx: ['ash'] },
      name: '잿빛 고개', x: 45, y: 200, lv: '5~6', if: { flag: 'ch2' },
      desc: [
        '관문 동쪽의 높은 고개. 눈 대신 잿빛 재가 소리 없이 내려 쌓인다. 사냥꾼의 땅이 시작되는 곳이다.',
        { if: { not: 'done_c2_ford' }, t: '고개 아래로 물레방아가 도는 마을의 지붕들이 내려다보인다.' }
      ],
      onEnter: [{ event: 'c2_pass', if: { not: 'done_c2_pass' } }],
      encounters: [{ w: 3, e: ['brandwolf', 'brandwolf'] }, { w: 2, e: ['hawk'] }, { w: 2, e: ['patrol'] }, { w: 1, e: ['patrol', 'brandwolf'] }],
      ambush: 0.2, field: { high: 'both' },
      explore: ['ex2_cairn', 'ex2_snare'],
      links: [{ to: 'gate' }, { to: 'ford' }]
    },
    ford: {
      region: 'east',
      art: [{ if: { flag: 'anchor_broken' }, sky: 'dawn', bg: 'ford' }, { sky: 'dusk', bg: 'ford', fx: ['ash'] }],
      name: '회색 여울', x: 125, y: 158, lv: '안전', if: { flag: 'ch2' },
      desc: [
        { if: { not: 'anchor_broken' }, t: '물레방아가 도는 마을. 사람들은 목덜미에 회색 낙인을 달고 말없이 일한다. 대장간 망치 소리만이 마을의 유일한 소리다.' },
        { if: { flag: 'anchor_broken' }, t: '물레방아가 도는 마을. 닻돌이 부서진 뒤로 사람들이 깨어나, 마을에 소리가 돌아왔다.' },
        { if: { flag: 'ford_burned' }, t: '사냥의 밤에 불탄 지붕들이 아직 그을린 채로 남아 있다.' },
        '‘고요한 물’ 여관과 오스크의 대장간이 여울가에 있다.'
      ],
      onEnter: [{ event: 'c2_ford', if: { not: 'done_c2_ford' } }, { event: 'c2_night', if: { flag: 'shard1', not: 'done_c2_night' } }],
      rest: [{ t: '‘고요한 물’ 여관에서 쉰다' }], restIf: { flag: 'done_c2_ford' }, restFree: true,
      shop: { name: '오스크의 대장간', items: ['은빛 물약', '푸른 물약', '야영 물자', '기름 병', '불꽃 병', '사슬 갑옷', '철 투구', '여울 장화', '여행자의 행운 부적'] },
      actions: [
        { label: '헛간에서 앓는 아이들을 살핀다', event: 'c2_fever_start', if: { party: 'sena', flag: 'done_c2_ford', not: 'q_fever' } },
        { label: '재 이끼로 세나와 함께 약을 달인다', event: 'c2_fever_end', if: { flag: 'q_fever', not: 'fever_cured', count: { '재 이끼': 3 } }, star: true },
        { label: '오스크에게 낙인석 조각을 건넨다', event: 'c2_osk', if: { flag: 'q_osk', not: 'osk_done', count: { '낙인석 조각': 3 } }, star: true },
        { label: '물레방아 뒤편, 브란의 옛집으로 간다', event: 'rejoin_bran', if: { flag: 'done_c2_ford', any: ['bran_parted', 'bran_left'] } }
      ],
      links: [{ to: 'pass' }, { to: 'quarry' }, { to: 'woods' }, { to: 'lodge' }]
    },
    quarry: {
      region: 'east', art: [{ if: { flag: 'anchor_broken' }, sky: 'dusk', bg: 'quarry', props: ['anchorbroken'] }, { sky: 'dusk', bg: 'quarry', props: ['anchor'], fx: ['ash'] }],
      name: '낙인 채석장', x: 55, y: 92, lv: '6~7', if: { flag: 'done_c2_ford' },
      desc: [
        '산허리를 계단처럼 깎아 낸 채석장. 회색 돌기둥 — 닻돌 — 이 한가운데서 맥박처럼 빛난다.',
        { if: { flag: 'anchor_broken' }, t: '쪼개진 닻돌이 쓰러져 있다. 낙인공들은 흩어졌지만, 남은 자들이 아직 돌을 깎는다.' }
      ],
      onEnter: [{ event: 'c2_bran_foe', if: { flag: 'bran_hostile', not: 'bran_confronted' } }],
      encounters: [{ w: 3, e: ['mason', 'brandwolf'] }, { w: 2, e: ['patrol', 'patrol'] }, { w: 1, e: ['brandbear'] }, { w: 1, e: ['mason', 'mason'] }],
      ambush: 0.25, field: { high: 'foe', cover: true },
      explore: ['ex2_chips'],
      actions: [
        { label: '닻돌로 내려간다 (권장 레벨 6)', event: 'c2_quarry', if: { not: 'anchor_broken' }, star: true }
      ],
      links: [{ to: 'ford' }, { to: 'lodge' }]
    },
    woods: {
      region: 'east', art: { sky: 'night', bg: 'forest', fx: ['motes', 'fog'] },
      name: '침묵의 숲', x: 215, y: 165, lv: '6~7', if: { flag: 'done_c2_ford' },
      desc: [
        '소리가 사라지는 숲. 발밑의 낙엽도, 바람도, 그대의 목소리도 이 숲에서는 들리지 않는다.',
        { if: { not: ['grove_found', 'shard1'] }, t: '흰 사슴의 그림자가 이따금 나무 사이를 스친다. 고요의 못은 숲 깊은 곳에 있다.' }
      ],
      onEnter: [{ event: 'c2_woods', if: { not: ['done_c2_woods', 'grove_found'] } }],
      encounters: [{ w: 3, e: ['moths'] }, { w: 2, e: ['brandbear'] }, { w: 2, e: ['moths', 'brandwolf'] }, { w: 1, e: ['hawk', 'hawk'] }],
      ambush: 0.2, field: { cover: true },
      explore: ['ex2_path', 'ex2_moss', 'ex2_shrine'],
      links: [{ to: 'ford' }, { to: 'grove' }, { to: 'lodge' }]
    },
    grove: {
      region: 'east',
      art: [{ if: { flag: 'shard1' }, sky: 'star', bg: 'grove', fx: ['motes'] }, { sky: 'night', bg: 'grove', actors: [{ k: 'stag', x: 0.7, face: -1 }], fx: ['motes'] }],
      name: '고요의 못', x: 285, y: 105, lv: '7', if: { or: [{ flag: 'grove_found' }, { flag: 'shard1' }] },
      desc: [
        '흰 나무들이 둥글게 둘러선 빈터. 거울처럼 잔잔한 못에 일곱 별이 비친다.',
        { if: { flag: 'shard1' }, t: '못에 비치는 별은 이제 여섯. 흰 사슴은 보이지 않지만, 어딘가에서 그대를 지켜보는 것 같다.' }
      ],
      onEnter: [{ event: 'c2_grove', if: { not: 'shard1' } }],
      rest: [{ t: '고요의 못가에서 쉰다' }], restIf: { flag: 'shard1' }, restFree: true, noCamp: true,
      links: [{ to: 'woods' }]
    },
    lodge: {
      region: 'east', art: { sky: 'night', bg: 'lodge', fx: ['ash'] },
      name: '사냥꾼의 산장', x: 175, y: 45, lv: '7~8', if: { flag: 'ch2', or: [{ flag: 'lodge_known' }, { flag: 'ledger_page' }] },
      desc: [
        '북쪽 산등성이의 통나무 산장. 처마 밑에 사냥 전리품이 줄지어 걸려 있다.',
        { if: { flag: 'done_c2_end' }, t: '사냥 대장이 쓰러진 뒤에도 남은 순찰병들이 산장을 지킨다. 뿔피리는 다시 울리지 않는다.' }
      ],
      encounters: [{ w: 3, e: ['patrol', 'hawk'] }, { w: 2, e: ['brandwolf', 'brandwolf', 'patrol'] }, { w: 1, e: ['mason', 'patrol'] }],
      ambush: 0.3, field: { high: 'foe', cover: true },
      explore: ['ex2_trophy'],
      actions: [
        { label: '산장으로 쳐들어간다 (권장 레벨 8)', event: 'c2_lodge', if: { flag: 'done_c2_night', not: ['done_c2_lodge', 'done_c2_sena_foe'], nor: [{ flag: 'sena_hostile' }] }, star: true },
        { label: '산장으로 쳐들어간다 (권장 레벨 8)', event: 'c2_sena_foe', if: { flag: ['done_c2_night', 'sena_hostile'], not: ['done_c2_lodge', 'done_c2_sena_foe'] }, star: true }
      ],
      links: [{ to: 'ford' }, { to: 'quarry' }, { to: 'woods' }]
    }
  });
  // 1장의 관문에서 동쪽으로 가는 길과, 2장을 여는 행동
  SC.locations.gate.links.push({ to: 'pass' });
  SC.locations.gate.actions.push({ label: '동쪽 고개를 넘는다 — 제2장 「회색 사냥꾼」', event: 'c2_start', if: { flag: 'done_n10', not: 'ch2' }, star: true });
})(window.SCENARIO);
