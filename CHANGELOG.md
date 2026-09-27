# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e
[versionamento semântico](https://semver.org/lang/pt-BR/).

## [1.0.0] — 2026-09-27

Primeira versão completa: além da API original, o projeto ganhou front instalável, lançador
para Windows, testes automatizados, integração contínua e correções de bugs que impediam o
sorteio de funcionar de ponta a ponta.

### Adicionado

- **Front end** (React + Vite) servido por nginx com proxy `/api`, sem CORS e sem expor a API:
  listar, criar, renomear e excluir grupo; adicionar, editar e remover participante.
- **Tela de sorteio** com confirmação explícita — o sorteio envia e-mail de verdade, então o botão
  só habilita com 2+ participantes e passa por um modal que diz quantos e-mails serão disparados.
- **Relatório de envio** na resposta do sorteio (`sent`, `failed`, `errors`), com os pares.
- **PWA instalável**: ícones 192/512/maskable, manifest e service worker (`/api` nunca vem do cache).
- **Executável de lançamento** para Windows (Go, só biblioteca padrão): confere o Docker, sobe o
  Docker Desktop se preciso, atualiza o projeto, sobe os containers e abre a janela em modo aplicativo.
- **Testes automatizados**: 11 na API (Jest + Supertest sobre MongoDB em memória) e 10 na interface
  (Vitest + Testing Library).
- **Integração contínua** em três frentes (API, front e lançador), com o `.exe` publicado como artefato.
- **Banco** em volume nomeado, modo descartável (`tmpfs`) e scripts `db:reset` / `db:destroy`.
- `MAILER_TRANSPORT` para escolher entre envio real (`gmail`) e transporte de teste (`json`).
- `LICENSE`, este `CHANGELOG`, `docs/screenshots` e `.gitattributes` (binários fora do autocrlf).

### Corrigido

- **O resultado do sorteio era salvo sem o amigo oculto**: o schema usava `occultFriend` e o serviço
  gravava `amigoOculto`, então o Mongoose descartava o campo em silêncio.
- **Excluir um grupo apagava no banco e respondia "não encontrado"**: o repositório não devolvia o
  documento removido e o controller lia `undefined`. Agora responde `204`.
- **Falha de envio de e-mail era engolida** por um `console.log`: o sorteio respondia sucesso mesmo
  com zero e-mails enviados. O envio passou a ser aguardado e a falha volta na resposta.
- Handlers de participante chamavam `next(error)` sem declarar o parâmetro — o caminho de erro
  estourava `ReferenceError` e a requisição ficava pendurada.
- `sortUsers` não validava o UUID e não respondia em caso de erro (requisição pendurada).
- Sorteio em grupo inexistente estourava `500` em vez de responder `404`.
- **A API não conectava ao banco dentro do container**: o `.env` tinha `DB_HOST=localhost`, que
  dentro do container aponta para ele mesmo. O Compose passou a injetar `DB_HOST=mongodb`.
- **O Jest da raiz capturava a suíte do front** (Vitest, com JSX) e derrubava o CI mesmo com todos
  os testes passando.
- Embaralhamento enviesado (`sort` com `Math.random`) trocado por Fisher–Yates, sem mutar o array
  do documento carregado do banco.
- README citava a variável `MAILER_MAIL`, que não existe no código.

### Alterado

- Casos de "não encontrado" passaram de `200` com mensagem para `404` padronizado.
- `app.js` exporta o app e só sobe o servidor quando executado direto — necessário para os testes.
- Mensagem de aviso no boot quando `MAILER_EMAIL`/`MAILER_PASS` não estão configurados.
