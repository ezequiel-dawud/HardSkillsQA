# -*- coding: utf-8 -*-
"""Escreve o bloco de <meta> (busca e compartilhamento) em todas as paginas do site,
mais robots.txt e sitemap.xml.  Rodar da raiz do repo:  python site/assets/og/meta.py

Roda quantas vezes quiser: o bloco fica entre marcadores e e' reescrito por inteiro.
Paginas novas entram sozinhas. Se trocar de dominio, muda so o BASE aqui embaixo.
"""
import io, os, re, html, glob, datetime

BASE = "https://qa-learning-nine.vercel.app"
INICIO, FIM = "  <!-- meta: gerado por site/assets/og/meta.py -->", "  <!-- /meta -->"

# trilha -> (nome, card og, o que a pagina de modulo e' na pratica)
TRILHAS = {
    "fundamentos": ("Fundamentos de Teste", "og-fundamentos"),
    "git":         ("Git e GitHub para QA", "og-git"),
    "sql":         ("SQL para QA",          "og-sql"),
    "pg":          ("PostgreSQL para QA",   "og-pg"),
    "api":         ("Teste de API",         "og-api"),
    "pytest":      ("Validação com pytest", "og-pytest"),
    "k6":          ("Teste de carga com k6","og-k6"),
    "cicd":        ("CI/CD para QA",        "og-cicd"),
    "projeto":     ("Projeto final",        "og-projeto"),
}

# frase de fecho pros modulos cuja legenda e' so uma lista de comandos (descricao curta demais)
CAUDA = {
    "sql":         "Teoria curta e exercícios que rodam num banco dentro do próprio navegador.",
    "pg":          "Teoria curta e exercícios num Postgres que sobe dentro do próprio navegador.",
    "api":         "Teoria curta e exercícios contra uma API que roda dentro do próprio navegador.",
    "pytest":      "Teoria curta no site e prática rodando na sua máquina.",
    "k6":          "Teoria curta no site e prática rodando na sua máquina.",
    "cicd":        "Teoria curta e pipelines de verdade pra ler e mexer.",
    "fundamentos": "Teoria curta e exercícios corrigidos na hora.",
    "git":         "Teoria curta e exercícios corrigidos na hora.",
}

# descricoes escritas a mao para as paginas que nao sao modulo/prova
MAO = {
    "index.html": "Trilhas práticas pra crescer como QA: fundamentos de teste, Git, SQL, PostgreSQL, teste de API, pytest, carga com k6 e CI/CD. Grátis, em português, e a maior parte roda no próprio navegador.",
    "sobre.html": "Quem faz o QA Learning: Ezequiel Dawud, QA / analista de testes. Por que o curso existe e como mandar sugestão ou correção.",
}

def limpar(t):
    t = re.sub(r"<[^>]+>", " ", t)
    t = html.unescape(t)
    t = t.replace("←", " ")
    t = re.sub(r"\s+", " ", t)
    t = re.sub(r"\s+([,.;:!?])", lambda m: m.group(1), t)   # <em>x</em>. deixava " ." no meio
    return t.strip(" .·—-")

def cortar(t, n=158):
    if len(t) <= n: return t
    return t[:n].rsplit(" ", 1)[0].rstrip(" ,;:—-") + "…"

def dados_da_pagina(caminho):
    s = io.open(caminho, encoding="utf-8", newline="").read()
    titulo = limpar(re.search(r"<title>(.*?)</title>", s, re.S).group(1))
    corpo = re.search(r"<main[^>]*>(.*?)</main>", s, re.S)
    leg = re.search(r'<p class="legenda"[^>]*>(.*?)</p>', (corpo.group(1) if corpo else s), re.S)
    return s, titulo, limpar(leg.group(1)) if leg else ""

