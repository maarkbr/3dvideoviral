/* editor-ia — kit de b-roll para cortes verticais de podcast (1080x1920).
 * Ícones SVG chapados (nunca figuras humanas), helpers determinísticos e as entradas/saídas padrão das cenas.
 * Carregado uma vez no <head> do index.html; as sub-composições (compositions/<cena>.html) usam window.BK.
 * Tema do canal: BK.tema({ acento: "#FFB800", handle: "@seucanal" }) logo depois deste arquivo.
 */
(function (g) {
  "use strict";
  const BK = (g.BK = g.BK || {});
  const C = (BK.C = {
    bg: "#0B0B0D", panel: "#16161A", line: "#2A2A30", fg: "#F5F3EE", muted: "#A9A6A0",
    accent: "#FFB800", cn: "#D7261E", star: "#FFD23F", br: "#13A05B", brY: "#FFD23F", brB: "#1E3F8F",
    alert: "#E5202A", ok: "#2DBE60", blue: "#2B7BE4",
  });
  BK.T = { acento: "#FFB800", handle: "" };
  BK.tema = function (o) {
    Object.assign(BK.T, o || {});
    C.accent = BK.T.acento;
    try { document.documentElement.style.setProperty("--acento", BK.T.acento); } catch (e) { /* no DOM yet */ }
  };

  // ---------- determinismo e DOM ----------
  // hash 0..1 determinístico (nunca Math.random: o render precisa repetir quadro a quadro)
  BK.hash = function (n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  BK.el = function (tag, cls, parent, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  };
  BK.esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // largura estimada de um texto em "em" (Anton em caixa alta por padrão; "serifa", "montserrat", "mono"; CJK = 1 em)
  const W_ANTON = { I: 0.27, J: 0.36, L: 0.43, F: 0.44, E: 0.46, T: 0.45, Z: 0.45, P: 0.52, S: 0.51, R: 0.54, B: 0.55, K: 0.55,
    C: 0.53, X: 0.54, Y: 0.52, V: 0.54, D: 0.55, G: 0.55, H: 0.56, N: 0.57, U: 0.56, O: 0.56, Q: 0.57, A: 0.56, M: 0.72, W: 0.8,
    " ": 0.2, "1": 0.36, "?": 0.45, "%": 0.8, "&": 0.6, "$": 0.53 };
  BK.largura = function (txt, fonte) {
    const s = String(txt || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
    let w = 0;
    for (const ch of s) {
      if (/[⺀-鿿가-힯぀-ヿ]/.test(ch)) { w += 1.0; continue; }
      if (fonte === "mono") { w += 0.6; continue; }
      if (fonte === "serifa" || fonte === "montserrat") {
        const big = fonte === "montserrat" ? 1.12 : 1;
        if (ch === " ") w += 0.25 * big;
        else if (/[ilj.,:;!'|]/.test(ch)) w += 0.27 * big;
        else if (/[ftrI]/.test(ch)) w += 0.36 * big;
        else if (/[mw]/.test(ch)) w += 0.76 * big;
        else if (/[MW]/.test(ch)) w += 0.9 * big;
        else if (/[A-Z]/.test(ch)) w += 0.66 * big;
        else w += 0.5 * big;
        continue;
      }
      const u = ch.toUpperCase();
      w += W_ANTON[u] != null ? W_ANTON[u] : /[A-Z0-9]/.test(u) ? 0.53 : /[.,:;!'"\-]/.test(u) ? 0.26 : 0.5;
    }
    return w;
  };
  // tamanho de fonte (px) para o texto caber em `larg` px numa linha (cada linha separada por \n conta sozinha).
  // fonte: "anton" (padrão) | "serifa" | "montserrat" | "mono"; extra: largura fixa a somar, em "em" (ex.: borda do carimbo)
  BK.cabe = function (texto, larg, tam, fonte, extra) {
    const linhas = String(texto || "").replace(/\*/g, "").split("\n");
    if (typeof fonte === "number") {
      const n = Math.max(1, ...linhas.map((l) => l.length));
      return Math.max(24, Math.min(tam, Math.floor(larg / (fonte * n))));
    }
    const em = Math.max(0.01, ...linhas.map((l) => BK.largura(l, fonte || "anton"))) + (extra || 0);
    return Math.max(24, Math.min(tam, Math.floor((larg / em) * 0.97)));
  };
  // nomes de cor em português → hex
  const NOMES = {
    acento: () => BK.T.acento, branco: () => C.fg, preto: () => C.bg, vermelho: () => C.alert, verde: () => C.ok,
    azul: () => C.blue, amarelo: () => C.star, laranja: () => "#F08A24", roxo: () => "#8B5CF6", rosa: () => "#FF4D8D",
    cinza: () => C.muted, china: () => C.cn, brasil: () => C.br,
  };
  BK.cor = function (v, padrao) {
    if (v == null || v === "") return padrao == null ? BK.T.acento : BK.cor(padrao);
    const k = String(v).toLowerCase();
    return NOMES[k] ? NOMES[k]() : v;
  };
  // texto com *ênfase*: "vocês *não* votam" → <em> na cor de destaque. \n quebra linha.
  BK.rich = function (txt, cor) {
    const c = BK.cor(cor, "acento");
    return BK.esc(txt).replace(/\*([^*]+)\*/g, `<em style="font-style:normal;color:${c}">$1</em>`).replace(/\n/g, "<br>");
  };
  // fundos de tela cheia por tema
  const FUNDOS = {
    escuro: ["#24242B", "#121216"], vermelho: ["#4A0D0D", "#200606"], verde: ["#10351F", "#0A1D12"], azul: ["#172238", "#0D1220"],
    amarelo: ["#3A2A00", "#1C1400"], roxo: ["#2A1240", "#140822"], laranja: ["#3D1D05", "#1D0E03"],
  };
  BK.fundo = function (nome, foco) {
    const f = FUNDOS[nome] || FUNDOS.escuro;
    return `radial-gradient(100% 65% at 50% ${foco || 38}%, ${f[0]} 0%, ${f[1]} 58%, #0B0B0D 100%)`;
  };

  function star(cx, cy, r, rot) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = (rot || 0) - Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.382 : r;
      pts.push((cx + rr * Math.cos(a)).toFixed(2) + "," + (cy + rr * Math.sin(a)).toFixed(2));
    }
    return pts.join(" ");
  }
  BK.starPts = star;

  // ---------- ícones (SVG chapado, sem pessoas) ----------
  const I = (BK.icon = {});
  const sq = (w, body, vb) => `<svg viewBox="${vb || "0 0 100 100"}" width="${w}" height="${w}">${body}</svg>`;
  I.flagCN = (w) => {
    const s = w / 30;
    const small = [[10, 2], [12, 4], [12, 7], [10, 9]]
      .map(([x, y]) => `<polygon points="${star(x * s, y * s, s, Math.atan2(5 - y, 5 - x) + Math.PI / 2)}" fill="${C.star}"/>`).join("");
    return `<svg viewBox="0 0 ${30 * s} ${20 * s}" width="${30 * s}" height="${20 * s}"><rect width="${30 * s}" height="${20 * s}" rx="${s * 0.8}" fill="${C.cn}"/><polygon points="${star(5 * s, 5 * s, 3 * s, 0)}" fill="${C.star}"/>${small}</svg>`;
  };
  I.flagBR = (w) => {
    const h = w * 0.7;
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${w * 0.03}" fill="${C.br}"/><polygon points="${w * 0.08},${h / 2} ${w / 2},${h * 0.1} ${w * 0.92},${h / 2} ${w / 2},${h * 0.9}" fill="${C.brY}"/><circle cx="${w / 2}" cy="${h / 2}" r="${h * 0.24}" fill="${C.brB}"/><path d="M ${w / 2 - h * 0.235} ${h / 2 - h * 0.03} Q ${w / 2} ${h / 2 - h * 0.12} ${w / 2 + h * 0.235} ${h / 2 + h * 0.05}" stroke="#fff" stroke-width="${h * 0.045}" fill="none"/></svg>`;
  };
  // bandeiras simples por código: listras (h = horizontais, v = verticais) + casos especiais
  const FLAGS = {
    fr: ["v", ["#0055A4", "#FFFFFF", "#EF4135"]], it: ["v", ["#009246", "#FFFFFF", "#CE2B37"]], mx: ["v", ["#006847", "#FFFFFF", "#CE1126"]],
    ie: ["v", ["#169B62", "#FFFFFF", "#FF883E"]], be: ["v", ["#000000", "#FDDA24", "#EF3340"]], ng: ["v", ["#008751", "#FFFFFF", "#008751"]],
    de: ["h", ["#000000", "#DD0000", "#FFCE00"]], ru: ["h", ["#FFFFFF", "#0039A6", "#D52B1E"]], nl: ["h", ["#AE1C28", "#FFFFFF", "#21468B"]],
    es: ["h", ["#AA151B", "#F1BF00", "#F1BF00", "#AA151B"]], co: ["h", ["#FCD116", "#FCD116", "#003893", "#CE1126"]],
    ua: ["h", ["#0057B7", "#FFD700"]], pl: ["h", ["#FFFFFF", "#DC143C"]], ar: ["h", ["#74ACDF", "#FFFFFF", "#74ACDF"]],
  };
  I.flag = (w, code) => {
    code = String(code || "").toLowerCase();
    if (code === "cn") return I.flagCN(w);
    if (code === "br") return I.flagBR(w);
    const h = Math.round(w * 0.66);
    const r = w * 0.03;
    let body = "";
    if (code === "jp") body = `<rect width="${w}" height="${h}" fill="#FFFFFF"/><circle cx="${w / 2}" cy="${h / 2}" r="${h * 0.3}" fill="#BC002D"/>`;
    else if (code === "us") {
      body = `<rect width="${w}" height="${h}" fill="#FFFFFF"/>`;
      for (let i = 0; i < 7; i++) body += `<rect y="${(2 * i * h) / 13}" width="${w}" height="${h / 13 + 0.3}" fill="#B22234"/>`;
      body += `<rect width="${w * 0.42}" height="${(h * 7) / 13}" fill="#3C3B6E"/>`;
      for (let r2 = 0; r2 < 4; r2++) for (let c2 = 0; c2 < 5; c2++) body += `<circle cx="${w * (0.05 + c2 * 0.08)}" cy="${h * (0.07 + r2 * 0.13)}" r="${w * 0.012}" fill="#FFFFFF"/>`;
    } else if (code === "pt") body = `<rect width="${w}" height="${h}" fill="#FF0000"/><rect width="${w * 0.4}" height="${h}" fill="#006600"/><circle cx="${w * 0.4}" cy="${h / 2}" r="${h * 0.2}" fill="#FFCC00"/>`;
    else if (FLAGS[code]) {
      const [dir, cols] = FLAGS[code];
      cols.forEach((c, i) => {
        body += dir === "v" ? `<rect x="${(i * w) / cols.length}" width="${w / cols.length + 0.5}" height="${h}" fill="${c}"/>`
          : `<rect y="${(i * h) / cols.length}" width="${w}" height="${h / cols.length + 0.5}" fill="${c}"/>`;
      });
      if (code === "ar") body += `<circle cx="${w / 2}" cy="${h / 2}" r="${h * 0.1}" fill="#F6B40E"/>`;
    } else body = `<rect width="${w}" height="${h}" fill="${C.line}"/><path d="M${w * 0.2} ${h * 0.5} H${w * 0.8}" stroke="${C.muted}" stroke-width="${h * 0.08}"/>`;
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><clipPath id="fc${code}${w}"><rect width="${w}" height="${h}" rx="${r}"/></clipPath><g clip-path="url(#fc${code}${w})">${body}</g></svg>`;
  };
  // urna eletrônica (corpo, tela, teclado, três teclas)
  I.urna = (w, opts) => {
    const label = !(opts && opts.label === false);
    const h = w * 0.62;
    let keys = "";
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      if (r === 3 && c !== 1) continue;
      keys += `<rect x="${w * (0.6 + c * 0.11)}" y="${h * (0.17 + r * 0.13)}" width="${w * 0.085}" height="${h * 0.1}" rx="${w * 0.012}" fill="#22252B"/>`;
    }
    const act = [["#F2F0EA"], ["#F08A24"], ["#2DBE60"]]
      .map(([f], i) => `<rect class="urna-key-${i}" x="${w * (0.58 + i * 0.12)}" y="${h * 0.73}" width="${w * 0.105}" height="${h * 0.12}" rx="${w * 0.012}" fill="${f}"/>`).join("");
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="bk-urna"><rect x="0" y="0" width="${w}" height="${h}" rx="${w * 0.04}" fill="#D9D6CF"/><rect x="${w * 0.03}" y="${h * 0.05}" width="${w * 0.94}" height="${h * 0.9}" rx="${w * 0.03}" fill="#CFCBC2"/><rect x="${w * 0.06}" y="${h * 0.12}" width="${w * 0.46}" height="${h * 0.62}" rx="${w * 0.015}" fill="#2E3B33"/><rect x="${w * 0.555}" y="${h * 0.12}" width="${w * 0.4}" height="${h * 0.76}" rx="${w * 0.02}" fill="#B9B4AA"/>${keys}${act}${label ? `<rect x="${w * 0.08}" y="${h * 0.84}" width="${w * 0.3}" height="${h * 0.05}" rx="${w * 0.01}" fill="#9A968E"/>` : ""}</svg>`;
  };
  I.cross = (w, color) => sq(w, `<path class="draw" d="M 18 18 L 82 82" stroke="${color || C.alert}" stroke-width="15" stroke-linecap="round" fill="none"/><path class="draw" d="M 82 18 L 18 82" stroke="${color || C.alert}" stroke-width="15" stroke-linecap="round" fill="none"/>`);
  I.check = (w, color) => sq(w, `<path class="draw" d="M 16 54 L 40 78 L 86 24" stroke="${color || C.ok}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`);
  I.crown = (w) => `<svg viewBox="0 0 120 90" width="${w}" height="${w * 0.75}"><path d="M8 78 L14 22 L42 50 L60 10 L78 50 L106 22 L112 78 Z" fill="${C.accent}" stroke="#7A5200" stroke-width="4" stroke-linejoin="round"/><rect x="8" y="74" width="104" height="12" rx="3" fill="#E59E00"/><circle cx="60" cy="10" r="7" fill="${C.cn}"/><circle cx="14" cy="22" r="6" fill="${C.cn}"/><circle cx="106" cy="22" r="6" fill="${C.cn}"/></svg>`;
  I.lock = (w) => `<svg viewBox="0 0 100 120" width="${w}" height="${w * 1.2}"><path d="M28 56 V38 a22 22 0 0 1 44 0 V56" stroke="#C9C5BC" stroke-width="12" fill="none"/><rect x="14" y="54" width="72" height="58" rx="10" fill="#8E8A82"/><circle cx="50" cy="78" r="8" fill="#2A2A30"/><rect x="46" y="80" width="8" height="18" rx="3" fill="#2A2A30"/></svg>`;
  I.question = (w, color) => `<svg viewBox="0 0 60 100" width="${w * 0.6}" height="${w}"><text x="30" y="88" text-anchor="middle" font-family="LT Anton, sans-serif" font-size="100" fill="${color || C.accent}" stroke="#000" stroke-width="5" paint-order="stroke">?</text></svg>`;
  I.exclamation = (w, color) => sq(w, `<circle cx="50" cy="50" r="44" fill="${color || C.alert}"/><rect x="44" y="20" width="12" height="40" rx="6" fill="#F5F3EE"/><circle cx="50" cy="74" r="7" fill="#F5F3EE"/>`);
  I.bottle = (w) => `<svg viewBox="0 0 60 160" width="${w * 0.375}" height="${w}"><path d="M24 4 H36 V40 C36 52 52 58 52 78 V148 a8 8 0 0 1 -8 8 H16 a8 8 0 0 1 -8 -8 V78 C8 58 24 52 24 40 Z" fill="#2F7A3E"/><rect x="22" y="2" width="16" height="10" rx="2" fill="#C9A227"/><rect x="12" y="92" width="36" height="34" rx="4" fill="#F1E6C8"/><path d="M18 30 V140" stroke="#ffffff55" stroke-width="5" stroke-linecap="round"/></svg>`;
  I.beer = (w) => `<svg viewBox="0 0 120 130" width="${w}" height="${w * 1.08}"><path d="M86 46 h12 a14 14 0 0 1 14 14 v22 a14 14 0 0 1 -14 14 h-12" stroke="#E8E4DA" stroke-width="10" fill="none"/><rect x="10" y="34" width="80" height="90" rx="10" fill="#F2A900"/><rect x="10" y="34" width="80" height="90" rx="10" fill="none" stroke="#E8E4DA" stroke-width="6"/><path d="M26 56 V108 M44 56 V108 M62 56 V108" stroke="#FFD25C" stroke-width="6" stroke-linecap="round"/><circle cx="24" cy="32" r="16" fill="#FFF8E7"/><circle cx="48" cy="24" r="19" fill="#FFF8E7"/><circle cx="74" cy="30" r="16" fill="#FFF8E7"/></svg>`;
  I.bulb = (w, on) => `<svg viewBox="0 0 100 140" width="${w * 0.714}" height="${w}"><circle cx="50" cy="52" r="38" fill="${on !== false ? "#FFD84D" : "#55524C"}" stroke="${on !== false ? "#FFF2B0" : "#77736B"}" stroke-width="5"/><path d="M36 86 h28 v14 h-28 Z" fill="#B7B2A8"/><rect x="34" y="102" width="32" height="8" rx="3" fill="#8E8A82"/><rect x="38" y="112" width="24" height="8" rx="3" fill="#8E8A82"/><path d="M42 74 L50 52 L58 74" stroke="${on !== false ? "#C98A00" : "#3A3833"}" stroke-width="4" fill="none"/></svg>`;
  I.warning = (w) => `<svg viewBox="0 0 120 106" width="${w}" height="${w * 0.88}"><path d="M60 6 L114 100 H6 Z" fill="${C.accent}" stroke="#111" stroke-width="8" stroke-linejoin="round"/><rect x="54" y="36" width="12" height="36" rx="5" fill="#111"/><circle cx="60" cy="85" r="7" fill="#111"/></svg>`;
  I.trophy = (w) => `<svg viewBox="0 0 120 130" width="${w}" height="${w * 1.08}"><path d="M30 10 H90 V44 a30 30 0 0 1 -60 0 Z" fill="${C.accent}"/><path d="M30 18 H12 a18 18 0 0 0 18 28 M90 18 H108 a18 18 0 0 1 -18 28" stroke="${C.accent}" stroke-width="8" fill="none"/><rect x="52" y="74" width="16" height="22" fill="#E59E00"/><rect x="32" y="96" width="56" height="16" rx="4" fill="#B57D00"/><rect x="24" y="112" width="72" height="12" rx="4" fill="#8A5F00"/></svg>`;
  I.plane = (w) => sq(w, `<path d="M50 6 C55 6 57 14 57 22 V40 L94 60 V70 L57 58 V80 L70 90 V96 L50 90 L30 96 V90 L43 80 V58 L6 70 V60 L43 40 V22 C43 14 45 6 50 6 Z" fill="#F5F3EE"/>`);
  I.ballot = (w, mark) => `<svg viewBox="0 0 60 80" width="${w * 0.75}" height="${w}"><rect x="2" y="2" width="56" height="76" rx="5" fill="#F5F3EE"/><rect x="10" y="12" width="40" height="5" rx="2" fill="#C9C5BC"/><rect x="10" y="22" width="30" height="5" rx="2" fill="#C9C5BC"/><rect x="10" y="40" width="16" height="16" rx="3" fill="none" stroke="#2A2A30" stroke-width="3"/>${mark ? `<path d="M12 47 L18 54 L28 40" stroke="${mark}" stroke-width="5" fill="none" stroke-linecap="round"/>` : ""}<rect x="30" y="44" width="20" height="5" rx="2" fill="#C9C5BC"/></svg>`;
  I.clownNose = (w) => sq(w, `<circle cx="50" cy="50" r="44" fill="#E5202A"/><circle cx="36" cy="34" r="12" fill="#FF8A8A"/>`);
  I.partyHat = (w) => `<svg viewBox="0 0 100 120" width="${w}" height="${w * 1.2}"><path d="M50 8 L90 112 H10 Z" fill="#2B7BE4"/><path d="M50 8 L62 40 L38 40 Z M30 64 H70 L76 80 H24 Z" fill="${C.accent}"/><path d="M18 96 H82 L86 106 H14 Z" fill="#E5202A"/><circle cx="50" cy="10" r="10" fill="#E5202A"/></svg>`;
  I.bill = (w) => `<svg viewBox="0 0 160 76" width="${w}" height="${w * 0.475}"><rect x="2" y="2" width="156" height="72" rx="8" fill="#17633A"/><rect x="10" y="10" width="140" height="56" rx="6" fill="none" stroke="#9FE3B8" stroke-width="3"/><circle cx="80" cy="38" r="18" fill="#E9FBEF"/><path d="M86 30 C83 26 74 26 73 31 C72 36 88 36 87 43 C86 49 76 50 72 45 M80 24 V52" stroke="#0E3D21" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="18" y="20" width="26" height="8" rx="3" fill="#9FE3B8"/><rect x="116" y="48" width="26" height="8" rx="3" fill="#9FE3B8"/></svg>`;
  I.pin = (w, color) => `<svg viewBox="0 0 60 80" width="${w * 0.75}" height="${w}"><path d="M30 78 C30 78 4 46 4 28 a26 26 0 0 1 52 0 C56 46 30 78 30 78 Z" fill="${color || C.alert}"/><circle cx="30" cy="28" r="10" fill="#fff"/></svg>`;
  I.bubble = (w, color, mark) => {
    const ink = ["#F5F3EE", "#FFB800", "#FFD23F"].includes(color || "#F5F3EE") ? "#0B0B0D" : "#FFFFFF";
    const m = mark === "!" ? `<rect x="45" y="14" width="10" height="28" rx="5" fill="${ink}"/><circle cx="50" cy="51" r="6" fill="${ink}"/>`
      : mark === "?" ? `<path d="M38 26 a12 12 0 1 1 18 10 c-5 3 -6 5 -6 9" stroke="${ink}" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="50" cy="53" r="5.5" fill="${ink}"/>`
      : mark ? `<circle cx="34" cy="36" r="6" fill="${ink}"/><circle cx="50" cy="36" r="6" fill="${ink}"/><circle cx="66" cy="36" r="6" fill="${ink}"/>` : "";
    return `<svg viewBox="0 0 100 86" width="${w}" height="${w * 0.86}"><path d="M14 6 H86 a10 10 0 0 1 10 10 V52 a10 10 0 0 1 -10 10 H40 L20 80 L24 62 H14 a10 10 0 0 1 -10 -10 V16 a10 10 0 0 1 10 -10 Z" fill="${color || "#F5F3EE"}"/>${m}</svg>`;
  };
  I.search = (w) => sq(w, `<circle cx="42" cy="42" r="28" stroke="${C.fg}" stroke-width="10" fill="none"/><path d="M62 62 L88 88" stroke="${C.fg}" stroke-width="12" stroke-linecap="round"/>`);
  I.spark = (w) => sq(w, `<path d="M50 4 C54 34 66 46 96 50 C66 54 54 66 50 96 C46 66 34 54 4 50 C34 46 46 34 50 4 Z" fill="${C.accent}"/>`);
  I.star = (w, color) => sq(w, `<polygon points="${star(50, 53, 46, 0)}" fill="${color || C.accent}"/>`);
  I.moneybag = (w) => sq(w, `<path d="M36 10 H64 L58 26 H42 Z" fill="#B8861B"/><path d="M40 26 H60 L56 32 H44 Z" fill="#8A6212"/><path d="M44 32 C16 40 8 66 14 80 C20 94 36 96 50 96 C64 96 80 94 86 80 C92 66 84 40 56 32 Z" fill="#E0B84A"/><path d="M60 54 C57 48 44 48 43 55 C42 62 58 61 58 69 C58 76 45 78 40 72 M50 44 V82" stroke="#6B4E00" stroke-width="6" fill="none" stroke-linecap="round"/>`);
  I.coin = (w) => sq(w, `<circle cx="50" cy="50" r="46" fill="#C9961E"/><circle cx="50" cy="50" r="38" fill="#F2C94C"/><circle cx="50" cy="50" r="31" fill="none" stroke="#C9961E" stroke-width="4"/><path d="M58 40 C55 35 44 35 43 41 C42 47 57 47 57 54 C57 61 45 62 41 57 M50 31 V66" stroke="#7A5600" stroke-width="6" fill="none" stroke-linecap="round"/>`);
  I.chartUp = (w) => sq(w, `<path d="M10 90 H92 M10 90 V10" stroke="${C.muted}" stroke-width="5" stroke-linecap="round"/><rect x="18" y="62" width="14" height="26" rx="2" fill="${C.ok}" opacity="0.5"/><rect x="38" y="48" width="14" height="40" rx="2" fill="${C.ok}" opacity="0.7"/><rect x="58" y="34" width="14" height="54" rx="2" fill="${C.ok}" opacity="0.85"/><path class="draw" d="M16 56 L40 40 L58 46 L84 18" stroke="${C.ok}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M68 15 L88 13 L86 33" stroke="${C.ok}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
  I.chartDown = (w) => sq(w, `<path d="M10 90 H92 M10 90 V10" stroke="${C.muted}" stroke-width="5" stroke-linecap="round"/><rect x="18" y="30" width="14" height="58" rx="2" fill="${C.alert}" opacity="0.85"/><rect x="38" y="46" width="14" height="42" rx="2" fill="${C.alert}" opacity="0.7"/><rect x="58" y="62" width="14" height="26" rx="2" fill="${C.alert}" opacity="0.5"/><path class="draw" d="M16 22 L40 40 L58 34 L84 64" stroke="${C.alert}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M66 68 L86 68 L86 48" stroke="${C.alert}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
  I.barChart = (w) => sq(w, `<path d="M8 92 H94" stroke="${C.muted}" stroke-width="5" stroke-linecap="round"/><rect class="bk-bar" x="14" y="58" width="14" height="32" rx="3" fill="${C.accent}" opacity="0.55"/><rect class="bk-bar" x="34" y="40" width="14" height="50" rx="3" fill="${C.accent}" opacity="0.7"/><rect class="bk-bar" x="54" y="50" width="14" height="40" rx="3" fill="${C.accent}" opacity="0.85"/><rect class="bk-bar" x="74" y="18" width="14" height="72" rx="3" fill="${C.accent}"/>`);
  I.rocket = (w) => sq(w, `<path d="M50 6 C66 18 72 38 70 62 H30 C28 38 34 18 50 6 Z" fill="#F5F3EE"/><circle cx="50" cy="36" r="9" fill="${C.blue}" stroke="#1B4F96" stroke-width="3"/><path d="M30 46 L14 70 L30 66 Z M70 46 L86 70 L70 66 Z" fill="${C.alert}"/><path d="M38 62 H62 L58 72 H42 Z" fill="${C.muted}"/><path d="M42 72 C44 84 50 96 50 96 C50 96 56 84 58 72 Z" fill="${C.accent}"/><path d="M46 72 C47 80 50 87 50 87 C50 87 53 80 54 72 Z" fill="#FFF2B0"/>`);
  I.alarm = (w) => sq(w, `<circle cx="24" cy="20" r="12" fill="${C.alert}"/><circle cx="76" cy="20" r="12" fill="${C.alert}"/><path d="M28 86 L20 96 M72 86 L80 96" stroke="${C.muted}" stroke-width="6" stroke-linecap="round"/><circle cx="50" cy="54" r="38" fill="${C.alert}"/><circle cx="50" cy="54" r="30" fill="#F5F3EE"/><path class="bk-ponteiro" d="M50 54 V32 M50 54 L64 62" stroke="#0B0B0D" stroke-width="6" stroke-linecap="round"/><circle cx="50" cy="54" r="4" fill="#0B0B0D"/>`);
  I.clock = (w) => sq(w, `<circle cx="50" cy="50" r="44" fill="#F5F3EE" stroke="${C.muted}" stroke-width="6"/><path class="bk-ponteiro" d="M50 50 V24 M50 50 L68 60" stroke="#0B0B0D" stroke-width="7" stroke-linecap="round"/><circle cx="50" cy="50" r="5" fill="${C.accent}"/>`);
  I.calendar = (w) => {
    let g = "";
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) g += `<rect x="${18 + c * 17}" y="${46 + r * 14}" width="12" height="9" rx="2" fill="${r === 1 && c === 2 ? C.accent : "#C9C5BC"}"/>`;
    return sq(w, `<rect x="10" y="16" width="80" height="76" rx="10" fill="#F5F3EE"/><path d="M10 26 a10 10 0 0 1 10 -10 H80 a10 10 0 0 1 10 10 V38 H10 Z" fill="${C.alert}"/><rect x="26" y="8" width="8" height="18" rx="4" fill="${C.muted}"/><rect x="66" y="8" width="8" height="18" rx="4" fill="${C.muted}"/>${g}`);
  };
  I.phone = (w) => `<svg viewBox="0 0 60 100" width="${w * 0.6}" height="${w}"><rect x="2" y="2" width="56" height="96" rx="10" fill="#22252B"/><rect x="6" y="10" width="48" height="78" rx="4" fill="${C.blue}"/><rect x="22" y="4" width="16" height="4" rx="2" fill="#0B0B0D"/><circle cx="30" cy="93" r="3" fill="#55524C"/></svg>`;
  I.laptop = (w) => `<svg viewBox="0 0 120 80" width="${w}" height="${w * 0.667}"><rect x="16" y="4" width="88" height="58" rx="5" fill="#22252B"/><rect x="21" y="9" width="78" height="48" rx="2" fill="${C.blue}"/><path d="M4 66 H116 L110 76 H10 Z" fill="${C.muted}"/><rect x="50" y="66" width="20" height="4" rx="2" fill="#77736B"/></svg>`;
  I.house = (w) => sq(w, `<path d="M20 46 V92 H80 V46 L50 20 Z" fill="#F5F3EE"/><path d="M10 48 L50 12 L90 48" stroke="${C.alert}" stroke-width="10" fill="none" stroke-linejoin="round" stroke-linecap="round"/><rect x="42" y="62" width="16" height="30" rx="2" fill="#8E5A2B"/><rect x="26" y="54" width="12" height="12" rx="2" fill="${C.blue}"/><rect x="62" y="54" width="12" height="12" rx="2" fill="${C.blue}"/>`);
  I.building = (w) => {
    let g = "";
    for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) g += `<rect x="${16 + c * 20}" y="${14 + r * 12}" width="10" height="7" rx="1" fill="${BK.hash(r * 3 + c) > 0.45 ? "#FFD84D" : "#55524C"}"/>`;
    return `<svg viewBox="0 0 80 100" width="${w * 0.8}" height="${w}"><rect x="8" y="6" width="64" height="92" rx="4" fill="#3A3F4A"/>${g}<rect x="32" y="84" width="16" height="14" fill="#22252B"/></svg>`;
  };
  I.car = (w) => `<svg viewBox="0 0 120 70" width="${w}" height="${w * 0.583}"><path d="M8 44 C8 36 14 32 22 30 L36 14 C40 10 44 8 50 8 H76 C82 8 86 10 90 14 L102 30 C110 32 114 36 114 44 V52 H8 Z" fill="${C.alert}"/><path d="M42 16 H60 V30 H32 Z M66 16 H80 L92 30 H66 Z" fill="#BFE3FF"/><circle cx="32" cy="54" r="11" fill="#22252B"/><circle cx="32" cy="54" r="5" fill="${C.muted}"/><circle cx="90" cy="54" r="11" fill="#22252B"/><circle cx="90" cy="54" r="5" fill="${C.muted}"/></svg>`;
  I.heart = (w, color) => sq(w, `<path d="M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C39 8 46 13 50 20 C54 13 61 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88 Z" fill="${color || C.alert}"/>`);
  I.fire = (w) => sq(w, `<path d="M50 4 C56 22 74 30 74 56 C74 78 62 94 50 94 C36 94 24 82 24 62 C24 46 34 38 36 26 C42 34 44 40 44 46 C52 38 54 22 50 4 Z" fill="#F08A24"/><path d="M50 50 C54 60 62 64 62 76 C62 86 56 92 50 92 C43 92 38 86 38 78 C38 70 44 66 46 58 C48 62 50 64 50 66 C52 62 52 56 50 50 Z" fill="#FFD84D"/>`);
  I.bolt = (w) => sq(w, `<path d="M58 4 L18 58 H46 L38 96 L82 38 H54 Z" fill="${C.star}" stroke="#7A5200" stroke-width="3" stroke-linejoin="round"/>`);
  I.gift = (w) => sq(w, `<rect x="10" y="36" width="80" height="22" rx="4" fill="${C.alert}"/><rect x="16" y="56" width="68" height="38" rx="4" fill="${C.cn}"/><rect x="44" y="36" width="12" height="58" fill="${C.star}"/><path d="M50 36 C40 18 22 22 26 32 C28 38 40 36 50 36 C60 36 72 38 74 32 C78 22 60 18 50 36 Z" fill="${C.star}"/>`);
  I.target = (w) => sq(w, `<circle cx="46" cy="54" r="40" fill="${C.alert}"/><circle cx="46" cy="54" r="30" fill="#F5F3EE"/><circle cx="46" cy="54" r="20" fill="${C.alert}"/><circle cx="46" cy="54" r="10" fill="#F5F3EE"/><path d="M46 54 L84 16" stroke="#22252B" stroke-width="5" stroke-linecap="round"/><path d="M80 8 L92 8 L92 20 Z" fill="${C.accent}"/>`);
  I.shield = (w) => sq(w, `<path d="M50 6 L86 18 V46 C86 70 70 86 50 94 C30 86 14 70 14 46 V18 Z" fill="${C.blue}"/><path d="M50 14 L78 24 V46 C78 64 66 78 50 85 Z" fill="#1B4F96"/><path class="draw" d="M32 50 L45 63 L70 36" stroke="#F5F3EE" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
  I.key = (w) => sq(w, `<circle cx="30" cy="50" r="18" fill="none" stroke="${C.accent}" stroke-width="10"/><path d="M48 50 H92 M78 50 V64 M88 50 V60" stroke="${C.accent}" stroke-width="10" stroke-linecap="round"/>`);
  I.mic = (w) => sq(w, `<rect x="34" y="6" width="32" height="54" rx="16" fill="#3A3F4A"/><path d="M38 20 H62 M38 30 H62 M38 40 H62" stroke="#6B7080" stroke-width="3"/><path d="M24 44 C24 62 36 72 50 72 C64 72 76 62 76 44" stroke="${C.muted}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M50 72 V88 M34 92 H66" stroke="${C.muted}" stroke-width="6" stroke-linecap="round"/>`);
  I.book = (w) => sq(w, `<path d="M50 22 C38 14 22 14 8 18 V84 C22 80 38 80 50 88 Z" fill="#F5F3EE"/><path d="M50 22 C62 14 78 14 92 18 V84 C78 80 62 80 50 88 Z" fill="#E8E4DA"/><path d="M50 22 V88" stroke="${C.muted}" stroke-width="3"/><path d="M16 32 H40 M16 44 H40 M16 56 H36 M60 32 H84 M60 44 H84 M60 56 H80" stroke="#C9C5BC" stroke-width="4" stroke-linecap="round"/>`);
  I.gradCap = (w) => sq(w, `<path d="M24 46 V66 C24 74 36 80 50 80 C64 80 76 74 76 66 V46 L50 58 Z" fill="#3A3F4A"/><path d="M50 14 L96 36 L50 58 L4 36 Z" fill="#22252B"/><path d="M88 40 V66" stroke="${C.accent}" stroke-width="4"/><circle cx="88" cy="70" r="5" fill="${C.accent}"/>`);
  I.briefcase = (w) => sq(w, `<rect x="34" y="14" width="32" height="16" rx="5" fill="none" stroke="#6B4A2A" stroke-width="7"/><rect x="8" y="28" width="84" height="62" rx="9" fill="#8E5A2B"/><rect x="8" y="48" width="84" height="8" fill="#6B4A2A"/><rect x="44" y="44" width="12" height="16" rx="2" fill="${C.star}"/>`);
  I.dumbbell = (w) => sq(w, `<rect x="30" y="44" width="40" height="12" rx="4" fill="${C.muted}"/><rect x="14" y="28" width="14" height="44" rx="4" fill="#3A3F4A"/><rect x="4" y="36" width="10" height="28" rx="3" fill="#3A3F4A"/><rect x="72" y="28" width="14" height="44" rx="4" fill="#3A3F4A"/><rect x="86" y="36" width="10" height="28" rx="3" fill="#3A3F4A"/>`);
  I.globe = (w) => sq(w, `<circle cx="50" cy="50" r="42" fill="${C.blue}"/><path d="M30 26 C40 30 36 40 44 44 C52 48 48 58 40 62 C34 66 30 60 24 64 M62 16 C58 26 66 30 72 34 C80 38 86 34 90 44 M58 72 C64 66 74 70 78 78" stroke="${C.br}" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="50" cy="50" r="42" fill="none" stroke="#1B4F96" stroke-width="4"/>`);
  I.megaphone = (w) => sq(w, `<path d="M14 40 H30 L74 16 V84 L30 60 H14 Z" fill="${C.accent}"/><rect x="8" y="38" width="12" height="24" rx="3" fill="#E59E00"/><path d="M30 60 L36 84 H48 L42 62 Z" fill="${C.muted}"/><path d="M82 36 C88 42 88 58 82 64 M88 26 C98 36 98 64 88 74" stroke="#F5F3EE" stroke-width="5" fill="none" stroke-linecap="round"/>`);
  I.envelope = (w) => sq(w, `<rect x="6" y="20" width="88" height="62" rx="8" fill="#F5F3EE"/><path d="M8 24 L50 56 L92 24" stroke="#C9C5BC" stroke-width="6" fill="none" stroke-linejoin="round"/>`);
  I.cart = (w) => sq(w, `<path d="M6 16 H20 L32 66 H80 L90 30 H26" stroke="#F5F3EE" stroke-width="7" fill="none" stroke-linejoin="round" stroke-linecap="round"/><circle cx="38" cy="82" r="8" fill="#F5F3EE"/><circle cx="74" cy="82" r="8" fill="#F5F3EE"/>`);
  I.pill = (w) => sq(w, `<g transform="rotate(-35 50 50)"><rect x="12" y="32" width="76" height="36" rx="18" fill="#F5F3EE"/><path d="M50 32 H70 A18 18 0 0 1 70 68 H50 Z" fill="${C.alert}"/></g>`);
  I.scale = (w) => sq(w, `<path d="M50 10 V86 M28 92 H72" stroke="#C9A227" stroke-width="7" stroke-linecap="round"/><path d="M14 26 H86" stroke="#C9A227" stroke-width="6" stroke-linecap="round"/><path d="M14 26 L4 54 M14 26 L24 54 M86 26 L76 54 M86 26 L96 54" stroke="#C9A227" stroke-width="3"/><path d="M2 54 C2 64 26 64 26 54 Z M74 54 C74 64 98 64 98 54 Z" fill="#E0B84A"/><circle cx="50" cy="10" r="6" fill="#E0B84A"/>`);
  I.gavel = (w) => sq(w, `<g transform="rotate(-40 50 50)"><rect x="26" y="20" width="44" height="22" rx="5" fill="#8E5A2B"/><rect x="20" y="16" width="10" height="30" rx="3" fill="#6B4A2A"/><rect x="66" y="16" width="10" height="30" rx="3" fill="#6B4A2A"/><rect x="44" y="42" width="9" height="46" rx="4" fill="#A0703C"/></g><rect x="50" y="82" width="44" height="12" rx="4" fill="#6B4A2A"/>`);
  I.play = (w) => sq(w, `<rect x="6" y="18" width="88" height="64" rx="18" fill="#22252B" stroke="${C.line}" stroke-width="3"/><path d="M42 36 L66 50 L42 64 Z" fill="${C.accent}"/>`);
  I.percent = (w) => sq(w, `<circle cx="50" cy="50" r="44" fill="${C.accent}"/><path d="M30 72 L70 28" stroke="#0B0B0D" stroke-width="8" stroke-linecap="round"/><circle cx="34" cy="34" r="8" fill="none" stroke="#0B0B0D" stroke-width="6"/><circle cx="66" cy="66" r="8" fill="none" stroke="#0B0B0D" stroke-width="6"/>`);
  I.arrowUp = (w, color) => sq(w, `<path d="M50 6 L90 50 H64 V94 H36 V50 H10 Z" fill="${color || C.ok}"/>`);
  I.arrowDown = (w, color) => sq(w, `<path d="M50 94 L90 50 H64 V6 H36 V50 H10 Z" fill="${color || C.alert}"/>`);
  I.hourglass = (w) => sq(w, `<path d="M28 12 C28 34 46 42 46 50 C46 58 28 66 28 88 H72 C72 66 54 58 54 50 C54 42 72 34 72 12 Z" fill="#BFE3FF" fill-opacity="0.35" stroke="${C.muted}" stroke-width="3"/><path d="M36 22 H64 C62 34 52 40 50 46 C48 40 38 34 36 22 Z M34 86 C36 74 46 70 50 64 C54 70 64 74 66 86 Z" fill="#F2C94C"/><path d="M22 8 H78 M22 92 H78" stroke="#8E5A2B" stroke-width="8" stroke-linecap="round"/>`);
  I.battery = (w, full) => sq(w, `<rect x="6" y="26" width="80" height="48" rx="8" fill="none" stroke="#F5F3EE" stroke-width="6"/><rect x="88" y="40" width="8" height="20" rx="3" fill="#F5F3EE"/><rect class="bk-carga" x="14" y="34" width="${full ? 64 : 16}" height="32" rx="4" fill="${full ? C.ok : C.alert}"/>`);
  I.medal = (w) => sq(w, `<path d="M30 6 H46 L56 40 H40 Z" fill="${C.blue}"/><path d="M70 6 H54 L44 40 H60 Z" fill="${C.alert}"/><circle cx="50" cy="64" r="28" fill="#F2C94C" stroke="#C9961E" stroke-width="6"/><polygon points="${star(50, 65, 14, 0)}" fill="#C9961E"/>`);
  I.token = (w) => `<div style="width:${w}px;height:${w}px;border-radius:50%;background:${C.accent};box-shadow:0 0 0 ${w * 0.06}px #0B0B0D,0 14px 26px rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center">${I.star(w * 0.62, C.cn)}</div>`;

  // nome em português (ou em inglês) → SVG. "bandeira-xx" = bandeira pelo código do país.
  const ALIAS = {
    "bandeira-china": "flagCN", china: "flagCN", "bandeira-brasil": "flagBR", brasil: "flagBR", urna: "urna",
    x: "cross", xis: "cross", errado: "cross", check: "check", certo: "check", ok: "check", coroa: "crown", cadeado: "lock",
    interrogacao: "question", pergunta: "question", exclamacao: "exclamation", garrafa: "bottle", cerveja: "beer", copo: "beer",
    lampada: "bulb", ideia: "bulb", alerta: "warning", perigo: "warning", trofeu: "trophy", aviao: "plane", cedula: "ballot", voto: "ballot",
    "nariz-palhaco": "clownNose", "chapeu-festa": "partyHat", dinheiro: "bill", nota: "bill", pino: "pin", local: "pin", balao: "bubble",
    lupa: "search", busca: "search", brilho: "spark", estrela: "star", "saco-dinheiro": "moneybag", moeda: "coin",
    "grafico-subindo": "chartUp", "grafico-caindo": "chartDown", grafico: "barChart", barras: "barChart", foguete: "rocket",
    despertador: "alarm", relogio: "clock", calendario: "calendar", celular: "phone", notebook: "laptop", computador: "laptop",
    casa: "house", predio: "building", empresa: "building", carro: "car", coracao: "heart", fogo: "fire", raio: "bolt", presente: "gift",
    alvo: "target", meta: "target", escudo: "shield", seguranca: "shield", chave: "key", microfone: "mic", podcast: "mic", livro: "book",
    formatura: "gradCap", faculdade: "gradCap", maleta: "briefcase", trabalho: "briefcase", haltere: "dumbbell", academia: "dumbbell",
    globo: "globe", mundo: "globe", megafone: "megaphone", email: "envelope", carta: "envelope", carrinho: "cart", compras: "cart",
    remedio: "pill", balanca: "scale", justica: "scale", martelo: "gavel", lei: "gavel", play: "play", video: "play", porcentagem: "percent",
    "seta-cima": "arrowUp", "seta-baixo": "arrowDown", ampulheta: "hourglass", tempo: "hourglass", bateria: "battery", medalha: "medal", ficha: "token",
  };
  BK.icones = () => Object.keys(ALIAS).concat(["bandeira-<codigo>", "lampada-apagada", "bateria-cheia", "bateria-fraca"]);
  BK.icone = function (nome, w, o) {
    o = o || {};
    const n = String(nome || "").toLowerCase().trim();
    if (n.startsWith("bandeira-") && !ALIAS[n]) return I.flag(w, n.slice(9));
    if (n === "lampada-apagada") return I.bulb(w, false);
    if (n === "bateria-cheia") return I.battery(w, true);
    if (n === "bateria-fraca") return I.battery(w, false);
    const fn = I[ALIAS[n] || n];
    if (!fn) {
      console.warn("[br-kit] ícone desconhecido: " + nome);
      return I.question(w, C.muted);
    }
    if (fn === I.urna) return fn(w, o);
    if (fn === I.bulb) return fn(w, o.acesa);
    if (fn === I.ballot) return fn(w, o.marca);
    if (fn === I.bubble) return fn(w, BK.cor(o.cor, "branco"), o.marca);
    return fn(w, o.cor ? BK.cor(o.cor) : undefined);
  };

  // ---------- carimbo, glitch, entradas ----------
  BK.stamp = function (parent, text, color, size) {
    const s = BK.el("div", "bk-stamp", parent);
    s.setAttribute("data-layout-allow-overlap", "");
    s.style.setProperty("--c", BK.cor(color, "vermelho"));
    s.style.fontSize = (size || 120) + "px";
    BK.el("span", "", s, BK.esc(text));
    return s;
  };
  // carimbo: entra grande e assenta com um tremor curto
  BK.stampIn = function (tl, el, at, rot) {
    rot = rot == null ? -8 : rot;
    tl.fromTo(el, { scale: 2.2, opacity: 0, rotation: rot - 6 }, { scale: 1, opacity: 1, rotation: rot, duration: 0.14, ease: "power4.in" }, at);
    tl.fromTo(el, { x: 0 }, { keyframes: [{ x: -9, duration: 0.04 }, { x: 7, duration: 0.04 }, { x: -4, duration: 0.04 }, { x: 0, duration: 0.05 }], ease: "none" }, at + 0.14);
    return at + 0.32;
  };

  // glitch slam (regra chromatic-glitch): RGB separado tremendo em tempo quantizado + fatias que convergem
  BK.glitchSlam = function (tl, stage, lines, o) {
    o = o || {};
    const wrap = BK.el("div", "bk-gs", stage);
    wrap.setAttribute("data-layout-allow-overlap", "");
    wrap.style.top = (o.top || 600) + "px";
    const mk = (kind) => {
      const L = BK.el("div", "bk-gs-layer " + kind, wrap);
      L.setAttribute("data-layout-allow-overlap", "");
      lines.forEach((ln) => {
        const d = BK.el("div", "bk-gs-line", L, BK.esc(ln.texto != null ? ln.texto : ln.text));
        d.setAttribute("data-layout-allow-overlap", "");
        d.style.fontSize = (ln.tam || ln.size || 200) + "px";
        if (o.fonte) d.style.fontFamily = o.fonte;
        d.style.color = kind === "warm" ? o.warm || "#ff2a2a" : kind === "cool" ? o.cool || "#20e3ff" : BK.cor(ln.cor || ln.color, "branco");
      });
      return L;
    };
    const warm = mk("warm"), cool = mk("cool"), base = mk("base");
    const N = 6, slices = [];
    for (let i = 0; i < N; i++) {
      const s = mk("base slice");
      s.style.clipPath = `inset(${(i * 100) / N}% 0 ${100 - ((i + 1) * 100) / N}% 0)`;
      slices.push(s);
    }
    if (o.flash) {
      const f = BK.el("div", "bk-gs-flash", stage);
      f.style.background = o.flash;
      tl.fromTo(f, { opacity: 0.85 }, { opacity: 0, duration: 0.16, ease: "power2.out" }, 0);
    }
    const STEP = 1 / 30, H = BK.hash;
    tl.fromTo(wrap, { scaleX: 1.55 }, { scaleX: 1, duration: 0.24, ease: "power4.out" }, 0);
    tl.fromTo(base, { opacity: 0 }, { opacity: 1, duration: 0.001 }, 0.2);
    slices.forEach((sl, i) => {
      const dir = H(i * 3 + 1) > 0.5 ? 1 : -1;
      tl.fromTo(sl, { x: dir * (60 + H(i * 5 + 2) * 160), opacity: 1 }, { x: 0, duration: 0.2, ease: "steps(4)" }, 0);
      tl.set(sl, { opacity: 0 }, 0.2);
    });
    const amp = { a: 0 };
    const jitter = () => {
      const step = Math.floor(tl.time() / STEP);
      const op = Math.min(0.9, amp.a * 3.6); // camadas RGB somem junto com o tremor (senão lavam as cores entre os pulsos)
      [warm, cool].forEach((el, layer) => {
        gsap.set(el, { x: (H(step * 13 + layer * 7) * 2 - 1) * 30 * amp.a, y: (H(step * 29 + layer * 11) * 2 - 1) * 10 * amp.a, opacity: op });
      });
      gsap.set(stage, { x: (H(step * 17 + 3) * 2 - 1) * 14 * amp.a, y: (H(step * 23 + 5) * 2 - 1) * 10 * amp.a });
    };
    tl.set([warm, cool], { opacity: 0.9 }, 0);
    tl.fromTo(amp, { a: 1 }, { a: 0, duration: 0.45, ease: "power3.in", onUpdate: jitter }, 0);
    const b2 = o.burst2 == null ? 0.56 : o.burst2;
    if (b2 > 0) tl.fromTo(amp, { a: 0.8 }, { a: 0, duration: 0.14, ease: "power2.in", onUpdate: jitter, immediateRender: false }, b2);
    tl.set([warm, cool], { x: 0, y: 0, opacity: 0 }, b2 > 0 ? b2 + 0.15 : 0.46);
    tl.set(stage, { x: 0, y: 0 }, b2 > 0 ? b2 + 0.15 : 0.46);
    return wrap;
  };

  // card da metade de cima (modo dividido): entra junto com o movimento de câmera do index.html
  BK.splitIn = function (tl, card, at) {
    tl.fromTo(card, { yPercent: -102 }, { yPercent: 0, duration: 0.36, ease: "power3.out" }, at || 0);
  };
  BK.splitOut = function (tl, card, at) {
    tl.to(card, { yPercent: -102, duration: 0.28, ease: "power3.in" }, at);
  };
  // entrada/saída padrão de um card dividido. P.entrada: desce | wipe-esq | wipe-dir | corte. P.saida: tempo local ou null.
  BK.card = function (tl, card, P) {
    const e = P.entrada || "desce";
    if (e === "desce") BK.splitIn(tl, card, 0);
    else if (e === "wipe-esq" || e === "wipe-dir") {
      const a = e === "wipe-esq" ? "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" : "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)";
      tl.fromTo(card, { clipPath: a }, { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 0.26, ease: "power3.inOut" }, 0);
    } else tl.set(card, { opacity: 1 }, 0);
    if (P.saida != null) BK.splitOut(tl, card, P.saida);
  };
  // rótulo do card (canto superior esquerdo)
  BK.rotulo = function (tl, parent, texto, at) {
    if (!texto) return null;
    const l = BK.el("div", "bk-cardlabel", parent, BK.esc(texto));
    tl.fromTo(l, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, at == null ? 0.2 : at);
    return l;
  };
  // entra com mola / sai rápido
  BK.pop = function (tl, el, at, o) {
    o = o || {};
    tl.fromTo(el, { scale: o.de == null ? 0 : o.de, opacity: 0, rotation: (o.rot || 0) - (o.giro == null ? 12 : o.giro) },
      { scale: 1, opacity: 1, rotation: o.rot || 0, duration: o.dur || 0.36, ease: o.ease || "back.out(1.8)" }, at);
  };
  BK.sobe = function (tl, el, at, o) {
    o = o || {};
    tl.fromTo(el, { opacity: 0, y: o.y == null ? 30 : o.y }, { opacity: 1, y: 0, duration: o.dur || 0.3, ease: "power3.out" }, at);
  };
  BK.sai = function (tl, el, at, o) {
    o = o || {};
    tl.to(el, { opacity: 0, y: o.y == null ? -30 : o.y, scale: o.scale == null ? 1 : o.scale, duration: o.dur || 0.2, ease: "power2.in" }, at);
  };
  // traços .draw de um SVG se desenham sozinhos (regra svg-path-draw)
  BK.desenha = function (tl, root, at, dur, gap) {
    [...root.querySelectorAll("path.draw, path")].filter((p) => p.classList.contains("draw") || root.dataset.drawAll).forEach((p, i) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      tl.fromTo(p, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: dur || 0.2, ease: "power2.out" }, at + i * (gap == null ? 0.12 : gap));
    });
  };
  // título grande com ênfase (*palavra*), centralizado numa largura fixa
  BK.titulo = function (parent, id, texto, o) {
    o = o || {};
    const d = BK.el("div", "bk-title", parent, BK.rich(texto, o.enfase));
    if (id) d.id = id;
    d.style.position = "absolute";
    d.style.left = (o.x == null ? 50 : o.x) + "px";
    d.style.width = (o.w || 980) + "px";
    d.style.top = (o.y || 0) + "px";
    d.style.textAlign = o.align || "center";
    d.style.fontSize = (o.tam || 110) + "px";
    if (o.cor) d.style.color = BK.cor(o.cor);
    if (o.fonte === "serifa") { d.style.fontFamily = '"LT Garamond", serif'; d.style.textTransform = "none"; d.style.fontWeight = "600"; d.style.letterSpacing = "-0.02em"; }
    return d;
  };
})(window);
