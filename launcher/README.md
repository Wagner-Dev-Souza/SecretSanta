# SecretSanta — lançador (Windows)

App em Go que faz o encanamento: confere o Docker (sobe o Docker Desktop se estiver parado),
baixa/atualiza o projeto, sobe os containers e abre a janela do app em modo aplicativo.

```bash
go build -o SecretSanta.exe .
./SecretSanta.exe
```

Opções, requisitos e detalhes estão no README principal, seção *Executável de lançamento*.
Só biblioteca padrão: não tem `go.sum` nem dependência para baixar.
