# 🤖 Expert Advisors - Sentra Partners

**Versão:** 3.0  
**Data:** 31 de Outubro de 2025

---

## 📂 Estrutura do Repositório

```
EAs/
├── Conectores/
│   ├── MT4/
│   │   ├── SentraPartners_MT4.mq4
│   │   ├── Manual_Programador_MT4.md
│   │   ├── Manual_Usuario_MT4.md
│   │   └── Manual_Cliente_MT4.md
│   └── MT5/
│       ├── SentraPartners_MT5.mq5
│       ├── Manual_Programador_MT5.md
│       ├── Manual_Usuario_MT5.md
│       └── Manual_Cliente_MT5.md
├── Master/
│   ├── MT4/
│   │   ├── SentraPartners_Master_MT4.mq4
│   │   ├── Manual_Programador_MT4.md
│   │   ├── Manual_Usuario_MT4.md
│   │   └── Manual_Cliente_MT4.md
│   └── MT5/
│       ├── SentraPartners_Master_MT5.mq5
│       ├── Manual_Programador_MT5.md
│       ├── Manual_Usuario_MT5.md
│       └── Manual_Cliente_MT5.md
└── Slave/
    ├── MT4/
    │   ├── SentraPartners_Slave_MT4.mq4
    │   ├── Manual_Programador_MT4.md
    │   ├── Manual_Usuario_MT4.md
    │   └── Manual_Cliente_MT4.md
    └── MT5/
        ├── SentraPartners_Slave_MT5.mq5
        ├── Manual_Programador_MT5.md
        ├── Manual_Usuario_MT5.md
        └── Manual_Cliente_MT5.md
```

---

## 🎯 Expert Advisors Disponíveis

### 1. 🔌 Conectores (MT4 e MT5)
**Finalidade:** Conectar contas MetaTrader à plataforma web Sentra Partners.

**Funcionalidades:**
- Envio de informações de saldo e equity
- Sincronização de posições abertas
- Transmissão de histórico de trades
- Heartbeat para status "Online"

**Arquivos:**
- `EAs/Conectores/MT4/SentraPartners_MT4.mq4`
- `EAs/Conectores/MT5/SentraPartners_MT5.mq5`

---

### 2. 📡 Master (MT4 e MT5)
**Finalidade:** Transformar conta em provedora de sinais de trading.

**Funcionalidades:**
- Captura de todas as operações em tempo real
- Envio instantâneo de sinais para a plataforma
- Sistema de heartbeat com estado completo das posições
- Suporte a contas Cent e Standard

**Arquivos:**
- `EAs/Master/MT4/SentraPartners_Master_MT4.mq4`
- `EAs/Master/MT5/SentraPartners_Master_MT5.mq5`

---

### 3. 📥 Slave (MT4 e MT5)
**Finalidade:** Copiar operações de uma conta Master automaticamente.

**Funcionalidades:**
- Cópia automática de todas as operações do Master
- Gerenciamento de lote com multiplicador configurável
- Sincronização automática de posições
- Suporte a diferentes tipos de conta (Cent/Standard)
- Normalização automática de símbolos

**Arquivos:**
- `EAs/Slave/MT4/SentraPartners_Slave_MT4.mq4`
- `EAs/Slave/MT5/SentraPartners_Slave_MT5.mq5`

---

## 📖 Manuais Incluídos

Cada EA possui **3 manuais completos** na mesma pasta:

### 👨‍💻 Manual do Programador
- Arquitetura e estrutura do código
- Documentação técnica completa
- Fluxo de dados e comunicação com API

### 👤 Manual do Usuário
- Instalação passo a passo
- Configuração detalhada
- Solução de problemas e FAQ

### 🎯 Manual do Cliente
- Guia rápido de instalação (3 passos)
- Configuração simplificada
- Verificação básica

---

## 🚀 Como Usar

1. **Escolha o EA** que você precisa (Conector, Master ou Slave)
2. **Escolha a plataforma** (MT4 ou MT5)
3. **Baixe o arquivo** `.mq4` ou `.mq5`
4. **Consulte o manual** correspondente ao seu perfil

---

## 📊 Informações Técnicas

### Versões
- **Conectores:** v3.0
- **Master MT4:** v3.0
- **Master MT5:** v3.0
- **Slave MT4:** v3.0
- **Slave MT5:** v3.0

### Compatibilidade
- **MetaTrader 4:** Build 600+
- **MetaTrader 5:** Qualquer build recente

### Requisitos
- Conexão com internet
- Autorização de WebRequest para `https://sentrapartners.com`
- VPS recomendado para operação 24/7

---

## 🔐 Licenciamento

Todos os EAs possuem sistema de licenciamento integrado com:
- Verificação de data de expiração
- Controle de contas autorizadas (opcional)
- Bloqueio automático em caso de licença inválida

---

## 📞 Suporte

**Email:** suporte@sentrapartners.com  
**Plataforma:** https://sentrapartners.com  
**GitHub:** https://github.com/sentrapartners-ctrl/Sentra-Partenrs

---

## 📝 Notas da Versão 3.0

### Melhorias Gerais
- ✅ Código completamente refatorado e otimizado
- ✅ Sistema de heartbeat aprimorado
- ✅ Melhor tratamento de erros
- ✅ Logs mais detalhados e informativos
- ✅ Documentação completa em português

### Conectores
- ✅ Sincronização mais rápida e confiável
- ✅ Melhor tratamento de reconexão

### Master
- ✅ Envio de sinais em menos de 1 segundo
- ✅ Sistema de retentativas automáticas
- ✅ Suporte completo a contas Cent/Standard

### Slave
- ✅ Sincronização automática de posições
- ✅ Normalização inteligente de símbolos
- ✅ Gerenciamento de lote avançado
- ✅ Configurações remotas via servidor

---

**Última atualização:** 31 de Outubro de 2025  
**Desenvolvido por:** Sentra Partners
