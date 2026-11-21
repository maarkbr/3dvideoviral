/*
  Objetos 2D no mesmo estilo dos personagens (contorno preto grosso, sombra de um lado).
  relogio, geladeira, cama, porta, exclamacao, balao

  REGRA DO PROJETO: o objeto entra na palavra falada, nunca antes.
  Toda entrada passa por Objetos.naPalavra(), que começa a animação no início da
  palavra e recusa qualquer adiantamento.

  Uso:
    const fala = [{ texto: 'Meia-noite', inicio: 0.6, fim: 1.1 }, ...];
    const rel = Objetos.criar(pai, 'relogio', { id: 'rel' });
    Objetos.naPalavra(tl, rel, Objetos.palavra(fala, 'meia-noite'));
    Objetos.acao(tl, porta, 'abrir', Objetos.palavra(fala, 'aberta'));

  Escala: 586 unidades = 1 metro (igual aos personagens). obj.alturaM diz o tamanho real.
*/
(function (global) {
  'use strict';
  const T = 10, L = '#17121D', U = 586;
  const FONTE = "'Baloo 2', system-ui, sans-serif";

  const ret = (x, y, w, h, rx, extra) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ${extra}/>`;
  const contorno = `stroke="${L}" stroke-width="${T}" stroke-linejoin="round"`;

  // ------------------------------------------------------------------ desenhos
  const DESENHOS = {
    relogio: {
      tipo: 'ar', caixa: [-240, -240, 480, 480],
      svg(cl) {
        let marcas = '';
        for (let i = 0; i < 12; i++) {
          const a = (i * 30) * Math.PI / 180, grande = i % 3 === 0;
          const r1 = grande ? 136 : 150, r2 = 166;
          marcas += `<line x1="${(Math.sin(a) * r1).toFixed(1)}" y1="${(-Math.cos(a) * r1).toFixed(1)}" x2="${(Math.sin(a) * r2).toFixed(1)}" y2="${(-Math.cos(a) * r2).toFixed(1)}" stroke="${L}" stroke-width="${grande ? 10 : 6}" stroke-linecap="round"/>`;
        }
        const num = (t, x, y) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="56" fill="${L}">${t}</text>`;
        return `<defs><clipPath id="${cl('aro')}"><circle r="224"/></clipPath><clipPath id="${cl('mostr')}"><circle r="176"/></clipPath></defs>` +
          `<circle r="224" fill="#FF5A4E"/>` +
          `<g clip-path="url(#${cl('aro')})"><rect x="-240" y="-240" width="480" height="480" fill="#D93A3E"/><circle cx="-26" cy="-26" r="224" fill="#FF5A4E"/></g>` +
          `<circle r="224" fill="none" ${contorno}/>` +
          `<circle r="176" fill="#FFFDF6"/>` +
          `<g clip-path="url(#${cl('mostr')})"><rect x="-200" y="-200" width="400" height="400" fill="#E6E1F2"/><circle cx="-18" cy="-18" r="176" fill="#FFFDF6"/></g>` +
          `<circle r="176" fill="none" stroke="${L}" stroke-width="8"/>` +
          marcas + num('12', 0, -86) + num('3', 112, 20) + num('6', 0, 126) + num('9', -112, 20) +
          `<g style="transform: rotate(calc(var(--ph, 0) * 1deg))"><line x1="0" y1="18" x2="0" y2="-88" stroke="${L}" stroke-width="20" stroke-linecap="round"/></g>` +
          `<g style="transform: rotate(calc(var(--pm, 0) * 1deg))"><line x1="0" y1="22" x2="0" y2="-138" stroke="${L}" stroke-width="13" stroke-linecap="round"/></g>` +
          `<g style="transform: rotate(calc(var(--ps, 0) * 1deg))"><line x1="0" y1="30" x2="0" y2="-148" stroke="#FF4B4B" stroke-width="5" stroke-linecap="round"/></g>` +
          `<circle r="17" fill="${L}"/><circle r="6" fill="#FFD93D"/>` +
          `<path d="M -134 -58 A 146 146 0 0 1 -58 -134" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round" opacity=".9"/>`;
      },
    },

    geladeira: {
      tipo: 'chao', caixa: [-250, -1070, 500, 1070],
      svg(cl) {
        const corpo = 'M -176 -1050 L 176 -1050 Q 232 -1050 232 -994 L 232 -86 Q 232 -30 176 -30 L -176 -30 Q -232 -30 -232 -86 L -232 -994 Q -232 -1050 -176 -1050 Z';
        return `<defs><clipPath id="${cl('corpo')}"><path d="${corpo}"/></clipPath></defs>` +
          ret(-196, -44, 64, 44, 10, `fill="${L}"`) + ret(132, -44, 64, 44, 10, `fill="${L}"`) +
          `<path d="${corpo}" fill="#EEF6FF"/>` +
          `<g clip-path="url(#${cl('corpo')})">` +
            `<rect x="150" y="-1060" width="100" height="1040" fill="#C3D6EA"/>` +
            `<rect x="-240" y="-704" width="480" height="22" fill="#C3D6EA"/>` +
          `</g>` +
          `<path d="${corpo}" fill="none" ${contorno}/>` +
          `<line x1="-232" y1="-704" x2="232" y2="-704" stroke="${L}" stroke-width="${T}"/>` +
          ret(-200, -940, 30, 176, 15, `fill="#A5AEC4" stroke="${L}" stroke-width="8"`) +
          ret(-200, -650, 30, 240, 15, `fill="#A5AEC4" stroke="${L}" stroke-width="8"`) +
          `<line x1="-120" y1="-1006" x2="-120" y2="-760" stroke="#fff" stroke-width="14" stroke-linecap="round"/>` +
          `<line x1="-120" y1="-656" x2="-120" y2="-120" stroke="#fff" stroke-width="14" stroke-linecap="round"/>` +
          // ímãs e bilhete
          `<path d="M 40 -548 C 40 -578 76 -584 80 -556 C 84 -584 120 -578 120 -548 C 120 -520 80 -500 80 -494 C 80 -500 40 -520 40 -548 Z" fill="#FF4B4B" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>` +
          `<path d="M 150 -470 L 160 -446 L 186 -444 L 166 -428 L 172 -402 L 150 -416 L 128 -402 L 134 -428 L 114 -444 L 140 -446 Z" fill="#FFD93D" stroke="${L}" stroke-width="6" stroke-linejoin="round"/>` +
          `<g transform="rotate(6 60 -330)">${ret(0, -400, 130, 150, 6, `fill="#FFF7D6" stroke="${L}" stroke-width="7"`)}` +
            `<line x1="20" y1="-360" x2="108" y2="-360" stroke="#9AA3C2" stroke-width="7" stroke-linecap="round"/>` +
            `<line x1="20" y1="-330" x2="96" y2="-330" stroke="#9AA3C2" stroke-width="7" stroke-linecap="round"/>` +
            `<line x1="20" y1="-300" x2="104" y2="-300" stroke="#9AA3C2" stroke-width="7" stroke-linecap="round"/>` +
            `<circle cx="65" cy="-392" r="12" fill="#4FA3FF" stroke="${L}" stroke-width="5"/></g>` +
          `<circle cx="-40" cy="-860" r="26" fill="#4FD1A1" stroke="${L}" stroke-width="7"/>`;
      },
    },

    cama: {
      tipo: 'chao', caixa: [-620, -660, 1240, 660],
      svg(cl) {
        const madeira = '#B8743E', madeiraS = '#93582B';
        const cobertor = 'M -236 -314 Q -150 -336 -60 -318 Q 120 -300 300 -320 Q 430 -334 520 -316 Q 540 -312 540 -290 L 540 -152 Q 420 -126 300 -150 Q 160 -176 20 -150 Q -120 -126 -236 -152 Z';
        return `<defs><clipPath id="${cl('cob')}"><path d="${cobertor}"/></clipPath><clipPath id="${cl('base')}">${ret(-500, -196, 1000, 150, 18, '')}</clipPath></defs>` +
          ret(-560, -60, 56, 60, 10, `fill="#6B3F22" stroke="${L}" stroke-width="8"`) + ret(504, -60, 56, 60, 10, `fill="#6B3F22" stroke="${L}" stroke-width="8"`) +
          // cabeceira e pé da cama
          `<path d="M -606 -40 L -606 -560 Q -606 -646 -540 -646 Q -474 -646 -474 -560 L -474 -40 Z" fill="${madeira}" ${contorno}/>` +
          `<path d="M -572 -90 L -572 -540 Q -572 -600 -540 -600 Q -508 -600 -508 -540 L -508 -90 Z" fill="none" stroke="${madeiraS}" stroke-width="9"/>` +
          ret(476, -380, 108, 340, 34, `fill="${madeira}" ${contorno}`) +
          `<line x1="530" y1="-340" x2="530" y2="-80" stroke="${madeiraS}" stroke-width="9" stroke-linecap="round"/>` +
          // estrado
          ret(-500, -196, 1000, 150, 18, `fill="${madeira}"`) +
          `<g clip-path="url(#${cl('base')})"><rect x="-520" y="-100" width="1040" height="80" fill="${madeiraS}"/></g>` +
          ret(-500, -196, 1000, 150, 18, `fill="none" ${contorno}`) +
          // colchão
          ret(-492, -306, 1000, 124, 44, `fill="#F7F4FF" ${contorno}`) +
          // travesseiro
          `<g transform="rotate(-7 -360 -340)">${ret(-480, -392, 230, 104, 48, `fill="#FFFFFF" ${contorno}`)}` +
            `<path d="M -440 -340 Q -364 -356 -290 -340" fill="none" stroke="#C9CDEA" stroke-width="8" stroke-linecap="round"/></g>` +
          // cobertor
          `<path d="${cobertor}" fill="#5B7CFA"/>` +
          `<g clip-path="url(#${cl('cob')})">` +
            `<path d="M -260 -200 Q -120 -176 20 -200 Q 160 -226 300 -200 Q 420 -176 560 -204 L 560 -100 L -260 -100 Z" fill="#3F5BD6"/>` +
            [[-120, -270], [80, -250], [270, -275], [430, -240], [-40, -205], [190, -200], [360, -200]].map(([x, y]) =>
              `<path d="M ${x} ${y - 16} L ${x + 5} ${y - 5} L ${x + 16} ${y - 4} L ${x + 8} ${y + 4} L ${x + 10} ${y + 15} L ${x} ${y + 9} L ${x - 10} ${y + 15} L ${x - 8} ${y + 4} L ${x - 16} ${y - 4} L ${x - 5} ${y - 5} Z" fill="#FFD93D"/>`).join('') +
          `</g>` +
          `<path d="${cobertor}" fill="none" ${contorno}/>` +
          ret(-256, -330, 64, 186, 24, `fill="#E6ECFF" ${contorno}`);
      },
    },

    porta: {
      tipo: 'chao', caixa: [-340, -1280, 680, 1280],
      svg(cl) {
        const folha = 'M -250 -1214 L 250 -1214 L 250 0 L -250 0 Z';
        let paineis = '';
        for (const [x, y, h] of [[-206, -1160, 470], [26, -1160, 470], [-206, -630, 540], [26, -630, 540]]) {
          paineis += ret(x, y, 180, h, 18, `fill="none" stroke="#8C4E27" stroke-width="10"`) +
            `<line x1="${x + 14}" y1="${y + 14}" x2="${x + 14}" y2="${y + h - 14}" stroke="#E2A16A" stroke-width="6" stroke-linecap="round"/>`;
        }
        return `<defs><clipPath id="${cl('folha')}"><path d="${folha}"/></clipPath>` +
            `<linearGradient id="${cl('luz')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#160E2A"/><stop offset="1" stop-color="#4A2A3E"/></linearGradient></defs>` +
          ret(-300, -1262, 600, 1262, 16, `fill="#6A4128" ${contorno}`) +
          ret(-252, -1216, 504, 1216, 4, `fill="url(#${cl('luz')})"`) +
          // olhinhos no escuro (só aparecem com a porta aberta)
          `<g style="opacity: var(--olhos, 0)"><ellipse cx="40" cy="-760" rx="22" ry="14" fill="#FFE66B"/><ellipse cx="110" cy="-760" rx="22" ry="14" fill="#FFE66B"/>` +
            `<ellipse cx="44" cy="-760" rx="7" ry="10" fill="${L}"/><ellipse cx="114" cy="-760" rx="7" ry="10" fill="${L}"/></g>` +
          `<g style="transform: translateX(-250px) skewY(calc(var(--abre, 0) * -9deg)) scaleX(calc(1 - var(--abre, 0) * 0.74)) translateX(250px)">` +
            `<path d="${folha}" fill="#C47E45"/>` +
            `<g clip-path="url(#${cl('folha')})"><rect x="168" y="-1230" width="100" height="1240" fill="#A2622F"/></g>` +
            paineis +
            `<path d="${folha}" fill="none" ${contorno}/>` +
            `<circle cx="196" cy="-600" r="27" fill="#FFC83D" stroke="${L}" stroke-width="8"/>` +
            `<circle cx="188" cy="-608" r="8" fill="#FFF3B0"/>` +
            `<path d="M 196 -540 L 196 -514" stroke="${L}" stroke-width="10" stroke-linecap="round"/>` +
          `</g>` +
          ret(-326, -26, 652, 26, 8, `fill="#4A2E1C" stroke="${L}" stroke-width="8"`);
      },
    },

    exclamacao: {
      tipo: 'ar', caixa: [-230, -230, 460, 460],
      svg(cl) {
        let estrela = '';
        const n = 14;
        for (let i = 0; i < n * 2; i++) {
          const a = (i / (n * 2)) * Math.PI * 2, r = i % 2 ? 150 : 206;
          estrela += `${i ? 'L' : 'M'} ${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)} `;
        }
        const barra = 'M -44 -168 Q 0 -192 44 -168 L 26 58 Q 0 74 -26 58 Z';
        return `<defs><clipPath id="${cl('barra')}"><path d="${barra}"/></clipPath></defs>` +
          `<g style="transform: rotate(calc(var(--giro, 0) * 1deg))"><path d="${estrela}Z" fill="#FFD93D" ${contorno}/></g>` +
          `<path d="${barra}" fill="#FF4B4B"/>` +
          `<g clip-path="url(#${cl('barra')})"><rect x="10" y="-200" width="60" height="300" fill="#D7303E"/></g>` +
          `<path d="${barra}" fill="none" ${contorno}/>` +
          `<line x1="-20" y1="-150" x2="-12" y2="20" stroke="#fff" stroke-width="11" stroke-linecap="round" opacity=".85"/>` +
          `<circle cy="128" r="40" fill="#FF4B4B" ${contorno}/>` +
          `<circle cx="-12" cy="116" r="10" fill="#fff" opacity=".85"/>`;
      },
    },
  };

  // balão de fala: o tamanho depende do texto; a ponta (rabinho) fica na origem
  function desenhoBalao(texto, lado) {
    const fs = 78, palavras = texto.split(' ');
    const largTexto = texto.length * fs * 0.5;
    const w = Math.max(360, largTexto + 130), h = 200, cauda = 110, r = 70;
    const x0 = lado === 'dir' ? -110 : 110 - w, x1 = x0 + w, y1 = -cauda, y0 = y1 - h;
    const bA = lado === 'dir' ? 110 : -14, bB = lado === 'dir' ? 14 : -110;
    const d = `M ${x0 + r} ${y0} H ${x1 - r} Q ${x1} ${y0} ${x1} ${y0 + r} V ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} H ${bA} L 0 0 L ${bB} ${y1} H ${x0 + r} Q ${x0} ${y1} ${x0} ${y1 - r} V ${y0 + r} Q ${x0} ${y0} ${x0 + r} ${y0} Z`;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + fs * 0.34;
    return {
      tipo: 'ar', caixa: [x0 - 30, y0 - 30, w + 60, h + cauda + 60],
      svg(cl) {
        const spans = palavras.map((p, i) => `<tspan class="pal" data-i="${i}">${p}${i < palavras.length - 1 ? ' ' : ''}</tspan>`).join('');
        return `<defs><clipPath id="${cl('bal')}"><path d="${d}"/></clipPath></defs>` +
          `<path d="${d}" fill="#FFFFFF"/>` +
          `<g clip-path="url(#${cl('bal')})"><ellipse cx="${cx + 40}" cy="${y1 + 20}" rx="${w * 0.6}" ry="70" fill="#E2E7F6"/></g>` +
          `<path d="${d}" fill="none" ${contorno}/>` +
          `<path d="M ${x0 + 46} ${y0 + 58} Q ${x0 + 52} ${y0 + 30} ${x0 + 84} ${y0 + 26}" fill="none" stroke="#E2E7F6" stroke-width="12" stroke-linecap="round"/>` +
          `<text x="${cx}" y="${cy}" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="${fs}" fill="${L}">${spans}</text>`;
      },
    };
  }

  // cartão de opção (A / B) para a pergunta do final; origem no centro
  function desenhoOpcao(letra, texto, cor) {
    const fs = 64, w = Math.max(420, texto.length * fs * 0.52 + 210), h = 150, r = 40;
    const x0 = -w / 2, y0 = -h / 2;
    return {
      tipo: 'ar', caixa: [x0 - 30, y0 - 30, w + 60, h + 70],
      svg(cl) {
        return ret(x0, y0 + 14, w, h, r, `fill="${L}"`) +
          ret(x0, y0, w, h, r, `fill="#FFFFFF" ${contorno}`) +
          `<circle cx="${x0 + 82}" cy="0" r="50" fill="${cor}" ${contorno}/>` +
          `<text x="${x0 + 82}" y="24" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="70" fill="${L}">${letra}</text>` +
          `<text x="${x0 + 150}" y="22" font-family="${FONTE}" font-weight="800" font-size="${fs}" fill="${L}">${texto}</text>`;
      },
    };
  }

  // ------------------------------------------------------------------ criar
  let estiloPronto = false;
  function criar(pai, nome, opts = {}) {
    if (!estiloPronto) {
      const s = document.createElement('style');
      s.textContent = '.obj{position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0;pointer-events:none}' +
        '.obj-in{position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0}' +
        '.obj svg{position:absolute;overflow:visible}.obj svg g{transform-box:view-box;transform-origin:0 0}';
      document.head.appendChild(s);
      estiloPronto = true;
    }
    const id = opts.id || nome;
    const def = nome === 'balao' ? desenhoBalao(opts.texto || 'Oi!', opts.lado || 'esq')
      : nome === 'opcao' ? desenhoOpcao(opts.letra || 'A', opts.texto || '', opts.cor || '#FFD93D')
      : DESENHOS[nome];
    if (!def) throw new Error('Objeto desconhecido: ' + nome);
    const cl = (n) => `${id}-${n}`;
    const [bx, by, bw, bh] = def.caixa;
    const el = document.createElement('div');
    el.className = 'obj'; el.id = id;
    const dentro = document.createElement('div');
    dentro.className = 'obj-in';
    dentro.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bx} ${by} ${bw} ${bh}" width="${bw}" height="${bh}" style="left:${bx}px;top:${by}px">${def.svg(cl)}</svg>`;
    el.appendChild(dentro);
    pai.appendChild(el);
    dentro.style.opacity = 0;
    const alturaLocal = def.tipo === 'chao' ? -by : bh;
    return { nome, id, el, dentro, svg: dentro.firstChild, tipo: def.tipo, alturaM: alturaLocal / U, U, entrada: null, opts };
  }

  // ------------------------------------------------------------------ fala
  const normal = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9-]/g, '');
  function palavra(fala, texto, aPartirDe = 0) {
    const alvo = normal(texto);
    const p = fala.find((w) => w.inicio >= aPartirDe && normal(w.texto) === alvo);
    if (!p) throw new Error(`A palavra "${texto}" não está na fala.`);
    return p;
  }

  // ------------------------------------------------------------------ REGRA: entra na palavra
  function naPalavra(tl, obj, pal, op = {}) {
    if (!pal || typeof pal.inicio !== 'number') throw new Error('naPalavra precisa da palavra falada (com o tempo de início).');
    const atraso = op.atraso || 0;
    if (atraso < 0) throw new Error(`Regra do projeto: "${obj.nome}" não pode entrar antes da palavra "${pal.texto}".`);
    const t = pal.inicio + atraso;
    obj.entrada = t;
    gsap.set(obj.dentro, { opacity: 0, transformOrigin: '0px 0px' });
    tl.set(obj.dentro, { opacity: 0 }, 0);
    tl.fromTo(obj.dentro, { opacity: 1, scale: 0, rotation: obj.tipo === 'chao' ? 0 : -14, y: obj.tipo === 'chao' ? 0 : 20 },
      { scale: 1, rotation: 0, y: 0, duration: 0.5, ease: 'back.out(2.4)', immediateRender: false }, t);
    const s = obj.svg;
    if (obj.nome === 'relogio') {
      // a hora em que os ponteiros param: opts.hora ('21:55'); sem ela, meia-noite (o exemplo)
      const [hh, mm] = String((obj.opts && obj.opts.hora) || '0:00').split(':').map(Number);
      const fh = ((hh % 12) * 30 + (mm || 0) * 0.5) % 360 - (hh % 12 || mm ? 360 : 0), fm = (mm || 0) * 6 - (mm ? 360 : 0);
      gsap.set(s, { '--ph': fh - 300, '--pm': fm - 1080, '--ps': 0 });
      tl.fromTo(s, { '--ph': fh - 300, '--pm': fm - 1080 }, { '--ph': fh, '--pm': fm, duration: 1.0, ease: 'power3.out', immediateRender: false }, t);
      tl.fromTo(s, { '--ps': 0 }, { '--ps': 360, duration: 6, ease: 'none', immediateRender: false }, t + 0.4);
    }
    if (obj.nome === 'geladeira' || obj.nome === 'cama' || obj.nome === 'porta') {
      tl.fromTo(obj.dentro, { scaleY: 1 }, { scaleY: 0.9, scaleX: 1.06, duration: 0.09, ease: 'power2.out', yoyo: true, repeat: 1, immediateRender: false }, t + 0.5);
    }
    if (obj.nome === 'exclamacao') {
      tl.fromTo(obj.dentro, { rotation: 0 }, { rotation: 9, duration: 0.11, ease: 'sine.inOut', yoyo: true, repeat: 9, immediateRender: false }, t + 0.5);
      tl.fromTo(s, { '--giro': 0 }, { '--giro': 90, duration: 4, ease: 'none', immediateRender: false }, t);
    }
    if (obj.nome === 'balao') {
      // cada palavra do balão aparece na sua própria palavra falada
      // com op.umaAUma, cada palavra do texto aparece na sua palavra falada
      if (op.umaAUma && op.palavras) {
        const spans = Array.from(s.querySelectorAll('.pal'));
        spans.forEach((sp, i) => {
          sp.style.opacity = 0;
          const p = op.palavras[i] || pal;
          if (p.inicio < pal.inicio) throw new Error('Regra do projeto: texto do balão antes da fala.');
          tl.set(sp, { opacity: 1 }, p.inicio);
        });
        tl.set(spans, { opacity: 0 }, 0);
      }
      tl.fromTo(obj.dentro, { y: 0 }, { y: -10, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: 3, immediateRender: false }, t + 0.5);
    }
    return t;
  }

  // ações depois da entrada (também presas a uma palavra)
  function acao(tl, obj, nome, pal) {
    if (obj.entrada == null) throw new Error('O objeto precisa entrar antes de fazer uma ação.');
    const t = Math.max(pal.inicio, obj.entrada);
    if (nome === 'abrir' && obj.nome === 'porta') {
      gsap.set(obj.svg, { '--abre': 0, '--olhos': 0 });
      tl.fromTo(obj.svg, { '--abre': 0 }, { '--abre': 1, duration: 0.6, ease: 'back.out(1.6)', immediateRender: false }, t);
      tl.fromTo(obj.svg, { '--olhos': 0 }, { '--olhos': 1, duration: 0.08, ease: 'none', immediateRender: false }, t + 0.35);
      tl.to(obj.svg, { '--olhos': 0, duration: 0.06, yoyo: true, repeat: 1 }, t + 0.62);
    }
    return t;
  }

  function sair(tl, obj, t) {
    if (obj.entrada != null && t < obj.entrada) throw new Error('O objeto não pode sair antes de entrar.');
    obj.saida = t;
    tl.to(obj.dentro, { scale: 0, rotation: 10, duration: 0.3, ease: 'back.in(2)' }, t);
    tl.set(obj.dentro, { opacity: 0 }, t + 0.3);
  }

  global.Objetos = { criar, naPalavra, acao, sair, palavra, U };
})(window);
