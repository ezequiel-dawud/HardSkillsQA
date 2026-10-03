# Gabarito — Trilha 7

Tente cada exercício antes de olhar.

---

## Módulo 1 — Primeiro teste

**Exercício:** em `tests/01_primeiro_teste.spec.js`, escreva um terceiro teste
chamado `"login com senha errada mostra mensagem de erro"`:

```js
test("login com senha errada mostra mensagem de erro", async ({ page }) => {
  await page.goto("/login.html");
  await page.getByTestId("login-email-input").fill("maria@exemplo.com");
  await page.getByTestId("login-password-input").fill("senha-incorreta");
  await page.getByTestId("login-submit-button").click();

  await expect(page.getByTestId("login-error-message")).toBeVisible();
});
```

**Esperado:** `npx playwright test tests/01_primeiro_teste.spec.js` com os 3
testes `ok`, e `python verificar.py 1` com 4 `[ok]`.

---

## Módulo 2 — Seletores, validação e Page Object Model

**Exercício:** em `tests/02_selecionadores.spec.js`, dentro de
`test.describe("cadastro", ...)`, escreva um teste chamado
`"senha curta mostra so o erro de senha"` usando a `CadastroPage` já criada
no `beforeEach`:

```js
test("senha curta mostra so o erro de senha", async () => {
  await cadastro.preencher({ nome: "Joana", email: "joana@exemplo.com", senha: "123" });
  await cadastro.submeter();

  await expect(cadastro.passwordError).toBeVisible();
  await expect(cadastro.nameError).toBeHidden();
  await expect(cadastro.emailError).toBeHidden();
});
```

**Esperado:** `python verificar.py 2` com 4 `[ok]`.

**Nota:** se o primeiro teste do módulo ("campos obrigatórios mostram erro ao
submeter em branco") não passar pra você, confira se está rodando contra uma
cópia atualizada do `qa-learning-treino` — o formulário de cadastro precisou
ganhar `novalidate` pra validação customizada (via `data-testid`) ser
alcançável; sem isso, o navegador bloqueia o envio antes do JavaScript da
página rodar.

---

## Módulo 3 — Cenários do site de treino

**Exercício:** em `tests/03_cenarios.spec.js`, dentro de
`test.describe("pagina de produto", ...)`, escreva um teste chamado
`"arrastar o primeiro item da galeria pro final reordena a lista"` usando a
`ProdutoPage` já criada no `beforeEach`:

```js
test("arrastar o primeiro item da galeria pro final reordena a lista", async () => {
  await produto.galleryItem(1).dragTo(produto.galleryItem(3));

  const ordem = await produto.ordemDaGaleria();
  expect(ordem[0]).not.toBe("gallery-drag-item-1");
});
```

**Esperado:** `python verificar.py 3` com 7 `[ok]`. A ordem final observada é
`[item-2, item-3, item-1]` — o Playwright simula o `dragstart`/`dragover`/`drop`
de verdade, então isso só funciona porque o site reordena no `dragover` (sem
precisar de um handler de `drop`).

---

## Módulo 4 — Rede e preparo pra CI

**Exercício:** em `tests/04_rede_ci.spec.js`, escreva um teste chamado
`"produto mockado aparece na lista"`:

```js
test("produto mockado aparece na lista", async ({ page }) => {
  await LoginPage.pularLogin(page, "Maria");
  await page.route("**/api/produtos*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        itens: [{ id: 999, nome: "Produto Mockado", preco: 9.9, emoji: "🧪" }],
        totalPaginas: 1,
      }),
    })
  );
  await page.goto("/index.html");

  await expect(page.getByTestId("product-card-999")).toBeVisible();
  await expect(page.getByTestId("product-card-999")).toContainText("Produto Mockado");
});
```

**Esperado:** `python verificar.py 4` com 5 `[ok]`. Repare que esse teste não
depende do servidor de verdade ter o produto 999 — o `page.route` substitui a
resposta antes dela chegar na página.

---

## Comandos, resumo

```powershell
# Terminal 1 (dentro do repo qa-learning-treino)
npm run dev

# Terminal 2 (dentro de trilha-7/)
npx playwright test tests/01_primeiro_teste.spec.js ; python verificar.py 1
npx playwright test tests/02_selecionadores.spec.js ; python verificar.py 2
npx playwright test tests/03_cenarios.spec.js       ; python verificar.py 3
npx playwright test tests/04_rede_ci.spec.js        ; python verificar.py 4
```

**Atenção:** `npx playwright test --reporter=list` (ou qualquer `--reporter`
na linha de comando) substitui *todos* os reporters do `playwright.config.js`,
inclusive o `json` que grava `resultado.json` — sem ele o `verificar.py` não
acha o que conferir. Rode sem `--reporter` pra manter o relatório JSON.
