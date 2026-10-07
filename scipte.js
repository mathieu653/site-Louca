const $=id=>document.getElementById(id);
/* Audio (créé au premier son, après un geste utilisateur) */
let AC;
function snd(t){try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();
const P={hit:['sawtooth',150,30,.15,.2],slash:['sine',400,100,.1,.2],magic:['triangle',600,200,.3,.2],gold:['sine',800,1200,.2,.2],levelup:['triangle',300,800,.4,.25]}[t],n=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
o.connect(g);g.connect(AC.destination);o.type=P[0];o.frequency.setValueAtTime(P[1],n);o.frequency.exponentialRampToValueAtTime(P[2],n+P[3]);
g.gain.setValueAtTime(P[4],n);g.gain.exponentialRampToValueAtTime(.01,n+P[3]);o.start(n);o.stop(n+P[3]);}catch(e){}}
 
const CL={
 guerrier:{n:'GUERRIER',hp:150,mp:60,atk:28,sp:11,rate:.4,col:0xf59e0b,i1:'🌪️',l1:'[1] Tourbillon',iu:'🔥',},
 archer:{n:'ARCHER',hp:105,mp:60,atk:20,sp:14,rate:.28,col:0x10b981,i1:'🏹',l1:'[1] Volée',iu:'☄️'},
 mage:{n:'MAGE',hp:90,mp:90,atk:24,sp:11,rate:.45,col:0x06b6d4,i1:'☄️',l1:'[1] Boule de feu',iu:'🌠'}
};
const COST={1:15,2:20,u:40};
const S={started:false,paused:false,over:false,cls:'guerrier',wave:1,gold:0,xp:0,xpN:100,lv:1,hp:1,maxHp:1,mp:1,maxMp:1,sp:10,atk:20,def:0,proj:1,rate:.4,cdr:0,fire:0,cd:{1:0,2:0,u:0},mcd:{1:4,2:10,u:20},spawning:false};
 
