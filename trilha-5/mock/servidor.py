#!/usr/bin/env python3
"""
Servidor-alvo da Trilha 5 (teste de carga com k6).

So biblioteca padrao do Python -- nada de `pip install`. Sobe um HTTP de
mentira que imita uma loja, com uma caracteristica de proposito: quanto mais
requisicoes chegam ao mesmo tempo, mais devagar ele responde. Isso faz o p95
subir sob carga e deixa os `thresholds` do k6 reprovarem de verdade -- que e
o que voce quer ver no modulo 3.

Rodar (num terminal separado, de dentro de trilha-5/):

    python mock/servidor.py

Porta 8787 por padrao. Da pra mudar o comportamento com variaveis de ambiente:

    MOCK_PORT=9000                  outra porta
    MOCK_ERRO_PCT=5                 % de 500 no POST /pedidos (padrao 1)
    MOCK_LATENCIA_BASE_MS=15        atraso minimo de cada resposta
    MOCK_LATENCIA_POR_CARGA_MS=20   atraso extra por requisicao simultanea

O k6 bate em  http://127.0.0.1:8787  enquanto isto roda.
Ctrl+C encerra e grava  mock/ultimo_relatorio.json  com o resumo do trafego
(o verificar.py le esse arquivo nos modulos 3 e 4).

Rotas:
    GET  /                -> {"ok": true}
    GET  /produtos        -> {"produtos": [...]}
    GET  /produtos/<id>   -> um produto, ou 404
    GET  /pedidos/<id>    -> {"id", "status"} pra id > 0, senao 404
    POST /login           -> {"token": "..."}   (corpo: {"usuario": "..."} )
    POST /pedidos         -> 201 {"id","status"} (precisa header Authorization: Bearer <token>
                             e corpo {"itens": [...]}); ~MOCK_ERRO_PCT% viram 500
    GET  /_relatorio      -> o resumo do trafego agora (JSON), sem contar como carga
"""

import atexit
import json
import os
import random
import signal
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PORTA = int(os.environ.get("MOCK_PORT", "8787"))
ERRO_PCT = float(os.environ.get("MOCK_ERRO_PCT", "1"))
LAT_BASE_MS = float(os.environ.get("MOCK_LATENCIA_BASE_MS", "15"))
LAT_POR_CARGA_MS = float(os.environ.get("MOCK_LATENCIA_POR_CARGA_MS", "20"))
RELATORIO = Path(__file__).with_name("ultimo_relatorio.json")

_lock = threading.Lock()
_estado = {
    "inicio": time.time(),
    "em_voo": 0,
    "pico_simultaneo": 0,
    "total": 0,
    "por_rota": {},
    "por_status": {},
    "rps_por_segundo": {},
    "tokens_emitidos": set(),
    "tokens_reaproveitados": 0,
    "emails_vistos": set(),
}

PRODUTOS = [
    {"id": i, "nome": f"Produto {i}", "preco": round(20 + i * 7.5, 2), "estoque": 100 - i}
    for i in range(1, 16)
]


def _registrar(rota, status, token=None, email=None):
    with _lock:
        _estado["total"] += 1
        _estado["por_rota"][rota] = _estado["por_rota"].get(rota, 0) + 1
        chave = str(status)
        _estado["por_status"][chave] = _estado["por_status"].get(chave, 0) + 1
        seg = int(time.time() - _estado["inicio"])
        _estado["rps_por_segundo"][seg] = _estado["rps_por_segundo"].get(seg, 0) + 1
        if token:
            if token in _estado["tokens_emitidos"]:
                _estado["tokens_reaproveitados"] += 1
            else:
                _estado["tokens_emitidos"].add(token)
        if email:
            _estado["emails_vistos"].add(email)


def _atraso():
    """Segura a resposta. O atraso cresce com o numero de requisicoes em voo."""
    with _lock:
        _estado["em_voo"] += 1
        if _estado["em_voo"] > _estado["pico_simultaneo"]:
            _estado["pico_simultaneo"] = _estado["em_voo"]
        carga = _estado["em_voo"]
    ms = (LAT_BASE_MS + LAT_POR_CARGA_MS * max(0, carga - 1)) * random.uniform(0.8, 1.3)
    time.sleep(ms / 1000.0)
    with _lock:
        _estado["em_voo"] -= 1


def _snapshot():
    with _lock:
        dur = max(1e-6, time.time() - _estado["inicio"])
        return {
            "duracao_seg": round(dur, 1),
            "total_requisicoes": _estado["total"],
            "rps_medio": round(_estado["total"] / dur, 1),
            "pico_simultaneo": _estado["pico_simultaneo"],
            "por_rota": dict(_estado["por_rota"]),
            "por_status": dict(_estado["por_status"]),
            "rps_por_segundo": {
                str(k): v for k, v in sorted(_estado["rps_por_segundo"].items())
            },
            "tokens_distintos": len(_estado["tokens_emitidos"]),
            "tokens_reaproveitados": _estado["tokens_reaproveitados"],
            "emails_distintos": len(_estado["emails_vistos"]),
        }


