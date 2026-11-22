/*
  Montagem do vídeo: junta o cenário 3D, os personagens e objetos 2D, a câmera,
  as poses e a legenda, tudo preso aos tempos das palavras da narração.

  Precisa (nesta ordem): gsap, three + extras, personagem.js, objetos.js, shopping3d.js
  e o arquivo de tempos (audio/palavras.js, que cria window.PALAVRAS).

  Uso:
    const tl = gsap.timeline({ paused: true });
    const M = Montagem.criar({ tl, dur: 43.6, fala: window.PALAVRAS,
      canvas: '#tres', camada2d: '#camada2d', camadaTela: '#camadaTela', legendas: '#legendas' });
    M.camera([[0, [x,y,z], [x,y,z]], ...]);          // chaves da câmera: [tempo, posição, para onde olha]
    const menino = M.ator('menino', 'menino', 1.0, () => [0.3, 0, 0.2]);
    const cama = M.objeto('cama', -0.75, 0, -3.4);   // objeto no mundo 3D
    Objetos.naPalavra(tl, cama, M.W('cama'));        // REGRA: entra na palavra
    M.pose(menino, 'assustado', M.t('trancado'), M.B(2));
    M.legenda();
    M.iniciar();                                      // sempre por último
*/
(function (global) {
  'use strict';
  const suave = (x) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
  const lerp = (a, b, e) => a + (b - a) * e;
  const lerp3 = (a, b, e) => [lerp(a[0], b[0], e), lerp(a[1], b[1], e), lerp(a[2], b[2], e)];
  const normal = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9-]/g, '');

  function criar(op) {
    const $ = (s) => (typeof s === 'string' ? document.querySelector(s) : s);
    const tl = op.tl, DUR = op.dur, FALA = op.fala;
    if (!FALA || !FALA.length) throw new Error('Faltam os tempos das palavras (audio/palavras.js).');

    // ---------- palavras ----------
    const W = (texto, bloco) => {
      const w = FALA.find((p) => (!bloco || p.bloco === bloco) && normal(p.texto) === normal(texto));
      if (!w) throw new Error(`A palavra "${texto}"${bloco ? ' do bloco ' + bloco : ''} não está na fala.`);
      return w;
    };
    const t = (texto, bloco) => W(texto, bloco).inicio;
    const B = (b) => {
      const w = FALA.find((p) => p.bloco === b);
      if (!w) throw new Error('Não existe o bloco ' + b);
      return w.inicio;
    };

    // ---------- cenário ----------
    const cena = (op.cenario || global.Shopping3D).criar($(op.canvas), { largura: 1080, altura: 1920 });
    const U = Objetos.U;
    const ancoras = [];
    const porQuadro = [];
    cena.antes = (tt) => porQuadro.forEach((f) => f(tt));
    const filtro = op.filtro || ((luz) => `url(#noite) brightness(${luz.toFixed(3)}) drop-shadow(-8px 0 0 rgba(255,166,84,.6))`);

    // ---------- câmera: chaves [tempo, [x,y,z] da câmera, [x,y,z] para onde olha] ----------
    function camera(chaves, fov = 50) {
      cena.cam.quadro = (tt) => {
        let i = 0;
        while (i < chaves.length - 2 && tt > chaves[i + 1][0]) i++;
        const [t0, p0, a0] = chaves[i], [t1, p1, a1] = chaves[i + 1];
        const e = suave((tt - t0) / Math.max(0.001, t1 - t0));
        const pos = lerp3(p0, p1, e), alvo = lerp3(a0, a1, e);
        pos[1] += Math.sin(tt * 0.8) * 0.012; pos[0] += Math.sin(tt * 0.53) * 0.02; // respiração da câmera
        return { pos, alvo, fov };
      };
    }

    // ---------- personagens: pés no chão em pos(t) = [x, 0, z] ----------
    function ator(id, visual, escala, pos, opts = {}) {
      const caixa = document.createElement('div');
      caixa.className = 'ator';
      $(op.camada2d).appendChild(caixa);
      const pj = Personagem.criar(caixa, { id, visual, x: 0, y: -230 * escala, escala });
      const p0 = pos(0);
      const sombra = cena.sombra(p0[0], p0[2] + 0.05, 0.46 * escala, 0.2 * escala, 0.7);
      const desde = opts.desde == null ? 0 : opts.desde; // aparece neste tempo (ex.: na palavra que o apresenta)
      if (desde > 0) {
        gsap.set(pj.el, { opacity: 0 });
        tl.set(pj.el, { opacity: 0 }, 0);
        tl.set(pj.el, { opacity: 1 }, desde);
      }
      ancoras.push({ el: caixa, pos, pj, sombra, desde });
      return pj;
    }

    // ---------- objetos ----------
    function objeto(nome, x, y, z, opts = {}) {
      const o = Objetos.criar($(op.camada2d), nome, Object.assign({ id: 'o-' + nome + (opts.letra || opts.id || '') }, opts));
      const sombra = o.tipo === 'chao' ? cena.sombra(x, z + 0.02, opts.sombraL || 0.6, opts.sombraP || 0.32, 0.65) : null;
      ancoras.push({ el: o.el, pos: () => [x, y, z], obj: o, sombra });
      return o;
    }
    function naTela(nome, x, y, escala, opts = {}) { // preso na tela (cartões, placas), não no mundo
      const o = Objetos.criar($(op.camadaTela), nome, Object.assign({ id: 'o-' + nome + (opts.letra || opts.id || '') }, opts));
      o.el.style.transform = `translate(${x}px, ${y}px) scale(${escala})`;
      return o;
    }

    const pose = (pj, nome, t0, t1) => Personagem.pose(tl, pj, nome, t0, t1 - t0);

    // ---------- legenda palavra a palavra ----------
    // frases (até a pontuação) divididas em pedaços parecidos de no máximo `max` palavras
    function legenda(opts = {}) {
      const max = opts.max || 4, pular = opts.pular || (() => false);
      const fala = FALA.filter((p) => !pular(p));
      const grupos = [];
      let frase = [];
      fala.forEach((p, i) => {
        frase.push(p);
        const fimFrase = /[.,…?!:]["”]?$/.test(p.texto);
        const proxBloco = fala[i + 1] && fala[i + 1].bloco !== p.bloco;
        if (fimFrase || proxBloco || i === fala.length - 1) {
          const n = Math.ceil(frase.length / max);
          const base = Math.floor(frase.length / n), extra = frase.length % n;
          let k = 0;
          for (let g = 0; g < n; g++) { const tam = base + (g < extra ? 1 : 0); grupos.push(frase.slice(k, k + tam)); k += tam; }
          frase = [];
        }
      });
      grupos.forEach((g, gi) => {
        const div = document.createElement('div');
        div.className = 'legenda';
        $(op.legendas).appendChild(div);
        const prox = grupos[gi + 1];
        const fim = prox ? Math.min(prox[0].inicio, g[g.length - 1].fim + 0.6) : DUR;
        g.forEach((p, k) => {
          const s = document.createElement('span');
          s.textContent = p.texto.replace(/["“”]/g, '');
          div.appendChild(s);
          gsap.set(s, { opacity: 0, transformOrigin: '50% 80%' });
          const fimPal = g[k + 1] ? g[k + 1].inicio : p.fim;
          tl.fromTo(s, { opacity: 1, scale: 0.6, y: 14, color: opts.corDestaque || '#FFD93D' },
            { scale: 1, y: 0, duration: 0.2, ease: 'back.out(3)', immediateRender: false }, p.inicio);
          tl.to(s, { color: '#FFFFFF', duration: 0.1 }, fimPal);
        });
        tl.set(div, { opacity: 0 }, fim);
      });
    }

    // ---------- desenho de cada quadro ----------
    const f2 = (v) => v.toFixed(2);
    function desenharTudo(tt) {
      for (const a of ancoras) {
        const [x, y, z] = a.pos(tt);
        const p = cena.projetar(x, y, z);
        a.el.style.transform = `translate(${f2(p.x)}px, ${f2(p.y)}px) scale(${(p.ppm / U).toFixed(4)})`;
        a.el.style.zIndex = String(Math.round(5000 - p.dist * 100));
        a.el.style.visibility = p.atras || p.dist > 40 ? 'hidden' : 'visible';
        const luz = Math.max(0.72, 1 - Math.max(0, p.dist - 3.5) * 0.045);
        a.el.style.filter = filtro(luz);
        if (a.sombra) {
          const b = a.sombra.userData.base;
          let k = 1;
          if (a.obj) {
            k = a.obj.entrada == null || tt < a.obj.entrada ? 0 : suave((tt - a.obj.entrada) / 0.35);
            if (a.obj.saida != null && tt > a.obj.saida) k *= 1 - suave((tt - a.obj.saida) / 0.3);
          }
          if (a.pj) {
            const by = parseFloat(a.pj.el.style.getPropertyValue('--by')) || 0;
            k = (1 + by / 420) * (tt < a.desde ? 0 : 1);
          }
          a.sombra.position.x = x;
          a.sombra.position.z = z + (a.pj ? 0.05 : 0.02);
          a.sombra.scale.set(Math.max(0.001, b.rx * 2 * k), Math.max(0.001, b.rz * 2 * k), 1);
          a.sombra.material.opacity = b.opacidade * Math.min(1, k);
        }
      }
      cena.desenhar(tt);
    }

    // ---------- liga tudo ao HyperFrames (sempre por último) ----------
    function iniciar() {
      let fontesOk = false;
      const fontes = document.fonts.load("800 100px 'Baloo 2'").then(() => { cena.fontesProntas(); fontesOk = true; });
      // o HyperFrames avisa cada quadro pedido (render e arraste na linha do tempo)
      global.addEventListener('hf-seek', (e) => {
        const tt = e.detail.time;
        desenharTudo(tt);
        if (!fontesOk) e.detail.waitUntil(fontes.then(() => desenharTudo(tt)));
      });
      // tocando no estúdio: redesenha a cada atualização da linha do tempo
      tl.eventCallback('onUpdate', () => desenharTudo(tl.time()));
      global.__timelines = global.__timelines || {};
      global.__timelines['main'] = tl;
      tl.seek(0);
      desenharTudo(0);
    }

    return {
      tl, DUR, FALA, W, t, B, cena, THREE: cena.THREE, U,
      camera, ator, objeto, naTela, pose, legenda, iniciar,
      aCadaQuadro: (fn) => porQuadro.push(fn),
      suave, lerp,
    };
  }

  global.Montagem = { criar };
})(window);
