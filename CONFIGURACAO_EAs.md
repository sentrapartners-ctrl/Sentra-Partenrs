# Configuração dos EAs - Sentra Partners v3.0

## 📋 Intervalos de Envio de Dados

### ⏱️ Heartbeat (Posições Abertas)
- **Intervalo padrão**: 3 horas (10800 segundos)
- **O que envia**: Posições abertas, dados da conta (balance, equity, margin, etc)
- **Endpoint**: `/heartbeat`
- **Parâmetro**: `HeartbeatInterval`

### 📊 Profit Update (Atualização de Lucro)
- **Intervalo padrão**: 2 horas (7200 segundos)
- **O que envia**: Balance, Equity, Profit, Margin Free
- **Endpoint**: `/profit`
- **Parâmetro**: `ProfitUpdateInterval`

### 📈 Trade History (Histórico de Trades)
- **Horários padrão**: 03:00, 12:00, 21:00
- **O que envia**: Histórico completo de trades fechados
- **Endpoint**: `/trades`
- **Parâmetro**: `HistorySendTimes` (formato: "HH:MM,HH:MM,HH:MM")
- **Proteção**: Não envia se já enviou nos últimos 30 minutos

## 🎯 Resumo da Frequência

| Tipo de Envio | Frequência | Dados Enviados |
|---------------|------------|----------------|
| Heartbeat | A cada 3h | Posições abertas + status da conta |
| Profit Update | A cada 2h | Balance, Equity, Profit, Margin |
| Trade History | 3x ao dia (03h, 12h, 21h) | Histórico completo de trades |

## ⚙️ Como Personalizar

### Exemplo 1: Heartbeat a cada 1 hora
```
HeartbeatInterval = 3600  // 1 hora em segundos
```

### Exemplo 2: Profit Update a cada 30 minutos
```
ProfitUpdateInterval = 1800  // 30 minutos em segundos
```

### Exemplo 3: Histórico 5x ao dia
```
HistorySendTimes = "00:00,06:00,12:00,18:00,23:00"
```

## 📝 Parâmetros Completos

```mql4
input string UserEmail = "";                            // ⚠️ SEU EMAIL CADASTRADO NO SISTEMA
input string AccountType = "STANDARD";                  // Tipo de Conta: CENT ou STANDARD
input string MasterServer = "https://sentrapartners.com/api/mt";
input int HeartbeatInterval = 10800;                    // Segundos entre heartbeats (padrão: 3h)
input int ProfitUpdateInterval = 7200;                  // Atualização de lucro (segundos) - Padrão: 2h
input string HistorySendTimes = "03:00,12:00,21:00";    // Horários para enviar histórico (HH:MM)
input int HistoryDays = 90;                             // Dias de histórico (0 = todo histórico)
input bool EnableLogs = true;                           // Habilitar logs detalhados
```

## 🔍 Logs de Inicialização

Ao iniciar o EA, você verá:

```
===========================================
Sentra Partners - Conector MT4 v3.0
Sistema Multi-Usuário
===========================================
User Email: seu@email.com
Tipo de Conta: STANDARD
Servidor: https://sentrapartners.com/api/mt
Heartbeat: 3h (posições abertas)
Profit Update: 2h
Histórico: 03:00,12:00,21:00 (90 dias)
===========================================
```

## 🚀 Endpoints da API

### POST /api/mt/heartbeat
Recebe dados de heartbeat (posições abertas)

### POST /api/mt/profit
Recebe atualizações de lucro

### POST /api/mt/trades
Recebe histórico de trades

## 📌 Notas Importantes

1. **Proteção contra duplicação**: O histórico não é reenviado se já foi enviado nos últimos 30 minutos
2. **Envio em lotes**: Trades são enviados em lotes de 100 para evitar timeout
3. **Validações**: Email e tipo de conta são validados na inicialização
4. **URLs permitidas**: Lembre-se de adicionar a URL da API nas configurações do MT4/MT5

## 🔧 Troubleshooting

### Erro 4060 (WebRequest não permitido)
1. Vá em **Ferramentas > Opções > Expert Advisors**
2. Marque **Permitir WebRequest para as seguintes URLs**
3. Adicione: `https://sentrapartners.com`

### Logs não aparecem
Certifique-se de que `EnableLogs = true` nos parâmetros do EA
