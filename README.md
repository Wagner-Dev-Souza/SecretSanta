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
docker compose up
```

**Localmente:**

```bash
npm install
cp .sample.env .env
npm start                # http://localhost:3000
```

## ⚙️ Variáveis de ambiente

| Variável | Para que serve |
|---|---|
| `DB_HOST` | host do MongoDB |
| `DB_PORT` | porta do MongoDB |
| `DB_NAME` | nome do banco |
| `MAILER_MAIL` | conta Gmail usada no envio |
| `MAILER_PASS` | senha de aplicativo dessa conta Gmail |

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

Não há testes automatizados — é a principal lacuna do projeto.

## 🗺️ Roadmap

- [ ] Testes de integração dos endpoints e do sorteio
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
