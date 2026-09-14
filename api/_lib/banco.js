/* Acesso ao banco das contas (Upstash Redis) pela API REST — sem dependência.

   As variáveis de ambiente entram sozinhas no projeto quando você conecta um
   banco Upstash em Vercel → Storage. Conforme o jeito que foi criado, o nome
   vem com prefixo KV_ ou UPSTASH_REDIS_; aceitamos os dois.

   Pastas e arquivos que começam com "_" dentro de api/ não viram rota. */

const URL_BANCO = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/+$/, "");
const TOKEN_BANCO = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

const configurado = () => Boolean(URL_BANCO && TOKEN_BANCO);

async function chamar(caminho, corpo) {
  const r = await fetch(URL_BANCO + caminho, {
    method: "POST",
    headers: { Authorization: "Bearer " + TOKEN_BANCO, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const dados = await r.json().catch(() => null);
  if (!r.ok || !dados) throw new Error("banco respondeu HTTP " + r.status);
  return dados;
}

// um comando:  await redis(["GET", "usuario:ana"])
async function redis(cmd) {
  const d = await chamar("", cmd);
  if (d.error) throw new Error(d.error);
  return d.result;
}

// vários comandos numa ida só:  await lote([["INCR", "a"], ["EXPIRE", "a", 60]])
async function lote(cmds) {
  const d = await chamar("/pipeline", cmds);
  return d.map((x) => {
    if (x.error) throw new Error(x.error);
    return x.result;
  });
}

module.exports = { configurado, redis, lote };
