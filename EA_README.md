# 📡 Expert Advisors (EA) - Sentra Partners

Conectores oficiais para integração MT4/MT5 com a plataforma Sentra Partners.

## 📦 Arquivos Disponíveis

- `EA_MT4_SentraPartners.mq4` - Expert Advisor para MetaTrader 4
- `EA_MT5_SentraPartners.mq5` - Expert Advisor para MetaTrader 5
- `EA_INTEGRATION.md` - Documentação técnica completa

## 🚀 Instalação Rápida

### MT4

1. Abra o MetaTrader 4
2. Vá em **Arquivo → Abrir Pasta de Dados**
3. Entre na pasta **MQL4 → Experts**
4. Copie o arquivo `EA_MT4_SentraPartners.mq4` para esta pasta
5. Volte ao MT4 e clique em **Atualizar** no Navegador
6. Arraste o EA para o gráfico

### MT5

1. Abra o MetaTrader 5
2. Vá em **Arquivo → Abrir Pasta de Dados**
3. Entre na pasta **MQL5 → Experts**
4. Copie o arquivo `EA_MT5_SentraPartners.mq5` para esta pasta
5. Volte ao MT5 e clique em **Atualizar** no Navegador
6. Arraste o EA para o gráfico

## ⚙️ Configuração

Ao adicionar o EA ao gráfico, configure os seguintes parâmetros:

### Parâmetros Obrigatórios

| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| **UserEmail** | Email cadastrado no Sentra Partners | `seu@email.com` |
| **AccountType** | Tipo de conta | `CENT` ou `STANDARD` |

### Parâmetros Opcionais

| Parâmetro | Descrição | Padrão |
|-----------|-----------|--------|
| **HeartbeatInterval** | Intervalo de envio em segundos | `60` |
| **SendTrades** | Enviar trades para o sistema | `true` |
| **DebugMode** | Ativar logs detalhados | `false` |

## 🔧 Como Saber o Tipo de Conta

### Conta CENT
- Valores aparecem 100x maiores no terminal
- Nome do servidor geralmente contém "cent"
- Exemplo: $100 real = 10.000 no terminal

### Conta STANDARD
- Valores aparecem normalmente no terminal
- Exemplo: $100 real = 100 no terminal

**Dica:** Se não tiver certeza, pergunte ao suporte da sua corretora.

## ✅ Configuração de URLs Permitidas

**IMPORTANTE:** Antes de usar o EA, você precisa adicionar a URL da API nas URLs permitidas:

### MT4
1. **Ferramentas → Opções → Expert Advisors**
2. Marque **"Permitir WebRequest para as seguintes URLs"**
3. Adicione: `https://sentrapartners.com`
4. Clique em **OK**

### MT5
1. **Ferramentas → Opções → Expert Advisors**
2. Marque **"Permitir WebRequest para as seguintes URLs"**
3. Adicione: `https://sentrapartners.com`
4. Clique em **OK**

## 📊 O que o EA Envia

### Heartbeat (a cada 60 segundos)
- Saldo da conta
- Equity
- Margem livre
- Número de posições abertas
- Alavancagem
- Informações do broker

### Trades (em tempo real)
- Símbolo
- Tipo (BUY/SELL)
- Volume
- Preço de abertura
- Stop Loss / Take Profit
- Lucro/Prejuízo
- Comissão e Swap
- Status (aberto/fechado)

## 🔍 Verificação de Funcionamento

### Logs no Terminal

Após adicionar o EA, você deve ver:

```
========================================
Sentra Partners EA - MT4 Connector v2.0
========================================
Email: seu@email.com
Conta: 78065775
Tipo: CENT
Broker: HF Markets (SV) Ltd.
Servidor: HFMarkets-MT4-Live
========================================
✅ Heartbeat enviado: Balance=336.85 Equity=336.21
```

### No Site Sentra Partners

1. Acesse https://sentrapartners.com
2. Faça login
3. Vá em **Contas**
4. Sua conta deve aparecer com status **"Conectado"** (verde)

## ❌ Solução de Problemas

### Erro: "ERRO: Configure o parâmetro UserEmail"
**Solução:** Altere o parâmetro `UserEmail` para o email que você usou para se cadastrar no site.

### Erro: "ERRO: Adicione ... nas URLs permitidas"
**Solução:** Siga as instruções em "Configuração de URLs Permitidas" acima.

### Erro: "User not found. Please register first"
**Solução:** Você precisa criar uma conta em https://sentrapartners.com primeiro.

### Conta não aparece no site
**Soluções:**
1. Verifique se o email está correto
2. Verifique os logs do EA no terminal
3. Aguarde 60 segundos (intervalo do heartbeat)
4. Recarregue a página do site

### Valores errados (muito altos ou baixos)
**Solução:** Verifique se configurou corretamente o parâmetro `AccountType`:
- Conta CENT → `AccountType = "CENT"`
- Conta STANDARD → `AccountType = "STANDARD"`

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs no terminal do MT4/MT5
2. Acesse https://sentrapartners.com e verifique o status da conta
3. Entre em contato através do sistema

## 📄 Licença

© 2025 Sentra Partners. Todos os direitos reservados.

---

**Versão:** 2.0  
**Última atualização:** 24/10/2025

