# Software de terceiros

O que este repositorio usa de outras pessoas, e sob que licenca. Atualizado em 2026-09-29.

## Redistribuido (o arquivo esta aqui dentro)

**sql.js 1.13.0** — `site/assets/sql-wasm.js` e `site/assets/sql-wasm.wasm`
Licenca MIT. Texto completo em `site/assets/sql-wasm.LICENSE.txt`.
Copyright (c) 2017 sql.js authors (see AUTHORS) — https://github.com/sql-js/sql.js
Copia identica a do cdnjs, sem modificacao alem do cabecalho de licenca no `.js`.
Embute o SQLite, que e de dominio publico e nao exige atribuicao.
E o que roda o banco da Trilha 1 (SQL) dentro do navegador.

## Carregado de CDN (nao esta neste repositorio)

**PGlite 0.5.8** — Apache-2.0 — https://github.com/electric-sql/pglite
Carregado em `site/pg/app-pg.js` e `site/pg/prova.js` a partir do jsDelivr.
Como nao e redistribuido aqui, nao ha arquivo de licenca a acompanhar.
E o Postgres que roda no navegador na Trilha 2.

## Instalado pelo aluno (nao e redistribuido)

- **pytest** (MIT) — Trilha 3, instalado via `trilha-3/requirements.txt`
- **k6** (AGPL-3.0) — Trilha 5, instalado pelo proprio aluno
- **GitHub Actions** — as acoes `actions/checkout`, `actions/setup-python` e
  `grafana/setup-k6-action`, referenciadas por versao em `.github/workflows/`

## O conteudo do curso

Os textos, exercicios, provas e o codigo escrito aqui sao de Ezequiel Dawud.
Nao ha licenca aberta declarada: todos os direitos reservados.
Voce pode ver, clonar e forkar este repositorio no GitHub — os Termos de Servico
do GitHub permitem isso — e usar o material nos seus estudos. Republicar como
curso proprio, nao.
