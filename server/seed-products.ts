import { getRawConnection } from './db';

async function seedProducts() {
  const connection = await getRawConnection();
  if (!connection) {
    console.error('Conexão com banco não disponível');
    process.exit(1);
  }

  try {
    console.log('🌱 Iniciando seed de produtos...\n');

    // Limpar dados existentes (opcional)
    console.log('Limpando dados existentes...');
    await connection.execute('DELETE FROM subscription_plans');
    await connection.execute('DELETE FROM vps_products');
    await connection.execute('DELETE FROM expert_advisors');
    console.log('✓ Dados limpos\n');

    // ========== PLANOS DE ASSINATURA ==========
    console.log('📋 Criando Planos de Assinatura...');
    
    const plans = [
      {
        name: 'Plano Básico',
        slug: 'basico',
        price: 49.90,
        features: 'Copy Trading Ilimitado\nDashboard Analytics\nSuporte por Email\n2 Contas MT4/MT5\nAcesso aos EAs Básicos'
      },
      {
        name: 'Plano Profissional',
        slug: 'profissional',
        price: 99.90,
        features: 'Tudo do Plano Básico\nVPS Grátis (Starter)\nSuporte Prioritário\n5 Contas MT4/MT5\nTodos os EAs Premium\nAnálise Avançada de Performance'
      },
      {
        name: 'Plano Enterprise',
        slug: 'enterprise',
        price: 199.90,
        features: 'Tudo do Plano Profissional\nVPS Pro Grátis\nSuporte 24/7 Dedicado\nContas Ilimitadas\nAPI de Integração\nConsultoria Personalizada\nRelatórios Customizados'
      }
    ];

    for (const plan of plans) {
      await connection.execute(
        `INSERT INTO subscription_plans (name, slug, price, features, active) 
         VALUES (?, ?, ?, ?, ?)`,
        [plan.name, plan.slug, plan.price, plan.features, true]
      );
      console.log(`  ✓ ${plan.name} - R$ ${plan.price}`);
    }

    // ========== PRODUTOS VPS ==========
    console.log('\n🖥️  Criando Produtos VPS...');
    
    const vpsProducts = [
      {
        name: 'VPS Starter',
        price: 29.90,
        ram: '2 GB',
        cpu: '1 vCPU',
        storage: '30 GB SSD',
        bandwidth: '1 TB',
        max_mt4: 3,
        max_mt5: 3,
        is_free: false,
        is_recommended: false
      },
      {
        name: 'VPS Pro',
        price: 59.90,
        ram: '4 GB',
        cpu: '2 vCPU',
        storage: '60 GB SSD',
        bandwidth: '2 TB',
        max_mt4: 5,
        max_mt5: 5,
        is_free: false,
        is_recommended: true
      },
      {
        name: 'VPS Enterprise',
        price: 119.90,
        ram: '8 GB',
        cpu: '4 vCPU',
        storage: '120 GB SSD',
        bandwidth: 'Ilimitado',
        max_mt4: 10,
        max_mt5: 10,
        is_free: false,
        is_recommended: false
      }
    ];

    for (const vps of vpsProducts) {
      await connection.execute(
        `INSERT INTO vps_products 
         (name, price, ram, cpu, storage, bandwidth, max_mt4_instances, max_mt5_instances, is_free, is_recommended, active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          vps.name, 
          vps.price, 
          vps.ram, 
          vps.cpu, 
          vps.storage, 
          vps.bandwidth, 
          vps.max_mt4, 
          vps.max_mt5, 
          vps.is_free ? 1 : 0, 
          vps.is_recommended ? 1 : 0, 
          true
        ]
      );
      console.log(`  ✓ ${vps.name} - R$ ${vps.price} (${vps.ram} RAM, ${vps.cpu})`);
    }

    // ========== EXPERT ADVISORS ==========
    console.log('\n🤖 Criando Expert Advisors...');
    
    const eas = [
      {
        name: 'Scalper Pro MT5',
        description: 'Expert Advisor de scalping otimizado para pares de forex com alta volatilidade. Utiliza indicadores técnicos avançados e gerenciamento de risco inteligente.',
        price: 149.90,
        platform: 'MT5',
        file_url: '/downloads/eas/scalper-pro-mt5.ex5'
      },
      {
        name: 'Trend Master MT4',
        description: 'EA profissional para seguir tendências de médio e longo prazo. Ideal para traders que buscam operações mais conservadoras com alto win rate.',
        price: 199.90,
        platform: 'MT4',
        file_url: '/downloads/eas/trend-master-mt4.ex4'
      },
      {
        name: 'Grid Trader Universal',
        description: 'Sistema de grid trading adaptativo compatível com MT4 e MT5. Perfeito para mercados laterais com configurações personalizáveis de distância e lotes.',
        price: 249.90,
        platform: 'MT4/MT5',
        file_url: '/downloads/eas/grid-trader-universal.zip'
      }
    ];

    for (const ea of eas) {
      await connection.execute(
        `INSERT INTO expert_advisors 
         (name, description, price, platform, file_url, downloads, active) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [ea.name, ea.description, ea.price, ea.platform, ea.file_url, 0, true]
      );
      console.log(`  ✓ ${ea.name} (${ea.platform}) - R$ ${ea.price}`);
    }

    console.log('\n✅ Seed concluído com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`  - ${plans.length} Planos de Assinatura`);
    console.log(`  - ${vpsProducts.length} Produtos VPS`);
    console.log(`  - ${eas.length} Expert Advisors`);
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao fazer seed:', error);
    await connection.end();
    process.exit(1);
  }
}

seedProducts();
