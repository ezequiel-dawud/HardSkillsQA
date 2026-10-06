// Modulo 5: testar a API direto, sem abrir navegador, usando o fixture
// `request` do Playwright. POST/PUT/DELETE em /api/produtos exigem o
// header Authorization -- ver site/playwright/modulo-5.html.
const { test, expect } = require("@playwright/test");

const TOKEN = "token-treino-123";
const AUTORIZADO = { Authorization: `Bearer ${TOKEN}` };

test.describe("autenticacao", () => {
  test("GET nao exige token", async ({ request }) => {
    const res = await request.get("/api/produtos?id=1");
    expect(res.status()).toBe(200);
  });

  test("POST sem token retorna 401", async ({ request }) => {
    const res = await request.post("/api/produtos", {
      data: { nome: "Produto sem token", preco: 10 },
    });
    expect(res.status()).toBe(401);
  });
});

// test.describe.serial roda os testes em ordem e na mesma worker -- preciso
// disso aqui porque cada teste usa o produto que o teste anterior criou
// (produtoId). Nos outros modulos cada teste e independente de proposito;
// aqui e uma excecao justificada: estamos testando o ciclo de vida inteiro
// de UM produto.
test.describe.serial("ciclo de vida de um produto via API", () => {
  let produtoId;

  test("POST com token cria produto", async ({ request }) => {
    const res = await request.post("/api/produtos", {
      headers: AUTORIZADO,
      data: { nome: "Produto de teste", preco: 50, emoji: "🧪" },
    });
    expect(res.status()).toBe(201);

    const corpo = await res.json();
    expect(corpo.item.nome).toBe("Produto de teste");
    produtoId = corpo.item.id;
  });

  test("GET por id retorna o produto criado", async ({ request }) => {
    const res = await request.get(`/api/produtos?id=${produtoId}`);
    const corpo = await res.json();
    expect(corpo.item.preco).toBe(50);
  });

  test("PUT atualiza o preco", async ({ request }) => {
    const res = await request.put(`/api/produtos?id=${produtoId}`, {
      headers: AUTORIZADO,
      data: { preco: 120 },
    });
    expect(res.status()).toBe(200);

    const corpo = await res.json();
    expect(corpo.item.preco).toBe(120);
  });

  test("DELETE remove o produto", async ({ request }) => {
    const res = await request.delete(`/api/produtos?id=${produtoId}`, {
      headers: AUTORIZADO,
    });
    expect(res.status()).toBe(200);
  });

  test("GET por id depois do DELETE retorna item null", async ({ request }) => {
    const res = await request.get(`/api/produtos?id=${produtoId}`);
    const corpo = await res.json();
    expect(corpo.item).toBeNull();
  });
});

// Exercicio: escreva um teste chamado "PUT sem token retorna 401 e nao muda o preco":
//   1. faz um PUT em /api/produtos?id=1 com { preco: 999 }, SEM o header Authorization;
//   2. confere que a resposta e 401;
//   3. faz um GET em /api/produtos?id=1 e confere que o preco continua sendo
//      o original (249.9 -- o produto 1 nunca muda, nao use ele pra criar/editar
//      em outro teste).
// Veja o modulo-5.html e o GABARITO.md se travar.
