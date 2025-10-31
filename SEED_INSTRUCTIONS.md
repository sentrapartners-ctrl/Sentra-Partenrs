# 🌱 Como Executar o Seed de Produtos

Este documento explica como popular o banco de dados com dados reais de produtos (Assinaturas, VPS e EAs).

## 📋 Dados que Serão Criados

### Planos de Assinatura (3)
1. **Plano Básico** - R$ 49,90/mês
   - Copy Trading Ilimitado
   - Dashboard Analytics
   - Suporte por Email
   - 2 Contas MT4/MT5
   - Acesso aos EAs Básicos

2. **Plano Profissional** - R$ 99,90/mês ⭐ RECOMENDADO
   - Tudo do Plano Básico
   - VPS Grátis (Starter)
   - Suporte Prioritário
   - 5 Contas MT4/MT5
   - Todos os EAs Premium
   - Análise Avançada de Performance

3. **Plano Enterprise** - R$ 199,90/mês
   - Tudo do Plano Profissional
   - VPS Pro Grátis
   - Suporte 24/7 Dedicado
   - Contas Ilimitadas
   - API de Integração
   - Consultoria Personalizada
   - Relatórios Customizados

### Produtos VPS (3)
1. **VPS Starter** - R$ 29,90/mês
   - 2 GB RAM
   - 1 vCPU
   - 30 GB SSD
   - 1 TB Bandwidth
   - Até 3 instâncias MT4/MT5

2. **VPS Pro** - R$ 59,90/mês ⭐ RECOMENDADO
   - 4 GB RAM
   - 2 vCPU
   - 60 GB SSD
   - 2 TB Bandwidth
   - Até 5 instâncias MT4/MT5

3. **VPS Enterprise** - R$ 119,90/mês
   - 8 GB RAM
   - 4 vCPU
   - 120 GB SSD
   - Bandwidth Ilimitado
   - Até 10 instâncias MT4/MT5

### Expert Advisors (3)
1. **Scalper Pro MT5** - R$ 149,90
   - Plataforma: MT5
   - Estratégia: Scalping
   - Ideal para: Forex com alta volatilidade

2. **Trend Master MT4** - R$ 199,90
   - Plataforma: MT4
   - Estratégia: Seguidor de Tendência
   - Ideal para: Operações conservadoras

3. **Grid Trader Universal** - R$ 249,90
   - Plataforma: MT4/MT5
   - Estratégia: Grid Trading
   - Ideal para: Mercados laterais

---

## 🚀 Como Executar

### Opção 1: Via SSH no Servidor (Recomendado)

1. Conecte-se ao servidor via SSH
2. Navegue até o diretório do projeto
3. Execute o comando:

```bash
npx tsx server/seed-products.ts
```

### Opção 2: Via Railway CLI

```bash
railway run npx tsx server/seed-products.ts
```

### Opção 3: Criar Manualmente pelo Admin

Após o deploy, você pode criar os produtos manualmente através do painel admin:

1. Acesse `/admin`
2. Vá para cada aba (Assinaturas, VPS, EAs)
3. Clique em "Novo Plano" / "Nova VPS" / "Novo EA"
4. Preencha os dados conforme listado acima

---

## ⚠️ Importante

- O script **limpa os dados existentes** antes de inserir os novos
- Execute apenas **uma vez** ou quando quiser resetar os produtos
- Os dados são **permanentes** e ficarão no banco até serem deletados

---

## ✅ Verificação

Após executar o seed, você deve ver:
- 3 planos na aba "Assinaturas"
- 3 produtos VPS na aba "VPS"
- 3 EAs na aba "EAs"

Todos os produtos estarão **ativos** e prontos para venda!
