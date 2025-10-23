# Configuração de Alertas via Telegram

Este sistema suporta envio de alertas e notificações via Telegram Bot.

## Passo 1: Criar um Bot no Telegram

1. Abra o Telegram e procure por **@BotFather**
2. Envie o comando `/newbot`
3. Escolha um nome para o bot (ex: "Sentra Trading Alerts")
4. Escolha um username único (ex: "sentra_trading_bot")
5. O BotFather irá retornar um **token** no formato: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
6. **Guarde este token com segurança!**

## Passo 2: Configurar o Token no Sistema

Adicione o token nas variáveis de ambiente do projeto:

```bash
TELEGRAM_BOT_TOKEN=seu_token_aqui
```

## Passo 3: Obter seu Chat ID

1. Inicie uma conversa com o bot que você criou
2. Envie qualquer mensagem (ex: `/start`)
3. Acesse a URL (substitua `<TOKEN>` pelo token do seu bot):
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
4. Procure pelo campo `"chat":{"id":123456789}` na resposta JSON
5. Copie o número do `id` - este é o seu **Chat ID**

## Passo 4: Configurar Chat ID no Sistema

1. Faça login no sistema Sentra Partners
2. Vá em **Configurações**
3. Na seção "Notificações Telegram":
   - Cole o Chat ID obtido
   - Marque "Ativar notificações via Telegram"
4. Clique em "Salvar Alterações"

## Tipos de Alertas Disponíveis

O sistema enviará notificações via Telegram para os seguintes eventos:

### 🚨 Alerta de Drawdown
Enviado quando o drawdown da conta ultrapassa o limite configurado.

### ⚠️ Alerta de Conexão
Enviado quando a conexão com o terminal MT4/MT5 é perdida.

### ✅ Trade Fechado
Notificação sempre que um trade é fechado (com lucro ou prejuízo).

### 📊 Resumo Diário
Resumo automático enviado ao final de cada dia de trading com:
- Total de trades
- Trades ganhos vs perdidos
- Win rate
- Lucro/prejuízo do dia
- Balanço atual

## Testando a Integração

Após configurar, você pode testar enviando um alerta de teste através da página de Configurações.

## Comandos do Bot (Opcional)

Você pode configurar comandos personalizados no @BotFather:

```
/start - Iniciar bot
/status - Ver status das contas
/balance - Ver balanço atual
/trades - Ver trades recentes
/help - Ajuda
```

## Solução de Problemas

### Não estou recebendo mensagens

1. Verifique se o token está correto
2. Confirme que você iniciou uma conversa com o bot
3. Verifique se o Chat ID está correto
4. Certifique-se de que "Ativar notificações" está marcado

### Erro "Unauthorized"

O token do bot está incorreto. Verifique com o @BotFather.

### Erro "Chat not found"

O Chat ID está incorreto ou você não iniciou conversa com o bot.

## Segurança

- **NUNCA** compartilhe o token do bot
- **NUNCA** commite o token no código
- Use variáveis de ambiente para armazenar credenciais
- O Chat ID é único para cada usuário e não deve ser compartilhado

## Exemplo de Mensagens

### Alerta de Drawdown
```
🚨 ALERTA DE DRAWDOWN

Conta: 163032743
Drawdown Atual: 15.50%
Limite Configurado: 10.00%

⚠️ O drawdown ultrapassou o limite configurado!
```

### Trade Fechado
```
✅ TRADE FECHADO

Conta: 163032743
Par: USDJPYc
Tipo: SELL
Resultado: $8.96
```

### Resumo Diário
```
📊 RESUMO DIÁRIO

Conta: 163032743

Trades: 15
✅ Ganhos: 10
❌ Perdas: 5
📈 Win Rate: 66.7%

💰 Lucro do Dia: $294.29
💵 Balanço Atual: $2,955.15
```

