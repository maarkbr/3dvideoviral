const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const pasta = process.argv[2], saida = process.argv[3];
const srv = http.createServer((q, r) => { const f = path.join(pasta, decodeURIComponent(q.url.split('?')[0].split('#')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : 'image/png' }); r.end(d); }); }).listen(0, async () => {
  const b = await chromium.launch();
  for (const [modo, w, h] of [['capa', 1080, 1920], ['perfil', 1080, 1080]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    p.on('pageerror', (e) => console.log('[erro]', e.message));
    await p.goto(`http://127.0.0.1:${srv.address().port}/arte.html#${modo}`, { waitUntil: 'load' });
    await p.evaluate(() => window.pronto); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(saida, `${modo}.png`) }); await p.close();
  }
  await b.close(); srv.close(); console.log('ok');
});
