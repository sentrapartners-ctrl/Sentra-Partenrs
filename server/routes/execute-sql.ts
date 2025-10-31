import express from 'express';
import { getRawConnection } from '../db';

const router = express.Router();

// POST /api/execute-sql - Executar SQL diretamente
router.post("/", async (req, res) => {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    // Criar subscription_plans
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

    // Criar vps_products
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

    // Criar expert_advisors
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

    // Criar landing_page_content
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

    res.json({
      success: true,
      message: 'Todas as tabelas foram criadas com sucesso!',
      tables: [
        'subscription_plans',
        'vps_products',
        'expert_advisors',
        'landing_page_content'
      ]
    });
  } catch (error: any) {
    console.error('[Execute SQL] Erro:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
