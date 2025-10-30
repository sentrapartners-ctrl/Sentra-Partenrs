import { Router } from 'express';
import { getCopyTradingStats } from '../websocket/copyTradingWs';

const router = Router();

// Endpoint para testar se o WebSocket está funcionando
router.get('/test', (req, res) => {
  try {
    const stats = getCopyTradingStats();
    res.json({
      success: true,
      message: 'WebSocket está funcionando',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas do WebSocket',
      error: error.message
    });
  }
});

// Endpoint para simular conexão de conta (para testes)
router.post('/simulate-account', (req, res) => {
  const { accountId, accountName, type, userId } = req.body;
  
  if (!accountId || !accountName || !type || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Campos obrigatórios: accountId, accountName, type, userId'
    });
  }

  res.json({
    success: true,
    message: 'Para conectar uma conta, use o WebSocket em /ws/copy-trading',
    example: {
      type: 'ACCOUNT_HEARTBEAT',
      accountId,
      accountName,
      accountType: type,
      balance: 10000,
      equity: 10500
    }
  });
});

export default router;
