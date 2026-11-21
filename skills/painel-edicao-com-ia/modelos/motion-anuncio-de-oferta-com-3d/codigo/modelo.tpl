<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=1080, height=__H__">
<!-- Anúncio motion da oferta do Edição com IA (rodada 2, 08/11/2026). Gerado pelo build.py a partir deste modelo: não edite o index.html. -->
<script src="assets/gsap.min.js"></script>
<style>
@font-face { font-family: "M"; src: url("assets/Montserrat-VF.woff2") format("woff2"); font-weight: 100 900; }
@font-face { font-family: "S"; src: url("assets/InstrumentSerif-Italic.ttf") format("truetype"); font-style: italic; }
:root { --am: #F2C200; --preto: #08080A; --br: #F5F3EE; --glow: 0 0 24px rgba(242,194,0,.55), 0 0 70px rgba(242,194,0,.25); }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 1080px; height: __H__px; overflow: hidden; background: var(--preto); font-family: "M"; color: var(--br); }
#root { position: relative; width: 1080px; height: __H__px; overflow: hidden; background: var(--preto); }
#stage { position: absolute; left: 0; top: __OFF__px; width: 1080px; height: 1920px; }
.abs { position: absolute; }
.cena { position: absolute; inset: 0; visibility: hidden; }
.centro { left: 0; width: 1080px; text-align: center; }
.palco { position: absolute; inset: 0; perspective: 1600px; perspective-origin: 50% 42%; }
.p3 { position: absolute; transform-style: preserve-3d; will-change: transform; }
.serif { font-family: "S", serif; font-style: italic; font-weight: 400; letter-spacing: -.01em; }
.gig { font-weight: 900; letter-spacing: -.045em; line-height: .92; }
.am { color: var(--am); text-shadow: var(--glow); }
.caixa { position: relative; display: inline-block; padding: 0 .12em; color: var(--br); }
.caixa > .tx { position: relative; }
.caixa > .fundo { position: absolute; left: 0; right: 0; top: .08em; bottom: .02em; background: var(--am); border-radius: .08em; transform-origin: 0 50%; transform: scaleX(0); }
.caixa.on { color: #111; }
.letra, .pal { display: inline-block; will-change: transform, opacity, filter; }
.pilula { display: inline-block; background: var(--am); color: #111; font-weight: 800; border-radius: 999px; padding: 12px 34px; }

/* ===== fundo vivo ===== */
#bg { position: absolute; inset: 0; overflow: hidden; }
#bg-base { position: absolute; inset: 0; background: radial-gradient(ellipse 90% 60% at 50% 40%, #17171c 0%, #0b0b0e 55%, #050506 100%); }
.blob { position: absolute; width: 1100px; height: 1100px; border-radius: 50%; background: radial-gradient(circle, rgba(242,194,0,.20) 0%, rgba(242,194,0,.07) 38%, transparent 68%); }
#blob1 { left: -420px; top: 120px; } #blob2 { left: 380px; top: 900px; background: radial-gradient(circle, rgba(255,140,40,.13) 0%, rgba(255,140,40,.04) 40%, transparent 68%); }
#chao-palco { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; perspective: 900px; perspective-origin: 50% 30%; }
#chao { position: absolute; left: -1300px; top: 1250px; width: 3680px; height: 2200px; transform-origin: 50% 0; transform: rotateX(74deg);
  background-image: linear-gradient(rgba(242,194,0,.10) 2px, transparent 2px), linear-gradient(90deg, rgba(242,194,0,.10) 2px, transparent 2px);
  background-size: 120px 120px; -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 30%, #000 100%); }
#teto { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
  background-size: 90px 90px; -webkit-mask-image: radial-gradient(ellipse 70% 45% at 50% 35%, #000 0%, transparent 75%); }
.pt { position: absolute; width: 5px; height: 5px; border-radius: 50%; background: rgba(255,214,90,.75); box-shadow: 0 0 10px rgba(242,194,0,.8); }
#grao { position: absolute; inset: -200px; opacity: .07; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='220' height='220' filter='url(%23n)'/></svg>"); }
#vinheta { position: absolute; inset: 0; background: radial-gradient(ellipse 75% 60% at 50% 42%, transparent 45%, rgba(0,0,0,.78) 100%); }
#flash { position: absolute; inset: 0; background: #fff; opacity: 0; mix-blend-mode: overlay; }

/* ===== S1 gancho ===== */
#s1-tl { left: 120px; top: 1140px; width: 840px; height: 120px; opacity: .5; }
.trilha { position: absolute; left: 0; right: 0; height: 26px; border-radius: 6px; background: rgba(255,255,255,.05); }
.trilha i { position: absolute; top: 3px; height: 20px; border-radius: 5px; }
#s1-cabeca { position: absolute; top: -14px; width: 3px; height: 130px; background: var(--am); box-shadow: 0 0 12px var(--am); }
#s1-cabeca::before { content: ""; position: absolute; left: -9px; top: -4px; width: 21px; height: 16px; background: var(--am); clip-path: polygon(0 0, 100% 0, 50% 100%); }
#s1-tag { top: 300px; }
.tag { display: inline-flex; align-items: center; gap: 14px; padding: 12px 26px; border-radius: 999px; border: 2px solid rgba(255,255,255,.16); background: rgba(255,255,255,.04); font: 700 30px "M"; letter-spacing: .04em; color: rgba(255,255,255,.8); }
.tag .ponto { width: 14px; height: 14px; border-radius: 50%; background: #ff3b30; box-shadow: 0 0 12px #ff3b30; }
#s1-a { top: 455px; font-size: 150px; } #s1-b { top: 640px; font-size: 168px; }
#s1-c { top: 828px; font-size: 104px; color: rgba(255,255,255,.85); } #s1-d { top: 930px; font-size: 186px; }

/* ===== notebook 3D ===== */
.note { width: 640px; height: 410px; }
.nb-tampa { position: absolute; left: 0; top: 0; width: 640px; height: 410px; transform-origin: 50% 100%; transform: rotateX(14deg); transform-style: preserve-3d;
  border-radius: 24px 24px 8px 8px; background: #0a0a0c; box-shadow: 0 0 0 3px #b8bcc4, 0 0 0 4px #7e828a, 0 0 90px rgba(242,194,0,.16); }
.nb-tela { position: absolute; left: 16px; top: 16px; right: 16px; bottom: 22px; border-radius: 10px; overflow: hidden; background: #111; }
.nb-tela img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 0; }
.nb-tela::after { content: ""; position: absolute; inset: 0; background: linear-gradient(118deg, rgba(255,255,255,.14) 0%, rgba(255,255,255,.04) 34%, transparent 35%); }
.nb-notch { position: absolute; left: 50%; top: 16px; width: 104px; height: 15px; margin-left: -52px; background: #0a0a0c; border-radius: 0 0 9px 9px; }
.nb-chao { position: absolute; left: 0; top: 410px; width: 640px; height: 440px; transform-origin: 50% 0; transform: rotateX(90deg); transform-style: preserve-3d; }
.nb-sombra { position: absolute; left: -90px; top: -40px; right: -90px; bottom: -110px; transform: translateZ(-24px); background: radial-gradient(ellipse at 50% 45%, rgba(0,0,0,.85) 0%, rgba(0,0,0,.45) 45%, transparent 70%); filter: blur(14px); }
.nb-deck { position: absolute; inset: 0; border-radius: 6px 6px 26px 26px; background: linear-gradient(180deg, #9ea2aa 0%, #c9ccd2 6%, #d6d9de 55%, #c3c6cc 100%); box-shadow: inset 0 0 0 1px rgba(255,255,255,.35); }
.nb-dobra { position: absolute; left: 70px; right: 70px; top: 0; height: 12px; border-radius: 0 0 8px 8px; background: linear-gradient(#3b3d42, #6b6e75); }
.nb-teclado { position: absolute; left: 62px; right: 62px; top: 34px; height: 222px; padding: 10px; border-radius: 10px; background: #b5b8be; display: grid; grid-template-columns: repeat(14, 1fr); grid-template-rows: .6fr repeat(5, 1fr); gap: 6px; box-shadow: inset 0 1px 3px rgba(0,0,0,.25); }
.nb-teclado i { display: block; border-radius: 5px; background: linear-gradient(#26272b, #18191c); }
.nb-teclado i.esp { grid-column: span 6; } .nb-teclado i.dup { grid-column: span 2; }
.nb-track { position: absolute; left: 50%; top: 272px; width: 270px; height: 150px; margin-left: -135px; border-radius: 12px; background: linear-gradient(180deg, #c7cad0, #cdd0d5); box-shadow: inset 0 0 0 1px rgba(0,0,0,.12); }
.nb-frente { position: absolute; left: 6px; right: 6px; top: 100%; height: 16px; transform-origin: 50% 0; transform: rotateX(-90deg); border-radius: 0 0 12px 12px; background: linear-gradient(#a7abb2, #6f737a); }

/* ===== S2 ===== */
#s2-ant { top: 268px; font-size: 76px; color: rgba(255,255,255,.8); }
#s2-nome { top: 350px; font-size: 118px; }
#s2-note { left: 220px; top: 485px; }
#s2-grava, #s2-edita { top: 1092px; font-size: 96px; }

/* ===== celulares ===== */
.fone { width: 330px; height: 586px; border-radius: 46px; border: 10px solid #121214; overflow: hidden; background: #000;
  box-shadow: 0 0 0 2px #3a3a40, 0 30px 80px rgba(0,0,0,.7), 0 0 60px rgba(242,194,0,.10); }
.fone video, .tela169 video { width: 100%; height: 100%; object-fit: cover; display: block; }
.fone::after, .tela169::after { content: ""; position: absolute; inset: 0; background: linear-gradient(125deg, rgba(255,255,255,.13) 0%, rgba(255,255,255,.03) 30%, transparent 31%); pointer-events: none; }
.fone .ilha { position: absolute; left: 50%; top: 12px; width: 92px; height: 26px; margin-left: -46px; background: #000; border-radius: 20px; z-index: 2; }
.tela169 { width: 600px; height: 338px; border-radius: 22px; border: 10px solid #121214; overflow: hidden; background: #000; box-shadow: 0 0 0 2px #3a3a40, 0 30px 80px rgba(0,0,0,.7); }
#s3-ja { top: 262px; font-size: 64px; color: rgba(255,255,255,.75); }
#s3-oito { left: 290px; top: 300px; font-size: 230px; }
#s3-est { left: 470px; top: 352px; font-size: 140px; }
#s3-chip { top: 532px; height: 64px; overflow: hidden; }
#s3-chip .pilula { position: absolute; left: 0; right: 0; margin: 0 auto; width: max-content; top: 0; font-size: 34px; padding: 10px 30px; white-space: nowrap; }
#s3-car { left: 0; top: 0; width: 1080px; height: 1920px; }

/* ===== S5 capas ===== */
#s5-ant { top: 262px; font-size: 70px; color: rgba(255,255,255,.8); }
#s5-aula { top: 330px; font-size: 176px; }
#s5-pap { top: 520px; font-size: 86px; }
#s5-fila { left: 0; top: 690px; width: 3000px; height: 460px; }
.capa { position: absolute; top: 0; width: 300px; height: 450px; border-radius: 20px; overflow: hidden; box-shadow: 0 0 0 2px rgba(255,255,255,.12), 0 30px 70px rgba(0,0,0,.7); }
.capa img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* ===== S6/S7 bônus ===== */
#s6-mais { left: 250px; top: 268px; font-size: 220px; }
#s6-bonus { left: 520px; top: 330px; font-size: 150px; }
.bcard { left: 360px; top: 560px; width: 360px; height: 540px; border-radius: 26px; overflow: hidden; box-shadow: 0 0 0 2px rgba(242,194,0,.35), 0 40px 90px rgba(0,0,0,.75), 0 0 80px rgba(242,194,0,.15); }
.bcard img { width: 100%; height: 100%; object-fit: cover; display: block; }
#s7-selo { left: 600px; top: 600px; transform: rotate(-7deg); font-size: 40px; padding: 14px 30px; box-shadow: 0 12px 30px rgba(0,0,0,.5); }

/* ===== S8 atualizações e preço ===== */
#s8-atu { top: 330px; font-size: 118px; } #s8-sempre { top: 470px; font-size: 120px; }
#s8-inf { left: 290px; top: 640px; width: 500px; height: 250px; }
#s8-note { left: 220px; top: 470px; }
#s8-card { left: 150px; top: 860px; width: 780px; height: 300px; border-radius: 36px; background: linear-gradient(160deg, rgba(30,30,36,.92), rgba(12,12,15,.95));
  box-shadow: 0 0 0 2px rgba(242,194,0,.45), 0 40px 90px rgba(0,0,0,.8), 0 0 100px rgba(242,194,0,.18); }
#s8-por { left: 70px; top: 40px; font-size: 64px; color: rgba(255,255,255,.75); }
#s8-rs { left: 80px; top: 110px; font-size: 92px; font-weight: 800; }
#s8-37 { left: 212px; top: 10px; font-size: 290px; }
#s8-unico { left: 588px; top: 92px; font-size: 32px; line-height: 1.15; text-align: center; padding: 16px 26px; border-radius: 22px; }

/* ===== S9 garantia ===== */
#s9-escudo { left: 340px; top: 450px; width: 400px; height: 470px; }
#s9-txt { top: 960px; font-size: 104px; }

/* ===== S10 requisitos ===== */
#s10-tit { top: 330px; font-size: 92px; }
.req { left: 90px; width: 900px; height: 190px; border-radius: 32px; background: linear-gradient(160deg, rgba(34,34,40,.9), rgba(14,14,17,.92)); box-shadow: 0 0 0 2px rgba(255,255,255,.10), 0 30px 70px rgba(0,0,0,.6);
  display: flex; align-items: center; gap: 36px; padding: 0 50px; }
.req .ic { width: 110px; height: 110px; border-radius: 28px; background: rgba(242,194,0,.12); box-shadow: inset 0 0 0 2px rgba(242,194,0,.5); display: flex; align-items: center; justify-content: center; flex: none; }
.req .tx { white-space: nowrap; font-size: 62px; font-weight: 900; letter-spacing: -.03em; line-height: 1; }
.req .sub { display: block; margin-top: 10px; font: 400 44px "S"; font-style: italic; color: var(--am); letter-spacing: 0; }
#s10-r1 { top: 520px; } #s10-r2 { top: 760px; }

/* ===== S11 CTA ===== */
#s11-marca { top: 330px; font-size: 46px; font-weight: 700; color: rgba(255,255,255,.75); letter-spacing: .02em; }
#s11-toque { top: 430px; font-size: 120px; }
#s11-bt { left: 190px; top: 600px; width: 700px; height: 180px; border-radius: 999px; background: var(--am); color: #111; display: flex; align-items: center; justify-content: center; gap: 26px;
  font-size: 92px; font-weight: 900; letter-spacing: -.03em; box-shadow: 0 0 0 6px rgba(242,194,0,.25), 0 30px 80px rgba(242,194,0,.35); }
#s11-onda { left: 190px; top: 600px; width: 700px; height: 180px; border-radius: 999px; border: 5px solid var(--am); opacity: 0; }
#s11-mao { left: 640px; top: 760px; width: 150px; height: 170px; }
#s11-seta { left: 480px; top: 900px; width: 120px; height: 150px; }

/* ===== legenda ===== */
#leg { left: 0; top: 1236px; width: 1080px; height: 110px; }
.lg { position: absolute; left: 0; width: 1080px; top: 0; text-align: center; font-size: 60px; font-weight: 800; letter-spacing: -.01em; color: #fff; opacity: 0;
  text-shadow: 0 4px 0 rgba(0,0,0,.55), 0 10px 30px rgba(0,0,0,.6); }
.lg .k { color: var(--am); }
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1080" data-height="__H__">
<div id="stage">
  <div id="bg"><div id="bg-base"></div><div id="teto"></div><div id="blob1" class="blob"></div><div id="blob2" class="blob"></div>
    <div id="chao-palco"><div id="chao"></div></div><div id="pts"></div><div id="grao"></div><div id="vinheta"></div></div>

  <!-- S1: gancho -->
  <section id="s1" class="cena">
    <div id="s1-tag" class="abs centro"><span class="tag"><span class="ponto"></span>EDITADO PELO CLAUDE</span></div>
    <div id="s1-a" class="abs centro gig letras">ESTE</div>
    <div id="s1-b" class="abs centro gig letras">ANÚNCIO</div>
    <div id="s1-c" class="abs centro serif letras">foi editado pelo</div>
    <div id="s1-d" class="abs centro gig"><span class="caixa" id="s1-cx"><span class="fundo"></span><span class="tx">Claude</span></span></div>
    <div id="s1-tl" class="abs">
      <div class="trilha" style="top:0"><i style="left:0;width:210px;background:#F2C200"></i><i style="left:222px;width:120px;background:#c9a000"></i><i style="left:356px;width:300px;background:#F2C200"></i><i style="left:668px;width:172px;background:#c9a000"></i></div>
      <div class="trilha" style="top:38px"><i style="left:40px;width:160px;background:#5a6378"></i><i style="left:330px;width:240px;background:#5a6378"></i><i style="left:600px;width:200px;background:#5a6378"></i></div>
      <div class="trilha" style="top:76px"><i style="left:0;width:840px;background:linear-gradient(90deg,#2d3a2e,#3c5a40)"></i></div>
      <div id="s1-cabeca"></div>
    </div>
  </section>

  <!-- S2: painel -->
  <section id="s2" class="cena">
    <div id="s2-ant" class="abs centro serif letras">no painel do</div>
    <div id="s2-nome" class="abs centro gig">Edição com <span class="caixa" id="s2-cx-ia"><span class="fundo"></span><span class="tx">IA</span></span></div>
    <div class="palco" id="s2-palco"><div id="s2-note" class="p3 note">
      <div class="nb-chao"><div class="nb-sombra"></div><div class="nb-deck"><div class="nb-dobra"></div><div class="nb-teclado"></div><div class="nb-track"></div></div><div class="nb-frente"></div></div>
      <div class="nb-tampa"><div class="nb-tela"><img id="s2-t1" src="assets/painel-inicio.jpg"><img id="s2-t2" src="assets/painel-projeto-andamento.jpg" style="opacity:0"><img id="s2-t3" src="assets/painel-projeto-pronto.jpg" style="opacity:0"></div><div class="nb-notch"></div></div>
    </div></div>
    <div id="s2-grava" class="abs centro gig">Você grava.</div>
    <div id="s2-edita" class="abs centro gig">o Claude <span class="caixa" id="s2-cx-ed"><span class="fundo"></span><span class="tx">edita.</span></span></div>
  </section>

  <!-- S3/S4: 8 estilos -->
  <section id="s3" class="cena">
    <div id="s3-ja" class="abs centro serif letras">já são</div>
    <div id="s3-oito" class="abs gig am">8</div>
    <div id="s3-est" class="abs serif letras">estilos</div>
    <div id="s3-chip" class="abs centro">__CHIPS__</div>
    <div class="palco" id="s3-car">__FONES__</div>
  </section>

  <!-- S5: aula e passo a passo -->
  <section id="s5" class="cena">
    <div id="s5-ant" class="abs centro serif letras">cada um com</div>
    <div id="s5-aula" class="abs centro gig"><span class="caixa" id="s5-cx"><span class="fundo"></span><span class="tx">aula</span></span></div>
    <div id="s5-pap" class="abs centro gig palavras">+ passo a passo</div>
    <div class="palco"><div id="s5-fila" class="p3">__CAPAS__</div></div>
  </section>

  <!-- S6/S7: bônus -->
  <section id="s6" class="cena">
    <div id="s6-mais" class="abs gig am">+3</div>
    <div id="s6-bonus" class="abs serif letras">bônus</div>
    <div class="palco">
      <div id="b1" class="p3 bcard"><img src="assets/capa-bonus1.jpg"></div>
      <div id="b2" class="p3 bcard"><img src="assets/capa-bonus2.jpg"></div>
      <div id="b3" class="p3 bcard"><img src="assets/capa-bonus3.jpg"></div>
    </div>
    <div id="s7-selo" class="abs pilula">54 temas virais</div>
  </section>

  <!-- S8: atualizações + preço -->
  <section id="s8" class="cena">
    <div id="s8-atu" class="abs centro gig">atualizações</div>
    <div id="s8-sempre" class="abs centro serif am">para sempre</div>
    <svg id="s8-inf" class="abs" viewBox="0 0 500 250"><path id="s8-infp" d="M250 125 C 200 50, 90 40, 75 125 C 90 210, 200 200, 250 125 C 300 50, 410 40, 425 125 C 410 210, 300 200, 250 125 Z" fill="none" stroke="#F2C200" stroke-width="22" stroke-linecap="round" style="filter:drop-shadow(0 0 18px rgba(242,194,0,.7))"/></svg>
    <div class="palco" id="s8-palco"><div id="s8-note" class="p3 note">
      <div class="nb-chao"><div class="nb-sombra"></div><div class="nb-deck"><div class="nb-dobra"></div><div class="nb-teclado"></div><div class="nb-track"></div></div><div class="nb-frente"></div></div>
      <div class="nb-tampa"><div class="nb-tela"><img src="assets/painel-modelos.jpg"></div><div class="nb-notch"></div></div>
    </div></div>
    <div id="s8-card" class="abs">
      <div id="s8-por" class="abs serif letras">por</div>
      <div id="s8-rs" class="abs">R$</div>
      <div id="s8-37" class="abs gig am">37</div>
      <div id="s8-unico" class="abs pilula">pagamento<br>único</div>
    </div>
  </section>

  <!-- S9: garantia -->
  <section id="s9" class="cena">
    <svg id="s9-escudo" class="abs" viewBox="0 0 400 470">
      <path d="M200 16 L372 76 C 372 250, 320 380, 200 452 C 80 380, 28 250, 28 76 Z" fill="rgba(242,194,0,.10)" stroke="#F2C200" stroke-width="16" stroke-linejoin="round" style="filter:drop-shadow(0 0 22px rgba(242,194,0,.55))"/>
      <text x="200" y="300" text-anchor="middle" font-family="M" font-weight="900" font-size="230" fill="#F2C200" letter-spacing="-8">7</text>
      <text x="200" y="370" text-anchor="middle" font-family="M" font-weight="800" font-size="48" fill="#F5F3EE" letter-spacing="6">DIAS</text>
    </svg>
    <div id="s9-txt" class="abs centro serif letras">de garantia</div>
  </section>

  <!-- S10: o que precisa -->
  <section id="s10" class="cena">
    <div id="s10-tit" class="abs centro serif letras">você só precisa de</div>
    <div id="s10-r1" class="abs req"><div class="ic"><svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#F2C200" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/></svg></div><div class="tx">Mac ou Windows</div></div>
    <div id="s10-r2" class="abs req"><div class="ic"><svg width="70" height="70" viewBox="0 0 24 24" fill="#F2C200"><path d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.3L12 16.5 5.8 21l2.4-7.3L2 9.2h7.6z"/></svg></div><div class="tx">Claude Pro<span class="sub" id="s10-sub">pago à parte</span></div></div>
  </section>

  <!-- S11: CTA -->
  <section id="s11" class="cena">
    <div id="s11-marca" class="abs centro">Edição com IA · R$ 37</div>
    <div id="s11-toque" class="abs centro serif letras">toque em</div>
    <div id="s11-onda" class="abs"></div>
    <div id="s11-bt" class="abs">Saiba mais <svg width="74" height="74" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
    <svg id="s11-mao" class="abs" viewBox="0 0 24 28"><path d="M9 2.5a1.6 1.6 0 0 1 3.2 0V12l.4-.1V9.6a1.6 1.6 0 0 1 3.2 0v2.6l.4-.1v-1.5a1.6 1.6 0 0 1 3.2 0V18c0 4.4-3 8-7.4 8h-.6c-2.4 0-4.2-1.2-5.6-3.2L2.6 18a1.7 1.7 0 0 1 2.7-2L9 19z" fill="#fff" stroke="#111" stroke-width="1.1" stroke-linejoin="round"/></svg>
    <svg id="s11-seta" class="abs" viewBox="0 0 24 30" style="overflow:visible;filter:drop-shadow(0 0 10px rgba(242,194,0,.8))"><path d="M4 4l8 8 8-8M4 16l8 8 8-8" fill="none" stroke="#F2C200" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </section>

  <div id="leg" class="abs">__LEGENDA__</div>
  <div id="flash"></div>
</div>
</div>
<script>
const DUR = __DUR__;
const W = __TEMPOS__;               // tempo (s) de cada palavra que importa, vindo do Whisper
const CAR = __CARROSSEL__;          // passos do carrossel de estilos
const LEG = __LEGJS__;              // [início, fim] de cada bloco de legenda
window.__timelines = window.__timelines || {};
const h = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// letras e palavras viram spans (antes do vídeo começar; nada muda durante o render)
document.querySelectorAll(".letras").forEach((el) => { el.innerHTML = [...el.textContent].map((c) => c === " " ? " " : `<span class="letra">${c}</span>`).join(""); });
document.querySelectorAll(".palavras").forEach((el) => { el.innerHTML = el.textContent.split(" ").map((w) => `<span class="pal">${w}</span>`).join(" "); });
document.querySelectorAll(".nb-teclado").forEach((tec) => { for (let i = 0; i < 70; i++) tec.appendChild(document.createElement("i"));
  ["", "", "dup", "esp", "dup", "", ""].forEach((c) => { const k = document.createElement("i"); if (c) k.className = c; tec.appendChild(k); }); });
const pts = document.getElementById("pts");
for (let i = 0; i < 34; i++) { const d = document.createElement("div"); d.className = "pt"; d.style.left = (h(i) * 1080) + "px"; d.style.top = (200 + h(i + 50) * 1500) + "px";
  const s = .5 + h(i + 9) * 1.1; d.style.transform = `scale(${s})`; d.style.opacity = (.25 + h(i + 3) * .55).toFixed(2); pts.appendChild(d); }

const tl = gsap.timeline({ paused: true });
const $ = (s) => document.querySelector(s), $$ = (s) => document.querySelectorAll(s);
const L = (sel) => $$(sel + " .letra"), P = (sel) => $$(sel + " .pal");
const mostra = (sel, a, b) => { tl.set(sel, { visibility: "visible" }, a); if (b !== undefined) tl.set(sel, { visibility: "hidden" }, b); };
const letrasSobe = (sel, t, st = .035) => tl.fromTo(L(sel), { y: 90, opacity: 0, filter: "blur(14px)", scale: 1.3 }, { y: 0, opacity: 1, filter: "blur(0px)", scale: 1, duration: .42, ease: "power3.out", stagger: st }, t);
const letrasBate = (sel, t, st = .03) => tl.fromTo(L(sel), { opacity: 0, scale: 2.1, filter: "blur(18px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: .32, ease: "expo.out", stagger: st }, t);
const letrasDigita = (sel, t, st = .04) => tl.fromTo(L(sel), { opacity: 0, x: -26, filter: "blur(10px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: .22, ease: "power2.out", stagger: st }, t);
const palavrasBlur = (sel, t, st = .14) => tl.fromTo(P(sel), { opacity: 0, x: -60, filter: "blur(16px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: .32, ease: "power3.out", stagger: st }, t);
const caixa = (sel, t) => { tl.fromTo(sel + " .fundo", { scaleX: 0 }, { scaleX: 1, duration: .28, ease: "power3.out" }, t); tl.set(sel, { attr: { class: "caixa on" } }, t + .1); };
const sobe = (sel, t, d = .5) => tl.fromTo(sel, { y: 70, opacity: 0, filter: "blur(12px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: d, ease: "power3.out" }, t);
const sai = (sel, t, v = {}) => tl.to(sel, Object.assign({ opacity: 0, filter: "blur(14px)", duration: .25, ease: "power2.in" }, v), t);

// ===== fundo vivo (movimento contínuo e determinístico) =====
tl.to("#blob1", { x: 520, y: 380, duration: DUR, ease: "sine.inOut" }, 0);
tl.to("#blob2", { x: -560, y: -520, duration: DUR, ease: "sine.inOut" }, 0);
tl.to("#chao", { backgroundPositionY: "1440px", duration: DUR, ease: "none" }, 0);
tl.to("#grao", { x: 120, y: -90, duration: DUR, ease: `steps(${Math.round(DUR * 12)})` }, 0);
$$(".pt").forEach((p, i) => tl.to(p, { y: -(160 + h(i + 21) * 260), x: (h(i + 33) - .5) * 80, duration: DUR, ease: "none" }, 0));
const flash = (t, o = .55) => tl.fromTo("#flash", { opacity: o }, { opacity: 0, duration: .35, ease: "power2.out", immediateRender: false }, t);

// ===== S1: gancho =====
mostra("#s1", 0, W.s2);
tl.fromTo("#s1-tag", { y: -16, opacity: .55 }, { y: 0, opacity: 1, duration: .3, ease: "power3.out" }, 0);
tl.fromTo("#s1-tag .ponto", { opacity: 1 }, { opacity: .2, duration: .3, repeat: 5, yoyo: true, ease: "none" }, .1);
tl.fromTo(L("#s1-a"), { opacity: .35, scale: 1.45, filter: "blur(6px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: .3, ease: "expo.out", stagger: .04 }, 0);
letrasBate("#s1-b", W.anuncio - .06, .035);
flash(W.anuncio, .35);
letrasDigita("#s1-c", W.foi, .028);
tl.fromTo("#s1-d", { opacity: 0, scale: .6, filter: "blur(16px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: .3, ease: "back.out(2)" }, W.claude1 - .12);
caixa("#s1-cx", W.claude1);
tl.fromTo("#s1-tl", { opacity: 0, y: 40 }, { opacity: .5, y: 0, duration: .4 }, .1);
tl.fromTo("#s1-cabeca", { x: 0 }, { x: 836, duration: W.s2 - .1, ease: "none" }, 0);
tl.to(["#s1-a", "#s1-b", "#s1-c", "#s1-d"], { scale: 2.6, opacity: 0, filter: "blur(24px)", duration: .3, ease: "power3.in", stagger: .02 }, W.s2 - .3);
tl.to(["#s1-tl", "#s1-tag"], { opacity: 0, duration: .2 }, W.s2 - .25);

// ===== S2: painel =====
mostra("#s2", W.s2 - .05, W.s3);
letrasDigita("#s2-ant", W.s2, .03);
tl.fromTo("#s2-nome", { opacity: 0, y: 60, filter: "blur(16px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: .45, ease: "power3.out" }, W.edicao - .1);
caixa("#s2-cx-ia", W.ia1);
tl.fromTo("#s2-palco", { opacity: 0 }, { opacity: 1, duration: .3 }, W.s2);
tl.fromTo("#s2-note", { rotationX: -58, rotationY: -40, z: -700, y: 260, scale: .96 }, { rotationX: -16, rotationY: -20, z: 0, y: 0, scale: .96, duration: 1.0, ease: "power3.out" }, W.s2);
tl.to("#s2-note", { rotationY: -8, rotationX: -12, duration: W.s3 - W.s2 - 1.4, ease: "sine.inOut" }, W.s2 + 1.0);
tl.to("#s2-t2", { opacity: 1, duration: .25 }, W.grava);
tl.to("#s2-t3", { opacity: 1, duration: .25 }, W.edita);
tl.fromTo("#s2-grava", { x: -1150 }, { x: 0, duration: .38, ease: "expo.out" }, W.voce - .05);
tl.to("#s2-grava", { x: 1150, duration: .3, ease: "expo.in" }, W.e_o - .12);
tl.fromTo("#s2-edita", { x: -1150 }, { x: 0, duration: .38, ease: "expo.out" }, W.e_o + .12);
caixa("#s2-cx-ed", W.edita);
tl.to("#s2-note", { x: -1300, rotationY: 70, duration: .4, ease: "power3.in" }, W.s3 - .32);
tl.to(["#s2-ant", "#s2-nome"], { y: -260, opacity: 0, duration: .32, ease: "power3.in" }, W.s3 - .3);
tl.to("#s2-edita", { x: 1150, duration: .3, ease: "expo.in" }, W.s3 - .3);

// ===== S3/S4: 8 estilos (carrossel 3D) =====
mostra("#s3", W.s3 - .05, W.s5);
letrasDigita("#s3-ja", W.s3, .04);
tl.fromTo("#s3-oito", { scale: 0, rotation: -25, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: .45, ease: "back.out(2.2)" }, W.oito - .08);
flash(W.oito, .25);
letrasDigita("#s3-est", W.estilos - .05, .05);
const fones = [...$$(".item")];
const slot = (d) => { const a = Math.abs(d), s = Math.sign(d);
  if (a === 0) return { x: 0, z: 0, rotationY: 0, opacity: 1, scale: 1 };
  if (a === 1) return { x: s * 380, z: -320, rotationY: -s * 40, opacity: .7, scale: 1 };
  if (a === 2) return { x: s * 640, z: -700, rotationY: -s * 52, opacity: .3, scale: 1 };
  return { x: s * 820, z: -1000, rotationY: -s * 60, opacity: 0, scale: 1 }; };
fones.forEach((f, i) => tl.fromTo(f, { x: (i - 0) * 380, y: 900, z: -400, rotationY: -40, opacity: 0 }, Object.assign({ y: 0, duration: .7, ease: "power3.out", delay: 0 }, slot(i)), CAR[0].t - .75 + i * .05));
CAR.forEach((p, k) => {
  if (k === 0) return;
  if (p.item === CAR[k - 1].item) { tl.fromTo(fones[p.item], { scale: 1 }, { scale: 1.07, duration: .18, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, p.t); return; }
  fones.forEach((f, i) => tl.to(f, Object.assign({ duration: .42, ease: "power3.inOut" }, slot(i - p.item)), p.t - .12));
});
const chips = [...$$("#s3-chip .pilula")];
chips.forEach((c, k) => { tl.fromTo(c, { y: 70 }, { y: 0, duration: .26, ease: "power3.out" }, CAR[k].t - .06);
  if (k + 1 < chips.length) tl.to(c, { y: -70, duration: .22, ease: "power3.in" }, CAR[k + 1].t - .1); });
tl.to(fones, { y: -1100, opacity: 0, duration: .4, ease: "power3.in", stagger: .03 }, W.s5 - .4);
tl.to(["#s3-ja", "#s3-oito", "#s3-est", "#s3-chip"], { y: -300, opacity: 0, duration: .35, ease: "power3.in" }, W.s5 - .38);

// ===== S5: aula + passo a passo =====
mostra("#s5", W.s5 - .05, W.s6);
letrasDigita("#s5-ant", W.s5, .035);
tl.fromTo("#s5-aula", { opacity: 0, scale: .5, filter: "blur(14px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: .32, ease: "back.out(2)" }, W.aula - .14);
caixa("#s5-cx", W.aula);
palavrasBlur("#s5-pap", W.passo - .08, .1);
tl.fromTo("#s5-fila", { x: 560, rotationY: -22, rotationX: 8 }, { x: -1240, rotationY: -22, rotationX: 8, duration: W.s6 - W.s5 + .2, ease: "none" }, W.s5);
$$("#s5-fila .capa").forEach((c, i) => tl.fromTo(c, { y: 160, opacity: 0, rotationX: -30 }, { y: 0, opacity: 1, rotationX: 0, duration: .45, ease: "back.out(1.6)" }, W.s5 + .05 + i * .1));
tl.to("#s5-fila", { opacity: 0, duration: .25 }, W.s6 - .2);
tl.to(["#s5-ant", "#s5-aula", "#s5-pap"], { x: -1100, duration: .3, ease: "expo.in" }, W.s6 - .3);

// ===== S6/S7: 3 bônus =====
mostra("#s6", W.s6 - .05, W.s8);
tl.fromTo("#s6-mais", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: .4, ease: "back.out(2.4)" }, W.tres - .05);
letrasDigita("#s6-bonus", W.bonus - .05, .05);
flash(W.tres, .25);
const BC = { centro: { x: 0, z: 0, rotationY: 0, scale: 1, opacity: 1 }, esq: { x: -330, z: -260, rotationY: 28, scale: .86, opacity: .85 }, dir: { x: 330, z: -260, rotationY: -28, scale: .86, opacity: .85 } };
tl.fromTo("#b1", { x: 0, z: -900, rotationY: -50, y: 120, opacity: 0, scale: 1 }, Object.assign({ y: 0, duration: .55, ease: "back.out(1.4)" }, BC.centro), W.instalacao - .1);
tl.to("#b1", Object.assign({ duration: .45, ease: "power3.inOut" }, BC.esq), W.b54 - .2);
tl.fromTo("#b2", { x: 0, z: -900, rotationY: 50, y: 120, opacity: 0, scale: 1 }, Object.assign({ y: 0, duration: .55, ease: "back.out(1.4)" }, BC.centro), W.b54 - .1);
tl.fromTo("#s7-selo", { scale: 0, opacity: 0, rotation: -30 }, { scale: 1, opacity: 1, rotation: -7, duration: .35, ease: "back.out(2.5)" }, W.temas);
tl.to("#s7-selo", { scale: 0, opacity: 0, duration: .2 }, W.como - .25);
tl.to("#b2", Object.assign({ duration: .45, ease: "power3.inOut" }, BC.dir), W.como - .2);
tl.fromTo("#b3", { x: 0, z: -900, rotationY: -50, y: 120, opacity: 0, scale: 1 }, Object.assign({ y: 0, duration: .55, ease: "back.out(1.4)" }, BC.centro), W.como - .1);
tl.to(["#b1", "#b2", "#b3"], { y: 1300, rotationX: 30, opacity: 0, duration: .4, ease: "power3.in", stagger: .04 }, W.s8 - .38);
tl.to(["#s6-mais", "#s6-bonus"], { y: -300, opacity: 0, duration: .32, ease: "power3.in" }, W.s8 - .32);

// ===== S8: atualizações para sempre + preço =====
mostra("#s8", W.s8 - .05, W.s9);
tl.fromTo("#s8-atu", { x: 1150 }, { x: 0, duration: .38, ease: "expo.out" }, W.s8);
tl.fromTo("#s8-sempre", { x: -1150 }, { x: 0, duration: .38, ease: "expo.out" }, W.sempre - .25);
tl.fromTo("#s8-infp", { strokeDasharray: 1400, strokeDashoffset: 1400 }, { strokeDashoffset: 0, duration: .9, ease: "power2.inOut" }, W.s8 + .15);
tl.to(["#s8-atu", "#s8-sempre"], { x: -1150, duration: .32, ease: "expo.in" }, W.por - .28);
tl.to("#s8-inf", { scale: .2, opacity: 0, duration: .3, ease: "power3.in" }, W.por - .28);
tl.fromTo("#s8-palco", { opacity: 0 }, { opacity: 1, duration: .25 }, W.por - .1);
tl.fromTo("#s8-note", { rotationX: -50, rotationY: 40, z: -800, y: 200, scale: .95 }, { rotationX: -14, rotationY: 18, z: -120, y: 0, scale: .95, duration: .8, ease: "power3.out" }, W.por - .1);
tl.to("#s8-note", { rotationY: 10, duration: W.s9 - W.por - .7, ease: "sine.inOut" }, W.por + .7);
tl.fromTo("#s8-card", { y: 500, opacity: 0, rotationX: 40 }, { y: 0, opacity: 1, rotationX: 0, duration: .45, ease: "power3.out" }, W.por - .05);
letrasDigita("#s8-por", W.por, .05);
tl.fromTo("#s8-rs", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: .25 }, W.r37 - .2);
tl.fromTo("#s8-37", { opacity: 0, scale: 2.4, filter: "blur(20px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: .38, ease: "back.out(1.8)" }, W.r37);
flash(W.r37 + .05, .4);
tl.fromTo("#s8-unico", { opacity: 0, scale: .4, rotation: 12 }, { opacity: 1, scale: 1, rotation: 4, duration: .35, ease: "back.out(2.4)" }, W.pagamento - .05);

// ===== S9: garantia =====
mostra("#s9", W.s9 - .05, W.s10);
tl.to("#s8-palco", { opacity: 0, duration: .25 }, W.s9 - .25);
tl.to("#s8-card", { y: -700, scale: .5, opacity: 0, duration: .32, ease: "power3.in" }, W.s9 - .3);
tl.fromTo("#s9-escudo", { scale: 2.6, rotation: -16, opacity: 0 }, { scale: 1, rotation: -4, opacity: 1, duration: .3, ease: "power4.in" }, W.sete - .3);
tl.fromTo("#stage", { x: 0, y: 0 }, { keyframes: [{ x: 14, y: 8, duration: .04 }, { x: -12, y: -6, duration: .04 }, { x: 8, y: 4, duration: .04 }, { x: 0, y: 0, duration: .05 }], immediateRender: false }, W.sete);
flash(W.sete, .35);
letrasDigita("#s9-txt", W.dias, .04);
tl.to(["#s9-escudo", "#s9-txt"], { y: -900, opacity: 0, duration: .32, ease: "power3.in" }, W.s10 - .3);

// ===== S10: o que você precisa =====
mostra("#s10", W.s10 - .05, W.s11);
letrasDigita("#s10-tit", W.s10, .03);
tl.fromTo("#s10-r1", { x: -1150 }, { x: 0, duration: .45, ease: "expo.out" }, W.mac - .15);
tl.fromTo("#s10-r2", { x: 1150 }, { x: 0, duration: .45, ease: "expo.out" }, W.claude3 - .15);
tl.fromTo("#s10-sub", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .3 }, W.pago - .05);
tl.to(["#s10-tit", "#s10-r1", "#s10-r2"], { y: 900, opacity: 0, duration: .32, ease: "power3.in", stagger: .03 }, W.s11 - .3);

// ===== S11: chamada final =====
mostra("#s11", W.s11 - .05);
sobe("#s11-marca", W.s11, .4);
letrasDigita("#s11-toque", W.s11 + .02, .05);
tl.fromTo("#s11-bt", { scale: .4, opacity: 0 }, { scale: 1, opacity: 1, duration: .45, ease: "back.out(2.2)" }, W.saiba - .2);
tl.fromTo("#s11-mao", { x: 260, y: 360, opacity: 0, rotation: 12 }, { x: 0, y: 0, opacity: 1, rotation: 0, duration: .45, ease: "power3.out" }, W.saiba + .05);
tl.to("#s11-mao", { scale: .86, duration: .1, yoyo: true, repeat: 1, ease: "power2.out" }, W.mais + .2);
tl.to("#s11-bt", { scale: .93, duration: .1, yoyo: true, repeat: 1, ease: "power2.out" }, W.mais + .2);
tl.fromTo("#s11-onda", { scale: 1, opacity: .9 }, { scale: 1.35, opacity: 0, duration: .6, ease: "power2.out", immediateRender: false }, W.mais + .25);
tl.fromTo("#s11-seta", { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: .3 }, W.mais + .5);
tl.to("#s11-seta", { y: 26, duration: .35, yoyo: true, repeat: 3, ease: "sine.inOut" }, W.mais + .8);

// ===== legenda animada =====
$$(".lg").forEach((g, i) => { const [a, b] = LEG[i];
  tl.set(g, { opacity: 1 }, a); tl.set(g, { opacity: 0 }, b);
  g.querySelectorAll(".pal").forEach((p, j) => tl.fromTo(p, { y: 26, opacity: 0, scale: .82 }, { y: 0, opacity: 1, scale: 1, duration: .16, ease: "back.out(2)" }, a + j * Math.min(.13, (b - a) / 4))); });

tl.set({}, {}, DUR);
window.__timelines["main"] = tl;
</script>
</body></html>
