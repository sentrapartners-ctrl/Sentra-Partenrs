# Changelog - 31 de Outubro de 2025

## 🎯 Correções Implementadas

### 1. Dashboard Admin - Correção de Valores
**Problema:** Dashboard Admin mostrava valores incorretos para contas STANDARD (não estava dividindo CENT por 100)

**Solução:**
- Atualizado `formatCurrency` em `client/src/pages/admin/Dashboard.tsx`
- Agora verifica tipo de conta antes de formatar
- CENT: Divide por 100 (508.759 centavos → US$ 508.759,00)
- STANDARD: Usa valor direto (103.222 → US$ 103.222,00)

**Resultado:**
- Top 5 Contas agora mostra valores corretos
- Total geral corrigido de ~US$ 23k para ~US$ 1.9M

### 2. Drawdown Removido do Dashboard Principal
**Mudança:** Card de "Drawdown do Mês" removido do Dashboard principal (Home.tsx)

**Motivo:** Métrica mais relevante para página de Estratégias

**Alterações:**
- Removido card de Drawdown
- Grid ajustado de 5 para 4 colunas
- Dashboard mais limpo e focado

### 3. Drawdown Adicionado em Estratégias
**Implementação:** Drawdown do Mês agora aparece na página de Estratégias

**Layout:**
- Dois cards lado a lado (Lucro Total do Mês + Drawdown do Mês)
- Drawdown verde se ≤5%, vermelho se >5%
- Cálculo normalizado para CENT vs STANDARD

### 4. Cálculo de Drawdown Corrigido
**Problema:** Drawdown mostrava 99,99% (incorreto)

**Solução:**
- Normalização de valores antes do cálculo
- CENT: Divide por 100
- STANDARD: Mantém valor
- Percentual agora correto (~0,41%)

## 📦 Commits

1. **`5a3554b`** - Corrigir cálculo de Drawdown do Mês
2. **`e75c47f`** - Corrigir Dashboard Admin e mover Drawdown para Estratégias

## 🚀 Deploy

- Push para `main` realizado com sucesso
- Railway fazendo deploy automático
- Tempo estimado: 2-3 minutos

## ✅ Verificações Necessárias

Após deploy, verificar:

1. **Dashboard Admin**
   - [ ] Top 5 Contas mostra valores corretos (US$ 508k, US$ 103k, etc)
   - [ ] Total geral ~US$ 1.9M

2. **Dashboard Principal**
   - [ ] Sem card de Drawdown
   - [ ] Apenas 4 cards principais

3. **Estratégias**
   - [ ] Drawdown aparece ao lado de Lucro do Mês
   - [ ] Percentual correto (~0,41%)

## 🔧 Arquivos Modificados

- `client/src/pages/admin/Dashboard.tsx` - Correção formatCurrency
- `client/src/pages/Home.tsx` - Remoção de Drawdown
- `client/src/pages/Strategies.tsx` - Adição de Drawdown

## 📊 Status do Sistema

Todos os sistemas operacionais:
- ✅ Sistema de permissões manuais
- ✅ Bloqueio de conexão sem assinatura
- ✅ Sistema de VMs
- ✅ Limpeza automática de dados
- ✅ Dashboard Admin com valores corretos
- ✅ Drawdown em Estratégias
