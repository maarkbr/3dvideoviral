// Camada 2D do filme: dados no estilo do canal (cartão de vidro com borda limão, número que conta, botão),
// legenda palavra por palavra (palavras-chave em limão), tratamento de cor por cena (noite, flashback) e fade final.
// Tudo cronometrado pelas palavras da narração (tempos.ts).
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { FALAS, PALAVRAS, W, WE, DUR } from "./tempos";

const useInter = () => {
  const [h] = useState(() => delayRender("fonte Inter"));
  useEffect(() => {
    const f = new FontFace("Inter", `url(${staticFile("fonts/Inter-VF.woff2")})`, { weight: "100 900" });
    f.load().then((ff) => { (document.fonts as unknown as { add: (x: FontFace) => void }).add(ff); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
};
const I = "Inter, Arial, sans-serif";
const cl = (x: number) => Math.max(0, Math.min(1, x));
const spr = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-6.5 * x) * Math.cos(9.5 * x));
const oC = (x: number) => 1 - (1 - cl(x)) ** 3;
/** entra (subindo, saindo do desfoque, com mola) em a e sai (subindo e sumindo) em b */
const anima = (t: number, a: number, b: number): React.CSSProperties => {
  if (t < a - 0.02 || t > b + 0.3) return { display: "none" };
  const k = cl((t - a) / 0.55), o = cl(k * 3.2) * (1 - cl((t - b) / 0.3)), bl = (1 - cl(k * 2.6)) * 12, out = cl((t - b) / 0.3);
  return { opacity: o, filter: bl > 0.3 ? `blur(${bl.toFixed(1)}px)` : undefined, transform: `translateY(${(1 - oC(k)) * 60 - out * 40}px) scale(${0.8 + 0.2 * spr(k)})` };
};
const conta = (t: number, a: number, v: number, dec = 0) => { const u = oC((t - a) / 1.1); return (v * u).toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec }); };
const S = {
  sm: { font: `500 52px/1.15 ${I}`, color: "#D6E6FF", letterSpacing: -0.5, textShadow: "0 0 28px rgba(120,170,255,.55),0 3px 12px rgba(0,0,0,.6)" },
  bg: { font: `900 128px/1.02 ${I}`, color: "#fff", letterSpacing: -4, textShadow: "0 0 44px rgba(150,195,255,.6),0 8px 24px rgba(0,0,0,.55)" },
  card: { display: "table", margin: "0 auto", padding: "26px 56px 34px", borderRadius: 44, background: "rgba(16,18,24,.82)", border: "4px solid #D4FF3A",
    boxShadow: "0 0 46px rgba(212,255,58,.45), inset 0 0 34px rgba(212,255,58,.1)" } as React.CSSProperties,
  num: { font: `900 176px/1 ${I}`, color: "#D4FF3A", letterSpacing: -6, whiteSpace: "nowrap", textShadow: "0 0 56px rgba(212,255,58,.6)" } as React.CSSProperties,
  sub: { font: `600 46px/1.2 ${I}`, color: "#F1F4F8", letterSpacing: -0.5, maxWidth: 820 },
  fonte: { font: `500 30px/1.2 ${I}`, color: "rgba(241,244,248,.72)", marginTop: 10 },
  pill: (red: boolean): React.CSSProperties => ({ display: "table", margin: "16px auto 0", padding: "10px 46px 20px", borderRadius: 30, font: `800 76px/1.1 ${I}`, color: "#fff",
    letterSpacing: -2, whiteSpace: "nowrap", background: red ? "linear-gradient(#FF6A6E,#D92B3A)" : "linear-gradient(#4FA6FF,#1C6FE6)",
    boxShadow: `inset 0 3px 0 rgba(255,255,255,.4), inset 0 -6px 0 rgba(0,0,0,.15), 0 14px 50px ${red ? "rgba(255,60,70,.55)" : "rgba(40,130,255,.6)"}` }),
  chip: (cor: string): React.CSSProperties => ({ display: "inline-block", margin: "10px 8px", padding: "12px 28px 16px", borderRadius: 24, background: "rgba(16,18,24,.85)", border: `4px solid ${cor}`,
    font: `800 50px/1.1 ${I}`, color: "#fff", whiteSpace: "nowrap", boxShadow: `0 0 30px ${cor}66` }),
};
const Box: React.FC<{ top: number; children: React.ReactNode }> = ({ top, children }) => (
  <div style={{ position: "absolute", left: 40, right: 40, top, textAlign: "center" }}>{children}</div>
);
const CHAVE = new Set(["SALÁRIO", "DEVEDORES", "RECORDE", "DESEMPREGO", "NEGATIVADO", "PREÇO", "DINHEIRO", "JUROS", "ROTATIVO", "QUATROCENTOS", "SOBE", "DÍVIDAS", "ANTES", "LISTA", "ATRASADA", "PASSADO", "MARÇO", "NOME"]);
const nrm = (x: string) => x.toUpperCase();

