# Guia de Instalação - Sentra Partners Multi-Usuário

## Sistema de Autenticação

O Sentra Partners agora usa autenticação tradicional com **email e senha**. Cada usuário vê apenas suas próprias contas de trading.

### 1. Criar Conta de Usuário

1. Acesse a URL do sistema
2. Clique em "Criar conta"
3. Preencha:
   - **Email**: seu email (será usado para associar contas MT4/MT5)
   - **Senha**: mínimo 6 caracteres
   - **Nome**: opcional
4. Clique em "Criar conta"

### 2. Configurar Conectores MT4/MT5

#### Parâmetros Obrigatórios

Os Expert Advisors (EAs) agora exigem o parâmetro `UserEmail` para associar a conta ao usuário correto:

```mql5
// Parâmetros do EA
input string ServerURL = "https://seu-dominio.com";  // URL do servidor
input string UserEmail = "seu@email.com";             // SEU EMAIL DE CADASTRO
input int HeartbeatInterval = 60;                     // Intervalo de heartbeat em segundos
```

**⚠️ IMPORTANTE:**
- O `UserEmail` **DEVE** ser o mesmo email usado no cadastro
- Se o email não existir no sistema, a conta não será associada
- Cada usuário vê apenas as contas associadas ao seu email

#### Instalação do EA MT5

1. Copie o arquivo `UnifiedAPI_MT5.mq5` para `MQL5/Experts/`
2. Compile o EA no MetaEditor
3. Arraste o EA para o gráfico
4. Configure os parâmetros:
   - **ServerURL**: URL do seu servidor Sentra Partners
   - **UserEmail**: SEU email de cadastro
   - **HeartbeatInterval**: 60 segundos (recomendado)
5. Ative "Allow WebRequest" para a URL do servidor
6. Clique em OK

#### Instalação do EA MT4

1. Copie o arquivo `UnifiedAPI_MT4.mq4` para `MQL4/Experts/`
2. Compile o EA no MetaEditor
3. Arraste o EA para o gráfico
4. Configure os parâmetros:
   - **ServerURL**: URL do seu servidor Sentra Partners
   - **UserEmail**: SEU email de cadastro
   - **HeartbeatInterval**: 60 segundos (recomendado)
5. Ative "Allow WebRequest" para a URL do servidor
6. Clique em OK

### 3. Verificar Conexão

Após instalar o EA:

1. Faça login no sistema com seu email e senha
2. Acesse a página "Contas"
3. Sua conta MT4/MT5 deve aparecer em até 60 segundos
4. Verifique se o status está "Conectado"

### 4. Multi-Usuário - Como Funciona

#### Isolamento de Dados

- Cada usuário vê **apenas suas próprias contas**
- Contas são associadas pelo `UserEmail` do EA
- Zero conflito entre usuários diferentes
- Dados completamente isolados por usuário

#### Exemplo de Uso

**Usuário 1** (trader1@example.com):
- Cadastra-se no sistema
- Instala EA com `UserEmail = "trader1@example.com"`
- Vê apenas suas 3 contas MT5

**Usuário 2** (trader2@example.com):
- Cadastra-se no sistema
- Instala EA com `UserEmail = "trader2@example.com"`
- Vê apenas suas 2 contas MT4

**Resultado**: Cada trader vê apenas suas próprias contas, sem interferência.

### 5. Troubleshooting

#### Conta não aparece no sistema

1. Verifique se o `UserEmail` no EA está correto
2. Confirme que o email existe no sistema (faça login)
3. Verifique os logs do EA (aba "Experts" no MT4/MT5)
4. Confirme que "Allow WebRequest" está ativado

#### Erro "User not found"

- O email configurado no EA não existe no sistema
- Solução: Crie uma conta com esse email primeiro

#### Vendo contas de outros usuários

- Isso **NÃO** deve acontecer
- Cada usuário vê apenas contas associadas ao seu email
- Verifique se está logado com o usuário correto

### 6. Segurança

- Senhas são criptografadas com bcrypt (hash seguro)
- Sessões JWT com expiração de 7 dias
- Cookies HTTP-only para prevenir XSS
- Isolamento total de dados por usuário

### 7. API Endpoints

Os conectores MT4/MT5 usam estes endpoints:

```
POST /api/mt/heartbeat
- Envia status da conta a cada 60 segundos
- Requer: terminal_id, account, user_email

POST /api/mt/positions
- Envia posições abertas
- Requer: X-Terminal-ID header

POST /api/mt/history
- Envia histórico de trades
- Requer: X-Terminal-ID header
```

### 8. Suporte

Para problemas ou dúvidas:

1. Verifique os logs do EA
2. Verifique os logs do servidor
3. Confirme que o email está correto
4. Teste com uma conta demo primeiro

