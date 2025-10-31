/**
 * Heartbeat Checker - Sistema Robusto de Conexão
 * 
 * Mantém contas online permanentemente e só desconecta após 10 tentativas falhadas em 30 minutos
 * 
 * Lógica:
 * - Verifica a cada 3 minutos se há contas sem heartbeat recente
 * - Se passar 3 minutos sem heartbeat → incrementa failed_attempts
 * - Se failed_attempts >= 10 → marca is_connected = false
 * - Quando receber heartbeat → reseta failed_attempts e marca is_connected = true
 * - A cada 30 minutos, reseta failed_attempts de contas que voltaram a enviar heartbeat
 */

import { getRawConnection } from './db.js';

const HEARTBEAT_INTERVAL = 3 * 60 * 1000; // 3 minutos
const MAX_FAILED_ATTEMPTS = 10;
const RESET_INTERVAL = 30 * 60 * 1000; // 30 minutos

export function startHeartbeatChecker() {
  console.log('🔍 Heartbeat Checker iniciado');
  console.log(`⏱️  Intervalo de verificação: ${HEARTBEAT_INTERVAL / 1000}s`);
  console.log(`❌ Máximo de falhas: ${MAX_FAILED_ATTEMPTS}`);
  console.log(`🔄 Intervalo de reset: ${RESET_INTERVAL / 1000 / 60}min`);

  // Verificar heartbeats a cada 3 minutos
  setInterval(async () => {
    await checkHeartbeats();
  }, HEARTBEAT_INTERVAL);

  // Resetar contadores a cada 30 minutos
  setInterval(async () => {
    await resetFailedAttempts();
  }, RESET_INTERVAL);

  // Executar primeira verificação após 1 minuto
  setTimeout(() => {
    checkHeartbeats();
  }, 60000);
}

async function checkHeartbeats() {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      console.error('❌ Conexão com banco não disponível');
      return;
    }

    const now = new Date();
    console.log(`\n🔍 [${now.toISOString()}] Verificando heartbeats...`);

    // Verificar contas Master (copy_signals)
    await checkMasterAccounts(connection);

    // Verificar contas Slave (slave_heartbeats)
    await checkSlaveAccounts(connection);

    // Verificar contas regulares (trading_accounts)
    await checkRegularAccounts(connection);

    console.log('✅ Verificação de heartbeats concluída\n');
  } catch (error) {
    console.error('❌ Erro ao verificar heartbeats:', error);
  }
}

async function checkMasterAccounts(connection: any) {
  // Buscar contas Master sem heartbeat nos últimos 3 minutos
  const [accounts]: any = await connection.execute(
    `SELECT master_email, account_number, failed_attempts, last_heartbeat, is_connected,
            TIMESTAMPDIFF(SECOND, last_heartbeat, NOW()) as seconds_since_heartbeat
     FROM copy_signals
     WHERE last_heartbeat IS NOT NULL
     AND last_heartbeat < DATE_SUB(NOW(), INTERVAL 3 MINUTE)
     AND is_connected = TRUE`
  );

  if (accounts.length === 0) {
    console.log('  📊 Master: Todas as contas online');
    return;
  }

  console.log(`  ⚠️  Master: ${accounts.length} conta(s) sem heartbeat recente`);

  for (const acc of accounts) {
    const newFailedAttempts = (acc.failed_attempts || 0) + 1;
    
    if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      // Desconectar após 10 falhas
      await connection.execute(
        `UPDATE copy_signals
         SET is_connected = FALSE, failed_attempts = ?, last_attempt = NOW()
         WHERE master_email = ? AND account_number = ?`,
        [newFailedAttempts, acc.master_email, acc.account_number]
      );
      
      console.log(`    ❌ Master ${acc.account_number} DESCONECTADO (${newFailedAttempts} falhas)`);
    } else {
      // Incrementar contador
      await connection.execute(
        `UPDATE copy_signals
         SET failed_attempts = ?, last_attempt = NOW()
         WHERE master_email = ? AND account_number = ?`,
        [newFailedAttempts, acc.master_email, acc.account_number]
      );
      
      console.log(`    ⚠️  Master ${acc.account_number} - Tentativa ${newFailedAttempts}/${MAX_FAILED_ATTEMPTS}`);
    }
  }
}

