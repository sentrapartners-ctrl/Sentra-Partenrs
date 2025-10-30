import express from "express";
import { getDb } from "../db";

const router = express.Router();

//====================================================
// POST /api/mt/copy/master-signal
// Recebe sinais da conta Master
//====================================================
router.post("/master-signal", async (req, res) => {
  try {
    const { master_email, account_number, broker, positions, positions_count } = req.body;
    
    console.log("[Copy Trading] Master signal recebido:", {
      master_email,
      account_number,
      positions_count
    });
    
    if (!master_email || !account_number) {
      return res.status(400).json({ error: "master_email e account_number são obrigatórios" });
    }
    
    const db = getDb();
    
    // Converter positions para JSON string
    const positionsJson = JSON.stringify(positions || []);
    
    // Verificar se já existe registro para este master
    const [existing]: any = await db.execute(
      "SELECT id FROM copy_signals WHERE master_email = ? AND account_number = ?",
      [master_email, account_number]
    );
    
    if (existing && existing.length > 0) {
      // Atualizar registro existente
      await db.execute(
        "UPDATE copy_signals SET positions = ?, positions_count = ?, broker = ?, updated_at = NOW() WHERE master_email = ? AND account_number = ?",
        [positionsJson, positions_count || 0, broker || "", master_email, account_number]
      );
      console.log("[Copy Trading] ✅ Sinais atualizados para", master_email);
    } else {
      // Inserir novo registro
      await db.execute(
        "INSERT INTO copy_signals (master_email, account_number, broker, positions, positions_count) VALUES (?, ?, ?, ?, ?)",
        [master_email, account_number, broker || "", positionsJson, positions_count || 0]
      );
      console.log("[Copy Trading] ✅ Novos sinais salvos para", master_email);
    }
    
    res.json({ success: true, message: "Sinal recebido e salvo" });
    
  } catch (error) {
    console.error("[Copy Trading] Erro ao processar sinal master:", error);
    res.status(500).json({ error: "Erro ao processar sinal" });
  }
});

//====================================================
// GET /api/mt/copy/slave-signals
// Retorna sinais para contas Slave
//====================================================
router.get("/slave-signals", async (req, res) => {
  try {
    const { master_email, slave_email } = req.query;
    
    console.log("[Copy Trading] Slave solicitando sinais:", {
      master_email,
      slave_email
    });
    
    if (!master_email || !slave_email) {
      return res.status(400).json({ error: "master_email e slave_email são obrigatórios" });
    }
    
    const db = getDb();
    
    // Buscar sinais mais recentes do master (últimos 5 minutos)
    const [signals]: any = await db.execute(
      "SELECT positions, positions_count, broker, updated_at FROM copy_signals WHERE master_email = ? AND updated_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) ORDER BY updated_at DESC LIMIT 1",
      [master_email]
    );
    
    if (!signals || signals.length === 0) {
      console.log("[Copy Trading] ℹ️ Nenhum sinal recente para", master_email);
      return res.json({
        success: true,
        positions: [],
        message: "Nenhum sinal recente do Master"
      });
    }
    
    const signal = signals[0];
    let positions = [];
    
    try {
      positions = JSON.parse(signal.positions);
    } catch (e) {
      console.error("[Copy Trading] Erro ao parse JSON:", e);
    }
    
    console.log("[Copy Trading] ✅ Retornando", positions.length, "posições para", slave_email);
    
    res.json({
      success: true,
      positions: positions,
      positions_count: signal.positions_count,
      broker: signal.broker,
      updated_at: signal.updated_at
    });
    
  } catch (error) {
    console.error("[Copy Trading] Erro ao buscar sinais:", error);
    res.status(500).json({ error: "Erro ao buscar sinais" });
  }
});

export default router;
