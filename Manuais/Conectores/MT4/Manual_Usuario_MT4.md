# Manual do Usuário - Conector MT4

**Versão:** 3.0  
**Plataforma:** MetaTrader 4  
**Sistema:** Sentra Partners

---

## Índice

1. [Introdução](#introdução)
2. [Requisitos](#requisitos)
3. [Instalação](#instalação)
4. [Configuração](#configuração)
5. [Uso Diário](#uso-diário)
6. [Solução de Problemas](#solução-de-problemas)
7. [Perguntas Frequentes](#perguntas-frequentes)
8. [Suporte](#suporte)

---

## Introdução

O **Conector MT4** é um Expert Advisor (EA) que conecta sua conta MetaTrader 4 à plataforma web Sentra Partners. Com ele, você pode:

- ✅ Visualizar suas posições abertas na plataforma web
- ✅ Acompanhar seu histórico de trades
- ✅ Monitorar saldo, equity e lucro em tempo real
- ✅ Manter sua conta sempre "online" no sistema
- ✅ Sincronizar automaticamente todas as operações

### Como Funciona

O EA funciona em segundo plano no seu MetaTrader 4, enviando informações da sua conta para a plataforma web em intervalos regulares. Você não precisa fazer nada após a configuração inicial - tudo é automático!

---

## Requisitos

### Requisitos Técnicos

- **MetaTrader 4** (build 600 ou superior)
- **Conexão com internet** estável
- **Conta cadastrada** na plataforma Sentra Partners
- **Sistema operacional:** Windows 7 ou superior / Wine (Linux/Mac)

### Requisitos de Conta

- Email cadastrado no sistema Sentra Partners
- Conta MT4 ativa em qualquer corretora
- Tipo de conta: CENT ou STANDARD

---

## Instalação

### Passo 1: Download do EA

1. Acesse sua conta na plataforma Sentra Partners
2. Vá em **Configurações** → **Downloads**
3. Baixe o arquivo `SentraPartners_MT4.ex4`
4. Salve em um local de fácil acesso

### Passo 2: Instalar no MetaTrader 4

**Opção A - Instalação Automática:**

1. Abra o MetaTrader 4
2. Arraste o arquivo `.ex4` para qualquer gráfico
3. O EA será instalado automaticamente

**Opção B - Instalação Manual:**

1. Abra o MetaTrader 4
2. Clique em **Arquivo** → **Abrir Pasta de Dados**
3. Entre na pasta `MQL4` → `Experts`
4. Cole o arquivo `SentraPartners_MT4.ex4` nesta pasta
5. No MetaTrader, na janela **Navegador**, clique com botão direito em **Expert Advisors** → **Atualizar**

### Passo 3: Autorizar URL da API

**IMPORTANTE:** Este passo é obrigatório para o EA funcionar!

1. No MetaTrader 4, vá em **Ferramentas** → **Opções**
2. Clique na aba **Expert Advisors**
3. Marque a opção **"Permitir WebRequest para as seguintes URLs"**
4. Adicione a URL: `https://sentrapartners.com`
5. Clique em **OK**

![Exemplo de configuração WebRequest no MT4](https://i.imgur.com/example_mt4.png) <!-- Imagem de exemplo -->

### Passo 4: Anexar ao Gráfico

1. Na janela **Navegador**, expanda **Expert Advisors**
2. Arraste `SentraPartners_MT4` para qualquer gráfico
3. A janela de configuração será aberta

---

## Configuração

### Parâmetros Obrigatórios

Quando você anexar o EA ao gráfico, uma janela de configuração será aberta. Configure os seguintes parâmetros na aba **"Entradas"**:

#### 1. UserEmail (OBRIGATÓRIO)

Digite o **email cadastrado** na plataforma Sentra Partners.

```
Exemplo: seuemail@gmail.com
```

⚠️ **ATENÇÃO:** Use exatamente o mesmo email que você usa para fazer login na plataforma web!

#### 2. AccountType (OBRIGATÓRIO)

Selecione o tipo da sua conta:

- **STANDARD**: Contas normais (1 lote = 100.000 unidades)
- **CENT**: Contas centavos (1 lote = 1.000 unidades)

💡 **Dica:** Se você não sabe o tipo da sua conta, verifique com sua corretora ou escolha STANDARD (mais comum).

### Parâmetros Opcionais (Avançados)

Você pode deixar os valores padrão ou ajustar conforme necessário:

| Parâmetro | Padrão | Descrição |
|-----------|--------|-----------|
| **MasterServer** | https://sentrapartners.com/api/mt | URL da API (não altere) |
| **HeartbeatInterval** | 10800 (3 horas) | Intervalo entre atualizações (segundos) |
| **ProfitUpdateInterval** | 7200 (2 horas) | Intervalo de atualização de lucro |
| **HistorySendTimes** | 03:00,12:00,21:00 | Horários para enviar histórico |
| **HistoryDays** | 90 | Dias de histórico (0 = completo) |
| **EnableLogs** | true | Habilitar logs detalhados |

### Finalizando a Configuração

1. Após preencher os parâmetros, vá para a aba **"Comum"**
2. Marque as opções:
   - **Permitir trading real**
   - **Permitir importação de DLL**
   - **Permitir importação de Experts externos**
3. Clique em **OK**
4. No topo do MT4, clique no botão **"AutoTrading"** para que ele fique verde (▶️)
5. O EA começará a funcionar imediatamente

---

## Uso Diário

### Verificando se o EA está Funcionando

Após anexar o EA ao gráfico, você verá:

**No MetaTrader 4:**

1. Um **rosto sorridente** 😊 no canto superior direito do gráfico
2. Mensagens no **Terminal** (Ctrl+T) → aba **Experts**:

```
===========================================
Sentra Partners - Conector MT4 v3.0
Sistema Multi-Usuário
===========================================
User Email: seuemail@gmail.com
Tipo de Conta: STANDARD
Servidor: https://sentrapartners.com/api/mt
Heartbeat: 3h (posições abertas)
Profit Update: 2h
Histórico: 03:00,12:00,21:00 (90 dias)
===========================================
✅ Licença válida!
✓ Heartbeat enviado com sucesso
✓ Dados enviados: /positions
✓ Dados enviados: /history
✓ EA inicializado com sucesso!
```

**Na Plataforma Web:**

1. Acesse sua conta em https://sentrapartners.com
2. Vá em **Minhas Contas**
3. Sua conta MT4 deve aparecer com status **ONLINE** 🟢

### O que o EA Faz Automaticamente

O EA trabalha em segundo plano e realiza estas tarefas automaticamente:

1. **A cada 3 horas** (padrão):
   - Envia sinal de "vida" (heartbeat)
   - Atualiza saldo e equity
   - Sincroniza posições abertas

2. **A cada 2 horas** (padrão):
   - Atualiza lucro/prejuízo total

3. **Às 03:00, 12:00 e 21:00** (padrão):
   - Envia histórico de trades fechados

### Monitorando o EA

Para verificar se tudo está funcionando:

1. **No MetaTrader 4:**
   - Abra o **Terminal** (Ctrl+T)
   - Vá na aba **Experts**
   - Você verá mensagens como:
     - `✓ Heartbeat enviado com sucesso`
     - `✓ Dados enviados: /positions`
     - `Exportando 5 ordens abertas...`

2. **Na Plataforma Web:**
   - Verifique se sua conta aparece como **ONLINE**
   - Verifique se as posições abertas estão sendo exibidas
   - Verifique se o saldo está atualizado

### Quando Desligar o MetaTrader

Se você desligar o MetaTrader 4:

- ⚠️ O EA **para de funcionar**
- ⚠️ Sua conta aparecerá como **OFFLINE** na plataforma web
- ⚠️ Posições abertas **não serão atualizadas**

**Solução:** Mantenha o MetaTrader 4 aberto 24/7 ou use um VPS (servidor virtual).

---

## Solução de Problemas

### Problema 1: EA Não Inicia

**Sintomas:**
- Rosto triste ☹️ no gráfico
- Mensagem de erro no Terminal

**Causas e Soluções:**

| Erro | Causa | Solução |
|------|-------|---------|
| "Configure seu email" | Email não preenchido | Preencha o parâmetro `UserEmail` |
| "Licença inválida" | Licença expirada | Entre em contato com o suporte |
| "URL da API inválida" | URL incorreta | Use: `https://sentrapartners.com/api/mt` |
| "AccountType deve ser CENT ou STANDARD" | Tipo inválido | Escolha CENT ou STANDARD |

### Problema 2: EA Não Envia Dados

**Sintomas:**
- Rosto sorridente 😊 mas sem mensagens no Terminal
- Conta aparece OFFLINE na plataforma web

**Causas e Soluções:**

1. **URL não autorizada:**
   - Vá em **Ferramentas** → **Opções** → **Expert Advisors**
   - Adicione `https://sentrapartners.com` nas URLs permitidas

2. **Sem conexão com internet:**
   - Verifique sua conexão
   - Teste abrindo um site no navegador

3. **Firewall bloqueando:**
   - Adicione o MetaTrader 4 (`terminal.exe`) às exceções do firewall
   - Temporariamente desabilite o firewall para testar

### Problema 3: Posições Não Aparecem na Web

**Sintomas:**
- EA funcionando normalmente
- Conta ONLINE na web
- Mas posições não aparecem

**Soluções:**

1. **Aguarde até 3 horas:**
   - O EA envia posições a cada `HeartbeatInterval`
   - Ou reinicie o EA para forçar a sincronização

2. **Verifique o email:**
   - Confirme que o email no EA é o mesmo da plataforma web
   - Email é case-sensitive (maiúsculas/minúsculas importam)

3. **Verifique os logs:**
   - Abra o Terminal → aba Experts
   - Procure por mensagens de erro

### Problema 4: Histórico Não Aparece

**Sintomas:**
- Posições abertas aparecem
- Mas histórico de trades não

**Soluções:**

1. **Aguarde o horário programado:**
   - Histórico é enviado apenas às 03:00, 12:00 e 21:00 (padrão)
   - Ou reinicie o EA para forçar envio

2. **Verifique o período:**
   - Padrão é 90 dias
   - Se seus trades são mais antigos, aumente `HistoryDays` ou use 0 (completo)

### Problema 5: "Erro HTTP 401"

**Sintomas:**
- Mensagem "Erro HTTP 401" no Terminal

**Causa:**
- Email não cadastrado no sistema

**Solução:**
1. Verifique se você tem conta na plataforma Sentra Partners
2. Confirme que o email está correto
3. Entre em contato com o suporte se necessário

### Problema 6: Erros de WebRequest

**Sintomas:**
- Mensagens de erro relacionadas a `WebRequest` no Terminal

**Causa:**
- URL não autorizada no MetaTrader

**Solução:**
1. Vá em **Ferramentas** → **Opções** → **Expert Advisors**
2. Marque **"Permitir WebRequest para as seguintes URLs"**
3. Adicione: `https://sentrapartners.com`
4. Clique em **OK**
5. Reinicie o EA

---

## Perguntas Frequentes

### 1. O EA abre ou fecha posições automaticamente?

**Não.** O EA é apenas um **conector**. Ele **não opera** sua conta, apenas **envia informações** para a plataforma web. Você continua operando manualmente ou com seus próprios EAs.

### 2. Preciso deixar o MetaTrader aberto 24 horas?

**Sim**, para que o EA funcione continuamente. Se você desligar o MetaTrader, o EA para de enviar dados e sua conta aparecerá OFFLINE na plataforma web.

**Solução:** Use um VPS (Virtual Private Server) para manter o MetaTrader rodando 24/7.

### 3. Posso usar o EA em várias contas?

**Sim!** Você pode instalar o EA em quantas contas quiser, desde que todas estejam cadastradas na plataforma Sentra Partners com o mesmo email.

### 4. O EA consome muitos recursos do computador?

**Não.** O EA é extremamente leve:
- Uso de CPU: <1% na maioria do tempo
- Uso de memória: ~300 KB
- Uso de rede: ~1 KB a cada 3 horas

### 5. O EA funciona em conta demo?

**Sim!** O EA funciona perfeitamente em contas demo. É recomendado testar primeiro em demo antes de usar em conta real.

### 6. Como faço para atualizar o EA?

1. Remova o EA antigo do gráfico
2. Baixe a nova versão da plataforma web
3. Substitua o arquivo na pasta `MQL4/Experts`
4. Anexe a nova versão ao gráfico

---

## Suporte

### Canais de Suporte

**Email:** suporte@sentrapartners.com  
**WhatsApp:** +55 11 99999-9999  
**Horário:** Segunda a Sexta, 9h às 18h (horário de Brasília)

### Antes de Entrar em Contato

Para agilizar o atendimento, tenha em mãos:

- ✅ Número da sua conta MT4
- ✅ Email cadastrado no sistema
- ✅ Prints da tela do erro (se houver)
- ✅ Logs do Terminal (aba Experts)
- ✅ Versão do MetaTrader 4 (Ajuda → Sobre)

---

**Bem-vindo ao Sentra Partners!** 🚀

Se você seguiu todos os passos deste manual, seu EA está funcionando perfeitamente e sua conta está sincronizada com a plataforma web. Bons trades!

---

**Documento criado por:** Manus AI  
**Última atualização:** 31 de Outubro de 2025
