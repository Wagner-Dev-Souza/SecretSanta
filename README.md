# Amigo Secreto — API

> API REST para organizar sorteios de amigo secreto: cadastra o grupo, realiza o sorteio e envia o resultado por e-mail para cada participante.

## 🎯 O problema

Organizar amigo secreto em grupo pequeno sempre esbarra nas mesmas tarefas manuais: juntar os nomes, sortear sem que alguém tire a si mesmo, avisar cada pessoa do seu par e manter em sigilo quem tirou quem. Feito à mão, é fácil errar ou vazar o resultado.

## 💡 A solução

A API centraliza o processo:

- Cadastro do evento (o "amigo secreto") com o nome do grupo
- Cadastro dos **participantes** de cada evento
- **Sorteio** dos pares em rotação, garantindo que ninguém tire a si próprio
- **Envio do resultado por e-mail** para cada participante, individualmente
- Persistência do resultado do sorteio para consulta posterior

## 🏗️ Arquitetura

```
[Cliente HTTP]
      ↓
[routes] → [controllers] → [services] → [repositories] → [models / MongoDB]
                                ↓
                        [nodemailer / Gmail]
```

**Decisões técnicas:**

| Decisão | Escolha | Por quê |
|---|---|---|
| Banco | MongoDB com Mongoose | o modelo é de documento aninhado: um evento contém uma lista de participantes |
| Organização | camadas (rotas, controllers, services, repositórios, models) | separa entrada HTTP, regra de negócio e acesso a dados |
| E-mail | Nodemailer com Gmail | avisar cada participante individualmente era requisito do projeto |
| Ambiente | Docker Compose | sobe a API e o banco juntos, sem instalar MongoDB na máquina |

## 🔌 Endpoints

**Eventos (`/secret-santa`)**

| Método | Rota | Ação |
|---|---|---|
| GET | `/secret-santa` | lista os eventos (aceita filtros por query) |
| GET | `/secret-santa/:id` | busca um evento pelo ID |
| POST | `/secret-santa` | cria um evento |
| PATCH | `/secret-santa/:id` | atualiza um evento |
| DELETE | `/secret-santa/:id` | remove um evento |

**Participantes (`/secret-santa/:id/users`)**

| Método | Rota | Ação |
|---|---|---|
| GET | `/secret-santa/:id/users` | lista os participantes do evento |
| GET | `/secret-santa/:id/users/:userId` | busca um participante |
| POST | `/secret-santa/:id/users` | adiciona participante |
| PATCH | `/secret-santa/:id/users/:userId` | atualiza participante |
| DELETE | `/secret-santa/:id/users/:userId` | remove participante |
| GET | `/secret-santa/:id/sortUsers` | realiza o sorteio e dispara os e-mails |

Os IDs são validados como UUID e o corpo das requisições passa por validação antes de chegar ao serviço.

## ▶️ Como rodar

**Com Docker (recomendado):**

```bash
cp .sample.env .env      # preencha as variáveis
npm run db:up           # MongoDB em container (volume nomeado)
npm start                # API em http://localhost:3000
```

Ou tudo dentro do Docker: `docker compose up`.

**Localmente:**

```bash
npm install
cp .sample.env .env
npm start                # http://localhost:3000
```

## 🗄️ Banco de dados: com volume e sem volume

| Modo | Como subir | O que acontece com os dados |
|---|---|---|
| **Persistente** (padrão) | `npm run db:up` | ficam num volume nomeado do Docker (`mongo-data`); sobrevivem a `npm run db:down`, restart e reboot |
| **Descartável** | `npm run db:up:ephemeral` | vivem em memória (`tmpfs`); ao derrubar com `npm run db:down:ephemeral`, o banco zera sozinho |

Os dois modos publicam a mesma porta (27017), então rode um por vez. O modo descartável usa
um projeto Compose próprio (`secretsanta-ephemeral`) e não encosta no volume do modo persistente.

**Zerar o banco sem derrubar nada:**

```bash
npm run db:reset     # dropDatabase() no container que está no ar
npm run db:destroy   # apaga o volume do modo persistente (docker compose down -v)
```

