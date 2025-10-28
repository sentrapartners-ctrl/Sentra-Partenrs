# 📘 Guia de Instalação - Sentra MT4 Connector

## 🎯 **O que é?**

O **Sentra MT4 Connector** sincroniza automaticamente todos os seus trades do MT4 com a plataforma Sentra Partners.

**Funcionalidades:**
- ✅ Sincroniza histórico completo na primeira execução
- ✅ Monitora e envia novos trades automaticamente
- ✅ Funciona 24/7 em segundo plano
- ✅ Configuração super simples (só email e tipo de conta)

---

## 🚀 **Instalação**

### **Passo 1: Copiar o EA para o MT4**

1. Abra o MT4
2. Menu: **Arquivo → Abrir Pasta de Dados**
3. Navegue até: **MQL4 → Experts**
4. Cole o arquivo: `Sentra_MT4_Connector.mq4`
5. Volte ao MT4 e abra o **MetaEditor** (F4)
6. No MetaEditor, clique em **Compilar** (F7)
7. Feche o MetaEditor

---

### **Passo 2: Habilitar WebRequest (IMPORTANTE!)**

Para o EA enviar dados para o Sentra Partners, você precisa permitir conexões externas:

1. Menu: **Ferramentas → Opções**
2. Aba: **Expert Advisors**
3. Marque: ☑️ **Allow WebRequest for listed URL:**
4. Adicione a URL: `https://sentrapartners.com`
5. Clique em **OK**

---

### **Passo 3: Configurar o EA**

1. No MT4, abra qualquer gráfico (ex: EURUSD)
2. No **Navegador** (Ctrl+N), expanda: **Expert Advisors**
3. Arraste **Sentra_MT4_Connector** para o gráfico
4. Uma janela de configuração abrirá

**Configure apenas 2 campos:**

```
=== Configurações da Conta ===
UserEmail = "seu@email.com"          // Seu email cadastrado no Sentra Partners
AccountType = "Real"                  // "Real" ou "Demo"

=== Configurações Avançadas ===
CheckInterval = 10                    // Verificar novas ordens a cada 10 segundos
ShowDebugLogs = true                  // Mostrar logs detalhados
```

5. Clique em **OK**

---

## ✅ **Verificar se está funcionando**

### **Logs do EA**

Abra a aba **Experts** no MT4 (parte inferior) e você verá:

```
╔══════════════════════════════════════════════════════════════╗
║         Sentra Partners - MT4 Connector v1.0                ║
║         Conectando sua conta ao Sentra Partners...           ║
╚══════════════════════════════════════════════════════════════╝

>>> Email: seu@email.com
>>> Tipo de Conta: Real
>>> Número da Conta MT4: 12345678

>>> Autenticando com Sentra Partners...
>>> ✅ Autenticação bem-sucedida!

>>> PRIMEIRA EXECUÇÃO DETECTADA
>>> Sincronizando histórico completo...

>>> Total de ordens no histórico: 150
>>> Progresso: 10/150 trades exportados...
>>> Progresso: 20/150 trades exportados...
...
>>> ✅ Exportação concluída: 150 trades enviados

>>> ✅ SINCRONIZAÇÃO INICIAL CONCLUÍDA
>>> Total de trades exportados: 150

>>> ✅ Monitoramento em tempo real ATIVADO
>>> Verificando novas ordens a cada 10 segundos

>>> 🚀 EA PRONTO E OPERACIONAL!
```

### **No Dashboard Sentra Partners**

1. Acesse: https://sentrapartners.com
2. Faça login
3. Vá em **Contas** ou **Histórico de Trades**
4. Você verá todos os seus trades sincronizados!

---

## 🔧 **Solução de Problemas**

### **Erro: "Email não configurado"**
- Configure o campo `UserEmail` com seu email cadastrado no Sentra Partners

### **Erro: "Falha na autenticação"**
- Verifique se o email está correto
- Certifique-se de que você tem uma conta no Sentra Partners
- Verifique se adicionou `https://sentrapartners.com` nas URLs permitidas

### **Erro: "Código 4060"**
- Você esqueceu de habilitar WebRequest
- Siga o **Passo 2** novamente

### **EA não envia trades novos**
- Verifique se o EA está ativo (ícone de smile no canto superior direito do gráfico)
- Verifique os logs na aba **Experts**
- Certifique-se de que `EnableRealTimeMonitoring = true`

---

## 📊 **Como Funciona**

### **Primeira Execução:**
1. EA autentica com Sentra Partners usando seu email
2. Recebe API Key automaticamente
3. Lê todo o histórico de trades do MT4
4. Envia todos os trades para o servidor
5. Marca como "sincronizado"

### **Execuções Seguintes:**
1. EA carrega estado anterior
2. Monitora novas ordens fechadas a cada 10 segundos
3. Quando detecta nova ordem, envia automaticamente
4. Mantém estado atualizado

### **Dados Enviados:**
- Ticket, Symbol, Type (Buy/Sell)
- Lots, Open Price, Open Time
- Close Price, Close Time
- Stop Loss, Take Profit
- Profit, Commission, Swap
- Comment, Magic Number
- Account Number

---

## 🎯 **Dicas**

1. **Deixe o EA rodando 24/7** para sincronização contínua
2. **Use VPS** se quiser garantir que nunca perca um trade
3. **Verifique os logs** regularmente para garantir que está funcionando
4. **Não remova o EA** do gráfico, ele precisa estar ativo

---

## 🆘 **Suporte**

Problemas? Entre em contato:
- **Email**: suporte@sentrapartners.com
- **Dashboard**: https://sentrapartners.com/support

---

**🎉 Pronto! Seus trades agora são sincronizados automaticamente com o Sentra Partners!**

