// uso: node quadros.js <pasta> <saida> "t1,t2,..."  -> PNGs + log do console
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const [pasta, saida, tempos] = process.argv.slice(2);
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => {
  const f = path.join(pasta, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
}).listen(0, async () => {
  const porta = srv.address().port;
  fs.mkdirSync(saida, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  p.on('console', (m) => console.log('[console]', m.type(), m.text().slice(0, 300)));
  p.on('pageerror', (e) => console.log('[erro]', e.message));
  await p.goto(`http://127.0.0.1:${porta}/index.html`, { waitUntil: 'load', timeout: 120000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(800);
  const lista = tempos.split(',').map(Number);
  for (const [i, tt] of lista.entries()) {
    const t0 = Date.now();
    await p.evaluate(async (tt) => {
      const tl = window.__timelines.main; tl.seek(tt, false);
      const proms = [];
      window.dispatchEvent(new CustomEvent('hf-seek', { detail: { time: tt, waitUntil: (pr) => proms.push(pr) } }));
      await Promise.all(proms);
    }, tt);
    await p.screenshot({ path: path.join(saida, `q${String(i + 1).padStart(3, '0')}.png`) });
    console.log(`quadro ${tt}s em ${Date.now() - t0} ms`);
  }
  await b.close(); srv.close();
});
