# Motor v2 (teste aprovado em 22/11/2026)

Cenário com peças 3D Kenney (CC0), luz física (PBR + ambiente RoomEnvironment), sombras 4096, céu com nuvens,
profundidade de campo (BokehPass), bloom, gradação de cor, vinheta, grão e FXAA. Personagens 2D por cima (montagem.js).

Usar num vídeo: copiar esta pasta para `~/3D Video Viral/palitinho/<video>/`, trazer `vendor/` (three r147 + gsap via
`npm pack`), `personagem.js`, `objetos.js`, `objetos-extra.js` e `montagem.js` do projeto `master`, e as peças
necessárias de `_ferramentas/pecas-3d` para `pecas/<kit>/` (com `Textures/`). `cena.pronto` avisa quando as peças
carregaram; o `quadros2.js` espera por ele. Render ≈ 4 s por quadro em CPU (3 processos em paralelo).

Amostra: `amostras/motor-v2-planos.jpg` (geral, médio com fundo desfocado, contra-plongée).
