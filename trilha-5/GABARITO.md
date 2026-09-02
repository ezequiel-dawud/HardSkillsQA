# Gabarito — Trilha 5

Tente cada exercício antes de olhar. Os números variam um pouco de máquina pra
máquina; o que importa é a ordem de grandeza e os `[ok]` do `verificar.py`.

---

## Módulo 1 — Smoke

**Exercício:** rode `scripts/01_smoke.js` sem mexer em nada, com o mock ligado.
Depois troque `iterations: 10` por `iterations: 30` e rode de novo.

**Esperado:** `python verificar.py 1` com 4 `[ok]`. No resumo, `falhas (erro)`
em `0.00%`, `p95` bem abaixo de 800ms, `checks ok` em `100.00%`. Com 30
iterações a única coisa que muda é `requisicoes` (30) e a duração total.

Se o portão reprovar aqui, o alvo já está ruim antes de qualquer carga — não
adianta seguir.

---

## Módulo 2 — Anatomia

**Exercício:** no `scripts/02_anatomia.js`, adicione um terceiro check no grupo
`comprar` que verifica se o `status` do pedido veio como `"novo"`:

```js
check(r, {
  "pedido criado (201)": (res) => res.status === 201,
  "resposta traz id": (res) => res.json("id") !== undefined,
  "status inicial e novo": (res) => res.json("status") === "novo",
});
```

**Esperado:** `python verificar.py 2` com 5 `[ok]`. `VUs (pico)` = 5,
`checks ok` perto de 100%, e o resumo mostra a sub-métrica
`http_req_duration{tipo:leitura}` com o próprio p95.

---

## Módulo 3 — Stages e thresholds

**Exercício A:** rode `scripts/03_carga.js` como está. Encerre o mock
(`Ctrl+C` no Terminal 1) e rode `python verificar.py 3`.

**Esperado:** os critérios dão `[ok]` (a rampa chegou a 20 VUs, os dois
thresholds existem, o servidor viu o pico de carga), e aparece a **nota**:

```
nota: o portao REPROVOU em http_req_duration: p(95)<300 -- esperado neste modulo.
```

O `k6 run` termina com código de saída 99. Isso é o teste de carga fazendo o
trabalho: sob 20 usuários simultâneos o mock não cumpre a meta de 300ms.

**Exercício B:** afrouxe a meta pra um valor realista e veja o portão passar:

```js
thresholds: {
  http_req_failed: ["rate<0.01"],
  http_req_duration: ["p(95)<1500"],
},
```

Agora `k6 run` sai com código 0 e a nota vira "o portao passou". A discussão
que fica: 1500ms é aceitável pro seu produto? Isso é decisão de time, não de
ferramenta.

**Exercício C (opcional):** suba o mock com
`MOCK_LATENCIA_POR_CARGA_MS=0` (no PowerShell:
`$env:MOCK_LATENCIA_POR_CARGA_MS=0; python mock/servidor.py`) e rode o
`03_carga.js` original de novo — o p95 nem sobe, porque tiramos a contenção.

---

## Módulo 4 — Dados e correlação

**Exercício:** rode `scripts/04_dados.js`. Encerre o mock e rode
`python verificar.py 4`.

**Esperado:** 5 `[ok]`. No `mock/ultimo_relatorio.json`:

- `emails_distintos` acima de 20 (o email muda a cada iteração — `__ITER`);
- `tokens_reaproveitados` maior que 0 (o token do `/login` foi reusado no
  `/pedidos` — é a correlação);
- `tokens_distintos` = 10 (os 10 usuários do `dados/usuarios.json`).

**Variação:** troque `iterations: 100` por `iterations: 300` e confirme que
`emails_distintos` cresce junto. Se você tivesse deixado o email fixo, esse
número travaria — é o sinal de dado repetido.

---

## Comandos, resumo

```powershell
# Terminal 1
python mock/servidor.py

# Terminal 2
k6 run scripts/01_smoke.js   ; python verificar.py 1
k6 run scripts/02_anatomia.js; python verificar.py 2
k6 run scripts/03_carga.js   # depois Ctrl+C no Terminal 1
python verificar.py 3
python mock/servidor.py      # sobe de novo pro modulo 4
k6 run scripts/04_dados.js   # depois Ctrl+C no Terminal 1
python verificar.py 4
```
