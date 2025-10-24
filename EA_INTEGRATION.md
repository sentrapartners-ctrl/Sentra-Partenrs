# Integração EA com Sentra Partners

## Parâmetros do Heartbeat

Envie um POST para `/api/mt/heartbeat` com os seguintes parâmetros:

### Obrigatórios
- `user_email`: Email do usuário cadastrado no sistema
- `account_number`: Número da conta de trading
- `broker`: Nome da corretora
- `balance`: Saldo da conta
- `equity`: Equity da conta

### Opcionais mas Recomendados
- `account_type`: **"CENT"** ou **"STANDARD"** (importante para cálculo correto dos valores)
- `platform`: **"MT4"** ou **"MT5"** (se não enviar, detecta pelo nome do servidor)
- `server`: Nome do servidor (ex: "HFMarkets-MT4-Live", "Exness-MT5-Real")
- `currency`: Moeda da conta (padrão: "USD")
- `leverage`: Alavancagem (padrão: 100)
- `margin_free`: Margem livre
- `open_positions`: Número de posições abertas
- `timestamp`: Unix timestamp do heartbeat

## Exemplo de código MQL4/MQL5

```mql
string user_email = "seu@email.com";
string account_number = IntegerToString(AccountNumber());
string broker = AccountCompany();
string server = AccountServer();
double balance = AccountBalance();
double equity = AccountEquity();
double margin_free = AccountFreeMargin();
int open_positions = OrdersTotal();

// IMPORTANTE: Definir tipo de conta
string account_type = "CENT";  // ou "STANDARD"

// IMPORTANTE: Definir plataforma
string platform = "MT4";  // ou "MT5"

string params = 
    "user_email=" + user_email +
    "&account_number=" + account_number +
    "&broker=" + broker +
    "&server=" + server +
    "&balance=" + DoubleToString(balance, 2) +
    "&equity=" + DoubleToString(equity, 2) +
    "&margin_free=" + DoubleToString(margin_free, 2) +
    "&open_positions=" + IntegerToString(open_positions) +
    "&account_type=" + account_type +  // NOVO
    "&platform=" + platform +           // NOVO
    "&timestamp=" + IntegerToString(TimeCurrent());

// Enviar para https://sentrapartners.com/api/mt/heartbeat
```

## Detecção Automática

### Tipo de Conta (CENT vs STANDARD)
O sistema detecta automaticamente contas CENT se:
1. `account_type = "CENT"` (enviado pelo EA) **← RECOMENDADO**
2. Nome do servidor contém "cent" (ex: "HFMarkets-Cent-Live")
3. Balance > 20.000.000 cents (heurística)

**Recomendação:** Sempre envie `account_type` para garantir cálculo correto.

### Plataforma (MT4 vs MT5)
O sistema detecta automaticamente a plataforma se:
1. `platform = "MT4"` ou `"MT5"` (enviado pelo EA) **← RECOMENDADO**
2. Nome do servidor contém "mt4" ou "mt5"
3. Fallback: número de dígitos da conta (7 = MT4, 8+ = MT5)

**Recomendação:** Sempre envie `platform` para evitar detecção incorreta.

## Cálculo de Valores

### Contas STANDARD
- Valores no banco: **cents** (multiplicado por 100)
- Exibição: `valor_cents ÷ 100`
- Exemplo: 786.822 cents = $7.868,22

### Contas CENT
- Valores no banco: **cents de centavos** (multiplicado por 100)
- Exibição: `valor_cents ÷ 10.000`
- Exemplo: 3.368.526 cents = $336,85 (conta CENT)

## Troubleshooting

### Valores errados (muito altos)
- ✅ Verifique se está enviando `account_type = "CENT"` no heartbeat
- ✅ Verifique se o nome do servidor contém "cent"

### Plataforma errada (mostra MT5 mas é MT4)
- ✅ Envie `platform = "MT4"` explicitamente no heartbeat
- ✅ Verifique se o nome do servidor contém "mt4"

### Conta não aparece no sistema
- ✅ Verifique se o `user_email` está cadastrado no sistema
- ✅ Faça login em https://sentrapartners.com e crie uma conta primeiro
- ✅ Verifique os logs do EA para erros HTTP

## Suporte

Para dúvidas ou problemas, entre em contato através do sistema.

