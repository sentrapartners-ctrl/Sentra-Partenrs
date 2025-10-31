# Guia Rápido do Seguidor - Slave MT5

**Comece a copiar os melhores traders em 3 passos!**

---

## 🎯 O que este robô faz?

Este robô (Expert Advisor) transforma sua conta MetaTrader 5 em uma **Conta Slave (Seguidora)**.

Ele **copia automaticamente as operações** de um trader Master que você escolheu seguir na plataforma Sentra Partners.

-   **É Automático:** Configure uma vez e ele faz todo o trabalho.
-   **É Rápido:** Copia as operações em segundos.
-   **Você no Controle:** Você define o quanto quer arriscar, ajustando o tamanho do lote.

---

## 🚀 Guia de Instalação em 3 Passos

### Passo 1: Instale o Robô

1.  **Baixe** o arquivo `SentraPartners_Slave_MT5.ex5` da sua área de cliente.
2.  Abra o **MetaTrader 5**.
3.  Vá em **Arquivo** > **Abrir Pasta de Dados** > `MQL5` > `Experts`.
4.  **Cole** o arquivo que você baixou nesta pasta.
5.  No MetaTrader, na janela "Navegador", clique com o botão direito em "Expert Advisors" e **Atualize**.

### Passo 2: Autorize a Conexão

1.  No MetaTrader, vá em **Ferramentas** > **Opções**.
2.  Na aba **Expert Advisors**, marque a opção **"Permitir WebRequest para as seguintes URLs"**.
3.  Adicione a URL: `https://sentrapartners.com`
4.  Clique em **OK**.

### Passo 3: Ative no Gráfico

1.  Arraste o robô `SentraPartners_Slave_MT5` do Navegador para **um gráfico qualquer**.
2.  Na janela que abrir, vá para a aba **"Entradas"**.
3.  Preencha os campos mais importantes:
    -   **`UserEmail`**: Seu email de cadastro na Sentra Partners.
    -   **`MasterAccountNumber`**: O número da conta do trader que você quer copiar.
    -   **`LotMultiplier`**: Seu gerenciamento de risco. `1.0` copia o mesmo lote, `0.5` copia metade.
4.  Clique em **OK**.
5.  Certifique-se de que o botão **"Algo Trading"** na barra de ferramentas está **verde**.

**Pronto! Sua conta já está pronta para copiar os sinais!** 🎉

---

## ✅ Como sei que está funcionando?

-   Um **ícone de chapéu azul** aparecerá no canto do gráfico.
-   Na aba **"Experts"** do seu terminal, você verá a mensagem `✅ Slave EA inicializado!`.
-   Quando o Master operar, você verá as ordens sendo abertas na sua conta e logs como `✅ COMPRA aberta...` aparecerão.

---

## 💡 Dica de Ouro: Use um VPS!

Para copiar sinais 24 horas por dia sem perder nenhuma oportunidade, sua conta precisa estar sempre online.

-   **O que é VPS?** É um "computador na nuvem" que fica ligado o tempo todo.
-   **Por que usar?** Para garantir que o robô copie os sinais mesmo se seu computador desligar ou sua internet cair.

**Sem um VPS, se o seu MetaTrader fechar, a cópia de sinais para!**

---

## ❓ Perguntas Rápidas

**Preciso colocar o robô em vários gráficos?**
Não, apenas em **um** gráfico.

**Posso operar nesta conta também?**
Não é recomendado. Deixe a conta exclusivamente para o robô copiar os sinais para evitar conflitos.

**O que acontece se minha internet cair?**
O robô vai se sincronizar com o Master assim que a internet voltar, abrindo e fechando o que for necessário para igualar as posições.

**O que faço se não estiver copiando?**
1.  Verifique se o robô está ativo (chapéu azul no gráfico).
2.  Confirme se a URL `https://sentrapartners.com` está autorizada (Passo 2).
3.  Verifique se o `UserEmail` e o `MasterAccountNumber` estão corretos.
4.  Veja se o Master que você segue está online na plataforma.

---

**Tem mais dúvidas? Fale com nosso suporte!**

**Email:** suporte@sentrapartners.com
**Plataforma:** https://sentrapartners.com

---
