# Guia de Instalação dos Conectores MT4/MT5

## 📋 Visão Geral

Os conectores UnifiedAPI permitem que suas contas MetaTrader 4 e MetaTrader 5 enviem dados em tempo real para o sistema Sentra Partners. Eles monitoram automaticamente:

- ✅ Saldo e equity da conta
- ✅ Posições abertas
- ✅ Histórico de trades
- ✅ Status de conexão (heartbeat)

## 🔧 Instalação

### Para MetaTrader 4

1. **Abra o MetaEditor** no MT4 (pressione F4 ou vá em Ferramentas → MetaQuotes Language Editor)

2. **Copie o arquivo** `UnifiedAPI_MT4.mq4` para a pasta de Expert Advisors:
   - Clique em "Arquivo" → "Abrir Pasta de Dados"
   - Navegue até `MQL4/Experts/`
   - Cole o arquivo `UnifiedAPI_MT4.mq4`

3. **Compile o Expert Advisor**:
   - No MetaEditor, abra o arquivo `UnifiedAPI_MT4.mq4`
   - Clique em "Compilar" (F7)
   - Verifique se não há erros

4. **Configure o EA no gráfico**:
   - Volte ao MT4
   - Abra qualquer gráfico (par de moedas)
   - No Navegador, vá em "Expert Advisors"
   - Arraste `UnifiedAPI_MT4` para o gráfico

5. **Configure os parâmetros**:
   - Na janela de configuração que abrir, configure:
     - **MasterServer**: `https://3000-ifwc82p1opsn7k50rvu6f-137bd2b3.manusvm.computer/api/mt`
     - **TerminalID**: Um ID único para esta conta (ex: `MT4_CONTA_01`, `MT4_LIVE_XM`, etc)
     - **HeartbeatInterval**: 60 (segundos entre atualizações)
   
6. **Ative o AutoTrading**:
   - Clique no botão "AutoTrading" no topo do MT4
   - Verifique se há um smile verde no canto superior direito do gráfico

### Para MetaTrader 5

1. **Abra o MetaEditor** no MT5 (pressione F4 ou vá em Ferramentas → MetaQuotes Language Editor)

2. **Copie o arquivo** `UnifiedAPI_MT5.mq5` para a pasta de Expert Advisors:
   - Clique em "Arquivo" → "Abrir Pasta de Dados"
   - Navegue até `MQL5/Experts/`
   - Cole o arquivo `UnifiedAPI_MT5.mq5`

3. **Compile o Expert Advisor**:
   - No MetaEditor, abra o arquivo `UnifiedAPI_MT5.mq5`
   - Clique em "Compilar" (F7)
   - Verifique se não há erros

4. **Configure o EA no gráfico**:
   - Volte ao MT5
   - Abra qualquer gráfico (par de moedas)
   - No Navegador, vá em "Expert Advisors"
   - Arraste `UnifiedAPI_MT5` para o gráfico

5. **Configure os parâmetros**:
   - Na janela de configuração que abrir, configure:
     - **MasterServer**: `https://3000-ifwc82p1opsn7k50rvu6f-137bd2b3.manusvm.computer/api/mt`
     - **TerminalID**: Um ID único para esta conta (ex: `MT5_CONTA_01`, `MT5_LIVE_EXNESS`, etc)
     - **HeartbeatInterval**: 60 (segundos entre atualizações)

6. **Ative o Algo Trading**:
   - Clique no botão "Algo Trading" no topo do MT5
   - Verifique se há um smile verde no canto superior direito do gráfico

## ⚙️ Configurações Importantes

### TerminalID

O **TerminalID** é crucial para identificar cada conta no sistema. Use nomes descritivos:

- ✅ Bom: `MT4_LIVE_XM_001`, `MT5_DEMO_EXNESS`, `MT4_PROP_FTMO`
- ❌ Ruim: `conta1`, `teste`, `mt4`

**Importante**: Cada conta deve ter um TerminalID único!

### URL do Servidor

A URL já está pré-configurada nos arquivos:
```
https://3000-ifwc82p1opsn7k50rvu6f-137bd2b3.manusvm.computer/api/mt
```

**Nota**: Se você fizer deploy do sistema em produção, atualize esta URL para o domínio final.

### Intervalo de Heartbeat

- **Padrão**: 60 segundos
- **Mínimo recomendado**: 30 segundos
- **Máximo recomendado**: 300 segundos (5 minutos)

Intervalos muito curtos podem sobrecarregar o servidor e a conexão.

## 🔍 Verificação

### Como saber se está funcionando?

1. **No MetaTrader**:
   - Abra a aba "Expert" no Terminal (Ctrl+T)
   - Você verá mensagens como:
     ```
     ===== API UNIFICADA - MT4 INICIADA =====
     Terminal ID: MT4_CONTA_01
     Servidor: https://...
     ✓ Enviado para: /heartbeat
     ✓ Enviado para: /history
     ```

2. **No Sistema Sentra Partners**:
   - Acesse o dashboard
   - Vá em "Contas"
   - Sua conta deve aparecer com status "Conectado" (ponto verde)
   - Os dados de saldo, equity e posições devem estar visíveis

## 🚨 Solução de Problemas

### EA não envia dados

1. **Verifique se o AutoTrading/Algo Trading está ativado**
2. **Verifique a aba Expert no Terminal** - procure por mensagens de erro
3. **Certifique-se de que a URL está correta**
4. **Verifique se o firewall não está bloqueando** a conexão

### Erro "URL not allowed"

No MetaTrader, você precisa permitir URLs externas:

1. Vá em "Ferramentas" → "Opções"
2. Aba "Expert Advisors"
3. Marque "Permitir WebRequest para as seguintes URLs"
4. Adicione: `https://3000-ifwc82p1opsn7k50rvu6f-137bd2b3.manusvm.computer`

### Conta não aparece no sistema

1. **Aguarde 1-2 minutos** após ativar o EA
2. **Verifique o TerminalID** - deve ser único
3. **Recarregue a página** do sistema
4. **Verifique os logs** na aba Expert do MT4/MT5

## 📊 Dados Enviados

O conector envia automaticamente:

### Heartbeat (a cada intervalo configurado)
- Número da conta
- Broker
- Saldo
- Equity
- Margem livre
- Número de posições abertas

### Posições Abertas (quando há mudanças)
- Ticket
- Símbolo
- Tipo (BUY/SELL)
- Volume
- Preço de abertura
- Preço atual
- Lucro/prejuízo

### Histórico (últimos 50 trades)
- Todos os dados das posições
- Horários de abertura e fechamento
- Resultado final

## 🔒 Segurança

- ✅ Os conectores **não executam trades** - apenas monitoram
- ✅ Dados são enviados via **HTTPS** (criptografado)
- ✅ **Nenhuma senha** é enviada ao servidor
- ✅ Apenas **dados de leitura** são coletados

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs na aba "Expert" do MetaTrader
2. Verifique se a conta aparece na página "Contas" do sistema
3. Entre em contato com o suporte técnico

---

**Versão**: 1.0.0  
**Última atualização**: 2025-01-23

