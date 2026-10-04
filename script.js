const game=document.querySelector("#game");
const player=document.querySelector("#player");
const playerImg=document.querySelector("#playerImg");
const enemy=document.querySelector("#enemy");
const enemyImg=document.querySelector("#enemyImg");
const pokeball=document.querySelector("#pokeball");
const pontosEl=document.querySelector("#pontos");
const recordeEl=document.querySelector("#recorde");
const vidasEl=document.querySelector("#vidas");
const cenarioEl=document.querySelector("#cenario");
const inimigoEl=document.querySelector("#inimigo");
const pokemonStatusEl=document.querySelector("#pokemonStatus");
const duploPuloEl=document.querySelector("#duploPulo");
const mensagem=document.querySelector("#message");
const startScreen=document.querySelector("#startScreen");
const gameOverScreen=document.querySelector("#gameOverScreen");
const startBtn=document.querySelector("#startBtn");
const restartBtn=document.querySelector("#restartBtn");
const finalPontos=document.querySelector("#finalPontos");
const finalRecorde=document.querySelector("#finalRecorde");
const audio=document.querySelector("#meuSom");
const somDano=document.querySelector("#somDano");
const soundBtn=document.querySelector("#soundBtn");

let pontos=0, vidas=3, record=Number(localStorage.getItem("record"))||0;
let rodando=false, pulando=false, podeDuplo=false, ultimoPulo=0;
let playerX=100, enemyX=0, ballX=0, ultimoTempo=0, acumulado=0, loopId;
let velocidade=260, somLigado=true;

const cenarios=[
  {nome:"Floresta",classe:"",emoji:"🌳"},
  {nome:"Noite",classe:"night",emoji:"🌙"},
  {nome:"Deserto",classe:"desert",emoji:"🏜️"},
  {nome:"Neve",classe:"snow",emoji:"❄️"}
];

