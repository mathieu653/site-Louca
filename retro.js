/* Mode Rétro : portage du jeu NumWorks (Kandinsky/Python) en JavaScript — écran 320x222 */
const RT={on:false,scr:'menu'};
(function(){
const W=320,H=222,rgb=(r,g,b)=>`rgb(${r},${g},${b})`;
const C={NOIR:'#000',BLANC:'#fff',ROUGE:rgb(220,40,40),HERBE:rgb(34,139,34),FONCE:rgb(0,90,0),MARRON:rgb(101,67,33),BLEU:rgb(50,150,255),JAUNE:rgb(255,220,0),ORANGE:rgb(255,140,0),CYAN:rgb(0,255,255),GRIS:rgb(120,120,120),GF:rgb(50,50,50),GOB:rgb(50,205,50),VIOLET:rgb(148,0,211)};
const ARBRES=[[30,35],[100,130],[220,45],[260,140]];
const cv=$('rc'),x=cv.getContext('2d');x.imageSmoothingEnabled=false;x.font='16px monospace';x.textBaseline='top';
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const fr=(a,b,w,h,c)=>{x.fillStyle=c;x.fillRect(Math.round(a),Math.round(b),w,h)};
const ds=(t,a,b,fg,bg)=>{if(bg)fr(a,b,x.measureText(t).width,17,bg);x.fillStyle=fg;x.fillText(t,a,b)};

/* Clavier : touches NumWorks -> clavier PC */
const KM={LEFT:['ArrowLeft','KeyA','KeyQ'],RIGHT:['ArrowRight','KeyD'],UP:['ArrowUp','KeyW','KeyZ'],DOWN:['ArrowDown','KeyS'],
ONE:['Digit1','Numpad1'],TWO:['Digit2','Numpad2'],THREE:['Digit3','Numpad3'],FOUR:['Digit4','Numpad4'],FIVE:['Digit5','Numpad5'],SIX:['Digit6','Numpad6'],
ZERO:['Digit0','Numpad0'],OK:['Enter','NumpadEnter'],EXE:['Space'],SHIFT:['ShiftLeft','ShiftRight'],BACK:['Backspace']};
let K={},J={};
const held=n=>KM[n].some(c=>K[c]),hit=n=>KM[n].some(c=>J[c]);
addEventListener('keydown',e=>{if(!RT.on)return;if(e.code==='Escape'){stopRetro();return}
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Backspace','Enter'].includes(e.code))e.preventDefault();
 if(!K[e.code])J[e.code]=1;K[e.code]=1});
addEventListener('keyup',e=>{K[e.code]=0});

/* État du jeu */
const newSt=()=>({pv_max:100,pv:100,mana_max:50,mana:50,bouclier_max:0,bouclier:0,or:30,mul_deg:1,tirs:1,vol_vie:0,crit:.05,sk1:0,sk2:0,sk3:0,ult:0});
let st,arme,px,py,dX,dY,cd1,cd2,cd3,cdD,inv,vague,mons,proj,projE,pops,coffres,page,timer=null;

function gen(nb,v){
 if(v%5===0){const pv=250+v*60;return[[W/2-12,35,pv,'BOSS',0,pv]]}
 const T=['Gobelin'];if(v>=2)T.push('Sorcier');if(v>=3)T.push('Orc');if(v>=4)T.push('Fantome');if(v>=5)T.push('Necromancien');
 const L=[];for(let i=0;i<nb;i++){const t=T[rnd(0,T.length-1)],pv=(t==='Gobelin'?15:t==='Orc'?35:t==='Sorcier'?20:25)+v*3;
  L.push([rnd(10,W-20),rnd(0,1)?H-35:25,pv,t,0,pv])}
 return L}

function begin(a){arme=a;st=newSt();px=150;py=100;dX=1;dY=0;cd1=cd2=cd3=cdD=0;inv=0;vague=1;mons=gen(3,1);proj=[];projE=[];pops=[];coffres=[];page=1;RT.scr='shop'}

/* Dessin */
function tree(a,b){fr(a+8,b+12,8,16,C.MARRON);fr(a,b,24,14,C.FONCE)}
function player(a,b,c,i){c=i?C.BLANC:c;fr(a+3,b,4,4,c);fr(a+4,b+4,2,8,c);fr(a+2,b+12,2,4,c);fr(a+6,b+12,2,4,c)}
function mon(m){const a=m[0],b=m[1],t=m[3];
 if(t==='Gobelin'){fr(a+2,b+4,6,6,C.GOB);fr(a,b+4,2,2,C.GOB)}
 else if(t==='Orc'){fr(a,b,12,12,C.ROUGE);fr(a+2,b+2,8,4,C.MARRON)}
 else if(t==='Sorcier'){fr(a+3,b,4,3,C.VIOLET);fr(a+1,b+3,8,9,C.VIOLET)}
 else if(t==='Fantome')fr(a+2,b+2,8,8,C.CYAN);
 else if(t==='Necromancien'){fr(a+2,b,8,10,C.GF);fr(a+4,b+2,4,4,C.ROUGE)}
 else{fr(a,b,24,24,C.VIOLET);fr(a+4,b+4,16,16,C.NOIR);fr(a+8,b+8,8,8,C.JAUNE)}}
function jauge(a,cd,nom,col,deb){fr(a,H-15,30,10,C.GF);if(deb){fr(a,H-15,cd===0?30:5,10,cd===0?col:C.GRIS);ds(nom,a+10,H-17,C.NOIR,C.BLANC)}}
function ui(){
 fr(0,0,W,18,C.NOIR);ds('PV:'+st.pv+' SH:'+st.bouclier,2,2,C.ROUGE,C.NOIR);ds('MP:'+st.mana,110,2,C.CYAN,C.NOIR);ds('V:'+vague,190,2,C.BLANC,C.NOIR);ds(st.or+'g',250,2,C.JAUNE,C.NOIR);
 const b=mons[0];if(b&&b[3]==='BOSS'){fr(80,19,160,4,C.GF);fr(80,19,Math.floor(160*Math.max(0,b[2]/b[5])),4,C.ROUGE)}
 fr(0,H-18,W,18,C.NOIR);ds('DASH:0',5,H-16,cdD<=0?C.VERT||C.GOB:C.GRIS,C.NOIR);
 jauge(80,cd1,'1',C.BLEU,st.sk1);jauge(140,cd2,'2',C.GOB,st.sk2);jauge(200,cd3,'3',C.ORANGE,st.sk3);
 const u=st.ult?C.VIOLET:C.GF;fr(260,H-15,50,10,u);ds('ULT',270,H-17,C.BLANC,u)}
function draw(){
 fr(0,0,W,H,C.NOIR);fr(0,18,W,H-36,C.HERBE);ARBRES.forEach(a=>tree(a[0],a[1]));
 coffres.forEach(c=>{fr(c[0],c[1],12,10,C.MARRON);fr(c[0]+4,c[1]+3,4,4,C.JAUNE)});
 proj.forEach(p=>fr(p[0],p[1],p[5],p[5],p[6]));projE.forEach(e=>fr(e[0],e[1],4,4,C.VIOLET));
 mons.forEach(mon);pops.forEach(p=>ds(p[0],p[1],p[2],p[4],C.HERBE));
 player(px,py,C.BLEU,inv>0);ui()}

/* Menu */
function menuDraw(){fr(0,0,W,H,C.NOIR);
 ds('=== FORET MAGIQUE EX ===',40,15,C.BLANC,C.NOIR);ds('1. Guerrier (Epee & Bouclier)',20,55,C.BLEU,C.NOIR);
 ds('2. Chasseur (Arc & Crit)',20,85,C.GOB,C.NOIR);ds('3. Mage (Baton & Mana)',20,115,C.JAUNE,C.NOIR);
 ds('Choisissez 1, 2 ou 3...',30,170,C.GRIS,C.NOIR);ds('Echap : quitter le mode retro',30,195,C.GRIS,C.NOIR)}

/* Boutique */
function buy(c,fn){if(st.or>=c){st.or-=c;fn();return true}return false}
function shop(){
 fr(0,0,W,H,C.NOIR);ds('=== BOUTIQUE ('+st.or+'g) ===',10,5,C.JAUNE,C.NOIR);
 if(page===1){
  ds('-- STATS DE BASE (1/3) --',10,25,C.GRIS,C.NOIR);ds('1. Soin +30 PV (20g)',10,45,C.GOB,C.NOIR);ds('2. Soin Max (40g)',10,65,C.GOB,C.NOIR);
  ds('3. +25 PV Max (35g)',10,85,C.BLEU,C.NOIR);ds('4. +20 Mana Max (25g)',10,105,C.CYAN,C.NOIR);ds('5. +20% Degats (40g)',10,125,C.ROUGE,C.NOIR);
  ds('6. +1 Dir. Tir ('+(st.tirs<4?st.tirs*100+'g':'MAX')+')',10,145,C.ORANGE,C.NOIR);
  if(hit('ONE')&&st.pv<st.pv_max)buy(20,()=>st.pv=Math.min(st.pv_max,st.pv+30));
  else if(hit('TWO')&&st.pv<st.pv_max)buy(40,()=>st.pv=st.pv_max);
  else if(hit('THREE'))buy(35,()=>{st.pv_max+=25;st.pv+=25});
  else if(hit('FOUR'))buy(25,()=>{st.mana_max+=20;st.mana+=20});
  else if(hit('FIVE'))buy(40,()=>st.mul_deg+=.2);
  else if(hit('SIX')&&st.tirs<4)buy(st.tirs*100,()=>st.tirs++);
 }else if(page===2){
  ds('-- SORTS & SCRIPT (2/3) --',10,25,C.GRIS,C.NOIR);
  ds('1. Sort 1 ('+(st.sk1?'ACQUIS':'30g')+')',10,50,C.BLEU,C.NOIR);ds('2. Sort 2 ('+(st.sk2?'ACQUIS':'60g')+')',10,75,C.GOB,C.NOIR);
  ds('3. Sort 3 ('+(st.sk3?'ACQUIS':'100g')+')',10,100,C.ORANGE,C.NOIR);ds('4. ULTIME SHIFT ('+(st.ult?'ACQUIS':'500g')+')',10,130,C.VIOLET,C.NOIR);
  if(hit('ONE')&&!st.sk1)buy(30,()=>st.sk1=1);else if(hit('TWO')&&!st.sk2)buy(60,()=>st.sk2=1);
  else if(hit('THREE')&&!st.sk3)buy(100,()=>st.sk3=1);else if(hit('FOUR')&&!st.ult)buy(500,()=>st.ult=1);
 }else{
  ds('-- PASSIFS ARBRE (3/3) --',10,25,C.GRIS,C.NOIR);ds('1. Vol de vie +5% (50g)',10,50,C.ROUGE,C.NOIR);
  ds('2. +10% Taux Crit (45g)',10,75,C.JAUNE,C.NOIR);ds('3. Bouclier Max +20 (60g)',10,100,C.CYAN,C.NOIR);
  if(hit('ONE'))buy(50,()=>st.vol_vie+=.05);else if(hit('TWO'))buy(45,()=>st.crit+=.1);
  else if(hit('THREE'))buy(60,()=>{st.bouclier_max+=20;st.bouclier+=20});
 }
 ds('Entree:suite Espace:fermer',10,195,C.GRIS,C.NOIR);
 if(hit('OK'))page=page%3+1;else if(hit('EXE')||hit('BACK'))RT.scr='play'}

/* Jeu */
function lier(dx,dy,deg,t,col,dur,vit=5){const crit=rnd(1,100)<=Math.floor(st.crit*100);
 proj.push([px+4,py+4,dx*vit,dy*vit,Math.floor(deg*st.mul_deg*(crit?2.5:1)),t,crit?C.JAUNE:col,dur])}
function lancer(deg,t,col,dur,vit=5){
 lier(dX,dY,deg,t,col,dur,vit);
 if(st.tirs>=2)lier(dX!==0?-dX:1,dY!==0?-dY:1,deg,t,col,dur,vit);
 if(st.tirs>=3)lier(0,-1,deg,t,col,dur,vit);if(st.tirs>=4)lier(0,1,deg,t,col,dur,vit)}
function hurt(d){if(st.bouclier>0){st.bouclier-=d;if(st.bouclier<0){st.pv+=st.bouclier;st.bouclier=0}}else st.pv-=d;pops.push(['-'+d,px,py-5,4,C.ROUGE])}
function play(){
 if(rnd(1,15)===1&&st.mana<st.mana_max)st.mana++;
 if(rnd(1,200)===1&&coffres.length<2)coffres.push([rnd(20,W-30),rnd(30,H-40)]);
 let dx=0,dy=0,v=3;
 if(held('ZERO')&&cdD<=0){v=8;cdD=25;inv=6}
 if(held('LEFT')&&px>5)dx-=v;if(held('RIGHT')&&px<W-15)dx+=v;if(held('UP')&&py>20)dy-=v;if(held('DOWN')&&py<H-35)dy+=v;
 px+=dx;py+=dy;if(dx||dy){dX=dx>0?1:dx<0?-1:0;dY=dy>0?1:dy<0?-1:0}
 coffres=coffres.filter(c=>{if(Math.abs(px-c[0])<12&&Math.abs(py-c[1])<12){const g=rnd(25,60);st.or+=g;pops.push(['+'+g+'g!',px,py-5,8,C.JAUNE]);return false}return true});
 if(held('OK')||held('EXE')){
  if(arme==='Epee')lancer(16,6,C.CYAN,3,4);else if(arme==='Arc')lancer(12,3,C.GRIS,10,7);
  else if(arme==='Baton'&&st.mana>=2){st.mana-=2;lancer(14,5,C.ORANGE,8,5)}}
 if(held('SHIFT')&&st.ult){st.ult=0;mons.forEach(m=>{m[2]=0;st.or+=20});mons=[]}
 if(held('ONE')&&cd1<=0&&st.sk1&&st.mana>=10){st.mana-=10;cd1=15;lancer(30,8,C.BLEU,5,6)}
 if(held('TWO')&&cd2<=0&&st.sk2&&st.mana>=15){st.mana-=15;cd2=25;if(arme==='Baton')st.pv=Math.min(st.pv_max,st.pv+35);else lancer(50,10,C.BLANC,6,8)}
 if(held('THREE')&&cd3<=0&&st.sk3&&st.mana>=25){st.mana-=25;cd3=40;[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]].forEach(d=>lier(d[0],d[1],45,8,C.ROUGE,8,5))}
 proj=proj.filter(p=>{p[0]+=p[2];p[1]+=p[3];p[7]--;let h=0;
  mons.forEach(m=>{const tm=m[3]==='BOSS'?24:12;if(Math.abs(p[0]-m[0])<tm&&Math.abs(p[1]-m[1])<tm){m[2]-=p[4];h=1;pops.push([''+p[4],Math.floor(m[0]),Math.floor(m[1])-4,4,p[6]]);
   if(st.vol_vie>0)st.pv=Math.min(st.pv_max,st.pv+Math.floor(p[4]*st.vol_vie))}});
  return!h&&p[7]>0&&p[0]>5&&p[0]<W-10&&p[1]>20&&p[1]<H-20});
 projE=projE.filter(e=>{e[0]+=e[2];e[1]+=e[3];e[4]--;
  if(Math.abs(e[0]-px)<8&&Math.abs(e[1]-py)<8&&inv<=0){hurt(8);return false}
  return e[4]>0&&e[0]>5&&e[0]<W-10&&e[1]>20&&e[1]<H-20});
 const nm=[];
 mons.forEach(m=>{
  if(m[2]<=0){const g=m[3]==='BOSS'?120:15;st.or+=g;pops.push(['+'+g+'g',m[0],m[1],6,C.JAUNE]);return}
  const vit=(m[3]==='BOSS'||m[3]==='Orc')?1:2;
  if(m[0]<px)m[0]+=vit;else if(m[0]>px)m[0]-=vit;if(m[1]<py)m[1]+=vit;else if(m[1]>py)m[1]-=vit;
  m[4]++;
  if(m[3]==='Sorcier'&&m[4]>=25){m[4]=0;projE.push([m[0],m[1],px>m[0]?2:-2,py>m[1]?2:-2,20])}
  else if(m[3]==='Necromancien'&&m[4]>=50){m[4]=0;nm.push([m[0]+10,m[1],10,'Gobelin',0,10])}
  const r=m[3]==='BOSS'?14:8;if(Math.abs(px-m[0])<r&&Math.abs(py-m[1])<r&&inv<=0)st.pv--;
  nm.push(m)});
 mons=nm;
 draw();
 pops=pops.filter(p=>{p[2]--;p[3]--;return p[3]>0});
 if(!mons.length){vague++;mons=gen(2+vague*2,vague);page=1;RT.scr='shop'}
 if(cd1>0)cd1--;if(cd2>0)cd2--;if(cd3>0)cd3--;if(cdD>0)cdD--;if(inv>0)inv--}

function tick(){
 if(!RT.on)return;
 if(RT.scr==='menu'){menuDraw();if(hit('ONE'))begin('Epee');else if(hit('TWO'))begin('Arc');else if(hit('THREE'))begin('Baton')}
 else if(RT.scr==='shop')shop();
 else if(RT.scr==='play'){play();if(st.pv<=0)RT.scr='over'}
 else{fr(0,0,W,H,C.NOIR);ds('GAME OVER',110,80,C.ROUGE,C.NOIR);ds('Vagues survecues: '+(vague-1),60,110,C.BLANC,C.NOIR);
  ds('Entree: rejouer | Echap: quitter',5,170,C.GRIS,C.NOIR);if(hit('OK')||hit('EXE'))RT.scr='menu'}
 J={}}

window.startRetro=function(){RT.on=true;RT.scr='menu';K={};J={};$('retro').classList.remove('hide');if(!timer)timer=setInterval(tick,33)};
window.stopRetro=function(){
 if(!RT.on)return;RT.on=false;clearInterval(timer);timer=null;$('retro').classList.add('hide');
 if(RM==='retro'){RM=RM0;try{localStorage.setItem('fmr',RM)}catch(e){}$('rmode').value=RM;if(typeof scene!=='undefined'&&scene)set2D(RM==='2d')}
 if(S.started&&!S.over)S.paused=false;else if(!S.started)$('menu').classList.remove('hide')};
})();