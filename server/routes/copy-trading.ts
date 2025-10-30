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
    
    // Salvar sinais no banco (tabela copy_signals ou similar)
    // Por enquanto apenas log
    
    res.json({ success: true, message: "Sinal recebido" });
    
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
    
    // Buscar sinais mais recentes do master
    // Por enquanto retornar vazio
    
    res.json({
      success: true,
      positions: []
    });
    
  } catch (error) {
    console.error("[Copy Trading] Erro ao buscar sinais:", error);
    res.status(500).json({ error: "Erro ao buscar sinais" });
  }
});

export default router;