async function checkSlaveAccounts(connection: any) {
  const [accounts]: any = await connection.execute(
    `SELECT slave_email, account_number, failed_attempts, last_heartbeat, is_connected,
            TIMESTAMPDIFF(SECOND, last_heartbeat, NOW()) as seconds_since_heartbeat
     FROM slave_heartbeats
     WHERE last_heartbeat IS NOT NULL
     AND last_heartbeat < DATE_SUB(NOW(), INTERVAL 3 MINUTE)
     AND is_connected = TRUE`
  );

  if (accounts.length === 0) {
    console.log('  📊 Slave: Todas as contas online');
    return;
  }

  console.log(`  ⚠️  Slave: ${accounts.length} conta(s) sem heartbeat recente`);

  for (const acc of accounts) {
    const newFailedAttempts = (acc.failed_attempts || 0) + 1;
    
    if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      await connection.execute(
        `UPDATE slave_heartbeats
         SET is_connected = FALSE, failed_attempts = ?, last_attempt = NOW()
         WHERE slave_email = ? AND account_number = ?`,
        [newFailedAttempts, acc.slave_email, acc.account_number]
      );
      
      console.log(`    ❌ Slave ${acc.account_number} DESCONECTADO (${newFailedAttempts} falhas)`);
    } else {
      await connection.execute(
        `UPDATE slave_heartbeats
         SET failed_attempts = ?, last_attempt = NOW()
         WHERE slave_email = ? AND account_number = ?`,
        [newFailedAttempts, acc.slave_email, acc.account_number]
      );
      
      console.log(`    ⚠️  Slave ${acc.account_number} - Tentativa ${newFailedAttempts}/${MAX_FAILED_ATTEMPTS}`);
    }
  }
}

async function checkRegularAccounts(connection: any) {
  const [accounts]: any = await connection.execute(
    `SELECT ta.account_number, ta.failed_attempts, ta.last_heartbeat, ta.is_connected, u.email,
            TIMESTAMPDIFF(SECOND, ta.last_heartbeat, NOW()) as seconds_since_heartbeat
     FROM trading_accounts ta
     JOIN users u ON ta.user_id = u.id
     WHERE ta.last_heartbeat IS NOT NULL
     AND ta.last_heartbeat < DATE_SUB(NOW(), INTERVAL 3 MINUTE)
     AND ta.is_connected = TRUE`
  );

  if (accounts.length === 0) {
    console.log('  📊 Regular: Todas as contas online');
    return;
  }

  console.log(`  ⚠️  Regular: ${accounts.length} conta(s) sem heartbeat recente`);

  for (const acc of accounts) {
    const newFailedAttempts = (acc.failed_attempts || 0) + 1;
    
    if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      await connection.execute(
        `UPDATE trading_accounts ta
         JOIN users u ON ta.user_id = u.id
         SET ta.is_connected = FALSE, ta.failed_attempts = ?, ta.last_attempt = NOW()
         WHERE u.email = ? AND ta.account_number = ?`,
        [newFailedAttempts, acc.email, acc.account_number]
      );
      
      console.log(`    ❌ Regular ${acc.account_number} DESCONECTADO (${newFailedAttempts} falhas)`);
    } else {
      await connection.execute(
        `UPDATE trading_accounts ta
         JOIN users u ON ta.user_id = u.id
         SET ta.failed_attempts = ?, ta.last_attempt = NOW()
         WHERE u.email = ? AND ta.account_number = ?`,
        [newFailedAttempts, acc.email, acc.account_number]
      );
      
      console.log(`    ⚠️  Regular ${acc.account_number} - Tentativa ${newFailedAttempts}/${MAX_FAILED_ATTEMPTS}`);
    }
  }
}

async function resetFailedAttempts() {
  try {
    const connection = await getRawConnection();
    if (!connection) return;

    console.log('\n🔄 Resetando contadores de falhas...');

    // Resetar Master accounts que voltaram a enviar heartbeat
    const [masters]: any = await connection.execute(
      `UPDATE copy_signals
       SET failed_attempts = 0
       WHERE failed_attempts > 0
       AND last_heartbeat >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)`
    );

    // Resetar Slave accounts
    const [slaves]: any = await connection.execute(
      `UPDATE slave_heartbeats
       SET failed_attempts = 0
       WHERE failed_attempts > 0
       AND last_heartbeat >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)`
    );

    // Resetar Regular accounts
    const [regulars]: any = await connection.execute(
      `UPDATE trading_accounts
       SET failed_attempts = 0
       WHERE failed_attempts > 0
       AND last_heartbeat >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)`
    );

    const totalReset = (masters.affectedRows || 0) + (slaves.affectedRows || 0) + (regulars.affectedRows || 0);
    console.log(`✅ ${totalReset} conta(s) tiveram contadores resetados\n`);
  } catch (error) {
    console.error('❌ Erro ao resetar contadores:', error);
  }
}
