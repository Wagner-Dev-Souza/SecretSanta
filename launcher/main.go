// SecretSanta — lancador para Windows.
//
// Clicou: confere o Docker, sobe a stack (MongoDB + API + front) e abre a janela
// do app. Nao tem interface propria de proposito: tudo roda em container.
//
// Uso:
//
//	SecretSanta.exe                 sobe tudo e abre a janela
//	SecretSanta.exe --recriar       rebuilda as imagens antes de subir
//	SecretSanta.exe --sem-janela    sobe sem abrir o navegador
//	SecretSanta.exe --abrir         apenas abre a janela
//	SecretSanta.exe --parar         derruba a stack (os dados do banco ficam no volume)
//	SecretSanta.exe --dir <pasta>   usa uma pasta de projeto especifica
//	SecretSanta.exe --projeto <n>   nome do projeto Compose (padrao secretsanta)
//	SecretSanta.exe --porta <n>     porta do front (padrao 8090)
package main

import (
	"archive/tar"
	"bufio"
	"compress/gzip"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

const (
	urlRepo              = "https://codeload.github.com/Wagner-Dev-Souza/SecretSanta/tar.gz/refs/heads/main"
	caminhoDockerDesktop = `C:\Program Files\Docker\Docker\Docker Desktop.exe`
	urlDocker            = "https://www.docker.com/products/docker-desktop/"
)

var (
	semJanela = flag.Bool("sem-janela", false, "sobe a stack mas nao abre a janela do app")
	parar     = flag.Bool("parar", false, "derruba a stack e sai")
	soAbrir   = flag.Bool("abrir", false, "apenas abre a janela (nao sobe nada)")
	recriar   = flag.Bool("recriar", false, "forca o rebuild das imagens")
	porta     = flag.Int("porta", 8090, "porta do front")
	dirFlag   = flag.String("dir", "", "pasta do projeto (padrao: %LOCALAPPDATA%\\SecretSanta\\app)")
	projeto   = flag.String("projeto", "secretsanta", "nome do projeto Docker Compose (define o volume do banco)")
)

func logf(format string, args ...any) {
	fmt.Printf("[%s] ", time.Now().Format("15:04:05"))
	fmt.Printf(format+"\n", args...)
}

func pausar() {
	fmt.Print("\nPressione Enter para fechar...")
	bufio.NewReader(os.Stdin).ReadString('\n')
}

func morrer(format string, args ...any) {
	logf("ERRO: "+format, args...)
	pausar()
	os.Exit(1)
}

func pastaApp() string {
	if *dirFlag != "" {
		abs, err := filepath.Abs(*dirFlag)
		if err != nil {
			morrer("pasta invalida (%v)", err)
		}
		return abs
	}
	return filepath.Join(os.Getenv("LOCALAPPDATA"), "SecretSanta", "app")
}

func temProjeto(dir string) bool {
	necessarios := []string{"docker-compose.yml", "package.json", "services/sortResult.js", "web/Dockerfile"}
	for _, rel := range necessarios {
		if _, err := os.Stat(filepath.Join(dir, filepath.FromSlash(rel))); err != nil {
			return false
		}
	}
	return true
}

func baixarProjeto(dir string) error {
	logf("baixando o projeto de %s", urlRepo)

	cliente := &http.Client{Timeout: 3 * time.Minute}
	resposta, err := cliente.Get(urlRepo)
	if err != nil {
		return err
	}
	defer resposta.Body.Close()

	if resposta.StatusCode != http.StatusOK {
		return fmt.Errorf("download respondeu HTTP %d", resposta.StatusCode)
	}

	gz, err := gzip.NewReader(resposta.Body)
	if err != nil {
		return err
	}
	defer gz.Close()

	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}

	leitor := tar.NewReader(gz)
	arquivos := 0
	for {
		cabecalho, err := leitor.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		// o pacote vem com uma pasta raiz (SecretSanta-main/): descarta ela
		nome := cabecalho.Name
		barra := strings.Index(nome, "/")
		if barra < 0 {
			continue
		}
		nome = nome[barra+1:]
		if nome == "" {
			continue
		}

		limpo := filepath.Clean(filepath.FromSlash(nome))
		if filepath.IsAbs(limpo) || strings.HasPrefix(limpo, "..") {
			return fmt.Errorf("entrada suspeita no pacote: %s", cabecalho.Name)
		}
		destino := filepath.Join(dir, limpo)

		switch cabecalho.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(destino, 0o755); err != nil {
				return err
			}
		case tar.TypeReg:
			if err := os.MkdirAll(filepath.Dir(destino), 0o755); err != nil {
				return err
			}
			arquivo, err := os.Create(destino)
			if err != nil {
				return err
			}
			if _, err := io.Copy(arquivo, leitor); err != nil {
				arquivo.Close()
				return err
			}
			arquivo.Close()
			arquivos++
		}
	}

	logf("%d arquivos extraidos em %s", arquivos, dir)
	return nil
}

func garantirEnv(dir string) {
	env := filepath.Join(dir, ".env")
	if _, err := os.Stat(env); err == nil {
		return
	}

	// credenciais do usuario ficam fora do codigo, numa pasta propria
	global := filepath.Join(os.Getenv("APPDATA"), "SecretSanta", ".env")
	if dados, err := os.ReadFile(global); err == nil {
		if err := os.WriteFile(env, dados, 0o600); err == nil {
			logf("credenciais copiadas de %s", global)
			return
		}
	}

	dados, err := os.ReadFile(filepath.Join(dir, ".sample.env"))
	if err != nil {
		logf("aviso: sem .env e sem .sample.env — crie o .env na mao")
		return
	}
	if err := os.WriteFile(env, dados, 0o600); err != nil {
		logf("aviso: nao consegui criar o .env (%v)", err)
		return
	}
	logf("aviso: .env criado a partir do modelo. Para o sorteio enviar e-mail, preencha")
	logf("       MAILER_EMAIL e MAILER_PASS em: %s", env)
}

