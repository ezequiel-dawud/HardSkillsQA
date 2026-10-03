# Trilha 7 — Automação web com Playwright

Escrever scripts que controlam um navegador de verdade: clicar, preencher
formulário, esperar carregamento assíncrono, mockar rede. A teoria fica no
site (`site/playwright/`). Aqui está o projeto pra rodar na sua máquina.

## O que instalar

| Ferramenta | Pra quê | Como |
|---|---|---|
| **Node.js** | roda o Playwright | você já tem (é o mesmo usado no site de treino). Confira com `node --version`. |
| **Playwright** | a ferramenta de automação em si | `npm install` nesta pasta, depois `npx playwright install chromium` (baixa o navegador, só uma vez). |

Sem conta, sem Docker, sem pip install. Só Node e npm.

## O alvo: o site de treino

Os testes rodam contra o **QA Treino**, um repositório separado
(`qa-learning-treino`) feito especificamente pra automação, com
`data-testid` em cada elemento. Antes de rodar os testes, suba ele:

```powershell
# dentro do repo qa-learning-treino
npm run dev
```

Isso sobe `http://localhost:3000` — o `playwright.config.js` já aponta pra lá
por padrão (`BASE_URL` sobrescreve, se precisar).

## Como está organizado

| Caminho | O que é |
|---|---|
| `playwright.config.js` | aponta pro alvo (`baseURL`), define o navegador (só Chromium, pra ficar leve) e o relatório JSON que o corretor lê |
| `tests/01_primeiro_teste.spec.js` | Módulo 1 — instalar, `data-testid`, locators, login (sem Page Object, de propósito — ver Módulo 2) |
| `tests/02_selecionadores.spec.js` | Módulo 2 — formulário, validação de campo, `test.describe`/`beforeEach`, introduz Page Object Model |
| `tests/03_cenarios.spec.js` | Módulo 3 — loading assíncrono, paginação, estado vazio, modal, upload, drag and drop |
| `tests/04_rede_ci.spec.js` | Módulo 4 — `page.route` (mock de rede), atalho de login via `localStorage` pra CI |
| `pages/*.js` | Page Objects (um por página do site de treino) — a partir do Módulo 2 |
| `fixtures/exemplo.png` | arquivo usado no teste de upload do Módulo 3 |
| `verificar.py` | confere os critérios objetivos de cada módulo a partir de `resultado.json` |
| `GABARITO.md` | solução dos exercícios |

## Rodar (Windows / PowerShell)

```powershell
# Terminal 1 — o alvo (dentro de qa-learning-treino/)
npm run dev

# Terminal 2 — os testes (dentro de trilha-7/)
npm install
npx playwright install chromium
npx playwright test tests/01_primeiro_teste.spec.js ; python verificar.py 1
npx playwright test tests/02_selecionadores.spec.js ; python verificar.py 2
npx playwright test tests/03_cenarios.spec.js       ; python verificar.py 3
npx playwright test tests/04_rede_ci.spec.js        ; python verificar.py 4
```

**Atenção:** não passe `--reporter=...` nesses comandos — isso substitui os
reporters do `playwright.config.js` (inclusive o `json` que o corretor lê).
