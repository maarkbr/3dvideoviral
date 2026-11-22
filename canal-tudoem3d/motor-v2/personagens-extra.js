/*
  Personagens novos do vídeo "Lavagem de dinheiro" — cabeça branca e redonda (estilo do vídeo de referência).
  Registra em Personagem.VISUAIS: narrador, banqueiro, capone, policial.  Pose nova: segredo (dedo na boca).
*/
(function (global) {
  'use strict';
  const P = global.Personagem;
  const T = 10, L = '#17121D', FONTE = "'Baloo 2', system-ui, sans-serif";
  const linha = (x1, y1, x2, y2, w, cor) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${cor}" stroke-width="${w}" stroke-linecap="round"/>`;
  const espelha = (svg) => `<g transform="scale(-1,1)">${svg}</g>`;
  const NARIZ = 'M -4 32 C -18 40 -14 58 4 56 C 16 55 20 46 14 40';
  const PELE = { pele: '#FFFFFF', peleS: '#E4E2EE', bochecha: '#FFB3B3', boca: '#5A1326', lingua: '#FF6F82' };
  const nariz = (C) => `<path d="${NARIZ}" fill="${C.peleS}" stroke="${L}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;

  // tronco padrão (paletó/camisa): o mesmo contorno para todos
  const TRONCO = 'M -84 -206 C -40 -224 40 -224 84 -206 C 112 -192 126 -124 130 -44 C 134 0 128 30 106 40 L -106 40 C -128 30 -134 0 -130 -44 C -126 -124 -112 -192 -84 -206 Z';
  const sombraLado = (cl, cor) => `<g clip-path="url(#${cl('tronco')})"><path d="M 58 -240 C 82 -150 76 -60 84 60 L 170 60 L 170 -240 Z" fill="${cor}" opacity=".9"/></g>`;
  const sapato = (cor, corS) => (C) =>
    `<path d="M -36 24 C -38 -2 -22 -18 0 -18 C 24 -18 40 -4 52 10 C 56 15 58 20 58 24 Z" fill="${cor}" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
    `<path d="M 22 -10 C 38 0 52 12 55 22 L 30 22 Z" fill="${corS}"/>` +
    `<path d="M -14 -6 Q 4 -14 20 -8" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".6"/>` +
    `<path d="M -40 24 L 59 24 C 61 33 54 40 42 40 L -28 40 C -38 40 -42 33 -40 24 Z" fill="#1d1b22" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>`;
  const defsBase = (cl, extra = '') => `<clipPath id="${cl('tronco')}"><path d="${TRONCO}"/></clipPath>` + extra;

  // =====================================================================
  //  NARRADOR — boina listrada azul, colete verde-água, lenço vermelho
  // =====================================================================
  const COPA_N = 'M -190 -92 C -206 -196 -112 -250 4 -250 C 124 -250 214 -198 200 -96 C 120 -124 -110 -124 -190 -92 Z';
  const ABA_N = 'M -120 -108 C -40 -134 120 -136 226 -100 C 240 -90 232 -72 210 -74 C 120 -96 -30 -96 -116 -84 Z';
  const NARRADOR = {
    C: Object.assign({}, PELE, {
      blusa: '#F4F1EA', blusaS: '#D3CCBF', punho: '#D3CCBF',
      colete: '#1FB5A2', coleteS: '#14897A', lenco: '#E8402F', lencoS: '#B82A1E',
      calca: '#6A4A35', calcaS: '#4C3324', cabelo: '#7A4A2A', boina: '#3B5BB5', boinaL: '#F4F6FF',
    }),
    defs: (cl) => defsBase(cl, `<clipPath id="${cl('copa')}"><path d="${COPA_N}"/></clipPath><clipPath id="${cl('colete')}"><path d="M -84 -206 C -112 -192 -126 -124 -130 -44 C -134 0 -128 30 -106 40 L -20 40 L -20 -120 L -46 -206 Z M 84 -206 C 112 -192 126 -124 130 -44 C 134 0 128 30 106 40 L 20 40 L 20 -120 L 46 -206 Z"/></clipPath>`),
    calcado: sapato('#4A2E1E', '#2E1C12'),
    tronco: (C, cl) =>
      `<path d="${TRONCO}" fill="${C.blusa}"/>` +
      `<g clip-path="url(#${cl('colete')})"><path d="${TRONCO}" fill="${C.colete}"/></g>` +
      sombraLado(cl, 'rgba(10,40,40,.28)') +
      `<path d="${TRONCO}" fill="none" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
      `<path d="M -20 40 L -20 -120 L -46 -206 M 20 40 L 20 -120 L 46 -206" fill="none" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>` +
      [-86, -36, 6].map((y) => `<circle cx="-36" cy="${y}" r="7" fill="#FFD23F" stroke="${L}" stroke-width="4"/>`).join('') +
      `<rect x="40" y="-90" width="56" height="10" rx="5" fill="${C.coleteS}"/>` +
      // lenço no pescoço
      `<path d="M -60 -214 C -20 -196 20 -196 60 -214 L 40 -176 C 10 -168 -10 -168 -40 -176 Z" fill="${C.lenco}" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>` +
      `<path d="M -10 -176 L -34 -120 L 4 -138 L 22 -114 L 18 -176 Z" fill="${C.lenco}" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>` +
      `<circle cx="-4" cy="-150" r="5" fill="#fff" opacity=".8"/>` +
      `<rect x="-130" y="10" width="260" height="32" fill="#3A2416" opacity=".9"/>`,
    antesRosto: (C) =>
      `<path d="M -186 -70 C -196 -30 -190 0 -176 20 C -168 -10 -166 -40 -160 -70 Z" fill="${C.cabelo}" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>` +
      espelha(`<path d="M -186 -70 C -196 -30 -190 0 -176 20 C -168 -10 -166 -40 -160 -70 Z" fill="${C.cabelo}" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>`),
    nariz,
    depoisBoca: () => '',
    depoisRosto: (C, cl) => {
      let listras = '';
      for (let x = -200; x < 220; x += 34) listras += `<path d="M ${x} -260 C ${x + 6} -200 ${x + 4} -150 ${x - 2} -90" stroke="${C.boinaL}" stroke-width="13" fill="none"/>`;
      return `<g style="transform: translateY(calc((var(--hair) - 1) * -170px)) rotate(calc((var(--hair) - 1) * 30deg))">` +
        `<path d="${COPA_N}" fill="${C.boina}"/>` +
        `<g clip-path="url(#${cl('copa')})">${listras}<path d="M 70 -270 C 140 -200 170 -150 170 -90 L 260 -90 L 260 -270 Z" fill="rgba(10,20,60,.25)"/></g>` +
        `<path d="${COPA_N}" fill="none" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
        `<circle cx="4" cy="-248" r="14" fill="${C.boina}" stroke="${L}" stroke-width="7"/>` +
        `<path d="${ABA_N}" fill="${C.boina}" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
      `</g>`;
    },
    neutro: { lid: -54 },
    ajustes: {},
  };

  // =====================================================================
  //  BANQUEIRO — chapéu-coco, colete dourado, gravata, bigode
  // =====================================================================
  const COCO = 'M -142 -132 C -150 -270 150 -270 142 -132 Z';
  const ABA_C = 'M -206 -126 C -120 -150 120 -150 206 -126 C 218 -116 210 -100 192 -104 C 120 -122 -120 -122 -192 -104 C -210 -100 -218 -116 -206 -126 Z';
  const BIG_B = 'M 0 66 C 20 54 60 50 84 70 C 98 82 112 74 116 60 C 124 84 104 104 78 96 C 56 90 30 84 0 82 C -30 84 -56 90 -78 96 C -104 104 -124 84 -116 60 C -112 74 -98 82 -84 70 C -60 50 -20 54 0 66 Z';
  const BANQUEIRO = {
    C: Object.assign({}, PELE, {
      blusa: '#2B2B36', blusaS: '#1A1A22', punho: '#FFFFFF',
      ouro: '#FFC93C', ouroS: '#D99A12', calca: '#3A3A48', calcaS: '#262632', chapeu: '#1E1E26', chapeuL: '#4A4A5C', bigode: '#3A2A20',
    }),
    sobrancelha: 18,
    defs: (cl) => defsBase(cl, `<clipPath id="${cl('colete')}"><path d="M -70 -200 L 70 -200 C 92 -150 98 -60 96 30 L -96 30 C -98 -60 -92 -150 -70 -200 Z"/></clipPath><clipPath id="${cl('coco')}"><path d="${COCO}"/></clipPath>`),
    calcado: sapato('#16161C', '#000000'),
    tronco: (C, cl) =>
      `<path d="${TRONCO}" fill="${C.blusa}"/>` +
      `<path d="M -70 -200 L 70 -200 C 92 -150 98 -60 96 30 L -96 30 C -98 -60 -92 -150 -70 -200 Z" fill="${C.ouro}"/>` +
      `<g clip-path="url(#${cl('colete')})"><path d="M 50 -240 C 76 -150 70 -60 78 60 L 170 60 L 170 -240 Z" fill="${C.ouroS}"/>` +
        Array.from({ length: 7 }, (_, i) => `<path d="M -100 ${-190 + i * 34} Q 0 ${-176 + i * 34} 100 ${-190 + i * 34}" stroke="${C.ouroS}" stroke-width="4" fill="none" opacity=".6"/>`).join('') + `</g>` +
      `<path d="M -70 -200 L 70 -200 C 92 -150 98 -60 96 30 L -96 30 C -98 -60 -92 -150 -70 -200 Z" fill="none" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>` +
      sombraLado(cl, 'rgba(0,0,0,.18)') +
      `<path d="${TRONCO}" fill="none" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
      // camisa e gravata
      `<path d="M -40 -206 L 0 -150 L 40 -206 Z" fill="#fff" stroke="${L}" stroke-width="6" stroke-linejoin="round"/>` +
      `<path d="M -12 -178 L 12 -178 L 18 -100 L 0 -82 L -18 -100 Z" fill="#B3261E" stroke="${L}" stroke-width="6" stroke-linejoin="round"/>` +
      [-130, -84, -38, 8].map((y) => `<circle cx="0" cy="${y + 40}" r="7" fill="${C.ouroS}" stroke="${L}" stroke-width="4"/>`).join('') +
      // corrente do relógio
      `<path d="M -60 -40 Q -20 -10 30 -44" fill="none" stroke="#FFF2A8" stroke-width="7"/><circle cx="34" cy="-44" r="11" fill="#FFF2A8" stroke="${L}" stroke-width="4"/>`,
    antesRosto: () => '',
    nariz,
    depoisBoca: (C) =>
      `<path d="${BIG_B}" fill="${C.bigode}" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>`,
    depoisRosto: (C, cl) =>
      `<g style="transform: translateY(calc((var(--hair) - 1) * -180px)) rotate(calc((var(--hair) - 1) * -35deg))">` +
        `<path d="${COCO}" fill="${C.chapeu}"/>` +
        `<g clip-path="url(#${cl('coco')})"><path d="M 60 -280 C 120 -220 140 -170 140 -120 L 260 -120 L 260 -280 Z" fill="#000" opacity=".35"/>` +
          `<rect x="-160" y="-170" width="320" height="36" fill="${C.chapeuL}"/></g>` +
        `<path d="${COCO}" fill="none" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
        `<path d="M -80 -230 Q -40 -250 0 -250" stroke="#fff" stroke-width="10" fill="none" opacity=".35" stroke-linecap="round"/>` +
        `<path d="${ABA_C}" fill="${C.chapeu}" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
      `</g>`,
    neutro: { lid: -44, bEa: 8, bDa: -10, bDy: -6 },
    ajustes: { acenando: { lid: -50 }, apontando: { lid: -40 } },
  };

  // =====================================================================
  //  CAPONE — chapéu fedora, terno risca de giz, charuto, cicatriz
  // =====================================================================
  const FEDORA = 'M -150 -128 C -164 -236 -80 -270 0 -244 C 80 -270 164 -236 150 -128 Z';
  const ABA_F = 'M -236 -118 C -130 -156 130 -156 236 -118 C 250 -104 232 -86 206 -96 C 120 -126 -120 -126 -206 -96 C -232 -86 -250 -104 -236 -118 Z';
  const CAPONE = {
    C: Object.assign({}, PELE, {
      blusa: '#2E3350', blusaS: '#1E2238', punho: '#FFFFFF',
      calca: '#2E3350', calcaS: '#1E2238', chapeu: '#C9C4B8', chapeuS: '#A39D90', faixa: '#1E1E26',
    }),
    sobrancelha: 20,
    defs: (cl) => defsBase(cl, `<clipPath id="${cl('fed')}"><path d="${FEDORA}"/></clipPath>`),
    calcado: (C) => sapato('#F4F1EA', '#CFC8BA')(C) + `<path d="M 6 -18 C 24 -18 40 -4 52 10 L 56 24 L 10 24 Z" fill="#2A2A33" opacity=".95"/>`,
    tronco: (C, cl) => {
      let giz = '';
      for (let x = -130; x <= 130; x += 26) giz += `<line x1="${x}" y1="-230" x2="${x}" y2="40" stroke="#8A90B8" stroke-width="3" opacity=".55"/>`;
      const lapela = 'M -6 -200 L -60 -212 L -70 -120 L -10 -40 Z';
      return `<path d="${TRONCO}" fill="${C.blusa}"/>` +
        `<g clip-path="url(#${cl('tronco')})">${giz}</g>` +
        sombraLado(cl, 'rgba(0,0,0,.25)') +
        `<path d="${TRONCO}" fill="none" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
        `<path d="M -36 -206 L 0 -60 L 36 -206 Z" fill="#fff" stroke="${L}" stroke-width="6" stroke-linejoin="round"/>` +
        `<path d="M -10 -186 L 10 -186 L 16 -96 L 0 -80 L -16 -96 Z" fill="#D7263D" stroke="${L}" stroke-width="6" stroke-linejoin="round"/>` +
        `<path d="${lapela}" fill="${C.blusaS}" stroke="${L}" stroke-width="6" stroke-linejoin="round"/>` +
        espelha(`<path d="${lapela}" fill="${C.blusaS}" stroke="${L}" stroke-width="6" stroke-linejoin="round"/>`) +
        `<path d="M 54 -126 L 92 -126 L 86 -100 L 60 -100 Z" fill="#fff" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>` +
        `<path d="M 60 -126 L 68 -142 L 76 -126 L 84 -140 L 90 -126" fill="#fff" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>` +
        [-30, 6].map((y) => `<circle cx="0" cy="${y}" r="7" fill="#111" stroke="#666" stroke-width="2"/>`).join('');
    },
    antesRosto: (C) =>
      // cicatriz na bochecha esquerda da tela
      `<path d="M -150 10 L -96 46" stroke="#C98A8A" stroke-width="8" stroke-linecap="round"/>` +
      `<path d="M -140 40 L -126 22 M -122 52 L -108 34" stroke="#C98A8A" stroke-width="5" stroke-linecap="round"/>`,
    nariz,
    depoisBoca: () =>
      // charuto no canto da boca, ponta acesa
      `<g transform="translate(58,104) rotate(14)"><rect x="0" y="-12" width="96" height="24" rx="10" fill="#7A4A2A" stroke="${L}" stroke-width="6"/>` +
      `<rect x="18" y="-12" width="14" height="24" fill="#D7263D"/><circle cx="98" cy="0" r="12" fill="#FF8A3D" stroke="${L}" stroke-width="5"/>` +
      `<circle cx="98" cy="0" r="5" fill="#FFE08A"/></g>`,
    depoisRosto: (C, cl) =>
      `<g style="transform: translateY(calc((var(--hair) - 1) * -180px)) rotate(calc((var(--hair) - 1) * 30deg))">` +
        `<path d="${FEDORA}" fill="${C.chapeu}"/>` +
        `<g clip-path="url(#${cl('fed')})"><path d="M 60 -290 C 120 -230 150 -170 150 -120 L 260 -120 L 260 -290 Z" fill="${C.chapeuS}"/>` +
          `<rect x="-170" y="-176" width="340" height="44" fill="${C.faixa}"/>` +
          `<path d="M 0 -246 L 0 -200" stroke="${C.chapeuS}" stroke-width="8"/></g>` +
        `<path d="${FEDORA}" fill="none" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
        `<path d="${ABA_F}" fill="${C.chapeu}" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
        `<path d="M -200 -112 C -120 -138 120 -138 200 -112" stroke="${C.chapeuS}" stroke-width="7" fill="none"/>` +
      `</g>`,
    neutro: { lid: -38, bEa: 14, bDa: -14, bEy: 4, bDy: 4 },
    ajustes: { assustado: { bEa: -16, bDa: 16 } },
  };

  // =====================================================================
  //  POLICIAL FEDERAL — boné preto "PF", óculos escuros, colete tático
  // =====================================================================
  const COPA_P = 'M -192 -118 C -196 -200 -112 -240 0 -240 C 112 -240 196 -200 192 -118 C 120 -134 -120 -134 -192 -118 Z';
  const ABA_P = 'M -60 -124 C 20 -146 140 -146 236 -118 C 250 -106 240 -90 220 -92 C 120 -112 20 -112 -56 -100 Z';
  const POLICIAL = {
    C: Object.assign({}, PELE, {
      blusa: '#25324A', blusaS: '#182234', punho: '#182234',
      calca: '#1E2433', calcaS: '#121722', colete: '#15181F', bone: '#14161C', ouro: '#FFC93C',
    }),
    sobrancelha: 20,
    defs: (cl) => defsBase(cl, `<clipPath id="${cl('copa')}"><path d="${COPA_P}"/></clipPath>`),
    calcado: sapato('#121216', '#000'),
    tronco: (C, cl) =>
      `<path d="${TRONCO}" fill="${C.blusa}"/>` +
      `<path d="M -104 -180 C -60 -200 60 -200 104 -180 L 116 30 L -116 30 Z" fill="${C.colete}" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>` +
      sombraLado(cl, 'rgba(0,0,0,.25)') +
      `<path d="${TRONCO}" fill="none" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
      `<rect x="-92" y="-110" width="184" height="64" rx="8" fill="#FFC93C" stroke="${L}" stroke-width="6"/>` +
      `<text x="0" y="-62" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="50" fill="${L}">POLÍCIA</text>` +
      `<rect x="-60" y="-30" width="54" height="48" rx="6" fill="#2A2F3A" stroke="${L}" stroke-width="5"/>` +
      `<rect x="6" y="-30" width="54" height="48" rx="6" fill="#2A2F3A" stroke="${L}" stroke-width="5"/>` +
      `<rect x="-130" y="18" width="260" height="24" fill="#0B0D12"/>`,
    antesRosto: () => '',
    nariz,
    depoisBoca: () => '',
    depoisRosto: (C, cl) =>
      // óculos escuros
      `<g style="opacity: calc(1 - var(--happy))">` +
        `<path d="M -124 -40 L -14 -40 C -12 20 -40 40 -72 40 C -108 40 -126 12 -124 -40 Z" fill="#101218" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>` +
        espelha(`<path d="M -124 -40 L -14 -40 C -12 20 -40 40 -72 40 C -108 40 -126 12 -124 -40 Z" fill="#101218" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>`) +
        `<rect x="-20" y="-42" width="40" height="12" fill="#101218"/>` +
        `<path d="M -100 -26 L -70 -26" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".55"/>` +
        `<path d="M 44 -26 L 74 -26" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".55"/>` +
      `</g>` +
      `<g style="transform: translateY(calc((var(--hair) - 1) * -190px))">` +
        `<path d="${COPA_P}" fill="${C.bone}"/>` +
        `<path d="${COPA_P}" fill="none" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
        `<text x="0" y="-152" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="64" fill="${C.ouro}">PF</text>` +
        `<path d="${ABA_P}" fill="${C.bone}" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
      `</g>`,
    neutro: { lid: -50, bEa: 10, bDa: -10 },
    ajustes: {},
  };

  Object.assign(P.VISUAIS, { narrador: NARRADOR, banqueiro: BANQUEIRO, capone: CAPONE, policial: POLICIAL });


  // =====================================================================
  //  BANQUEIRO DO MASTER — cabelo penteado para trás, terno azul-marinho, camisa aberta (cartum genérico)
  // =====================================================================
  const CAB_V = 'M -188 -30 C -200 -150 -110 -222 12 -218 C 136 -214 206 -146 192 -30 C 176 -104 128 -146 52 -152 C -20 -156 -60 -130 -112 -138 C -152 -128 -172 -90 -188 -30 Z';
  const VORCARO = {
    C: Object.assign({}, PELE, { blusa: '#1E2A4A', blusaS: '#141C33', punho: '#FFFFFF', calca: '#1E2A4A', calcaS: '#141C33', cabelo: '#2A1D16', cabeloL: '#5A3F30' }),
    sobrancelha: 19,
    defs: (cl) => defsBase(cl),
    calcado: sapato('#3A2418', '#22140C'),
    tronco: (C, cl) => {
      const lapela = 'M -8 -204 L -66 -214 L -74 -110 L -12 -30 Z';
      return `<path d="${TRONCO}" fill="${C.blusa}"/>` + sombraLado(cl, 'rgba(0,0,0,.28)') +
        `<path d="${TRONCO}" fill="none" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
        `<path d="M -40 -208 L 0 -40 L 40 -208 Z" fill="#FFFFFF" stroke="${L}" stroke-width="6" stroke-linejoin="round"/>` +
        `<path d="M -30 -206 L -4 -170 L -18 -150 Z M 30 -206 L 4 -170 L 18 -150 Z" fill="#E9ECF5" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>` +
        `<path d="${lapela}" fill="${C.blusaS}" stroke="${L}" stroke-width="6" stroke-linejoin="round"/>` +
        espelha(`<path d="${lapela}" fill="${C.blusaS}" stroke="${L}" stroke-width="6" stroke-linejoin="round"/>`) +
        `<path d="M 56 -124 L 94 -124 L 90 -104 L 60 -104 Z" fill="#FFC93C" stroke="${L}" stroke-width="5"/>` +
        [-26, 10].map((y) => `<circle cx="0" cy="${y}" r="7" fill="#0E1426" stroke="#56628A" stroke-width="2"/>`).join('');
    },
    antesRosto: (C, cl) => `<path d="${CAB_V}" fill="${C.cabelo}" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
      `<path d="M -120 -168 Q -40 -206 60 -196" stroke="${C.cabeloL}" stroke-width="12" fill="none" stroke-linecap="round"/>` +
      `<path d="M -60 -190 Q 20 -212 110 -184" stroke="${C.cabeloL}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".7"/>`,
    nariz,
    depoisBoca: () => '',
    depoisRosto: () => '',
    neutro: { lid: -42, bEa: 10, bDa: -14, bDy: -4 },
    ajustes: {},
  };
  // investidores comuns (camiseta + cabelo)
  const CAB_C = 'M -186 -40 C -196 -160 -100 -226 4 -222 C 120 -220 204 -160 190 -40 C 170 -120 100 -150 0 -146 C -90 -150 -170 -110 -186 -40 Z';
  const cliente = (camisa, camisaS, cabelo, calca) => ({
    C: Object.assign({}, PELE, { blusa: camisa, blusaS: camisaS, punho: camisaS, calca, calcaS: '#22283A', cabelo }),
    defs: (cl) => defsBase(cl),
    calcado: sapato('#F4F1EA', '#CFC8BA'),
    tronco: (C, cl) => `<path d="${TRONCO}" fill="${C.blusa}"/>` + sombraLado(cl, 'rgba(0,0,0,.22)') +
      `<path d="${TRONCO}" fill="none" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
      `<path d="M -50 -208 Q 0 -170 50 -208" fill="none" stroke="${L}" stroke-width="7"/>`,
    antesRosto: (C) => `<path d="${CAB_C}" fill="${C.cabelo}" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>`,
    nariz, depoisBoca: () => '', depoisRosto: () => '', neutro: {}, ajustes: {},
  });
  Object.assign(P.VISUAIS, { vorcaro: VORCARO, cliente1: cliente('#FF7A1C', '#DF5209', '#4A2E1E', '#3A5BDB'), cliente2: cliente('#9B5DE5', '#7A3FC4', '#1A1A22', '#2C3040'), cliente3: cliente('#2FB36A', '#1E8A4E', '#C98A3A', '#3A3A48') });
  // pose nova: negando (balança a cabeça e a mão)
  P.POSES.negando = {
    boca: 'hum',
    base: { armD: -60, elbowD: -40, handD: 0, hDo: 1, hDr: 0, lid: -40, bEa: 12, bDa: -12, bEy: -6, bDy: -6 },
    loop(q) { q.osc({ head: 9, fx: 14 }, 0.22, 0, 'sine.inOut', -9); q.osc({ handD: 24 }, 0.18); },
  };


  // =====================================================================
  //  MASCOTE DO TUDO EM 3D — boné amarelo "3D" (aba para a frente-direita), jaqueta laranja com zíper, camiseta branca
  // =====================================================================
  const COPA_M = 'M -186 -104 C -196 -200 -108 -246 6 -246 C 122 -246 200 -198 190 -104 C 120 -124 -110 -124 -186 -104 Z';
  const ABA_M = 'M -40 -118 C 40 -140 170 -140 250 -112 C 266 -100 256 -82 232 -84 C 150 -104 40 -104 -36 -96 Z';
  const MASCOTE = {
    C: Object.assign({}, PELE, { blusa: '#FF7A1C', blusaS: '#D9560A', punho: '#D9560A', calca: '#2E3A66', calcaS: '#1F2848', cabelo: '#3A2416', bone: '#FFD23F', boneS: '#E0A810' }),
    defs: (cl) => defsBase(cl, `<clipPath id="${cl('copa')}"><path d="${COPA_M}"/></clipPath>`),
    calcado: sapato('#F4F1EA', '#CFC8BA'),
    tronco: (C, cl) =>
      `<path d="${TRONCO}" fill="${C.blusa}"/>` +
      `<path d="M -34 -208 L 34 -208 L 30 40 L -30 40 Z" fill="#FFFFFF"/>` +
      sombraLado(cl, 'rgba(120,40,0,.25)') +
      `<path d="${TRONCO}" fill="none" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
      `<path d="M -34 -208 L -30 40 M 34 -208 L 30 40" stroke="${L}" stroke-width="7"/>` +
      `<path d="M -60 -214 C -30 -196 30 -196 60 -214 L 48 -196 C 20 -184 -20 -184 -48 -196 Z" fill="${C.blusaS}" stroke="${L}" stroke-width="6"/>` +
      `<rect x="-130" y="12" width="260" height="30" fill="${C.blusaS}"/>` +
      `<line x1="-130" y1="12" x2="130" y2="12" stroke="${L}" stroke-width="6"/>` +
      `<rect x="-100" y="-110" width="46" height="8" rx="4" fill="${C.blusaS}"/><rect x="54" y="-110" width="46" height="8" rx="4" fill="${C.blusaS}"/>`,
    antesRosto: (C) => `<path d="M -186 -64 C -196 -24 -190 4 -176 22 C -168 -8 -166 -38 -160 -64 Z" fill="${C.cabelo}" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>`,
    nariz,
    depoisBoca: () => '',
    depoisRosto: (C, cl) =>
      `<g style="transform: translateY(calc((var(--hair) - 1) * -170px)) rotate(calc((var(--hair) - 1) * 25deg))">` +
        `<path d="${COPA_M}" fill="${C.bone}"/>` +
        `<g clip-path="url(#${cl('copa')})"><path d="M 70 -270 C 140 -200 170 -150 170 -100 L 260 -100 L 260 -270 Z" fill="${C.boneS}"/></g>` +
        `<path d="${COPA_M}" fill="none" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
        `<circle cx="6" cy="-244" r="12" fill="${C.bone}" stroke="${L}" stroke-width="7"/>` +
        `<text x="-14" y="-142" text-anchor="middle" font-family="'Baloo 2', system-ui, sans-serif" font-weight="800" font-size="78" fill="#2350D8" stroke="${L}" stroke-width="10" paint-order="stroke fill">3D</text>` +
        `<path d="${ABA_M}" fill="${C.bone}" stroke="${L}" stroke-width="${T}" stroke-linejoin="round"/>` +
      `</g>`,
    neutro: { lid: -56 },
    ajustes: {},
  };
  P.VISUAIS.mascote = MASCOTE;

  // pose nova: dedo indicador na boca ("shhh")
  P.POSES.segredo = {
    boca: 'hum',
    base: {
      armD: 14, elbowD: 156, handD: 10, hDp: 1, hDr: 0,
      armE: 6, elbowE: -20, handE: 0, hEr: 1,
      fx: 0, px: -10, py: 0, lid: -40, bEy: -6, bDy: -14, bDa: -8, head: 0, lean: 0,
    },
    loop(q) { q.osc({ head: 1 }, 0.8); q.osc({ breath: 1.02 }, 0.7); q.piscar(1.2); },
  };
  // pose nova: braços cruzados, desconfiado
  P.POSES.desconfiado = {
    boca: 'confiante',
    base: { armE: -40, elbowE: -100, handE: 0, hEf: 1, hEr: 0, armD: 40, elbowD: 100, handD: 0, hDf: 1, hDr: 0, lid: -40, bEa: 12, bDa: -12, head: -4, px: 10 },
    loop(q) { q.osc({ head: 2, breath: 1.02 }, 0.9); q.piscar(1.4); },
  };
})(window);
