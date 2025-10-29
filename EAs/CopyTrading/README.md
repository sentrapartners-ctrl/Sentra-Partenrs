# 📊 Copy Trading - Master & Slave

Sistema de cópia de trades entre contas MT4/MT5.

## 📂 Estrutura

### Master/
Expert Advisors para conta **origem** (que será copiada):
- **SentraPartners_Master_MT4.mq4** - Para MetaTrader 4
- **SentraPartners_Master_MT5.mq5** - Para MetaTrader 5

### Slave/
Expert Advisors para contas **destino** (que copiam):
- **SentraPartners_Slave_MT4.mq4** - Para MetaTrader 4
- **SentraPartners_Slave_MT5.mq5** - Para MetaTrader 5

## 🔄 Como Funciona

1. **Master** envia trades para a plataforma
2. **Plataforma** distribui para Slaves configurados
3. **Slaves** replicam os trades automaticamente

## ⚙️ Configuração

### Conta Master (Origem)
1. Instale o EA Master
2. Configure seu email
3. Ative no gráfico

### Contas Slave (Destino)
1. Instale o EA Slave
2. Configure email do Master
3. Configure multiplicador de lote (opcional)
4. Ative no gráfico

## 🎯 Recursos

- ✅ Cópia em tempo real
- ✅ Multiplicador de lote personalizável
- ✅ Filtros por símbolo
- ✅ Gestão de risco
- ✅ Múltiplos slaves por master

## 📚 Documentação

Veja os manuais completos em `../Manuais/`
