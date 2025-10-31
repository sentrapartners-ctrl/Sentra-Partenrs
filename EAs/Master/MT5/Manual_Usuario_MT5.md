# Manual do Usuário - Master MT5

**Versão:** 4.0
**Plataforma:** MetaTrader 5
**Finalidade:** Enviar sinais da sua conta para o sistema de copy trading.

---

## Índice

1. [O que é o EA Master?](#o-que-é-o-ea-master)
2. [Requisitos](#requisitos)
3. [Instalação](#instalação)
4. [Configuração](#configuração)
5. [Verificação e Uso](#verificação-e-uso)
6. [Solução de Problemas](#solução-de-problemas)
7. [Perguntas Frequentes (FAQ)](#perguntas-frequentes-faq)

---

## O que é o EA Master?

O **EA Master MT5** é o Expert Advisor que transforma sua conta MetaTrader 5 em uma **conta "Master"** ou **"Provedora de Sinais"** dentro da plataforma Sentra Partners.

Sua função é simples e poderosa: **capturar todas as suas operações (aberturas, fechamentos, modificações) e enviá-las instantaneamente para a nossa plataforma.** A partir daí, as contas "Slave" (seguidoras) poderão copiar suas operações.

### Principais Características

-   **Cópia em Tempo Real:** Envia os sinais em menos de 1 segundo.
-   **Automático:** Uma vez configurado, ele funciona 100% em segundo plano.
-   **Seguro:** O EA apenas envia informações, ele não interfere nas suas operações.
-   **Confiável:** Possui um sistema que garante a entrega dos sinais mesmo com instabilidades na internet.

---

## Requisitos

-   **MetaTrader 5** (qualquer build recente).
-   Uma **conta de trading** que será a provedora dos sinais (pode ser demo ou real).
-   Um **cadastro como Provedor de Sinais** na plataforma Sentra Partners.
-   Conexão estável com a internet (um VPS é altamente recomendado).

---

## Instalação

Siga estes 4 passos para instalar e ativar o EA.

### Passo 1: Baixar o Arquivo

1.  Faça login na sua área de Provedor de Sinais na plataforma Sentra Partners.
2.  Vá até a seção **Downloads**.
3.  Baixe o arquivo `SentraPartners_Master_MT5.ex5`.

### Passo 2: Colocar o EA na Pasta Correta

1.  Abra seu terminal **MetaTrader 5**.
2.  Clique em **Arquivo** no menu superior e depois em **Abrir Pasta de Dados**.
3.  Navegue até a pasta `MQL5` e depois entre em `Experts`.
4.  Copie e cole o arquivo `SentraPartners_Master_MT5.ex5` que você baixou para dentro desta pasta.

### Passo 3: Atualizar e Autorizar

1.  Volte para o MetaTrader 5.
2.  Na janela **Navegador** (se não estiver visível, pressione `Ctrl+N`), clique com o botão direito sobre **Expert Advisors** e selecione **Atualizar**.
3.  Agora, autorize a comunicação com a API (passo crucial):
    -   Vá em **Ferramentas** → **Opções**.
    -   Clique na aba **Expert Advisors**.
    -   Marque a caixa **"Permitir WebRequest para as seguintes URLs"**.
    -   Clique em `Adicionar novo` e insira a URL: `https://sentrapartners.com`
    -   Clique em **OK**.

### Passo 4: Anexar ao Gráfico

1.  Na janela **Navegador**, você verá o `SentraPartners_Master_MT5`.
2.  **Clique e arraste** o EA para **um único gráfico** de qualquer ativo (ex: EURUSD, M5).
3.  A janela de configurações do EA irá aparecer.

---

## Configuração

Na janela de configurações, vá para a aba **"Entradas"**. Você só precisa configurar um parâmetro principal.

### Parâmetros de Entrada

| Parâmetro | O que fazer? | Exemplo |
| :--- | :--- | :--- |
| **UserEmail** | **OBRIGATÓRIO.** Insira o email que você usa para fazer login como Provedor de Sinais na plataforma Sentra Partners. | `seuemail@provedor.com` |
| `MasterServer` | Não altere. | `https://sentrapartners.com/api/mt/copy` |
| `HeartbeatInterval` | Deixe em `1`. Isso garante a cópia mais rápida possível. | `1` |
| `MaxRetries` | Deixe em `3`. | `3` |
| `EnableLogs` | Deixe em `true` para ver o que o EA está fazendo. | `true` |

Depois de preencher o `UserEmail`:

1.  Vá para a aba **"Comum"**.
2.  Marque a caixa **"Permitir Algo Trading"**.
3.  Clique em **OK**.

Finalmente, certifique-se de que o botão **"Algo Trading"** no topo do seu MetaTrader 5 está **verde (ativado)**.

![Algo Trading Ativado](https://i.imgur.com/example_algo.png) <!-- Imagem de exemplo -->

---

## Verificação e Uso

### Como Saber se Está Funcionando?

1.  **Ícone no Gráfico:** Você verá um **chapéu de formatura azul** no canto superior direito do gráfico, indicando que o EA está ativo.
2.  **Logs no Terminal:**
    -   Abra a janela **Terminal** (`Ctrl+T`).
    -   Vá para a aba **"Experts"**.
    -   Você deverá ver as mensagens de inicialização:
        ```
        ===========================================
        Sentra Partners - Master MT5 v4.0
        Conta: 12345678
        Email: seuemail@provedor.com
        ===========================================
        ✅ Licença válida!
        ✅ Master EA inicializado com sucesso!
        📡 Heartbeat: 1s
        🔄 Max Retries: 3
        ```
3.  **Logs de Operação:** Ao abrir ou fechar uma posição, você verá logs como:
    -   `🔔 Nova posição detectada: 56789`
    -   `✅ OPEN: ...`
    -   `🔔 Posição fechada detectada: 56789`
    -   `✅ CLOSE: ...`
    -   `💓 Heartbeat enviado: 1 posições`

### Uso Diário

-   **Opere Normalmente:** Apenas faça suas operações como de costume. O EA cuidará de todo o processo de envio de sinais automaticamente.
-   **Não Feche o Gráfico:** O EA precisa estar rodando em pelo menos um gráfico para funcionar. Se você fechar o gráfico, o envio de sinais para.
-   **Mantenha o MT5 Aberto:** O MetaTrader 5 e o EA precisam estar rodando 24/7 para garantir que nenhum sinal seja perdido. **O uso de um VPS é essencial para provedores de sinais sérios.**

---

## Solução de Problemas

### Problema: O EA não inicializa (não aparece o chapéu azul ou fica cinza).

-   **Causa 1:** O botão "Algo Trading" está desativado.
    -   **Solução:** Clique no botão **Algo Trading** na barra de ferramentas para ativá-lo (deve ficar verde).
-   **Causa 2:** O `UserEmail` não foi preenchido.
    -   **Solução:** Abra as propriedades do EA (`F7`), preencha o email e clique em OK.
-   **Causa 3:** Licença inválida ou expirada.
    -   **Solução:** Verifique a mensagem na aba "Experts". Contate o suporte da Sentra Partners.

### Problema: Logs mostram "Erro HTTP" ou falha ao enviar.

-   **Causa 1:** A URL da API não foi autorizada.
    -   **Solução:** Refaça o **Passo 3** da instalação, garantindo que `https://sentrapartners.com` está na lista de URLs permitidas no `WebRequest`.
-   **Causa 2:** Problema de conexão com a internet.
    -   **Solução:** Verifique sua conexão. O EA tentará reenviar a mensagem automaticamente algumas vezes.
-   **Causa 3:** O email cadastrado está incorreto.
    -   **Solução:** Verifique se o `UserEmail` nas configurações do EA corresponde exatamente ao seu email de provedor na plataforma.

### Problema: As operações não estão sendo copiadas para os Slaves.

-   **Solução 1:** Verifique os logs do Master EA na aba "Experts". Veja se há mensagens de erro.
-   **Solução 2:** Acesse sua dashboard de provedor na plataforma Sentra Partners. Verifique se sua conta master aparece como **"Online"**.
-   **Solução 3:** Se a conta estiver online e sem erros nos logs, o problema pode estar na configuração do Slave. Contate o suporte.

---

## Perguntas Frequentes (FAQ)

**1. Preciso anexar o EA em todos os gráficos que opero?**

Não. Você só precisa anexar o EA Master em **um único gráfico**. Ele monitora todas as operações da sua conta, independentemente do ativo.

**2. O que acontece se minha internet cair?**

O EA Master foi projetado para ser resiliente. Ele armazenará o sinal que não pôde ser enviado e tentará reenviá-lo assim que a conexão for restabelecida. No entanto, para garantir a melhor performance, uma conexão estável é vital.

**3. O que é um VPS e por que eu preciso de um?**

Um VPS (Virtual Private Server) é um computador remoto que fica ligado 24/7. Ao rodar seu MetaTrader 5 em um VPS, você garante que sua conta Master estará sempre online e enviando sinais, mesmo quando seu computador pessoal estiver desligado.

**4. Posso rodar outros EAs na mesma conta?**

Sim. O EA Master não interfere com outros EAs. Ele simplesmente reportará as operações executadas na conta, seja por você manualmente ou por outro robô.

**5. O EA afeta a performance das minhas operações?**

Não. O EA é extremamente leve e otimizado. Ele usa o evento `OnTradeTransaction`, que só é ativado quando uma operação ocorre, consumindo recursos mínimos e não adicionando latência à sua execução.

**6. Como eu atualizo o EA para uma nova versão?**

1.  Baixe o novo arquivo `.ex5`.
2.  Substitua o arquivo antigo na pasta `MQL5/Experts`.
3.  Reinicie seu MetaTrader 5 ou clique com o botão direito em "Expert Advisors" e "Atualizar". O EA no gráfico será atualizado automaticamente.

---

**Para suporte adicional, contate-nos através da plataforma Sentra Partners.**

**Documento criado por:** Manus AI
**Última atualização:** 31 de Outubro de 2025
