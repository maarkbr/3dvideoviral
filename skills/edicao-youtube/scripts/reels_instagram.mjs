// Aba de Reels de um perfil, com as views de cada um (sem login só aparecem os ~12 mais recentes).
// uso: node reels_instagram.mjs https://www.instagram.com/PERFIL/reels/ saida.png  → imprime [{href, txt: "10,5 mi"}]; baixe o reel com yt-dlp.
// puppeteer-core: PUPPETEER_CORE=<caminho do puppeteer-core.js> ou o pacote instalado (npm i puppeteer-core)
const puppeteer = (await import(process.env.PUPPETEER_CORE || 'puppeteer-core')).default;
const CHROME = process.env.CHROME || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
const [,, url, out] = process.argv;
const b = await puppeteer.launch({executablePath: CHROME, headless: 'new', args: ['--lang=pt-BR']});
const p = await b.newPage();
await p.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');
await p.setExtraHTTPHeaders({'Accept-Language': 'pt-BR,pt;q=0.9'});
await p.setViewport({width: 980, height: 2200, deviceScaleFactor: 2});
await p.goto(url, {waitUntil: 'networkidle2', timeout: 60000}).catch(e => console.log('goto', e.message));
await new Promise(r => setTimeout(r, 3000));
await p.evaluate(() => { document.querySelectorAll('[role=dialog]').forEach(d => { let n = d; while (n.parentElement && n.parentElement !== document.body) n = n.parentElement; n.remove(); }); document.documentElement.style.overflow='auto'; document.body.style.overflow='auto'; });
await new Promise(r => setTimeout(r, 800));
for (let i=0;i<3;i++){ await p.evaluate(()=>window.scrollBy(0,1800)); await new Promise(r=>setTimeout(r,1500)); }
await p.screenshot({path: out, fullPage: true});
const links = await p.evaluate(() => [...document.querySelectorAll('a[href*="/reel/"]')].map(a => ({href: a.getAttribute('href'), txt: a.innerText.replace(/\s+/g,' ').trim()})));
console.log(JSON.stringify(links));
await b.close();
