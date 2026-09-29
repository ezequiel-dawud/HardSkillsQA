# QA Learning

Trilhas de estudo práticas pra crescer como QA, em português e de graça.

**→ [qa-learning-nine.vercel.app](https://qa-learning-nine.vercel.app)**

[![Trilha pytest](https://github.com/ezequiel-dawud/HardSkillsQA/actions/workflows/trilha-3-pytest.yml/badge.svg)](https://github.com/ezequiel-dawud/HardSkillsQA/actions/workflows/trilha-3-pytest.yml)
[![Trilha k6](https://github.com/ezequiel-dawud/HardSkillsQA/actions/workflows/trilha-5-k6.yml/badge.svg)](https://github.com/ezequiel-dawud/HardSkillsQA/actions/workflows/trilha-5-k6.yml)

A ideia é sair do "já ouvi falar" e chegar no "consigo fazer". Cada módulo tem a
teoria curta em cima e a prática logo abaixo — não é vídeo, não é slide: você
escreve a query, roda o teste, quebra o build.

Na maior parte das trilhas **não precisa instalar nada**. O banco SQLite, o
PostgreSQL e a API de treino rodam dentro da própria página, via WebAssembly.
Nada do que você escreve sai da sua máquina.

## As trilhas

Ordem sugerida pra quem está começando do zero. Cada uma usa o que a anterior
deixou pronto.

| Trilha | Módulos | Tempo | Onde roda | Pasta |
|--------|---------|-------|-----------|-------|
| Fundamentos de Teste | 5 | ~3h30 | navegador | `site/fundamentos/` |
| Git e GitHub para QA | 3 | ~2h | sua máquina | `site/git/` |
| SQL para QA | 7 | ~6h | navegador | `site/sql/` |
| Teste de API | 4 | ~3h | navegador | `site/api/` |
| Validação com pytest | 4 | ~3h | sua máquina | `site/pytest/` + `trilha-3/` |
| CI/CD para QA | 4 | ~2h30 | GitHub Actions | `site/cicd/` |

E dois aprofundamentos, pra fazer depois que os seis estiverem firmes — ou antes,
se o seu trabalho pedir:

| Trilha | Módulos | Onde roda | Pasta |
|--------|---------|-----------|-------|
| PostgreSQL para QA | 7 | navegador | `site/pg/` |
| Teste de carga com k6 | 4 | sua máquina | `site/k6/` + `trilha-5/` |

São 38 módulos no total. Cada um tem exercícios corrigidos na hora e uma prova;
70% de acerto fecha o módulo.

> As páginas do site se referem às seis trilhas técnicas pelo número da ordem em
> que foram criadas — SQL é a Trilha 1, PostgreSQL a 2, pytest a 3, API a 4, k6 a
> 5 e CI/CD a 6. É por isso que as pastas de projeto se chamam `trilha-3` (pytest)
> e `trilha-5` (k6). A tabela acima está na ordem de *estudo*, que é outra.

## Como usar

**Só estudar:** abra [o site](https://qa-learning-nine.vercel.app) e comece. O
progresso fica no seu navegador. Se quiser levar pra outro computador, dá pra
criar uma conta — é só um nome de usuário.

**As trilhas que rodam na sua máquina** (pytest, k6 e CI/CD) precisam dos
arquivos daqui:

- **Sem Git:** [baixe o .zip](https://github.com/ezequiel-dawud/HardSkillsQA/archive/refs/heads/main.zip)
  e descompacte. Menos de 1 MB.
- **Com Git:** `git clone https://github.com/ezequiel-dawud/HardSkillsQA.git`

Pra trilha de CI/CD você vai precisar de um **fork**, porque o exercício é ver o
pipeline rodar no seu próprio repositório. A trilha de Git ensina isso do zero.

## Rodar o site localmente

```bash
python site/servir.py
```

Abre em `http://localhost:8000`. Precisa ser por HTTP — abrir o `.html` direto
com `file://` não funciona, porque o WebAssembly é carregado por `fetch`.

Não tem build, não tem dependência, não tem `npm install`. É HTML, CSS e
JavaScript sem framework.

## Estrutura

```
site/              o site inteiro — é o que a Vercel publica
  assets/          CSS e JS compartilhados por todas as trilhas
  sql/ pg/ api/    trilhas que rodam no navegador
  pytest/ k6/      teoria das trilhas que rodam na máquina
  fundamentos/ git/ cicd/
pratica/           build_db.py gera o pratica.db; build_seed_pg.py, a carga do Postgres
exercicios/        a trilha de SQL em arquivos .sql, pra quem prefere terminal
trilha-3/          o projeto pytest que você constrói na trilha de pytest
trilha-5/          os scripts k6 da trilha de carga, e o alvo de treino
.github/workflows/ os pipelines que a trilha de CI/CD estuda por dentro
api/               funções da conta opcional (rodam na Vercel)
sql.py             roda queries no pratica.db pelo terminal
```

O `pratica.db` é um e-commerce fictício sob teste — clientes, produtos, pedidos,
itens, defeitos e execuções de teste. Ele é gerado com semente fixa, então o
banco é igual pra todo mundo e os gabaritos batem. Pra regerar:

```bash
python pratica/build_db.py
```

## Achou um erro?

Abra uma [issue](https://github.com/ezequiel-dawud/HardSkillsQA/issues) — erro de
conteúdo, exercício com gabarito errado, link quebrado, o que for. Correção de
quem está estudando é a mais útil que existe.

## Licença

O conteúdo do curso (textos, exercícios, provas) e o código escrito aqui são de
Ezequiel Dawud — todos os direitos reservados. Você pode ver, clonar, forkar e
usar o material nos seus estudos à vontade. Republicar como curso próprio, não.

As bibliotecas de terceiros e suas licenças estão em [TERCEIROS.md](TERCEIROS.md).

---

Feito por [Ezequiel Dawud](https://www.linkedin.com/in/ezequiel-dawud-979387207/),
QA / analista de testes, a partir dos próprios estudos.
