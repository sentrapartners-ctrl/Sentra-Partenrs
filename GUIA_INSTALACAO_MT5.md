# 📘 Guia de Instalação - Expert Advisor MT5
## Sentra Partners - Sistema Multi-Usuário

---

## 🎯 Visão Geral

Este Expert Advisor (EA) sincroniza automaticamente sua conta MT5 com o sistema Sentra Partners SaaS. **Cada usuário vê apenas suas próprias contas**, garantindo total privacidade e isolamento de dados.

---

## 📋 Pré-requisitos

1. ✅ Conta criada no sistema Sentra Partners
2. ✅ Email cadastrado e confirmado
3. ✅ MetaTrader 5 instalado
4. ✅ Conexão com internet ativa

---

## 🔧 Instalação Passo a Passo

### **Passo 1: Download do Expert Advisor**

1. Baixe o arquivo `SentraPartners_MT5.mq5`
2. Salve em um local temporário (Desktop, Downloads, etc)

### **Passo 2: Copiar para o MetaTrader 5**

1. Abra o MetaTrader 5
2. Clique em **Arquivo → Abrir Pasta de Dados**
3. Navegue até a pasta: `MQL5 → Experts`
4. Cole o arquivo `SentraPartners_MT5.mq5` nesta pasta

### **Passo 3: Compilar o Expert Advisor**

1. No MT5, abra o **MetaEditor** (pressione F4 ou clique no ícone)
2. No MetaEditor, localize o arquivo `SentraPartners_MT5.mq5` na árvore de navegação
3. Clique duas vezes para abrir
4. Clique em **Compilar** (F7) ou no botão de compilação
5. Verifique se aparece "0 error(s), 0 warning(s)" na aba de resultados
6. Feche o MetaEditor

### **Passo 4: Configurar URLs Permitidas**

⚠️ **IMPORTANTE:** Sem este passo, o EA não funcionará!

1. No MT5, vá em **Ferramentas → Opções**
2. Clique na aba **Expert Advisors**
3. Marque a opção **"Permitir WebRequest para as seguintes URLs"**
4. Adicione a URL (clique em "Adicionar"):
   ```
   https://3005-ifwc82p1opsn7k50rvu6f-137bd2b3.manusvm.computer
   ```
5. Clique em **OK**

### **Passo 5: Adicionar o EA ao Gráfico**

1. No MT5, abra qualquer gráfico (ex: EURUSD)
2. No **Navegador** (Ctrl+N), expanda **Expert Advisors**
3. Localize **SentraPartners_MT5**
4. Arraste e solte no gráfico

### **Passo 6: Configurar Parâmetros**

Uma janela de configuração aparecerá. Configure:

#### **Parâmetros Obrigatórios:**

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| **UserEmail** | `seu@email.com` | ⚠️ **SEU EMAIL CADASTRADO NO SISTEMA** |
| **ApiUrl** | `https://3005-ifwc82p1opsn7k50rvu6f-137bd2b3.manusvm.computer/api/mt` | URL da API (já preenchida) |

#### **Parâmetros Opcionais:**

| Parâmetro | Valor Padrão | Descrição |
|-----------|--------------|-----------|
| **HeartbeatInterval** | 30 | Intervalo de sincronização (segundos) |
| **SendTrades** | true | Enviar histórico de trades |
| **SendBalance** | true | Enviar histórico de saldo |
| **EnableLogs** | true | Habilitar logs detalhados |

#### **Configurações Importantes:**

1. Na aba **Comum**, marque:
   - ✅ **Permitir trading automático**
   - ✅ **Permitir importação de DLL**
   - ✅ **Permitir WebRequest**

2. Clique em **OK**

---

## ✅ Verificação de Funcionamento

### **No MetaTrader 5:**

1. Abra a aba **Expert** (Ctrl+T para abrir Terminal)
2. Você deve ver mensagens como:
   ```
   =================================================
   Sentra Partners MT5 EA v2.0 - Multi-User
   =================================================
   User Email: seu@email.com
   API URL: https://3005-ifwc82p1opsn7k50rvu6f-137bd2b3.manusvm.computer/api/mt
   Heartbeat Interval: 30 seconds
   =================================================
   ✓ Heartbeat enviado com sucesso
   ✓ 150 trades sincronizados com sucesso
   ✓ Balanço sincronizado: $10000.00
   EA inicializado com sucesso!
   ```