_relatorio_gravado = threading.Event()


def _gravar_relatorio(*_):
    if _relatorio_gravado.is_set():
        return
    _relatorio_gravado.set()
    RELATORIO.write_text(json.dumps(_snapshot(), indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n[mock] relatorio salvo em {RELATORIO}")


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *_):  # silencia o log linha-a-linha (seria ruido sob carga)
        pass

    # ---- utilitarios ----
    def _json(self, obj, status=200):
        corpo = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def _corpo_json(self):
        n = int(self.headers.get("Content-Length", "0") or "0")
        if not n:
            return {}
        bruto = self.rfile.read(n)
        try:
            return json.loads(bruto or b"{}")
        except json.JSONDecodeError:
            return None

    # ---- GET ----
    def do_GET(self):
        rota = self.path.split("?", 1)[0]

        if rota == "/_relatorio":
            self._json(_snapshot())
            return

        _atraso()

        if rota in ("/", "/saude"):
            self._json({"ok": True})
            _registrar("/", 200)
            return

        if rota == "/produtos":
            self._json({"produtos": PRODUTOS})
            _registrar("/produtos", 200)
            return

        if rota.startswith("/produtos/"):
            try:
                pid = int(rota.rsplit("/", 1)[-1])
            except ValueError:
                self._json({"erro": "id invalido"}, 400)
                _registrar("/produtos/:id", 400)
                return
            achado = next((p for p in PRODUTOS if p["id"] == pid), None)
            if achado:
                self._json(achado)
                _registrar("/produtos/:id", 200)
            else:
                self._json({"erro": "nao encontrado"}, 404)
                _registrar("/produtos/:id", 404)
            return

        if rota.startswith("/pedidos/"):
            try:
                oid = int(rota.rsplit("/", 1)[-1])
            except ValueError:
                self._json({"erro": "id invalido"}, 400)
                _registrar("/pedidos/:id", 400)
                return
            if oid <= 0:
                self._json({"erro": "nao encontrado"}, 404)
                _registrar("/pedidos/:id", 404)
                return
            self._json({"id": oid, "status": "novo"})
            _registrar("/pedidos/:id", 200)
            return

        self._json({"erro": "rota nao existe"}, 404)
        _registrar(rota, 404)

    # ---- POST ----
    def do_POST(self):
        rota = self.path.split("?", 1)[0]
        dados = self._corpo_json()
        _atraso()

        if rota == "/login":
            if not isinstance(dados, dict) or not dados.get("usuario"):
                self._json({"erro": "informe 'usuario' no corpo"}, 400)
                _registrar("/login", 400)
                return
            token = f"tok-{abs(hash(dados['usuario'])) % 10**8:08d}"
            self._json({"token": token})
            _registrar("/login", 200, token=token, email=dados.get("email"))
            return

        if rota == "/pedidos":
            auth = self.headers.get("Authorization", "")
            if not auth.startswith("Bearer "):
                self._json({"erro": "falta Authorization: Bearer <token>"}, 401)
                _registrar("/pedidos", 401)
                return
            token = auth.split(" ", 1)[1]
            if dados is None:
                self._json({"erro": "JSON invalido"}, 400)
                _registrar("/pedidos", 400)
                return
            if not dados.get("itens"):
                self._json({"erro": "pedido sem itens"}, 422)
                _registrar("/pedidos", 422)
                return
            if random.random() * 100 < ERRO_PCT:
                self._json({"erro": "falha interna"}, 500)
                _registrar("/pedidos", 500, token=token)
                return
            novo_id = random.randint(1000, 999999)
            self._json({"id": novo_id, "status": "novo"}, 201)
            _registrar("/pedidos", 201, token=token, email=dados.get("email"))
            return

        self._json({"erro": "rota nao existe"}, 404)
        _registrar(rota, 404)


def main():
    srv = ThreadingHTTPServer(("127.0.0.1", PORTA), Handler)
    atexit.register(_gravar_relatorio)
    signal.signal(signal.SIGINT, lambda *_: threading.Thread(target=srv.shutdown).start())
    print(f"[mock] ouvindo em http://localhost:{PORTA}  (Ctrl+C encerra)")
    print(f"[mock] erro no POST /pedidos: {ERRO_PCT:.0f}%  |  latencia base: {LAT_BASE_MS:.0f}ms "
          f"+ {LAT_POR_CARGA_MS:.0f}ms por requisicao simultanea")
    try:
        srv.serve_forever()
    finally:
        _gravar_relatorio()


if __name__ == "__main__":
    main()
