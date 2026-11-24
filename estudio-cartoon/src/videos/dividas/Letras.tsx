// Letras e gráficos do canal por cima do 3D: texto com brilho, botão azul/vermelho, cartão de vidro com borda limão,
// número verde-limão e legenda de uma palavra (estilo aprovado no vídeo dos 82%).
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";

const useInter = () => {
  const [h] = useState(() => delayRender("fonte Inter"));
  useEffect(() => {
    const f = new FontFace("Inter", `url(${staticFile("fonts/Inter-VF.woff2")})`, { weight: "100 900" });
    f.load().then((ff) => { (document.fonts as unknown as { add: (x: FontFace) => void }).add(ff); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
};
const I = "Inter, Arial, sans-serif";
const S = {
  sm: { font: `500 56px/1.15 ${I}`, color: "#D6E6FF", letterSpacing: -0.5, textShadow: "0 0 28px rgba(120,170,255,.55),0 3px 12px rgba(0,0,0,.6)" },
  bg: { font: `900 140px/1.02 ${I}`, color: "#fff", letterSpacing: -5, textShadow: "0 0 44px rgba(150,195,255,.6),0 8px 24px rgba(0,0,0,.55)" },
  card: { display: "table", margin: "0 auto", padding: "30px 64px 40px", borderRadius: 44, background: "rgba(16,18,24,.8)", border: "4px solid #D4FF3A",
    boxShadow: "0 0 46px rgba(212,255,58,.45), inset 0 0 34px rgba(212,255,58,.1)" },
  num: { font: `900 196px/1 ${I}`, color: "#D4FF3A", letterSpacing: -7, whiteSpace: "nowrap" as const, textShadow: "0 0 56px rgba(212,255,58,.6)" },
  sub: { font: `600 58px/1.2 ${I}`, color: "#F1F4F8", letterSpacing: -0.5 },
  pill: (red: boolean) => ({ display: "table", margin: "16px auto 0", padding: "10px 52px 22px", borderRadius: 30, font: `800 86px/1.1 ${I}`, color: "#fff",
    letterSpacing: -2.5, whiteSpace: "nowrap" as const, background: red ? "linear-gradient(#FF6A6E,#D92B3A)" : "linear-gradient(#4FA6FF,#1C6FE6)",
    boxShadow: `inset 0 3px 0 rgba(255,255,255,.4), inset 0 -6px 0 rgba(0,0,0,.15), 0 14px 50px ${red ? "rgba(255,60,70,.55)" : "rgba(40,130,255,.6)"}` }),
};
type L = { sm?: string; bg?: string; num?: string; sub?: string; pill?: [string, boolean]; leg: string };
const AMOSTRA: Record<number, L> = {
  16: { sm: "você recebeu o", bg: "salário", leg: "SALÁRIO" },
  17: { num: "82%", sub: "das famílias brasileiras", pill: ["endividadas", true], leg: "ENDIVIDADAS" },
  18: { num: "10x", sub: "e a geladeira é sua", leg: "GELADEIRA" },
  19: { num: "+400%", sub: "de juros ao ano", pill: ["rotativo", true], leg: "ROTATIVO" },
  20: { num: "3 em 10", sub: "famílias com conta atrasada", leg: "ATRASADA" },
};
export const Letras: React.FC<{ id: number }> = ({ id }) => {
  useInter();
  const l = AMOSTRA[id];
  if (!l) return null;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1000, background: "linear-gradient(rgba(4,8,20,.5),rgba(4,8,20,.2) 60%,rgba(4,8,20,0))" }} />
      <div style={{ position: "absolute", left: 40, right: 40, top: 300, textAlign: "center" }}>
        {l.sm && <div style={S.sm}>{l.sm}</div>}
        {l.bg && <div style={S.bg}>{l.bg}</div>}
        {l.num && <div style={S.card}><div style={S.num}>{l.num}</div>{l.sub && <div style={S.sub}>{l.sub}</div>}</div>}
        {l.pill && <div style={S.pill(l.pill[1])}>{l.pill[0]}</div>}
      </div>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1430, textAlign: "center", font: `800 84px ${I}`, letterSpacing: -1.5, color: "#fff",
        textShadow: "0 0 3px #000, 0 5px 20px rgba(0,0,0,.75)" }}>{l.leg}</div>
    </AbsoluteFill>
  );
};
