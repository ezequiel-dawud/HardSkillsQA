# -*- coding: utf-8 -*-
"""Gera o ícone do site e os cards de compartilhamento (og:image).
Rodar da raiz do repo:  python gerar_imagens.py"""
from PIL import Image, ImageDraw, ImageFont

FUNDO   = (15, 20, 32)     # --bg escuro
ACENTO  = (91, 147, 255)   # --acento escuro
TEXTO   = (231, 235, 242)  # --texto escuro
SUAVE   = (154, 164, 180)  # --suave escuro
BORDA   = (42, 50, 66)     # --borda escuro

F = "C:/Windows/Fonts/"
def fonte(nome, tam): return ImageFont.truetype(F + nome, tam)

def marca(d, x, y, lado, raio=None, fundo=FUNDO, cor=ACENTO, moldura=True):
    """Quadrado arredondado com um check dentro — o mesmo desenho do favicon.svg."""
    r = raio if raio is not None else lado * 0.22
    d.rounded_rectangle([x, y, x + lado, y + lado], radius=r, fill=fundo,
                        outline=BORDA if moldura else None, width=max(1, int(lado * 0.02)))
    # check: 3 pontos em fracao do lado
    p = [(0.26, 0.52), (0.43, 0.70), (0.76, 0.32)]
    pts = [(x + a * lado, y + b * lado) for a, b in p]
    d.line(pts, fill=cor, width=max(2, int(lado * 0.11)), joint="curve")
    # ponta arredondada nas extremidades
    raio_p = max(1, int(lado * 0.055))
    for px, py in (pts[0], pts[2]):
        d.ellipse([px - raio_p, py - raio_p, px + raio_p, py + raio_p], fill=cor)

def icone(lado):
    img = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    marca(d, 0, 0, lado - 1, moldura=False)
    return img

# ---- favicon.png / .ico / apple-touch-icon ----
icone(512).save("site/assets/og/icone-512.png")
icone(180).save("site/apple-touch-icon.png")
icone(256).save("site/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

# ---- cards 1200x630 ----
CARDS = [
    ("og",            "QA Learning",        "Trilhas práticas pra crescer como QA, do zero.",  "8 trilhas", "38 módulos", "roda no navegador"),
    ("og-fundamentos","Fundamentos de Teste","O que testar, por quê, e como decidir onde olhar.","5 módulos", "5 provas",   "~3h30"),
    ("og-git",        "Git e GitHub",       "Pegar o codigo, versionar o seu, e revisar um PR.", "3 módulos", "3 provas",   "~2h"),
    ("og-sql",        "SQL para QA",        "Investigar e validar dados — a habilidade que mais muda o dia a dia.", "7 módulos", "7 provas", "roda no navegador"),
    ("og-pg",         "PostgreSQL para QA", "O mesmo e-commerce, agora num Postgres de verdade.","7 módulos", "7 provas",   "roda no navegador"),
    ("og-api",        "Teste de API",       "Status, contrato, e cruzar a resposta com o banco.","4 módulos", "4 provas",   "roda no navegador"),
    ("og-pytest",     "Validação com pytest","Suas verificações viram testes que rodam sozinhos.","4 módulos","4 provas",   "roda na sua máquina"),
    ("og-k6",         "Teste de carga com k6","Carga de verdade: stages, thresholds e portão no CI.","4 módulos","4 provas", "roda na sua máquina"),
    ("og-cicd",       "CI/CD para QA",      "Ler um pipeline e fazer o build reprovar quando quebra.","4 módulos","4 provas","leitura + prática"),
    ("og-playwright", "Playwright",         "Automação web de verdade: clicar, esperar, mockar rede.","4 módulos","4 provas","roda na sua máquina"),
    ("og-projeto",    "Projeto final",      "Juntar as seis trilhas num caso de teste de ponta a ponta.","1 entrega","6 trilhas","fecha o curso"),
]

L, A = 1200, 630
f_kicker = fonte("consolab.ttf", 26)
f_sub    = fonte("segoeui.ttf", 34)
f_chip   = fonte("consola.ttf", 24)

def card(arquivo, titulo, sub, *chips):
    img = Image.new("RGB", (L, A), FUNDO)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, L, 8], fill=ACENTO)                    # faixa de acento no topo
    d.rounded_rectangle([56, 56, L - 56, A - 56], radius=24, outline=BORDA, width=2)

    x = 104
    marca(d, x, 112, 88, moldura=False)
    d.text((x + 116, 128), "$ QA LEARNING", font=f_kicker, fill=ACENTO)
    d.text((x + 116, 166), "qa-learning-nine.vercel.app", font=fonte("consola.ttf", 22), fill=SUAVE)

    # titulo: diminui a fonte ate caber na largura util
    util = L - 2 * x
    tam = 84
    while tam > 40:
        f = fonte("segoeuib.ttf", tam)
        if d.textlength(titulo, font=f) <= util: break
        tam -= 4
    d.text((x, 268), titulo, font=f, fill=TEXTO)
    d.text((x, 268 + tam + 24), sub, font=f_sub, fill=SUAVE)

    cx = x
    for c in chips:
        w = d.textlength(c, font=f_chip) + 36
        d.rounded_rectangle([cx, A - 148, cx + w, A - 100], radius=24, fill=(23, 29, 43), outline=BORDA, width=1)
        d.text((cx + 18, A - 137), c, font=f_chip, fill=SUAVE)
        cx += w + 14
    img.save("site/assets/og/%s.png" % arquivo, optimize=True)

for c in CARDS:
    card(*c)
print("ok")
