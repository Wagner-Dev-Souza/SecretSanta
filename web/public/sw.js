// Service worker do SecretSanta.
// Regra de ouro: NADA da API vem do cache. Sorteio e participantes têm que ser sempre frescos.
const CACHE = "secretsanta-v1";
const ESSENCIAIS = ["/", "/manifest.webmanifest", "/icon.svg", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ESSENCIAIS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((chave) => chave !== CACHE).map((chave) => caches.delete(chave))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;

  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;

  // API: sempre rede, nunca cache
  if (url.pathname.startsWith("/api/")) return;

  // Navegacao (o HTML): rede primeiro, cache so como rede de seguranca.
  // HTML velho apontando para assets novos quebraria o app depois de um deploy.
  if (pedido.mode === "navigate") {
    evento.respondWith(
      fetch(pedido)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(CACHE).then((cache) => cache.put("/", copia));
          return resposta;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // Assets com hash no nome: cache primeiro (sao imutaveis)
  evento.respondWith(
    caches.match(pedido).then((emCache) => {
      if (emCache) return emCache;
      return fetch(pedido).then((resposta) => {
        if (resposta.ok) {
          const copia = resposta.clone();
          caches.open(CACHE).then((cache) => cache.put(pedido, copia));
        }
        return resposta;
      });
    })
  );
});
