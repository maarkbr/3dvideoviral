# Edição com IA: comece aqui

Você só precisa de uma coisa: o **Claude** (aplicativo, aba Code) aberto. Ele instala o resto.

## 1. Cole esta frase no Claude

Abra o Claude, aba **Code**, e escolha esta pasta (`Edicao-com-IA`, a que você descompactou) como pasta do chat. Depois cole:

```
Instala o Edição com IA. Leia o COMECE-AQUI.md desta pasta e siga as instruções para o Claude que estão no fim dele.
```

O Claude vai perguntar o **nome da sua pasta de trabalho** (o nome do seu canal ou cliente, por exemplo "Meu Canal") e qual **estilo de vídeo** você quer usar primeiro. Ele cria tudo e abre o painel.

Quer o painel completo, com todos os estilos de uma vez? Responda **"Todos"** quando ele perguntar o estilo.

## 2. Conectar a sua conta (uma vez só, no Mac)

O painel tem um chat onde o Claude trabalha por dentro, com a sua assinatura. Para isso, abra o painel e clique em **Conectar minha conta** no topo: o navegador abre a página do Claude, você clica em **Autorizar** e volta. Pronto. No Windows, por enquanto, o painel manda o pedido para o chat do Claude (modo recado).

## Usa o ChatGPT no lugar do Claude? Também funciona (Mac)

O painel funciona também com o **Codex**, que vem dentro do **app do ChatGPT** para computador.
1. Baixe o app do ChatGPT em https://developers.openai.com/codex/app e entre na sua conta.
2. Abra o **Codex**, escolha esta pasta (`Edicao-com-IA`) e cole a mesma frase do passo 1. Se ele pedir para liberar a internet, permita (ele baixa as ferramentas de vídeo).
3. No painel, **Conectar minha conta** abre a página do ChatGPT. Na primeira mensagem, aparece o cartão **Liberar a internet para o ChatGPT (Codex) trabalhar**: clique em permitir (uma vez só).
4. Tem o Claude e o ChatGPT? O topo do painel mostra **Usar o ChatGPT** / **Usar o Claude**: você escolhe quem trabalha.
5. Capa caprichada e voz do Higgsfield no ChatGPT: precisam do programa do Higgsfield no computador (o Claude ou o ChatGPT instala para você e você entra na conta uma vez). Sem ele, use a capa simples e a voz grátis ou a sua.

## 3. Depois de instalado

- Para abrir o painel, dê **dois cliques em "Abrir Painel"** dentro da sua pasta de trabalho, ou diga ao Claude: "abre o painel".
- Para trabalhar, abra o Claude **na sua pasta de trabalho** (não nesta aqui).
- Cada estilo novo se instala pelo próprio painel, no botão **Instalar este estilo**. Assim você só baixa o que vai usar.
- **Atualizações:** quando sair uma versão nova, o Início do painel mostra a faixa "Versão X disponível" com o botão **Atualizar agora**. Ele troca só o painel e os estilos e volta sozinho; seus projetos, modelos e marca ficam como estão. Pelo chat também funciona: "atualiza o painel".

Travou? Suporte no WhatsApp: https://wa.me/5587981738625

---

## Instruções para o Claude

> **Se você é o Codex (ChatGPT) e não o Claude:** siga os mesmos passos abaixo. Rode o instalador com a internet liberada (peça à pessoa se o
> Codex estiver sem rede). Ele também copia as skills para `~/.agents/skills` (a pasta que o Codex lê). Nas mensagens para a pessoa, diga
> "ChatGPT" onde está "Claude", e no fim diga que, no painel, "Conectar minha conta" abre a página do ChatGPT.


Siga na ordem e fale com a pessoa em português simples. Uma pergunta por vez, com opções clicáveis.

1. Pergunte o **nome da pasta de trabalho** (sugira o nome do canal dela) e **onde** criar. O padrão é dentro da pasta pessoal. Monte o caminho, por exemplo `~/Meu Canal`.
2. Pergunte **qual estilo ela quer usar primeiro**: Vídeo falado, Cortes de podcast, YouTube (vídeos longos, estilo Lucas Editor), Estilo Bit, Vídeo 3D, Motion de produto, Mapas e história, Palitinho (bonequinho de palito), Documentário, Capa e título ou **Todos (o painel completo)**. Dá para escolher mais de um, e os outros ela instala depois pelo painel.
3. Rode, nesta pasta, em segundo plano (pode levar alguns minutos):
   - Mac/Linux: `bash instalar.sh --pasta "<caminho>" --estilo <id> --sim`
   - Windows: `Instalar.bat --pasta "<caminho>" --estilo <id> --sim`
   - **Todos:** troque `--estilo <id>` por `--todos`. Instala as 9 skills de uma vez e baixa uma vez só o que elas dividem (Python com Whisper, efeitos sonoros), mais as peças 3D.

   Os ids são `video-falado`, `cortes-podcast`, `youtube`, `estilo-bit`, `video-3d`, `motion`, `mapas`, `palitinho`, `documentario` e `capa-e-titulo` (repita `--estilo` para vários).
4. Se algum item **FALHOU**:
   - leia a mensagem, corrija e rode de novo com `--conferir` no lugar de `--sim`;
   - programas do computador (Node, FFmpeg, Python): o instalador tenta pelo Homebrew no Mac e pelo winget no Windows. Se não der, explique em uma linha como instalar e espere a pessoa.
5. Pergunte qual **voz** ela quer na narração (a própria, VoiceStudio com VoxCPM2 grátis ou ElevenLabs) e siga o `voz-ia.md` da skill do estilo. Instale só a escolhida, perguntando antes.
6. Abra o painel: `python3 ~/.claude/skills/painel-edicao-com-ia/scripts/painel.py abrir "<caminho>"`, em segundo plano. Diga à pessoa: "Pronto! No painel, clique em **Conectar minha conta** (uma vez), depois abra o seu projeto, conte o que quer e mande. Na próxima vez, dois cliques em Abrir Painel, ou abra o Claude direto na pasta <nome>." Se o instalador avisou que o Claude de terminal não foi instalado (ou é Windows), rode também o `esperar` da skill `painel-edicao-com-ia` e trate os pedidos aqui.
