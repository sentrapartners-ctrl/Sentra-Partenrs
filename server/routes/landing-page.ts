import express from 'express';
import { getRawConnection } from '../db';

const router = express.Router();

// GET /api/landing-page - Buscar todo o conteúdo da LP
router.get("/", async (req, res) => {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const [rows]: any = await connection.execute(
      `SELECT section, content FROM landing_page_content`
    );

    // Converter para objeto { section: content }
    const content: any = {};
    rows.forEach((row: any) => {
      content[row.section] = row.content;
    });

    res.json({
      success: true,
      content
    });
  } catch (error: any) {
    console.error('[Landing Page] Erro ao buscar conteúdo:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET /api/landing-page/:section - Buscar conteúdo de uma seção específica
router.get("/:section", async (req, res) => {
  try {
    const { section } = req.params;

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const [rows]: any = await connection.execute(
      `SELECT content FROM landing_page_content WHERE section = ?`,
      [section]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Seção não encontrada'
      });
    }

    res.json({
      success: true,
      content: rows[0].content
    });
  } catch (error: any) {
    console.error('[Landing Page] Erro ao buscar seção:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// PUT /api/landing-page/:section - Atualizar conteúdo de uma seção
router.put("/:section", async (req, res) => {
  try {
    const { section } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'content é obrigatório'
      });
    }

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    await connection.execute(
      `UPDATE landing_page_content SET content = ? WHERE section = ?`,
      [JSON.stringify(content), section]
    );

    res.json({
      success: true,
      message: 'Seção atualizada com sucesso'
    });
  } catch (error: any) {
    console.error('[Landing Page] Erro ao atualizar seção:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