export const LetrasFilme: React.FC<{ offset: number }> = ({ offset }) => {
  useInter();
  const t = (useCurrentFrame() - offset) / 30;
  const fala = FALAS.findIndex((f, k) => t >= f[0] - 0.07 && t < (FALAS[k + 1]?.[0] ?? 1e9) - 0.07) + 1;
  const fim = (k: number) => FALAS[k - 1][1] + 0.15;
  // legenda: a palavra que está sendo dita (palavras-chave em limão)
  const p = PALAVRAS.find((x) => t >= x[1] && t < Math.max(x[2], x[1] + 0.18));
  const pk = p ? cl((t - p[1]) / 0.14) : 1, chave = p && CHAVE.has(nrm(p[0]));
  // tratamento de cor: noite (25, 27, 29 = falas 10, 12, 14), flashback (falas 4-5), fade final
  const noite = [10, 12, 14].includes(fala), flash = fala === 4 || fala === 5, fade = cl((t - (WE(14, "passado") + 0.15)) / 0.5);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {noite && <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 55% at 50% 52%, rgba(255,180,90,.10), rgba(10,14,40,.62) 80%)", mixBlendMode: "multiply" }} />}
      {noite && <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 45% at 50% 50%, rgba(0,0,0,0), rgba(0,0,0,.45) 100%)" }} />}
      {flash && <AbsoluteFill style={{ background: "rgba(255,214,150,.16)", mixBlendMode: "multiply" }} />}
      {flash && <AbsoluteFill style={{ background: "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(0,0,0,0), rgba(40,25,10,.35) 100%)" }} />}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 900, background: "linear-gradient(rgba(4,8,20,.42),rgba(4,8,20,0))" }} />
      {/* fala 3: o paradoxo do país */}
      <Box top={250}><div style={anima(t, W(3, "menor"), W(3, "ao") - 0.1)}><div style={S.card}><div style={S.num}>{conta(t, W(3, "menor"), 5.2, 1)}%</div><div style={S.sub}>desocupação, a menor da série</div><div style={S.fonte}>IBGE · trimestre jul–set/2026</div></div></div></Box>
      <Box top={250}><div style={anima(t, W(3, "oitenta"), fim(3))}><div style={S.card}><div style={S.num}>{conta(t, W(3, "oitenta"), 84.2, 1)} mi</div><div style={S.sub}>de pessoas com o nome negativado</div><div style={S.fonte}>Serasa · setembro/2026</div></div></div></Box>
      <Box top={640}><div style={anima(t, W(3, "recorde"), fim(3))}><div style={S.pill(true)}>recorde</div></div></Box>
      {/* fala 4: o flashback */}
      <Box top={300}><div style={anima(t, W(4, "volta"), fim(4))}><div style={S.sm}>seis meses antes</div><div style={S.bg}>março</div></div></Box>
      {/* fala 6 */}
      <Box top={250}><div style={anima(t, W(6, "oito"), fim(6))}><div style={S.card}><div style={S.num}>{conta(t, W(6, "oito"), 81.6, 1)}%</div><div style={S.sub}>das famílias têm alguma conta a pagar</div><div style={S.fonte}>CNC, Peic · outubro/2026</div></div></div></Box>
      <Box top={700}><div style={anima(t, W(6, "isso"), fim(6))}><div style={S.pill(false)}>dívida ≠ atraso</div></div></Box>
      {/* fala 7 */}
      <Box top={300}><div style={anima(t, W(7, "preço"), fim(7))}><div style={S.sm}>o problema é</div><div style={S.pill(false)}>o preço do dinheiro</div></div></Box>
      {/* fala 8: as colunas */}
      <Box top={1110}>
        <div style={anima(t, W(8, "quinze"), fim(8))}><span style={S.chip("#5b7fd6")}>Selic 15% a.a.</span></div>
        <div style={anima(t, W(8, "sessenta"), fim(8))}><span style={S.chip("#f0a03c")}>juro médio das famílias 64% a.a.</span></div>
        <div style={anima(t, W(8, "quatrocentos"), fim(8))}><span style={S.chip("#e2453c")}>rotativo do cartão 451,7% a.a.</span><div style={S.fonte}>Banco Central · Selic jun/25–mar/26 · juro médio jun/26 · rotativo set/26</div></div>
      </Box>
      {/* fala 9 */}
      <Box top={300}><div style={anima(t, W(9, "sobe"), fim(9))}><div style={S.card}><div style={S.num}>+{conta(t, W(9, "sobe"), 3.6, 1)}%</div><div style={S.sub}>renda real média em 12 meses</div><div style={S.fonte}>IBGE · jul–set/2026</div></div></div></Box>
      {/* fala 10: a revelação */}
      <Box top={240}><div style={anima(t, W(10, "quase"), fim(10))}><div style={S.card}><div style={S.num}>≈ {conta(t, W(10, "quase"), 29, 0)}%</div><div style={S.sub}>da renda das famílias vai para pagar dívidas, com juros</div><div style={S.fonte}>Banco Central · 1º semestre/2026</div></div></div></Box>
      {/* fala 13 */}
      <Box top={240}><div style={anima(t, W(13, "quase"), fim(13))}><div style={S.card}><div style={S.num}>{conta(t, W(13, "quase"), 38.6, 1)}%</div><div style={S.sub}>das famílias com até 3 salários mínimos estão com conta atrasada</div><div style={S.fonte}>CNC, Peic · outubro/2026</div></div></div></Box>
      {/* legenda */}
      {p && fade < 0.5 && (
        <div style={{ position: "absolute", left: 0, width: 1080, top: 1440, textAlign: "center", font: `800 84px ${I}`, letterSpacing: -1.5,
          color: chave ? "#D4FF3A" : "#fff", textShadow: "0 0 3px #000, 0 5px 20px rgba(0,0,0,.8)", transform: `scale(${0.86 + 0.14 * spr(pk)})` }}>{p[0].toUpperCase()}</div>
      )}
      {/* fade final */}
      {fade > 0 && <AbsoluteFill style={{ background: "#000", opacity: fade }} />}
      {fade > 0.6 && <Box top={860}><div style={{ ...S.fonte, opacity: cl((fade - 0.6) / 0.4), fontSize: 34 }}>Fontes: IBGE, CNC (Peic), Banco Central, Serasa</div></Box>}
    </AbsoluteFill>
  );
};
