# Sentra Partners - Expert Advisors (EAs) para Copy Trading

## 📋 Visão Geral

Este sistema permite copiar trades automaticamente de uma conta **Master** para múltiplas contas **Slave** usando Expert Advisors (EAs) para MT4/MT5.

## 📁 Arquivos

- `SentraPartners_Master.mq4` - EA para conta Master (MT4)
- `SentraPartners_Master.mq5` - EA para conta Master (MT5)
- `SentraPartners_Slave.mq4` - EA para contas Slave (MT4)
- `SentraPartners_Slave.mq5` - EA para contas Slave (MT5)

## 🚀 Como Usar

### 1. Configurar Conta Master

1. **Compilar o EA Master**
   - Abra o MetaEditor (F4 no MT4/MT5)
   - Abra o arquivo `SentraPartners_Master.mq4` (ou `.mq5` para MT5)
   - Clique em "Compilar" (F7)

2. **Obter Token da Conta**
   - Acesse o painel web: https://sentrapartners.com
   - Vá em **Settings** → **Copy Trading**
   - Copie o **Account Token** da conta que será Master

3. **Instalar o EA na Conta Master**
   - Arraste o EA `SentraPartners_Master` para o gráfico
   - Configure os parâmetros:
     - `ServerURL`: `https://sentrapartners.com/api/mt/copy-signal`
     - `AccountToken`: Cole o token copiado do painel web
     - `SendInterval`: `1` (recomendado)
     - `SendOnlyNewTrades`: `true`
     - `EnableLogging`: `true` (para debug)

4. **Permitir WebRequest**
   - Vá em **Ferramentas** → **Opções** → **Expert Advisors**
   - Marque **"Permitir WebRequest para URLs listadas"**
   - Adicione: `https://sentrapartners.com`
   - Clique em **OK**

### 2. Configurar Contas Slave

1. **Compilar o EA Slave**
   - Abra o MetaEditor (F4)
   - Abra o arquivo `SentraPartners_Slave.mq4` (ou `.mq5`)
   - Clique em "Compilar" (F7)

2. **Obter Token e Número da Conta Master**
   - Acesse o painel web
   - Vá em **Settings** → **Copy Trading**
   - Copie o **Account Token** da conta Slave
   - Anote o **Account Number** da conta Master

3. **Instalar o EA na Conta Slave**
   - Arraste o EA `SentraPartners_Slave` para o gráfico
   - Configure os parâmetros:
     - `ServerURL`: `https://sentrapartners.com/api/mt/get-signals`
     - `AccountToken`: Cole o token da conta Slave
     - `MasterAccountNumber`: Número da conta Master (ex: `12345678`)
     - `LotMultiplier`: `1.0` (ou ajuste conforme necessário)
     - `MaxSlippage`: `3`
     - `CheckInterval`: `1`
     - `EnableLogging`: `true`
     - `MagicNumber`: `77777`

4. **Permitir WebRequest**
   - Mesmos passos da conta Master
   - Adicione: `https://sentrapartners.com`

## ⚙️ Parâmetros

### EA Master

| Parâmetro | Descrição | Valor Padrão |
|-----------|-----------|--------------|
| `ServerURL` | URL do servidor para enviar sinais | `https://sentrapartners.com/api/mt/copy-signal` |
| `AccountToken` | Token de autenticação da conta | *(vazio - obrigatório)* |
| `SendInterval` | Intervalo de envio em segundos | `1` |
| `SendOnlyNewTrades` | Enviar apenas quando houver mudanças | `true` |
| `EnableLogging` | Habilitar logs detalhados | `true` |

### EA Slave

