// uso: node render.js <pasta> <saida-dir> <fps> <inicio> <fim>   (quadros [inicio, fim))
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const [pasta, saida, fpsS, iniS, fimS] = process.argv.slice(2);
const fps = +fpsS, ini = +iniS, fim = +fimS;
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const srv = http.createServer((q, r) => {
  const f = path.join(pasta, decodeURIComponent(q.url.split('?')[0]));
  if (f.endsWith('.wav')) { r.writeHead(404); r.end(); return; }
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
}).listen(0, async () => {
  fs.mkdirSync(saida, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => console.log('[erro]', e.message));
  await p.goto(`http://127.0.0.1:${srv.address().port}/index.html`, { waitUntil: 'load', timeout: 120000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1000);
  const t0 = Date.now();
  for (let i = ini; i < fim; i++) {
    const arq = path.join(saida, `f${String(i).padStart(5, '0')}.jpg`);
    if (fs.existsSync(arq)) continue;
    await p.evaluate(async (tt) => {
      const tl = window.__timelines.main; tl.seek(tt, false);
      const proms = [];
      window.dispatchEvent(new CustomEvent('hf-seek', { detail: { time: tt, waitUntil: (pr) => proms.push(pr) } }));
      await Promise.all(proms);
    }, i / fps);
    await p.screenshot({ path: arq + '.tmp.jpg', type: 'jpeg', quality: 93 });
    fs.renameSync(arq + '.tmp.jpg', arq);
    if ((i - ini) % 100 === 0) console.log(`quadro ${i} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  console.log('PRONTO', ini, fim);
  await b.close(); srv.close();
});