def descrever(rel, titulo, legenda):
    if rel in MAO: return MAO[rel]
    pasta = rel.split("/")[0] if "/" in rel else ""
    nome = TRILHAS.get(pasta, ("QA Learning", "og"))[0]
    arq = rel.split("/")[-1]
    leg = re.sub(r"\s*rever o módulo\s*$", "", legenda).strip(" .")
    if arq == "index.html":
        return cortar(leg or titulo)
    if arq.startswith("prova-"):
        n = arq.split("-")[1].split(".")[0]
        return cortar("Prova do módulo %s da trilha %s — %s. Corrigida na hora; 70%% fecha o módulo." % (n, nome, leg))
    n = arq.split("-")[1].split(".")[0] if arq.startswith("modulo-") else ""
    corpo = leg or "Teoria curta em cima, prática logo abaixo"
    onde = "Módulo %s da trilha %s, no QA Learning." % (n, nome) if n else "Trilha %s, no QA Learning." % nome
    ponto = "" if corpo[-1:] in "?!." else "."
    d = "%s%s %s" % (corpo, ponto, onde)
    if len(d) < 100: d += " " + CAUDA.get(pasta, "")
    return cortar(d.strip())

def bloco(rel, titulo, desc, fim_de_linha="\n"):
    pasta = rel.split("/")[0] if "/" in rel else ""
    card = TRILHAS.get(pasta, ("", "og"))[1]
    url = BASE + "/" + ("" if rel == "index.html" else rel)
    og_titulo = "QA Learning" if rel == "index.html" else titulo + " — QA Learning"
    e = lambda t: html.escape(t, quote=True)
    return fim_de_linha.join([
        INICIO,
        '  <meta name="description" content="%s" />' % e(desc),
        '  <link rel="canonical" href="%s" />' % url,
        '  <meta name="theme-color" content="#f4f5f7" media="(prefers-color-scheme: light)" />',
        '  <meta name="theme-color" content="#0f1420" media="(prefers-color-scheme: dark)" />',
        '  <link rel="icon" href="/favicon.ico" sizes="48x48" />',
        '  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />',
        '  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
        '  <meta property="og:type" content="website" />',
        '  <meta property="og:site_name" content="QA Learning" />',
        '  <meta property="og:locale" content="pt_BR" />',
        '  <meta property="og:url" content="%s" />' % url,
        '  <meta property="og:title" content="%s" />' % e(og_titulo),
        '  <meta property="og:description" content="%s" />' % e(desc),
        '  <meta property="og:image" content="%s/assets/og/%s.png" />' % (BASE, card),
        '  <meta property="og:image:width" content="1200" />',
        '  <meta property="og:image:height" content="630" />',
        '  <meta property="og:image:alt" content="%s" />' % e(og_titulo),
        '  <meta name="twitter:card" content="summary_large_image" />',
        FIM,
    ])

ALVO = re.compile(r'([ \t]*<meta name="viewport"[^>]*>\r?\n)')
CRLF = chr(13) + chr(10)
ANTIGO = re.compile(re.escape(INICIO) + r".*?" + re.escape(FIM) + r"\r?\n", re.S)

paginas = sorted(p.replace(os.sep, "/") for p in glob.glob("site/**/*.html", recursive=True))
escritas = []
for p in paginas:
    rel = p[len("site/"):]
    s, titulo, legenda = dados_da_pagina(p)
    fdl = CRLF if CRLF in s else "\n"      # nao troca o fim de linha do arquivo
    novo = bloco(rel, titulo, descrever(rel, titulo, legenda), fdl)
    s2 = ANTIGO.sub("", s)
    if not ALVO.search(s2):
        print("  ! sem <meta viewport>, pulei:", rel); continue
    s2 = ALVO.sub(lambda m: m.group(1) + novo + fdl, s2, count=1)
    if s2 != s: io.open(p, "w", encoding="utf-8", newline="").write(s2)
    escritas.append(rel)

io.open("site/robots.txt", "w", encoding="utf-8", newline="").write(
    "User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n" % BASE)

hoje = datetime.date.today().isoformat()
def prioridade(rel):
    if rel == "index.html": return "1.0"
    if rel.endswith("index.html"): return "0.9"
    if "/prova-" in rel: return "0.5"
    return "0.7"
itens = "".join(
    "  <url><loc>%s</loc><lastmod>%s</lastmod><priority>%s</priority></url>\n"
    % (BASE + "/" + ("" if r == "index.html" else r), hoje, prioridade(r)) for r in escritas)
io.open("site/sitemap.xml", "w", encoding="utf-8", newline="").write(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s</urlset>\n' % itens)

print("%d paginas, sitemap com %d URLs" % (len(escritas), len(escritas)))