let scene,camera,renderer,clock,hero,aim=new THREE.Vector3(0,0,-10),mAim=new THREE.Vector3(),moveDir=new THREE.Vector3(0,0,-1),lastMouseT=0,camP,camO,is2D=false;
const enemies=[],shots=[],parts=[],keys={},mouse=new THREE.Vector2(),ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
let mouseDown=false,MODE="classic",core;const towers=[],flies=[];
const Y=new THREE.Vector3(0,1,0);
const dxz=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 
function init(){
scene=new THREE.Scene();
 const sk=document.createElement('canvas');sk.width=2;sk.height=256;const sx=sk.getContext('2d'),sg=sx.createLinearGradient(0,0,0,256);sg.addColorStop(0,'#2b4c8c');sg.addColorStop(.6,'#7fa6d6');sg.addColorStop(1,'#cfe0f0');sx.fillStyle=sg;sx.fillRect(0,0,2,256);
 scene.background=new THREE.CanvasTexture(sk);scene.fog=new THREE.FogExp2(0x9fbbd9,.011);
 camP=camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.1,500);camO=new THREE.OrthographicCamera(-1,1,1,-1,.1,300);
 renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 renderer.shadowMap.enabled=true;$('cv').appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xcfe4ff,0x4a7a3a,.9));
 const d=new THREE.DirectionalLight(0xfff1d6,1.5);d.position.set(40,60,20);d.castShadow=true;d.shadow.mapSize.set(2048,2048);
 Object.assign(d.shadow.camera,{near:10,far:160,left:-50,right:50,top:50,bottom:-50});scene.add(d);
 /* sol herbeux */
 const gc=document.createElement('canvas');gc.width=gc.height=256;const x2=gc.getContext('2d');x2.fillStyle='#3f8f3a';x2.fillRect(0,0,256,256);
 for(let i=0;i<2600;i++){x2.strokeStyle=`hsl(${95+Math.random()*30},${45+Math.random()*25}%,${25+Math.random()*25}%)`;x2.lineWidth=1+Math.random()*1.5;const x=Math.random()*256,y=Math.random()*256;x2.beginPath();x2.moveTo(x,y);x2.lineTo(x+Math.random()*4-2,y-3-Math.random()*6);x2.stroke()}
 const gt=new THREE.CanvasTexture(gc);gt.wrapS=gt.wrapT=THREE.RepeatWrapping;gt.repeat.set(36,36);gt.anisotropy=4;
 const g=new THREE.Mesh(new THREE.PlaneGeometry(220,220),new THREE.MeshStandardMaterial({map:gt,roughness:1}));
 g.rotation.x=-Math.PI/2;g.receiveShadow=true;scene.add(g);
 const NG=2200,gI=new THREE.InstancedMesh(new THREE.ConeGeometry(.13,.7,4),new THREE.MeshStandardMaterial({color:0xffffff,flatShading:true}),NG),gm=new THREE.Matrix4(),gcol=new THREE.Color();
 for(let i=0;i<NG;i++){const a=Math.random()*6.283,r=Math.sqrt(Math.random())*85,q=.6+Math.random()*1.1;gm.makeRotationY(Math.random()*6).scale(new THREE.Vector3(q,q*(.7+Math.random()*.8),q)).setPosition(Math.cos(a)*r,.3*q,Math.sin(a)*r);gI.setMatrixAt(i,gm);gcol.setHSL(.24+Math.random()*.08,.55,.25+Math.random()*.2);gI.setColorAt(i,gcol)}
 scene.add(gI);
 /* arbres instanciés */
 const tm=new THREE.MeshStandardMaterial({color:0x6b4423}),fm=new THREE.MeshStandardMaterial({color:0x1f6f3a,flatShading:true});
 const NT=110,tI=new THREE.InstancedMesh(new THREE.CylinderGeometry(.4,.7,3,6),tm,NT),fI=new THREE.InstancedMesh(new THREE.ConeGeometry(2.5,5,6),fm,NT),mx=new THREE.Matrix4();
 for(let i=0;i<NT;i++){const a=Math.random()*6.283,r=62+Math.random()*35,x=Math.cos(a)*r,z=Math.sin(a)*r,q=.8+Math.random()*.7;
  mx.makeScale(q,q,q).setPosition(x,1.5*q,z);tI.setMatrixAt(i,mx);mx.makeScale(q,q,q).setPosition(x,5*q,z);fI.setMatrixAt(i,mx)}
 fI.castShadow=true;scene.add(tI,fI);
 const cm=new THREE.MeshStandardMaterial({color:0x38bdf8,emissive:0x0284c7,emissiveIntensity:.6});
 for(let i=0;i<22;i++){const x=(Math.random()-.5)*110,z=(Math.random()-.5)*110;if(Math.hypot(x,z)<10)continue;
  const c=new THREE.Mesh(new THREE.OctahedronGeometry(1+Math.random(),0),cm);c.position.set(x,1.2,z);c.rotation.set(Math.random(),Math.random(),0);scene.add(c);if(i%7===0){const l=new THREE.PointLight(0x38bdf8,1.3,24);l.position.set(x,2.5,z);scene.add(l)}}
 const fc=[0xf472b6,0xfacc15,0xa78bfa,0xfb7185],sm=new THREE.MeshStandardMaterial({color:0x78716c,flatShading:true});
 for(let i=0;i<160;i++){const a=Math.random()*6.283,r=6+Math.random()*58,x=Math.cos(a)*r,z=Math.sin(a)*r,q=Math.random();
  if(q<.5){const f=new THREE.Mesh(Sp(.18),new THREE.MeshBasicMaterial({color:fc[i%4]}));f.position.set(x,.35,z);scene.add(f);const s=new THREE.Mesh(Cy(.03,.03,.35,4),tm);s.position.set(x,.15,z);scene.add(s)}
  else if(q<.8){const m=new THREE.Mesh(new THREE.DodecahedronGeometry(.4+Math.random()*.6),sm);m.position.set(x,.3,z);m.scale.y=.7;m.castShadow=true;scene.add(m)}
  else{const g=new THREE.Group();P(Cy(.1,.12,.5,6),0xf5f5f4,0,.25,0,g);P(Sp(.4),0xef4444,0,.55,0,g).scale.y=.6;g.position.set(x,0,z);scene.add(g)}}
 const ring=new THREE.Mesh(new THREE.TorusGeometry(66,.25,6,96),new THREE.MeshBasicMaterial({color:0x38bdf8}));ring.rotation.x=Math.PI/2;ring.position.y=.2;scene.add(ring);
 for(let i=0;i<6;i++){const a=i*1.0472,x=Math.cos(a)*14,z=Math.sin(a)*14,lg=new THREE.Group();P(Cy(.08,.1,2.6,6),0x44403c,0,1.3,0,lg);P(Sp(.3),0xfde68a,0,2.8,0,lg,1);lg.position.set(x,0,z);scene.add(lg);if(i%2===0){const l=new THREE.PointLight(0xffd27a,1.4,26);l.position.set(x,2.8,z);scene.add(l)}}
 for(let i=0;i<30;i++){const f=new THREE.Mesh(Sp(.12),new THREE.MeshBasicMaterial({color:0xfde047}));f.position.set((Math.random()-.5)*110,2,(Math.random()-.5)*110);scene.add(f);flies.push(f)}
 addEventListener('resize',()=>{sizeCams();renderer.setSize(innerWidth,innerHeight)});
 addEventListener('mousemove',e=>{mouse.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);lastMouseT=performance.now()});
 renderer.domElement.addEventListener('mousedown',e=>{if(e.button===0){mouseDown=true;lastMouseT=performance.now()}});
 addEventListener('mouseup',()=>mouseDown=false);
 addEventListener('keyup',e=>keys[e.code]=false);
 addEventListener('keydown',e=>{
  if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
  keys[e.code]=true;
  if(!S.started||S.over)return;
  const so=!$('set').classList.contains('hide');
  if(e.code==='Escape'){if(so||!S.paused)toggleSet();else toggleShop();return;}
  if(so)return;
  if(e.code==='KeyE')toggleShop();
  if(S.paused)return;
  tdKeys(e.code);if(e.code==='Digit1')useSkill(1);if(e.code==='Digit2')useSkill(2);
  if(e.code==='ShiftLeft'||e.code==='ShiftRight')useSkill('u');
 });
 sizeCams();let v=0;try{v=+localStorage.getItem('fm2d')}catch(e){}set2D(!!v);clock=new THREE.Clock();loop();
}
 
function sizeCams(){const a=innerWidth/innerHeight,h=26;camP.aspect=a;camP.updateProjectionMatrix();camO.left=-h*a;camO.right=h*a;camO.top=h;camO.bottom=-h;camO.updateProjectionMatrix();}
function set2D(v){is2D=v;camera=v?camO:camP;scene.fog.density=v?0:.011;$('o2d').checked=v;try{localStorage.setItem('fm2d',v?1:0)}catch(e){}}
function toggleSet(){if(!S.started||S.over)return;const o=$('set').classList.contains('hide');if(o&&S.paused)return;S.paused=o;$('set').classList.toggle('hide',!o);}
 
