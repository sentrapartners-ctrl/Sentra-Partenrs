/**
 * Script para garantir que todas as tabelas de produtos existam
 * com TODAS as colunas necessárias
 */

import { getRawConnection } from "../db";

async function ensureProductTables() {
  console.log('🔍 Verificando e criando tabelas de produtos...\n');

  const connection = await getRawConnection();
  if (!connection) {
    throw new Error('Conexão com banco não disponível');
  }

  try {
    // ========== SUBSCRIPTION_PLANS ==========
    console.log('📋 Verificando tabela subscription_plans...');
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
    console.log('  ✅ subscription_plans OK\n');

    // ========== VPS_PRODUCTS ==========
    console.log('🖥️  Verificando tabela vps_products...');
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
    console.log('  ✅ vps_products OK\n');

    // ========== EXPERT_ADVISORS ==========
    console.log('🤖 Verificando tabela expert_advisors...');
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
    console.log('  ✅ expert_advisors OK\n');

    // ========== VERIFICAR COLUNAS ==========
    console.log('🔍 Verificando estrutura das tabelas...\n');

    // Verificar subscription_plans
    const [planColumns]: any = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'subscription_plans'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('📋 subscription_plans:');
    console.log('  Colunas:', planColumns.map((c: any) => c.COLUMN_NAME).join(', '));

    // Verificar vps_products
    const [vpsColumns]: any = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'vps_products'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('\n🖥️  vps_products:');
    console.log('  Colunas:', vpsColumns.map((c: any) => c.COLUMN_NAME).join(', '));

    // Verificar expert_advisors
    const [eaColumns]: any = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'expert_advisors'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('\n🤖 expert_advisors:');
    console.log('  Colunas:', eaColumns.map((c: any) => c.COLUMN_NAME).join(', '));

    console.log('\n✅ Todas as tabelas foram verificadas e criadas com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar
ensureProductTables()
  .then(() => {
    console.log('\n🎉 Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
