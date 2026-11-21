/* Estilo Colagem · o plano de tempos da cena (usado pelo motor no navegador e pelo montar.py no Node).
   Normaliza cada peça (quando entra, como entra, quanto dura a entrada) e lista os efeitos sonoros.
   Node: node eventos.js <cena.js>  → imprime {"dur", "fim", "sons": [...], "avisos": [...]} */
(function (raiz) {
  // como cada peça entra, por padrão (os tempos vêm da análise quadro a quadro das referências: 4 a 7 quadros)
  const ENTRA = { foto: 'lado', tv: 'sobe', cartao: 'sobe', etiqueta: 'lado', folha: 'corte', selo: 'bate', carimbo: 'bate',
    lista: 'sobe', pilha: 'cai', ano: 'sobe', seta: 'desenha', circulo: 'desenha', fio: 'desenha', nota: 'sobe', celular: 'sobe', comenta: 'sobe', mapa: 'corte', barras: 'sobe' };
  const DUR = { corte: 0, sobe: 0.2, lado: 0.22, cai: 0.2, bate: 0.14, desenha: 0.3 };
  const SOM = { foto: 'papel', tv: 'papel', cartao: 'papel', etiqueta: 'pop', folha: 'papel', selo: 'impacto', carimbo: 'carimbo',
    lista: 'papel', pilha: 'papel', ano: 'papel', seta: 'caneta', circulo: 'caneta', fio: 'caneta', nota: 'pop', celular: 'deslize', comenta: 'pop', mapa: 'caneta', barras: 'papel' };

  function planejar(C) {
    const avisos = []; const sons = [];
    const cenas = C.cenas || [];
    const fimFala = C.dur;
    const fim = C.cta ? C.cta.fim : C.dur;
    cenas.forEach((c, i) => {
      c.t0 = c.t; c.t1 = i + 1 < cenas.length ? cenas[i + 1].t : (C.cta ? C.cta.t : fimFala);
      if (c.t1 - c.t0 > 4.6) avisos.push(`cena ${i + 1} (${c.t0.toFixed(1)} s) fica ${(c.t1 - c.t0).toFixed(1)} s: nas referências a cena troca a cada ~3 s. Divida em duas.`);
      (c.objetos || []).forEach((o, j) => {
        if (o.t === undefined) o.t = c.t0;
        if (!o.entra) o.entra = (o.tipo === 'foto' || o.tipo === 'folha' || o.tipo === 'tv') && Math.abs(o.t - c.t0) < 0.05 ? 'corte' : (ENTRA[o.tipo] || 'sobe');
        o.de = o.de || 'direita';
        o.d = DUR[o.entra] !== undefined ? DUR[o.entra] : 0.2;
        if (o.tipo === 'seta' || o.tipo === 'circulo' || o.tipo === 'fio') o.d = o.dt || (o.tipo === 'fio' ? 0.45 : 0.3);
        const s = SOM[o.tipo]; if (s && !o.mudo) sons.push({ t: +(o.t).toFixed(3), tipo: (o.entra === 'corte' && s === 'papel') ? 'papel-leve' : s });
        if (o.tipo === 'cartao' && o.numero) {
          o.tnum = o.tnum !== undefined ? o.tnum : o.t + 0.35; o.passo = o.passo || 0.07;
          [...o.numero].forEach((ch, k) => { if (ch.trim()) sons.push({ t: +(o.tnum + k * o.passo).toFixed(3), tipo: 'tecla' }); });
        }
        if (o.tipo === 'lista') (o.itens || []).forEach(it => { if (it.t !== undefined) sons.push({ t: it.t, tipo: 'caneta-curta' }); });
        if (o.tipo === 'pilha') (o.itens || []).forEach((it, k) => { if (it.t === undefined) it.t = o.t + k * 0.32; if (k) sons.push({ t: it.t, tipo: 'papel' }); });
        if (o.tipo === 'tv') (o.imgs || []).forEach((im, k) => { if (k && im.t !== undefined) sons.push({ t: im.t, tipo: 'clique' }); });
        if (o.tipo === 'seta' && o.nota) o.tnota = o.t + o.d + 0.05;
        if (o.tipo === 'barras') (o.itens || []).forEach((it, k) => sons.push({ t: +(it.t !== undefined ? it.t : o.t + 0.25 + k * 0.28).toFixed(3), tipo: 'pop' }));
        if (o.tipo === 'mapa') { (o.pinos || []).forEach(pn => sons.push({ t: pn.t, tipo: 'pop' })); (o.destaques || []).forEach(dq => sons.push({ t: dq.t, tipo: 'papel-leve' })); (o.rotas || []).forEach(r => sons.push({ t: r.t, tipo: 'caneta' })); }
        if (o.tipo === 'ano') { o.tconta = o.t + 0.15; o.dconta = o.dconta || 0.6; }
        if (o.t < c.t0 - 0.01 || o.t > c.t1) avisos.push(`cena ${i + 1}: a peça ${j + 1} (${o.tipo}) entra em ${o.t} s, fora da cena (${c.t0}–${c.t1.toFixed(2)} s).`);
      });
      const entradas = (c.objetos || []).flatMap(o => o.tipo === 'mapa' ? [o.t].concat((o.pinos || []).map(x => x.t), (o.destaques || []).map(x => x.t), (o.zoom || []).map(x => x.t)) : o.tipo === 'ano' ? [o.t, o.tconta + o.dconta] : o.tipo === 'cartao' && o.numero ? [o.t, o.tnum + o.numero.length * o.passo] : [o.t]).concat(c.t0).sort((a, b) => a - b);
      let maior = 0; for (let k = 1; k < entradas.length; k++) maior = Math.max(maior, entradas[k] - entradas[k - 1]);
      maior = Math.max(maior, c.t1 - entradas[entradas.length - 1]);
      if (maior > 2.2) avisos.push(`cena ${i + 1}: ${maior.toFixed(1)} s sem nada novo entrando. Nas referências algo se mexe a cada ~1 s: ponha uma etiqueta, seta, número ou segunda foto.`);
    });
    if (C.cta) {
      if (C.cta.tipo === 'comenta') [...(C.cta.palavra || '')].forEach((ch, k) => sons.push({ t: +(C.cta.t + 0.5 + k * 0.09).toFixed(3), tipo: 'pop' }));
      else { sons.push({ t: C.cta.t, tipo: 'deslize' }); C.cta.clique = C.cta.clique !== undefined ? C.cta.clique : C.cta.t + 1.0; sons.push({ t: C.cta.clique, tipo: 'clique' }); }
    }
    sons.sort((a, b) => a.t - b.t);
    return { dur: C.dur, fim, sons, avisos };
  }
  const api = { planejar, ENTRA, DUR, SOM };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
    if (require.main === module) {
      const fs = require('fs');
      const txt = fs.readFileSync(process.argv[2], 'utf8').trim().replace(/^window\.\w+\s*=\s*/, '').replace(/;\s*$/, '');
      const C = JSON.parse(txt); const r = planejar(C);
      process.stdout.write(JSON.stringify(r, null, 1));
    }
  } else raiz.COLAGEM_PLANO = api;
})(typeof window !== 'undefined' ? window : globalThis);