/* --- Modèles --- */
let MATS=[];
const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d),Sp=r=>new THREE.SphereGeometry(r,12,10),Cn=(r,h,n=8)=>new THREE.ConeGeometry(r,h,n),Cy=(a,b,h,n=10)=>new THREE.CylinderGeometry(a,b,h,n);
function P(g,c,x,y,z,par,basic){const m=new THREE.Mesh(g,basic?new THREE.MeshBasicMaterial({color:c}):new THREE.MeshStandardMaterial({color:c,roughness:.6,flatShading:true}));if(!basic)MATS.push(m.material);m.position.set(x,y,z);m.castShadow=true;par.add(m);return m}
function legs(par,c,y,h,x){return[-1,1].map(s=>{const g=new THREE.Group();g.position.set(s*x,y,0);par.add(g);P(B(.35,h,.4),c,0,-h/2,0,g);P(B(.4,.2,.55),0x3b2a1a,0,-h+.1,.08,g);return g})}
function buildHero(cls){
 const k=CL[cls],skin=0xfcd9a8,col=SK[SAVE.skin][1]||k.col;MATS=[];hero=new THREE.Group();const u=hero.userData,t=new THREE.Group();hero.add(t);u.body=t;
 u.legs=legs(hero,0x334155,.95,.95,.3);
 P(B(1.1,1.2,.7),col,0,1.55,0,t);P(B(1.15,.18,.75),0x78350f,0,1,0,t);P(B(.25,.2,.05),0xfacc15,0,1,.38,t);
 u.arms=[-1,1].map(s=>{const a=new THREE.Group();a.position.set(s*.72,2.05,0);t.add(a);P(Sp(.24),col,0,0,0,a);P(B(.3,.9,.3),col,0,-.45,0,a);P(Sp(.17),skin,0,-1,0,a);return a});
 P(Sp(.45),skin,0,2.55,0,t);
 [-1,1].forEach(s=>{P(Sp(.09),0xffffff,s*.17,2.6,.36,t,1);P(Sp(.05),0x111827,s*.17,2.6,.44,t,1)});
 P(B(.18,.05,.04),0x9f1239,0,2.4,.44,t,1);
 const L=new THREE.PointLight(0xffe2b0,1.1,28);L.position.set(0,3.5,0);hero.add(L);u.light=L;
 if(cls==='guerrier'){
  P(Sp(.5),0x94a3b8,0,2.8,-.02,t).scale.set(1,.6,1);P(B(.12,.35,.5),0xdc2626,0,3.1,-.05,t);
  P(Cy(.5,.5,.12,14),0xb45309,-.3,-.7,.1,u.arms[0]).rotation.z=Math.PI/2;
  const w=new THREE.Group();w.position.set(0,-1,.1);w.rotation.x=Math.PI/2;u.arms[1].add(w);P(B(.14,1.8,.3),0xe2e8f0,0,.9,0,w);P(B(.5,.12,.2),0x78350f,0,0,0,w);
  const cp=new THREE.Group();cp.position.set(0,2.1,-.4);t.add(cp);P(B(1,1.7,.08),0xb91c1c,0,-.85,0,cp);u.cape=cp;
 }else if(cls==='archer'){
  P(Cn(.5,.8),0x065f46,0,3,0,t);P(B(1.3,.25,.8),0x065f46,0,2.2,0,t);
  P(Cy(.18,.18,.9,8),0x78350f,.3,1.9,-.5,t).rotation.z=.3;[0,1,2].forEach(i=>P(Cy(.03,.03,.5,4),0xe5e7eb,.15+i*.1,2.5,-.5,t));
  P(new THREE.TorusGeometry(.8,.06,6,14,Math.PI),0x92400e,0,-1,.3,u.arms[0]).rotation.set(0,-Math.PI/2,-Math.PI/2);
 }else{
  P(Cn(.5,1.1,10),0x1e3a8a,0,3.2,0,t);P(Cy(.75,.75,.07,14),0x1e3a8a,0,2.75,0,t);P(Cy(.55,.85,1,12),col,0,.9,0,hero);P(B(.5,.7,.12),0xf1f5f9,0,2.2,.38,t);
  const w=new THREE.Group();w.position.set(0,-1,.1);u.arms[1].add(w);P(Cy(.06,.06,2.8,6),0x451a03,0,.5,0,w);
  u.orb=P(Sp(.25),0x22d3ee,0,2,0,w,1);const ol=new THREE.PointLight(0x22d3ee,1.2,16);ol.position.set(0,2,0);w.add(ol);
 }
 scene.add(hero);
}
 
function selectClass(c){
 const k=CL[c];S.cls=c;S.maxHp=S.hp=k.hp;S.maxMp=S.mp=k.mp;S.atk=k.atk;S.sp=k.sp;S.rate=k.rate;const pk=SAVE.perks;S.maxHp+=20*(pk.hp||0);S.hp=S.maxHp;S.atk+=3*(pk.atk||0);S.maxMp+=15*(pk.mp||0);S.mp=S.maxMp;S.core=S.maxCore=500;S.cl=1;
 $('sel').classList.add('hide');$('hn').textContent=k.n;$('i1').textContent=k.i1;$('l1').textContent=k.l1;$('iu').textContent=k.iu;
 init();buildHero(c);if(MODE==='td'){buildCore();hero.position.set(6,0,6)}$('td').classList.toggle('hide',MODE!=='td');spawnWave();S.started=true;banner('Vague 1');
}
 