| Parâmetro | Descrição | Valor Padrão |
|-----------|-----------|--------------|
| `ServerURL` | URL do servidor para buscar sinais | `https://sentrapartners.com/api/mt/get-signals` |
| `AccountToken` | Token de autenticação da conta | *(vazio - obrigatório)* |
| `MasterAccountNumber` | Número da conta Master a copiar | `0` *(obrigatório)* |
| `LotMultiplier` | Multiplicador de lote (1.0 = mesmo tamanho) | `1.0` |
| `MaxSlippage` | Slippage máximo em pontos | `3` |
| `CheckInterval` | Intervalo de verificação em segundos | `1` |
| `EnableLogging` | Habilitar logs detalhados | `true` |
| `MagicNumber` | Magic number para identificar trades copiados | `77777` |

## 📊 Como Funciona

### Fluxo de Dados

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Master    │         │   Servidor   │         │    Slave    │
│   Account   │         │ sentrapartners│         │   Account   │
│             │         │    .com      │         │             │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                       │                        │
       │ 1. Envia trades       │                        │
       │   (POST /copy-signal) │                        │
       ├──────────────────────>│                        │
       │                       │                        │
       │                       │ 2. Busca sinais        │
       │                       │   (GET /get-signals)   │
       │                       │<───────────────────────┤
       │                       │                        │
       │                       │ 3. Retorna trades      │
       │                       ├───────────────────────>│
       │                       │                        │
       │                       │                        │ 4. Executa
       │                       │                        │    trades
       │                       │                        │
```

### Processo de Cópia

1. **Master EA** monitora trades abertos na conta Master
2. Quando há mudanças, envia informações para o servidor via POST
3. **Slave EA** verifica periodicamente se há novos sinais via GET
4. Ao receber sinais, o Slave EA:
   - Abre novos trades que não existem localmente
   - Atualiza SL/TP de trades existentes
   - Fecha trades que foram fechados no Master

## 🔍 Logs e Debug

### Verificar Logs

- Abra a aba **"Experts"** no Terminal (Ctrl+T)
- Procure por mensagens iniciadas com `[Sentra Partners]`

### Mensagens Comuns

**Master EA:**
```
Sentra Partners - Master EA Iniciado
Enviados 3 trades para o servidor
Resposta do servidor: {"success":true}
```

**Slave EA:**
```
Sentra Partners - Slave EA Iniciado
Novos sinais recebidos: {"trades":[...]}
Trade copiado com sucesso! Ticket: 12345 (Master: 67890)
```

### Erros Comuns

**Erro: URL não está na lista de permitidas**
- **Solução**: Adicione `https://sentrapartners.com` nas configurações de WebRequest

**Erro: Token da conta não configurado**
- **Solução**: Configure o parâmetro `AccountToken` com o token do painel web

**Erro: Account not found**
- **Solução**: Verifique se a conta está registrada no painel web e se o token está correto

## 📝 Notas Importantes

1. **Latência**: Há um pequeno atraso (1-2 segundos) entre a execução no Master e na Slave
2. **Slippage**: Preços podem variar ligeiramente entre contas
3. **Símbolos**: Os símbolos devem existir em ambas as contas (Master e Slave)
4. **Lotes**: Use `LotMultiplier` para ajustar o tamanho das posições nas contas Slave
5. **Magic Number**: Não altere o Magic Number após iniciar, pois é usado para identificar trades copiados

## 🛠️ Troubleshooting

### Trades não estão sendo copiados

1. Verifique se ambos os EAs estão ativos (ícone sorridente no canto superior direito)
2. Verifique os logs na aba "Experts"
3. Confirme que WebRequest está habilitado
4. Verifique se os tokens estão corretos
5. Confirme que o `MasterAccountNumber` está correto

### Trades sendo duplicados

- Verifique se há apenas um EA Slave ativo por conta
- Confirme que o `MagicNumber` é o mesmo em todas as contas Slave

### Performance

- Se houver muitos trades, aumente o `SendInterval` e `CheckInterval` para 2-3 segundos
- Desabilite `EnableLogging` após confirmar que está funcionando

## 📞 Suporte

Para suporte técnico, acesse: https://help.manus.im

---

**Sentra Partners** - Sistema de Copy Trading Profissional

