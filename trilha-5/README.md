# Trilha 5 — Teste de carga com k6

Simular muitos usuários batendo numa aplicação ao mesmo tempo e medir o que
acontece com **tempo de resposta** e **taxa de erro** — e transformar a meta
de performance num **portão** que reprova o build no CI.

A teoria fica no site (`site/k6/`). Aqui está o projeto pra rodar na sua máquina.

## O que instalar

| Ferramenta | Pra quê | Como |
|---|---|---|
| **k6** | roda os testes de carga | `winget install k6 --source winget` (Windows). Depois feche e reabra o terminal e teste com `k6 version`. Se ainda der "não reconhecido", reiniciar o computador resolve (fechar só o terminal às vezes não é suficiente) — veja o passo a passo em `site/k6/modulo-1.html`. |
| **Python 3** | o servidor-alvo de treino e o corretor | você já tem da Trilha 3. Nada de `pip install` aqui — só biblioteca padrão. |

Sem conta, sem login, sem Docker. O k6 é grátis e open source.

## Como está organizado

| Caminho | O que é |
|---|---|
| `mock/servidor.py` | o alvo de treino: um HTTP falso que fica mais lento quanto mais carga recebe |
| `scripts/01_smoke.js` … `04_dados.js` | os scripts de cada módulo, prontos e comentados |
| `lib/resumo.js` | imprime um resumo enxuto e grava `resumo.json` (o corretor lê esse arquivo) |
| `dados/usuarios.json` | lista de usuários pro módulo 4 |
| `verificar.py` | confere os critérios objetivos de cada módulo |
| `GABARITO.md` | solução dos exercícios + números esperados |

## Rodar (Windows / PowerShell)

Você vai usar **dois terminais**, os dois abertos em `trilha-5/`.

**Terminal 1 — o alvo:**

```powershell
python mock/servidor.py
```

Deixe rodando. Ele escuta em `http://127.0.0.1:8787`. Quando terminar os
testes, `Ctrl+C` encerra e grava `mock/ultimo_relatorio.json`.

**Terminal 2 — o teste:**

```powershell
k6 run scripts/01_smoke.js
python verificar.py 1
```

Cada módulo segue o mesmo ritmo: rode o script, rode o `verificar.py <n>`,
leia o resumo, ajuste, repita. O módulo 3 precisa do relatório do mock —
encerre o Terminal 1 com `Ctrl+C` antes de chamar `python verificar.py 3`.

> O `resumo.json` é gravado na pasta **onde você chamou o k6**. Rode sempre de
> dentro de `trilha-5/` pra ele e o `verificar.py` se encontrarem.

## Alvo alternativo (sem subir o mock)

Os scripts leem `BASE_URL` do ambiente. Pra apontar pro alvo público de treino
do k6:

```powershell
k6 run -e BASE_URL=https://quickpizza.grafana.com scripts/01_smoke.js
```

O mock local é melhor pros módulos 3 e 4 (você controla a lentidão e o
`verificar.py` consegue conferir o lado do servidor).

## CI

`.github/workflows/trilha-5-k6.yml` instala o k6, sobe o mock e roda o
`03_carga.js`. Como o threshold de p95 é apertado de propósito, o job fica
**vermelho** — é o portão de performance funcionando. O módulo 4 mostra como
ajustar a meta pra um valor que o sistema cumpre.