/* --- Ennemis --- */
function spawnWave(){
 S.spawning=false;
 if(MODE==='duel'){spawnEnemy(0,hero.position.x+25,hero.position.z,1);return}
 const n=4+S.wave*2;
 for(let i=0;i<n;i++){const a=Math.random()*6.283,r=28+Math.random()*10;spawnEnemy(0,hero.position.x+Math.cos(a)*r,hero.position.z+Math.sin(a)*r);}
 if(S.wave%5===0){const t=((S.wave/5-1)%6|0)+1;setTimeout(()=>banner('⚠ '+BN[t]),1700);spawnEnemy(t,hero.position.x,hero.position.z-30)}
}
function spawnEnemy(boss,x,z,rival){
 const sz=boss?2:rival?1.2:1,hp=rival?400+S.wave*150:boss?300+S.wave*100:40+S.wave*15;
 MATS=[];const ms=MATS,g=new THREE.Group(),b=new THREE.Group();g.add(b);b.scale.setScalar(sz);let L=null;
 if(rival){
  P(B(1.1,1.2,.7),0xe11d48,0,1.55,0,b);P(Sp(.45),0xfcd9a8,0,2.55,0,b);P(Cn(.5,.8),0x1f2937,0,3,0,b);P(B(.14,1.8,.3),0xe2e8f0,.95,2,.5,b);
  [-1,1].forEach(s=>P(Sp(.07),0x111827,s*.17,2.6,.4,b,1));L=legs(b,0x334155,.95,.95,.3);
 }else if(boss===2){
  P(B(1.6,1.8,1.1),0x78716c,0,1.5,0,b);P(B(.8,.7,.8),0x57534e,0,2.8,0,b);
  [-1,1].forEach(s=>{P(Sp(.1),0xfb923c,s*.2,2.85,.42,b,1);P(B(.6,1.6,.6),0x78716c,s*1.15,1.5,0,b);P(B(.7,1,.7),0x57534e,s*.5,.5,0,b)});
 }else if(boss===3){
  P(Cn(.9,2.4,8),0x991b1b,0,1.2,0,b);P(Sp(.4),0xdc2626,0,2.7,0,b);
  [-1,1].forEach(s=>{P(Sp(.08),0xfde047,s*.15,2.75,.33,b,1);P(Cn(.1,.6,6),0x1c1917,s*.3,3.15,0,b).rotation.z=-s*.4;P(B(1.6,.1,.9),0x450a0a,s*1.1,2,-.3,b).rotation.z=-s*.5});
 }else if(boss===4){
  P(Sp(.8),0x1f1f2e,0,1.1,-.5,b).scale.set(1,.9,1.3);P(Sp(.5),0x2b2b40,0,1.2,.5,b);
  [-1,1].forEach(s=>{for(let j=0;j<4;j++)P(Cy(.07,.05,1.6,5),0x111118,s*.9,.55,.3-j*.35,b).rotation.z=s*.74;P(Sp(.07),0xff2222,s*.18,1.35,.9,b,1);P(Sp(.05),0xff2222,s*.08,1.25,.95,b,1)});
 }else if(boss===5){
  P(new THREE.OctahedronGeometry(.9),0xfde047,0,2,0,b,1);P(Sp(.45),0xffffff,0,2,0,b,1);
  P(new THREE.TorusGeometry(1.3,.06,6,24),0x7dd3fc,0,2,0,b,1).rotation.x=1.3;P(new THREE.TorusGeometry(1.7,.05,6,24),0xfef08a,0,2,0,b,1).rotation.y=1.2;
 }else if(boss===6){
  P(Cy(1,1.2,1.3,10),0x15803d,0,.7,-.2,b);
  [-1,0,1].forEach(s=>{P(Cy(.18,.25,1.8,6),0x16a34a,s*.55,1.9,.2,b).rotation.z=-s*.35;P(Sp(.33),0x22c55e,s*.9,2.8,.4,b).scale.set(1,.8,1.2);P(Sp(.07),0xfde047,s*.9-.12,2.9,.7,b,1);P(Sp(.07),0xfde047,s*.9+.12,2.9,.7,b,1)});
 }else if(boss){
  P(Cn(.9,2.4,10),0x6d28d9,0,1.2,0,b);P(Sp(.38),0xe5e7eb,0,2.75,0,b);
  [-1,1].forEach(s=>{P(Sp(.09),0x4ade80,s*.13,2.8,.33,b,1);P(Cn(.1,.55,6),0xfde68a,s*.28,3.15,0,b).rotation.z=-s*.4;P(Sp(.3),0x4c1d95,s*.75,2.1,0,b)});
  P(Cy(.05,.05,3,6),0x451a03,1,1.5,.4,b);P(Sp(.2),0xc084fc,1,3.1,.4,b,1);
 }else{
  const sk=[0x65a30d,0xd97706,0xdc2626,0x7c3aed][Math.floor((S.wave-1)/3)%4];
  P(Sp(.55),sk,0,.95,0,b).scale.set(1,1.1,.9);P(Cy(.5,.6,.35,8),0x78350f,0,.55,0,b);P(Sp(.4),sk,0,1.75,.05,b);
  [-1,1].forEach(s=>{P(Cn(.12,.6,4),sk,s*.45,1.85,0,b).rotation.z=-s*1.2;P(Sp(.08),0xfde047,s*.15,1.8,.35,b,1);P(B(.2,.7,.2),sk,s*.62,1.1,.1,b)});
  P(Cy(.1,.18,.9,6),0x78350f,.7,1.1,.45,b).rotation.x=.8;L=legs(b,0x3f6212,.5,.5,.25);
 }
 const hb=new THREE.Mesh(B(1.4*sz,.16,.16),new THREE.MeshBasicMaterial({color:0xf43f5e}));hb.position.y=boss?7:2.6;g.add(hb);
 g.position.set(x,0,z);scene.add(g);
 const sp=rival?8:boss?3.5+Math.min(S.wave*.08,1.5):Math.min(9.5,5+Math.random()*2+S.wave*.22);
 enemies.push({g,b,mat:{emissive:{setHex:h=>ms.forEach(m=>m.emissive.setHex(h))}},hb,boss,hp,maxHp:hp,sp,sz,atk:8+S.wave*3,flash:0,dead:false,t:Math.random()*6,legs:L,rival:!!rival,pt:2,charge:0,wind:0,spin:0,sc:0,sa:0});
}
function damage(e,amt){
 if(e.dead)return;
 const crit=Math.random()<.15;if(crit)amt*=2;amt=Math.round(amt);
 e.hp-=amt;e.flash=.1;e.mat.emissive.setHex(0xffffff);snd('hit');
 dmgText(e.g.position,amt,crit?'#fde047':'#f87171');
 if(e.hp<=0){
  e.dead=true;scene.remove(e.g);fx(e.g.position,e.boss?0xa855f7:0xef4444,e.boss?30:10);
  S.gold+=Math.round(((e.boss?100:e.rival?120:15)+S.wave*2)*(1+.1*(SAVE.perks.gold||0)));S.xp+=e.boss?120:25;
  if(S.xp>=S.xpN){S.lv++;S.xp-=S.xpN;S.xpN=Math.round(S.xpN*1.45);S.maxHp+=15;S.hp=S.maxHp;S.mp=S.maxMp;S.atk+=3;snd('levelup');banner('Niveau '+S.lv+' !');fx(hero.position,0xfde047,25);}
 }
}
 
