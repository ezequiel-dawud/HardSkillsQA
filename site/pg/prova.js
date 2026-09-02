/* Adaptador da PROVA para a Trilha 2 (PostgreSQL via PGlite).
   Sobe o Postgres no navegador a partir de seed.sql e expõe window.PROVA_MOTOR
   pro motor genérico (../assets/prova-core.js). Carregado como <script type="module">. */

const PGLITE_URL = "https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.8/dist/index.js";

let db = null;
let seedSQL = null;

const prontoP = (async () => {
  const [pgMod, seedText] = await Promise.all([
    import(PGLITE_URL),
    fetch("seed.sql", { cache: "no-store" }).then((r) => {
      if (!r.ok) throw new Error("seed.sql: HTTP " + r.status);
      return r.text();
    }),
  ]);
  const { PGlite } = pgMod;
  seedSQL = seedText;
  const comTimeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error("o Postgres (PGlite) não respondeu em 30s")), 30000)
  );
  db = await Promise.race([PGlite.create(), comTimeout]);
  await db.exec(seedSQL);
})();

window.PROVA_MOTOR = {
  nome: "PostgreSQL",
  pronto: () => prontoP,
  async resetar() {
    await prontoP;
    await db.exec(seedSQL); // seed começa com DROP TABLE IF EXISTS
  },
  async executar(sql) {
    await prontoP;
    const res = await db.exec(sql); // array de { rows, fields, affectedRows }
    const ultimo = res[res.length - 1];
    if (!ultimo || !ultimo.fields || ultimo.fields.length === 0) {
      return { colunas: [], linhas: [] };
    }
    const colunas = ultimo.fields.map((f) => f.name);
    const linhas = ultimo.rows.map((r) => colunas.map((c) => r[c]));
    return { colunas, linhas };
  },
};
