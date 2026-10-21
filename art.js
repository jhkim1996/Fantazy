// 장면 그림: 캔버스에 그리는 실루엣 일러스트 (하늘 · 배경 · 인물 · 짐승 · 날씨 · 전투 효과)
// Art.mount(canvas, getInfo) → Art.scene(spec) 로 장면을 바꾸고, Art.fx({...}) 로 전투 효과를 띄운다.
window.Art=(function(){
  const W=640,H=280,GY=H*0.9;
  let cv=null,g=null,spec=null,getInfo=()=>({}),fxq=[],raf=0,scale=1,onPick=null,lastDraw=0;
  const motion=!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);

  function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
  function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function hex(c){const n=parseInt(c.slice(1),16);return[n>>16&255,n>>8&255,n&255]}
  function mix(a,b,t){const A=hex(a),B=hex(b);return'rgb('+A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')+')'}

  const SKY={
    rain:{top:'#1f2632',mid:'#38424f',hz:'#5a6575',ink:'#11141a',rim:'#b4c6de'},
    dusk:{top:'#221d36',mid:'#5b4057',hz:'#bd7f57',ink:'#15111b',rim:'#f2b27c'},
    night:{top:'#060a19',mid:'#111934',hz:'#253158',ink:'#04060e',rim:'#93a9ff'},
    dawn:{top:'#33467a',mid:'#b5746a',hz:'#f0bf78',ink:'#1c1921',rim:'#ffd9a0'},
    star:{top:'#09112e',mid:'#162450',hz:'#2a4478',ink:'#060a1a',rim:'#a2c2ff'},
    cave:{top:'#100e14',mid:'#211c28',hz:'#3e3448',ink:'#06050a',rim:'#e0a46c'}
  };
  let P=SKY.rain;
  const far=()=>mix(P.ink,P.hz,.5),mid=()=>mix(P.ink,P.hz,.27),ink=()=>P.ink;

  // ── 기본 도형
  function seg(x1,y1,x2,y2){g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()}
  function circ(x,y,r){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill()}
  function ell(x,y,rx,ry,rot){g.beginPath();g.ellipse(x,y,rx,ry,rot||0,0,Math.PI*2);g.fill()}
  function poly(pts){g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill()}
  function glow(x,y,r,col,a){
    const gr=g.createRadialGradient(x,y,0,x,y,r);const c=hex(col);
    gr.addColorStop(0,'rgba('+c+','+(a==null?.9:a)+')');gr.addColorStop(1,'rgba('+c+',0)');
    g.save();g.globalCompositeOperation='lighter';g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();g.restore();
  }
  function peaks(r,y0,amp,n,col){g.fillStyle=col;g.beginPath();g.moveTo(0,H);const st=W/n;for(let i=0;i<=n;i++)g.lineTo(i*st,y0-(i%2?amp*(.55+r()*.45):amp*r()*.25));g.lineTo(W,H);g.closePath();g.fill()}
  function hills(r,y0,amp,col,tilt){g.fillStyle=col;g.beginPath();g.moveTo(0,H);g.lineTo(0,y0);let x=0;while(x<W){const w=70+r()*90,h=amp*(.4+r()*.6);const yb=y0-(tilt||0)*(x/W);g.quadraticCurveTo(x+w/2,yb-h,x+w,yb-(tilt||0)*(w/W));x+=w}g.lineTo(W,H);g.closePath();g.fill()}
  function ground(col,y){g.fillStyle=col;g.fillRect(0,y==null?GY-2:y,W,H)}
  function pine(x,y,h,col){g.fillStyle=col;for(let i=0;i<3;i++){const w=h*(.34-i*.07),yy=y-h*(.25+i*.25);poly([[x,yy-h*.32],[x+w,yy+h*.12],[x-w,yy+h*.12]])}g.fillRect(x-h*.03,y-h*.2,h*.06,h*.2)}

  // ── 하늘
  function sky(){
    const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,P.top);gr.addColorStop(.6,P.mid);gr.addColorStop(1,P.hz);
    g.fillStyle=gr;g.fillRect(0,0,W,H);
  }

  // ── 배경
  const BG={
    mountains(r){peaks(r,H*.5,H*.22,9,far());peaks(r,H*.68,H*.16,7,mid());ground(ink(),GY-6)},
    slope(r){peaks(r,H*.48,H*.2,9,far());hills(r,H*.72,H*.12,mid(),-H*.15);hills(r,H*.9,H*.06,ink(),-H*.1)},
    forest(r){
      hills(r,H*.62,H*.1,far());
      for(let i=0;i<14;i++)pine(i*W/13+r()*20,H*.74,60+r()*30,mix(P.ink,P.hz,.35));
      for(let i=0;i<9;i++)pine(i*W/8+r()*30,H*.98,100+r()*50,ink());
      ground(ink(),GY);
    },
    village(r){
      peaks(r,H*.5,H*.2,9,far());hills(r,H*.76,H*.08,mid());
      const c=ink();g.fillStyle=c;
      [[.08,.9],[.2,.78],[.33,.95]].forEach(([px,sc],i)=>{
        const x=W*px,w=70*sc,h=48*sc,y=GY-2;g.fillRect(x,y-h,w,h);
        poly(i===1?[[x-6,y-h],[x+w*.45,y-h-34*sc],[x+w*.6,y-h-18*sc],[x+w+6,y-h]]:[[x-6,y-h],[x+w/2,y-h-34*sc],[x+w+6,y-h]]);
      });
      // 언덕 위 오두막 하나만 불이 켜져 있다
      g.fillStyle=c;poly([[W*.62,GY],[W*.76,H*.66],[W*.92,H*.7],[W,GY]]);
      const hx=W*.74,hy=H*.67;g.fillRect(hx,hy-34,54,34);poly([[hx-6,hy-34],[hx+27,hy-58],[hx+60,hy-34]]);
      g.fillStyle='#f3b65c';g.fillRect(hx+20,hy-24,12,11);glow(hx+26,hy-18,46,'#f3a64a',.55);
      ground(c,GY);
    },
    hut(r,t){
      g.fillStyle=mix(P.ink,'#3a2a20',.6);g.fillRect(0,0,W,H);
      g.fillStyle=mix(P.ink,'#3a2a20',.25);for(let i=0;i<5;i++)g.fillRect(0,22+i*58,W,6);
      g.fillStyle='#2f3846';g.fillRect(W*.58,H*.18,120,84);g.strokeStyle='#4a5566';g.lineWidth=1;
      for(let i=0;i<14;i++){const x=W*.58+((i*37+t*90)%120),y=H*.18+((i*53+t*170)%84);seg(x,y,x-4,y+10)}
      g.fillStyle=mix(P.ink,'#3a2a20',.15);g.fillRect(W*.58-4,H*.18-4,128,4);g.fillRect(W*.58+58,H*.18,4,84);
      // 화로
      const hx=W*.14,hy=GY-6;g.fillStyle='#1a1410';ell(hx,hy,60,12);
      const fl=motion?Math.sin(t*9)*3+Math.sin(t*13)*2:0;
      g.fillStyle='#f08a3a';poly([[hx-18,hy],[hx-4,hy-36-fl],[hx+4,hy-18],[hx+12,hy-42+fl],[hx+20,hy]]);
      glow(hx,hy-24,150+fl*4,'#f08a3a',.5);
      g.fillStyle='#0d0a08';g.fillRect(0,GY,W,H);
    },
    stairs(r){
      peaks(r,H*.42,H*.18,9,far());
      g.fillStyle=mid();poly([[W*.45,H],[W*.62,H*.2],[W*.95,H*.12],[W,H*.14],[W,H]]);
      const c=ink();const n=13;
      for(let i=0;i<n;i++){
        const t=i/n,x=W*.02+t*W*.72,y=GY-t*H*.62,w=W*.1;
        g.fillStyle=c;g.fillRect(x,y-H*.05,w+W*.3,H);
        g.fillStyle=mix(P.ink,P.hz,.18);g.fillRect(x,y-H*.05,w+W*.3,2);
      }
      // 계단 꼭대기의 관문
      g.fillStyle=c;g.fillRect(W*.74,H*.1,W*.16,H*.2);g.fillStyle=mix(P.ink,P.hz,.08);g.fillRect(W*.8,H*.17,W*.04,H*.13);
    },
    gate(r){
      peaks(r,H*.4,H*.18,9,far());
      const c=ink();g.fillStyle=mid();g.fillRect(W*.18,H*.06,W*.64,H);
      g.fillStyle=c;g.fillRect(W*.22,H*.1,W*.56,H);
      g.fillStyle=mix(P.ink,P.hz,.06);g.fillRect(W*.44,H*.55,W*.12,H);
      // 일곱 별의 원
      const cx0=W*.5,cy0=H*.32;g.strokeStyle=mix(P.ink,P.hz,.45);g.lineWidth=2;g.beginPath();g.arc(cx0,cy0,34,0,Math.PI*2);g.stroke();
      for(let i=0;i<7;i++){const a=-Math.PI/2+i*Math.PI*2/7,x=cx0+Math.cos(a)*34,y=cy0+Math.sin(a)*34;
        if(i===6){g.strokeStyle=mix(P.ink,P.hz,.6);g.beginPath();g.arc(x,y,4,0,Math.PI*2);g.stroke()}else{g.fillStyle='#cfd8e6';circ(x,y,3);glow(x,y,10,'#9fc0ff',.35)}}
      // 기사 석상들
      [.08,.16,.84,.92].forEach(px=>knight(W*px,GY,78,px<.5?1:-1,{stone:true}));
      ground(c,GY);
    },
    aqueduct(r,t){
      g.fillStyle=mid();g.fillRect(0,0,W,H);
      for(let i=3;i>=1;i--){const s=i/3,w=W*.5*s+80,h=H*.75*s+40,x=W/2-w/2,y=GY-h;
        g.fillStyle=mix(P.ink,P.hz,.16+(3-i)*.1);g.beginPath();g.moveTo(x,GY);g.lineTo(x,y+w/2);g.arc(W/2,y+w/2,w/2,Math.PI,0);g.lineTo(x+w,GY);g.closePath();g.fill()}
      g.fillStyle='#16222c';g.fillRect(0,GY-24,W,H);
      g.strokeStyle='#3f5a6e';g.lineWidth=1.5;
      for(let i=0;i<12;i++){const x=(i*61+(motion?t*20:0))%W,y=GY-16+(i%3)*7;seg(x,y,x+24,y)}
    },
    tomb(r){
      g.fillStyle=mid();g.fillRect(0,0,W,H);
      for(let i=0;i<9;i++){const a=i/8,x=W*.06+a*W*.88,dz=1-Math.abs(a-.5)*1.1,h=H*.7*dz+40,w=18*dz+8;
        g.fillStyle=mix(P.ink,P.hz,.22+dz*.22);g.fillRect(x-w/2,GY-h-20,w,h);g.fillRect(x-w,GY-h-26,w*2,8)}
      g.fillStyle=ink();ell(W/2,GY,W*.48,26);g.fillRect(0,GY,W,H);
      g.fillStyle='#8fb6e8';poly([[W*.42,GY-6],[W*.46,GY-34],[W*.54,GY-34],[W*.58,GY-6]]);
      g.fillStyle='#1e2c46';poly([[W*.44,GY-10],[W*.47,GY-30],[W*.53,GY-30],[W*.56,GY-10]]);
    },
    hall(r){
      g.fillStyle=mid();g.fillRect(0,0,W,H);
      g.strokeStyle=mix(P.ink,P.hz,.38);g.lineWidth=14;
      for(let i=0;i<4;i++){const x=W*(.12+i*.26),bw=W*.2;g.beginPath();g.arc(x+bw/2,H*.55,bw/2,Math.PI,i===2?Math.PI*1.55:0);g.stroke();
        g.fillStyle=mix(P.ink,P.hz,.38);g.fillRect(x-7,H*.55,14,H);g.fillRect(x+bw-7,H*.55,14,H)}
      g.fillStyle=ink();for(let i=0;i<9;i++){const x=r()*W,s=10+r()*26;poly([[x,GY],[x+s*.3,GY-s],[x+s,GY-s*.6],[x+s*1.3,GY]])}
      ground(ink(),GY);
    },
    barrier(r,t){
      g.fillStyle=mid();g.fillRect(0,0,W,H);
      g.fillStyle=ink();ell(W/2,GY,W*.5,34);g.fillRect(0,GY,W,H);
      g.strokeStyle='#6f8fd8';g.globalAlpha=.5;g.lineWidth=2;g.beginPath();g.ellipse(W/2,GY,W*.4,24,0,0,Math.PI*2);g.stroke();g.globalAlpha=1;
      for(let i=0;i<7;i++){const a=Math.PI*(.05+i*.15),x=W/2-Math.cos(a)*W*.44,dz=.6+Math.sin(a)*.4,h=H*.55*dz,y=GY-Math.sin(a)*18;
        g.fillStyle=mix(P.ink,P.hz,.25*dz);g.fillRect(x-9*dz,y-h,18*dz,h);
        const pulse=motion?.5+.5*Math.sin(t*2+i):.8;glow(x,y-h*.7,26*dz,'#7fa6ff',.35+.4*pulse);g.fillStyle='#bcd2ff';circ(x,y-h*.7,3*dz)}
    }
  };

  // ── 소품
  const PROPS={
    campfire(r,t){const x=W*.48,y=GY-2,fl=motion?Math.sin(t*8)*3:0;g.fillStyle='#2a1c12';g.fillRect(x-16,y-5,32,5);g.fillStyle='#f08a3a';poly([[x-10,y-4],[x,y-26-fl],[x+10,y-4]]);glow(x,y-14,80,'#f08a3a',.45)},
    relic(r,t){const x=W/2,y=GY-36,p=motion?.75+.25*Math.sin(t*2.5):1;glow(x,y,120*p,'#7fb3ff',.5);g.fillStyle='#dce9ff';g.fillRect(x-2,y-46,4,46);glow(x,y-30,30,'#ffffff',.6)},
    stars7(r,t){const pts=[[.18,.22],[.28,.14],[.4,.2],[.52,.12],[.63,.22],[.75,.16],[.86,.26]];pts.forEach(([px,py],i)=>{if(i===6)return;const tw=motion?.6+.4*Math.sin(t*3+i):1;g.fillStyle='#ffffff';circ(W*px,H*py,2.4);glow(W*px,H*py,12*tw,'#cfe0ff',.5)})},
    fallingstar(r,t){const p=motion?(t*.25)%1:.45,x=W*(.86-p*.32),y=H*(.26+p*.5);g.strokeStyle='rgba(255,236,190,.7)';g.lineWidth=2;seg(x,y,x+60,y-50);glow(x,y,26,'#ffe2a0',.8)},
    stars6(r,t){PROPS.stars7(r,t)},
    web(r){g.strokeStyle='rgba(220,226,235,.35)';g.lineWidth=1;const cx0=W*.62,cy0=H*.42;for(let i=0;i<10;i++){const a=i*Math.PI/5;seg(cx0,cy0,cx0+Math.cos(a)*90,cy0+Math.sin(a)*70)}for(let k=1;k<5;k++){g.beginPath();g.ellipse(cx0,cy0,k*22,k*17,0,0,Math.PI*2);g.stroke()}g.fillStyle=ink();ell(cx0+10,cy0+6,14,18)},
    bones(r){g.strokeStyle='#c9c4b5';g.lineWidth=3;seg(W*.6,GY-8,W*.66,GY-12);seg(W*.63,GY-6,W*.7,GY-4);g.fillStyle='#c9c4b5';circ(W*.58,GY-12,6)}
  };

  // ── 인물
  function figure(x,gy,h,f,o){
    const c=o.col||ink();g.fillStyle=c;g.strokeStyle=c;g.lineCap='round';g.lineJoin='round';
    const hr=h*.075,sh=gy-h*.72,hip=gy-h*.42;
    g.lineWidth=h*.065;seg(x-h*.04,hip,x-h*.08,gy);seg(x+h*.04,hip,x+h*.09,gy);
    if(o.robe)poly([[x-h*.075,sh],[x+h*.075,sh],[x+h*.17,gy-h*.02],[x-h*.17,gy-h*.02]]);
    else poly([[x-h*.1,sh],[x+h*.1,sh],[x+h*.08,hip+h*.05],[x-h*.08,hip+h*.05]]);
    if(o.cape)poly([[x-f*h*.02,sh],[x-f*h*.2,gy-h*.32],[x-f*h*.24,gy-h*.04],[x-f*h*.05,gy-h*.12]]);
    circ(x+f*h*.01,sh-hr*1.15,hr);
    if(o.hood)poly([[x-f*h*.08,sh+h*.02],[x+f*h*.01,sh-hr*2.9],[x+f*h*.1,sh+h*.01]]);
    if(o.hat){ell(x,sh-hr*1.9,h*.13,h*.022);poly([[x-h*.06,sh-hr*1.9],[x+f*h*.04,sh-hr*4.2],[x+h*.07,sh-hr*1.9]])}
    if(o.pointy)poly([[x-h*.08,sh-hr*1.5],[x-f*h*.05,sh-hr*4.6],[x+h*.08,sh-hr*1.5]]);
    if(o.helm){g.fillRect(x-hr*1.1,sh-hr*2.4,hr*2.2,hr*1.7);g.lineWidth=h*.03;seg(x,sh-hr*2.4,x-f*h*.09,sh-hr*3.6)}
    if(o.eyes){g.fillStyle=o.eyes;circ(x+f*hr*.55,sh-hr*1.3,1.8);glow(x+f*hr*.55,sh-hr*1.3,8,o.eyes,.7);g.fillStyle=c}
    g.lineWidth=h*.05;
    const hx=x+f*h*.17,hy=sh+h*.17;
    seg(x+f*h*.05,sh+h*.03,hx,hy);seg(x-f*h*.05,sh+h*.03,x-f*h*.11,sh+h*.24);
    weapon(o.weapon,hx,hy,h,f,o,c);
  }
  function weapon(w,hx,hy,h,f,o,c){
    g.strokeStyle=c;g.fillStyle=c;
    if(w==='staff'){g.lineWidth=h*.024;seg(hx,hy+h*.28,hx+f*h*.05,hy-h*.46);glow(hx+f*h*.05,hy-h*.48,h*(o.relic?.16:.09),o.relic?'#9fc8ff':'#8fb0d8',o.relic?.9:.55)}
    else if(w==='sword'){g.lineWidth=h*.03;seg(hx,hy,hx+f*h*.32,hy-h*.34);seg(hx+f*h*.02-h*.05,hy-h*.02+h*.0,hx+f*h*.06+h*.0,hy+h*.06);if(o.relic)glow(hx+f*h*.2,hy-h*.22,h*.2,'#9fc8ff',.55)}
    else if(w==='dagger'){g.lineWidth=h*.03;seg(hx,hy,hx+f*h*.14,hy-h*.12);if(o.relic)glow(hx+f*h*.1,hy-h*.08,h*.12,'#9fc8ff',.6)}
    else if(w==='lute'){ell(hx-f*h*.02,hy+h*.02,h*.09,h*.06,f*.6);g.lineWidth=h*.025;seg(hx,hy,hx+f*h*.22,hy-h*.18);if(o.relic)glow(hx,hy,h*.16,'#9fc8ff',.55)}
    else if(w==='spear'){g.lineWidth=h*.025;seg(hx,hy+h*.3,hx+f*h*.08,hy-h*.62);poly([[hx+f*h*.08,hy-h*.72],[hx+f*h*.05,hy-h*.6],[hx+f*h*.11,hy-h*.6]])}
    else if(w==='bigsword'){g.lineWidth=h*.045;seg(hx,hy,hx+f*h*.38,hy-h*.1)}
    else if(w==='bow'){g.lineWidth=h*.022;const cx=hx-f*h*.1,cy=hy-h*.06,rr=h*.27,a0=f>0?-Math.PI/3:Math.PI*2/3,a1=f>0?Math.PI/3:Math.PI*4/3;g.beginPath();g.arc(cx,cy,rr,a0,a1);g.stroke();g.lineWidth=1;g.strokeStyle='rgba(225,225,215,.55)';seg(cx+Math.cos(a0)*rr,cy+Math.sin(a0)*rr,cx+Math.cos(a1)*rr,cy+Math.sin(a1)*rr);g.strokeStyle=c}
    else if(w==='torch'){g.lineWidth=h*.026;seg(hx,hy+h*.26,hx+f*h*.05,hy-h*.4);const tx=hx+f*h*.05,ty=hy-h*.44;glow(tx,ty,h*.2,'#ff8a3c',.75);g.fillStyle='#ffb35c';poly([[tx-h*.03,ty+h*.03],[tx,ty-h*.09],[tx+h*.03,ty+h*.03]]);g.fillStyle=c}
    else if(w==='lantern'){g.lineWidth=h*.02;seg(hx,hy,hx+f*h*.03,hy+h*.12);g.fillStyle='#f6c26a';circ(hx+f*h*.03,hy+h*.16,h*.035);glow(hx+f*h*.03,hy+h*.16,h*.5,'#f3a64a',.45)}
  }
  const HERO={mage:{robe:true,pointy:true,weapon:'staff'},warrior:{cape:true,helm:true,weapon:'sword'},rogue:{hood:true,cape:true,weapon:'dagger'},bard:{hat:true,cape:true,weapon:'lute'}};
  function knight(x,gy,h,f,o){
    o=o||{};
    const col=o.stone?mix(P.ink,P.hz,.42):o.drowned?'#16232b':ink();
    figure(x,gy,h,f,{col,helm:true,cape:!o.stone,weapon:o.drowned?'bigsword':'spear',eyes:o.stone?null:o.drowned?'#5fd0ff':'#f2c35a'});
    if(o.broken){g.fillStyle=P.top;poly([[x-h*.2,gy-h*1.05],[x+h*.2,gy-h*1.05],[x+h*.2,gy-h*.68],[x-h*.05,gy-h*.8]])}
  }

  // ── 짐승
  function beast(k,x,gy,L,f,o){
    o=o||{};const col=o.col||ink();g.fillStyle=col;g.strokeStyle=col;g.lineCap='round';
    const low=k==='boar',bulky=k==='bear';
    const bh=L*(bulky?.42:low?.36:.3),by=gy-L*(low?.3:bulky?.44:.42);
    g.lineWidth=L*(bulky?.11:.07);
    [[-.3,0],[-.2,.03],[.22,0],[.32,.03]].forEach(([p,s])=>seg(x+f*p*L,by+bh*.2,x+f*(p+s)*L,gy));
    ell(x,by,L*.42,bh*.55);
    ell(x+f*L*.24,by-bh*.08,L*.2,bh*(bulky?.75:.62));
    if(bulky)ell(x+f*L*.08,by-bh*.38,L*.26,bh*.4);
    const hx=x+f*L*(bulky?.42:.36),hy=by-bh*(bulky?.25:.42);
    poly([[hx-f*L*.06,hy-bh*.32],[hx+f*L*(low?.28:.27),hy+bh*(low?.25:.08)],[hx+f*L*.04,hy+bh*.42],[hx-f*L*.06,hy+bh*.25]]);
    if(k==='bear'){circ(hx-f*L*.02,hy-bh*.36,L*.05)}
    else if(!low){poly([[hx-f*L*.05,hy-bh*.2],[hx-f*L*.02,hy-bh*.7],[hx+f*L*.04,hy-bh*.22]])}
    if(low){g.strokeStyle='#e8e2d2';g.lineWidth=L*.025;seg(hx+f*L*.2,hy+bh*.2,hx+f*L*.26,hy-bh*.02);g.strokeStyle=col;
      for(let i=0;i<6;i++){const sx=x-f*L*.2+f*i*L*.08;poly([[sx,by-bh*.5],[sx+f*L*.03,by-bh*.85],[sx+f*L*.06,by-bh*.5]])}}
    if(!low&&!bulky){g.lineWidth=L*.07;g.beginPath();g.moveTo(x-f*L*.38,by-bh*.2);g.quadraticCurveTo(x-f*L*.62,by-bh*.1,x-f*L*.66,by+bh*.55);g.stroke()}
    if(k==='alpha'){for(let i=0;i<5;i++){const sx=x+f*(L*.05+i*L*.06);poly([[sx,by-bh*.55],[sx+f*L*.03,by-bh*1.0],[sx+f*L*.06,by-bh*.55]])}}
    const eye=o.eye||'#ff5a3c';g.fillStyle=eye;circ(hx+f*L*.08,hy,L*.018+.6);glow(hx+f*L*.08,hy,L*.08,eye,.6);
    if(o.mark){const mx=k==='alpha'?hx-f*L*.02:x+f*L*.24,my=k==='alpha'?hy-bh*.38:by-bh*.4;glow(mx,my,L*(k==='alpha'?.14:.09),'#c9d1dc',.7);g.fillStyle='#e6ebf2';circ(mx,my,L*.015+.8)}
  }
  function spider(x,gy,L,f){
    const c=ink();g.fillStyle=c;g.strokeStyle=c;g.lineWidth=L*.035;
    for(let s=-1;s<=1;s+=2)for(let i=0;i<4;i++){const bx=x+f*L*.05*i,kx=bx+s*L*(.22+i*.06),ky=gy-L*.5,fx=bx+s*L*(.34+i*.08);seg(bx,gy-L*.28,kx,ky);seg(kx,ky,fx,gy)}
    ell(x-f*L*.2,gy-L*.32,L*.26,L*.2);ell(x+f*L*.08,gy-L*.28,L*.13,L*.11);
    g.fillStyle='#ff4a3c';[0,1,2].forEach(i=>circ(x+f*L*(.15+i*.02),gy-L*.3-i*1.5,1.6));glow(x+f*L*.17,gy-L*.3,L*.12,'#ff4a3c',.45);
  }
  function bats(x,gy,L,t){
    const c=ink();g.fillStyle=c;
    for(let i=0;i<5;i++){const bx=x+(i-2)*L*.22,by=gy-L*(.9+.25*Math.sin(i*1.7))+(motion?Math.sin(t*6+i)*5:0),w=L*.14,fl=motion?Math.sin(t*14+i)*.5:0;
      poly([[bx,by],[bx-w,by-w*(.6+fl)],[bx-w*.55,by-w*.1],[bx-w*.3,by+w*.25]]);poly([[bx,by],[bx+w,by-w*(.6+fl)],[bx+w*.55,by-w*.1],[bx+w*.3,by+w*.25]]);ell(bx,by,w*.18,w*.3)}
  }
  function leech(x,gy,L,f,t){
    const c='#1b2027';g.strokeStyle=c;g.lineCap='round';g.lineWidth=L*.22;const wv=motion?Math.sin(t*3)*6:0;
    g.beginPath();g.moveTo(x-f*L*.45,gy-8);g.bezierCurveTo(x-f*L*.1,gy-L*.5+wv,x+f*L*.15,gy+wv,x+f*L*.42,gy-L*.35);g.stroke();
    g.strokeStyle='#6a3a3a';g.lineWidth=3;g.beginPath();g.arc(x+f*L*.44,gy-L*.37,L*.08,0,Math.PI*2);g.stroke();
  }
  function crone(x,gy,h,f){g.save();g.translate(x,gy);g.rotate(f*.16);figure(0,0,h,f,{robe:true,hood:true,weapon:'lantern'});g.restore()}

  // 그리기 가능한 것들
  function actor(a,info,t,off){
    const k=a.k,f=a.face||(a.x<W/2?1:-1),x=a.x+(off?off.dx:0),gy=(a.gy||GY)+(off?off.dy:0),s=a.s||1;
    const bob=motion&&!a.down&&!a.prone?Math.sin(t*2.2+(a.x%7))*1.2:0;
    if(a.cur){g.save();g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=2;g.beginPath();g.ellipse(x,gy+3,30*s,7*s,0,0,Math.PI*2);g.stroke();g.restore()}
    if(!a.dead&&!a.down){g.save();g.translate(x,gy);g.scale(1,.22);glow(0,0,62*s,P.rim,.32);g.restore()}
    g.save();
    if(a.dead){g.globalAlpha=.25;g.translate(0,8)}
    else{g.shadowColor=P.rim;g.shadowBlur=9*scale}
    // 쓰러진 아군은 옆으로 눕고, 넘어진 자는 기울고, 숨은 자는 흐릿하다
    if(a.down){g.globalAlpha=.6;g.translate(x,gy);g.rotate(-f*1.4);g.translate(-x,-gy)}
    else if(a.prone){g.translate(x,gy);g.rotate(-f*.55);g.translate(-x,-gy)}
    if(a.hid)g.globalAlpha=.35;
    if(k==='hero'){const cl=a.cls||info.cls||'warrior';figure(x,gy,96*s,f,Object.assign({relic:info.relic},HERO[cl]||HERO.warrior,{}))}
    else if(k==='orden')knight(x,gy,118*s,f,{});
    else if(k==='sena')figure(x,gy,90*s,f,{hood:true,cape:true,weapon:'bow'});
    else if(k==='bran'){figure(x,gy,96*s,f,{robe:true,hood:true,weapon:'torch'});glow(x-f*96*s*.11,gy-96*s*.48,10*s,'#ff5a3c',.7)}
    else if(k==='statue')knight(x,gy,118*s,f,{stone:true});
    else if(k==='drowned')knight(x,gy,112*s,f,{drowned:true});
    else if(k==='acolyte')figure(x,gy,98*s,f,{robe:true,hood:true,weapon:'dagger',eyes:'#c9d1dc'});
    else if(k==='crone')crone(x,gy,84*s,f);
    else if(k==='wolf')beast('wolf',x,gy-bob,78*s,f,{eye:'#ffb347'});
    else if(k==='scout')beast('wolf',x,gy-bob,80*s,f,{mark:true});
    else if(k==='hound')beast('wolf',x,gy-bob,92*s,f,{mark:true});
    else if(k==='alpha')beast('alpha',x,gy-bob,170*s,f,{mark:true});
    else if(k==='pup')beast('wolf',x,gy-bob,40*s,f,{eye:'#ffb347'});
    else if(k==='boar')beast('boar',x,gy-bob,86*s,f,{});
    else if(k==='bear')beast('bear',x,gy-bob,132*s,f,{eye:'#ffb347'});
    else if(k==='spider')spider(x,gy,74*s,f);
    else if(k==='bats')bats(x,gy,90*s,t);
    else if(k==='leech')leech(x,gy,82*s,f,t);
    g.restore();
    if(a.flash){g.save();g.globalAlpha=a.flash;glow(x,gy-40*s,46*s,'#ffffff',.4);g.restore()}
  }

  // ── 날씨·분위기
  const FX={
    rain(r,t){g.strokeStyle='rgba(190,205,225,.28)';g.lineWidth=1;const n=80;for(let i=0;i<n;i++){const sp=420+(i%5)*60,x=((i*97.3)+(motion?t*sp*.25:0))%(W+60)-30,y=((i*53.7)+(motion?t*sp:0))%(H+40)-20;seg(x,y,x-5,y+14)}},
    fog(r,t){for(let i=0;i<4;i++){const x=((i*190)+(motion?t*12*(i%2?1:-1):0))%(W+300)-150,y=H*(.62+i*.08);g.fillStyle='rgba(200,210,220,.07)';ell(x,y,220,22)}},
    stars(r,t){for(let i=0;i<60;i++){const x=(i*137.5)%W,y=((i*71.3)%(H*.55)),tw=motion?.4+.6*Math.abs(Math.sin(t*1.5+i)):.8;g.fillStyle='rgba(255,255,255,'+(.35+.5*tw)+')';g.fillRect(x,y,1.4,1.4)}},
    motes(r,t){for(let i=0;i<26;i++){const x=(i*83.1+(motion?Math.sin(t*.5+i)*20:0))%W,y=H-((i*47.7+(motion?t*14:0))%H);glow(x,y,6,'#8fb6ff',.5)}},
    dust(r,t){g.fillStyle='rgba(210,200,185,.35)';for(let i=0;i<40;i++){const x=(i*61.7)%W,y=((i*91.3)+(motion?t*30:0))%H;g.fillRect(x,y,1.5,1.5)}},
    drip(r,t){g.fillStyle='rgba(150,190,215,.55)';for(let i=0;i<10;i++){const x=W*(.1+i*.09),y=((i*57)+(motion?t*120:0))%(GY-20);ell(x,y,1.4,3)}},
    hearth(){},runes(){}
  };

  // ── 전투 효과
  const DUR={hit:900,miss:800,heal:900,cast:420,lunge:420,text:1000,boom:800};
  function fxOff(id,now){
    let dx=0,dy=0,flash=0;
    fxq.forEach(e=>{
      const p=(now-e.t)/DUR[e.type];if(p<0||p>1)return;
      if(e.type==='lunge'&&e.who===id){const k=Math.sin(p*Math.PI);dx+=(e.dir||1)*26*k}
      if(e.type==='hit'&&e.target===id){dx+=Math.sin(p*40)*6*(1-p);flash=Math.max(flash,(1-p)*.8)}
    });
    return {dx,dy,flash};
  }
  function drawFx(pos,now){
    g.textAlign='center';
    fxq.forEach(e=>{
      const p=(now-e.t)/DUR[e.type];if(p<0||p>1)return;
      if(e.type==='cast'){const a=pos[e.from],b=pos[e.to];if(!a||!b)return;const x=a.x+(b.x-a.x)*p,y=a.y-50+(b.y-a.y)*p;glow(x,y,22,e.color||'#9fc8ff',.9);g.fillStyle='#fff';circ(x,y,3);return}
      if(e.type==='boom'){const Z=ZX[e.zone];if(!Z)return;const x=W*Z.c,k=Math.sin(p*Math.PI);glow(x,GY-30,60+120*p,'#ff8a3c',.9*k);glow(x,GY-40,30+60*p,'#ffe0a0',.8*k);return}
      const tp=pos[e.target];if(!tp)return;
      const y=tp.y-tp.h-6-p*30;g.globalAlpha=1-Math.max(0,p-.6)/.4;
      if(e.type==='hit'){g.font=(e.crit?'700 26px ':'700 20px ')+'system-ui,sans-serif';g.lineWidth=4;g.strokeStyle='rgba(0,0,0,.7)';const s=(e.crit?'치명! ':'')+'-'+e.val;g.strokeText(s,tp.x,y);g.fillStyle=e.crit?'#ffd166':e.target==='hero'?'#ff7a6b':'#ffffff';g.fillText(s,tp.x,y)}
      else if(e.type==='miss'){g.font='600 16px system-ui,sans-serif';g.fillStyle='#c8ccd4';g.fillText('빗나감',tp.x,y)}
      else if(e.type==='heal'){g.font='700 20px system-ui,sans-serif';g.lineWidth=4;g.strokeStyle='rgba(0,0,0,.6)';g.strokeText('+'+e.val,tp.x,y);g.fillStyle='#8be28b';g.fillText('+'+e.val,tp.x,y);for(let i=0;i<5;i++)glow(tp.x+Math.sin(i*2+p*6)*24,tp.y-20-p*50-i*6,6,'#8be28b',.6)}
      else if(e.type==='text'){g.font='600 15px system-ui,sans-serif';g.lineWidth=3;g.strokeStyle='rgba(0,0,0,.6)';g.strokeText(e.text,tp.x,y);g.fillStyle=e.color||'#f0c75e';g.fillText(e.text,tp.x,y)}
      g.globalAlpha=1;
    });
    fxq=fxq.filter(e=>now-e.t<=DUR[e.type]);
  }

  // ── 전투 배치: 열마다 자리를 나눈다 (왼쪽이 아군, 오른쪽이 적)
  const ZX={'pc-front':{c:.34,w:.08,rx:.12},'pc-back':{c:.135,w:.07,rx:.11},'foe-front':{c:.665,w:.09,rx:.17},'foe-back':{c:.885,w:.07,rx:.1}};
  const HT={wolf:60,scout:62,hound:70,alpha:120,pup:30,boar:56,bear:100,spider:52,bats:110,leech:60,drowned:112,acolyte:98,hero:96,orden:118,sena:90,bran:96};
  function battleLayout(info){
    const B=info.battle,list=[];if(!B)return list;
    const groups={};B.units.forEach(u=>{const z=u.side+'-'+u.row;(groups[z]=groups[z]||[]).push(u)});
    const total=B.units.filter(u=>!(u.side==='foe'&&u.down)).length;
    ['pc-back','foe-back','pc-front','foe-front'].forEach(z=>{
      const gr=groups[z];if(!gr)return;const Z=ZX[z],n=gr.length;
      gr.forEach((u,i)=>{
        let px=Z.c+(i-(n-1)/2)*Z.w;if(z[0]==='p')px=Z.c+((n-1)/2-i)*Z.w;   // 아군은 첫 자리가 가운데 쪽
        const s=(n>=3||total>=7?.8:1)*(u.k==='alpha'&&total>3?.85:1);
        list.push({id:u.id,k:u.k,x:W*px,face:u.side==='pc'?1:-1,gy:GY-(u.high?30:0),high:u.high,dead:u.side==='foe'&&u.down,down:u.side==='pc'&&u.down,prone:u.prone,hid:u.hid,cur:u.cur&&!B.over,target:u.target&&!B.over&&!u.down,s});
      });
    });
    return list;
  }
  // 열 바닥의 표면과 고지대
  function drawField(info,t){
    const B=info.battle;if(!B)return;
    const hi=B.field&&B.field.high;
    ['pc','foe'].forEach(side=>{if(hi!=='both'&&hi!==side)return;const Z=ZX[side+'-back'],x=W*Z.c,w=W*.11;
      g.fillStyle=mix(P.ink,P.hz,.3);poly([[x-w,GY+2],[x-w*.8,GY-30],[x-w*.2,GY-36],[x+w*.6,GY-31],[x+w,GY+2]]);
      g.fillStyle=mix(P.ink,P.hz,.5);g.fillRect(x-w*.8,GY-32,w*1.4,2)});
    for(const z in (B.surf||{})){
      const sf=B.surf[z],Z=ZX[z];if(!Z)continue;const x=W*Z.c,rx=W*Z.rx,y=GY+3;
      g.save();
      if(sf.t==='water'){g.fillStyle='rgba(70,130,190,.42)';ell(x,y,rx,11);g.strokeStyle='rgba(170,210,240,.45)';g.lineWidth=1;for(let i=0;i<3;i++){const ph=motion?(t*.8+i/3)%1:i/3;g.beginPath();g.ellipse(x+(i-1)*rx*.5,y,rx*.18*(.4+ph),4*(.4+ph),0,0,Math.PI*2);g.stroke()}}
      else if(sf.t==='oil'){g.fillStyle='rgba(20,14,8,.8)';ell(x,y,rx,11);const gr=g.createLinearGradient(x-rx,y,x+rx,y);gr.addColorStop(0,'rgba(120,90,200,0)');gr.addColorStop(.5,'rgba(170,140,255,.22)');gr.addColorStop(1,'rgba(90,200,160,0)');g.fillStyle=gr;ell(x,y-2,rx*.8,5)}
      else if(sf.t==='ice'){g.fillStyle='rgba(205,235,255,.6)';ell(x,y,rx,11);g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=1;seg(x-rx*.6,y-3,x-rx*.1,y+4);seg(x-rx*.1,y+4,x+rx*.4,y-2);seg(x+rx*.1,y-6,x+rx*.5,y+5)}
      else if(sf.t==='fire'){glow(x,y-10,rx*1.1,'#ff7a2c',.5);g.fillStyle='rgba(255,120,40,.35)';ell(x,y,rx,11);
        for(let i=0;i<7;i++){const fx=x-rx*.8+i*rx*.27,fl=motion?Math.sin(t*9+i*1.7)*5:0,hh=16+((i*37)%11)+fl;g.fillStyle=i%2?'#ffb35c':'#ff7a2c';poly([[fx-6,y],[fx,y-hh],[fx+6,y]])}}
      g.restore();
    }
  }

  // ── 그리기 루프
  function draw(now){
    if(!g||!spec)return;
    const t=now/1000,info=getInfo()||{};
    g.setTransform(scale,0,0,scale,0,0);
    P=SKY[spec.sky]||SKY.rain;
    const r=rng(hash((spec.bg||'')+(spec.sky||'')));
    sky();
    if((spec.fx||[]).includes('stars'))FX.stars(r,t);
    arr(spec.props).filter(p=>p==='stars7'||p==='stars6'||p==='fallingstar').forEach(p=>PROPS[p](r,t));
    (BG[spec.bg]||BG.mountains)(r,t);
    arr(spec.props).filter(p=>PROPS[p]&&!/^stars|fallingstar/.test(p)).forEach(p=>PROPS[p](r,t));
    const pos={};
    const bat=spec.battle&&info.battle;
    if(bat)drawField(info,t);
    let actors=bat?battleLayout(info):arr(spec.actors).map(a=>Object.assign({},a,{x:a.x*W}));
    actors.forEach(a=>{const off=a.id?fxOff(a.id,now):null;if(off&&off.flash)a.flash=off.flash;
      actor(a,info,t,off);
      const gy=a.gy||GY,ht=(HT[a.k]||70)*(a.s||1);
      if(a.id)pos[a.id]={x:a.x,y:gy,h:ht};
      if(a.target){const hy=gy-ht-18+(motion?Math.sin(t*4)*2:0);g.fillStyle='#ffd166';poly([[a.x-7,hy-10],[a.x+7,hy-10],[a.x,hy]])}
    });
    arr(spec.fx).filter(f=>f!=='stars'&&FX[f]).forEach(f=>FX[f](r,t));
    if(spec.battle)drawFx(pos,now);
    const vg=g.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,W*.62);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.45)');g.fillStyle=vg;g.fillRect(0,0,W,H);
  }
  function arr(x){return x==null?[]:Array.isArray(x)?x:[x]}
  function loop(now){
    raf=0;if(!cv||!cv.isConnected||document.hidden)return;
    if(now-lastDraw>=30){draw(now);lastDraw=now}
    if(motion&&cv.offsetParent!==null)raf=requestAnimationFrame(loop);
  }
  function kick(){if(!raf&&cv){if(motion)raf=requestAnimationFrame(loop);else draw(performance.now())}}
  function resize(){
    if(!cv)return;const w=cv.clientWidth||W,dpr=Math.min(window.devicePixelRatio||1,2);
    cv.width=Math.round(w*dpr);cv.height=Math.round(w*H/W*dpr);scale=cv.width/W;draw(performance.now());
  }
  return {
    mount(canvas,info){
      cv=canvas;g=cv.getContext('2d');getInfo=info;
      window.addEventListener('resize',resize);
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)kick()});
      cv.addEventListener('click',ev=>{
        if(!spec||!spec.battle||!onPick)return;
        const rc=cv.getBoundingClientRect(),x=(ev.clientX-rc.left)/rc.width*W;
        const info=getInfo();if(!info.battle)return;
        let best=null,bd=50;battleLayout(info).forEach(a=>{if(!a.dead&&!a.down){const dd=Math.abs(a.x-x);if(dd<bd){bd=dd;best=a.id}}});
        if(best)onPick(best);
      });
      resize();
    },
    scene(s){const key=JSON.stringify(s);if(key!==this._k){this._k=key;spec=s;if(!s.battle)fxq=[]}kick();if(!motion)draw(performance.now())},
    fx(e){if(!motion)return;e.t=performance.now()+(e.delay||0);fxq.push(e);kick()},
    onPick(fn){onPick=fn},
    redraw(){kick();if(!motion)draw(performance.now())}
  };
})();