/* --- Attaques --- */
function aimDir(){const d=new THREE.Vector3(aim.x-hero.position.x,0,aim.z-hero.position.z);return d.lengthSq()<.01?new THREE.Vector3(0,0,-1):d.normalize();}
function shoot(dir,o){
 const m=new THREE.Mesh(new THREE.SphereGeometry(o.r||.3,8,8),new THREE.MeshBasicMaterial({color:o.col}));
 m.position.copy(o.from||hero.position).y=1.3;scene.add(m);
 shots.push({m,d:dir,sp:o.sp||26,dmg:o.dmg,life:1.6,pierce:!!o.pierce,boom:o.boom||0,hit:new Set()});
}
function basic(){
 hero.userData.atk=.25;const d=aimDir(),c=S.cls;
 if(c==='guerrier'){
  snd('slash');
  enemies.forEach(e=>{if(e.dead)return;const v=new THREE.Vector3(e.g.position.x-hero.position.x,0,e.g.position.z-hero.position.z),r=v.length();
   if(r<5.2+e.sz&&(r<1.5||d.angleTo(v.normalize())<1.1))damage(e,S.atk);});
  for(let i=0;i<8;i++)fxOne(hero.position.clone().addScaledVector(d,2.5),0xfbbf24);
 }else{
  snd('magic');
  for(let i=0;i<S.proj;i++){const a=(i-(S.proj-1)/2)*.22;
   shoot(d.clone().applyAxisAngle(Y,a),{col:CL[c].col,dmg:S.atk,pierce:c==='archer',sp:c==='archer'?34:26});}
 }
}
function useSkill(k){
 if(!S.started||S.paused||S.over)return;
 if(S.cd[k]>0){return}
 if(S.mp<COST[k]){dmgText(hero.position,'Mana !','#60a5fa');return}
 const c=S.cls;let ok=true;
 if(k===1){
  if(c==='guerrier'){snd('slash');enemies.forEach(e=>{if(!e.dead&&dxz(e.g.position,hero.position)<7+e.sz)damage(e,S.atk*2.2)});fx(hero.position,0xf59e0b,30);}
  else if(c==='archer'){snd('magic');const d=aimDir();for(let i=0;i<7;i++)shoot(d.clone().applyAxisAngle(Y,(i-3)*.2),{col:0x6ee7b7,dmg:S.atk*1.3,pierce:true,sp:34});}
  else{snd('magic');shoot(aimDir(),{col:0xf97316,dmg:S.atk*3,boom:6,r:.7,sp:20});}
 }else if(k===2){snd('gold');const h=Math.round(S.maxHp*.4);S.hp=Math.min(S.maxHp,S.hp+h);dmgText(hero.position,'+'+h,'#34d399');fx(hero.position,0x10b981,18);}
 else{snd('magic');enemies.slice().forEach(e=>{damage(e,S.atk*4);fx(e.g.position,0xef4444,8)});fx(hero.position,0xef4444,50);}
 S.mp-=COST[k];S.cd[k]=S.mcd[k]*(1-S.cdr);
}
 
const PG=new THREE.BoxGeometry(.22,.22,.22),PM={},pm=c=>PM[c]||(PM[c]=new THREE.MeshBasicMaterial({color:c}));
function fxOne(p,col){
 const m=new THREE.Mesh(PG,pm(col));m.position.copy(p);m.position.y=1;scene.add(m);
 parts.push({m,v:new THREE.Vector3((Math.random()-.5)*12,Math.random()*8+2,(Math.random()-.5)*12),life:.6});
}
function fx(p,col,n){for(let i=0;i<n;i++)fxOne(p,col)}
function dmgText(wp,t,col){
 const v=wp.clone();v.y+=2.5;v.project(camera);
 const el=document.createElement('div');el.className='dmg';el.style.left=((v.x*.5+.5)*innerWidth)+'px';el.style.top=((-v.y*.5+.5)*innerHeight)+'px';
 el.style.color=col;el.textContent=t;$('dc').appendChild(el);setTimeout(()=>el.remove(),900);
}
function banner(t){const b=$('ban');b.textContent=t;b.style.opacity=1;setTimeout(()=>b.style.opacity=0,1600);}
 