const inimigos=[
  {nome:"Zubat",img:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/41.gif"},
  {nome:"Gastly",img:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/92.gif"},
  {nome:"Rattata",img:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/19.gif"},
  {nome:"Beedrill",img:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/15.gif"}
];

const evolucoes=[
  {pontos:0,nome:"Pikachu",img:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif"},
  {pontos:300,nome:"Raichu",img:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/26.gif"}
];

function atualizarHUD(){
  pontosEl.textContent=pontos;
  recordeEl.textContent=record;
  vidasEl.textContent="";

  for(let i=0;i<vidas;i++){
    const img=document.createElement("img");
    img.src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
    img.alt="Vida";
    img.style.width="25px";
    img.style.verticalAlign="middle";
    img.style.marginRight="3px";
    vidasEl.appendChild(img);
  }

  if(vidas===0) vidasEl.textContent="💀";

  const c=cenarios[Math.floor(pontos/100)%cenarios.length];
  game.classList.remove("night","desert","snow");
  if(c.classe) game.classList.add(c.classe);
  cenarioEl.textContent=c.emoji+" "+c.nome;

  const vilao=inimigos[Math.floor(pontos/200)%inimigos.length];
  enemyImg.src=vilao.img;
  enemyImg.alt=vilao.nome;
  inimigoEl.textContent="👾 "+vilao.nome;

  const evo=pontos>=300?evolucoes[1]:evolucoes[0];
  playerImg.src=evo.img;
  pokemonStatusEl.textContent="⚡ "+evo.nome+(pontos>=300?" (Evoluído!)":"");

  podeDuplo=pontos>=600;
  duploPuloEl.textContent=podeDuplo?"🪽 Duplo pulo: LIBERADO":"🔒 Duplo pulo: 600 pts";

  velocidade=Math.min(260+Math.floor(pontos/100)*18,390);
}

function mensagemJogo(texto){mensagem.textContent=texto}

function iniciar(){
  cancelAnimationFrame(loopId);
  pontos=0;vidas=3;velocidade=260;playerX=100;ultimoTempo=0;acumulado=0;
  rodando=true;pulando=false;ultimoPulo=0;
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  posicionar();
  atualizarHUD();
  mensagemJogo("🏃 Corra! Pule os vilões e pegue Pokébolas!");
  if(somLigado){audio.currentTime=0;audio.play().catch(()=>{});}
  loopId=requestAnimationFrame(loop);
}

function posicionar(){
  enemyX=game.clientWidth+80;
  ballX=game.clientWidth+260;
  enemy.style.left=enemyX+"px";
  pokeball.style.left=ballX+"px";
  player.style.left=playerX+"px";
}

function pular(){
  if(!rodando)return;

  if(!pulando){
    pulando=true;
    ultimoPulo=performance.now();
    player.classList.remove("jump","double");
    void player.offsetWidth;
    player.classList.add("jump");
    setTimeout(()=>pulando=false,680);
  }else if(podeDuplo && performance.now()-ultimoPulo>170){
    pulando=true;
    player.classList.remove("jump","double");
    void player.offsetWidth;
    player.classList.add("double");
    setTimeout(()=>pulando=false,950);
    mensagemJogo("🪽 Duplo pulo!");
  }
}

function mover(dir){
  if(!rodando)return;
  playerX+=dir*38;
  playerX=Math.max(15,Math.min(360,playerX));
  player.style.left=playerX+"px";
}

function colisao(a,b,m=10){
  const A=a.getBoundingClientRect(),B=b.getBoundingClientRect();
  return A.left<B.right-m&&A.right>B.left+m&&A.top<B.bottom-m&&A.bottom>B.top+m;
}

function dano(){
  vidas--;
  player.classList.add("hit");
  setTimeout(()=>player.classList.remove("hit"),300);
  if(somLigado){somDano.currentTime=0;somDano.play().catch(()=>{});}
  enemyX=game.clientWidth+180;
  if(vidas<=0) fim();
  else mensagemJogo("💥 Você sofreu dano!");
  atualizarHUD();
}

function pegar(){
  pontos+=25;
  pokeball.classList.add("collect");
  mensagemJogo("🔴 Pokébola! +25 pontos");
  setTimeout(()=>{
    pokeball.classList.remove("collect");
    ballX=game.clientWidth+300+Math.random()*500;
  },400);
  verificarRecord();
  atualizarHUD();
}

function verificarRecord(){
  if(pontos>record){
    record=pontos;
    localStorage.setItem("record",pontos);
  }
}

function atualizar(delta){
  enemyX-=velocidade*delta/1000;
  ballX-=velocidade*.72*delta/1000;
  if(enemyX<-90)enemyX=game.clientWidth+Math.random()*250;
  if(ballX<-50)ballX=game.clientWidth+350+Math.random()*500;
  enemy.style.left=enemyX+"px";
  pokeball.style.left=ballX+"px";

  if(colisao(player,enemy,18))dano();
  if(colisao(player,pokeball,7)){pegar();ballX=game.clientWidth+350;}

  acumulado+=delta;
  if(acumulado>=100){
    pontos+=Math.floor(acumulado/100);
    acumulado%=100;
    verificarRecord();
    atualizarHUD();
  }
}

function loop(t){
  if(!rodando)return;
  if(!ultimoTempo)ultimoTempo=t;
  const delta=Math.min(t-ultimoTempo,50);
  ultimoTempo=t;
  atualizar(delta);
  loopId=requestAnimationFrame(loop);
}

function fim(){
  rodando=false;
  cancelAnimationFrame(loopId);
  verificarRecord();
  atualizarHUD();
  if(somLigado)audio.pause();
  finalPontos.textContent=pontos;
  finalRecorde.textContent=record;
  gameOverScreen.classList.remove("hidden");
  mensagemJogo("🏆 Fim de jogo! Tente superar o recorde.");
}

document.addEventListener("keydown",e=>{
  if(["Space","ArrowUp","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();
  if(e.code==="Space"||e.code==="ArrowUp")pular();
  if(e.code==="ArrowLeft")mover(-1);
  if(e.code==="ArrowRight")mover(1);
});

startBtn.addEventListener("click",iniciar);
restartBtn.addEventListener("click",iniciar);
soundBtn.addEventListener("click",()=>{
  somLigado=!somLigado;
  soundBtn.textContent=somLigado?"🔊 Som":"🔇 Som";
  if(somLigado&&rodando)audio.play().catch(()=>{});
  else audio.pause();
});

recordeEl.textContent=record;
atualizarHUD();
