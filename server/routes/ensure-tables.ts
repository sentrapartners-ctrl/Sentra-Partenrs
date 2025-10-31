import express, { Request, Response } from "express";
import { getRawConnection } from "../db";

const router = express.Router();

/**
 * POST /api/ensure-tables
 * Garante que todas as tabelas de produtos existam com todas as colunas
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    console.log('[Ensure Tables] Iniciando verificação...');

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const results = {
      subscription_plans: false,
      vps_products: false,
      expert_advisors: false,
      landing_page_content: false,
      errors: [] as string[]
    };

    try {
      // ========== SUBSCRIPTION_PLANS ==========
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS subscription_plans (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(50) NOT NULL UNIQUE,
          price DECIMAL(10, 2) NOT NULL DEFAULT 0,
          features TEXT,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_slug (slug),
          INDEX idx_active (active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.subscription_plans = true;
      console.log('[Ensure Tables] ✅ subscription_plans');

      // ========== VPS_PRODUCTS ==========
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS vps_products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          price DECIMAL(10, 2) NOT NULL DEFAULT 0,
          ram VARCHAR(20),
          cpu VARCHAR(50),
          storage VARCHAR(50),
          bandwidth VARCHAR(50),
          max_mt4_instances INT DEFAULT 5,
          max_mt5_instances INT DEFAULT 5,
          is_free BOOLEAN DEFAULT false,
          is_recommended BOOLEAN DEFAULT false,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_active (active),
          INDEX idx_price (price)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.vps_products = true;
      console.log('[Ensure Tables] ✅ vps_products');

      // ========== EXPERT_ADVISORS ==========
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS expert_advisors (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL DEFAULT 0,
          platform VARCHAR(20) NOT NULL,
          file_url VARCHAR(500),
          downloads INT DEFAULT 0,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_platform (platform),
          INDEX idx_active (active),
          INDEX idx_price (price)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.expert_advisors = true;
      console.log('[Ensure Tables] ✅ expert_advisors');

      // ========== LANDING_PAGE_CONTENT ==========
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS landing_page_content (
          id INT AUTO_INCREMENT PRIMARY KEY,
          section VARCHAR(50) NOT NULL UNIQUE,
          title VARCHAR(200),
          subtitle VARCHAR(300),
          content TEXT,
          image_url VARCHAR(500),
          cta_text VARCHAR(100),
          cta_link VARCHAR(300),
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_section (section),
          INDEX idx_active (active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.landing_page_content = true;
      console.log('[Ensure Tables] ✅ landing_page_content');

    } catch (error: any) {
      results.errors.push(error.message);
      console.error('[Ensure Tables] ❌ Erro:', error);
    }

    const allSuccess = results.subscription_plans && 
                      results.vps_products && 
                      results.expert_advisors &&
                      results.landing_page_content;

    // Fechar conexão DEPOIS de enviar resposta
    connection.end().catch(err => console.error('Erro ao fechar conexão:', err));

    res.json({
      success: allSuccess,
      message: allSuccess 
        ? 'Todas as tabelas foram verificadas e criadas com sucesso!' 
        : 'Algumas tabelas falharam ao criar',
      results
    });

  } catch (error: any) {
    console.error('[Ensure Tables] Erro fatal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
