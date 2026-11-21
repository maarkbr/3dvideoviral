# Painel 2.0: a central de trabalho do Edição com IA (plano, 06/11/2026)

**Pedido do Lucas:** o painel deixa de ser um formulário que manda pedido para o chat e vira o lugar onde o trabalho acontece, como na Fábrica de Motion, só que melhor. Usamos as ideias, nunca o código, as artes nem os vídeos dela.

## Como fica a tela
- **Lateral esquerda, em três partes:**
  - **Projetos:** cada cliente ou canal, com a marca dele. Quem edita para cliente tem vários; quem edita os próprios vídeos tem um só.
  - **Modelos:** a biblioteca de referências, por categoria (Motion, 3D, Bit, Cortes, Vídeo falado…), cada uma com o vídeo tocando.
  - **Fila:** o que está rodando agora, em qualquer projeto.
- **Centro: o chat do projeto.** Dá para:
  - escrever, gravar **áudio** (vira texto pelo Whisper, no próprio computador; a Fábrica não tem), anexar arquivos (logo, ícones, fotos, prints, vídeo, **áudio da narração**) e colar um **link** (página do produto, Instagram, vídeo de referência);
  - arrastar um modelo da lateral para dentro: ele vira a referência de estilo daquele vídeo.
- **Direita: o andamento do vídeo**, em etapas que acendem: Briefing → Roteiro → Storyboard → Narração → Cenas → Render → Entrega. Cada etapa com o que saiu dela (o texto do roteiro, a folha de quadros do storyboard, o áudio, o vídeo).

## O Claude trabalha dentro do painel
- Cada projeto tem uma sessão do Claude Code em segundo plano, com a conta da pessoa (o mesmo "Conectar minha conta" da Fábrica, uma vez só). A conversa do projeto fica salva na pasta dele: dá para fechar o painel e continuar depois.
- **Vários vídeos ao mesmo tempo:** um por projeto, até um limite (padrão 2 ou 3, porque cada um gasta o limite do plano do Claude).
- **Modo recado:** se a pessoa não conectar a conta, o painel funciona como hoje (o pedido vai para o chat do Claude).

## O processo (igual para todos os estilos, com as paradas para aprovar)
1. **Briefing:** o Claude junta tudo:
   - a identidade do projeto (cor, logo, fonte, tom);
   - o estilo e o modelo escolhidos;
   - o material anexado, e o que tirar do link (a página do produto, por exemplo).
   Pergunta só o que faltar.
2. **Roteiro** ⛔. **No 3D**, entra antes a **pesquisa**: temas que já viralizaram e fatos com fonte.
3. **Storyboard** ⛔: um quadro por cena com a fala embaixo (a folha de quadros que já geramos), para aprovar antes de gastar voz e render.
4. **Narração**, à escolha:
   - ElevenLabs (chave da pessoa);
   - Higgsfield (créditos, mostra o custo antes);
   - VoiceStudio grátis;
   - **subir um áudio pronto** (hoje o painel só aceita vídeo: passa a aceitar áudio também);
   - gravar a própria voz ali mesmo.
5. **Cenas e render:** o andamento aparece ao vivo.
6. **Entrega:** o vídeo no painel. A pessoa aprova ou pede ajuste pelo chat (escrito ou por áudio).

## Os modelos (a biblioteca de referências)
- **Só material nosso ou com licença.** Os 17 vídeos da Fábrica ficam de fora.
- **Pinterest e Instagram de terceiros:** servem de inspiração para você criar os nossos, mas não entram no produto. Pôr vídeo de outra pessoa no produto que você vende é problema de direito autoral, e aluno reconhece.
- **Entram:**
  - os exemplos que já temos (Bit, 3D da ponte e do bunker, motion v3, papel);
  - os vídeos do **pack de edições** que você está criando: cada um vira um modelo com o "código" dele, que o Claude reaproveita trocando marca e textos. É o que a Fábrica faz com o pack de 50 estilos.
- **Cada modelo tem:** vídeo de exemplo, categoria, nicho, a skill que faz e as instruções do estilo. Dá para adicionar modelo novo sem mexer no código: é uma pasta com o vídeo e um arquivo de texto.

## Segurança (rodar o Claude sozinho no computador do aluno é sério)
- **Área isolada:** a sessão do Claude roda com sandbox. Grava só na pasta de trabalho e na de temporários, e a internet fica liberada só para o que o trabalho usa (npm, PyPI, fontes, ElevenLabs, Higgsfield, YouTube para referência).
- **Permissões viram botões Permitir / Negar no painel.** Nunca é oferecido "permitir sempre" para apagar, instalar, rede nova ou sair da pasta.
- **Mensagens do chat e conteúdo de link são dados, não ordens de sistema:** uma página de produto não pode mandar o Claude fazer outra coisa.
- **Antes de ir para os alunos:** auditoria com a skill de segurança, nunca em produção.

## Fases (cada uma termina testada e utilizável)
1. ✅ (06/11, testada) **Projetos e chat em modo recado:**
   - layout novo, lista de projetos com marca própria e chat com texto, áudio e anexos (aceitando áudio);
   - **o Claude trabalha no painel:** sessão por projeto, resposta ao vivo e etapas na direita;
   - permissões viram botões. Sem sandbox ainda, só para você testar.
2. ✅ (06/11, testada no motion) **Processo com paradas:** briefing → roteiro → storyboard → narração (as 5 opções) → render → entrega, nas 5 skills.
3. ✅ (06/11) **Modelos:** biblioteca por categoria, arrastar para o chat, modelos do pack de edições.
4. ✅ (06/11) **Segurança e produto:** sandbox, limite de vídeos ao mesmo tempo, auditoria, instalador e aula. Só aqui vai para os alunos.

Estimativa honesta: a fase 1 é a maior (o Claude rodando dentro do painel). As outras se apoiam nela.

## Depois da fase 4 (06/11, pedidos do Lucas)
- ✅ Painel independente da conversa do Claude (processo solto; sobrevive a fechar o app). Chave sobrevive a recarregar e abas novas.
- ✅ Vídeos completos dos modelos no pacote (locais, nada no R2) com player na galeria.
- ✅ Dashboard "Entregas": todos os vídeos entregues, com capa, player, download e números gerais.
- ✅ Painel 2.1: telas Início / Projetos / Modelos (por categoria → chat com a skill certa) / Entregas, vídeos por projeto no chat, excluir projeto (lixeira).
- Biblioteca de peças 3D: mostrar na aula do 3D como valor da skill (está em `_ferramentas/pecas-3d`, 741 peças); é da outra conversa.
- Modelo de cortes de podcast: quando houver material próprio.
- Edição de um cliente real (alguém falando para a câmera): quando o Lucas conseguir um.
- Antes de publicar: apagar tudo no Mac do Lucas e instalar do zero como aluno; depois apagar de novo e publicar; testar no Windows.
- (08/11) **Capa e título**: etapa Capa depois da entrega, estilo "Capa e título" (grupo Para criador de conteúdo), Marca → Capas que deram certo. Skill `capas-com-ia`. Detalhes em `AREA-DE-MEMBROS.md` (Módulo 08). Ainda não publicado.