O banco **não** fica dentro da pasta do repositório: o volume é gerenciado pelo Docker.

## ⚙️ Variáveis de ambiente

| Variável | Para que serve |
|---|---|
| `DB_HOST` | host do MongoDB |
| `DB_PORT` | porta do MongoDB |
| `DB_NAME` | nome do banco |
| `MAILER_EMAIL` | conta Gmail usada no envio |
| `MAILER_PASS` | senha de aplicativo dessa conta Gmail |
| `MAILER_TRANSPORT` | transporte de e-mail: `gmail` (padrão) ou `json` (não envia, usado nos testes) |

O arquivo `.env` **não** é versionado — use o `.sample.env` como modelo e nunca comite credenciais.

## 📧 Mensageria: como configurar o envio de e-mail

O sorteio avisa cada participante por e-mail, e o envio é feito por uma conta **Gmail** usando uma **senha de app**. As duas variáveis precisam estar preenchidas no `.env`, com **exatamente estes nomes**:

```env
MAILER_EMAIL=seu.email@gmail.com
MAILER_PASS=abcdefghijklmnop
```

> ⚠️ `MAILER_EMAIL` não é a senha da conta. É uma **senha de app**, gerada à parte, com 16 caracteres. A senha normal do Gmail **não funciona** aqui e não deve ser usada.

### Passo a passo para gerar a senha de app

1. **Crie uma conta Gmail para o projeto.** Não use sua conta pessoal — essa credencial fica no arquivo de ambiente de quem roda o projeto.
2. **Ative a verificação em duas etapas** em [`myaccount.google.com/security`](https://myaccount.google.com/security). Esse passo é obrigatório: **o Google só libera senha de app para contas com verificação em duas etapas ativa**.
3. Acesse [`myaccount.google.com/apppasswords`](https://myaccount.google.com/apppasswords).
4. Dê um nome para a senha (ex.: `amigo-secreto`) e clique em **Criar**.
5. O Google mostra **16 caracteres** — copie na hora, porque **ele não mostra de novo**.
6. Cole em `MAILER_PASS` no seu `.env`, **sem espaços**.
7. Reinicie a aplicação. Se as variáveis estiverem ausentes ou erradas, a aplicação **avisa no console na subida** — o sorteio não vai enviar nada em silêncio.

### Se os e-mails não estiverem saindo

- Confira se os **dois** nomes estão exatamente iguais aos do exemplo acima
- Confirme que a **verificação em duas etapas** está ativa na conta
- Verifique se o Google não **revogou** a senha de app (acontece ao trocar a senha da conta)
- Lembre que contas novas do Gmail podem ter limite diário de envio reduzido

## 📂 Estrutura

```
app.js                 # sobe o Express, liga rotas e tratamento de erro
routes/                # definição das rotas
controllers/           # entrada HTTP e resposta
services/              # regra de negócio (inclui o sorteio e o envio de e-mail)
repositories/          # acesso ao banco
models/                # schemas do Mongoose
middlewares/           # validação de payload e tratamento de erros
constants/             # mensagens e constantes
db/connection.js       # conexão com o MongoDB
Dockerfile / docker-compose.yml
```

## 🧪 Testes

Suíte de integração com **Jest + Supertest**, rodando contra um MongoDB em memória
(`mongodb-memory-server`) — não precisa de banco instalado nem do Docker:

```bash
npm test
```

O que está coberto: criação, renome, busca e remoção de eventos; CRUD de participantes;
validações de payload e de UUID; sorteio (ninguém tira a si mesmo, cada um dá e recebe
exatamente um presente, par persistido no banco); e o relatório de envio de e-mail.

Os testes rodam com `MAILER_TRANSPORT=json` — nenhum e-mail real é disparado.

## 🗺️ Roadmap

- [x] Testes de integração dos endpoints e do sorteio
- [ ] Pipeline de integração contínua
- [ ] Autenticação para proteger as rotas de administração

## 👥 Autores

Projeto desenvolvido em grupo por:

- Wagner Souza
- Deyvison Ramos
- Davi Nunes
- Raphael Machado

## 📄 Licença

ISC, conforme declarado no `package.json` do projeto.
