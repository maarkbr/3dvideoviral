# Objetos

Arquivo: `biblioteca/objetos.js`. Mesmo traço dos personagens (contorno grosso, sombra de um lado, 586 unidades = 1 metro).

## A regra
**O objeto entra na palavra falada, nunca antes.** A animação de entrada começa no início da palavra que nomeia o objeto, nem um quadro antes.

No código, todo objeto entra por `Objetos.naPalavra(tl, objeto, M.W('palavra'))`. Essa função:
- deixa o objeto invisível até a palavra;
- começa a entrada exatamente no segundo da palavra;
- **dá erro** se alguém tentar adiantar (`atraso` negativo).

O som do objeto (o "pop") também começa na mesma palavra (ver `som.md`).

## Os objetos
| nome | tipo | tamanho real | detalhes |
|---|---|---|---|
| `relogio` | no ar | 0,8 m | ponteiros giram ao entrar e param na hora pedida: `{ hora: '21:55' }` (sem ela, meia-noite) |
| `geladeira` | no chão | 1,8 m | ímãs e bilhete |
| `cama` | no chão | 2,1 m de comprimento | cobertor azul com estrelas |
| `porta` | no chão | 2,15 m | ação `abrir`: abre e aparecem dois olhinhos no escuro |
| `exclamacao` | no ar | 0,8 m | treme e a estrela de trás gira |
| `balao` | no ar | depende do texto | opções: `texto`, `lado` ('esq' ou 'dir', para onde o balão cresce) |
| `opcao` | na tela | — | cartão A/B da pergunta final. Opções: `letra`, `texto`, `cor` |

"No chão" ganha sombra no piso 3D. "No ar" flutua. "Na tela" fica preso na tela (não anda com a câmera).

## Como usar na montagem
```js
const porta = M.objeto('porta', -0.8, 0, -5.5);            // nome, x, y, z no mundo (y = 0 é o chão)
Objetos.naPalavra(tl, porta, W('porta'));                   // entra na palavra
Objetos.acao(tl, porta, 'abrir', W('aberta'));              // abre na palavra "aberta"
Objetos.sair(tl, porta, B(5) - 0.2);                        // sai antes do próximo bloco

const opA = M.naTela('opcao', 540, 300, 0.95, { letra: 'A', texto: 'Esconder na cama', cor: '#FFD93D' });
Objetos.naPalavra(tl, opA, W('escondia'));
```
Dicas de lugar:
- Objeto no chão atrás do personagem: z entre -2 e -6 (quanto mais negativo, mais longe e mais alto na tela).
- Coloque ao lado do personagem, não atrás da cabeça dele. Confira no quadro parado.
- Tire o objeto (`sair`) quando o assunto muda, para a tela não encher.

## Criar um objeto novo
Em `DESENHOS` (objetos.js), copie um parecido e mude:
- `tipo`: 'chao' (origem no pé, centro embaixo) ou 'ar' (origem no centro)
- `caixa`: [x, y, largura, altura] do desenho
- `svg(cl)`: o desenho. Use `contorno` (traço preto grosso), uma cor clara e a sombra mais escura do lado direito, com `clipPath` (o `cl('nome')` dá um nome único)
Se ele tiver um efeito na entrada (como os ponteiros do relógio), coloque em `naPalavra`.
Depois mostre o objeto sozinho num quadro parado antes de usar no vídeo.
