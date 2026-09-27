"""Gera os icones PNG do PWA (192, 512 e maskable 512).

Roda sem dependencia externa (encoder PNG proprio, so stdlib):

    python web/scripts/gerar-icones.py

Os arquivos saem em web/public/. O maskable usa o glifo na safe zone central e
fundo de borda a borda; o icone normal tem cantos arredondados transparentes.
"""
import struct, zlib, pathlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent.parent
SAIDA = RAIZ / "web" / "public"
LADO_ICO = 256

FUNDO = (11, 18, 32, 255)
AZUL = (79, 156, 249, 255)
CLARO = (125, 184, 255, 255)
VERMELHO = (242, 96, 79, 255)
VAZIO = (0, 0, 0, 0)

BOW_ESQ = [(0.5, 0.33), (0.24, 0.20), (0.24, 0.33)]
BOW_DIR = [(0.5, 0.33), (0.76, 0.20), (0.76, 0.33)]


def dentro_triangulo(u, v, pontos):
    (x1, y1), (x2, y2), (x3, y3) = pontos
    d1 = (u - x2) * (y1 - y2) - (x1 - x2) * (v - y2)
    d2 = (u - x3) * (y2 - y3) - (x2 - x3) * (v - y3)
    d3 = (u - x1) * (y3 - y1) - (x3 - x1) * (v - y1)
    tem_neg = d1 < 0 or d2 < 0 or d3 < 0
    tem_pos = d1 > 0 or d2 > 0 or d3 > 0
    return not (tem_neg and tem_pos)


def cor_em(u, v, maskable):
    # so o GLIFO entra na safe zone; o fundo usa as coordenadas originais do canvas
    escala = 0.82 if maskable else 1.0
    gu = 0.5 + (u - 0.5) * escala
    gv = 0.5 + (v - 0.5) * escala

    if dentro_triangulo(gu, gv, BOW_ESQ) or dentro_triangulo(gu, gv, BOW_DIR):
        return VERMELHO
    if 0.45 <= gu <= 0.55 and 0.33 <= gv <= 0.78:    # fita central
        return FUNDO
    if 0.16 <= gu <= 0.84 and 0.33 <= gv <= 0.43:    # tampa
        return CLARO
    if 0.20 <= gu <= 0.80 and 0.43 <= gv <= 0.78:    # corpo da caixa
        return AZUL

    if maskable:
        return FUNDO    # maskable vai de borda a borda: o sistema recorta

    # cantos arredondados (icone normal, avaliados no canvas original)
    raio = 0.22
    ux = min(u, 1 - u)
    uy = min(v, 1 - v)
    if ux < raio and uy < raio and (raio - ux) ** 2 + (raio - uy) ** 2 > raio * raio:
        return VAZIO
    return FUNDO


def gerar_png(size, maskable, amostras=4):
    pixels = bytearray(size * size * 4)
    passo = 1.0 / (size * amostras)
    for y in range(size):
        for x in range(size):
            r = g = b = a = 0
            for sy in range(amostras):
                v = (y * amostras + sy + 0.5) * passo
                for sx in range(amostras):
                    u = (x * amostras + sx + 0.5) * passo
                    cr, cg, cb, ca = cor_em(u, v, maskable)
                    r += cr * ca
                    g += cg * ca
                    b += cb * ca
                    a += ca
            if a:
                i = (y * size + x) * 4
                pixels[i] = r // a
                pixels[i + 1] = g // a
                pixels[i + 2] = b // a
                pixels[i + 3] = a // (amostras * amostras)
    return png_bytes(size, size, pixels)


def gerar(size, maskable, caminho):
    dados = gerar_png(size, maskable)
    caminho.write_bytes(dados)
    print(f"  {caminho.name}: {size}x{size} ({len(dados)} bytes)")
    return dados


def bloco(tipo, dados):
    return (
        struct.pack(">I", len(dados))
        + tipo
        + dados
        + struct.pack(">I", zlib.crc32(tipo + dados) & 0xFFFFFFFF)
    )


def png_bytes(largura, altura, pixels):
    cru = bytearray()
    for y in range(altura):
        cru.append(0)
        cru += pixels[y * largura * 4:(y + 1) * largura * 4]
    dados = b"\x89PNG\r\n\x1a\n"
    dados += bloco(b"IHDR", struct.pack(">IIBBBBB", largura, altura, 8, 6, 0, 0, 0))
    dados += bloco(b"IDAT", zlib.compress(bytes(cru), 9))
    dados += bloco(b"IEND", b"")
    return dados


def ico_bytes(png):
    """Envelopa um PNG num .ico (formato aceito pelo Windows desde o Vista)."""
    lado = 0 if LADO_ICO >= 256 else LADO_ICO
    cabecalho = struct.pack("<HHH", 0, 1, 1)
    entrada = struct.pack("<BBBBHHII", lado, lado, 0, 0, 1, 32, len(png), 6 + 16)
    return cabecalho + entrada + png


print("gerando icones")
gerar(192, False, SAIDA / "icon-192.png")
gerar(512, False, SAIDA / "icon-512.png")
gerar(512, True, SAIDA / "icon-maskable-512.png")

# .ico para o atalho do Windows e para o lancador
destino_ico = RAIZ / "launcher" / "icon.ico"
png = gerar_png(LADO_ICO, False)
destino_ico.write_bytes(ico_bytes(png))
print(f"  {destino_ico.name}: {LADO_ICO}x{LADO_ICO} ({destino_ico.stat().st_size} bytes)")
