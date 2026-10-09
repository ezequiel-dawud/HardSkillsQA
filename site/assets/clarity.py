# -*- coding: utf-8 -*-
"""Escreve o script do Microsoft Clarity em todas as paginas do site.
Rodar da raiz do repo:  python site/assets/clarity.py

Roda quantas vezes quiser: o bloco fica entre marcadores e e' reescrito por inteiro.
Paginas novas entram sozinhas.
"""
import io, glob

PROJECT_ID = "yv675t5cze"
INICIO, FIM = "  <!-- clarity: gerado por site/assets/clarity.py -->", "  <!-- /clarity -->"

BLOCO = """%s
  <script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "%s");
  </script>
%s
""" % (INICIO, PROJECT_ID, FIM)

import re
ALVO = re.compile(r'([ \t]*</head>\r?\n)')
CRLF = chr(13) + chr(10)
ANTIGO = re.compile(re.escape(INICIO) + r".*?" + re.escape(FIM) + r"\r?\n", re.S)

paginas = sorted(p.replace("\\", "/") for p in glob.glob("site/**/*.html", recursive=True))
escritas = []
for p in paginas:
    s = io.open(p, encoding="utf-8", newline="").read()
    fdl = CRLF if CRLF in s else "\n"
    bloco = BLOCO.replace("\n", fdl) if fdl == CRLF else BLOCO
    s2 = ANTIGO.sub("", s)
    if not ALVO.search(s2):
        print("  ! sem </head>, pulei:", p); continue
    s2 = ALVO.sub(lambda m: bloco + m.group(1), s2, count=1)
    if s2 != s:
        io.open(p, "w", encoding="utf-8", newline="").write(s2)
        escritas.append(p)

print("%d paginas atualizadas" % len(escritas))
