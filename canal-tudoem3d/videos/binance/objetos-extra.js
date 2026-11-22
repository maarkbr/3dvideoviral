/*
  Objetos novos (mesmo traço: contorno preto grosso, sombra de um lado).
  etiqueta {texto, cor, fs}  · carimbo {texto}  · jornal  · grade  · casa  · carro  · predio
  nota {mancha, suja}  · maco  · cadeado
  Unidades: 586 = 1 metro no mundo; em M.naTela a unidade é o pixel da tela.
*/
(function (global) {
  'use strict';
  const D = global.Objetos.DESENHOS;
  const T = 10, L = '#17121D', FONTE = "'Baloo 2', system-ui, sans-serif";
  const contorno = `stroke="${L}" stroke-width="${T}" stroke-linejoin="round"`;
  const largTexto = (t, fs) => t.length * fs * 0.56;

  // etiqueta amarela (o "selo" dos números), origem no centro
  D.etiqueta = (o) => {
    const fs = o.fs || 96, txt = o.texto || '', w = Math.max(220, largTexto(txt, fs) + 90), h = fs * 1.42, r = 26;
    const x0 = -w / 2, y0 = -h / 2, cor = o.cor || '#FFD93D', corT = o.corTexto || L;
    return {
      tipo: 'ar', caixa: [x0 - 40, y0 - 40, w + 80, h + 90],
      svg: () =>
        `<rect x="${x0}" y="${y0 + 16}" width="${w}" height="${h}" rx="${r}" fill="${L}"/>` +
        `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="${r}" fill="${cor}" ${contorno}/>` +
        `<path d="M ${x0 + 22} ${y0 + 26} Q ${x0 + 24} ${y0 + 12} ${x0 + 52} ${y0 + 12}" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" opacity=".7"/>` +
        `<text x="0" y="${fs * 0.35}" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="${fs}" fill="${corT}">${txt}</text>`,
    };
  };

  // carimbo vermelho torto (MITO)
  D.carimbo = (o) => {
    const fs = o.fs || 150, txt = o.texto || 'MITO', w = largTexto(txt, fs) + 80, h = fs * 1.3;
    return {
      tipo: 'ar', caixa: [-w / 2 - 40, -h / 2 - 40, w + 80, h + 80],
      svg: () => `<g transform="rotate(-12)">` +
        `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="18" fill="rgba(255,255,255,.15)" stroke="#E2231A" stroke-width="16"/>` +
        `<rect x="${-w / 2 + 16}" y="${-h / 2 + 16}" width="${w - 32}" height="${h - 32}" rx="10" fill="none" stroke="#E2231A" stroke-width="5"/>` +
        `<text x="0" y="${fs * 0.36}" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="${fs}" fill="#E2231A" letter-spacing="8">${txt}</text></g>`,
    };
  };

  // jornal antigo
  D.jornal = {
    tipo: 'ar', caixa: [-330, -420, 660, 840],
    svg(cl) {
      let linhas = '';
      for (let i = 0; i < 7; i++) linhas += `<rect x="-250" y="${110 + i * 34}" width="${i % 3 === 2 ? 300 : 500}" height="14" rx="7" fill="#B9AE97"/>`;
      return `<defs><clipPath id="${cl('p')}"><rect x="-290" y="-380" width="580" height="760" rx="14"/></clipPath></defs>` +
        `<g transform="rotate(-5)">` +
        `<rect x="-290" y="-366" width="580" height="760" rx="14" fill="${L}"/>` +
        `<rect x="-290" y="-380" width="580" height="760" rx="14" fill="#F3EBD8"/>` +
        `<g clip-path="url(#${cl('p')})"><rect x="170" y="-400" width="160" height="800" fill="#DDD2BA"/></g>` +
        `<rect x="-290" y="-380" width="580" height="760" rx="14" fill="none" ${contorno}/>` +
        `<text x="0" y="-290" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="64" fill="${L}">THE DAILY NEWS</text>` +
        `<line x1="-250" y1="-262" x2="250" y2="-262" stroke="${L}" stroke-width="6"/>` +
        `<text x="-250" y="-232" font-family="Georgia, serif" font-size="30" fill="${L}">1973</text>` +
        `<text x="250" y="-232" text-anchor="end" font-family="Georgia, serif" font-size="30" fill="${L}">EDIÇÃO EXTRA</text>` +
        `<line x1="-250" y1="-218" x2="250" y2="-218" stroke="${L}" stroke-width="3"/>` +
        `<text x="0" y="-120" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="110" fill="${L}">WATERGATE</text>` +
        `<text x="0" y="-50" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="56" fill="#B3261E">"LAVAGEM DE DINHEIRO"</text>` +
        `<rect x="-250" y="-10" width="200" height="100" rx="6" fill="#B9AE97"/>` + linhas +
        `</g>`;
    },
  };

  // grade de prisão (no chão), 2,3 m
  D.grade = {
    tipo: 'chao', caixa: [-460, -1400, 920, 1400],
    svg() {
      let b = '';
      for (let i = 0; i < 7; i++) {
        const x = -360 + i * 120;
        b += `<rect x="${x - 22}" y="-1300" width="44" height="1300" rx="20" fill="#7E879C" ${contorno}/>` +
             `<rect x="${x + 4}" y="-1290" width="12" height="1280" rx="6" fill="#596276"/>` +
             `<rect x="${x - 14}" y="-1290" width="8" height="1280" rx="4" fill="#C9D0DE"/>`;
      }
      return `<rect x="-420" y="-1360" width="840" height="90" rx="20" fill="#5F687D" ${contorno}/>` + b +
        `<rect x="-420" y="-760" width="840" height="70" rx="18" fill="#5F687D" ${contorno}/>` +
        `<rect x="-420" y="-60" width="840" height="60" rx="16" fill="#5F687D" ${contorno}/>`;
    },
  };

  // casa
  D.casa = {
    tipo: 'ar', caixa: [-300, -300, 600, 600],
    svg: () =>
      `<rect x="-200" y="-60" width="400" height="300" rx="10" fill="#FFF3DA" ${contorno}/>` +
      `<rect x="90" y="-60" width="110" height="300" fill="#EAD7B4"/>` +
      `<rect x="-200" y="-60" width="400" height="300" rx="10" fill="none" ${contorno}/>` +
      `<path d="M -250 -40 L 0 -250 L 250 -40 Z" fill="#E8402F" ${contorno}/>` +
      `<path d="M 0 -250 L 250 -40 L 120 -40 Z" fill="#B82A1E"/>` +
      `<path d="M -250 -40 L 0 -250 L 250 -40 Z" fill="none" ${contorno}/>` +
      `<rect x="-50" y="70" width="100" height="170" rx="8" fill="#8A5A36" ${contorno}/>` +
      `<circle cx="28" cy="160" r="9" fill="#FFD23F"/>` +
      `<rect x="-160" y="10" width="80" height="80" rx="6" fill="#8FD3FF" ${contorno}/>` +
      `<rect x="80" y="10" width="80" height="80" rx="6" fill="#8FD3FF" ${contorno}/>`,
  };

  // carro
  D.carro = {
    tipo: 'ar', caixa: [-340, -220, 680, 440],
    svg: () =>
      `<path d="M -300 60 L -300 0 Q -290 -40 -230 -50 L -160 -60 L -100 -150 Q -80 -170 -40 -170 L 110 -170 Q 150 -170 170 -140 L 220 -60 L 270 -50 Q 310 -40 310 10 L 310 60 Q 310 90 280 90 L -270 90 Q -300 90 -300 60 Z" fill="#FF5A3C" ${contorno}/>` +
      `<path d="M 200 -60 L 270 -50 Q 310 -40 310 10 L 310 60 Q 310 90 280 90 L 180 90 Z" fill="#C93A22"/>` +
      `<path d="M -300 60 L -300 0 Q -290 -40 -230 -50 L -160 -60 L -100 -150 Q -80 -170 -40 -170 L 110 -170 Q 150 -170 170 -140 L 220 -60 L 270 -50 Q 310 -40 310 10 L 310 60 Q 310 90 280 90 L -270 90 Q -300 90 -300 60 Z" fill="none" ${contorno}/>` +
      `<path d="M -130 -64 L -84 -136 L 20 -136 L 20 -64 Z" fill="#8FD3FF" ${contorno}/>` +
      `<path d="M 50 -64 L 50 -136 L 110 -136 Q 130 -136 140 -120 L 180 -64 Z" fill="#8FD3FF" ${contorno}/>` +
      `<circle cx="-170" cy="90" r="64" fill="#2A2733" ${contorno}/><circle cx="-170" cy="90" r="24" fill="#C9D0DE"/>` +
      `<circle cx="180" cy="90" r="64" fill="#2A2733" ${contorno}/><circle cx="180" cy="90" r="24" fill="#C9D0DE"/>` +
      `<rect x="270" y="-20" width="34" height="26" rx="8" fill="#FFF2A8" stroke="${L}" stroke-width="6"/>`,
  };

  // prédio de empresa
  D.predio = {
    tipo: 'ar', caixa: [-230, -380, 460, 760],
    svg: () => {
      let jan = '';
      for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) jan += `<rect x="${-120 + c * 90}" y="${-260 + r * 80}" width="60" height="50" rx="6" fill="${(r + c) % 3 ? '#8FD3FF' : '#FFE38A'}" stroke="${L}" stroke-width="6"/>`;
      return `<rect x="-170" y="-320" width="340" height="640" rx="12" fill="#5B7BD6" ${contorno}/>` +
        `<rect x="80" y="-320" width="90" height="640" fill="#3F5DB3"/>` +
        `<rect x="-170" y="-320" width="340" height="640" rx="12" fill="none" ${contorno}/>` + jan +
        `<rect x="-50" y="230" width="100" height="90" rx="6" fill="#2A2733" stroke="${L}" stroke-width="7"/>` +
        `<rect x="-110" y="-370" width="220" height="60" rx="12" fill="#FFD93D" ${contorno}/>` +
        `<text x="0" y="-326" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="44" fill="${L}">LTDA</text>`;
    },
  };

  // nota de dinheiro (opção: mancha vermelha que não sai / suja)
  D.nota = (o) => ({
    tipo: 'ar', caixa: [-330, -170, 660, 340],
    svg(cl) {
      const verde = o.suja ? '#9A9A55' : '#6CCB78', esc = o.suja ? '#5E5E2C' : '#2D8A45', clara = o.suja ? '#B9B97A' : '#A8E6AE';
      return `<defs><clipPath id="${cl('n')}"><rect x="-290" y="-130" width="580" height="260" rx="22"/></clipPath></defs>` +
        `<rect x="-290" y="-116" width="580" height="260" rx="22" fill="${L}"/>` +
        `<rect x="-290" y="-130" width="580" height="260" rx="22" fill="${verde}"/>` +
        `<g clip-path="url(#${cl('n')})"><rect x="170" y="-150" width="200" height="300" fill="${esc}" opacity=".35"/></g>` +
        `<rect x="-262" y="-102" width="524" height="204" rx="14" fill="none" stroke="${esc}" stroke-width="8"/>` +
        `<ellipse cx="0" cy="0" rx="78" ry="86" fill="${clara}" stroke="${esc}" stroke-width="7"/>` +
        `<circle cx="0" cy="-16" r="28" fill="${esc}"/><path d="M -46 54 Q 0 6 46 54" fill="${esc}"/>` +
        `<text x="-190" y="-30" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="64" fill="${esc}">R$</text>` +
        `<text x="190" y="80" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="72" fill="${esc}">100</text>` +
        (o.suja ? `<circle cx="-120" cy="50" r="34" fill="#5A4214" opacity=".5"/><circle cx="140" cy="-50" r="24" fill="#5A4214" opacity=".5"/>` : '') +
        (o.mancha ? `<g style="transform: scale(var(--mancha, 1))"><path d="M -40 -70 C 10 -110 70 -60 60 -10 C 110 0 100 70 40 66 C 30 110 -40 100 -46 60 C -110 70 -110 0 -66 -16 C -100 -60 -70 -90 -40 -70 Z" fill="#C1121F" opacity=".92"/>` +
          `<circle cx="96" cy="-74" r="14" fill="#C1121F" opacity=".9"/><circle cx="-110" cy="64" r="10" fill="#C1121F" opacity=".9"/></g>` : '') +
        `<rect x="-290" y="-130" width="580" height="260" rx="22" fill="none" ${contorno}/>` +
        `<path d="M -262 -96 Q -258 -112 -230 -114" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" opacity=".6"/>`;
    },
  });

  // maço de notas (dinheiro vivo)
  D.maco = {
    tipo: 'ar', caixa: [-330, -260, 660, 520],
    svg: () => {
      let c = '';
      for (let i = 4; i >= 0; i--) c += `<rect x="${-260 + i * 6}" y="${-60 + i * 34}" width="520" height="120" rx="18" fill="${i % 2 ? '#5DBE6B' : '#6CCB78'}" ${contorno}/>`;
      return `<g transform="translate(0,-70)">${c}</g>` +
        `<rect x="-60" y="-150" width="120" height="290" rx="10" fill="#FFD93D" ${contorno}/>` +
        `<text x="0" y="16" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="64" fill="${L}">$</text>`;
    },
  };

  // brilho (estrelinha de limpo)
  D.brilho = {
    tipo: 'ar', caixa: [-160, -160, 320, 320],
    svg: () => `<path d="M 0 -130 C 14 -30 30 -14 130 0 C 30 14 14 30 0 130 C -14 30 -30 14 -130 0 C -30 -14 -14 -30 0 -130 Z" fill="#FFF7C2" ${contorno}/>` +
      `<path d="M 0 -130 C 14 -30 30 -14 130 0 L 0 0 Z" fill="#FFE066"/>`,
  };


  // pizza (fatia)
  D.pizza = { tipo: 'ar', caixa: [-200, -220, 400, 440], svg: () =>
    `<path d="M -150 -150 Q 0 -200 150 -150 L 0 190 Z" fill="#FFC94A" ${contorno}/>` +
    `<path d="M -150 -150 Q 0 -200 150 -150 L 140 -120 Q 0 -168 -140 -120 Z" fill="#C98A3A" ${contorno}/>` +
    [[-50, -80], [40, -60], [-10, 20], [30, 90]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="26" fill="#D7263D" stroke="${L}" stroke-width="6"/>`).join('') };
  // bloco de gelo transparente (fica na frente do personagem)
  D.gelo = { tipo: 'chao', caixa: [-420, -1320, 840, 1340], svg: (cl) =>
    `<rect x="-380" y="-1280" width="760" height="1270" rx="40" fill="rgba(170,225,255,.42)" stroke="#17121D" stroke-width="12"/>` +
    `<rect x="-380" y="-1280" width="760" height="1270" rx="40" fill="none" stroke="#E8F7FF" stroke-width="5" stroke-dasharray="40 30" opacity=".7"/>` +
    `<path d="M -300 -1180 L -150 -1220 M -320 -1100 L -250 -1120" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity=".8"/>` +
    `<path d="M 260 -300 L 120 -420 L 180 -540" stroke="#E8F7FF" stroke-width="7" fill="none" opacity=".8"/>` +
    `<path d="M -380 -60 Q 0 -20 380 -60 L 380 -10 Q 0 30 -380 -10 Z" fill="rgba(255,255,255,.6)"/>` };
  // luzinha vermelha escondida (código malicioso rodando)
  D.luzVermelha = { tipo: 'ar', caixa: [-40, -40, 80, 80], svg: () =>
    `<circle r="36" fill="rgba(255,40,30,.22)"/><circle r="22" fill="rgba(255,50,35,.4)"/>` +
    `<circle r="11" fill="#FF2A1A" stroke="#17121D" stroke-width="4"/><circle cx="-3" cy="-4" r="3.5" fill="#FFD0C8"/>` };
  // cartão de e-mail da "tarefa" (na tela)
  D.email = { tipo: 'ar', caixa: [-430, -300, 860, 600], svg: () =>
    `<rect x="-400" y="-256" width="800" height="512" rx="36" fill="${L}"/>` +
    `<rect x="-400" y="-270" width="800" height="512" rx="36" fill="#FFFFFF" ${contorno}/>` +
    `<rect x="-400" y="-270" width="800" height="90" rx="36" fill="#2350D8"/><rect x="-400" y="-210" width="800" height="30" fill="#2350D8"/>` +
    `<text x="-350" y="-210" font-family="${FONTE}" font-weight="800" font-size="46" fill="#fff">Nova mensagem</text>` +
    `<text x="-350" y="-110" font-family="${FONTE}" font-weight="800" font-size="56" fill="${L}">Tarefa técnica</text>` +
    `<text x="-350" y="-50" font-family="${FONTE}" font-weight="700" font-size="36" fill="#6b6b78">Etapa final do processo seletivo</text>` +
    `<rect x="-350" y="10" width="560" height="22" rx="11" fill="#E2E5EE"/><rect x="-350" y="52" width="420" height="22" rx="11" fill="#E2E5EE"/>` +
    `<rect x="-350" y="120" width="300" height="86" rx="20" fill="#1FB5A2" ${contorno}/>` +
    `<text x="-200" y="178" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="48" fill="#fff">ABRIR</text>` };

  // celular com notificação de investimento
  D.celular = (o) => ({
    tipo: 'ar', caixa: [-300, -560, 600, 1120],
    svg(cl) {
      const t1 = o.titulo || 'CDB 140% DO CDI', t2 = o.texto || 'Garantido pelo FGC!';
      return `<defs><clipPath id="${cl('tela')}"><rect x="-226" y="-470" width="452" height="930" rx="40"/></clipPath>` +
        `<linearGradient id="${cl('g')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B6FE0"/><stop offset="1" stop-color="#7A3FC4"/></linearGradient></defs>` +
        `<rect x="-262" y="-500" width="524" height="1010" rx="70" fill="${L}"/>` +
        `<rect x="-252" y="-512" width="504" height="1000" rx="66" fill="#2A2733" ${contorno}/>` +
        `<rect x="-226" y="-470" width="452" height="930" rx="40" fill="url(#${cl('g')})"/>` +
        `<g clip-path="url(#${cl('tela')})"><text x="0" y="-300" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="120" fill="#fff" opacity=".9">22:41</text>` +
        `<g style="transform: translateY(calc(var(--notif, 1) * 0px))"><rect x="-206" y="-180" width="412" height="200" rx="34" fill="#ffffff" opacity=".96"/>` +
        `<rect x="-186" y="-158" width="60" height="60" rx="16" fill="#FFC93C"/><text x="-156" y="-114" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="44" fill="${L}">$</text>` +
        `<text x="-110" y="-116" font-family="${FONTE}" font-weight="800" font-size="32" fill="#6b6b78">BANCO • agora</text>` +
        `<text x="-186" y="-50" font-family="${FONTE}" font-weight="800" font-size="46" fill="${L}">${t1}</text>` +
        `<text x="-186" y="-6" font-family="${FONTE}" font-weight="700" font-size="34" fill="#4a4a58">${t2}</text></g></g>` +
        `<rect x="-60" y="-492" width="120" height="16" rx="8" fill="${L}"/>` +
        `<path d="M -200 -440 Q -196 -470 -160 -470" stroke="#fff" stroke-width="12" fill="none" opacity=".4" stroke-linecap="round"/>`;
    },
  });
  // contrato (opção: carimbo FALSO)
  D.contrato = (o) => ({
    tipo: 'ar', caixa: [-260, -340, 520, 680],
    svg() {
      let l = ''; for (let i = 0; i < 8; i++) l += `<rect x="-170" y="${-150 + i * 40}" width="${i % 3 === 2 ? 200 : 340}" height="14" rx="7" fill="#C9C3B5"/>`;
      return `<g transform="rotate(${o.giro || -4})"><rect x="-210" y="-280" width="420" height="560" rx="16" fill="${L}" transform="translate(0,14)"/>` +
        `<rect x="-210" y="-280" width="420" height="560" rx="16" fill="#FBF8F0" ${contorno}/>` +
        `<text x="0" y="-200" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="58" fill="${L}">CONTRATO</text>` +
        `<text x="0" y="-160" text-anchor="middle" font-family="${FONTE}" font-weight="700" font-size="28" fill="#6b6b78">DE EMPRÉSTIMO</text>` + l +
        `<path d="M -170 220 C -130 180 -100 250 -60 210 C -30 180 0 240 30 200" stroke="#2f5bd6" stroke-width="7" fill="none"/>` +
        (o.falso ? `<g transform="rotate(-18)" style="opacity: var(--carimbo, 1)"><rect x="-190" y="-60" width="380" height="120" rx="16" fill="none" stroke="#E2231A" stroke-width="14"/>` +
          `<text x="0" y="38" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="100" fill="#E2231A" letter-spacing="10">FALSO</text></g>` : '') + `</g>`;
    },
  });
  // caixa de notinhas de fiado
  D.fiado = {
    tipo: 'ar', caixa: [-320, -330, 640, 620],
    svg: () => {
      let notas = ''; for (let i = 0; i < 6; i++) notas += `<g transform="translate(${-150 + i * 60},${-150 - (i % 3) * 30}) rotate(${-14 + i * 6})"><rect x="-55" y="-80" width="110" height="160" rx="8" fill="#FFF7D6" stroke="${L}" stroke-width="7"/><rect x="-35" y="-50" width="70" height="10" fill="#C9B98A"/><rect x="-35" y="-25" width="50" height="10" fill="#C9B98A"/><text x="0" y="40" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="30" fill="#B3261E">R$ ?</text></g>`;
      return notas + `<path d="M -250 -40 L 250 -40 L 220 250 L -220 250 Z" fill="#C99A62" ${contorno}/>` +
        `<path d="M 120 -40 L 250 -40 L 220 250 L 110 250 Z" fill="#A87A45"/>` + `<path d="M -250 -40 L 250 -40 L 220 250 L -220 250 Z" fill="none" ${contorno}/>` +
        `<rect x="-130" y="40" width="260" height="90" rx="12" fill="#fff" stroke="${L}" stroke-width="7"/><text x="0" y="104" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="60" fill="${L}">FIADO</text>`;
    },
  };
  // presente
  D.presente = {
    tipo: 'ar', caixa: [-280, -360, 560, 640],
    svg: () => `<g style="transform: translateY(calc(var(--tampa, 0) * -170px)) rotate(calc(var(--tampa, 0) * -24deg))">` +
        `<rect x="-230" y="-150" width="460" height="100" rx="14" fill="#FF4B6E" ${contorno}/><rect x="-30" y="-150" width="60" height="100" fill="#FFD93D" stroke="${L}" stroke-width="7"/>` +
        `<path d="M 0 -150 C -60 -260 -170 -220 -110 -160 Z M 0 -150 C 60 -260 170 -220 110 -160 Z" fill="#FFD93D" ${contorno}/></g>` +
      `<rect x="-200" y="-50" width="400" height="300" rx="14" fill="#FF6B8A" ${contorno}/><rect x="80" y="-50" width="120" height="300" fill="#E04A6A"/>` +
      `<rect x="-200" y="-50" width="400" height="300" rx="14" fill="none" ${contorno}/><rect x="-30" y="-50" width="60" height="300" fill="#FFD93D" stroke="${L}" stroke-width="7"/>`,
  };
  // boia SOS
  D.sos = {
    tipo: 'ar', caixa: [-300, -300, 600, 600],
    svg(cl) {
      let gomos = ''; for (let i = 0; i < 4; i++) gomos += `<path d="M ${Math.cos(i * Math.PI / 2 + 0.4) * 230} ${Math.sin(i * Math.PI / 2 + 0.4) * 230} A 230 230 0 0 1 ${Math.cos(i * Math.PI / 2 + 1.17) * 230} ${Math.sin(i * Math.PI / 2 + 1.17) * 230} L ${Math.cos(i * Math.PI / 2 + 1.17) * 120} ${Math.sin(i * Math.PI / 2 + 1.17) * 120} A 120 120 0 0 0 ${Math.cos(i * Math.PI / 2 + 0.4) * 120} ${Math.sin(i * Math.PI / 2 + 0.4) * 120} Z" fill="#ffffff"/>`;
      return `<circle r="230" fill="#E8402F" ${contorno}/>` + gomos + `<circle r="230" fill="none" ${contorno}/><circle r="120" fill="#7FD4FF" ${contorno}/>` +
        `<text x="0" y="40" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="110" fill="#ffffff" stroke="${L}" stroke-width="14" paint-order="stroke fill">SOS</text>`;
    },
  };
})(window);
