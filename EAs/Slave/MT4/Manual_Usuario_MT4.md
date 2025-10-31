# Manual do Usuário - Slave MT4

**Versão:** 4.02
**Plataforma:** MetaTrader 4
**Finalidade:** Copiar operações de uma conta Master para a sua conta.

---

## Índice

1. [O que é o EA Slave?](#o-que-é-o-ea-slave)
2. [Requisitos](#requisitos)
3. [Instalação](#instalação)
4. [Configuração](#configuração)
5. [Verificação e Uso](#verificação-e-uso)
6. [Solução de Problemas](#solução-de-problemas)
7. [Perguntas Frequentes (FAQ)](#perguntas-frequentes-faq)

---

## O que é o EA Slave?

O **EA Slave MT4** é o Expert Advisor que transforma sua conta MetaTrader 4 em uma **conta "Slave"** ou **"Seguidora"**.

Sua única função é **conectar-se à plataforma Sentra Partners para receber e executar os sinais de trading** enviados por uma conta "Master" que você escolheu seguir.

### Principais Características

-   **Cópia Automática:** Uma vez configurado, ele copia todas as operações do Master sem que você precise fazer nada.
-   **Rápido:** As operações são copiadas em segundos.
-   **Gerenciamento de Risco:** Permite ajustar o tamanho do lote para se adequar ao seu capital.
-   **Sempre Online:** Possui um sistema de "heartbeat" para que sua conta apareça como "Online" na plataforma.

---

## Requisitos

-   **MetaTrader 4** (qualquer build recente, acima de 600).
-   Uma **conta de trading** que seguirá os sinais (pode ser demo ou real).
-   Um **cadastro como seguidor** na plataforma Sentra Partners, com uma assinatura ativa para um provedor de sinais.
-   Conexão estável com a internet (um VPS é altamente recomendado).

---

## Instalação

Siga estes 4 passos para instalar e ativar o EA.

### Passo 1: Baixar o Arquivo

1.  Faça login na sua conta na plataforma Sentra Partners.
2.  Vá até a seção **Downloads**.
3.  Baixe o arquivo `SentraPartners_Slave_MT4.ex4`.

### Passo 2: Colocar o EA na Pasta Correta

1.  Abra seu terminal **MetaTrader 4**.
2.  Clique em **Arquivo** no menu superior e depois em **Abrir Pasta de Dados**.
3.  Navegue até a pasta `MQL4` e depois entre em `Experts`.
4.  Copie e cole o arquivo `SentraPartners_Slave_MT4.ex4` que você baixou para dentro desta pasta.

### Passo 3: Atualizar e Autorizar

1.  Volte para o MetaTrader 4.
2.  Na janela **Navegador** (`Ctrl+N`), clique com o botão direito sobre **Expert Advisors** e selecione **Atualizar**.
3.  Agora, autorize a comunicação com a API (passo crucial):
    -   Vá em **Ferramentas** → **Opções**.
    -   Clique na aba **Expert Advisors**.
    -   Marque a caixa **"Permitir WebRequest para as seguintes URLs"**.
    -   Clique em `Adicionar novo` e insira a URL: `https://sentrapartners.com`
    -   Clique em **OK**.

### Passo 4: Anexar ao Gráfico

1.  Na janela **Navegador**, você verá o `SentraPartners_Slave_MT4`.
2.  **Clique e arraste** o EA para **um único gráfico** de qualquer ativo (ex: EURUSD, M5).
3.  A janela de configurações do EA irá aparecer.

---

## Configuração

Na janela de configurações, vá para a aba **"Entradas"**. Preencha os seguintes parâmetros com atenção.

### Parâmetros Obrigatórios

| Parâmetro | O que fazer? | Exemplo |
| :--- | :--- | :--- |
| **UserEmail** | **OBRIGATÓRIO.** Insira o email que você usa para fazer login na plataforma Sentra Partners. | `meuemail@cliente.com` |
| **MasterAccountNumber** | **OBRIGATÓRIO.** Insira o **número da conta Master** que você deseja copiar. Você encontra esse número na página do provedor na plataforma. | `12345678` |

### Parâmetros de Gerenciamento de Risco

| Parâmetro | O que fazer? | Padrão |
| :--- | :--- | :--- |
| **LotMultiplier** | Define o multiplicador para o lote. `1.0` = copia o mesmo lote do master. `0.5` = copia metade do lote. `2.0` = copia o dobro. | `1.0` |
| **MasterIsCent** | Marque `true` se a conta Master for do tipo "Cent". | `false` |
| **SlaveIsCent** | Marque `true` se a sua conta (Slave) for do tipo "Cent". | `false` |
| **Slippage** | Desvio máximo de preço permitido (em pontos). | `3` |
| **MagicNumber** | Um número único para identificar as ordens abertas por este EA. Não altere se não souber o que está fazendo. | `888888` |

**Atenção:** A configuração de `MasterIsCent` e `SlaveIsCent` é crucial para o cálculo correto do lote. Se uma conta Standard copia de uma Cent (ou vice-versa), o lote é ajustado automaticamente para manter a proporção.

Depois de preencher os parâmetros:

1.  Vá para a aba **"Comum"**.
2.  Marque a caixa **"Permitir trading real"**.
3.  Clique em **OK**.

Finalmente, certifique-se de que o botão **"AutoTrading"** no topo do seu MetaTrader 4 está **verde (ativado)**.

---

## Verificação e Uso

### Como Saber se Está Funcionando?

1.  **Ícone no Gráfico:** Você verá um **rosto sorridente** 😊 no canto superior direito do gráfico.
2.  **Logs no Terminal:**
    -   Abra a janela **Terminal** (`Ctrl+T`) e vá para a aba **"Experts"**.
    -   Você deverá ver as mensagens de inicialização:
        ```
        ===========================================
        Sentra Partners - Slave MT4 v4.02 - COM HEARTBEAT
        ===========================================
        Slave Email: meuemail@cliente.com
        Master Account: 12345678
        ... (outras configurações)
        ===========================================
        ✅ Slave EA inicializado!
        Aguardando sinais do Master...
        ```
3.  **Logs de Cópia:** Quando o Master operar, você verá logs como:
    -   `💓 Heartbeat recebido do Master`
    -   `📊 Master tem 1 posições`
    -   `🔄 Sincronização: Abrindo posição nova do Master: 98765`
    -   `✅ Ordem de COMPRA aberta...`

### Uso Diário

-   **Deixe o EA Rodando:** Uma vez configurado, o EA faz todo o trabalho. Não é necessária nenhuma intervenção.
-   **Não Feche o Gráfico:** O EA precisa estar rodando em um gráfico para funcionar.
-   **Mantenha o MT4 Aberto 24/7:** Para não perder nenhuma operação, seu MetaTrader 4 precisa estar sempre online. **O uso de um VPS é essencial para copiar sinais de forma confiável.**

---

## Solução de Problemas

### Problema: O EA não inicializa (rosto triste ☹️ no gráfico).

-   **Causa 1:** O botão "AutoTrading" está desativado.
    -   **Solução:** Ative o botão **AutoTrading** na barra de ferramentas.
-   **Causa 2:** `UserEmail` ou `MasterAccountNumber` não foram preenchidos.
    -   **Solução:** Abra as propriedades do EA (`F7`) e preencha os campos obrigatórios.
-   **Causa 3:** Licença inválida (assinatura expirada).
    -   **Solução:** Verifique sua assinatura na plataforma Sentra Partners.

### Problema: O EA está rodando, mas não copia nenhuma operação.

-   **Causa 1:** A URL da API não foi autorizada.
    -   **Solução:** Refaça o **Passo 3** da instalação, garantindo que `https://sentrapartners.com` está na lista de URLs permitidas.
-   **Causa 2:** O número da conta Master está incorreto.
    -   **Solução:** Verifique o `MasterAccountNumber` nas configurações do EA.
-   **Causa 3:** O Master não está operando ou o EA Master dele está offline.
    -   **Solução:** Verifique o status do provedor na plataforma Sentra Partners.
-   **Causa 4:** Erro "Símbolo não encontrado" nos logs.
    -   **Solução:** O símbolo que o Master operou (`EURUSD`, por exemplo) não está na sua "Observação de Mercado". Clique com o botão direito na Observação de Mercado > Símbolos, encontre o par e clique em "Mostrar".

### Problema: Logs mostram "Erro HTTP" ou "Erro WebRequest".

-   **Solução:** Quase sempre, isso é causado pela falta de autorização da URL no WebRequest (Passo 3 da instalação). Verifique essa configuração primeiro.

---

## Perguntas Frequentes (FAQ)

**1. Preciso anexar o EA em todos os gráficos que o Master opera?**

Não. Você só precisa anexar o EA Slave em **um único gráfico**. Ele copiará todas as operações do Master, independentemente do ativo.

**2. O que acontece se minha internet cair?**

O EA não conseguirá receber os sinais durante a queda. No entanto, o sistema foi projetado para se **sincronizar automaticamente**. Assim que a conexão for restabelecida, o EA comparará as posições do Master com as suas e abrirá ou fechará o que for necessário para igualar as contas.

**3. O que é um VPS e por que eu preciso de um?**

Um VPS (Virtual Private Server) é um computador remoto que fica ligado 24/7. Ao rodar seu MetaTrader 4 em um VPS, você garante que sua conta Slave estará sempre online e pronta para copiar os sinais, mesmo quando seu computador pessoal estiver desligado.

**4. Posso operar manually na mesma conta?**

**Não é recomendado.** O EA gerencia as posições copiadas. Se você fechar manualmente uma posição que o EA abriu, ele poderá reabri-la na próxima sincronização. Use uma conta dedicada apenas para o copy trading.

---

**Para suporte adicional, contate-nos através da plataforma Sentra Partners.**

**Documento criado por:** Manus AI
**Última atualização:** 31 de Outubro de 2025
