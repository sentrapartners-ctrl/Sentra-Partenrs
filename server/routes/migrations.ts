import { Router } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getRawConnection } from '../db.js';

const router = Router();

// Endpoint para executar todas as migrations
router.post('/run-all', async (req, res) => {
  try {
    console.log('[Migrations] Iniciando execução de todas as migrations...');
    console.log('[Migrations] CWD:', process.cwd());
    
    // Ler arquivo SQL consolidado
    const sqlPath = join(process.cwd(), 'server', 'migrations', 'run_all_migrations.sql');
    console.log('[Migrations] SQL Path:', sqlPath);
    
    const sql = readFileSync(sqlPath, 'utf-8');
    console.log('[Migrations] SQL file size:', sql.length, 'bytes');
    
    // Remover comentários de linha
    const cleanSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    // Dividir em statements individuais (separados por ;)
    const statements = cleanSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`[Migrations] Encontrados ${statements.length} statements para executar`);
    
    // Executar cada statement
    const connection = await getRawConnection();
    const results = [];
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        console.log(`[Migrations] Executando statement ${i + 1}/${statements.length}...`);
        await connection.execute(statement);
        results.push({ index: i + 1, status: 'success' });
      } catch (error: any) {
        // Ignorar erros de "já existe" ou "coluna já existe"
        if (
          error.code === 'ER_TABLE_EXISTS_ERROR' ||
          error.code === 'ER_DUP_FIELDNAME' ||
          error.code === 'ER_DUP_KEYNAME' ||
          error.code === 'ER_CANT_DROP_FIELD_OR_KEY' ||
          error.message.includes('already exists') ||
          error.message.includes('Duplicate column') ||
          error.message.includes('Duplicate key')
        ) {
          console.log(`[Migrations] Statement ${i + 1} ignorado (já existe)`);
          results.push({ index: i + 1, status: 'skipped', reason: 'already_exists' });
        } else {
          console.error(`[Migrations] Erro no statement ${i + 1}:`, error);
          results.push({ index: i + 1, status: 'error', error: error.message });
        }
      }
    }
    
    const successCount = results.filter(r => r.status === 'success').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    console.log('[Migrations] Execução concluída!');
    console.log(`[Migrations] Sucesso: ${successCount}, Ignorados: ${skippedCount}, Erros: ${errorCount}`);
    
    res.json({
      success: true,
      message: 'Migrations executadas com sucesso',
      stats: {
        total: statements.length,
        success: successCount,
        skipped: skippedCount,
        errors: errorCount
      },
      results
    });
    
  } catch (error: any) {
    console.error('[Migrations] Erro ao executar migrations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para verificar status das tabelas
router.get('/status', async (req, res) => {
  try {
    const connection = await getRawConnection();
    
    const tables = [
      'copy_signals',
      'copy_trades',
      'slave_heartbeats',
      'signal_providers',
      'signal_subscriptions',
      'provider_statistics',
      'provider_reviews'
    ];
    
    const status: any = {};
    
    for (const table of tables) {
      try {
        const [rows]: any = await connection.execute(`SHOW TABLES LIKE '${table}'`);
        status[table] = rows.length > 0 ? 'exists' : 'missing';
      } catch (error) {
        status[table] = 'error';
      }
    }
    
    res.json({
      success: true,
      tables: status
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

//====================================================
// POST /api/migrations/007
// Executa migration 007 (add profit field)
//====================================================
router.post('/007', async (req, res) => {
  try {
    console.log('[Migration 007] Iniciando...');
    
    const sqlPath = join(process.cwd(), 'server', 'migrations', '007_add_profit_to_copy_trades.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`[Migration 007] Encontrados ${statements.length} statements`);
    
    const connection = await getRawConnection();
    const results = [];
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        console.log(`[Migration 007] Executando statement ${i + 1}...`);
        await connection.execute(statement);
        results.push({ index: i + 1, status: 'success' });
      } catch (error: any) {
        if (
          error.code === 'ER_DUP_FIELDNAME' ||
          error.code === 'ER_DUP_KEYNAME' ||
          error.message.includes('Duplicate column') ||
          error.message.includes('Duplicate key')
        ) {
          console.log(`[Migration 007] Statement ${i + 1} ignorado (já existe)`);
          results.push({ index: i + 1, status: 'skipped' });
        } else {
          console.error(`[Migration 007] Erro no statement ${i + 1}:`, error);
          results.push({ index: i + 1, status: 'error', error: error.message });
        }
      }
    }
    
    const successCount = results.filter(r => r.status === 'success').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    
    console.log('[Migration 007] Concluída!');
    console.log(`[Migration 007] Sucesso: ${successCount}, Ignorados: ${skippedCount}`);
    
    res.json({
      success: true,
      message: 'Migration 007 executada',
      stats: {
        total: statements.length,
        success: successCount,
        skipped: skippedCount
      },
      results
    });
    
  } catch (error: any) {
    console.error('[Migration 007] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
