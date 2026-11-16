// 宇宙の衝撃ファイル 縦動画レンダラー（内蔵ブラウザの example.com タブで javascript_tool に丸ごと貼って実行する）
// 使い方:
//   1) このファイルの中身をそのまま実行 → window.NC が定義される
//   2) await NC.setup(CFG)   … 映像・書体・読み上げ音声を準備（CFG の書式は下）
//   3) await NC.preview([秒,秒,秒])  … 3コマを画面に並べる → screenshot で確認
//   4) NC.start(); その後 NC.PROG を数十秒ごとに確認（done:true で完成）
//   NC.start() は BGM（poketango.com/assets/newch のCC BY素材）と効果音まで重ねた完成品を作る。
//   5) NC.download('名前.mp4') … 完成品をダウンロードフォルダへ（.tmp 名で残ることがある。大きさが同じ .tmp を使ってよい）
//   6) NC.post('名前.mp4') … YouTube Studio から開いたタブのとき、完成品を Studio の画面に渡す（手順書の「アップロード」参照）
//   NC.start(false) なら読み上げだけ（mix.py で手元の素材を重ねる昔のやり方）
// CFG = {
//   video: 'NASA等のmp4 URL（CORS可のもの）',
//   head: ['1行目（黄）','2行目（赤）'],
//   credit: '映像 NASA/JPL-Caltech',
//   lines: [ { tts:'読み上げ文（数字や英語はカナにしてよい）', kana:null または AquesTalk記法,
//              pages:[['字幕1行目','字幕2行目'],['次の字幕']],
//              shot:{mode:'play', src:秒, rate:1, rect:[x,y,size,size], punch:true, c:[cx,cy], box:[x,y,w,h], cont:false}
//                 または {mode:'freeze', src:秒, rect:[x,y,size,size], zoom:[1,1.15]} } , ... ],
//   overlays: [ {type:'bigtext', line:i, page:k, words:['DARE','MIGHTY','THINGS']},
//               {type:'ring', line:i, cx:540, cy:540, r:448},
//               {type:'bits', line:i, bits:'0000000100', caption:'＝4 → 4番目の文字「D」'},
//               {type:'label', line:i, text:'大きく見せたい一言'} ],
//   idea: {line:i, page:k}   … ひらめき音を鳴らす字幕
// }
// shot.cont:true にすると前の行の再生位置から続けて流す（同じ場面を何行にもまたがせる時）
(function(){
const W=1080,H=1920,VY=560,VS=1080,FPS=30;
const ENGINE='https://meowsky49887-voicevox-engine.hf.space';
const NC={PROG:{}};window.NC=NC;
function stroked(g,s,x,y,fill,lw){g.lineWidth=lw;g.strokeStyle='#000';g.strokeText(s,x,y);g.fillStyle=fill;g.fillText(s,x,y);}
function fit(g,s,base,font,maxW){let sz=base;g.font=font.replace('{s}',sz);while(g.measureText(s).width>maxW&&sz>30){sz-=2;g.font=font.replace('{s}',sz);}return sz;}
async function loadFonts(text){
  if(!document.querySelector('#nc-fonts')){const l=document.createElement('link');l.id='nc-fonts';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Noto+Sans+JP:wght@500;900&display=swap';document.head.appendChild(l);await new Promise(r=>l.onload=r);}
  await document.fonts.load('80px "Dela Gothic One"',text);await document.fonts.load('900 80px "Noto Sans JP"',text);await document.fonts.load('500 30px "Noto Sans JP"',text);
}
async function tts(line){
  let q=await fetch(ENGINE+'/audio_query?speaker=13&text='+encodeURIComponent(line.tts),{method:'POST'}).then(r=>r.json());
  if(line.kana){q.accent_phrases=await fetch(ENGINE+'/accent_phrases?speaker=13&is_kana=true&text='+encodeURIComponent(line.kana),{method:'POST'}).then(r=>r.json());}
  q.speedScale=1.35;q.prePhonemeLength=0.02;q.postPhonemeLength=0.05;q.volumeScale=1.25;q.intonationScale=1.15;
  const ab=await fetch(ENGINE+'/synthesis?speaker=13',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(q)}).then(r=>r.arrayBuffer());
  return {buf:await NC.AC.decodeAudioData(ab),kana:q.kana};
}
NC.setup=async function(cfg){
  NC.cfg=cfg;NC.AC=NC.AC||new AudioContext();
  NC.MUX=NC.MUX||await import('https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.1/+esm');
  const v=document.createElement('video');v.crossOrigin='anonymous';v.muted=true;v.preload='auto';v.src=cfg.video;NC.V=v;
  await new Promise((res,rej)=>{v.onloadedmetadata=res;v.onerror=()=>rej('映像を読み込めない')});
  const all=cfg.lines.map(l=>l.pages.flat().join('')).join('')+cfg.head.join('')+cfg.credit+(cfg.overlays||[]).map(o=>(o.words||[]).join('')+(o.caption||'')+(o.text||'')).join('')+'0123456789';
  await loadFonts(all);
  NC.BUF=[];NC.KANA=[];for(const l of cfg.lines){const t=await tts(l);NC.BUF.push(t.buf);NC.KANA.push(t.kana);}
  // 時刻表
  let t=0.15;NC.L=[];const big=(cfg.overlays||[]).filter(o=>o.type=='bigtext').map(o=>o.line);
  cfg.lines.forEach((l,i)=>{if(big.includes(i))t+=0.3;const d=NC.BUF[i].duration;NC.L.push({start:t,end:t+d});t+=d+0.08;});
  NC.TOTAL=t+0.7;
  NC.capT=[];cfg.lines.forEach((l,i)=>{const ps=l.pages;const n=ps.map(p=>p.join('').length);const tot=n.reduce((a,b)=>a+b,0);let s=NC.L[i].start;ps.forEach((p,k)=>{const e=k==ps.length-1?(i<cfg.lines.length-1?NC.L[i+1].start:NC.L[i].end+0.4):s+(NC.L[i].end-NC.L[i].start)*n[k]/tot;NC.capT.push({s,e,rows:p,line:i,k,zoom:[1,1.22,1.08,1.32][NC.capT.length%4]});s=e;});});
  // 場面
  NC.SEG=[];let prevEndSrc=null;cfg.lines.forEach((l,i)=>{const sh=Object.assign({},l.shot);const from=i==0?0:NC.L[i].start;const to=i==cfg.lines.length-1?NC.TOTAL:NC.L[i+1].start;
    if(sh.mode=='play'&&sh.cont&&prevEndSrc!=null)sh.src=prevEndSrc;sh.from=from;sh.to=to;sh.rate=sh.rate||1;if(sh.mode=='play')prevEndSrc=sh.src+(to-from)*sh.rate;NC.SEG.push(sh);});
  for(const s of NC.SEG){if(s.mode=='freeze'){v.currentTime=s.src;await new Promise(r=>v.onseeked=r);const c=document.createElement('canvas');c.width=680;c.height=680;c.getContext('2d').drawImage(v,s.rect[0],s.rect[1],s.rect[2],s.rect[3],0,0,680,680);s.img=c;}}
  return {total:NC.TOTAL,durs:NC.BUF.map(b=>+b.duration.toFixed(2)),kana:NC.KANA};
};
function rectFor(seg,time){if(!seg.punch)return seg.rect;const cp=NC.capT.find(c=>time>=c.s&&time<c.e);const z=cp?cp.zoom:1;const s=seg.rect[2]/z;const c=seg.c||[seg.rect[0]+seg.rect[2]/2,seg.rect[1]+seg.rect[3]/2];const b=seg.box||seg.rect;let x=c[0]-s/2,y=c[1]-s/2;x=Math.max(b[0],Math.min(b[0]+b[2]-s,x));y=Math.max(b[1],Math.min(b[1]+b[3]-s,y));return [x,y,s,s];}
NC.draw=function(g,time,seg){const cfg=NC.cfg,L=NC.L;g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
  let img,r;if(seg.mode=='play'){img=NC.V;r=rectFor(seg,time);}else{const p=(time-seg.from)/Math.max(0.01,seg.to-seg.from);const z0=(seg.zoom||[1,1]);const z=z0[0]+(z0[1]-z0[0])*p;const s=680/z,o=(680-s)/2;img=seg.img;r=[o,o,s,s];}
  g.save();g.filter='blur(28px) brightness(0.8) saturate(1.2)';g.drawImage(img,r[0],r[1],r[2],r[3],-(H-W)/2,0,H,H);g.restore();
  g.drawImage(img,r[0],r[1],r[2],r[3],0,VY,VS,VS);
  for(const o of (cfg.overlays||[])){const ln=L[o.line];if(!ln)continue;
    if(o.type=='bits'&&time>=ln.start&&time<(L[o.line+1]?L[o.line+1].start:NC.TOTAL)){const bits=o.bits;const sz=78,gap=10,x0=(W-(bits.length*(sz+gap)-gap))/2,y0=VY+60;g.globalAlpha=Math.min(1,(time-ln.start)/0.15);g.fillStyle='rgba(0,0,0,0.6)';g.fillRect(x0-30,y0-30,bits.length*(sz+gap)-gap+60,sz+175);
      for(let k=0;k<bits.length;k++){g.fillStyle=bits[k]=='1'?'#e0322c':'#f4f4f4';g.fillRect(x0+k*(sz+gap),y0,sz,sz);g.fillStyle=bits[k]=='1'?'#fff':'#222';g.font='900 46px "Noto Sans JP"';g.fillText(bits[k],x0+k*(sz+gap)+sz/2,y0+sz/2+2);}
      if(o.caption){fit(g,o.caption,64,'900 {s}px "Noto Sans JP"',980);stroked(g,o.caption,W/2,y0+sz+78,'#ffe14d',12);}g.globalAlpha=1;}
    if(o.type=='bigtext'){const cp=NC.capT.find(c=>c.line==o.line&&c.k==(o.page||0));const st=cp?cp.s:ln.start;const en=L[o.line+1]?L[o.line+1].start:NC.TOTAL;if(time>=st&&time<en){const a=Math.min(1,(time-st)/0.15);const sc=1+0.35*(1-Math.min(1,(time-st)/0.18));g.fillStyle=`rgba(0,0,0,${0.55*a})`;g.fillRect(0,VY,VS,VS);g.save();g.translate(W/2,VY+VS/2);g.scale(sc,sc);g.globalAlpha=a;const n=o.words.length;o.words.forEach((w,k)=>{fit(g,w,150,'{s}px "Dela Gothic One"',1000);stroked(g,w,0,(k-(n-1)/2)*190,'#ffe14d',22);});g.restore();g.globalAlpha=1;}}
    if(o.type=='ring'){const en=L[o.line+1]?L[o.line+1].start:NC.TOTAL;if(time>=ln.start&&time<en){g.globalAlpha=Math.min(1,(time-ln.start)/0.25);g.strokeStyle='#ff2a2a';g.lineWidth=16;g.beginPath();g.arc(o.cx||540,VY+(o.cy||540),o.r||448,0,Math.PI*2);g.stroke();g.globalAlpha=1;}}
    if(o.type=='label'){const en=L[o.line+1]?L[o.line+1].start:NC.TOTAL;if(time>=ln.start&&time<en){const sc=1+0.3*(1-Math.min(1,(time-ln.start)/0.15));g.save();g.translate(W/2,VY+200);g.scale(sc,sc);fit(g,o.text,110,'{s}px "Dela Gothic One"',1000);stroked(g,o.text,0,0,'#ffe14d',20);g.restore();}}
  }
  const hs=1+0.4*Math.max(0,1-time/0.2);g.save();g.translate(W/2,0);g.scale(hs,hs);[[cfg.head[0],'#ffe14d',300],[cfg.head[1],'#ff2b2b',440]].forEach(([s,c,y])=>{fit(g,s,104,'{s}px "Dela Gothic One"',990);g.shadowColor='rgba(0,0,0,0.6)';g.shadowBlur=18;stroked(g,s,0,y/hs,c,24);g.shadowBlur=0;});g.restore();
  const cp=NC.capT.find(c=>time>=c.s&&time<c.e);if(cp){const pa=Math.min(1,(time-cp.s)/0.1);const sc=0.85+0.15*pa;const rows=cp.rows;const base=rows.length==2?1490:1540;g.save();g.translate(W/2,base);g.scale(sc,sc);rows.forEach((rw,k)=>{fit(g,rw,84,'900 {s}px "Noto Sans JP"',1000);stroked(g,rw,0,k*102,'#fff',18);});g.restore();}
  g.font='500 28px "Noto Sans JP"';g.fillStyle='rgba(255,255,255,0.6)';g.fillText(cfg.credit,W/2,1870);
};
async function frameAt(g,t){const seg=NC.SEG.find(s=>t>=s.from&&t<s.to)||NC.SEG[NC.SEG.length-1];if(seg.mode=='play'){const st=seg.src+(t-seg.from)*seg.rate;if(Math.abs(NC.V.currentTime-st)>0.001){NC.V.currentTime=st;await new Promise(r=>NC.V.onseeked=r);}}NC.draw(g,t,seg);}
NC.preview=async function(times){document.body.innerHTML='';const pv=document.createElement('canvas');pv.width=1080;pv.height=640;Object.assign(pv.style,{position:'fixed',left:0,top:0,width:'100vw',zIndex:9,background:'#333'});document.body.appendChild(pv);const pg=pv.getContext('2d');const fc=document.createElement('canvas');fc.width=W;fc.height=H;const fg=fc.getContext('2d');for(let i=0;i<times.length&&i<3;i++){await frameAt(fg,times[i]);pg.drawImage(fc,i*360,0,358,637);}return 'ok';};
const ASSET='https://poketango.com/assets/newch/';
const SE={impact:[0.13,-4,2.5],whoosh:[0.19,-6,1.2],pop:[0,-10,0.5],cyber:[0,-8,1.5],idea:[0,-2,1.6],boom:[0.2,-3,3.0],hit:[0.15,-6,1.5]};
async function getBuf(u){const ab=await fetch(u).then(r=>{if(!r.ok)throw new Error('素材を読めない '+u);return r.arrayBuffer()});return await NC.AC.decodeAudioData(ab);}
// 読み上げ・BGM・効果音を重ねた音を作る（BGMは声の間だけ下げる。最後に音量をそろえる）
NC.mixAudio=async function(full){const SR=48000;const N=Math.ceil(NC.TOTAL*SR);const oc=new OfflineAudioContext(2,N,SR);const M=oc.createDynamicsCompressor();M.threshold.value=-20;M.knee.value=6;M.ratio.value=4;M.attack.value=0.003;M.release.value=0.15;M.connect(oc.destination);
  NC.L.forEach((l,i)=>{const s=oc.createBufferSource();s.buffer=NC.BUF[i];s.connect(M);s.start(l.start);});
  if(full!==false){NC.SEBUF=NC.SEBUF||{};for(const k of Object.keys(SE)){if(!NC.SEBUF[k])NC.SEBUF[k]=await getBuf(ASSET+'se/'+k+'.mp3');}
    NC.BGMBUF=NC.BGMBUF||await getBuf(ASSET+(NC.cfg.bgm||'bgm_investigations.mp3'));
    const b=oc.createBufferSource();b.buffer=NC.BGMBUF;b.loop=true;const g=oc.createGain();const base=Math.pow(10,-20/20),duck=Math.pow(10,-27/20);
    g.gain.setValueAtTime(0,0);g.gain.linearRampToValueAtTime(base,0.3);NC.L.forEach(l=>{g.gain.setTargetAtTime(duck,l.start,0.03);g.gain.setTargetAtTime(base,l.end+0.05,0.15);});
    g.gain.setValueAtTime(base,Math.max(0.4,NC.TOTAL-1.0));g.gain.linearRampToValueAtTime(0,NC.TOTAL);b.connect(g);g.connect(M);b.start(0,NC.cfg.bgmOffset||0);
    for(const e of JSON.parse(NC.events()).ev){const [peak,db,dur]=SE[e.k];const anchor=e.k=='whoosh'?e.t+0.12:e.t;const st=Math.max(0,anchor-peak);const s=oc.createBufferSource();s.buffer=NC.SEBUF[e.k];const sg=oc.createGain();sg.gain.setValueAtTime(Math.pow(10,db/20),st);sg.gain.setValueAtTime(Math.pow(10,db/20),st+dur-0.3);sg.gain.linearRampToValueAtTime(0,st+dur);s.connect(sg);sg.connect(M);s.start(st);s.stop(st+dur);}}
  const ab=await oc.startRendering();
  // 音量をそろえる（声の部分のRMSを -15dBFS 付近に。ピークは -1.5dB まで）
  const c0=ab.getChannelData(0),c1=ab.getChannelData(1);let sum=0,n=0,pk=0;for(let i=0;i<c0.length;i+=4){const v=(c0[i]+c1[i])/2;sum+=v*v;n++;pk=Math.max(pk,Math.abs(c0[i]),Math.abs(c1[i]));}
  const rms=Math.sqrt(sum/n);let gain=Math.pow(10,-15/20)/Math.max(rms,1e-6);gain=Math.min(gain,Math.pow(10,-1.5/20)/Math.max(pk,1e-6));
  for(const c of [c0,c1])for(let i=0;i<c.length;i++)c[i]=Math.max(-1,Math.min(1,c[i]*gain));
  return ab;};
NC.start=async function(full){const SR=48000;const ab=await NC.mixAudio(full);
  const {Muxer,ArrayBufferTarget}=NC.MUX;const target=new ArrayBufferTarget();const muxer=new Muxer({target,video:{codec:'avc',width:W,height:H,frameRate:FPS},audio:{codec:'aac',numberOfChannels:2,sampleRate:SR},fastStart:'in-memory'});
  NC.PROG={f:0,err:null,done:false};const ve=new VideoEncoder({output:(c,m)=>muxer.addVideoChunk(c,m),error:e=>NC.PROG.err=String(e)});ve.configure({codec:'avc1.640028',width:W,height:H,bitrate:10e6,framerate:FPS});
  const ae=new AudioEncoder({output:(c,m)=>muxer.addAudioChunk(c,m),error:e=>NC.PROG.err=String(e)});ae.configure({codec:'mp4a.40.2',sampleRate:SR,numberOfChannels:2,bitrate:192000});
  const ch=[ab.getChannelData(0),ab.getChannelData(1)];for(let o=0;o<ab.length;o+=4800){const n=Math.min(4800,ab.length-o);const d=new Float32Array(n*2);d.set(ch[0].subarray(o,o+n),0);d.set(ch[1].subarray(o,o+n),n);ae.encode(new AudioData({format:'f32-planar',sampleRate:SR,numberOfFrames:n,numberOfChannels:2,timestamp:Math.round(o/SR*1e6),data:d}));}await ae.flush();
  const fc=document.createElement('canvas');fc.width=W;fc.height=H;const fg=fc.getContext('2d');const NF=Math.round(NC.TOTAL*FPS);NC.PROG.n=NF;
  (async()=>{try{for(let f=0;f<NF;f++){await frameAt(fg,f/FPS);const vf=new VideoFrame(fc,{timestamp:Math.round(f*1e6/FPS),duration:Math.round(1e6/FPS)});ve.encode(vf,{keyFrame:f%60==0});vf.close();if(ve.encodeQueueSize>10)await new Promise(r=>setTimeout(r,20));NC.PROG.f=f;}await ve.flush();muxer.finalize();NC.OUT=new Blob([target.buffer],{type:'video/mp4'});NC.PROG.done=true;}catch(e){NC.PROG.err=String(e)}})();
  return 'started '+NF+' frames';};
// 開いた元の YouTube Studio の画面へ完成品を渡す（Studio 側で受け取り準備をしてから、このタブを開くこと）
NC.post=function(name){window.opener.postMessage({kind:'ncvideo',blob:NC.OUT,name},'https://studio.youtube.com');return NC.OUT.size;};
NC.download=async function(name){const a=document.createElement('a');a.href=URL.createObjectURL(NC.OUT);a.download=name;document.body.appendChild(a);a.click();await new Promise(r=>setTimeout(r,4000));return NC.OUT.size;};
NC.events=function(){const cfg=NC.cfg,ev=[{t:0,k:'impact'}];const cuts=NC.SEG.slice(1).filter(s=>!s.cont);cuts.forEach(s=>ev.push({t:s.from-0.12,k:'whoosh'}));
  const bigs=(cfg.overlays||[]).filter(o=>o.type=='bigtext');
  NC.capT.forEach(c=>{if(c.s>0.3&&!cuts.some(s=>Math.abs(s.from-c.s)<0.2)&&!bigs.some(o=>o.line==c.line&&(o.page||0)==c.k))ev.push({t:c.s,k:'pop'})});
  for(const o of (cfg.overlays||[])){const ln=NC.L[o.line];if(o.type=='bits')ev.push({t:ln.start,k:'cyber'});if(o.type=='ring'||o.type=='label')ev.push({t:ln.start+0.05,k:'hit'});if(o.type=='bigtext'){const cp=NC.capT.find(c=>c.line==o.line&&c.k==(o.page||0));ev.push({t:cp?cp.s:ln.start,k:'boom'});}}
  if(cfg.idea){const cp=NC.capT.find(c=>c.line==cfg.idea.line&&c.k==(cfg.idea.page||0));if(cp)ev.push({t:cp.s+0.9,k:'idea'});}
  return JSON.stringify({total:NC.TOTAL,ev});};
})();