/* --- Échoppe --- */
let curTab='stats';const bought={};
const IT=[
 ['stats','⚔️ Puissance (+8 ATQ)',50,()=>S.atk+=8],
 ['stats','❤️ Santé max (+30)',40,()=>{S.maxHp+=30;S.hp+=30}],
 ['stats','👟 Vitesse (+1.5)',60,()=>S.sp+=1.5,6],
 ['stats','🛡️ Armure (+3)',70,()=>S.def+=3,8],
 ['shots','🔱 Tir multiple (+1)',150,()=>S.proj++,4],
 ['shots','⚡ Cadence (-10%)',90,()=>S.rate*=.9,6],
 ['skills','⏱️ Recharge (-10%)',100,()=>S.cdr+=.1,4],
 ['skills','💧 Mana max (+25)',60,()=>{S.maxMp+=25;S.mp+=25}]
];
function toggleShop(){
 if(!S.started||S.over)return;
 S.paused=!S.paused;$('shop').classList.toggle('hide',!S.paused);if(S.paused)renderShop();
}
function tab(t){curTab=t;['stats','shots','skills'].forEach(x=>$('t-'+x).classList.toggle('on',x===t));renderShop();}
function renderShop(){
 $('sg').textContent=S.gold;const c=$('sc');c.innerHTML='';
 IT.forEach((it,i)=>{if(it[0]!==curTab)return;
  const n=bought[i]||0,cost=Math.round(it[2]*(1+n*.6)),max=it[4],full=max&&n>=max;
  const d=document.createElement('div');d.className='it';
  d.innerHTML=`<div><b>${it[1]}</b><br><small style="color:#fbbf24">🪙 ${cost} or · niv. ${n}${max?'/'+max:''}</small></div>`;
  const b=document.createElement('button');b.className='btn';b.textContent=full?'Max':'Acheter';b.disabled=full||S.gold<cost;if(b.disabled)b.style.opacity=.45;
  b.onclick=()=>{if(S.gold<cost||full)return;S.gold-=cost;bought[i]=n+1;it[3]();snd('gold');renderShop();};
  d.appendChild(b);c.appendChild(d);});
}
 