3. No canto superior direito do gráfico, você verá um **emoji sorridente** 😊
   - 😊 = EA funcionando corretamente
   - 😞 = EA com erro

### **No Sistema Sentra Partners:**

1. Acesse: https://3005-ifwc82p1opsn7k50rvu6f-137bd2b3.manusvm.computer
2. Faça login com seu email
3. No **Dashboard**, sua conta deve aparecer em até 30 segundos
4. Você verá:
   - ✅ Nome da conta
   - ✅ Broker
   - ✅ Saldo atual
   - ✅ Equity
   - ✅ Posições abertas
   - ✅ Histórico de trades

---

## 🔐 Segurança e Privacidade

### **Isolamento Multi-Usuário:**

- ✅ Cada usuário vê **APENAS** suas próprias contas
- ✅ Não há acesso cruzado entre usuários
- ✅ Dados completamente isolados por email

### **O que o EA envia:**

- ✅ Informações da conta (número, broker, servidor)
- ✅ Saldo e equity
- ✅ Histórico de trades (últimos 90 dias)
- ✅ Posições abertas

### **O que o EA NÃO envia:**

- ❌ Senha da conta MT5
- ❌ Dados pessoais além do email
- ❌ Informações de cartão de crédito
- ❌ Qualquer dado sensível

---

## 🐛 Solução de Problemas

### **Erro: "Configure seu email no parâmetro UserEmail"**

**Solução:** Você não configurou o email. Clique com botão direito no EA no gráfico → Propriedades → Configure o UserEmail.

---

### **Erro: "WebRequest não permitido"**

**Solução:** 
1. Vá em Ferramentas → Opções → Expert Advisors
2. Adicione a URL na lista de URLs permitidas
3. Reinicie o EA

---

### **EA não aparece no gráfico**

**Solução:**
1. Verifique se compilou sem erros
2. Verifique se marcou "Permitir trading automático" nas configurações
3. Reinicie o MT5

---

### **Conta não aparece no sistema**

**Solução:**
1. Verifique se o email está correto (mesmo email cadastrado no sistema)
2. Verifique os logs do EA na aba Expert
3. Aguarde até 30 segundos para sincronização
4. Recarregue a página do navegador

---

### **Erro: "Código: -1"**

**Solução:** URL não está na lista de URLs permitidas. Siga o Passo 4 novamente.

---

## 📊 Múltiplas Contas

Você pode conectar **várias contas MT5** ao mesmo email:

1. Instale o EA em cada conta MT5
2. Use o **mesmo email** em todas
3. Todas as contas aparecerão no seu dashboard
4. Cada conta terá seus próprios dados isolados

---

## 🔄 Atualização do EA

Quando houver uma nova versão:

1. Remova o EA antigo do gráfico
2. Substitua o arquivo `.mq5` na pasta Experts
3. Recompile no MetaEditor
4. Adicione novamente ao gráfico

---

## 📞 Suporte

**Problemas ou dúvidas?**

- 📧 Email: sentrapartners@gmail.com
- 🌐 Sistema: https://3005-ifwc82p1opsn7k50rvu6f-137bd2b3.manusvm.computer

---

## 📝 Notas Importantes

1. ⚠️ O EA **NÃO** faz trading automático - apenas sincroniza dados
2. ⚠️ Mantenha o MT5 aberto para sincronização contínua
3. ⚠️ Use o **mesmo email** cadastrado no sistema
4. ✅ Dados são sincronizados a cada 30 segundos (heartbeat)
5. ✅ Trades são sincronizados a cada 5 minutos
6. ✅ Balanço é sincronizado a cada 10 minutos

---

## 🎉 Pronto!

Seu Expert Advisor está configurado e sincronizando com o Sentra Partners! 

Acesse o dashboard para visualizar todas as suas contas e análises em tempo real.

**Bons trades! 📈**

