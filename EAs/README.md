# 📦 Expert Advisors - Sentra Partners

Todos os Expert Advisors oficiais da plataforma Sentra Partners.

---

## 📁 Estrutura

```
EAs/
├── Conectores/          → Sincronização de contas MT4/MT5
├── CopyTrading/         → Sistema de cópia de trades (Master/Slave)
└── Manuais/             → Documentação completa em PDF
```

---

## 🔌 Conectores

Sincronize suas contas MT4/MT5 com a plataforma web.

**Arquivos:**
- `Conectores/SentraPartners_MT4.mq4`
- `Conectores/SentraPartners_MT5.mq5`

**Funcionalidades:**
- ✅ Sincronização em tempo real
- ✅ Suporte a CENT e STANDARD
- ✅ Histórico completo
- ✅ Multi-conta

**Documentação:** [Conectores/README.md](Conectores/README.md)

---

## 📊 Copy Trading

Sistema de cópia de trades entre contas.

**Master (Origem):**
- `CopyTrading/Master/SentraPartners_Master_MT4.mq4`
- `CopyTrading/Master/SentraPartners_Master_MT5.mq5`

**Slave (Destino):**
- `CopyTrading/Slave/SentraPartners_Slave_MT4.mq4`
- `CopyTrading/Slave/SentraPartners_Slave_MT5.mq5`

**Funcionalidades:**
- ✅ Cópia em tempo real
- ✅ Multiplicador de lote
- ✅ Filtros personalizáveis
- ✅ Múltiplos slaves

**Documentação:** [CopyTrading/README.md](CopyTrading/README.md)

---

## 📚 Manuais

Documentação completa em PDF:

- **MANUAL_USUARIO.pdf** (496 KB)
  - Instalação e configuração
  - Solução de problemas
  - Perguntas frequentes

- **MANUAL_PROGRAMADOR.pdf** (516 KB)
  - Documentação da API
  - Exemplos de código
  - Boas práticas

---

## 🌐 Downloads

### Conectores
- **MT4:** https://sentrapartners.com/SentraPartners_MT4.mq4
- **MT5:** https://sentrapartners.com/SentraPartners_MT5.mq5

### Copy Trading
Disponível na plataforma após cadastro.

---

## 🚀 Início Rápido

### 1. Conectores (Sincronização)

```bash
# 1. Baixe o EA
wget https://sentrapartners.com/SentraPartners_MT4.mq4

# 2. Copie para MetaTrader
# MT4: MQL4/Experts/
# MT5: MQL5/Experts/

# 3. Configure WebRequest
# Ferramentas > Opções > Expert Advisors
# Adicione: https://sentrapartners.com

# 4. Ative no gráfico
# Configure email e tipo de conta (CENT/STANDARD)
```

### 2. Copy Trading

```bash
# Conta Master (Origem)
1. Instale Master EA
2. Configure seu email
3. Ative

# Contas Slave (Destino)
1. Instale Slave EA
2. Configure email do Master
3. Configure multiplicador
4. Ative
```

---

## 📋 Versões

### v3.0 (Atual) - Outubro 2025
- ✅ Conectores com suporte CENT/STANDARD
- ✅ URL padrão configurada
- ✅ Manuais completos
- ✅ Copy Trading estável

### v2.1 - Setembro 2025
- Sistema multi-usuário
- Suporte a arrays de trades

### v2.0 - Agosto 2025
- Suporte a MT5
- Histórico de saldo

### v1.0 - Julho 2025
- Versão inicial
- Apenas MT4

---

## 🆘 Suporte

- 📧 **Email:** suporte@sentrapartners.com
- 🌐 **Site:** https://sentrapartners.com
- 💬 **Chat:** Disponível na plataforma
- 📚 **Docs:** Veja os manuais em PDF

---

## 📝 Licença

© 2025 Sentra Partners - Todos os direitos reservados

---

**Última atualização:** Outubro 2025
