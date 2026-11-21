// Rostos dos nossos bonecos. Coordenadas de 0 a 1 dentro da frente da cabeça.
// Expressões: neutro, feliz, riso, surpreso, espanto, medo, triste, bravo, raiva, determinado, curioso, dormindo.

const TINTA = "#1f1a18";
const BOCA = "#5c1e1e";

// [tipo de olho, tamanho da pupila, inclinação da sobrancelha (+ = meio pra cima, preocupado), altura extra]
const EXPR = {
  neutro: ["normal", 1, 0, 0],
  feliz: ["normal", 1, 0.03, 0.02],
  riso: ["feliz", 1, 0.02, 0.04],
  surpreso: ["grande", 0.6, 0.02, 0.08],
  espanto: ["grande", 0.38, 0.06, 0.11],
  medo: ["grande", 0.42, 0.16, 0.07],
  triste: ["normal", 1, 0.16, 0.01],
  bravo: ["bravo", 1, -0.16, -0.02],
  raiva: ["bravo", 0.8, -0.22, -0.03],
  determinado: ["normal", 1, -0.09, 0],
  curioso: ["normal", 1, 0, 0],
  dormindo: ["fechado", 1, 0, -0.01],
  bocejo: ["fechado", 1, 0.08, 0.07],
  mudo: ["normal", 1, 0.15, 0],
  fala: ["normal", 1, 0.02, 0.02],
  falaBrava: ["bravo", 1, -0.16, -0.02],
};

