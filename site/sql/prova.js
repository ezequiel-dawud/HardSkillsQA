/* Adaptador da PROVA para a Trilha 1 (SQLite via sql.js).
   Sobe o mesmo pratica.db das páginas de módulo e expõe window.PROVA_MOTOR,
   que o motor genérico (../assets/prova-core.js) usa pra rodar e comparar. */

(function () {
  "use strict";

  const ASSETS = "../assets/";
  const DB_URL = "pratica.db";

  let SQL = null;
  let db = null;
  let bytesOriginais = null;

  async function baixar(url, rotulo) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(rotulo + ": HTTP " + r.status);
    return r.arrayBuffer();
  }

  const prontoP = (async () => {
    const [wasmBinary, dbBuf] = await Promise.all([
      baixar(ASSETS + "sql-wasm.wasm", "motor SQLite (.wasm)"),
      baixar(DB_URL, "banco (pratica.db)"),
    ]);
    const comTimeout = new Promise((_, rej) =>
      setTimeout(() => rej(new Error("o motor SQLite não respondeu em 20s")), 20000)
    );
    SQL = await Promise.race([
      initSqlJs({ wasmBinary, locateFile: () => ASSETS + "sql-wasm.wasm" }),
      comTimeout,
    ]);
    bytesOriginais = new Uint8Array(dbBuf);
    db = new SQL.Database(bytesOriginais);
  })();

  window.PROVA_MOTOR = {
    nome: "SQLite",
    pronto: () => prontoP,
    async resetar() {
      await prontoP;
      if (db) db.close();
      db = new SQL.Database(bytesOriginais);
    },
    async executar(sql) {
      await prontoP;
      const res = db.exec(sql); // array de { columns, values }
      const ultimo = res[res.length - 1];
      if (!ultimo) return { colunas: [], linhas: [] };
      return { colunas: ultimo.columns, linhas: ultimo.values };
    },
  };
})();