func localizarDocker() string {
	if caminho, err := exec.LookPath("docker"); err == nil {
		return caminho
	}
	candidatos := []string{
		`C:\Program Files\Docker\Docker\resources\bin\docker.exe`,
	}
	for _, candidato := range candidatos {
		if _, err := os.Stat(candidato); err == nil {
			return candidato
		}
	}
	return ""
}

func engineAtivo(docker string) bool {
	cmd := exec.Command(docker, "info", "--format", "{{.ServerVersion}}")
	cmd.Stdout, cmd.Stderr = io.Discard, io.Discard
	return cmd.Run() == nil
}

func subirDockerDesktop() bool {
	if _, err := os.Stat(caminhoDockerDesktop); err != nil {
		return false
	}
	logf("iniciando o Docker Desktop...")
	cmd := exec.Command("cmd", "/c", "start", "", caminhoDockerDesktop)
	return cmd.Run() == nil
}

func esperarEngine(docker string, limite time.Duration) bool {
	fim := time.Now().Add(limite)
	for time.Now().Before(fim) {
		if engineAtivo(docker) {
			fmt.Println()
			return true
		}
		fmt.Print(".")
		time.Sleep(4 * time.Second)
	}
	fmt.Println()
	return false
}

func compose(docker, dir string, args ...string) error {
	// -p fixo: sem isso o projeto Compose seria o nome da pasta e o banco apareceria vazio
	cmd := exec.Command(docker, append([]string{"compose", "-p", *projeto}, args...)...)
	cmd.Dir = dir
	cmd.Stdout, cmd.Stderr = os.Stdout, os.Stderr
	return cmd.Run()
}

func frontResponde(porta int) bool {
	url := fmt.Sprintf("http://localhost:%d/api/secret-santa", porta)
	cliente := &http.Client{Timeout: 5 * time.Second}
	resposta, err := cliente.Get(url)
	if err != nil {
		return false
	}
	defer resposta.Body.Close()
	return resposta.StatusCode == http.StatusOK
}

func esperarFront(porta int, limite time.Duration) bool {
	fim := time.Now().Add(limite)
	for time.Now().Before(fim) {
		if frontResponde(porta) {
			fmt.Println()
			return true
		}
		fmt.Print(".")
		time.Sleep(3 * time.Second)
	}
	fmt.Println()
	return false
}

func abrirJanela(url string) {
	navegadores := []string{
		`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
		`C:\Program Files\Microsoft\Edge\Application\msedge.exe`,
		`C:\Program Files\Google\Chrome\Application\chrome.exe`,
		`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`,
	}
	for _, navegador := range navegadores {
		if _, err := os.Stat(navegador); err != nil {
			continue
		}
		cmd := exec.Command(navegador, "--app="+url)
		if cmd.Start() == nil {
			logf("janela do app aberta (modo aplicativo)")
			return
		}
	}

	logf("abrindo no navegador padrao")
	exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
}

func main() {
	flag.Parse()

	dir := pastaApp()
	url := fmt.Sprintf("http://localhost:%d", *porta)

	docker := localizarDocker()
	if docker == "" {
		logf("o Docker nao esta instalado nesta maquina.")
		fmt.Println("\nPara usar este app voce precisa do Docker Desktop:")
		fmt.Println("  " + urlDocker)
		fmt.Println("\nDepois de instalar, rode este executavel de novo.")
		exec.Command("rundll32", "url.dll,FileProtocolHandler", urlDocker).Start()
		pausar()
		os.Exit(1)
	}

	if *parar {
		logf("derrubando a stack em %s", dir)
		if err := compose(docker, dir, "down"); err != nil {
			morrer("falha ao derrubar a stack: %v", err)
		}
		logf("stack derrubada. Os dados do banco continuam no volume.")
		pausar()
		return
	}

	if *soAbrir {
		abrirJanela(url)
		return
	}

	if !engineAtivo(docker) {
		logf("o Docker esta instalado mas o engine nao esta respondendo")
		if !subirDockerDesktop() {
			morrer("nao consegui iniciar o Docker Desktop — abra ele e rode de novo")
		}
		logf("aguardando o engine subir (pode levar ate uns 2 minutos)")
		if !esperarEngine(docker, 4*time.Minute) {
			morrer("o engine do Docker nao ficou pronto a tempo")
		}
	}
	logf("Docker OK")

	primeiraVez := false
	if temProjeto(dir) {
		logf("projeto encontrado em %s", dir)
	} else {
		if err := baixarProjeto(dir); err != nil {
			morrer("falha ao baixar o projeto: %v", err)
		}
		primeiraVez = true
	}

	garantirEnv(dir)

	if frontResponde(*porta) {
		logf("a stack ja esta no ar")
	} else {
		args := []string{"up", "-d"}
		if *recriar || primeiraVez {
			args = append(args, "--build")
		}
		logf("subindo os containers (na primeira vez baixa imagens e builda: demora alguns minutos)")
		if err := compose(docker, dir, args...); err != nil {
			morrer("falha ao subir a stack: %v\nVeja o detalhe com: docker compose logs", err)
		}
		logf("aguardando o front responder")
		if !esperarFront(*porta, 3*time.Minute) {
			morrer("o front nao respondeu em %s", url)
		}
	}

	logf("tudo no ar: %s", url)
	if !*semJanela {
		abrirJanela(url)
	}
}
