import { getDb } from "./server/db";
import { subscriptionPlans, vpsProducts, eaProducts, cryptoPaymentAddresses, users } from "./drizzle/schema";
import bcrypt from "bcryptjs";

async function seedData() {
  console.log("🌱 Iniciando seed do banco de dados...");
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // 1. Criar usuário admin
  console.log("👤 Criando usuário admin...");
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  await db.insert(users).values({
    email: "admin@sentrapartners.com",
    password: hashedPassword,
    name: "Administrador",
    authMethod: "email",
    role: "admin",
    isActive: true,
  }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });

  // 2. Criar planos de assinatura
  console.log("💳 Criando planos de assinatura...");
  
  await db.insert(subscriptionPlans).values([
    {
      name: "Básico",
      slug: "basico",
      description: "Plano ideal para iniciantes no trading",
      price: 4900, // R$ 49,00
      billingCycle: "monthly",
      features: JSON.stringify([
        "Dashboard completo",
        "Até 2 contas MT4/MT5",
        "Análises básicas",
        "Histórico de trades",
        "Suporte por email"
      ]),
      maxAccounts: 2,
      copyTradingEnabled: false,
      advancedAnalyticsEnabled: false,
      freeVpsEnabled: false,
      prioritySupport: false,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: "Pro",
      slug: "pro",
      description: "Para traders profissionais que precisam de copy trading",
      price: 9900, // R$ 99,00
      billingCycle: "monthly",
      features: JSON.stringify([
        "Tudo do plano Básico",
        "Até 5 contas MT4/MT5",
        "Copy Trading ilimitado",
        "Análises avançadas",
        "Alertas personalizados",
        "Suporte prioritário"
      ]),
      maxAccounts: 5,
      copyTradingEnabled: true,
      advancedAnalyticsEnabled: true,
      freeVpsEnabled: false,
      prioritySupport: true,
      isActive: true,
      sortOrder: 2,
    },
    {
      name: "Premium",
      slug: "premium",
      description: "Plano completo com VPS grátis e todos os recursos",
      price: 19900, // R$ 199,00
      billingCycle: "monthly",
      features: JSON.stringify([
        "Tudo do plano Pro",
        "Contas ilimitadas",
        "VPS GRÁTIS (2GB RAM)",
        "Copy Trading avançado",
        "API de integração",
        "Suporte VIP 24/7",
        "Consultoria mensal"
      ]),
      maxAccounts: 999,
      copyTradingEnabled: true,
      advancedAnalyticsEnabled: true,
      freeVpsEnabled: true,
      prioritySupport: true,
      isActive: true,
      sortOrder: 3,
    },
  ]).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });

  // 3. Criar produtos VPS
  console.log("🖥️ Criando produtos VPS...");
  
  await db.insert(vpsProducts).values([
    {
      name: "VPS Starter",
      slug: "vps-starter",
      description: "VPS básica para 1-2 EAs",
      specifications: JSON.stringify({
        cpu: "1 vCore",
        ram: "1GB",
        storage: "20GB SSD",
        bandwidth: "1TB",
        uptime: "99.9%"
      }),
      price: 2900, // R$ 29,00
      billingCycle: "monthly",
      location: "São Paulo, Brasil",
      provider: "AWS",
      maxMt4Instances: 2,
      maxMt5Instances: 2,
      setupFee: 0,
      isAvailable: true,
      stockQuantity: 50,
      imageUrl: "https://placehold.co/400x300/3b82f6/ffffff?text=VPS+Starter",
      sortOrder: 1,
    },
    {
      name: "VPS Professional",
      slug: "vps-professional",
      description: "VPS intermediária para 3-5 EAs",
      specifications: JSON.stringify({
        cpu: "2 vCores",
        ram: "2GB",
        storage: "40GB SSD",
        bandwidth: "2TB",
        uptime: "99.9%"
      }),
      price: 4900, // R$ 49,00
      billingCycle: "monthly",
      location: "São Paulo, Brasil",
      provider: "AWS",
      maxMt4Instances: 5,
      maxMt5Instances: 5,
      setupFee: 0,
      isAvailable: true,
      stockQuantity: 50,
      imageUrl: "https://placehold.co/400x300/10b981/ffffff?text=VPS+Pro",
      sortOrder: 2,
    },
    {
      name: "VPS Premium (GRÁTIS no Plano Premium)",
      slug: "vps-premium-free",
      description: "VPS avançada para múltiplos EAs - INCLUÍDA no plano Premium",
      specifications: JSON.stringify({
        cpu: "2 vCores",
        ram: "2GB",
        storage: "60GB SSD",
        bandwidth: "3TB",
        uptime: "99.99%"
      }),
      price: 0, // Grátis para assinantes Premium
      billingCycle: "monthly",
      location: "São Paulo, Brasil",
      provider: "AWS",
      maxMt4Instances: 10,
      maxMt5Instances: 10,
      setupFee: 0,
      isAvailable: true,
      stockQuantity: 100,
      imageUrl: "https://placehold.co/400x300/8b5cf6/ffffff?text=VPS+Premium",
      sortOrder: 3,
    },
    {
      name: "VPS Enterprise",
      slug: "vps-enterprise",
      description: "VPS de alto desempenho para traders profissionais",
      specifications: JSON.stringify({
        cpu: "4 vCores",
        ram: "4GB",
        storage: "100GB SSD",
        bandwidth: "5TB",
        uptime: "99.99%"
      }),
      price: 9900, // R$ 99,00
      billingCycle: "monthly",
      location: "São Paulo, Brasil",
      provider: "AWS",
      maxMt4Instances: 20,
      maxMt5Instances: 20,
      setupFee: 0,
      isAvailable: true,
      stockQuantity: 30,
      imageUrl: "https://placehold.co/400x300/ef4444/ffffff?text=VPS+Enterprise",
      sortOrder: 4,
    },
  ]).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });

  // 4. Criar produtos EA
  console.log("🤖 Criando Expert Advisors...");
  
  await db.insert(eaProducts).values([
    {
      name: "Scalper Pro EA",
      slug: "scalper-pro-ea",
      description: "Expert Advisor de scalping para operações rápidas",
      longDescription: "O Scalper Pro EA é um robô avançado que utiliza estratégias de scalping para capturar pequenos movimentos de mercado. Ideal para pares de moedas com alta liquidez.",
      platform: "BOTH",
      price: 29900, // R$ 299,00
      licenseType: "single",
      rentalPeriod: 0,
      features: JSON.stringify([
        "Scalping automático",
        "Gerenciamento de risco integrado",
        "Múltiplos timeframes",
        "Filtros de notícias",
        "Trailing stop avançado"
      ]),
      strategy: "Estratégia de scalping baseada em indicadores técnicos e análise de volume",
      backtestResults: JSON.stringify({
        period: "2020-2024",
        profit: "287%",
        drawdown: "12%",
        winRate: "68%",
        trades: 1247
      }),
      version: "2.5.0",
      imageUrl: "https://placehold.co/600x400/3b82f6/ffffff?text=Scalper+Pro",
      isAvailable: true,
      isExclusive: false,
      downloads: 0,
      rating: 0,
      reviewCount: 0,
      sortOrder: 1,
    },
    {
      name: "Trend Master EA",
      slug: "trend-master-ea",
      description: "Robô seguidor de tendências de longo prazo",
      longDescription: "O Trend Master EA identifica e segue tendências de médio a longo prazo, maximizando lucros em movimentos direcionais fortes.",
      platform: "BOTH",
      price: 39900, // R$ 399,00
      licenseType: "single",
      rentalPeriod: 0,
      features: JSON.stringify([
        "Detecção automática de tendências",
        "Múltiplos pares simultâneos",
        "Stop loss dinâmico",
        "Take profit inteligente",
        "Alertas por Telegram"
      ]),
      strategy: "Seguidor de tendência com confirmação por múltiplos indicadores",
      backtestResults: JSON.stringify({
        period: "2019-2024",
        profit: "412%",
        drawdown: "18%",
        winRate: "72%",
        trades: 856
      }),
      version: "3.1.2",
      imageUrl: "https://placehold.co/600x400/10b981/ffffff?text=Trend+Master",
      isAvailable: true,
      isExclusive: false,
      downloads: 0,
      rating: 0,
      reviewCount: 0,
      sortOrder: 2,
    },
    {
      name: "Grid Trading EA",
      slug: "grid-trading-ea",
      description: "Sistema de grade para mercados laterais",
      longDescription: "O Grid Trading EA opera com estratégia de grade, ideal para mercados em consolidação. Abre posições em níveis predefinidos.",
      platform: "MT5",
      price: 24900, // R$ 249,00
      licenseType: "single",
      rentalPeriod: 0,
      features: JSON.stringify([
        "Grade configurável",
        "Martingale opcional",
        "Hedge automático",
        "Gerenciamento de lotes",
        "Painel de controle visual"
      ]),
      strategy: "Sistema de grade com gerenciamento de risco avançado",
      backtestResults: JSON.stringify({
        period: "2020-2024",
        profit: "198%",
        drawdown: "22%",
        winRate: "64%",
        trades: 2341
      }),
      version: "1.8.5",
      imageUrl: "https://placehold.co/600x400/8b5cf6/ffffff?text=Grid+Trading",
      isAvailable: true,
      isExclusive: false,
      downloads: 0,
      rating: 0,
      reviewCount: 0,
      sortOrder: 3,
    },
    {
      name: "News Trader EA",
      slug: "news-trader-ea",
      description: "Robô especializado em trading de notícias",
      longDescription: "O News Trader EA opera durante eventos de alto impacto, capturando movimentos explosivos causados por notícias econômicas.",
      platform: "MT4",
      price: 34900, // R$ 349,00
      licenseType: "single",
      rentalPeriod: 0,
      features: JSON.stringify([
        "Calendário econômico integrado",
        "Execução ultra-rápida",
        "Filtros de volatilidade",
        "Proteção contra slippage",
        "Modo demo e live"
      ]),
      strategy: "Trading de breakout em eventos de notícias de alto impacto",
      backtestResults: JSON.stringify({
        period: "2021-2024",
        profit: "324%",
        drawdown: "15%",
        winRate: "58%",
        trades: 423
      }),
      version: "2.0.1",
      imageUrl: "https://placehold.co/600x400/f59e0b/ffffff?text=News+Trader",
      isAvailable: true,
      isExclusive: false,
      downloads: 0,
      rating: 0,
      reviewCount: 0,
      sortOrder: 4,
    },
    {
      name: "AI Predictor EA (Exclusivo)",
      slug: "ai-predictor-ea",
      description: "EA com inteligência artificial e machine learning",
      longDescription: "O AI Predictor EA utiliza redes neurais e machine learning para prever movimentos de mercado. Edição limitada e exclusiva.",
      platform: "BOTH",
      price: 79900, // R$ 799,00
      licenseType: "single",
      rentalPeriod: 0,
      features: JSON.stringify([
        "Inteligência artificial avançada",
        "Aprendizado contínuo",
        "Análise de sentimento",
        "Previsão de volatilidade",
        "Suporte técnico dedicado",
        "Atualizações vitalícias"
      ]),
      strategy: "Machine learning com redes neurais LSTM para previsão de preços",
      backtestResults: JSON.stringify({
        period: "2022-2024",
        profit: "567%",
        drawdown: "14%",
        winRate: "76%",
        trades: 1089
      }),
      version: "1.2.0",
      imageUrl: "https://placehold.co/600x400/ef4444/ffffff?text=AI+Predictor",
      isAvailable: true,
      isExclusive: true,
      downloads: 0,
      rating: 0,
      reviewCount: 0,
      sortOrder: 5,
    },
  ]).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });

  // 5. Criar endereços de pagamento cripto
  console.log("💰 Criando endereços de pagamento cripto...");
  
  await db.insert(cryptoPaymentAddresses).values([
    {
      currency: "BTC",
      network: "Bitcoin",
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      label: "Bitcoin Main Wallet",
      isActive: true,
    },
    {
      currency: "USDT",
      network: "Ethereum",
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      label: "USDT Ethereum Wallet",
      isActive: true,
    },
    {
      currency: "USDT",
      network: "Polygon",
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      label: "USDT Polygon Wallet",
      isActive: true,
    },
    {
      currency: "MATIC",
      network: "Polygon",
      address: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
      label: "MATIC Polygon Wallet",
      isActive: true,
    },
    {
      currency: "ETH",
      network: "Ethereum",
      address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      label: "Ethereum Main Wallet",
      isActive: true,
    },
  ]).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });

  console.log("✅ Seed concluído com sucesso!");
  console.log("\n📊 Dados criados:");
  console.log("  - 1 usuário admin (admin@sentrapartners.com / admin123)");
  console.log("  - 3 planos de assinatura");
  console.log("  - 4 produtos VPS");
  console.log("  - 5 Expert Advisors");
  console.log("  - 5 endereços de pagamento cripto");
  
  process.exit(0);
}

seedData().catch((error) => {
  console.error("❌ Erro ao fazer seed:", error);
  process.exit(1);
});

