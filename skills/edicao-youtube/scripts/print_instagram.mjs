// Print de perfil do Instagram sem login (remove o aviso de cadastro). uso: node print_instagram.mjs URL saida.png [largura altura dpr]
// Precisa do puppeteer-core (cache do npx do HyperFrames) e do Google Chrome. Depois borre o @ de perfis de terceiros.
// puppeteer-core: PUPPETEER_CORE=<caminho do puppeteer-core.js> ou o pacote instalado (npm i puppeteer-core)
const puppeteer = (await import(process.env.PUPPETEER_CORE || 'puppeteer-core')).default;
const CHROME = process.env.CHROME || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
const [,, url, out, w='980', h='900', dpr='3'] = process.argv;
const b = await puppeteer.launch({executablePath: CHROME, headless: 'new', args: ['--lang=pt-BR']});
const p = await b.newPage();
await p.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');
await p.setExtraHTTPHeaders({'Accept-Language': 'pt-BR,pt;q=0.9'});
await p.setViewport({width: +w, height: +h, deviceScaleFactor: +dpr});
await p.goto(url, {waitUntil: 'networkidle2', timeout: 60000}).catch(e => console.log('goto', e.message));
await new Promise(r => setTimeout(r, 2500));
await p.evaluate(() => {
  document.querySelectorAll('[role=dialog]').forEach(d => { let n = d; while (n.parentElement && n.parentElement !== document.body) n = n.parentElement; n.remove(); });
  document.documentElement.style.overflow = 'auto'; document.body.style.overflow = 'auto';
  window.scrollTo(0, 0);
});
await new Promise(r => setTimeout(r, 800));
await p.screenshot({path: out});
console.log(await p.evaluate(() => document.querySelector('meta[property="og:description"]')?.content));
await b.close();
