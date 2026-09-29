/* Monta os .zip por trilha em site/downloads/, a partir dos arquivos do repositorio.
 *
 * Roda no build da Vercel (vercel.json -> buildCommand) e tambem na mao:
 *     node ferramentas/gerar_downloads.mjs
 *
 * Por que existe: o GitHub so serve zip do branch inteiro (~2,8 MB, 160 arquivos),
 * e quem vai fazer a trilha de pytest precisa de 107 KB. Gerar aqui, no deploy,
 * a partir dos proprios arquivos, evita a copia manual que desatualiza em silencio.
 *
 * Sem dependencia: escreve o formato ZIP direto (deflate cru + diretorio central).
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { deflateRawSync } from "node:zlib";
import { join, relative, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = join(RAIZ, "site", "downloads");

// cada zip: o que entra e como se chama
const PACOTES = [
  { arquivo: "qa-learning-pytest.zip", partes: ["trilha-3", "pratica/pratica.db"] },
  { arquivo: "qa-learning-k6.zip", partes: ["trilha-5"] },
];

const IGNORAR = new Set([".venv", "__pycache__", ".pytest_cache", "node_modules", ".git"]);

/* ---- CRC32, que o formato ZIP exige por arquivo ---- */
const TABELA = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABELA[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/* ---- lista os arquivos de uma parte (pasta ou arquivo solto) ---- */
function listar(parte) {
  const abs = join(RAIZ, parte);
  if (statSync(abs).isFile()) return [parte];
  const saida = [];
  (function andar(dir) {
    for (const nome of readdirSync(dir)) {
      if (IGNORAR.has(nome)) continue;
      const p = join(dir, nome);
      if (statSync(p).isDirectory()) andar(p);
      else saida.push(relative(RAIZ, p).split(sep).join("/"));
    }
  })(abs);
  return saida.sort();
}

/* ---- monta o zip ---- */
function zipar(caminhos) {
  const locais = [];
  const central = [];
  let desloc = 0;

  for (const rel of caminhos) {
    const cru = readFileSync(join(RAIZ, rel));
    const comprimido = deflateRawSync(cru, { level: 9 });
    // se comprimir nao ajudou, guarda sem compressao (metodo 0)
    const usaDeflate = comprimido.length < cru.length;
    const dados = usaDeflate ? comprimido : cru;
    const metodo = usaDeflate ? 8 : 0;
    const nome = Buffer.from(rel, "utf8");
    const soma = crc32(cru);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);           // versao minima
    local.writeUInt16LE(0x0800, 6);       // nome em UTF-8
    local.writeUInt16LE(metodo, 8);
    local.writeUInt16LE(0, 10);           // hora (fixa: zip reproduzivel)
    local.writeUInt16LE(0x21, 12);        // data fixa (1980-01-01)
    local.writeUInt32LE(soma, 14);
    local.writeUInt32LE(dados.length, 18);
    local.writeUInt32LE(cru.length, 22);
    local.writeUInt16LE(nome.length, 26);
    local.writeUInt16LE(0, 28);
    locais.push(local, nome, dados);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(metodo, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0x21, 14);
    cd.writeUInt32LE(soma, 16);
    cd.writeUInt32LE(dados.length, 20);
    cd.writeUInt32LE(cru.length, 24);
    cd.writeUInt16LE(nome.length, 28);
    cd.writeUInt16LE(0, 30);              // extra
    cd.writeUInt16LE(0, 32);              // comentario
    cd.writeUInt16LE(0, 34);              // disco
    cd.writeUInt16LE(0, 36);              // atributos internos
    cd.writeUInt32LE(0, 38);              // atributos externos
    cd.writeUInt32LE(desloc, 42);
    central.push(cd, nome);

    desloc += local.length + nome.length + dados.length;
  }

  const corpoCentral = Buffer.concat(central);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(0, 4);
  fim.writeUInt16LE(0, 6);
  fim.writeUInt16LE(caminhos.length, 8);
  fim.writeUInt16LE(caminhos.length, 10);
  fim.writeUInt32LE(corpoCentral.length, 12);
  fim.writeUInt32LE(desloc, 16);
  fim.writeUInt16LE(0, 20);

  return Buffer.concat([...locais, corpoCentral, fim]);
}

mkdirSync(DESTINO, { recursive: true });
for (const { arquivo, partes } of PACOTES) {
  const caminhos = partes.flatMap(listar);
  const zip = zipar(caminhos);
  writeFileSync(join(DESTINO, arquivo), zip);
  console.log(
    "  %s  %d arquivos, %d KB",
    arquivo.padEnd(26),
    caminhos.length,
    Math.round(zip.length / 1024)
  );
}
console.log("downloads gerados em site/downloads/");