/* --- Boucle --- */
function update(dt){
 const mv=new THREE.Vector3();
 S.dashT=(S.dashT||0)-dt;S.dashCd=(S.dashCd||0)-dt;if(keys.KeyC&&SAVE.perks.dash&&S.dashCd<=0){S.dashT=.25;S.dashCd=3;fx(hero.position,0x93c5fd,8)}
 if(keys.KeyW||keys.KeyZ||keys.ArrowUp)mv.z-=1;if(keys.KeyS||keys.ArrowDown)mv.z+=1;
 if(keys.KeyA||keys.KeyQ||keys.ArrowLeft)mv.x-=1;if(keys.KeyD||keys.ArrowRight)mv.x+=1;
 if(mv.lengthSq()){mv.normalize();moveDir.copy(mv);hero.position.addScaledVector(mv,S.sp*(S.dashT>0?3:1)*dt);const r=Math.hypot(hero.position.x,hero.position.z);if(r>65)hero.position.multiplyScalar(65/r);}
 if(is2D){camera.up.set(0,0,-1);camera.position.set(hero.position.x,80,hero.position.z)}else{camera.up.set(0,1,0);camera.position.set(hero.position.x,35,hero.position.z+30)}camera.lookAt(hero.position.x,0,hero.position.z);
 ray.setFromCamera(mouse,camera);ray.ray.intersectPlane(plane,mAim);
 if(performance.now()-lastMouseT<2500)aim.copy(mAim);else aim.set(hero.position.x+moveDir.x*10,0,hero.position.z+moveDir.z*10);
 hero.lookAt(aim.x,0,aim.z);
 const hu=hero.userData,mvg=mv.lengthSq()>0,w=hu.t=(hu.t||0)+dt*(mvg?(S.dashT>0?20:11):2);
 hu.legs.forEach((l,i)=>l.rotation.x=mvg?Math.sin(w+i*Math.PI)*.8:0);
 hu.arms.forEach((a,i)=>a.rotation.x=(hu.atk>0&&i===1)?-2.2+(1-hu.atk/.25)*1.8:mvg?Math.sin(w+(1-i)*Math.PI)*.6:Math.sin(w)*.05);
 hu.atk=Math.max(0,(hu.atk||0)-dt);hu.body.position.y=mvg?Math.abs(Math.sin(w))*.12:Math.sin(w)*.03;
 if(hu.cape)hu.cape.rotation.x=.15+(mvg?.3+Math.sin(w*2)*.1:Math.sin(w)*.04);
 if(hu.orb)hu.orb.scale.setScalar(1+Math.sin(performance.now()/200)*.15);
 hu.light.intensity=1.1+Math.sin(performance.now()/120)*.1;
 S.fire-=dt;if((mouseDown||keys.Space)&&S.fire<=0){basic();S.fire=S.rate;}
 S.mp=Math.min(S.maxMp,S.mp+3*dt);S.hp=Math.min(S.maxHp,S.hp+(.4+.5*(SAVE.perks.regen||0))*dt);
 [[1,'c1','b1'],[2,'c2','b2'],['u','cu','bu']].forEach(([k,c,b])=>{
  if(S.cd[k]>0)S.cd[k]=Math.max(0,S.cd[k]-dt);
  $(c).style.height=(S.cd[k]/(S.mcd[k]*(1-S.cdr))*100)+'%';
  $(b).classList.toggle('off',S.mp<COST[k]);});
 /* projectiles */
 for(let i=shots.length-1;i>=0;i--){
  const p=shots[i];p.m.position.addScaledVector(p.d,p.sp*dt);p.life-=dt;let done=p.life<=0;
  for(const e of (p.hostile?[]:enemies)){
   if(e.dead||p.hit.has(e))continue;
   if(dxz(p.m.position,e.g.position)<e.sz*.8+.5){
    p.hit.add(e);
    if(p.boom){done=true;break;}
    damage(e,p.dmg);if(!p.pierce){done=true;break;}
   }}
  if(p.hostile&&dxz(p.m.position,hero.position)<1.2){S.hp-=Math.max(1,p.dmg-S.def*.5);done=true;fx(hero.position,0xef4444,6)}
  if(done){
   if(p.boom){snd('hit');fx(p.m.position,0xf97316,25);enemies.slice().forEach(e=>{if(!e.dead&&dxz(e.g.position,p.m.position)<p.boom)damage(e,p.dmg)});}
   scene.remove(p.m);shots.splice(i,1);}
 }
 /* ennemis */
 for(const e of enemies){
  const T=(MODE==='td'&&!e.boss&&!e.rival)?core.position:hero.position,v=new THREE.Vector3(T.x-e.g.position.x,0,T.z-e.g.position.z),dist=v.length();
  if(dist>.01)v.divideScalar(dist);
  if(e.charge>0){e.charge-=dt;e.g.position.addScaledVector(e.cdir,18*dt)}else if(e.wind>0){e.wind-=dt;if(e.wind<=0)slam(e)}
  else if(e.rival&&dist<10)e.g.position.addScaledVector(new THREE.Vector3(-v.z,0,v.x),e.sp*.7*dt*(e.t%4<2?1:-1));
  else if(dist>.01)e.g.position.addScaledVector(v,e.sp*dt);
  if(e.boss||e.rival)ai(e,v,dist,dt);
  e.b.rotation.y=Math.atan2(v.x,v.z);e.t+=dt;if(e.legs)e.legs.forEach((l,i)=>l.rotation.x=Math.sin(e.t*e.sp*1.6+i*Math.PI)*.6);else e.b.position.y=Math.sin(e.t*3)*.25;
  for(const o of enemies){if(o===e||o.dead)continue;const dd=dxz(e.g.position,o.g.position),mn=(e.sz+o.sz)*.6;
   if(dd<mn&&dd>.001){e.g.position.x+=(e.g.position.x-o.g.position.x)/dd*dt*3;e.g.position.z+=(e.g.position.z-o.g.position.z)/dd*dt*3;}}
  e.hb.scale.x=Math.max(.001,e.hp/e.maxHp);e.hb.position.x=0;
  if(e.flash>0){e.flash-=dt;if(e.flash<=0)e.mat.emissive.setHex(0);}
  if(dist<1.1*e.sz+.6){const dm=Math.max(1,e.atk-S.def*.5)*dt;if(T===hero.position)S.hp-=dm;else S.core-=dm}
 }
 for(let i=enemies.length-1;i>=0;i--)if(enemies[i].dead)enemies.splice(i,1);
 if(S.hp<=0){S.hp=0;endGame('VOUS ÊTES TOMBÉ')}if(MODE==='td'&&S.core<=0)endGame('LA BASE EST DÉTRUITE');
 towers.forEach(t=>{t.cd-=dt;if(t.cd>0)return;let b=null,bd=24;enemies.forEach(e=>{const d=dxz(e.g.position,t.g.position);if(!e.dead&&d<bd){bd=d;b=e}});
  if(b){t.cd=.8/(1+.3*t.lv);shoot(new THREE.Vector3(b.g.position.x-t.g.position.x,0,b.g.position.z-t.g.position.z).normalize(),{col:0x38bdf8,dmg:10+8*t.lv,from:t.g.position,sp:30})}});
 if(!enemies.length&&!S.spawning){S.spawning=true;S.wave++;S.hp=Math.min(S.maxHp,S.hp+S.maxHp*.15);banner('Vague '+S.wave+(S.wave%5===0?' · BOSS !':''));setTimeout(spawnWave,2000);}
 for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.v.y-=18*dt;p.m.position.addScaledVector(p.v,dt);p.life-=dt;if(p.life<=0){scene.remove(p.m);parts.splice(i,1);}}
}
function hud(){
 $('hp').firstChild.style.width=S.hp/S.maxHp*100+'%';$('hp').lastChild.textContent=Math.ceil(S.hp)+' / '+S.maxHp;
 $('mp').firstChild.style.width=S.mp/S.maxMp*100+'%';$('mp').lastChild.textContent=Math.floor(S.mp)+' / '+S.maxMp;
 $('xp').firstChild.style.width=S.xp/S.xpN*100+'%';
 $('gd').textContent=S.gold;$('wv').textContent=S.wave;$('hl').textContent='Niv. '+S.lv;
 if(S.paused)$('sg').textContent=S.gold;
 if(MODE==='td')$('td').innerHTML='🏰 Base '+Math.ceil(S.core)+'/'+S.maxCore+' (niv.'+S.cl+')<br>[B] Tour 100 · [U] Améliorer tour · [K] Base '+150*S.cl+' · Tours : '+towers.length;
 const c=$('mm').getContext('2d');c.clearRect(0,0,120,120);c.fillStyle='#38bdf8';c.fillRect(57,57,6,6);
 enemies.forEach(e=>{const x=60+(e.g.position.x-hero.position.x)*1.1,y=60+(e.g.position.z-hero.position.z)*1.1;
  if(x>2&&x<118&&y>2&&y<118){c.fillStyle=e.boss?'#c084fc':'#f43f5e';const s=e.boss?6:3;c.fillRect(x-s/2,y-s/2,s,s);}});
}
/* --- Boss, TD, menu --- */
function eshot(p,d,sp){const m=new THREE.Mesh(new THREE.SphereGeometry(.35,8,8),new THREE.MeshBasicMaterial({color:0xff3b3b}));m.position.copy(p).y=1.3;scene.add(m);shots.push({m,d:d.clone().normalize(),sp:sp||13,dmg:10+S.wave*1.5,life:3,hostile:true,hit:new Set()})}
const BN=['','Le Liche','Le Golem','Le Démon','La Reine Araignée','L’Esprit de foudre','L’Hydre'];
const ang=(i,n)=>new THREE.Vector3(Math.cos(i*6.2832/n),0,Math.sin(i*6.2832/n));
function ai(e,v,dist,dt){
 if(e.spin>0){e.spin-=dt;e.sc-=dt;if(e.sc<=0){e.sc=.12;e.sa+=1.3;eshot(e.g.position,ang(e.sa,10))}}
 e.pt-=dt;if(e.pt>0)return;
 if(e.rival){e.pt=.8;eshot(e.g.position,v,17);return}
 const t=e.boss;
 if(t===1){e.pt=3;for(let i=0;i<12;i++)eshot(e.g.position,ang(i,12))}
 else if(t===2){e.pt=4;e.charge=.8;e.cdir=v.clone()}
 else if(t===3){e.pt=3.8;e.wind=.9;e.mat.emissive.setHex(0xff0000)}
 else if(t===4){e.pt=2.2;for(let i=-2;i<=2;i++)eshot(e.g.position,v.clone().applyAxisAngle(Y,i*.25),15)}
 else if(t===5){e.pt=3.2;const a=Math.random()*6.28;e.g.position.set(hero.position.x+Math.cos(a)*8,0,hero.position.z+Math.sin(a)*8);fx(e.g.position,0xfde047,25);for(let i=0;i<8;i++)eshot(e.g.position,ang(i,8),16)}
 else{e.pt=5;e.spin=2.5;e.sc=0}
}
function slam(e){e.mat.emissive.setHex(0);fx(e.g.position,0xf97316,40);snd('hit');if(dxz(e.g.position,hero.position)<9)S.hp-=Math.max(5,30-S.def*.5);for(let i=0;i<8;i++)eshot(e.g.position,ang(i,8))}
function endGame(t){if(S.over)return;S.over=true;SAVE.gold+=S.gold;save();$('gt').textContent=t;$('gw').textContent=S.wave;$('gg').textContent=S.gold;$('go').classList.remove('hide')}
function buildCore(){core=new THREE.Group();P(Cy(3,3.6,1,10),0x475569,0,.5,0,core);P(Cy(.3,.3,1.6,6),0x94a3b8,0,1.8,0,core);P(new THREE.OctahedronGeometry(1.4),0x22d3ee,0,3.2,0,core,1);scene.add(core)}
function tdKeys(c){if(MODE!=='td')return;
 if(c==='KeyB'&&S.gold>=100&&dxz(hero.position,core.position)>4){S.gold-=100;const g=new THREE.Group();P(Cy(.9,1.2,2,8),0x64748b,0,1,0,g);P(Sp(.7),0x38bdf8,0,2.5,0,g,1);g.position.copy(hero.position).y=0;scene.add(g);towers.push({g,lv:1,cd:0});snd('gold')}
 if(c==='KeyU'){const t=towers.find(t=>dxz(t.g.position,hero.position)<5);if(t&&t.lv<5&&S.gold>=100*t.lv){S.gold-=100*t.lv;t.lv++;t.g.scale.setScalar(1+.12*t.lv);snd('levelup')}}
 if(c==='KeyK'){const k=150*S.cl;if(S.gold>=k){S.gold-=k;S.cl++;S.maxCore+=250;S.core=S.maxCore;core.scale.setScalar(1+.12*S.cl);snd('levelup')}}}
