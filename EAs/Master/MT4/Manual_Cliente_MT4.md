# Guia Rápido do Provedor - Master MT4

**Transforme sua conta MT4 em uma fonte de sinais em 3 passos!**

---

## 🎯 O que este robô faz?

Este robô (Expert Advisor) transforma sua conta MetaTrader 4 em uma **Conta Master**.

Ele **envia seus sinais de trading** (compras e vendas) para a nossa plataforma, permitindo que outros traders (os "Slaves") copiem suas operações automaticamente.

-   **É Rápido:** Envia os sinais em cerca de 1 segundo.
-   **É Automático:** Configure uma vez e esqueça.
-   **É Seguro:** Apenas lê e envia suas operações, não as modifica.

---

## 🚀 Guia de Instalação em 3 Passos

### Passo 1: Instale o Robô

1.  **Baixe** o arquivo `SentraPartners_Master_MT4.ex4` da sua área de provedor.
2.  Abra o **MetaTrader 4**.
3.  Vá em **Arquivo** > **Abrir Pasta de Dados** > `MQL4` > `Experts`.
4.  **Cole** o arquivo que você baixou nesta pasta.
5.  No MetaTrader, na janela "Navegador", clique com o botão direito em "Expert Advisors" e **Atualize**.

### Passo 2: Autorize a Conexão

1.  No MetaTrader, vá em **Ferramentas** > **Opções**.
2.  Na aba **Expert Advisors**, marque a opção **"Permitir WebRequest para as seguintes URLs"**.
3.  Adicione a URL: `https://sentrapartners.com`
4.  Clique em **OK**.

### Passo 3: Ative no Gráfico

1.  Arraste o robô `SentraPartners_Master_MT4` do Navegador para **um gráfico qualquer**.
2.  Na janela que abrir, vá para a aba **"Entradas"**.
3.  Preencha o campo **`UserEmail`** com o seu email de provedor.
4.  Clique em **OK**.
5.  Certifique-se de que o botão **"AutoTrading"** na barra de ferramentas está **verde**.

**Pronto! Sua conta já está enviando sinais!** 🎉

---

## ✅ Como sei que está funcionando?

-   Um **rosto sorridente** 😊 aparecerá no canto do gráfico.
-   Na aba **"Experts"** do seu terminal, você verá a mensagem `✅ Master EA inicializado com sucesso!`.
-   Na sua dashboard de provedor na plataforma Sentra Partners, sua conta aparecerá como **Online**.

---

## 💡 Dica de Ouro: Use um VPS!

Para ser um provedor de sinais de sucesso, sua conta precisa estar online 24/7.

-   **O que é VPS?** É um "computador na nuvem" que fica ligado o tempo todo.
-   **Por que usar?** Para garantir que seus sinais sejam enviados mesmo se seu computador desligar ou sua internet cair.

**Sem um VPS, se o seu MetaTrader fechar, o envio de sinais para!**

---

## ❓ Perguntas Rápidas

**Preciso colocar o robô em todos os gráficos?**
Não, apenas em **um** gráfico.

**O robô vai operar por mim?**
Não. Ele apenas **envia** os sinais das operações que **você** faz (manualmente ou com outro robô).

**Minha internet caiu, e agora?**
O sinal pode ser perdido, mas o sistema se corrige em 1 segundo assim que a internet voltar. Para evitar isso, use um VPS.

**O que faço se tiver um problema?**
1.  Verifique a aba "Experts" no seu terminal por mensagens de erro.
2.  Confirme se a URL `https://sentrapartners.com` está autorizada.
3.  Verifique se seu email está correto nas configurações do robô.

---

**Tem mais dúvidas? Fale com nosso suporte!**

**Email:** suporte@sentrapartners.com
**Plataforma:** https://sentrapartners.com

---
