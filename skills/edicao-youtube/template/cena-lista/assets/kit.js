// Kit de animação (GSAP) das cenas do documentário v2. Cada cena cria `tl` e usa estas entradas.
window.__timelines = window.__timelines || {};
document.querySelectorAll(".letras").forEach((el) => {
  el.innerHTML = [...el.textContent].map((c) => c === " " ? " " : `<span class="letra">${c}</span>`).join("");
});
document.querySelectorAll(".palavras").forEach((el) => {
  el.innerHTML = el.innerHTML.trim().split(/\s+/).map((w) => `<span class="pal">${w}</span>`).join(" ");
});
const tl = gsap.timeline({ paused: true });
const L = (sel) => document.querySelectorAll(sel + " .letra");
const P = (sel) => document.querySelectorAll(sel + " .pal");
const letrasSobe = (sel, t, st = 0.04) => tl.fromTo(L(sel), { y: 90, opacity: 0, filter: "blur(14px)", scale: 1.25 },
  { y: 0, opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.42, ease: "power3.out", stagger: st }, t);
const letrasDigita = (sel, t, st = 0.04) => tl.fromTo(L(sel), { opacity: 0, x: -24, filter: "blur(10px)" },
  { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.22, ease: "power2.out", stagger: st }, t);
const palavrasBlur = (sel, t, st = 0.16) => tl.fromTo(P(sel), { opacity: 0, x: -60, filter: "blur(16px)" },
  { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.32, ease: "power3.out", stagger: st }, t);
const palavra = (sel, i, t) => tl.fromTo(P(sel)[i], { opacity: 0, x: -50, filter: "blur(14px)" },
  { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.3, ease: "power3.out" }, t);
const deriva = (sel, t, d, s = 1.05) => tl.fromTo(sel, { scale: 1 }, { scale: s, duration: d, ease: "none" }, t);
const pop = (sel, t, de = 0.6) => tl.fromTo(sel, { scale: de, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.7)" }, t);
const sobe = (sel, t, d = 0.5) => tl.fromTo(sel, { y: 120, opacity: 0 }, { y: 0, opacity: 1, duration: d, ease: "power3.out" }, t);
const some = (sel, t, d = 0.3) => tl.to(sel, { opacity: 0, filter: "blur(10px)", duration: d, ease: "power2.in" }, t);
const pilula = (sel, t) => tl.fromTo(sel, { scale: 0.4, opacity: 0, rotation: -10 }, { scale: 1, opacity: 1, rotation: -2, duration: 0.5, ease: "back.out(2)" }, t);
// digita um texto (elemento com data-texto) caractere por caractere, entre t e t+d
const digita = (sel, t, d) => {
  const el = document.querySelector(sel); const txt = el.dataset.texto || el.textContent; const o = { n: 0 };
  tl.to(o, { n: txt.length, duration: d, ease: "none", onUpdate: () => { el.textContent = txt.slice(0, Math.round(o.n)); } }, t);
  tl.set(el, { textContent: "" }, 0);
};
// realce amarelo atrás de um trecho
const marca = (sel, t) => tl.fromTo(sel, { backgroundColor: "rgba(255,196,0,0)", color: "#ece8e1" },
  { backgroundColor: "rgba(255,196,0,1)", color: "#111", duration: 0.25, ease: "power2.out" }, t);
const desmarca = (sel, t) => tl.to(sel, { backgroundColor: "rgba(255,196,0,0)", color: "#8d8981", duration: 0.25 }, t);
const registra = (d) => { tl.set({}, {}, d); window.__timelines["main"] = tl; };
