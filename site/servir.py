"""
Sobe um servidor local pra abrir o curso de SQL no navegador.

Rode:  python site/servir.py
Depois acesse:  http://localhost:8000

(É preciso servir por HTTP: aberto com duplo clique o navegador bloqueia
o carregamento do banco e do WebAssembly.)
Encerra com Ctrl+C.
"""

import http.server
import os
import socketserver
import webbrowser

PORTA = 8000
RAIZ = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=RAIZ, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass  # silêncio


def main():
    os.chdir(RAIZ)
    with socketserver.TCPServer(("", PORTA), Handler) as httpd:
        url = f"http://localhost:{PORTA}/"
        print(f"Curso de SQL rodando em  {url}")
        print("Ctrl+C pra encerrar.")
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nEncerrado.")


if __name__ == "__main__":
    main()
