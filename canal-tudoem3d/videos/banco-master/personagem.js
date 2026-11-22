/*
  Personagens 2D de desenho animado — rig em SVG.
  Cada junta (ombro, cotovelo, quadril, joelho, cabeça...) lê uma variável CSS
  do contêiner (.pj). O GSAP anima só essas variáveis, então uma pose é
  só uma lista de números. Todos os personagens usam o mesmo esqueleto,
  então todas as poses funcionam em todos.

  Uso:
    const p = Personagem.criar(elementoPai, { id: 'heroi', x: 540, y: 1290, escala: 1.12, visual: 'menino' });
    Personagem.pose(timeline, p, 'acenando', inicio, duracao);

  Visuais: menino, seguranca
  Poses:   parado, acenando, apontando, pensando, assustado, comemorando, correndo
*/
(function (global) {
  'use strict';

  const T = 10; // espessura do contorno preto
  const L = '#17121D';

  // ---------- peças básicas ----------
  const linha = (x1, y1, x2, y2, w, cor) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${cor}" stroke-width="${w}" stroke-linecap="round"/>`;
  const rot = (v) => `style="transform: rotate(calc(var(--${v}) * 1deg))"`;
  const tuboC = (len, w) => linha(0, 0, 0, len, w + 2 * T, L);
  const tuboP = (len, w, cor, corS) => {
    const ws = w * 0.42, ox = w / 2 - ws / 2 - 1;
    return linha(0, 0, 0, len, w, cor) + linha(ox, 0, ox, len, ws, corS);
  };
  const tubos = (lista, cor, extra = 0) => lista.map((f) => linha(f[0], f[1], f[2], f[3], f[4] + extra, cor)).join('');
  const espelha = (svg) => `<g transform="scale(-1,1)">${svg}</g>`;

  // contorno suave a partir de pontos [x, y, pontudo]
  function contorno(pts) {
    const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const m0 = mid(pts[n - 1], pts[0]);
    let d = `M ${m0[0]} ${m0[1]} `;
    for (let i = 0; i < n; i++) {
      const p = pts[i], m = mid(p, pts[(i + 1) % n]);
      d += p[2] ? `L ${p[0]} ${p[1]} L ${m[0]} ${m[1]} ` : `Q ${p[0]} ${p[1]} ${m[0]} ${m[1]} `;
    }
    return d + 'Z';
  }

  // ---------- formas comuns ----------
  const CABECA = 'M 0 -170 C 106 -170 184 -100 184 -4 C 184 96 110 166 0 166 C -110 166 -184 96 -184 -4 C -184 -100 -106 -170 0 -170 Z';
  const NARIZ = 'M -4 32 C -18 40 -14 58 4 56 C 16 55 20 46 14 40';

  // bocas (mesma estrutura para o GSAP transformar uma na outra)
  const BOCAS = {
    sorriso:     { d: 'M -40 -6 C -20 12 20 12 40 -6 C 26 24 -26 24 -40 -6 Z', dente: -40, lingua: 34 },
    risada:      { d: 'M -58 -14 C -25 -4 25 -4 58 -14 C 50 64 -50 64 -58 -14 Z', dente: 4, lingua: 44 },
    grito:       { d: 'M -42 0 C -38 -48 38 -48 42 0 C 44 78 -44 78 -42 0 Z', dente: -22, lingua: 60 },
    hum:         { d: 'M -14 6 C 0 0 16 -4 32 -10 C 24 6 4 12 -14 6 Z', dente: -40, lingua: 40 },
    determinado: { d: 'M -44 -8 C -16 -14 16 -14 44 -8 C 38 34 -38 34 -44 -8 Z', dente: 4, lingua: 44 },
    confiante:   { d: 'M -40 -4 C -16 12 18 8 46 -14 C 34 24 -16 28 -40 -4 Z', dente: -40, lingua: 30 },
  };

  // ---------- mãos (desenhadas para o lado direito da tela; a esquerda é espelhada) ----------
  function maos(C) {
    const pele = C.pele, M = {};
    { // aberta
      const d = [[-4, 40, -26, 80, 18], [0, 42, 0, 92, 18], [4, 40, 26, 80, 18], [10, 30, 42, 20, 17]];
      M.o = `<circle cx="0" cy="34" r="${26 + T}" fill="${L}"/>` + tubos(d, L, 2 * T) +
            `<circle cx="0" cy="34" r="26" fill="${pele}"/>` + tubos(d, pele) +
            `<path d="M -8 22 Q 0 18 8 22" fill="none" stroke="${C.peleS}" stroke-width="5" stroke-linecap="round"/>`;
    }
    { // punho fechado
      M.f = `<rect x="-31" y="6" width="62" height="60" rx="28" fill="${pele}" stroke="${L}" stroke-width="${T}"/>` +
            `<path d="M 14 14 C 26 26 28 42 22 56" fill="none" stroke="${C.peleS}" stroke-width="8" stroke-linecap="round"/>` +
            linha(-11, 48, -11, 62, 5, L) + linha(7, 50, 7, 63, 5, L) +
            linha(22, 22, -4, 36, 15 + 2 * T - 4, L) + linha(22, 22, -4, 36, 15, pele);
    }
    { // apontando
      const ind = [9, 40, 9, 102, 17];
      M.p = linha(ind[0], ind[1], ind[2], ind[3], ind[4] + 2 * T, L) +
            `<rect x="-28" y="6" width="56" height="54" rx="25" fill="${pele}" stroke="${L}" stroke-width="${T}"/>` +
            linha(ind[0], ind[1], ind[2], ind[3], ind[4], pele) +
            linha(-9, 40, -9, 56, 5, L) +
            linha(24, 18, 30, 42, 15 + 2 * T - 4, L) + linha(24, 18, 30, 42, 15, pele);
    }
    { // relaxada
      const d = [[0, 34, 0, 62, 42], [14, 24, 30, 44, 16]];
      M.r = `<circle cx="0" cy="30" r="${25 + T}" fill="${L}"/>` + tubos(d, L, 2 * T) +
            `<circle cx="0" cy="30" r="25" fill="${pele}"/>` + tubos(d, pele) +
            linha(-5, 56, -5, 74, 5, L) +
            `<path d="M 12 40 C 18 52 18 64 12 74" fill="none" stroke="${C.peleS}" stroke-width="7" stroke-linecap="round"/>`;
    }
    return M;
  }

  // ---------- lanterna (presa no punho; gira com --lanA, feixe com --feixe) ----------
  function lanterna(cl) {
    const metal = '#3B4252', metalL = '#76819B';
    return `<g transform="translate(0,36)"><g style="transform: rotate(calc(var(--lanA) * 1deg))">` +
      `<g style="opacity: var(--feixe)">` +
        `<path d="M -18 74 L 18 74 L 170 600 L -170 600 Z" fill="url(#${cl('feixe')})"/>` +
        `<circle cx="0" cy="78" r="58" fill="url(#${cl('brilho')})"/>` +
      `</g>` +
      `<rect x="-11" y="-62" width="22" height="12" rx="4" fill="#232833" stroke="${L}" stroke-width="7"/>` +
      `<rect x="-15" y="-54" width="30" height="96" rx="10" fill="${metal}" stroke="${L}" stroke-width="8"/>` +
      `<rect x="-8" y="-46" width="7" height="80" rx="3.5" fill="${metalL}"/>` +
      `<path d="M -16 40 L 16 40 L 28 70 L -28 70 Z" fill="${metal}" stroke="${L}" stroke-width="8" stroke-linejoin="round"/>` +
      `<path d="M -9 46 L -3 46 L -8 64 L -18 64 Z" fill="${metalL}"/>` +
      `<rect x="-30" y="66" width="60" height="12" rx="5" fill="#FFF3A6" stroke="${L}" stroke-width="7"/>` +
    `</g></g>`;
  }

  // ---------- membros ----------
  const BR = { sup: 84, ant: 76, wS: 48, wA: 44 };
  function braco(lado, V, M, cl) {
    const C = V.C;
    const sx = lado === 'E' ? -98 : 98, sy = -166;
    const a = 'arm' + lado, c = 'elbow' + lado, m = 'hand' + lado;
    const esp = (s) => (lado === 'E' ? espelha(s) : s);
    const prop = V.lanterna === lado ? esp(lanterna(cl)) : '';
    const variantes = ['o', 'f', 'p', 'r'].map((t) => `<g style="opacity: var(--h${lado}${t})">${esp(M[t])}</g>`).join('');
    const punho = `<rect x="-27" y="${BR.ant - 14}" width="54" height="22" rx="11" fill="${C.punho || C.blusaS}" stroke="${L}" stroke-width="7"/>`;
    const cont = `<g ${rot(a)}>${tuboC(BR.sup, BR.wS)}<g transform="translate(0,${BR.sup})"><g ${rot(c)}>${tuboC(BR.ant, BR.wA)}</g></g></g>`;
    const preench =
      `<g ${rot(a)}>${tuboP(BR.sup, BR.wS, C.blusa, C.blusaS)}` +
        `<g transform="translate(0,${BR.sup})"><g ${rot(c)}>${tuboP(BR.ant, BR.wA, C.blusa, C.blusaS)}` +
          `<g transform="translate(0,${BR.ant})"><g ${rot(m)}>${prop}${variantes}</g></g>${punho}` +
        `</g></g>` +
      `</g>`;
    return `<g transform="translate(${sx},${sy})">${cont}${preench}</g>`;
  }

  const PE = { coxa: 98, canela: 90, wC: 60, wN: 56 };
  function perna(lado, V) {
    const C = V.C;
    const hx = lado === 'E' ? -46 : 46;
    const a = 'leg' + lado, k = 'knee' + lado, f = 'foot' + lado;
    const esp = lado === 'E' ? 'style="transform: scale(var(--peE), 1)"' : '';
    const c = `<g ${rot(a)}>${tuboC(PE.coxa, PE.wC)}<g transform="translate(0,${PE.coxa})"><g ${rot(k)}>${tuboC(PE.canela, PE.wN)}</g></g></g>`;
    const p =
      `<g ${rot(a)}>${tuboP(PE.coxa, PE.wC, C.calca, C.calcaS)}` +
        `<g transform="translate(0,${PE.coxa})"><g ${rot(k)}>${tuboP(PE.canela, PE.wN, C.calca, C.calcaS)}` +
          `<g transform="translate(0,${PE.canela})"><g ${rot(f)}><g ${esp}>${V.calcado(C)}</g></g></g>` +
        `</g></g>` +
      `</g>`;
    return `<g transform="translate(${hx},0)">${c}${p}</g>`;
  }

  // ---------- rosto ----------
  function olho(x, cl, C) {
    return `<g transform="translate(${x},-2)"><g style="transform: scale(var(--eyeS))">` +
      `<g style="opacity: calc(1 - var(--happy))">` +
        `<g clip-path="url(#${cl('olho')})">` +
          `<ellipse rx="46" ry="56" fill="#fff"/>` +
          `<g style="transform: translate(calc(var(--px) * 1px), calc(var(--py) * 1px)) scale(var(--pup))">` +
            `<circle r="27" fill="${L}"/><circle cx="-9" cy="-10" r="10" fill="#fff"/><circle cx="9" cy="10" r="4.5" fill="#fff"/>` +
          `</g>` +
          `<g style="transform: translateY(calc((var(--lid) + (64 - var(--lid)) * var(--blink)) * 1px))">` +
            `<rect x="-60" y="-150" width="120" height="150" fill="${C.pele}"/>` +
            `<line x1="-60" y1="0" x2="60" y2="0" stroke="${L}" stroke-width="9"/>` +
          `</g>` +
        `</g>` +
        `<ellipse rx="46" ry="56" fill="none" stroke="${L}" stroke-width="${T}"/>` +
      `</g>` +
      `<path d="M -30 12 Q 0 -26 30 12" fill="none" stroke="${L}" stroke-width="12" stroke-linecap="round" style="opacity: var(--happy)"/>` +
    `</g></g>`;
  }
  function sobrancelha(x, lado, V) {
    const w = V.sobrancelha || 16;
    const forma = `<path d="M -30 8 Q -2 -14 30 2" fill="none" stroke="${V.C.sobrancelha || L}" stroke-width="${w}" stroke-linecap="round"/>`;
    return `<g transform="translate(${x},-86)"><g style="transform: translateY(calc(var(--b${lado}y) * 1px)) rotate(calc(var(--b${lado}a) * 1deg))">` +
      (lado === 'E' ? forma : espelha(forma)) + `</g></g>`;
  }
  function orelha(lado, C) {
    const x = lado === 'E' ? -178 : 178;
    const o = `<circle r="32" fill="${C.pele}" stroke="${L}" stroke-width="${T}"/>` +
      `<path d="M 4 -14 C 18 -8 18 10 4 14" fill="none" stroke="${C.peleS}" stroke-width="7" stroke-linecap="round"/>`;
    return `<g transform="translate(${x},16)">${lado === 'E' ? espelha(o) : o}</g>`;
  }
  function boca(cl, C) {
    return `<g transform="translate(0,98)"><g style="transform: scale(var(--ms))">` +
      `<g clip-path="url(#${cl('boca')})">` +
        `<rect x="-80" y="-80" width="160" height="180" fill="${C.boca}"/>` +
        `<g style="transform: translateY(calc(var(--lingua) * 1px))"><ellipse rx="32" ry="22" fill="${C.lingua}"/></g>` +
        `<g style="transform: translateY(calc(var(--dente) * 1px))"><rect x="-80" y="-60" width="160" height="60" fill="#fff"/></g>` +
      `</g>` +
      `<path id="${cl('bocaP')}" class="boca" d="${BOCAS.sorriso.d}" fill="none" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>` +
    `</g></g>`;
  }

  // =====================================================================
  //  VISUAL 1 — MENINO (moletom laranja, cabelo espetado, tênis)
  // =====================================================================
  const MOLETOM = 'M -80 -206 C -38 -224 38 -224 80 -206 C 106 -194 118 -130 122 -40 L 124 8 C 125 30 112 40 94 40 L -94 40 C -112 40 -125 30 -124 8 L -122 -40 C -118 -130 -106 -194 -80 -206 Z';
  const CAPUZ = 'M -124 -192 C -114 -234 -62 -252 0 -252 C 62 -252 114 -234 124 -192 C 106 -170 62 -160 0 -160 C -62 -160 -106 -170 -124 -192 Z';
  const RAIO = 'M 10 -42 L -24 6 L -3 6 L -12 44 L 24 -8 L 3 -8 Z';
  const CABELO = contorno([
    [-176, 4, 0], [-198, -86, 0], [-184, -148, 0], [-226, -178, 1], [-150, -200, 0], [-166, -258, 1],
    [-88, -238, 0], [-66, -300, 1], [-6, -250, 0], [50, -292, 1], [90, -234, 0], [156, -254, 1],
    [152, -192, 0], [218, -168, 1], [192, -112, 0], [198, -40, 0], [178, 4, 0], [166, -62, 0],
    [132, -132, 0], [102, -100, 1], [66, -144, 0], [26, -104, 1], [-16, -146, 0], [-56, -106, 1],
    [-96, -142, 0], [-132, -104, 1], [-162, -130, 0], [-170, -60, 0],
  ]);

  const MENINO = {
    C: {
      pele: '#FFCBA3', peleS: '#EFA174', bochecha: '#FF8A8A',
      cabelo: '#57331F', cabeloS: '#371D10', cabeloL: '#8F5B39',
      blusa: '#FF7A1C', blusaS: '#DF5209',
      raio: '#FFD93D', raioS: '#F4B400',
      calca: '#3A5BDB', calcaS: '#283FA8',
      tenis: '#FFFFFF', tenisS: '#D9DFEA', sola: '#CCD4E2',
      boca: '#5A1326', lingua: '#FF6F82',
    },
    defs: (cl) =>
      `<clipPath id="${cl('tronco')}"><path d="${MOLETOM}"/></clipPath>` +
      `<clipPath id="${cl('capuz')}"><path d="${CAPUZ}"/></clipPath>` +
      `<clipPath id="${cl('cabelo')}"><path d="${CABELO}"/></clipPath>`,
    calcado: (C) =>
      `<path d="M -36 24 C -38 -2 -22 -20 0 -20 C 22 -20 38 -6 50 8 C 55 14 57 20 57 24 Z" fill="${C.tenis}" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
      `<path d="M 20 -12 C 36 -2 50 10 54 22 L 28 22 Z" fill="${C.tenisS}"/>` +
      `<path d="M -8 -2 C 8 8 26 12 46 14" fill="none" stroke="${C.blusa}" stroke-width="9" stroke-linecap="round"/>` +
      `<path d="M -40 24 L 58 24 C 60 34 52 42 40 42 L -28 42 C -38 42 -42 34 -40 24 Z" fill="${C.sola}" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>`,
    tronco: (C, cl) =>
      `<path d="${MOLETOM}" fill="${C.blusa}"/>` +
      `<g clip-path="url(#${cl('tronco')})">` +
        `<path d="M 54 -240 C 76 -150 68 -60 76 60 L 160 60 L 160 -240 Z" fill="${C.blusaS}"/>` +
        `<rect x="-140" y="8" width="280" height="40" fill="${C.blusaS}"/>` +
        `<line x1="-140" y1="8" x2="140" y2="8" stroke="${L}" stroke-width="6"/>` +
      `</g>` +
      `<path d="${MOLETOM}" fill="none" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
      `<path d="M -62 -46 L 62 -46 C 74 -46 82 -18 86 6 L -86 6 C -82 -18 -74 -46 -62 -46 Z" fill="none" stroke="${L}" stroke-width="6" stroke-linejoin="round"/>` +
      `<line x1="-56" y1="-36" x2="56" y2="-36" stroke="${C.blusaS}" stroke-width="6" stroke-linecap="round"/>` +
      `<g transform="translate(-6,-118)"><path d="${RAIO}" fill="${C.raio}" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>` +
        `<path d="M 3 -8 L 24 -8 L -12 44 Z" fill="${C.raioS}" opacity=".55"/></g>` +
      `<path d="${CAPUZ}" fill="${C.blusa}"/>` +
      `<g clip-path="url(#${cl('capuz')})">` +
        `<path d="M 70 -270 C 96 -220 96 -190 80 -150 L 160 -150 L 160 -270 Z" fill="${C.blusaS}"/>` +
        `<ellipse cx="0" cy="-184" rx="104" ry="30" fill="${C.blusaS}"/>` +
      `</g>` +
      `<path d="${CAPUZ}" fill="none" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
      linha(-30, -176, -36, -112, 8 + 12, L) + linha(30, -176, 38, -110, 8 + 12, L) +
      linha(-30, -176, -36, -112, 8, '#fff') + linha(30, -176, 38, -110, 8, '#fff'),
    // cabelo: escala para cima com --hair (susto)
    antesRosto: (C, cl) =>
      `<g transform="translate(0,-130)"><g style="transform: scale(1, var(--hair))"><g transform="translate(0,130)">` +
        `<path d="${CABELO}" fill="${C.cabelo}"/>` +
        `<g clip-path="url(#${cl('cabelo')})">` +
          `<path d="M 46 -330 C 116 -250 156 -170 150 -60 L 280 -60 L 280 -330 Z" fill="${C.cabeloS}"/>` +
          `<path d="M -150 -170 Q -122 -208 -80 -218" fill="none" stroke="${C.cabeloL}" stroke-width="11" stroke-linecap="round"/>` +
          `<path d="M -60 -228 Q -44 -254 -30 -262" fill="none" stroke="${C.cabeloL}" stroke-width="9" stroke-linecap="round"/>` +
          `<path d="M -176 -110 Q -174 -130 -164 -146" fill="none" stroke="${C.cabeloL}" stroke-width="9" stroke-linecap="round"/>` +
        `</g>` +
        `<path d="${CABELO}" fill="none" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
      `</g></g></g>`,
    nariz: (C) => `<path d="${NARIZ}" fill="${C.peleS}" stroke="${L}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
    depoisBoca: () => '',
    depoisRosto: () => '',
    neutro: {},
    ajustes: {},
  };

  // =====================================================================
  //  VISUAL 2 — SEGURANÇA DE SHOPPING (boné, bigode, uniforme azul-marinho, lanterna)
  // =====================================================================
  const CAMISA = 'M -84 -206 C -40 -224 40 -224 84 -206 C 112 -192 126 -124 130 -44 C 134 0 128 30 106 40 L -106 40 C -128 30 -134 0 -130 -44 C -126 -124 -112 -192 -84 -206 Z';
  const COPA = 'M -192 -118 C -196 -200 -112 -240 0 -240 C 112 -240 196 -200 192 -118 C 120 -134 -120 -134 -192 -118 Z';
  const ABA = 'M -204 -124 C -120 -146 120 -146 204 -124 C 218 -114 214 -98 194 -94 C 120 -108 -120 -108 -194 -94 C -214 -98 -218 -114 -204 -124 Z';
  const BIGODE = 'M 0 64 C 16 55 44 55 60 67 C 75 78 78 94 68 101 C 57 92 42 88 28 90 C 16 92 6 88 0 82 C -6 88 -16 92 -28 90 C -42 88 -57 92 -68 101 C -78 94 -75 78 -60 67 C -44 55 -16 55 0 64 Z';
  const COSTELETA = 'M -190 -112 C -196 -72 -190 -32 -178 -6 C -168 -32 -162 -76 -160 -110 Z';
  const DISTINTIVO = 'M 0 -28 L 24 -19 C 24 5 15 19 0 28 C -15 19 -24 5 -24 -19 Z';

  const SEGURANCA = {
    C: {
      pele: '#D29467', peleS: '#B0714A', bochecha: '#E3735F',
      cabelo: '#3A2416', cabeloL: '#6E4A32', sobrancelha: '#2A190F',
      blusa: '#28386E', blusaS: '#1B2652', blusaL: '#3B5196', punho: '#1B2652',
      calca: '#2C3040', calcaS: '#1D202B',
      bone: '#202E5E', boneS: '#151F45', aba: '#18224A',
      ouro: '#FFC83D', ouroS: '#E09A12', botao: '#DDE3F0',
      sapato: '#2A2A33', sapatoS: '#16161C', sola: '#101015',
      boca: '#5A1326', lingua: '#FF6F82',
    },
    lanterna: 'D', // a lanterna fica na mão do lado direito da tela
    sobrancelha: 21,
    defs: (cl) =>
      `<clipPath id="${cl('tronco')}"><path d="${CAMISA}"/></clipPath>` +
      `<clipPath id="${cl('copa')}"><path d="${COPA}"/></clipPath>`,
    calcado: (C) =>
      `<path d="M -36 24 C -38 -2 -22 -18 0 -18 C 24 -18 40 -4 52 10 C 56 15 58 20 58 24 Z" fill="${C.sapato}" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
      `<path d="M 22 -10 C 38 0 52 12 55 22 L 30 22 Z" fill="${C.sapatoS}"/>` +
      `<path d="M -14 -6 Q 4 -14 20 -8" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".75"/>` +
      `<path d="M -40 24 L 59 24 C 61 33 54 40 42 40 L -28 40 C -38 40 -42 33 -40 24 Z" fill="${C.sola}" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>`,
    tronco: (C, cl) => {
      const gola = 'M -6 -188 L -72 -216 L -56 -158 Z';
      return `<path d="${CAMISA}" fill="${C.blusa}"/>` +
        `<g clip-path="url(#${cl('tronco')})">` +
          `<path d="M 58 -240 C 82 -150 76 -60 84 60 L 170 60 L 170 -240 Z" fill="${C.blusaS}"/>` +
          `<rect x="-150" y="2" width="300" height="40" fill="#1B1B24"/>` +
          `<line x1="-150" y1="2" x2="150" y2="2" stroke="${L}" stroke-width="6"/>` +
        `</g>` +
        `<path d="${CAMISA}" fill="none" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
        // fileira de botões
        linha(0, -194, 0, 0, 7, C.blusaS) +
        [-152, -104, -56].map((y) => `<circle cx="0" cy="${y}" r="7" fill="${C.botao}" stroke="${L}" stroke-width="4"/>`).join('') +
        // bolso com tampa
        `<rect x="-98" y="-146" width="62" height="58" rx="9" fill="none" stroke="${L}" stroke-width="6"/>` +
        `<path d="M -101 -148 L -33 -148 L -35 -126 Q -67 -114 -99 -126 Z" fill="${C.blusa}" stroke="${L}" stroke-width="6" stroke-linejoin="round"/>` +
        `<circle cx="-67" cy="-124" r="5" fill="${C.botao}" stroke="${L}" stroke-width="3"/>` +
        // distintivo dourado
        `<g transform="translate(68,-120)"><path d="${DISTINTIVO}" fill="${C.ouro}" stroke="${L}" stroke-width="6" stroke-linejoin="round"/>` +
          `<path d="M 0 -28 L 24 -19 C 24 5 15 19 0 28 Z" fill="${C.ouroS}" opacity=".6"/>` +
          `<path d="M 0 -12 L 4 -3 L 13 -3 L 6 3 L 9 12 L 0 7 L -9 12 L -6 3 L -13 -3 L -4 -3 Z" fill="#fff" opacity=".85"/></g>` +
        // fivela do cinto
        `<rect x="-24" y="4" width="48" height="34" rx="7" fill="${C.ouro}" stroke="${L}" stroke-width="6"/>` +
        `<rect x="-11" y="13" width="22" height="16" rx="3" fill="#1B1B24"/>` +
        // gola
        `<path d="${gola}" fill="${C.blusaL}" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>` +
        espelha(`<path d="${gola}" fill="${C.blusaL}" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>`);
    },
    // cabeça careca (aparece quando o boné pula no susto) + costeletas + sombra da aba
    antesRosto: (C, cl) =>
      `<ellipse cx="-78" cy="-132" rx="34" ry="14" transform="rotate(-24 -78 -132)" fill="#fff" opacity=".45"/>` +
      `<g clip-path="url(#${cl('cabeca')})" style="opacity: calc(0.75 - (var(--hair) - 1) * 3.4)">` +
        `<path d="M -210 -112 C -120 -130 120 -130 210 -112 L 210 -80 C 120 -98 -120 -98 -210 -80 Z" fill="${C.peleS}"/>` +
      `</g>` +
      `<path d="${COSTELETA}" fill="${C.cabelo}" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>` +
      espelha(`<path d="${COSTELETA}" fill="${C.cabelo}" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>`),
    nariz: (C) =>
      `<g transform="translate(4,44) scale(1.35) translate(-4,-44)"><path d="${NARIZ}" fill="${C.peleS}" stroke="${L}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></g>`,
    depoisBoca: (C) =>
      `<path d="${BIGODE}" fill="${C.cabelo}" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>` +
      `<path d="M -50 72 Q -32 63 -12 68" fill="none" stroke="${C.cabeloL}" stroke-width="6" stroke-linecap="round"/>` +
      `<path d="M 14 68 Q 32 63 48 70" fill="none" stroke="${C.cabeloL}" stroke-width="6" stroke-linecap="round"/>`,
    // boné por cima do rosto (as sobrancelhas somem embaixo da aba quando sobem); pula com --hair
    depoisRosto: (C, cl) =>
      `<g style="transform: translateY(calc((var(--hair) - 1) * -190px)) rotate(calc((var(--hair) - 1) * -45deg))">` +
        `<path d="${COPA}" fill="${C.bone}"/>` +
        `<g clip-path="url(#${cl('copa')})">` +
          `<path d="M 64 -270 C 124 -210 154 -170 152 -110 L 260 -110 L 260 -270 Z" fill="${C.boneS}"/>` +
          `<path d="M 0 -238 C -34 -204 -54 -164 -62 -124" fill="none" stroke="${C.boneS}" stroke-width="6"/>` +
          `<path d="M 0 -238 C 34 -204 54 -164 62 -124" fill="none" stroke="${C.boneS}" stroke-width="6"/>` +
        `</g>` +
        `<path d="${COPA}" fill="none" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
        `<circle cx="0" cy="-240" r="11" fill="${C.bone}" stroke="${L}" stroke-width="7"/>` +
        `<text x="0" y="-150" text-anchor="middle" font-family="'Baloo 2', system-ui, sans-serif" font-weight="800" font-size="38" letter-spacing="1" ` +
          `fill="${C.ouro}" stroke="${L}" stroke-width="8" stroke-linejoin="round" paint-order="stroke fill">SEGURANÇA</text>` +
        `<path d="${ABA}" fill="${C.aba}" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
        `<path d="M -178 -128 C -100 -144 100 -144 178 -128" fill="none" stroke="${C.blusaL}" stroke-width="5" stroke-linecap="round"/>` +
      `</g>`,
    // jeitão sério: pálpebra um pouco baixa e sobrancelha franzida
    neutro: { lid: -50, bEa: 5, bDa: -5, lanA: -70 },
    // ajustes de pose (a lanterna aponta para fora do corpo; acende em algumas)
    ajustes: {
      parado: { feixe: 1, lanA: -66 },
      acenando: { lanA: 70 },
      apontando: { lanA: 0, feixe: 1, lid: -40 },
      pensando: { lanA: 70, lid: -46 },
      assustado: { lanA: 70, feixe: 1, lid: -64, bEa: -16, bDa: 16 },
      comemorando: { lanA: 70, bEa: 0, bDa: 0 },
      correndo: { lanA: 70 },
    },
    extras: {
      parado: (q) => q.osc({ lanA: -40 }, 0.9),
      assustado: (q) => q.osc({ feixe: 0.15 }, 0.09),
    },
  };

  const VISUAIS = { menino: MENINO, seguranca: SEGURANCA };

  // ---------- montagem ----------
  function svgPersonagem(id, V) {
    const cl = (n) => `${id}-${n}`;
    const C = V.C, M = maos(C);
    const cabeca =
      orelha('E', C) + orelha('D', C) +
      `<path d="${CABECA}" fill="${C.pele}"/>` +
      `<g clip-path="url(#${cl('cabeca')})">` +
        `<path d="M 84 -210 C 140 -110 146 70 72 210 L 280 210 L 280 -210 Z" fill="${C.peleS}"/>` +
      `</g>` +
      `<path d="${CABECA}" fill="none" stroke="${L}" stroke-width="${T}"/>` +
      V.antesRosto(C, cl) +
      `<g style="transform: translate(calc(var(--fx) * 1px), calc(var(--fy) * 1px))">` +
        `<ellipse cx="-112" cy="52" rx="27" ry="16" fill="${C.bochecha}" opacity=".55"/>` +
        `<ellipse cx="112" cy="52" rx="27" ry="16" fill="${C.bochecha}" opacity=".55"/>` +
        olho(-64, cl, C) + olho(64, cl, C) +
        sobrancelha(-66, 'E', V) + sobrancelha(66, 'D', V) +
        V.nariz(C) +
        boca(cl, C) +
        V.depoisBoca(C, cl) +
      `</g>` +
      V.depoisRosto(C, cl);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 1080" width="100%" height="100%" overflow="visible">` +
      `<defs>` +
        `<clipPath id="${cl('cabeca')}"><path d="${CABECA}"/></clipPath>` +
        `<clipPath id="${cl('olho')}"><ellipse rx="46" ry="56"/></clipPath>` +
        `<clipPath id="${cl('boca')}"><use href="#${cl('bocaP')}"/></clipPath>` +
        `<linearGradient id="${cl('feixe')}" gradientUnits="userSpaceOnUse" x1="0" y1="74" x2="0" y2="600">` +
          `<stop offset="0" stop-color="#FFF6B8" stop-opacity=".9"/><stop offset="1" stop-color="#FFF6B8" stop-opacity="0"/></linearGradient>` +
        `<radialGradient id="${cl('brilho')}"><stop offset="0" stop-color="#fff" stop-opacity="1"/>` +
          `<stop offset=".35" stop-color="#FFF6B8" stop-opacity=".8"/><stop offset="1" stop-color="#FFF6B8" stop-opacity="0"/></radialGradient>` +
        V.defs(cl) +
      `</defs>` +
      `<g transform="translate(380,760)">` +
        `<g transform="translate(0,234)"><g style="transform: scale(calc(1 + var(--by) / 420))">` +
          `<ellipse rx="150" ry="22" fill="rgba(20,12,40,.20)"/></g></g>` +
        `<g style="transform: translate(calc((var(--bx) + var(--shake)) * 1px), calc(var(--by) * 1px))">` +
          `<g transform="translate(0,230)"><g style="transform: scale(calc(2 - var(--sq)), var(--sq))"><g transform="translate(0,-230)">` +
            perna('E', V) + perna('D', V) +
            `<g style="transform: rotate(calc(var(--lean) * 1deg)) scale(1, var(--breath))">` +
              V.tronco(C, cl) +
              `<g transform="translate(0,-348)"><g style="transform: rotate(calc(var(--head) * 1deg)) translateY(calc(var(--hy) * 1px))">` +
                cabeca +
              `</g></g>` +
              braco('E', V, M, cl) + braco('D', V, M, cl) +
            `</g>` +
          `</g></g></g>` +
        `</g>` +
      `</g>` +
    `</svg>`;
  }

  // ---------- rig ----------
  const NEUTRO = {
    bx: 0, by: 0, sq: 1, shake: 0, lean: 0, breath: 1,
    head: 0, hy: 0, hair: 1,
    fx: 0, fy: 0, px: 0, py: 3, pup: 1, eyeS: 1, lid: -64, blink: 0, happy: 0, ms: 1,
    bEy: 0, bEa: 0, bDy: 0, bDa: 0,
    armE: 9, elbowE: -10, handE: 0, armD: -9, elbowD: 10, handD: 0,
    hEo: 0, hEf: 0, hEp: 0, hEr: 1, hDo: 0, hDf: 0, hDp: 0, hDr: 1,
    legE: 2, kneeE: 0, footE: 0, legD: -2, kneeD: 0, footD: 0, peE: -1,
    lanA: -70, feixe: 0,
  };
  const DISCRETAS = new Set(['hEo', 'hEf', 'hEp', 'hEr', 'hDo', 'hDf', 'hDp', 'hDr', 'peE']);
  const vars = (o) => { const r = {}; for (const k in o) r['--' + k] = o[k]; return r; };

  let estiloPronto = false;
  function criar(pai, opts) {
    if (!estiloPronto) {
      const s = document.createElement('style');
      s.textContent = '.pj{position:absolute;pointer-events:none}.pj svg{display:block;overflow:visible}' +
        '.pj svg g{transform-box:view-box;transform-origin:0 0}';
      document.head.appendChild(s);
      estiloPronto = true;
    }
    const V = VISUAIS[opts.visual || 'menino'];
    const e = opts.escala || 1, w = 760 * e, h = 1080 * e;
    const el = document.createElement('div');
    el.className = 'pj';
    el.id = opts.id;
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.left = (opts.x - 380 * e) + 'px';
    el.style.top = (opts.y - 760 * e) + 'px';
    el.innerHTML = svgPersonagem(opts.id, V);
    pai.appendChild(el);
    const ini = vars(Object.assign({}, NEUTRO, V.neutro));
    ini['--dente'] = BOCAS.sorriso.dente;
    ini['--lingua'] = BOCAS.sorriso.lingua;
    if (V.lanterna) { for (const t of ['o', 'f', 'p', 'r']) ini['--h' + V.lanterna + t] = t === 'f' ? 1 : 0; }
    for (const k in ini) el.style.setProperty(k, ini[k]);
    return { el, boca: el.querySelector('.boca'), escala: e, x: opts.x, y: opts.y, V };
  }

  function mudaBoca(tl, pj, nome, t, d = 0.18) {
    const b = BOCAS[nome];
    tl.to(pj.boca, { attr: { d: b.d }, duration: d, ease: 'power2.out' }, t);
    tl.to(pj.el, { '--dente': b.dente, '--lingua': b.lingua, duration: d, ease: 'power2.out' }, t);
  }

  // ---------- poses ----------
  const POSES = {
    parado: {
      boca: 'sorriso',
      base: { head: -1.5 },
      loop(q) {
        q.osc({ breath: 1.022, hy: -3 }, 0.75);
        q.osc({ armE: 12, elbowE: -14, armD: -12, elbowD: 14 }, 0.75);
        q.osc({ head: 2 }, 1.1);
        q.em(1.25, { px: -9, py: 1 }, 0.22);
        q.em(2.0, { px: 3, py: 3 }, 0.22);
        q.piscar(0.85);
      },
    },
    acenando: {
      boca: 'risada',
      base: { armD: -136, elbowD: -12, handD: -6, hDo: 1, hDr: 0, head: -5, lean: -2, bEy: -10, bDy: -13, px: 6, py: 0 },
      loop(q) {
        q.osc({ elbowD: 26, handD: 12 }, 0.2);
        q.osc({ lean: 2, head: -2 }, 0.7);
        q.piscar(1.5);
      },
    },
    apontando: {
      boca: 'confiante',
      base: {
        bx: -60, armD: -94, elbowD: -6, handD: -4, hDp: 1, hDr: 0,
        armE: 36, elbowE: -112, handE: -20, hEf: 1, hEr: 0,
        fx: 16, px: 13, py: 0, bDy: -16, bDa: -6, bEa: 4, lid: -36, head: 5, lean: -3,
      },
      loop(q) {
        q.em(0.34, { elbowD: -22, armD: -90 }, 0.1, 'power2.in');
        q.em(0.44, { elbowD: -6, armD: -94 }, 0.3, 'back.out(3)');
        q.em(0.84, { elbowD: -22, armD: -90 }, 0.1, 'power2.in');
        q.em(0.94, { elbowD: -6, armD: -94 }, 0.3, 'back.out(3)');
        q.osc({ breath: 1.02 }, 0.7, 0.9);
        q.piscar(1.7);
      },
    },
    pensando: {
      boca: 'hum',
      base: {
        armD: 18, elbowD: 150, handD: 14, hDf: 1, hDr: 0,
        armE: 4, elbowE: -96, handE: -6, hEr: 1,
        fx: 8, fy: -4, px: 12, py: -15, bEy: 4, bEa: 6, bDy: -16, bDa: 4, lid: -46, head: -6, lean: 2,
      },
      loop(q) {
        q.osc({ handD: 24 }, 0.3);
        q.osc({ head: -3 }, 1.0);
        q.em(1.35, { px: -4, py: -14, fx: 0 }, 0.35);
        q.piscar(0.9);
      },
    },
    assustado: {
      boca: 'grito',
      transicao: 0.16,
      base: {
        armE: 100, elbowE: 70, handE: 6, hEo: 1, hEr: 0,
        armD: -100, elbowD: -70, handD: -6, hDo: 1, hDr: 0,
        legE: 9, kneeE: -12, legD: -9, kneeD: 12,
        eyeS: 1.12, pup: 0.55, px: 0, py: 0, bEy: -20, bEa: -16, bDy: -20, bDa: 16,
        hair: 1.22, lean: -5, by: -26, sq: 1.04, shake: -2, ms: 1.05,
      },
      loop(q) {
        q.osc({ shake: 2 }, 0.035);
        q.osc({ by: -14 }, 0.3);
        q.osc({ handE: 18, handD: -18 }, 0.07);
      },
    },
    comemorando: {
      boca: 'risada',
      base: {
        armE: 124, elbowE: 12, hEf: 1, hEr: 0, armD: -124, elbowD: -12, hDf: 1, hDr: 0,
        happy: 1, bEy: -12, bDy: -12, ms: 1.06,
      },
      loop(q) {
        q.ciclo([
          [0.12, { sq: 0.86, by: 0, armE: 114, elbowE: 26, armD: -114, elbowD: -26 }, 'power2.out'],
          [0.36, { sq: 1.05, by: -84, legE: 20, kneeE: -42, legD: -20, kneeD: 42, armE: 136, elbowE: 0, armD: -136, elbowD: 0 }, 'power2.out'],
          [0.34, { sq: 1, by: 0, legE: 2, kneeE: 0, legD: -2, kneeD: 0, armE: 124, elbowE: 12, armD: -124, elbowD: -12 }, 'power2.in'],
          [0.08, { sq: 0.88 }, 'power2.out'],
          [0.10, { sq: 1 }, 'power2.out'],
        ], 0.62);
        q.osc({ head: 5 }, 0.31, 0, 'sine.inOut', -5);
      },
    },
    correndo: {
      boca: 'determinado',
      base: {
        lean: 12, fx: 26, px: 14, py: 2, lid: -36, bEa: 10, bDa: -10, bEy: 4, bDy: 4, head: 4,
        hEf: 1, hEr: 0, hDf: 1, hDr: 0, peE: 1,
        armE: 40, elbowE: -92, armD: -40, elbowD: -92,
        legE: -50, kneeE: 15, legD: 45, kneeD: 30,
      },
      loop(q) {
        const c = 0.44;
        q.ciclo([[0.5, { legE: 45, kneeE: 30 }], [0.25, { legE: 10, kneeE: 100 }], [0.25, { legE: -50, kneeE: 15 }]], c);
        q.ciclo([[0.25, { legD: 10, kneeD: 100 }], [0.25, { legD: -50, kneeD: 15 }], [0.5, { legD: 45, kneeD: 30 }]], c);
        q.osc({ armE: -40, armD: 40 }, c / 2);
        q.osc({ by: -16 }, c / 4);
        q.piscar(1.6);
      },
    },
  };

  function pose(tl, pj, nome, t0, dur) {
    const P = POSES[nome], V = pj.V, el = pj.el;
    const tt = P.transicao || 0.3;
    const alvo = Object.assign({}, NEUTRO, V.neutro, P.base, V.ajustes[nome]);
    // quem segura a lanterna fica sempre com a mão fechada
    if (V.lanterna) { for (const t of ['o', 'f', 'p', 'r']) alvo['h' + V.lanterna + t] = t === 'f' ? 1 : 0; }
    const cont = {}, disc = {};
    for (const k in alvo) (DISCRETAS.has(k) ? disc : cont)['--' + k] = alvo[k];
    tl.to(el, Object.assign(cont, { duration: tt, ease: 'power3.out' }), t0);
    tl.set(el, disc, t0 + tt * 0.35);
    mudaBoca(tl, pj, P.boca, t0);

    const a = t0 + tt, b = t0 + dur - 0.02;
    const q = {
      // vai e volta entre o valor atual e "props"
      osc(props, meio, atraso = 0, ease = 'sine.inOut', inicio) {
        const ini = a + atraso;
        if (inicio !== undefined) {
          const p0 = {}; for (const k in props) p0[k] = inicio;
          tl.set(el, vars(p0), ini);
        }
        const n = Math.floor((b - ini) / meio);
        if (n < 1) return;
        tl.to(el, Object.assign(vars(props), { duration: meio, ease, repeat: n - 1, yoyo: true }), ini);
      },
      // ciclo de quadros-chave repetido
      ciclo(quadros, periodo, atraso = 0) {
        const ini = a + atraso, n = Math.floor((b - ini) / periodo);
        if (n < 1) return;
        tl.to(el, {
          keyframes: quadros.map(([f, p, ease]) => Object.assign(vars(p), { duration: f * periodo, ease: ease || 'sine.inOut' })),
          repeat: n - 1,
        }, ini);
      },
      em(dt, props, d = 0.2, ease = 'power2.out') {
        tl.to(el, Object.assign(vars(props), { duration: d, ease }), t0 + dt);
      },
      piscar(dt) {
        const t = t0 + dt;
        if (t + 0.17 > b) return;
        tl.to(el, { '--blink': 1, duration: 0.06, ease: 'power1.in' }, t);
        tl.to(el, { '--blink': 0, duration: 0.09, ease: 'power1.out' }, t + 0.07);
      },
    };
    if (P.loop) P.loop(q);
    if (V.extras && V.extras[nome]) V.extras[nome](q);
  }

  global.Personagem = { criar, pose, POSES, NEUTRO, BOCAS, VISUAIS };
})(window);