const SAVE=(()=>{try{return JSON.parse(localStorage.getItem('fm3'))}catch(e){}})()||{gold:0,skins:['base'],skin:'base',perks:{}};
const save=()=>{try{localStorage.setItem('fm3',JSON.stringify(SAVE))}catch(e){}};
const SK={base:['Classique',0,0],or:['Doré',0xfacc15,200],ombre:['Ombre',0x6366f1,300],sakura:['Sakura',0xf472b6,300],lave:['Lave',0xef4444,500]};
const PK={hp:['❤️ +20 PV de départ',150,5],atk:['⚔️ +3 ATQ de départ',150,5],mp:['💧 +15 mana de départ',120,5],gold:['🪙 +10% or gagné',200,5],regen:['💗 Régénération +0,5 PV/s',250,4],dash:['💨 Dash [C] (recharge 3 s)',400,1]};
function pickMode(m){MODE=m;$('menu').classList.add('hide');$('sel').classList.remove('hide')}
function openMeta(){$('ms').classList.remove('hide');renderMeta()}
function renderMeta(){$('mg').textContent=$('mg2').textContent=SAVE.gold;const c=$('mc');c.innerHTML='<h3 style="color:#fcd34d">Skins</h3>';
 const row=(t,sub,btn,fn,dis)=>{const d=document.createElement('div');d.className='it';d.innerHTML=`<div><b>${t}</b><br><small style="color:#fbbf24">${sub}</small></div>`;const b=document.createElement('button');b.className='btn';b.textContent=btn;b.disabled=dis;if(dis)b.style.opacity=.45;b.onclick=()=>{fn();save();renderMeta()};d.appendChild(b);c.appendChild(d)};
 for(const k in SK){const o=SK[k],own=SAVE.skins.includes(k),eq=SAVE.skin===k;row(o[0],own?(eq?'Équipé':'Possédé'):'🪙 '+o[2],own?(eq?'✔':'Équiper'):'Acheter',()=>{if(!own)SAVE.gold-=o[2],SAVE.skins.push(k);SAVE.skin=k},own?eq:SAVE.gold<o[2])}
 c.insertAdjacentHTML('beforeend','<h3 style="color:#fcd34d;margin-top:14px">Compétences & bonus</h3>');
 for(const k in PK){const o=PK[k],n=SAVE.perks[k]||0,cost=Math.round(o[1]*(1+n*.5));row(o[0],'niv. '+n+'/'+o[2]+(n<o[2]?' · 🪙 '+cost:''),n>=o[2]?'Max':'Acheter',()=>{SAVE.gold-=cost;SAVE.perks[k]=n+1},n>=o[2]||SAVE.gold<cost)}}
$('mg').textContent=SAVE.gold;
 
let FR=0;
function loop(){
 requestAnimationFrame(loop);
 const dt=Math.min(clock.getDelta(),.05);
 if(S.started&&!S.paused&&!S.over)update(dt);
 if(S.started){if(++FR%3===0)hud();const tt=performance.now()/600;flies.forEach((f,i)=>f.position.y=2+Math.sin(tt+i)*.8)}
 renderer.render(scene,camera);
}
 