export function desenharRosto(ctx, W, H, expr, estilo) {
  const X = (v) => v * W, Y = (v) => v * H;
  const [tipoOlho, pupila, inc, alt] = EXPR[expr] || EXPR.neutro;
  const olhoY = 0.45, olhoDx = 0.18;
  ctx.fillStyle = estilo.pele;
  ctx.fillRect(0, 0, W, H);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // bochechas (mais fortes no riso)
  if (estilo.bochecha !== false) {
    ctx.fillStyle = expr === "riso" ? "rgba(240,100,100,0.5)" : "rgba(240,110,110,0.36)";
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(X(0.5 + s * 0.28), Y(0.65), X(0.075), Y(0.045), 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (estilo.sardas) {
    ctx.fillStyle = "rgba(120,60,30,0.55)";
    for (const s of [-1, 1])
      for (const [a, b] of [[0.24, 0.6], [0.29, 0.63], [0.26, 0.67], [0.31, 0.58]]) {
        ctx.beginPath();
        ctx.arc(X(0.5 + s * a), Y(b), X(0.009), 0, Math.PI * 2);
        ctx.fill();
      }
  }

  // olhos
  for (const s of [-1, 1]) {
    const cx = X(0.5 + s * olhoDx), cy = Y(olhoY);
    if (tipoOlho === "feliz" || tipoOlho === "fechado") {
      ctx.strokeStyle = TINTA;
      ctx.lineWidth = X(0.032);
      ctx.beginPath();
      if (tipoOlho === "feliz") ctx.arc(cx, cy + Y(0.035), X(0.055), 1.12 * Math.PI, 1.88 * Math.PI);
      else ctx.arc(cx, cy - Y(0.01), X(0.055), 0.12 * Math.PI, 0.88 * Math.PI);
      ctx.stroke();
      continue;
    }
    if (tipoOlho === "grande") {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(cx, cy, X(0.088), Y(0.145), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = X(0.013);
      ctx.strokeStyle = TINTA;
      ctx.stroke();
      ctx.fillStyle = TINTA;
      ctx.beginPath();
      ctx.ellipse(cx, cy + Y(0.01), X(0.088 * pupila), Y(0.145 * pupila), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(cx + X(0.022 * pupila), cy - Y(0.04 * pupila), X(0.016), 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    // normal e bravo: olho preto grande com dois brilhos
    ctx.fillStyle = TINTA;
    ctx.beginPath();
    ctx.ellipse(cx, cy, X(0.064 * pupila), Y(0.118 * pupila), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx + X(0.02), cy - Y(0.042), X(0.021), 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - X(0.017), cy + Y(0.045), X(0.009), 0, Math.PI * 2);
    ctx.fill();
    if (tipoOlho === "bravo") {
      // pálpebra de cima cortando o olho em diagonal
      ctx.fillStyle = estilo.pele;
      ctx.beginPath();
      ctx.moveTo(cx - X(0.1), cy - Y(0.16));
      ctx.lineTo(cx + X(0.1), cy - Y(0.16));
      ctx.lineTo(cx - s * X(0.1), cy - Y(0.02));
      ctx.lineTo(cx + s * X(0.1), cy - Y(0.1));
      ctx.closePath();
      ctx.fill();
    }
  }

  // óculos
  if (estilo.oculos) {
    ctx.strokeStyle = "#3b2a20";
    ctx.lineWidth = X(0.014);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(X(0.5 + s * olhoDx), Y(olhoY), X(0.11), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(X(0.5 - olhoDx + 0.11), Y(olhoY));
    ctx.quadraticCurveTo(X(0.5), Y(olhoY - 0.05), X(0.5 + olhoDx - 0.11), Y(olhoY));
    ctx.stroke();
  }

  // sobrancelhas: ponta de dentro sobe quando inc > 0 (preocupado), desce quando inc < 0 (bravo)
  ctx.strokeStyle = estilo.corSobrancelha || TINTA;
  ctx.lineWidth = X(0.04 * (estilo.sobrancelhaGrossa ? 1.4 : 1));
  for (const s of [-1, 1]) {
    const cx = 0.5 + s * olhoDx;
    let y = olhoY - 0.2 - alt;
    let i = inc;
    if (expr === "curioso" && s === 1) {
      y -= 0.05;
      i = -0.04;
    }
    const dentro = cx - s * 0.075, fora = cx + s * 0.075;
    ctx.beginPath();
    ctx.moveTo(X(dentro), Y(y - i * 0.5));
    ctx.quadraticCurveTo(X(cx), Y(y - 0.02), X(fora), Y(y + i * 0.5));
    ctx.stroke();
  }

  // boca
  const by = 0.72;
  ctx.strokeStyle = "#4a221c";
  ctx.lineWidth = X(0.024);
  const dentes = (x0, y0, w, h) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x0, y0, w, h);
  };
  if (expr === "bocejo") {
    ctx.save();
    ctx.fillStyle = BOCA;
    ctx.beginPath();
    ctx.ellipse(X(0.5), Y(by + 0.05), X(0.07), Y(0.13), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = "#e46f6f";
    ctx.beginPath();
    ctx.ellipse(X(0.5), Y(by + 0.17), X(0.06), Y(0.06), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (expr === "fala" || expr === "falaBrava") {
    ctx.save();
    ctx.fillStyle = BOCA;
    ctx.beginPath();
    ctx.roundRect(X(0.42), Y(by - 0.02), X(0.16), Y(0.09), X(0.04));
    ctx.fill();
    ctx.clip();
    dentes(X(0.4), Y(by - 0.04), X(0.2), Y(0.035));
    ctx.restore();
  } else if (expr === "mudo") {
    // X de esparadrapo por cima da boca
    for (const ang of [0.42, -0.42]) {
      ctx.save();
      ctx.translate(X(0.5), Y(by + 0.01));
      ctx.rotate(ang);
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fillRect(-X(0.16), -Y(0.032) + 3, X(0.32), Y(0.064));
      ctx.fillStyle = "#efe6d2";
      ctx.fillRect(-X(0.16), -Y(0.032), X(0.32), Y(0.064));
      ctx.fillStyle = "rgba(160,140,110,0.35)";
      for (let k = -0.15; k < 0.16; k += 0.03) ctx.fillRect(X(k), -Y(0.032), 1.5, Y(0.064));
      ctx.restore();
    }
  } else if (expr === "riso") {
    ctx.save();
    ctx.fillStyle = BOCA;
    ctx.beginPath();
    ctx.moveTo(X(0.36), Y(by - 0.03));
    ctx.quadraticCurveTo(X(0.5), Y(by - 0.06), X(0.64), Y(by - 0.03));
    ctx.quadraticCurveTo(X(0.62), Y(by + 0.15), X(0.5), Y(by + 0.15));
    ctx.quadraticCurveTo(X(0.38), Y(by + 0.15), X(0.36), Y(by - 0.03));
    ctx.fill();
    ctx.clip();
    dentes(X(0.3), Y(by - 0.07), X(0.4), Y(0.06));
    ctx.fillStyle = "#e46f6f";
    ctx.beginPath();
    ctx.ellipse(X(0.5), Y(by + 0.15), X(0.08), Y(0.06), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (expr === "surpreso") {
    ctx.fillStyle = BOCA;
    ctx.beginPath();
    ctx.ellipse(X(0.5), Y(by + 0.02), X(0.045), Y(0.065), 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (expr === "espanto" || expr === "medo") {
    ctx.save();
    ctx.fillStyle = BOCA;
    ctx.beginPath();
    if (expr === "espanto") ctx.ellipse(X(0.5), Y(by + 0.04), X(0.085), Y(0.11), 0, 0, Math.PI * 2);
    else ctx.roundRect(X(0.38), Y(by - 0.02), X(0.24), Y(0.13), X(0.05));
    ctx.fill();
    ctx.clip();
    dentes(X(0.3), Y(by - 0.08), X(0.4), Y(expr === "espanto" ? 0.06 : 0.05));
    if (expr === "medo") dentes(X(0.3), Y(by + 0.08), X(0.4), Y(0.05));
    ctx.restore();
    if (expr === "medo") {
      ctx.fillStyle = "rgba(140,200,255,0.95)";
      ctx.beginPath();
      ctx.moveTo(X(0.8), Y(0.22));
      ctx.quadraticCurveTo(X(0.84), Y(0.3), X(0.8), Y(0.32));
      ctx.quadraticCurveTo(X(0.76), Y(0.3), X(0.8), Y(0.22));
      ctx.fill();
    }
  } else if (expr === "raiva") {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(X(0.38), Y(by - 0.01), X(0.24), Y(0.08), X(0.02));
    ctx.fill();
    ctx.lineWidth = X(0.014);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(X(0.38), Y(by + 0.03));
    ctx.lineTo(X(0.62), Y(by + 0.03));
    for (const x of [0.44, 0.5, 0.56]) {
      ctx.moveTo(X(x), Y(by - 0.01));
      ctx.lineTo(X(x), Y(by + 0.07));
    }
    ctx.stroke();
  } else if (expr === "triste" || expr === "bravo") {
    ctx.beginPath();
    ctx.arc(X(0.5), Y(by + 0.09), X(0.07), 1.18 * Math.PI, 1.82 * Math.PI);
    ctx.stroke();
  } else if (expr === "determinado" || expr === "curioso") {
    ctx.beginPath();
    ctx.moveTo(X(0.44), Y(by + 0.01));
    ctx.quadraticCurveTo(X(0.52), Y(by + 0.04), X(0.58), Y(by - 0.015));
    ctx.stroke();
  } else if (expr === "dormindo") {
    ctx.beginPath();
    ctx.ellipse(X(0.5), Y(by + 0.01), X(0.022), Y(0.028), 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const larg = expr === "feliz" ? 0.085 : 0.065;
    ctx.beginPath();
    ctx.arc(X(0.5), Y(by - 0.05), X(larg), 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  }

  // bigode e barba
  if (estilo.bigode) {
    ctx.fillStyle = estilo.bigode;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(X(0.5 + s * 0.065), Y(by - 0.06), X(0.078), Y(0.036), s * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (estilo.barba) {
    ctx.fillStyle = "rgba(60,50,45,0.18)";
    for (let i = 0; i < 160; i++) {
      const a = (i * 2.3999) % (Math.PI * 2), r = 0.04 + (((i * 37) % 100) / 100) * 0.16;
      const x = 0.5 + Math.cos(a) * r * 1.6, y = 0.78 + Math.abs(Math.sin(a)) * r * 0.9 - 0.02;
      if (y > 0.66 && y < 0.98) {
        ctx.beginPath();
        ctx.arc(X(x), Y(y), X(0.006), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
