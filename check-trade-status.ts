import Database from "better-sqlite3";

const db = new Database(".data/db.sqlite");

// Verificar estrutura da tabela
console.log("=== ESTRUTURA DA TABELA TRADES ===");
const schema = db.prepare("PRAGMA table_info(trades)").all();
console.log(schema);

// Verificar trades com profit 0
console.log("\n=== TRADES COM PROFIT = 0 ===");
const zeroProfit = db.prepare(`
  SELECT ticket, symbol, openPrice, closePrice, profit, closeTime
  FROM trades 
  WHERE profit = 0
  LIMIT 10
`).all();
console.log(zeroProfit);

// Verificar se há campo de status
console.log("\n=== VERIFICAR CAMPO STATUS ===");
const hasStatus = schema.find((col: any) => col.name === 'status');
console.log("Tem campo status?", hasStatus ? "SIM" : "NÃO");

db.close();
